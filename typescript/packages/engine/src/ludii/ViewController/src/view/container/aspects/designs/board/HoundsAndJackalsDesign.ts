// @java ViewController/src/view/container/aspects/designs/board/HoundsAndJackalsDesign.java

/**
 * Board design for Hounds and Jackals.
 *
 * @java view.container.aspects.designs.board.HoundsAndJackalsDesign
 */

import {
  Color,
  BasicStroke,
  CAP_BUTT,
  CAP_ROUND,
  JOIN_MITER,
  JOIN_ROUND,
  Arc2D,
  GeneralPath,
  type Stroke,
} from '../../../../../../../../ludii/awt/index.js';
import { Point } from '../../../../../../../../ludii/awt/index.js';
import type { SVGGraphics2D } from '../../../../../../../../ludii/awt/index.js';
import type { Graphics2D } from '../../../../../../../../ludii/awt/index.js';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected boardPlacement: any = null;
  protected setStrokesAndColours(..._args: unknown[]): void { /* shim */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected topology(): any { return null; }
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/**
 * Board design for Hounds and Jackals.
 *
 * @java view.container.aspects.designs.board.HoundsAndJackalsDesign
 */
export class HoundsAndJackalsDesign extends BoardDesignBase {

  /** @java HoundsAndJackalsDesign.specialDots */
  private readonly specialDots: Set<number> = new Set<number>();

  // --------------------------------------------------------------------------

  /**
   * @java HoundsAndJackalsDesign(BoardStyle, BoardPlacement)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardStyle: any, boardPlacement: any) {
    super(boardStyle, boardPlacement);

    this.specialDots.add(0);
    this.specialDots.add(5);
    this.specialDots.add(7);
    this.specialDots.add(9);
    this.specialDots.add(14);
    this.specialDots.add(19);
    this.specialDots.add(24);
    this.specialDots.add(29);
    this.specialDots.add(34);
    this.specialDots.add(36);
    this.specialDots.add(38);
    this.specialDots.add(43);
    this.specialDots.add(48);
    this.specialDots.add(53);
    this.specialDots.add(58);
  }

  // --------------------------------------------------------------------------

  /**
   * @java HoundsAndJackalsDesign#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues() as SVGGraphics2D;

    const swRatio = 5 / 1000.0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const swThin = Math.max(1, Math.trunc(swRatio * (this.boardStyle.placement().width as number) + 0.5));
    const swThick = 2 * swThin;

    this.setStrokesAndColours(
      bridge,
      context,
      new Color(200, 200, 200),
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      new Color(140, 140, 140),
      swThin,
      swThick,
    );

    this.drawHoundsAndJackalsBoard(g2d as unknown as Graphics2D);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
  }

  // --------------------------------------------------------------------------

  /**
   * Draws the Hounds and Jackals board design.
   *
   * @java HoundsAndJackalsDesign#drawHoundsAndJackalsBoard(Graphics2D)
   */
  drawHoundsAndJackalsBoard(g2d: Graphics2D): void {
    // Draw the board
    let path = new GeneralPath();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const vertices = this.topology().vertices() as Array<{ centroid(): { getX(): number; getY(): number } }>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt0: Point = this.boardStyle.screenPosn(vertices[0]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt1: Point = this.boardStyle.screenPosn(vertices[1]?.centroid()) as Point;
    const unit = pt1.y - pt0.y;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptA: Point = this.boardStyle.screenPosn(vertices[10]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptB: Point = this.boardStyle.screenPosn(vertices[23]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptE: Point = this.boardStyle.screenPosn(vertices[58]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptH: Point = this.boardStyle.screenPosn(vertices[52]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptI: Point = this.boardStyle.screenPosn(vertices[39]?.centroid()) as Point;

    const border = Math.trunc(0.9 * unit);

    // CPs up left side
    const ax = ptA.x - border;
    const ay = ptA.y + border;

    const bx = ax;
    const by = ptB.y;

    const cx = ax;
    const cy = by - 3 * unit;

    // CPs along top
    const ex = ptE.x;
    const ey = ptE.y - border;

    const dx = ex - 1 * unit;
    const dy = ey;

    const fx = ex + 1 * unit;
    const fy = ey;

    // CPs down right side
    const hx = ptH.x + border;
    const hy = ptH.y;

    const gx = hx;
    const gy = hy - 3 * unit;

    const ix = hx;
    const iy = ptI.y + border;

    path.moveTo(ax, ay);
    path.lineTo(bx, by);
    path.curveTo(cx, cy, dx, dy, ex, ey);
    path.curveTo(fx, fy, gx, gy, hx, hy);
    path.lineTo(ix, iy);
    path.closePath();

    g2d.setColor(new Color(255, 240, 220));
    g2d.fill(path);

    const strokeB = new BasicStroke(0.5, CAP_BUTT, JOIN_MITER);
    g2d.setStroke(strokeB as unknown as Stroke);

    g2d.setColor(new Color(127, 120, 110));
    g2d.draw(path);

    // Draw the dots
    const rO = Math.trunc(0.15 * unit);
    const rI = Math.trunc(rO / 2);

    const sw = 0.03 * unit;

    const strokeD = new BasicStroke(sw, CAP_BUTT, JOIN_MITER);
    g2d.setStroke(strokeD as unknown as Stroke);

    const dotColour = new Color(190, 150, 100);
    g2d.setColor(dotColour);

    for (let vid = 0; vid < vertices.length; vid++) {
      const vertex = vertices[vid];
      if (vertex === undefined) continue;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const pt: Point = this.boardStyle.screenPosn(vertex.centroid()) as Point;

      const arcO = new Arc2D.Double(pt.x - rO, pt.y - rO, 2 * rO + 1, 2 * rO + 1, 0, 360, Arc2D.OPEN);
      g2d.draw(arcO);

      if (this.specialDots.has(vid)) {
        // Also draw inner dot
        const arcI = new Arc2D.Double(pt.x - rI, pt.y - rI, 2 * rI + 1, 2 * rI + 1, 0, 360, Arc2D.OPEN);
        g2d.draw(arcI);
      }
    }

    // Draw short curves
    const strokeC = new BasicStroke(2 * sw, CAP_ROUND, JOIN_ROUND);
    g2d.setStroke(strokeC as unknown as Stroke);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt5: Point  = this.boardStyle.screenPosn(vertices[5]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt7: Point  = this.boardStyle.screenPosn(vertices[7]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt9: Point  = this.boardStyle.screenPosn(vertices[9]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt19: Point = this.boardStyle.screenPosn(vertices[19]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt34: Point = this.boardStyle.screenPosn(vertices[34]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt36: Point = this.boardStyle.screenPosn(vertices[36]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt38: Point = this.boardStyle.screenPosn(vertices[38]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt48: Point = this.boardStyle.screenPosn(vertices[48]?.centroid()) as Point;

    const d1 = Math.trunc(0.333 * unit);
    const d2 = Math.trunc(1.333 * unit);

    // Lower left
    path = new GeneralPath();
    path.moveTo(pt9.x - d1, pt9.y);
    path.curveTo(pt9.x - d2, pt9.y, pt7.x - d2, pt7.y, pt7.x - d1, pt7.y);
    g2d.draw(path);

    // Lower right
    path = new GeneralPath();
    path.moveTo(pt38.x + d1, pt38.y);
    path.curveTo(pt38.x + d2, pt38.y, pt36.x + d2, pt36.y, pt36.x + d1, pt36.y);
    g2d.draw(path);

    // Upper left
    path = new GeneralPath();
    path.moveTo(pt5.x - d1, pt5.y);
    path.curveTo(pt5.x - d2, pt5.y, pt19.x + d2, pt19.y, pt19.x + d1, pt19.y);
    g2d.draw(path);

    // Upper right
    path = new GeneralPath();
    path.moveTo(pt34.x + d1, pt34.y);
    path.curveTo(pt34.x + d2, pt34.y, pt48.x - d2, pt48.y, pt48.x - d1, pt48.y);
    g2d.draw(path);
  }

  // --------------------------------------------------------------------------
}
