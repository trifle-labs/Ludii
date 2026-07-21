// @java ViewController/src/view/container/aspects/placement/Board/TablePlacement.java

/**
 * The placement of the pieces in the Table board.
 * Nudges vertices to produce the characteristic backgammon-like table layout
 * with a bar and two separated sides.
 *
 * Faithful 1:1 port of view.container.aspects.placement.Board.TablePlacement.
 *
 * Java hierarchy: TablePlacement → BoardPlacement → ContainerPlacement.
 * BoardPlacement (batch 28) is not yet ported; we extend ContainerPlacement directly
 * and inline the relevant BoardPlacement members as an escape-hatch.
 *
 * @author Eric.Piette (Java original)
 * @java view.container.aspects.placement.Board.TablePlacement
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
 * Placement for Table board.
 *
 * In Java:
 *   public class TablePlacement extends BoardPlacement { ... }
 *
 * @java view.container.aspects.placement.Board.TablePlacement
 */
export class TablePlacement extends ContainerPlacement {

	/** The size of the home region of the board. */
	private readonly _homeSize: number;

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
	 * @java TablePlacement#TablePlacement(Bridge, BoardStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BoardStyle) {
		super(bridge, containerStyle);
		this.boardStyle = containerStyle;
		this.containerScale = this.defaultBoardScale;
		this._homeSize = Math.trunc(this.topology().vertices().length / 4);
	}

	// -------------------------------------------------------------------------

	/**
	 * @java TablePlacement#customiseGraphElementLocations(Context)
	 */
	customiseGraphElementLocations(context: Context): void {
		const pixels: number = this.placement.width;

		const unitsX: number = 2 * this.homeSize() + 1 + 1; // 2 * homes + bar + border
		const unitsY: number = 2 * (this.homeSize() - 1) + 1 + 1; // 2 * stacks + space + border

		const mx: number = Math.trunc(pixels / 2);
		const my: number = Math.trunc(pixels / 2);
		void my;

		const unit: number = Math.trunc(Math.trunc(pixels / unitsX) / 2) * 2; // even
		const border: number = Math.trunc(unit / 2);

		const ax: number = mx - Math.trunc(unitsX * unit / 2.0 + 0.5);
		const ay: number = Math.trunc(pixels / 2) - Math.trunc(unitsY * unit / 2.0 + 0.5);

		const cx: number = ax + border;
		const cy: number = ay + border;

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

			const x: number = cx + (n % halfSize) * unit + Math.trunc(unit / 2) +
				(TablePlacement.leftSide(Math.trunc(halfSize / 2), n) ? 0 : unit);
			const y: number = cy + Math.trunc(n / halfSize * 10) * unit + Math.trunc(unit / 2) + sign * offset;

			vertex.setCentroid(x / pixels, y / pixels, 0);
		}

		ContainerUtil.normaliseGraphElements(this.topology());
		ContainerUtil.centerGraphElements(this.topology());
		this.calculateCellRadius();
		this.resetPlacement(context);
	}

	// -------------------------------------------------------------------------

	/** @java TablePlacement#homeSize() */
	homeSize(): number {
		return this._homeSize;
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

	/**
	 * Returns true if the vertex at the given index is on the left side.
	 * @java TablePlacement#leftSide(int, int)
	 */
	private static leftSide(sideSize: number, index: number): boolean {
		const x: number = Math.trunc(index / sideSize);
		return x % 2 === 0;
	}

	// -------------------------------------------------------------------------
}
