// @java Core/src/game/rules/play/moves/decision/Move.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileMoveLudeme,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { MovesFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileMove(node: LudList, env: CompileEnv): MovesFn {
  return compileMoveLudeme(node, env);
}

register("moves", "move", compileMove as any);
