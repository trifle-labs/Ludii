// @java Core/src/game/functions/region/sites/custom/SitesCustom.java

/**
 * Returns all the sites corresponding to the indices in entry.
 *
 * @java game/functions/region/sites/custom/SitesCustom.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { IntArrayFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Returns all the sites corresponding to the indices in the array function.
 *
 * @java game/functions/region/sites/custom/SitesCustom.java
 */
export class SitesCustom extends BaseRegionFunction {
	/** If we can, we'll precompute once and cache. */
	private precomputedRegion: number[] | null = null;

	/** The array of sites. */
	private readonly arrayFn: IntArrayFunction;

	/**
	 * @param arrayFn The intArray function returning the indices.
	 * @java SitesCustom(IntArrayFunction)
	 */
	public constructor(arrayFn: IntArrayFunction) {
		super();
		this.arrayFn = arrayFn;
	}

	/**
	 * @java SitesCustom.eval(Context)
	 *
	 * Returns the sites specified by the array function, filtering out negatives.
	 */
	public override eval(context: Context & EvalScratch): number[] {
		if (this.precomputedRegion !== null) {
			return this.precomputedRegion;
		}

		// @java final TIntArrayList sites = new TIntArrayList(arrayFn.eval(context));
		const raw: number[] = this.arrayFn.eval(context);
		const sites: number[] = [];

		// @java for (int i = sites.size() - 1; i >= 0; i--) { if (site < 0) sites.removeAt(i); }
		for (let i = raw.length - 1; i >= 0; i--) {
			const site = raw[i]!;
			if (site >= 0) {
				sites.push(site);
			}
		}

		// Reverse to preserve original order (we iterated backwards)
		sites.reverse();

		return sites;
	}

	/**
	 * @java SitesCustom.contains(Context, int)
	 */
	public override contains(context: Context & EvalScratch, location: number): boolean {
		if (this.precomputedRegion !== null) {
			return this.precomputedRegion.includes(location);
		}

		const sites: number[] = this.arrayFn.eval(context);
		for (let i = 0; i < sites.length; i++) {
			if (location === sites[i]) {
				return true;
			}
		}

		return false;
	}

	/** @java SitesCustom.isStatic() */
	public override isStatic(): boolean {
		return (this.arrayFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
	}

	/** @java SitesCustom.toString() */
	public override toString(): string {
		return "CustomSites()";
	}
}
