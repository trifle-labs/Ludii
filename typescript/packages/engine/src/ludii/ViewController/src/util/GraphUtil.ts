// @java ViewController/src/util/GraphUtil.java

/**
 * Functions relating to Graphs.
 *
 * @author Matthew.Stephenson
 * @java util.GraphUtil
 */

import {
	Color,
	BasicStroke,
	Line2D,
	SVGGraphics2D,
} from '../../../awt/index.js';
import type { Stroke } from '../../../awt/index.js';
import type { Point } from '../../../awt/index.js';

// Topology types — ported at src/ludemes/other/topology/
import type { Topology } from '../../../../ludemes/other/topology/Topology.js';
import type { Cell }     from '../../../../ludemes/other/topology/Cell.js';
import type { Edge }     from '../../../../ludemes/other/topology/Edge.js';
import type { Vertex }   from '../../../../ludemes/other/topology/Vertex.js';
import type { TopologyElement } from '../../../../ludemes/other/topology/TopologyElement.js';
import { Edge as EdgeClass }   from '../../../../ludemes/other/topology/Edge.js';
import { Vertex as VertexClass } from '../../../../ludemes/other/topology/Vertex.js';

// ---------------------------------------------------------------------------
// Properties bit constants
// @java game.util.graph.Properties
// Properties.OUTER = 1L << 1  →  bit position 1 in TopologyElement.Properties
// ---------------------------------------------------------------------------
const OUTER_BIT = 1; // Properties.OUTER bit position

// ---------------------------------------------------------------------------
// Local structural interfaces for not-yet-ported types
// ---------------------------------------------------------------------------

/**
 * Structural interface for the subset of BaseContainerStyle used by GraphUtil.
 * BaseContainerStyle will be ported in its own batch; we use a structural type
 * here to avoid cross-batch dependency.
 * @java view.container.BaseContainerStyle
 */
interface BaseContainerStyleLike {
	setSVGRenderingValues(): SVGGraphics2D;
	drawnEdges(): Edge[];
	drawnVertices(): Vertex[];
	drawnCells(): Cell[];
	/** @java BaseContainerStyle#screenPosn(java.awt.geom.Point2D) */
	screenPosn(posn: { getX(): number; getY(): number }): Point;
}

/**
 * Structural interface for the subset of Context used by GraphUtil.
 * @java other.context.Context
 */
interface ContextLike {
	game(): { isStacking(): boolean };
	board(): { topology(): { layers(type: string): unknown[][] } };
}

// ---------------------------------------------------------------------------
// Helper: wrap a {x, y} centroid as a Point2D-compatible argument
// ---------------------------------------------------------------------------
function centroidAsPoint2D(c: { x: number; y: number }): { getX(): number; getY(): number } {
	return { getX: () => c.x, getY: () => c.y };
}

// ===========================================================================
// Static methods
// ===========================================================================

/**
 * Returns a list of orthogonal cell connections within a given topology.
 * @java util.GraphUtil#orthogonalCellConnections(other.topology.Topology)
 */
export function orthogonalCellConnections(topology: Topology): Edge[] {
	const connections: Edge[] = [];
	for (const va of topology.cells()) {
		const drawPosnA = va.centroid();
		for (const vb of va.orthogonal() as Cell[]) {
			if (vb.index() > va.index()) {
				const drawPosnB = vb.centroid();
				connections.push(new EdgeClass(
					new VertexClass(-1, drawPosnA.x, drawPosnA.y, 0),
					new VertexClass(-1, drawPosnB.x, drawPosnB.y, 0),
				));
			}
		}
	}
	return connections;
}

// ---------------------------------------------------------------------------

/**
 * Returns a list of diagonal cell connections within a given topology.
 * @java util.GraphUtil#diagonalCellConnections(other.topology.Topology)
 */
export function diagonalCellConnections(topology: Topology): Edge[] {
	const connections: Edge[] = [];
	for (const va of topology.cells()) {
		const drawPosnA = va.centroid();
		for (const vb of va.diagonal() as Cell[]) {
			if (vb.index() > va.index()) {
				const drawPosnB = vb.centroid();
				connections.push(new EdgeClass(
					new VertexClass(-1, drawPosnA.x, drawPosnA.y, 0),
					new VertexClass(-1, drawPosnB.x, drawPosnB.y, 0),
				));
			}
		}
	}
	return connections;
}

