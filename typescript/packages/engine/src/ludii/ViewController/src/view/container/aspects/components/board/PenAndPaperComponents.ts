// @java ViewController/src/view/container/aspects/components/board/PenAndPaperComponents.java

import {
	BasicStroke,
	Color,
	Ellipse2D,
	Line2D,
	Font,
	BOLD,
	CAP_ROUND,
	JOIN_MITER,
} from '../../../../../../../awt/index.js';
import type { Graphics2D, Point } from '../../../../../../../awt/index.js';
import { PuzzleComponents } from './PuzzleComponents.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java bridge.Bridge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.board.graph.PenAndPaperStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PenAndPaperStyle = any;

/** @java view.container.aspects.designs.board.puzzle.PuzzleDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PuzzleDesign = any;

/** @java other.topology.Vertex */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = any;

/** @java other.topology.Edge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Edge = any;

/** @java other.topology.TopologyElement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyElement = any;

/** @java other.state.container.ContainerState */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerState = any;

// ---------------------------------------------------------------------------

/**
 * Pen and Paper components properties.
 *
 * Faithful 1:1 port of view.container.aspects.components.board.PenAndPaperComponents.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.components.board.PenAndPaperComponents
 */
export class PenAndPaperComponents extends PuzzleComponents {

	/** @java PenAndPaperComponents#graphStyle */
	private readonly graphStyle: PenAndPaperStyle;

	/** @java PenAndPaperComponents#boardDesign */
	private readonly _boardDesign: PuzzleDesign;

	// -------------------------------------------------------------------------

	/**
	 * @java PenAndPaperComponents#PenAndPaperComponents(bridge.Bridge, view.container.styles.board.graph.PenAndPaperStyle, view.container.aspects.designs.board.puzzle.PuzzleDesign)
	 */
	constructor(bridge: Bridge, containerStyle: PenAndPaperStyle, boardDesign: PuzzleDesign) {
		super(bridge, containerStyle, boardDesign);
		this.graphStyle  = containerStyle;
		this._boardDesign = boardDesign;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java PenAndPaperComponents#drawComponents(java.awt.Graphics2D, other.context.Context)
	 */
	override drawComponents(g2d: Graphics2D, context: Context): void {
		const vertices: Vertex[] = this.graphStyle.topology().vertices() as Vertex[];
		const strokeThick: BasicStroke = this._boardDesign.strokeThick();
		const cs: ContainerState = context.state().containerStates()[0];

		if (context.metadata().graphics().replaceComponentsWithFilledCells()) {
			this.fillCellsBasedOnOwner(g2d, context);
		} else {
			this.drawComponentsElements(g2d, context, this.graphStyle.topology().cells() as TopologyElement[]);
			this.drawComponentsElements(g2d, context, this.graphStyle.topology().vertices() as TopologyElement[]);
		}

		// Pass 1: Draw thick black edges
		g2d.setColor(new Color(0, 0, 0));
		const slightlyThickerStroke = new BasicStroke(strokeThick.getLineWidth() + 4.0, CAP_ROUND, JOIN_MITER);
		g2d.setStroke(slightlyThickerStroke);

		for (const va of vertices) {
			const vaPosn: Point = this.graphStyle.screenPosn(va.centroid());
			for (const vb of va.orthogonal() as Vertex[]) {
				for (let e = 0; e < context.topology().edges().length; e++) {
					const edge: Edge = context.topology().edges()[e];
					if (
						(edge.vA() === va && edge.vB() === vb) ||
						(edge.vA() === vb && edge.vB() === va)
					) {
						if (cs.whatEdge(e) !== 0) {
							const vbPosn: Point = this.graphStyle.screenPosn(vb.centroid());
							const line = new Line2D.Double(vaPosn.x, vaPosn.y, vbPosn.x, vbPosn.y);
							(g2d as unknown as { draw(s: unknown): void }).draw(line);
						}
					}
				}
			}
		}

		// Pass 2: Redraw thinner edges in player colour
		const roundedThinStroke = new BasicStroke(strokeThick.getLineWidth(), CAP_ROUND, JOIN_MITER);
		g2d.setStroke(roundedThinStroke);

		for (const va of vertices) {
			const vaPosn: Point = this.graphStyle.screenPosn(va.centroid());
			for (const vb of va.orthogonal() as Vertex[]) {
				for (let e = 0; e < context.topology().edges().length; e++) {
					const edge: Edge = context.topology().edges()[e];
					if (
						(edge.vA() === va && edge.vB() === vb) ||
						(edge.vA() === vb && edge.vB() === va)
					) {
						if (cs.whatEdge(e) !== 0) {
							const vbPosn: Point = this.graphStyle.screenPosn(vb.centroid());
							const line = new Line2D.Double(vaPosn.x, vaPosn.y, vbPosn.x, vbPosn.y);
							g2d.setColor(this.bridge.settingsColour().playerColour(context, cs.whoEdge(e)));
							(g2d as unknown as { draw(s: unknown): void }).draw(line);
						}
					}
				}
			}
		}

		// If a puzzle, and edge is set to zero, draw a cross.
		const dim: number = this.puzzleStyle.topology().rows(context.board().defaultSite()).length;
		const bigFontSize: number = Math.trunc(0.75 * this.puzzleStyle.placement().getHeight() / dim + 0.5);
		const bigFont = new Font('Arial', BOLD, bigFontSize);
		g2d.setFont(bigFont);

		for (const e of this.graphStyle.topology().edges() as Edge[]) {
			if (
				cs.isResolved(e.index(), 'Edge') &&
				cs.what(e.index(), 'Edge') === 0
			) {
				const drawPosn: Point = this.graphStyle.screenPosn(e.centroid());
				const fm = g2d.getFontMetrics();
				const xW = fm.stringWidth('X');
				const xH = fm.getHeight();
				(g2d as unknown as { drawString(s: string, x: number, y: number): void })
					.drawString(
						'X',
						Math.trunc(drawPosn.x - xW / 2),
						Math.trunc(drawPosn.y + xH / 3)
					);
			}
		}

		// Draw vertices
		const rO: number = this.graphStyle.baseVertexRadius();
		for (const vertex of vertices) {
			if (cs.what(vertex.index(), 'Vertex') !== 0) {
				g2d.setColor(this.bridge.settingsColour().playerColour(context, cs.who(vertex.index(), 'Vertex')));
			} else {
				const boardColourInner = context.game().metadata().graphics().boardColour('InnerVertices');
				if (boardColourInner == null)
					g2d.setColor(this.graphStyle.baseGraphColour());
				else
					g2d.setColor(boardColourInner);
			}

			const circlePosn: Point = this.graphStyle.screenPosn(vertex.centroid());
			const ellipseO = new Ellipse2D.Double(circlePosn.x - rO, circlePosn.y - rO, 2 * rO, 2 * rO);
			g2d.fill(ellipseO);
		}
	}

	// -------------------------------------------------------------------------

	// -------------------------------------------------------------------------
}
