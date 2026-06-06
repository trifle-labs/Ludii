/**
 * @java game/rules/play/moves/nonDecision/effect/FromTo.java (simplified)
 *
 * (move (from <from>) (to <to> [if:<cond>])) — moves a piece from a source
 * site (or region of sites) to each target site matching the to-condition.
 *
 * Common cases handled:
 *   (move (from (handSite Mover)) (to (sites Empty)))
 *   (move (from (handSite Shared)) (to (sites Empty)) copy:True)
 *
 * Java parity (FromTo.eval, lines 160-300 simplified):
 *   1. Resolve from-site(s): locFrom or regionFrom
 *   2. For each from-site, check what's there (skip if empty)
 *   3. Resolve to-sites: locTo or regionTo
 *   4. For each to-site, check moveRule condition (default: true)
 *   5. Emit ActionMove(from, to) [or ActionAdd+SetCount for hand moves]
 *
 * Hand move semantics in the 1:1 path:
 *   - Hand pieces are stored as count at the hand site (state.countAt[handSite]).
 *   - When countAt[handSite] > 0, moves can be generated.
 *   - The move action: ActionAdd(to, what=mover, owner=mover)
 *     + ActionSetCount(handSite, countAt-1) to decrement the hand count.
 *   - If copy:True, do not decrement (Order and Chaos style).
 *
 * @java game/rules/play/moves/nonDecision/effect/FromTo.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import type { BooleanFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { ActionCopy } from "../../../../../../../action/action-copy.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { ActionMoveStacking } from "../../../../../../../action/action-move-stacking.js";
import type { Game1to1 } from "../../../../../../Game1to1.js";

export class FromTo1to1 implements MovesFunction {
  /**
   * From-site evaluator (single site or null to use regionFrom).
   * @java FromTo.locFrom
   */
  private readonly locFrom: IntFunction | null;

  /**
   * From-region evaluator (multiple sites or null to use locFrom).
   * @java FromTo.regionFrom
   */
  private readonly regionFrom: RegionFunction | null;

  /**
   * To-site evaluator (single site or null to use regionTo).
   * @java FromTo.locTo
   */
  private readonly locTo: IntFunction | null;

  /**
   * To-region evaluator (multiple sites or null to use locTo).
   * @java FromTo.regionTo
   */
  private readonly regionTo: RegionFunction | null;

  /**
   * Condition on the to-site. Default: true (any site).
   * @java FromTo.moveRule
   */
  private readonly toCondition: BooleanFunction | null;

  /**
   * If true, copy the piece rather than moving it (count doesn't change).
   * @java FromTo.copy
   */
  private readonly copy: boolean;

  /**
   * @java game/rules/play/moves/nonDecision/effect/FromTo.java — constructor
   */
  /**
   * Optional count: a number of seeds to transfer (non-stacking N-seed move,
   * mancala captures). When set, emits an ActionMove with transferCount=true.
   * @java FromTo.count
   */
  private readonly countFn: IntFunction | null;

  /**
   * Optional capture/apply effect evaluated at the destination site.
   * Compiled from `(to ... (apply if:<cond> <effect>))` or `("HittingCapture" ...)`.
   * When non-null, the effect's moves are evaluated at (to) and their actions are
   * prepended to the main move (Java parity: sideEffect.eval pre-actions in FromTo).
   * @java game/rules/play/moves/nonDecision/effect/FromTo.java — sideEffect field
   */
  private readonly applyEffect: MovesFunction | null;

  /**
   * If true, the move stacks on top of the destination rather than replacing it.
   * Corresponds to `stack:True` in the lud and generates ActionMoveStacking.
   * @java game/rules/play/moves/nonDecision/effect/FromTo.java — stack field
   */
  private readonly stack: boolean;

  public constructor(opts: {
    locFrom?: IntFunction | null;
    regionFrom?: RegionFunction | null;
    locTo?: IntFunction | null;
    regionTo?: RegionFunction | null;
    toCondition?: BooleanFunction | null;
    copy?: boolean;
    countFn?: IntFunction | null;
    applyEffect?: MovesFunction | null;
    stack?: boolean;
  }) {
    this.locFrom = opts.locFrom ?? null;
    this.regionFrom = opts.regionFrom ?? null;
    this.locTo = opts.locTo ?? null;
    this.regionTo = opts.regionTo ?? null;
    this.toCondition = opts.toCondition ?? null;
    this.copy = opts.copy ?? false;
    this.countFn = opts.countFn ?? null;
    this.applyEffect = opts.applyEffect ?? null;
    this.stack = opts.stack ?? false;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/FromTo.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    const state = ctx.state;
    const mover = state.mover;
    const result: Move[] = [];

    // Resolve from-sites.
    const fromSites: number[] = this.regionFrom !== null
      ? this.regionFrom.eval(ctx)
      : [this.locFrom !== null ? this.locFrom.eval(ctx) : -1];

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;

    for (const from of fromSites) {
      if (from < 0) continue;

      // @java FromTo: check what is at from. Skip if empty (what <= 0).
      const game = ctx.game as unknown as Game1to1;
      const boardSize = game.equipment.board.numSites;
      const isHandSite = from >= boardSize;

      let hasContent: boolean;
      let what: number;
      let who: number;

      if (isHandSite) {
        // Hand site: check countAt > 0 or cells[from] > 0.
        const count = state.countAt[from] ?? 0;
        const cell = state.cells[from] ?? 0;
        hasContent = count > 0 || cell > 0;
        // What is at the hand: either whats[from] or cells[from] (owner as component)
        what = state.whatAtSite(from);
        who = cell > 0 ? cell : mover; // owner defaults to mover for hand
        if (what === 0) what = who; // fall back to owner as component
      } else {
        what = state.whatAtSite(from);
        who = state.cells[from] ?? 0;
        hasContent = what > 0 || who > 0;
        // For count-based transfers (mancala sow/BetweenRounds), also check countAt[from].
        // Mancala holes/stores track seeds with countAt, not cells/whats.
        // @java FromTo.java — Java checks context.containerState().count(from) > 0
        if (!hasContent && this.countFn !== null) {
          const cnt = state.countAt[from] ?? 0;
          if (cnt > 0) { hasContent = true; what = mover; who = mover; }
        }
      }

      if (!hasContent) continue;

      ctx._evalFrom = from;

      // Resolve to-sites.
      const toSites: number[] = this.regionTo !== null
        ? this.regionTo.eval(ctx)
        : [this.locTo !== null ? this.locTo.eval(ctx) : -1];

      for (const to of toSites) {
        if (to < 0) continue;

        ctx._evalTo = to;

        // Check to condition.
        if (this.toCondition !== null && !this.toCondition.eval(ctx)) continue;

        // Evaluate apply/capture effect at the destination, if any.
        // @java FromTo.java: sideEffect.eval(context) fires BEFORE the main move action.
        // The effect's moves are evaluated with _evalTo=to so (apply if:("IsEnemyAt" (to)) ...)
        // correctly reads the destination piece. Their actions are prepended to the main move.
        const preActions: Move["actions"][number][] = [];
        if (this.applyEffect !== null) {
          const effectMoves = this.applyEffect.eval(ctx);
          for (const em of effectMoves) {
            for (const a of em.actions) preActions.push(a);
          }
        }

        // Build the move.
        // copy:True (Order and Chaos) → ActionCopy: place at destination but keep source intact.
        // stack:True (Abande-style) → ActionMoveStacking: push onto destination stack.
        // Regular (from hand or board) → ActionMove: move piece, decrement hand count if needed.
        let action;
        if (this.copy) {
          // (move ... copy:True) — duplicate piece, source unchanged.
          // @java FromTo.java: ActionCopy when copy is true.
          action = new ActionCopy(from, to);
        } else if (this.stack) {
          // (move ... stack:True) — move piece onto top of destination stack.
          // @java FromTo.java — stack:True generates ActionMoveStacking (pops from, pushes to).
          action = new ActionMoveStacking(from, to);
        } else if (this.countFn !== null) {
          // (fromTo … count:N) — non-stacking N-seed transfer (mancala capture):
          // decrement source by N, increment dest by N. @java ActionMove(transferCount).
          // count: is evaluated against the consequence context (where (to) is the
          // sow landing site), NOT this move's own destination — restore origTo.
          const savedFrom = ctx._evalFrom, savedTo = ctx._evalTo;
          ctx._evalFrom = origFrom; ctx._evalTo = origTo;
          const n = this.countFn.eval(ctx);
          ctx._evalFrom = savedFrom; ctx._evalTo = savedTo;
          action = new ActionMove({ from, to, count: n, transferCount: true });
        } else {
          // Standard move: ActionMove handles count-based hands correctly.
          // @java ActionMove: decrements countAt if > 1, clears if ≤ 1.
          action = new ActionMove({ from, to });
        }

        // Seed/Shared content has owner 0; the placed owner falls back to the
        // mover (the player performing the move) so the Move stays well-formed.
        // Pre-actions from the apply/capture effect precede the main move action.
        result.push(new Move({
          id: `fromto:${mover}:${from}:${to}`,
          label: `FromTo(${from}→${to})`,
          siteIndices: [from, to],
          mover,
          placedOwner: who >= 1 ? who : mover,
          actions: [...preActions, action],
          decisionIndex: preActions.length,
        }));
      }
    }

    ctx._evalFrom = origFrom;
    ctx._evalTo = origTo;

    return result;
  }
}
