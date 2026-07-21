// @java Common/src/graphics/ImageProcessing.java

/**
 * Image processing routines.
 *
 * @java graphics/ImageProcessing.java
 * @author cambolbro
 */

import { Color } from "../../../awt/Color.js";
import type { Graphics2D } from "../../../awt/Graphics2D.js";

// ---------------------------------------------------------------------------
// Shims for types not yet available via g2d
// ---------------------------------------------------------------------------

interface RadialGradientPaintLike {
  cx: number; cy: number; r: number;
  dist: number[]; colors: Color[];
}

interface PointLike { x: number; y: number; }

function makePoint(x: number, y: number): PointLike { return { x, y }; }

// Convenience: set g2d paint via escape hatch (for gradients)
function setPaint(g2d: Graphics2D, p: RadialGradientPaintLike): void {
  (g2d as unknown as { setPaint(p: unknown): void }).setPaint(p);
}

// ---------------------------------------------------------------------------

/**
 * Image processing routines.
 *
 * @java graphics.ImageProcessing
 */
export class ImageProcessing {
  // --------------------------------------------------------------------------

  /**
   * Draw a ball image centred at (x0 + r, y0 + r) with radius r.
   *
   * @java ImageProcessing.ballImage(Graphics2D, int, int, int, Color)
   */
  public static ballImage(
    g2d: Graphics2D,
    x0: number,
    y0: number,
    r: number,
    baseColour: Color,
  ): void {
    // Create general ball
    const dist1 = [0, 0.25, 0.4, 1];
    const colors1 = [Color.WHITE, baseColour, baseColour, Color.BLACK];

    setPaint(g2d, { cx: x0 + Math.trunc(r * 2 / 3), cy: y0 + Math.trunc(r * 2 / 3), r: r * 2, dist: dist1, colors: colors1 });
    g2d.fillOval(x0, y0, r * 2, r * 2);

    // Add inner shadow
    const dist2 = [0, 0.35, 1];
    const colors2 = [new Color(0, 0, 0, 0), new Color(0, 0, 0, 0), Color.BLACK];

    setPaint(g2d, { cx: x0 + r, cy: y0 + r, r: r * 2, dist: dist2, colors: colors2 });
    g2d.fillOval(x0, y0, r * 2, r * 2);
  }

  // --------------------------------------------------------------------------

  /**
   * Draw a marker image (flat disc with shading).
   *
   * @java ImageProcessing.markerImage(Graphics2D, int, int, int, Color)
   */
  public static markerImage(
    g2d: Graphics2D,
    x0: number,
    y0: number,
    r: number,
    baseColour: Color,
  ): void {
    // Fill flat disc
    g2d.setColor(baseColour);
    g2d.fillOval(x0, y0, r * 2, r * 2);

    // Darken exterior
    const dists = [0, 0.9, 1];

    const rr = Math.trunc(baseColour.getRed()   / 2);
    const gg = Math.trunc(baseColour.getGreen() / 2);
    const bb = Math.trunc(baseColour.getBlue()  / 2);

    const colors = [new Color(0, 0, 0, 0), new Color(0, 0, 0, 0), new Color(rr, gg, bb, 127)];

    setPaint(g2d, { cx: x0 + r, cy: y0 + r, r, dist: dists, colors });
    g2d.fillOval(x0, y0, r * 2, r * 2);

    setPaint(g2d, { cx: x0 + r - Math.trunc(r / 16), cy: y0 + r - Math.trunc(r / 16), r, dist: dists, colors });
    g2d.fillOval(x0, y0, r * 2, r * 2);

    // Add highlight
    const distsH = [0.85, 0.9, 0.95];
    const colorsH = [new Color(255, 255, 255, 0), new Color(255, 255, 255, 150), new Color(255, 255, 255, 0)];

    setPaint(g2d, { cx: x0 + r, cy: y0 + r, r, dist: distsH, colors: colorsH });
    g2d.fillOval(x0, y0, Math.trunc(r * 1.666), Math.trunc(r * 1.666));
  }

  // --------------------------------------------------------------------------

