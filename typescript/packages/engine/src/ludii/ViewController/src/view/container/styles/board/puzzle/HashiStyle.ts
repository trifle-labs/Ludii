// @java ViewController/src/view/container/styles/board/puzzle/HashiStyle.java

/**
 * Container style for Hashi (Bridges) puzzle boards.
 * Delegates to HashiDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.puzzle.HashiStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.board.puzzle.HashiStyle
 */

// PuzzleStyle -> batch 20: src/ludii/ViewController/src/view/container/styles/board/puzzle/PuzzleStyle.ts
// HashiDesign -> batch 24: src/ludii/ViewController/src/view/container/aspects/designs/board/puzzle/HashiDesign.ts
// Bridge      -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container   -> game.equipment.container.Container (Core)
// Context     -> other.context.Context (Core)

import { Bridge } from '../../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.board.puzzle.PuzzleStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PuzzleStyle = any;

/** @java view.container.aspects.designs.board.puzzle.HashiDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HashiDesign = any;

// PuzzleStyle constructor escape hatch — real PuzzleStyle is in batch 20.
// When that file is available, replace with:
//   import { PuzzleStyle } from './PuzzleStyle.js';
//   import { HashiDesign } from '../../../aspects/designs/board/puzzle/HashiDesign.js';
//   export class HashiStyle extends PuzzleStyle { ... }

/**
 * HashiStyle — minimal faithful shell.
 * Extends PuzzleStyle (escape-hatched until batch 20 is merged).
 *
 * In Java:
 *   public class HashiStyle extends PuzzleStyle {
 *     public HashiStyle(Bridge, Container, Context) {
 *       super(bridge, container, context);
 *       containerDesign = new HashiDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.puzzle.HashiStyle
 */
export class HashiStyle {

	/** @java HashiStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java HashiStyle#container (inherited via BaseContainerStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected readonly _container: Container;

	/** @java HashiStyle#containerDesign (inherited via BaseContainerStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected containerDesign: HashiDesign | null = null;

	/** @java HashiStyle#boardPlacement (inherited via BoardStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected boardPlacement: any = null;

	// -----------------------------------------------------------------------

	/**
	 * @java HashiStyle#HashiStyle(Bridge, Container, Context)
	 */
	constructor(bridge: Bridge, container: Container, _context: Context) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: super(bridge, container, context) → PuzzleStyle → BoardStyle →
		// BaseContainerStyle.  When PuzzleStyle and HashiDesign are ported,
		// replace this class body with a proper `extends PuzzleStyle`.
		//
		// containerDesign = new HashiDesign(this, boardPlacement);
		// (HashiDesign is in batch 24 — escape-hatched here)
		this.containerDesign = null; // set externally once HashiDesign is available
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}

/** @java view.container.styles.board.puzzle.HashiStyle */
export type { HashiStyle as IHashiStyle };
