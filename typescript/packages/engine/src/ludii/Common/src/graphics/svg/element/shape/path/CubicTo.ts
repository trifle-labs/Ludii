// @java Common/src/graphics/svg/element/shape/path/CubicTo.java

/**
 * SVG path cubic curve to operation.
 *
 * @java graphics/svg/element/shape/path/CubicTo.java
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
//   C 100 100 200 200 300 100
//   c 100 100 200 200 300 100

/**
 * SVG path cubic curve to operation.
 *
 * @java graphics/svg/element/shape/path/CubicTo.java
 */
export class CubicTo extends PathOp {
  /** @java CubicTo.x1 */
  private x1: number = 0;

  /** @java CubicTo.y1 */
  private y1: number = 0;

  /** @java CubicTo.x2 */
  private x2: number = 0;

  /** @java CubicTo.y2 */
  private y2: number = 0;

  /** @java CubicTo.x */
  private x: number = 0;

  /** @java CubicTo.y */
  private y: number = 0;

  // --------------------------------------------------------------------------

  /** @java CubicTo() */
  public constructor() {
    super('C');
  }

  // --------------------------------------------------------------------------

  /** @java CubicTo.x1() */
  public getX1(): number { return this.x1; }

  /** @java CubicTo.y1() */
  public getY1(): number { return this.y1; }

  /** @java CubicTo.x2() */
  public getX2(): number { return this.x2; }

  /** @java CubicTo.y2() */
  public getY2(): number { return this.y2; }

  /** @java CubicTo.x() */
  public getX(): number { return this.x; }

  /** @java CubicTo.y() */
  public getY(): number { return this.y; }

  // --------------------------------------------------------------------------

  /** @java CubicTo.newInstance() */
  public override newInstance(): PathOp {
    return new CubicTo();
  }

  // --------------------------------------------------------------------------

  /** @java CubicTo.bounds() */
  public override bounds(): Rectangle2D {
    const x0 = Math.min(this.x1, Math.min(this.x2, this.x));
    const y0 = Math.min(this.y1, Math.min(this.y2, this.y));
    const width  = Math.max(this.x1, Math.max(this.x2, this.x)) - x0;
    const height = Math.max(this.y1, Math.max(this.y2, this.y)) - y0;
    return makeRect(x0, y0, width, height);
  }

  // --------------------------------------------------------------------------

  /** @java CubicTo.load(String) */
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
    this.x2 = resultX2;

    while (c < expr.length && isNumeric(expr.charAt(c)))
      c++;
    while (c < expr.length && !isNumeric(expr.charAt(c)))
      c++;

    const resultY2 = extractDoubleAt(expr, c);
    if (resultY2 === null) {
      console.log("* Failed to read Y2 from " + expr + ".");
      return false;
    }
    this.y2 = resultY2;

    while (c < expr.length && isNumeric(expr.charAt(c)))
      c++;
    while (c < expr.length && !isNumeric(expr.charAt(c)))
      c++;

    const resultX3 = extractDoubleAt(expr, c);
    if (resultX3 === null) {
      console.log("* Failed to read X3 from " + expr + ".");
      return false;
    }
    this.x = resultX3;

    while (c < expr.length && isNumeric(expr.charAt(c)))
      c++;
    while (c < expr.length && !isNumeric(expr.charAt(c)))
      c++;

    const resultY3 = extractDoubleAt(expr, c);
    if (resultY3 === null) {
      console.log("* Failed to read Y3 from " + expr + ".");
      return false;
    }
    this.y = resultY3;

    return true;
  }

  // --------------------------------------------------------------------------

  /** @java CubicTo.expectedNumValues() */
  public override expectedNumValues(): number {
    return 6;
  }

  /** @java CubicTo.setValues(List<Double>, Point2D[]) */
  public override setValues(values: number[], current: (Point2D | null)[]): void {
    this.x1 = values[0] ?? 0;
    this.y1 = values[1] ?? 0;
    this.x2 = values[2] ?? 0;
    this.y2 = values[3] ?? 0;
    this.x  = values[4] ?? 0;
    this.y  = values[5] ?? 0;

    current[0] = makePoint2D(this.x, this.y);
    current[1] = makePoint2D(this.x2, this.y2);
  }

  // --------------------------------------------------------------------------

  /** @java CubicTo.getPoints(List<Point2D>) */
  public override getPoints(pts: Point2D[]): void {
    pts.push(makePoint2D(this.x1, this.y1));
    pts.push(makePoint2D(this.x2, this.y2));
    pts.push(makePoint2D(this.x, this.y));
  }

  // --------------------------------------------------------------------------

  /** @java CubicTo.toString() */
  public override toString(): string {
    return (
      this.label +
      ": x1=" + this.x1 +
      ", y1=" + this.y1 +
      ", x2=" + this.x2 +
      ", y2=" + this.y2 +
      ", x=" + this.x +
      ", y=" + this.y
    );
  }

  // --------------------------------------------------------------------------

  /** @java CubicTo.apply(GeneralPath, double, double) */
  public override apply(path: GeneralPath, x0: number, y0: number): void {
    if (this.absolute()) {
      path.curveTo(x0 + this.x1, y0 + this.y1, x0 + this.x2, y0 + this.y2, x0 + this.x, y0 + this.y);
    } else {
      const pt = path.getCurrentPoint();
      path.curveTo(
        pt.getX() + this.x1, pt.getY() + this.y1,
        pt.getX() + this.x2, pt.getY() + this.y2,
        pt.getX() + this.x, pt.getY() + this.y
      );
    }
  }

  // --------------------------------------------------------------------------
}
