// @java Core/src/game/rules/play/moves/nonDecision/effect/Then.java
/**
 * Defines the subsequents of a move, to be applied after the move.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Then.java
 *
 * @remarks This is used to define subsequent moves by the same player in a
 *          turn after a move is made.
 */

import type { Context } from "../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";

export class Then {
  /** @java Then.moves */
  private readonly _moves: MovesFunction;

  /** @java Then.applyAfterAllMoves — whether to apply after all simultaneous moves */
  private readonly applyAfterAllMoves: boolean;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Then.java — constructor
   * @param moves              The moves to apply afterwards.
   * @param applyAfterAllMoves For simultaneous game, apply subsequents after all moves [false].
   */
  public constructor(
    moves: MovesFunction,
    applyAfterAllMoves = false,
  ) {
    this._moves = moves;
    this.applyAfterAllMoves = applyAfterAllMoves;
  }

  /**
   * @java Then.moves()
   * @return Moves in the consequence.
   */
  public moves(): MovesFunction {
    return this._moves;
  }

  /**
   * @java Then.applyAfterAllMoves()
   */
  public getApplyAfterAllMoves(): boolean {
    return this.applyAfterAllMoves;
  }

  /**
   * Evaluate the subsequent moves.
   * @java Then.moves().eval(context)
   */
  public eval(ctx: Context): Move[] {
    return this._moves.eval(ctx);
  }

  public toString(): string {
    return `[Then: ${this._moves}]`;
  }
}

/**
 * Attach a `(then ...)` consequence to a move for APPLY-TIME evaluation.
 *
 * Java semantics: every Moves wrapper with a then adds it to its generated
 * moves' then() list (`m.then().add(then().moves())`), and Move.apply
 * evaluates the list AFTER all the move's actions have applied — including
 * actions appended later by OUTER wrappers (ForEachDie appends ActionUseDie
 * to moves whose inner ForEachSite then is already attached; the consequence
 * `(not (all DiceUsed))` must see the die consumed). An earlier version of
 * this helper baked the consequence at generation time by simulating the
 * post-move state, which evaluated the then BEFORE such outer actions
 * existed (Backgammon bear-off granted a moveAgain after the last die).
 * Game.apply performs the deferred evaluation (see Game.applyDeferredThens).
 *
 * @java game/rules/play/moves/nonDecision/effect/Then.java
 * @java other/move/Move.java — apply() evaluates then() after the actions
 */
export function applyPostStateThen(
  thenLike: unknown,
  _ctx: Context,
  m: Move,
): Move {
  if (thenLike == null) return m;
  const t = thenLike as { eval?(ctx: Context): Move[]; moves?(): { eval(ctx: Context): Move[] } };
  const gen = typeof t.eval === "function"
    ? (t as { eval(c: Context): Move[] })
    : (typeof t.moves === "function" ? t.moves() : null);
  if (gen == null || typeof (gen as { eval?: unknown }).eval !== "function") return m;
  return m.withDeferredThen(gen as { eval(ctx: unknown): Move[] });
}

/** State shape needed by the deferred-then evaluator (structural, engine State). */
type ThenState = Parameters<Move["applyTo"]>[0];

/**
 * Evaluate a move's deferred `(then …)` clauses against its post-action state.
 * @java Core/src/other/move/Move.java:apply — after the move's actions apply,
 * each Moves in then() is evaluated in the post-move context (the move already
 * on the trial) and every generated move is applied in order, recursing into
 * ITS then() list. Shared by Game.apply (the real apply) and by every
 * generation-time SIMULATION that applies a candidate move (Do ifAfterwards,
 * While, MaxMoves, …) — Java's Move.apply runs then() in TempContexts too,
 * so a `(do (move Select … (then (sow …))) ifAfterwards:…)` condition must
 * see the sown board, not just the bare Select.
 */
