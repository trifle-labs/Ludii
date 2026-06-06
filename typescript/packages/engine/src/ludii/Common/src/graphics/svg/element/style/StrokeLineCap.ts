// @java Common/src/graphics/svg/element/style/StrokeLineCap.java

/**
 * SVG line cap property.
 *
 * @java graphics/svg/element/style/StrokeLineCap.java
 * @author cambolbro
 */

import type { Color } from "../../../../../../awt/Color.js";
import type { Graphics2D } from "../../../../../../awt/Graphics2D.js";
import { Style, type Element } from "./Style.js";

// ---------------------------------------------------------------------------

/**
 * SVG line cap property.
 * Format: stroke-linecap="round"
 *
 * @java graphics.svg.element.style.StrokeLineCap
 */
export class StrokeLineCap extends Style {
  /** @java StrokeLineCap.lineCap */
  private readonly _lineCap: string = "butt";

  // --------------------------------------------------------------------------

  /** @java StrokeLineCap() */
  public constructor() {
    super("stroke-linecap");
  }

  // --------------------------------------------------------------------------

  /** @java StrokeLineCap.lineCap() */
  public lineCap(): string {
    return this._lineCap;
  }

  // --------------------------------------------------------------------------

  /** @java StrokeLineCap.newOne() */
  public override newOne(): Element {
    return new StrokeLineCap();
  }

  // --------------------------------------------------------------------------

  /** @java StrokeLineCap.load(String) */
  public override load(_expr: string): boolean {
    return true;
  }

  // --------------------------------------------------------------------------

  /** @java StrokeLineCap.newInstance() */
  public override newInstance(): Element | null {
    return null;
  }

  // --------------------------------------------------------------------------

  /** @java StrokeLineCap.render(...) */
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

  /** @java StrokeLineCap.setBounds() */
  public override setBounds(): void {
    // ...
  }

  // --------------------------------------------------------------------------
}
