// @java ViewController/src/view/container/aspects/designs/board/graph/GraphDesign.java

/**
 * Design for graph-based boards (Go-style, connection games, deduction puzzles).
 *
 * Renders:
 * - inner / outer / diagonal edges with optional sunken-depth shadow offset
 * - orthogonal / diagonal / off-diagonal connections
 * - directional arrow heads on edges
 * - vertices as filled circles
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.graph.GraphDesign.
 *
 * @author matthew.stephenson and cambolbro (Java original)
 * @java view.container.aspects.designs.board.graph.GraphDesign
 */

// PuzzleDesign   -> batch 23: src/ludii/ViewController/src/view/container/aspects/designs/board/puzzle/PuzzleDesign.ts
// BoardStyle (GraphStyle) -> batch 23 / 21
// BoardPlacement -> batch 28
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// StrokeUtil     -> src/ludii/ViewController/src/util/StrokeUtil.ts
// awt shims      -> src/ludii/awt/index.ts
// metadata types -> src/ludemes/metadata/graphics/util/...

import {
	AffineTransform,
	BasicStroke,
	Color,
	Line2D,
	Polygon,
	SVGGraphics2D,
	Point,
} from '../../../../../../../../awt/index.js';
import { Bridge } from '../../../../../../bridge/Bridge.js';
import { StrokeUtil } from '../../../../../../util/StrokeUtil.js';
import type { EdgeType } from '../../../../../../../../../ludemes/metadata/graphics/util/EdgeType.js';
import type { RelationType } from '../../../../../../../../../ludemes/game/types/board/RelationType.js';
import { edgeTypeSupersetOf } from '../../../../../../../../../ludemes/metadata/graphics/util/EdgeType.js';
import { relationSupersetOf } from '../../../../../../../../../ludemes/game/types/board/RelationType.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.board.graph.GraphStyle (extends BoardStyle) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/** @java other.topology.Edge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyEdge = any;

/** @java metadata.graphics.util.EdgeInfoGUI */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EdgeInfoGUI = any;

/** @java metadata.graphics.util.LineStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LineStyle = any;

/** @java other.location.Location */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Location = any;

/** @java java.awt.geom.Point2D */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Point2D = any;

/**
 * GraphDesign — graph-topology board rendering.
 *
 * Java source:
 *   public class GraphDesign extends PuzzleDesign {
 *     protected boolean drawOrthogonalEdges;
 *     protected boolean drawDiagonalEdges;
 *     protected boolean drawOffEdges = false;
 *     protected boolean drawOrthogonalConnections = false;
 *     protected boolean drawDiagonalConnections = false;
 *     protected boolean drawOffConnections = false;
 *
 *     public GraphDesign(BoardStyle boardStyle, BoardPlacement boardPlacement,
 *         boolean drawOrthogonals, boolean drawDiagonals) { ... }
 *
 *     @Override
 *     public String createSVGImage(Bridge bridge, Context context) { ... }
 *     protected void drawEdge(...) { ... }
 *     protected static void drawArrowHead(Graphics2D g2d, Line2D line, BasicStroke stroke) { ... }
 *     protected void drawArrowHeads(Graphics2D g2d, BasicStroke stroke, Edge edge) { ... }
 *   }
 *
 * @java view.container.aspects.designs.board.graph.GraphDesign
 */
export class GraphDesign {

	/** @java GraphDesign#boardStyle */
	protected readonly boardStyle: GraphStyle;

	/** @java GraphDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// ---- GraphDesign-specific flags ----
	// Note: TS doesn't allow a boolean field and a method to share the same name.
	// Fields that conflict with inherited BoardDesign methods are prefixed with '_'.

	/**
	 * @java GraphDesign#drawOrthogonalEdges
	 * (boolean field — renamed _drawOrthogonalEdges to avoid clash with inherited method)
	 */
	protected _drawOrthogonalEdges: boolean;

	/**
	 * @java GraphDesign#drawDiagonalEdges
	 * (boolean field — renamed to avoid clash with inherited method)
	 */
	protected _drawDiagonalEdges: boolean;

