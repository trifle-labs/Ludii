// @java Common/src/main/math/Bezier.java

import { Vector } from './Vector.js';

/**
 * A awt-compatible Point2D-like interface, matching java.awt.geom.Point2D.
 * Used because MathRoutines uses Point2D and Rectangle2D from java.awt.
 */
interface AwtPoint2D {
  getX(): number;
  getY(): number;
}

/**
 * A awt-compatible Rectangle2D-like interface, matching java.awt.geom.Rectangle2D.
 */
interface AwtRectangle2D {
  getX(): number;
  getY(): number;
  getWidth(): number;
  getHeight(): number;
}

/** @java MathRoutines.distance(Point2D, Point2D) — inline helper */
function awtDistance(a: AwtPoint2D, b: AwtPoint2D): number {
  const dx = b.getX() - a.getX();
  const dy = b.getY() - a.getY();
  return Math.sqrt(dx * dx + dy * dy);
}

/** @java MathRoutines.lerp(double, Point2D, Point2D) — inline helper */
function awtLerp(t: number, a: AwtPoint2D, b: AwtPoint2D): Point2DDouble {
  return new Point2DDouble(
    a.getX() + t * (b.getX() - a.getX()),
    a.getY() + t * (b.getY() - a.getY())
  );
}

/** Minimal Point2D.Double equivalent for use within Bezier. */
class Point2DDouble implements AwtPoint2D {
  constructor(public x: number, public y: number) {}
  getX(): number { return this.x; }
  getY(): number { return this.y; }
}

/**
 * Cubic Bezier segment.
 *
 * @java main/math/Bezier.java
 * @author cambolbro
 */
export class Bezier {

  /** @java Bezier.cps */
  private readonly cps: [AwtPoint2D, AwtPoint2D, AwtPoint2D, AwtPoint2D];

  //-------------------------------------------------------------------------

  /**
   * Default constructor.
   * @java Bezier()
   */
  public constructor();
  /**
   * @param pts List of 4 control points.
   * @java Bezier(List<Point2D>)
   */
  public constructor(pts: AwtPoint2D[]);
  /**
   * @param pts Array of 4 control points.
   * @java Bezier(Point2D[])
   */
  public constructor(pts: readonly AwtPoint2D[]);
  /**
   * @param pts Float[][] with 4 pairs.
   * @java Bezier(Float[][])
   */
  public constructor(pts: number[][]);
  /**
   * From two endpoints and their perpendicular direction points.
   * @java Bezier(Point2D, Point2D, Point2D, Point2D)
   */
  public constructor(
    ptA: AwtPoint2D,
    ptAperp: AwtPoint2D,
    ptB: AwtPoint2D,
    ptBperp: AwtPoint2D
  );
  public constructor(
    ptsOrPtA?: AwtPoint2D[] | readonly AwtPoint2D[] | number[][] | AwtPoint2D,
    ptAperpOrUndefined?: AwtPoint2D,
    ptB?: AwtPoint2D,
    ptBperp?: AwtPoint2D
  ) {
    if (ptsOrPtA === undefined) {
      // default constructor — uninitialized cps (will be overwritten by user)
      this.cps = [
        new Point2DDouble(0, 0),
        new Point2DDouble(0, 0),
        new Point2DDouble(0, 0),
        new Point2DDouble(0, 0),
      ];
    } else if (Array.isArray(ptsOrPtA) && Array.isArray((ptsOrPtA as unknown[])[0])) {
      // Float[][] constructor
      const pts = ptsOrPtA as number[][];
      this.cps = [
        new Point2DDouble((pts[0] as number[])[0] as number, (pts[0] as number[])[1] as number),
        new Point2DDouble((pts[1] as number[])[0] as number, (pts[1] as number[])[1] as number),
        new Point2DDouble((pts[2] as number[])[0] as number, (pts[2] as number[])[1] as number),
        new Point2DDouble((pts[3] as number[])[0] as number, (pts[3] as number[])[1] as number),
      ];
    } else if (Array.isArray(ptsOrPtA)) {
      // List<Point2D> or Point2D[] constructor
      const pts = ptsOrPtA as AwtPoint2D[];
      this.cps = [
        pts[0] as AwtPoint2D,
        pts[1] as AwtPoint2D,
        pts[2] as AwtPoint2D,
        pts[3] as AwtPoint2D,
      ];
    } else if (ptAperpOrUndefined !== undefined && ptB !== undefined && ptBperp !== undefined) {
      // Bezier(Point2D ptA, Point2D ptAperp, Point2D ptB, Point2D ptBperp)
      const ptA = ptsOrPtA as AwtPoint2D;
      const ptAperp = ptAperpOrUndefined;

      const vecA = new Vector(ptA, ptAperp);
      const vecB = new Vector(ptB, ptBperp);

      vecA.normalise();
      vecB.normalise();

      const distAB = awtDistance(ptA, ptB);
      const off = 0.333 * distAB;

      const ptA1 = new Point2DDouble(
        ptA.getX() - off * vecA.getY(),
        ptA.getY() + off * vecA.getX()
      );
      const ptA2 = new Point2DDouble(
        ptA.getX() + off * vecA.getY(),
        ptA.getY() - off * vecA.getX()
      );

      const ptB1 = new Point2DDouble(
        ptB.getX() - off * vecB.getY(),
        ptB.getY() + off * vecB.getX()
      );
      const ptB2 = new Point2DDouble(
        ptB.getX() + off * vecB.getY(),
        ptB.getY() - off * vecB.getX()
      );

      const cp1 = (awtDistance(ptA1, ptB) < awtDistance(ptA2, ptB)) ? ptA1 : ptA2;
      const cp2 = (awtDistance(ptB1, ptA) < awtDistance(ptB2, ptA)) ? ptB1 : ptB2;

      this.cps = [ptA, cp1, cp2, ptB];
    } else {
      this.cps = [
        new Point2DDouble(0, 0),
        new Point2DDouble(0, 0),
        new Point2DDouble(0, 0),
        new Point2DDouble(0, 0),
      ];
    }
  }

