// @java Core/src/game/util/directions/DirectionType.java
//
// Associates a DirectionFacing value with its unique index.
// Used internally where a direction must be stored alongside its ordinal.

import type { DirectionFacing } from "./DirectionFacing.js";

/**
 * Associates a direction with a unique index.
 *
 * @java game.util.directions.DirectionType
 */
export class DirectionType {
  private readonly _index: number;
  private readonly _directionActual: DirectionFacing;

  /** @java DirectionType(DirectionFacing directionActual) */
  public constructor(directionActual: DirectionFacing) {
    this._index = directionActual.index();
    this._directionActual = directionActual;
  }

  /** @java DirectionType.getDirection() */
  public getDirection(): DirectionFacing {
    return this._directionActual;
  }

  /** @java DirectionType.index() */
  public index(): number {
    return this._index;
  }

  /** @java DirectionType.getDirectionActual() */
  public getDirectionActual(): DirectionFacing {
    return this._directionActual;
  }

  /** @java DirectionType.toString() */
  public toString(): string {
    return `[Direction: ${String(this._directionActual)}]`;
  }
}
