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
import { ActionPass } from "../../../../../../../../action/action-pass.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../base.js";
import { applyPostStateThen, applyMoveWithThens, evalDeferredThens } from "../Then.js";

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
      // @java Do.java:90-93 generateAndApplyPreMoves — prior.eval(context) is
      // called EXACTLY ONCE; the SAME preMoves list both builds the temp
      // context for `next` and prepends onto the result. TS previously
      // evaluated this.prior a second time below, drawing a FRESH random
      // face from ctx.rng for a stochastic prior like (roll): the branch
      // `next` selected (via (count Pips) on draw #1) could diverge from the
      // dice value stamped on the returned move (draw #2) — Sarvatobhadra
      // ply 168 selected the King branch on draw #1 (=6) while stamping st4
      // (draw #2), returning 4 illegal King moves instead of Java's empty
      // list — and every (do (roll) …) consumed twice as much RNG as Java.
      const priorMoves = this.prior.eval(ctx);
      const newState = this._applyPreMovesToContext(ctx, priorMoves);
      const newCtx = new Context(ctx.game, newState, ctx.trial, ctx.rng);
      // @java TempContext copies the whole context — the derived context must keep
      // the board topology scratch (Asalto: do->Hop threw "requires _radials").
      {
        const src = ctx as Context & { _radials?: unknown; _trajectories?: unknown };
        const aug = newCtx as Context & { _radials?: unknown; _trajectories?: unknown };
        aug._radials = src._radials;
        aug._trajectories = src._trajectories;
        // @java TempContext copies the EVAL CONTEXT too (from/to/level/...):
        // ForEachPiece binds (from) before evaluating Do, and `next` reads it
        // (Seesaw's Step: count:("StackSize" (from)) / from:(from) returned
        // -1-bound zeros without the copy).
        for (const k of ["_evalFrom", "_evalTo", "_evalBetween", "_evalLevel", "_evalPlayer", "_evalSite", "_evalValue", "_evalRegion", "_evalHint", "_evalEdge", "_evalFromType", "_evalPips", "_evalTeam", "_evalTrack"]) {
          const v = (src as unknown as Record<string, unknown>)[k];
          if (v !== undefined) (aug as unknown as Record<string, unknown>)[k] = v;
        }
      }
      const nextMoves = this.next.eval(newCtx);
      const priorActions = priorMoves.flatMap((pm) => [...pm.actions]);
      // @java the compound (do prior next:X) has a SINGLE decision — X's. The
      // prior's actions are pre-moves prepended before X, so Java records them
      // WITHOUT the decision flag ((do (add …) next:(move Pass)) shows the Add
      // un-flagged and the Pass with decision=true). The prior `(add …)` here
      // still carried decision=true, so decisionAction() returned the Add ahead
      // of the shifted decisionIndex → the compound reported isPass()=false /
      // from=handSite and the recorded pure-pass never matched (Bide bide move).
      // Clear it so the decision resolves to the `next` move at decisionIndex.
      for (const a of priorActions) {
        if (a.isDecision()) (a as { setDecision(d: boolean): void }).setDecision(false);
      }
      // @java the prior's then() consequents ride along on the compound move
      // too — (do (roll (then (addScore Mover (mapEntry (count Pips)))))
      // next:(move Pass …)) applies roll THEN addScore THEN the pass's thens.
      // Only nm.deferredThens were kept, so the roll-then was dropped and
      // Pasa/Los Escaques never accumulated score (end never fired, ts=-1).
      const priorDeferred = priorMoves.flatMap((pm) => [...pm.deferredThens]);

      // Prepend prior actions to every next move.
      for (const nm of nextMoves) {
        const prependedActions = [
          ...priorActions,
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
          // @java both the prior's AND the inner move's then() lists ride
          // along; the prior's consequents evaluate first (post-apply).
          deferredThens: [...priorDeferred, ...nm.deferredThens],
          moveAgain: nm.moveAgain,
          // Prepending the prior's actions shifts the decision action, so pin
          // the decision from/to explicitly (@java the recorded compound move
          // keeps the MOVEMENT's from/to: "Move=[Move:mover=1,from=0,to=17,
          // actions=[SetStateAndUpdateDice..., Move:from=0,to=17,...]]").
          fromSite: nm.fromSite ?? nm.from(),
          toSite: nm.toSite ?? nm.to(),
          // ...and shift decisionIndex past the prepended prior actions so
          // decisionAction() resolves to the NEXT move's decision (not the
          // prior's first action). Without this, (do … next:(move Pass …))
          // reported isPass()=false — its decision read the prior's SetVar —
          // so (all Passed) never fired (Goats Wintering never terminated).
          decisionIndex: priorActions.length + nm.decisionIndex,
        });
        result.push(merged);
      }

      // @java Do.java:155-176 prependPreMoves — when `next` yields NO legal
      // moves but the game has hand dice (a (roll) ran in `prior`), Java still
      // emits a forced pass with the roll's actions prepended, so the Do's own
      // (then …) evaluates against the LIVE dice (e.g. (if (all DiceEqual)
      // (moveAgain)) / (= 10 ("ThrowValue"))). Without it the bare fallback
      // pass from game.moves() carries no then and the turn advanced wrongly
      // (Siga, Ofanfelling, Zohn Ahl, Nebakuthana, Tasholiwe …).
      const handDice = (ctx.game as unknown as { handDice?: () => unknown[] }).handDice?.() ?? [];
      if (result.length === 0 && handDice.length > 0) {
        result.push(new LudiiMove({
          id: "pass",
          label: "Pass",
          siteIndices: [0],
          mover: ctx.state.mover,
          placedOwner: ctx.state.mover,
          actions: [...priorActions, new ActionPass()],
          // @java Do.java:136-146 — the prior's own (then …) is folded into
          // preM before prependPreMoves reuses it, so the forced pass carries
          // it too. Every other construction path above threads
          // priorDeferred; omitting it here silently dropped the prior's
          // nested consequence (Set Dilth' ply 250: the 3rd-circuit
          // (then (remove …)) never ran, the scored piece stayed on site 22,
          // and TS offered an illegal move where Java records a forced pass).
          deferredThens: [...priorDeferred],
          moveAgain: false,
          decisionIndex: priorActions.length,
        }));
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
   * Apply the (already-evaluated) prior moves to a copy of the current
   * context state and return the resulting state. The caller evaluates
   * `prior` exactly once (@java Do.generateAndApplyPreMoves) — evaluating
   * it here as well double-drew the RNG for stochastic priors.
   *
   * @java Do.generateAndApplyPreMoves(Context, Context)
   */
  private _applyPreMovesToContext(
    ctx: Context,
    preMoves: readonly Move[],
  ): import("../../../../../../../../state.js").State {
    let state = ctx.state;
    for (const m of preMoves) {
      // @java Do.java:141 generateAndApplyPreMoves — m.apply(applyContext,
      // false): preMoves are store=false; must not advance lastMove().
      state = applyMoveWithThens(ctx, m, state, false);
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
    // finalState is IDENTICAL to applyMoveWithThens(ctx, m) — that helper is
    // m.applyTo(ctx.state) then evalDeferredThens(..).state. We inline it only to
    // also capture the deferred-then actions and fold them into the move recorded
    // on the trial via withConsequence. withConsequence keeps fromSite/toSite (so
    // (last To)/(last From) are unchanged) and merely appends the consequence
    // actions, exposing them to (last To afterConsequence:True) / toAfterSubsequents.
    // Without this, Intotoi's (sites From (do (move Select … (then (sow)))
    // ifAfterwards:(is In (PlayFromLastHole …)))) read the Select site, not the
    // final sow landing site, and filtered every candidate. @java Move records its
    // then-consequence actions on the applied move.
    const postState = m.applyTo(ctx.state, ctx.rng);
    let finalState = postState;
    let augmentedMove: Move = m;
    if (m.deferredThens.length > 0) {
      const { state: stateAfterThens, extraActions, moveAgain } = evalDeferredThens(ctx, postState, m);
      finalState = stateAfterThens;
      if (extraActions.length > 0) {
        augmentedMove = m.withConsequence(extraActions, moveAgain);
      }
    }
    let newState = finalState;
    // @java Do.java:276-278 movePassesCond — "DONE TO AVOID ANY REPLAY MOVE
    // (e.g. Bug in Chess found by Wijnand :))": if the simulated state's
    // mover equals its next, reset next to prev before evaluating
    // ifAfterwards. A same-player continuation stamped by a nested
    // (then (moveAgain)) inside THIS candidate's own then-chain (Shantarad's
    // CaptureAndMoveAgain Pending grant) otherwise leaks into NoMoves'
    // `next > 0 ? next : rotational` fallback, which then checks the WRONG
    // player's mobility and wrongly rejects a legal candidate (Shantarad
    // ply 57: TS rejected 11->10 while Java plays it).
    if (newState.mover === newState.next) {
      newState = newState.withNext(newState.prev);
    }
    const newTrial = (ctx.trial as unknown as { withMove?: (mv: Move, over: boolean, winner: number) => typeof ctx.trial }).withMove?.(augmentedMove, false, -1) ?? ctx.trial;
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
