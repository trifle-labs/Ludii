// @java ViewController/src/view/container/styles/board/LascaStyle.java

/**
 * Container style for Lasca boards.
 * Delegates to LascaDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.LascaStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.board.LascaStyle
 */

// BoardStyle     -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// LascaDesign    -> batch 23: src/ludii/ViewController/src/view/container/aspects/designs/board/LascaDesign.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container      -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.LascaDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LascaDesign = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * LascaStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class LascaStyle extends BoardStyle {
 *     public LascaStyle(Bridge, Container) {
 *       super(bridge, container);
 *       containerDesign = new LascaDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.LascaStyle
 */
export class LascaStyle {

	/** @java LascaStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java LascaStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java LascaStyle#boardPlacement (inherited via BoardStyle) */
	protected boardPlacement: BoardPlacement | null = null;

	/** @java LascaStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: LascaDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java LascaStyle#LascaStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle and LascaDesign are ported,
		// replace this class body with a proper `extends BoardStyle`.
		//
		// containerDesign = new LascaDesign(this, boardPlacement);
		// (LascaDesign is in batch 23, BoardPlacement in batch 28)
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
