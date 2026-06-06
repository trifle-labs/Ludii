// @java Common/src/graphics/svg/element/shape/path/QuadTo.java

/**
 * SVG path quadratic curve to operation.
 *
 * @java graphics/svg/element/shape/path/QuadTo.java
 * @author cambolbro
 */

import { PathOp, type Point2D, type GeneralPath, type Rectangle2D, makePoint2D, makeRect } from "./PathOp.js";

// SVGParser helpers inlined (SVGParser not yet ported)
function isNumeric(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
}

function extractDoubleAt(expr: string, from: number): number | null {
  let c = from;
  while (c < expr.length && !isNumeric(expr.charAt(c)))
    c++;
  let cc = c + 1;
  while (cc < expr.length && isNumeric(expr.charAt(cc)))
    cc++;
  const sub = expr.substring(c, cc);
  const result = parseFloat(sub);
  return isNaN(result) ? null : result;
}

// Format:
//   Q 100 100 200 200
//   q 100 100 200 200

/**
 * SVG path quadratic curve to operation.
 *
 * @java graphics/svg/element/shape/path/QuadTo.java
 */
export class QuadTo extends PathOp {
  /** @java QuadTo.x1 */
  private x1: number = 0;

  /** @java QuadTo.y1 */
  private y1: number = 0;

  /** @java QuadTo.x */
  private x: number = 0;

  /** @java QuadTo.y */
  private y: number = 0;

  // --------------------------------------------------------------------------

  /** @java QuadTo() */
  public constructor() {
    super('Q');
  }

  // --------------------------------------------------------------------------

  /** @java QuadTo.x1() */
  public getX1(): number { return this.x1; }

  /** @java QuadTo.y1() */
  public getY1(): number { return this.y1; }

  /** @java QuadTo.x() */
  public getX(): number { return this.x; }

  /** @java QuadTo.y() */
  public getY(): number { return this.y; }

  // --------------------------------------------------------------------------

  /** @java QuadTo.newInstance() */
  public override newInstance(): PathOp {
    return new QuadTo();
  }

  // --------------------------------------------------------------------------

  /** @java QuadTo.bounds() */
  public override bounds(): Rectangle2D {
    const x0 = Math.min(this.x1, this.x);
    const y0 = Math.min(this.y1, this.y);
    const width  = Math.max(this.x1, this.x) - x0;
    const height = Math.max(this.y1, this.y) - y0;
    return makeRect(x0, y0, width, height);
  }

  // --------------------------------------------------------------------------

  /** @java QuadTo.load(String) */
  public override load(expr: string): boolean {
    // Is absolute if label is upper case
    this.label = expr.charAt(0);

    let c = 1;

    const resultX1 = extractDoubleAt(expr, c);
    if (resultX1 === null) {
      console.log("* Failed to read X1 from " + expr + ".");
      return false;
    }
    this.x1 = resultX1;

    while (c < expr.length && isNumeric(expr.charAt(c)))
      c++;
    while (c < expr.length && !isNumeric(expr.charAt(c)))
      c++;

    const resultY1 = extractDoubleAt(expr, c);
    if (resultY1 === null) {
      console.log("* Failed to read Y1 from " + expr + ".");
      return false;
    }
    this.y1 = resultY1;

    while (c < expr.length && isNumeric(expr.charAt(c)))
      c++;
    while (c < expr.length && !isNumeric(expr.charAt(c)))
      c++;

    const resultX2 = extractDoubleAt(expr, c);
    if (resultX2 === null) {
      console.log("* Failed to read X2 from " + expr + ".");
      return false;
    }
    this.x = resultX2;

    while (c < expr.length && isNumeric(expr.charAt(c)))
      c++;
    while (c < expr.length && !isNumeric(expr.charAt(c)))
      c++;

    const resultY2 = extractDoubleAt(expr, c);
    if (resultY2 === null) {
      console.log("* Failed to read Y2 from " + expr + ".");
      return false;
    }
    this.y = resultY2;

    return true;
  }

  // --------------------------------------------------------------------------

  /** @java QuadTo.expectedNumValues() */
  public override expectedNumValues(): number {
    return 4;
  }

  /** @java QuadTo.setValues(List<Double>, Point2D[]) */
  public override setValues(values: number[], current: (Point2D | null)[]): void {
    this.x1 = values[0] ?? 0;
    this.y1 = values[1] ?? 0;
    this.x  = values[2] ?? 0;
    this.y  = values[3] ?? 0;

    current[0] = makePoint2D(this.x, this.y);
    current[1] = makePoint2D(this.x1, this.y1);
  }

  // --------------------------------------------------------------------------

  /** @java QuadTo.getPoints(List<Point2D>) */
  public override getPoints(pts: Point2D[]): void {
    pts.push(makePoint2D(this.x1, this.y1));
    pts.push(makePoint2D(this.x, this.y));
  }

  // --------------------------------------------------------------------------

  /** @java QuadTo.toString() */
  public override toString(): string {
    return this.label + ": x1=" + this.x1 + ", y1=" + this.y1 + ", x=" + this.x + ", y=" + this.y;
  }

  // --------------------------------------------------------------------------

  /** @java QuadTo.apply(GeneralPath, double, double) */
  public override apply(path: GeneralPath, x0: number, y0: number): void {
    if (this.absolute()) {
      path.quadTo(x0 + this.x1, y0 + this.y1, x0 + this.x, y0 + this.y);
    } else {
      const pt = path.getCurrentPoint();
      path.quadTo(pt.getX() + this.x1, pt.getY() + this.y1, pt.getX() + this.x, pt.getY() + this.y);
    }
  }

  // --------------------------------------------------------------------------
}
