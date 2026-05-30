// @java Core/src/game/functions/booleans/is/player/IsFriend.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsFriend(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const kind: string = "Friend";
  const whoNode = positional[0];
  if (!whoNode)
    throw new LudemeCompileError(`(is ${kind} <who>) needs a who.`);
  const who = compileInt(whoNode, env);
  return {
    eval: (ctx) => {
      const roleId = who.eval(ctx);
      // Java uses team membership when teams are required; otherwise a friend is
      // the mover, with the simultaneous/player-count sentinel also friendly.
      // TS stores team ids in valuePlayer() and otherwise has no elimination or
      // team subsystem. @java IsFriend.java:59-70
      const moverTeam = ctx.state.valuePlayer(ctx.mover);
      const roleTeam = ctx.state.valuePlayer(roleId);
      if (moverTeam > 0) return roleTeam === moverTeam;
      return (
        roleId === ctx.mover ||
        ctx.mover === ctx.context.game.numPlayers + 1
      );
    },
  };
}

register("bool", "Friend", compileIsFriend as any);
