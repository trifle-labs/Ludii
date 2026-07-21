// @java Core/src/other/action/others/ActionSwap.java ActionSwap (player-swap variant)
/**
 * Swap two players' piece ownership on the board.
 *
 * Java parity: Core/src/other/action/others/ActionSwap.java — the form used
 * by SwapPlayers.eval() with two player indices (not two board sites).
 * Java's ActionSwap(pid1, pid2).apply() calls state.swapPlayerOrder(pid1, pid2),
 * which swaps piece ownership across the board.
 *
 * In TS, swapPlayerOrder is implemented here by iterating all cells and flipping
 * owner pid1 → pid2 and pid2 → pid1, mirroring the net effect of
 * State.swapPlayerOrder in Java for a two-player game.
 *
 * from() and to() return -1 (Constants.UNDEFINED) to match Java's BaseAction
 * defaults — the trial parser records this swap move with from=-1, to=-1.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionSwapPlayers extends BaseAction {
  public static readonly TYPE: ActionType = "Swap";

  private readonly pid1: number;
  private readonly pid2: number;

  public constructor(pid1: number, pid2: number) {
    super();
    this.pid1 = pid1;
    this.pid2 = pid2;
  }

  public override apply(state: State): State {
    // Swap all cell owners: pid1 ↔ pid2
    // Mirrors Java State.swapPlayerOrder(pid1, pid2):
    //   each board site owned by pid1 becomes owned by pid2 and vice versa.
    let result = state;
    const cells = state.cells;
    for (let i = 0; i < cells.length; i++) {
      const owner = cells[i] ?? 0;
      if (owner === this.pid1) {
        result = result.withCell(i, this.pid2);
      } else if (owner === this.pid2) {
        result = result.withCell(i, this.pid1);
      }
    }
    return result;
  }

  public override actionType(): ActionType {
    return ActionSwapPlayers.TYPE;
  }

  public override isSwap(): boolean {
    return true;
  }

  /** Java BaseAction.from() returns Constants.UNDEFINED = -1 */
  public override from(): number {
    return -1;
  }

  /** Java BaseAction.to() returns Constants.UNDEFINED = -1 */
  public override to(): number {
    return -1;
  }
}
