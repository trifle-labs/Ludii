// @java ViewController/src/view/container/styles/board/IsometricStyle.java

/**
 * Container style for isometric boards (e.g. 3-D projection).
 * Delegates to IsometricDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.IsometricStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.board.IsometricStyle
 */

// BoardStyle       -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// IsometricDesign  -> batch 24: src/ludii/ViewController/src/view/container/aspects/designs/board/IsometricDesign.ts
// BoardPlacement   -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge           -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container        -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.IsometricDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IsometricDesign = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * IsometricStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class IsometricStyle extends BoardStyle {
 *     public IsometricStyle(Bridge, Container) {
 *       super(bridge, container);
 *       containerDesign = new IsometricDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.IsometricStyle
 */
export class IsometricStyle {

	/** @java IsometricStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java IsometricStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java IsometricStyle#boardPlacement (inherited via BoardStyle) */
	protected boardPlacement: BoardPlacement | null = null;

	/** @java IsometricStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: IsometricDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java IsometricStyle#IsometricStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle and IsometricDesign are ported,
		// replace this class body with a proper `extends BoardStyle`.
		//
		// containerDesign = new IsometricDesign(this, boardPlacement);
		// (IsometricDesign is in batch 24, BoardPlacement in batch 28)
		this.boardPlacement = null;
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
