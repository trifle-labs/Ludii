// @java Core/src/game/functions/ints/size/largePiece/SizeLargePiece.java

/**
 * Returns the size of large pieces currently placed.
 *
 * @java game/functions/ints/size/largePiece/SizeLargePiece.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";

/** Minimal surface of RegionFunction used here. */
interface JavaRegionFunction {
  eval(context: Context): { sites(): number[] };
  isStatic(): boolean;
  gameFlags(game: unknown): number;
  concepts(game: unknown): Set<number>;
  writesEvalContextRecursive(): Set<number>;
  readsEvalContextRecursive(): Set<number>;
  missingRequirement(game: unknown): boolean;
  willCrash(game: unknown): boolean;
  preprocess(game: unknown): void;
}

/** Thin wrapper mirroring Java's IntArrayFromRegion — holds either an IntFunction or a RegionFunction. */
class IntArrayFromRegion {
  private readonly intFn: JavaIntFunction | null;
  private readonly regionFn: JavaRegionFunction | null;
  private precomputed: number[] | null = null;

  constructor(intFn: JavaIntFunction | null, regionFn: JavaRegionFunction | null) {
    this.intFn = intFn;
    this.regionFn = regionFn;
  }

  eval(context: Context): number[] {
    if (this.precomputed !== null) return this.precomputed;
    if (this.intFn !== null) {
      const v = this.intFn.eval(context);
      if (v >= 0) return [v];
      return [];
    }
    if (this.regionFn !== null) {
      return this.regionFn.eval(context).sites();
    }
    return [];
  }

  gameFlags(game: unknown): number {
    let flags = 0;
    flags |= (this.intFn as unknown as { gameFlags?(g: unknown): number })?.gameFlags?.(game) ?? 0;
    flags |= (this.regionFn as unknown as { gameFlags?(g: unknown): number })?.gameFlags?.(game) ?? 0;
    return flags;
  }

  concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    if (this.intFn !== null) for (const b of this.intFn.concepts(game)) concepts.add(b);
    if (this.regionFn !== null) for (const b of this.regionFn.concepts(game)) concepts.add(b);
    return concepts;
  }

  writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    if (this.intFn !== null) for (const b of this.intFn.writesEvalContextRecursive()) s.add(b);
    if (this.regionFn !== null) for (const b of this.regionFn.writesEvalContextRecursive()) s.add(b);
    return s;
  }

  readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    if (this.intFn !== null) for (const b of this.intFn.readsEvalContextRecursive()) s.add(b);
    if (this.regionFn !== null) for (const b of this.regionFn.readsEvalContextRecursive()) s.add(b);
    return s;
  }

  missingRequirement(game: unknown): boolean {
    let m = false;
    if (this.intFn !== null) m = m || this.intFn.missingRequirement(game);
    if (this.regionFn !== null) m = m || this.regionFn.missingRequirement(game);
    return m;
  }

  willCrash(game: unknown): boolean {
    let w = false;
    if (this.intFn !== null) w = w || this.intFn.willCrash(game);
    if (this.regionFn !== null) w = w || this.regionFn.willCrash(game);
    return w;
  }

  preprocess(game: unknown): void {
    (this.intFn as unknown as { preprocess?(g: unknown): void })?.preprocess?.(game);
    (this.regionFn as unknown as { preprocess?(g: unknown): void })?.preprocess?.(game);
  }
}

/**
 * Returns the size of large pieces currently placed.
 *
 * @java game/functions/ints/size/largePiece/SizeLargePiece.java
 */
export class SizeLargePiece extends BaseIntFunction {
  /** The region to look in. @java SizeLargePiece.region */
  private readonly region: IntArrayFromRegion;

  /** Cell/Edge/Vertex. @java SizeLargePiece.type */
  private type: SiteType | null;

  /**
   * @param type The graph element type [default site type of the board].
   * @param at   The site to look for large piece.
   * @param in   The region to look for large pieces.
   * @java SizeLargePiece(SiteType, RegionFunction, IntFunction)
   */
  public constructor(
    type: SiteType | null,
    atFn: JavaIntFunction | null,
    inFn: JavaRegionFunction | null,
  ) {
    super();
    this.type = type;
    this.region = new IntArrayFromRegion(atFn, inFn);
  }

