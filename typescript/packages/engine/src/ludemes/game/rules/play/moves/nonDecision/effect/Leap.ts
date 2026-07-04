// @java Core/src/game/rules/play/moves/nonDecision/effect/Leap.java
/**
 * Allows a player to leap a piece to sites defined by walks through the board
 * graph. Use this ludeme to make leaping moves to pre-defined destination sites
 * that do not care about intervening pieces, such as knight moves in Chess.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Leap.java
 *
 * @remarks Coverage-only transliteration. NOT registered in the 1:1 moves registry.
 *          The live path is handled by Leap1to1.ts.
 */

import type { Context } from "../../../../../../../context.js";
import type { BooleanFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import { applyPostStateThen, type Then } from "./Then.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

/** OFF = -1 matching Java Constants.OFF */
const OFF = -1;

/**
 * Compass direction enum values from Java's CompassDirection, used for
 * the `forward` check.
 */
type CompassDirection = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

interface TopologyElement {
  row(): number;
  col(): number;
}

export class Leap implements MovesFunction {
  /** @java Leap.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Leap.fromCondition */
  private readonly fromCondition: BooleanFunction | null;

  /** @java Leap.walk — RegionFunction computing the leap destinations */
  private readonly walk: RegionFunction;

  /** @java Leap.forward — restrict to forward-direction leaps only */
  private readonly forward: BooleanFunction;

  /** @java Leap.goRule — condition on landing site */
  private readonly goRule: BooleanFunction;

  /** @java Leap.sideEffect — effect applied on the landing site (e.g. capture) */
  private readonly sideEffect: MovesFunction | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Leap.java — constructor
   *
   * @param startLocationFn  Function evaluating the from-site [(from)]
   * @param fromCondition    Condition on from site (may be null)
   * @param walk             RegionFunction giving leap destinations
   * @param forward          Whether to only allow forward leaps [false]
   * @param goRule           Condition on the landing site
   * @param sideEffect       Effect on landing site (may be null)
   * @param thenClause       Subsequent moves (may be null)
   */
  public constructor(opts: {
    startLocationFn: IntFunction;
    fromCondition?: BooleanFunction | null;
    walk: RegionFunction;
    forward?: BooleanFunction;
    goRule: BooleanFunction;
    sideEffect?: MovesFunction | null;
    then?: Then | null;
  }) {
    this.startLocationFn = opts.startLocationFn;
    this.fromCondition = opts.fromCondition ?? null;
    this.walk = opts.walk;
    this.forward = opts.forward ?? { eval: () => false };
    this.goRule = opts.goRule;
    this.sideEffect = opts.sideEffect ?? null;
    this.thenClause = opts.then ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Leap.java — eval(Context)
   *
   * 1. Resolve from = startLocationFn.eval(context)
   * 2. Set context.from = from
   * 3. Check fromCondition if set
   * 4. Walk = walk.eval(context) gives array of landing sites
   * 5. For each landing site: check goRule, emit ActionMove(from→to) + sideEffect
   */
  public eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from === OFF || from < 0) return [];

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;

    ctx._evalFrom = from;

    // @java Leap.java:135-137 — fromCondition check
    if (this.fromCondition != null && !this.fromCondition.eval(ctx)) {
      ctx._evalFrom = origFrom;
      ctx._evalTo = origTo;
      return [];
    }

    // @java Leap.java:138 — walk.eval(context).sites()
    const sitesAfterWalk = this.walk.eval(ctx);

    const mover = ctx.state.mover;
    const moves: LudiiMove[] = [];

    for (const to of sitesAfterWalk) {
      // @java Leap.java:141-162 — check goRule, build move
      ctx._evalTo = to;

      if (!this.goRule.eval(ctx)) continue;

      const actions: import("../../../../../../../action/index.js").Action[] = [
        new ActionMove({ from, to }),
      ];

      // @java Leap.java:156 — chainRuleWithAction(context, sideEffect,
      // thisAction, /*prepend=*/true, false): the capture effect's actions go
      // BEFORE the leap's ActionMove (recorded knight captures are
      // [Remove, Move] — appending relocated the ATTACKER off the square).
      if (this.sideEffect != null) {
        const sideActions = this.sideEffect.eval(ctx).flatMap(m => [...m.actions]);
        // @java chainRuleWithAction(..., decision=false)
        for (const a of sideActions) (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
        actions.unshift(...sideActions);
      }

      const move = new LudiiMove({
        id: `leap:${mover}:${from}:${to}`,
        label: `Leap(${from}→${to})`,
        siteIndices: [from, to],
        mover,
        placedOwner: mover,
        actions,
        // Prepended capture actions shift actions[0]; pin the decision sites.
        fromSite: from,
        toSite: to,
        fromNonDecisionSite: from,
        toNonDecisionSite: to,
      });
      moves.push(move);
    }

    ctx._evalTo = origTo;
    ctx._evalFrom = origFrom;

    // @java Leap.java:171-173 — then clause. Java evaluates then() in the
    // POST-MOVE context (Move.apply); baking it at generation read a STALE
    // (last To): Hexshogi's Keima 9->21 emitted ActionPromote at the
    // PREVIOUS move's landing square 55 and flipped the enemy king's owner.
    if (this.thenClause != null) {
      return moves.map(m => applyPostStateThen(this.thenClause, ctx, m) as LudiiMove);
    }

    return moves;
  }

  /** @java Leap.startLocationFn() */
  public getStartLocationFn(): IntFunction { return this.startLocationFn; }
  /** @java Leap.walk() */
  public getWalk(): RegionFunction { return this.walk; }
  /** @java Leap.goRule() */
  public getGoRule(): BooleanFunction { return this.goRule; }
}
