// @java ViewController/src/util/ContainerUtil.java

/**
 * Functions that assist with container graphics.
 *
 * Faithful 1:1 port of util.ContainerUtil.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java util.ContainerUtil
 */

import { TopologyElement } from '../../../../ludemes/other/topology/TopologyElement.js';
import type { Topology } from '../../../../ludemes/other/topology/Topology.js';
import type { Edge } from '../../../../ludemes/other/topology/Edge.js';
import type { Location } from '../../../../ludemes/other/location/Location.js';
import type { SiteType } from '../../../../ludemes/other/action/SiteType.js';

// ---------------------------------------------------------------------------
// Minimal Java constant
// @java main.Constants.UNDEFINED = -1
// ---------------------------------------------------------------------------

const UNDEFINED = -1;

// ---------------------------------------------------------------------------
// Minimal duck-typed interfaces — enough for ContainerUtil's callers.
// ---------------------------------------------------------------------------

/**
 * The subset of Context that ContainerUtil calls.
 * @java other.context.Context
 */
interface ContainerUtilContext {
  /** @java Context#sitesFrom() */
  sitesFrom(): number[];
  /** @java Context#containerId() */
  containerId(): number[];
  /** @java Context#board() */
  board(): ContainerUtilBoard;
  /** @java Context#game() */
  game(): ContainerUtilGame;
}

/** Minimal Board duck-type. */
interface ContainerUtilBoard {
  /** @java Container#index() */
  index(): number;
  /** @java Board#topology() */
  topology(): Topology;
}

/** Minimal Equipment duck-type. */
interface ContainerUtilEquipment {
  /** @java Equipment#regions() */
  regions(): ContainerUtilRegion[];
}

/** Minimal Game duck-type. */
interface ContainerUtilGame {
  /** @java Game#equipment() */
  equipment(): ContainerUtilEquipment;
}

/** Minimal Region duck-type (from game.equipment.other.Regions). */
interface ContainerUtilRegion {
  /** @java Regions#eval(Context) */
  eval(context: ContainerUtilContext): number[];
}

/** Minimal Container duck-type (from game.equipment.container.Container). */
interface ContainerUtilContainer {
  /** @java Container#topology() */
  topology(): Topology;
}

/**
 * Minimal Component duck-type.
 * @java game.equipment.component.Component
 */
interface ContainerUtilComponent {
  /** @java Component#isLargePiece() */
  isLargePiece(): boolean;
  /**
   * @java Component#locs(Context, int, int, Topology) — returns TIntArrayList
   * In TS we use a number[] (Trove TIntArrayList → number[]).
   */
  locs(
    context: ContainerUtilContext,
    site: number,
    localState: number,
    topology: Topology,
  ): number[];
}

// ---------------------------------------------------------------------------

export class ContainerUtil {

	// -------------------------------------------------------------------------

	/**
	 * Get the container site that a specified location is on.
	 *
	 * @java util.ContainerUtil#getContainerSite(Context, int, SiteType)
	 */
	static getContainerSite(
		context: ContainerUtilContext,
		site: number,
		graphElementType: SiteType,
	): number {
		if (site === UNDEFINED)
			return UNDEFINED;

		if (graphElementType === 'Cell') {
			const containerId = ContainerUtil.getContainerId(context, site, graphElementType);
			const containerSite = site - context.sitesFrom()[containerId]!;
			return containerSite;
		}

		return site;
	}

	// -------------------------------------------------------------------------

	/**
	 * Get the container index that a specified location is on.
	 *
	 * @java util.ContainerUtil#getContainerId(Context, int, SiteType)
	 */
	static getContainerId(
		context: ContainerUtilContext,
		site: number,
		graphElementType: SiteType,
	): number {
		if (site === UNDEFINED)
			return UNDEFINED;

		// vertices and edges are only on board!
		if (graphElementType !== 'Cell')
			return context.board().index();

		return context.containerId()[site]!;
	}

	// -------------------------------------------------------------------------

	/**
	 * Normalise the graph to fill the world space.
	 *
	 * @java util.ContainerUtil#normaliseGraphElements(Topology)
	 */
	static normaliseGraphElements(graph: Topology): void {
		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		for (let i = 0; i < graph.vertices().length; i++) {
			const centroid = graph.vertices()[i]!.centroid();

			const cx = centroid.x;
			const cy = centroid.y;

			if (cx < minX)
				minX = cx;
			if (cy < minY)
				minY = cy;

			if (cx > maxX)
				maxX = cx;
			if (cy > maxY)
				maxY = cy;
		}

		// Choose smallest range to normalise on
		let min = minX;
		let max = maxX;

		if (maxX - minX < maxY - minY) {
			min = minY;
			max = maxY;
		}

		// Normalise elements
		ContainerUtil._normaliseGraphElementsList(graph.vertices() as TopologyElement[], min, max);
		ContainerUtil._normaliseGraphElementsList(graph.edges() as TopologyElement[], min, max);
		ContainerUtil._normaliseGraphElementsList(graph.cells() as TopologyElement[], min, max);
	}

	// -------------------------------------------------------------------------

