// @java Common/src/main/math/Point2D.java

/**
 * 2D point.
 *
 * @java main/math/Point2D.java
 * @author Dennis Soemers and cambolbro
 */
export class Point2D {

  //-------------------------------------------------------------------------

  /** X coordinate. @java Point2D.x */
  private x: number;

  /** Y coordinate. @java Point2D.y */
  private y: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @param x
   * @param y
   * @java Point2D(double, double)
   */
  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  //-------------------------------------------------------------------------

  /**
   * @return X coordinate
   * @java Point2D.x()
   */
  public getX(): number {
    return this.x;
  }

  /**
   * @return Y coordinate
   * @java Point2D.y()
   */
  public getY(): number {
    return this.y;
  }

  //-------------------------------------------------------------------------

  /**
   * Set coordinates.
   * @param newX
   * @param newY
   * @java Point2D.set(double, double)
   */
  public set(newX: number, newY: number): void {
    this.x = newX;
    this.y = newY;
  }

  //-------------------------------------------------------------------------

  /**
   * @param other
   * @return Euclidean distance to other point
   * @java Point2D.distance(Point2D)
   */
  public distance(other: Point2D): number {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  //-------------------------------------------------------------------------

  /**
   * Translate the point.
   * @param dx
   * @param dy
   * @java Point2D.translate(double, double)
   */
  public translate(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /**
   * Scale the point by one scalar.
   * @param s
   * @java Point2D.scale(double)
   */
  public scale(s: number): void;
  /**
   * Scale the two coordinates by two scalars.
   * @param sx
   * @param sy
   * @java Point2D.scale(double, double)
   */
  public scale(sx: number, sy: number): void;
  public scale(sx: number, sy?: number): void {
    if (sy === undefined) {
      this.x *= sx;
      this.y *= sx;
    } else {
      this.x *= sx;
      this.y *= sy;
    }
  }

  //-------------------------------------------------------------------------

  /** @java Point2D.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    const tempX = this.doubleToLongBits(this.x);
    result = prime * result + this.longBitsToHashComponent(tempX);
    const tempY = this.doubleToLongBits(this.y);
    result = prime * result + this.longBitsToHashComponent(tempY);
    return result | 0;
  }

  /** @java Point2D.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj)
      return true;
    if (!(obj instanceof Point2D))
      return false;
    const other = obj as Point2D;
    return this.doubleToLongBits(this.x) === this.doubleToLongBits(other.x) &&
           this.doubleToLongBits(this.y) === this.doubleToLongBits(other.y);
  }

  private doubleToLongBits(v: number): bigint {
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setFloat64(0, v);
    return view.getBigInt64(0);
  }

  private longBitsToHashComponent(bits: bigint): number {
    return Number(BigInt.asIntN(32, bits ^ (bits >> 32n)));
  }

  //-------------------------------------------------------------------------

  /**
   * @param other
   * @param tolerance
   * @return Are we approximately equal (given tolerance level)?
   * @java Point2D.equalsApprox(Point2D, double)
   */
  public equalsApprox(other: Point2D, tolerance: number): boolean {
    return (Math.abs(this.x - other.x) <= tolerance && Math.abs(this.y - other.y) <= tolerance);
  }

  //-------------------------------------------------------------------------
}
