/**
 * Defines the possible role types of the players in a game.
 *
 * @java game/types/play/RoleType.java
 *
 * @remarks Each player will have at least one, and possibly more than one,
 * role type in a game. For example, players may belong to permanent or
 * temporary teams, or may be denoted as the Ally or Enemy of a given
 * player, etc.
 *
 * NOTE: The simplified `RoleType` union in `src/ludemes/base.ts` is
 * intentionally kept for backward compat with existing 1:1 ludeme classes.
 * This file is the full Java-faithful enum.
 */

/** Java Constants.NOBODY = -1 */
const NOBODY = -1;

/**
 * @java game/types/play/RoleType.java — enum RoleType
 * Full set of role types matching Java enum members and their owner() values.
 */
export const RoleTypeValues = {
  /** Neutral role, owned by nobody. */
  Neutral:    { owner: 0 },
  /** Player 1. */
  P1:         { owner: 1 },
  /** Player 2. */
  P2:         { owner: 2 },
  /** Player 3. */
  P3:         { owner: 3 },
  /** Player 4. */
  P4:         { owner: 4 },
  /** Player 5. */
  P5:         { owner: 5 },
  /** Player 6. */
  P6:         { owner: 6 },
  /** Player 7. */
  P7:         { owner: 7 },
  /** Player 8. */
  P8:         { owner: 8 },
  /** Player 9. */
  P9:         { owner: 9 },
  /** Player 10. */
  P10:        { owner: 10 },
  /** Player 11. */
  P11:        { owner: 11 },
  /** Player 12. */
  P12:        { owner: 12 },
  /** Player 13. */
  P13:        { owner: 13 },
  /** Player 14. */
  P14:        { owner: 14 },
  /** Player 15. */
  P15:        { owner: 15 },
  /** Player 16. */
  P16:        { owner: 16 },
  /** Team 1 (index 1). */
  Team1:      { owner: 1 },
  /** Team 2 (index 2). */
  Team2:      { owner: 2 },
  /** Team 3 (index 3). */
  Team3:      { owner: 3 },
  /** Team 4 (index 4). */
  Team4:      { owner: 4 },
  /** Team 5 (index 5). */
  Team5:      { owner: 5 },
  /** Team 6 (index 6). */
  Team6:      { owner: 6 },
  /** Team 7 (index 7). */
  Team7:      { owner: 7 },
  /** Team 8 (index 8). */
  Team8:      { owner: 8 },
  /** Team 9 (index 9). */
  Team9:      { owner: 9 },
  /** Team 10 (index 10). */
  Team10:     { owner: 10 },
  /** Team 11 (index 11). */
  Team11:     { owner: 11 },
  /** Team 12 (index 12). */
  Team12:     { owner: 12 },
  /** Team 13 (index 13). */
  Team13:     { owner: 13 },
  /** Team 14 (index 14). */
  Team14:     { owner: 14 },
  /** Team 15 (index 15). */
  Team15:     { owner: 15 },
  /** Team 16 (index 16). */
  Team16:     { owner: 16 },
  /** Team of the mover (index Mover). */
  TeamMover:  { owner: NOBODY },
  /** Applies to each player (for iteration). */
  Each:       { owner: NOBODY },
  /** Shared role, shared by all players. */
  Shared:     { owner: NOBODY },
  /** All players. */
  All:        { owner: NOBODY },
  /** Player who is moving. */
  Mover:      { owner: NOBODY },
  /** Player who is moving next turn. */
  Next:       { owner: NOBODY },
  /** Player who made the previous decision move. */
  Prev:       { owner: NOBODY },
  /** Players who are not moving. */
  NonMover:   { owner: NOBODY },
  /** Enemy players. */
  Enemy:      { owner: NOBODY },
  /** Friend players (Mover + Allies). */
  Friend:     { owner: NOBODY },
  /** Ally players. */
  Ally:       { owner: NOBODY },
  /** Placeholder for iterator over all players, e.g. from end.ForEach. */
  Player:     { owner: NOBODY },
} as const;

/** The full set of role type name strings. @java game/types/play/RoleType.java */
export type RoleTypeFull = keyof typeof RoleTypeValues;

/** True iff the given string is a valid RoleTypeFull value. */
export function isRoleTypeFull(value: string): value is RoleTypeFull {
  return Object.prototype.hasOwnProperty.call(RoleTypeValues, value);
}

/**
 * @java game/types/play/RoleType.java — owner()
 * Returns the owner index for this role (0 = Neutral, -1 = NOBODY for contextual roles).
 */
export function roleTypeOwner(role: RoleTypeFull): number {
  return RoleTypeValues[role].owner;
}

/**
 * @java game/types/play/RoleType.java — isTeam(RoleType)
 * Returns true if the role type is about a team.
 */
export function isTeamRole(role: RoleTypeFull): boolean {
  return role.startsWith("Team");
}

/**
 * @java game/types/play/RoleType.java — manyIds(RoleType)
 * Returns true if the role type can correspond to many players.
 */
export function manyIds(role: RoleTypeFull): boolean {
  return (
    isTeamRole(role) ||
    role === "Ally" ||
    role === "Enemy" ||
    role === "NonMover" ||
    role === "All" ||
    role === "Friend"
  );
}

/**
 * @java game/types/play/RoleType.java — roleForPlayerId(int)
 * Returns the RoleType corresponding to the given 1-based player index.
 * Returns Neutral for out-of-range values.
 */
export function roleForPlayerId(pid: number): RoleTypeFull {
  if (pid >= 1 && pid <= 16) {
    return `P${pid}` as RoleTypeFull;
  }
  return "Neutral";
}
