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
import { ActionCopy } from "../../../../../../../action/action-copy.js";
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

  /** @java From.type() — explicit (from Cell ...) declaration. */
  private readonly declaredFromType: string | null;
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
    declaredFromType?: string | null;
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
    this.declaredFromType = opts.declaredFromType ?? null;
    this.locTo = opts.locTo;
    this.levelTo = opts.levelTo ?? null;
    this.regionFrom = opts.regionFrom ?? null;
    this.regionTo = opts.regionTo ?? null;
    // Raw-literal trap: lud True/False reach these BooleanFunction slots raw
    // (Pachih's (fromTo ... if:True) threw `this.moveRule.eval is not a
    // function` at ply 0). Wrap with the standard typeof guard.
    const wrapBoolFn = (b: unknown): BooleanFunction | null =>
      typeof b === "boolean" ? ({ eval: () => b } as BooleanFunction) : ((b as BooleanFunction | null) ?? null);
    this.fromCondition = wrapBoolFn(opts.fromCondition);
    this.moveRule = wrapBoolFn(opts.moveRule);
    this.captureRule = wrapBoolFn(opts.captureRule);
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
      let hasSource = this.countFn !== null && !this.stack
        ? ctx.state.count(from) > 0
        : ctx.state.what(from) > 0;
      // Dual-SiteType (@java cs.what(from, type)): a piece on a typed channel
      // (Guerrilla's Cell counters) is a valid source too.
      if (!hasSource) {
        const typed = (ctx.state as unknown as { typedSites?: ReadonlyMap<string, { what: readonly number[]; count: readonly number[] }> }).typedSites;
        if (typed) for (const ch of typed.values()) {
          if ((ch.what[from] ?? 0) > 0 || (ch.count[from] ?? 0) > 0) { hasSource = true; break; }
        }
      }
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
        // @java FromTo copy:True -> ActionCopy: place a copy of the source at
        // `to` and leave `from` intact (Odd's (move (from (sites Hand Shared))
        // (to (sites Empty)) copy:True) — a regular ActionMove vacated the
        // shared hand, so the second placement found an empty source).
        const copyOn = (() => { try { return this.copy.eval(ctx); } catch { return false; } })();
        if (copyOn) {
          actions.push(new ActionCopy(from, to));
          const move = new LudiiMove({
            id: `copy:${mover}:${from}:${to}`,
            label: `Copy(${from}->${to})`,
            siteIndices: [from, to],
            mover,
            placedOwner: mover,
            actions,
            fromSite: from,
            toSite: to,
            fromNonDecisionSite: from,
            toNonDecisionSite: to,
          });
          moves.push(this.thenClause != null ? applyPostStateThen(this.thenClause, ctx, move) : move);
          ctx._evalFrom = origFrom;
          ctx._evalTo = origTo;
          continue;
        }
        if (this.stack) {
          // @java FromTo.java:346-360 — stackingGame||stack with a count is an
          // ActionSubStackMove(numLevel=count): only the TOP `count` levels
          // relocate (Seesaw's (move ... count:("StackSize" (from)) stack:True)
          // records "StackMove numLevel=1"). Without a count the WHOLE stack
          // moves. The countFn must NOT fall into the mancala transferCount
          // path (state.count(from)=0 on plain pieces killed every capture).
          let numLevel: number | undefined;
          if (this.countFn !== null) {
            const savedFrom = ctx._evalFrom;
            const savedTo = ctx._evalTo;
            ctx._evalFrom = from;
            ctx._evalTo = origTo;
            numLevel = this.countFn.eval(ctx);
            ctx._evalFrom = savedFrom;
            ctx._evalTo = savedTo;
          }
          moveAction = new ActionMove({ from, to, stack: true, numLevel });
        } else if (this.countFn !== null) {
          // @java FromTo.java:189-196 — count evaluates with FROM bound
          // (context.setFrom(from) before countFn.eval): Chisolo's
          // count:(count at:(from)) hand-collection read count 0 with the
          // outer (-1) binding and the capture became a silent no-op.
          const savedFrom = ctx._evalFrom;
          const savedTo = ctx._evalTo;
          ctx._evalFrom = from;
          ctx._evalTo = origTo;
          const count = this.countFn.eval(ctx);
          ctx._evalFrom = savedFrom;
          ctx._evalTo = savedTo;
          // @java the count-move places OWNED pieces (cs.setSite who =
          // component owner). A HAND-sourced placement (T'oki's (move (from
          // (handSite Mover)) (to (sites Empty)) count:2)) must stamp the
          // mover's ownership on the pile or (forEach Piece) never iterates
          // it; pit-to-pit sows/transfers keep the neutral-pit model (Hus).
          const boardSites = (ctx.game as unknown as { equipment?: { board?: { numSites?: number } } }).equipment?.board?.numSites ?? Number.MAX_SAFE_INTEGER;
          let seedOwner = 0;
          if (from >= boardSites) {
            const movedWhat = ctx.state.whats[from] ?? 0;
            const label = (ctx.state.componentLabels[movedWhat] ?? "");
            seedOwner = Number(label.match(/(\d+)$/)?.[1] ?? 0) || 0;
          }
          moveAction = seedOwner > 0
            ? new ActionMove({ from, to, count, transferCount: true, seedOwner })
            : new ActionMove({ from, to, count, transferCount: true });
        } else {
          // Dual-SiteType: stamp the declared type so application routes
          // through the typed channel (gated downstream on channel existence).
          const dt = this.declaredFromType;
          moveAction = dt
            ? new ActionMove({ from, to, fromType: dt as never, toType: dt as never })
            : new ActionMove({ from, to });
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
          // @java chainRuleWithAction(..., decision=false)
          for (const a of captureActions) (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
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
