// @java ViewController/src/view/container/styles/board/TaflStyle.java

/**
 * Container style for Tafl family boards.
 * Delegates to TaflDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.TaflStyle.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.styles.board.TaflStyle
 */

// BoardStyle   -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// TaflDesign   -> batch 24: src/ludii/ViewController/src/view/container/aspects/designs/board/TaflDesign.ts
// Bridge       -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container    -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.TaflDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TaflDesign = any;

/**
 * TaflStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class TaflStyle extends BoardStyle {
 *     public TaflStyle(Bridge, Container) {
 *       super(bridge, container);
 *       containerDesign = new TaflDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.TaflStyle
 */
export class TaflStyle {

	/** @java TaflStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java TaflStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java TaflStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: TaflDesign | null = null;

	/** @java TaflStyle#boardPlacement (inherited via BoardStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected boardPlacement: any = null;

	// -----------------------------------------------------------------------

	/**
	 * @java TaflStyle#TaflStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle and TaflDesign are ported, replace this class
		// body with a proper `extends BoardStyle`.
		//
		// containerDesign = new TaflDesign(this, boardPlacement);
		// (TaflDesign is in batch 24 — escape-hatched here)
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
