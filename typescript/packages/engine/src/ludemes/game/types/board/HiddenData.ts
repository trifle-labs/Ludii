/**
 * Defines possible data to be hidden.
 *
 * @java game/types/board/HiddenData.java
 */
export const HIDDEN_DATA_VALUES = [
  /** The id of the component on the location is hidden. */
  "What",
  /** The owner of the component of the location is hidden. */
  "Who",
  /** The local state of the location is hidden. */
  "State",
  /** The number of components on the location is hidden. */
  "Count",
  /** The rotation of the component on the location is hidden. */
  "Rotation",
  /** The piece value of the component on the location is hidden. */
  "Value",
] as const;

/** @java game/types/board/HiddenData.java — enum HiddenData */
export type HiddenData = (typeof HIDDEN_DATA_VALUES)[number];

/** True iff the given string is a valid HiddenData value. */
export function isHiddenData(value: string): value is HiddenData {
  return (HIDDEN_DATA_VALUES as readonly string[]).includes(value);
}