  //-------------------------------------------------------------------------

  /** @java Bezier.cps() */
  public getCps(): readonly AwtPoint2D[] {
    return this.cps;
  }

  //-------------------------------------------------------------------------

  /**
   * @java Bezier.length()
   */
  public length(): number {
    return (
      awtDistance(this.cps[0], this.cps[1]) +
      awtDistance(this.cps[1], this.cps[2]) +
      awtDistance(this.cps[2], this.cps[3])
    );
  }

  /**
   * @java Bezier.midpoint()
   */
  public midpoint(): AwtPoint2D {
    const ab = new Point2DDouble(
      (this.cps[0].getX() + this.cps[1].getX()) / 2,
      (this.cps[0].getY() + this.cps[1].getY()) / 2
    );
    const bc = new Point2DDouble(
      (this.cps[1].getX() + this.cps[2].getX()) / 2,
      (this.cps[1].getY() + this.cps[2].getY()) / 2
    );
    const cd = new Point2DDouble(
      (this.cps[2].getX() + this.cps[3].getX()) / 2,
      (this.cps[2].getY() + this.cps[3].getY()) / 2
    );

    const abbc = new Point2DDouble(
      (ab.getX() + bc.getX()) / 2,
      (ab.getY() + bc.getY()) / 2
    );
    const bccd = new Point2DDouble(
      (bc.getX() + cd.getX()) / 2,
      (bc.getY() + cd.getY()) / 2
    );

    return new Point2DDouble(
      (abbc.getX() + bccd.getX()) / 2,
      (abbc.getY() + bccd.getY()) / 2
    );
  }

  /**
   * De Casteljau algorithm.
   * @java Bezier.sample(double)
   */
  public sample(t: number): AwtPoint2D {
    const ab = awtLerp(t, this.cps[0], this.cps[1]);
    const bc = awtLerp(t, this.cps[1], this.cps[2]);
    const cd = awtLerp(t, this.cps[2], this.cps[3]);

    const abbc = awtLerp(t, ab, bc);
    const bccd = awtLerp(t, bc, cd);

    return awtLerp(t, abbc, bccd);
  }

  //-------------------------------------------------------------------------

  /**
   * @return Bounding box of points.
   * @java Bezier.bounds()
   */
  public bounds(): AwtRectangle2D {
    let x0 = 1000000;
    let y0 = 1000000;
    let x1 = -1000000;
    let y1 = -1000000;

    for (const pt of this.cps) {
      const x = pt.getX();
      const y = pt.getY();

      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }

    const bx = x0, by = y0, bw = x1 - x0, bh = y1 - y0;
    return {
      getX(): number { return bx; },
      getY(): number { return by; },
      getWidth(): number { return bw; },
      getHeight(): number { return bh; },
    };
  }

  //-------------------------------------------------------------------------

  /** @java Bezier.toString() */
  public toString(): string {
    const sb: string[] = [];
    sb.push("Bezier:");
    for (const pt of this.cps) {
      sb.push(" (" + pt.getX() + "," + pt.getY() + ")");
    }
    return sb.join("");
  }

  //-------------------------------------------------------------------------
}
