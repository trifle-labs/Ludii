// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/max/distance/MaxDistance.java
/**
 * Filters the moves to keep only the moves allowing the maximum distance on a
 * track in a turn.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/requirement/max/distance/MaxDistance.java
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../../../../base.js";
import type { Move } from "../../../../../../../../../../move.js";
import type { Then } from "../../../Then.js";

/** Constants.UNDEFINED = -2 matching Java */
const UNDEFINED = -2;

interface TrackElem {
  site: number;
  next: number;
  nextIndex: number;
  bump: number;
}

interface Track {
  name(): string;
  owner(): number;
  elems(): TrackElem[];
}

export class MaxDistance implements MovesFunction {
  /** @java MaxDistance.moves */
  private readonly moves: MovesFunction;

  /** @java MaxDistance.trackName */
  private readonly trackName: string | null;

  /** @java MaxDistance.owner */
  private readonly owner: string | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/distance/MaxDistance.java — constructor
   *
   * @param trackName The name of the track [null = any track]
   * @param owner     The role type of the owner [null = any owner]
   * @param moves     The moves to filter
   * @param then      Subsequent moves
   */
  public constructor(
    trackName: string | null,
    owner: string | null,
    moves: MovesFunction,
    then: Then | null = null,
  ) {
    this.trackName = trackName;
    this.owner = owner;
    this.moves = moves;
    this.thenClause = then;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/distance/MaxDistance.java — eval(Context)
   *
   * 1. Find the matching track in context.tracks()
   * 2. Evaluate all moves
   * 3. Compute distance for each move (absolute index difference on track)
   * 4. Return only moves with maximum distance
   */
  public eval(ctx: Context): Move[] {
    const ctxAny = ctx as unknown as {
      tracks?: Track[];
      recursiveCalled?: boolean;
    };

    // @java MaxDistance.java:70-82 — find the matching track
    let track: Track | null = null;
    const mover = ctx.state.mover;

    if (ctxAny.tracks) {
      for (const t of ctxAny.tracks) {
        const who = this.owner != null ? this.resolveOwner(ctx, this.owner) : UNDEFINED;
        if (this.trackName == null ||
            (who === UNDEFINED && t.name() === this.trackName) ||
            (who !== UNDEFINED && t.owner() === who && t.name().includes(this.trackName))) {
          track = t;
          break;
        }
      }
    }

    // @java MaxDistance.java:84-85 — if track doesn't exist, return base moves
    if (track == null) return this.moves.eval(ctx);

    // @java MaxDistance.java:88-131 — compute distances and keep max
    const movesToEval = this.moves.eval(ctx);
    const distanceCount: number[] = new Array(movesToEval.length).fill(0);

    for (let i = 0; i < movesToEval.length; i++) {
      const m = movesToEval[i]!;
      let indexFrom = UNDEFINED;
      let indexTo = UNDEFINED;

      const elems = track.elems();
      for (let j = 0; j < elems.length; j++) {
        if (elems[j]!.site === m.fromNonDecision()) indexFrom = j;
        else if (elems[j]!.site === m.toNonDecision()) indexTo = j;

        if (indexFrom !== UNDEFINED && indexTo !== UNDEFINED) break;
      }

      const distance = Math.abs(indexFrom - indexTo);
      distanceCount[i] = (ctxAny.recursiveCalled)
        ? distance
        : this.getDistanceCount(ctx, track, mover, m, distance);
    }

    // @java MaxDistance.java:113-117 — find max distance
    let max = 0;
    for (const d of distanceCount) {
      if (d > max) max = d;
    }

    // @java MaxDistance.java:119-122 — keep only max-distance moves
    const returnMoves: Move[] = [];
    for (let i = 0; i < movesToEval.length; i++) {
      if (distanceCount[i] === max) returnMoves.push(movesToEval[i]!);
    }

    // @java MaxDistance.java:129-130 — then clause
    if (this.thenClause != null) {
      const thenMoves = this.thenClause.eval(ctx);
      return returnMoves.map(m => m.withConsequence(
        thenMoves.flatMap(tm => [...tm.actions]),
        false,
      ));
    }

    return returnMoves;
  }

  /**
   * @java MaxDistance.java:143-190 — recursive distance counting
   * Applies a move to a copy of the context and checks further moves.
   */
  private getDistanceCount(
    _ctx: Context,
    _track: Track,
    _mover: number,
    _m: Move,
    distance: number,
  ): number {
    // @java MaxDistance.java:143-190 — TempContext + recursive legal moves
    // Requires a deep copy of context (TempContext in Java) which is not yet wired in TS.
    // Fall back to the base distance without recursion.
    return distance;
  }

  /**
   * Resolve a RoleType string to a player index.
   * @java MaxDistance.java:72 — new Id(null, owner).eval(context)
   */
  private resolveOwner(ctx: Context, _role: string): number {
    // Not yet wired — RoleType resolution requires a player registry
    return UNDEFINED;
  }

  /** @java MaxDistance.moves */
  public getMoves(): MovesFunction { return this.moves; }
}
