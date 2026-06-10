// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/Do.java

/**
 * Applies two moves in order, according to given conditions.
 *
 * @java game/rules/play/moves/nonDecision/effect/requirement/Do.java
 *
 * Java parity (Do.eval):
 *   - If `next` is set: apply prior moves to a TempContext, then generate
 *     next moves from that context; prepend prior actions to each result.
 *   - If `ifAfterwards` is set: filter out moves that don't satisfy the
 *     condition after being applied to a TempContext.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import { Move as LudiiMove } from "../../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../base.js";
import { applyPostStateThen, applyMoveWithThens } from "../Then.js";

/**
 * @java game/rules/play/moves/nonDecision/effect/requirement/Do.java
 *
 * Sequences moves: apply `prior` first, then optionally generate `next` from
 * the resulting state; optionally filter by `ifAfterwards`.
 *
 * Java parity:
 *   public final class Do extends Effect
 *   eval(Context): combines prior/next/ifAfterwards logic.
 */
export class Do implements MovesFunction {
  /** The pre-condition moves. @java Do.prior */
  private readonly prior: MovesFunction;

  /** Moves applied next to the prior moves. @java Do.next (may be null) */
  private readonly next: MovesFunction | null;

  /** Condition checked after moves are applied. @java Do.ifAfterwards (may be null) */
  private readonly ifAfterwards: BooleanFunction | null;

