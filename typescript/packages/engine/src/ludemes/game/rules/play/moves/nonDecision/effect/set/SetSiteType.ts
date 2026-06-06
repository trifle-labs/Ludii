// @java Core/src/game/rules/play/moves/nonDecision/effect/set/SetSiteType.java

/**
 * Defines properties of sites that can be set in the game state.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.set.SetSiteType (Java enum).
 *
 * @java game/rules/play/moves/nonDecision/effect/set/SetSiteType.java
 */
export const SET_SITE_TYPE_VALUES = [
  /** Set the count value for specified sites. */
  "Count",

  /** Set the local state value for specified sites. */
  "State",

  /** Set the piece value for specified sites. */
  "Value",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/set/SetSiteType.java — enum SetSiteType */
export type SetSiteType = (typeof SET_SITE_TYPE_VALUES)[number];

/** True iff the given string is a valid SetSiteType value. */
export function isSetSiteType(value: string): value is SetSiteType {
  return (SET_SITE_TYPE_VALUES as readonly string[]).includes(value);
}
