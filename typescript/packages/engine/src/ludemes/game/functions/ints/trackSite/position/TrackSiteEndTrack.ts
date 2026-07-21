// @java Core/src/game/functions/ints/trackSite/position/TrackSiteEndTrack.java

/**
 * Returns the last site of a track.
 *
 * @java game/functions/ints/trackSite/position/TrackSiteEndTrack.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";
import { roleToPlayerId } from "../../board/IdFn.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;
/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** Minimal track element shape (Java: Track.TrackElem). */
interface TrackElem {
  readonly site: number;
}

/** Minimal track shape (Java: game.equipment.container.board.Track). */
interface Track {
  name(): string;
  owner(): number;
  elems(): readonly TrackElem[];
}

/** Context escape-hatch for tracks and game board. */
interface CtxWithTracks {
  tracks(): Track[];
  game(): {
    board(): {
      tracks(): { size(): number; get(i: number): Track };
    };
  };
}

/**
 * Returns the last site of a track.
 *
 * @java game/functions/ints/trackSite/position/TrackSiteEndTrack.java
 */
export class TrackSiteEndTrack extends BaseIntFunction {

  /** @java TrackSiteEndTrack.name */
  private readonly name: string | null;

  /** @java TrackSiteEndTrack.pidFn */
  private readonly pidFn: JavaIntFunction | null;

  /** @java TrackSiteEndTrack.precomputedValue */
  private precomputedValue: number = OFF;

  /**
   * @param player The index of the player (as IntFunction or null).
   * @param role   The role of the player (null — handled at call site).
   * @param name   The name of the track.
   *
   * @java TrackSiteEndTrack(Player, RoleType, String)
   */
  public constructor(
    player: JavaIntFunction | null,
    role: string | null,
    name: string | null,
  ) {
    super();
    this.name = name;
    // @java TrackSiteEndTrack — pidFn = player.index() else RoleType.toIntFunction(role).
    // Route role through the canonical roleToPlayerId (= Id(null,role).eval).
    this.pidFn = player !== null
      ? player
      : (role !== null ? { eval: (ctx: Context) => roleToPlayerId(role, ctx) } as JavaIntFunction : null);
  }

  //-------------------------------------------------------------------------

  /**
   * @java TrackSiteEndTrack.eval(Context)
   */
  public override eval(context: Context): number {
    if (this.precomputedValue !== OFF)
      return this.precomputedValue;

    const playerId = (this.pidFn !== null) ? this.pidFn.eval(context) : 0;
    let track: Track | null = null;

    const ctxAny = context as unknown as CtxWithTracks;
    const tracks: Track[] = (typeof ctxAny.tracks === "function") ? ctxAny.tracks() : [];

    for (const t of tracks) {
      if (this.name !== null && playerId === 0) {
        if (t.name().includes(this.name)) {
          track = t;
          break;
        }
      } else if (this.name !== null) {
        if (this.name !== null) {
          if (t.name().includes(this.name) && t.owner() === playerId) {
            track = t;
            break;
          }
        }
      } else if (t.owner() === playerId || t.owner() === 0) {
        track = t;
        break;
      }
    }

    if (track === null) {
      const boardTracks = (typeof ctxAny.game === "function")
        ? ctxAny.game().board().tracks()
        : null;
      if (boardTracks === null || boardTracks.size() === 0)
        return UNDEFINED; // no track at all.
      else
        track = boardTracks.get(0);
    }

    // Check if the track is empty.
    if (track.elems().length === 0)
      return UNDEFINED;

    return track.elems()[track.elems().length - 1]!.site;
  }

  //-------------------------------------------------------------------------

  /** @java TrackSiteEndTrack.isStatic() */
  public isStatic(): boolean {
    if (this.pidFn === null) return true;
    const pidFnIsStatic = (this.pidFn as unknown as { isStatic?(): boolean })?.isStatic;
    return typeof pidFnIsStatic === "function" ? pidFnIsStatic.call(this.pidFn) : false;
  }

  /** @java TrackSiteEndTrack.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    if (this.pidFn !== null) {
      for (const c of this.pidFn.concepts(game)) concepts.add(c);
    }
    return concepts;
  }

  /** @java TrackSiteEndTrack.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    if (this.pidFn !== null) {
      for (const c of this.pidFn.writesEvalContextRecursive()) writeEvalContext.add(c);
    }
    return writeEvalContext;
  }

  /** @java TrackSiteEndTrack.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    if (this.pidFn !== null) {
      for (const c of this.pidFn.readsEvalContextRecursive()) readEvalContext.add(c);
    }
    return readEvalContext;
  }

  /** @java TrackSiteEndTrack.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    const gameAny = game as unknown as { hasTrack(): boolean; addRequirementToReport(s: string): void };
    if (typeof gameAny.hasTrack === "function" && !gameAny.hasTrack()) {
      gameAny.addRequirementToReport("The ludeme (trackSite EndTrack ...) is used but the board has no tracks.");
      missingRequirement = true;
    }
    if (this.pidFn !== null)
      missingRequirement = missingRequirement || this.pidFn.missingRequirement(game);
    return missingRequirement;
  }

  /** @java TrackSiteEndTrack.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    if (this.pidFn !== null)
      willCrash = willCrash || this.pidFn.willCrash(game);
    return willCrash;
  }

  /** @java TrackSiteEndTrack.toString() */
  public override toString(): string {
    return "";
  }

  /** @java TrackSiteEndTrack.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    let trackName = this.name;
    if (trackName === null)
      trackName = "the board's track";
    return "the last site of " + trackName;
  }
}
