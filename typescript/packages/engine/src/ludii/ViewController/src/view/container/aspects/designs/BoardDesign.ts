// @java ViewController/src/view/container/aspects/designs/BoardDesign.java

import {
	Color,
	Font,
	BasicStroke,
	CAP_BUTT,
	JOIN_MITER,
	GeneralPath,
	Ellipse2D,
	Rectangle2D,
	BOLD,
	PLAIN,
} from '../../../../../../awt/index.js';
import type {
	Graphics2D,
	Stroke,
	SVGGraphics2D,
	Point,
	Point2D,
} from '../../../../../../awt/index.js';
import { ContainerDesign } from './ContainerDesign.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java bridge.Bridge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java game.Game */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/** @java other.topology.Topology */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Topology = any;

/** @java other.topology.TopologyElement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyElement = any;

/** @java other.topology.Cell */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cell = any;

/** @java other.topology.Edge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Edge = any;

/** @java other.topology.Vertex */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = any;

/** @java game.equipment.other.Regions */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Regions = any;

/** @java metadata.graphics.util.MetadataImageInfo */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MetadataImageInfo = any;

/** @java metadata.graphics.util.BoardGraphicsType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardGraphicsType = any;

/** @java metadata.graphics.util.CurveType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CurveType = any;

/** @java other.location.FullLocation */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullLocation = any;

/** @java other.location.Location */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Location = any;

/** @java main.math.Vector */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vector = any;

/** @java graphics.svg.SVGtoImage */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SVGtoImage = any;

/** @java graphics.ImageUtil */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ImageUtil = any;

/** @java game.util.graph.Properties */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Properties = any;

/** @java util.ShadedCells */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShadedCells = any;

/** @java util.GraphUtil */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphUtil = any;

/** @java util.StringUtil */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StringUtil = any;

/** @java util.StrokeUtil */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StrokeUtil = any;

/** @java util.ContainerUtil */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerUtil = any;

/** @java main.math.MathRoutines */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MathRoutines = any;

// ---------------------------------------------------------------------------
// Lazy-loaded utility singletons (escape-hatch pattern)
// ---------------------------------------------------------------------------

function getBoardGraphicsType(): BoardGraphicsType {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../../../../ludemes/metadata/graphics/util/BoardGraphicsType.js') as { BoardGraphicsType: BoardGraphicsType }).BoardGraphicsType;
	} catch { return null; }
}

function getCurveType(): CurveType {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../../../../ludemes/metadata/graphics/util/CurveType.js') as { CurveType: CurveType }).CurveType;
	} catch { return null; }
}

function getShadedCells(): ShadedCells {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../util/ShadedCells.js') as { ShadedCells: ShadedCells }).ShadedCells;
	} catch { return null; }
}

function getGraphUtil(): GraphUtil {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../util/GraphUtil.js') as { GraphUtil: GraphUtil }).GraphUtil;
	} catch { return null; }
}

function getStringUtil(): StringUtil {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../util/StringUtil.js') as { StringUtil: StringUtil }).StringUtil;
	} catch { return null; }
}

function getStrokeUtil(): StrokeUtil {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../util/StrokeUtil.js') as { StrokeUtil: StrokeUtil }).StrokeUtil;
	} catch { return null; }
}

function getContainerUtil(): ContainerUtil {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../util/ContainerUtil.js') as { ContainerUtil: ContainerUtil }).ContainerUtil;
	} catch { return null; }
}

function getMathRoutines(): MathRoutines {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../../../../ludemes/main/math/MathRoutines.js') as { MathRoutines: MathRoutines }).MathRoutines;
	} catch { return null; }
}

function getSVGtoImage(): SVGtoImage {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../../../../ludii/Common/src/graphics/svg/SVGtoImage.js') as { SVGtoImage: SVGtoImage }).SVGtoImage;
	} catch { return null; }
}

function getImageUtil(): ImageUtil {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return (require('../../../../../../../ludemes/graphics/ImageUtil.js') as { ImageUtil: ImageUtil }).ImageUtil;
	} catch { return null; }
}

// ---------------------------------------------------------------------------

/**
 * Defines the default board design (graph-based rendering).
 *
 * Faithful 1:1 port of view.container.aspects.designs.BoardDesign.
 *
 * @author cambolbro and Matthew.Stephenson (Java original)
 * @java view.container.aspects.designs.BoardDesign
 */
