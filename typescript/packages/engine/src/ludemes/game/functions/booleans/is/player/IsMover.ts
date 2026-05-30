// @java Core/src/game/functions/booleans/is/player/IsMover.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsMover(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const whoNode = positional[0];
  if (!whoNode) return { eval: () => true };
  const who = compileInt(whoNode, env);
  return { eval: (ctx) => who.eval(ctx) === ctx.mover };
}

register("bool", "Mover", compileIsMover as any);
