/**
 * Barrel: match / players / mode — 1:1 structural port.
 *
 * These are DATA/STRUCTURE classes mirroring the Java packages:
 *   game/match/       — Subgame, Games, Match
 *   game/players/     — Player (as GamePlayer), Players (as GamePlayers)
 *   game/mode/        — Mode
 *
 * They do NOT register in the 1:1 eval registry (they are not eval-ludemes).
 * Import this barrel to make the classes available for the compiler and
 * other ludeme modules.
 *
 * @slice match/** players/** mode/** — Java game/{match,players,mode} → TS
 */

// match
export * from "./match/Subgame.js";
export * from "./match/Games.js";
export * from "./match/Match.js";

// players
export * from "./players/GamePlayer.js";
export * from "./players/GamePlayers.js";

// mode
export * from "./mode/Mode.js";
