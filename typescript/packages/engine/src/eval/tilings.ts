/**
 * Board tilings for the ludeme interpreter.
 *
 * Java parity:
 * - Core/src/game/types/board/TilingMethod and the `(hex …)` / `(tri …)` /
 *   `(square …)` board builders in game.functions.graph.generators.basis.*
 *
 * The interpreter steps the board as a 2-D integer lattice: every neighbour
 * is reached by adding a `(dx, dy)` offset to a site's `(x, y)` coordinate
 * and mapping back through `InterpBoard.siteAt`. That model is coordinate-
 * agnostic, so a hex board is just a different *direction set* over the same
 * lattice using axial coordinates — `q` along x, `r` along y. A `Tiling`
 * therefore only has to supply the compass/relative/grouped offset tables;
 * non-rectangular shapes (the Hexagon outline) are handled by an on-board
 * mask computed at board-construction time, leaving the stepping code below
 * unchanged.
 */

import type { Dir } from "./eval-context.js";

export type TilingKind = "square" | "hex" | "tri";

/**
 * The direction vocabulary of a tiling: absolute compass offsets, the
 * player-relative family (canonical North facing), and the named groups
 * (`Orthogonal` / `Diagonal` / `Adjacent` / `All`).
 */
export interface Tiling {
  readonly kind: TilingKind;
  readonly absolute: Readonly<Record<string, Dir>>;
  readonly relative: Readonly<Record<string, Dir>>;
  readonly groups: Readonly<Record<string, readonly Dir[]>>;
}

// ---- square -----------------------------------------------------------------

const SQUARE_ABSOLUTE: Record<string, Dir> = {
  N: { dx: 0, dy: 1 },
  S: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  W: { dx: -1, dy: 0 },
  NE: { dx: 1, dy: 1 },
  NW: { dx: -1, dy: 1 },
  SE: { dx: 1, dy: -1 },
  SW: { dx: -1, dy: -1 },
};

const SQUARE_RELATIVE: Record<string, Dir> = {
  Forward: { dx: 0, dy: 1 },
  Forwards: { dx: 0, dy: 1 },
  Backward: { dx: 0, dy: -1 },
  Backwards: { dx: 0, dy: -1 },
  Rightward: { dx: 1, dy: 0 },
  Rightwards: { dx: 1, dy: 0 },
  Leftward: { dx: -1, dy: 0 },
  Leftwards: { dx: -1, dy: 0 },
  FR: { dx: 1, dy: 1 },
  FL: { dx: -1, dy: 1 },
  BR: { dx: 1, dy: -1 },
  BL: { dx: -1, dy: -1 },
};

function pick(table: Record<string, Dir>, names: string[]): Dir[] {
  const out: Dir[] = [];
  for (const n of names) {
    const d = table[n];
    if (d) out.push(d);
  }
  return out;
}

const SQUARE_ORTHOGONAL = pick(SQUARE_ABSOLUTE, ["N", "E", "S", "W"]);
const SQUARE_DIAGONAL = pick(SQUARE_ABSOLUTE, ["NE", "SE", "SW", "NW"]);
const SQUARE_ALL = [...SQUARE_ORTHOGONAL, ...SQUARE_DIAGONAL];

export const SQUARE_TILING: Tiling = {
  kind: "square",
  absolute: SQUARE_ABSOLUTE,
  relative: SQUARE_RELATIVE,
  groups: {
    Orthogonal: SQUARE_ORTHOGONAL,
    Diagonal: SQUARE_DIAGONAL,
    // Java (Face.stepsTo): on a square board `Adjacent` tags both edge- and
    // vertex-sharing neighbours, i.e. all 8 directions.
    Adjacent: SQUARE_ALL,
    All: SQUARE_ALL,
  },
};

// ---- hex (axial, pointy-topped) --------------------------------------------

/**
 * Pointy-topped hexes in axial coordinates: `q` increases east, `r`
 * increases north. The six edge-neighbours are the canonical axial unit
 * vectors. A pointy-top hex has no due-N/S neighbour, so the compass set is
 * E/W plus the four corner diagonals.
 */
const HEX_ABSOLUTE: Record<string, Dir> = {
  E: { dx: 1, dy: 0 },
  W: { dx: -1, dy: 0 },
  NE: { dx: 0, dy: 1 },
  NW: { dx: -1, dy: 1 },
  SE: { dx: 1, dy: -1 },
  SW: { dx: 0, dy: -1 },
};

const HEX_RELATIVE: Record<string, Dir> = {
  Forward: { dx: 0, dy: 1 },
  Forwards: { dx: 0, dy: 1 },
  Backward: { dx: 0, dy: -1 },
  Backwards: { dx: 0, dy: -1 },
  Rightward: { dx: 1, dy: 0 },
  Rightwards: { dx: 1, dy: 0 },
  Leftward: { dx: -1, dy: 0 },
  Leftwards: { dx: -1, dy: 0 },
};

const HEX_ALL = pick(HEX_ABSOLUTE, ["E", "NE", "NW", "W", "SW", "SE"]);

export const HEX_TILING: Tiling = {
  kind: "hex",
  absolute: HEX_ABSOLUTE,
  relative: HEX_RELATIVE,
  groups: {
    // A hex grid has no orthogonal/diagonal split: every group keyword maps
    // to the six edge-adjacent neighbours.
    Orthogonal: HEX_ALL,
    Diagonal: HEX_ALL,
    Adjacent: HEX_ALL,
    All: HEX_ALL,
  },
};

