// @java Core/src/game/functions/ints/state/Score.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { EvalContext, IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileScore(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  const who = positional[0];
  const pid = who
    ? compileInt(who, env)
    : { eval: (c: EvalContext) => c.mover };
  return { eval: (ctx) => ctx.state.score(pid.eval(ctx)) };
}

register("int", "score", compileScore as any);