// ---------------------------------------------------------------------------

/**
 * Returns a list of off-diagonal cell connections within a given topology.
 * @java util.GraphUtil#offCellConnections(other.topology.Topology)
 */
export function offCellConnections(topology: Topology): Edge[] {
	const connections: Edge[] = [];
	for (const va of topology.cells()) {
		const drawPosnA = va.centroid();
		for (const vb of va.off() as Cell[]) {
			if (vb.index() > va.index()) {
				const drawPosnB = vb.centroid();
				connections.push(new EdgeClass(
					new VertexClass(-1, drawPosnA.x, drawPosnA.y, 0),
					new VertexClass(-1, drawPosnB.x, drawPosnB.y, 0),
				));
			}
		}
	}
	return connections;
}

// ---------------------------------------------------------------------------

/**
 * Returns a list of orthogonal vertex-to-vertex connections within a given topology.
 * @java util.GraphUtil#orthogonalEdgeRelations(other.topology.Topology)
 */
export function orthogonalEdgeRelations(topology: Topology): Edge[] {
	const connections: Edge[] = [];
	for (const va of topology.vertices()) {
		const drawPosnA = va.centroid();
		for (const vb of va.orthogonal() as Vertex[]) {
			if (vb.index() > va.index()) {
				const drawPosnB = vb.centroid();
				connections.push(new EdgeClass(
					new VertexClass(-1, drawPosnA.x, drawPosnA.y, 0),
					new VertexClass(-1, drawPosnB.x, drawPosnB.y, 0),
				));
			}
		}
	}
	return connections;
}

// ---------------------------------------------------------------------------

/**
 * Returns a list of diagonal vertex-to-vertex connections within a given topology.
 * @java util.GraphUtil#diagonalEdgeRelations(other.topology.Topology)
 */
export function diagonalEdgeRelations(topology: Topology): Edge[] {
	const connections: Edge[] = [];
	for (const va of topology.vertices()) {
		const drawPosnA = va.centroid();
		for (const vb of va.diagonal() as Vertex[]) {
			if (vb.index() > va.index()) {
				const drawPosnB = vb.centroid();
				// Java uses actual va/vb indices here (not -1)
				connections.push(new EdgeClass(
					new VertexClass(va.index(), drawPosnA.x, drawPosnA.y, 0),
					new VertexClass(vb.index(), drawPosnB.x, drawPosnB.y, 0),
				));
			}
		}
	}
	return connections;
}

// ---------------------------------------------------------------------------

/**
 * Returns a list of inner edges within a given topology.
 * @java util.GraphUtil#innerEdgeRelations(other.topology.Topology)
 */
export function innerEdgeRelations(topology: Topology): Edge[] {
	const connections: Edge[] = [];
	for (const edge of topology.edges()) {
		// Properties.OUTER = 1L << 1 → bit position 1
		if (!edge.properties().get(OUTER_BIT)) {
			connections.push(edge);
		}
	}
	return connections;
}

// ---------------------------------------------------------------------------

/**
 * Returns a list of outer edges within a given topology.
 * @java util.GraphUtil#outerEdgeRelations(other.topology.Topology)
 */
export function outerEdgeRelations(topology: Topology): Edge[] {
	const connections: Edge[] = [];
	for (const edge of topology.edges()) {
		// Properties.OUTER = 1L << 1 → bit position 1
		if (edge.properties().get(OUTER_BIT)) {
			connections.push(edge);
		}
	}
	return connections;
}

// ---------------------------------------------------------------------------

/**
 * Creates an SVG graph image for a given container style.
 * Draws solid edges, dashed diagonal vertex connections, dotted off-diagonal
 * vertex connections, and solid vertex circles.
 * @java util.GraphUtil#createSVGGraphImage(view.container.BaseContainerStyle)
 */
