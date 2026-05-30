// @java Core/src/game/functions/booleans/is/string/IsDecided.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsDecided(_node: LudList, _env: CompileEnv): BoolFn {
  // (is Decided "<proposition>") — companion of (is Proposed …). No voting
  // state; conservatively false.
  return { eval: () => false };
}

register("bool", "Decided", compileIsDecided as any);
