// @java ViewController/src/view/container/styles/board/MancalaStyle.java

/**
 * Basic style for generic Mancala boards.
 * Sets up MancalaDesign and MancalaComponents.
 *
 * Faithful 1:1 port of view.container.styles.board.MancalaStyle.
 *
 * @author cambolbro (Java original)
 * @java view.container.styles.board.MancalaStyle
 */

// BoardStyle         -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// MancalaDesign      -> batch 25: src/ludii/ViewController/src/view/container/aspects/designs/board/MancalaDesign.ts
// MancalaComponents  -> batch 26: src/ludii/ViewController/src/view/container/aspects/components/board/MancalaComponents.ts
// Bridge             -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container          -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.MancalaDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MancalaDesign = any;

/** @java view.container.aspects.components.board.MancalaComponents */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MancalaComponents = any;

/**
 * MancalaStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class MancalaStyle extends BoardStyle {
 *     public MancalaStyle(Bridge, Container) {
 *       super(bridge, container);
 *       containerDesign = new MancalaDesign(this);
 *       containerComponents = new MancalaComponents(bridge, this);
 *     }
 *   }
 *
 * @java view.container.styles.board.MancalaStyle
 */
export class MancalaStyle {

	/** @java MancalaStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java MancalaStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java MancalaStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: MancalaDesign | null = null;

	/** @java MancalaStyle#containerComponents (inherited via BaseContainerStyle) */
	protected containerComponents: MancalaComponents | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java MancalaStyle#MancalaStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle, MancalaDesign, and MancalaComponents are ported,
		// replace this class body with a proper `extends BoardStyle`.
		//
		// containerDesign = new MancalaDesign(this);
		// containerComponents = new MancalaComponents(bridge, this);
		// (MancalaDesign is in batch 25, MancalaComponents in batch 26)
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
