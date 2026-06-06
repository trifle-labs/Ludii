// @java Core/src/game/functions/ints/board/where/WhereSite.java

/**
 * Returns the site of a piece if it is on the board, else OFF (-1).
 *
 * @java game/functions/ints/board/where/WhereSite.java
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
 * Returns the site of a piece if it is on the board, else OFF (-1).
 *
 * Java eval (name+player form):
 *   find component matching namePiece + playerId → what
 *   scan owned sites for playerId/what; return first match
 *
 * Java eval (what-index form):
 *   what = whatFn.eval(context)
 *   if stacking: scan all sites/levels for cs.what == what
 *   else: scan all sites for cs.what == what
 *
 * @java game/functions/ints/board/where/WhereSite.java
 */
export class WhereSite extends BaseIntFunction {
  /** The name of the piece. @java WhereSite.namePiece */
  private readonly namePiece: string | null;

  /** The index of the owner. @java WhereSite.playerFn */
  private readonly playerFn: JavaIntFunction | null;

  /** The index of the piece. @java WhereSite.whatFn */
  private readonly whatFn: JavaIntFunction | null;

  /** The local state of the piece. @java WhereSite.localStateFn */
  private readonly localStateFn: JavaIntFunction | null;

  /** Cell/Edge/Vertex. @java WhereSite.type */
  private readonly type: SiteType | null;

  /**
   * Name+player constructor.
   * @java WhereSite(String, IntFunction|RoleType, IntFunction, SiteType)
   */
  public static byName(
    namePiece: string,
    playerFn: JavaIntFunction,
    localStateFn: JavaIntFunction | null,
    type: SiteType | null,
  ): WhereSite {
    return new WhereSite(namePiece, playerFn, null, localStateFn, type);
  }

  /**
   * What-index constructor.
   * @java WhereSite(IntFunction, SiteType)
   */
  public static byWhat(
    whatFn: JavaIntFunction,
    type: SiteType | null,
  ): WhereSite {
    return new WhereSite(null, null, whatFn, null, type);
  }

  private constructor(
    namePiece: string | null,
    playerFn: JavaIntFunction | null,
    whatFn: JavaIntFunction | null,
    localStateFn: JavaIntFunction | null,
    type: SiteType | null,
  ) {
    super();
    this.namePiece = namePiece;
    this.playerFn = playerFn;
    this.whatFn = whatFn;
    this.localStateFn = localStateFn;
    this.type = type;
  }

