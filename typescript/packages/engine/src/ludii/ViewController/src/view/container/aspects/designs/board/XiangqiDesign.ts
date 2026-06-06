// @java ViewController/src/view/container/aspects/designs/board/XiangqiDesign.java

/**
 * Board design for Xiangqi boards.
 * Draws the river gap, palace crosses, and standard Xiangqi board symbols.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.XiangqiDesign.
 *
 * @author (Java original)
 * @java view.container.aspects.designs.board.XiangqiDesign
 */

// BoardDesign    -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardStyle     -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// SVGtoImage     -> src/ludii/Common/src/graphics/svg/SVGtoImage.ts
// awt            -> src/ludii/awt/index.ts

import {
	Color,
	BasicStroke,
	SVGGraphics2D,
	Graphics2D,
	GeneralPath,
	Point,
	Point2D,
	Rectangle,
} from '../../../../../../../awt/index.js';
import { Bridge } from '../../../../../bridge/Bridge.js';
import { SVGtoImage } from '../../../../../../../Common/src/graphics/svg/SVGtoImage.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java game.types.board.SiteType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteType = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * XiangqiDesign — renders Xiangqi boards with river gap and symbols.
 *
 * @java view.container.aspects.designs.board.XiangqiDesign
 */
export class XiangqiDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// Fields inherited from BoardDesign (escape-hatch)

	/** @java BoardDesign#colorEdgesInner */
	protected colorEdgesInner: Color | null = null;
	/** @java BoardDesign#colorEdgesOuter */
	protected colorEdgesOuter: Color | null = null;
	/** @java BoardDesign#strokeThin */
	protected strokeThin: BasicStroke | null = null;
	/** @java BoardDesign#strokeThick */
	protected strokeThick: BasicStroke | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java XiangqiDesign#XiangqiDesign(BoardStyle, BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -----------------------------------------------------------------------

	/**
	 * @java XiangqiDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();

		const swRatio = 5 / 1000.0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const width: number = (this.boardStyle as any).placement().width as number;
		const swThin  = Math.max(1, Math.trunc(swRatio * width + 0.5));
		const swThick = swThin;

		this.setStrokesAndColours(
			bridge,
			context,
			new Color(100, 75, 50),
			new Color(100, 75, 50),
			new Color(255, 230, 130),
			null,
			null,
			null,
			null,
			null,
			new Color(0, 0, 0),
			swThin,
			swThick,
		);

		this.fillCells(bridge, g2d, context);
		this.drawInnerCellEdges(g2d, context);
		this.drawSymbols(g2d, context);
		this.drawXiangqiSymbols(g2d);
		this.drawOuterCellEdges(bridge, g2d, context);

		return g2d.getSVGDocument();
	}

	// -----------------------------------------------------------------------

	/**
	 * Draws cell edges, skipping those that span the river (y ≈ 0.5).
	 * @java XiangqiDesign#drawInnerCellEdges(Graphics2D, Context)
	 */
	protected drawInnerCellEdges(g2d: Graphics2D, context: Context): void {
		if (this.strokeThin !== null) g2d.setStroke(this.strokeThin);
		if (this.colorEdgesInner !== null) g2d.setColor(this.colorEdgesInner);

		const path = new GeneralPath();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		for (const vA of (this.topology() as any).vertices()) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			for (const vB of vA.orthogonal()) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const va: Point2D = vA.centroid() as Point2D;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const vb: Point2D = vB.centroid() as Point2D;

				// only draw inner edges if not overlapping the river
				if ((va.getY() < 0.5 || vb.getY() > 0.5) && (va.getY() > 0.5 || vb.getY() < 0.5)) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const vaWorld: Point = (this.boardStyle as any).screenPosn(vA.centroid()) as Point;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const vbWorld: Point = (this.boardStyle as any).screenPosn(vB.centroid()) as Point;
					path.moveTo(vaWorld.x, vaWorld.y);
					path.lineTo(vbWorld.x, vbWorld.y);
				}
			}
		}

		// Palace diagonal lines (only for standard 9×10 board)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (context.board().topology().vertices().size() === 90) {
			let sp: Point;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const boardStyle: any = this.boardStyle;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const topology: any = this.topology();

			sp = boardStyle.screenPosn(topology.vertices().get(3).centroid()) as Point;
			path.moveTo(sp.x, sp.y);
			sp = boardStyle.screenPosn(topology.vertices().get(23).centroid()) as Point;
			path.lineTo(sp.x, sp.y);

			sp = boardStyle.screenPosn(topology.vertices().get(5).centroid()) as Point;
			path.moveTo(sp.x, sp.y);
			sp = boardStyle.screenPosn(topology.vertices().get(21).centroid()) as Point;
			path.lineTo(sp.x, sp.y);

			sp = boardStyle.screenPosn(topology.vertices().get(86).centroid()) as Point;
			path.moveTo(sp.x, sp.y);
			sp = boardStyle.screenPosn(topology.vertices().get(66).centroid()) as Point;
			path.lineTo(sp.x, sp.y);

			sp = boardStyle.screenPosn(topology.vertices().get(84).centroid()) as Point;
			path.moveTo(sp.x, sp.y);
			sp = boardStyle.screenPosn(topology.vertices().get(68).centroid()) as Point;
			path.lineTo(sp.x, sp.y);
		}

		g2d.draw(path);
	}

	// -----------------------------------------------------------------------

	/**
	 * Draws all Xiangqi symbols on the board.
	 * @java XiangqiDesign#drawXiangqiSymbols(Graphics2D)
	 */
	drawXiangqiSymbols(g2d: Graphics2D): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const imgSz: number = (this.boardPlacement as any).cellRadiusPixels() * 2;

		// Load the decoration for special cells
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const boardVertexWidth: number = (this.topology() as any).columns('Vertex' as SiteType).size();
		const symbolLocations: number[] = [
			boardVertexWidth * 2 + 1,
			boardVertexWidth * 2 + 7,
			boardVertexWidth * 3 + 2,
			boardVertexWidth * 3 + 4,
			boardVertexWidth * 3 + 6,
			boardVertexWidth * 6 + 2,
			boardVertexWidth * 6 + 4,
			boardVertexWidth * 6 + 6,
			boardVertexWidth * 7 + 1,
			boardVertexWidth * 7 + 7,
		];

		const edgeColour = new Color(0, 0, 0);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const fillColour: Color = this.colorSymbol() as Color;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		for (const v of (this.boardStyle as any).topology().vertices()) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const drawPosn: Point = (this.boardStyle as any).screenPosn(v.centroid()) as Point;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const idx: number = v.index() as number;

			if (idx === boardVertexWidth * 3 || idx === boardVertexWidth * 6) {
				SVGtoImage.loadFromFilePath(
					g2d,
					'/svg/xiangqi/symbol_left.svg',
					new Rectangle(
						Math.trunc(drawPosn.x - imgSz * 0.125),
						Math.trunc(drawPosn.y - imgSz * 0.375),
						Math.trunc(imgSz * 0.75),
						Math.trunc(imgSz * 0.75),
					),
					edgeColour,
					fillColour,
					0,
				);
			}

			if (idx === boardVertexWidth * 3 + 8 || idx === boardVertexWidth * 6 + 8) {
				SVGtoImage.loadFromFilePath(
					g2d,
					'/svg/xiangqi/symbol_right.svg',
					new Rectangle(
						Math.trunc(drawPosn.x - imgSz * 0.6),
						Math.trunc(drawPosn.y - imgSz * 0.375),
						Math.trunc(imgSz * 0.75),
						Math.trunc(imgSz * 0.75),
					),
					edgeColour,
					fillColour,
					0,
				);
			}

			if (symbolLocations.includes(idx)) {
				SVGtoImage.loadFromFilePath(
					g2d,
					'/svg/xiangqi/symbol.svg',
					new Rectangle(
						Math.trunc(drawPosn.x - imgSz * 0.375),
						Math.trunc(drawPosn.y - imgSz * 0.375),
						Math.trunc(imgSz * 0.75),
						Math.trunc(imgSz * 0.75),
					),
					edgeColour,
					fillColour,
					0,
				);
			}
		}
	}

	// -----------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign (batch 26).

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		void args;
	}

	/** @java BoardDesign#fillCells */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected fillCells(_bridge: Bridge, _g2d: SVGGraphics2D, _context: Context): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#drawSymbols */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected drawSymbols(_g2d: SVGGraphics2D, _context: Context): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#drawOuterCellEdges */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected drawOuterCellEdges(_bridge: Bridge, _g2d: SVGGraphics2D, _context: Context): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#colorSymbol */
	protected colorSymbol(): Color | null {
		// escape-hatch: BoardDesign not yet ported
		return null;
	}

	/** @java BoardDesign#topology */
	protected topology(): unknown {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).topology();
	}

	/** @java BoardDesign#screenPosn */
	protected screenPosn(posn: Point2D): Point {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).screenPosn(posn) as Point;
	}

	// -----------------------------------------------------------------------
}
