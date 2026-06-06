// @java ViewController/src/view/container/styles/board/XiangqiStyle.java

/**
 * Container style for Xiangqi (Chinese Chess) boards.
 * Delegates to XiangqiDesign for the actual drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.XiangqiStyle.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.styles.board.XiangqiStyle
 */

// BoardStyle    -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// XiangqiDesign -> batch 23: src/ludii/ViewController/src/view/container/aspects/designs/board/XiangqiDesign.ts
// Bridge        -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container     -> game.equipment.container.Container (Core)

import { Bridge } from '../../../../bridge/Bridge.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java view.container.aspects.designs.board.XiangqiDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XiangqiDesign = any;

/**
 * XiangqiStyle — minimal faithful shell.
 * Extends BoardStyle (escape-hatched until batch 23 is merged).
 *
 * In Java:
 *   public class XiangqiStyle extends BoardStyle {
 *     public XiangqiStyle(Bridge, Container) {
 *       super(bridge, container);
 *       containerDesign = new XiangqiDesign(this, boardPlacement);
 *     }
 *   }
 *
 * @java view.container.styles.board.XiangqiStyle
 */
export class XiangqiStyle {

	/** @java XiangqiStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java XiangqiStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java XiangqiStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: XiangqiDesign | null = null;

	/** @java XiangqiStyle#boardPlacement (inherited via BoardStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected boardPlacement: any = null;

	// -----------------------------------------------------------------------

	/**
	 * @java XiangqiStyle#XiangqiStyle(Bridge, Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: When BoardStyle and XiangqiDesign are ported, replace this class
		// body with a proper `extends BoardStyle`.
		//
		// containerDesign = new XiangqiDesign(this, boardPlacement);
		// (XiangqiDesign is in batch 23 — escape-hatched here)
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
