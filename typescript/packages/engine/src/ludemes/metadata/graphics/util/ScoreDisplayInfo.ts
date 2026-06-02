/**
 * ScoreDisplayInfo.ts
 *
 * @java metadata/graphics/util/ScoreDisplayInfo.java
 *
 * Display information for drawing scores.
 */

import type { WhenScoreType } from "./WhenScoreType.js";

/**
 * @java metadata.graphics.util.ScoreDisplayInfo
 */
export class ScoreDisplayInfo {
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
   * Default constructor — mirrors Java default constructor.
   * @java ScoreDisplayInfo()
   */
  constructor();

  /**
   * @param showScore        When the score should be shown.
   * @param roleType         Player whose index is to be matched.
   * @param scoreReplacement Replacement value to display instead of score.
   * @param scoreSuffix      Extra string to append to the score displayed.
   * @java ScoreDisplayInfo(WhenScoreType, RoleType, IntFunction, String)
   */
  constructor(
    showScore: WhenScoreType,
    roleType: string,
    scoreReplacement: unknown | null,
    scoreSuffix: string,
  );

  constructor(
    showScore?: WhenScoreType,
    roleType?: string,
    scoreReplacement?: unknown | null,
    scoreSuffix?: string,
  ) {
    this.showScore = showScore ?? "Always";
    this.roleType = roleType ?? "All";
    this.scoreReplacement = scoreReplacement ?? null;
    this.scoreSuffix = scoreSuffix ?? "";
  }
}
