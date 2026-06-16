// @java Core/src/game/functions/region/sites/incidents/SitesIncident.java

/**
 * Returns other graph elements connected to a given graph element.
 *
 * @java game/functions/region/sites/incidents/SitesIncident.java
 * @author Eric.Piette and cambolbro
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal Trajectories core topology surface used for incident graph elements. */
interface TopoLike {
	verts: Array<{
		id: number;
		edges: Array<{ va: { id: number }; vb: { id: number }; cells: Array<{ id: number }> }>;
		cells: Array<{ id: number }>;
	}>;
	edgeEls: Array<{
		va: { id: number };
		vb: { id: number };
		cells: Array<{ id: number }>;
	}>;
	faceEls: Array<{
		vertices: Array<{ id: number }>;
		edges: Array<{
			va: { id: number };
			vb: { id: number };
			cells: Array<{ id: number }>;
		}>;
	}>;
}

/**
 * Returns other graph elements connected to a given graph element.
 *
 * @java game/functions/region/sites/incidents/SitesIncident.java
 */
export class SitesIncident extends BaseRegionFunction {
	/** Type of the element of the graph (ofType). */
	private readonly ofType: string;

	/** Type of the result (resultType). */
	private readonly resultType: string;

	/** Index of the element of the graph. */
	private readonly indexFn: IntFunction;

	/** Owner of the sites to return (optional). */
	private readonly ownerFn: IntFunction | null;

	/** If we can, we'll precompute once and cache. */
	private precomputedRegion: number[] | null = null;

	/**
	 * @param resultType  The graph type of the result ("Cell", "Edge", "Vertex").
	 * @param ofType      The graph type of the index.
	 * @param indexFn     Index of the element to check.
	 * @param ownerFn     Optional owner filter.
	 * @java SitesIncident(SiteType, SiteType, IntFunction, Player, RoleType)
	 */
	public constructor(
		resultType: string,
		ofType: string,
		indexFn: IntFunction,
		ownerFn: IntFunction | null,
	) {
		super();
		this.resultType = resultType;
		this.ofType = ofType;
		this.indexFn = indexFn;
		this.ownerFn = ownerFn;
	}

	/**
	 * @java SitesIncident.eval(Context)
	 */
	public override eval(context: Context & EvalScratch): number[] {
		if (this.precomputedRegion !== null) {
			return this.precomputedRegion;
		}

		// @java switch (ofType) { case Vertex: ... case Edge: ... case Cell: ... }
		switch (this.ofType) {
		case "Vertex":
			return this.evalVertex(context, this.indexFn.eval(context));
		case "Edge":
			return this.evalEdge(context, this.indexFn.eval(context));
		case "Cell":
			return this.evalCell(context, this.indexFn.eval(context));
		default:
			return [];
		}
	}

	/** Get core topology for incident calculations. */
	private getTopo(context: Context): TopoLike | null {
		const ctxAny = context as unknown as {
			_trajectories?: { core?: { topo?: TopoLike } } | null;
		};
		return ctxAny._trajectories?.core?.topo ?? null;
	}

	/** Get containerState for owner filtering. */
	private getCs(context: Context): { who(site: number, type: string): number } | null {
		return (context as unknown as {
			containerState?(n: number): { who(site: number, type: string): number };
		}).containerState?.(0) ?? null;
	}

	/** Get total number of players for owner-ANY check. */
	private getNumPlayers(context: Context): number {
		return (context.game as unknown as { players?: { size?: number; numPlayers?: number } }).players?.size
			?? (context.game as unknown as { numPlayers?: number }).numPlayers
			?? 2;
	}

	/**
	 * @java SitesIncident.evalCell(Context, int)
	 *
	 * Returns resultType elements incident to cell at given index.
	 */
	private evalCell(context: Context & EvalScratch, index: number): number[] {
		const topo = this.getTopo(context);
		if (!topo) return [];

		if (index < 0 || index >= topo.faceEls.length) {
			return [];
		}

		const cell = topo.faceEls[index]!;
		const result: number[] = [];

		switch (this.resultType) {
		case "Cell": {
			// @java for (Edge edge : cell.edges()) for (Cell cell2 : edge.cells()) if (cell2.index() != cell.index()) result.add(cell2.index())
			for (const edge of (cell.edges ?? [])) {
				for (const cell2 of (edge.cells ?? [])) {
					if (cell2.id !== index) {
						result.push(cell2.id);
					}
				}
			}
			break;
		}
		case "Edge":
			// @java for (Edge edge : cell.edges()) result.add(edge.index())
			for (const edge of (cell.edges ?? [])) {
				// Find edge index from topo.edgeEls
				for (let ei = 0; ei < topo.edgeEls.length; ei++) {
					const e = topo.edgeEls[ei]!;
					if (e.va.id === edge.va.id && e.vb.id === edge.vb.id) {
						result.push(ei);
						break;
					}
				}
			}
			break;
		case "Vertex":
			// @java for (Vertex vertex : cell.vertices()) result.add(vertex.index())
			for (const vertex of cell.vertices) {
				result.push(vertex.id);
			}
			break;
		default:
			break;
		}

		return this.filterByOwner(context, result);
	}

