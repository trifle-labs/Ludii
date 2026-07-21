/**
 * EdgeInfoGUI.ts
 *
 * @java metadata/graphics/util/EdgeInfoGUI.java
 *
 * Relevant GUI information about an edge.
 */

import type { LineStyle } from "./LineStyle.js";
import type { Colour } from "./colour/Colour.js";

/**
 * @java metadata.graphics.util.EdgeInfoGUI
 */
export class EdgeInfoGUI {
  /** The style of the edge. */
  private _style: LineStyle;

  /** The colour of the edge. */
  private _colour: Colour | null;

  /**
   * @param style  The line style.
   * @param colour The colour.
   * @java EdgeInfoGUI(LineStyle, Color)
   */
  constructor(style: LineStyle, colour: Colour | null) {
    this._style = style;
    this._colour = colour;
  }

  /** @java EdgeInfoGUI.getStyle() */
  getStyle(): LineStyle {
    return this._style;
  }

  /** @java EdgeInfoGUI.setStyle(LineStyle) */
  setStyle(style: LineStyle): void {
    this._style = style;
  }

  /** @java EdgeInfoGUI.getColour() */
  getColour(): Colour | null {
    return this._colour;
  }

  /** @java EdgeInfoGUI.setColour(Color) */
  setColour(colour: Colour | null): void {
    this._colour = colour;
  }
}
