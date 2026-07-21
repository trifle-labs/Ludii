/**
 * ShowScore.ts
 *
 * @java metadata/graphics/show/score/ShowScore.java
 *
 * Indicates whether the score should be shown only in certain situations.
 */

import type { WhenScoreType } from "../../util/WhenScoreType.js";

/**
 * @java metadata.graphics.show.score.ShowScore
 */
export class ShowScore {
  /** When the score should be shown. */
  readonly showScore: WhenScoreType;

  /** Player whose index is to be matched (string mirror of Java RoleType). */
  readonly roleType: string;

  /**
   * Replacement value to display instead of score.
   * Java type: IntFunction — stored as opaque reference; null if absent.
   */
  readonly scoreReplacement: unknown | null;

  /** Extra string to append to the score displayed. */
  readonly scoreSuffix: string;

  /**
   * @param showScore        When the score should be shown [Always].
   * @param roleType         Player whose index is to be matched [All].
   * @param scoreReplacement Replacement value to display instead of score.
   * @param scoreSuffix      Extra string to append to the score displayed [""].
   * @java ShowScore(WhenScoreType, RoleType, IntFunction, String)
   */
  constructor(
    showScore: WhenScoreType | null,
    roleType: string | null,
    scoreReplacement: unknown | null,
    scoreSuffix: string | null,
  ) {
    this.showScore = showScore ?? "Always";
    this.roleType = roleType ?? "All";
    this.scoreReplacement = scoreReplacement ?? null;
    this.scoreSuffix = scoreSuffix ?? "";
  }

  /** @java GraphicsItem.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}
