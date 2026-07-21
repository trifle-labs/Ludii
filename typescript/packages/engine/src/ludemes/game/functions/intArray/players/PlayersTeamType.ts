// @java Core/src/game/functions/intArray/players/PlayersTeamType.java

/**
 * Defines the types of team which can be iterated.
 *
 * @java game/functions/intArray/players/PlayersTeamType.java
 *
 * Java parity: enum PlayersTeamType with Team1..Team16, each carrying an
 * integer index via index().
 */

/**
 * Enum of team types for player-team iteration.
 * @java game.functions.intArray.players.PlayersTeamType
 */
export enum PlayersTeamType {
  Team1  = "Team1",
  Team2  = "Team2",
  Team3  = "Team3",
  Team4  = "Team4",
  Team5  = "Team5",
  Team6  = "Team6",
  Team7  = "Team7",
  Team8  = "Team8",
  Team9  = "Team9",
  Team10 = "Team10",
  Team11 = "Team11",
  Team12 = "Team12",
  Team13 = "Team13",
  Team14 = "Team14",
  Team15 = "Team15",
  Team16 = "Team16",
}

/** @java PlayersTeamType.index() — returns the numeric team index (1-based). */
export function playersTeamTypeIndex(t: PlayersTeamType): number {
  // The enum values are "Team1"..,"Team16"; strip the prefix to get the number.
  return parseInt(t.slice(4), 10);
}
