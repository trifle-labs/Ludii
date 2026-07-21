// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java

/**
 * Filters a list of legal moves to keep only those allowing the maximum
 * number of sub-moves in a turn (e.g. International Draughts).
 *
 * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java
 *
 * Java parity (MaxMoves.eval):
 *   1. Evaluate each candidate move, apply it to a TempContext.
 *   2. Recursively count the total sub-moves reachable (getReplayCount).
 *   3. Keep only moves with the maximum replay-count.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../../move.js";
import type { State } from "../../../../../../../../../../state.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../../../base.js";

/**
 * @java Move.java:499-592 — Move.apply()'s store-gated EndOfTurn flush
 * (the mechanism `getActionsWithConsequences`/`getMoveWithConsequences`
 * exercises via an isolated single-hop simulation). Pure, read-only
 * re-derivation of the (site, level) pairs the flush would materialize,
 * for VALUE-SUMMATION purposes only — mirrors Game.ts's real Step 1b flush
 * (which performs the actual removal for real turn-ending applies) without
 * touching state: groups queued `sitesToRemove` entries by site and assigns
 * ascending levels (0, 1, 2, ...) per repeat — a stacked victim (e.g. a
 * Fenix King occupying 3 levels) queues 3 entries for its site — clamped to
 * the site's current stack depth, mirroring Java's per-site queued-count
 * clamp (`Math.min(queued, stackSize)`).
 *
 * NOTE: intentionally narrow — only meaningful for games using deferred
 * `at:EndOfTurn` stacked captures (Fenix); for any other game `sites` is
 * empty and this returns `[]`.
 */
function flushValueTuples(state: State, sites: readonly number[]): Array<{ site: number; level: number }> {
  if (sites.length === 0) return [];
  const counts = new Map<number, number>();
  for (const site of sites) counts.set(site, (counts.get(site) ?? 0) + 1);
  const tuples: Array<{ site: number; level: number }> = [];
  for (const [site, queued] of counts.entries()) {
    const cap = state.ownedEntries !== undefined ? Math.min(queued, state.stackSize(site)) : queued;
    for (let level = 0; level < cap; level++) {
      tuples.push({ site, level });
    }
  }
  return tuples;
}

/**
 * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java
 *
 * Java parity:
 *   public final class MaxMoves extends Effect
 *   eval(Context): filter to moves with maximum reachable sub-move depth.
 */
export class MaxMoves implements MovesFunction {
  /** The moves to maximise. @java MaxMoves.moves */
  private readonly moves: MovesFunction;

  /**
   * If true, sum piece values of captures instead of counting sub-moves.
   * @java MaxMoves.withValueFn
   */
  private readonly withValueFn: BooleanFunction;

