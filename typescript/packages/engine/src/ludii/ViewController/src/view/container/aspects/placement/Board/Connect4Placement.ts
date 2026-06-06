// @java ViewController/src/view/container/aspects/placement/Board/Connect4Placement.java

/**
 * Placement aspect for the Connect-4 board. Uses the standard placement
 * but repositions cells to a uniform grid.
 *
 * Faithful 1:1 port of view.container.aspects.placement.Board.Connect4Placement.
 *
 * Java hierarchy: Connect4Placement → BoardPlacement → ContainerPlacement.
 * BoardPlacement (batch 28) is not yet ported; we extend ContainerPlacement directly
 * and inline the relevant BoardPlacement members as an escape-hatch.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.placement.Board.Connect4Placement
 */

import { Rectangle } from '../../../../../../../awt/index.js';
import { Bridge } from '../../../../../bridge/Bridge.js';
import { ContainerPlacement } from '../ContainerPlacement.js';

// ---------------------------------------------------------------------------
// Escape-hatched dependency types
// ---------------------------------------------------------------------------

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java other.topology.Cell */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cell = any;

// ---------------------------------------------------------------------------

/**
 * Placement for Connect-4.
 *
 * In Java:
 *   public class Connect4Placement extends BoardPlacement { ... }
 *
 * @java view.container.aspects.placement.Board.Connect4Placement
 */
export class Connect4Placement extends ContainerPlacement {

	/** Number of rows in the connect-4 board. */
	private readonly _connect4Rows: number = 6;

	/**
	 * Scale of the board relative to the original placement size.
	 * Mirrors BoardPlacement.defaultBoardScale.
	 * @java view.container.aspects.placement.BoardPlacement#defaultBoardScale
	 */
	protected defaultBoardScale: number = 0.8;

	/** @java view.container.aspects.placement.BoardPlacement#boardStyle */
	protected boardStyle: BoardStyle;

	// -------------------------------------------------------------------------

	/**
	 * @java Connect4Placement#Connect4Placement(Bridge, BoardStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BoardStyle) {
		super(bridge, containerStyle);
		this.boardStyle = containerStyle;
		this.containerScale = this.defaultBoardScale;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java Connect4Placement#setPlacement(Context, Rectangle)
	 */
	override setPlacement(context: Context, placement: Rectangle): void {
		this.setCustomPlacement(context, placement, { x: 0.5, y: 0.5 }, 1.0);
		this.setCellLocations(placement.width, this.topology().cells() as Cell[]);
	}

	// -------------------------------------------------------------------------

	/**
	 * Sets a custom placement.
	 * Mirrors BoardPlacement.setCustomPlacement(Context, Rectangle, Point2D, double).
	 * @java view.container.aspects.placement.BoardPlacement#setCustomPlacement(Context, Rectangle, Point2D, double)
	 */
	setCustomPlacement(
		_context: Context,
		placement: Rectangle,
		boardCenter: { x: number; y: number },
		scale: number
	): void {
		const unscaledPlacement = new Rectangle(
			placement.x,
			placement.y,
			placement.width + placement.x,
			placement.height
		);
		this.setUnscaledPlacement(unscaledPlacement);
		this.containerScale = scale;

		this.placement = new Rectangle(
			Math.trunc(placement.getX() + placement.getWidth() * (1.0 - scale) * boardCenter.x),
			Math.trunc(placement.getY() + placement.getHeight() * (1.0 - scale) * boardCenter.y),
			Math.trunc(placement.getWidth() * scale),
			Math.trunc(placement.getHeight() * scale)
		);

		this.setCellRadiusPixels(Math.trunc(this._cellRadius * this.placement.width));
	}

	// -------------------------------------------------------------------------

	/**
	 * Sets cell locations for Connect-4 (only the top row of cells in each column).
	 * @java Connect4Placement#setCellLocations(int, List)
	 */
	setCellLocations(pixels: number, cells: Cell[]): void {
		const cols: number = this.topology().columns('Cell' as string).length;
		const rows: number = this._connect4Rows;

		const u: number = Math.trunc(pixels / (cols + 1));

		const x0: number = Math.trunc(pixels / 2 - (0.5 * cols * u + 0.5));
		const y0: number = Math.trunc(pixels / 2 - (0.5 * rows * u + 0.5));

		for (let n = 0; n < cols; n++) {
			const cell: Cell = cells[n]!;

			const row: number = 0;
			const col: number = n;

			const x: number = x0 + col * u + Math.trunc(u / 2);
			const y: number = y0 + row * u + Math.trunc(u / 2);

			cell.setCentroid(x / pixels, y / pixels, 0);
			this.topology().cells()[cell.index()].setCentroid(x / pixels, y / pixels, 0);
		}
	}

	// -------------------------------------------------------------------------

	/** @java Connect4Placement#connect4Rows() */
	connect4Rows(): number {
		return this._connect4Rows;
	}

	// -------------------------------------------------------------------------
}
