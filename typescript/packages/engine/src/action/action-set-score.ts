// @java Core/src/other/action/state/ActionSetScore.java ActionSetScore
/**
 * Java parity: Core/src/other/action/state/ActionSetScore.java.
 * Sets (or adds to) a player's score.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export interface ActionSetScoreOptions {
  readonly player: number;
  readonly score: number;
  /** If true the score is added to the current value. */
  readonly add?: boolean;
}

export class ActionSetScore extends BaseAction {
  public static readonly TYPE: ActionType = "SetScore";

  private readonly player: number;
  private readonly scoreValue: number;
  private readonly addFlag: boolean;

  public constructor(options: ActionSetScoreOptions) {
    super();
    if (!Number.isInteger(options.player) || options.player < 1) {
      throw new RangeError("ActionSetScore.player must be a positive integer.");
    }
    this.player = options.player;
    this.scoreValue = options.score;
    this.addFlag = options.add ?? false;
  }

  public override apply(state: State): State {
    const prev = state.score(this.player);
    return state.withScore(
      this.player,
      this.addFlag ? prev + this.scoreValue : this.scoreValue,
    );
  }

  public override actionType(): ActionType {
    return ActionSetScore.TYPE;
  }

  public override who(): number {
    return this.player;
  }

  public override value(): number {
    return this.scoreValue;
  }
}
