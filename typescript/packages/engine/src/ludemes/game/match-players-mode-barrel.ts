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
export * from "./match/Subgame1to1.js";
export * from "./match/Games1to1.js";
export * from "./match/Match1to1.js";

// players
export * from "./players/GamePlayer1to1.js";
export * from "./players/GamePlayers1to1.js";

// mode
export * from "./mode/Mode1to1.js";
