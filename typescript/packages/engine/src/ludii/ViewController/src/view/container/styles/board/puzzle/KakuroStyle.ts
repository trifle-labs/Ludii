// @java ViewController/src/view/container/styles/board/puzzle/KakuroStyle.java

/**
 * Container style for Kakuro puzzle boards.
 * Delegates to KakuroDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.puzzle.KakuroStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.board.puzzle.KakuroStyle
 */

// PuzzleStyle  -> batch 20: src/ludii/ViewController/src/view/container/styles/board/puzzle/PuzzleStyle.ts
// KakuroDesign -> batch 24: src/ludii/ViewController/src/view/container/aspects/designs/board/puzzle/KakuroDesign.ts
// Bridge       -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container    -> game.equipment.container.Container (Core)
// Context      -> other.context.Context (Core)

import { Bridge } from '../../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.aspects.designs.board.puzzle.KakuroDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KakuroDesign = any;

/**
 * KakuroStyle — minimal faithful shell.
 * Extends PuzzleStyle (escape-hatched until batch 20 is merged).
 *
 * In Java:
 *   public class KakuroStyle extends PuzzleStyle {
 *     public KakuroStyle(Bridge, Container, Context) {
 *       super(bridge, container, context);
 *       containerDesign = new KakuroDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.puzzle.KakuroStyle
 */
export class KakuroStyle {

	/** @java KakuroStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java KakuroStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java KakuroStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: KakuroDesign | null = null;

	/** @java KakuroStyle#boardPlacement (inherited via BoardStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected boardPlacement: any = null;

	// -----------------------------------------------------------------------

	/**
	 * @java KakuroStyle#KakuroStyle(Bridge, Container, Context)
	 */
	constructor(bridge: Bridge, container: Container, _context: Context) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: super(bridge, container, context) → PuzzleStyle → BoardStyle →
		// BaseContainerStyle.  When PuzzleStyle and KakuroDesign are ported,
		// replace this class body with a proper `extends PuzzleStyle`.
		//
		// containerDesign = new KakuroDesign(this, boardPlacement);
		// (KakuroDesign is in batch 24 — escape-hatched here)
		this.containerDesign = null; // set externally once KakuroDesign is available
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
