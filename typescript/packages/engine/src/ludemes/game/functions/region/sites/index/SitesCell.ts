// @java Core/src/game/functions/region/sites/index/SitesCell.java

/**
 * Returns all the vertices of the cell.
 *
 * @java game/functions/region/sites/index/SitesCell.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal shape of FaceEl from core topology. */
interface FaceLike {
	readonly vertices: ReadonlyArray<{ readonly id: number }>;
}

/**
 * Returns all the vertices of the cell at a given index.
 *
 * @java game/functions/region/sites/index/SitesCell.java
 */
export class SitesCell extends BaseRegionFunction {
	/** If we can, we'll precompute once and cache. */
	private precomputedRegion: number[] | null = null;

	/** The index of the cell. */
	private readonly index: IntFunction | null;

	/**
	 * @param elementType  Type of graph elements to return.
	 * @param index        Index of the cell.
	 * @java SitesCell(SiteType, IntFunction)
	 */
	public constructor(elementType: string | null, index: IntFunction | null) {
		super();
		this.siteType = elementType;
		this.index = index;
	}

	/**
	 * @java SitesCell.eval(Context)
	 *
	 * Returns the vertex indices forming the cell's boundary polygon.
	 */
	public override eval(context: Context & EvalScratch): number[] {
		if (this.precomputedRegion !== null) {
			return this.precomputedRegion;
		}

		// @java if (index == null) return new Region()
		if (this.index === null) {
			return [];
		}

		const i = this.index.eval(context);

		// @java if (i < 0 || i >= graph.cells().size()) { ... return new Region(); }
		const ctxAny = context as unknown as {
			_trajectories?: { core?: { topo?: { faceEls?: FaceLike[] } } } | null;
		};
		const topo = ctxAny._trajectories?.core?.topo;
		if (!topo || !topo.faceEls) {
			return [];
		}

		if (i < 0 || i >= topo.faceEls.length) {
			console.log(`** Invalid cell index ${i}.`);
			return [];
		}

		// @java final Cell cell = graph.cells().get(i); return new Region(cell.vertices())
		const cell = topo.faceEls[i]!;
		return cell.vertices.map(v => v.id);
	}

	/** @java SitesCell.isStatic() */
	public override isStatic(): boolean {
		if (this.index !== null) {
			return (this.index as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
		}
		return true;
	}

	/** @java SitesCell.toString() */
	public override toString(): string {
		return "Cell()";
	}
}
