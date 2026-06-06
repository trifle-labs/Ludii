// @java java.awt.geom.PathIterator

/**
 * Segment type constants (values match java.awt.geom.PathIterator).
 */
export const SEG_MOVETO = 0;
export const SEG_LINETO = 1;
export const SEG_QUADTO = 2;
export const SEG_CUBICTO = 3;
export const SEG_CLOSE = 4;

export const WIND_EVEN_ODD = 0;
export const WIND_NON_ZERO = 1;

export interface PathSegment {
  type: number;
  coords: number[]; // up to 6 values
}

/** @java java.awt.geom.PathIterator */
export class PathIterator {
  private segments: PathSegment[];
  private index: number;
  private _windingRule: number;

  constructor(segments: PathSegment[], windingRule: number) {
    this.segments = segments;
    this.index = 0;
    this._windingRule = windingRule;
  }

  isDone(): boolean {
    return this.index >= this.segments.length;
  }

  next(): void {
    this.index++;
  }

  currentSegment(coords: number[]): number {
    const seg = this.segments[this.index];
    if (!seg) throw new Error(`PathIterator: no segment at index ${this.index}`);
    for (let i = 0; i < seg.coords.length; i++) coords[i] = seg.coords[i] ?? 0;
    return seg.type;
  }

  getWindingRule(): number {
    return this._windingRule;
  }
}
