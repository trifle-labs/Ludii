// @java Common/src/main/math/MathRoutines.java MathRoutines
//
// The exact geometric helpers the trajectory generator depends on. Ported
// verbatim (same formulas, same EPSILON) so adjacency/radial decisions match
// Java bit-for-bit on the same float inputs. 2-D boards use z = 0.

import { type Pt3 } from "./graph-element.js";

/** @java Common/src/main/math/MathRoutines.java EPSILON */
export const EPSILON = 0.0000001;

/** @java MathRoutines.distance(double,double,double,double) */
export function distance2D(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

/** @java MathRoutines.distance(Point3D,Point3D) */
export function distance3D(a: Pt3, b: Pt3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** @java MathRoutines.angle(Point2D,Point2D) — radians in (-PI, PI]. */
export function angle2D(ax: number, ay: number, bx: number, by: number): number {
  return Math.atan2(by - ay, bx - ax);
}

/**
 * @java MathRoutines.distanceToLine(Point2D,Point2D,Point2D)
 * Distance from pt to the infinite line through a and b.
 */
export function distanceToLine(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  if (Math.abs(dx) + Math.abs(dy) < EPSILON) {
    return distance2D(px, py, ax, ay); // endpoints coincident
  }
  const a2 = (py - ay) * dx - (px - ax) * dy;
  return Math.sqrt((a2 * a2) / (dx * dx + dy * dy));
}

/**
 * @java MathRoutines.absTanAngleDifference3D(Point3D,Point3D,Point3D)
 * |(c-b) × (b-a)| / ((c-b)·(b-a)); +Infinity if the dot product is not positive
 * (i.e. the turn is >= 90°). Used to follow the straightest radial continuation.
 */
export function absTanAngleDifference3D(a: Pt3, b: Pt3, c: Pt3): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const vz = b.z - a.z;
  const ux = c.x - b.x;
  const uy = c.y - b.y;
  const uz = c.z - b.z;

  const dot = ux * vx + uy * vy + uz * vz;
  if (dot <= 0.0) return Number.POSITIVE_INFINITY;

  const crossX = vy * uz - vz * uy;
  const crossY = vz * ux - vx * uz;
  const crossZ = vx * uy - vy * ux;
  const crossMag = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);
  return Math.abs(crossMag / dot);
}

/** @java MathRoutines.whichSide(double…) — which side of line AB point (x,y) lies on. */
export function whichSide(
  x: number, y: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const result = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
  if (result < -EPSILON) return -1;
  if (result > EPSILON) return 1;
  return 0;
}

/** Dot product of two 3-D vectors (for circular In/Out classification). */
export function dot3D(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
  return ax * bx + ay * by + az * bz;
}
