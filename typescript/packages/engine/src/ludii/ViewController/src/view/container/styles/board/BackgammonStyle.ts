// @java ViewController/src/view/container/styles/board/BackgammonStyle.java

/**
 * Custom style for Backgammon boards.
 * Uses a BackgammonPlacement, BackgammonDesign, and BackgammonComponents.
 *
 * Faithful 1:1 port of view.container.styles.board.BackgammonStyle.
 *
 * @author cambolbro (Java original)
 * @java view.container.styles.board.BackgammonStyle
 */

// BoardStyle             -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BackgammonDesign       -> batch 23: src/ludii/ViewController/src/view/container/aspects/designs/board/BackgammonDesign.ts
// BackgammonPlacement    -> batch 27: src/ludii/ViewController/src/view/container/aspects/placement/Board/BackgammonPlacement.ts
// BackgammonComponents   -> batch 26: src/ludii/ViewController/src/view/container/aspects/components/board/BackgammonComponents.ts
// Bridge                 -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container              -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.BackgammonDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BackgammonDesign = any;

/** @java view.container.aspects.placement.Board.BackgammonPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BackgammonPlacement = any;

/** @java view.container.aspects.components.board.BackgammonComponents */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BackgammonComponents = any;

/**
 * BackgammonStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class BackgammonStyle extends BoardStyle {
 *     public BackgammonStyle(Bridge, Container) {
 *       super(bridge, container);
 *       final BackgammonPlacement backgammonPlacement =
 *           new BackgammonPlacement(bridge, this);
 *       containerPlacement = backgammonPlacement;
 *       containerDesign = new BackgammonDesign(this, backgammonPlacement);
 *       containerComponents = new BackgammonComponents(bridge, this);
 *     }
 *   }
 *
 * @java view.container.styles.board.BackgammonStyle
 */
export class BackgammonStyle {

	/** @java BackgammonStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java BackgammonStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java BackgammonStyle#containerPlacement (inherited via BaseContainerStyle) */
	protected containerPlacement: BackgammonPlacement | null = null;

	/** @java BackgammonStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: BackgammonDesign | null = null;

	/** @java BackgammonStyle#containerComponents (inherited via BaseContainerStyle) */
	protected containerComponents: BackgammonComponents | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java BackgammonStyle#BackgammonStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle, BackgammonPlacement, BackgammonDesign, and
		// BackgammonComponents are ported, replace this class body with a proper
		// `extends BoardStyle`.
		//
		// const backgammonPlacement = new BackgammonPlacement(bridge, this);
		// containerPlacement = backgammonPlacement;
		// containerDesign = new BackgammonDesign(this, backgammonPlacement);
		// containerComponents = new BackgammonComponents(bridge, this);
		// (BackgammonPlacement is in batch 27, BackgammonDesign in batch 23,
		//  BackgammonComponents in batch 26)
		this.containerPlacement = null;
		this.containerDesign = null;
		this.containerComponents = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
