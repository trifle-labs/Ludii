// @java Core/src/game/functions/booleans/is/component/IsWithin.java

/**
 * Tests if a specific piece is on the designed region.
 *
 * @java game/functions/booleans/is/component/IsWithin.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../base.js";
import { LastTo } from "../../../ints/last/LastTo.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { compileInt1to1, compileRegion1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

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
    if (pid <= 0) return false;

    const sites = new Set(toSiteArray(this.region.eval(context) as unknown));
    if (sites.size === 0) return false;

    // Java uses the Owned index for the component id. The TS state keeps the
    // same component id in `whats`, so scanning flat sites is equivalent for
    // board cells and avoids depending on a Java-shaped Owned adapter.
    const whats = context.state.whats;
    for (let site = 0; site < whats.length; site++) {
      if (whats[site] === pid && sites.has(site)) return true;
    }

    // Stack games store per-level component ids separately.
    const whatStacks = context.state.whatStacks;
    for (let site = 0; site < whatStacks.length; site++) {
      if (!sites.has(site)) continue;
      const levels = whatStacks[site] ?? [];
      for (const what of levels) {
        if (what === pid) return true;
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

function toSiteArray(raw: unknown): readonly number[] {
  if (Array.isArray(raw)) return raw as number[];
  if (raw && typeof raw === "object") {
    const r = raw as { sites?: unknown; array?: unknown };
    if (typeof r.sites === "function") return (r.sites as () => number[])();
    if (Array.isArray(r.sites)) return r.sites as number[];
    if (Array.isArray(r.array)) return r.array as number[];
    if (typeof (raw as Iterable<number>)[Symbol.iterator] === "function") return [...(raw as Iterable<number>)];
  }
  return [];
}

