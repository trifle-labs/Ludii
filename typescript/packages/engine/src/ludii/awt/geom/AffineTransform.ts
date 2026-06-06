// @java java.awt.geom.AffineTransform

import { Point2D } from './Point2D.js';

/**
 * A 3×3 affine transform matrix stored as six coefficients:
 *   [ m00  m01  m02 ]   [ scaleX  shearX  translateX ]
 *   [ m10  m11  m12 ] = [ shearY  scaleY  translateY ]
 *   [  0    0    1  ]
 */
export class AffineTransform {
  // Row-major storage: [m00, m10, m01, m11, m02, m12]
  // matches Java's getMatrix([m00,m10,m01,m11,m02,m12])
  private m: [number, number, number, number, number, number];

  /** Identity */
  constructor();
  /** Copy */
  constructor(tx: AffineTransform);
  /** Six-element flat array [m00,m10,m01,m11,m02,m12] */
  constructor(flatMatrix: [number, number, number, number, number, number]);
  /** Explicit six scalars (Java: new AffineTransform(m00,m10,m01,m11,m02,m12)) */
  constructor(m00: number, m10: number, m01: number, m11: number, m02: number, m12: number);
  constructor(
    arg0?: AffineTransform | [number, number, number, number, number, number] | number,
    m10?: number, m01?: number, m11?: number, m02?: number, m12?: number
  ) {
    if (arg0 === undefined) {
      this.m = [1, 0, 0, 1, 0, 0]; // identity
    } else if (arg0 instanceof AffineTransform) {
      this.m = [...arg0.m] as [number, number, number, number, number, number];
    } else if (Array.isArray(arg0)) {
      this.m = [...arg0] as [number, number, number, number, number, number];
    } else {
      this.m = [
        arg0 as number,
        m10 ?? 0,
        m01 ?? 0,
        m11 ?? 1,
        m02 ?? 0,
        m12 ?? 0,
      ];
    }
  }

  // ---- accessors ----

  /** m00 – scale X */
  getScaleX(): number { return this.m[0]; }
  /** m10 – shear Y */
  getShearY(): number { return this.m[1]; }
  /** m01 – shear X */
  getShearX(): number { return this.m[2]; }
  /** m11 – scale Y */
  getScaleY(): number { return this.m[3]; }
  /** m02 – translate X */
  getTranslateX(): number { return this.m[4]; }
  /** m12 – translate Y */
  getTranslateY(): number { return this.m[5]; }

  // ---- factories ----

  static getTranslateInstance(tx: number, ty: number): AffineTransform {
    return new AffineTransform(1, 0, 0, 1, tx, ty);
  }

  static getRotateInstance(theta: number, anchorX = 0, anchorY = 0): AffineTransform {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    // rotation around (ax, ay): T(ax,ay) · R · T(-ax,-ay)
    const at = new AffineTransform(
      cos, sin, -sin, cos,
      anchorX - anchorX * cos + anchorY * sin,
      anchorY - anchorX * sin - anchorY * cos
    );
    return at;
  }

  static getScaleInstance(sx: number, sy: number): AffineTransform {
    return new AffineTransform(sx, 0, 0, sy, 0, 0);
  }

  // ---- mutating concat ----

  /** Pre-multiply: this = this · Tx (Java semantics for concatenate). */
  concatenate(Tx: AffineTransform): void {
    const [a00, a10, a01, a11, a02, a12] = this.m;
    const [b00, b10, b01, b11, b02, b12] = Tx.m;
    this.m = [
      a00 * b00 + a01 * b10,
      a10 * b00 + a11 * b10,
      a00 * b01 + a01 * b11,
      a10 * b01 + a11 * b11,
      a00 * b02 + a01 * b12 + a02,
      a10 * b02 + a11 * b12 + a12,
    ];
  }

  /** Post-multiply: this = Tx · this (Java semantics for preConcatenate). */
  preConcatenate(Tx: AffineTransform): void {
    const [a00, a10, a01, a11, a02, a12] = Tx.m;
    const [b00, b10, b01, b11, b02, b12] = this.m;
    this.m = [
      a00 * b00 + a01 * b10,
      a10 * b00 + a11 * b10,
      a00 * b01 + a01 * b11,
      a10 * b01 + a11 * b11,
      a00 * b02 + a01 * b12 + a02,
      a10 * b02 + a11 * b12 + a12,
    ];
  }

  translate(tx: number, ty: number): void {
    this.m[4] += this.m[0] * tx + this.m[2] * ty;
    this.m[5] += this.m[1] * tx + this.m[3] * ty;
  }

  rotate(theta: number, anchorX = 0, anchorY = 0): void {
    this.concatenate(AffineTransform.getRotateInstance(theta, anchorX, anchorY));
  }

  scale(sx: number, sy: number): void {
    this.m[0] *= sx;
    this.m[1] *= sx;
    this.m[2] *= sy;
    this.m[3] *= sy;
  }

  setToIdentity(): void {
    this.m = [1, 0, 0, 1, 0, 0];
  }

  setTransform(at: AffineTransform): void {
    this.m = [...at.m] as [number, number, number, number, number, number];
  }

  // ---- point transform ----

  /** Transform a single point in-place (or return a new one). */
  transform(src: Point2D, dst?: Point2D): Point2D {
    const sx = src.getX();
    const sy = src.getY();
    const dx = this.m[0] * sx + this.m[2] * sy + this.m[4];
    const dy = this.m[1] * sx + this.m[3] * sy + this.m[5];
    if (dst) {
      dst.setLocation(dx, dy);
      return dst;
    }
    return new Point2D.Double(dx, dy);
  }

  /** Transform arrays of coordinates in-place. */
  transformPoints(srcPts: number[], srcOff: number, dstPts: number[], dstOff: number, numPts: number): void {
    for (let i = 0; i < numPts; i++) {
      const sx = srcPts[srcOff + i * 2] ?? 0;
      const sy = srcPts[srcOff + i * 2 + 1] ?? 0;
      dstPts[dstOff + i * 2] = this.m[0] * sx + this.m[2] * sy + this.m[4];
      dstPts[dstOff + i * 2 + 1] = this.m[1] * sx + this.m[3] * sy + this.m[5];
    }
  }

  /** Return the CSS/SVG matrix() string. */
  toCSS(): string {
    const [a, b, c, d, e, f] = this.m;
    return `matrix(${a},${b},${c},${d},${e},${f})`;
  }

  clone(): AffineTransform {
    return new AffineTransform(this);
  }
}
