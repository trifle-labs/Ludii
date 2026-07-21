// @java java.awt.geom.Rectangle2D

import { Point2D } from './Point2D.js';

/** Abstract axis-aligned rectangle. */
export abstract class Rectangle2D {
  abstract getX(): number;
  abstract getY(): number;
  abstract getWidth(): number;
  abstract getHeight(): number;
  abstract setRect(x: number, y: number, w: number, h: number): void;

  getMinX(): number { return this.getX(); }
  getMinY(): number { return this.getY(); }
  getMaxX(): number { return this.getX() + this.getWidth(); }
  getMaxY(): number { return this.getY() + this.getHeight(); }
  getCenterX(): number { return this.getX() + this.getWidth() / 2; }
  getCenterY(): number { return this.getY() + this.getHeight() / 2; }

  isEmpty(): boolean {
    return this.getWidth() <= 0 || this.getHeight() <= 0;
  }

  contains(x: number, y: number): boolean;
  contains(p: Point2D): boolean;
  contains(xOrP: number | Point2D, y?: number): boolean {
    if (xOrP instanceof Point2D) {
      return this.contains(xOrP.getX(), xOrP.getY());
    }
    const px = xOrP;
    const py = y ?? 0;
    return px >= this.getX() && py >= this.getY() &&
           px < this.getX() + this.getWidth() &&
           py < this.getY() + this.getHeight();
  }

  intersects(other: Rectangle2D): boolean {
    if (this.isEmpty() || other.isEmpty()) return false;
    return other.getMaxX() > this.getMinX() &&
           other.getMaxY() > this.getMinY() &&
           other.getMinX() < this.getMaxX() &&
           other.getMinY() < this.getMaxY();
  }

  /** Extend this rectangle to include the given point or rectangle. */
  add(x: number, y: number): void;
  add(pt: Point2D): void;
  add(rect: Rectangle2D): void;
  add(arg0: number | Point2D | Rectangle2D, y?: number): void {
    if (arg0 instanceof Rectangle2D) {
      const rx1 = Math.min(this.getX(), arg0.getX());
      const ry1 = Math.min(this.getY(), arg0.getY());
      const rx2 = Math.max(this.getMaxX(), arg0.getMaxX());
      const ry2 = Math.max(this.getMaxY(), arg0.getMaxY());
      this.setRect(rx1, ry1, rx2 - rx1, ry2 - ry1);
    } else if (arg0 instanceof Point2D) {
      this.add(arg0.getX(), arg0.getY());
    } else {
      const x = arg0;
      const py = y ?? 0;
      if (this.isEmpty()) {
        this.setRect(x, py, 0, 0);
      } else {
        const x1 = Math.min(this.getX(), x);
        const y1 = Math.min(this.getY(), py);
        const x2 = Math.max(this.getMaxX(), x);
        const y2 = Math.max(this.getMaxY(), py);
        this.setRect(x1, y1, x2 - x1, y2 - y1);
      }
    }
  }

  getBounds2D(): Rectangle2D.Double {
    return new Rectangle2D.Double(this.getX(), this.getY(), this.getWidth(), this.getHeight());
  }
}

export namespace Rectangle2D {
  /** @java java.awt.geom.Rectangle2D.Double */
  export class Double extends Rectangle2D {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x = 0, y = 0, width = 0, height = 0) {
      super();
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    getX(): number { return this.x; }
    getY(): number { return this.y; }
    getWidth(): number { return this.width; }
    getHeight(): number { return this.height; }

    setRect(x: number, y: number, w: number, h: number): void {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
    }
  }
}
