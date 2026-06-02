/**
 * Defines supported tiling types for boardless games.
 *
 * @java game/types/board/TilingBoardlessType.java
 */
export const TILING_BOARDLESS_TYPES = [
  /** Square tiling. */
  "Square",
  /** Triangular tiling. */
  "Triangular",
  /** Hexagonal tiling. */
  "Hexagonal",
] as const;

/** @java game/types/board/TilingBoardlessType.java — enum TilingBoardlessType */
export type TilingBoardlessType = (typeof TILING_BOARDLESS_TYPES)[number];

/** True iff the given string is a valid TilingBoardlessType value. */
export function isTilingBoardlessType(value: string): value is TilingBoardlessType {
  return (TILING_BOARDLESS_TYPES as readonly string[]).includes(value);
}