export function createSVGGraphImage(boardStyle: BaseContainerStyleLike): string {
	const g2d: SVGGraphics2D = boardStyle.setSVGRenderingValues();

	g2d.setBackground(new Color(0, 0, 0, 0));
	g2d.setColor(new Color(120, 120, 120));

	const solid: Stroke  = new BasicStroke(2, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND);
	const dashed: Stroke = new BasicStroke(2, BasicStroke.CAP_BUTT,  BasicStroke.JOIN_ROUND, 0, [10], 0);
	const dotted: Stroke = new BasicStroke(2, BasicStroke.CAP_BUTT,  BasicStroke.JOIN_ROUND, 0, [3],  0);

	// Solid: drawn edges
	g2d.setStroke(solid);
	for (const e of boardStyle.drawnEdges()) {
		const drawPosnA = boardStyle.screenPosn(centroidAsPoint2D(e.vA().centroid()));
		const drawPosnB = boardStyle.screenPosn(centroidAsPoint2D(e.vB().centroid()));
		const line = new Line2D(drawPosnA.x, drawPosnA.y, drawPosnB.x, drawPosnB.y);
		g2d.draw(line);
	}

	// Dashed: diagonal vertex connections
	g2d.setStroke(dashed);
	for (const vA of boardStyle.drawnVertices()) {
		for (const vB of vA.diagonal() as Vertex[]) {
			if (vA.index() > vB.index()) {
				const drawPosnA = boardStyle.screenPosn(centroidAsPoint2D(vA.centroid()));
				const drawPosnB = boardStyle.screenPosn(centroidAsPoint2D(vB.centroid()));
				const line = new Line2D(drawPosnA.x, drawPosnA.y, drawPosnB.x, drawPosnB.y);
				g2d.draw(line);
			}
		}
	}

	// Dotted: off-diagonal vertex connections
	g2d.setStroke(dotted);
	for (const vA of boardStyle.drawnVertices()) {
		for (const vB of vA.off() as Vertex[]) {
			if (vA.index() > vB.index()) {
				const drawPosnA = boardStyle.screenPosn(centroidAsPoint2D(vA.centroid()));
				const drawPosnB = boardStyle.screenPosn(centroidAsPoint2D(vB.centroid()));
				const line = new Line2D(drawPosnA.x, drawPosnA.y, drawPosnB.x, drawPosnB.y);
				g2d.draw(line);
			}
		}
	}

	// Solid: vertex circles
	g2d.setStroke(solid);
	for (const va of boardStyle.drawnVertices()) {
		const r = 4;
		const drawPosn = boardStyle.screenPosn(centroidAsPoint2D(va.centroid()));
		g2d.fillArc(drawPosn.x - r, drawPosn.y - r, 2 * r + 1, 2 * r + 1, 0, 360);
	}

	return g2d.getSVGDocument();
}

// ---------------------------------------------------------------------------

/**
 * Creates an SVG connections image for a given container style.
 * Draws solid orthogonal, dashed diagonal, and dotted off-diagonal cell
 * connections, plus solid cell circles.
 * @java util.GraphUtil#createSVGConnectionsImage(view.container.BaseContainerStyle)
 */
