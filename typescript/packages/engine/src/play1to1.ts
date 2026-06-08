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
import { applyOptions } from "./lud-options.js";
import { compileNode1to1 } from "./compiler1to1.js";
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
export function play1to1(source: string, opts?: Play1to1Options): Game1to1 {
  // Step 1–3: Parse, apply options, expand defines.
  const parsed = parseLud(source);
  const resolved = applyOptions(parsed);
  const ast = expandDefines(resolved, [...getBuiltinDefines()]);

  // Step 4: Find the (game ...) node (or resolve a match subgame).
  const gameNode = findGameNode(ast, opts?.resolveSubgame);

  // Step 5: Compile to ludeme object tree.
  // Faithful path: when LUDII_ARGCOMPILER is set, compile via the reflection-driven
  // ArgCompiler (game.Game -> Game1to1 through JAVA_TS_CTORS). Falls back to the
  // compiler1to1 dispatcher on any failure so behaviour never regresses below baseline.
  if (process.env.LUDII_ARGCOMPILER) {
    try {
      argCompiler ??= new ArgCompiler();
      const game = argCompiler.compile<Game1to1>(gameNode, ["game.Game"]);
      if (game != null) return game;
    } catch {
      /* fall through to the dispatcher */
    }
  }
  return compileNode1to1(gameNode);
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
