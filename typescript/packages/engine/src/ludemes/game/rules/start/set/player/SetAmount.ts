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

import type { Context } from "../../../../../../context.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/player/SetAmount.java
 *
 * Initialises the amount of the given player(s). Used mainly for betting games.
 * applyToInitialState is a no-op because amounts[] is not in the interface.
 */
export class SetAmount implements StartRule {
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
  /**
   * @java game/rules/start/set/player/SetAmount.java — eval(Context)
   * Java: ActionSetAmount(playerId, amount).apply(context) per target player.
   */
  public eval(ctx: Context): void {
    const arrays = (ctx as unknown as { _startArrays?: { amounts?: number[] } })._startArrays;
    const amounts = arrays?.amounts;
    if (!amounts) return;
    const numPlayers = (ctx.game as unknown as { numPlayers: number }).numPlayers;
    if (this.playerId !== null) {
      if (this.playerId >= 0 && this.playerId < amounts.length) amounts[this.playerId] = this.amount;
      return;
    }
    // Each/All role: same amount to every player.
    for (let pid = 1; pid <= numPlayers; pid++) amounts[pid] = this.amount;
  }
}
