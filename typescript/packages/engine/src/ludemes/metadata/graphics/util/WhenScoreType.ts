/**
 * WhenScoreType.ts
 *
 * @java metadata/graphics/util/WhenScoreType.java
 *
 * Specifies when to show player scores to the user.
 */

/** @java metadata.graphics.util.WhenScoreType */
export const WHEN_SCORE_TYPES = [
  /** Always show player scores. */
  "Always",

  /** Never show player scores. */
  "Never",

  /** Only show player scores at end of game. */
  "AtEnd",
] as const;

/** @java metadata.graphics.util.WhenScoreType */
export type WhenScoreType = (typeof WHEN_SCORE_TYPES)[number];

/** True iff the given string is a valid WhenScoreType value. */
export function isWhenScoreType(value: string): value is WhenScoreType {
  return (WHEN_SCORE_TYPES as readonly string[]).includes(value);
}
