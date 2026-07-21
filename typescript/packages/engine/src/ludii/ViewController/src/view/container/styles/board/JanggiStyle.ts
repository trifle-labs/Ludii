// @java ViewController/src/view/container/styles/board/JanggiStyle.java

// JanggiStyle extends BoardStyle (batch 23), which extends BaseContainerStyle.
// JanggiDesign is in batch 25. boardPlacement === containerPlacement in BoardStyle.

import {
	BaseContainerStyle,
	type IBridge,
	type IContainerPlacement,
	type IContainerDesign,
} from '../../BaseContainerStyle.js';
import type { Container } from '../../../../../../../ludemes/game/equipment/container/Container.js';

/**
 * Janggi board style.
 *
 * Faithful 1:1 port of view.container.styles.board.JanggiStyle.
 *
 * @java view.container.styles.board.JanggiStyle
 */
export class JanggiStyle extends BaseContainerStyle {
	/**
	 * @java JanggiStyle#JanggiStyle(bridge.Bridge, game.equipment.container.Container)
	 */
	constructor(bridge: IBridge, container: Container) {
		super(bridge, container);

		// Java: containerDesign = new JanggiDesign(this, boardPlacement);
		// JanggiDesign is in batch 25. boardPlacement === this.containerPlacement.
		const self = this;
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { JanggiDesign } = require('../../../../aspects/designs/board/JanggiDesign.js') as {
				JanggiDesign: new (s: JanggiStyle, p: IContainerPlacement) => IContainerDesign;
			};
			self.containerDesign = new JanggiDesign(self, self.containerPlacement);
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
