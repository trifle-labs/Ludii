// @java java.awt.geom.Arc2D

import { AffineTransform } from './AffineTransform.js';
import { Rectangle2D } from './Rectangle2D.js';
import {
  PathIterator, PathSegment,
  SEG_MOVETO, SEG_CUBICTO, SEG_LINETO, SEG_CLOSE, WIND_NON_ZERO,
} from './PathIterator.js';
import type { Shape } from './Shape.js';

/** Arc type constants matching java.awt.geom.Arc2D */
export const OPEN  = 0;
export const CHORD = 1;
export const PIE   = 2;

/** @java java.awt.geom.Arc2D.Double */
export class Arc2D implements Shape {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Start angle in degrees (Java convention: 0 = 3 o'clock, positive = CCW). */
  start: number;
  /** Angular extent in degrees. */
  extent: number;
  type: number;

  constructor(x = 0, y = 0, width = 0, height = 0, start = 0, extent = 0, type: number = OPEN) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.start = start;
    this.extent = extent;
    this.type = type;
  }

  setArc(x: number, y: number, w: number, h: number, start: number, extent: number, type: number): void {
    this.x = x; this.y = y; this.width = w; this.height = h;
    this.start = start; this.extent = extent; this.type = type;
  }

  getBounds2D(): Rectangle2D.Double {
    return new Rectangle2D.Double(this.x, this.y, this.width, this.height);
  }

  contains(px: number, py: number): boolean {
    // approximate: check within ellipse + angle sector
    const rx = this.width / 2, ry = this.height / 2;
    const cx = this.x + rx, cy = this.y + ry;
    const nx = (px - cx) / rx, ny = (py - cy) / ry;
    if (nx * nx + ny * ny > 1) return false;
    const a = Math.atan2(-ny, nx) * 180 / Math.PI; // Java angle convention
    return angleBetween(a, this.start, this.extent);
  }

  getPathIterator(at: AffineTransform | null, _flatness?: number): PathIterator {
    const segs = buildArcSegments(this.x, this.y, this.width, this.height, this.start, this.extent, this.type);
    if (at) {
      return new PathIterator(applyTransform(segs, at), WIND_NON_ZERO);
    }
    return new PathIterator(segs, WIND_NON_ZERO);
  }
}

export namespace Arc2D {
  export const OPEN  = 0;
  export const CHORD = 1;
  export const PIE   = 2;
  export class Double extends Arc2D {}
}

// ---------- helpers ----------

/** Java arc: angles in degrees, CCW, 0° = east (3 o'clock). */
function javaAngleToRadians(deg: number): number {
  return -deg * Math.PI / 180; // negate because SVG y-axis is flipped
}

function arcPoint(cx: number, cy: number, rx: number, ry: number, angleDeg: number): [number, number] {
  const r = javaAngleToRadians(angleDeg);
  return [cx + rx * Math.cos(r), cy - ry * Math.sin(r)]; // note: -sin for Java CCW
}

function buildArcSegments(
  x: number, y: number, w: number, h: number,
  startDeg: number, extentDeg: number, arcType: number
): PathSegment[] {
  const rx = w / 2, ry = h / 2;
  const cx = x + rx, cy = y + ry;

  // Decompose the arc into Bezier curves (max 90° each)
  const segs: PathSegment[] = [];
  const [sx, sy] = arcPoint(cx, cy, rx, ry, startDeg);
  segs.push({ type: SEG_MOVETO, coords: [sx, sy] });

  if (arcType === PIE) {
    segs.push({ type: SEG_LINETO, coords: [cx, cy] });
    segs.push({ type: SEG_LINETO, coords: [sx, sy] });
  }

  const steps = Math.ceil(Math.abs(extentDeg) / 90);
  const stepAngle = extentDeg / steps;

  let current = startDeg;
  for (let i = 0; i < steps; i++) {
    const next = current + stepAngle;
    bezierArcSegment(cx, cy, rx, ry, current, stepAngle, segs);
    current = next;
  }

  if (arcType === CHORD || arcType === PIE) {
    segs.push({ type: SEG_CLOSE, coords: [] });
  }

  return segs;
}

/** Append one Bezier approximation segment for an arc sector ≤ 90°. */
function bezierArcSegment(
  cx: number, cy: number, rx: number, ry: number,
  startDeg: number, extentDeg: number,
  segs: PathSegment[]
): void {
  const a1 = javaAngleToRadians(startDeg);
  const a2 = javaAngleToRadians(startDeg + extentDeg);
  const alpha = Math.sin(a2 - a1) * (Math.sqrt(4 + 3 * Math.pow(Math.tan((a2 - a1) / 2), 2)) - 1) / 3;

  const p1x = cx + rx * Math.cos(a1);
  const p1y = cy + ry * Math.sin(a1);
  const p2x = cx + rx * Math.cos(a2);
  const p2y = cy + ry * Math.sin(a2);

  const cp1x = p1x - alpha * rx * Math.sin(a1);
  const cp1y = p1y + alpha * ry * Math.cos(a1);
  const cp2x = p2x + alpha * rx * Math.sin(a2);
  const cp2y = p2y - alpha * ry * Math.cos(a2);

  segs.push({ type: SEG_CUBICTO, coords: [cp1x, cp1y, cp2x, cp2y, p2x, p2y] });
}

function angleBetween(angle: number, start: number, extent: number): boolean {
  const end = start + extent;
  if (extent >= 0) {
    return angle >= start && angle <= end;
  }
  return angle >= end && angle <= start;
}

function applyTransform(segs: PathSegment[], at: AffineTransform): PathSegment[] {
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
