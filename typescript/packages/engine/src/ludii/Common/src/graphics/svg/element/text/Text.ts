// @java Common/src/graphics/svg/element/text/Text.java

/**
 * SVG text elements. How handled yet -- added for completeness.
 *
 * @java graphics/svg/element/text/Text.java
 * @author cambolbro
 */

import type { Color } from "../../../../../../awt/Color.js";
import type { Graphics2D } from "../../../../../../awt/Graphics2D.js";
import { BaseElement, type Element } from "../style/Style.js";

// ---------------------------------------------------------------------------

/**
 * SVG text elements.
 *
 * @java graphics.svg.element.text.Text
 */
export class Text extends BaseElement {
  // --------------------------------------------------------------------------

  /** @java Text() */
  public constructor() {
    super("Text");
  }

  // --------------------------------------------------------------------------

  /** @java Text.newInstance() */
  public override newInstance(): Element {
    return new Text();
  }

  // --------------------------------------------------------------------------

  /** @java Text.load(String) */
  public override load(_expr: string): boolean {
    try {
      throw new Error("SVG text loading not implemented yet.");
    } catch (e) {
      console.log(e);
    }
    return false;
  }

  // --------------------------------------------------------------------------

  /** @java Text.setBounds() */
  public override setBounds(): void {
    console.log("Text.setBounds() not implemented yet.");
  }

  // --------------------------------------------------------------------------

  /** @java Text.render(...) */
  public override render(
    _g2d: Graphics2D,
    _x0: number,
    _y0: number,
    _footprintColour: Color | null,
    _fillColour: Color | null,
    _strokeColour: Color | null,
  ): void {
    // ...
  }

  // --------------------------------------------------------------------------

  /** @java Text.newOne() */
  public override newOne(): Element {
    return new Text();
  }

  // --------------------------------------------------------------------------
}
