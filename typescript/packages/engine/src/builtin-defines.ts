/**
 * Java parity: Compiler/src/compiler/Compiler.java uses Ludii's
 * `Common/res/def/**.def` library as an implicit prelude when expanding
 * `.lud` games. Each `.def` file contains one `(define "Name" body)`
 * macro; games invoke them as `("Name" args…)`.
 *
 * The TS engine ships the same library bundled at build time (see
 * `scripts/build-builtin-defines.mjs`). This module parses the bundled
 * source on first use and hands the resulting entries to
 * `expandDefines` as the `extras` seed.
 */
import { parseLud } from "@ludii/typescript-language";

import { BUILTIN_DEFINES_LUD } from "./builtin-defines-data.js";
import { collectTopLevelDefines } from "./lud-defines.js";

interface DefineEntry {
  readonly name: string;
  readonly body: import("@ludii/typescript-language").LudNode;
}

let cached: readonly DefineEntry[] | undefined;

/**
 * The full set of built-in Ludii defines, parsed lazily on first call.
 * Caller-side defines override built-ins of the same name (matches
 * Java behavior where the user's local defines take precedence).
 */
export function getBuiltinDefines(): readonly DefineEntry[] {
  if (!cached) {
    const ast = parseLud(BUILTIN_DEFINES_LUD);
    cached = collectTopLevelDefines(ast);
  }
  return cached;
}
