// @java Core/src/game/functions/region/sites/index/SitesEmpty.java

/**
 * Returns the empty (i.e. unoccupied) sites of a container.
 *
 * @java game/functions/region/sites/index/SitesEmpty.java
 * @author cambolbro and Eric.Piette and Dennis
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal ContainerState surface used for emptyRegion. */
interface ContainerStateLike {
	emptyRegion(type: string): { sites(): number[] };
}

/**
 * Returns the empty (unoccupied) sites of a container.
 *
 * Java parity: SitesEmpty.eval(context) checks the container's emptyRegion.
 * When the container is 0 (the board), EmptyDefault is used for efficiency.
 *
 * @java game/functions/region/sites/index/SitesEmpty.java
 */
export class SitesEmpty extends BaseRegionFunction {
	/** Which container. */
	private readonly containerFunction: IntFunction;

	/**
	 * @param type              Type of graph element.
	 * @param containerFunction Index of the container.
	 * @java SitesEmpty(SiteType, IntFunction)
	 */
	public constructor(type: string | null, containerFunction: IntFunction) {
		super();
		this.siteType = type;
		this.containerFunction = containerFunction;
	}

	/**
	 * @java SitesEmpty.eval(Context)
	 *
	 * Returns all empty sites in the specified container.
	 */
	public override eval(context: Context & EvalScratch): number[] {
		// @java final int container = containerFunction.eval(context)
		const container: number = this.containerFunction.eval(context);

		// @java final SiteType realType = container > 0 ? SiteType.Cell : type
		const realType: string = container > 0
			? "Cell"
			: (this.siteType ?? (
				(context as unknown as { board?: { defaultSite?: () => string } }).board?.defaultSite?.() ?? "Cell"
			));

		// @java final Region region = context.state().containerStates()[container].emptyRegion(realType)
		const containerStates = (context as unknown as {
			state?: { containerStates?: () => ContainerStateLike[] };
			containerState?: (n: number) => ContainerStateLike;
		});

		let sites: number[];

		// Try containerStates array
		const cstates = containerStates.state?.containerStates?.();
		if (cstates && container < cstates.length) {
			const cs = cstates[container];
			if (cs) {
				const region = cs.emptyRegion(realType);
				sites = [...region.sites()];
			} else {
				// Fallback: scan all sites
				sites = this.fallbackEmptySites(context);
			}
		} else if (containerStates.containerState) {
			// try containerState(n) method
			const cs = containerStates.containerState(container);
			if (cs) {
				const region = cs.emptyRegion(realType);
				sites = [...region.sites()];
			} else {
				sites = this.fallbackEmptySites(context);
			}
		} else {
			sites = this.fallbackEmptySites(context);
		}

		// @java if (container < 1) return region
		if (container < 1) {
			return sites;
		}

		// @java final int siteFrom = context.sitesFrom()[container]
		// @java for (int i = 0; i < sites.length; i++) sites[i] += siteFrom
		// @java return new Region(sites)
		const sitesFrom: number[] = (context as unknown as {
			sitesFrom?: () => number[];
			equipment?: { sitesFrom?: () => number[] };
		}).sitesFrom?.() ?? (context as unknown as { equipment?: { sitesFrom?: () => number[] } }).equipment?.sitesFrom?.() ?? [];
		const siteFrom: number = sitesFrom[container] ?? 0;
		return sites.map(s => s + siteFrom);
	}

	/** Fallback: iterate board sites and check isEmpty. */
	private fallbackEmptySites(context: Context & EvalScratch): number[] {
		const state = context.state;
		const boardN = (context.game as unknown as { equipment?: { board?: { numSites?: number } } })
			.equipment?.board?.numSites;
		const n = (boardN !== undefined && boardN > 0) ? boardN : state.cells.length;
		const result: number[] = [];
		for (let i = 0; i < n; i++) {
			if (state.isEmptySite(i)) {
				result.push(i);
			}
		}
		return result;
	}

	/** @java SitesEmpty.isStatic() */
	public override isStatic(): boolean {
		// @java we're looking at "empty" in a specific context, so never static
		return false;
	}

	/** @java SitesEmpty.toString() */
	public override toString(): string {
		if (this.siteType === null) return "Null type in Empty.";
		if (this.siteType === "Cell") return `Empty(${this.containerFunction})`;
		if (this.siteType === "Edge") return `EmptyEdge(${this.containerFunction})`;
		return `EmptyVertex(${this.containerFunction})`;
	}
}

/**
 * An optimised "default" version of Empty ludeme, for container 0.
 *
 * @java game/functions/region/sites/index/SitesEmpty.EmptyDefault
 * @author Dennis Soemers
 */
export class EmptyDefault extends BaseRegionFunction {
	/**
	 * @param type The site type.
	 * @java EmptyDefault(SiteType)
	 */
	public constructor(type: string | null) {
		super();
		this.siteType = type;
	}

	/**
	 * @java EmptyDefault.eval(Context)
	 *
	 * Returns empty sites for container 0.
	 */
	public override eval(context: Context & EvalScratch): number[] {
		// @java return context.state().containerStates()[0].emptyRegion(type)
		const containerStates = (context as unknown as {
			state?: { containerStates?: () => Array<{ emptyRegion(type: string): { sites(): number[] } }> };
		});
		const cstates = containerStates.state?.containerStates?.();
		if (cstates && cstates.length > 0) {
			const cs = cstates[0];
			if (cs) {
				const realType = this.siteType ?? "Cell";
				return [...cs.emptyRegion(realType).sites()];
			}
		}

		// Fallback
		const state = context.state;
		const boardN = (context.game as unknown as { equipment?: { board?: { numSites?: number } } })
			.equipment?.board?.numSites;
		const n = (boardN !== undefined && boardN > 0) ? boardN : state.cells.length;
		const result: number[] = [];
		for (let i = 0; i < n; i++) {
			if (state.isEmptySite(i)) {
				result.push(i);
			}
		}
		return result;
	}

	/** @java EmptyDefault.toString() */
	public override toString(): string {
		return "Empty()";
	}

	/** @java EmptyDefault.isStatic() */
	public override isStatic(): boolean {
		return false;
	}
}
