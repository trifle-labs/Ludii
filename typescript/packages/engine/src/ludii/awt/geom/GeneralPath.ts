// @java java.awt.geom.GeneralPath / java.awt.geom.Path2D

import { AffineTransform } from './AffineTransform.js';
import { Rectangle2D } from './Rectangle2D.js';
import {
  PathIterator,
  PathSegment,
  SEG_MOVETO, SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, SEG_CLOSE,
  WIND_EVEN_ODD, WIND_NON_ZERO,
} from './PathIterator.js';
import type { Shape } from './Shape.js';

export { WIND_EVEN_ODD, WIND_NON_ZERO };

/** @java java.awt.geom.GeneralPath (also serves as Path2D.Double) */
export class GeneralPath implements Shape {
  private segments: PathSegment[] = [];
  private windingRule: number;
  private _currentX = 0;
  private _currentY = 0;

  constructor(windingRule: number = WIND_NON_ZERO, _initialCapacity?: number) {
    this.windingRule = windingRule;
  }

  // ---- path construction ----

  moveTo(x: number, y: number): void {
    this.segments.push({ type: SEG_MOVETO, coords: [x, y] });
    this._currentX = x;
    this._currentY = y;
  }

  lineTo(x: number, y: number): void {
    this.segments.push({ type: SEG_LINETO, coords: [x, y] });
    this._currentX = x;
    this._currentY = y;
  }

  quadTo(x1: number, y1: number, x2: number, y2: number): void {
    this.segments.push({ type: SEG_QUADTO, coords: [x1, y1, x2, y2] });
    this._currentX = x2;
    this._currentY = y2;
  }

  curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
    this.segments.push({ type: SEG_CUBICTO, coords: [x1, y1, x2, y2, x3, y3] });
    this._currentX = x3;
    this._currentY = y3;
  }

  closePath(): void {
    this.segments.push({ type: SEG_CLOSE, coords: [] });
  }

  reset(): void {
    this.segments = [];
    this._currentX = 0;
    this._currentY = 0;
  }

  /**
   * Append another shape's path iterator to this path.
   * @param connect if true, prepend a lineTo rather than moveTo for the first segment
   */
  append(shape: Shape, connect: boolean): void {
    const pi = shape.getPathIterator(null);
    const coords = [0, 0, 0, 0, 0, 0];
    let first = true;
    while (!pi.isDone()) {
      const type = pi.currentSegment(coords);
      const c0 = coords[0] ?? 0, c1 = coords[1] ?? 0;
      const c2 = coords[2] ?? 0, c3 = coords[3] ?? 0;
      const c4 = coords[4] ?? 0, c5 = coords[5] ?? 0;
      if (first && connect && type === SEG_MOVETO && this.segments.length > 0) {
        this.lineTo(c0, c1);
      } else {
        switch (type) {
          case SEG_MOVETO:  this.moveTo(c0, c1); break;
          case SEG_LINETO:  this.lineTo(c0, c1); break;
          case SEG_QUADTO:  this.quadTo(c0, c1, c2, c3); break;
          case SEG_CUBICTO: this.curveTo(c0, c1, c2, c3, c4, c5); break;
          case SEG_CLOSE:   this.closePath(); break;
        }
      }
      first = false;
      pi.next();
    }
  }

  // ---- Shape interface ----

  getBounds2D(): Rectangle2D.Double {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const seg of this.segments) {
      for (let i = 0; i < seg.coords.length; i += 2) {
        const x = seg.coords[i] ?? 0;
        const y = seg.coords[i + 1] ?? 0;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (!isFinite(minX)) return new Rectangle2D.Double(0, 0, 0, 0);
    return new Rectangle2D.Double(minX, minY, maxX - minX, maxY - minY);
  }

  contains(x: number, y: number): boolean {
    // Ray-casting on the flattened path
    return pointInPath(this.toSvgPathData(), x, y, this.windingRule === WIND_EVEN_ODD);
  }

  getPathIterator(at: AffineTransform | null, _flatness?: number): PathIterator {
    if (at) {
      const transformed: PathSegment[] = this.segments.map(seg => {
        const coords: number[] = [];
        for (let i = 0; i < seg.coords.length; i += 2) {
          const sx = seg.coords[i] ?? 0;
          const sy = seg.coords[i + 1] ?? 0;
          const tx = at.getScaleX() * sx + at.getShearX() * sy + at.getTranslateX();
          const ty = at.getShearY() * sx + at.getScaleY() * sy + at.getTranslateY();
          coords.push(tx, ty);
        }
        return { type: seg.type, coords };
      });
      return new PathIterator(transformed, this.windingRule);
    }
    return new PathIterator([...this.segments], this.windingRule);
  }

  /** Serialise to an SVG `d` attribute string. */
  toSvgPathData(): string {
    const parts: string[] = [];
    for (const seg of this.segments) {
      switch (seg.type) {
        case SEG_MOVETO:  parts.push(`M ${seg.coords[0]} ${seg.coords[1]}`); break;
        case SEG_LINETO:  parts.push(`L ${seg.coords[0]} ${seg.coords[1]}`); break;
        case SEG_QUADTO:  parts.push(`Q ${seg.coords[0]} ${seg.coords[1]} ${seg.coords[2]} ${seg.coords[3]}`); break;
        case SEG_CUBICTO: parts.push(`C ${seg.coords[0]} ${seg.coords[1]} ${seg.coords[2]} ${seg.coords[3]} ${seg.coords[4]} ${seg.coords[5]}`); break;
        case SEG_CLOSE:   parts.push('Z'); break;
      }
    }
    return parts.join(' ');
  }

  getWindingRule(): number { return this.windingRule; }
  setWindingRule(rule: number): void { this.windingRule = rule; }

  getCurrentPoint(): [number, number] {
    return [this._currentX, this._currentY];
  }
}

/** Path2D.Double is an alias for GeneralPath in this shim. */
export { GeneralPath as Path2D };

// ---------- internal helper ----------

function pointInPath(d: string, px: number, py: number, evenOdd: boolean): boolean {
  // Simple crossing-number test using a canvas-like approach
  // Falls back to false for complex cases
  try {
    // Parse and ray-cast
    let crossings = 0;
    let startX = 0, startY = 0;
    let curX = 0, curY = 0;

    // Tokenise the SVG d string
    const tokens = d.match(/[MLQCZH]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
    let i = 0;
    const num = () => parseFloat(tokens[i++] ?? '0');
    while (i < tokens.length) {
      const cmd = tokens[i++] ?? '';
      switch (cmd) {
        case 'M': { const x = num(), y = num(); curX = startX = x; curY = startY = y; break; }
        case 'L': {
          const x = num(), y = num();
          crossings += segCrossing(curX, curY, x, y, px, py);
          curX = x; curY = y;
          break;
        }
        case 'Z': {
          crossings += segCrossing(curX, curY, startX, startY, px, py);
          curX = startX; curY = startY;
          break;
        }
        // Ignore Q, C for simplicity
        default: break;
      }
    }
    return evenOdd ? (Math.abs(crossings) % 2 !== 0) : (crossings !== 0);
  } catch {
    return false;
  }
}

function segCrossing(x0: number, y0: number, x1: number, y1: number, px: number, py: number): number {
  if ((y0 <= py && y1 > py) || (y1 <= py && y0 > py)) {
    const t = (py - y0) / (y1 - y0);
    if (px < x0 + t * (x1 - x0)) return 1;
  }
  return 0;
}
