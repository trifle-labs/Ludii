// @java java.awt.Shape

import type { Rectangle2D } from './Rectangle2D.js';
import type { PathIterator } from './PathIterator.js';
import type { AffineTransform } from './AffineTransform.js';

/** @java java.awt.Shape */
export interface Shape {
  getBounds2D(): Rectangle2D;
  contains(x: number, y: number): boolean;
  getPathIterator(at: AffineTransform | null, flatness?: number): PathIterator;
}
