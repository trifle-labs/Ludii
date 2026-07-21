// @java Core/src/other/action/others/ActionForfeit.java ActionForfeit
/**
 * Java parity:
 * - Core/src/other/action/others/ActionForfeit.java — a player
 *   forfeits/resigns. Apply is a no-op on the State; the surrounding
 *   Game.apply() handles ranking and termination based on the mover.
 */

import type { State } from "../state.js";
import { ACTION_UNDEFINED, BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export interface ActionForfeitOptions {
  /** 1-based player index that is forfeiting. */
  readonly player: number;
}

export class ActionForfeit extends BaseAction {
  public static readonly TYPE: ActionType = "Forfeit";

  private readonly whoIndex: number;

  public constructor(options: ActionForfeitOptions) {
    super();
    if (!Number.isInteger(options.player) || options.player < 1) {
      throw new RangeError(
        "ActionForfeit.player must be a positive integer (1-based).",
      );
    }
    this.whoIndex = options.player;
  }

  public override apply(state: State): State {
    return state;
  }

  public override actionType(): ActionType {
    return ActionForfeit.TYPE;
  }

  public override isForfeit(): boolean {
    return true;
  }

  public override who(): number {
    return this.whoIndex;
  }

  public override what(): number {
    return ACTION_UNDEFINED;
  }
}
