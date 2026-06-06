// @java ViewController/src/view/container/styles/HandStyle.java

/**
 * Implementation of hand container style.
 *
 * Faithful 1:1 port of view.container.styles.HandStyle.
 *
 * @author matthew.stephenson (Java original)
 * @java view.container.styles.HandStyle
 */

// BaseContainerStyle -> src/ludii/ViewController/src/view/container/BaseContainerStyle.ts
// HandPlacement      -> batch 27: src/ludii/ViewController/src/view/container/aspects/placement/HandPlacement.ts
// Bridge             -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container          -> game.equipment.container.Container (Core)

import { Bridge } from '../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.placement.HandPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandPlacement = any;

/**
 * HandStyle — hand container style (for player hands / captured pieces).
 *
 * Java source:
 *   public class HandStyle extends BaseContainerStyle {
 *     public HandStyle(Bridge bridge, Container container) {
 *       super(bridge, container);
 *       containerPlacement = new HandPlacement(bridge, this);
 *     }
 *
 *     @Override
 *     public void setDefaultBoardScale(double scale) {
 *       // do nothing
 *     }
 *   }
 *
 * @java view.container.styles.HandStyle
 */
export class HandStyle {

	/** @java HandStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java HandStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java HandStyle#containerPlacement (inherited via BaseContainerStyle) */
	protected containerPlacement: HandPlacement | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java HandStyle#HandStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BaseContainerStyle and HandPlacement are ported, replace
		// this class body with a proper `extends BaseContainerStyle`.
		//
		// containerPlacement = new HandPlacement(bridge, this);
		// (HandPlacement is in batch 27)
		this.containerPlacement = null;
	}

	// -----------------------------------------------------------------------

	/**
	 * No-op: hand containers do not have a board scale.
	 * @java HandStyle#setDefaultBoardScale(double)
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	setDefaultBoardScale(_scale: number): void {
		// do nothing
	}

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
