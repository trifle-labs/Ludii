// @java Core/src/game/functions/ints/board/where/WhereLevel.java

/**
 * Returns the level of a piece if it is on the site, else OFF (-1).
 *
 * @java game/functions/ints/board/where/WhereLevel.java
 * @author Eric.Piette
 * @remarks The name of the piece can be specific without the number on it
 *          because the owner is also specified in the ludeme.
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;
/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED_CONST = -1;
/** Java parity: Constants.NO_PIECE = 0 */
const NO_PIECE = 0;

/**
 * Minimal interface for a BooleanFunction as used within WhereLevel.
 */
interface JavaBoolFn {
  eval(context: Context): boolean;
  missingRequirement(game: unknown): boolean;
  willCrash(game: unknown): boolean;
  concepts(game: unknown): Set<number>;
  writesEvalContextRecursive(): Set<number>;
  readsEvalContextRecursive(): Set<number>;
  isStatic?(): boolean;
}

/**
 * Returns the level of a piece in a stack at the given site, else OFF (-1).
 *
 * Java eval:
 *   site = siteFn.eval(context)
 *   if site out-of-range return OFF
 *   topLevel = cs.sizeStack(site, type) - 1
 *   if fromTop: scan level topLevel→0; else 0→topLevel
 *   if cs.what(site, level, type) == what (and optionally cs.state == localState) return level
 *   return OFF
 *
 * @java game/functions/ints/board/where/WhereLevel.java
 */
export class WhereLevel extends BaseIntFunction {
  /** The name of the piece. @java WhereLevel.namePiece */
  private readonly namePiece: string | null;

  /** The index of the owner. @java WhereLevel.playerFn */
  private readonly playerFn: JavaIntFunction | null;

  /** The index of the piece. @java WhereLevel.whatFn */
  private readonly whatFn: JavaIntFunction | null;

  /** The site to check. @java WhereLevel.siteFn */
  private readonly siteFn: JavaIntFunction;

  /** If true, check the stack from the top. @java WhereLevel.fromTopFn */
  private readonly fromTopFn: JavaBoolFn;

  /** The local state of the piece. @java WhereLevel.localStateFn */
  private readonly localStateFn: JavaIntFunction | null;

  /** Cell/Edge/Vertex. @java WhereLevel.type */
  private readonly type: SiteType | null;

  /**
   * Name+player constructor.
   * @java WhereLevel(String, IntFunction|RoleType, IntFunction, SiteType, IntFunction, BooleanFunction)
   */
  public static byName(
    namePiece: string,
    playerFn: JavaIntFunction,
    localStateFn: JavaIntFunction | null,
    type: SiteType | null,
    siteFn: JavaIntFunction,
    fromTopFn: JavaBoolFn | null,
  ): WhereLevel {
    return new WhereLevel(namePiece, playerFn, null, localStateFn, type, siteFn, fromTopFn);
  }

  /**
   * What-index constructor.
   * @java WhereLevel(IntFunction, SiteType, IntFunction, BooleanFunction)
   */
  public static byWhat(
    whatFn: JavaIntFunction,
    type: SiteType | null,
    siteFn: JavaIntFunction,
    fromTopFn: JavaBoolFn | null,
  ): WhereLevel {
    return new WhereLevel(null, null, whatFn, null, type, siteFn, fromTopFn);
  }

  private constructor(
    namePiece: string | null,
    playerFn: JavaIntFunction | null,
    whatFn: JavaIntFunction | null,
    localStateFn: JavaIntFunction | null,
    type: SiteType | null,
    siteFn: JavaIntFunction,
    fromTopFn: JavaBoolFn | null,
  ) {
    super();
    this.namePiece = namePiece;
    this.playerFn = playerFn;
    this.whatFn = whatFn;
    this.localStateFn = localStateFn;
    this.type = type;
    this.siteFn = siteFn;
    // Java: (fromTop == null) ? new BooleanConstant(true) : fromTop
    this.fromTopFn = fromTopFn ?? { eval: () => true, missingRequirement: () => false, willCrash: () => false, concepts: () => new Set(), writesEvalContextRecursive: () => new Set(), readsEvalContextRecursive: () => new Set() };
  }

