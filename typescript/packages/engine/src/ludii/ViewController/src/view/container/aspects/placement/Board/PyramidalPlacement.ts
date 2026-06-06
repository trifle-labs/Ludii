// @java ViewController/src/view/container/aspects/placement/Board/PyramidalPlacement.java

/**
 * Placement aspect for pyramidal (Shibumi) boards. Overrides calculateCellRadius
 * to scale the radius by 1.4 to accommodate the stacked-ball layout.
 *
 * Faithful 1:1 port of view.container.aspects.placement.Board.PyramidalPlacement.
 *
 * Java hierarchy: PyramidalPlacement → BoardPlacement → ContainerPlacement.
 * BoardPlacement (batch 28) is not yet ported; we extend ContainerPlacement directly
 * and inline the relevant BoardPlacement members as an escape-hatch.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.placement.Board.PyramidalPlacement
 */

import { Bridge } from '../../../../../bridge/Bridge.js';
import { ContainerPlacement } from '../ContainerPlacement.js';

// ---------------------------------------------------------------------------
// Escape-hatched dependency types
// ---------------------------------------------------------------------------

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

// ---------------------------------------------------------------------------

/**
 * Placement for pyramidal boards (Shibumi).
 *
 * In Java:
 *   public class PyramidalPlacement extends BoardPlacement {
 *     @Override
 *     public void calculateCellRadius() {
 *       super.calculateCellRadius();
 *       setCellRadius(cellRadius * 1.4);
 *     }
 *   }
 *
 * @java view.container.aspects.placement.Board.PyramidalPlacement
 */
export class PyramidalPlacement extends ContainerPlacement {

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
	 * @java PyramidalPlacement#PyramidalPlacement(Bridge, BoardStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BoardStyle) {
		super(bridge, containerStyle);
		this.boardStyle = containerStyle;
		this.containerScale = this.defaultBoardScale;
	}

	// -------------------------------------------------------------------------

	/**
	 * Overrides the base calculation to scale cellRadius by 1.4.
	 * @java PyramidalPlacement#calculateCellRadius()
	 */
	override calculateCellRadius(): void {
		super.calculateCellRadius();
		this.setCellRadius(this._cellRadius * 1.4);
	}

	// -------------------------------------------------------------------------
}
