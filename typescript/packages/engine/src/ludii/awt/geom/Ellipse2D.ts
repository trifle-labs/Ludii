// @java java.awt.geom.Ellipse2D

import { AffineTransform } from './AffineTransform.js';
import { Rectangle2D } from './Rectangle2D.js';
import {
  PathIterator, PathSegment,
  SEG_MOVETO, SEG_CUBICTO, SEG_CLOSE, WIND_NON_ZERO,
} from './PathIterator.js';
import type { Shape } from './Shape.js';

// Bezier approximation of a unit circle quarter: 4*(sqrt(2)-1)/3
const KAPPA = 0.5522847498307936;

/** @java java.awt.geom.Ellipse2D.Double */
export class Ellipse2D implements Shape {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  setFrame(x: number, y: number, w: number, h: number): void {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  getBounds2D(): Rectangle2D.Double {
    return new Rectangle2D.Double(this.x, this.y, this.width, this.height);
  }

  contains(px: number, py: number): boolean {
    const rx = this.width / 2;
    const ry = this.height / 2;
    const cx = this.x + rx;
    const cy = this.y + ry;
    if (rx === 0 || ry === 0) return false;
    const nx = (px - cx) / rx;
    const ny = (py - cy) / ry;
    return nx * nx + ny * ny <= 1;
  }

  getPathIterator(at: AffineTransform | null, _flatness?: number): PathIterator {
    const rx = this.width / 2;
    const ry = this.height / 2;
    const cx = this.x + rx;
    const cy = this.y + ry;

    const kx = KAPPA * rx;
    const ky = KAPPA * ry;

    const raw: PathSegment[] = [
      { type: SEG_MOVETO,  coords: [cx,      cy - ry] },
      { type: SEG_CUBICTO, coords: [cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy       ] },
      { type: SEG_CUBICTO, coords: [cx + rx, cy + ky, cx + kx, cy + ry, cx,      cy + ry   ] },
      { type: SEG_CUBICTO, coords: [cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy       ] },
      { type: SEG_CUBICTO, coords: [cx - rx, cy - ky, cx - kx, cy - ry, cx,      cy - ry   ] },
      { type: SEG_CLOSE,   coords: [] },
    ];

    const segs = applyTransform(raw, at);
    return new PathIterator(segs, WIND_NON_ZERO);
  }
}

export namespace Ellipse2D {
  export class Double extends Ellipse2D {}
}

function applyTransform(segs: PathSegment[], at: AffineTransform | null): PathSegment[] {
  if (!at) return segs;
  return segs.map(seg => {
    const c = seg.coords.slice();
    for (let i = 0; i < c.length; i += 2) {
      const x = c[i] ?? 0;
      const y = c[i + 1] ?? 0;
      c[i]     = at.getScaleX() * x + at.getShearX() * y + at.getTranslateX();
      c[i + 1] = at.getShearY() * x + at.getScaleY() * y + at.getTranslateY();
    }
    return { type: seg.type, coords: c };
  });
}
