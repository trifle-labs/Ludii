// @java Common/src/graphics/svg/SVG.java

/**
 * Contents of an SVG file.
 *
 * @java graphics/svg/SVG.java
 * @author cambolbro
 */

import type { Color } from "../../../../awt/Color.js";
import type { Graphics2D } from "../../../../awt/Graphics2D.js";
import { Rectangle2D } from "../../../../awt/geom/Rectangle2D.js";
import { BaseElement, type Element } from "./element/style/Style.js";

// ---------------------------------------------------------------------------

/**
 * Contents of an SVG file.
 *
 * @java graphics.svg.SVG
 */
export class SVG {
  /** @java SVG.elements */
  private readonly _elements: Element[] = [];

  /** @java SVG.bounds */
  private _bounds: Rectangle2D.Double = new Rectangle2D.Double();

  // --------------------------------------------------------------------------

  /**
   * Returns an unmodifiable view of the elements list.
   * (In Java this is Collections.unmodifiableList — here we return the live
   * array wrapped as readonly, but SVGParser casts through for mutation.)
   *
   * @java SVG.elements()
   */
  public elements(): readonly Element[] {
    return this._elements;
  }

  // --------------------------------------------------------------------------

  /** @java SVG.bounds() */
  public bounds(): Rectangle2D.Double {
    return this._bounds;
  }

  // --------------------------------------------------------------------------

  /** @java SVG.clear() */
  public clear(): void {
    this._elements.length = 0;
  }

  // --------------------------------------------------------------------------

  /**
   * Compute bounding box over all elements.
   *
   * @java SVG.setBounds()
   */
  public setBounds(): void {
    this._bounds = null as unknown as Rectangle2D.Double;
    for (const element of this._elements) {
      (element as unknown as BaseElement).setBounds();
      const eb = (element as unknown as BaseElement).bounds();
      if (this._bounds === null) {
        this._bounds = new Rectangle2D.Double();
        this._bounds.setRect(eb.x, eb.y, eb.width, eb.height);
      } else {
        this._bounds.add(new Rectangle2D.Double(eb.x, eb.y, eb.width, eb.height));
      }
    }
    if (this._bounds === null) {
      this._bounds = new Rectangle2D.Double();
    }
  }

  // --------------------------------------------------------------------------

  /**
   * @return Maximum stroke width specified for any element.
   *
   * @java SVG.maxStrokeWidth()
   */
  public maxStrokeWidth(): number {
    let maxWidth = 0;
    for (const element of this._elements) {
      const sw = (element as unknown as BaseElement).strokeWidth();
      if (sw > maxWidth)
        maxWidth = sw;
    }
    return maxWidth;
  }

  // --------------------------------------------------------------------------

  /**
   * Render an image from the SVG code just parsed.
   * NOTE: In TypeScript we cannot return a BufferedImage. We invoke the
   * element render callbacks and return null. Callers that need actual pixel
   * data must use SVGtoImage (which uses a Canvas context instead).
   *
   * @java SVG.render(Color, Color, int)
   */
  public render(
    fillColour: Color | null,
    borderColour: Color | null,
    _desiredSize: number,
  ): null {
    const boundsX = this._bounds.getX();
    const boundsY = this._bounds.getY();

    // Pass 1: Fill footprint with player colour
    for (const element of this._elements)
      element.render(null as unknown as Graphics2D, -boundsX, -boundsY, fillColour, null, null);

    // Pass 2: Fill paths with border colour
    for (const element of this._elements)
      element.render(null as unknown as Graphics2D, -boundsX, -boundsY, null, borderColour, null);

    // Pass 3: Stroke edges in border colour (if element's stroke width > 0)
    for (const element of this._elements)
      if (element.style().strokeWidth() > 0) {
        console.log("Stroking element " + element.label());
        element.render(null as unknown as Graphics2D, -boundsX, -boundsY, null, null, borderColour);
      }

    return null;
  }

  // --------------------------------------------------------------------------

  /** @java SVG.toString() */
  public toString(): string {
    const sb: string[] = [];
    sb.push(this._elements.length + " elements:\n");
    for (const element of this._elements)
      sb.push(element + "\n");
    return sb.join('');
  }

  // --------------------------------------------------------------------------
}
