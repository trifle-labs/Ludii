/**
 * Defines the different stores for a mancala board.
 *
 * @java game/types/board/StoreType.java
 */
export const STORE_TYPES = [
  /** No store. */
  "None",
  /** Outer store. */
  "Outer",
  /** Inner store. */
  "Inner",
] as const;

/** @java game/types/board/StoreType.java — enum StoreType */
export type StoreType = (typeof STORE_TYPES)[number];

/** True iff the given string is a valid StoreType value. */
export function isStoreType(value: string): value is StoreType {
  return (STORE_TYPES as readonly string[]).includes(value);
}
