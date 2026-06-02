// @java Core/src/game/types/play/RoleType.java
//
// Faithful port of Java RoleType enum as a TypeScript const enum + helpers.
// Only the values actually needed by util/end (Payoff, Score) and util/math
// (Pair) are enumerated; the full list is provided for completeness.

/** @java game.types.play.RoleType */
export enum RoleType {
  Neutral = 0,
  P1 = 1,
  P2 = 2,
  P3 = 3,
  P4 = 4,
  P5 = 5,
  P6 = 6,
  P7 = 7,
  P8 = 8,
  P9 = 9,
  P10 = 10,
  P11 = 11,
  P12 = 12,
  P13 = 13,
  P14 = 14,
  P15 = 15,
  P16 = 16,
  // Team roles share ordinal space — offset to avoid collision
  Team1 = 101,
  Team2 = 102,
  Team3 = 103,
  Team4 = 104,
  Team5 = 105,
  Team6 = 106,
  Team7 = 107,
  Team8 = 108,
  Team9 = 109,
  Team10 = 110,
  Team11 = 111,
  Team12 = 112,
  Team13 = 113,
  Team14 = 114,
  Team15 = 115,
  Team16 = 116,
  TeamMover = 200,
  Each = 201,
  Shared = 202,
  All = 203,
  Mover = 204,
  Next = 205,
  Prev = 206,
  NonMover = 207,
  Enemy = 208,
  Friend = 209,
  Ally = 210,
  Player = 211,
}

/** @java RoleType.owner() — the player index (or -1 if not a concrete player). */
export function roleTypeOwner(role: RoleType): number {
  if (role >= RoleType.P1 && role <= RoleType.P16) return role;
  return -1; // Constants.NOBODY
}

/** @java RoleType.isTeam(RoleType) */
export function isTeamRole(role: RoleType): boolean {
  return role >= RoleType.Team1 && role <= RoleType.Team16;
}
