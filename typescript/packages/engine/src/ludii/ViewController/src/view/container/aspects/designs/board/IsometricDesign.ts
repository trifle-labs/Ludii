// @java ViewController/src/view/container/aspects/designs/board/IsometricDesign.java

/**
 * Design for isometric board rendering.
 * IsometricDesign extends BoardDesign and has no additional behaviour of its own —
 * it simply delegates all rendering to the BoardDesign base class.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.IsometricDesign.
 *
 * @author matthew.stephenson and cambolbro (Java original)
 * @java view.container.aspects.designs.board.IsometricDesign
 */

// BoardDesign   -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardStyle    -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts

/** @java view.container.aspects.designs.BoardDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardDesign = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * IsometricDesign — extends BoardDesign with no additional rendering logic.
 *
 * Java source:
 *   public class IsometricDesign extends BoardDesign {
 *     public IsometricDesign(BoardStyle boardStyle, BoardPlacement boardPlacement) {
 *       super(boardStyle, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.aspects.designs.board.IsometricDesign
 */
export class IsometricDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// -------------------------------------------------------------------------

	/**
	 * @java IsometricDesign#IsometricDesign(view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -------------------------------------------------------------------------
}
