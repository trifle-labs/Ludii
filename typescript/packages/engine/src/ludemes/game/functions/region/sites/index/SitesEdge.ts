// @java Core/src/game/functions/region/sites/index/SitesEdge.java

/**
 * Returns all the vertices of the edge.
 *
 * @java game/functions/region/sites/index/SitesEdge.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal shape of EdgeEl from core topology. */
interface EdgeLike {
	readonly va: { readonly id: number };
	readonly vb: { readonly id: number };
}

/**
 * Returns the two vertex endpoint IDs of the edge at a given index.
 *
 * @java game/functions/region/sites/index/SitesEdge.java
 */
export class SitesEdge extends BaseRegionFunction {
	/** If we can, we'll precompute once and cache. */
	private precomputedRegion: number[] | null = null;

	/** The index of the edge. */
	private readonly index: IntFunction | null;

	/**
	 * @param elementType  Type of graph elements to return.
	 * @param index        Index of the edge.
	 * @java SitesEdge(SiteType, IntFunction)
	 */
	public constructor(elementType: string | null, index: IntFunction | null) {
		super();
		this.siteType = elementType;
		this.index = index;
	}

	/**
	 * @java SitesEdge.eval(Context)
	 *
	 * Returns [edge.vA().index(), edge.vB().index()] for the edge at the given index.
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

		// Access edge from core topology
		const ctxAny = context as unknown as {
			_trajectories?: {
				core?: { topo?: { edgeEls?: EdgeLike[] } };
				kind?: string;
				edgeEndpoints?: (site: number) => readonly [number, number] | undefined;
			} | null;
		};
		const traj = ctxAny._trajectories;

		if (traj) {
			// Edge-play board: edgeEndpoints() works directly on play-sites.
			if (traj.kind === "Edge" && traj.edgeEndpoints) {
				const eps = traj.edgeEndpoints(i);
				if (eps) return [eps[0], eps[1]];
				return [];
			}
			// Cell/Vertex-play board — look up by index from core topology
			const edgeEls = traj.core?.topo?.edgeEls;
			if (edgeEls) {
				// @java if (i < 0 || i >= graph.edges().size()) { ... return new Region(); }
				if (i < 0 || i >= edgeEls.length) {
					console.log(`** Invalid edge index ${i}.`);
					return [];
				}
				// @java final Edge edge = graph.edges().get(i); list.add(edge.vA().index()); list.add(edge.vB().index())
				const edge = edgeEls[i]!;
				return [edge.va.id, edge.vb.id];
			}
		}

		return [];
	}

	/** @java SitesEdge.isStatic() */
	public override isStatic(): boolean {
		if (this.index !== null) {
			return (this.index as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
		}
		return true;
	}

	/** @java SitesEdge.toString() */
	public override toString(): string {
		return "Edge()";
	}
}
