// @java Core/src/game/functions/ints/trackSite/move/TrackSiteMove.java

/**
 * Returns the new site on the player track on function of the current position
 * of the component and the number of steps to move forward.
 *
 * @java game/functions/ints/trackSite/move/TrackSiteMove.java
 * @author Eric Piette
 *
 * @remarks Applies to any game with a defined track.
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/** Minimal track element shape (Java: Track.TrackElem). */
interface TrackElem {
  readonly site: number;
  readonly next: number;
}

/** Minimal track shape (Java: game.equipment.container.board.Track). */
interface Track {
  name(): string;
  owner(): number;
  elems(): readonly TrackElem[];
  islooped(): boolean;
  trackIdx(): number;
}

/** Context escape-hatch for complex state access. */
interface CtxWithTracks {
  game(): {
    board(): {
      tracks(): { size(): number; get(i: number): Track };
    };
    hasInternalLoopInTrack(): boolean;
  };
  board(): {
    ownedTracks(playerId: number): Track[];
    defaultSite(): unknown;
  };
  containerId(): number[];
  containerState(cid: number): ContainerStateAny;
  state(): {
    onTrackIndices(): OnTrackIndicesAny;
  };
}

interface ContainerStateAny {
  what(loc: number, siteType: unknown): number;
  sizeStack(loc: number, siteType: unknown): number;
  who(loc: number, lvl: number, siteType: unknown): number;
  what(loc: number, lvl: number, siteType: unknown): number;
}

interface OnTrackIndicesAny {
  locToIndex(trackIdx: number, loc: number): TIntArrayListAny;
  whats(trackIdx: number, what: number, index: number): number;
}

interface TIntArrayListAny {
  size(): number;
  getQuick(i: number): number;
}

/**
 * Returns the new site on the player track from a site after some steps.
 *
 * @java game/functions/ints/trackSite/move/TrackSiteMove.java
 */
export class TrackSiteMove extends BaseIntFunction {

  /** @java TrackSiteMove.currentLocation */
  private readonly currentLocation: JavaIntFunction | null;

  /** @java TrackSiteMove.steps */
  private readonly steps: JavaIntFunction;

  /** @java TrackSiteMove.player */
  private readonly player: JavaIntFunction;

  /** @java TrackSiteMove.name */
  private readonly name: string | null;

  /**
   * @param from   The current location [(from)].
   * @param role   The role of the owner of the track (null — handled at call site).
   * @param player The owner of the track (as IntFunction).
   * @param name   The name of the track.
   * @param steps  The distance to move on the track.
   *
   * @java TrackSiteMove(IntFunction, RoleType, Player, String, IntFunction)
   */
  public constructor(
    from: JavaIntFunction | null,
    _role: null,
    player: JavaIntFunction | null,
    name: string | null,
    steps: JavaIntFunction,
  ) {
    super();
    // Java: this.player = (player == null && role == null) ? new Mover() : (role != null) ? ... : player.index();
    // In this TS port, player is already resolved to an IntFunction (Mover equiv) or null.
    // The caller (TrackSite.constructMove) handles the Mover default.
    this.player = player !== null ? player : {
      eval(ctx: Context): number { return ctx.state.mover; },
      exceeds(ctx: Context, other: JavaIntFunction): boolean { return this.eval(ctx) > other.eval(ctx); },
      isHint(): boolean { return false; },
      isHand(): boolean { return false; },
      concepts(_g: unknown): Set<number> { return new Set(); },
      readsEvalContextRecursive(): Set<number> { return new Set(); },
      writesEvalContextRecursive(): Set<number> { return new Set(); },
      missingRequirement(_g: unknown): boolean { return false; },
      willCrash(_g: unknown): boolean { return false; },
      toEnglish(_g: unknown): string { return "mover"; },
    };
    this.steps = steps;
    // Java: currentLocation = (from == null) ? new From(null) : from;
    // From(null) returns context.from() (the current move's from site).
    this.currentLocation = (from === null) ? {
      eval(ctx: Context): number { return ctx._evalFrom; },
      exceeds(ctx: Context, other: JavaIntFunction): boolean { return this.eval(ctx) > other.eval(ctx); },
      isHint(): boolean { return false; },
      isHand(): boolean { return false; },
      concepts(_g: unknown): Set<number> { return new Set(); },
      readsEvalContextRecursive(): Set<number> { return new Set(); },
      writesEvalContextRecursive(): Set<number> { return new Set(); },
      missingRequirement(_g: unknown): boolean { return false; },
      willCrash(_g: unknown): boolean { return false; },
      toEnglish(_g: unknown): string { return "from"; },
    } : from;
    this.name = name;
  }

