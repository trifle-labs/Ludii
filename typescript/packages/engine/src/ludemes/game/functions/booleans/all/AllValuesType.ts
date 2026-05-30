// @java Core/src/game/functions/booleans/all/AllValuesType.java

// Java enum value only; runtime dispatch is implemented by All.ts / values/*
// (AllValuesType.java:9-12). No registry entry: enum declarations are not
// standalone ludemes in the current TS dispatcher.
export const ALL_VALUES_TYPES = ["Values"] as const;
export type AllValuesType = (typeof ALL_VALUES_TYPES)[number];
