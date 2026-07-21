// @java Common/src/graphics/svg/element/style/Stroke.java

/**
 * SVG stroke colour property.
 *
 * @java graphics/svg/element/style/Stroke.java
 * @author cambolbro
 */

import { Color } from "../../../../../../awt/Color.js";
import type { Graphics2D } from "../../../../../../awt/Graphics2D.js";
import { Style, type Element } from "./Style.js";

// ---------------------------------------------------------------------------

/**
 * SVG stroke colour property.
 *
 * BEWARE: Label "stroke" will also match "stroke-width" etc.
 *
 * @java graphics.svg.element.style.Stroke
 */
export class Stroke extends Style {
  // Format:
  //   stroke="rgb(255,0,0)"
  //   Handle stroke types here

  /** @java Stroke.colour */
  private readonly _colour: Color = new Color(0, 0, 0);

  // --------------------------------------------------------------------------

  /** @java Stroke() */
  public constructor() {
    super("stroke");
  }

  // --------------------------------------------------------------------------

  /** @java Stroke.colour() */
  public colour(): Color {
    return this._colour;
  }

  // --------------------------------------------------------------------------

  /** @java Stroke.newOne() */
  public override newOne(): Element {
    return new Stroke();
  }

  // --------------------------------------------------------------------------

  /** @java Stroke.load(String) */
  public override load(_expr: string): boolean {
    return true;
  }

  // --------------------------------------------------------------------------

  /** @java Stroke.newInstance() */
  public override newInstance(): Element | null {
    return null;
  }

  // --------------------------------------------------------------------------

  /** @java Stroke.render(...) */
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

  /** @java Stroke.setBounds() */
  public override setBounds(): void {
    // ...
  }

  // --------------------------------------------------------------------------
}
