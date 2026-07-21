// @java Core/src/game/util/directions/DirectionUniqueName.java
//
// Canonical unique name for every concrete direction value.
// This is the master list used by DirectionFacing.uniqueName() to distinguish
// compass, rotational, and spatial directions from one another.

/**
 * Provides a unique name for each direction for efficiency.
 * This is the canonical list — these are actual directions, not filters.
 *
 * @java game.util.directions.DirectionUniqueName
 */
export enum DirectionUniqueName {
  N,
  NNE,
  NE,
  E,
  SSE,
  SE,
  S,
  SSW,
  SW,
  W,
  NW,
  NNW,
  WNW,
  ENE,
  ESE,
  WSW,
  CW,
  Out,
  CCW,
  In,
  UNW,
  UNE,
  USE,
  USW,
  DNW,
  DNE,
  DSE,
  DSW,
  U,
  UN,
  UW,
  UE,
  US,
  D,
  DN,
  DW,
  DE,
  DS,
}
