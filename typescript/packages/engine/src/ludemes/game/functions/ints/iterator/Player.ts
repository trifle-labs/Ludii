// @java Core/src/game/functions/ints/iterator/Player.java

import { type LudList } from "@ludii/typescript-language";
import { compileInt, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compilePlayer(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  if (positional[0]) {
    const arg = compileInt(positional[0], env);
    return { eval: (ctx) => arg.eval(ctx) };
  }
  // @java Player.java:31-35: return context.player(); EvalContext.java:34-35
  // defaults the iterator slot to Constants.OFF, not the mover.
  return { eval: (ctx) => ctx.frame.player ?? OFF };
}

register("int", "player", compilePlayer as any);
