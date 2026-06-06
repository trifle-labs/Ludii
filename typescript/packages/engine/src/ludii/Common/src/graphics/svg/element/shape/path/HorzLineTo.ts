// @java Common/src/graphics/svg/element/shape/path/HorzLineTo.java

/**
 * SVG path horizontal line to operation.
 *
 * @java graphics/svg/element/shape/path/HorzLineTo.java
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
//   H 100
//   h 100

/**
 * SVG path horizontal line to operation.
 *
 * @java graphics/svg/element/shape/path/HorzLineTo.java
 */
export class HorzLineTo extends PathOp {
  /** @java HorzLineTo.x */
  private x: number = 0;

  /** @java HorzLineTo.y */
  private y: number = 0;

  // --------------------------------------------------------------------------

  /** @java HorzLineTo() */
  public constructor() {
    super('H');
  }

  // --------------------------------------------------------------------------

  /** @java HorzLineTo.x() */
  public getX(): number {
    return this.x;
  }

  // --------------------------------------------------------------------------

  /** @java HorzLineTo.newInstance() */
  public override newInstance(): PathOp {
    return new HorzLineTo();
  }

  // --------------------------------------------------------------------------

  /** @java HorzLineTo.bounds() */
  public override bounds(): Rectangle2D {
    return makeRect(this.x, this.y, 0, 0);
  }

  // --------------------------------------------------------------------------

  /** @java HorzLineTo.load(String) */
  public override load(expr: string): boolean {
    // Is absolute if label is upper case
    this.label = expr.charAt(0);

    const c = 1;

    const resultX = extractDoubleAt(expr, c);
    if (resultX === null) {
      console.log("* Failed to read X from " + expr + ".");
      return false;
    }
    this.x = resultX;

    return true;
  }

  // --------------------------------------------------------------------------

  /** @java HorzLineTo.expectedNumValues() */
  public override expectedNumValues(): number {
    return 1;
  }

  /** @java HorzLineTo.setValues(List<Double>, Point2D[]) */
  public override setValues(values: number[], current: (Point2D | null)[]): void {
    this.x = values[0] ?? 0;

    this.y = current[0]!.getY();

    current[0] = makePoint2D(this.x, this.y);
    current[1] = null;
  }

  // --------------------------------------------------------------------------

  /** @java HorzLineTo.getPoints(List<Point2D>) */
  public override getPoints(pts: Point2D[]): void {
    pts.push(makePoint2D(this.x, this.y));
  }

  // --------------------------------------------------------------------------

  /** @java HorzLineTo.toString() */
  public override toString(): string {
    return this.label + ": x=" + this.x + ", (y)=" + this.y;
  }

  // --------------------------------------------------------------------------

  /** @java HorzLineTo.apply(GeneralPath, double, double) */
  public override apply(path: GeneralPath, x0: number, _y0: number): void {
    const pt = path.getCurrentPoint();
    if (this.absolute()) {
      path.moveTo(x0 + this.x, pt.getY());
    } else {
      path.moveTo(pt.getX() + this.x, pt.getY());
    }
  }

  // --------------------------------------------------------------------------
}
