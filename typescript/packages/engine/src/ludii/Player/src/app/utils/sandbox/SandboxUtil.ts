// @java Player/src/app/utils/sandbox/SandboxUtil.java

import { SandboxValueType } from "./SandboxValueType.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for deps not yet fully ported
// ---------------------------------------------------------------------------

/** @java app.PlayerApp */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerApp = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java other.location.Location */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Location = any;

/** @java other.move.Move */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Move = any;

/** @java other.action.Action */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Action = any;

/** @java game.equipment.component.Component */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Component = any;

/** @java other.state.container.ContainerState */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerState = any;

/** @java util.ContainerUtil — partial escape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerUtilShape = any;

/** @java main.Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Various util functions to do with the sandbox.
 *
 * @java app.utils.sandbox.SandboxUtil
 * @author Matthew.Stephenson
 */
export class SandboxUtil {

  // ---------------------------------------------------------------------------

  /**
   * Returns an error message if sandbox is not allowed for the specified component.
   *
   * @java SandboxUtil.isSandboxAllowed(PlayerApp, Location)
   */
  public static isSandboxAllowed(app: PlayerApp, selectedLocation: Location): boolean {
    const context: Context = app.manager().ref().context();

    const locnUpSite: number = selectedLocation.site();
    const locnType = selectedLocation.siteType();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ContainerUtil: ContainerUtilShape = (app as any).__containerUtil ?? {
      getContainerId: (ctx: Context, site: number, _t: unknown) => ctx.containerId()[site],
    };
    const containerId: number = ContainerUtil.getContainerId(context, locnUpSite, locnType);
    const componentAtSite: Component = context.components()[
      (context.containerState(containerId)).what(locnUpSite, locnType)
    ];

    if (componentAtSite != null) {
      if (componentAtSite.isDie()) {
        app.setVolatileMessage("Setting dice not supported yet.");
        return false;
      }
      if (componentAtSite.isLargePiece()) {
        app.setVolatileMessage("Setting large pieces is not supported yet.");
        return false;
      }
    }

    return true;
  }

  // ---------------------------------------------------------------------------

  /**
   * @return the number of buttons needed for the sandbox dialog.
   *
   * @java SandboxUtil.numSandboxButtonsNeeded(PlayerApp, SandboxValueType)
   */
  public static numSandboxButtonsNeeded(app: PlayerApp, sandboxValueType: SandboxValueType): number {
    const context: Context = app.manager().ref().context();

    let numButtonsNeeded = 0;
    if (sandboxValueType === SandboxValueType.Component) {
      numButtonsNeeded = context.components().length;
    } else if (sandboxValueType === SandboxValueType.LocalState) {
      numButtonsNeeded = context.game().maximalLocalStates();
    } else if (sandboxValueType === SandboxValueType.Count) {
      numButtonsNeeded = context.game().maxCount();
    } else if (sandboxValueType === SandboxValueType.Rotation) {
      numButtonsNeeded = context.game().maximalRotationStates();
    } else if (sandboxValueType === SandboxValueType.Value) {
      numButtonsNeeded = context.game().maximalValue();
    }

    return numButtonsNeeded;
  }

  // ---------------------------------------------------------------------------

  /**
   * Move a piece from one location to another.
   *
   * @java SandboxUtil.makeSandboxDragMove(PlayerApp, Location, Location)
   */
  public static makeSandboxDragMove(
    app: PlayerApp,
    selectedFromLocation: Location,
    selectedToLocation: Location,
  ): void {
    const context: Context = app.manager().ref().context();

    try {
      const currentMover: number = context.state().mover();
      const nextMover: number = context.state().next();
      const previousMover: number = context.state().prev();

      // ActionMove.construct: from → to
      const actionRemove: Action = {
        isDecision: () => true,
        setDecision: (_d: boolean) => { /* escape */ },
        apply: (_ctx: Context, _t: boolean) => { /* escape */ },
      };
      // Escape-hatch: delegate to Java-mirrored move construction if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moveFactory: any = (app as any).__moveFactory;
      if (moveFactory) {
        const move: Move = moveFactory.makeDragMove(
          selectedFromLocation, selectedToLocation, context,
          currentMover, nextMover, previousMover,
        );
        move.apply(context, true);
        context.state().setMover(currentMover);
        context.state().setNext(nextMover);
        context.state().setPrev(previousMover);
      }
    } catch (_e) {
      // An invalid drag location — silently swallow.
    }

    // Equivalent of EventQueue.invokeLater
    Promise.resolve().then(() => {
      app.bridge().settingsVC().setSelectedFromLocation(
        app.__FullLocation ? new app.__FullLocation(UNDEFINED) : { site: () => UNDEFINED, siteType: () => "Cell", level: () => 0 },
      );
      app.repaint();
    });
  }