  /**
   * Create ring image with empty centre.
   *
   * @java ImageProcessing.ringImage(Graphics2D, int, int, int, Color)
   */
  public static ringImage(
    g2d: Graphics2D,
    x0: number,
    y0: number,
    imageSize: number,
    baseColour: Color,
  ): void {
    const r = Math.trunc(0.425 * imageSize);
    const off = Math.trunc((imageSize - 2 * r) / 2);

    const swO = 0.15 * imageSize;
    const swI = 0.075 * imageSize;

    // Java uses BasicStroke(swO, CAP_ROUND, JOIN_ROUND) — shim via escape hatch
    (g2d as unknown as { setStroke(s: unknown): void }).setStroke({ lineWidth: swO, cap: 'round', join: 'round' });
    g2d.setColor(Color.BLACK);
    g2d.drawOval(x0 + off, y0 + off, r * 2 - 1, r * 2 - 1);

    (g2d as unknown as { setStroke(s: unknown): void }).setStroke({ lineWidth: swI, cap: 'round', join: 'round' });
    g2d.setColor(baseColour);
    g2d.drawOval(x0 + off, y0 + off, r * 2 - 1, r * 2 - 1);
  }

  // --------------------------------------------------------------------------

  /**
   * Create chocolate piece image.
   *
   * @java ImageProcessing.chocolateImage(Graphics2D, int, int, Color)
   */
  public static chocolateImage(
    g2d: Graphics2D,
    imageSize: number,
    numSides: number,
    baseColour: Color,
  ): void {
    if (numSides !== 4)
      console.log("** Only four sided chocolate pieces supported.");

    const offO = Math.trunc(0.125 * imageSize);
    const offI = Math.trunc(0.2 * imageSize);

    const pts: [PointLike, PointLike][] = [
      [makePoint(offO,               imageSize - 1 - offO), makePoint(offI,               imageSize - 1 - offI)],
      [makePoint(offO,               offO),                 makePoint(offI,               offI)],
      [makePoint(imageSize - 1 - offO, offO),               makePoint(imageSize - 1 - offI, offI)],
      [makePoint(imageSize - 1 - offO, imageSize - 1 - offO), makePoint(imageSize - 1 - offI, imageSize - 1 - offI)],
    ];

    g2d.setColor(baseColour);
    g2d.fillRect(0, 0, imageSize, imageSize);

    g2d.setColor(baseColour);
    g2d.fillRect(0, 0, imageSize, imageSize);

    // Path 1: highlight (pts[0][0] -> pts[1][0] -> pts[2][0] -> pts[2][1] -> pts[1][1] -> pts[0][1])
    {
      const p00 = pts[0]?.[0] ?? makePoint(0, 0);
      const p10 = pts[1]?.[0] ?? makePoint(0, 0);
      const p20 = pts[2]?.[0] ?? makePoint(0, 0);
      const p21 = pts[2]?.[1] ?? makePoint(0, 0);
      const p11 = pts[1]?.[1] ?? makePoint(0, 0);
      const p01 = pts[0]?.[1] ?? makePoint(0, 0);

      g2d.setColor(new Color(255, 230, 200, 100));
      g2d.fillPolygon(
        [p00.x, p10.x, p20.x, p21.x, p11.x, p01.x],
        [p00.y, p10.y, p20.y, p21.y, p11.y, p01.y],
        6,
      );
    }

    // Path 2: shadow (pts[0][0] -> pts[3][0] -> pts[2][0] -> pts[2][1] -> pts[3][1] -> pts[0][1])
    {
      const p00 = pts[0]?.[0] ?? makePoint(0, 0);
      const p30 = pts[3]?.[0] ?? makePoint(0, 0);
      const p20 = pts[2]?.[0] ?? makePoint(0, 0);
      const p21 = pts[2]?.[1] ?? makePoint(0, 0);
      const p31 = pts[3]?.[1] ?? makePoint(0, 0);
      const p01 = pts[0]?.[1] ?? makePoint(0, 0);

      g2d.setColor(new Color(50, 40, 20, 100));
      g2d.fillPolygon(
        [p00.x, p30.x, p20.x, p21.x, p31.x, p01.x],
        [p00.y, p30.y, p20.y, p21.y, p31.y, p01.y],
        6,
      );
    }
  }

  // --------------------------------------------------------------------------
}