	/** @java GraphDesign#drawOffEdges */
	protected drawOffEdges = false;

	/**
	 * @java GraphDesign#drawOrthogonalConnections
	 * (boolean field — renamed to avoid clash with inherited method)
	 */
	protected _drawOrthogonalConnections = false;

	/**
	 * @java GraphDesign#drawDiagonalConnections
	 * (boolean field — renamed to avoid clash with inherited method)
	 */
	protected _drawDiagonalConnections = false;

	/** @java GraphDesign#drawOffConnections */
	protected drawOffConnections = false;

	// ---- Inherited from PuzzleDesign / BoardDesign (escape-hatched) ----

	/** @java PuzzleDesign#hintValues */
	protected hintValues: number[] | null = null;

	/** @java PuzzleDesign#hintDirections */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected hintDirections: any[] = [];

	/** @java PuzzleDesign#locationValues */
	protected locationValues: Location[] = [];

	/** @java PuzzleDesign#hintRegions */
	protected hintRegions: Array<Location[]> = [];

	/** @java PuzzleDesign#hintLocationType */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected hintLocationType: any = 'Default';

	/** @java BoardDesign#colorEdgesInner */
	protected colorEdgesInner: Color | null = null;

	/** @java BoardDesign#colorEdgesOuter */
	protected colorEdgesOuter: Color | null = null;

	/**
	 * @java BoardDesign#strokeThin (field)
	 * Backing field; accessed via strokeThin getter/directly.
	 */
	protected strokeThin: BasicStroke = new BasicStroke(1);

	/**
	 * @java BoardDesign#strokeThick (field)
	 * Backing field; the Java method strokeThick() that returns this field
	 * is shadowed below.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected _strokeThickField: BasicStroke = new BasicStroke(2);

	/**
	 * @java BoardDesign#colorSymbol (field)
	 * Backing field; the Java method colorSymbol() is below.
	 */
	protected _colorSymbolField: Color | null = null;

	/** @java BoardDesign#colorFillPhase0 */
	protected colorFillPhase0: Color | null = null;

	/** @java BoardDesign#symbols */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected symbols: any[] = [];

	/** @java BoardDesign#checkeredBoard */
	protected checkeredBoard = false;

	/** @java BoardDesign#straightLines */
	protected straightLines = false;

	// -------------------------------------------------------------------------

