// @java Common/src/graphics/svg/element/shape/path/Arc.java

/**
 * SVG path arc operation.
 *
 * @java graphics/svg/element/shape/path/Arc.java
 * @author cambolbro
 */

import { PathOp, type Point2D, type GeneralPath, type Rectangle2D, makePoint2D, makeRect } from "./PathOp.js";

// Format:
//   A 100 100 0 0,1 100 100
//   a 100 100 0 0,1 100 100

/**
 * SVG path arc operation.
 *
 * @java graphics/svg/element/shape/path/Arc.java
 */
export class Arc extends PathOp {
  /** @java Arc.rx */
  private rx: number = 0;

  /** @java Arc.ry */
  private ry: number = 0;

  /** @java Arc.xAxis */
  private xAxis: number = 0;

  /** @java Arc.largeArc */
  private largeArc: number = 0;

  /** @java Arc.sweep */
  private sweep: number = 0;

  /** @java Arc.x */
  private x: number = 0;

  /** @java Arc.y */
  private y: number = 0;

  // --------------------------------------------------------------------------

  /** @java Arc() */
  public constructor() {
    super('A');
  }

  // --------------------------------------------------------------------------

  /** @java Arc.rx() */
  public getRx(): number { return this.rx; }

  /** @java Arc.ry() */
  public getRy(): number { return this.ry; }

  /** @java Arc.xAxis() */
  public getXAxis(): number { return this.xAxis; }

  /** @java Arc.largeArc() */
  public getLargeArc(): number { return this.largeArc; }

  /** @java Arc.sweep() */
  public getSweep(): number { return this.sweep; }

  /** @java Arc.x() */
  public getX(): number { return this.x; }

  /** @java Arc.y() */
  public getY(): number { return this.y; }

  // --------------------------------------------------------------------------

  /** @java Arc.newInstance() */
  public override newInstance(): PathOp {
    return new Arc();
  }

  // --------------------------------------------------------------------------

  /** @java Arc.bounds() */
  public override bounds(): Rectangle2D {
    const x0 = this.x - this.rx;
    const y0 = this.y - this.ry;
    const width  = 2 * this.rx;
    const height = 2 * this.ry;
    return makeRect(x0, y0, width, height);
  }

  // --------------------------------------------------------------------------

  /** @java Arc.load(String) */
  public override load(expr: string): boolean {
    // Is absolute if label is upper case
    this.label = expr.charAt(0);

    return true;
  }

  // --------------------------------------------------------------------------

  /** @java Arc.expectedNumValues() */
  public override expectedNumValues(): number {
    return 7;
  }

  /** @java Arc.setValues(List<Double>, Point2D[]) */
  public override setValues(values: number[], current: (Point2D | null)[]): void {
    this.rx       =             values[0] ?? 0;
    this.ry       =             values[1] ?? 0;
    this.xAxis    =             values[2] ?? 0;
    this.largeArc = Math.trunc(values[3] ?? 0);  // 0 or 1
    this.sweep    = Math.trunc(values[4] ?? 0);  // 0 or 1
    this.x        =             values[5] ?? 0;
    this.y        =             values[6] ?? 0;

    current[0] = makePoint2D(this.x, this.y);
    current[1] = null;
  }

  // --------------------------------------------------------------------------

  /** @java Arc.getPoints(List<Point2D>) */
  public override getPoints(pts: Point2D[]): void {
    pts.push(makePoint2D(this.x, this.y));
  }

  // --------------------------------------------------------------------------

  /** @java Arc.toString() */
  public override toString(): string {
    return (
      this.label +
      ": rx=" + this.rx +
      ", ry=" + this.ry +
      ", xAxis=" + this.xAxis +
      ", largeArc=" + this.largeArc +
      ", sweep=" + this.sweep +
      " +, x=" + this.x +
      ", y=" + this.y
    );
  }

  // --------------------------------------------------------------------------

  /** @java Arc.apply(GeneralPath, double, double) */
  public override apply(_path: GeneralPath, _x0: number, _y0: number): void {
    // path.curveTo(x1, y1, x2, y2, x3, y3); — not implemented in Java either
  }

  // --------------------------------------------------------------------------
}
