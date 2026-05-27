// @java Core/src/other/action/hidden/ActionSetHidden.java ActionSetHidden
// @java Core/src/other/action/hidden/ActionSetHiddenCount.java ActionSetHiddenCount
// @java Core/src/other/action/hidden/ActionSetHiddenRotation.java ActionSetHiddenRotation
// @java Core/src/other/action/hidden/ActionSetHiddenState.java ActionSetHiddenState
// @java Core/src/other/action/hidden/ActionSetHiddenValue.java ActionSetHiddenValue
// @java Core/src/other/action/hidden/ActionSetHiddenWhat.java ActionSetHiddenWhat
// @java Core/src/other/action/hidden/ActionSetHiddenWho.java ActionSetHiddenWho
/**
 * Java parity:
 * - Core/src/other/action/hidden/ActionSetHidden.java
 * - Core/src/other/action/hidden/ActionSetHiddenCount.java
 * - Core/src/other/action/hidden/ActionSetHiddenRotation.java
 * - Core/src/other/action/hidden/ActionSetHiddenState.java
 * - Core/src/other/action/hidden/ActionSetHiddenValue.java
 * - Core/src/other/action/hidden/ActionSetHiddenWhat.java
 * - Core/src/other/action/hidden/ActionSetHiddenWho.java
 *
 * One class per Java hidden-info action. They all share the same shape
 * (target site, target player, hidden flag) and the TS MVE collapses
 * each variant onto the unified `hiddenForPlayer` matrix on State — the
 * sub-flavours (count/value/state/etc.) are preserved as
 * `actionType()` returns for parity.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

abstract class ActionSetHiddenBase extends BaseAction {
  protected readonly siteIndex: number;
  protected readonly playerIndex: number;
  protected readonly hiddenFlag: boolean;

  public constructor(siteIndex: number, playerIndex: number, hidden: boolean) {
    super();
    this.siteIndex = siteIndex;
    this.playerIndex = playerIndex;
    this.hiddenFlag = hidden;
  }

  public override apply(state: State): State {
    return state.withHidden(this.playerIndex, this.siteIndex, this.hiddenFlag);
  }
  public override to(): number {
    return this.siteIndex;
  }
  public override who(): number {
    return this.playerIndex;
  }
}

export class ActionSetHidden extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetHidden";
  public override actionType(): ActionType {
    return ActionSetHidden.TYPE;
  }
}

export class ActionSetHiddenCount extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetHiddenCount";
  public override actionType(): ActionType {
    return ActionSetHiddenCount.TYPE;
  }
}

export class ActionSetHiddenRotation extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetHiddenRotation";
  public override actionType(): ActionType {
    return ActionSetHiddenRotation.TYPE;
  }
}

export class ActionSetHiddenState extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetHiddenState";
  public override actionType(): ActionType {
    return ActionSetHiddenState.TYPE;
  }
}

export class ActionSetHiddenValue extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetHiddenValue";
  public override actionType(): ActionType {
    return ActionSetHiddenValue.TYPE;
  }
}

export class ActionSetHiddenWhat extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetHiddenWhat";
  public override actionType(): ActionType {
    return ActionSetHiddenWhat.TYPE;
  }
}

export class ActionSetHiddenWho extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetHiddenWho";
  public override actionType(): ActionType {
    return ActionSetHiddenWho.TYPE;
  }
}

export class ActionSetVisible extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetVisible";

  public constructor(siteIndex: number, playerIndex: number) {
    super(siteIndex, playerIndex, false);
  }
  public override actionType(): ActionType {
    return ActionSetVisible.TYPE;
  }
}

export class ActionSetMasked extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetMasked";

  public constructor(siteIndex: number, playerIndex: number) {
    // "Masked" semantically lies between visible and invisible; the MVE
    // models it as hidden=true (the actual mask is metadata the engine
    // does not yet read).
    super(siteIndex, playerIndex, true);
  }
  public override actionType(): ActionType {
    return ActionSetMasked.TYPE;
  }
}

export class ActionSetInvisible extends ActionSetHiddenBase {
  public static readonly TYPE: ActionType = "SetInvisible";

  public constructor(siteIndex: number, playerIndex: number) {
    super(siteIndex, playerIndex, true);
  }
  public override actionType(): ActionType {
    return ActionSetInvisible.TYPE;
  }
}
