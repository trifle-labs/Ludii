// @java Common/src/graphics/svg/element/shape/path/LineTo.java

/**
 * SVG path line to operation.
 *
 * @java graphics/svg/element/shape/path/LineTo.java
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
//   L 100 100
//   l 100 100

/**
 * SVG path line to operation.
 *
 * @java graphics/svg/element/shape/path/LineTo.java
 */
export class LineTo extends PathOp {
  /** @java LineTo.x */
  private x: number = 0;

  /** @java LineTo.y */
  private y: number = 0;

  // --------------------------------------------------------------------------

  /** @java LineTo() */
  public constructor() {
    super('L');
  }

  // --------------------------------------------------------------------------

  /** @java LineTo.x() */
  public getX(): number { return this.x; }

  /** @java LineTo.y() */
  public getY(): number { return this.y; }

  // --------------------------------------------------------------------------

  /** @java LineTo.newInstance() */
  public override newInstance(): PathOp {
    return new LineTo();
  }

  // --------------------------------------------------------------------------

  /** @java LineTo.bounds() */
  public override bounds(): Rectangle2D {
    return makeRect(this.x, this.y, 0, 0);
  }

  // --------------------------------------------------------------------------

  /** @java LineTo.load(String) */
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

  /** @java LineTo.expectedNumValues() */
  public override expectedNumValues(): number {
    return 2;
  }

  /** @java LineTo.setValues(List<Double>, Point2D[]) */
  public override setValues(values: number[], current: (Point2D | null)[]): void {
    this.x = values[0] ?? 0;
    this.y = values[1] ?? 0;

    current[0] = makePoint2D(this.x, this.y);
    current[1] = null;
  }

  // --------------------------------------------------------------------------

  /** @java LineTo.getPoints(List<Point2D>) */
  public override getPoints(pts: Point2D[]): void {
    pts.push(makePoint2D(this.x, this.y));
  }

  // --------------------------------------------------------------------------

  /** @java LineTo.toString() */
  public override toString(): string {
    return this.label + ": x=" + this.x + ", y=" + this.y;
  }

  // --------------------------------------------------------------------------

  /** @java LineTo.apply(GeneralPath, double, double) */
  public override apply(path: GeneralPath, x0: number, y0: number): void {
    if (this.absolute()) {
      path.lineTo(x0 + this.x, y0 + this.y);
    } else {
      const pt = path.getCurrentPoint();
      path.lineTo(pt.getX() + this.x, pt.getY() + this.y);
    }
  }

  // --------------------------------------------------------------------------
}
