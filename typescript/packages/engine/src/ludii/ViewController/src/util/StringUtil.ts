/**
 * StringUtil.ts
 * @java ViewController/src/util/StringUtil.java
 *
 * Functions relating strings visuals and manipulation.
 *
 * @author Matthew.Stephenson
 */

// @java ViewController/src/util/StringUtil.java

import { Color, Graphics2D, BasicStroke, FontMetrics, FontRenderContext } from '../../../awt/index.js';
import { Rectangle2D } from '../../../awt/index.js';
import { Point2D } from '../../../awt/index.js';
import { TopologyElement } from '../../../../ludemes/other/topology/TopologyElement.js';
import { ColourRoutines } from '../../../../ludemes/metadata/graphics/util/colour/ColourRoutines.js';

// ---------------------------------------------------------------------------
// Minimal TextLayout shim
// @java java.awt.font.TextLayout
//
// In the Java code TextLayout is used solely to get a glyph-outline Shape,
// which is then stroked/filled to produce outlined text.  In this SVG port
// we cannot produce real glyph paths, so we implement a shim that replicates
// the visual effect by drawing two SVG <text> elements via the Graphics2D API:
// one stroked (for the outline) and one filled (for the interior).
// ---------------------------------------------------------------------------

/**
 * Minimal shim for java.awt.font.TextLayout.
 * Only the subset used by StringUtil is implemented.
 *
 * @java java.awt.font.TextLayout
 */
class TextLayout {
  private readonly _string: string;
  private readonly _g2dRef: Graphics2D;   // reference context (for font + stroke width)

  constructor(string: string, _font: unknown, _frc: FontRenderContext, g2dRef: Graphics2D) {
    this._string = string;
    this._g2dRef = g2dRef;
  }

  /**
   * Returns an approximate "outline shape" for this text.
   * In this SVG shim the returned shape is a token that drawStringWithOutline
   * recognises and renders via SVG text stroke/fill.
   *
   * @java java.awt.font.TextLayout#getOutline(java.awt.geom.AffineTransform)
   */
  getOutline(_at: unknown): TextOutlineShape {
    return new TextOutlineShape(this._string, this._g2dRef);
  }

  /**
   * Approximate advance width (used as bounds.getWidth() equivalent).
   * @java java.awt.font.TextLayout#getAdvance()
   */
  getAdvance(): number {
    const fm = new FontMetrics(this._g2dRef.getFont());
    return fm.stringWidth(this._string);
  }
}

// ---------------------------------------------------------------------------
// TextOutlineShape – a token shape produced by TextLayout.getOutline()
// ---------------------------------------------------------------------------

/**
 * Sentinel shape that Graphics2D.draw() / fill() on SVGGraphics2D should
 * render as stroked / filled text respectively.
 * The StringUtil.drawStringWithOutline() helper understands this type and
 * performs the SVG rendering in two passes.
 */
class TextOutlineShape {
  constructor(
    public readonly text: string,
    public readonly g2dRef: Graphics2D,   // context that holds current x/y offset via translate
  ) {}

  // ---- minimal Shape interface for TypeScript duck-typing ----

  getBounds2D(): Rectangle2D {
    const fm = new FontMetrics(this.g2dRef.getFont());
    const w = fm.stringWidth(this.text);
    const h = fm.getHeight();
    return new Rectangle2D.Double(0, -h, w, h);
  }

  contains(_x: number, _y: number): boolean { return false; }

  getPathIterator(_at: unknown): never {
    throw new Error('TextOutlineShape.getPathIterator: not supported in SVG port');
  }
}

// ---------------------------------------------------------------------------

/**
 * Utility class mirroring Java StringUtil.
 *
 * @java util.StringUtil
 */
export class StringUtil {

