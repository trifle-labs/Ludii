// @java ViewController/src/view/container/styles/board/SurakartaStyle.java

/**
 * Graphic style for Surakarta boards.
 * Uses a SurakartaPlacement and delegates to SurakartaDesign.
 *
 * Faithful 1:1 port of view.container.styles.board.SurakartaStyle.
 *
 * @author cambolbro (Java original)
 * @java view.container.styles.board.SurakartaStyle
 */

// BoardStyle          -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// SurakartaDesign     -> batch 24: src/ludii/ViewController/src/view/container/aspects/designs/board/SurakartaDesign.ts
// SurakartaPlacement  -> batch 27: src/ludii/ViewController/src/view/container/aspects/placement/Board/SurakartaPlacement.ts
// Bridge              -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container           -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.SurakartaDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SurakartaDesign = any;

/** @java view.container.aspects.placement.Board.SurakartaPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SurakartaPlacement = any;

/**
 * SurakartaStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class SurakartaStyle extends BoardStyle {
 *     public SurakartaStyle(Bridge, Container) {
 *       super(bridge, container);
 *       final SurakartaPlacement surakartaPlacement =
 *           new SurakartaPlacement(bridge, this);
 *       containerPlacement = surakartaPlacement;
 *       containerDesign = new SurakartaDesign(this, surakartaPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.SurakartaStyle
 */
export class SurakartaStyle {

	/** @java SurakartaStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java SurakartaStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java SurakartaStyle#containerPlacement (inherited via BaseContainerStyle) */
	protected containerPlacement: SurakartaPlacement | null = null;

	/** @java SurakartaStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: SurakartaDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java SurakartaStyle#SurakartaStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle, SurakartaPlacement, and SurakartaDesign are ported,
		// replace this class body with a proper `extends BoardStyle`.
		//
		// const surakartaPlacement = new SurakartaPlacement(bridge, this);
		// containerPlacement = surakartaPlacement;
		// containerDesign = new SurakartaDesign(this, surakartaPlacement);
		// (SurakartaPlacement is in batch 27, SurakartaDesign in batch 24)
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
