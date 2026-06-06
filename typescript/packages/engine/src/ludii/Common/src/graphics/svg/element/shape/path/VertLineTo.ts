// @java Common/src/graphics/svg/element/shape/path/VertLineTo.java

/**
 * SVG path vertical line to operation.
 *
 * @java graphics/svg/element/shape/path/VertLineTo.java
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
//   V 100
//   v 100

/**
 * SVG path vertical line to operation.
 *
 * @java graphics/svg/element/shape/path/VertLineTo.java
 */
export class VertLineTo extends PathOp {
  /** @java VertLineTo.x */
  private x: number = 0;

  /** @java VertLineTo.y */
  private y: number = 0;

  // --------------------------------------------------------------------------

  /** @java VertLineTo() */
  public constructor() {
    super('V');
  }

  // --------------------------------------------------------------------------

  /** @java VertLineTo.y() */
  public getY(): number {
    return this.y;
  }

  // --------------------------------------------------------------------------

  /** @java VertLineTo.newInstance() */
  public override newInstance(): PathOp {
    return new VertLineTo();
  }

  // --------------------------------------------------------------------------

  /** @java VertLineTo.bounds() */
  public override bounds(): Rectangle2D {
    return makeRect(this.y, this.y, 0, 0);
  }

  // --------------------------------------------------------------------------

  /** @java VertLineTo.load(String) */
  public override load(expr: string): boolean {
    // Is absolute if label is upper case
    this.label = expr.charAt(0);

    const c = 1;

    const resultY = extractDoubleAt(expr, c);
    if (resultY === null) {
      console.log("* Failed to read Y from " + expr + ".");
      return false;
    }
    this.y = resultY;

    return true;
  }

  // --------------------------------------------------------------------------

  /** @java VertLineTo.expectedNumValues() */
  public override expectedNumValues(): number {
    return 1;
  }

  /** @java VertLineTo.setValues(List<Double>, Point2D[]) */
  public override setValues(values: number[], current: (Point2D | null)[]): void {
    this.y = values[0] ?? 0;

    this.x = current[0]!.getX();

    current[0] = makePoint2D(this.x, this.y);
    current[1] = null;
  }

  // --------------------------------------------------------------------------

  /** @java VertLineTo.getPoints(List<Point2D>) */
  public override getPoints(pts: Point2D[]): void {
    pts.push(makePoint2D(this.x, this.y));
  }

  // --------------------------------------------------------------------------

  /** @java VertLineTo.toString() */
  public override toString(): string {
    return this.label + ": (x)=" + this.x + ", y=" + this.y;
  }

  // --------------------------------------------------------------------------

  /** @java VertLineTo.apply(GeneralPath, double, double) */
  public override apply(path: GeneralPath, _x0: number, y0: number): void {
    const pt = path.getCurrentPoint();
    if (this.absolute()) {
      path.moveTo(pt.getX(), y0 + this.y);
    } else {
      path.moveTo(pt.getX(), pt.getY() + this.y);
    }
  }

  // --------------------------------------------------------------------------
}
