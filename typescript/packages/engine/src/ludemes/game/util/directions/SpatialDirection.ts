// @java Core/src/game/util/directions/SpatialDirection.java
//
// 18-value 3-D spatial direction enum (9 down + 9 up).
// Ordinal order: D=0, DN=1, DNE=2, DE=3, DSE=4, DS=5, DSW=6, DW=7, DNW=8,
//                U=9, UN=10, UNE=11, UE=12, USE=13, US=14, USW=15, UW=16, UNW=17.
// LEFT/RIGHT/OPPOSITE tables copied verbatim from Java static initialisers.
// NOTE: In Java, DNW uses uniqueName DSW (copy-paste artefact in source);
//       toAbsolute() for DNW returns AbsoluteDirection.DSW in Java too.
//       We faithfully reproduce this oddity and note it.

import type { DirectionFacing } from "./DirectionFacing.js";
import { DirectionUniqueName } from "./DirectionUniqueName.js";
import { AbsoluteDirection } from "../../../../eval/graph/trajectory/absolute-direction.js";

/** @java game.util.directions.SpatialDirection */
export enum SpatialDirection {
  D = 0,
  DN = 1,
  DNE = 2,
  DE = 3,
  DSE = 4,
  DS = 5,
  DSW = 6,
  DW = 7,
  DNW = 8,
  U = 9,
  UN = 10,
  UNE = 11,
  UE = 12,
  USE = 13,
  US = 14,
  USW = 15,
  UW = 16,
  UNW = 17,
}

// @java SpatialDirection static { LEFT = { D, DNW, DN, DNE, DE, DSE, DS, DSW, DW, U, UNW, UN, UNE, UE, USE, US, USW, UW } }
const LEFT: SpatialDirection[] = [
  SpatialDirection.D, SpatialDirection.DNW, SpatialDirection.DN,
  SpatialDirection.DNE, SpatialDirection.DE, SpatialDirection.DSE,
  SpatialDirection.DS, SpatialDirection.DSW, SpatialDirection.DW,
  SpatialDirection.U, SpatialDirection.UNW, SpatialDirection.UN,
  SpatialDirection.UNE, SpatialDirection.UE, SpatialDirection.USE,
  SpatialDirection.US, SpatialDirection.USW, SpatialDirection.UW,
];
// @java SpatialDirection static { RIGHT = { D, DNE, DE, DSE, DS, DSW, DW, DNW, DN, U, UNE, UE, USE, US, USW, UW, UNW, UN } }
const RIGHT: SpatialDirection[] = [
  SpatialDirection.D, SpatialDirection.DNE, SpatialDirection.DE,
  SpatialDirection.DSE, SpatialDirection.DS, SpatialDirection.DSW,
  SpatialDirection.DW, SpatialDirection.DNW, SpatialDirection.DN,
  SpatialDirection.U, SpatialDirection.UNE, SpatialDirection.UE,
  SpatialDirection.USE, SpatialDirection.US, SpatialDirection.USW,
  SpatialDirection.UW, SpatialDirection.UNW, SpatialDirection.UN,
];
// @java SpatialDirection static { OPPOSITE = { U, US, USW, UW, UNW, UN, UNE, UE, USE, D, DS, DSW, DW, DNW, DN, DNE, DE, DSE } }
const OPPOSITE: SpatialDirection[] = [
  SpatialDirection.U, SpatialDirection.US, SpatialDirection.USW,
  SpatialDirection.UW, SpatialDirection.UNW, SpatialDirection.UN,
  SpatialDirection.UNE, SpatialDirection.UE, SpatialDirection.USE,
  SpatialDirection.D, SpatialDirection.DS, SpatialDirection.DSW,
  SpatialDirection.DW, SpatialDirection.DNW, SpatialDirection.DN,
  SpatialDirection.DNE, SpatialDirection.DE, SpatialDirection.DSE,
];

// Unique names per ordinal — NOTE: DNW (ordinal 8) uses DSW in Java (faithfully reproduced).
const UNIQUE_NAMES: DirectionUniqueName[] = [
  DirectionUniqueName.D, DirectionUniqueName.DN, DirectionUniqueName.DNE,
  DirectionUniqueName.DE, DirectionUniqueName.DSE, DirectionUniqueName.DS,
  DirectionUniqueName.DSW, DirectionUniqueName.DW,
  DirectionUniqueName.DSW, // DNW — Java has DSW here (copy-paste artefact)
  DirectionUniqueName.U, DirectionUniqueName.UN, DirectionUniqueName.UNE,
  DirectionUniqueName.UE, DirectionUniqueName.USE, DirectionUniqueName.US,
  DirectionUniqueName.USW, DirectionUniqueName.UW, DirectionUniqueName.UNW,
];

const ABSOLUTE: AbsoluteDirection[] = [
  AbsoluteDirection.D, AbsoluteDirection.DN, AbsoluteDirection.DNE,
  AbsoluteDirection.DE, AbsoluteDirection.DSE, AbsoluteDirection.DS,
  AbsoluteDirection.DSW, AbsoluteDirection.DW,
  AbsoluteDirection.DSW, // DNW — Java has DSW here (faithfully reproduced)
  AbsoluteDirection.U, AbsoluteDirection.UN, AbsoluteDirection.UNE,
  AbsoluteDirection.UE, AbsoluteDirection.USE, AbsoluteDirection.US,
  AbsoluteDirection.USW, AbsoluteDirection.UW, AbsoluteDirection.UNW,
];

const COUNT = 18;

class SpatialFacing implements DirectionFacing {
  public constructor(public readonly ordinal: SpatialDirection) {}

  /** @java SpatialDirection.left() */
  public left(): DirectionFacing { return spatialFacing(LEFT[this.ordinal] as SpatialDirection); }
  /** @java SpatialDirection.leftward() — same as left() in Java */
  public leftward(): DirectionFacing { return spatialFacing(LEFT[this.ordinal] as SpatialDirection); }
  /** @java SpatialDirection.right() */
  public right(): DirectionFacing { return spatialFacing(RIGHT[this.ordinal] as SpatialDirection); }
  /** @java SpatialDirection.rightward() — same as right() in Java */
  public rightward(): DirectionFacing { return spatialFacing(RIGHT[this.ordinal] as SpatialDirection); }
  /** @java SpatialDirection.opposite() */
  public opposite(): DirectionFacing { return spatialFacing(OPPOSITE[this.ordinal] as SpatialDirection); }
  /** @java SpatialDirection.index() */
  public index(): number { return this.ordinal; }
  /** @java SpatialDirection.uniqueName() */
  public uniqueName(): DirectionUniqueName { return UNIQUE_NAMES[this.ordinal] as DirectionUniqueName; }
  /** @java SpatialDirection.numDirectionValues() */
  public numDirectionValues(): number { return COUNT; }
  /** @java SpatialDirection.toAbsolute() */
  public toAbsolute(): AbsoluteDirection { return ABSOLUTE[this.ordinal] as AbsoluteDirection; }
}

const SPATIAL_FACING_CACHE: SpatialFacing[] = Array.from(
  { length: COUNT },
  (_, i) => new SpatialFacing(i as SpatialDirection),
);

/** Return the DirectionFacing wrapper for a SpatialDirection ordinal. */
export function spatialFacing(dir: SpatialDirection): SpatialFacing {
  return SPATIAL_FACING_CACHE[dir] as SpatialFacing;
}

/** All 18 spatial facings in ordinal order. */
export const ALL_SPATIAL_FACINGS: readonly SpatialFacing[] =
  SPATIAL_FACING_CACHE as readonly SpatialFacing[];
