// @java ViewController/src/view/container/styles/board/BoardlessStyle.java

/**
 * Container style for boardless games (pieces placed freely on the canvas).
 * Uses a BoardlessPlacement and delegates to BoardlessDesign.
 *
 * Faithful 1:1 port of view.container.styles.board.BoardlessStyle.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.styles.board.BoardlessStyle
 */

// BoardStyle          -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardlessDesign     -> batch 25: src/ludii/ViewController/src/view/container/aspects/designs/board/BoardlessDesign.ts
// BoardlessPlacement  -> batch 27: src/ludii/ViewController/src/view/container/aspects/placement/Board/BoardlessPlacement.ts
// Bridge              -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container           -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.BoardlessDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardlessDesign = any;

/** @java view.container.aspects.placement.Board.BoardlessPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardlessPlacement = any;

/**
 * BoardlessStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class BoardlessStyle extends BoardStyle {
 *     public BoardlessStyle(Bridge, Container) {
 *       super(bridge, container);
 *       final BoardlessPlacement boardlessPlacement =
 *           new BoardlessPlacement(bridge, this);
 *       containerPlacement = boardlessPlacement;
 *       containerDesign = new BoardlessDesign(this, boardlessPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.BoardlessStyle
 */
export class BoardlessStyle {

	/** @java BoardlessStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java BoardlessStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java BoardlessStyle#containerPlacement (inherited via BaseContainerStyle) */
	protected containerPlacement: BoardlessPlacement | null = null;

	/** @java BoardlessStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: BoardlessDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java BoardlessStyle#BoardlessStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle, BoardlessPlacement, and BoardlessDesign are ported,
		// replace this class body with a proper `extends BoardStyle`.
		//
		// const boardlessPlacement = new BoardlessPlacement(bridge, this);
		// containerPlacement = boardlessPlacement;
		// containerDesign = new BoardlessDesign(this, boardlessPlacement);
		// (BoardlessPlacement is in batch 27, BoardlessDesign in batch 25)
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