export function createSVGConnectionsImage(boardStyle: BaseContainerStyleLike): string {
	const g2d: SVGGraphics2D = boardStyle.setSVGRenderingValues();

	g2d.setBackground(new Color(0, 0, 0, 0));
	g2d.setColor(new Color(127, 127, 255));

	const solid: Stroke  = new BasicStroke(2, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND);
	const dashed: Stroke = new BasicStroke(2, BasicStroke.CAP_BUTT,  BasicStroke.JOIN_ROUND, 0, [10], 0);
	const dotted: Stroke = new BasicStroke(2, BasicStroke.CAP_BUTT,  BasicStroke.JOIN_ROUND, 0, [3],  0);

	const cells = boardStyle.drawnCells();

	// Solid: orthogonal cell connections
	g2d.setStroke(solid);
	for (const vA of cells) {
		if (vA.centroid().x < 0 || vA.centroid().y < 0) continue;
		for (const vB of vA.orthogonal() as Cell[]) {
			const vBDrawn = cells[vB.index()];
			if (vBDrawn === undefined) continue;
			if (vBDrawn.centroid().x < 0 || vBDrawn.centroid().y < 0) continue;
			if (vA.index() > vBDrawn.index()) {
				const drawPosnA = boardStyle.screenPosn(centroidAsPoint2D(vA.centroid()));
				const drawPosnB = boardStyle.screenPosn(centroidAsPoint2D(vBDrawn.centroid()));
				const line = new Line2D(drawPosnA.x, drawPosnA.y, drawPosnB.x, drawPosnB.y);
				g2d.draw(line);
			}
		}
	}

	// Dashed: diagonal cell connections
	g2d.setStroke(dashed);
	for (const vA of cells) {
		if (vA.centroid().x < 0 || vA.centroid().y < 0) continue;
		for (const vB of vA.diagonal() as Cell[]) {
			const vBDrawn = cells[vB.index()];
			if (vBDrawn === undefined) continue;
			if (vBDrawn.centroid().x < 0 || vBDrawn.centroid().y < 0) continue;
			if (vA.index() > vBDrawn.index()) {
				const drawPosnA = boardStyle.screenPosn(centroidAsPoint2D(vA.centroid()));
				const drawPosnB = boardStyle.screenPosn(centroidAsPoint2D(vBDrawn.centroid()));
				const line = new Line2D(drawPosnA.x, drawPosnA.y, drawPosnB.x, drawPosnB.y);
				g2d.draw(line);
			}
		}
	}

	// Dotted: off-diagonal cell connections
	g2d.setStroke(dotted);
	for (const vA of cells) {
		if (vA.centroid().x < 0 || vA.centroid().y < 0) continue;
		for (const vB of vA.off() as Cell[]) {
			const vBDrawn = cells[vB.index()];
			if (vBDrawn === undefined) continue;
			if (vBDrawn.centroid().x < 0 || vBDrawn.centroid().y < 0) continue;
			if (vA.index() > vBDrawn.index()) {
				const drawPosnA = boardStyle.screenPosn(centroidAsPoint2D(vA.centroid()));
				const drawPosnB = boardStyle.screenPosn(centroidAsPoint2D(vBDrawn.centroid()));
				const line = new Line2D(drawPosnA.x, drawPosnA.y, drawPosnB.x, drawPosnB.y);
				g2d.draw(line);
			}
		}
	}

	// Solid: cell circles
	g2d.setStroke(solid);
	for (const vA of cells) {
		if (vA.centroid().x < 0 || vA.centroid().y < 0) continue;
		const r = 4;
		const drawPosn = boardStyle.screenPosn(centroidAsPoint2D(vA.centroid()));
		g2d.fillArc(drawPosn.x - r, drawPosn.y - r, 2 * r + 1, 2 * r + 1, 0, 360);
	}

	return g2d.getSVGDocument();
}

// ---------------------------------------------------------------------------

/**
 * Reorders the graph elements of a given topology to be top-down,
 * based on their Y-position and layer value (z-position).
 * @java util.GraphUtil#reorderGraphElementsTopDown(java.util.List, other.context.Context)
 */
export function reorderGraphElementsTopDown(
	allGraphElements: TopologyElement[],
	context: ContextLike,
): TopologyElement[] {
	// Reorder the elements based on their Y position (for stacking games).
	if (context.game().isStacking()) {
		allGraphElements.sort((o1, o2) => o1.centroid().y - o2.centroid().y);
		allGraphElements.reverse();
	}
	// Reorder the elements based on their layer value (for multi-layer boards).
	else if (context.board().topology().layers('Vertex').length > 1) {
		allGraphElements.sort((o1, o2) => o1.layer() - o2.layer());
	}
	return allGraphElements;
}

// ---------------------------------------------------------------------------

/**
 * Calculates the radius of a given cell as the average distance from the
 * cell's centroid to each edge midpoint.
 * @java util.GraphUtil#calculateCellRadius(other.topology.Cell)
 */
export function calculateCellRadius(cell: Cell): number {
	let acc = 0;
	const edges = cell.edges();
	if (edges.length > 0) {
		for (const edge of edges) {
			const midpoint = edge.centroid();
			const dx = midpoint.x - cell.centroid().x;
			const dy = midpoint.y - cell.centroid().y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			acc += dist;
		}
		acc /= edges.length;
	}
	return acc;
}

// ---------------------------------------------------------------------------

/**
 * Namespace alias matching the Java static class API.
 * @java util.GraphUtil
 */
export const GraphUtil = {
	orthogonalCellConnections,
	diagonalCellConnections,
	offCellConnections,
	orthogonalEdgeRelations,
	diagonalEdgeRelations,
	innerEdgeRelations,
	outerEdgeRelations,
	createSVGGraphImage,
	createSVGConnectionsImage,
	reorderGraphElementsTopDown,
	calculateCellRadius,
} as const;
