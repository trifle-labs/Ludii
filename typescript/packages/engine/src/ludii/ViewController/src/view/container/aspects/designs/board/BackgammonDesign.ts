// @java ViewController/src/view/container/aspects/designs/board/BackgammonDesign.java

/**
 * Board design for Backgammon boards.
 * Draws the distinctive frame with dark/light triangular strips.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.BackgammonDesign.
 *
 * @author cambolbro (Java original)
 * @java view.container.aspects.designs.board.BackgammonDesign
 */

// BoardDesign         -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardStyle          -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BackgammonStyle     -> batch 22: src/ludii/ViewController/src/view/container/styles/board/BackgammonStyle.ts
// BackgammonPlacement -> batch 27: src/ludii/ViewController/src/view/container/aspects/placement/Board/BackgammonPlacement.ts
// Bridge              -> src/ludii/ViewController/src/bridge/Bridge.ts
// awt                 -> src/ludii/awt/index.ts

import {
	Color,
	SVGGraphics2D,
	Graphics2D,
	GeneralPath,
	Point,
	Point2D,
} from '../../../../../../../awt/index.js';
import { Bridge } from '../../../../../bridge/Bridge.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.board.BackgammonStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BackgammonStyle = any;

/** @java view.container.aspects.placement.Board.BackgammonPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BackgammonPlacement = any;

/**
 * BackgammonDesign — renders the Backgammon board (frame + triangular strips).
 *
 * @java view.container.aspects.designs.board.BackgammonDesign
 */
export class BackgammonDesign {

	/** @java BackgammonDesign#backgammonStyle */
	private readonly backgammonStyle: BackgammonStyle;

	/** @java BackgammonDesign#backgammonPlacement */
	private readonly backgammonPlacement: BackgammonPlacement;

	// Alias via BoardDesign field names
	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BackgammonStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BackgammonPlacement;

	// -----------------------------------------------------------------------

	/** @java BackgammonDesign#boardColours */
	private readonly boardColours: Color[] = [
		new Color(225, 182, 130),  // light strip
		new Color(116,  58,  41),  // dark strip
		new Color(140,  75,  45),  // frame
		new Color(185, 130,  85),  // base
	];

	// -----------------------------------------------------------------------

	/**
	 * @java BackgammonDesign#BackgammonDesign(BackgammonStyle, BackgammonPlacement)
	 */
	constructor(boardStyle: BackgammonStyle, boardPlacement: BackgammonPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
		this.backgammonStyle = boardStyle;
		this.backgammonPlacement = boardPlacement;
	}

	// -----------------------------------------------------------------------

	/**
	 * @java BackgammonDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(this.boardPlacement as any).customiseGraphElementLocations(context);

		// Board image
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const width: number = (this.boardStyle as any).placement().width as number;
		const swThinRaw = Math.max(1, Math.trunc(0.0025 * width + 0.5));
		const swThin  = swThinRaw;
		const swThick = 2.0 * swThinRaw;

		this.setStrokesAndColours(
			bridge,
			context,
			new Color(120, 190, 240),
			new Color(125, 75, 0),
			new Color(210, 230, 255),
			null,
			null,
			null,
			null,
			null,
			new Color(0, 0, 0),
			swThin,
			swThick,
		);

		this.drawBackgammonBoard(g2d);

		return g2d.getSVGDocument();
	}

	// -----------------------------------------------------------------------

	/**
	 * Draws the Backgammon board design.
	 *
	 * Board layout (N = homeSize):
	 *
	 *   A------------------------------------------+
	 *   | C-----------------+  E-----------------+ |
	 *   | |2N+1  .  .  .  3N|3N|3N+2 .  .  . 4N+1| |
	 *   | |                 |+1|                 | |
	 *   | |                 |  |                 | |
	 *   | |                 |  |                 | |
	 *   | |0  .  .  .  . N-1|N |N+1  .  .  .  2N | |
	 *   | +-----------------D  +-----------------F |
	 *   +------------------------------------------B
	 *
	 * @java BackgammonDesign#drawBackgammonBoard(Graphics2D)
	 */
	drawBackgammonBoard(g2d: Graphics2D): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const topology = this.topology() as any;

