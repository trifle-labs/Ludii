// @java Core/src/game/functions/booleans/is/player/IsActive.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsActive(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const playerNode = positional[0];
  if (!playerNode)
    throw new LudemeCompileError("(is Active <player>) needs a player.");
  const player = compileInt(playerNode, env);
  return {
    eval: (ctx) => {
      const roleId = player.eval(ctx);
      // Java rejects nobody/out-of-range, then delegates to context.active().
      // @java IsActive.java:60-65
      return ctx.state.activePlayer(roleId);
    },
  };
}

register("bool", "Active", compileIsActive as any);
