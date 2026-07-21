// @java Core/src/metadata/graphics/board/style/BoardStyle.java BoardStyle
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/style/BoardStyle.java — faithful data-class port.
 *   Sets the style of the board.
 *   Note: Java's concepts() method contains rich Concept-bit logic; that is omitted
 *   here as Concept is not ported, so needRedraw/concepts stubs are dropped entirely
 *   (this is a pure data-holder for the graphics layer).
 */

import type { ContainerStyleType } from "../../util/ContainerStyleType.js";

export class BoardStyle {
  private readonly _containerStyleType: ContainerStyleType;
  private readonly _replaceComponentsWithFilledCells: boolean;

  /**
   * @param containerStyleType                Container style wanted for the board.
   * @param replaceComponentsWithFilledCells   True if cells should be filled instead
   *                                           of components drawn [false].
   */
  constructor(
    containerStyleType: ContainerStyleType,
    replaceComponentsWithFilledCells?: boolean | null,
  ) {
    this._containerStyleType = containerStyleType;
    this._replaceComponentsWithFilledCells =
      replaceComponentsWithFilledCells == null ? false : replaceComponentsWithFilledCells;
  }

  /** @return ContainerStyleType to apply onto the board. */
  public containerStyleType(): ContainerStyleType {
    return this._containerStyleType;
  }

  /** @return True if cells should be filled instead of components drawn. */
  public replaceComponentsWithFilledCells(): boolean {
    return this._replaceComponentsWithFilledCells;
  }

  public needRedraw(): boolean {
    return false;
  }
}
