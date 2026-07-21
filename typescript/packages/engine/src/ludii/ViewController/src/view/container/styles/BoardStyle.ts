// @java ViewController/src/view/container/styles/BoardStyle.java

/**
 * Board container style — extends BaseContainerStyle to add board-specific
 * placement, axis, and design aspects.
 *
 * Faithful 1:1 port of view.container.styles.BoardStyle.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.styles.BoardStyle
 */

// BaseContainerStyle -> src/ludii/ViewController/src/view/container/BaseContainerStyle.ts
// BoardAxis          -> batch 26: src/ludii/ViewController/src/view/container/aspects/axes/BoardAxis.ts
// BoardDesign        -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardPlacement     -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge             -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container          -> game.equipment.container.Container (Core)

import { Bridge } from '../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/** @java view.container.aspects.axes.BoardAxis */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardAxis = any;

/** @java view.container.aspects.designs.BoardDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardDesign = any;

/**
 * BoardStyle — adds board-specific ECS aspects on top of BaseContainerStyle.
 *
 * Java source:
 *   public class BoardStyle extends BaseContainerStyle {
 *     protected BoardPlacement boardPlacement;
 *
 *     public BoardStyle(Bridge bridge, Container container) {
 *       super(bridge, container);
 *       boardPlacement = new BoardPlacement(bridge, this);
 *       containerPlacement = boardPlacement;
 *       containerAxis = new BoardAxis(this);
 *       containerDesign = new BoardDesign(this, boardPlacement);
 *     }
 *
 *     @Override
 *     public void setDefaultBoardScale(double scale) {
 *       boardPlacement.setDefaultBoardScale(scale);
 *     }
 *   }
 *
 * @java view.container.styles.BoardStyle
 */
export class BoardStyle {

	/** @java BoardStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java BoardStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java BoardStyle#boardPlacement */
	protected boardPlacement: BoardPlacement | null = null;

	/** @java BoardStyle#containerPlacement (inherited via BaseContainerStyle) */
	protected containerPlacement: BoardPlacement | null = null;

	/** @java BoardStyle#containerAxis (inherited via BaseContainerStyle) */
	protected containerAxis: BoardAxis | null = null;

	/** @java BoardStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: BoardDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java BoardStyle#BoardStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BaseContainerStyle, BoardPlacement, BoardAxis, and BoardDesign
		// are ported, replace this class body with a proper `extends BaseContainerStyle`.
		//
		// boardPlacement = new BoardPlacement(bridge, this);
		// containerPlacement = boardPlacement;
		// containerAxis = new BoardAxis(this);
		// containerDesign = new BoardDesign(this, boardPlacement);
		//
		// (BoardPlacement is in batch 28, BoardAxis in batch 26, BoardDesign in batch 26)
		this.boardPlacement = null;
		this.containerPlacement = null;
		this.containerAxis = null;
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/**
	 * @java BoardStyle#setDefaultBoardScale(double)
	 */
	setDefaultBoardScale(scale: number): void {
		if (this.boardPlacement !== null) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(this.boardPlacement as any).setDefaultBoardScale(scale);
		}
	}

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