  /**
   * @java SizeLargePiece.eval(Context)
   *
   * Returns the total number of sites occupied by large pieces in the region.
   */
  public override eval(context: Context): number {
    let count = 0;

    // Java: final SiteType realType = (type != null) ? type : context.game().board().defaultSite();
    const realType: SiteType = this.type !== null
      ? this.type
      : ((context.game as unknown as { board?: { defaultSite?: () => SiteType } })
          .board?.defaultSite?.() ?? "Cell");

    const sites = this.region.eval(context);

    for (let i = 0; i < sites.length; i++) {
      const site = sites[i]!;

      // Java: final int cid = (realType.equals(SiteType.Cell) ? context.containerId()[site] : 0);
      const containerId_arr = (context as unknown as { containerId?: () => number[] }).containerId?.();
      const cid = (realType === "Cell" && containerId_arr !== undefined)
        ? (containerId_arr[site] ?? 0)
        : 0;

      // Java: final ContainerState cs = context.containerState(cid);
      const cs = (context as unknown as {
        containerState?: (cid: number) => {
          what(site: number, type: string): number;
        };
      }).containerState?.(cid);

      if (cs === undefined) continue;

      // Java: final int what = cs.what(site, realType);
      const what = cs.what(site, realType);
      if (what !== 0) {
        // Java: final Component component = context.components()[what];
        const component = (context as unknown as {
          components?: () => Array<{
            isLargePiece(): boolean;
            locs(
              context: Context,
              centreIndex: number,
              rotation: number,
              topology: unknown,
            ): { size(): number };
          }>;
        }).components?.()?.[what];

        if (component === undefined) {
          count++;
          continue;
        }

        if (component.isLargePiece()) {
          // Java: final TIntArrayList locs = component.locs(context,
          //   context.topology().centre(realType).get(0).index(), 0, context.topology());
          const topology = (context as unknown as { topology?: () => unknown }).topology?.();
          const centreIndex = (topology as unknown as {
            centre?: (type: string) => Array<{ index(): number }>;
          })?.centre?.(realType)?.[0]?.index() ?? 0;

          const locs = component.locs(context, centreIndex, 0, topology);
          count += locs.size();
        } else {
          count++;
        }
      }
    }

    return count;
  }

  /** @java SizeLargePiece.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java SizeLargePiece.gameFlags(Game) */
  public gameFlags(game: unknown): number {
    let flags = this.region.gameFlags(game);
    // Java: flags |= SiteType.gameFlags(type) — deferred
    return flags;
  }

  /** @java SizeLargePiece.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    // Java: concepts.or(SiteType.concepts(type)) — deferred
    for (const bit of this.region.concepts(game)) {
      concepts.add(bit);
    }
    return concepts;
  }

  /** @java SizeLargePiece.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    for (const bit of this.region.writesEvalContextRecursive()) {
      writeEvalContext.add(bit);
    }
    return writeEvalContext;
  }

  /** @java SizeLargePiece.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    for (const bit of this.region.readsEvalContextRecursive()) {
      readEvalContext.add(bit);
    }
    return readEvalContext;
  }

  /** @java SizeLargePiece.preprocess(Game) */
  public preprocess(game: unknown): void {
    // Java: type = SiteType.use(type, game);
    if (this.type === null) {
      this.type = (game as unknown as { board?: { defaultSite?: () => SiteType } })
        .board?.defaultSite?.() ?? "Cell";
    }
    this.region.preprocess(game);
  }

  /** @java SizeLargePiece.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;

    // Java: if (!game.hasLargePiece()) { ... missingRequirement = true; }
    const hasLargePiece = (game as unknown as { hasLargePiece?: () => boolean }).hasLargePiece;
    if (typeof hasLargePiece === "function" && !hasLargePiece.call(game)) {
      missingRequirement = true;
    }

    missingRequirement = missingRequirement || this.region.missingRequirement(game);
    return missingRequirement;
  }

  /** @java SizeLargePiece.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.region.willCrash(game);
    return willCrash;
  }
}