	/**
	 * @java GraphDesign#GraphDesign(view.container.styles.BoardStyle,
	 *   view.container.aspects.placement.BoardPlacement, boolean, boolean)
	 */
	constructor(
		boardStyle: GraphStyle,
		boardPlacement: BoardPlacement,
		drawOrthogonals: boolean,
		drawDiagonals: boolean,
	) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
		this._drawOrthogonalEdges = drawOrthogonals;
		this._drawDiagonalEdges   = drawDiagonals;
	}

	// -------------------------------------------------------------------------

	/**
	 * Renders the full graph design.
	 * @returns SVG as string.
	 * @java GraphDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();

		// Set vertex radius
		let vr: number = 0.3 * this.cellRadiusPixels();
		if (vr < 4) vr = 4;
		if (vr > 8) vr = 8;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const boardGraphicsMetadata: any = context.game().metadata().graphics();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const gs = this.boardStyle as any;
		gs.setBaseVertexRadius(vr * boardGraphicsMetadata.boardThickness('InnerVertices'));
		gs.setBaseLineWidth(0.666 * vr);

		const swThin  = gs.baseLineWidth() as number;
		const swThick = swThin;

		this.straightLines = boardGraphicsMetadata.straightRingLines();

		const decorationColour = new Color(200, 200, 200);

		this.setStrokesAndColours(
			bridge,
			context,
			gs.baseGraphColour(),
			gs.baseGraphColour(),
			null,
			null,
			null,
			null,
			null,
			null,
			decorationColour,
			swThin,
			swThick,
		);

		this.drawGround(g2d, context, true);

		// ---- Sunken design ----
		if (!boardGraphicsMetadata.noSunken()) {
			const offY = -1.5;
			const sunkenColour = new Color(100, 100, 100);

			if (this.colorEdgesInner === null || this.colorEdgesInner.getAlpha() !== 0) {
				this.drawEdge(g2d, context, sunkenColour, this.strokeThin, 'Inner', 'Orthogonal', false, this._drawOrthogonalEdges, offY);
			}
			if (this.colorEdgesOuter === null || this.colorEdgesOuter.getAlpha() !== 0) {
				this.drawEdge(g2d, context, sunkenColour, this.strokeThick(), 'Outer', 'Orthogonal', false, this._drawOrthogonalEdges, offY);
			}
			if (this.colorEdgesInner === null || this.colorEdgesInner.getAlpha() !== 0) {
				this.drawEdge(g2d, context, sunkenColour, StrokeUtil.getDottedStroke(this.strokeThin.getLineWidth()), 'All', 'Diagonal', false, this._drawDiagonalEdges, offY);
				this.drawEdge(g2d, context, sunkenColour, this.strokeThin, 'Inner', 'Orthogonal', true, this._drawOrthogonalConnections, offY);
				this.drawEdge(g2d, context, sunkenColour, StrokeUtil.getDottedStroke(this.strokeThin.getLineWidth()), 'All', 'Diagonal', true, this._drawDiagonalConnections, offY);
				this.drawEdge(g2d, context, sunkenColour, StrokeUtil.getDashedStroke(this.strokeThin.getLineWidth()), 'All', 'OffDiagonal', true, this.drawOffConnections, offY);
			}
			this.drawVertices(bridge, g2d, context, sunkenColour, gs.baseVertexRadius(), offY);
		}

		this.drawEdge(g2d, context, this.colorEdgesInner, this.strokeThin, 'Inner', 'Orthogonal', false, this._drawOrthogonalEdges, 0);
		this.drawEdge(g2d, context, this.colorEdgesOuter, this.strokeThick(), 'Outer', 'Orthogonal', false, this._drawOrthogonalEdges, 0);
		this.drawEdge(g2d, context, this.colorEdgesInner, StrokeUtil.getDottedStroke(this.strokeThin.getLineWidth()), 'All', 'Diagonal', false, this._drawDiagonalEdges, 0);
		this.drawEdge(g2d, context, this.colorEdgesInner, this.strokeThin, 'Inner', 'Orthogonal', true, this._drawOrthogonalConnections, 0);
		this.drawEdge(g2d, context, this.colorEdgesInner, StrokeUtil.getDottedStroke(this.strokeThin.getLineWidth()), 'All', 'Diagonal', true, this._drawDiagonalConnections, 0);
		this.drawEdge(g2d, context, this.colorEdgesInner, StrokeUtil.getDashedStroke(this.strokeThin.getLineWidth()), 'All', 'OffDiagonal', true, this.drawOffConnections, 0);

		// Draw arrow heads
		if (context.metadata().graphics().showEdgeDirections()) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const edges: TopologyEdge[] = (this as any).topology().edges();
			for (const edge of edges)
				this.drawArrowHeads(g2d, this.strokeThin, edge);
		}

		this.drawVertices(bridge, g2d, context, gs.baseVertexRadius());

		this.drawSymbols(g2d, context);

		if (context.game().isDeductionPuzzle() && boardGraphicsMetadata.showRegionOwner())
			this.drawRegions(g2d, context, this.colorSymbol(), this._strokeThickField, this.hintRegions);

		this.drawGround(g2d, context, false);

		return g2d.getSVGDocument();
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws a specified edge of the board/graph based on type and relation.
	 * Checks metadata to see if any specific style or colour has been defined.
	 *
	 * @java GraphDesign#drawEdge(java.awt.Graphics2D, other.context.Context,
	 *   java.awt.Color, java.awt.Stroke, metadata.graphics.util.EdgeType,
	 *   game.types.board.RelationType, boolean, boolean, double)
	 */
	protected drawEdge(
		g2d: SVGGraphics2D,
		context: Context,
		defaultLineColour: Color | null,
		defaultLineStroke: BasicStroke,
		edgeType: EdgeType,
		relationType: RelationType,
		connection: boolean,
		alwaysDraw: boolean,
		offsetY: number,
	): void {
		// Check Metadata to see if any specific style or colour has been defined
		let lineColour  = defaultLineColour;
		let lineStroke: BasicStroke = defaultLineStroke;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const edgeInfoGUI: EdgeInfoGUI = context.game().metadata().graphics().drawEdge(edgeType, relationType, connection);

		if (edgeInfoGUI !== null && edgeInfoGUI !== undefined) {
			if ((edgeInfoGUI.getStyle() as string) === 'Hidden')
				return;

			if (edgeInfoGUI.getColour() !== null && edgeInfoGUI.getColour() !== undefined)
				lineColour = edgeInfoGUI.getColour();

			if (edgeInfoGUI.getStyle() !== null && edgeInfoGUI.getStyle() !== undefined) {
				const s = StrokeUtil.getStrokeFromStyle(edgeInfoGUI.getStyle() as LineStyle, this.strokeThin, this._strokeThickField);
				if (s !== null) lineStroke = s;
			}
		}

		if (alwaysDraw || (edgeInfoGUI !== null && edgeInfoGUI !== undefined)) {
			if (relationSupersetOf(relationType, 'Orthogonal')) {
				if (connection) {
					this.drawOrthogonalConnections(g2d, context, lineColour, lineStroke, offsetY);
				} else {
					if (edgeTypeSupersetOf(edgeType, 'Inner'))
						this.drawInnerCellEdges(g2d, context, lineColour, lineStroke, offsetY);
					if (edgeTypeSupersetOf(edgeType, 'Outer'))
						this.drawOuterCellEdges(g2d, context, lineColour, lineStroke, offsetY);
				}
			}
			if (relationSupersetOf(relationType, 'Diagonal')) {
				if (connection)
					this.drawDiagonalConnections(g2d, context, lineColour, lineStroke, offsetY);
				else
					this.drawDiagonalEdges(g2d, context, lineColour, lineStroke, offsetY);
			}
			if (relationSupersetOf(relationType, 'OffDiagonal')) {
				if (connection)
					this.drawOffDiagonalConnections(g2d, context, lineColour, lineStroke, offsetY);
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws arrow heads on the edge if it is directional.
	 * @java GraphDesign#drawArrowHeads(java.awt.Graphics2D, java.awt.BasicStroke, other.topology.Edge)
	 */
	protected drawArrowHeads(g2d: SVGGraphics2D, stroke: BasicStroke, edge: TopologyEdge): void {
		const drawPosnA: Point = this.screenPosn(edge.vA().centroid());
		const drawPosnB: Point = this.screenPosn(edge.vB().centroid());

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ((edge.constructor as any).toB?.())
			GraphDesign.drawArrowHead(g2d,
				new Line2D(drawPosnA.x, drawPosnA.y, drawPosnB.x, drawPosnB.y), stroke);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ((edge.constructor as any).toA?.())
			GraphDesign.drawArrowHead(g2d,
				new Line2D(drawPosnB.x, drawPosnB.y, drawPosnA.x, drawPosnA.y), stroke);
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws an arrow head on the line passed in.
	 * @java GraphDesign#drawArrowHead(java.awt.Graphics2D, java.awt.geom.Line2D, java.awt.BasicStroke)
	 */
	protected static drawArrowHead(g2d: SVGGraphics2D, line: Line2D, stroke: BasicStroke): void {
		const strokeWidth = Math.trunc(stroke.getLineWidth()) * 4;
		const arrowHead = new Polygon();
		arrowHead.addPoint(0, 0);
		arrowHead.addPoint(Math.trunc(-strokeWidth / 1.5), -strokeWidth);
		arrowHead.addPoint(Math.trunc(strokeWidth / 1.5), -strokeWidth);

		const tx = new AffineTransform();
		tx.setToIdentity();
		const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
		tx.translate(line.x2, line.y2);
		tx.rotate(angle - Math.PI / 2);

		const savedTransform = g2d.getTransform();
		g2d.setTransform(tx);
		g2d.fill(arrowHead);
		g2d.setTransform(savedTransform);
	}

	// -------------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign / PuzzleDesign.

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		void args;
	}

	/** @java BoardDesign#drawGround */
	protected drawGround(g2d: SVGGraphics2D, context: Context, background: boolean): void {
		void g2d; void context; void background;
	}

	/** @java BoardDesign#drawVertices(Bridge, Graphics2D, Context, double) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawVertices(bridge: Bridge, g2d: SVGGraphics2D, context: Context, radiusOrColour: any, radius?: number, offsetY?: number): void {
		void bridge; void g2d; void context; void radiusOrColour; void radius; void offsetY;
	}

	/** @java BoardDesign#drawSymbols */
	protected drawSymbols(g2d: SVGGraphics2D, context: Context): void {
		void g2d; void context;
	}

	/** @java PuzzleDesign#drawRegions */
	protected drawRegions(
		g2d: SVGGraphics2D,
		context: Context,
		borderColor: Color | null,
		stroke: BasicStroke,
		regionList: Array<Location[]>,
	): void {
		void g2d; void context; void borderColor; void stroke; void regionList;
	}

	/** @java PuzzleDesign#detectHints */
	protected detectHints(context: Context): void {
		void context;
	}

	/** @java PuzzleDesign#drawPuzzleHints */
	drawPuzzleHints(g2d: SVGGraphics2D, context: Context): void {
		void g2d; void context;
	}

	/** @java BoardDesign#drawInnerCellEdges */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawInnerCellEdges(g2d: SVGGraphics2D, context: Context, colour?: Color | null, stroke?: any, offsetY?: number): void {
		void g2d; void context; void colour; void stroke; void offsetY;
	}

	/** @java BoardDesign#drawOuterCellEdges */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawOuterCellEdges(g2d: SVGGraphics2D, context: Context, colour?: Color | null, stroke?: any, offsetY?: number): void {
		void g2d; void context; void colour; void stroke; void offsetY;
	}

	/** @java BoardDesign#drawDiagonalEdges */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawDiagonalEdges(g2d: SVGGraphics2D, context: Context, colour?: Color | null, stroke?: any, offsetY?: number): void {
		void g2d; void context; void colour; void stroke; void offsetY;
	}

	/** @java BoardDesign#drawOrthogonalConnections */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawOrthogonalConnections(g2d: SVGGraphics2D, context: Context, colour?: Color | null, stroke?: any, offsetY?: number): void {
		void g2d; void context; void colour; void stroke; void offsetY;
	}

	/** @java BoardDesign#drawDiagonalConnections */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawDiagonalConnections(g2d: SVGGraphics2D, context: Context, colour?: Color | null, stroke?: any, offsetY?: number): void {
		void g2d; void context; void colour; void stroke; void offsetY;
	}

	/** @java BoardDesign#drawOffDiagonalConnections */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawOffDiagonalConnections(g2d: SVGGraphics2D, context: Context, colour?: Color | null, stroke?: any, offsetY?: number): void {
		void g2d; void context; void colour; void stroke; void offsetY;
	}

	/**
	 * @java BoardDesign#strokeThick()
	 * Returns the current thick stroke.
	 */
	protected strokeThick(): BasicStroke {
		return this._strokeThickField;
	}

	/**
	 * @java BoardDesign#colorSymbol()
	 * Returns the current symbol colour.
	 */
	protected colorSymbol(): Color | null {
		return this._colorSymbolField;
	}

	/** @java BoardDesign#screenPosn */
	protected screenPosn(posn: Point2D): Point {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).screenPosn(posn);
	}

	/** @java BoardDesign#cellRadiusPixels */
	protected cellRadiusPixels(): number {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).cellRadiusPixels();
	}

	/** @java BoardDesign#topology */
	protected topology(): unknown {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).topology();
	}

	// -------------------------------------------------------------------------
}
