// @java ViewController/src/view/container/styles/hand/DiceStyle.java

// DiceStyle extends HandStyle (batch 23), which extends BaseContainerStyle (batch 20).
// Until HandStyle is available, we extend BaseContainerStyle directly as a
// compatible forward-compat shim. The Java HandStyle only adds HandPlacement —
// the constructor logic is preserved faithfully.

import { BaseContainerStyle, type IBridge } from '../../BaseContainerStyle.js';
import type { Container } from '../../../../../../../ludemes/game/equipment/container/Container.js';

/**
 * Dice hand container style.
 *
 * Faithful 1:1 port of view.container.styles.hand.DiceStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.hand.DiceStyle
 */
export class DiceStyle extends BaseContainerStyle {
	/**
	 * @java DiceStyle#DiceStyle(bridge.Bridge, game.equipment.container.Container)
	 */
	constructor(bridge: IBridge, container: Container) {
		super(bridge, container);
		// HandStyle sets containerPlacement = new HandPlacement(bridge, this)
		// HandPlacement (batch 27) will override containerPlacement when available.
		// DiceStyle itself adds no further customisation beyond HandStyle.
	}

	// -------------------------------------------------------------------------

	/** @java HandStyle#setDefaultBoardScale — no-op for hand containers */
	override setDefaultBoardScale(_scale: number): void {
		// do nothing
	}
}
