// @java ViewController/src/view/container/styles/hand/DeckStyle.java

// DeckStyle extends HandStyle (batch 23), which extends BaseContainerStyle (batch 20).
// Until HandStyle is available, we extend BaseContainerStyle directly as a
// compatible forward-compat shim.

import { BaseContainerStyle, type IBridge } from '../../BaseContainerStyle.js';
import type { Container } from '../../../../../../../ludemes/game/equipment/container/Container.js';

/**
 * Deck hand container style.
 *
 * Faithful 1:1 port of view.container.styles.hand.DeckStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.hand.DeckStyle
 */
export class DeckStyle extends BaseContainerStyle {
	/**
	 * @java DeckStyle#DeckStyle(bridge.Bridge, game.equipment.container.Container)
	 */
	constructor(bridge: IBridge, container: Container) {
		super(bridge, container);
		// HandStyle sets containerPlacement = new HandPlacement(bridge, this)
		// DeckStyle itself adds no further customisation beyond HandStyle.
	}

	// -------------------------------------------------------------------------

	/** @java HandStyle#setDefaultBoardScale — no-op for hand containers */
	override setDefaultBoardScale(_scale: number): void {
		// do nothing
	}
}
