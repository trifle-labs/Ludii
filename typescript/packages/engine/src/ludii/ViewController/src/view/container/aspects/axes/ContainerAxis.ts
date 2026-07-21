// @java ViewController/src/view/container/aspects/axes/ContainerAxis.java

import type { Graphics2D } from '../../../../../../awt/index.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java bridge.Bridge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = any;

// ---------------------------------------------------------------------------

/**
 * Container axis properties.
 *
 * Faithful 1:1 port of view.container.aspects.axes.ContainerAxis.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.axes.ContainerAxis
 */
export class ContainerAxis {

	// -------------------------------------------------------------------------

	/**
	 * Draw the axes.  No-op by default; subclasses override.
	 * @java ContainerAxis#drawAxes(bridge.Bridge, java.awt.Graphics2D)
	 */
	drawAxes(_bridge: Bridge, _g2d: Graphics2D): void {
		// No axes by default.
	}

	// -------------------------------------------------------------------------
}
