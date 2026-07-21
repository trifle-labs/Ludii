// @java ViewController/src/view/container/styles/board/ShibumiStyle.java

/**
 * Container style for Shibumi (pyramidal/3-D stacking) boards.
 * Uses a PyramidalPlacement and delegates to ShibumiDesign.
 *
 * Faithful 1:1 port of view.container.styles.board.ShibumiStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.board.ShibumiStyle
 */

// BoardStyle           -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// ShibumiDesign        -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/board/ShibumiDesign.ts
// PyramidalPlacement   -> batch 27: src/ludii/ViewController/src/view/container/aspects/placement/Board/PyramidalPlacement.ts
// Bridge               -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container            -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.ShibumiDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShibumiDesign = any;

/** @java view.container.aspects.placement.Board.PyramidalPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PyramidalPlacement = any;

/**
 * ShibumiStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class ShibumiStyle extends BoardStyle {
 *     public ShibumiStyle(Bridge, Container) {
 *       super(bridge, container);
 *       final PyramidalPlacement pyramidalPlacement =
 *           new PyramidalPlacement(bridge, this);
 *       containerPlacement = pyramidalPlacement;
 *       containerDesign = new ShibumiDesign(this, pyramidalPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.ShibumiStyle
 */
export class ShibumiStyle {

	/** @java ShibumiStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java ShibumiStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java ShibumiStyle#containerPlacement (inherited via BaseContainerStyle) */
	protected containerPlacement: PyramidalPlacement | null = null;

	/** @java ShibumiStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: ShibumiDesign | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java ShibumiStyle#ShibumiStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle, PyramidalPlacement, and ShibumiDesign are ported,
		// replace this class body with a proper `extends BoardStyle`.
		//
		// const pyramidalPlacement = new PyramidalPlacement(bridge, this);
		// containerPlacement = pyramidalPlacement;
		// containerDesign = new ShibumiDesign(this, pyramidalPlacement);
		// (PyramidalPlacement is in batch 27, ShibumiDesign in batch 26)
		this.containerPlacement = null;
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
