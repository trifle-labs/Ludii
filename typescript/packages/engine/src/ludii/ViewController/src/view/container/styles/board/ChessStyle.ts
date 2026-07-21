// @java ViewController/src/view/container/styles/board/ChessStyle.java

/**
 * Container style for Chess-family boards.
 * Extends PuzzleStyle and delegates to ChessDesign.
 *
 * Faithful 1:1 port of view.container.styles.board.ChessStyle.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.styles.board.ChessStyle
 */

// PuzzleStyle -> batch 20: src/ludii/ViewController/src/view/container/styles/board/puzzle/PuzzleStyle.ts
// ChessDesign -> batch 23: src/ludii/ViewController/src/view/container/aspects/designs/board/ChessDesign.ts
// Bridge      -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container   -> game.equipment.container.Container (Core)
// Context     -> other.context.Context (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.aspects.designs.board.ChessDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChessDesign = any;

/**
 * ChessStyle — minimal faithful shell.
 * Extends PuzzleStyle (escape-hatched until batch 20 is merged).
 *
 * In Java:
 *   public class ChessStyle extends PuzzleStyle {
 *     public ChessStyle(Bridge, Container, Context) {
 *       super(bridge, container, context);
 *       containerDesign = new ChessDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.ChessStyle
 */
export class ChessStyle {

	/** @java ChessStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java ChessStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java ChessStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: ChessDesign | null = null;

	/** @java ChessStyle#boardPlacement (inherited via BoardStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected boardPlacement: any = null;

	// -----------------------------------------------------------------------

	/**
	 * @java ChessStyle#ChessStyle(Bridge, Container, Context)
	 */
	constructor(bridge: Bridge, container: Container, _context: Context) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: super(bridge, container, context) → PuzzleStyle → BoardStyle →
		// BaseContainerStyle.  When PuzzleStyle and ChessDesign are ported,
		// replace this class body with a proper `extends PuzzleStyle`.
		//
		// containerDesign = new ChessDesign(this, boardPlacement);
		// (ChessDesign is in batch 23 — escape-hatched here)
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
