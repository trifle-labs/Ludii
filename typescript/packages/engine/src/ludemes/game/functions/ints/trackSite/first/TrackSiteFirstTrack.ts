// @java Core/src/game/functions/ints/trackSite/first/TrackSiteFirstTrack.java

/**
 * Returns the first site of a track.
 *
 * @java game/functions/ints/trackSite/first/TrackSiteFirstTrack.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";
import { BooleanConstant } from "../../../booleans/BooleanConstant.js";
import type { BaseBooleanFunction } from "../../../booleans/BaseBooleanFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;
/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Convert a Java RoleType string ("Mover", "Next", "P1", "All", etc.) to
 * an IntFunction that evaluates to the corresponding player index.
 * @java game/types/play/RoleType.java — matches Java's player resolution.
 */
function roleTypeToIntFn(role: string): JavaIntFunction {
  switch (role) {
    case "Mover":
      return { eval: (ctx: Context) => ctx.state.mover } as unknown as JavaIntFunction;
    case "Next":
      return {
        eval: (ctx: Context) =>
          (ctx.state.mover % (ctx.game as { numPlayers: number }).numPlayers) + 1,
      } as unknown as JavaIntFunction;
    case "Prev":
      return {
        eval: (ctx: Context) => {
          const np = (ctx.game as { numPlayers: number }).numPlayers;
          return ((ctx.state.mover - 2 + np) % np) + 1;
        },
      } as unknown as JavaIntFunction;
    case "Shared":
    case "Neutral":
    case "All":
      return { eval: (_ctx: Context) => 0 } as unknown as JavaIntFunction;
    default: {
      // "P1" → 1, "P2" → 2, etc.
      if (/^P\d+$/.test(role)) {
        const pid = Number(role.slice(1));
        return { eval: (_ctx: Context) => pid } as unknown as JavaIntFunction;
      }
      return { eval: (_ctx: Context) => 0 } as unknown as JavaIntFunction;
    }
  }
}

/** Minimal track element shape (Java: Track.TrackElem). */
interface TrackElem {
  readonly site: number;
  readonly next?: number;
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
  to(): number;
  setTo(v: number): void;
}

/**
 * Returns the first site of a track satisfying a condition.
 *
 * @java game/functions/ints/trackSite/first/TrackSiteFirstTrack.java
 */
export class TrackSiteFirstTrack extends BaseIntFunction {

  /** @java TrackSiteFirstTrack.name */
  private readonly name: string | null;

  /** @java TrackSiteFirstTrack.pidFn */
  private readonly pidFn: JavaIntFunction | null;

  /** @java TrackSiteFirstTrack.fromFn */
  private readonly fromFn: JavaIntFunction | null;

  /** @java TrackSiteFirstTrack.condFn */
  private readonly condFn: BaseBooleanFunction;

  /** @java TrackSiteFirstTrack.precomputedValue */
  private precomputedValue: number = OFF;

  /**
   * @param player The player as an IntFunction (exclusive with role).
   * @param role   The role of the player as a RoleType string (e.g. "Mover",
   *               "Next", "P1"). Exclusive with player.
   * @param name   The name of the track.
   * @param from   The site from where to look.
   * @param If     The condition to verify for that site.
   *
   * @java TrackSiteFirstTrack(Player, RoleType, String, IntFunction, BooleanFunction)
   */
  public constructor(
    player: JavaIntFunction | null,
    role: string | null,
    name: string | null,
    from: JavaIntFunction | null,
    If: BaseBooleanFunction | null,
  ) {
    super();
    this.name = name;
    // Java: player and role are mutually exclusive (@Or); resolve role to an
    // IntFunction so playerId is always evaluated dynamically.
    // @java TrackSiteFirstTrack: when role != null, pid = role.owner(state)
    if (player !== null) {
      this.pidFn = player;
    } else if (role !== null && role !== undefined) {
      this.pidFn = roleTypeToIntFn(role as string);
    } else {
      this.pidFn = null;
    }
    this.fromFn = (from === null) ? null : from;
    this.condFn = (If === null) ? new BooleanConstant(true) : If;
  }

  //-------------------------------------------------------------------------

