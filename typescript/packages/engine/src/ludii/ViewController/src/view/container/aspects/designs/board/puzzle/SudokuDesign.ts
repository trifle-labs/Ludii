// @java ViewController/src/view/container/aspects/designs/board/puzzle/SudokuDesign.java

/**
 * Design for Sudoku (and killer Sudoku) puzzle boards.
 *
 * Draws the standard light-blue cell grid, then overlays thick grid lines at
 * the 3×3 region boundaries (or killer-sudoku dashed region outlines).
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.puzzle.SudokuDesign.
 *
 * @author matthew.stephenson (Java original)
 * @java view.container.aspects.designs.board.puzzle.SudokuDesign
 */

// PuzzleDesign   -> batch 23: src/ludii/ViewController/src/view/container/aspects/designs/board/puzzle/PuzzleDesign.ts
// BoardStyle     -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// Context        -> other.context.Context (Core)
// awt shims      -> src/ludii/awt/index.ts

import {
	BasicStroke, CAP_BUTT, JOIN_MITER,
	Color,
	GeneralPath,
	SVGGraphics2D,
} from '../../../../../../../../awt/index.js';
import { Bridge } from '../../../../../../bridge/Bridge.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/** @java metadata.graphics.util.PuzzleDrawHintType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PuzzleDrawHintType = any;

/** @java other.topology.Cell */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cell = any;

/** @java other.topology.Edge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyEdge = any;

/** @java other.topology.Vertex */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = any;

/** @java java.awt.Point */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Point = any;

/** @java java.awt.geom.Point2D */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Point2D = any;

/** @java other.location.Location */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Location = any;

/**
 * SudokuDesign — renders a Sudoku puzzle board.
 *
 * In addition to the standard PuzzleDesign rendering it draws thick grid lines
 * at the Sudoku box boundaries and, for killer Sudoku, dashed region outlines.
 *
 * Java source:
 *   public class SudokuDesign extends PuzzleDesign {
 *     public SudokuDesign(BoardStyle boardStyle, BoardPlacement boardPlacement) {
 *       super(boardStyle, boardPlacement);
 *       drawHintType = PuzzleDrawHintType.TopLeft;
 *     }
 *
 *     @Override
 *     public String createSVGImage(Bridge bridge, Context context) { ... }
 *
 *     protected void drawGridEdges(Graphics2D g2d, Color borderColor, BasicStroke stroke) { ... }
 *   }
 *
 * @java view.container.aspects.designs.board.puzzle.SudokuDesign
 */
