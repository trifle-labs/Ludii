/**
 * Defines special steps for describing tracks on the board.
 *
 * @java game/types/board/TrackStepType.java
 *
 * @remarks For example, a track may be defined as { 0 N Repeat E End }.
 */
export const TRACK_STEP_TYPES = [
  /** Off the track. */
  "Off",
  /** End of the track. */
  "End",
  /** Repeat stepping in the current direction. */
  "Repeat",
] as const;

/** @java game/types/board/TrackStepType.java — enum TrackStepType */
export type TrackStepType = (typeof TRACK_STEP_TYPES)[number];

/** True iff the given string is a valid TrackStepType value. */
export function isTrackStepType(value: string): value is TrackStepType {
  return (TRACK_STEP_TYPES as readonly string[]).includes(value);
}