  /**
   * @java TrackSiteFirstTrack.eval(Context)
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

    // Get first site.
    const from = (this.fromFn === null) ? UNDEFINED : this.fromFn.eval(context);
    let found = false;
    let i = 0;
    for (; i < track.elems().length; i++) {
      const site = track.elems()[i]!.site;
      if (from === UNDEFINED || site === from) {
        found = true;
        break;
      }
    }

    if (!found)
      return UNDEFINED;

    found = false;
    // Save and restore the context's "to" scratch value.
    const origTo: number = (typeof ctxAny.to === "function") ? ctxAny.to() : context._evalTo;

    // Check the condition.
    for (let j = i; j < track.elems().length + i; j++) {
      const index = j % track.elems().length;
      const site = track.elems()[index]!.site;
      // Set the "to" scratch on context so condition can read it.
      if (typeof ctxAny.setTo === "function") {
        ctxAny.setTo(site);
      } else {
        context._evalTo = site;
      }
      if (this.condFn.eval(context)) {
        found = true;
        i = index;
        break;
      }
    }

    // Restore.
    if (typeof ctxAny.setTo === "function") {
      ctxAny.setTo(origTo);
    } else {
      context._evalTo = origTo;
    }

    if (!found)
      return UNDEFINED;

    return track.elems()[i]!.site;
  }

  //-------------------------------------------------------------------------

  /** @java TrackSiteFirstTrack.isStatic() */
  public isStatic(): boolean {
    const pidFnStatic = (this.pidFn as unknown as { isStatic?(): boolean })?.isStatic;
    if (this.pidFn !== null && typeof pidFnStatic === "function" && !pidFnStatic.call(this.pidFn))
      return false;

    if (this.condFn !== null && !this.condFn.isStatic())
      return false;

    const pidFnStatic2 = (this.pidFn as unknown as { isStatic?(): boolean })?.isStatic;
    return this.pidFn === null || (typeof pidFnStatic2 === "function" && pidFnStatic2.call(this.pidFn));
  }

  /** @java TrackSiteFirstTrack.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    if (this.pidFn !== null) {
      for (const c of this.pidFn.concepts(game)) concepts.add(c);
    }
    if (this.fromFn !== null) {
      for (const c of this.fromFn.concepts(game)) concepts.add(c);
    }
    if (this.condFn !== null) {
      for (const c of this.condFn.concepts(game)) concepts.add(c);
    }
    return concepts;
  }

  /** @java TrackSiteFirstTrack.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    if (this.pidFn !== null) {
      for (const c of this.pidFn.writesEvalContextRecursive()) writeEvalContext.add(c);
    }
    if (this.fromFn !== null) {
      for (const c of this.fromFn.writesEvalContextRecursive()) writeEvalContext.add(c);
    }
    if (this.condFn !== null) {
      for (const c of this.condFn.writesEvalContextRecursive()) writeEvalContext.add(c);
    }
    return writeEvalContext;
  }

  /** @java TrackSiteFirstTrack.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    if (this.pidFn !== null) {
      for (const c of this.pidFn.readsEvalContextRecursive()) readEvalContext.add(c);
    }
    if (this.fromFn !== null) {
      for (const c of this.fromFn.readsEvalContextRecursive()) readEvalContext.add(c);
    }
    if (this.condFn !== null) {
      for (const c of this.condFn.readsEvalContextRecursive()) readEvalContext.add(c);
    }
    return readEvalContext;
  }

  /** @java TrackSiteFirstTrack.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    const gameAny = game as unknown as { hasTrack(): boolean; addRequirementToReport(s: string): void };
    if (typeof gameAny.hasTrack === "function" && !gameAny.hasTrack()) {
      gameAny.addRequirementToReport("The ludeme (trackSite EndTrack ...) is used but the board has no tracks.");
      missingRequirement = true;
    }
    if (this.pidFn !== null)
      missingRequirement = missingRequirement || this.pidFn.missingRequirement(game);
    if (this.fromFn !== null)
      missingRequirement = missingRequirement || this.fromFn.missingRequirement(game);
    if (this.condFn !== null)
      missingRequirement = missingRequirement || this.condFn.missingRequirement(game);
    return missingRequirement;
  }

  /** @java TrackSiteFirstTrack.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    if (this.pidFn !== null)
      willCrash = willCrash || this.pidFn.willCrash(game);
    if (this.fromFn !== null)
      willCrash = willCrash || this.fromFn.willCrash(game);
    if (this.condFn !== null)
      willCrash = willCrash || this.condFn.willCrash(game);
    return willCrash;
  }

  /** @java TrackSiteFirstTrack.toString() */
  public override toString(): string {
    return "";
  }

  /** @java TrackSiteFirstTrack.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the first site of track \"" + this.name + "\"";
  }
}
