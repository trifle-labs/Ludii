// @java ViewController/src/view/container/styles/board/puzzle/SudokuStyle.java

/**
 * Container style for Sudoku puzzle boards.
 * Delegates to SudokuDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.puzzle.SudokuStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.board.puzzle.SudokuStyle
 */

// PuzzleStyle  -> batch 20: src/ludii/ViewController/src/view/container/styles/board/puzzle/PuzzleStyle.ts
// SudokuDesign -> batch 24: src/ludii/ViewController/src/view/container/aspects/designs/board/puzzle/SudokuDesign.ts
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

/** @java view.container.aspects.designs.board.puzzle.SudokuDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SudokuDesign = any;

/**
 * SudokuStyle — minimal faithful shell.
 * Extends PuzzleStyle (escape-hatched until batch 20 is merged).
 *
 * In Java:
 *   public class SudokuStyle extends PuzzleStyle {
 *     public SudokuStyle(Bridge, Container, Context) {
 *       super(bridge, container, context);
 *       final SudokuDesign sudokuDesign = new SudokuDesign(this, boardPlacement);
 *       containerDesign = sudokuDesign;
 *     }
 *   }
 *
 * @java view.container.styles.board.puzzle.SudokuStyle
 */
export class SudokuStyle {

	/** @java SudokuStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java SudokuStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java SudokuStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: SudokuDesign | null = null;

	/** @java SudokuStyle#boardPlacement (inherited via BoardStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected boardPlacement: any = null;

	// -----------------------------------------------------------------------

	/**
	 * @java SudokuStyle#SudokuStyle(Bridge, Container, Context)
	 */
	constructor(bridge: Bridge, container: Container, _context: Context) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: super(bridge, container, context) → PuzzleStyle → BoardStyle →
		// BaseContainerStyle.  When PuzzleStyle and SudokuDesign are ported,
		// replace this class body with a proper `extends PuzzleStyle`.
		//
		// const sudokuDesign = new SudokuDesign(this, boardPlacement);
		// containerDesign = sudokuDesign;
		// (SudokuDesign is in batch 24 — escape-hatched here)
		this.containerDesign = null; // set externally once SudokuDesign is available
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
