// @java ViewController/src/view/container/styles/board/SpiralStyle.java

/**
 * Spiral board style that draws cells based on centroid position, e.g. for Mehen.
 * Delegates to SpiralDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.SpiralStyle.
 *
 * @author cambolbro (Java original)
 * @java view.container.styles.board.SpiralStyle
 */

// BoardStyle   -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// SpiralDesign -> batch 25: src/ludii/ViewController/src/view/container/aspects/designs/board/SpiralDesign.ts
// Bridge       -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container    -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.SpiralDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpiralDesign = any;

/**
 * SpiralStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class SpiralStyle extends BoardStyle {
 *     public SpiralStyle(Bridge, Container) {
 *       super(bridge, container);
 *       containerDesign = new SpiralDesign(this);
 *     }
 *   }
 *
 * Note: SpiralDesign takes only the BoardStyle (no placement),
 * passing null for boardPlacement to its super call.
 *
 * @java view.container.styles.board.SpiralStyle
 */
export class SpiralStyle {

	/** @java SpiralStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java SpiralStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java SpiralStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: SpiralDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java SpiralStyle#SpiralStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle and SpiralDesign are ported, replace this class
		// body with a proper `extends BoardStyle`.
		//
		// containerDesign = new SpiralDesign(this);
		// (SpiralDesign is in batch 25 — escape-hatched here)
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
