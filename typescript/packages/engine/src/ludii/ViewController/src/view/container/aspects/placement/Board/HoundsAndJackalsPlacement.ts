// @java ViewController/src/view/container/aspects/placement/Board/HoundsAndJackalsPlacement.java

/**
 * Placement aspect for the Hounds and Jackals board. Delegates to
 * BoardPlacement.setCustomPlacement with a specific center and scale.
 *
 * Faithful 1:1 port of view.container.aspects.placement.Board.HoundsAndJackalsPlacement.
 *
 * Java hierarchy: HoundsAndJackalsPlacement → BoardPlacement → ContainerPlacement.
 * BoardPlacement (batch 28) is not yet ported; we extend ContainerPlacement directly
 * and inline the relevant BoardPlacement members as an escape-hatch.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.placement.Board.HoundsAndJackalsPlacement
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

// ---------------------------------------------------------------------------

/**
 * Placement for Hounds and Jackals.
 *
 * In Java:
 *   public class HoundsAndJackalsPlacement extends BoardPlacement {
 *     public void setPlacement(Context, Rectangle) {
 *       setCustomPlacement(context, placement, new Point2D.Double(0.5, 0.6), 0.7);
 *     }
 *   }
 *
 * @java view.container.aspects.placement.Board.HoundsAndJackalsPlacement
 */
export class HoundsAndJackalsPlacement extends ContainerPlacement {

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
	 * @java HoundsAndJackalsPlacement#HoundsAndJackalsPlacement(Bridge, BoardStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BoardStyle) {
		super(bridge, containerStyle);
		this.boardStyle = containerStyle;
		this.containerScale = this.defaultBoardScale;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java HoundsAndJackalsPlacement#setPlacement(Context, Rectangle)
	 */
	override setPlacement(context: Context, placement: Rectangle): void {
		this.setCustomPlacement(context, placement, { x: 0.5, y: 0.6 }, 0.7);
	}

	// -------------------------------------------------------------------------

	/**
	 * Sets a custom placement using the given board center and scale.
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
}