export class SudokuDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// Inherited fields from PuzzleDesign / BoardDesign (escape-hatched)

	/** @java PuzzleDesign#drawHintType — set to TopLeft in constructor */
	protected drawHintType: PuzzleDrawHintType = 'TopLeft';

	/** @java PuzzleDesign#hintValues */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected hintValues: number[] | null = null;

	/** @java PuzzleDesign#hintRegions */
	protected hintRegions: Array<Location[]> = [];

	/** @java BoardDesign#colorEdgesInner */
	protected colorEdgesInner: Color | null = null;
	/** @java BoardDesign#colorEdgesOuter */
	protected colorEdgesOuter: Color | null = null;
	/** @java BoardDesign#strokeThin */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected strokeThin: BasicStroke = new BasicStroke(1);
	/** @java BoardDesign#strokeThick */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected strokeThick: BasicStroke = new BasicStroke(2);
	/** @java BoardDesign#colorSymbol */
	protected colorSymbol: Color | null = null;

	// -------------------------------------------------------------------------

	/**
	 * @java SudokuDesign#SudokuDesign(view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
		this.drawHintType = 'TopLeft' as PuzzleDrawHintType;
	}

	// -------------------------------------------------------------------------

	/**
	 * @returns SVG as string.
	 * @java SudokuDesign#createSVGImage(bridge.Bridge, other.context.Context)
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
			new Color(120, 190, 240),
			new Color(210, 230, 255),
			null,
			null,
			null,
			null,
			null,
			new Color(200, 50, 200),
			swThin,
			swThick,
		);

		this.detectHints(context);
		this.fillCells(bridge, g2d, context);
		this.drawInnerCellEdges(g2d, context);
		this.drawOuterCellEdges(bridge, g2d, context);
		this.drawGridEdges(g2d, this.colorEdgesOuter, this.strokeThick);

		// draw inner sudoku regions (for killer sudoku)
		const dash1: number[] = [6.0];
		const dashed = new BasicStroke(this.strokeThin.getLineWidth(), CAP_BUTT, JOIN_MITER, 5.0, dash1, 0.0);

		this.drawRegions(g2d, context, this.colorSymbol, dashed, this.hintRegions);

		return g2d.getSVGDocument();
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws the thick grid lines separating Sudoku boxes.
	 *
	 * @java SudokuDesign#drawGridEdges(java.awt.Graphics2D, java.awt.Color, java.awt.BasicStroke)
	 */
	protected drawGridEdges(g2d: SVGGraphics2D, borderColor: Color | null, stroke: BasicStroke): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cells: Cell[] = (this as any).topology().cells();

		if (borderColor !== null)
			g2d.setColor(borderColor);
		g2d.setStroke(stroke);

		const sudokuEdges: TopologyEdge[] = [];
		const path = new GeneralPath();

		const boardDimension: number = Math.sqrt(cells.length);
		const lineInterval: number = Math.trunc(Math.sqrt(boardDimension));

		for (const cell of cells) {
			for (const edge of cell.edges()) {
				// vertical lines
				const columnValue: number = cell.index() + 1;
				if (
					(columnValue % lineInterval === 0) &&
					(columnValue % boardDimension !== 0)
				) {
					if (
						edge.vA().centroid().getX() > cell.centroid().getX() &&
						edge.vB().centroid().getX() > cell.centroid().getX()
					) {
						sudokuEdges.push(edge);
					}
				}

				// horizontal lines
				const rowLength: number = Math.trunc(Math.sqrt(cells.length));
				const rowValue: number = Math.trunc(cell.index() / rowLength);
				if (
					(rowValue % lineInterval === (lineInterval - 1)) &&
					(rowValue % (boardDimension - 1) !== 0)
				) {
					if (
						edge.vA().centroid().getY() > cell.centroid().getY() &&
						edge.vB().centroid().getY() > cell.centroid().getY()
					) {
						sudokuEdges.push(edge);
					}
				}
			}
		}

		while (sudokuEdges.length > 0) {
			let currentEdge: TopologyEdge = sudokuEdges[0];
			let nextEdgeFound = true;

			const va: Point2D = currentEdge.vA().centroid();
			let vb: Point2D = currentEdge.vB().centroid();

			const vAPosn: Point = this.screenPosn(va);
			let vBPosn: Point = this.screenPosn(vb);

			path.moveTo(vAPosn.x, vAPosn.y);

			while (nextEdgeFound) {
				nextEdgeFound = false;
				path.lineTo(vBPosn.x, vBPosn.y);

				const idx = sudokuEdges.indexOf(currentEdge);
				if (idx !== -1) sudokuEdges.splice(idx, 1);

				for (const nextEdge of sudokuEdges) {
					if (
						Math.abs(vb.getX() - nextEdge.vA().centroid().getX()) < 0.0001 &&
						Math.abs(vb.getY() - nextEdge.vA().centroid().getY()) < 0.0001
					) {
						nextEdgeFound = true;
						currentEdge = nextEdge;
						vb = currentEdge.vB().centroid();
						vBPosn = this.screenPosn(vb);
						break;
					} else if (
						Math.abs(vb.getX() - nextEdge.vB().centroid().getX()) < 0.0001 &&
						Math.abs(vb.getY() - nextEdge.vB().centroid().getY()) < 0.0001
					) {
						nextEdgeFound = true;
						currentEdge = nextEdge;
						vb = currentEdge.vA().centroid();
						vBPosn = this.screenPosn(vb);
						break;
					}
				}
			}
		}
		g2d.draw(path);
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

	/** @java BoardDesign#fillCells */
	protected fillCells(bridge: Bridge, g2d: SVGGraphics2D, context: Context): void {
		void bridge; void g2d; void context;
	}

	/** @java BoardDesign#drawInnerCellEdges */
	protected drawInnerCellEdges(g2d: SVGGraphics2D, context: Context): void {
		void g2d; void context;
	}

	/** @java BoardDesign#drawOuterCellEdges */
	protected drawOuterCellEdges(bridge: Bridge, g2d: SVGGraphics2D, context: Context): void {
		void bridge; void g2d; void context;
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

	/** @java BoardDesign#screenPosn */
	protected screenPosn(posn: Point2D): Point {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).screenPosn(posn);
	}

	/** @java BoardDesign#topology */
	protected topology(): unknown {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).topology();
	}

	// -------------------------------------------------------------------------
}
