// @java Core/src/game/functions/ints/count/stepsOnTrack/CountStepsOnTrack.java

/**
 * Returns the number of steps between two sites.
 *
 * @java game/functions/ints/count/stepsOnTrack/CountStepsOnTrack.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Minimal inline "Mover" function to mirror game.functions.ints.state.Mover().
 * @java game.functions.ints.state.Mover
 */
function makeMoverFn(): JavaIntFunction {
  return {
    eval(context: Context): number { return context.state.mover; },
    exceeds(context: Context, other: JavaIntFunction): boolean { return context.state.mover > other.eval(context); },
    isHint(): boolean { return false; },
    isHand(): boolean { return false; },
    concepts(_game: unknown): Set<number> { return new Set(); },
    readsEvalContextRecursive(): Set<number> { return new Set(); },
    writesEvalContextRecursive(): Set<number> { return new Set(); },
    missingRequirement(_game: unknown): boolean { return false; },
    willCrash(_game: unknown): boolean { return false; },
    toEnglish(_game: unknown): string { return "current moving player"; },
  };
}

/**
 * Minimal Track interface.
 * @java game.equipment.container.board.Track
 */
interface Track {
  name(): string;
  owner(): number;
  islooped(): boolean;
  trackIdx(): number;
  elems(): Array<{ site: number }>;
  ownedTracks?(playerId: number): Track[];
}

/**
 * Returns the number of steps between two sites on a track.
 *
 * @java game/functions/ints/count/stepsOnTrack/CountStepsOnTrack.java
 */
export class CountStepsOnTrack extends BaseIntFunction {
  /** The first site. @java CountStepsOnTrack.site1Fn */
  private readonly site1Fn: JavaIntFunction;

  /** The second site. @java CountStepsOnTrack.site2Fn */
  private readonly site2Fn: JavaIntFunction;

  /** Which player. @java CountStepsOnTrack.player */
  private readonly player: JavaIntFunction;

  /** Track name. @java CountStepsOnTrack.name */
  private readonly name: string | null;

  /** Pre-computed track if we are sure of the track. @java CountStepsOnTrack.preComputedTrack */
  private readonly preComputedTrack: Track | null = null;

  /**
   * @param role   The role of the owner of the track [Mover].
   * @param player The player ludeme.
   * @param name   The name of the track.
   * @param site1  The first site.
   * @param site2  The second site.
   * @java CountStepsOnTrack(RoleType, Player, String, IntFunction, IntFunction)
   */
  public constructor(
    playerFn: JavaIntFunction | null,
    name: string | null,
    site1: JavaIntFunction,
    site2: JavaIntFunction,
  ) {
    super();
    this.player = (playerFn !== null && playerFn !== undefined) ? playerFn : makeMoverFn();
    this.site1Fn = site1;
    this.site2Fn = site2;
    this.name = name;
  }

