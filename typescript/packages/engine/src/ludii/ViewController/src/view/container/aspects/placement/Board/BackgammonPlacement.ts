// @java ViewController/src/view/container/aspects/placement/Board/BackgammonPlacement.java

/**
 * Placement aspect for the Backgammon board. Customises the locations of each
 * vertex to produce the characteristic triangular-point layout.
 *
 * Faithful 1:1 port of view.container.aspects.placement.Board.BackgammonPlacement.
 *
 * Java hierarchy: BackgammonPlacement → BoardPlacement → ContainerPlacement.
 * BoardPlacement (batch 28) is not yet ported; we extend ContainerPlacement directly
 * and inline the relevant BoardPlacement members as an escape-hatch.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.placement.Board.BackgammonPlacement
 */

import { Bridge } from '../../../../../bridge/Bridge.js';
import { ContainerUtil } from '../../../../../util/ContainerUtil.js';
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

/** @java other.topology.Vertex */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = any;

// ---------------------------------------------------------------------------

/**
 * Placement for Backgammon — nudges vertices into the correct triangle layout.
 *
 * In Java:
 *   public class BackgammonPlacement extends BoardPlacement { ... }
 *
 * @java view.container.aspects.placement.Board.BackgammonPlacement
 */
export class BackgammonPlacement extends ContainerPlacement {

	/** @java BackgammonPlacement#homeSize */
	private readonly _homeSize: number;

	/**
	 * Reference to the BoardStyle container style (from BoardPlacement.boardStyle field).
	 * @java view.container.aspects.placement.BoardPlacement#boardStyle
	 */
	protected boardStyle: BoardStyle;

	/**
	 * Scale of the board relative to the original placement size (10% margins either side).
	 * Mirrors BoardPlacement.defaultBoardScale.
	 * @java view.container.aspects.placement.BoardPlacement#defaultBoardScale
	 */
	protected defaultBoardScale: number = 0.8;

	// -------------------------------------------------------------------------

	/**
	 * @java BackgammonPlacement#BackgammonPlacement(Bridge, BoardStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BoardStyle) {
		super(bridge, containerStyle);
		this.boardStyle = containerStyle;
		this.containerScale = this.defaultBoardScale;
		this._homeSize = this.topology().vertices().length / 4;
	}

	// -------------------------------------------------------------------------

	/**
	 * Customise vertex locations for the Backgammon board.
	 * @java BackgammonPlacement#customiseGraphElementLocations(Context)
	 */
	customiseGraphElementLocations(context: Context): void {
		const pixels: number = this.placement.width;

		const unitsX: number = 2 * this.homeSize() + 1 + 1;  // 2 * runs + bar + border
		const unitsY: number = 2 * (this.homeSize() - 1) + 1 + 1;  // 2 * stacks + space + border

		const mx: number = Math.trunc(pixels / 2);
		const my: number = Math.trunc(pixels / 2);
		void my; // used implicitly via cy

		// even unit size
		const unit: number = Math.trunc(Math.trunc(pixels / (unitsX + 1)) / 2) * 2;
		const border: number = Math.trunc(unit / 2);

		const ax: number = mx - Math.trunc(unitsX * unit / 2.0 + 0.5);
		const ay: number = Math.trunc(pixels / 2) - Math.trunc(unitsY * unit / 2.0 + 0.5);

		const cx: number = ax + border;
		const cy: number = ay + border;

		// Nudge vertices into position
		const vertices: Vertex[] = this.topology().vertices();
		const halfSize: number = Math.trunc(vertices.length / 2);

		const offset: number = Math.trunc(
			0.08 * Math.abs(
				vertices[0]!.centroid().x * pixels - vertices[1]!.centroid().x * pixels
			)
		);

		for (let n = 0; n < vertices.length; n++) {
			const vertex: Vertex = vertices[n]!;

			const sign: number = (n < halfSize) ? -1 : 1;

			const x: number = cx + (n % halfSize) * unit + Math.trunc(unit / 2);
			const y: number = cy + Math.trunc(n / halfSize * 10) * unit + Math.trunc(unit / 2) + sign * offset;

			vertex.setCentroid(x / pixels, y / pixels, 0);
		}

		ContainerUtil.normaliseGraphElements(this.topology());
		ContainerUtil.centerGraphElements(this.topology());
		this.calculateCellRadius();
		this.resetPlacement(context);
	}

	// -------------------------------------------------------------------------

	/**
	 * Resets the placement of the container.
	 * Mirrors BoardPlacement.resetPlacement(Context).
	 * @java view.container.aspects.placement.BoardPlacement#resetPlacement(Context)
	 */
	resetPlacement(context: Context): void {
		this.setPlacement(context, this.unscaledPlacement());
	}

	// -------------------------------------------------------------------------

	/** @java BackgammonPlacement#homeSize() */
	homeSize(): number {
		return this._homeSize;
	}

	// -------------------------------------------------------------------------
}
