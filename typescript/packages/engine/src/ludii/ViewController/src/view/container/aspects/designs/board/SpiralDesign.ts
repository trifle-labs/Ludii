// @java ViewController/src/view/container/aspects/designs/board/SpiralDesign.java

/**
 * Graphics for the spiral board (e.g. Mehen).
 *
 * @author cambolbro (Java original)
 * @java view.container.aspects.designs.board.SpiralDesign
 */

import {
  Color,
  BasicStroke,
  CAP_BUTT,
  JOIN_ROUND,
  GeneralPath,
  Point2D,
  type Stroke,
} from '../../../../../../../../ludii/awt/index.js';
import { Point } from '../../../../../../../../ludii/awt/index.js';
import type { SVGGraphics2D } from '../../../../../../../../ludii/awt/index.js';
import type { Graphics2D } from '../../../../../../../../ludii/awt/index.js';
import { Vector } from '../../../../../../../../ludii/Common/src/main/math/Vector.js';
import type { Bridge } from '../../../../../bridge/Bridge.js';
import type { Context } from '../../../../../../../../ludemes/other/context/Context.js';

// ---------------------------------------------------------------------------
// Escape hatch for BoardDesign (batch 26) not yet ported.
// ---------------------------------------------------------------------------

/** @java view.container.aspects.designs.BoardDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BoardDesignBase: any = class {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(..._args: any[]) { /* batch-26 shim */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected boardStyle: any = null;
  protected setStrokesAndColours(..._args: unknown[]): void { /* shim */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected topology(): any { return null; }
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/** Inline distance helper (MathRoutines.distance not yet ported standalone). */
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Inline distance2D helper for Point2D. */
function distancePt(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------------------------------------------------------------------------

/**
 * Graphics for the spiral board (e.g. Mehen).
 *
 * @java view.container.aspects.designs.board.SpiralDesign
 */
export class SpiralDesign extends BoardDesignBase {

  /** @java SpiralDesign.numSites */
  private numSites: number = 1;

  /** @java SpiralDesign.numTurns */
  private numTurns: number = 1;

  /** @java SpiralDesign.thetas — angles for vertex positions */
  private thetas: number[] = [];

  // --------------------------------------------------------------------------

  /**
   * @java SpiralDesign(BoardStyle)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardStyle: any) {
    super(boardStyle, null);
  }

  // --------------------------------------------------------------------------

  /**
   * @java SpiralDesign#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues() as SVGGraphics2D;

    const swRatio = 5 / 1000.0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const swThin = Math.max(1, Math.trunc(swRatio * (this.boardStyle.placement().width as number) + 0.5));
    const swThick = 1 * swThin;

    this.setStrokesAndColours(
      bridge,
      context,
      new Color(0, 0, 0),
      new Color(150, 75, 0),    // border
      new Color(200, 150, 75),  // dark cells
      new Color(250, 221, 144), // light cells
      new Color(223, 178, 110), // middle cells
      null,
      null,
      null,
      null,
      swThin,
      swThick,
    );

    // Number of turns is first dimension of Spiral shape
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.numTurns = (context as unknown as { board(): { graph(): { dim(): number[] } } }).board().graph().dim()[0] ?? 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.numSites = (this.topology().vertices() as unknown[]).length;

    this.setThetas();
    this.drawSpiralBoard(g2d as unknown as Graphics2D);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
  }

  // --------------------------------------------------------------------------

  /**
   * @java SpiralDesign#setThetas()
   */
  setThetas(): void {
    // Twice the number of vertices per ring, offset between rings
    const base = this.baseNumber();

    this.thetas = new Array<number>(2 * this.numSites).fill(0);
    let index = 1;

    let steps = base; // number of steps per ring
    for (let ring = 1; ring <= this.numTurns + 1; ring++) {
      const dTheta = Math.PI * 2 / steps;
      let theta = Math.PI * 2 * ring;

      if (ring <= 2 || ring % 2 === 1) {
        theta -= dTheta / 2; // offset so that lines don't coincide between rings
      }

      for (let step = 0; step < steps; step++) {
        this.thetas[index++] = theta;
        theta += dTheta;
      }
      if (ring <= 2) {
        steps *= 2;
      }
    }

    // Smoothing passes to reduce unevenness between steps
    for (let vid = 2; vid < this.numSites; vid++) {
      this.thetas[vid] = ((this.thetas[vid - 1] ?? 0) + (this.thetas[vid + 1] ?? 0)) / 2.0;
    }

    for (let vid = 2; vid < this.numSites; vid++) {
      this.thetas[vid] = ((this.thetas[vid - 1] ?? 0) + (this.thetas[vid + 1] ?? 0)) / 2.0;
    }

    this.thetas[1] = (this.thetas[1] ?? 0) - 0.5 * ((this.thetas[2] ?? 0) - (this.thetas[1] ?? 0)); // fudge to nudge vertex 1 into place
  }

  // --------------------------------------------------------------------------

  /**
   * @return Number of cells in the inner ring, doubling with each layer.
   * @java SpiralDesign#baseNumber()
   */
  private baseNumber(): number {
    for (let base = 1; base < this.numSites; base++) {
      // Try this base
      let steps = base;
      let total = 1;

      for (let ring = 1; ring < this.numTurns; ring++) {
        total += steps;
        if (total > this.numSites) {
          if (ring <= this.numTurns) {
            return base - 1;
          }
          break;
        }
        if (ring <= 2) {
          steps *= 2;
        }
      }
    }

    console.error('** Error: Couldn\'t find base number for spiral.');
    return 0;
  }

  // --------------------------------------------------------------------------

  /**
   * @java SpiralDesign#drawSpiralBoard(Graphics2D)
   */
  drawSpiralBoard(g2d: Graphics2D): void {
    const rd = 2;
    g2d.setColor(new Color(0, 127, 255));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const vertices = this.topology().vertices() as Array<{ centroid(): { getX(): number; getY(): number } }>;
    for (const vertex of vertices) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const pt: Point = this.boardStyle.screenPosn(vertex.centroid()) as Point;
      g2d.fillOval(pt.x - rd, pt.y - rd, 2 * rd, 2 * rd);
    }

    const a = 0.05;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const b = 1.0 / (2.0 * this.numTurns * this.numTurns) * 0.8;

    const halfLen = Math.trunc(this.thetas.length / 2);
    const end =
      ((this.thetas[halfLen - 1] ?? 0) + (this.thetas[halfLen] ?? 0)) / 2;

    const nudge = 0.005;

    const x0 = vertices[0]?.centroid().getX() ?? 0;
    const y0 = vertices[0]?.centroid().getY() ?? 0;

    const pts: Point[] = [];

    for (let theta = -0.05; theta < end + 1; theta += 0.2) {
      const clipTheta = (theta > end ? end : theta) - nudge;
      const r = a + b * clipTheta;
      const x = x0 - r * Math.cos(clipTheta);
      const y = y0 + r * Math.sin(clipTheta);

      const xy = new Point2D.Double(x, y);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const pt: Point = this.boardStyle.screenPosn(xy) as Point;
      pts.push(pt);

      if (theta > end) {
        // Store one last sample at end point
        const r2 = a + b * theta;
        const x2 = x0 - r2 * Math.cos(theta);
        const y2 = y0 + r2 * Math.sin(theta);

        const xy2 = new Point2D.Double(x2, y2);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const pt2: Point = this.boardStyle.screenPosn(xy2) as Point;
        pts.push(pt2);

        // Store final point to close on
        const r3 = a - 0.1 + b * (end + nudge);
        const x3 = x0 - r3 * Math.cos(end + nudge);
        const y3 = y0 + r3 * Math.sin(end + nudge);

        const xy3 = new Point2D.Double(x3, y3);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const pt3: Point = this.boardStyle.screenPosn(xy3) as Point;
        pts.push(pt3);

        break;
      }
    }

    // Draw smooth spline
    let path = new GeneralPath();
    for (let n = 0; n < pts.length - 3; n++) {
      const pt = pts[n];
      if (pt === undefined) continue;
      if (n === 0) {
        path.moveTo(pt.x, pt.y);
      } else {
        const ptA = pts[n - 1];
        const ptB = pts[n];
        const ptC = pts[n + 1];
        const ptD = pts[n + 2];
        if (ptA === undefined || ptB === undefined || ptC === undefined || ptD === undefined) continue;

        const vecAC = new Vector(ptC.x - ptA.x, ptC.y - ptA.y);
        vecAC.normalise();

        const vecDB = new Vector(ptB.x - ptD.x, ptB.y - ptD.y);
        vecDB.normalise();

        const distBC = distancePt(ptB.x, ptB.y, ptC.x, ptC.y);
        const off = 0.3 * distBC;

        const bx = ptB.x + vecAC.getX() * off;
        const by = ptB.y + vecAC.getY() * off;
        const cx = ptC.x + vecDB.getX() * off;
        const cy = ptC.y + vecDB.getY() * off;
        const dx = ptC.x;
        const dy = ptC.y;

        path.curveTo(bx, by, cx, cy, dx, dy);
      }
    }

    // Final closing point to draw straight edge
    const ptN = pts[pts.length - 1];
    if (ptN !== undefined) {
      path.lineTo(ptN.x, ptN.y);
    }

    g2d.setColor(new Color(255, 240, 220));
    g2d.fill(path);

    g2d.setStroke(new BasicStroke(3, CAP_BUTT, JOIN_ROUND) as unknown as Stroke);
    g2d.setColor(new Color(220, 180, 120));
    g2d.draw(path);

    // Draw the central cell
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptC1: Point = this.boardStyle.screenPosn(vertices[1]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptC2: Point = this.boardStyle.screenPosn(vertices[2]?.centroid()) as Point;
    const u = distance(ptC1, ptC2);

    path = new GeneralPath();
    const ptAFirst = pts[0];
    const ptBLast = pts[22];
    if (ptAFirst !== undefined && ptBLast !== undefined) {
      path.moveTo(ptAFirst.x, ptAFirst.y);
      path.curveTo(
        ptAFirst.x + Math.trunc(0.25 * u), ptAFirst.y + Math.trunc(0.5 * u),
        ptBLast.x + Math.trunc(0 * u), ptBLast.y - Math.trunc(0.5 * u),
        ptBLast.x, ptBLast.y,
      );
      g2d.draw(path);
    }

    // Draw the septum divisions
    for (let vid = 1; vid < Math.trunc(this.thetas.length / 2); vid++) {
      const theta = ((this.thetas[vid] ?? 0) + (this.thetas[vid + 1] ?? 0)) / 2;

      const r1 = a - 0.1 + b * (theta + nudge);
      const x1 = x0 - r1 * Math.cos(theta + nudge);
      const y1 = y0 + r1 * Math.sin(theta + nudge);

      const xy1 = new Point2D.Double(x1, y1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const pt1: Point = this.boardStyle.screenPosn(xy1) as Point;

      const r2 = a + b * (theta - nudge);
      const x2 = x0 - r2 * Math.cos(theta - nudge);
      const y2 = y0 + r2 * Math.sin(theta - nudge);

      const xy2 = new Point2D.Double(x2, y2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const pt2: Point = this.boardStyle.screenPosn(xy2) as Point;

      g2d.drawLine(pt1.x, pt1.y, pt2.x, pt2.y);
    }
  }

  // --------------------------------------------------------------------------

  /**
   * @return Point projected inwards to the ring that the specified vertex angle
   * would lie on.
   * @java SpiralDesign#ptOnRing(double, double, double, double, double, double)
   */
  ptOnRing(
    x0: number, y0: number, a: number, b: number,
    theta: number, scale: number,
  ): Point2D.Double {
    const thetaPrev = theta - 2 * Math.PI;

    const r = a + b * theta;
    const rPrev = a + b * thetaPrev;

    const pt = new Point2D.Double(
      x0 + r * Math.cos(theta),
      y0 - r * Math.sin(theta),
    );
    const ptP = new Point2D.Double(
      x0 + rPrev * Math.cos(thetaPrev),
      y0 - rPrev * Math.sin(thetaPrev),
    );

    return new Point2D.Double(
      (pt.x + ptP.x) / 2.0 * scale,
      (pt.y + ptP.y) / 2.0 * scale,
    );
  }

  // --------------------------------------------------------------------------
}
