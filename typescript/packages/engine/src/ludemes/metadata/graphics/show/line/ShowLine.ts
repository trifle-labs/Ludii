/**
 * ShowLine.ts
 *
 * @java metadata/graphics/show/line/ShowLine.java
 *
 * Draws a line between vertex locations on the board.
 */

import type { CurveType } from "../../util/CurveType.js";
import type { LineStyle } from "../../util/LineStyle.js";
import type { Colour } from "../../util/colour/Colour.js";

/**
 * @java metadata.graphics.show.line.ShowLine
 */
export class ShowLine {
  /** Set of vertex location pairs to add the line onto. */
  readonly lines: number[][];

  /** Scale of drawn line. */
  readonly scale: number;

  /** Colour of drawn line. */
  readonly colour: Colour | null;

  /** Control points for Bézier curve (4 values: x1, y1, x2, y2, between 0 and 1). */
  readonly curve: number[] | null;

  /** SiteType to draw line on (string mirror of Java SiteType). */
  readonly siteType: string;

  /** Line style. */
  readonly style: LineStyle;

  /** Type of curve. */
  readonly curveType: CurveType;

  /**
   * @param lines     Set of vertex location pairs to add the line onto.
   * @param siteType  SiteType to draw line on [Vertex].
   * @param style     Line style [Thick].
   * @param colour    Colour of drawn line.
   * @param scale     Scale of drawn line [1.0].
   * @param curve     Control points for a Bézier curve (4 values).
   * @param curveType Type of curve [Spline].
   * @java ShowLine(Integer[][], SiteType, LineStyle, Colour, Float, Float[], CurveType)
   */
  constructor(
    lines: number[][],
    siteType: string | null,
    style: LineStyle | null,
    colour: Colour | null,
    scale: number | null,
    curve: number[] | null,
    curveType: CurveType | null,
  ) {
    this.lines = lines;
    this.siteType = siteType ?? "Vertex";
    this.colour = colour;
    this.scale = scale ?? 1.0;
    this.curve = curve;
    this.style = style ?? "Thick";
    this.curveType = curveType ?? "Spline";
  }

  /** @java GraphicsItem.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}