  /**
   * @java CountStepsOnTrack.eval(Context)
   *
   * Returns the number of steps between site1 and site2 on the track.
   * Faithfully mirrors the Java logic including looped and non-looped tracks.
   */
  public override eval(context: Context): number {
    const playerId = this.player.eval(context);
    let track: Track | null = this.preComputedTrack;

    type BoardType = {
      tracks(): Track[];
      ownedTracks(playerId: number): Track[];
      defaultSite(): string;
    };
    type GameType = {
      board?: () => BoardType;
      hasInternalLoopInTrack?(): boolean;
    };
    const game = (context as unknown as { game?: GameType }).game;

    const board = game?.board?.();

    // Java: if (name != null) for track in context.game().board().tracks() ...
    if (this.name !== null && board) {
      const tracks = board.tracks();
      for (const t of tracks) {
        if (t.name().includes(this.name) && t.owner() === playerId) {
          track = t;
          break;
        }
      }
    }

    if (track === null && board) {
      // Java: Track[] tracks = context.board().ownedTracks(playerId);
      const tracks = board.ownedTracks(playerId);
      if (tracks.length !== 0) {
        track = tracks[0]!;
      } else {
        const tracksWithNoOwner = board.ownedTracks(0);
        if (tracksWithNoOwner.length !== 0) {
          track = tracksWithNoOwner[0]!;
        }
      }
    }

    if (track === null)
      return OFF; // no track for this player

    const site1 = this.site1Fn.eval(context);
    const site2 = this.site2Fn.eval(context);

    const currentLoc = site1;

    const elems = track.elems();
    let i = elems.length;

    // Java: if (!track.islooped() && context.game().hasInternalLoopInTrack())
    const hasInternalLoopInTrack = (game as unknown as { hasInternalLoopInTrack?(): boolean })?.hasInternalLoopInTrack?.() ?? false;

    if (!track.islooped() && hasInternalLoopInTrack) {
      if (currentLoc < 0)
        return OFF;

      // Java: ContainerState cs = context.containerState(context.containerId()[currentLoc]);
      const containerIdArr = (context as unknown as {
        containerId?: () => number[];
      }).containerId?.();
      const containerId = containerIdArr ? containerIdArr[currentLoc] ?? 0 : 0;

      const cs = (context as unknown as {
        containerState?: (idx: number) => {
          what(site: number, type: string): number;
          who(site: number, level: number, type: string): number;
          what(site: number, level: number, type: string): number;
          sizeStack(site: number, type: string): number;
        };
      }).containerState?.(containerId);

      const defaultSite = board?.defaultSite() ?? "Cell";

      let what = cs ? (cs as unknown as { what(s: number, t: string): number }).what(currentLoc, defaultSite) : 0;

      // Java: for stacking game, get piece owned by owner of track
      const sizeStack = cs ? cs.sizeStack(currentLoc, defaultSite) : 0;
      for (let lvl = 0; lvl < sizeStack; lvl++) {
        const who = cs ? cs.who(currentLoc, lvl, defaultSite) : 0;
        if (who === playerId) {
          what = cs ? cs.what(currentLoc, lvl, defaultSite) : 0;
          break;
        }
      }

      // Java: if (what != 0) { use onTrackIndices ... } else { linear scan }
      if (what !== 0) {
        // Java: OnTrackIndices onTrackIndices = context.state().onTrackIndices();
        const onTrackIndices = (context as unknown as {
          state?: { onTrackIndices?: () => {
            locToIndex(trackIdx: number, loc: number): { size(): number; getQuick(j: number): number };
            whats(trackIdx: number, what: number, index: number): number;
          }};
        }).state?.onTrackIndices?.();

        const trackIdx = track.trackIdx();

        if (onTrackIndices) {
          const locsToIndex = onTrackIndices.locToIndex(trackIdx, currentLoc);
          for (let j = 0; j < locsToIndex.size(); j++) {
            const index = locsToIndex.getQuick(j);
            const count = onTrackIndices.whats(trackIdx, what, index);
            if (count > 0) {
              i = index;
              break;
            }
          }
        }
      } else {
        // Java: for (i = 0; i < track.elems().length; i++) if (track.elems()[i].site == currentLoc) break;
        for (i = 0; i < elems.length; i++) {
          if (elems[i]!.site === currentLoc) break;
        }
      }

      let count = 0;
      for (; i < elems.length; i++) {
        if (elems[i]!.site === site2) return count;
        count++;
      }
    } else {
      // Java: if the track is a full loop
      for (i = 0; i < elems.length; i++) {
        if (elems[i]!.site === currentLoc) break;
      }

      const index = i;
      let count = 0;
      for (; i < elems.length; i++) {
        if (elems[i]!.site === site2) return count;
        count++;
      }

      for (i = 0; i < index; i++) {
        if (elems[i]!.site === site2) return count;
        count++;
      }
    }

    return OFF;
  }

  /** @java CountStepsOnTrack.isStatic() */
  public isStatic(): boolean {
    return (this.player as unknown as { isStatic?(): boolean }).isStatic?.() ?? false
      && (this.site1Fn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false
      && (this.site2Fn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
  }

  /** @java CountStepsOnTrack.toString() */
  public override toString(): string {
    return "CountStepsOnTrack()";
  }

  /** @java CountStepsOnTrack.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    for (const bit of this.site1Fn.concepts(game)) concepts.add(bit);
    for (const bit of this.site2Fn.concepts(game)) concepts.add(bit);
    for (const bit of this.player.concepts(game)) concepts.add(bit);
    return concepts;
  }

  /** @java CountStepsOnTrack.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    for (const bit of this.site1Fn.writesEvalContextRecursive()) writeEvalContext.add(bit);
    for (const bit of this.site2Fn.writesEvalContextRecursive()) writeEvalContext.add(bit);
    for (const bit of this.player.writesEvalContextRecursive()) writeEvalContext.add(bit);
    return writeEvalContext;
  }

  /** @java CountStepsOnTrack.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    for (const bit of this.site1Fn.readsEvalContextRecursive()) readEvalContext.add(bit);
    for (const bit of this.site2Fn.readsEvalContextRecursive()) readEvalContext.add(bit);
    for (const bit of this.player.readsEvalContextRecursive()) readEvalContext.add(bit);
    return readEvalContext;
  }

  /** @java CountStepsOnTrack.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.player as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.site1Fn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.site2Fn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
  }

  /** @java CountStepsOnTrack.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    // Java: if (!game.hasTrack()) { report; missingRequirement = true; }
    const hasTrack = (game as unknown as { hasTrack?(): boolean }).hasTrack?.() ?? true;
    if (!hasTrack) {
      const addReq = (game as unknown as { addRequirementToReport?(s: string): void }).addRequirementToReport;
      if (typeof addReq === "function") {
        addReq.call(game, "The ludeme (count StepsOnTrack ...) is used but the board has no defined tracks.");
      }
      missingRequirement = true;
    }
    missingRequirement = missingRequirement || this.player.missingRequirement(game);
    missingRequirement = missingRequirement || this.site1Fn.missingRequirement(game);
    missingRequirement = missingRequirement || this.site2Fn.missingRequirement(game);
    return missingRequirement;
  }

  /** @java CountStepsOnTrack.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.player.willCrash(game);
    willCrash = willCrash || this.site1Fn.willCrash(game);
    willCrash = willCrash || this.site2Fn.willCrash(game);
    return willCrash;
  }
}
