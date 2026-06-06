// @java ViewController/src/view/container/styles/board/UltimateTicTacToeStyle.java

/**
 * Graphic style for Ultimate Tic-Tac-Toe boards.
 * (Java comment says "Surakarta boards" — that is a copy-paste error in the Java source.)
 *
 * Faithful 1:1 port of view.container.styles.board.UltimateTicTacToeStyle.
 *
 * @author cambolbro (Java original)
 * @java view.container.styles.board.UltimateTicTacToeStyle
 */

// BoardStyle                -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// UltimateTicTacToeDesign   -> batch 25: src/ludii/ViewController/src/view/container/aspects/designs/board/UltimateTicTacToeDesign.ts
// BoardPlacement            -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge                    -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container                 -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.UltimateTicTacToeDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UltimateTicTacToeDesign = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * UltimateTicTacToeStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 BoardStyle is merged).
 *
 * Java source:
 *   public class UltimateTicTacToeStyle extends BoardStyle {
 *     public UltimateTicTacToeStyle(Bridge bridge, Container container) {
 *       super(bridge, container);
 *       containerDesign = new UltimateTicTacToeDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.UltimateTicTacToeStyle
 */
export class UltimateTicTacToeStyle {

	/** @java UltimateTicTacToeStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java UltimateTicTacToeStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java UltimateTicTacToeStyle#boardPlacement (inherited via BoardStyle) */
	protected boardPlacement: BoardPlacement | null = null;

	/** @java UltimateTicTacToeStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: UltimateTicTacToeDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java UltimateTicTacToeStyle#UltimateTicTacToeStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle and UltimateTicTacToeDesign are ported,
		// replace this class body with:
		//   super(bridge, container);
		//   this.containerDesign = new UltimateTicTacToeDesign(this, this.boardPlacement);
		//
		// (UltimateTicTacToeDesign is in batch 25, BoardStyle in batch 23)
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
