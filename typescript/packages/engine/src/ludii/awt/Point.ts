// @java java.awt.Point / java.awt.Rectangle / java.awt.Polygon

import { Point2D } from './geom/Point2D.js';
import { AffineTransform } from './geom/AffineTransform.js';
import { Rectangle2D } from './geom/Rectangle2D.js';
import {
  PathIterator, PathSegment,
  SEG_MOVETO, SEG_LINETO, SEG_CLOSE, WIND_EVEN_ODD,
} from './geom/PathIterator.js';
import type { Shape } from './geom/Shape.js';

// ---- Point ----

/** @java java.awt.Point */
export class Point extends Point2D {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    super();
    this.x = x;
    this.y = y;
  }

  override getX(): number { return this.x; }
  override getY(): number { return this.y; }
  override setLocation(x: number, y: number): void { this.x = x; this.y = y; }

  translate(dx: number, dy: number): void { this.x += dx; this.y += dy; }

  override toString(): string { return `Point[${this.x},${this.y}]`; }
}

// ---- Rectangle ----

/** @java java.awt.Rectangle (integer x/y/width/height). */
export class Rectangle extends Rectangle2D implements Shape {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    super();
    this.x = x; this.y = y;
    this.width = width; this.height = height;
  }

  override getX(): number { return this.x; }
  override getY(): number { return this.y; }
  override getWidth(): number { return this.width; }
  override getHeight(): number { return this.height; }

  override setRect(x: number, y: number, w: number, h: number): void {
    this.x = Math.round(x); this.y = Math.round(y);
    this.width = Math.round(w); this.height = Math.round(h);
  }

  setSize(w: number, h: number): void { this.width = w; this.height = h; }
  setLocation(x: number, y: number): void { this.x = x; this.y = y; }

  translate(dx: number, dy: number): void { this.x += dx; this.y += dy; }

  getPathIterator(at: AffineTransform | null, _flatness?: number): PathIterator {
    const { x, y, width: w, height: h } = this;
    // Four corners in order
    const rawPts: number[] = [x, y, x + w, y, x + w, y + h, x, y + h];
    const tPts: number[] = rawPts.slice();
    if (at) {
      for (let i = 0; i < 8; i += 2) {
        const px = tPts[i] ?? 0;
        const py = tPts[i + 1] ?? 0;
        tPts[i]     = at.getScaleX() * px + at.getShearX() * py + at.getTranslateX();
        tPts[i + 1] = at.getShearY() * px + at.getScaleY() * py + at.getTranslateY();
      }
    }
    const segs: PathSegment[] = [
      { type: SEG_MOVETO, coords: [tPts[0] ?? 0, tPts[1] ?? 0] },
      { type: SEG_LINETO, coords: [tPts[2] ?? 0, tPts[3] ?? 0] },
      { type: SEG_LINETO, coords: [tPts[4] ?? 0, tPts[5] ?? 0] },
      { type: SEG_LINETO, coords: [tPts[6] ?? 0, tPts[7] ?? 0] },
      { type: SEG_CLOSE,  coords: [] },
    ];
    return new PathIterator(segs, WIND_EVEN_ODD);
  }

  override toString(): string { return `Rectangle[x=${this.x},y=${this.y},w=${this.width},h=${this.height}]`; }
}

// ---- Polygon ----

/** @java java.awt.Polygon */
export class Polygon implements Shape {
  xpoints: number[];
  ypoints: number[];
  npoints: number;

  constructor(xpoints?: number[], ypoints?: number[], npoints?: number) {
    this.xpoints = xpoints ? [...xpoints] : [];
    this.ypoints = ypoints ? [...ypoints] : [];
    this.npoints = npoints ?? this.xpoints.length;
  }

  addPoint(x: number, y: number): void {
    this.xpoints.push(x);
    this.ypoints.push(y);
    this.npoints++;
  }

  getBounds2D(): Rectangle2D.Double {
    if (this.npoints === 0) return new Rectangle2D.Double();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < this.npoints; i++) {
      const px = this.xpoints[i] ?? 0;
      const py = this.ypoints[i] ?? 0;
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    return new Rectangle2D.Double(minX, minY, maxX - minX, maxY - minY);
  }

  contains(px: number, py: number): boolean {
    // Ray-casting
    let inside = false;
    const n = this.npoints;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.xpoints[i] ?? 0;
      const yi = this.ypoints[i] ?? 0;
      const xj = this.xpoints[j] ?? 0;
      const yj = this.ypoints[j] ?? 0;
      const intersect = ((yi > py) !== (yj > py)) &&
                        (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  getPathIterator(at: AffineTransform | null, _flatness?: number): PathIterator {
    const segs: PathSegment[] = [];
    for (let i = 0; i < this.npoints; i++) {
      let x = this.xpoints[i] ?? 0;
      let y = this.ypoints[i] ?? 0;
      if (at) {
        const tx = at.getScaleX() * x + at.getShearX() * y + at.getTranslateX();
        const ty = at.getShearY() * x + at.getScaleY() * y + at.getTranslateY();
        x = tx; y = ty;
      }
      segs.push({ type: i === 0 ? SEG_MOVETO : SEG_LINETO, coords: [x, y] });
    }
    segs.push({ type: SEG_CLOSE, coords: [] });
    return new PathIterator(segs, WIND_EVEN_ODD);
  }
}
