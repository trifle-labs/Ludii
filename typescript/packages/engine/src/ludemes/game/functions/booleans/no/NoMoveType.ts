// @java Core/src/game/functions/booleans/no/NoMoveType.java

// Java enum value only; runtime dispatch is implemented by No.ts / moves/*
// (NoMoveType.java:6-9). No registry entry: enum declarations are not
// standalone ludemes in the current TS dispatcher.
export const NO_MOVE_TYPES = ["Moves"] as const;
export type NoMoveType = (typeof NO_MOVE_TYPES)[number];