  /** Optional subsequent moves (the `then` clause). */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java Do(Moves prior, Moves next, BooleanFunction ifAfterwards, Then then)
   *
   * @param prior         Moves applied first.
   * @param next          Follow-up moves computed after prior (optional).
   * @param ifAfterwards  Condition that must hold after moves are applied (optional).
   * @param thenMoves     Subsequent moves applied after this (optional).
   */
  public constructor(
    prior: MovesFunction,
    next: MovesFunction | null = null,
    ifAfterwards: BooleanFunction | null = null,
    thenMoves: MovesFunction | null = null,
  ) {
    this.prior = prior;
    this.next = next;
    this.ifAfterwards = ifAfterwards;
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/Do.java — eval(Context)
   *
   * Java parity (Do.eval lines 79-126):
   *   Case A — next != null:
   *     1. Apply all prior moves to a copy of the context.
   *     2. Generate next moves from the updated copy.
   *     3. Prepend the prior actions to each next move.
   *   Case B — ifAfterwards != null:
   *     1. Generate candidates from prior (or from result if next was used).
   *     2. For each candidate, apply it to a TempContext and test ifAfterwards.
   *     3. Keep only passing moves.
   */
  public eval(ctx: Context): Move[] {
    if (process.env.TRACE_DICE) {
      const st = ctx.state as unknown as { diceValues?: readonly number[] };
      console.error(`[Do.eval] dice=${JSON.stringify(st.diceValues)} stack=${new Error().stack?.split("\n")[2]?.trim().slice(0, 90)}`);
    }
    let result: Move[] = [];

    // --- Case A: next is provided -----------------------------------------
    if (this.next != null) {
      const newState = this._applyPriorToContext(ctx);
      const newCtx = new Context(ctx.game, newState, ctx.trial, ctx.rng);
      // @java TempContext copies the whole context — the derived context must keep
      // the board topology scratch (Asalto: do->Hop threw "requires _radials").
      {
        const src = ctx as Context & { _radials?: unknown; _trajectories?: unknown };
        const aug = newCtx as Context & { _radials?: unknown; _trajectories?: unknown };
        aug._radials = src._radials;
        aug._trajectories = src._trajectories;
      }
      const priorMoves = this.prior.eval(ctx);
      const nextMoves = this.next.eval(newCtx);

      // Prepend prior actions to every next move.
      for (const nm of nextMoves) {
        const prependedActions = [
          ...priorMoves.flatMap((pm) => [...pm.actions]),
          ...nm.actions,
        ];
        const merged = new LudiiMove({
          id: nm.id,
          label: nm.label,
          siteIndices: nm.siteIndices as number[],
          mover: nm.mover,
          placedOwner: nm.placedOwner,
          actions: prependedActions,
          then: nm.then as LudiiMove[],
          // @java the inner move's then() list rides along — Do only merges
          // the prior's actions in front; consequences evaluate at apply time.
          deferredThens: nm.deferredThens,
          moveAgain: nm.moveAgain,
          // Prepending the prior's actions shifts the decision action, so pin
          // the decision from/to explicitly (@java the recorded compound move
          // keeps the MOVEMENT's from/to: "Move=[Move:mover=1,from=0,to=17,
          // actions=[SetStateAndUpdateDice..., Move:from=0,to=17,...]]").
          fromSite: nm.fromSite ?? nm.from(),
          toSite: nm.toSite ?? nm.to(),
        });
        result.push(merged);
      }
    }

    // --- Case B: ifAfterwards filtering -----------------------------------
    if (this.ifAfterwards != null) {
      const candidates =
        this.next != null ? result : this.prior.eval(ctx);

      const filtered: Move[] = [];
      for (const m of candidates) {
        if (this._movePassesCond(m, ctx)) {
          filtered.push(m);
        }
      }

      // @java Operator/Effect super(then) — the then consequence applies to every
      // generated move (Asalto's huff: Move 28->29 + Remove 29 in ONE recorded move).
      // Same recipe as If/ForEachPiece: bake the post-state then actions in.
      if (this.thenMoves != null) {
        const thenLike = this._thenLike();
        return filtered.map((m) => applyPostStateThen(thenLike, ctx, m));
      }
      return filtered;
    }

    if (this.thenMoves != null) {
      const thenLike = this._thenLike();
      return result.map((m) => applyPostStateThen(thenLike, ctx, m));
    }
    return result;
  }

  /** The reflection path hands a Then wrapper ({moves()}) or a bare Moves. */
  private _thenLike(): { moves(): { eval(ctx: Context): Move[] } } {
    const t = this.thenMoves as unknown as { moves?: () => { eval(ctx: Context): Move[] } };
    if (t && typeof t.moves === "function") return t as { moves(): { eval(ctx: Context): Move[] } };
    return { moves: () => this.thenMoves as unknown as { eval(ctx: Context): Move[] } };
  }

  /**
   * Apply all prior moves to a copy of the current context state and
   * return the resulting state.
   *
   * @java Do.generateAndApplyPreMoves(Context, Context)
   */
  private _applyPriorToContext(ctx: Context): import("../../../../../../../../state.js").State {
    let state = ctx.state;
    const preMoves = this.prior.eval(ctx);
    for (const m of preMoves) {
      // @java Move.apply — prior moves apply with their then() consequences
      state = applyMoveWithThens(ctx, m, state);
    }
    return state;
  }

  /**
   * Apply the move to a copy of the context and test ifAfterwards.
   *
   * @java Do.movePassesCond(Move m, Context context, boolean includeRepetitionTests)
   */
  private _movePassesCond(m: Move, ctx: Context): boolean {
    // @java Do.eval — ifAfterwards is evaluated in the POST-MOVE context with the move
    // recorded on the trial (so (last To)/(last From) name THIS move) and with the
    // board topology visible (radials/trajectories), mirroring Game.applyInternal.
    // @java Move.apply runs then() consequences in TempContexts too — the
    // ifAfterwards condition must see e.g. the deferred (sow …) board (J'odu).
    const newState = applyMoveWithThens(ctx, m);
    const newTrial = (ctx.trial as unknown as { withMove?: (mv: Move, over: boolean, winner: number) => typeof ctx.trial }).withMove?.(m, false, -1) ?? ctx.trial;
    const newCtx = new Context(ctx.game, newState, newTrial, ctx.rng);
    const src = ctx as Context & { _radials?: unknown; _trajectories?: unknown };
    const aug = newCtx as Context & { _radials?: unknown; _trajectories?: unknown };
    aug._radials = src._radials;
    aug._trajectories = src._trajectories;
    newCtx._evalFrom = m.from();
    newCtx._evalTo = m.to();
    return this.ifAfterwards!.eval(newCtx);
  }

  /**
   * @java Do.prior() — returns the prior moves generator.
   */
  public getPrior(): MovesFunction {
    return this.prior;
  }

  /**
   * @java Do.after() — returns the next moves generator (may be null).
   */
  public getAfter(): MovesFunction | null {
    return this.next;
  }

  /**
   * @java Do.ifAfter() — returns the condition (may be null).
   */
  public getIfAfter(): BooleanFunction | null {
    return this.ifAfterwards;
  }

  /** @java Do.isStatic() → false */
  public isStatic(): boolean {
    return false;
  }

  /** @java Do.toEnglish() */
  public toEnglish(): string {
    return "do prior then next";
  }
}