		const pt0: Point = this.screenPosn(topology.vertices().get(0).centroid() as Point2D);
		const pt1: Point = this.screenPosn(topology.vertices().get(1).centroid() as Point2D);
		const off = pt1.x - pt0.x;
		const unit = off;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const homeSize: number = (this.backgammonPlacement as any).homeSize() as number;

		const ptD: Point = this.screenPosn(topology.vertices().get(homeSize - 1).centroid() as Point2D);
		const ptF: Point = this.screenPosn(topology.vertices().get(2 * homeSize).centroid() as Point2D);
		const ptC: Point = this.screenPosn(topology.vertices().get(2 * homeSize + 1).centroid() as Point2D);
		const ptE: Point = this.screenPosn(topology.vertices().get(3 * homeSize + 2).centroid() as Point2D);

		const pr = Math.trunc(off * 0.5);
		const border = Math.trunc(off * 0.5);

		const cx = ptC.x - pr;
		const cy = ptC.y - pr;

		const ex = ptE.x - pr;
		const ey = ptE.y - pr;

		const dx = ptD.x + pr;
		const dy = ptD.y + pr;

		const fx = ptF.x + pr;
		const fy = ptF.y + pr;

		const ax = cx - border;
		const ay = cy - border;

		const bx = fx + border;
		const by = fy + border;

		g2d.setColor(this.boardColours[2]!);
		g2d.fillRect(ax, ay, Math.abs(bx - ax), Math.abs(by - ay));

		g2d.setColor(this.boardColours[3]!);
		g2d.fillRect(cx, cy, Math.abs(dx - cx), Math.abs(dy - cy));
		g2d.fillRect(ex, ey, Math.abs(fx - ex), Math.abs(fy - ey));

		// Draw the triangular strips
		const pathD = new GeneralPath();
		const pathL = new GeneralPath();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const halfSize: number = Math.trunc(topology.vertices().size() / 2);
		let counter = 0;

		for (let n = 0; n < halfSize; n++) {
			if (n === homeSize || n === 3 * homeSize + 1)
				continue;

			counter++;

			const tx0 = cx + (n % halfSize) * unit;
			const ty0 = cy;
			const ty1 = ty0 + Math.trunc(4.5 * unit + 0.5);

			const bx0 = cx + (n % halfSize) * unit;
			const by0 = dy;
			const by1 = by0 - Math.trunc(4.5 * unit + 0.5);

			if (counter % 2 === 0) {
				pathD.moveTo(tx0, ty0);
				pathD.lineTo(tx0 + unit, ty0);
				pathD.lineTo(tx0 + 0.5 * unit, ty1);
				pathD.closePath();

				pathL.moveTo(bx0, by0);
				pathL.lineTo(bx0 + unit, by0);
				pathL.lineTo(bx0 + 0.5 * unit, by1);
				pathL.closePath();
			} else {
				pathL.moveTo(tx0, ty0);
				pathL.lineTo(tx0 + unit, ty0);
				pathL.lineTo(tx0 + 0.5 * unit, ty1);
				pathL.closePath();

				pathD.moveTo(bx0, by0);
				pathD.lineTo(bx0 + unit, by0);
				pathD.lineTo(bx0 + 0.5 * unit, by1);
				pathD.closePath();
			}
		}

		g2d.setColor(this.boardColours[0]!);
		g2d.fill(pathL);

		g2d.setColor(this.boardColours[1]!);
		g2d.fill(pathD);
	}

	// -----------------------------------------------------------------------

	/**
	 * @java BackgammonDesign#getBackgammonStyle()
	 */
	getBackgammonStyle(): BackgammonStyle {
		return this.backgammonStyle;
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

	// -----------------------------------------------------------------------
}