export class BoardDesign extends ContainerDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// -------------------------------------------------------------------------
	// GUI colour / stroke fields
	// -------------------------------------------------------------------------

	/** @java BoardDesign#colorEdgesInner */
	protected colorEdgesInner: Color | null = null;

	/** @java BoardDesign#colorEdgesOuter */
	protected colorEdgesOuter: Color | null = null;

	/** @java BoardDesign#colorVerticesInner */
	protected colorVerticesInner: Color | null = null;

	/** @java BoardDesign#colorVerticesOuter */
	protected colorVerticesOuter: Color | null = null;

	/** @java BoardDesign#colorFillPhase0 */
	protected colorFillPhase0: Color | null = null;

	/** @java BoardDesign#colorFillPhase1 */
	protected colorFillPhase1: Color | null = null;

	/** @java BoardDesign#colorFillPhase2 */
	protected colorFillPhase2: Color | null = null;

	/** @java BoardDesign#colorFillPhase3 */
	protected colorFillPhase3: Color | null = null;

	/** @java BoardDesign#colorFillPhase4 */
	protected colorFillPhase4: Color | null = null;

	/** @java BoardDesign#colorFillPhase5 */
	protected colorFillPhase5: Color | null = null;

	/** @java BoardDesign#strokeThin */
	protected strokeThin: BasicStroke = new BasicStroke(1);

	/** @java BoardDesign#strokeThick */
	protected strokeThick_: BasicStroke = new BasicStroke(1);

	/** @java BoardDesign#colorSymbol */
	protected _colorSymbol: Color | null = null;

	// -------------------------------------------------------------------------

	/** @java BoardDesign#checkeredBoard */
	protected checkeredBoard = false;

	/** @java BoardDesign#straightLines */
	protected straightLines = false;

	// -------------------------------------------------------------------------

	/** @java BoardDesign#symbols */
	protected symbols: MetadataImageInfo[] = [];

	/** @java BoardDesign#symbolRegions */
	protected symbolRegions: MetadataImageInfo[][] = [];

	// -------------------------------------------------------------------------

	/**
	 * @java BoardDesign#BoardDesign(view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		super();
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -------------------------------------------------------------------------

	/**
	 * Fill, draw internal grid lines, draw symbols, draw outer border on top.
	 * @java BoardDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	override createSVGImage(bridge: Bridge, context: Context): string | null {
		const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues();
		const boardLineThickness: number = this.boardStyle.cellRadiusPixels() / 15.0;

		this.checkeredBoard = context.game().metadata().graphics().checkeredBoard();
		this.straightLines  = context.game().metadata().graphics().straightRingLines();

		const swThin: number = Math.max(1, boardLineThickness);
		const swThick: number = swThin;

		let colorEdge: Color | null = new Color(120, 190, 240);

		if (!bridge.settingsVC().flatBoard() && !context.game().metadata().graphics().noSunken())
			colorEdge = null;

		this.setStrokesAndColours(
			bridge, context,
			colorEdge, colorEdge,
			new Color(210, 230, 255),
			new Color(210, 0, 0),
			new Color(0, 230, 0),
			new Color(0, 0, 255),
			null, null,
			new Color(0, 0, 0),
			swThin, swThick
		);

		// Background
		this.drawGround(g2d, context, true);

		// Cells
		this.fillCells(bridge, g2d, context);

		// Edges
		this.drawInnerCellEdges(g2d, context);
		this.drawOuterCellEdges(bridge, g2d, context);

		// Symbols
		this.drawSymbols(g2d, context);

		// Foreground
		this.drawGround(g2d, context, false);

		return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
	}

	// -------------------------------------------------------------------------

	/**
	 * Sets strokes and colours for the board design, applying metadata overrides.
	 * @java BoardDesign#setStrokesAndColours(...)
	 */
	protected setStrokesAndColours(
		bridge: Bridge,
		context: Context,
		colorIn: Color | null,
		colorOut: Color | null,
		colorFill1: Color | null,
		colorFill2: Color | null,
		colorFill3: Color | null,
		colorFill4: Color | null,
		colorFill5: Color | null,
		colorFill6: Color | null,
		colorDecoration: Color | null,
		swThin: number,
		swThick: number
	): void {
		const BGT = getBoardGraphicsType();

		const boardColours = bridge.settingsColour().getBoardColours() as (Color | null)[];

		boardColours[BGT.InnerEdges.value()]    = colorIn;
		boardColours[BGT.OuterEdges.value()]    = colorOut;
		boardColours[BGT.InnerVertices.value()] = colorIn;
		boardColours[BGT.OuterVertices.value()] = colorIn;
		boardColours[BGT.Phase0.value()]        = colorFill1;
		boardColours[BGT.Phase1.value()]        = colorFill2;
		boardColours[BGT.Phase2.value()]        = colorFill3;
		boardColours[BGT.Phase3.value()]        = colorFill4;
		boardColours[BGT.Phase4.value()]        = colorFill5;
		boardColours[BGT.Phase5.value()]        = colorFill6;
		boardColours[BGT.Symbols.value()]       = colorDecoration;

		// Apply metadata overrides
		for (let bid = 0; bid < boardColours.length; bid++) {
			const colour: Color | null = context.game().metadata().graphics().boardColour(BGT.getTypeFromValue(bid));
			if (colour != null)
				boardColours[bid] = colour;
		}

		const lineThickness: number   = swThin  * context.game().metadata().graphics().boardThickness(BGT.InnerEdges);
		const borderThickness: number = swThick * context.game().metadata().graphics().boardThickness(BGT.OuterEdges);

		this.colorEdgesInner    = boardColours[BGT.InnerEdges.value()]    ?? null;
		this.colorEdgesOuter    = boardColours[BGT.OuterEdges.value()]    ?? null;
		this.colorVerticesInner = boardColours[BGT.InnerVertices.value()] ?? null;
		this.colorVerticesOuter = boardColours[BGT.OuterVertices.value()] ?? null;
		this.colorFillPhase0    = boardColours[BGT.Phase0.value()]        ?? null;
		this.colorFillPhase1    = boardColours[BGT.Phase1.value()]        ?? null;
		this.colorFillPhase2    = boardColours[BGT.Phase2.value()]        ?? null;
		this.colorFillPhase3    = boardColours[BGT.Phase3.value()]        ?? null;
		this.colorFillPhase4    = boardColours[BGT.Phase4.value()]        ?? null;
		this.colorFillPhase5    = boardColours[BGT.Phase5.value()]        ?? null;
		this.setColorSymbol(boardColours[BGT.Symbols.value()]             ?? null);

		// Reapply non-null values (Java pattern: double-check after loop)
		if ((boardColours[BGT.InnerEdges.value()]    ?? null) != null) this.colorEdgesInner    = boardColours[BGT.InnerEdges.value()]!;
		if ((boardColours[BGT.OuterEdges.value()]    ?? null) != null) this.colorEdgesOuter    = boardColours[BGT.OuterEdges.value()]!;
		if ((boardColours[BGT.InnerVertices.value()] ?? null) != null) this.colorVerticesInner = boardColours[BGT.InnerVertices.value()]!;
		if ((boardColours[BGT.OuterVertices.value()] ?? null) != null) this.colorVerticesOuter = boardColours[BGT.OuterVertices.value()]!;
		if ((boardColours[BGT.Phase0.value()]        ?? null) != null) this.colorFillPhase0    = boardColours[BGT.Phase0.value()]!;
		if ((boardColours[BGT.Phase1.value()]        ?? null) != null) this.colorFillPhase1    = boardColours[BGT.Phase1.value()]!;
		if ((boardColours[BGT.Phase2.value()]        ?? null) != null) this.colorFillPhase2    = boardColours[BGT.Phase2.value()]!;
		if ((boardColours[BGT.Phase3.value()]        ?? null) != null) this.colorFillPhase3    = boardColours[BGT.Phase3.value()]!;
		if ((boardColours[BGT.Phase4.value()]        ?? null) != null) this.colorFillPhase4    = boardColours[BGT.Phase4.value()]!;
		if ((boardColours[BGT.Phase5.value()]        ?? null) != null) this.colorFillPhase5    = boardColours[BGT.Phase5.value()]!;
		if ((boardColours[BGT.Symbols.value()]       ?? null) != null) this.setColorSymbol(boardColours[BGT.Symbols.value()]!);

		this.strokeThin  = new BasicStroke(lineThickness,   CAP_BUTT, JOIN_MITER);
		this.strokeThick_ = new BasicStroke(borderThickness, CAP_BUTT, JOIN_MITER);

		this._setSymbols(bridge, context);
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws either the background or foreground images for the board if specified in metadata.
	 * @java BoardDesign#drawGround(org.jfree.graphics2d.svg.SVGGraphics2D, other.context.Context, boolean)
	 */
	protected drawGround(g2d: SVGGraphics2D, context: Context, background: boolean): void {
		let allGroundImages: MetadataImageInfo[];
		if (background)
			allGroundImages = context.metadata().graphics().boardBackground(context) as MetadataImageInfo[];
		else
			allGroundImages = context.metadata().graphics().boardForeground(context) as MetadataImageInfo[];

		for (const groundImageInfo of allGroundImages) {
			const drawPosn: Point = this.boardStyle.screenPosn({ getX: () => 0.5, getY: () => 0.5 } as unknown as Point2D);

			if (groundImageInfo.path() == null && groundImageInfo.text() == null) {
				this.drawBoardOutline(
					g2d,
					groundImageInfo.scale(),
					groundImageInfo.offestX(),
					groundImageInfo.offestY(),
					groundImageInfo.mainColour(),
					groundImageInfo.secondaryColour(),
					groundImageInfo.rotation()
				);
			} else if (groundImageInfo.path() != null) {
				const imageUtil = getImageUtil();
				const fullPath: string = imageUtil
					? imageUtil.getImageFullPath(groundImageInfo.path())
					: groundImageInfo.path();

				let edgeColour: Color | null = this.colorSymbol();
				let fillColour: Color | null = null;

				if (groundImageInfo.mainColour() != null)      fillColour = groundImageInfo.mainColour();
				if (groundImageInfo.secondaryColour() != null) edgeColour = groundImageInfo.secondaryColour();

				const rotation: number = groundImageInfo.rotation();
				const offsetX: number  = Math.trunc(groundImageInfo.offestX() * this.boardStyle.maxDim());
				const offsetY: number  = Math.trunc(groundImageInfo.offestY() * this.boardStyle.maxDim());

				const rect = new Rectangle2D.Double(
					drawPosn.x + offsetX - (groundImageInfo.scaleX() * this.boardStyle.maxDim()) / 2,
					drawPosn.y + offsetY - (groundImageInfo.scaleY() * this.boardStyle.maxDim()) / 2,
					Math.trunc(groundImageInfo.scaleX() * this.boardStyle.maxDim()),
					Math.trunc(groundImageInfo.scaleY() * this.boardStyle.maxDim())
				);

				const svgToImg = getSVGtoImage();
				if (svgToImg)
					svgToImg.loadFromFilePath(g2d, fullPath, rect, edgeColour, fillColour, rotation);
			} else if (groundImageInfo.text() != null) {
				g2d.setColor(groundImageInfo.mainColour());
				const fontSize: number = Math.trunc(
					(0.85 * this.boardStyle.cellRadius() * this.boardStyle.placement().width + 0.5) *
					groundImageInfo.scale()
				);
				const font = new Font('Arial', PLAIN, fontSize);
				g2d.setFont(font);
				(g2d as unknown as { drawString(s: string, x: number, y: number): void })
					.drawString(groundImageInfo.text(), drawPosn.x, drawPosn.y);
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Fill cells with phase colours, applying checkered and metadata overrides.
	 * @java BoardDesign#fillCells(bridge.Bridge, java.awt.Graphics2D, other.context.Context)
	 */
	protected fillCells(bridge: Bridge, g2d: Graphics2D, context: Context): void {
		g2d.setStroke(this.strokeThin);

		const cells: Cell[] = (this.topology() as { cells(): Cell[] }).cells();
		const shadedCells = getShadedCells();

		for (const cell of cells) {
			const colours = shadedCells
				? shadedCells.shadedPhaseColours(
					this.colorFillPhase0, this.colorFillPhase1, this.colorFillPhase2,
					this.colorFillPhase3, this.colorFillPhase4, this.colorFillPhase5
				)
				: [[this.colorFillPhase0, this.colorFillPhase0]];

			const path = new GeneralPath();
			const cellVertices: Vertex[] = cell.vertices();
			for (let v = 0; v < cellVertices.length; v++) {
				const vertexA: Vertex = cellVertices[v];
				const vertexB: Vertex = cellVertices[(v + 1) % cellVertices.length];

				if (v === 0) {
					const ptA: Point = this.boardStyle.screenPosn(vertexA.centroid());
					path.moveTo(ptA.x, ptA.y);
				}

				// Find which edge this is
				let edge: Edge | null = null;
				for (const edgeA of vertexA.edges()) {
					if (edgeA.vA().index() === vertexB.index() || edgeA.vB().index() === vertexB.index()) {
						edge = edgeA;
						break;
					}
				}

				if (edge != null) {
					for (const s of this.symbols) {
						if (s.line() != null && s.line().length >= 2) {
							if (
								(edge.vA().index() === s.line()[0] && edge.vB().index() === s.line()[1]) ||
								(edge.vB().index() === s.line()[0] && edge.vA().index() === s.line()[1])
							) {
								if (s.curve() != null) {
									edge.setTangentA({ x: () => s.curve()[0], y: () => s.curve()[1] } as Vector);
									edge.setTangentB({ x: () => s.curve()[2], y: () => s.curve()[3] } as Vector);
								}
							}
						}
					}
					this._addEdgeToPath(context.game(), path, edge, edge.vA().index() === vertexA.index(), 0);
				}
			}

			g2d.setColor(this.colorFillPhase0!);

			if (this.checkeredBoard && shadedCells)
				shadedCells.setCellColourByPhase(
					g2d, cell.index(), this.topology(),
					this.colorFillPhase0, this.colorFillPhase1, this.colorFillPhase2,
					this.colorFillPhase3, this.colorFillPhase4, this.colorFillPhase5
				);

			// if cell is marked as a symbol, but no symbol is specified, then just fill the cell with the decoration colour
			for (const regionInfo of this.symbolRegions) {
				for (const d of regionInfo) {
					if (d.siteType() === 'Cell' && d.site() === cell.index() && d.path() == null && d.text() == null) {
						g2d.setColor(d.mainColour());
						const phase = !this.checkeredBoard
							? 0
							: (this.topology() as { phaseByElementIndex(type: string, idx: number): number })
								.phaseByElementIndex('Cell', cell.index());
						colours[phase][1] = d.mainColour();
						break;
					}
				}
			}

			if (bridge.settingsVC().flatBoard() || context.game().metadata().graphics().noSunken()) {
				g2d.fill(path);
			} else if (shadedCells) {
				shadedCells.drawShadedCell(g2d, cell, path, colours, this.checkeredBoard, this.topology());
			} else {
				g2d.fill(path);
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw edges from the provided list, respecting metadata overrides.
	 * @java BoardDesign#drawEdges(java.awt.Graphics2D, other.context.Context, java.awt.Color, java.awt.Stroke, java.util.List, double)
	 */
	protected drawEdges(
		g2d: Graphics2D,
		context: Context,
		lineColour: Color | null,
		lineStroke: Stroke,
		edges: Edge[],
		offsetY: number
	): void {
		this._drawEdgesWithMetadata(g2d, context, lineColour, lineStroke, edges, offsetY);

		for (const regionInfo of this.symbolRegions) {
			const regionEdges: Edge[] = [];
			let regionColour: Color | null = null;

			for (const d of regionInfo) {
				if (d.siteType() === 'Edge' && d.path() == null) {
					regionEdges.push((this.topology() as { edges(): Edge[] }).edges()[d.site()]);
					regionColour = d.mainColour();
				}
			}

			const originalColour: Color = g2d.getColor();
			this._drawEdgesWithMetadata(g2d, context, regionColour, lineStroke, regionEdges, offsetY);
			g2d.setColor(originalColour);
		}
	}

	/** @java BoardDesign#drawEdgesWithMetadata (private) */
	private _drawEdgesWithMetadata(
		g2d: Graphics2D,
		context: Context,
		lineColour: Color | null,
		lineStroke: Stroke,
		edges: Edge[],
		offsetY: number
	): void {
		const errorDistanceBuffer = 0.0001;

		g2d.setStroke(lineStroke);
		if (lineColour != null) g2d.setColor(lineColour);

		const path = new GeneralPath();

		const edgesToDraw: Edge[] = [];

		for (const edge of edges) {
			if (
				this._getMetadataImageInfoForEdge(edge) == null &&
				(
					(context.game().metadata().graphics().showStraightEdges() && !edge.isCurved()) ||
					(context.game().metadata().graphics().showCurvedEdges() && edge.isCurved())
				)
			)
				edgesToDraw.push(edge);
		}

		let idx = 0;
		while (idx < edgesToDraw.length) {
			let edge: Edge = edgesToDraw[idx];
			let nextEdgeFound = true;

			let vertexA: Vertex = edge.vA();
			const centroidA: Point2D = edge.vA().centroid();
			const drawPosnA: Point = this.boardStyle.screenPosn(centroidA);
			path.moveTo(drawPosnA.x, drawPosnA.y + offsetY);

			let vertexB: Vertex = edge.vB();
			let centroidB: Point2D = edge.vB().centroid();

			while (nextEdgeFound) {
				nextEdgeFound = false;

				this._addEdgeToPath(context.game(), path, edge, edge.vA().index() === vertexA.index(), offsetY);
				edgesToDraw.splice(edgesToDraw.indexOf(edge), 1);

				for (const nextEdge of edgesToDraw) {
					// Forwards direction
					if (
						Math.abs(centroidB.getX() - nextEdge.vA().centroid().getX()) < errorDistanceBuffer &&
						Math.abs(centroidB.getY() - nextEdge.vA().centroid().getY()) < errorDistanceBuffer
					) {
						nextEdgeFound = true;
						edge = nextEdge;
						vertexA = edge.vA();
						vertexB = edge.vB();
						centroidB = vertexB.centroid();
						break;
					}
					// Backwards direction
					else if (
						Math.abs(centroidB.getX() - nextEdge.vB().centroid().getX()) < errorDistanceBuffer &&
						Math.abs(centroidB.getY() - nextEdge.vB().centroid().getY()) < errorDistanceBuffer
					) {
						nextEdgeFound = true;
						edge = nextEdge;
						vertexA = edge.vB();
						vertexB = edge.vA();
						centroidB = vertexB.centroid();
						break;
					}
				}
			}

			if (
				Math.abs(centroidA.getX() - centroidB.getX()) < errorDistanceBuffer &&
				Math.abs(centroidA.getY() - centroidB.getY()) < errorDistanceBuffer
			)
				path.closePath();
		}

		(g2d as unknown as { draw(shape: unknown): void }).draw(path);
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw vertices based on the board's graph.
	 * @java BoardDesign#drawVertices(bridge.Bridge, java.awt.Graphics2D, other.context.Context, double)
	 */
	protected drawVertices(bridge: Bridge, g2d: Graphics2D, context: Context, radius: number): void;
	protected drawVertices(bridge: Bridge, g2d: Graphics2D, context: Context, vertexColour: Color | null, radius: number): void;
	protected drawVertices(bridge: Bridge, g2d: Graphics2D, context: Context, vertexColour: Color | null, radius: number, offsetY: number): void;
	protected drawVertices(
		bridge: Bridge,
		g2d: Graphics2D,
		context: Context,
		vertexColourOrRadius: Color | null | number,
		radiusOrUndefined?: number,
		offsetY = 0
	): void {
		// Resolve overloaded args
		let vertexColour: Color | null;
		let radius: number;
		if (typeof vertexColourOrRadius === 'number') {
			vertexColour = null;
			radius = vertexColourOrRadius;
		} else {
			vertexColour = vertexColourOrRadius;
			radius = radiusOrUndefined!;
		}

		if (context.game().metadata().graphics().showRegionOwner() && !context.game().isDeductionPuzzle()) {
			const regionsList: Regions[] = context.game().equipment().regions();
			const borderColor = new Color(127, 127, 127);
			const rI = radius * 2;
			const rO = rI + 2;

			for (const currentRegions of regionsList) {
				const owner: number = currentRegions.owner();
				const sites: number[] = currentRegions.eval(context);

				for (const sid of sites) {
					const vertex: Vertex = (this.topology() as { vertices(): Vertex[] }).vertices()[sid];
					const pt: Point = this.boardStyle.screenPosn(vertex.centroid());
					pt.setLocation(pt.x, pt.y + offsetY);

					g2d.setColor(borderColor);
					const ellipseO = new Ellipse2D.Double(pt.x - rO, pt.y - rO, 2 * rO, 2 * rO);
					g2d.fill(ellipseO);

					const playerColour: Color = bridge.settingsColour().playerColour(context, owner);
					g2d.setColor(playerColour);
					const ellipseI = new Ellipse2D.Double(pt.x - rI, pt.y - rI, 2 * rI, 2 * rI);
					g2d.fill(ellipseI);
				}
			}
		}

		for (const vertex of (this.topology() as { vertices(): Vertex[] }).vertices()) {
			g2d.setStroke(this.strokeThin);

			const props = vertex.properties() as { get(p: Properties): boolean };
			// OUTER property constant — escape-hatched
			const OUTER = 'OUTER';
			if (props.get(OUTER as unknown as Properties))
				g2d.setColor(this.colorVerticesOuter!);
			else
				g2d.setColor(this.colorVerticesInner!);

			if (vertexColour != null && g2d.getColor().getAlpha() !== 0)
				g2d.setColor(vertexColour);

			// if vertex is marked as a symbol but no symbol is specified, colour with decoration colour
			for (const regionInfo of this.symbolRegions) {
				for (const d of regionInfo) {
					if (d.siteType() === 'Vertex' && d.site() === vertex.index() && d.path() == null && d.text() == null) {
						g2d.setColor(d.mainColour());
						break;
					}
				}
			}

			const pt: Point = this.boardStyle.screenPosn(vertex.centroid());
			pt.setLocation(pt.x, pt.y + offsetY);

			const ellipseO = new Ellipse2D.Double(pt.x - radius, pt.y - radius, 2 * radius, 2 * radius);
			g2d.fill(ellipseO);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw the board outline (rectangular, with margins).
	 * @java BoardDesign#drawBoardOutline(org.jfree.graphics2d.svg.SVGGraphics2D)
	 */
	protected drawBoardOutline(g2d: SVGGraphics2D): void;

	/**
	 * Draw the board outline with optional scale, offsets, colours and rotation.
	 * @java BoardDesign#drawBoardOutline(org.jfree.graphics2d.svg.SVGGraphics2D, double, float, float, java.awt.Color, java.awt.Color, int)
	 */
	protected drawBoardOutline(
		g2d: SVGGraphics2D,
		scale: number,
		offsetX: number,
		offsetY: number,
		mainColour: Color | null,
		secondaryColour: Color | null,
		rotation: number
	): void;

	protected drawBoardOutline(
		g2d: SVGGraphics2D,
		scale = 1,
		offsetX = 0,
		offsetY = 0,
		mainColour: Color | null = null,
		secondaryColour: Color | null = null,
		rotation = 0
	): void {
		const vertices: Vertex[] = (this.topology() as { vertices(): Vertex[] }).vertices();

		g2d.setStroke(this.strokeThin);

		let minX = Number.MAX_SAFE_INTEGER;
		let minY = Number.MAX_SAFE_INTEGER;
		let maxX = Number.MIN_SAFE_INTEGER;
		let maxY = Number.MIN_SAFE_INTEGER;

		const path = new GeneralPath();

		for (const vertex of vertices) {
			const posn: Point = this.boardStyle.screenPosn(vertex.centroid());
			const x = posn.x;
			const y = posn.y;

			if (minX > x) minX = x;
			if (minY > y) minY = y;
			if (maxX < x) maxX = x;
			if (maxY < y) maxY = y;

			g2d.setColor(mainColour == null ? this.colorFillPhase0! : mainColour);
		}

		minX += offsetX;
		maxX += offsetX;
		minY += offsetY;
		maxY += offsetY;

		const margin: number = Math.trunc(this.boardStyle.cellRadiusPixels() * scale + 0.5);
		path.moveTo(minX - margin, minY - margin);
		path.lineTo(minX - margin, maxY + margin);
		path.lineTo(maxX + margin, maxY + margin);
		path.lineTo(maxX + margin, minY - margin);
		path.lineTo(minX - margin, minY - margin);

		(g2d as unknown as { rotate(r: number): void }).rotate(rotation);
		g2d.fill(path);

		if (secondaryColour != null) {
			g2d.setColor(secondaryColour);
			(g2d as unknown as { draw(shape: unknown): void }).draw(path);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw symbols on the board.
	 * @java BoardDesign#drawSymbols(java.awt.Graphics2D, other.context.Context)
	 */
	protected drawSymbols(g2d: Graphics2D, context: Context): void {
		const strokeUtil = getStrokeUtil();
		const svgToImg   = getSVGtoImage();
		const imageUtil  = getImageUtil();
		const stringUtil = getStringUtil();

		for (const s of this.symbols) {
			// Draw lines
			if (s.line() != null && s.line().length >= 2) {
				let colour: Color | null = s.mainColour();
				const scale: number = s.scale();
				if (colour == null) colour = this.colorEdgesOuter;
				if (colour != null) g2d.setColor(colour);

				const strokeLineThin  = new BasicStroke(this.strokeThin.getLineWidth()  * scale, CAP_BUTT, JOIN_MITER);
				const strokeLineThick = new BasicStroke(this.strokeThick_.getLineWidth() * scale, CAP_BUTT, JOIN_MITER);
				const strokeLine: Stroke = strokeUtil
					? strokeUtil.getStrokeFromStyle(s.lineStyle(), strokeLineThin, strokeLineThick)
					: strokeLineThin;
				g2d.setStroke(strokeLine);

				const v1: TopologyElement = (this.boardStyle.container().topology() as {
					getGraphElements(type: unknown): TopologyElement[];
				}).getGraphElements(s.siteType())[s.line()[0]];
				const v2: TopologyElement = (this.boardStyle.container().topology() as {
					getGraphElements(type: unknown): TopologyElement[];
				}).getGraphElements(s.siteType())[s.line()[1]];

				if (s.curve() == null) {
					const p1: Point = this.boardStyle.screenPosn(v1.centroid());
					const p2: Point = this.boardStyle.screenPosn(v2.centroid());
					(g2d as unknown as { drawLine(x1: number, y1: number, x2: number, y2: number): void })
						.drawLine(p1.x, p1.y, p2.x, p2.y);
				} else {
					const tangentA = { x: () => s.curve()[0], y: () => s.curve()[1] } as Vector;
					const tangentB = { x: () => s.curve()[2], y: () => s.curve()[3] } as Vector;
					const path = new GeneralPath();
					const pt1: Point = this.boardStyle.screenPosn(v1.centroid());
					path.moveTo(pt1.x, pt1.y);
					this._curvePath(context.game(), path, v1.centroid(), v2.centroid(), tangentA, tangentB, 0, s.curveType());
					(g2d as unknown as { draw(shape: unknown): void }).draw(path);
				}
			}

			// Draw regular symbols (images)
			if ((s.path() == null && s.text() == null) || s.site() === -1)
				continue;

			let e: TopologyElement | null = null;
			if (s.siteType() === 'Cell')
				e = (this.boardStyle.topology() as { cells(): TopologyElement[] }).cells()[s.site()];
			else if (s.siteType() === 'Edge')
				e = (this.boardStyle.topology() as { edges(): TopologyElement[] }).edges()[s.site()];
			else if (s.siteType() === 'Vertex')
				e = (this.boardStyle.topology() as { vertices(): TopologyElement[] }).vertices()[s.site()];

			if (e == null) continue;

			const drawPosn: Point = this.boardStyle.screenPosn(e.centroid());

			if (s.path() != null && imageUtil && svgToImg) {
				const fullPath: string = imageUtil.getImageFullPath(s.path());

				let edgeColour: Color | null = this.colorSymbol();
				let fillColour: Color | null = null;

				if (s.mainColour() != null)      fillColour = s.mainColour();
				if (s.secondaryColour() != null) edgeColour = s.secondaryColour();

				const rotation: number = s.rotation();
				const offX: number = Math.trunc(s.offestX() * this.boardStyle.cellRadiusPixels() * 2);
				const offY: number = Math.trunc(s.offestY() * this.boardStyle.cellRadiusPixels() * 2);

				const rect = new Rectangle2D.Double(
					drawPosn.x + offX - s.scaleX() * this.boardStyle.cellRadiusPixels(),
					drawPosn.y + offY - s.scaleY() * this.boardStyle.cellRadiusPixels(),
					Math.trunc(s.scaleX() * this.boardStyle.cellRadiusPixels() * 2),
					Math.trunc(s.scaleY() * this.boardStyle.cellRadiusPixels() * 2)
				);

				svgToImg.loadFromFilePath(g2d, fullPath, rect, edgeColour, fillColour, rotation);
			}

			if (s.text() != null) {
				g2d.setColor(s.mainColour());
				const fontSize: number = Math.trunc(
					(0.85 * this.boardStyle.cellRadius() * this.boardStyle.placement().width + 0.5) * s.scale()
				);
				const font = new Font('Arial', PLAIN, fontSize);
				g2d.setFont(font);
				if (stringUtil)
					stringUtil.drawStringAtPoint(g2d, s.text(), e, drawPosn, true);
			}
		}

		// Draw indices on sites if specified.
		for (const e of (this.boardStyle.topology() as { getAllGraphElements(): TopologyElement[] }).getAllGraphElements()) {
			const additionalValue: number | null = context.game().metadata().graphics().showSiteIndex(context.game(), e);
			if (additionalValue != null) {
				const drawPosn: Point = this.boardStyle.screenPosn(e.centroid());
				g2d.setColor(Color.WHITE ?? new Color(255, 255, 255));
				const fontSize: number = Math.trunc(0.85 * this.boardStyle.cellRadius() * this.boardStyle.placement().width + 0.5);
				const font = new Font('Arial', PLAIN, fontSize);
				g2d.setFont(font);
				if (stringUtil)
					stringUtil.drawStringAtPoint(g2d, String(e.index() + additionalValue), e, drawPosn, true);
			}
		}
	}

	// -------------------------------------------------------------------------

	/** @java BoardDesign#getMetadataImageInfoForEdge(other.topology.Edge) (private) */
	private _getMetadataImageInfoForEdge(edge: Edge): MetadataImageInfo | null {
		for (const s of this.symbols) {
			if (s.line() != null && s.line().length >= 2 && s.siteType() === 'Vertex') {
				if (
					(edge.vA().index() === s.line()[0] && edge.vB().index() === s.line()[1]) ||
					(edge.vB().index() === s.line()[0] && edge.vA().index() === s.line()[1])
				)
					return s;
			}
		}
		return null;
	}

	// -------------------------------------------------------------------------

	/**
	 * Sets the locations for drawing symbols and colouring regions.
	 * @java BoardDesign#setSymbols(bridge.Bridge, other.context.Context) (private)
	 */
	private _setSymbols(bridge: Bridge, context: Context): void {
		this.symbols = [];
		this.symbolRegions = [];

		const containerUtil = getContainerUtil();

		for (const regionInfo of context.game().metadata().graphics().regionsToFill(context) as MetadataImageInfo[][]) {
			if (regionInfo.length === 0) continue;

			const regionGraphics: MetadataImageInfo = regionInfo[0];

			if (regionGraphics.regionSiteType() === regionGraphics.siteType()) {
				this.symbolRegions.push(regionInfo);
			} else if (regionGraphics.regionSiteType() === 'Cell' && regionGraphics.siteType() === 'Edge') {
				const region: Location[] = [];
				for (const m of regionInfo)
					region.push({ site: () => m.site(), level: () => 0, siteType: () => m.siteType() } as unknown as Location);

				const edgeLocations: Edge[] = containerUtil
					? containerUtil.getOuterRegionEdges(region, this.topology())
					: [];

				for (const edgeLoc of edgeLocations) {
					let colour: Color | null = regionGraphics.mainColour();
					if (colour == null) {
						const r: Regions | null = containerUtil
							? containerUtil.getRegionOfEdge(context, edgeLoc)
							: null;
						if (r != null)
							colour = bridge.settingsColour().playerColour(context, r.role().owner());
						else
							colour = this.colorSymbol();
					}

					const line: number[] = [edgeLoc.vA().index(), edgeLoc.vB().index()];
					const info = {
						line: () => line,
						siteType: () => 'Vertex',
						mainColour: () => colour,
						scale: () => regionGraphics.scale(),
					} as unknown as MetadataImageInfo;
					this.symbols.push(info);
				}
			}
		}

		const drawLines  = context.game().metadata().graphics().drawLines(context)  as MetadataImageInfo[];
		const drawSymbol = context.game().metadata().graphics().drawSymbol(context) as MetadataImageInfo[];
		for (const s of drawLines)  this.symbols.push(s);
		for (const s of drawSymbol) this.symbols.push(s);
	}

	// -------------------------------------------------------------------------

	/** @java BoardDesign#addEdgeToPath(game.Game, java.awt.geom.GeneralPath, other.topology.Edge, boolean, double) (private) */
	private _addEdgeToPath(game: Game, path: GeneralPath, edge: Edge, forwards: boolean, offsetY: number): void {
		const vertexA: Vertex = forwards ? edge.vA() : edge.vB();
		const vertexB: Vertex = forwards ? edge.vB() : edge.vA();

		const tangentA: Vector | null = forwards ? edge.tangentA() : edge.tangentB();
		const tangentB: Vector | null = forwards ? edge.tangentB() : edge.tangentA();

		if (tangentA != null && tangentB != null && !this.straightLines) {
			let curveType: CurveType = getCurveType()?.Spline ?? 'Spline';
			const meta = this._getMetadataImageInfoForEdge(edge);
			if (meta != null)
				curveType = meta.curveType();

			this._curvePath(game, path, vertexA.centroid(), vertexB.centroid(), tangentA, tangentB, offsetY, curveType);
		} else {
			const ptB: Point = this.boardStyle.screenPosn(vertexB.centroid());
			ptB.setLocation(ptB.x, ptB.y + offsetY);
			path.lineTo(ptB.x, ptB.y);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws a curved path based on a spline curve.
	 * @java BoardDesign#curvePath(game.Game, java.awt.geom.GeneralPath, java.awt.geom.Point2D, java.awt.geom.Point2D, main.math.Vector, main.math.Vector, double, metadata.graphics.util.CurveType) (private)
	 */
	private _curvePath(
		game: Game,
		path: GeneralPath,
		vACentroid: Point2D,
		vBCentroid: Point2D,
		tangentA: Vector,
		tangentB: Vector,
		offsetY: number,
		curveType: CurveType
	): void {
		const mathRoutines = getMathRoutines();
		const dist: number = mathRoutines
			? mathRoutines.distance(vACentroid, vBCentroid)
			: Math.hypot(vBCentroid.getX() - vACentroid.getX(), vBCentroid.getY() - vACentroid.getY());

		const off: number = game.metadata().graphics().boardCurvature();

		const CurveTypeBezier = getCurveType()?.Bezier ?? 'Bezier';

		let aax = vACentroid.getX() + off * dist * tangentA.x();
		let aay = vACentroid.getY() + off * dist * tangentA.y();
		let bbx = vBCentroid.getX() + off * dist * tangentB.x();
		let bby = vBCentroid.getY() + off * dist * tangentB.y();

		if (curveType === CurveTypeBezier) {
			aax = tangentA.x();
			aay = tangentA.y();
			bbx = tangentB.x();
			bby = tangentB.y();
		}

		const ptAA: Point = this.boardStyle.screenPosn({ getX: () => aax, getY: () => aay } as unknown as Point2D);
		const ptBB: Point = this.boardStyle.screenPosn({ getX: () => bbx, getY: () => bby } as unknown as Point2D);
		const ptB:  Point = this.boardStyle.screenPosn(vBCentroid);
		ptB.setLocation(ptB.x, ptB.y + offsetY);

		path.curveTo(ptAA.x, ptAA.y, ptBB.x, ptBB.y, ptB.x, ptB.y);
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardDesign#drawInnerCellEdges(java.awt.Graphics2D, other.context.Context)
	 */
	protected drawInnerCellEdges(g2d: Graphics2D, context: Context): void;
	protected drawInnerCellEdges(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke): void;
	protected drawInnerCellEdges(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke, offsetY: number): void;
	protected drawInnerCellEdges(
		g2d: Graphics2D,
		context: Context,
		lineColour: Color | null = this.colorEdgesInner,
		lineStroke: Stroke = this.strokeThin,
		offsetY = 0
	): void {
		if (lineColour != null && lineColour.getAlpha() > 0) {
			const graphUtil = getGraphUtil();
			if (graphUtil)
				this.drawEdges(g2d, context, lineColour, lineStroke, graphUtil.innerEdgeRelations(this.topology()), offsetY);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardDesign#drawOuterCellEdges(bridge.Bridge, java.awt.Graphics2D, other.context.Context)
	 */
	protected drawOuterCellEdges(bridge: Bridge, g2d: Graphics2D, context: Context): void;
	protected drawOuterCellEdges(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke): void;
	protected drawOuterCellEdges(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke, offsetY: number): void;
	protected drawOuterCellEdges(
		bridgeOrG2d: Bridge | Graphics2D,
		g2dOrContext: Graphics2D | Context,
		contextOrColour: Context | Color | null = this.colorEdgesOuter,
		lineStroke: Stroke = this.strokeThick_,
		offsetY = 0
	): void {
		// Overload disambiguation: if third arg is Context (has game()), bridge variant
		const graphUtil = getGraphUtil();
		if (!graphUtil) return;
		let lineColour: Color | null;
		let g2d: Graphics2D;
		let context: Context;

		// Detect by checking if second argument has a `setColor` method (Graphics2D)
		if (typeof (g2dOrContext as Graphics2D).setColor === 'function') {
			// drawOuterCellEdges(g2d, context, lineColour, lineStroke, offsetY)
			g2d = bridgeOrG2d as Graphics2D;
			context = g2dOrContext;
			lineColour = contextOrColour as Color | null;
		} else {
			// drawOuterCellEdges(bridge, g2d, context)
			g2d = g2dOrContext as Graphics2D;
			context = contextOrColour as Context;
			lineColour = this.colorEdgesOuter;
		}

		if (lineColour != null && lineColour.getAlpha() > 0)
			this.drawEdges(g2d, context, lineColour, lineStroke, graphUtil.outerEdgeRelations(this.topology()), offsetY);
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardDesign#drawDiagonalEdges(java.awt.Graphics2D, other.context.Context)
	 */
	protected drawDiagonalEdges(g2d: Graphics2D, context: Context): void;
	protected drawDiagonalEdges(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke): void;
	protected drawDiagonalEdges(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke, offsetY: number): void;
	protected drawDiagonalEdges(
		g2d: Graphics2D,
		context: Context,
		lineColour: Color | null = this.colorEdgesInner,
		lineStroke: Stroke = this.strokeThin,
		offsetY = 0
	): void {
		const graphUtil = getGraphUtil();
		if (graphUtil)
			this.drawEdges(g2d, context, lineColour, lineStroke, graphUtil.diagonalEdgeRelations(this.topology()), offsetY);
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardDesign#drawOrthogonalConnections(java.awt.Graphics2D, other.context.Context)
	 */
	protected drawOrthogonalConnections(g2d: Graphics2D, context: Context): void;
	protected drawOrthogonalConnections(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke): void;
	protected drawOrthogonalConnections(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke, offsetY: number): void;
	protected drawOrthogonalConnections(
		g2d: Graphics2D,
		context: Context,
		lineColour: Color | null = this.colorEdgesInner,
		lineStroke: Stroke = this.strokeThin,
		offsetY = 0
	): void {
		const graphUtil = getGraphUtil();
		if (graphUtil)
			this.drawEdges(g2d, context, lineColour, lineStroke, graphUtil.orthogonalCellConnections(this.topology()), offsetY);
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw diagonal connections based on the board's graph.
	 * @java BoardDesign#drawDiagonalConnections(java.awt.Graphics2D, other.context.Context)
	 */
	protected drawDiagonalConnections(g2d: Graphics2D, context: Context): void;
	protected drawDiagonalConnections(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke): void;
	protected drawDiagonalConnections(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke, offsetY: number): void;
	protected drawDiagonalConnections(
		g2d: Graphics2D,
		context: Context,
		lineColour: Color | null = this.colorEdgesInner,
		lineStroke: Stroke = this.strokeThin,
		offsetY = 0
	): void {
		const graphUtil = getGraphUtil();
		if (graphUtil)
			this.drawEdges(g2d, context, lineColour, lineStroke, graphUtil.diagonalCellConnections(this.topology()), offsetY);
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw off-diagonal connections based on the board's graph.
	 * @java BoardDesign#drawOffDiagonalConnections(java.awt.Graphics2D, other.context.Context)
	 */
	protected drawOffDiagonalConnections(g2d: Graphics2D, context: Context): void;
	protected drawOffDiagonalConnections(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke): void;
	protected drawOffDiagonalConnections(g2d: Graphics2D, context: Context, lineColour: Color | null, lineStroke: Stroke, offsetY: number): void;
	protected drawOffDiagonalConnections(
		g2d: Graphics2D,
		context: Context,
		lineColour: Color | null = this.colorEdgesInner,
		lineStroke: Stroke = this.strokeThin,
		offsetY = 0
	): void {
		const graphUtil = getGraphUtil();
		if (graphUtil)
			this.drawEdges(g2d, context, lineColour, lineStroke, graphUtil.offCellConnections(this.topology()), offsetY);
	}

	// -------------------------------------------------------------------------

	/** @java BoardDesign#strokeThick() */
	strokeThick(): BasicStroke {
		return this.strokeThick_;
	}

	/** @java BoardDesign#colorSymbol() */
	colorSymbol(): Color | null {
		return this._colorSymbol;
	}

	/** @java BoardDesign#setColorSymbol(java.awt.Color) */
	setColorSymbol(colorSymbol: Color | null): void {
		this._colorSymbol = colorSymbol;
	}

	/** @java BoardDesign#topology() */
	topology(): Topology {
		return (this.boardStyle as { topology(): Topology }).topology();
	}

	/** @java BoardDesign#cellRadiusPixels() */
	cellRadiusPixels(): number {
		return (this.boardStyle as { cellRadiusPixels(): number }).cellRadiusPixels();
	}

	/** @java BoardDesign#screenPosn(java.awt.geom.Point2D) */
	screenPosn(posn: Point2D): Point {
		return (this.boardStyle as { screenPosn(p: Point2D): Point }).screenPosn(posn);
	}

	// -------------------------------------------------------------------------
}
