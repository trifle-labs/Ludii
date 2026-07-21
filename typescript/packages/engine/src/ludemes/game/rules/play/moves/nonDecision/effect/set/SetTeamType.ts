// @java Core/src/game/rules/play/moves/nonDecision/effect/set/SetTeamType.java

/**
 * Defines teams that can be set.
 *
 * Faithful 1:1 transliteration of game.rules.play.moves.nonDecision.effect.set.SetTeamType (Java enum).
 *
 * @author Eric.Piette (Java original)
 * @java game/rules/play/moves/nonDecision/effect/set/SetTeamType.java
 */
export const SET_TEAM_TYPE_VALUES = [
  /** Set a team. */
  "Team",
] as const;

/** @java game/rules/play/moves/nonDecision/effect/set/SetTeamType.java — enum SetTeamType */
export type SetTeamType = (typeof SET_TEAM_TYPE_VALUES)[number];

/** True iff the given string is a valid SetTeamType value. */
export function isSetTeamType(value: string): value is SetTeamType {
  return (SET_TEAM_TYPE_VALUES as readonly string[]).includes(value);
}
