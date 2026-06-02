/**
 * Initialises the score of one or more players.
 *
 * @java game/rules/start/set/player/SetScore.java — eval(Context)
 *
 * DEFERRED: Java ActionSetScore modifies State.scores[] via Context.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * Score initialisation cannot be applied until Game1to1.start() accepts a
 * scores[] array or the StartRule interface is extended with scores/amounts.
 * The compile1to1 path currently skips (set Score …) start rules.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/player/SetScore.java
 *
 * Initialises the score of the given player(s) to a constant value.
 * applyToInitialState is a no-op because scores[] is not in the interface.
 */
export class SetScore1to1 implements StartRule {
  /**
   * Player ids to set, or null if `initSameScoreToEachPlayer` applies.
   * Java: players[] (length 0 when Each/All roleType).
   */
  private readonly playerIds: readonly number[] | null;

  /** Score values parallel to playerIds, or single value for each-player mode. */
  private readonly scores: readonly number[];

  /**
   * True when the Java roleType is Each/All — set same score to every player.
   * Java: InitSameScoreToEachPlayer field.
   */
  private readonly initSameScoreToEachPlayer: boolean;

  /**
   * @param playerIds                player 1-based ids, or null for each-player mode
   * @param scores                   score values (parallel to playerIds, or single entry)
   * @param initSameScoreToEachPlayer true if Each/All roleType
   */
  public constructor(
    playerIds: readonly number[] | null,
    scores: readonly number[],
    initSameScoreToEachPlayer: boolean,
  ) {
    this.playerIds = playerIds;
    this.scores = scores;
    this.initSameScoreToEachPlayer = initSameScoreToEachPlayer;
  }

  /**
   * @java game/rules/start/set/player/SetScore.java — eval(Context)
   *
   * Java: ActionSetScore(playerId, score, FALSE).apply(context) for each player.
   * TS-deferred: scores[] not available in applyToInitialState interface.
   */
  public applyToInitialState(
    _cells: number[],
    _whats: number[],
    _countAt: number[],
    _equipment: Equipment1to1,
    _numPlayers: number,
  ): void {
    // Deferred: State.scores[] not accessible via applyToInitialState.
    // Java: ActionSetScore(pid, score, Boolean.FALSE).apply(context) for each player.
    void this.playerIds;
    void this.scores;
    void this.initSameScoreToEachPlayer;
  }
}