  /**
   * @java WhereSite.eval(Context)
   *
   * Scans the board to find the first site where the named/indexed piece lives.
   */
  public override eval(context: Context): number {
    // Java: context.board().numSites() and context.containerState(0)
    const ctx = context as unknown as {
      board?: () => { numSites(): number };
      containerState?: (idx: number) => {
        what(site: number, type: SiteType | null): number;
        what(site: number, level: number, type: SiteType | null): number;
        state(site: number, type: SiteType | null): number;
        state(site: number, level: number, type: SiteType | null): number;
        sizeStack(site: number, type: SiteType | null): number;
      };
      state?: () => {
        owned?: () => {
          sites(playerId: number, what: number): { size(): number; getQuick(i: number): number };
        };
      };
    };

    const numSite = ctx.board?.().numSites() ?? context.game.numSites;
    const cs = ctx.containerState?.(0);

    const localState = this.localStateFn !== null
      ? this.localStateFn.eval(context)
      : UNDEFINED_CONST;

    let what = OFF;

    if (this.whatFn !== null) {
      // what-index path
      what = this.whatFn.eval(context);
      if (what <= NO_PIECE) return OFF;

      if (cs) {
        // Java: if (context.game().isStacking()) { ... } else { ... }
        const isStacking = (context.game as unknown as { isStacking?: () => boolean }).isStacking?.() ?? false;

        if (isStacking) {
          for (let site = 0; site < numSite; site++) {
            const stackSize = (cs as unknown as { sizeStack(s: number, t: SiteType | null): number }).sizeStack(site, this.type);
            for (let level = 0; level < stackSize; level++) {
              if ((cs as unknown as { what(s: number, l: number, t: SiteType | null): number }).what(site, level, this.type) === what) {
                if (localState === UNDEFINED_CONST
                  || (cs as unknown as { state(s: number, l: number, t: SiteType | null): number }).state(site, level, this.type) === localState)
                  return site;
              }
            }
          }
        } else {
          for (let site = 0; site < numSite; site++) {
            if ((cs as unknown as { what(s: number, t: SiteType | null): number }).what(site, this.type) === what) {
              if (localState === UNDEFINED_CONST
                || (cs as unknown as { state(s: number, t: SiteType | null): number }).state(site, this.type) === localState)
                return site;
            }
          }
        }
      } else {
        // TS state fallback
        for (let site = 0; site < numSite; site++) {
          if (context.state.whatAtSite(site) === what) return site;
        }
      }
    } else {
      // player+name path
      if (this.playerFn === null) return OFF;
      const playerId = this.playerFn.eval(context);

      // Java: find what via matchingNameComponents for playerId
      // In TS fallback: scan state.cells for owner match, optionally filter by name
      const game = context.game as unknown as {
        isStacking?: () => boolean;
        equipment?: {
          pieces?: Array<{ name: string; owner: number; index: number }>;
        };
      };

      if (this.namePiece !== null && game.equipment?.pieces) {
        const matchingPieces = game.equipment.pieces.filter(
          p => p.name.includes(this.namePiece!) && p.owner === playerId
        );
        for (const piece of matchingPieces) {
          what = piece.index;
          break;
        }
      }

      if (what <= OFF) {
        // Java: if (what <= Constants.OFF) return Constants.OFF
        // Try scanning by owner
        for (let site = 0; site < numSite; site++) {
          if (context.state.cells[site] === playerId) return site;
        }
        return OFF;
      }

      // Java: TIntArrayList sites = context.state().owned().sites(playerId, what)
      const ownedSites = ctx.state?.()?.owned?.()?.sites(playerId, what);
      if (ownedSites) {
        const isStacking = game.isStacking?.() ?? false;
        if (isStacking && cs) {
          for (let i = 0; i < ownedSites.size(); i++) {
            const site = ownedSites.getQuick(i);
            if (site < numSite) {
              const stackSize = (cs as unknown as { sizeStack(s: number, t: SiteType | null): number }).sizeStack(site, this.type);
              for (let level = 0; level < stackSize; level++) {
                if ((cs as unknown as { what(s: number, l: number, t: SiteType | null): number }).what(site, level, this.type) === what) {
                  if (localState === UNDEFINED_CONST
                    || (cs as unknown as { state(s: number, l: number, t: SiteType | null): number }).state(site, level, this.type) === localState)
                    return site;
                }
              }
            }
          }
        } else {
          for (let i = 0; i < ownedSites.size(); i++) {
            const site = ownedSites.getQuick(i);
            if (site < numSite && context.state.whatAtSite(site) === what) {
              if (localState === UNDEFINED_CONST) return site;
            }
          }
        }
      } else {
        // Fallback: linear scan
        for (let site = 0; site < numSite; site++) {
          if (context.state.whatAtSite(site) === what) return site;
        }
      }
    }

    return OFF;
  }

  /** @java WhereSite.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java WhereSite.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = false;
    if (this.playerFn !== null) missing = missing || this.playerFn.missingRequirement(game);
    if (this.whatFn !== null) missing = missing || this.whatFn.missingRequirement(game);
    if (this.localStateFn !== null) missing = missing || this.localStateFn.missingRequirement(game);
    return missing;
  }

  /** @java WhereSite.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    if (this.playerFn !== null) crash = crash || this.playerFn.willCrash(game);
    if (this.whatFn !== null) crash = crash || this.whatFn.willCrash(game);
    if (this.localStateFn !== null) crash = crash || this.localStateFn.willCrash(game);
    return crash;
  }

  /** @java WhereSite.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const s = new Set<number>();
    if (this.playerFn !== null) for (const x of this.playerFn.concepts(game)) s.add(x);
    if (this.whatFn !== null) for (const x of this.whatFn.concepts(game)) s.add(x);
    if (this.localStateFn !== null) for (const x of this.localStateFn.concepts(game)) s.add(x);
    return s;
  }

  /** @java WhereSite.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    if (this.playerFn !== null) for (const x of this.playerFn.writesEvalContextRecursive()) s.add(x);
    if (this.whatFn !== null) for (const x of this.whatFn.writesEvalContextRecursive()) s.add(x);
    if (this.localStateFn !== null) for (const x of this.localStateFn.writesEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java WhereSite.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    if (this.playerFn !== null) for (const x of this.playerFn.readsEvalContextRecursive()) s.add(x);
    if (this.whatFn !== null) for (const x of this.whatFn.readsEvalContextRecursive()) s.add(x);
    if (this.localStateFn !== null) for (const x of this.localStateFn.readsEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java WhereSite.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    let playerString = "";
    if (this.playerFn !== null)
      playerString = " of " + this.playerFn.toEnglish(game);
    return (this.namePiece ?? "piece") + playerString + " is in";
  }
}
