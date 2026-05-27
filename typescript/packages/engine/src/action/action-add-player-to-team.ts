// @java Core/src/other/action/state/ActionAddPlayerToTeam.java ActionAddPlayerToTeam
/** Java parity: Core/src/other/action/state/ActionAddPlayerToTeam.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionAddPlayerToTeam extends BaseAction {
  public static readonly TYPE: ActionType = "AddPlayerToTeam";

  private readonly player: number;
  private readonly team: number;

  public constructor(player: number, team: number) {
    super();
    this.player = player;
    this.team = team;
  }

  public override apply(state: State): State {
    // Team assignment is folded into the per-player value array for now.
    return state.withValuePlayer(this.player, this.team);
  }
  public override actionType(): ActionType {
    return ActionAddPlayerToTeam.TYPE;
  }
  public override who(): number {
    return this.player;
  }
  public override value(): number {
    return this.team;
  }
}
