// @java Core/src/game/rules/play/moves/nonDecision/effect/PlayCard.java
/**
 * Plays any card in a player's hand to the board at their position.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/PlayCard.java
 */

import type { Context } from "../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import type { Then } from "./Then.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

/** Constants.UNDEFINED = -2, OFF = -1 in Java */
const UNDEFINED = -2;

export class PlayCard implements MovesFunction {
  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/PlayCard.java — constructor
   * @param thenClause Subsequent moves to apply after the card is played
   */
  public constructor(thenClause: Then | null = null) {
    this.thenClause = thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/PlayCard.java — eval(Context)
   *
   * For each container owned by the mover (cid > 0 = hand containers),
   * for each site in that hand, for each level in the stack at that site,
   * emit an ActionMove from that card site to the mover's board position.
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const moves: LudiiMove[] = [];

    // @java PlayCard.java:49-70 — iterate hand containers
    // In the TS port, the Context doesn't expose container metadata directly.
    // We delegate to the state's container info if available, or throw not-yet-wired.
    const stateAny = ctx.state as unknown as {
      containers?: Array<{ owner: number; numSites: number; siteOffset: number }>;
      siteStack?: (site: number) => number[];
    };

    if (!stateAny.containers) {
      throw new Error("not yet wired: PlayCard requires container metadata on State");
    }

    for (let cid = 1; cid < stateAny.containers.length; cid++) {
      const container = stateAny.containers[cid]!;
      // @java PlayCard.java:51 — if (containers[cid].owner() == mover)
      if (container.owner !== mover) continue;

      const siteFrom = container.siteOffset;
      const to = mover - 1; // @java PlayCard.java:57 — to = mover - 1 (board position)

      for (let site = siteFrom; site < container.numSites + siteFrom; site++) {
        // @java PlayCard.java:58 — for each level in the stack
        const stackSize = stateAny.siteStack ? stateAny.siteStack(site).length : 1;
        for (let level = 0; level < stackSize; level++) {
          const actionMove = new ActionMove({ from: site, to });
          const move = new LudiiMove({
            id: `playCard:${mover}:${site}:${level}:${to}`,
            label: `PlayCard(${site}[${level}]→${to})`,
            siteIndices: [site, to],
            mover,
            placedOwner: mover,
            actions: [actionMove],
            fromNonDecisionSite: site,
            toNonDecisionSite: to,
          });
          moves.push(move);
        }
      }
    }

    // @java PlayCard.java:74-75 — then clause
    if (this.thenClause != null) {
      const thenMoves = this.thenClause.eval(ctx);
      return moves.map(m => m.withConsequence(
        thenMoves.flatMap(tm => [...tm.actions]),
        false,
      ));
    }

    return moves;
  }
}
