// @java Core/src/game/functions/booleans/all/AllSimpleType.java

// Java enum values only; runtime dispatch is implemented by All.ts / simple/*
// (AllSimpleType.java:9-19). No registry entry: enum declarations are not
// standalone ludemes in the current TS dispatcher.
export const ALL_SIMPLE_TYPES = ["DiceUsed", "DiceEqual", "Passed"] as const;
export type AllSimpleType = (typeof ALL_SIMPLE_TYPES)[number];
