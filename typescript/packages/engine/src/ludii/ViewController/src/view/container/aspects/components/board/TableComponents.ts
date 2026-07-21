// @java ViewController/src/view/container/aspects/components/board/TableComponents.java

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
 * Table components properties.
 *
 * Faithful 1:1 port of view.container.aspects.components.board.TableComponents.
 *
 * @author Eric.Piette (Java original)
 * @java view.container.aspects.components.board.TableComponents
 */
export class TableComponents extends ContainerComponents {

	// -------------------------------------------------------------------------

	/**
	 * @java TableComponents#TableComponents(bridge.Bridge, view.container.BaseContainerStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BaseContainerStyle) {
		super(bridge, containerStyle);
		this.setPieceScale(1.1);
	}

	// -------------------------------------------------------------------------
}
