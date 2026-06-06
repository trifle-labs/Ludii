// @java ViewController/src/view/container/aspects/components/board/BackgammonComponents.java

import { ContainerComponents } from '../ContainerComponents.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java bridge.Bridge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = any;

/** @java view.container.BaseContainerStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseContainerStyle = any;

// ---------------------------------------------------------------------------

/**
 * Backgammon components properties.
 *
 * Faithful 1:1 port of view.container.aspects.components.board.BackgammonComponents.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.components.board.BackgammonComponents
 */
export class BackgammonComponents extends ContainerComponents {

	// -------------------------------------------------------------------------

	/**
	 * @java BackgammonComponents#BackgammonComponents(bridge.Bridge, view.container.BaseContainerStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BaseContainerStyle) {
		super(bridge, containerStyle);
		this.setPieceScale(1.1);
	}

	// -------------------------------------------------------------------------
}
