// @java ViewController/src/view/container/aspects/designs/ContainerDesign.java

import type { Graphics2D } from '../../../../../../awt/index.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java bridge.Bridge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

// ---------------------------------------------------------------------------

/**
 * Defines how a container is rendered (board design aspect).
 *
 * Faithful 1:1 port of view.container.aspects.designs.ContainerDesign.
 *
 * @author (Java original — no author tag in source)
 * @java view.container.aspects.designs.ContainerDesign
 */
export class ContainerDesign {

	// -------------------------------------------------------------------------

	/**
	 * Returns the SVG image string for this container design.
	 * Returns null by default; subclasses override.
	 * @java ContainerDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(_bridge: Bridge, _context: Context): string | null {
		return null;
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws puzzle hints onto the graphics context.  No-op by default.
	 * @java ContainerDesign#drawPuzzleHints(java.awt.Graphics2D, other.context.Context)
	 */
	drawPuzzleHints(_g2d: Graphics2D, _context: Context): void {
		// do nothing
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws puzzle candidates onto the graphics context.  No-op by default.
	 * @java ContainerDesign#drawPuzzleCandidates(java.awt.Graphics2D, other.context.Context)
	 */
	drawPuzzleCandidates(_g2d: Graphics2D, _context: Context): void {
		// Do nothing.
	}

	// -------------------------------------------------------------------------

	/**
	 * Whether piece-selection distance limit should be ignored.
	 * Returns false by default; subclasses may override.
	 * @java ContainerDesign#ignorePieceSelectionLimit()
	 */
	ignorePieceSelectionLimit(): boolean {
		return false;
	}

	// -------------------------------------------------------------------------
}
