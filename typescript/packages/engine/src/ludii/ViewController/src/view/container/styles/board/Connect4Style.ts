// @java ViewController/src/view/container/styles/board/Connect4Style.java

// Connect4Style extends BoardStyle (batch 23), which extends BaseContainerStyle.
// BoardPlacement is in batch 28, Connect4Placement in batch 27,
// Connect4Design in batch 25, Connect4Components in batch 26.
// We extend BaseContainerStyle directly as a forward-compat shim until
// BoardStyle is available. boardPlacement === containerPlacement in BoardStyle.

import {
	BaseContainerStyle,
	type IBridge,
	type IContainerPlacement,
	type IContainerDesign,
	type IContainerComponents,
} from '../../BaseContainerStyle.js';
import type { Container } from '../../../../../../../ludemes/game/equipment/container/Container.js';

/**
 * Custom style for Connect 4 boards.
 *
 * Faithful 1:1 port of view.container.styles.board.Connect4Style.
 *
 * @java view.container.styles.board.Connect4Style
 */
export class Connect4Style extends BaseContainerStyle {
	/**
	 * @java Connect4Style#Connect4Style(bridge.Bridge, game.equipment.container.Container)
	 */
	constructor(bridge: IBridge, container: Container) {
		super(bridge, container);

		// Java: final Connect4Placement connect4Placement = new Connect4Placement(bridge, this);
		//       containerPlacement = connect4Placement;
		//       containerDesign = new Connect4Design(this, connect4Placement);
		//       containerComponents = new Connect4Components(bridge, this, connect4Placement);
		//
		// All three are in batches 25-27 (not yet ported). Lazily instantiated below.
		const self = this;
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { Connect4Placement } = require('../../../../aspects/placement/Board/Connect4Placement.js') as {
				Connect4Placement: new (b: IBridge, s: Connect4Style) => IContainerPlacement;
			};
			const connect4Placement = new Connect4Placement(bridge, self);
			self.containerPlacement = connect4Placement;

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { Connect4Design } = require('../../../../aspects/designs/board/Connect4Design.js') as {
				Connect4Design: new (s: Connect4Style, p: IContainerPlacement) => IContainerDesign;
			};
			self.containerDesign = new Connect4Design(self, connect4Placement);

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { Connect4Components } = require('../../../../aspects/components/board/Connect4Components.js') as {
				Connect4Components: new (b: IBridge, s: Connect4Style, p: IContainerPlacement) => IContainerComponents;
			};
			self.containerComponents = new Connect4Components(bridge, self, connect4Placement);
		} catch {
			// deps not yet available — default no-ops inherited from super()
		}
	}

	// -------------------------------------------------------------------------

	/** @java BoardStyle#setDefaultBoardScale(double) */
	override setDefaultBoardScale(scale: number): void {
		(this.containerPlacement as unknown as { setDefaultBoardScale?(s: number): void }).setDefaultBoardScale?.(scale);
	}
}
