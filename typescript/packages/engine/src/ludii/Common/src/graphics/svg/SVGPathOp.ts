// @java Common/src/graphics/svg/SVGPathOp.java

/**
 * An SVG operation.
 *
 * @java graphics/svg/SVGPathOp.java
 * @author cambolbro
 */

import { Point2D } from "../../../../awt/geom/Point2D.js";

// ---------------------------------------------------------------------------

/**
 * Enum of SVG path operation types.
 *
 * @java SVGPathOp.PathOpType
 */
export enum PathOpType {
  ArcTo,
  MoveTo,
  LineTo,
  HLineTo,
  VLineTo,
  CurveTo,
  QuadraticTo,
  ShortCurveTo,
  ShortQuadraticTo,
  ClosePath,
}

// ---------------------------------------------------------------------------

/**
 * An SVG operation.
 *
 * @java graphics.svg.SVGPathOp
 */
export class SVGPathOp {
  /** @java SVGPathOp.type */
  private readonly _type: PathOpType;

  /** @java SVGPathOp.absolute */
  private readonly _absolute: boolean;

  /** @java SVGPathOp.pts */
  private readonly _pts: Point2D.Double[] = [];

  /** @java SVGPathOp.xAxisRotation */
  private _xAxisRotation = 0;

  /** @java SVGPathOp.largeArcSweep */
  private _largeArcSweep = 0;

  /** @java SVGPathOp.sweepFlag */
  private _sweepFlag = 0;

  // --------------------------------------------------------------------------

  /** @java SVGPathOp(PathOpType, boolean, String[]) */
  public constructor(type: PathOpType, absolute: boolean, subs: string[] | null) {
    this._type = type;
    this._absolute = absolute;
    this.parseNumbers(subs);
  }

  // --------------------------------------------------------------------------

  /** @java SVGPathOp.type() */
  public type(): PathOpType {
    return this._type;
  }

  /** @java SVGPathOp.absolute() */
  public absolute(): boolean {
    return this._absolute;
  }

  /** @java SVGPathOp.pts() — returns unmodifiable view */
  public pts(): readonly Point2D.Double[] {
    return this._pts;
  }

  /** @java SVGPathOp.xAxisRotation() */
  public xAxisRotation(): number {
    return this._xAxisRotation;
  }

  /** @java SVGPathOp.largeArcSweep() */
  public largeArcSweep(): number {
    return this._largeArcSweep;
  }

  /** @java SVGPathOp.sweepFlag() */
  public sweepFlag(): number {
    return this._sweepFlag;
  }

  // --------------------------------------------------------------------------

  /** @java SVGPathOp.parseNumbers(String[]) */
  private parseNumbers(subs: string[] | null): boolean {
    if (subs === null)
      return true; // nothing to do

    if (subs.length % 2 !== 0 && subs.length !== 7) {
      console.log("** Odd number of substrings.");
      return false;
    }

    for (let s = 0; s < subs.length; s += 2) {
      let da = -1;
      let db = -1;

      // Get first (x) value
      const strA = (subs[s] ?? "").trim();
      da = parseFloat(strA);
      if (isNaN(da)) {
        console.log(`** '${strA}' is not a double (x, ${s}).`);
        return false;
      }

      if (s < subs.length - 1) {
        // Get second (y) value
        const strB = (subs[s + 1] ?? "").trim();
        db = parseFloat(strB);
        if (isNaN(db)) {
          console.log(`** '${strB}' is not a double (y, ${s}).`);
          return false;
        }
      }
      this._pts.push(new Point2D.Double(da, db));
    }

    if (subs.length === 7) {
      // Is an ArcTo
      this._xAxisRotation = (this._pts[2] ?? new Point2D.Double(0, 0)).x;
      this._largeArcSweep = (this._pts[2] ?? new Point2D.Double(0, 0)).y;
      this._sweepFlag = Math.trunc((this._pts[3] ?? new Point2D.Double(0, 0)).x);
      this._pts.splice(2, 1);
    }

    return true;
  }

  // --------------------------------------------------------------------------
}
