// @java ViewController/src/view/container/aspects/designs/board/LascaDesign.java

/**
 * Board design for Lasca boards.
 * Renders vertices as large discs over a rectangular background.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.LascaDesign.
 *
 * @author (Java original)
 * @java view.container.aspects.designs.board.LascaDesign
 */

// BoardDesign    -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardStyle     -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// awt            -> src/ludii/awt/index.ts

import {
	Color,
	BasicStroke,
	SVGGraphics2D,
	Graphics2D,
	Ellipse2D,
	GeneralPath,
	Point,
	Point2D,
} from '../../../../../../../awt/index.js';
import { Bridge } from '../../../../../bridge/Bridge.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * LascaDesign — renders Lasca boards with vertex discs and a rectangular outline.
 *
 * @java view.container.aspects.designs.board.LascaDesign
 */
export class LascaDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// Fields inherited from BoardDesign (escape-hatch)

	/** @java BoardDesign#colorFillPhase0 */
	protected colorFillPhase0: Color | null = null;
	/** @java BoardDesign#colorFillPhase3 */
	protected colorFillPhase3: Color | null = null;
	/** @java BoardDesign#strokeThin */
	protected strokeThin: BasicStroke | null = null;
	/** @java BoardDesign#strokeThick */
	protected strokeThick: BasicStroke | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java LascaDesign#LascaDesign(BoardStyle, BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -----------------------------------------------------------------------

	/**
	 * @java LascaDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();

		const swRatio = 5 / 1000.0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const width: number = (this.boardStyle as any).placement().width as number;
		const swThin  = Math.max(1, Math.trunc(swRatio * width + 0.5));
		const swThick = 2 * swThin;

		this.setStrokesAndColours(
			bridge,
			context,
			null,
			null,
			new Color(200, 200, 200),
			null,
			null,
			new Color(255, 255, 255),
			null,
			null,
			null,
			swThin,
			swThick,
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const vertexRadius: number = (this.boardStyle as any).cellRadiusPixels() * 0.95;

		this.drawBoardOutline(g2d);
		this.drawVertices(bridge, g2d, context, vertexRadius);

		return g2d.getSVGDocument();
	}

	// -----------------------------------------------------------------------

	/**
	 * Draws all vertex dots as filled ellipses.
	 * @java LascaDesign#drawVertices(Bridge, Graphics2D, Context, double)
	 */
	protected drawVertices(_bridge: Bridge, g2d: Graphics2D, _context: Context, vertexRadius: number): void {
		if (this.colorFillPhase3 !== null)
			g2d.setColor(this.colorFillPhase3);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		for (const vertex of (this.topology() as any).vertices()) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const position: Point = this.screenPosn(vertex.centroid() as Point2D);
			const ellipseO = new Ellipse2D(
				position.x - vertexRadius,
				position.y - vertexRadius,
				2 * vertexRadius,
				2 * vertexRadius,
			);
			g2d.fill(ellipseO);
		}
	}

	// -----------------------------------------------------------------------

	/**
	 * Draws the board outline as a filled rectangle encompassing all vertices.
	 * @java LascaDesign#drawBoardOutline(SVGGraphics2D)
	 */
	drawBoardOutline(g2d: SVGGraphics2D): void {
		if (this.strokeThin !== null)
			g2d.setStroke(this.strokeThin);

		let minX = 9999;
		let minY = 9999;
		let maxX = -9999;
		let maxY = -9999;
		const path = new GeneralPath();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		for (const cell of (this.topology() as any).vertices()) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const posn: Point = this.screenPosn(cell.centroid() as Point2D);
			const x = posn.x;
			const y = posn.y;
			if (minX > x) minX = x;
			if (minY > y) minY = y;
			if (maxX < x) maxX = x;
			if (maxY < y) maxY = y;
		}

		if (this.colorFillPhase0 !== null)
			g2d.setColor(this.colorFillPhase0);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const OuterBufferDistance = Math.trunc((this.boardStyle as any).cellRadiusPixels() * 1.1);
		path.moveTo(minX - OuterBufferDistance, minY - OuterBufferDistance);
		path.lineTo(minX - OuterBufferDistance, maxY + OuterBufferDistance);
		path.lineTo(maxX + OuterBufferDistance, maxY + OuterBufferDistance);
		path.lineTo(maxX + OuterBufferDistance, minY - OuterBufferDistance);
		path.lineTo(minX - OuterBufferDistance, minY - OuterBufferDistance);
		g2d.fill(path);
	}

	// -----------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign (batch 26).

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		void args;
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

	/** @java BoardDesign#cellRadiusPixels */
	protected cellRadiusPixels(): number {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).cellRadiusPixels() as number;
	}

	// -----------------------------------------------------------------------
}