// ---- tri (triangular vertex lattice) ---------------------------------------

/**
 * Triangular tiling, vertex mode — which is what essentially every corpus
 * `(tri …)` game uses. A triangular lattice is a square lattice with one
 * diagonal added, so it embeds in the integer grid with a uniform six-
 * neighbour set: the four orthogonals plus the NE/SW diagonal. (The NW/SE
 * diagonal is the longer √3 chord and is *not* an edge.)
 */
const TRI_ABSOLUTE: Record<string, Dir> = {
  N: { dx: 0, dy: 1 },
  S: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  W: { dx: -1, dy: 0 },
  NE: { dx: 1, dy: 1 },
  SW: { dx: -1, dy: -1 },
};

const TRI_RELATIVE: Record<string, Dir> = {
  Forward: { dx: 0, dy: 1 },
  Forwards: { dx: 0, dy: 1 },
  Backward: { dx: 0, dy: -1 },
  Backwards: { dx: 0, dy: -1 },
  Rightward: { dx: 1, dy: 0 },
  Rightwards: { dx: 1, dy: 0 },
  Leftward: { dx: -1, dy: 0 },
  Leftwards: { dx: -1, dy: 0 },
};

const TRI_ALL = pick(TRI_ABSOLUTE, ["N", "S", "E", "W", "NE", "SW"]);

export const TRI_TILING: Tiling = {
  kind: "tri",
  absolute: TRI_ABSOLUTE,
  relative: TRI_RELATIVE,
  groups: {
    Orthogonal: TRI_ALL,
    Diagonal: TRI_ALL,
    Adjacent: TRI_ALL,
    All: TRI_ALL,
  },
};

// ---- board masks ------------------------------------------------------------

/** A bounding box plus an on-board mask for a non-rectangular tiling. */
export interface BoardMask {
  readonly width: number;
  readonly height: number;
  /** width*height flags; index `y*width + x`. Undefined ⇒ fully filled. */
  readonly onBoard?: readonly boolean[];
}

/**
 * Coerce a board dimension to a positive integer. Non-finite inputs (a NaN
 * left by an unresolved option or an unsupported size expression) fall back
 * to `fallback` so the mask allocation never throws "Invalid array length".
 */
function safeDim(value: number, fallback = 3): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

/**
 * A regular hexagonal outline of side `side` laid on an axial bounding box.
 * Cell count is `3·side² − 3·side + 1` (Java's Hexagon shape). The box is
 * `(2·side − 1)²`; cells outside the hex radius are masked off.
 */
export function hexagonMask(side: number): BoardMask {
  const n = safeDim(side);
  const radius = n - 1;
  const span = 2 * n - 1;
  const onBoard = new Array<boolean>(span * span);
  for (let r = 0; r < span; r += 1) {
    for (let q = 0; q < span; q += 1) {
      const qa = q - radius;
      const ra = r - radius;
      // axial hex distance from centre ≤ radius
      const inside =
        Math.abs(qa) <= radius &&
        Math.abs(ra) <= radius &&
        Math.abs(qa + ra) <= radius;
      onBoard[r * span + q] = inside;
    }
  }
  return { width: span, height: span, onBoard };
}

/** A rhombus / parallelogram of hexes: `cols × rows`, fully filled. */
export function rhombusMask(cols: number, rows: number): BoardMask {
  return {
    width: safeDim(cols),
    height: safeDim(rows),
  };
}

/**
 * Triangle outline of side `n` on the triangular lattice. Bounding box n×n,
 * lower-triangular (a cell is on-board where `x ≥ y`). Cell count n(n+1)/2.
 */
export function triangleMask(n: number): BoardMask {
  const N = safeDim(n);
  const onBoard = new Array<boolean>(N * N);
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      onBoard[y * N + x] = x >= y;
    }
  }
  return { width: N, height: N, onBoard };
}

/**
 * Hexagonal outline of side `n` on the triangular lattice. Bounding box
 * `(2n−1)²`; cell count `3n²−3n+1`.
 */
export function triHexagonMask(n: number): BoardMask {
  const N = safeDim(n);
  const span = 2 * N - 1;
  const half = N - 1;
  const onBoard = new Array<boolean>(span * span);
  for (let y = 0; y < span; y += 1) {
    for (let x = 0; x < span; x += 1) {
      onBoard[y * span + x] = x <= half + y && y - x <= half;
    }
  }
  return { width: span, height: span, onBoard };
}

/**
 * Rectangular strip of `rows × cols` on the triangular lattice. The rows
 * shear by half a cell each step, so the bounding box is `rows + cols` wide
 * with a staircase mask.
 */
export function triRectangleMask(rows: number, cols: number): BoardMask {
  const r = safeDim(rows);
  const c = safeDim(cols);
  const w = r + c;
  const onBoard = new Array<boolean>(r * w);
  for (let y = 0; y < r; y += 1) {
    for (let x = 0; x < w; x += 1) {
      onBoard[y * w + x] = x >= Math.ceil(y / 2) && x < c + Math.floor(y / 2);
    }
  }
  return { width: w, height: r, onBoard };
}