  /**
   * Draws a string at a specified point (graphElement can be null if not important).
   *
   * @java util.StringUtil#drawStringAtPoint(Graphics2D, String, TopologyElement, Point2D, boolean)
   */
  public static drawStringAtPoint(
    g2d: Graphics2D,
    string: string,
    graphElement: TopologyElement | null,
    drawPosn: Point2D,
    withOutline: boolean,
  ): void {
    // Approximate getFont().getStringBounds() via FontMetrics
    const fm = g2d.getFontMetrics();
    const rectWidth  = fm.stringWidth(string);
    const rectHeight = fm.getHeight();

    let posnX = 0;
    let posnY = 0;

    if (graphElement !== null && graphElement.layer() > 1) {
      posnX = Math.trunc(
        (drawPosn.getX() - rectWidth / 2) + (graphElement.layer() / 2) * rectWidth + 5,
      );
      posnY = Math.trunc(drawPosn.getY() + rectHeight / 2.7);
    } else {
      posnX = Math.trunc(drawPosn.getX() - rectWidth / 2);
      // No idea why 2.7 is needed to center vertically properly.
      posnY = Math.trunc(drawPosn.getY() + rectHeight / 2.7);
    }

    if (!withOutline) {
      g2d.drawString(string, posnX, posnY);
    } else {
      StringUtil.drawStringWithOutline(g2d, string, posnX, posnY);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Draws a string at a specified position with a contrasting outline.
   *
   * @java util.StringUtil#drawStringWithOutline(Graphics2D, String, int, int)
   */
  private static drawStringWithOutline(
    g2d: Graphics2D,
    string: string,
    posnX: number,
    posnY: number,
  ): void {
    const originalFontColour: Color = g2d.getColor();
    const g2dNew: Graphics2D = g2d.create();

    // Mimic: g2dNew.setRenderingHint(KEY_ANTIALIASING, VALUE_ANTIALIAS_ON)
    //        g2dNew.setRenderingHint(KEY_RENDERING, VALUE_RENDER_QUALITY)
    // (RenderingHints are no-ops in SVGGraphics2D – called here for fidelity)

    g2dNew.translate(posnX, posnY);

    // Determine contrast colour (matches Java ColourRoutines.getContrastColorFavourDark)
    const c = originalFontColour;
    const contrastRgba = ColourRoutines.getContrastColorFavourDark({
      r: c.getRed(),
      g: c.getGreen(),
      b: c.getBlue(),
      a: c.getAlpha(),
    });
    const contrastColor = new Color(contrastRgba.r, contrastRgba.g, contrastRgba.b, contrastRgba.a);

    // Build a TextLayout (shim) and get the outline shape
    const frc: FontRenderContext = g2d.getFontRenderContext();
    const tl = new TextLayout(string, g2d.getFont(), frc, g2dNew);
    const shape: TextOutlineShape = tl.getOutline(null);

    // Stroke the outline twice (matching Java: g2dNew.draw(shape) twice)
    const strokeWidth = g2d.getFont().getSize() / 5;
    g2dNew.setStroke(new BasicStroke(strokeWidth));
    g2dNew.setColor(contrastColor);

    // In this SVG port we cannot stroke a glyph path directly.
    // We replicate the effect by:
    //   1. Drawing text with a wide stroke in the contrast colour
    //   2. Filling text in the original colour
    // This is achieved by calling drawString twice with appropriate state.
    //
    // Pass 1 – stroke-only effect: emit text with wide stroke, fill=none
    // We approximate by drawing in contrast color twice (once for each .draw(shape)):
    StringUtil._drawTextAsStroke(g2dNew, shape.text, contrastColor, strokeWidth);
    StringUtil._drawTextAsStroke(g2dNew, shape.text, contrastColor, strokeWidth);

    // Pass 2 – fill with original colour
    g2dNew.setColor(originalFontColour);
    g2dNew.drawString(string, 0, 0);

    g2dNew.dispose();
  }

  // -------------------------------------------------------------------------

  /**
   * Helper: emits a text "stroke pass" in SVGGraphics2D.
   * Since SVGGraphics2D.drawString() only emits fill, we implement the
   * stroke pass by calling drawString with the contrast colour, so the
   * first rendering is slightly offset to simulate an outline.
   *
   * In practice, for a proper SVG outline the caller can override this
   * class and replace with an SVG paint-order approach.
   */
  private static _drawTextAsStroke(
    g2d: Graphics2D,
    text: string,
    strokeColor: Color,
    strokeWidth: number,
  ): void {
    // Emit the text at tiny offsets to simulate a stroke outline.
    // This mirrors the Java behaviour where the shape is drawn (stroked) twice
    // before being filled – creating a visible contrasting border.
    g2d.setColor(strokeColor);
    const offsets: [number, number][] = [
      [-strokeWidth, 0], [strokeWidth, 0],
      [0, -strokeWidth], [0, strokeWidth],
    ];
    for (const [dx, dy] of offsets) {
      g2d.drawString(text, dx, dy);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Calculate a consistent hashcode of a String.
   * Mirrors Java's String.hashCode() algorithm.
   *
   * @java util.StringUtil#hashCode(String)
   */
  public static hashCode(string: string): number {
    let h = 0;
    const len = string.length;
    if (len > 0) {
      let off = 0;
      for (let i = 0; i < len; i++) {
        h = (Math.imul(31, h) + string.charCodeAt(off++)) | 0;
      }
    }
    return h;
  }

  // -------------------------------------------------------------------------

  /**
   * Returns true if a string can be parsed to an integer.
   *
   * @java util.StringUtil#isInteger(String)
   */
  public static isInteger(strNum: string | null): boolean {
    if (strNum === null) {
      return false;
    }
    try {
      const parsed = parseInt(strNum, 10);
      if (isNaN(parsed)) return false;
      // Ensure the entire string is an integer (no trailing chars like "12.3")
      return String(parsed) === strNum || /^-?\d+$/.test(strNum);
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
}
