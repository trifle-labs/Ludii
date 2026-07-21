/**
 * Defines known tiling types for boards.
 *
 * @java game/types/board/BasisType.java
 */
export const BASIS_TYPES = [
  /** No tiling; custom graph. */
  "NoBasis",
  /** Triangular tiling. */
  "Triangular",
  /** Square tiling. */
  "Square",
  /** Hexagonal tiling. */
  "Hexagonal",
  /** Semi-regular tiling made up of hexagons surrounded by triangles. */
  "T33336",
  /** Semi-regular tiling made up of alternating rows of squares and triangles. */
  "T33344",
  /** Semi-regular tiling made up of squares and pairs of triangles. */
  "T33434",
  /** Rhombitrihexahedral tiling (e.g. Kensington). */
  "T3464",
  /** Semi-regular tiling 3.6.3.6 made up of hexagons with interstitial triangles. */
  "T3636",
  /** Semi-regular tiling made up of squares, hexagons and dodecagons. */
  "T4612",
  /** Semi-regular tiling 4.8.8. made up of octagons with interstitial squares. */
  "T488",
  /** Semi-regular tiling made up of triangles and dodecagons. */
  "T31212",
  /** Tiling 3.3.3.3.3.3,3.3.4.3.4. */
  "T333333_33434",
  /** Square pyramidal tiling (e.g. Shibumi). */
  "SquarePyramidal",
  /** Hexagonal pyramidal tiling. */
  "HexagonalPyramidal",
  /** Concentric tiling (e.g. Morris boards, wheel boards, ...). */
  "Concentric",
  /** Circular tiling (e.g. Round Merels). */
  "Circle",
  /** Spiral tiling (e.g. Mehen). */
  "Spiral",
  /** Tiling derived from the weak dual of a graph. */
  "Dual",
  /** Brick tiling using 1x2 rectangular brick tiles. */
  "Brick",
  /** Mesh formed by random spread of points within an outline shape. */
  "Mesh",
  /** Morris tiling with concentric square rings and empty centre. */
  "Morris",
  /** Tiling on a square grid based on Celtic knotwork. */
  "Celtic",
  /** Quadhex board consisting of a hexagon tessellated by quadrilaterals (e.g. Three Player Chess). */
  "QuadHex",
] as const;

/** @java game/types/board/BasisType.java — enum BasisType */
export type BasisType = (typeof BASIS_TYPES)[number];

/** True iff the given string is a valid BasisType value. */
export function isBasisType(value: string): value is BasisType {
  return (BASIS_TYPES as readonly string[]).includes(value);
}
