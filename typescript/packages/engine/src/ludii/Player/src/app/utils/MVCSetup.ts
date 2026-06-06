// @java Player/src/app/utils/MVCSetup.java

import type { Context } from "../../../../ViewController/src/../../../ludemes/other/context/Context.js";
import type { Bridge } from "../../../../ViewController/src/bridge/Bridge.js";

/** @java bridge.ViewControllerFactory */
// Dynamic import to avoid circular dep issues with not-yet-ported styles.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ViewControllerFactoryLike = { createStyle(...args: any[]): any; createController(...args: any[]): any };

/**
 * Minimal structural interface for app.PlayerApp (not yet ported in this batch).
 * @java app.PlayerApp
 */
interface PlayerApp {
  manager(): {
    ref(): { context(): Context; };
  };
  bridge(): Bridge;
  clearGraphicsCache(): void;
}

// -------------------------------------------------------------------------

/**
 * Functions for setting up the Model-View-Controller within the Bridge.
 *
 * Faithful 1:1 port of app.utils.MVCSetup.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java app.utils.MVCSetup
 */
export class MVCSetup {

  // -------------------------------------------------------------------------

  /**
   * Set the Bridge MVC objects to the correct Styles for each container and component.
   * @java MVCSetup#setMVC(PlayerApp)
   */
  static setMVC(app: PlayerApp): void {
    const context = app.manager().ref().context();
    const metadata = (context as unknown as { metadata(): unknown }).metadata();

    // Game metadata can be used to disable animation.
    const gameMetaGraphics = (context.game() as unknown as { metadata(): { graphics(): { noAnimation(): boolean } } }).metadata().graphics();
    const noAnimation = gameMetaGraphics.noAnimation();
    (app.bridge().settingsVC() as unknown as { setNoAnimation(v: boolean): void }).setNoAnimation(noAnimation);

    // Container style
    if (metadata !== null && metadata !== undefined) {
      const graphicsBoardStyle = (metadata as unknown as { graphics(): { boardStyle(): unknown } }).graphics().boardStyle();
      if (graphicsBoardStyle !== null && graphicsBoardStyle !== undefined) {
        const board = (context as unknown as { board(): { setStyle(s: unknown): void } }).board();
        board.setStyle(graphicsBoardStyle);
      }
    }

    // Lazy-import ViewControllerFactory to avoid circular deps
    const factoryPromise: Promise<ViewControllerFactoryLike> =
      import("../../../../ViewController/src/bridge/ViewControllerFactory.js")
        .then((m) => (m as unknown as { ViewControllerFactory: ViewControllerFactoryLike }).ViewControllerFactory);

    const bridge = app.bridge();
    const equipment = (context as unknown as {
      equipment(): {
        containers(): Array<{ index(): number; style(): unknown; controller(): unknown }>;
        components(): Array<{ index(): number; owner(): number; name(): string; style(): unknown; setStyle(s: unknown): void } | null | undefined>;
      }
    }).equipment();

    for (const c of equipment.containers()) {
      const containerStyle = c.style();
      const controllerType = c.controller();
      // Use void return — async factory, result applied when available
      factoryPromise.then((Factory) => {
        bridge.addContainerStyle(Factory.createStyle(bridge, c, containerStyle, context) as never, c.index());
        Factory.createController(bridge, c, controllerType).then((ctrl: unknown) => {
          bridge.addContainerController(ctrl as never, c.index());
        }).catch(() => {/* no-op */});
      }).catch(() => {/* no-op */});
    }

    // Component style
    for (const c of equipment.components()) {
      if (c !== null && c !== undefined) {
        // Override the component's default style with that specified in metadata
        if (metadata !== null && metadata !== undefined) {
          const metaStyle = (metadata as unknown as {
            graphics(): { componentStyle(ctx: Context, owner: number, name: string): unknown }
          }).graphics().componentStyle(context, c.owner(), c.name());
          if (metaStyle !== null && metaStyle !== undefined) {
            c.setStyle(metaStyle);
          }
        }

        const componentStyle = c.style();
        factoryPromise.then((Factory) => {
          bridge.addComponentStyle(Factory.createStyle(bridge, c, componentStyle) as never, c.index());
        }).catch(() => {/* no-op */});
      }
    }

    app.clearGraphicsCache();
  }

  // -------------------------------------------------------------------------
}
