// @java Core/src/other/playout/Playout.java Playout
/**
 * Faithful 1:1 transliteration of other.playout.Playout.
 *
 * Interface for custom playout strategies.
 *
 * Java parity: other/playout/Playout.java
 */

import type { IAI, ITrial } from "../context/Context.js";
import type { IContext } from "./PlayoutMoveSelector.js";
import type { PlayoutMoveSelector } from "./PlayoutMoveSelector.js";

export interface Playout {

  /**
   * @java public abstract Trial playout(...)
   * Play out the game to conclusion from the current state.
   */
  playout(
    context: IContext,
    ais: (IAI | null)[] | null,
    thinkingTime: number,
    playoutMoveSelector: PlayoutMoveSelector | null,
    maxNumBiasedActions: number,
    maxNumPlayoutActions: number,
    random: { nextInt(bound: number): number }
  ): ITrial;

  /**
   * @java public abstract boolean callsGameMoves()
   */
  callsGameMoves(): boolean;
}
