// @java Common/src/main/math/Point3D.java

/**
 * 3D point.
 *
 * @java main/math/Point3D.java
 * @author cambolbro
 */
export class Point3D {

  //-------------------------------------------------------------------------

  /** @java Point3D.x */
  private x: number;

  /** @java Point3D.y */
  private y: number;

  /** @java Point3D.z */
  private z: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor (2D).
   * @java Point3D(double, double)
   */
  public constructor(x: number, y: number);
  /**
   * Constructor (3D).
   * @java Point3D(double, double, double)
   */
  public constructor(x: number, y: number, z: number);
  /**
   * Copy constructor from Point3D.
   * @java Point3D(Point3D)
   */
  public constructor(other: Point3D);
  /**
   * Constructor from awt Point2D-like object (getX/getY).
   * @java Point3D(Point2D)
   */
  public constructor(other: { getX(): number; getY(): number });
  public constructor(
    xOrOther: number | Point3D | { getX(): number; getY(): number },
    y?: number,
    z?: number
  ) {
    if (typeof xOrOther === "number") {
      this.x = xOrOther;
      this.y = y ?? 0;
      this.z = z ?? 0;
    } else if (xOrOther instanceof Point3D) {
      this.x = xOrOther.x;
      this.y = xOrOther.y;
      this.z = xOrOther.z;
    } else {
      // awt-like Point2D
      const pt = xOrOther as { getX(): number; getY(): number };
      this.x = pt.getX();
      this.y = pt.getY();
      this.z = 0;
    }
  }

  //-------------------------------------------------------------------------

  /** @java Point3D.x() */
  public getX(): number {
    return this.x;
  }

  /** @java Point3D.y() */
  public getY(): number {
    return this.y;
  }

  /** @java Point3D.z() */
  public getZ(): number {
    return this.z;
  }

  //-------------------------------------------------------------------------

  /**
   * @java Point3D.set(double, double)
   */
  public set(xx: number, yy: number): void;
  /**
   * @java Point3D.set(double, double, double)
   */
  public set(xx: number, yy: number, zz: number): void;
  /**
   * @java Point3D.set(Point3D)
   */
  public set(other: Point3D): void;
  /**
   * @java Point3D.set(Point2D)
   */
  public set(other: { getX(): number; getY(): number }): void;
  public set(
    xxOrOther: number | Point3D | { getX(): number; getY(): number },
    yy?: number,
    zz?: number
  ): void {
    if (typeof xxOrOther === "number") {
      this.x = xxOrOther;
      this.y = yy ?? 0;
      this.z = zz ?? this.z;
    } else if (xxOrOther instanceof Point3D) {
      this.x = xxOrOther.x;
      this.y = xxOrOther.y;
      this.z = xxOrOther.z;
    } else {
      const pt = xxOrOther as { getX(): number; getY(): number };
      this.x = pt.getX();
      this.y = pt.getY();
      this.z = 0;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java Point3D.distance(Point3D)
   */
  public distance(other: Point3D): number;
  /**
   * @java Point3D.distance(Point2D)
   */
  public distance(other: { getX(): number; getY(): number }): number;
  public distance(other: Point3D | { getX(): number; getY(): number }): number {
    if (other instanceof Point3D) {
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dz = other.z - this.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    } else {
      const pt = other as { getX(): number; getY(): number };
      const dx = pt.getX() - this.x;
      const dy = pt.getY() - this.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java Point3D.translate(double, double)
   */
  public translate(dx: number, dy: number): void;
  /**
   * @java Point3D.translate(double, double, double)
   */
  public translate(dx: number, dy: number, dz: number): void;
  public translate(dx: number, dy: number, dz?: number): void {
    this.x += dx;
    this.y += dy;
    if (dz !== undefined) this.z += dz;
  }

  /**
   * @java Point3D.scale(double)
   */
  public scale(s: number): void;
  /**
   * @java Point3D.scale(double, double)
   */
  public scale(sx: number, sy: number): void;
  /**
   * @java Point3D.scale(double, double, double)
   */
  public scale(sx: number, sy: number, sz: number): void;
  public scale(sx: number, sy?: number, sz?: number): void {
    this.x *= sx;
    this.y *= sy ?? sx;
    this.z *= sz ?? (sy === undefined ? sx : 1);
  }

  //-------------------------------------------------------------------------
}
