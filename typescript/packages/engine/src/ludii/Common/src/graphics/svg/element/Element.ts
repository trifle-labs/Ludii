// @java Common/src/graphics/svg/element/Element.java

/**
 * SVG element type.
 *
 * @java graphics/svg/element/Element.java
 * @author cambolbro
 */

import type { Style } from "./Style.js";
import type { Graphics2D } from "../../../../../awt/Graphics2D.js";
import type { Color } from "../../../../../awt/Color.js";

// ---------------------------------------------------------------------------

/**
 * SVG element type.
 *
 * @java graphics.svg.element.Element
 */
export interface Element {
  /**
   * @return Label for this element.
   *
   * @java Element.label()
   */
  label(): string;

  /**
   * @return Drawing style for this element.
   *
   * @java Element.style()
   */
  style(): Style;

  /**
   * @param other
   * @return Comparison with other element (order in file).
   *
   * @java Element.compare(Element)
   */
  compare(other: Element): number;

  /**
   * @return New element of own type.
   *
   * @java Element.newInstance()
   */
  newInstance(): Element;

  /**
   * @return New element of own type.
   *
   * @java Element.newOne()
   */
  newOne(): Element;

  /**
   * Load this element's data from an SVG expression.
   * @return Whether expression is in the right format and data was loaded.
   *
   * @java Element.load(String)
   */
  load(expr: string): boolean;

  /**
   * Render this element to a Graphics2D canvas.
   *
   * @java Element.render(Graphics2D, double, double, Color, Color, Color)
   */
  render(
    g2d: Graphics2D,
    x0: number,
    y0: number,
    footprintColour: Color,
    fillColour: Color,
    strokeColour: Color
  ): void;
}
