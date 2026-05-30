// @java Core/src/game/functions/intArray/players/Players.java

import {
  isIdent,
  type LudList,
} from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compilePlayers(node: LudList, _env: CompileEnv): RegionFn {
  // (players ...) as a region -> a list of player indices. Java:
  // game.functions.region.sites.player (RoleType arg).
  //   * `(players TeamN)` -> only the players assigned to team N via
  //     `(set Team N {...})`, read from per-player team ids (state.valuePlayer,
  //     seeded at start). Setichch's `(is In (mover) (players Team1))` needs
  //     this to route each team onto its own track - without it the arg was
  //     ignored, every mover read as "in Team1", and both teams ran CW.
  //   * any other arg (or none) -> all players 1..numPlayers (prior behaviour).
  const teamArg = node.items[1];
  const teamMatch =
    teamArg && isIdent(teamArg) ? /^Team(\d+)$/.exec(teamArg.name) : null;
  if (teamMatch?.[1]) {
    const teamId = Number(teamMatch[1]);
    return {
      eval: (ctx) => {
        const out: number[] = [];
        const n = ctx.context.game.numPlayers;
        for (let p = 1; p <= n; p += 1) {
          if (ctx.state.valuePlayer(p) === teamId) out.push(p);
        }
        return out;
      },
    };
  }
  return {
    eval: (ctx) =>
      Array.from(
        { length: ctx.context.game.numPlayers },
        (_, i) => i + 1,
      ),
  };
}

register("region", "players", compilePlayers as any);
