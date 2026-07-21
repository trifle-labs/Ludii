// @java ViewController/src/view/container/aspects/placement/BoardPlacement.java

/**
 * Board-specific container placement.
 *
 * Faithful 1:1 port of view.container.aspects.placement.BoardPlacement.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.aspects.placement.BoardPlacement
 */

import { Point, Rectangle } from '../../../../../../awt/index.js';
import type { Point2D } from '../../../../../../awt/index.js';
import type { Rectangle2D } from '../../../../../../awt/index.js';
import { ContainerPlacement } from './ContainerPlacement.js';
import { ContainerUtil } from '../../../../util/ContainerUtil.js';
import type { IBridge } from '../../BaseContainerStyle.js';

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
// BoardPlacement
// @java view.container.aspects.placement.BoardPlacement
// ---------------------------------------------------------------------------

/**
 * Board-specific placement aspect.
 * Extends ContainerPlacement and provides board-level positioning logic
 * (default board scale, custom placement, metadata-driven overrides).
 *
 * Faithful 1:1 port of view.container.aspects.placement.BoardPlacement.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.aspects.placement.BoardPlacement
 */
export class BoardPlacement extends ContainerPlacement {

	/** @java BoardPlacement#boardStyle */
	protected boardStyle: BoardStyle;

	// -------------------------------------------------------------------------

	/**
	 * Scale of the board relative to the original placement size (10% margins either side).
	 * @java BoardPlacement#defaultBoardScale
	 */
	protected defaultBoardScale: number = 0.8;

	// -------------------------------------------------------------------------

	/**
	 * @java BoardPlacement#BoardPlacement(bridge.Bridge, view.container.styles.BoardStyle)
	 */
	constructor(bridge: IBridge, containerStyle: BoardStyle) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		super(bridge as unknown as any, containerStyle);
		this.containerScale = this.defaultBoardScale;
		this.boardStyle = containerStyle;
	}

	// -------------------------------------------------------------------------

	/**
	 * Customise graph element locations, if needed.
	 *
	 * Note: Do not customise graph element locations based on their current
	 * locations, otherwise multiple calls will produce cumulative changes.
	 *
	 * @java BoardPlacement#customiseGraphElementLocations(other.context.Context)
	 */
	customiseGraphElementLocations(context: Context): void {
		// Customise graph element locations here:
		// ...

		// Then call the following:
		ContainerUtil.normaliseGraphElements(this.topology());
		ContainerUtil.centerGraphElements(this.topology());
		this.calculateCellRadius();
		this.resetPlacement(context);
	}

	// -------------------------------------------------------------------------

	/**
	 * @param context     Current game context.
	 * @param placement   The bounding rectangle for this board view.
	 * @param boardCenter Normalised centre of the board (0..1 x 0..1).
	 * @param scale       The scale of the board by default.
	 *
	 * @java BoardPlacement#setCustomPlacement(other.context.Context, java.awt.Rectangle, java.awt.geom.Point2D, double)
	 */
	setCustomPlacement(
		_context: Context,
		placementArg: Rectangle,
		boardCenter: Point2D,
		scale: number
	): void {
		const unscaled = new Rectangle(
			placementArg.x,
			placementArg.y,
			placementArg.width + placementArg.x,
			placementArg.height
		);
		this.setUnscaledPlacement(unscaled);
		this.containerScale = scale;

		this.placement = new Rectangle(
			Math.trunc(placementArg.getX() + placementArg.getWidth() * (1.0 - scale) * boardCenter.getX()),
			Math.trunc(placementArg.getY() + placementArg.getHeight() * (1.0 - scale) * boardCenter.getY()),
			Math.trunc(placementArg.getWidth() * scale),
			Math.trunc(placementArg.getHeight() * scale)
		);

		// Note: cellRadius() is a field in ContainerPlacement (field shadows method due to
		// a naming conflict in that class). Access via the field directly.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.setCellRadiusPixels(Math.trunc((this as unknown as any).cellRadius * this.placement.width));
	}

	/**
	 * @java BoardPlacement#setPlacement(other.context.Context, java.awt.Rectangle)
	 */
	override setPlacement(context: Context, placementArg: Rectangle): void {
		// Equivalent to new Point2D.Double(0.5, 0.5) in Java
		let boardCenterX = 0.5;
		let boardCenterY = 0.5;

		if ((this.container() as unknown as { defaultSite(): string }).defaultSite() === 'Vertex')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.containerScale = this.defaultBoardScale - (this as unknown as any).cellRadius;
		else
			this.containerScale = this.defaultBoardScale;

		const metadataPlacement: Rectangle2D | null =
			(context as unknown as { game(): { metadata(): { graphics(): { boardPlacement(): Rectangle2D | null } } } })
				.game().metadata().graphics().boardPlacement();

		if (metadataPlacement !== null) {
			boardCenterX += metadataPlacement.getX();
			boardCenterY += metadataPlacement.getY();
			this.containerScale *= metadataPlacement.getWidth();
		}

		// Construct a minimal Point2D-compatible object for boardCenter
		const boardCenter: Point2D = new Point(0, 0);
		(boardCenter as unknown as Point).x = boardCenterX;
		(boardCenter as unknown as Point).y = boardCenterY;

		this.setCustomPlacement(context, placementArg, boardCenter, this.containerScale);
	}

	// -------------------------------------------------------------------------

	/**
	 * Resets the placement of the container.
	 * Needs to be called if the position of any vertices in the graph are shifted.
	 *
	 * @java BoardPlacement#resetPlacement(other.context.Context)
	 */
	resetPlacement(context: Context): void {
		this.setPlacement(context, this.unscaledPlacement());
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardPlacement#setDefaultBoardScale(double)
	 */
	setDefaultBoardScale(scale: number): void {
		this.defaultBoardScale = scale;
	}

	// -------------------------------------------------------------------------
}