	/**
	 * Normalise graph elements to the provided range.
	 *
	 * @java util.ContainerUtil#normaliseGraphElements(ArrayList, double, double)
	 */
	private static _normaliseGraphElementsList(
		graphElements: TopologyElement[],
		min: number,
		max: number,
	): void {
		for (let i = 0; i < graphElements.length; i++) {
			const oldX = graphElements[i]!.centroid().x;
			const oldY = graphElements[i]!.centroid().y;
			const newX = (oldX - min) / (max - min);
			const newY = (oldY - min) / (max - min);
			graphElements[i]!.setCentroid(newX, newY, 0);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Center the graph within the world space.
	 *
	 * @java util.ContainerUtil#centerGraphElements(Topology)
	 */
	static centerGraphElements(graph: Topology): void {
		let minX = 9999999;
		let minY = 99999999;
		let maxX = -99999999;
		let maxY = -99999999;

		for (let i = 0; i < graph.vertices().length; i++) {
			if (graph.vertices()[i]!.centroid().x < minX)
				minX = graph.vertices()[i]!.centroid().x;
			if (graph.vertices()[i]!.centroid().y < minY)
				minY = graph.vertices()[i]!.centroid().y;
			if (graph.vertices()[i]!.centroid().x > maxX)
				maxX = graph.vertices()[i]!.centroid().x;
			if (graph.vertices()[i]!.centroid().y > maxY)
				maxY = graph.vertices()[i]!.centroid().y;
		}

		ContainerUtil._centerGraphElementsBetween(
			graph.vertices() as TopologyElement[],
			minX, maxX, minY, maxY,
		);
		ContainerUtil._centerGraphElementsBetween(
			graph.edges() as TopologyElement[],
			minX, maxX, minY, maxY,
		);
		ContainerUtil._centerGraphElementsBetween(
			graph.cells() as TopologyElement[],
			minX, maxX, minY, maxY,
		);
	}

	// -------------------------------------------------------------------------

	/**
	 * Centers the provided list of graph elements between the minimum and maximum
	 * values along both dimensions.
	 *
	 * @java util.ContainerUtil#centerGraphElementsBetween(ArrayList, double, double, double, double)
	 */
	private static _centerGraphElementsBetween(
		graphElements: TopologyElement[],
		minX: number,
		maxX: number,
		minY: number,
		maxY: number,
	): void {
		const currentMidX = (maxX + minX) / 2;
		const currentMidY = (maxY + minY) / 2;
		const differenceX = currentMidX - 0.5;
		const differenceY = currentMidY - 0.5;

		for (let i = 0; i < graphElements.length; i++) {
			const oldX = graphElements[i]!.centroid().x;
			const oldY = graphElements[i]!.centroid().y;
			const newX = oldX - differenceX;
			const newY = oldY - differenceY;
			graphElements[i]!.setCentroid(newX, newY, 0);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * @return Cell indices of a container that a component is covering.
	 *
	 * @java util.ContainerUtil#cellsCoveredByPiece(Context, Container, Component, int, int)
	 */
	static cellsCoveredByPiece(
		context: ContainerUtilContext,
		container: ContainerUtilContainer,
		component: ContainerUtilComponent,
		site: number,
		localState: number,
	): number[] {
		const cellsCoveredByPiece: number[] = [];
		if (component.isLargePiece()) {
			// component.locs returns a number[] (TIntArrayList equivalent)
			const largePieceSites = component.locs(context, site, localState, container.topology());
			for (let i = 0; i < largePieceSites.length; i++) {
				cellsCoveredByPiece.push(container.topology().cells()[largePieceSites[i]!]!.index());
			}
		} else {
			cellsCoveredByPiece.push(site);
		}
		return cellsCoveredByPiece;
	}

	// -------------------------------------------------------------------------

	/**
	 * @return A region from equipment that this edge belongs to.
	 *
	 * @java util.ContainerUtil#getRegionOfEdge(Context, Edge)
	 */
	static getRegionOfEdge(
		context: ContainerUtilContext,
		e: Edge,
	): ContainerUtilRegion | null {
		for (const region of context.game().equipment().regions()) {
			for (const site of region.eval(context)) {
				for (const edge of context.board().topology().cells()[site]!.edges()) {
					if ((edge as Edge).index() === e.index())
						return region;
				}
			}
		}
		return null;
	}

	// -------------------------------------------------------------------------

	/**
	 * @return Edges of cellIndex and are on the perimeter of surroundedRegions.
	 *
	 * @java util.ContainerUtil#getOuterRegionEdges(List, Topology)
	 */
	static getOuterRegionEdges(
		region: Location[],
		topology: Topology,
	): Edge[] {
		const regionLines: Edge[] = [];
		const outsideRegionLines: Edge[] = [];

		for (const location of region) {
			for (const e of topology.getGraphElement('Cell', location.site())!.regionEdges() as Edge[]) {
				regionLines.push(e);
			}
		}

		for (const edge1 of regionLines) {
			let numContains = 0;
			for (const edge2 of regionLines) {
				if (
					Math.abs(edge1.vA().centroid().x - edge2.vA().centroid().x) < 0.0001 &&
					Math.abs(edge1.vB().centroid().x - edge2.vB().centroid().x) < 0.0001 &&
					Math.abs(edge1.vA().centroid().y - edge2.vA().centroid().y) < 0.0001 &&
					Math.abs(edge1.vB().centroid().y - edge2.vB().centroid().y) < 0.0001
				) {
					numContains++;
				} else if (
					Math.abs(edge1.vA().centroid().x - edge2.vB().centroid().x) < 0.0001 &&
					Math.abs(edge1.vB().centroid().x - edge2.vA().centroid().x) < 0.0001 &&
					Math.abs(edge1.vA().centroid().y - edge2.vB().centroid().y) < 0.0001 &&
					Math.abs(edge1.vB().centroid().y - edge2.vA().centroid().y) < 0.0001
				) {
					numContains++;
				}
			}
			if (numContains === 1) {
				outsideRegionLines.push(edge1);
			}
		}

		return outsideRegionLines;
	}

	// -------------------------------------------------------------------------

}
