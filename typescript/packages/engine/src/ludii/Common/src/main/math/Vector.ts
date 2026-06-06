// @java Common/src/main/math/Vector.java

import { Point3D } from './Point3D.js';

/**
 * 2D vector.
 *
 * @java main/math/Vector.java
 * @author cambolbro
 */
export class Vector {

  //-------------------------------------------------------------------------

  /** @java Vector.x */
  private x: number = 0;

  /** @java Vector.y */
  private y: number = 0;

  /** @java Vector.z */
  private z: number = 0;

  //-------------------------------------------------------------------------

  /**
   * Constructor from (x, y).
   * @java Vector(double, double)
   */
  public constructor(x: number, y: number);
  /**
   * Constructor from (x, y, z).
   * @java Vector(double, double, double)
   */
  public constructor(x: number, y: number, z: number);
  /**
   * Constructor from awt-like Point2D (getX/getY).
   * @java Vector(Point2D)
   */
  public constructor(pt: { getX(): number; getY(): number });
  /**
   * Constructor from two awt-like Point2D objects (direction vector A→B).
   * @java Vector(Point2D, Point2D)
   */
  public constructor(ptA: { getX(): number; getY(): number }, ptB: { getX(): number; getY(): number });
  /**
   * Constructor from two Point3D objects (direction vector A→B).
   * @java Vector(Point3D, Point3D)
   */
  public constructor(ptA: Point3D, ptB: Point3D);
  /**
   * Copy constructor.
   * @java Vector(Vector)
   */
  public constructor(other: Vector);
  public constructor(
    xOrPtOrOther: number | { getX(): number; getY(): number } | Point3D | Vector,
    yOrPtB?: number | { getX(): number; getY(): number } | Point3D,
    z?: number
  ) {
    if (typeof xOrPtOrOther === "number") {
      this.x = xOrPtOrOther;
      this.y = typeof yOrPtB === "number" ? yOrPtB : 0;
      this.z = z ?? 0;
    } else if (xOrPtOrOther instanceof Vector) {
      const other = xOrPtOrOther;
      this.x = other.x;
      this.y = other.y;
      this.z = other.z;
    } else if (xOrPtOrOther instanceof Point3D) {
      // Vector(Point3D ptA, Point3D ptB)
      const ptA = xOrPtOrOther;
      const ptB = yOrPtB as Point3D;
      this.x = ptB.getX() - ptA.getX();
      this.y = ptB.getY() - ptA.getY();
      this.z = ptB.getZ() - ptA.getZ();
    } else {
      // awt-like Point2D
      const ptA = xOrPtOrOther as { getX(): number; getY(): number };
      if (yOrPtB !== undefined && typeof yOrPtB !== "number") {
        // Vector(Point2D ptA, Point2D ptB)
        const ptB = yOrPtB as { getX(): number; getY(): number };
        this.x = ptB.getX() - ptA.getX();
        this.y = ptB.getY() - ptA.getY();
      } else {
        // Vector(Point2D pt)
        this.x = ptA.getX();
        this.y = ptA.getY();
      }
    }
  }

  //-------------------------------------------------------------------------

  /** @java Vector.x() */
  public getX(): number {
    return this.x;
  }

  /** @java Vector.y() */
  public getY(): number {
    return this.y;
  }

  /** @java Vector.z() */
  public getZ(): number {
    return this.z;
  }

  /** @java Vector.set(double, double, double) */
  public set(xx: number, yy: number, zz: number): void {
    this.x = xx;
    this.y = yy;
    this.z = zz;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Magnitude of vector.
   * @java Vector.magnitude()
   */
  public magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Normalise to unit vector.
   * @java Vector.normalise()
   */
  public normalise(): void {
    const mag = this.magnitude();
    if (mag < 0.0000001)
      return; // too small
    this.x /= mag;
    this.y /= mag;
    this.z /= mag;
  }

  /**
   * @java Vector.direction()
   */
  public direction(): number {
    return Math.atan2(this.y, this.x); // in radians, -PI .. PI
  }

  /** @java Vector.reverse() */
  public reverse(): void {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
  }

  /**
   * Make perpendicular (to right?).
   * @java Vector.perpendicular()
   */
  public perpendicular(): void {
    const tmp = this.x;
    this.x = -this.y;
    this.y = tmp;
  }

  /**
   * @java Vector.translate(double, double)
   */
  public translate(dx: number, dy: number): void;
  /**
   * @java Vector.translate(double, double, double)
   */
  public translate(dx: number, dy: number, dz: number): void;
  public translate(dx: number, dy: number, dz?: number): void {
    this.x += dx;
    this.y += dy;
    if (dz !== undefined) this.z += dz;
  }

  /**
   * @java Vector.scale(double)
   */
  public scale(factor: number): void;
  /**
   * @java Vector.scale(double, double)
   */
  public scale(sx: number, sy: number): void;
  /**
   * @java Vector.scale(double, double, double)
   */
  public scale(sx: number, sy: number, sz: number): void;
  public scale(sx: number, sy?: number, sz?: number): void {
    if (sy === undefined) {
      this.x *= sx;
      this.y *= sx;
      this.z *= sx;
    } else if (sz === undefined) {
      this.x *= sx;
      this.y *= sy;
    } else {
      this.x *= sx;
      this.y *= sy;
      this.z *= sz;
    }
  }

  /**
   * @param theta Radians.
   * @java Vector.rotate(double)
   */
  public rotate(theta: number): void {
    const xx = this.x * Math.cos(theta) - this.y * Math.sin(theta);
    const yy = this.y * Math.cos(theta) + this.x * Math.sin(theta);
    this.x = xx;
    this.y = yy;
  }

  /**
   * @return Dot product of this vector and another.
   * @java Vector.dotProduct(Vector)
   */
  public dotProduct(other: Vector): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  /**
   * @return Determinant of this vector and another.
   * @java Vector.determinant(Vector)
   */
  public determinant(other: Vector): number {
    return this.x * other.y - this.y * other.x;
  }

  //-------------------------------------------------------------------------

  /** @java Vector.toString() */
  public toString(): string {
    const fmt = (v: number) => parseFloat(v.toFixed(3)).toString();
    return "<" + fmt(this.x) + "," + fmt(this.y) + "," + fmt(this.z) + ">";
  }

  //-------------------------------------------------------------------------
}