  /** Optional subsequent moves (the `then` clause). */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java MaxMoves(BooleanFunction withValue, Moves moves, Then then)
   *
   * @param withValue   If true, maximise captured-piece value sums.
   * @param moves       Moves to filter.
   * @param thenMoves   Optional subsequent moves applied after this.
   */
  public constructor(
    withValue: BooleanFunction | null | undefined,
    moves: MovesFunction,
    thenMoves?: MovesFunction | null,
  ) {
    this.moves = moves;
    // Raw-literal rule: withValue:True reaches us as a raw boolean.
    this.withValueFn = typeof (withValue as unknown) === "boolean"
      ? { eval: () => withValue as unknown as boolean }
      : withValue ?? { eval: () => false };
    this.thenMoves = thenMoves ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java — eval(Context)
   *
   * Java parity (MaxMoves.eval lines 67-128):
   *   1. Evaluate all candidates.
   *   2. Apply each to a TempContext; call getReplayCount recursively.
   *   3. Keep only those with the maximum count.
   */
  public eval(ctx: Context): Move[] {
    const returnMoves: Move[] = [];
    const movesToEval = this.moves.eval(ctx);
    if (process.env.TRACE_MAXMOVES) console.error("[MaxMoves] in:", movesToEval.map(m => `${m.from()}>${m.to()}`).join(" ") || "(none)");
    const withValue = this.withValueFn.eval(ctx);
    const replayCount: number[] = new Array(movesToEval.length).fill(0);
    const evalledMoves: Move[] = [];

    for (let i = 0; i < movesToEval.length; i++) {
      const m = movesToEval[i]!;
      // @java MaxMoves.java:84-85 — TempContext + game.apply: the FULL apply
      // (consequences, prev stamp, mover advance) so getReplayCount's
      // prev==mover moveAgain check sees the post-move turn state.
      const newCtx = ctx.game.apply(ctx, m) as Context;
      evalledMoves.push(m);

      if (!withValue) {
        replayCount[i] = this._getReplayCount(newCtx, 1, withValue);
      } else {
        // @java MaxMoves.java:91-104 — the OUTER eval sums the PER-LEVEL
        // value cs.value(site, LEVEL, type) over
        // `m.getActionsWithConsequences(context)` — NOT the candidate's raw
        // static actions. getActionsWithConsequences (Move.java:456-476) runs
        // an isolated single-hop simulation whose store-gated flush
        // (Move.java:499-592) materializes any already-queued
        // `sitesToRemove` (deferred at:EndOfTurn captures inherited from
        // earlier hops in THIS turn) into explicit per-level Removes — but
        // ONLY when this candidate's own isolated simulation does NOT itself
        // force a same-mover continuation (containsReplayAction ==
        // "no SetNextPlayer for the mover" == our turningOver, read off
        // newCtx.state.prev/mover post-apply). The flush operates on the
        // POST-applyTo queue, i.e. the pre-existing pending sites MERGED
        // with this move's own newly-queued site(s) — so a terminal hop's
        // own capture is counted TWICE: once via the flush, once via its
        // still-attached raw (non-applied) action. Replica-confirmed
        // against a live JVM probe (Fenix RandomTrial_1 ply 17):
        // validation-results/wave16/fenix-jvm-probe-ply17.log.
        let numCaptureWithValue = 0;
        const ownSites: number[] = [];
        for (const action of m.actions) {
          if (action.actionType() === "Remove") {
            const lvl = (action as { levelTo?: () => number }).levelTo?.() ?? 0;
            const level = lvl >= 0 ? lvl : 0;
            numCaptureWithValue += ctx.state.valueAtLevel(action.to(), level);
            ownSites.push(action.to());
          }
        }
        const newState = newCtx.state as unknown as { mover: number; prev: number };
        const turningOver = newState.prev !== newState.mover;
        const pending = ctx.state.sitesToRemove ?? [];
        if (turningOver && (pending.length > 0 || ownSites.length > 0)) {
          for (const t of flushValueTuples(ctx.state, [...pending, ...ownSites])) {
            numCaptureWithValue += ctx.state.valueAtLevel(t.site, t.level);
          }
        }
        replayCount[i] = this._getReplayCount(newCtx, numCaptureWithValue, withValue);
      }
    }

    // Find the maximum replay count.
    let max = 0;
    for (const c of replayCount) {
      if (c > max) max = c;
    }

    // Keep only moves tied at the maximum.
    for (let i = 0; i < evalledMoves.length; i++) {
      if (replayCount[i] === max) {
        returnMoves.push(evalledMoves[i]!);
      }
    }

    if (process.env.TRACE_MAXMOVES) console.error("[MaxMoves] out:", returnMoves.map(m => `${m.from()}>${m.to()}`).join(" ") || "(none)", "counts:", JSON.stringify(replayCount));
    return returnMoves;
  }

  /**
   * Recursively count the maximum replay depth from a given context.
   *
   * @java MaxMoves.getReplayCount(Context contextCopy, int count, boolean withValue)
   *
   * Java parity (getReplayCount lines 138-186):
   *   - If prev != mover or trial is over: return count.
   *   - Otherwise: generate legal moves, recurse on each, return the max.
   */
  private _getReplayCount(ctx: Context, count: number, withValue: boolean): number {
    // Java: if prev != mover or trial over, stop recursing.
    const state = ctx.state as unknown as { mover: number; prev: number };
    if (process.env.TRACE_REPLAYCOUNT) console.error(`[grc] count=${count} prev=${state.prev} mover=${state.mover}${state.prev !== state.mover ? " STOP" : ""}`);
    if (state.prev !== state.mover) return count;
    if (ctx.trial.over) return count;

    // Java: contextCopy.game().moves(contextCopy)
    // @java MaxMoves.java:143 — contextCopy.game().moves(contextCopy); no
    // empty-list early return: Java falls through to max-of-children (0).
    // A synthetic forced-pass IS a legal move in Java too (it recurses one
    // level deeper through it, same as any other move) — do not special-case
    // it away here, doing so undercounts replay depth for games whose only
    // legal continuation at a given depth is a pass (e.g. Buffa de Baldrac).
    const legalMoves = ctx.game.moves(ctx) as readonly Move[];

    const replayCounts: number[] = new Array(legalMoves.length).fill(0);

    for (let i = 0; i < legalMoves.length; i++) {
      const nm = legalMoves[i]!;
      // @java MaxMoves.java:148-149 — TempContext + game.apply (see above).
      const newCtx = ctx.game.apply(ctx, nm) as Context;

      if (!withValue) {
        replayCounts[i] = this._getReplayCount(newCtx, count + 1, withValue);
      } else {
        // @java getReplayCount (RUNNING BINARY, javap-verified) — the
        // RECURSION reads the TWO-ARG cs.value(site, type) = TOP-of-stack
        // value over `nm.getActionsWithConsequences(contextCopy)`, same
        // isolated-flush mechanism as eval() above (see its comment), just
        // with the level-agnostic TOP-of-stack value channel instead of the
        // per-level one. A stacked victim whose top was pushed valueless
        // scores 0 here. This asymmetry vs the outer per-level read is what
        // ranks Fenix's 47>65 chain (6) above 47>29 (4) — replica-confirmed
        // against a live JVM probe: validation-results/wave16/
        // fenix-jvm-probe-ply17.log.
        let numCaptureWithValue = 0;
        const ownSites: number[] = [];
        for (const action of nm.actions) {
          if (action.actionType() === "Remove") {
            numCaptureWithValue += ctx.state.valueTop(action.to());
            ownSites.push(action.to());
          }
        }
        const newState = newCtx.state as unknown as { mover: number; prev: number };
        const turningOver = newState.prev !== newState.mover;
        const pending = ctx.state.sitesToRemove ?? [];
        if (turningOver && (pending.length > 0 || ownSites.length > 0)) {
          for (const t of flushValueTuples(ctx.state, [...pending, ...ownSites])) {
            numCaptureWithValue += ctx.state.valueTop(t.site);
          }
        }
        replayCounts[i] = this._getReplayCount(newCtx, count + numCaptureWithValue, withValue);
        if (process.env.TRACE_REPLAYCOUNT) console.error(`[grc]  nm=${nm.from()}>${nm.to()} val=${numCaptureWithValue} -> ${replayCounts[i]}`);
      }
    }

    let maxReplay = 0;
    for (const n of replayCounts) {
      if (n > maxReplay) maxReplay = n;
    }
    return maxReplay;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java — canMove(Context)
   *
   * Java parity (MaxMoves.canMove, lines 237-243):
   *   "Don't care about max moves here; as soon as we have at least 1 move,
   *    we know that we can move (even if that one may not be the max move!)"
   *   return moves.canMove(context);
   *
   * Delegates straight to the un-maximized candidate set, deliberately
   * bypassing eval()'s replay-count maximization (which applies every
   * candidate via ctx.game.apply(), each of which may itself trigger
   * Game.computeStalemated() for a Pass — see Game.ts computeStalemated()).
   * Without this override, the inherited default canMove() (eval().length>0)
   * would call THIS class's own eval(), and a computeStalemated() probe run
   * from inside eval()'s recursion would recurse into eval() again without
   * bound (Buffa de Baldrac: RangeError "Maximum call stack size exceeded").
   */
  public canMove(ctx: Context): boolean {
    const inner = this.moves as unknown as { canMove?(c: Context): boolean; eval(c: Context): Move[] };
    if (typeof inner.canMove === "function") return inner.canMove(ctx);
    return inner.eval(ctx).length > 0;
  }

  /** @java MaxMoves.isStatic() → delegates */
  public isStatic(): boolean {
    return (this.moves as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /** @java MaxMoves.toEnglish() */
  public toEnglish(): string {
    return "perform any of the following moves which has the most sub-moves";
  }
}
