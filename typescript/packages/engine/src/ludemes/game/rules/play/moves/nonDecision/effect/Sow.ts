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

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
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

/**
 * Sow effect — mancala-style sowing along a track.
 *
 * @java game/rules/play/moves/nonDecision/effect/Sow.java
 */
export class Sow extends Effect {
  /** @java Sow.startLoc */
  private readonly startLoc: IntFunction;
  /** @java Sow.countFn */
  private readonly countFn: IntFunction;
  /** @java Sow.numPerHoleFn */
  private readonly numPerHoleFn: IntFunction;
  /** @java Sow.trackName */
  private readonly trackName: string | null;
  /** @java Sow.ownerFn */
  private readonly ownerFn: IntFunction | null;
  /** @java Sow.includeSelf */
  private readonly includeSelf: boolean;
  /** @java Sow.origin */
  private readonly origin: BooleanFunction;
  /** @java Sow.skipFn */
  private readonly skipFn: BooleanFunction | null;
  /** @java Sow.captureRule */
  private readonly captureRule: BooleanFunction;
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
  public constructor(opts: {
    startLoc: IntFunction;
    countFn: IntFunction;
    numPerHoleFn: IntFunction;
    captureRule: BooleanFunction;
    origin: BooleanFunction;
    trackName?: string | null;
    ownerFn?: IntFunction | null;
    includeSelf?: boolean;
    skipFn?: BooleanFunction | null;
    captureEffect?: MovesFunction | null;
    sowEffect?: MovesFunction | null;
    backtracking?: BooleanFunction | null;
    forward?: BooleanFunction | null;
    then?: ThenLike | null;
  }) {
    super(opts.then ?? null);
    this.startLoc = opts.startLoc;
    this.countFn = opts.countFn;
    this.numPerHoleFn = opts.numPerHoleFn;
    this.trackName = opts.trackName ?? null;
    this.ownerFn = opts.ownerFn ?? null;
    this.includeSelf = opts.includeSelf ?? true;
    this.origin = opts.origin;
    this.skipFn = opts.skipFn ?? null;
    this.captureRule = opts.captureRule;
    this.captureEffect = opts.captureEffect ?? null;
    this.sowEffect = opts.sowEffect ?? null;
    this.backtracking = opts.backtracking ?? null;
    this.forward = opts.forward ?? null;
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
    const start = this.startLoc.eval(ctx);
    const count = this.countFn.eval(ctx);

    // Access tracks from context
    const ctxAny = ctx as unknown as {
      _tracks?: Track[];
      state?: { mover?: number };
    };

    const mover = ctx.state.mover;

    // @java Sow.java:178-188 — find the relevant track
    const owner = (this.ownerFn === null) ? -1 : this.ownerFn.eval(ctx);
    let track: Track | null = null;

    const tracks = this.preComputedTracks.length > 0
      ? this.preComputedTracks
      : (ctxAny._tracks ?? []);

    for (const t of tracks) {
      if (this.trackName === null ||
          (owner === -1 && t.name().includes(this.trackName)) ||
          (owner !== -1 && t.owner() === owner && t.name().includes(this.trackName))) {
        track = t;
        break;
      }
    }

    if (track === null) return [];

    const elems = track.elems();
    const move = new Move({
      id: `sow:${mover}:${start}`,
      label: `Sow(start=${start})`,
      siteIndices: [start],
      mover,
      placedOwner: mover,
      actions: [] as Action[],
    });

    let numSeedSowed = 0;

    // @java Sow.java:194-197 — find index i in track for start
    let i = 0;
    for (i = 0; i < elems.length; i++) {
      if (elems[i]!.site === start) break;
    }

    // @java Sow.java:200-222 — apply origin effect if configured
    (ctx as unknown as { _evalFrom?: number })._evalFrom = start;
    if (this.origin.eval(ctx)) {
      if (this.sowEffect !== null) {
        const effect = this.sowEffect.eval(ctx);
        for (const moveEffect of effect) {
          for (const actionEffect of moveEffect.actions) {
            (move.actions as Action[]).push(actionEffect);
          }
        }
      }
      let numDone = 0;
      const numPerHole = this.numPerHoleFn.eval(ctx);
      while (numDone !== numPerHole) {
        if (numSeedSowed < count) {
          (move.actions as Action[]).push(new ActionMove({ from: start, to: start }));
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
        if (i >= elems.length) return [move];

        let to = elems[i]!.next;
        (ctx as unknown as { _evalTo?: number })._evalTo = to;

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
        let numPerHole = this.numPerHoleFn.eval(ctx);
        let numDone = 0;

        if (this.sowEffect !== null) {
          const effect = this.sowEffect.eval(ctx);
          for (const moveEffect of effect) {
            for (const actionEffect of moveEffect.actions) {
              (move.actions as Action[]).push(actionEffect);
            }
          }
        }

        while (numDone !== numPerHole) {
          if (numSeedSowed < count) {
            (move.actions as Action[]).push(new ActionMove({ from: start, to }));
          }
          numDone++;
          numSeedSowed++;
        }

        i = elems[i]!.nextIndex;
        if (numSeedSowed >= count) break;
      }
    }

    // @java Sow.java:291 — add the move
    const result: Move[] = [move];

    // @java Sow.java:293-351 — apply capture rule after sowing
    if (this.captureRule !== null && this.captureEffect !== null) {
      for (const sowMove of result) {
        // In Java: apply the sowMove to a TempContext and check captureRule
        // Here we use ctx directly (approximation — no TempContext available)
        let numCapture = 0;
        while (this.captureRule.eval(ctx)) {
          (ctx as unknown as { _evalFrom?: number })._evalFrom = start;
          const capturingMoves = this.captureEffect.eval(ctx);
          for (const m of capturingMoves) {
            for (const a of m.actions) {
              (sowMove.actions as Action[]).push(a);
            }
          }
          if (this.backtracking === null && this.forward === null) break;
          if (this.backtracking !== null) {
            if (!this.backtracking.eval(ctx)) break;
            const prevTo = elems[i]?.prev ?? -1;
            if (prevTo < 0) break;
            i = elems[i]!.prevIndex;
            (ctx as unknown as { _evalTo?: number })._evalTo = prevTo;
            if (!this.backtracking.eval(ctx)) break;
            if (prevTo === start) break;
          }
          if (this.forward !== null) {
            if (!this.forward.eval(ctx)) break;
            if (!track.islooped() && (elems[i]?.next ?? -1) < 0) break;
            const nextTo = elems[i]?.next ?? -1;
            if (nextTo < 0) break;
            i = elems[i]!.nextIndex;
            (ctx as unknown as { _evalTo?: number })._evalTo = nextTo;
            if (!this.forward.eval(ctx)) break;
          }
          numCapture++;
          if (numCapture >= elems.length) break;
        }
      }
    }

    return result;
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
