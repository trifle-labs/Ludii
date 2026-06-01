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

/**
 * Parse and compile a `.lud` source string into a `Game1to1`.
 *
 * @param source The `.lud` file contents
 * @returns A `Game1to1` instance ready for start/moves/apply
 */
export function play1to1(source: string): Game1to1 {
  // Step 1–3: Parse, apply options, expand defines.
  const parsed = parseLud(source);
  const resolved = applyOptions(parsed);
  const ast = expandDefines(resolved, [...getBuiltinDefines()]);

  // Step 4: Find the (game ...) node.
  const gameNode = findGameNode(ast);

  // Step 5: Compile to ludeme object tree.
  return compileNode1to1(gameNode);
}

/** Locate the first `(game ...)` form in the AST. */
function findGameNode(root: LudNode): LudList {
  if (isList(root)) {
    if (listHead(root) === "game") return root;
    for (const item of root.items) {
      if (isList(item)) {
        if (listHead(item) === "game") return item;
      }
    }
  }
  throw new Error("play1to1: no (game ...) form found in source.");
}
