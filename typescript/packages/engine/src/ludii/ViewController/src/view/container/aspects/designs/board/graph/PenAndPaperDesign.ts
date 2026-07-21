// @java ViewController/src/view/container/aspects/designs/board/graph/PenAndPaperDesign.java

/**
 * Design for pen-and-paper style puzzle boards.
 *
 * Extends GraphDesign with no orthogonal or diagonal edges drawn by default,
 * and disables animation in the VC settings.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.graph.PenAndPaperDesign.
 *
 * @author matthew.stephenson and cambolbro (Java original)
 * @java view.container.aspects.designs.board.graph.PenAndPaperDesign
 */

// GraphDesign -> batch 24 (this batch): GraphDesign.ts
// Bridge      -> src/ludii/ViewController/src/bridge/Bridge.ts
// BoardStyle  -> batch 23
// BoardPlacement -> batch 28

import { Bridge } from '../../../../../../bridge/Bridge.js';
import { GraphDesign } from './GraphDesign.js';

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * PenAndPaperDesign — pen-and-paper board rendering (no default edge drawing,
 * animations disabled).
 *
 * Java source:
 *   public class PenAndPaperDesign extends GraphDesign {
 *     public PenAndPaperDesign(Bridge bridge, BoardStyle boardStyle, BoardPlacement boardPlacement) {
 *       super(boardStyle, boardPlacement, false, false);
 *       bridge.settingsVC().setNoAnimation(true);
 *     }
 *   }
 *
 * @java view.container.aspects.designs.board.graph.PenAndPaperDesign
 */
export class PenAndPaperDesign extends GraphDesign {

	/**
	 * @java PenAndPaperDesign#PenAndPaperDesign(bridge.Bridge,
	 *   view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(bridge: Bridge, boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		super(boardStyle, boardPlacement, false, false);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(bridge as any).settingsVC().setNoAnimation(true);
	}

	// -------------------------------------------------------------------------
}
