// @java Core/src/metadata/graphics/board/shape/BoardShape.java BoardShape
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/shape/BoardShape.java — faithful data-class port.
 *   Sets the shape of the board.
 *   Only used by specific board styles when creating the board's design (e.g. Mancala).
 */

import type { ShapeType } from "../../../../game/types/board/ShapeType.js";

export class BoardShape {
  private readonly _shape: ShapeType;

  /**
   * @param shape The shape of the board.
   */
  constructor(shape: ShapeType) {
    this._shape = shape;
  }

  /** @return The board's shape. */
  public shape(): ShapeType {
    return this._shape;
  }

  public needRedraw(): boolean {
    return false;
  }
}
