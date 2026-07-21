/**
 * Defines expected outcomes for each game.
 *
 * @java game/types/play/ResultType.java
 *
 * @remarks Tie means that everybody wins. Draw means that nobody wins.
 *
 * NOTE: The simplified `ResultType` union ("Win" | "Loss" | "Draw") in
 * `src/ludemes/base.ts` is intentionally kept for backward compat with
 * existing 1:1 ludeme classes. This file is the full Java-faithful enum.
 */
export const RESULT_TYPE_VALUES = [
  /** Somebody wins. */
  "Win",
  /** Somebody loses. */
  "Loss",
  /** Nobody wins. */
  "Draw",
  /** Everybody wins. */
  "Tie",
  /** Game abandoned, typically for being too long. */
  "Abandon",
  /** Game stopped due to run-time error. */
  "Crash",
] as const;

/** @java game/types/play/ResultType.java — enum ResultType (full set) */
export type ResultTypeFull = (typeof RESULT_TYPE_VALUES)[number];

/** True iff the given string is a valid ResultTypeFull value. */
export function isResultTypeFull(value: string): value is ResultTypeFull {
  return (RESULT_TYPE_VALUES as readonly string[]).includes(value);
}