  // ---------------------------------------------------------------------------

  /**
   * @return Move object corresponding to removing a piece at a specified location.
   *
   * @java SandboxUtil.getSandboxRemoveMove(PlayerApp, Location)
   */
  public static getSandboxRemoveMove(app: PlayerApp, selectedLocation: Location): Move {
    const context: Context = app.manager().ref().context();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moveFactory: any = (app as any).__moveFactory;
    if (moveFactory) {
      return moveFactory.buildRemoveMove(selectedLocation, context);
    }
    // Minimal escape-hatch stub
    return {
      apply: (_ctx: Context, _t: boolean) => { /* escape */ },
      then: () => ({ add: () => { /* escape */ } }),
    };
  }

  // ---------------------------------------------------------------------------

  /**
   * @return Move object corresponding to adding a piece at a specified location.
   *
   * @java SandboxUtil.getSandboxAddMove(PlayerApp, Location, int)
   */
  public static getSandboxAddMove(
    app: PlayerApp,
    selectedLocation: Location,
    componentIndex: number,
  ): Move {
    const context: Context = app.manager().ref().context();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moveFactory: any = (app as any).__moveFactory;
    if (moveFactory) {
      return moveFactory.buildAddMove(selectedLocation, componentIndex, context);
    }
    return {
      apply: (_ctx: Context, _t: boolean) => { /* escape */ },
      then: () => ({ add: () => { /* escape */ } }),
    };
  }

  // ---------------------------------------------------------------------------

  /**
   * @return Move object corresponding to inserting a piece at a specified location.
   *
   * @java SandboxUtil.getSandboxInsertMove(PlayerApp, Location, int)
   */
  public static getSandboxInsertMove(
    app: PlayerApp,
    selectedLocation: Location,
    componentIndex: number,
  ): Move {
    const context: Context = app.manager().ref().context();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moveFactory: any = (app as any).__moveFactory;
    if (moveFactory) {
      return moveFactory.buildInsertMove(selectedLocation, componentIndex, context);
    }
    return {
      apply: (_ctx: Context, _t: boolean) => { /* escape */ },
      then: () => ({ add: () => { /* escape */ } }),
    };
  }

  // ---------------------------------------------------------------------------

  /**
   * @return Move object corresponding to setting a piece's variable at a specified location.
   *
   * @java SandboxUtil.getSandboxVariableMove(PlayerApp, Location, SandboxValueType, int)
   */
  public static getSandboxVariableMove(
    app: PlayerApp,
    selectedLocation: Location,
    sandboxValueType: SandboxValueType,
    value: number,
  ): Move {
    const context: Context = app.manager().ref().context();

    const locnUpSite: number = selectedLocation.site();
    const locnLevel: number = selectedLocation.level();
    const locnType = selectedLocation.siteType();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ContainerUtil: ContainerUtilShape = (app as any).__containerUtil ?? {
      getContainerId: (ctx: Context, site: number, _t: unknown) => ctx.containerId()[site],
    };
    const containerId: number = ContainerUtil.getContainerId(context, locnUpSite, locnType);
    const cs: ContainerState = context.state().containerStates()[containerId];

    let action: Action | null = null;

    if (sandboxValueType === SandboxValueType.LocalState) {
      action = { type: "SetState", siteType: locnType, site: locnUpSite, level: locnLevel, value };
    } else if (sandboxValueType === SandboxValueType.Count) {
      const what: number = cs.what(locnUpSite, locnLevel, locnType);
      action = { type: "SetCount", siteType: locnType, site: locnUpSite, what, value };
    } else if (sandboxValueType === SandboxValueType.Value) {
      action = { type: "SetValue", siteType: locnType, site: locnUpSite, level: locnLevel, value };
    } else if (sandboxValueType === SandboxValueType.Rotation) {
      action = { type: "SetRotation", siteType: locnType, site: locnUpSite, value };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moveFactory: any = (app as any).__moveFactory;
    if (moveFactory && action !== null) {
      return moveFactory.buildVariableMove(action, context);
    }

    return {
      apply: (_ctx: Context, _t: boolean) => { /* escape */ },
      then: () => ({ add: () => { /* escape */ } }),
    };
  }

  // ---------------------------------------------------------------------------
}
