// @java ViewController/src/view/container/styles/board/puzzle/FutoshikiStyle.java

// FutoshikiStyle extends GraphStyle (batch 21), which extends PuzzleStyle (batch 20).
// FutoshikiDesign is in batch 24.
// Until GraphStyle is available, we extend PuzzleStyle directly as a forward-compat shim.
// GraphStyle only adds colour/radius fields and overrides containerDesign with GraphDesign.
// FutoshikiStyle replaces containerDesign with FutoshikiDesign.

import { PuzzleStyle } from './PuzzleStyle.js';
import type { IBridge, IContainerPlacement, IContainerDesign } from '../../../BaseContainerStyle.js';
import type { Container } from '../../../../../../../../ludemes/game/equipment/container/Container.js';

/**
 * Futoshiki board style.
 *
 * Faithful 1:1 port of view.container.styles.board.puzzle.FutoshikiStyle.
 *
 * @java view.container.styles.board.puzzle.FutoshikiStyle
 */
export class FutoshikiStyle extends PuzzleStyle {

	/** @java GraphStyle#baseGraphColour — forwarded from intermediate GraphStyle */
	protected readonly baseGraphColour = { r: 200, g: 200, b: 200 };

	/** @java GraphStyle#baseVertexRadius */
	protected baseVertexRadius = 6;

	/** @java GraphStyle#baseLineWidth */
	protected baseLineWidth = 0.5 * 6; // 0.5 * baseVertexRadius initial value

	// -------------------------------------------------------------------------

	/**
	 * @java FutoshikiStyle#FutoshikiStyle(bridge.Bridge, game.equipment.container.Container, other.context.Context)
	 */
	constructor(bridge: IBridge, container: Container, context: unknown) {
		super(bridge, container, context);

		// Java: containerDesign = new FutoshikiDesign(this, boardPlacement);
		// FutoshikiDesign is in batch 24. boardPlacement === this.containerPlacement.
		const self = this;
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { FutoshikiDesign } = require('../../../aspects/designs/board/puzzle/FutoshikiDesign.js') as {
				FutoshikiDesign: new (s: FutoshikiStyle, p: IContainerPlacement) => IContainerDesign;
			};
			self.containerDesign = new FutoshikiDesign(self, self.containerPlacement);
		} catch {
			// dep not yet available — PuzzleStyle default containerDesign applies
		}
	}

	// -------------------------------------------------------------------------

	/** @java GraphStyle#baseGraphColour() */
	getBaseGraphColour(): { r: number; g: number; b: number } {
		return this.baseGraphColour;
	}

	/** @java GraphStyle#baseVertexRadius() */
	getBaseVertexRadius(): number {
		return this.baseVertexRadius;
	}

	/** @java GraphStyle#setBaseVertexRadius(double) */
	setBaseVertexRadius(vr: number): void {
		this.baseVertexRadius = vr;
	}

	/** @java GraphStyle#baseLineWidth() */
	getBaseLineWidth(): number {
		return this.baseLineWidth;
	}

	/** @java GraphStyle#setBaseLineWidth(double) */
	setBaseLineWidth(lw: number): void {
		this.baseLineWidth = lw;
	}
}
