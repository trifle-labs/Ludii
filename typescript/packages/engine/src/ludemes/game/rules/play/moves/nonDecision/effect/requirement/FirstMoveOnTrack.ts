// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/FirstMoveOnTrack.java
/**
 * Returns the first legal move on the track.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/requirement/FirstMoveOnTrack.java
 *
 * @remarks Example: Backgammon — the piece must start from the first occupied
 *          site on the track for a given die roll.
 */

import type { Context } from "../../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../../base.js";
import type { Move } from "../../../../../../../../move.js";
import type { Then } from "../Then.js";

/** Constants.UNDEFINED = -2 */
const UNDEFINED = -2;

interface TrackElem {
  site: number;
}

interface Track {
  name(): string;
  owner(): number;
  elems(): TrackElem[];
}

export class FirstMoveOnTrack implements MovesFunction {
  /** @java FirstMoveOnTrack.moves */
  private readonly moves: MovesFunction;

  /** @java FirstMoveOnTrack.trackName */
  private readonly trackName: string | null;

  /** @java FirstMoveOnTrack.owner */
  private readonly owner: string | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/FirstMoveOnTrack.java — constructor
   *
   * @param trackName The name of the track [null = any track]
   * @param owner     The role type of the owner [null = any owner]
   * @param moves     The moves to check
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
   * @java game/rules/play/moves/nonDecision/effect/requirement/FirstMoveOnTrack.java — eval(Context)
   *
   * 1. Find the matching track in context.tracks()
   * 2. Walk through track elements in order
   * 3. For each site, check if context.moves returns non-empty result
   * 4. Return the first non-empty result found
   */
  public eval(ctx: Context): Move[] {
    const ctxAny = ctx as unknown as {
      tracks?: Track[];
      _evalSite?: number;
    };

    // @java FirstMoveOnTrack.java:68-79 — find matching track
    let track: Track | null = null;

    if (ctxAny.tracks) {
      const who = this.owner != null ? this.resolveOwner(ctx) : UNDEFINED;
      for (const t of ctxAny.tracks) {
        if (this.trackName == null ||
            (who === UNDEFINED && t.name() === this.trackName) ||
            (who !== UNDEFINED && t.owner() === who && t.name().includes(this.trackName!))) {
          track = t;
          break;
        }
      }
    }

    // @java FirstMoveOnTrack.java:81-83 — if track doesn't exist, return base moves
    if (track == null) return this.moves.eval(ctx);

    const originSiteValue = ctx._evalSite;
    const returnMoves: Move[] = [];

    // @java FirstMoveOnTrack.java:87-99 — walk track elements
    for (const elem of track.elems()) {
      const site = elem.site;
      if (site < 0) continue;

      ctx._evalSite = site;
      const movesComputed = this.moves.eval(ctx);

      if (movesComputed.length > 0) {
        returnMoves.push(...movesComputed);
        break; // @java FirstMoveOnTrack.java:97 — break on first non-empty
      }
    }

    ctx._evalSite = originSiteValue;

    // @java FirstMoveOnTrack.java:103-105 — then clause
    if (this.thenClause != null && returnMoves.length > 0) {
      const thenMoves = this.thenClause.eval(ctx);
      return returnMoves.map(m => m.withConsequence(
        thenMoves.flatMap(tm => [...tm.actions]),
        false,
      ));
    }

    return returnMoves;
  }

  /**
   * Resolve a RoleType string to a player index.
   * @java FirstMoveOnTrack.java:68 — new Id(null, owner).eval(context)
   */
  private resolveOwner(_ctx: Context): number {
    // Not yet wired — RoleType resolution requires a player registry
    return UNDEFINED;
  }

  /** @java FirstMoveOnTrack.moves */
  public getMoves(): MovesFunction { return this.moves; }
}
