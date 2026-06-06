// @java Core/src/game/functions/region/sites/largePiece/SitesLargePiece.java

/**
 * Returns all the sites occupied by a large piece.
 *
 * @java game/functions/region/sites/largePiece/SitesLargePiece.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Minimal component surface needed.
 * @java game/equipment/component/Component
 */
interface ComponentLike {
  isLargePiece(): boolean;
  locs(context: unknown, site: number, localState: number, topology: unknown): { size(): number; get(i: number): number };
}

/**
 * Minimal container state surface needed.
 * @java other/state/container/ContainerState
 */
interface ContainerStateLike {
  what(site: number, type: string | null): number;
  state(site: number, type: string | null): number;
  sizeStack?(site: number, type: string | null): number;
}

/**
 * Minimal topology surface needed.
 * @java other/topology/Topology
 */
interface TopologyLike {
  getGraphElements(type: string | null): { size(): number } | unknown[];
}

/**
 * Returns all the sites occupied by a large piece.
 *
 * Java parity: eval(context) reads the piece at the given site; if it is a
 * large piece it collects all covered locations from Component.locs().
 *
 * @java game.functions.region.sites.largePiece.SitesLargePiece
 */
export class SitesLargePiece extends BaseRegionFunction {
  /** @java SitesLargePiece — private final IntFunction at */
  private readonly at: IntFunction;

  /**
   * @param siteType The graph element type or null for board default.
   * @param at       The site to look at.
   * @java SitesLargePiece(SiteType, IntFunction)
   */
  public constructor(siteType: string | null, at: IntFunction) {
    super();
    this.siteType = siteType;
    this.at = at;
  }

  /**
   * @java SitesLargePiece.eval(Context)
   *
   * Returns all sites covered by the large piece located at the given site,
   * or just [site] for regular pieces, or [] when no piece / out of bounds.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesLargePiece.java:52 — resolve site
    const site = this.at.eval(ctx);
    const ctxAny = ctx as unknown as {
      game?: { board?: () => { defaultSite?: () => string } };
      board?: () => {
        defaultSite?: () => string;
        topology?: () => TopologyLike;
      };
      topology?: () => TopologyLike;
      containerState?: (cid: number) => ContainerStateLike;
      components?: () => (ComponentLike | null)[];
    };

    // @java SitesLargePiece.java:53 — realType
    let realType: string | null = this.siteType;
    if (realType === null) {
      // context.game().board().defaultSite()
      realType =
        ctxAny.game?.board?.()?.defaultSite?.() ??
        ctxAny.board?.()?.defaultSite?.() ??
        "Cell";
    }

    const sitesOccupied: number[] = [];

    // @java SitesLargePiece.java:56-59 — if site is off the board return empty
    const topo: TopologyLike | undefined =
      ctxAny.board?.()?.topology?.() ?? ctxAny.topology?.();
    if (topo !== undefined) {
      const elems = topo.getGraphElements(realType);
      const size = Array.isArray(elems) ? elems.length : (elems as { size(): number }).size();
      if (site >= size) return sitesOccupied;
    }

    // @java SitesLargePiece.java:61 — container state for board (cid=0)
    const cs: ContainerStateLike | undefined = ctxAny.containerState?.(0);
    if (!cs) return sitesOccupied;

    // @java SitesLargePiece.java:62 — what piece is here
    const what = cs.what(site, realType);

    // @java SitesLargePiece.java:64-66 — if no piece return empty
    if (what === 0) return sitesOccupied;

    // @java SitesLargePiece.java:68 — resolve component
    const components = ctxAny.components?.();
    const piece: ComponentLike | null | undefined = components?.[what];
    if (!piece) {
      sitesOccupied.push(site);
      return sitesOccupied;
    }

    // @java SitesLargePiece.java:71-75 — if not large piece return [site]
    if (!piece.isLargePiece()) {
      sitesOccupied.push(site);
      return sitesOccupied;
    }

    // @java SitesLargePiece.java:77-82 — large piece: collect all locs
    const localState = cs.state(site, this.siteType);
    const topology = topo ?? null;
    const locs = piece.locs(ctx, site, localState, topology);
    const locsSize = locs.size();
    for (let j = 0; j < locsSize; j++) {
      const loc = locs.get(j);
      if (!sitesOccupied.includes(loc)) {
        sitesOccupied.push(loc);
      }
    }

    return sitesOccupied;
  }

  /** @java SitesLargePiece.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesLargePiece.preprocess(Game) */
  public preprocess(game: unknown): void {
    // @java SitesLargePiece.java:133 — type = SiteType.use(type, game)
    if (this.siteType === null) {
      const gameAny = game as unknown as { board?: () => { defaultSite?: () => string } };
      this.siteType = gameAny.board?.()?.defaultSite?.() ?? "Cell";
    }
    (this.at as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
  }

  /** @java SitesLargePiece.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    // @java SitesLargePiece.java:140-145
    const gameAny = game as unknown as {
      hasLargePiece?: () => boolean;
      addRequirementToReport?: (s: string) => void;
    };
    if (typeof gameAny.hasLargePiece === "function" && !gameAny.hasLargePiece()) {
      gameAny.addRequirementToReport?.(
        "The ludeme (sites LargePiece ...) is used but the equipment has no large pieces.",
      );
      missingRequirement = true;
    }
    missingRequirement =
      missingRequirement ||
      ((this.at as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    return missingRequirement;
  }

  /** @java SitesLargePiece.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    return (this.at as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false;
  }

  /** @java SitesLargePiece.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const atStr =
      (this.at as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ??
      String(UNDEFINED);
    return `the sites covered by the large piece located on site ${atStr}`;
  }
}
