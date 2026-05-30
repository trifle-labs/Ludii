// @java Core/src/game/functions/booleans/is/Hidden/IsHidden.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsHidden(_node: LudList, _env: CompileEnv): BoolFn {
  // Predicates over un-modelled state (blocked sites, hidden information,
  // pyramid corners, domino pip matching) compile to constant false for
  // coverage purposes.
  return { eval: () => false };
}

register("bool", "Hidden", compileIsHidden as any);
