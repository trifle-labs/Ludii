// @java ViewController/src/view/container/styles/board/SnakesAndLaddersStyle.java

/**
 * Container style for Snakes and Ladders boards.
 * Delegates to SnakesAndLaddersDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.SnakesAndLaddersStyle.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.styles.board.SnakesAndLaddersStyle
 */

// BoardStyle              -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// SnakesAndLaddersDesign  -> batch 25: src/ludii/ViewController/src/view/container/aspects/designs/board/SnakesAndLaddersDesign.ts
// Bridge                  -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container               -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.SnakesAndLaddersDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SnakesAndLaddersDesign = any;

/**
 * SnakesAndLaddersStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class SnakesAndLaddersStyle extends BoardStyle {
 *     public SnakesAndLaddersStyle(Bridge, Container) {
 *       super(bridge, container);
 *       containerDesign = new SnakesAndLaddersDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.SnakesAndLaddersStyle
 */
export class SnakesAndLaddersStyle {

	/** @java SnakesAndLaddersStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java SnakesAndLaddersStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java SnakesAndLaddersStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: SnakesAndLaddersDesign | null = null;

	/** @java SnakesAndLaddersStyle#boardPlacement (inherited via BoardStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected boardPlacement: any = null;

	// -----------------------------------------------------------------------

	/**
	 * @java SnakesAndLaddersStyle#SnakesAndLaddersStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle and SnakesAndLaddersDesign are ported, replace this
		// class body with a proper `extends BoardStyle`.
		//
		// containerDesign = new SnakesAndLaddersDesign(this, boardPlacement);
		// (SnakesAndLaddersDesign is in batch 25 — escape-hatched here)
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
