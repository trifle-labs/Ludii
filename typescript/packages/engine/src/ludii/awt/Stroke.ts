// @java java.awt.BasicStroke / java.awt.Stroke

/** Cap style constants matching java.awt.BasicStroke */
export const CAP_BUTT   = 0;
export const CAP_ROUND  = 1;
export const CAP_SQUARE = 2;

/** Join style constants */
export const JOIN_MITER = 0;
export const JOIN_ROUND = 1;
export const JOIN_BEVEL = 2;

/** Stroke marker interface */
export interface Stroke {
  readonly _strokeBrand: true;
}

/** @java java.awt.BasicStroke */
export class BasicStroke implements Stroke {
  readonly _strokeBrand = true as const;

  static readonly CAP_BUTT   = CAP_BUTT;
  static readonly CAP_ROUND  = CAP_ROUND;
  static readonly CAP_SQUARE = CAP_SQUARE;
  static readonly JOIN_MITER = JOIN_MITER;
  static readonly JOIN_ROUND = JOIN_ROUND;
  static readonly JOIN_BEVEL = JOIN_BEVEL;

  readonly lineWidth: number;
  readonly endCap: number;
  readonly lineJoin: number;
  readonly miterLimit: number;
  readonly dashArray: number[] | null;
  readonly dashPhase: number;

  constructor(
    lineWidth = 1,
    endCap: number = CAP_SQUARE,
    lineJoin: number = JOIN_MITER,
    miterLimit = 10,
    dashArray: number[] | null = null,
    dashPhase = 0,
  ) {
    this.lineWidth   = lineWidth;
    this.endCap      = endCap;
    this.lineJoin    = lineJoin;
    this.miterLimit  = miterLimit;
    this.dashArray   = dashArray ?? null;
    this.dashPhase   = dashPhase;
  }

  getLineWidth(): number  { return this.lineWidth; }
  getEndCap():    number  { return this.endCap; }
  getLineJoin():  number  { return this.lineJoin; }
  getMiterLimit():number  { return this.miterLimit; }
  getDashArray(): number[] | null { return this.dashArray; }
  getDashPhase(): number  { return this.dashPhase; }

  // ---- SVG attribute helpers ----

  toSVGStrokeLinecap(): string {
    switch (this.endCap) {
      case CAP_ROUND:  return 'round';
      case CAP_BUTT:   return 'butt';
      default:         return 'square';
    }
  }

  toSVGStrokeLinejoin(): string {
    switch (this.lineJoin) {
      case JOIN_ROUND: return 'round';
      case JOIN_BEVEL: return 'bevel';
      default:         return 'miter';
    }
  }

  toSVGStrokeDasharray(): string {
    if (!this.dashArray || this.dashArray.length === 0) return 'none';
    return this.dashArray.join(',');
  }

  toSVGStrokeDashoffset(): string {
    return String(this.dashPhase);
  }
}
