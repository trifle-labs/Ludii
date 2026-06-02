/**
 * Defines possible "turtle steps" for describing walks through adjacent sites.
 *
 * @java game/types/board/StepType.java
 *
 * @remarks For example, the movement of a Chess knight may be described as
 *   (walkToSites { {F F R F} {F F L F} }).
 *   A walk cannot leave the playing area and return.
 */
export const STEP_TYPES = [
  /** Forward a step. */
  "F",
  /** Turn left a step. */
  "L",
  /** Turn right a step. */
  "R",
] as const;

/** @java game/types/board/StepType.java — enum StepType */
export type StepType = (typeof STEP_TYPES)[number];

/** True iff the given string is a valid StepType value. */
export function isStepType(value: string): value is StepType {
  return (STEP_TYPES as readonly string[]).includes(value);
}
