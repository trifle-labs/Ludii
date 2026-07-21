// @java Core/src/other/action/die/ActionUpdateDice.java ActionUpdateDice
/**
 * Java parity: Core/src/other/action/die/ActionUpdateDice.java —
 * yields `ActionType.SetStateAndUpdateDice`.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionUpdateDice extends BaseAction {
  public static readonly TYPE: ActionType = "SetStateAndUpdateDice";

  private readonly siteIndex: number;
  private readonly stateValue: number;
  private readonly dieValue: number | undefined;

  /**
   * @param siteIndex board site (state channel) or, in dice-value mode, the
   *                  die index into `state.diceValues`.
   * @param stateValue the new site state (Java `newState`, the die's face index).
   * @param dieValue   when supplied, reset `diceValues[siteIndex]` to this value
   *                   *instead of* touching the board-cell state channel. Java's
   *                   ActionUpdateDice sets the die's value to `faces[newState]`;
   *                   the TS dice model stores values directly, so the resolved
   *                   value is passed in. Used by `(forEach Die replayDouble:True)`
   *                   to re-arm doubles for a second pass (backgammon).
   */
  public constructor(siteIndex: number, stateValue: number, dieValue?: number) {
    super();
    this.siteIndex = siteIndex;
    this.stateValue = stateValue;
    this.dieValue = dieValue;
  }

  public override apply(state: State): State {
    // Dice-value mode: reset the die's current value (Java sets
    // currentDice[..][dieIndex] = faces[newState]). Avoids the board-cell state
    // channel, which would corrupt a real cell at the same numeric index.
    if (this.dieValue !== undefined) {
      if (this.siteIndex < 0 || this.siteIndex >= state.diceValues.length) {
        return state;
      }
      const next = [...state.diceValues];
      next[this.siteIndex] = this.dieValue;
      // Re-arm updates the die's shown face too (@java cs.setSite state).
      const faces = [...(state.diceRolledFaces.length ? state.diceRolledFaces : state.diceValues)];
      faces[this.siteIndex] = this.dieValue;
      return state.withDiceValues(next).withDiceRolledFaces(faces);
    }
    // Two effects in Java: update the site's state AND roll the dice
    // container. The MVE folds it onto the `stateAt` channel; the
    // dice-roll side-effect is left to a future container model.
    return state.withStateAt(this.siteIndex, this.stateValue);
  }
  public override actionType(): ActionType {
    return ActionUpdateDice.TYPE;
  }
  public override to(): number {
    return this.siteIndex;
  }
  public override state(): number {
    return this.stateValue;
  }
}
