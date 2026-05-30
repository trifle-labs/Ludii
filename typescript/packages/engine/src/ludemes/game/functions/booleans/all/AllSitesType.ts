// @java Core/src/game/functions/booleans/all/AllSitesType.java

// Java enum values only; runtime dispatch is implemented by All.ts / sites/*
// (AllSitesType.java:9-15). No registry entry: enum declarations are not
// standalone ludemes in the current TS dispatcher.
export const ALL_SITES_TYPES = ["Sites", "Different"] as const;
export type AllSitesType = (typeof ALL_SITES_TYPES)[number];
