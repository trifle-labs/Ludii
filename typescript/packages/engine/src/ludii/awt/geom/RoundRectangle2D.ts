// @java java.awt.geom.RoundRectangle2D

import { AffineTransform } from './AffineTransform.js';
import { Rectangle2D } from './Rectangle2D.js';
import {
  PathIterator, PathSegment,
  SEG_MOVETO, SEG_LINETO, SEG_CUBICTO, SEG_CLOSE, WIND_NON_ZERO,
} from './PathIterator.js';
import type { Shape } from './Shape.js';

const KAPPA = 0.5522847498307936;

/** @java java.awt.geom.RoundRectangle2D.Double */
export class RoundRectangle2D implements Shape {
  x: number;
  y: number;
  width: number;
  height: number;
  arcWidth: number;
  arcHeight: number;

  constructor(x = 0, y = 0, width = 0, height = 0, arcWidth = 0, arcHeight = 0) {
    this.x = x; this.y = y;
    this.width = width; this.height = height;
    this.arcWidth = arcWidth; this.arcHeight = arcHeight;
  }

  setRoundRect(x: number, y: number, w: number, h: number, aw: number, ah: number): void {
    this.x = x; this.y = y;
    this.width = w; this.height = h;
    this.arcWidth = aw; this.arcHeight = ah;
  }

  getBounds2D(): Rectangle2D.Double {
    return new Rectangle2D.Double(this.x, this.y, this.width, this.height);
  }

  contains(px: number, py: number): boolean {
    if (px < this.x || px > this.x + this.width || py < this.y || py > this.y + this.height) return false;
    const aw = this.arcWidth / 2, ah = this.arcHeight / 2;
    // Check corners
    const corners = [
      [this.x + aw, this.y + ah],
      [this.x + this.width - aw, this.y + ah],
      [this.x + aw, this.y + this.height - ah],
      [this.x + this.width - aw, this.y + this.height - ah],
    ];
    for (const corner of corners) {
      const ccx = corner[0] ?? 0;
      const ccy = corner[1] ?? 0;
      if (Math.abs(px - ccx) > aw || Math.abs(py - ccy) > ah) continue;
      const nx = (px - ccx) / aw, ny = (py - ccy) / ah;
      if (nx * nx + ny * ny > 1) return false;
    }
    return true;
  }

  getPathIterator(at: AffineTransform | null, _flatness?: number): PathIterator {
    const { x, y, width: w, height: h, arcWidth, arcHeight } = this;
    const aw = Math.min(arcWidth / 2, w / 2);
    const ah = Math.min(arcHeight / 2, h / 2);
    const kx = KAPPA * aw, ky = KAPPA * ah;

    const segs: PathSegment[] = [
      { type: SEG_MOVETO,  coords: [x + aw, y] },
      { type: SEG_LINETO,  coords: [x + w - aw, y] },
      { type: SEG_CUBICTO, coords: [x + w - aw + kx, y, x + w, y + ah - ky, x + w, y + ah] },
      { type: SEG_LINETO,  coords: [x + w, y + h - ah] },
      { type: SEG_CUBICTO, coords: [x + w, y + h - ah + ky, x + w - aw + kx, y + h, x + w - aw, y + h] },
      { type: SEG_LINETO,  coords: [x + aw, y + h] },
      { type: SEG_CUBICTO, coords: [x + aw - kx, y + h, x, y + h - ah + ky, x, y + h - ah] },
      { type: SEG_LINETO,  coords: [x, y + ah] },
      { type: SEG_CUBICTO, coords: [x, y + ah - ky, x + aw - kx, y, x + aw, y] },
      { type: SEG_CLOSE,   coords: [] },
    ];

    if (at) {
      const transformed = segs.map(seg => {
        const c = seg.coords.slice();
        for (let i = 0; i < c.length; i += 2) {
          const x = c[i] ?? 0;
          const y = c[i + 1] ?? 0;
          c[i]     = at.getScaleX() * x + at.getShearX() * y + at.getTranslateX();
          c[i + 1] = at.getShearY() * x + at.getScaleY() * y + at.getTranslateY();
        }
        return { type: seg.type, coords: c };
      });
      return new PathIterator(transformed, WIND_NON_ZERO);
    }
    return new PathIterator(segs, WIND_NON_ZERO);
  }
}

export namespace RoundRectangle2D {
  export class Double extends RoundRectangle2D {}
}
