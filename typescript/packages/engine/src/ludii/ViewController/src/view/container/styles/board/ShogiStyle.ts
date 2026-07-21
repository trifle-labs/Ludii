// @java ViewController/src/view/container/styles/board/ShogiStyle.java

/**
 * Container style for Shogi boards.
 * Delegates to ShogiDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.ShogiStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.board.ShogiStyle
 */

// BoardStyle     -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// ShogiDesign    -> batch 25: src/ludii/ViewController/src/view/container/aspects/designs/board/ShogiDesign.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container      -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.ShogiDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShogiDesign = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * ShogiStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class ShogiStyle extends BoardStyle {
 *     public ShogiStyle(Bridge, Container) {
 *       super(bridge, container);
 *       containerDesign = new ShogiDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.ShogiStyle
 */
export class ShogiStyle {

	/** @java ShogiStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java ShogiStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java ShogiStyle#boardPlacement (inherited via BoardStyle) */
	protected boardPlacement: BoardPlacement | null = null;

	/** @java ShogiStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: ShogiDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java ShogiStyle#ShogiStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle and ShogiDesign are ported,
		// replace this class body with a proper `extends BoardStyle`.
		//
		// containerDesign = new ShogiDesign(this, boardPlacement);
		// (ShogiDesign is in batch 25, BoardPlacement in batch 28)
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
