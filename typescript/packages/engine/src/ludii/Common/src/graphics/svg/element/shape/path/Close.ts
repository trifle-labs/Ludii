// @java Common/src/graphics/svg/element/shape/path/Close.java

/**
 * SVG path close operation.
 *
 * @java graphics/svg/element/shape/path/Close.java
 * @author cambolbro
 */

import { PathOp, type Point2D, type GeneralPath } from "./PathOp.js";

// Format:
//   Z
//   z

/**
 * SVG path close operation.
 *
 * @java graphics/svg/element/shape/path/Close.java
 */
export class Close extends PathOp {
  // --------------------------------------------------------------------------

  /** @java Close() */
  public constructor() {
    super('Z');
  }

  // --------------------------------------------------------------------------

  /** @java Close.newInstance() */
  public override newInstance(): PathOp {
    return new Close();
  }

  // --------------------------------------------------------------------------

  /** @java Close.load(String) */
  public override load(expr: string): boolean {
    // Is absolute if label is upper case
    this.label = expr.charAt(0);

    return true;
  }

  // --------------------------------------------------------------------------

  /** @java Close.expectedNumValues() */
  public override expectedNumValues(): number {
    return 0;
  }

  /** @java Close.setValues(List<Double>, Point2D[]) */
  public override setValues(_values: number[], current: (Point2D | null)[]): void {
    current[0] = null;
    current[1] = null;
  }

  // --------------------------------------------------------------------------

  /** @java Close.getPoints(List<Point2D>) */
  public override getPoints(_pts: Point2D[]): void {
    // ...
  }

  // --------------------------------------------------------------------------

  /** @java Close.toString() */
  public override toString(): string {
    return this.label;
  }

  // --------------------------------------------------------------------------

  /** @java Close.apply(GeneralPath, double, double) */
  public override apply(path: GeneralPath, _x0: number, _y0: number): void {
    path.closePath();
  }

  // --------------------------------------------------------------------------
}