  /**
   * @java WhereLevel.eval(Context)
   *
   * Accesses the container state to find the level of the matching piece in a
   * stack at the given site.
   */
  public override eval(context: Context): number {
    // Java: context.board().numSites() and context.containerState(0)
    const ctx = context as unknown as {
      board?: () => { numSites(): number };
      containerState?: (idx: number) => {
        sizeStack(site: number, type: SiteType | null): number;
        what(site: number, level: number, type: SiteType | null): number;
        state(site: number, level: number, type: SiteType | null): number;
      };
    };

    const numSite = ctx.board?.().numSites() ?? context.game.numSites;
    const cs = ctx.containerState?.(0);

    const site = this.siteFn.eval(context);

    if (site < 0 || site >= numSite)
      return OFF;

    const fromTop = this.fromTopFn.eval(context);
    let what = OFF;

    if (this.whatFn !== null) {
      // what-index path
      what = this.whatFn.eval(context);
      if (what <= NO_PIECE) return OFF;

      const localState = this.localStateFn !== null
        ? this.localStateFn.eval(context)
        : UNDEFINED_CONST;

      if (cs) {
        const topLevel = cs.sizeStack(site, this.type) - 1;
        if (fromTop) {
          for (let level = topLevel; level >= 0; level--) {
            if (cs.what(site, level, this.type) === what) {
              if (localState === UNDEFINED_CONST || cs.state(site, level, this.type) === localState)
                return level;
            }
          }
        } else {
          for (let level = 0; level <= topLevel; level++) {
            if (cs.what(site, level, this.type) === what) {
              if (localState === UNDEFINED_CONST || cs.state(site, level, this.type) === localState)
                return level;
            }
          }
        }
      } else {
        // Fallback: use TS state stack API
        const topLevel = context.state.stackSize(site) - 1;
        if (fromTop) {
          for (let level = topLevel; level >= 0; level--) {
            if (context.state.whatAtSiteLevel(site, level) === what) return level;
          }
        } else {
          for (let level = 0; level <= topLevel; level++) {
            if (context.state.whatAtSiteLevel(site, level) === what) return level;
          }
        }
      }
    } else {
      // player+name path
      if (this.playerFn === null) return OFF;
      const playerId = this.playerFn.eval(context);

      // Java: iterate matchingNameComponents to find a component owned by playerId
      // We use the TS state API as fallback
      if (cs) {
        // matchingNameComponents lookup: walk the stack looking for the player's piece
        // Since we don't have precomputed matchingNameComponents here, we match by owner
        const localState = this.localStateFn !== null
          ? this.localStateFn.eval(context)
          : UNDEFINED_CONST;
        const topLevel = cs.sizeStack(site, this.type) - 1;
        if (fromTop) {
          for (let level = topLevel; level >= 0; level--) {
            const pieceWhat = cs.what(site, level, this.type);
            if (pieceWhat > NO_PIECE) {
              // We can't easily check owner from ContainerState here; fall through to TS path
            }
          }
        }
      }

      // TS state fallback: match by owner at each stack level
      const topLevel = context.state.stackSize(site) - 1;
      if (fromTop) {
        for (let level = topLevel; level >= 0; level--) {
          if (context.state.whoAtSiteLevel(site, level) === playerId) return level;
        }
      } else {
        for (let level = 0; level <= topLevel; level++) {
          if (context.state.whoAtSiteLevel(site, level) === playerId) return level;
        }
      }
    }

    return OFF;
  }

  /** @java WhereLevel.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java WhereLevel.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = false;
    if (this.playerFn !== null) missing = missing || this.playerFn.missingRequirement(game);
    if (this.whatFn !== null) missing = missing || this.whatFn.missingRequirement(game);
    if (this.localStateFn !== null) missing = missing || this.localStateFn.missingRequirement(game);
    missing = missing || this.siteFn.missingRequirement(game);
    missing = missing || this.fromTopFn.missingRequirement(game);
    return missing;
  }

  /** @java WhereLevel.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    if (this.playerFn !== null) crash = crash || this.playerFn.willCrash(game);
    if (this.whatFn !== null) crash = crash || this.whatFn.willCrash(game);
    if (this.localStateFn !== null) crash = crash || this.localStateFn.willCrash(game);
    crash = crash || this.siteFn.willCrash(game);
    crash = crash || this.fromTopFn.willCrash(game);
    return crash;
  }

  /** @java WhereLevel.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const s = new Set<number>();
    if (this.playerFn !== null) for (const x of this.playerFn.concepts(game)) s.add(x);
    if (this.whatFn !== null) for (const x of this.whatFn.concepts(game)) s.add(x);
    if (this.localStateFn !== null) for (const x of this.localStateFn.concepts(game)) s.add(x);
    for (const x of this.siteFn.concepts(game)) s.add(x);
    for (const x of this.fromTopFn.concepts(game)) s.add(x);
    return s;
  }

  /** @java WhereLevel.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    if (this.playerFn !== null) for (const x of this.playerFn.writesEvalContextRecursive()) s.add(x);
    if (this.whatFn !== null) for (const x of this.whatFn.writesEvalContextRecursive()) s.add(x);
    if (this.localStateFn !== null) for (const x of this.localStateFn.writesEvalContextRecursive()) s.add(x);
    for (const x of this.siteFn.writesEvalContextRecursive()) s.add(x);
    for (const x of this.fromTopFn.writesEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java WhereLevel.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    if (this.playerFn !== null) for (const x of this.playerFn.readsEvalContextRecursive()) s.add(x);
    if (this.whatFn !== null) for (const x of this.whatFn.readsEvalContextRecursive()) s.add(x);
    if (this.localStateFn !== null) for (const x of this.localStateFn.readsEvalContextRecursive()) s.add(x);
    for (const x of this.siteFn.readsEvalContextRecursive()) s.add(x);
    for (const x of this.fromTopFn.readsEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java WhereLevel.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    const pieceName = this.namePiece ?? "piece";
    return "the level of the " + pieceName + " on " + (this.type ?? "cell").toLowerCase()
      + " " + this.siteFn.toEnglish(_game);
  }
}
