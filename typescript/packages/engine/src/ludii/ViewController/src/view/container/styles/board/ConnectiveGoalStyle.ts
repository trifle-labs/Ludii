// @java ViewController/src/view/container/styles/board/ConnectiveGoalStyle.java

/**
 * Container style for Connective Goal boards.
 * Delegates to ConnectiveGoalDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.ConnectiveGoalStyle.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.styles.board.ConnectiveGoalStyle
 */

// BoardStyle            -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// ConnectiveGoalDesign  -> batch 23: src/ludii/ViewController/src/view/container/aspects/designs/board/ConnectiveGoalDesign.ts
// Bridge                -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container             -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.ConnectiveGoalDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConnectiveGoalDesign = any;

/**
 * ConnectiveGoalStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class ConnectiveGoalStyle extends BoardStyle {
 *     public ConnectiveGoalStyle(Bridge, Container) {
 *       super(bridge, container);
 *       containerDesign = new ConnectiveGoalDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.ConnectiveGoalStyle
 */
export class ConnectiveGoalStyle {

	/** @java ConnectiveGoalStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java ConnectiveGoalStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java ConnectiveGoalStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: ConnectiveGoalDesign | null = null;

	/** @java ConnectiveGoalStyle#boardPlacement (inherited via BoardStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected boardPlacement: any = null;

	// -----------------------------------------------------------------------

	/**
	 * @java ConnectiveGoalStyle#ConnectiveGoalStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle and ConnectiveGoalDesign are ported, replace this
		// class body with a proper `extends BoardStyle`.
		//
		// containerDesign = new ConnectiveGoalDesign(this, boardPlacement);
		// (ConnectiveGoalDesign is in batch 23 — escape-hatched here)
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
