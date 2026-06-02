// @java Core/src/game/util/graph/Poly.java
//
// Defines a polygon composed of a list of floating point (x,y) pairs.
// Extends BaseLudeme and wraps a Polygon object (faithfully ported inline).

import {
  BaseLudeme,
} from "../../../other/other/BaseLudeme.js";

// ---------------------------------------------------------------------------
// Polygon — faithful port of main.math.Polygon
// @java Common/src/main/math/Polygon.java
// ---------------------------------------------------------------------------

/**
 * Minimal Point2D stand-in (Java: java.awt.geom.Point2D.Double).
 */
interface Pt2D {
  x: number;
  y: number;
}

/**
 * Polygon with floating-point precision; can be concave.
 *
 * @java main.math.Polygon
 */
export class Polygon {
  /** @java Polygon.points */
  private readonly _points: Pt2D[] = [];

  // -------------------------------------------------------------------------

  /** @java Polygon() */
  public constructor();
  /** @java Polygon(List<Point2D> pts, int numRotations) */
  public constructor(pts: readonly Pt2D[], numRotations: number);
  /** @java Polygon(Float[][] pts, int numRotations) */
  public constructor(pts: ReadonlyArray<readonly [number, number]>, numRotations: number);
  /** @java Polygon(int numSides) */
  public constructor(numSides: number);
  public constructor(
    arg?: readonly Pt2D[] | ReadonlyArray<readonly [number, number]> | number,
    numRotations?: number,
  ) {
    if (arg === undefined) {
      // no-arg
    } else if (typeof arg === "number") {
      // construct regular polygon with numSides sides
      const numSides = arg;
      const r = numSides / (2 * Math.PI);
      for (let n = 0; n < numSides; n++) {
        const theta = Math.PI / 2 + (n / numSides) * 2 * Math.PI;
        this._points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
      }
    } else if (arg.length > 0) {
      // detect Float[][] (tuple array) vs Point2D array
      const first = arg[0] as unknown;
      if (Array.isArray(first)) {
        // Float[][] pts
        const ptsF = arg as ReadonlyArray<readonly [number, number]>;
        for (const pair of ptsF) {
          if (pair.length < 2) {
            console.warn("** Polygon: Two points expected.");
            this._points.length = 0;
            break;
          }
          this._points.push({ x: pair[0], y: pair[1] });
        }
      } else {
        // Pt2D[]
        for (const pt of arg as readonly Pt2D[]) {
          this._points.push({ x: pt.x, y: pt.y });
        }
      }
      if (numRotations !== undefined && numRotations !== 0) {
        this._addRotations(numRotations);
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java Polygon.points() — unmodifiable view. */
  public points(): readonly Pt2D[] {
    return this._points;
  }

  /** @java Polygon.size() */
  public size(): number {
    return this._points.length;
  }

  /** @java Polygon.isEmpty() */
  public isEmpty(): boolean {
    return this._points.length === 0;
  }

  /** @java Polygon.clear() */
  public clear(): void {
    this._points.length = 0;
  }

  /** @java Polygon.add(Point2D pt) */
  public add(pt: Pt2D): void {
    this._points.push({ x: pt.x, y: pt.y });
  }

  // -------------------------------------------------------------------------

  /** @java Polygon.setFrom(Polygon other) */
  public setFrom(other: Polygon): void {
    this.clear();
    for (const pt of other._points) {
      this._points.push({ x: pt.x, y: pt.y });
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Add the existing points repeated by the specified number of rotations.
   *
   * @java Polygon.addRotations(int numRotations)
   */
  private _addRotations(numRotations: number): void {
    if (numRotations < 0) {
      this._points.reverse();
    }

    const P = this._points.length;
    const rotnAngle = (2.0 * Math.PI) / numRotations;

    let angle = rotnAngle;
    for (let r = 1; r < Math.abs(numRotations); r++) {
      const sinAngle = Math.sin(angle);
      const cosAngle = Math.cos(angle);

      for (let p = 0; p < P; p++) {
        const x = this._points[p]!.x;
        const y = this._points[p]!.y;

        const xx = x * cosAngle - y * sinAngle;
        const yy = x * sinAngle + y * cosAngle;

        this._points.push({ x: xx, y: yy });
      }
      angle += rotnAngle;
    }
  }

  // -------------------------------------------------------------------------

  /** @java Polygon.length() */
  public length(): number {
    let length = 0;
    const n = this._points.length;
    for (let i = 0; i < n; i++) {
      const a = this._points[i]!;
      const b = this._points[(i + 1) % n]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  /** @java Polygon.midpoint() */
  public midpoint(): Pt2D {
    if (this._points.length === 0) return { x: 0, y: 0 };

    let avgX = 0;
    let avgY = 0;
    for (const pt of this._points) {
      avgX += pt.x;
      avgY += pt.y;
    }
    avgX /= this._points.length;
    avgY /= this._points.length;
    return { x: avgX, y: avgY };
  }

  /**
   * Signed area of polygon.
   *
   * @java Polygon.area()
   */
  public area(): number {
    let area = 0;
    const n = this._points.length;
    for (let i = 0; i < n; i++) {
      const ptN = this._points[i]!;
      const ptO = this._points[(i + 1) % n]!;
      area += ptN.x * ptO.y - ptO.x * ptN.y;
    }
    return area / 2.0;
  }

  /** @java Polygon.isClockwise() */
  public isClockwise(): boolean {
    let sum = 0;
    const n = this._points.length;
    let m = n - 1;
    for (let i = 0; i < n; m = i++) {
      const ptM = this._points[m]!;
      const ptN = this._points[i]!;
      sum += (ptN.x - ptM.x) * (ptN.y + ptM.y);
    }
    return sum < 0;
  }

  /** @java Polygon.clockwise() */
  public clockwise(): boolean {
    // Use negative area, since Y goes down in screen coordinates.
    return this.area() < 0;
  }

  // -------------------------------------------------------------------------

  /** @java Polygon.contains(double x, double y) */
  public containsXY(x: number, y: number): boolean {
    return this.contains({ x, y });
  }

  /**
   * Point-in-complex-polygon test.
   *
   * @java Polygon.contains(Point2D pt)
   */
  public contains(pt: Pt2D): boolean {
    const numPoints = this._points.length;
    let j = numPoints - 1;
    let odd = false;

    const x = pt.x;
    const y = pt.y;

    for (let i = 0; i < numPoints; i++) {
      const ix = this._points[i]!.x;
      const iy = this._points[i]!.y;
      const jx = this._points[j]!.x;
      const jy = this._points[j]!.y;

      if (((iy < y && jy >= y) || (jy < y && iy >= y)) && (ix <= x || jx <= x)) {
        odd = odd !== (ix + ((y - iy) / (jy - iy)) * (jx - ix) < x);
      }
      j = i;
    }
    return odd;
  }

  // -------------------------------------------------------------------------

  /** @java Polygon.toString() */
  public toString(): string {
    let str = "Polygon:";
    for (const pt of this._points) {
      str += ` (${pt.x},${pt.y})`;
    }
    return str;
  }
}

// ---------------------------------------------------------------------------
// Poly ludeme
// ---------------------------------------------------------------------------

/**
 * Defines a polygon composed of a list of floating point (x,y) pairs.
 * The polygon can be concave.
 *
 * @java game.util.graph.Poly
 *
 * @example (poly { { 0 0 } { 0 2.5 } { 4.75 1 } })
 */
export class Poly extends BaseLudeme {
  /** @java Poly.polygon */
  private readonly _polygon: Polygon;

  // -------------------------------------------------------------------------

  /**
   * For building a polygon with float-pair points.
   * Java: Poly(Float[][] pts, Integer rotns)
   *
   * @param pts    Array of [x, y] pairs defining the polygon vertices.
   * @param rotns  Number of duplicate rotations to make (optional).
   *
   * @java Poly(Float[][] pts, @Opt @Name Integer rotns)
   */
  public constructor(pts: ReadonlyArray<readonly [number, number]>, rotns?: number | null) {
    super();
    this._polygon = new Polygon(pts, rotns ?? 0);
  }

  // -------------------------------------------------------------------------

  /**
   * @java Poly.polygon()
   */
  public polygon(): Polygon {
    return this._polygon;
  }
}
