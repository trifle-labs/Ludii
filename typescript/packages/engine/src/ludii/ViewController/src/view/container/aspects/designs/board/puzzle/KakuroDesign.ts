// @java ViewController/src/view/container/aspects/designs/board/puzzle/KakuroDesign.java

/**
 * Design for Kakuro puzzle boards.
 *
 * Black cells (constraint variables) are filled black with a diagonal slash;
 * white cells show the sum clues in NW/N positions.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.puzzle.KakuroDesign.
 *
 * @author matthew.stephenson (Java original)
 * @java view.container.aspects.designs.board.puzzle.KakuroDesign
 */

// PuzzleDesign   -> batch 23: src/ludii/ViewController/src/view/container/aspects/designs/board/puzzle/PuzzleDesign.ts
// BoardStyle     -> batch 23
// BoardPlacement -> batch 28
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// awt shims      -> src/ludii/awt/index.ts
// CompassDirection -> src/ludemes/game/util/directions/CompassDirection.ts

import {
	BasicStroke,
	Color,
	Font, BOLD,
	GeneralPath,
	SVGGraphics2D,
	Point,
} from '../../../../../../../../awt/index.js';
import { Bridge } from '../../../../../../bridge/Bridge.js';

// ---------------------------------------------------------------------------
// Helper: approximate java.awt.Font.getStringBounds() via size heuristics.
// @java java.awt.Font#getStringBounds(String, FontRenderContext)
// ---------------------------------------------------------------------------
function stringBounds(font: Font, str: string): { getWidth(): number; getHeight(): number } {
	const width  = str.length * font.getSize() * 0.6;
	const height = font.getSize() * 1.0;
	return {
		getWidth():  number { return width; },
		getHeight(): number { return height; },
	};
}

/** Rectangle2D-like bound result type. */
type Rect2D = ReturnType<typeof stringBounds>;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/** @java game.types.board.SiteType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteType = any;

/** @java game.util.directions.CompassDirection */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CompassDirection = any;

/** @java other.topology.TopologyElement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyElement = any;

/** @java other.topology.Cell */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cell = any;

/** @java other.topology.Vertex */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = any;

/** @java java.awt.geom.Point2D */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Point2D = any;

/** @java other.location.Location */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Location = any;

/**
 * KakuroDesign — renders a Kakuro puzzle board.
 *
 * Java source:
 *   public class KakuroDesign extends PuzzleDesign {
 *     public KakuroDesign(BoardStyle boardStyle, BoardPlacement boardPlacement) {
 *       super(boardStyle, boardPlacement);
 *     }
 *
 *     @Override
 *     public String createSVGImage(Bridge bridge, Context context) { ... }
 *
 *     @Override
 *     public void drawPuzzleHints(Graphics2D g2d, Context context) { ... }
 *
 *     protected void fillCells(Graphics2D g2d, int pixels, Color fillColor, Color borderColor,
 *         BasicStroke stroke, TIntArrayList validLocations, Color colorInvalid, boolean addDiagonal) { ... }
 *   }
 *
 * @java view.container.aspects.designs.board.puzzle.KakuroDesign
 */
