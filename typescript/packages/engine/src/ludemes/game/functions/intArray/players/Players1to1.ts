/**
 * Players1to1.ts
 * @java game/functions/intArray/players/Players.java
 * @java game/functions/intArray/players/many/PlayersMany.java
 * @java game/functions/intArray/players/team/PlayersTeam.java
 *
 * (players <TeamN|ManyType> [of:<int>] [If:<bool>])
 * Returns array of player indices matching the given role type.
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch } from "../../../../base.js";
import type { IntArrayFunction, BooleanFunction, IntFunction } from "../../../../base.js";
import { isIdent } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { registerIntArray1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import {
  compileBool1to1,
  compileInt1to1,
  parseArgs1to1,
} from "../../../../../compiler1to1.js";

/** Java parity: team membership via state.valuePlayer() > 0 */
function hasTeams(ctx: Context): boolean {
  for (let p = 1; p <= ctx.game.numPlayers; p++) {
    if (ctx.state.valuePlayer(p) > 0) return true;
  }
  return false;
}

function inTeam(ctx: Context, player: number, team: number): boolean {
  return team > 0 && ctx.state.valuePlayer(player) === team;
}

export class PlayersTeam1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/players/team/PlayersTeam.java — eval(Context) */
  constructor(
    private readonly teamIndex: number,
    private readonly cond: BooleanFunction,
  ) {}

  public eval(ctx: Context & EvalScratch): number[] {
    // @java PlayersTeam.java:55-76
    const out: number[] = [];
    const n = ctx.game.numPlayers;
    const savedPlayer = ctx._evalPlayer;

    if (hasTeams(ctx)) {
      for (let pid = 1; pid < n; pid++) {
        ctx._evalPlayer = pid;
        if (this.cond.eval(ctx) && inTeam(ctx, pid, this.teamIndex)) {
          out.push(pid);
        }
      }
    } else if (n >= this.teamIndex) {
      out.push(this.teamIndex);
    }

    ctx._evalPlayer = savedPlayer;
    return out;
  }
}

export class PlayersMany1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/players/many/PlayersMany.java — eval(Context) */
  constructor(
    private readonly kind: string, // "All" | "Ally" | "Enemy" | "Friend" | "NonMover"
    private readonly ofFn: IntFunction | null,
    private readonly cond: BooleanFunction,
  ) {}

  public eval(ctx: Context & EvalScratch): number[] {
    // @java PlayersMany.java:59-150
    const out: number[] = [];
    const n = ctx.game.numPlayers;
    const savedPlayer = ctx._evalPlayer;
    const of = this.ofFn !== null ? this.ofFn.eval(ctx) : ctx.state.mover;

    // If related player is defined and invalid, return empty
    if (this.ofFn !== null && (of === 0 || of >= n)) {
      ctx._evalPlayer = savedPlayer;
      return out;
    }

    const addIf = (pid: number): void => {
      ctx._evalPlayer = pid;
      if (this.cond.eval(ctx)) out.push(pid);
    };

    const teams = hasTeams(ctx);
    const teamOf = ctx.state.valuePlayer(of);

    switch (this.kind) {
      case "All":
        // Java includes player 0 (PlayersMany.java:75-81)
        for (let pid = 0; pid <= n; pid++) addIf(pid);
        break;
      case "Ally":
        if (teams) {
          for (let pid = 1; pid < n; pid++) {
            if (pid !== of && inTeam(ctx, pid, teamOf)) addIf(pid);
          }
        }
        break;
      case "Enemy":
        if (teams) {
          for (let pid = 1; pid < n; pid++) {
            if (pid !== ctx.state.mover && !inTeam(ctx, pid, teamOf)) addIf(pid);
          }
        } else {
          for (let pid = 1; pid < n; pid++) {
            if (pid !== of) addIf(pid);
          }
        }
        break;
      case "Friend":
        if (teams) {
          for (let pid = 1; pid < n; pid++) {
            if (inTeam(ctx, pid, teamOf)) addIf(pid);
          }
        } else {
          addIf(of);
        }
        break;
      case "NonMover":
        // Java includes player 0 here too (PlayersMany.java:134-141)
        for (let pid = 0; pid <= n; pid++) {
          if (pid !== ctx.state.mover) addIf(pid);
        }
        break;
      default:
        for (let pid = 1; pid <= n; pid++) addIf(pid);
        break;
    }

    ctx._evalPlayer = savedPlayer;
    return out;
  }
}

registerIntArray1to1("players", (node: LudNode, env: Compile1to1Env): IntArrayFunction => {
  const list = node as LudList;
  const { positional, named } = parseArgs1to1(list.items);
  const kindNode = positional[0];
  const kind = (kindNode && isIdent(kindNode)) ? kindNode.name : "All";

  const condNode = named.get("if") ?? named.get("If");
  const cond: BooleanFunction = condNode
    ? compileBool1to1(condNode, env.numPlayers)
    : { eval: (_ctx: Context) => true };

  // Team type: Team1, Team2, etc.
  const teamMatch = /^Team(\d+)$/i.exec(kind);
  if (teamMatch?.[1]) {
    const teamIndex = parseInt(teamMatch[1], 10);
    return new PlayersTeam1to1(teamIndex, cond);
  }

  // ManyType: All, Ally, Enemy, Friend, NonMover
  const ofNode = named.get("of");
  const ofFn: IntFunction | null = ofNode ? compileInt1to1(ofNode) : null;
  return new PlayersMany1to1(kind, ofFn, cond);
});
