// @java Core/src/game/rules/play/moves/nonDecision/effect/FromTo.java
/**
 * Moves a piece from one site to another, possibly in another container, with
 * no direction link between the ``from'' and ``to'' sites.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/FromTo.java
 *
 * @remarks Coverage-only transliteration. NOT registered in the 1:1 moves registry.
 *          The live path is handled by FromTo1to1.ts.
 */

import type { Context } from "../../../../../../../context.js";
import type { BooleanFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import { applyPostStateThen, type Then } from "./Then.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

/** OFF constant matching Java's Constants.OFF = -1 */
const OFF = -1;
const UNDEFINED_LEVEL = -2;

export class FromTo implements MovesFunction {
  /** @java FromTo.locFrom */
  private readonly locFrom: IntFunction | null;
  /** @java FromTo.levelFrom */
  private readonly levelFrom: IntFunction | null;
  /** @java FromTo.countFn */
  private readonly countFn: IntFunction | null;
  /** @java FromTo.locTo */
  private readonly locTo: IntFunction;
  /** @java FromTo.levelTo */
  private readonly levelTo: IntFunction | null;
  /** @java FromTo.regionFrom */
  private readonly regionFrom: RegionFunction | null;
  /** @java FromTo.regionTo */
  private readonly regionTo: RegionFunction | null;
  /** @java FromTo.fromCondition */
  private readonly fromCondition: BooleanFunction | null;
  /** @java FromTo.moveRule */
  private readonly moveRule: BooleanFunction | null;
  /** @java FromTo.captureRule */
  private readonly captureRule: BooleanFunction | null;
  /** @java FromTo.captureEffect */
  private readonly captureEffect: MovesFunction | null;
  /** @java FromTo.stack */
  private readonly stack: boolean;
  /** @java FromTo.copy */
  private readonly copy: BooleanFunction;
  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/FromTo.java — constructor
   */
  public constructor(opts: {
    locFrom?: IntFunction | null;
    levelFrom?: IntFunction | null;
    countFn?: IntFunction | null;
    locTo: IntFunction;
    levelTo?: IntFunction | null;
    regionFrom?: RegionFunction | null;
    regionTo?: RegionFunction | null;
    fromCondition?: BooleanFunction | null;
    moveRule?: BooleanFunction | null;
    captureRule?: BooleanFunction | null;
    captureEffect?: MovesFunction | null;
    stack?: boolean;
    copy?: BooleanFunction;
    then?: Then | null;
  }) {
    this.locFrom = opts.locFrom ?? null;
    this.levelFrom = opts.levelFrom ?? null;
    this.countFn = opts.countFn ?? null;
    this.locTo = opts.locTo;
    this.levelTo = opts.levelTo ?? null;
    this.regionFrom = opts.regionFrom ?? null;
    this.regionTo = opts.regionTo ?? null;
    this.fromCondition = opts.fromCondition ?? null;
    this.moveRule = opts.moveRule ?? null;
    this.captureRule = opts.captureRule ?? null;
    this.captureEffect = opts.captureEffect ?? null;
    this.stack = opts.stack ?? false;
    this.copy = opts.copy ?? { eval: () => false };
    this.thenClause = opts.then ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/FromTo.java — eval(Context)
   *
   * Generates moves from each site in the from-region to each site in the to-region,
   * checking conditions and applying capture effects.
   */
  public eval(ctx: Context): Move[] {
    // @java FromTo.java:163 — sitesFrom
    const sitesFrom: number[] = (this.regionFrom != null)
      ? this.regionFrom.eval(ctx)
      : [this.locFrom != null ? this.locFrom.eval(ctx) : ctx._evalFrom];

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;

    const mover = ctx.state.mover;
    const moves: LudiiMove[] = [];

    for (const from of sitesFrom) {
      if (from <= OFF) continue;

      // @java FromTo.java:186-187 — check source occupancy. Mancala captures
      // use count:N on seed pits, which have counts but no component `what`.
      const hasSource = this.countFn !== null
        ? ctx.state.count(from) > 0
        : ctx.state.what(from) > 0;
      if (!hasSource) continue;

      ctx._evalFrom = from;

      if (this.fromCondition != null && !this.fromCondition.eval(ctx)) continue;

      const sitesTo: number[] = (this.regionTo != null)
        ? this.regionTo.eval(ctx)
        : [this.locTo.eval(ctx)];

      ctx._evalFrom = origFrom;

      for (const to of sitesTo) {
        if (to <= OFF) continue;

        ctx._evalFrom = from;
        ctx._evalTo = to;

        // @java FromTo.java:365 — check move rule
        if (this.moveRule != null && !this.moveRule.eval(ctx)) {
          ctx._evalFrom = origFrom;
          continue;
        }
        ctx._evalFrom = origFrom;

        // Build the primary move action
        const actions: import("../../../../../../../action/index.js").Action[] = [];
        let moveAction: ActionMove;
        if (this.countFn !== null) {
          const savedFrom = ctx._evalFrom;
          const savedTo = ctx._evalTo;
          ctx._evalFrom = origFrom;
          ctx._evalTo = origTo;
          const count = this.countFn.eval(ctx);
          ctx._evalFrom = savedFrom;
          ctx._evalTo = savedTo;
          moveAction = new ActionMove({ from, to, count, transferCount: true });
        } else {
          moveAction = new ActionMove({ from, to });
        }
        actions.push(moveAction);

        // @java FromTo.java:406-414 — capture effect if capture rule passes.
        // The recorded Java move orders the VICTIM'S relocation FIRST
        // (Backgammon dec9: Move(25->19) then Move(20->25)): the apply's
        // (from (to)) names the PRE-move occupant. Appending it after the
        // attacker's ActionMove made the hit relocate the ATTACKER off the
        // stack top (P1's piece surfaced on P2's bar). PREPEND.
        if (this.captureEffect != null &&
            (this.captureRule == null || this.captureRule.eval(ctx))) {
          ctx._evalFrom = from;
          ctx._evalTo = to;
          const captureActions = this.captureEffect.eval(ctx).flatMap(m => [...m.actions]);
          actions.unshift(...captureActions);
          ctx._evalFrom = origFrom;
          ctx._evalTo = origTo;
        }

        const move = new LudiiMove({
          id: `fromTo:${mover}:${from}:${to}`,
          label: `FromTo(${from}→${to})`,
          siteIndices: [from, to],
          mover,
          placedOwner: mover,
          actions,
          // Pin the DECISION from/to — a prepended capture action would
          // otherwise shift what from()/to() report (the recorded move keeps
          // the movement's sites: Move:mover=1,from=20,to=25,[victim,attacker]).
          fromSite: from,
          toSite: to,
          fromNonDecisionSite: from,
          toNonDecisionSite: to,
        });
        moves.push(move);
      }
    }

    ctx._evalTo = origTo;
    ctx._evalFrom = origFrom;

    // @java FromTo.java:427 — then clause.
    // Java's Then consequence is evaluated in the POST-MOVE context (Game.applyInternal
    // applies the move's actions, records it on the trial, THEN evaluates `then`), so
    // conditions like (is Line 3) see the just-placed piece. Evaluate per move against
    // a simulated post-state, mirroring Then.java semantics.
    // @java game/rules/play/moves/nonDecision/effect/Then.java — eval in post-move context
    if (this.thenClause != null) {
      return moves.map(m => applyPostStateThen(this.thenClause, ctx, m));
    }

    return moves;
  }

  /** @java FromTo.locFrom() */
  public getLocFrom(): IntFunction | null { return this.locFrom; }
  /** @java FromTo.locTo() */
  public getLocTo(): IntFunction { return this.locTo; }
  /** @java FromTo.regionFrom() */
  public getRegionFrom(): RegionFunction | null { return this.regionFrom; }
  /** @java FromTo.regionTo() */
  public getRegionTo(): RegionFunction | null { return this.regionTo; }
  /** @java FromTo.moveRule() */
  public getMoveRule(): BooleanFunction | null { return this.moveRule; }
}