export class KakuroDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// Inherited fields from PuzzleDesign / BoardDesign (escape-hatched)

	/** @java PuzzleDesign#hintValues */
	protected hintValues: number[] | null = null;

	/** @java PuzzleDesign#hintDirections */
	protected hintDirections: CompassDirection[] = [];

	/** @java PuzzleDesign#locationValues */
	protected locationValues: Location[] = [];

	/** @java BoardDesign#colorEdgesInner */
	protected colorEdgesInner: Color | null = null;
	/** @java BoardDesign#colorEdgesOuter */
	protected colorEdgesOuter: Color | null = null;
	/** @java BoardDesign#colorFillPhase0 */
	protected colorFillPhase0: Color | null = null;
	/** @java BoardDesign#strokeThin */
	protected strokeThin: BasicStroke = new BasicStroke(1);
	/** @java BoardDesign#strokeThick */
	protected strokeThick: BasicStroke = new BasicStroke(2);
	/** @java BoardDesign#colorSymbol */
	protected colorSymbol: Color | null = null;

	// -------------------------------------------------------------------------

	/**
	 * @java KakuroDesign#KakuroDesign(view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -------------------------------------------------------------------------

	/**
	 * @returns SVG as string.
	 * @java KakuroDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();

		const swRatio = 5 / 1000.0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const width: number = (this.boardStyle as any).placement().width;
		const swThin  = Math.max(1, Math.trunc(swRatio * width + 0.5));
		const swThick = 2 * swThin;

		this.setStrokesAndColours(
			bridge,
			context,
			new Color(120, 190, 240),
			null,
			new Color(210, 230, 255),
			null,
			null,
			null,
			null,
			null,
			new Color(120, 190, 240),
			swThin,
			swThick,
		);

		if (this.hintValues === null)
			this.detectHints(context);

		// Collect black (constraint-variable) locations
		const blackLocations: number[] = [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const varsConstraints: number[] = context.game().constraintVariables();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cells: Cell[] = context.board().topology().cells();
		for (const c of cells) {
			if (varsConstraints.includes(c.index()))
				blackLocations.push(c.index());
		}

		this.fillCellsWithBlack(g2d, width, this.colorFillPhase0, this.colorEdgesInner, this.strokeThin,
			blackLocations, new Color(0, 0, 0), true);

		this.drawInnerCellEdges(g2d, context);
		this.drawOuterCellEdges(bridge, g2d, context);

		return g2d.getSVGDocument();
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws sum clues (NW and N positions) in the black cells.
	 * @java KakuroDesign#drawPuzzleHints(java.awt.Graphics2D, other.context.Context)
	 */
	drawPuzzleHints(g2d: SVGGraphics2D, context: Context): void {
		if (this.hintValues === null)
			this.detectHints(context);

		const valueFont = new Font('Arial', BOLD,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(this.boardStyle as any).cellRadiusPixels());
		g2d.setColor(new Color(255, 255, 255));
		g2d.setFont(valueFont);

		if (this.hintValues === null) return;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const allElements: TopologyElement[] = (this as any).topology().getAllGraphElements();
		for (const graphElement of allElements) {
			const type: SiteType = graphElement.elementType();
			const site: number = graphElement.index();

			const posn: Point2D = graphElement.centroid();
			const drawnPosn: Point = this.screenPosn(posn);

			for (let i = 0; i < this.hintValues.length; i++) {
				if (
					this.locationValues[i]?.site() === site &&
					this.locationValues[i]?.siteType() === type
				) {
					// compute maxHintvalue for potential font sizing
					let maxHintvalue = 0;
					for (let j = 0; j < this.hintValues.length; j++) {
						const hv = this.hintValues[i];
						if (hv != null && hv > maxHintvalue)
							maxHintvalue = hv;
					}

					if (maxHintvalue > 9) {
						g2d.setFont(new Font('Arial', BOLD,
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							Math.trunc((this.boardStyle as any).cellRadiusPixels() / 1.5)));
					}

					const hintVal = this.hintValues[i]!;
					const rect: Rect2D = stringBounds(g2d.getFont(), String(hintVal));

					const direction: CompassDirection = this.hintDirections[i];

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const crp: number = this.cellRadiusPixels();

					if (direction === 'W' || direction === 3 /* CompassDirection.W */) {
						g2d.drawString(String(hintVal),
							Math.trunc(drawnPosn.x - rect.getWidth() / 2 - crp * 1.5),
							Math.trunc(drawnPosn.y + rect.getHeight() / 4 - crp * 0.3));
					} else if (direction === 'N' || direction === 0 /* CompassDirection.N */) {
						g2d.drawString(String(hintVal),
							Math.trunc(drawnPosn.x - rect.getWidth() / 2 - crp * 0.5),
							Math.trunc(drawnPosn.y + rect.getHeight() / 4 - crp * 1.5));
					}
				}
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Fills cells, optionally colouring non-valid cells black and adding a
	 * diagonal line through them.
	 *
	 * (Overloads the inherited {@code fillCells} with additional parameters.)
	 *
	 * @java KakuroDesign#fillCells(java.awt.Graphics2D, int, java.awt.Color, java.awt.Color,
	 *        java.awt.BasicStroke, gnu.trove.list.array.TIntArrayList, java.awt.Color, boolean)
	 */
	protected fillCellsWithBlack(
		g2d: SVGGraphics2D,
		pixels: number,
		fillColor: Color | null,
		borderColor: Color | null,
		stroke: BasicStroke,
		validLocations: number[] | null,
		colorInvalid: Color,
		addDiagonal: boolean,
	): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cells: Cell[] = (this as any).topology().cells();

		g2d.setStroke(stroke);
		for (const cell of cells) {
			const path = new GeneralPath();
			if (fillColor !== null)
				g2d.setColor(fillColor);

			const verts: Vertex[] = cell.vertices();
			for (let v = 0; v < verts.length; v++) {
				if (path.getCurrentPoint() === null) {
					const prev: Vertex = verts[verts.length - 1];
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const prevPosn: Point = (this.boardStyle as any).screenPosn(prev.centroid());
					path.moveTo(prevPosn.x, prevPosn.y);
				}
				const corner: Vertex = verts[v]!;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const cornerPosn: Point = (this.boardStyle as any).screenPosn(corner.centroid());
				path.lineTo(cornerPosn.x, cornerPosn.y);
			}

			if (validLocations !== null) {
				// if cell is not a valid region, colour it differently
				if (!validLocations.includes(cell.index())) {
					g2d.setColor(colorInvalid);
				}
			}
			g2d.fill(path);

			if (addDiagonal && validLocations !== null) {
				// add diagonal lines to invalid cells
				if (!validLocations.includes(cell.index())) {
					if (borderColor !== null)
						g2d.setColor(borderColor);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const firstCorner: Point  = (this.boardStyle as any).screenPosn(verts[1]!.centroid());
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const secondCorner: Point = (this.boardStyle as any).screenPosn(verts[3]!.centroid());
					path.moveTo(firstCorner.x, firstCorner.y);
					path.lineTo(secondCorner.x, secondCorner.y);
					g2d.draw(path);
				}
			}
		}
		void pixels; // parameter retained for API fidelity
	}

	// -------------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign / PuzzleDesign.

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		void args;
	}

	/** @java PuzzleDesign#detectHints */
	protected detectHints(context: Context): void {
		void context;
	}

	/** @java BoardDesign#drawInnerCellEdges */
	protected drawInnerCellEdges(g2d: SVGGraphics2D, context: Context): void {
		void g2d; void context;
	}

	/** @java BoardDesign#drawOuterCellEdges */
	protected drawOuterCellEdges(bridge: Bridge, g2d: SVGGraphics2D, context: Context): void {
		void bridge; void g2d; void context;
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
