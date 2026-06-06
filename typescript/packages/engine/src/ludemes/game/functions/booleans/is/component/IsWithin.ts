// @java Core/src/game/functions/booleans/is/component/IsWithin.java

/**
 * Tests if a specific piece is on the designed region.
 *
 * @java game/functions/booleans/is/component/IsWithin.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import { LastTo } from "../../../ints/last/LastTo.js";

/**
 * Tests if a specific piece is on the designed region.
 *
 * @java game/functions/booleans/is/component/IsWithin.java
 */
export class IsWithin extends BaseBooleanFunction {
  /** @java IsWithin.pieceId */
  private readonly pieceId: IntFunction;

  /** @java IsWithin.region */
  protected readonly region: RegionFunction;

  /** @java IsWithin.type — Cell/Edge/Vertex */
  private type: string | null;

  /**
   * @param pieceId The index of the item.
   * @param type    The graph element type.
   * @param locn    The location to check [(lastTo)].
   * @param region  The region to check.
   * @java IsWithin(IntFunction, SiteType, IntFunction, RegionFunction)
   */
  public constructor(
    pieceId: IntFunction,
    type: string | null,
    locn: IntFunction | null,
    region: RegionFunction | null,
  ) {
    super();
    this.pieceId = pieceId;
    this.type = type;

    // Java:
    // this.region = new IntArrayFromRegion(
    //   (region == null && locn != null ? locn : region == null ? new LastTo(null) : null),
    //   (region != null) ? region : null
    // );
    // In the TS port IntArrayFromRegion is not used as a RegionFunction directly;
    // instead we capture the locn/region and resolve at eval-time.
    if (region !== null) {
      this.region = region;
    } else if (locn !== null) {
      // single-location region: wrap locn into a RegionFunction
      const locnFn = locn;
      this.region = {
        eval(ctx: Context): number[] {
          const v = locnFn.eval(ctx);
          return v >= 0 ? [v] : [];
        },
      };
    } else {
      // default: (lastTo)
      const lastTo = new LastTo(undefined);
      this.region = {
        eval(ctx: Context): number[] {
          const v = lastTo.eval(ctx);
          return v >= 0 ? [v] : [];
        },
      };
    }
  }

  /**
   * @java IsWithin.eval(Context)
   *
   * Tests if the piece identified by pieceId is located at one of the sites in region.
   */
  public override eval(context: Context): boolean {
    const pid = this.pieceId.eval(context);
    // Java: final int owner = context.components()[pid].owner();
    const components = (context as unknown as { components?: () => { owner?: () => number }[] }).components;
    let owner: number = 0;
    if (typeof components === "function") {
      const comps = components.call(context);
      if (comps && pid >= 0 && pid < comps.length) {
        const comp = comps[pid];
        if (comp && typeof comp.owner === "function") {
          owner = comp.owner();
        }
      }
    }

    const sites: number[] = this.region.eval(context);

    // Java: final TIntArrayList owned = context.state().owned().sites(owner, pid);
    const state = context.state as unknown as {
      owned?: () => { sites?: (owner: number, pid: number) => number[] };
    };
    let ownedSites: number[] = [];
    if (typeof state.owned === "function") {
      const owned = state.owned();
      if (owned && typeof owned.sites === "function") {
        ownedSites = owned.sites(owner, pid) ?? [];
      }
    }

    // Java: for (int i = 0; i < owned.size(); i++) { if (sites.contains(location)) return true; }
    for (let i = 0; i < ownedSites.length; i++) {
      const location = ownedSites[i]!;
      if (sites.includes(location)) {
        return true;
      }
    }

    return false;
  }

  /** @java IsWithin.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java IsWithin.gameFlags(Game) */
  public override gameFlags(game: unknown): number {
    const pieceFlags = (this.pieceId as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
    const regionFlags = (this.region as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
    const typeFlags = 0; // SiteType.gameFlags(type) — skip
    return pieceFlags | regionFlags | typeFlags;
  }

  /** @java IsWithin.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    const pieceC = (this.pieceId as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
    if (pieceC) for (const v of pieceC) concepts.add(v);
    const regionC = (this.region as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
    if (regionC) for (const v of regionC) concepts.add(v);
    return concepts;
  }

  /** @java IsWithin.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const ws = new Set<number>();
    const pw = (this.pieceId as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (pw) for (const v of pw) ws.add(v);
    const rw = (this.region as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (rw) for (const v of rw) ws.add(v);
    return ws;
  }

  /** @java IsWithin.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const rs = new Set<number>();
    const pr = (this.pieceId as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (pr) for (const v of pr) rs.add(v);
    const rr = (this.region as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (rr) for (const v of rr) rs.add(v);
    return rs;
  }

  /** @java IsWithin.preprocess(Game) */
  public override preprocess(game: unknown): void {
    // Java: type = SiteType.use(type, game);
    // (We skip the full SiteType resolution here)
    (this.pieceId as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    (this.region as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
  }

  /** @java IsWithin.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    missingRequirement = missingRequirement || ((this.pieceId as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    missingRequirement = missingRequirement || ((this.region as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    return missingRequirement;
  }

  /** @java IsWithin.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || ((this.pieceId as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    willCrash = willCrash || ((this.region as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    return willCrash;
  }

  /** @java IsWithin.toString() */
  public override toString(): string {
    return "IsWithin(" + this.pieceId + "," + this.region + ")";
  }

  /** @java IsWithin.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    const pieceEn = (this.pieceId as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.pieceId);
    const regionEn = (this.region as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.region);
    return pieceEn + " is in " + regionEn;
  }
}
