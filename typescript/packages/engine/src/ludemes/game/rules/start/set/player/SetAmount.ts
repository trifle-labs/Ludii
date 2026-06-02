/**
 * Initialises the amount (e.g. betting pool) of one or more players.
 *
 * @java game/rules/start/set/player/SetAmount.java — eval(Context)
 *
 * DEFERRED: Java ActionSetAmount modifies State.amounts[] via Context.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * Amount initialisation cannot be applied until Game1to1.start() accepts an
 * amounts[] array or the StartRule interface is extended.
 * The compile1to1 path currently skips (set Amount …) start rules.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/player/SetAmount.java
 *
 * Initialises the amount of the given player(s). Used mainly for betting games.
 * applyToInitialState is a no-op because amounts[] is not in the interface.
 */
export class SetAmount1to1 implements StartRule {
  /**
   * 1-based player id, or null if "all players".
   * Java: playersFn field (null when role not specified → all players).
   */
  private readonly playerId: number | null;

  /** The initial amount value. Java: amountFn evaluated. */
  private readonly amount: number;

  /**
   * @param playerId  1-based player id, or null for all players
   * @param amount    initial amount value
   */
  public constructor(playerId: number | null, amount: number) {
    this.playerId = playerId;
    this.amount = amount;
  }

  /**
   * @java game/rules/start/set/player/SetAmount.java — eval(Context)
   *
   * Java: ActionSetAmount(playerId, amount).apply(context) for each target player.
   * TS-deferred: State.amounts[] not accessible via applyToInitialState.
   */
  public applyToInitialState(
    _cells: number[],
    _whats: number[],
    _countAt: number[],
    _equipment: Equipment1to1,
    _numPlayers: number,
  ): void {
    // Deferred: State.amounts[] not accessible via applyToInitialState interface.
    // Java: for each player: new ActionSetAmount(playerId, amount).apply(context).
    void this.playerId;
    void this.amount;
  }
}
