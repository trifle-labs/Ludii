// @java Core/src/game/functions/region/sites/index/SitesColumn.java

/**
 * Returns all the sites in a specific column of the board.
 *
 * @java game/functions/region/sites/index/SitesColumn.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal Trajectories row/column data. */
interface TrajectoryRowCol {
	columns(type: string): Array<Array<{ id?: number; index?: number }>>;
}

/**
 * Returns all the sites in a specific column of the board.
 *
 * @java game/functions/region/sites/index/SitesColumn.java
 */
export class SitesColumn extends BaseRegionFunction {
	/** If we can, we'll precompute once and cache. */
	private precomputedRegion: number[] | null = null;

	/** The index of the column. */
	private readonly index: IntFunction | null;

	/**
	 * @param elementType  Type of graph elements to return.
	 * @param index        Index of the column.
	 * @java SitesColumn(SiteType, IntFunction)
	 */
	public constructor(elementType: string | null, index: IntFunction | null) {
		super();
		this.siteType = elementType;
		this.index = index;
	}

	/**
	 * @java SitesColumn.eval(Context)
	 *
	 * Returns all sites in the specified column.
	 */
	public override eval(context: Context & EvalScratch): number[] {
		if (this.precomputedRegion !== null) {
			return this.precomputedRegion;
		}

		// @java final SiteType realType = (type != null) ? type : context.board().defaultSite()
		const realType: string = this.siteType ?? (
			(context as unknown as { board?: { defaultSite?: () => string } }).board?.defaultSite?.() ?? "Cell"
		);

		// @java if (index == null) return new Region()
		if (this.index === null) {
			return [];
		}

		const i = this.index.eval(context);

		// @java if (i < 0) { System.out.println("** Negative column index."); return new Region(); }
		if (i < 0) {
			console.log("** Negative column index.");
			return [];
		}

		// @java return new Region(graph.columns(realType).get(i))
		// Try to get columns from context topology
		const ctxAny = context as unknown as { _trajectories?: TrajectoryRowCol | null };
		const traj = ctxAny._trajectories;

		if (traj && typeof (traj as unknown as Record<string, unknown>).columns === "function") {
			const cols = traj.columns(realType);
			if (i >= cols.length) return [];
			const col = cols[i];
			if (!col) return [];
			return col.map(el => el.id ?? el.index ?? 0);
		}

		// Fallback: square board — column = all sites where (site % width) == i
		const g = context.game as unknown as { equipment?: { board?: { width: number; height: number; numSites: number } } };
		const W = g.equipment?.board?.width ?? 8;
		const numSites = g.equipment?.board?.numSites ?? (W * (g.equipment?.board?.height ?? 8));
		const result: number[] = [];
		for (let site = 0; site < numSites; site++) {
			if (site % W === i) {
				result.push(site);
			}
		}
		return result;
	}

	/** @java SitesColumn.isStatic() */
	public override isStatic(): boolean {
		if (this.index !== null) {
			return (this.index as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
		}
		return true;
	}

	/** @java SitesColumn.toString() */
	public override toString(): string {
		return "Column()";
	}
}
