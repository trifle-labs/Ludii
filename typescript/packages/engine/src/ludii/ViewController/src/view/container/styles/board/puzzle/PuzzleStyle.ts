// @java ViewController/src/view/container/styles/board/puzzle/PuzzleStyle.java

// PuzzleStyle extends BoardStyle (batch 23), which extends BaseContainerStyle.
// PuzzleDesign is in batch 23. PuzzleComponents is in batch 26.
// boardPlacement === containerPlacement in BoardStyle.

import {
	BaseContainerStyle,
	type IBridge,
	type IContainerPlacement,
	type IContainerDesign,
	type IContainerComponents,
} from '../../../BaseContainerStyle.js';
import type { Container } from '../../../../../../../../ludemes/game/equipment/container/Container.js';

/**
 * Puzzle board style.
 *
 * Faithful 1:1 port of view.container.styles.board.puzzle.PuzzleStyle.
 *
 * @java view.container.styles.board.puzzle.PuzzleStyle
 */
export class PuzzleStyle extends BaseContainerStyle {
	/**
	 * @java PuzzleStyle#PuzzleStyle(bridge.Bridge, game.equipment.container.Container, other.context.Context)
	 */
	constructor(bridge: IBridge, container: Container, context: unknown) {
		super(bridge, container);

		// Java:
		//   final PuzzleDesign puzzleDesign = new PuzzleDesign(this, boardPlacement);
		//   containerDesign = puzzleDesign;
		//   if (context.game().isDeductionPuzzle())
		//       containerComponents = new PuzzleComponents(bridge, this, puzzleDesign);
		//
		// Deps in batches 23 and 26 (not yet ported). Lazily instantiated below.
		const self = this;
		let puzzleDesign: IContainerDesign | null = null;
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { PuzzleDesign } = require('../../../aspects/designs/board/puzzle/PuzzleDesign.js') as {
				PuzzleDesign: new (s: PuzzleStyle, p: IContainerPlacement) => IContainerDesign;
			};
			puzzleDesign = new PuzzleDesign(self, self.containerPlacement);
			self.containerDesign = puzzleDesign;
		} catch {
			// dep not yet available
		}

		if (puzzleDesign !== null) {
			try {
				const ctx = context as unknown as { game(): { isDeductionPuzzle(): boolean } };
				if (ctx?.game?.()?.isDeductionPuzzle?.()) {
					// eslint-disable-next-line @typescript-eslint/no-var-requires
					const { PuzzleComponents } = require('../../../aspects/components/board/PuzzleComponents.js') as {
						PuzzleComponents: new (b: IBridge, s: PuzzleStyle, d: IContainerDesign) => IContainerComponents;
					};
					self.containerComponents = new PuzzleComponents(bridge, self, puzzleDesign);
				}
			} catch {
				// dep not yet available
			}
		}
	}

	// -------------------------------------------------------------------------

	/** @java BoardStyle#setDefaultBoardScale(double) */
	override setDefaultBoardScale(scale: number): void {
		(this.containerPlacement as unknown as { setDefaultBoardScale?(s: number): void }).setDefaultBoardScale?.(scale);
	}
}
