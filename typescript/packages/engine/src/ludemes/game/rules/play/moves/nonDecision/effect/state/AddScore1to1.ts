// @java game/rules/play/moves/nonDecision/effect/state/AddScore.java
//
// Faithful implementation: (addScore <role> <delta>) emits a Move containing
// ActionSetScore(playerId, delta, add=true) so that the player's score is
// incremented when the move is applied.
//
// Used in Dala, Morris-family games, etc. to track "mills" (lines of 3)
// formed during play, enabling (score Mover) checks for removal gating.
//
// @java game/rules/play/moves/nonDecision/effect/state/AddScore.java

import type { Context } from "../../../../../../../../context.js";
import { Move } from "../../../../../../../../move.js";
import type { Move as IMove } from "../../../../../../../../move.js";
import type { MovesFunction, IntFunction, RoleType } from "../../../../../../../base.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../registry1to1.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isList, type LudList } from "@ludii/typescript-language";
import { ActionSetScore } from "../../../../../../../../action/action-set-score.js";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../../../compiler1to1.js";
import type { Game1to1 } from "../../../../../../../Game1to1.js";

/**
 * (addScore <role> <scoreInt>) — add delta to a player's score as a move effect.
 *
 * Emits a Move with ActionSetScore(player, delta, add=true) so the score is
 * incremented when the move is applied to the game state.
 *
 * @java game/rules/play/moves/nonDecision/effect/state/AddScore.java
 */
export class AddScore1to1 implements MovesFunction {
  private readonly role: RoleType | "All" | "Each";
  private readonly deltaFn: IntFunction | null;

  public constructor(role: RoleType | "All" | "Each" = "Mover", deltaFn: IntFunction | null = null) {
    this.role = role;
    this.deltaFn = deltaFn;
  }

  /**
   * @java AddScore.eval(Context):
   *   For each affected player, emit a Move with ActionSetScore(pid, delta, add=true).
   */
  public eval(ctx: Context): IMove[] {
    const mover = ctx.state.mover;
    const numPlayers = ctx.game.numPlayers;
    const delta = this.deltaFn ? this.deltaFn.eval(ctx) : 1;

    const pids: number[] = [];
    const role = this.role.toLowerCase();
    if (role === "mover") {
      pids.push(mover);
    } else if (role === "next") {
      pids.push((mover % numPlayers) + 1);
    } else if (role === "all" || role === "each") {
      for (let p = 1; p <= numPlayers; p++) pids.push(p);
    } else if (role.startsWith("p") && !isNaN(parseInt(role.slice(1), 10))) {
      pids.push(parseInt(role.slice(1), 10));
    } else {
      pids.push(mover);
    }

    const result: IMove[] = [];
    for (const pid of pids) {
      const action = new ActionSetScore({ player: pid, score: delta, add: true });
      const m = new Move({
        id: `addScore:${pid}:${delta}`,
        label: `AddScore`,
        siteIndices: [],
        mover,
        placedOwner: mover,
        actions: [action],
      });
      result.push(m);
    }
    return result;
  }
}

// @java AddScore.java — compile factory: (addScore <role> <delta>)
registerMoves1to1("addscore", (node: LudNode, _env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // positional[0] = role (Mover, Next, P1, ...), positional[1] = delta int-fn
  const roleNode = positional[0];
  let role: RoleType | "All" | "Each" = "Mover";
  if (roleNode && isIdent(roleNode)) {
    role = roleNode.name as RoleType | "All" | "Each";
  }
  const deltaNode = positional[1];
  let deltaFn: IntFunction | null = null;
  if (deltaNode) {
    try { deltaFn = compileInt1to1(deltaNode); } catch { /* default delta=1 */ }
  }
  return new AddScore1to1(role, deltaFn);
});
