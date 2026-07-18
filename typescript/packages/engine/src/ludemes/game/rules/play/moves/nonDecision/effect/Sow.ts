// @java Core/src/game/rules/play/moves/nonDecision/effect/Sow.java

/**
 * Sows counters by removing them from a site then placing them one-by-one at
 * each consecutive site along a track.
 *
 * @java game/rules/play/moves/nonDecision/effect/Sow.java
 *
 * Java: public final class Sow extends Effect
 *   - startLoc: IntFunction — source site (default: lastTo)
 *   - countFn: IntFunction — how many counters to sow (default: count at start)
 *   - numPerHoleFn: IntFunction — counters per hole (default: 1)
 *   - trackName: String | null — which track to use
 *   - ownerFn: IntFunction | null — owner of the track
 *   - includeSelf: boolean — whether to include origin in sowing (default: true)
 *   - origin: BooleanFunction — put a counter in origin first (default: false)
 *   - skipFn: BooleanFunction | null — skip-hole condition
 *   - captureRule: BooleanFunction — condition for capture
 *   - captureEffect: Moves | null — capture effect to apply
 *   - sowEffect: Moves | null — per-hole sow effect
 *   - backtracking: BooleanFunction | null — backward capture
 *   - forward: BooleanFunction | null — forward capture
 *
 * eval() generates a single compound move representing the full sow sequence.
 */

import { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import { ActionSowSeed } from "../../../../../../../action/action-sow-seed.js";
import { LastTo } from "../../../../../functions/ints/last/LastTo.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import { compileFlags } from "../../../../../../../ludii/compiler/compile-flags.js";
import type { ThenLike } from "../../Moves.js";
import { evalDeferredThens } from "./Then.js";
import type { Action } from "../../../../../../../action/index.js";

/** Minimal track element descriptor. @java game/equipment/container/board/Track.java */
interface TrackElem {
  site: number;
  next: number;
  nextIndex: number;
  prev: number;
  prevIndex: number;
}

/** Minimal track descriptor. @java game/equipment/container/board/Track.java */
interface Track {
  name(): string;
  owner(): number;
  islooped(): boolean;
  elems(): TrackElem[];
}

function boardTracks(ctx: Context): Track[] {
  const ctxAny = ctx as unknown as { _tracks?: Track[] };
  if (Array.isArray(ctxAny._tracks)) return ctxAny._tracks;
  const gameAny = ctx.game as unknown as {
    board?: () => { tracks?: () => Track[]; getTracks?: () => readonly Track[] };
    equipment?: { board?: { tracks?: () => Track[]; getTracks?: () => readonly Track[] } };
  };
  const board = gameAny.board?.() ?? gameAny.equipment?.board;
  if (typeof board?.tracks === "function") return board.tracks();
  if (typeof board?.getTracks === "function") return [...board.getTracks()];
  return [];
}

function tempContext(ctx: Context, state = ctx.state, from = ctx._evalFrom, to = ctx._evalTo): Context {
  const next = new Context(ctx.game, state, ctx.trial, ctx.rng);
  const src = ctx as unknown as { _radials?: unknown; _trajectories?: unknown; _tracks?: Track[] };
  const dst = next as unknown as { _radials?: unknown; _trajectories?: unknown; _tracks?: Track[] };
  next._evalFrom = from;
  next._evalTo = to;
  next._evalValue = ctx._evalValue;
  next._evalSite = ctx._evalSite;
  next._evalBetween = ctx._evalBetween;
  next._evalPlayer = ctx._evalPlayer;
  dst._radials = src._radials;
  dst._trajectories = src._trajectories;
  dst._tracks = src._tracks;
  return next;
}

function applyActions(ctx: Context, actions: readonly Action[]) {
  let state = ctx.state;
  for (const action of actions) state = action.apply(state, ctx.rng);
  return state;
}

/**
 * Sow effect — mancala-style sowing along a track.
 *
 * @java game/rules/play/moves/nonDecision/effect/Sow.java
 */
export class Sow extends Effect {
  /** @java Sow.startLoc */
  private readonly startLoc: IntFunction | null;
  /** @java Sow.countFn */
  private readonly countFn: IntFunction | null;
  /** @java Sow.numPerHoleFn */
  private readonly numPerHoleFn: IntFunction | null;
  /** @java Sow.trackName */
  private readonly trackName: string | null;
  /** @java Sow.ownerFn */
  private readonly ownerFn: IntFunction | null;
  /** @java Sow.includeSelf */
  private readonly includeSelf: boolean;
  /** @java Sow.origin */
  private readonly origin: BooleanFunction | null;
  /** @java Sow.skipFn */
  private readonly skipFn: BooleanFunction | null;
  /** @java Sow.captureRule */
  private readonly captureRule: BooleanFunction | null;
  /** @java Sow.captureEffect */
  private readonly captureEffect: MovesFunction | null;
  /** @java Sow.sowEffect */
  private readonly sowEffect: MovesFunction | null;
  /** @java Sow.backtracking */
  private readonly backtracking: BooleanFunction | null;
  /** @java Sow.forward */
  private readonly forward: BooleanFunction | null;

  /** @java Sow.preComputedTracks */
  private preComputedTracks: Track[] = [];

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Sow.java — constructor
   */
  /**
   * @java Sow.java — faithful 15-param constructor (Java order):
   * (SiteType type, IntFunction start, @Name IntFunction count, @Name IntFunction numPerHole,
   *  String trackName, @Name IntFunction owner, @Name BooleanFunction If, @Name Moves sowEffect,
   *  @Name NonDecision apply, @Name Boolean includeSelf, @Name BooleanFunction origin,
   *  @Name BooleanFunction skipIf, @Or @Name BooleanFunction backtracking,
   *  @Or @Name BooleanFunction forward, Then then). All @Opt. `type` is unused by the 1:1
   *  track-based eval; Java `If`->captureRule, `apply`->captureEffect, `skipIf`->skipFn.
   */
  public constructor(
    _type: string | null = null,
    start: IntFunction | null = null,
    count: IntFunction | null = null,
    numPerHole: IntFunction | null = null,
    trackName: string | null = null,
    owner: IntFunction | null = null,
    If: BooleanFunction | null = null,
    sowEffect: MovesFunction | null = null,
    apply: MovesFunction | null = null,
    includeSelf: boolean | null = null,
    origin: BooleanFunction | null = null,
    skipIf: BooleanFunction | null = null,
    backtracking: BooleanFunction | null = null,
    forward: BooleanFunction | null = null,
    then: ThenLike | null = null,
  ) {
    super(then ?? null);
    // @java Sow.java:374 — gameFlags() = GameType.Count | … (unconditional).
    compileFlags.usesCount = true;
    // @java Sow.java:144 — startLoc = (start == null) ? new LastTo(null) :
    // start. The sow's default origin is the LAST MOVE's destination (the
    // selected pit), NOT the context's (to) iterator binding: the old
    // ctx._evalTo fallback in eval() only worked because evalDeferredThens
    // un-faithfully bound _evalTo to the applied move's to.
    this.startLoc = start ?? (new LastTo() as unknown as IntFunction);
    this.countFn = count ?? null;
    this.numPerHoleFn = numPerHole ?? null;
    this.trackName = trackName ?? null;
    this.ownerFn = owner ?? null;
    this.includeSelf = includeSelf ?? true;
    // compileTerminal hands lud literal True/False as a raw boolean — wrap
    // every BooleanFunction slot (engine rule: must be eval-able). The
    // capture+backtracking branch only runs once a sow triggers a capture
    // (last seed makes 2/3 on the opponent's row), so a raw `backtracking:
    // True` lurked unevaluated until then — Oware's first capturing sow threw
    // `this.backtracking.eval is not a function`, the (then (sow)) was caught
    // and discarded, and the whole move applied as a no-op (~120 mancala).
    const wrapBool = (b: BooleanFunction | boolean | null): BooleanFunction | null =>
      typeof b === "boolean" ? { eval: () => b } : (b ?? null);
    this.origin = wrapBool(origin as BooleanFunction | boolean | null);
    this.skipFn = wrapBool(skipIf as BooleanFunction | boolean | null);
    this.captureRule = wrapBool(If as BooleanFunction | boolean | null);
    this.captureEffect = apply ?? null;
    this.sowEffect = sowEffect ?? null;
    this.backtracking = wrapBool(backtracking as BooleanFunction | boolean | null);
    this.forward = wrapBool(forward as BooleanFunction | boolean | null);
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Sow.java — eval(Context)
   *
   * Java lines 165-366:
   *   1. Resolve start site, count, track.
   *   2. Optionally apply origin effect.
   *   3. Walk the track, emitting ActionMove from start→to for each hole.
   *   4. Apply capture rule and effect if conditions are met.
   */
  public override eval(ctx: Context): Move[] {
    // @java Sow.java:196 — startLoc.eval(context); always defined (LastTo
    // default reads trial.lastMove().toNonDecision(), independent of the
    // context's (to)/(from) iterator bindings).
    const start = this.startLoc?.eval(ctx) ?? -1;
    if (start < 0) return [];
    const count = this.countFn?.eval(ctx) ?? ctx.state.count(start);
    if (process.env.TRACE_SOW) console.error(`[sow] start=${start} count=${count}`);
    if (count <= 0) return [];
    const numPerHoleDefault = () => this.numPerHoleFn?.eval(ctx) ?? 1;

    const mover = ctx.state.mover;

    // @java Sow.java:178-188 — find the relevant track
    const owner = (this.ownerFn === null) ? -1 : this.ownerFn.eval(ctx);
    let track: Track | null = null;

    // preComputedTracks can arrive null via the reflection ctor path
    // (Tchoukaillon's then-sow threw on .length and the swallowed error
    // killed its consequence chain).
    const tracks = (this.preComputedTracks?.length ?? 0) > 0
      ? this.preComputedTracks!
      : boardTracks(ctx);

    for (const t of tracks) {
      // @java Sow.java:182-183 — ownerless lookup is EXACT (equals); the
      // owner-filtered lookup is substring (contains).
      if (this.trackName === null ||
          (owner === -1 && t.name() === this.trackName) ||
          (owner !== -1 && t.owner() === owner && t.name().includes(this.trackName))) {
        track = t;
        break;
      }
    }

    if (track === null) return [];

    // @java Sow.java applies its walk on a TempContext, so its eval-scratch
    // mutations (lastTo/from/value) never leak back to the CALLER's context.
    // Our Sow mutates the shared `ctx` directly; without restoring, a nested
    // `(sow …)` inside an `(and { … (sow …) … (set State at:(to)) … })` left
    // `_evalTo` pointing at the inner sow's last hole, so the sibling
    // `(set State at:(to))` / `(set Var …)` fired on the WRONG site (Deka and
    // the two-row mancala family mis-marked "covered" holes). Snapshot here and
    // restore in the finally below.
    const _sowSavedFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom;
    const _sowSavedTo = (ctx as unknown as { _evalTo?: number })._evalTo;
    const _sowSavedVal = (ctx as unknown as { _evalValue?: number })._evalValue;
    try {

    const elems = track.elems();
    const actions: Action[] = [];
    // @java pits carry the Seed component while seeded — propagate it with the sow.
    const seedWhat = ctx.state.whatAtSite(start) > 0 ? ctx.state.whatAtSite(start) : 0;
    // @java ActionMoveTopPiece.java:422,495 — who = (what < 1) ? 0 :
    // context.components()[what].owner(). Sow.java's per-hole ActionMove.construct
    // calls (Sow.java:217,277) never pass an owner override, so the "who" stamped
    // on a sown-into site is the SOWN PIECE's own declared component owner, not
    // the current mover. For a Shared-role Seed piece (Mwambulula, Khutka Boia,
    // …) this is the constant Shared owner; using `mover` instead let a stale
    // mover-derived owner corrupt `whatAtSite()`'s cells-owner fallback on a
    // what-less pit, which then failed ActionMove's pile-merge `what` check and
    // silently dropped a redistributed hand seed (Mwambulula ply 42/60).
    const seedOwner = seedWhat > 0
      ? (ctx.game.equipment?.pieces?.find((p) => p.index === seedWhat)?.owner ?? 0)
      : 0;

    let numSeedSowed = 0;
    let lastTo = start;
    // @java Sow.java:235 `context.setTo(to)` — the context `to` used by the
    // post-sow capture rule. Java sets it to `track.elems()[i].next` at the TOP
    // of each seed iteration, BEFORE the `!includeSelf && to == start` skip
    // (Sow.java:249-254) reassigns the *local* `to`. So when the final seed
    // wraps past the origin (skip fires), context.to is left on the ORIGIN
    // (count 0 after draining), NOT the hole the seed actually lands in — and
    // the capture rule `(= (count at:(to)) 2/3)` reads the empty origin and does
    // not fire. `lastTo` below tracks the ACTUAL landing site (for the sow
    // action); `ctxTo` faithfully tracks Java's frozen context.to for capture.
    let ctxTo = start;

    // @java Sow.java:194-197 — find index i in track for start
    let i = 0;
    for (i = 0; i < elems.length; i++) {
      if (elems[i]!.site === start) break;
    }

    // @java Sow.java:200-222 — apply origin effect if configured
    (ctx as unknown as { _evalFrom?: number })._evalFrom = start;
    if (this.origin?.eval(ctx) ?? false) {
      if (this.sowEffect !== null) {
        const effect = this.sowEffect.eval(ctx);
        for (const moveEffect of effect) {
          for (const actionEffect of moveEffect.actions) {
            actions.push(actionEffect);
          }
        }
      }
      let numDone = 0;
      const numPerHole = numPerHoleDefault();
      while (numDone !== numPerHole) {
        if (numSeedSowed < count) {
          // @java a self-drop is ActionMove(start→start): net-zero, but it still
          // consumes one seed from the origin pool. Per-seed transfer keeps the
          // origin drain incremental (and idempotent on re-application).
          actions.push(new ActionSowSeed(start, start, seedOwner, seedWhat));
          lastTo = start;
        }
        numDone++;
        numSeedSowed++;
      }
      (ctx as unknown as { _evalTo?: number })._evalTo = start;
    }

    // @java Sow.java:226-290 — main sowing loop
    if (numSeedSowed < count) {
      let numSkipped = 0;
      const MAX_SKIP = 1000;

      for (let index = 0; index < count; index++) {
        (ctx as unknown as { _evalValue?: number })._evalValue = count - index;
        if (i >= elems.length) break;

        let to = elems[i]!.next;
        (ctx as unknown as { _evalTo?: number })._evalTo = to;
        // @java Sow.java:235 — freeze context.to at the pre-skip site (see ctxTo
        // declaration). The includeSelf skip below reassigns local `to` but never
        // calls setTo again, so ctxTo must NOT be updated there.
        ctxTo = to;

        // @java Sow.java:240-247 — skip logic
        if (this.skipFn !== null && this.skipFn.eval(ctx) && numSkipped < MAX_SKIP) {
          index--;
          numSkipped++;
          i = elems[i]!.nextIndex;
          to = elems[i]!.next;
          continue;
        } else {
          numSkipped = 0;
        }

        // @java Sow.java:249-254 — skip origin if !includeSelf
        if (!this.includeSelf && to === start) {
          i = elems[i]!.nextIndex;
          to = elems[i]!.next;
        }

        // @java Sow.java:257-283 — per-hole sow
        let numPerHole = numPerHoleDefault();
        let numDone = 0;

        if (this.sowEffect !== null) {
          const effect = this.sowEffect.eval(ctx);
          for (const moveEffect of effect) {
            for (const actionEffect of moveEffect.actions) {
              actions.push(actionEffect);
            }
          }
        }

        while (numDone !== numPerHole) {
          if (numSeedSowed < count) {
            // @java Sow.java emits an ActionMove(start→to) per dropped seed; the
            // per-seed transfer decrements the origin and increments the hole,
            // and no-ops on an already-drained origin (ActionMoveTopPiece guard).
            actions.push(new ActionSowSeed(start, to, seedOwner, seedWhat));
            lastTo = to;
          }
          numDone++;
          numSeedSowed++;
        }

        i = elems[i]!.nextIndex;
        if (numSeedSowed >= count) break;
      }
    }

    // @java Sow.java:291 — add the move. The origin drain is NOT a separate
    // bulk action: each per-seed ActionSowSeed already decrements the origin by
    // one (mirroring Java's list of single-seed ActionMove(start→hole)). This
    // makes the sow idempotent when Do/Move re-applies it (see ActionSowSeed),
    // and it only drains as many seeds as were actually sown (the old bulk
    // `-count` over-drained when a non-looped track ran out before `count`).
    const finalActions: Action[] = [...actions];
    let moveAgain = false;
    // @java Sow.java:295-304 — the capture rule is evaluated on Java's frozen
    // context.to (`ctxTo`), which diverges from the actual last-sown hole only
    // when the final seed wrapped past a skipped origin. Use ctxTo from here on;
    // backtracking then walks `i`'s track links from the last-sown index.
    lastTo = ctxTo;
    (ctx as unknown as { _evalTo?: number })._evalTo = lastTo;
    let rollingState = applyActions(ctx, finalActions);
    let evalCtx = tempContext(ctx, rollingState, start, lastTo);

    // @java Sow.java:293-351 — apply capture rule after sowing
    if (this.captureEffect !== null) {
      let numCapture = 0;
      // @java Sow.java — the backtracking/forward CONTINUATION conditions
      // ((is Odd (count at:(next hole))) etc.) are evaluated on the post-sow,
      // PRE-capture board (Java's newContext), never on the captured board.
      // Evaluating them on the post-capture rollingState made a just-emptied
      // hole read count 0 -> (is Odd 0)=false -> the capture chain broke one
      // hole early (Okwe). Snapshot the pre-capture board for the condition evals.
      const preCaptureState = rollingState;
      while (this.captureRule === null || this.captureRule.eval(evalCtx)) {
        evalCtx._evalFrom = start;
        evalCtx._evalTo = lastTo;
        const capturingMoves = this.captureEffect.eval(evalCtx);
        for (const m of capturingMoves) {
          for (const a of m.actions) finalActions.push(a);
          rollingState = m.applyTo(rollingState, ctx.rng);
          if (m.moveAgain) moveAgain = true;
          // @java Sow.java:304-308 — sowMove.actions().addAll(
          //   m.getActionsWithConsequences(newContext)): a capture move carries
          //   its OWN (then …) chain (e.g. ("CaptureMove")'s (then (if (is Even
          //   …) (capture …)))) that captures further holes. Applying only
          //   m.actions silently dropped that chain (Bechi & ~60 two-row sow
          //   games left seeds Java had captured). Fold the deferred thens.
          if (m.deferredThens && m.deferredThens.length > 0) {
            const folded = evalDeferredThens(evalCtx, rollingState as never, m);
            for (const a of folded.extraActions) finalActions.push(a);
            rollingState = folded.state as never;
            if (folded.moveAgain) moveAgain = true;
          }
        }
        if (this.backtracking === null && this.forward === null) break;
        if (this.backtracking !== null) {
          evalCtx = tempContext(ctx, preCaptureState, start, lastTo);
          if (!this.backtracking.eval(evalCtx)) break;
          const prevTo = elems[i]?.prev ?? -1;
          if (prevTo < 0) break;
          i = elems[i]!.prevIndex;
          lastTo = prevTo;
          evalCtx = tempContext(ctx, preCaptureState, start, lastTo);
          if (!this.backtracking.eval(evalCtx)) break;
          if (prevTo === start) break;
        }
        if (this.forward !== null) {
          evalCtx = tempContext(ctx, preCaptureState, start, lastTo);
          if (!this.forward.eval(evalCtx)) break;
          if (!track.islooped() && (elems[i]?.next ?? -1) < 0) break;
          const nextTo = elems[i]?.next ?? -1;
          if (nextTo < 0) break;
          i = elems[i]!.nextIndex;
          lastTo = nextTo;
          evalCtx = tempContext(ctx, preCaptureState, start, lastTo);
          if (!this.forward.eval(evalCtx)) break;
        }
        evalCtx = tempContext(ctx, rollingState, start, lastTo);
        numCapture++;
        if (numCapture >= elems.length) break;
      }
    }

    const then = this.then();
    if (then !== null) {
      evalCtx = tempContext(ctx, rollingState, start, lastTo);
      const thenMoves = then.moves().eval(evalCtx) as unknown as Move[];
      for (const m of thenMoves) {
        for (const a of m.actions) finalActions.push(a);
        rollingState = m.applyTo(rollingState, ctx.rng);
        if (m.moveAgain) moveAgain = true;
        // @java Sow.java:358-360 — moves.get(j).then().add(then().moves())
        // attaches this then as a deferred consequence, so a move `m` the
        // then-generator returns can carry its OWN nested (then …) chain that
        // Java's generic Move.apply()/then() recursion resolves. Whyo's
        // round-reset — (forEach Site (union P1 P2) (fromTo …) (then (and {
        // addScore… (if (< (var) 0) (and { removeAll addFour })) }))) —
        // attaches the score/reset cascade onto EACH swept move via
        // ForEachSite's own then-fold (dt=1 per move). This loop evaluates
        // then() eagerly at generation time and applied only m's bare
        // actions, silently dropping that nested chain (the post-round board
        // never got refilled: 48 seeds stayed on the board/stores instead of
        // the expected 96 after the reset's Remove+Add). Same bug class as
        // the capture loop above (Sow.java:304-308) — fold the deferred
        // thens here too.
        if (m.deferredThens && m.deferredThens.length > 0) {
          const folded = evalDeferredThens(evalCtx, rollingState as never, m);
          for (const a of folded.extraActions) finalActions.push(a);
          rollingState = folded.state as never;
          if (folded.moveAgain) moveAgain = true;
        }
      }
    }

    return [new Move({
      id: `sow:${mover}:${start}`,
      label: `Sow(start=${start})`,
      siteIndices: [start, lastTo],
      mover,
      placedOwner: mover,
      actions: finalActions,
      moveAgain,
      fromSite: start,
      toSite: lastTo,
      fromNonDecisionSite: start,
      toNonDecisionSite: lastTo,
    })];
    } finally {
      // Restore the caller's eval-scratch so a sibling expression in the same
      // `(and …)` sees the ORIGINAL (to)/(from), not the inner sow's last hole.
      (ctx as unknown as { _evalFrom?: number })._evalFrom = _sowSavedFrom;
      (ctx as unknown as { _evalTo?: number })._evalTo = _sowSavedTo;
      (ctx as unknown as { _evalValue?: number })._evalValue = _sowSavedVal;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Sow.preprocess(Game) — compute tracks matching trackName
   */
  public override preprocess(): void {
    super.preprocess();
    // In a live game, this would scan game.board().tracks()
    // For coverage port, leave empty (preComputedTracks stays [])
  }

  /** @java Sow.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
