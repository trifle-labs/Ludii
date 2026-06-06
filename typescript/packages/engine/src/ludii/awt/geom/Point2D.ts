// @java java.awt.geom.Point2D

/** Immutable/mutable 2-D point with double coordinates. */
export abstract class Point2D {
  abstract getX(): number;
  abstract getY(): number;
  abstract setLocation(x: number, y: number): void;

  distance(other: Point2D): number;
  distance(x: number, y: number): number;
  distance(xOrOther: number | Point2D, y?: number): number {
    if (xOrOther instanceof Point2D) {
      const dx = this.getX() - xOrOther.getX();
      const dy = this.getY() - xOrOther.getY();
      return Math.sqrt(dx * dx + dy * dy);
    }
    const dx = this.getX() - xOrOther;
    const dy = this.getY() - (y ?? 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  distanceSq(other: Point2D): number;
  distanceSq(x: number, y: number): number;
  distanceSq(xOrOther: number | Point2D, y?: number): number {
    if (xOrOther instanceof Point2D) {
      const dx = this.getX() - xOrOther.getX();
      const dy = this.getY() - xOrOther.getY();
      return dx * dx + dy * dy;
    }
    const dx = this.getX() - xOrOther;
    const dy = this.getY() - (y ?? 0);
    return dx * dx + dy * dy;
  }

  clone(): Point2D.Double {
    return new Point2D.Double(this.getX(), this.getY());
  }
}

export namespace Point2D {
  /** @java java.awt.geom.Point2D.Double */
  export class Double extends Point2D {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
      super();
      this.x = x;
      this.y = y;
    }

    getX(): number { return this.x; }
    getY(): number { return this.y; }

    setLocation(x: number, y: number): void {
      this.x = x;
      this.y = y;
    }
  }
}
