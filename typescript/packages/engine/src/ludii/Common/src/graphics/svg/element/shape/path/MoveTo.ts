// @java Common/src/graphics/svg/element/shape/path/MoveTo.java

/**
 * SVG path move to operation.
 *
 * @java graphics/svg/element/shape/path/MoveTo.java
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
//   M 100 100
//   m 100 100

/**
 * SVG path move to operation.
 *
 * @java graphics/svg/element/shape/path/MoveTo.java
 */
export class MoveTo extends PathOp {
  /** @java MoveTo.x */
  private x: number = 0;

  /** @java MoveTo.y */
  private y: number = 0;

  // --------------------------------------------------------------------------

  /** @java MoveTo() */
  public constructor() {
    super('M');
  }

  // --------------------------------------------------------------------------

  /** @java MoveTo.x() */
  public getX(): number { return this.x; }

  /** @java MoveTo.y() */
  public getY(): number { return this.y; }

  // --------------------------------------------------------------------------

  /** @java MoveTo.newInstance() */
  public override newInstance(): PathOp {
    return new MoveTo();
  }

  // --------------------------------------------------------------------------

  /** @java MoveTo.bounds() */
  public override bounds(): Rectangle2D {
    return makeRect(this.x, this.y, 0, 0);
  }

  // --------------------------------------------------------------------------

  /** @java MoveTo.load(String) */
  public override load(expr: string): boolean {
    // Is absolute if label is upper case
    this.label = expr.charAt(0);

    let c = 1;

    const resultX = extractDoubleAt(expr, c);
    if (resultX === null) {
      console.log("* Failed to read X from " + expr + ".");
      return false;
    }
    this.x = resultX;

    while (c < expr.length && isNumeric(expr.charAt(c)))
      c++;
    while (c < expr.length && !isNumeric(expr.charAt(c)))
      c++;

    const resultY = extractDoubleAt(expr, c);
    if (resultY === null) {
      console.log("* Failed to read Y from " + expr + ".");
      return false;
    }
    this.y = resultY;

    return true;
  }

  // --------------------------------------------------------------------------

  /** @java MoveTo.expectedNumValues() */
  public override expectedNumValues(): number {
    return 2;
  }

  /** @java MoveTo.setValues(List<Double>, Point2D[]) */
  public override setValues(values: number[], current: (Point2D | null)[]): void {
    this.x = values[0] ?? 0;
    this.y = values[1] ?? 0;

    current[0] = makePoint2D(this.x, this.y);
    current[1] = null;
  }

  // --------------------------------------------------------------------------

  /** @java MoveTo.getPoints(List<Point2D>) */
  public override getPoints(pts: Point2D[]): void {
    pts.push(makePoint2D(this.x, this.y));
  }

  // --------------------------------------------------------------------------

  /** @java MoveTo.toString() */
  public override toString(): string {
    return this.label + ": x=" + this.x + ", y=" + this.y;
  }

  // --------------------------------------------------------------------------

  /** @java MoveTo.apply(GeneralPath, double, double) */
  public override apply(path: GeneralPath, x0: number, y0: number): void {
    if (this.absolute()) {
      path.moveTo(x0 + this.x, y0 + this.y);
    } else {
      const pt = path.getCurrentPoint();
      path.moveTo(pt.getX() + this.x, pt.getY() + this.y);
    }
  }

  // --------------------------------------------------------------------------
}
