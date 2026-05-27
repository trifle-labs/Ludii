// @java Core/src/other/action/others/ActionVote.java ActionVote
/** Java parity: Core/src/other/action/others/ActionVote.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionVote extends BaseAction {
  public static readonly TYPE: ActionType = "Vote";

  private readonly voteText: string;

  public constructor(vote: string) {
    super();
    this.voteText = vote;
  }

  public override apply(state: State): State {
    return state;
  }
  public override actionType(): ActionType {
    return ActionVote.TYPE;
  }
  public override isVote(): boolean {
    return true;
  }
  public override vote(): string {
    return this.voteText;
  }
}
