/**
 * Defines that a track is used.
 *
 * @java game/types/board/TrackType.java
 */
export const TRACK_TYPES = [
  /** Track. */
  "Track",
] as const;

/** @java game/types/board/TrackType.java — enum TrackType */
export type TrackType = (typeof TRACK_TYPES)[number];

/** True iff the given string is a valid TrackType value. */
export function isTrackType(value: string): value is TrackType {
  return (TRACK_TYPES as readonly string[]).includes(value);
}