	/**
	 * @java SitesIncident.evalEdge(Context, int)
	 *
	 * Returns resultType elements incident to edge at given index.
	 */
	private evalEdge(context: Context & EvalScratch, index: number): number[] {
		const topo = this.getTopo(context);
		if (!topo) return [];

		if (index < 0 || index >= topo.edgeEls.length) {
			return [];
		}

		const edge = topo.edgeEls[index]!;
		const result: number[] = [];

		switch (this.resultType) {
		case "Vertex":
			// @java result.add(edge.vA().index()); result.add(edge.vB().index())
			result.push(edge.va.id);
			result.push(edge.vb.id);
			break;
		case "Edge": {
			// @java for (Edge edge2: edge.vA().edges()) if (edge2.index() != edge.index()) result.add(edge2.index())
			// @java for (Edge edge2: edge.vB().edges()) if (edge2.index() != edge.index()) result.add(edge2.index())
			const vA = topo.verts.find(v => v.id === edge.va.id);
			const vB = topo.verts.find(v => v.id === edge.vb.id);
			if (vA) {
				for (const edge2 of vA.edges) {
					const ei = topo.edgeEls.findIndex(e => e.va.id === edge2.va.id && e.vb.id === edge2.vb.id);
					if (ei !== -1 && ei !== index) result.push(ei);
				}
			}
			if (vB) {
				for (const edge2 of vB.edges) {
					const ei = topo.edgeEls.findIndex(e => e.va.id === edge2.va.id && e.vb.id === edge2.vb.id);
					if (ei !== -1 && ei !== index) result.push(ei);
				}
			}
			break;
		}
		case "Cell":
			// @java for (Cell face : edge.cells()) result.add(face.index())
			for (const face of (edge.cells ?? [])) {
				result.push(face.id);
			}
			break;
		default:
			break;
		}

		return this.filterByOwner(context, result);
	}

	/**
	 * @java SitesIncident.evalVertex(Context, int)
	 *
	 * Returns resultType elements incident to vertex at given index.
	 */
	private evalVertex(context: Context & EvalScratch, index: number): number[] {
		const topo = this.getTopo(context);
		if (!topo) return [];

		const vertex = topo.verts.find(v => v.id === index);
		if (!vertex) return [];

		const result: number[] = [];

		switch (this.resultType) {
		case "Cell":
			// @java for (Cell cell : vertex.cells()) result.add(cell.index())
			for (const cell of (vertex.cells ?? [])) {
				result.push(cell.id);
			}
			break;
		case "Edge":
			// @java for (Edge edge : vertex.edges()) result.add(edge.index())
			for (const edge of (vertex.edges ?? [])) {
				const ei = topo.edgeEls.findIndex(e => e.va.id === edge.va.id && e.vb.id === edge.vb.id);
				if (ei !== -1) result.push(ei);
			}
			break;
		case "Vertex":
			// @java for (Edge edge : vertex.edges()) for (Cell vertex2 : edge.cells()) if (vertex2.index() != vertex.index()) result.add(vertex2.index())
			// Note: Java's code appears to use edge.cells() for Vertex result which is unusual — faithful port below
			for (const edge of (vertex.edges ?? [])) {
				for (const cell of (edge.cells ?? [])) {
					if (cell.id !== index) result.push(cell.id);
				}
			}
			break;
		default:
			break;
		}

		return this.filterByOwner(context, result);
	}

	/**
	 * @java — filterByOwner applied after result is computed, if ownerFn != null.
	 */
	private filterByOwner(context: Context & EvalScratch, result: number[]): number[] {
		if (this.ownerFn === null) {
			return result;
		}

		const resultOwner: number[] = [];
		const owner: number = this.ownerFn.eval(context);
		const cs = this.getCs(context);
		const numPlayers: number = this.getNumPlayers(context);

		// @java ContainerState cs = context.containerState(0)
		// @java for(int i = 0; i < result.size(); i++) { int who = cs.who(site, resultType); if ((who != 0 && owner == numPlayers) || who == owner) }
		for (const site of result) {
			const who: number = cs ? cs.who(site, this.resultType) : 0;
			if ((who !== 0 && owner === numPlayers) || who === owner) {
				resultOwner.push(site);
			}
		}

		return resultOwner;
	}

	/** @java SitesIncident.isStatic() */
	public override isStatic(): boolean {
		if (this.ownerFn !== null) {
			if (!(this.ownerFn as unknown as { isStatic?: () => boolean }).isStatic?.()) {
				return false;
			}
		}
		return (this.indexFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
	}

	/** @java SitesIncident.toString() */
	public override toString(): string {
		return "SitesIncident()";
	}
}
