// @java ViewController/src/view/container/styles/board/HoundsAndJackalsStyle.java

/**
 * Hounds and Jackals (i.e. 58 Holes) board style.
 * Uses a HoundsAndJackalsPlacement and delegates to HoundsAndJackalsDesign.
 *
 * Faithful 1:1 port of view.container.styles.board.HoundsAndJackalsStyle.
 *
 * @author cambolbro (Java original)
 * @java view.container.styles.board.HoundsAndJackalsStyle
 */

// BoardStyle                  -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// HoundsAndJackalsDesign      -> batch 25: src/ludii/ViewController/src/view/container/aspects/designs/board/HoundsAndJackalsDesign.ts
// HoundsAndJackalsPlacement   -> batch 27: src/ludii/ViewController/src/view/container/aspects/placement/Board/HoundsAndJackalsPlacement.ts
// Bridge                      -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container                   -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.HoundsAndJackalsDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HoundsAndJackalsDesign = any;

/** @java view.container.aspects.placement.Board.HoundsAndJackalsPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HoundsAndJackalsPlacement = any;

/**
 * HoundsAndJackalsStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class HoundsAndJackalsStyle extends BoardStyle {
 *     public HoundsAndJackalsStyle(Bridge, Container) {
 *       super(bridge, container);
 *       final HoundsAndJackalsPlacement houndsAndJackalsPlacement =
 *           new HoundsAndJackalsPlacement(bridge, this);
 *       containerPlacement = houndsAndJackalsPlacement;
 *       containerDesign = new HoundsAndJackalsDesign(this, houndsAndJackalsPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.HoundsAndJackalsStyle
 */
export class HoundsAndJackalsStyle {

	/** @java HoundsAndJackalsStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java HoundsAndJackalsStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java HoundsAndJackalsStyle#containerPlacement (inherited via BaseContainerStyle) */
	protected containerPlacement: HoundsAndJackalsPlacement | null = null;

	/** @java HoundsAndJackalsStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: HoundsAndJackalsDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java HoundsAndJackalsStyle#HoundsAndJackalsStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle, HoundsAndJackalsPlacement, and HoundsAndJackalsDesign
		// are ported, replace this class body with a proper `extends BoardStyle`.
		//
		// const houndsAndJackalsPlacement = new HoundsAndJackalsPlacement(bridge, this);
		// containerPlacement = houndsAndJackalsPlacement;
		// containerDesign = new HoundsAndJackalsDesign(this, houndsAndJackalsPlacement);
		this.containerPlacement = null;
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
