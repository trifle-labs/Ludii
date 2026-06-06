// @java java.awt.geom.Line2D

import { AffineTransform } from './AffineTransform.js';
import { Rectangle2D } from './Rectangle2D.js';
import {
  PathIterator, PathSegment,
  SEG_MOVETO, SEG_LINETO, WIND_NON_ZERO,
} from './PathIterator.js';
import type { Shape } from './Shape.js';

/** @java java.awt.geom.Line2D.Double */
export class Line2D implements Shape {
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  setLine(x1: number, y1: number, x2: number, y2: number): void {
    this.x1 = x1; this.y1 = y1;
    this.x2 = x2; this.y2 = y2;
  }

  getBounds2D(): Rectangle2D.Double {
    const x = Math.min(this.x1, this.x2);
    const y = Math.min(this.y1, this.y2);
    return new Rectangle2D.Double(x, y, Math.abs(this.x2 - this.x1), Math.abs(this.y2 - this.y1));
  }

  contains(_x: number, _y: number): boolean { return false; }

  getPathIterator(at: AffineTransform | null, _flatness?: number): PathIterator {
    let x1 = this.x1, y1 = this.y1, x2 = this.x2, y2 = this.y2;
    if (at) {
      const tx1 = at.getScaleX() * x1 + at.getShearX() * y1 + at.getTranslateX();
      const ty1 = at.getShearY() * x1 + at.getScaleY() * y1 + at.getTranslateY();
      const tx2 = at.getScaleX() * x2 + at.getShearX() * y2 + at.getTranslateX();
      const ty2 = at.getShearY() * x2 + at.getScaleY() * y2 + at.getTranslateY();
      x1 = tx1; y1 = ty1; x2 = tx2; y2 = ty2;
    }
    const segs: PathSegment[] = [
      { type: SEG_MOVETO, coords: [x1, y1] },
      { type: SEG_LINETO, coords: [x2, y2] },
    ];
    return new PathIterator(segs, WIND_NON_ZERO);
  }
}

export namespace Line2D {
  export class Double extends Line2D {}
}