  //-------------------------------------------------------------------------

  /**
   * @java TrackSiteMove.eval(Context)
   */
  public override eval(context: Context): number {
    const playerId = this.player.eval(context);
    let track: Track | null = null;

    const ctxAny = context as unknown as CtxWithTracks;

    if (this.name !== null) {
      const boardTracks = ctxAny.game().board().tracks();
      const size = boardTracks.size();
      for (let ti = 0; ti < size; ti++) {
        const t = boardTracks.get(ti);
        if (t.name().includes(this.name) && t.owner() === playerId) {
          track = t;
          break;
        }
      }
    }

    if (track === null && this.name !== null) {
      // The track was not precomputed because it is not owned by a player.
      const boardTracks = ctxAny.game().board().tracks();
      const size = boardTracks.size();
      for (let ti = 0; ti < size; ti++) {
        const t = boardTracks.get(ti);
        if (t.name().includes(this.name!)) {
          track = t;
          break;
        }
      }
    }

    if (track === null) {
      // The track was not precomputed because it is owned by a player.
      const ownedTracks = ctxAny.board().ownedTracks(playerId);
      if (ownedTracks.length !== 0) {
        track = ownedTracks[0]!;
      } else {
        const tracksWithNoOwner = ctxAny.board().ownedTracks(0);
        if (tracksWithNoOwner.length !== 0)
          track = tracksWithNoOwner[0]!;
      }
    }

    if (track === null)
      return OFF; // no track for this player

    let i = track.elems().length;
    if (this.currentLocation === null) {
      i = OFF;
    } else {
      const currentLoc = this.currentLocation.eval(context);

      if (!track.islooped() && ctxAny.game().hasInternalLoopInTrack()) {
        if (currentLoc < 0)
          return OFF;

        // We get the component on the current location.
        const containerId = ctxAny.containerId();
        const cs = ctxAny.containerState(containerId[currentLoc]!);
        const defaultSite = ctxAny.board().defaultSite();
        let what = cs.what(currentLoc, defaultSite);

        // For stacking game, we get a piece owned by the owner of the track.
        const sizeStack = cs.sizeStack(currentLoc, defaultSite);
        for (let lvl = 0; lvl < sizeStack; lvl++) {
          const who = (cs as unknown as { who(loc: number, lvl: number, siteType: unknown): number })
            .who(currentLoc, lvl, defaultSite);
          if (who === playerId) {
            what = (cs as unknown as { what(loc: number, lvl: number, siteType: unknown): number })
              .what(currentLoc, lvl, defaultSite);
            break;
          }
        }

        // We get the current index on the track according to the onTrackIndices structure.
        if (what !== 0) {
          const onTrackIndices = ctxAny.state().onTrackIndices();
          const trackIdx = track.trackIdx();
          const locsToIndex = onTrackIndices.locToIndex(trackIdx, currentLoc);

          for (let j = 0; j < locsToIndex.size(); j++) {
            const index = locsToIndex.getQuick(j);
            const count = onTrackIndices.whats(trackIdx, what, index);

            if (count > 0) {
              i = index;
              break;
            }
          }
        } else {
          // If no piece, we just try to find the corresponding index for the current location.
          for (i = 0; i < track.elems().length; i++)
            if (track.elems()[i]!.site === currentLoc)
              break;
        }
      } else {
        // If the track is a full loop like the mancala games, we just try to find
        // the corresponding index for the current location.
        for (i = 0; i < track.elems().length; i++)
          if (track.elems()[i]!.site === currentLoc)
            break;
      }
    }

    const numSteps = this.steps.eval(context);

    i += numSteps >= 0 ? numSteps : 0;

    if (i < track.elems().length)
      return track.elems()[i]!.site;

    // To manage the loop track
    if (track.elems()[track.elems().length - 1]!.next !== OFF) {
      while (true) {
        i -= track.elems().length;
        if (i === 0)
          return track.elems()[track.elems().length - 1]!.next;

        if ((i - 1) < track.elems().length)
          return track.elems()[i - 1]!.next;
      }
    }

    return OFF;
  }

