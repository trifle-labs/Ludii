// @java Core/src/game/util/directions/CompassDirection.java
//
// 16-point compass rose implementing DirectionFacing.
// Ordinal order is faithful to Java: N=0, NNE=1, NE=2, ENE=3, E=4, ESE=5,
// SE=6, SSE=7, S=8, SSW=9, SW=10, WSW=11, W=12, WNW=13, NW=14, NNW=15.
// The LEFT/RIGHT/LEFTWARD/RIGHTWARD/OPPOSITE tables are copied verbatim
// from the Java static initialisers.

import type { DirectionFacing } from "./DirectionFacing.js";
import { DirectionUniqueName } from "./DirectionUniqueName.js";
import { AbsoluteDirection } from "../../../../eval/graph/trajectory/absolute-direction.js";

/** @java game.util.directions.CompassDirection */
export enum CompassDirection {
  N = 0,
  NNE = 1,
  NE = 2,
  ENE = 3,
  E = 4,
  ESE = 5,
  SE = 6,
  SSE = 7,
  S = 8,
  SSW = 9,
  SW = 10,
  WSW = 11,
  W = 12,
  WNW = 13,
  NW = 14,
  NNW = 15,
}

// @java CompassDirection static { LEFT = ... }
const LEFT: CompassDirection[] = [
  CompassDirection.NNW, CompassDirection.N, CompassDirection.NNE, CompassDirection.NE,
  CompassDirection.ENE, CompassDirection.E, CompassDirection.ESE, CompassDirection.SE,
  CompassDirection.SSE, CompassDirection.S, CompassDirection.SSW, CompassDirection.SW,
  CompassDirection.WSW, CompassDirection.W, CompassDirection.WNW, CompassDirection.NW,
];
// @java CompassDirection static { LEFTWARD = ... }
const LEFTWARD: CompassDirection[] = [
  CompassDirection.W, CompassDirection.WNW, CompassDirection.NW, CompassDirection.NNW,
  CompassDirection.N, CompassDirection.NNE, CompassDirection.NE, CompassDirection.ENE,
  CompassDirection.E, CompassDirection.ESE, CompassDirection.SE, CompassDirection.SSE,
  CompassDirection.S, CompassDirection.SSW, CompassDirection.SW, CompassDirection.WSW,
];
// @java CompassDirection static { RIGHT = ... }
const RIGHT: CompassDirection[] = [
  CompassDirection.NNE, CompassDirection.NE, CompassDirection.ENE, CompassDirection.E,
  CompassDirection.ESE, CompassDirection.SE, CompassDirection.SSE, CompassDirection.S,
  CompassDirection.SSW, CompassDirection.SW, CompassDirection.WSW, CompassDirection.W,
  CompassDirection.WNW, CompassDirection.NW, CompassDirection.NNW, CompassDirection.N,
];
// @java CompassDirection static { RIGHTWARD = ... }
const RIGHTWARD: CompassDirection[] = [
  CompassDirection.E, CompassDirection.ESE, CompassDirection.SE, CompassDirection.SSE,
  CompassDirection.S, CompassDirection.SSW, CompassDirection.SW, CompassDirection.WSW,
  CompassDirection.W, CompassDirection.WNW, CompassDirection.NW, CompassDirection.NNW,
  CompassDirection.N, CompassDirection.NNE, CompassDirection.NE, CompassDirection.ENE,
];
// @java CompassDirection static { OPPOSITE = ... }
const OPPOSITE: CompassDirection[] = [
  CompassDirection.S, CompassDirection.SSW, CompassDirection.SW, CompassDirection.WSW,
  CompassDirection.W, CompassDirection.WNW, CompassDirection.NW, CompassDirection.NNW,
  CompassDirection.N, CompassDirection.NNE, CompassDirection.NE, CompassDirection.ENE,
  CompassDirection.E, CompassDirection.ESE, CompassDirection.SE, CompassDirection.SSE,
];

const UNIQUE_NAMES: DirectionUniqueName[] = [
  DirectionUniqueName.N, DirectionUniqueName.NNE, DirectionUniqueName.NE,
  DirectionUniqueName.ENE, DirectionUniqueName.E, DirectionUniqueName.ESE,
  DirectionUniqueName.SE, DirectionUniqueName.SSE, DirectionUniqueName.S,
  DirectionUniqueName.SSW, DirectionUniqueName.SW, DirectionUniqueName.WSW,
  DirectionUniqueName.W, DirectionUniqueName.WNW, DirectionUniqueName.NW,
  DirectionUniqueName.NNW,
];

const ABSOLUTE: AbsoluteDirection[] = [
  AbsoluteDirection.N, AbsoluteDirection.NNE, AbsoluteDirection.NE,
  AbsoluteDirection.ENE, AbsoluteDirection.E, AbsoluteDirection.ESE,
  AbsoluteDirection.SE, AbsoluteDirection.SSE, AbsoluteDirection.S,
  AbsoluteDirection.SSW, AbsoluteDirection.SW, AbsoluteDirection.WSW,
  AbsoluteDirection.W, AbsoluteDirection.WNW, AbsoluteDirection.NW,
  AbsoluteDirection.NNW,
];

const COUNT = 16;

/**
 * Wraps a CompassDirection enum value as a DirectionFacing.
 * Use compassFacing(dir) to get the DirectionFacing for a given ordinal.
 *
 * @java game.util.directions.CompassDirection (enum methods)
 */
class CompassFacing implements DirectionFacing {
  public constructor(public readonly ordinal: CompassDirection) {}

  /** @java CompassDirection.left() */
  public left(): DirectionFacing { return compassFacing(LEFT[this.ordinal] as CompassDirection); }
  /** @java CompassDirection.leftward() */
  public leftward(): DirectionFacing { return compassFacing(LEFTWARD[this.ordinal] as CompassDirection); }
  /** @java CompassDirection.right() */
  public right(): DirectionFacing { return compassFacing(RIGHT[this.ordinal] as CompassDirection); }
  /** @java CompassDirection.rightward() */
  public rightward(): DirectionFacing { return compassFacing(RIGHTWARD[this.ordinal] as CompassDirection); }
  /** @java CompassDirection.opposite() */
  public opposite(): DirectionFacing { return compassFacing(OPPOSITE[this.ordinal] as CompassDirection); }
  /** @java CompassDirection.index() */
  public index(): number { return this.ordinal; }
  /** @java CompassDirection.uniqueName() */
  public uniqueName(): DirectionUniqueName { return UNIQUE_NAMES[this.ordinal] as DirectionUniqueName; }
  /** @java CompassDirection.numDirectionValues() */
  public numDirectionValues(): number { return COUNT; }
  /** @java CompassDirection.toAbsolute() */
  public toAbsolute(): AbsoluteDirection { return ABSOLUTE[this.ordinal] as AbsoluteDirection; }
}

// Cached singletons — one per ordinal.
const COMPASS_FACING_CACHE: CompassFacing[] = Array.from(
  { length: COUNT },
  (_, i) => new CompassFacing(i as CompassDirection),
);

/** Return the DirectionFacing wrapper for a CompassDirection ordinal. */
export function compassFacing(dir: CompassDirection): CompassFacing {
  return COMPASS_FACING_CACHE[dir] as CompassFacing;
}

/** All 16 compass facings in ordinal order. */
export const ALL_COMPASS_FACINGS: readonly CompassFacing[] =
  COMPASS_FACING_CACHE as readonly CompassFacing[];
