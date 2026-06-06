// @java Common/src/graphics/svg/element/shape/path/ShortQuadTo.java

/**
 * SVG path quadratic curve to operation.
 *
 * @java graphics/svg/element/shape/path/ShortQuadTo.java
 * @author cambolbro
 *
 * Format:
 *   T 200 200
 *   t 200 200
 */

import { PathOp, type Point2D, type GeneralPath, type Rectangle2D, makePoint2D, makeRect } from "./PathOp.js";

// SVGParser helpers inlined (SVGParser not yet ported)
function isNumeric(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
}

function extractDoubleAt(expr: string, from: number): number | null {
  let c = from;
  while (c < expr.length && !isNumeric(expr[c] ?? ''))
    c++;
  let cc = c + 1;
  while (cc < expr.length && isNumeric(expr[cc] ?? ''))
    cc++;
  const sub = expr.substring(c, cc);
  const result = parseFloat(sub);
  return isNaN(result) ? null : result;
}

// ---------------------------------------------------------------------------

/**
 * SVG path quadratic curve to operation (shorthand).
 *
 * @java graphics.svg.element.shape.path.ShortQuadTo
 */
export class ShortQuadTo extends PathOp {
  /** @java ShortQuadTo.x */
  private x: number = 0;

  /** @java ShortQuadTo.y */
  private y: number = 0;

  /** @java ShortQuadTo.x1 */
  private x1: number = 0;

  /** @java ShortQuadTo.y1 */
  private y1: number = 0;

  // --------------------------------------------------------------------------

  /** @java ShortQuadTo() */
  public constructor() {
    super('T');
  }

  // --------------------------------------------------------------------------

  /** @java ShortQuadTo.x() */
  public getX(): number {
    return this.x;
  }

  /** @java ShortQuadTo.y() */
  public getY(): number {
    return this.y;
  }

  // --------------------------------------------------------------------------

  /** @java ShortQuadTo.newInstance() */
  public override newInstance(): PathOp {
    return new ShortQuadTo();
  }

  // --------------------------------------------------------------------------

  /** @java ShortQuadTo.bounds() */
  public override bounds(): Rectangle2D {
    const x0 = Math.min(this.x1, this.x);
    const y0 = Math.min(this.y1, this.y);
    const width  = Math.max(this.x1, this.x) - x0;
    const height = Math.max(this.y1, this.y) - y0;
    return makeRect(x0, y0, width, height);
  }

  // --------------------------------------------------------------------------

  /** @java ShortQuadTo.load(String) */
  public override load(expr: string): boolean {
    // Is absolute if label is upper case
    this.label = expr.charAt(0);

    let c = 1;

    const resultX2 = extractDoubleAt(expr, c);
    if (resultX2 === null) {
      console.log("* Failed to read X2 from " + expr + ".");
      return false;
    }
    this.x = resultX2;

    while (c < expr.length && isNumeric(expr[c] ?? ''))
      c++;
    while (c < expr.length && !isNumeric(expr[c] ?? ''))
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

  /** @java ShortQuadTo.expectedNumValues() */
  public override expectedNumValues(): number {
    return 2;
  }

  // --------------------------------------------------------------------------

  /** @java ShortQuadTo.setValues(List<Double>, Point2D[]) */
  public override setValues(values: number[], current: (Point2D | null)[]): void {
    this.x = values[0] ?? 0;
    this.y = values[1] ?? 0;

    // Calculate x1 and y1:
    //   (newx1, newy1) = (curx - (oldx2 - curx), cury - (oldy2 - cury))
    //                  = (2*curx - oldx2, 2*cury - oldy2)

    const cur = current[0];
    const old = current[1];

    const currentX = cur !== null && cur !== undefined ? cur.getX() : 0;
    const currentY = cur !== null && cur !== undefined ? cur.getY() : 0;

    const oldX = (old === null || old === undefined) ? currentX : old.getX();
    const oldY = (old === null || old === undefined) ? currentY : old.getY();

    this.x1 = 2 * currentX - oldX;
    this.y1 = 2 * currentY - oldY;

    current[0] = makePoint2D(this.x, this.y);
    current[1] = makePoint2D(this.x1, this.y1);
  }

  // --------------------------------------------------------------------------

  /** @java ShortQuadTo.getPoints(List<Point2D>) */
  public override getPoints(pts: Point2D[]): void {
    pts.push(makePoint2D(this.x1, this.y1));
    pts.push(makePoint2D(this.x, this.y));
  }

  // --------------------------------------------------------------------------

  /** @java ShortQuadTo.toString() */
  public override toString(): string {
    return (
      this.label +
      ": (x1=)=" + this.x1 +
      ", (y1)=" + this.y1 +
      ", x=" + this.x +
      ", y=" + this.y
    );
  }

  // --------------------------------------------------------------------------

  /** @java ShortQuadTo.apply(GeneralPath, double, double) */
  public override apply(path: GeneralPath, x0: number, y0: number): void {
    if (this.absolute()) {
      path.quadTo(x0 + this.x1, y0 + this.y1, x0 + this.x, y0 + this.y);
    } else {
      const pt = path.getCurrentPoint();
      path.quadTo(
        pt.getX() + this.x1, pt.getY() + this.y1,
        pt.getX() + this.x, pt.getY() + this.y
      );
    }
  }

  // --------------------------------------------------------------------------
}
