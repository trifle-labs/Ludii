// @java Core/src/game/functions/booleans/is/player/IsEnemy.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsEnemy(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const kind: string = "Enemy";
  const whoNode = positional[0];
  if (!whoNode)
    throw new LudemeCompileError(`(is ${kind} <who>) needs a who.`);
  const who = compileInt(whoNode, env);
  return {
    eval: (ctx) => {
      const roleId = who.eval(ctx);
      if (roleId === 0) return false;
      // Java treats every player outside the mover's team as an enemy when the
      // game requires teams; TS stores `(set Team ...)` ids in valuePlayer().
      // Without a positive team id, fall back to role != mover.
      // @java IsEnemy.java:62-77
      const moverTeam = ctx.state.valuePlayer(ctx.mover);
      const roleTeam = ctx.state.valuePlayer(roleId);
      if (moverTeam > 0) return roleTeam !== moverTeam;
      return roleId !== ctx.mover;
    },
  };
}

register("bool", "Enemy", compileIsEnemy as any);
