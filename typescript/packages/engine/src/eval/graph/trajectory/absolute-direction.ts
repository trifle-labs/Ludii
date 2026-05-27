// @java Core/src/game/util/directions/AbsoluteDirection.java AbsoluteDirection
//
// Faithful port of Java's AbsoluteDirection enum. ORDINALS MUST MATCH the Java
// declaration order exactly: they index into Steps/Radials per-direction arrays
// and are stored as bits in a Step's `directions` BitSet, so any reordering
// silently corrupts trajectory parity. See PARITY.md (roadmap item 2).
//
// 51 values total: 13 meta (All..Support), 16 compass (N..NNE), 4 rotational
// (CW/CCW/In/Out), 9 upward (U..UNW), 9 downward (D..DNW).

/** Absolute movement/connectivity directions, ordinal-faithful to Java. */
export enum AbsoluteDirection {
  All = 0,
  Angled = 1,
  Adjacent = 2,
  Axial = 3,
  Orthogonal = 4,
  Diagonal = 5,
  OffDiagonal = 6,
  SameLayer = 7,
  Upward = 8,
  Downward = 9,
  Rotational = 10,
  Base = 11,
  Support = 12,
  // Intercardinal (16-compass)
  N = 13,
  E = 14,
  S = 15,
  W = 16,
  NE = 17,
  SE = 18,
  NW = 19,
  SW = 20,
  NNW = 21,
  WNW = 22,
  WSW = 23,
  SSW = 24,
  SSE = 25,
  ESE = 26,
  ENE = 27,
  NNE = 28,
  // Rotational
  CW = 29,
  CCW = 30,
  In = 31,
  Out = 32,
  // Spatial — upward
  U = 33,
  UN = 34,
  UNE = 35,
  UE = 36,
  USE = 37,
  US = 38,
  USW = 39,
  UW = 40,
  UNW = 41,
  // Spatial — downward
  D = 42,
  DN = 43,
  DNE = 44,
  DE = 45,
  DSE = 46,
  DS = 47,
  DSW = 48,
  DW = 49,
  DNW = 50,
}

/** Number of distinct AbsoluteDirection values (= Java AbsoluteDirection.values().length). */
export const NUM_DIRECTIONS = 51;

/** All directions in ordinal order — the analogue of `AbsoluteDirection.values()`. */
export const ALL_DIRECTIONS: readonly AbsoluteDirection[] = Array.from(
  { length: NUM_DIRECTIONS },
  (_, i) => i as AbsoluteDirection,
);

const NAMES: readonly string[] = [
  "All", "Angled", "Adjacent", "Axial", "Orthogonal", "Diagonal", "OffDiagonal",
  "SameLayer", "Upward", "Downward", "Rotational", "Base", "Support",
  "N", "E", "S", "W", "NE", "SE", "NW", "SW",
  "NNW", "WNW", "WSW", "SSW", "SSE", "ESE", "ENE", "NNE",
  "CW", "CCW", "In", "Out",
  "U", "UN", "UNE", "UE", "USE", "US", "USW", "UW", "UNW",
  "D", "DN", "DNE", "DE", "DSE", "DS", "DSW", "DW", "DNW",
];

const BY_NAME = new Map<string, AbsoluteDirection>(
  NAMES.map((n, i) => [n, i as AbsoluteDirection]),
);

/** Direction name (e.g. "NE"), matching Java's enum `name()`. */
export function directionName(dir: AbsoluteDirection): string {
  return NAMES[dir] ?? `?${dir}`;
}

/** Look up a direction by its Java name, or undefined if unknown. */
export function directionByName(name: string): AbsoluteDirection | undefined {
  return BY_NAME.get(name);
}

// @java Core/src/game/util/directions/AbsoluteDirection.java specific
/**
 * Whether the direction is a specific direction (e.g. N) as opposed to a class
 * of directions (e.g. Adjacent). Java derives this from `convert(dir) != null`;
 * convert returns a DirectionFacing for every compass/rotational/spatial value
 * (ordinal >= 13) and null for the meta values (All..Support, ordinal < 13).
 */
export function specific(dir: AbsoluteDirection): boolean {
  return dir >= AbsoluteDirection.N;
}
