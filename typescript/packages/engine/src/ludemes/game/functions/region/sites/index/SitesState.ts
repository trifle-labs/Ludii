// @java Core/src/game/functions/region/sites/index/SitesState.java

/**
 * Returns all sites with a specified state value.
 *
 * @java game/functions/region/sites/index/SitesState.java
 * @author Eric Piette and cambolbro
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal ContainerState shape for state(site, type) access. */
interface ContainerStateLike {
  state(site: number, type: string): number;
  numSites?(): number;
}

/**
 * Returns all sites with a specified state value.
 *
 * @java game/functions/region/sites/index/SitesState.java
 */
export class SitesState extends BaseRegionFunction {
  /** @java SitesState — stateValue */
  private readonly stateValue: IntFunction;

  /**
   * @param elementType The graph element type.
   * @param stateValue  The value of the local state.
   * @java SitesState(SiteType, IntFunction)
   */
  public constructor(elementType: string | null, stateValue: IntFunction) {
    super();
    this.siteType = elementType;
    this.stateValue = stateValue;
  }

  /**
   * Returns all sites whose local state equals stateValue.
   *
   * @java SitesState.eval(Context)
   *
   * Java parity:
   *   final TIntArrayList sites = new TIntArrayList();
   *   final int stateId = stateValue.eval(context);
   *   final ContainerState cs = context.containerState(0);
   *   final int sitesTo = context.containers()[0].numSites();
   *   for (int site = 0; site < sitesTo; site++)
   *     if (cs.state(site, type) == stateId) sites.add(site);
   *   return new Region(sites.toArray());
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const sites: number[] = [];

    // @java final int stateId = stateValue.eval(context)
    const stateId = this.stateValue.eval(ctx);

    // @java final SiteType realType = (type != null) ? type : ...
    const realType: string = this.siteType ?? (
      (ctx as unknown as { board?: { defaultSite?: () => string } }).board?.defaultSite?.() ?? "Cell"
    );

    // @java final ContainerState cs = context.containerState(0)
    const ctxAny = ctx as unknown as {
      containerState?: (n: number) => ContainerStateLike;
      state?: {
        containerStates?: () => ContainerStateLike[];
      };
    };

    let cs: ContainerStateLike | null = null;
    if (typeof ctxAny.containerState === "function") {
      cs = ctxAny.containerState(0);
    } else {
      const cstates = ctxAny.state?.containerStates?.();
      if (cstates && cstates.length > 0) {
        cs = cstates[0] ?? null;
      }
    }

    if (!cs) {
      return [];
    }

    // @java final int sitesTo = context.containers()[0].numSites()
    const game = ctx.game as unknown as {
      equipment?: { containers?: Array<{ numSites: number }>; board?: { numSites?: number } };
    };
    const sitesTo =
      game.equipment?.containers?.[0]?.numSites
      ?? game.equipment?.board?.numSites
      ?? ctx.state.cells.length;

    // @java for (int site = 0; site < sitesTo; site++) if (cs.state(site, type) == stateId) sites.add(site)
    for (let site = 0; site < sitesTo; site++) {
      if (cs.state(site, realType) === stateId) {
        sites.push(site);
      }
    }

    return sites;
  }

  /** @java SitesState.isStatic() — false */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesState.toString() */
  public override toString(): string {
    return "SitesState()";
  }
}
