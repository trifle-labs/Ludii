// @java Core/src/game/functions/booleans/all/AllGroupsType.java

// Java enum value only; runtime dispatch is implemented by All.ts / groups/*
// (AllGroupsType.java:8-11). No registry entry: enum declarations are not
// standalone ludemes in the current TS dispatcher.
export const ALL_GROUPS_TYPES = ["Groups"] as const;
export type AllGroupsType = (typeof ALL_GROUPS_TYPES)[number];
