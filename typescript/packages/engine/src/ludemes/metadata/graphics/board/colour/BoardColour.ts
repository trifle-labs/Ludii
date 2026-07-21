// @java Core/src/metadata/graphics/board/colour/BoardColour.java BoardColour
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/colour/BoardColour.java — faithful data-class port.
 *   Sets the colour of a specific aspect of the board.
 *   Different aspects are defined by BoardGraphicsType.
 */

import type { BoardGraphicsType } from "../../util/BoardGraphicsType.js";
import type { Colour } from "../../util/colour/Colour.js";

export class BoardColour {
  /** The board graphics aspect to which the colour is applied. */
  private readonly _boardGraphicsType: BoardGraphicsType;

  /** Colour to apply. */
  private readonly _colour: Colour;

  constructor(boardGraphicsType: BoardGraphicsType, colour: Colour) {
    this._boardGraphicsType = boardGraphicsType;
    this._colour = colour;
  }

  /** @return BoardGraphicsType that the colour is applied to. */
  public boardGraphicsType(): BoardGraphicsType {
    return this._boardGraphicsType;
  }

  /** @return Colour to apply onto the specified boardGraphicsType. */
  public colour(): Colour {
    return this._colour;
  }

  public needRedraw(): boolean {
    return false;
  }
}
