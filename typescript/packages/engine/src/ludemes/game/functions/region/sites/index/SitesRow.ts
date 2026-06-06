// @java Core/src/game/functions/region/sites/index/SitesRow.java

/**
 * Returns all the sites in a specific row of the board.
 *
 * @java game/functions/region/sites/index/SitesRow.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal Trajectories row data. */
interface TrajectoryRows {
	rows(type: string): Array<Array<{ id?: number; index?: number }>>;
}

/**
 * Returns all the sites in a specific row of the board.
 *
 * @java game/functions/region/sites/index/SitesRow.java
 */
export class SitesRow extends BaseRegionFunction {
	/** If we can, we'll precompute once and cache. */
	private precomputedRegion: number[] | null = null;

	/** The index of the row. */
	private readonly index: IntFunction | null;

	/**
	 * @param elementType  Type of graph elements to return.
	 * @param index        Index of the row.
	 * @java SitesRow(SiteType, IntFunction)
	 */
	public constructor(elementType: string | null, index: IntFunction | null) {
		super();
		this.siteType = elementType;
		this.index = index;
	}

	/**
	 * @java SitesRow.eval(Context)
	 *
	 * Returns all sites in the specified row.
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

		// @java if (i < 0) { System.out.println("** Negative row index."); return new Region(); }
		if (i < 0) {
			console.log("** Negative row index.");
			return [];
		}

		// @java return new Region(graph.rows(realType).get(i))
		// Try to get rows from context topology
		const ctxAny = context as unknown as { _trajectories?: TrajectoryRows | null };
		const traj = ctxAny._trajectories;

		if (traj && typeof (traj as unknown as Record<string, unknown>).rows === "function") {
			const rowsList = traj.rows(realType);
			// @java else if (i >= graph.rows(realType).size()) return new Region()
			if (i >= rowsList.length) return [];
			const row = rowsList[i];
			if (!row) return [];
			return row.map(el => el.id ?? el.index ?? 0);
		}

		// Fallback: square board — row = all sites where Math.floor(site / width) == i
		const g = context.game as unknown as { equipment?: { board?: { width: number; height: number; numSites: number } } };
		const W = g.equipment?.board?.width ?? 8;
		const H = g.equipment?.board?.height ?? 8;
		if (i >= H) return [];
		const numSites = g.equipment?.board?.numSites ?? (W * H);
		const result: number[] = [];
		for (let site = 0; site < numSites; site++) {
			if (Math.floor(site / W) === i) {
				result.push(site);
			}
		}
		return result;
	}

	/** @java SitesRow.isStatic() */
	public override isStatic(): boolean {
		if (this.index !== null) {
			return (this.index as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
		}
		return true;
	}

	/** @java SitesRow.toString() */
	public override toString(): string {
		return "Row()";
	}
}
