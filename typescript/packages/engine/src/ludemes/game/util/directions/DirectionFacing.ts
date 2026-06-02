// @java Core/src/game/util/directions/DirectionFacing.java
//
// Interface representing a concrete facing direction (compass, rotational, spatial).
// Each enum implementing this interface provides navigation (left/right/opposite) and
// conversion to AbsoluteDirection.

import type { DirectionUniqueName } from "./DirectionUniqueName.js";
import type { AbsoluteDirection } from "../../../../eval/graph/trajectory/absolute-direction.js";

/**
 * Provides a general "direction" description for use in a variety of contexts.
 * Each basis (compass, rotational, spatial) has its own set of directions.
 *
 * @java game.util.directions.DirectionFacing
 */
export interface DirectionFacing {
  /** Direction left of this one. */
  left(): DirectionFacing;

  /** Direction right of this one. */
  right(): DirectionFacing;

  /** Direction rightward of this one. */
  rightward(): DirectionFacing;

  /** Direction leftward of this one. */
  leftward(): DirectionFacing;

  /** The opposite direction. */
  opposite(): DirectionFacing;

  /** Index of this direction. */
  index(): number;

  /** The unique canonical name of this direction. */
  uniqueName(): DirectionUniqueName;

  /** Number of possible distinct values in the implementing direction enum. */
  numDirectionValues(): number;

  /** Convert to an AbsoluteDirection. */
  toAbsolute(): AbsoluteDirection;
}
