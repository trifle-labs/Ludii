// @java ViewController/src/view/container/styles/board/GoStyle.java

// GoStyle extends BoardStyle (batch 23), which extends BaseContainerStyle.
// GoDesign is in batch 24. boardPlacement === containerPlacement in BoardStyle.

import {
	BaseContainerStyle,
	type IBridge,
	type IContainerPlacement,
	type IContainerDesign,
} from '../../BaseContainerStyle.js';
import type { Container } from '../../../../../../../ludemes/game/equipment/container/Container.js';

/**
 * Go board style.
 *
 * Faithful 1:1 port of view.container.styles.board.GoStyle.
 *
 * @java view.container.styles.board.GoStyle
 */
export class GoStyle extends BaseContainerStyle {
	/**
	 * @java GoStyle#GoStyle(bridge.Bridge, game.equipment.container.Container)
	 */
	constructor(bridge: IBridge, container: Container) {
		super(bridge, container);

		// Java: containerDesign = new GoDesign(this, boardPlacement);
		// GoDesign is in batch 24. boardPlacement === this.containerPlacement.
		const self = this;
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { GoDesign } = require('../../../../aspects/designs/board/GoDesign.js') as {
				GoDesign: new (s: GoStyle, p: IContainerPlacement) => IContainerDesign;
			};
			self.containerDesign = new GoDesign(self, self.containerPlacement);
		} catch {
			// dep not yet available — default no-op from super()
		}
	}

	// -------------------------------------------------------------------------

	/** @java BoardStyle#setDefaultBoardScale(double) */
	override setDefaultBoardScale(scale: number): void {
		(this.containerPlacement as unknown as { setDefaultBoardScale?(s: number): void }).setDefaultBoardScale?.(scale);
	}
}
