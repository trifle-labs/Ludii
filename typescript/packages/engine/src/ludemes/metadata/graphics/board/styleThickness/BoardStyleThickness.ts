// @java Core/src/metadata/graphics/board/styleThickness/BoardStyleThickness.java BoardStyleThickness
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/styleThickness/BoardStyleThickness.java — faithful data-class port.
 *   Sets the preferred scale for the thickness of a specific aspect of the board.
 *   The boardGraphicsType must be InnerEdge, OuterEdge or Vertex.
 */

import type { BoardGraphicsType } from "../../util/BoardGraphicsType.js";

export class BoardStyleThickness {
  private readonly _boardGraphicsType: BoardGraphicsType;
  private readonly _thickness: number;

  /**
   * @param boardGraphicsType The board aspect whose thickness is being set.
   * @param thickness         The assigned thickness scale.
   */
  constructor(boardGraphicsType: BoardGraphicsType, thickness: number) {
    this._boardGraphicsType = boardGraphicsType;
    this._thickness = thickness;
  }

  /** @return BoardGraphicsType that the scale is applied to. */
  public boardGraphicsType(): BoardGraphicsType {
    return this._boardGraphicsType;
  }

  /** @return Thickness scale to apply. */
  public thickness(): number {
    return this._thickness;
  }

  public needRedraw(): boolean {
    return false;
  }
}