export function evalDeferredThens(
  ctx: Context,
  postState: ThenState,
  move: Move,
): { state: ThenState; extraActions: import("../../../../../../../action/index.js").Action[]; moveAgain: boolean } {
  let state = postState;
  const extraActions: import("../../../../../../../action/index.js").Action[] = [];
  let again = move.moveAgain;

  const evalThens = (
    m: Move,
    thens: readonly { eval(c: unknown): Move[] }[],
    depth: number,
  ): void => {
    // Backstop against a consequence regenerating itself forever.
    if (depth > 16) return;
    for (const gen of thens) {
      const postTrial = (ctx.trial as unknown as { withMove?: (mv: Move, over: boolean, winner: number) => typeof ctx.trial }).withMove?.(move, false, -1) ?? ctx.trial;
      const postCtx = new (ctx.constructor as new (...a: unknown[]) => Context)(ctx.game, state, postTrial, ctx.rng);
      const src = ctx as Context & { _radials?: unknown; _trajectories?: unknown };
      const aug = postCtx as Context & { _radials?: unknown; _trajectories?: unknown; _thenContextDepth?: number };
      aug._radials = src._radials;
      aug._trajectories = src._trajectories;
      aug._thenContextDepth = depth + 1;
      // @java Move.apply (Core/src/other/move/Move.java:520-522) evaluates each
      // consequent via `consequent.eval(context)` in the SAME context WITHOUT
      // calling setFrom/setTo — so `(from)`/`(to)` inside a `(then …)` read
      // whatever the generating context had bound (e.g. ForEach Piece's origin).
      // A from-less consequence (SetVar, Note, …) reports from()/to() = -1; the
      // old code clobbered _evalFrom to that -1, so `(set Var "From" (from))` in
      // Conflagration's Shakattrition stored From=-1 instead of the piece's cell.
      // The step condition `(!= (var "From") (to))` then failed to exclude the
      // origin, inflating "DestinationGroupSize" and generating phantom singleton
      // steps (P2's contained lone piece looked mobile, so `(no Moves Next)`
      // never fired). Preserve the source binding whenever the move has no real
      // from/to; a move that DOES move a piece still overrides it (unchanged).
      const mFrom = m.from();
      const mTo = m.to();
      postCtx._evalFrom = mFrom >= 0 ? mFrom : (src._evalFrom ?? mFrom);
      postCtx._evalTo = mTo >= 0 ? mTo : (src._evalTo ?? mTo);
      postCtx._evalValue = 0;

      let thenMoves: Move[];
      try {
        thenMoves = gen.eval(postCtx);
      } catch (e) {
        // Java never throws here; a throw means a port gap in the
        // consequence subtree. Surface under LUDII_DEBUG_THEN.
        if (process.env["LUDII_DEBUG_THEN"]) console.error("[then threw]", (globalThis as { __parityGame?: string }).__parityGame ?? "?", "|", (e as Error).stack?.split("\n").slice(0, 3).join(" | "));
        continue;
      }
      if (process.env["TRACE_THEN"]) console.error("[then] depth", depth, "lastTo", m.to(), "gen:", (gen as object)?.constructor?.name, "->", thenMoves.map(t => t.actions.map(a => a.actionType()).join("+") + (t.moveAgain ? "(again)" : "")).join(" | ") || "(none)");
      for (const tm of thenMoves) {
        // @java Move.then() consequences are NOT decision actions — the
        // decision stays the primary move's own action.
        for (const a of tm.actions) (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
        state = tm.applyTo(state, ctx.rng);
        extraActions.push(...tm.actions);
        if (tm.moveAgain) again = true;
        if (tm.deferredThens.length > 0) evalThens(tm, tm.deferredThens, depth + 1);
      }
    }
  };
  evalThens(move, move.deferredThens, 0);
  return { state, extraActions, moveAgain: again };
}

/**
 * Apply a move INCLUDING its deferred `(then …)` consequences — the
 * simulation-side equivalent of Java `move.apply(tempContext, false)`.
 * Use this instead of bare `m.applyTo(state)` wherever a candidate move is
 * applied during generation to inspect the resulting position.
 * @java Core/src/other/move/Move.java:apply
 */
export function applyMoveWithThens(ctx: Context, m: Move, base?: ThenState): ThenState {
  const postState = m.applyTo(base ?? ctx.state, ctx.rng);
  if (m.deferredThens.length === 0) return postState;
  return evalDeferredThens(ctx, postState, m).state;
}
