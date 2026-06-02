/**
 * ShowScoreType.ts
 *
 * @java metadata/graphics/show/ShowScoreType.java
 *
 * Defines the types of Show metadata for a score.
 */

/** @java metadata.graphics.show.ShowScoreType */
export const SHOW_SCORE_TYPES = [
  /** Whether the score should be shown only in certain situations. */
  "Score",
] as const;

/** @java metadata.graphics.show.ShowScoreType */
export type ShowScoreType = (typeof SHOW_SCORE_TYPES)[number];

/** True iff the given string is a valid ShowScoreType value. */
export function isShowScoreType(value: string): value is ShowScoreType {
  return (SHOW_SCORE_TYPES as readonly string[]).includes(value);
}
