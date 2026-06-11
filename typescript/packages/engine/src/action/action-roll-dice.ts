// @java Core/src/other/action/die/ActionUpdateDice.java ActionUpdateDice
/**
 * Re-roll every die, writing fresh face values into the state. The roll is
 * deferred to apply-time so move *generation* stays pure (enumerating moves
 * never consumes the RNG); the actual draw happens once, when the chosen
 * move is applied. Java parity: Core/src/other/action/die/ActionUpdateDice
 * + the (roll) effect.
 */

import type { SeededRng } from "../rng.js";
import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionRollDice extends BaseAction {
  public static readonly TYPE: ActionType = "RollDice";

  /** Per-die face sets: `faces[i]` are the values printable on die `i`. */
  private readonly faces: readonly (readonly number[])[];

  public constructor(faces: readonly (readonly number[])[]) {
    super();
    this.faces = faces;
  }

  public override apply(state: State, rng?: SeededRng): State {
    const rolled = this.faces.map((f) => {
      if (f.length === 0) return 0;
      const idx = rng ? rng.nextInt(f.length) : 0;
      return f[idx] ?? 0;
    });
    // @java a roll also writes each die site's state (the face) — (face site)
    // reads that channel and it persists through UseDie.
    return state.withDiceRoll(rolled);
  }

  public override actionType(): ActionType {
    return ActionRollDice.TYPE;
  }
}
