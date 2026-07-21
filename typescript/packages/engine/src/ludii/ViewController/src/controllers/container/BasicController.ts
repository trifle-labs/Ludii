// @java ViewController/src/controllers/container/BasicController.java

import type { Bridge } from "../../bridge/Bridge.js";
import type { Container } from "../../../../../ludemes/game/equipment/container/Container.js";

// BaseController is in batch 31 — use escape-hatch until that port lands.
/** @java controllers.BaseController — escape-hatch until batch 31 is ported */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BaseControllerPlaceholder: any = class {
	protected container: Container;
	protected bridge: Bridge;
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this.container = container;
	}
};

/**
 * Basic controller for moving pieces. Used in most games.
 *
 * Faithful 1:1 port of controllers.container.BasicController.
 *
 * @author Matthew.Stephenson (Java original)
 * @java controllers.container.BasicController
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class BasicController extends (BaseControllerPlaceholder as any) {

	// -------------------------------------------------------------------------

	/**
	 * @java BasicController(bridge.Bridge, game.equipment.container.Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		super(bridge, container);
	}

	// -------------------------------------------------------------------------
}
