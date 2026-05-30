// @java Core/src/game/functions/booleans/is/integer/IsAnyDie.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsAnyDie(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // (is AnyDie <value>) — some die in play currently shows <value>.
  const valNode = positional[0];
  if (!valNode) return { eval: () => false };
  const valFn = compileInt(valNode, env);
  return {
    eval: (ctx) => {
      const v = valFn.eval(ctx);
      return ctx.state.diceValues.some((d) => d === v);
    },
  };
}

register("bool", "AnyDie", compileIsAnyDie as any);
