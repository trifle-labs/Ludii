// @java Core/src/game/functions/intArray/players/Players.java

import {
  isIdent,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { BoolFn, IntFn, RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

function hasTeams(ctx: Parameters<RegionFn["eval"]>[0]): boolean {
  for (let p = 1; p <= ctx.context.game.numPlayers; p += 1) {
    if (ctx.state.valuePlayer(p) > 0) return true;
  }
  return false;
}

function inTeam(ctx: Parameters<RegionFn["eval"]>[0], player: number, team: number): boolean {
  return team > 0 && ctx.state.valuePlayer(player) === team;
}

export function compilePlayers(node: LudList, env: CompileEnv): RegionFn {
  const first = node.items[1];
  const { named } = parseArgs(node.items.slice(2));
  const condNode = named.get("If") ?? named.get("if");
  const cond: BoolFn = condNode ? compileBool(condNode, env) : { eval: () => true };
  const ofNode = named.get("of");
  const ofFn: IntFn | undefined = ofNode ? compileInt(ofNode, env) : undefined;

  const kind = first && isIdent(first) ? first.name : "All";
  const teamMatch = /^Team(\d+)$/.exec(kind);

  if (teamMatch?.[1]) {
    const teamIndex = Number(teamMatch[1]);
    return {
      eval: (ctx) => {
        const out: number[] = [];
        const n = ctx.context.game.numPlayers;
        // Java PlayersTeam.eval scans assigned team membership when the game
        // requires teams; otherwise TeamN denotes player N if it exists
        // (PlayersTeam.java:53-76).
        if (hasTeams(ctx)) {
          for (let pid = 1; pid <= n; pid += 1) {
            if (
              inTeam(ctx, pid, teamIndex) &&
              cond.eval(ctx.withFrame({ player: pid }))
            ) {
              out.push(pid);
            }
          }
        } else if (teamIndex <= n) {
          out.push(teamIndex);
        }
        return out;
      },
    };
  }

  return {
    eval: (ctx) => {
      const n = ctx.context.game.numPlayers;
      const of = ofFn ? ofFn.eval(ctx) : ctx.state.mover;
      // Java PlayersMany.eval returns empty when an explicit of: is not a real
      // player (PlayersMany.java:66-70).
      if (ofFn && (of === 0 || of > n)) return [];
      const out: number[] = [];
      const addIf = (pid: number): void => {
        if (cond.eval(ctx.withFrame({ player: pid }))) out.push(pid);
      };
      const teams = hasTeams(ctx);
      const teamOf = ctx.state.valuePlayer(of);

      switch (kind) {
        case "All":
          // Java includes the shared player id 0 in the All iteration
          // (PlayersMany.java:75-81).
          for (let pid = 0; pid <= n; pid += 1) addIf(pid);
          break;
        case "Ally":
          if (teams) {
            for (let pid = 1; pid <= n; pid += 1) {
              if (pid !== of && inTeam(ctx, pid, teamOf)) addIf(pid);
            }
          }
          break;
        case "Enemy":
          if (teams) {
            for (let pid = 1; pid <= n; pid += 1) {
              if (pid !== ctx.state.mover && !inTeam(ctx, pid, teamOf)) addIf(pid);
            }
          } else {
            for (let pid = 1; pid <= n; pid += 1) {
              if (pid !== of) addIf(pid);
            }
          }
          break;
        case "Friend":
          if (teams) {
            for (let pid = 1; pid <= n; pid += 1) {
              if (inTeam(ctx, pid, teamOf)) addIf(pid);
            }
          } else {
            addIf(of);
          }
          break;
        case "NonMover":
          // Java includes player 0 here too (PlayersMany.java:134-141).
          for (let pid = 0; pid <= n; pid += 1) {
            if (pid !== ctx.state.mover) addIf(pid);
          }
          break;
        default:
          for (let pid = 1; pid <= n; pid += 1) addIf(pid);
          break;
      }
      return out;
    },
  };
}

register("region", "players", compilePlayers as any);
