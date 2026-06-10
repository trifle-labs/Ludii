/**
 * play1to1.ts
 *
 * Entry point for the 1:1 Java→TS port path.
 *
 * Usage:
 *   const game = play1to1(ludSource);
 *   // game implements the Game interface with faithful 1:1 ludeme objects
 *
 * Pipeline:
 *   1. parseLud(source)                → raw LudNode AST
 *   2. applyOptions(ast)               → option-applied AST
 *   3. expandDefines(ast, builtins)    → fully expanded (game ...) node
 *   4. findGameNode(ast)               → the (game ...) LudList
 *   5. compileNode1to1(gameNode)       → Game1to1 (ludeme object tree)
 *
 * This path does NOT call compile.ts or lud-compiler.ts.
 */

import {
  isList,
  isString,
  type LudList,
  type LudNode,
  listHead,
  parseLud,
} from "@ludii/typescript-language";
import { getBuiltinDefines } from "./builtin-defines.js";
import { expandDefines } from "./lud-defines.js";
import { applyOptions, collectDefaultOptions } from "./lud-options.js";
import { expandRanges, expandSiteRanges } from "./lud-ranges.js";
import type { Game1to1 } from "./ludemes/Game1to1.js";
import { ArgCompiler } from "./ludii/compiler/arg/ArgCompiler.js";

/** Lazily-built faithful ArgCompiler (reused across calls; loads reflection once). */
let argCompiler: ArgCompiler | null = null;

/** Options for `play1to1`. */
export interface Play1to1Options {
  /**
   * Called when a `(match ...)` source is encountered instead of a
   * `(game ...)` source. Receives the first subgame name string (e.g.
   * `"GrandTrictracSubgame"`) and should return that subgame's `.lud`
   * source, or `null`/`undefined` if unresolvable.
   *
   * When provided and the resolution succeeds, `play1to1` transparently
   * compiles the resolved subgame instead of the match wrapper.
   */
  resolveSubgame?: (name: string) => string | null | undefined;
}

/**
 * Parse and compile a `.lud` source string into a `Game1to1`.
 *
 * @param source The `.lud` file contents
 * @param opts   Optional resolver for `(match ...)` subgames
 * @returns A `Game1to1` instance ready for start/moves/apply
 */

/**
 * Textually resolve `<Tag:arg>` / `<Tag>` placeholders that appear as a range
 * bound (`N..<Tag:arg>`, `<Tag:arg>..N`, `<Tag:a>..<Tag:b>`) BEFORE the range
 * pre-pass. @java Expander substitutes options into the raw text before
 * expandRanges; only single-token number/ident values can be a range bound.
 */
function resolveRangePlaceholders(source: string): string {
  if (!/\.\.</.test(source) && !/>\.\./.test(source)) return source;
  const opts = collectDefaultOptions(parseLud(source));
  const valueText = new Map<string, string>();
  for (const o of opts) {
    o.args.forEach((argName, i) => {
      const v = o.values[i];
      const tok = v && v.length === 1 ? v[0] : undefined;
      if (!tok) return;
      const text = tok.kind === "number" ? String((tok as { value: number }).value)
        : tok.kind === "ident" ? (tok as { name: string }).name : null;
      if (text === null) return;
      valueText.set(`<${o.tag}:${argName}>`, text);
      if (i === 0) valueText.set(`<${o.tag}>`, text);
    });
  }
  return source.replace(/<\w+(?::\w+)?>/g, (ph, offset: number) => {
    const before = source.slice(Math.max(0, offset - 2), offset);
    const after = source.slice(offset + ph.length, offset + ph.length + 2);
    if (before !== ".." && after !== "..") return ph;
    return valueText.get(ph) ?? ph;
  });
}

export function play1to1(source: string, opts?: Play1to1Options): Game1to1 {
  // Step 0: Java text pre-pass — expand `m..n` number ranges and `"A1".."C3"` site
  // ranges before lexing (@java Expander.expand; the lexer would otherwise produce a
  // single `18..21` ident that can never bind a parameter).
  // Java substitutes option values TEXTUALLY before expanding ranges, so a range
  // bound may be an option placeholder — Mutant Y^3's `{0..<Board:aTri>}`. The
  // lexer mangles `..<` beyond recovery, so resolve single-token placeholder
  // bounds textually here (complex values still go through the AST option pass).
  const preRanged = resolveRangePlaceholders(source);
  // Step 1–3: Parse, apply options, expand defines.
  const parsed = parseLud(expandSiteRanges(expandRanges(preRanged)));
  const resolved = applyOptions(parsed);
  const ast = expandDefines(resolved, [...getBuiltinDefines()]);

  // Step 4: Find the (game ...) node (or resolve a match subgame).
  const gameNode = findGameNode(ast, opts?.resolveSubgame);

  // Step 5: Compile to ludeme object tree.
  // FAITHFUL BY DEFAULT (definition-of-complete item 2, step 1): the reflection-
  // driven ArgCompiler (game.Game -> Game1to1 through JAVA_TS_CTORS) is the engine.
  // LUDII_BESPOKE=1 selects the legacy bespoke dispatcher (the parity harness's
  // reference mode); it and the silent fallback die with the bespoke deletion.
  // LUDII_ARGCOMPILER stays honored for explicit-faithful callers.
  // ITEM-2 DELETION (step 3): the faithful ArgCompiler IS the engine. The bespoke
  // dispatcher (compiler1to1) is deleted; compile failures surface.
  argCompiler ??= new ArgCompiler();
  const game = argCompiler.compile<Game1to1>(gameNode, ["game.Game"]);
  if (game == null) throw new Error("play1to1: faithful compile returned null");
  return game;
}

/**
 * Locate the first `(game ...)` form in the AST.
 *
 * If a `(match ...)` form is found but no `(game ...)`, and a `resolveSubgame`
 * callback is provided, extracts the first `(subgame "Name")` reference,
 * calls the resolver, and compiles the returned source instead.
 * @java GameLoader.java — handles both (game ...) and (match ...) forms
 */
function findGameNode(
  root: LudNode,
  resolveSubgame?: (name: string) => string | null | undefined,
): LudList {
  if (isList(root)) {
    if (listHead(root) === "game") return root;
    for (const item of root.items) {
      if (isList(item)) {
        if (listHead(item) === "game") return item;
      }
    }
    // No (game ...) found — check for (match ...) with a subgame resolver.
    if (resolveSubgame) {
      const subgameName = extractFirstSubgameName(root);
      if (subgameName !== null) {
        const subSrc = resolveSubgame(subgameName);
        if (subSrc != null) {
          // Compile the subgame source recursively (no nested match support needed).
          const subParsed = parseLud(subSrc);
          const subResolved = applyOptions(subParsed);
          const subAst = expandDefines(subResolved, [...getBuiltinDefines()]);
          return findGameNode(subAst);
        }
      }
    }
  }
  throw new Error("play1to1: no (game ...) form found in source.");
}

/**
 * Extract the name string from the first `(subgame "Name" ...)` ludeme found
 * anywhere in the AST. Returns `null` if none is found.
 */
function extractFirstSubgameName(root: LudNode): string | null {
  if (!isList(root)) return null;
  for (const item of root.items) {
    if (isList(item)) {
      if (listHead(item) === "subgame") {
        // First string argument is the subgame name.
        for (const arg of item.items.slice(1)) {
          if (isString(arg)) return arg.value;
        }
      }
      // Recurse into nested lists.
      const nested = extractFirstSubgameName(item);
      if (nested !== null) return nested;
    }
  }
  return null;
}