  //-------------------------------------------------------------------------

  /** @java TrackSiteMove.isStatic() */
  public isStatic(): boolean {
    const playerIsStatic = (this.player as unknown as { isStatic?(): boolean })?.isStatic;
    let isStatic = typeof playerIsStatic === "function" ? playerIsStatic.call(this.player) : false;
    if (this.steps !== null) {
      const stepsIsStatic = (this.steps as unknown as { isStatic?(): boolean })?.isStatic;
      isStatic = isStatic && (typeof stepsIsStatic === "function" ? stepsIsStatic.call(this.steps) : false);
    }
    if (this.currentLocation !== null) {
      const locIsStatic = (this.currentLocation as unknown as { isStatic?(): boolean })?.isStatic;
      isStatic = isStatic && (typeof locIsStatic === "function" ? locIsStatic.call(this.currentLocation) : false);
    }
    return isStatic;
  }

  /** @java TrackSiteMove.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    for (const c of this.player.concepts(game)) concepts.add(c);
    if (this.steps !== null) {
      for (const c of this.steps.concepts(game)) concepts.add(c);
    }
    if (this.currentLocation !== null) {
      for (const c of this.currentLocation.concepts(game)) concepts.add(c);
    }
    return concepts;
  }

  /** @java TrackSiteMove.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    for (const c of this.player.writesEvalContextRecursive()) writeEvalContext.add(c);
    if (this.steps !== null) {
      for (const c of this.steps.writesEvalContextRecursive()) writeEvalContext.add(c);
    }
    if (this.currentLocation !== null) {
      for (const c of this.currentLocation.writesEvalContextRecursive()) writeEvalContext.add(c);
    }
    return writeEvalContext;
  }

  /** @java TrackSiteMove.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    for (const c of this.player.readsEvalContextRecursive()) readEvalContext.add(c);
    if (this.steps !== null) {
      for (const c of this.steps.readsEvalContextRecursive()) readEvalContext.add(c);
    }
    if (this.currentLocation !== null) {
      for (const c of this.currentLocation.readsEvalContextRecursive()) readEvalContext.add(c);
    }
    return readEvalContext;
  }

  /** @java TrackSiteMove.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    const gameAny = game as unknown as { hasTrack(): boolean; addRequirementToReport(s: string): void };
    if (typeof gameAny.hasTrack === "function" && !gameAny.hasTrack()) {
      gameAny.addRequirementToReport("The ludeme (trackSite Move ...) is used but the board has no tracks.");
      missingRequirement = true;
    }
    missingRequirement = missingRequirement || this.player.missingRequirement(game);
    if (this.steps !== null)
      missingRequirement = missingRequirement || this.steps.missingRequirement(game);
    if (this.currentLocation !== null)
      missingRequirement = missingRequirement || this.currentLocation.missingRequirement(game);
    return missingRequirement;
  }

  /** @java TrackSiteMove.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.player.willCrash(game);
    if (this.steps !== null)
      willCrash = willCrash || this.steps.willCrash(game);
    if (this.currentLocation !== null)
      willCrash = willCrash || this.currentLocation.willCrash(game);
    return willCrash;
  }

  /** @java TrackSiteMove.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    return this.steps.toEnglish(game) + " steps forward from site " +
      (this.currentLocation ? this.currentLocation.toEnglish(game) : "current") +
      " on track " + this.name;
  }
}
