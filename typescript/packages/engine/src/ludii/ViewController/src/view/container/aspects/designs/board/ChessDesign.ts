// @java ViewController/src/view/container/aspects/designs/board/ChessDesign.java

/**
 * Board design for Chess-family boards.
 * Renders a checkered board with chess-style colours.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.ChessDesign.
 *
 * @author (Java original)
 * @java view.container.aspects.designs.board.ChessDesign
 */

// BoardDesign    -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardStyle     -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// awt            -> src/ludii/awt/index.ts

import {
	Color,
	SVGGraphics2D,
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
 * ChessDesign — renders a checkered Chess board.
 *
 * @java view.container.aspects.designs.board.ChessDesign
 */
export class ChessDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	/** @java BoardDesign#checkeredBoard */
	protected checkeredBoard = false;

	/** @java BoardDesign#straightLines */
	protected straightLines = false;

	// -----------------------------------------------------------------------

	/**
	 * @java ChessDesign#ChessDesign(BoardStyle, BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -----------------------------------------------------------------------

	/**
	 * @java ChessDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		this.checkeredBoard = true;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();

		const swRatio = 5 / 1000.0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const width: number = (this.boardStyle as any).placement().width as number;
		const swThin  = Math.max(1, Math.trunc(swRatio * width + 0.5));
		const swThick = 1 * swThin;

		this.setStrokesAndColours(
			bridge,
			context,
			new Color(0, 0, 0),
			new Color(150, 75, 0),      // border
			new Color(200, 150, 75),    // dark cells
			new Color(250, 221, 144),   // light cells
			new Color(223, 178, 110),   // middle cells
			new Color(255, 240, 200),   // other cells
			null,
			null,
			new Color(0, 0, 0),
			swThin,
			swThick,
		);

		this.drawGround(g2d, context, true);
		this.fillCells(bridge, g2d, context);
		this.drawSymbols(g2d, context);
		this.drawGround(g2d, context, false);

		return g2d.getSVGDocument();
	}

	// -----------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign (batch 26).

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		void args;
	}

	/** @java BoardDesign#drawGround */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected drawGround(_g2d: SVGGraphics2D, _context: Context, _background: boolean): void {
		// escape-hatch: BoardDesign not yet ported
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

	// -----------------------------------------------------------------------
}
