// @java Core/src/game/util/directions/RotationalDirection.java
//
// 4-value rotational direction enum: Out=0, CW=1, In=2, CCW=3.
// LEFT/RIGHT/OPPOSITE tables copied verbatim from Java static initialisers.

import type { DirectionFacing } from "./DirectionFacing.js";
import { DirectionUniqueName } from "./DirectionUniqueName.js";
import { AbsoluteDirection } from "../../../../eval/graph/trajectory/absolute-direction.js";

/** @java game.util.directions.RotationalDirection */
export enum RotationalDirection {
  Out = 0,
  CW = 1,
  In = 2,
  CCW = 3,
}

// @java RotationalDirection static { LEFT = { CCW, In, CW, Out } }
const LEFT: RotationalDirection[] = [
  RotationalDirection.CCW, RotationalDirection.In,
  RotationalDirection.CW, RotationalDirection.Out,
];
// @java RotationalDirection static { RIGHT = { CW, In, CCW, Out } }
const RIGHT: RotationalDirection[] = [
  RotationalDirection.CW, RotationalDirection.In,
  RotationalDirection.CCW, RotationalDirection.Out,
];
// @java RotationalDirection static { OPPOSITE = { In, CCW, Out, CW } }
const OPPOSITE: RotationalDirection[] = [
  RotationalDirection.In, RotationalDirection.CCW,
  RotationalDirection.Out, RotationalDirection.CW,
];

const UNIQUE_NAMES: DirectionUniqueName[] = [
  DirectionUniqueName.Out, DirectionUniqueName.CW,
  DirectionUniqueName.In, DirectionUniqueName.CCW,
];

const ABSOLUTE: AbsoluteDirection[] = [
  AbsoluteDirection.Out, AbsoluteDirection.CW,
  AbsoluteDirection.In, AbsoluteDirection.CCW,
];

const COUNT = 4;

class RotationalFacing implements DirectionFacing {
  public constructor(public readonly ordinal: RotationalDirection) {}

  /** @java RotationalDirection.left() */
  public left(): DirectionFacing { return rotationalFacing(LEFT[this.ordinal] as RotationalDirection); }
  /** @java RotationalDirection.leftward() — same as left() in Java */
  public leftward(): DirectionFacing { return rotationalFacing(LEFT[this.ordinal] as RotationalDirection); }
  /** @java RotationalDirection.right() */
  public right(): DirectionFacing { return rotationalFacing(RIGHT[this.ordinal] as RotationalDirection); }
  /** @java RotationalDirection.rightward() — same as right() in Java */
  public rightward(): DirectionFacing { return rotationalFacing(RIGHT[this.ordinal] as RotationalDirection); }
  /** @java RotationalDirection.opposite() */
  public opposite(): DirectionFacing { return rotationalFacing(OPPOSITE[this.ordinal] as RotationalDirection); }
  /** @java RotationalDirection.index() */
  public index(): number { return this.ordinal; }
  /** @java RotationalDirection.uniqueName() */
  public uniqueName(): DirectionUniqueName { return UNIQUE_NAMES[this.ordinal] as DirectionUniqueName; }
  /** @java RotationalDirection.numDirectionValues() */
  public numDirectionValues(): number { return COUNT; }
  /** @java RotationalDirection.toAbsolute() */
  public toAbsolute(): AbsoluteDirection { return ABSOLUTE[this.ordinal] as AbsoluteDirection; }
}

const ROTATIONAL_FACING_CACHE: RotationalFacing[] = Array.from(
  { length: COUNT },
  (_, i) => new RotationalFacing(i as RotationalDirection),
);

/** Return the DirectionFacing wrapper for a RotationalDirection ordinal. */
export function rotationalFacing(dir: RotationalDirection): RotationalFacing {
  return ROTATIONAL_FACING_CACHE[dir] as RotationalFacing;
}

/** All 4 rotational facings in ordinal order. */
export const ALL_ROTATIONAL_FACINGS: readonly RotationalFacing[] =
  ROTATIONAL_FACING_CACHE as readonly RotationalFacing[];
