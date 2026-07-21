// @java ViewController/src/bridge/Bridge.java

import { SettingsColour } from "../util/SettingsColour.js";
import type { PlatformGraphics } from "./PlatformGraphics.js";

// Forward-reference types for deps not yet ported (other batches).
// ContainerStyle  -> batch 20: src/ludii/ViewController/src/view/container/ContainerStyle.ts
// ComponentStyle  -> batch 18: src/ludii/ViewController/src/view/component/ComponentStyle.ts
// Controller      -> batch 30: src/ludii/ViewController/src/controllers/Controller.ts
// SettingsVC      -> batch  0: src/ludii/ViewController/src/util/SettingsVC.ts

/** @java view.container.ContainerStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerStyle = any;

/** @java view.component.ComponentStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentStyle = any;

/** @java controllers.Controller */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Controller = any;

/** @java util.SettingsVC */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SettingsVC = any;

/**
 * Bridge Object, for linking the ViewController entities
 * (component/container styles/controllers) with the PlayerDesktop.
 *
 * Faithful 1:1 port of bridge.Bridge.
 *
 * @author Matthew.Stephenson (Java original)
 * @java bridge.Bridge
 */
export class Bridge {

	/** @java Bridge#graphicsRenderer */
	private _graphicsRenderer: PlatformGraphics | null = null;

	/** @java Bridge#containerStyles */
	private readonly _containerStyles: (ContainerStyle | null)[] = [];

	/** @java Bridge#componentStyles */
	private readonly _componentStyles: (ComponentStyle | null)[] = [];

	/** @java Bridge#containerControllers */
	private readonly _containerControllers: (Controller | null)[] = [];

	/** @java Bridge#settingsVC */
	private readonly _settingsVC: SettingsVC = {} as SettingsVC;

	/** @java Bridge#settingsColour */
	private readonly _settingsColour: SettingsColour = new SettingsColour();

	// -------------------------------------------------------------------------

	/**
	 * Constructor.
	 * @java Bridge#Bridge()
	 */
	constructor() {
		// Fields are initialised inline above (matching Java field initialisation).
	}

	// -------------------------------------------------------------------------

	/** @java Bridge#setGraphicsRenderer(PlatformGraphics) */
	setGraphicsRenderer(g: PlatformGraphics): void {
		this._graphicsRenderer = g;
	}

	/** @java Bridge#graphicsRenderer() */
	graphicsRenderer(): PlatformGraphics | null {
		return this._graphicsRenderer;
	}

	// -------------------------------------------------------------------------

	/** @java Bridge#addContainerStyle(ContainerStyle, int) */
	addContainerStyle(containerStyle: ContainerStyle, index: number): void {
		for (let i = this._containerStyles.length; i <= index; i++) {
			this._containerStyles.push(null);
		}
		this._containerStyles[index] = containerStyle;
	}

	/** @java Bridge#clearContainerStyles() */
	clearContainerStyles(): void {
		this._containerStyles.length = 0;
	}

	/** @java Bridge#getContainerStyle(int) */
	getContainerStyle(index: number): ContainerStyle | null {
		return this._containerStyles[index] ?? null;
	}

	/** @java Bridge#getContainerStyles() */
	getContainerStyles(): (ContainerStyle | null)[] {
		return this._containerStyles;
	}

	// -------------------------------------------------------------------------

	/** @java Bridge#addComponentStyle(ComponentStyle, int) */
	addComponentStyle(componentStyle: ComponentStyle, index: number): void {
		for (let i = this._componentStyles.length; i <= index; i++) {
			this._componentStyles.push(null);
		}
		this._componentStyles[index] = componentStyle;
	}

	/** @java Bridge#clearComponentStyles() */
	clearComponentStyles(): void {
		this._componentStyles.length = 0;
	}

	/** @java Bridge#getComponentStyle(int) */
	getComponentStyle(index: number): ComponentStyle | null {
		return this._componentStyles[index] ?? null;
	}

	/** @java Bridge#getComponentStyles() */
	getComponentStyles(): (ComponentStyle | null)[] {
		return this._componentStyles;
	}

	// -------------------------------------------------------------------------

	/** @java Bridge#addContainerController(Controller, int) */
	addContainerController(containerController: Controller, index: number): void {
		for (let i = this._containerControllers.length; i <= index; i++) {
			this._containerControllers.push(null);
		}
		this._containerControllers[index] = containerController;
	}

	/** @java Bridge#clearContainerControllers() */
	clearContainerControllers(): void {
		this._containerControllers.length = 0;
	}

	/** @java Bridge#getContainerController(int) */
	getContainerController(index: number): Controller | null {
		return this._containerControllers[index] ?? null;
	}

	/** @java Bridge#settingsVC() */
	settingsVC(): SettingsVC {
		return this._settingsVC;
	}

	/** @java Bridge#settingsColour() */
	settingsColour(): SettingsColour {
		return this._settingsColour;
	}

	// -------------------------------------------------------------------------
}
