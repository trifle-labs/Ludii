// @java Core/src/game/functions/booleans/no/NoPieceType.java

// Java enum value only; runtime dispatch is implemented by No.ts / pieces/*
// (NoPieceType.java:6-9). No registry entry: enum declarations are not
// standalone ludemes in the current TS dispatcher.
export const NO_PIECE_TYPES = ["Pieces"] as const;
export type NoPieceType = (typeof NO_PIECE_TYPES)[number];
