// @java ViewController/src/view/container/aspects/designs/board/SnakesAndLaddersDesign.java

/**
 * Board design for Snakes and Ladders.
 *
 * @java view.container.aspects.designs.board.SnakesAndLaddersDesign
 */

import {
  Color,
  BasicStroke,
  CAP_BUTT,
  JOIN_MITER,
  Font,
  PLAIN,
  GeneralPath,
  Line2D,
  type Stroke,
} from '../../../../../../../../ludii/awt/index.js';
import { Point } from '../../../../../../../../ludii/awt/index.js';
import type { SVGGraphics2D } from '../../../../../../../../ludii/awt/index.js';
import type { Graphics2D } from '../../../../../../../../ludii/awt/index.js';
import { Point2D } from '../../../../../../../../ludii/awt/index.js';
import type { Bridge } from '../../../../../bridge/Bridge.js';
import type { Context } from '../../../../../../../../ludemes/other/context/Context.js';
import type { Map as GameMap } from '../../../../../../../../ludemes/game/equipment/other/Map.js';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected strokeThin: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected colorFillPhase0: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected colorFillPhase1: any = null;
  protected setStrokesAndColours(..._args: unknown[]): void { /* shim */ }
  protected drawOuterCellEdges(_bridge: unknown, _g2d: unknown, _context: unknown): void { /* shim */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected topology(): any { return null; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected screenPosn(_pt: unknown): any { return null; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected cellRadius(): number { return 0; }
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/** Inline distance helper (java.awt.Point based). */
function distancePts(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Inline distance helper for two Point2D. */
function distancePt2D(a: { getX(): number; getY(): number }, b: { getX(): number; getY(): number }): number {
  const dx = b.getX() - a.getX();
  const dy = b.getY() - a.getY();
  return Math.sqrt(dx * dx + dy * dy);
}

/** Inline MathRoutines.shade — adjusts color brightness. */
function shade(colour: Color, adjust: number): Color {
  const r = Math.max(0, Math.min(255, Math.trunc(colour.getRed() * adjust + 0.5)));
  const g = Math.max(0, Math.min(255, Math.trunc(colour.getGreen() * adjust + 0.5)));
  const b = Math.max(0, Math.min(255, Math.trunc(colour.getBlue() * adjust + 0.5)));
  return new Color(r, g, b);
}

// ---------------------------------------------------------------------------

/**
 * Board design for Snakes and Ladders.
 *
 * @java view.container.aspects.designs.board.SnakesAndLaddersDesign
 */
export class SnakesAndLaddersDesign extends BoardDesignBase {

  /**
   * @java SnakesAndLaddersDesign(BoardStyle, BoardPlacement)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardStyle: any, boardPlacement: any) {
    super(boardStyle, boardPlacement);
  }

  // --------------------------------------------------------------------------

  /**
   * @java SnakesAndLaddersDesign#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues() as SVGGraphics2D;

    const swRatio = 5 / 1000.0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const swThin = Math.max(1, Math.trunc(swRatio * (this.boardStyle.placement().width as number) + 0.5));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const swThick = Math.max(2, Math.trunc(0.002 * (this.boardStyle.placement().width as number) + 0.5));

    const shade0 = new Color(210, 240, 255);
    const shade1 = new Color(190, 220, 255);
    const shadeEdge = shade(shade0, 0.25);

    this.setStrokesAndColours(
      bridge,
      context,
      null,
      null,
      shade0,
      shade1,
      null,
      null,
      null,
      null,
      shadeEdge,
      swThin,
      swThick,
    );

    this.fillCells(bridge, g2d as unknown as Graphics2D, context);
    this.drawSnakesAndLadders(
      g2d as unknown as Graphics2D,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      (context as unknown as { game(): { equipment(): { maps(): GameMap[] | null } } }).game(),
    );
    this.drawOuterCellEdges(bridge, g2d, context);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
  }

  // --------------------------------------------------------------------------

  /**
   * Draws the snakes and ladders graphics on the board.
   *
   * @java SnakesAndLaddersDesign#drawSnakesAndLadders(Graphics2D, Game)
   */
  private drawSnakesAndLadders(
    g2d: Graphics2D,
    game: { equipment(): { maps(): GameMap[] | null } },
  ): void {
    const maps = game.equipment().maps() ?? [];

    // Draw snakes
    for (const map of maps) {
      for (const [from, to] of map.map().entries()) {
        if (from > to) {
          this.drawSnake(g2d, from, to);
        }
      }
    }

    // Draw ladders
    for (const map of maps) {
      for (const [from, to] of map.map().entries()) {
        if (from < to) {
          this.drawLadder(g2d, from, to);
        }
      }
    }
  }

  // --------------------------------------------------------------------------

  /**
   * Draws the ladders on the board.
   *
   * @java SnakesAndLaddersDesign#drawLadder(Graphics2D, int, int)
   */
  private drawLadder(g2d: Graphics2D, from: number, to: number): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const cells = this.topology().cells() as Array<{ centroid(): { getX(): number; getY(): number } }>;

    // Amount to clip ladder ends
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const clip = 0.5 * (this.boardStyle.cellRadius() as number) * (this.boardStyle.placement().width as number);

    const cellA = cells[from];
    const cellB = cells[to];
    if (cellA === undefined || cellB === undefined) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pixelA: Point = this.boardStyle.screenPosn(cellA.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pixelB: Point = this.boardStyle.screenPosn(cellB.centroid()) as Point;

    const angle = Math.atan2(pixelB.y - pixelA.y, pixelB.x - pixelA.x);

    const ptA = new Point2D.Double(
      pixelA.x + clip * Math.cos(angle),
      pixelA.y + clip * Math.sin(angle),
    );
    const ptB = new Point2D.Double(
      pixelB.x + clip * Math.cos(angle + Math.PI),
      pixelB.y + clip * Math.sin(angle + Math.PI),
    );

    // Spacing between rails
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const width = 0.3 * (this.boardStyle.cellRadius() as number) * (this.boardStyle.placement().width as number);

    const l0x = ptA.x + width * Math.cos(angle + Math.PI / 2);
    const l0y = ptA.y + width * Math.sin(angle + Math.PI / 2);
    const l1x = ptB.x + width * Math.cos(angle + Math.PI / 2);
    const l1y = ptB.y + width * Math.sin(angle + Math.PI / 2);
    const r0x = ptA.x + width * Math.cos(angle - Math.PI / 2);
    const r0y = ptA.y + width * Math.sin(angle - Math.PI / 2);
    const r1x = ptB.x + width * Math.cos(angle - Math.PI / 2);
    const r1y = ptB.y + width * Math.sin(angle - Math.PI / 2);

    // Draw rungs
    const length = distancePt2D(ptA, ptB);
    const numRungs = Math.trunc(0.75 * length / width);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const stroke = new BasicStroke(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      0.125 * (this.boardStyle.cellRadius() as number) * (this.boardStyle.placement().width as number),
      CAP_BUTT, JOIN_MITER,
    );
    g2d.setStroke(stroke as unknown as Stroke);

    g2d.setColor(new Color(255, 127, 0));

    for (let r = 1; r < numRungs - 1; r++) {
      const t = r / (numRungs - 1);

      const rungLx = l0x + t * (l1x - l0x);
      const rungLy = l0y + t * (l1y - l0y);
      const rungRx = r0x + t * (r1x - r0x);
      const rungRy = r0y + t * (r1y - r0y);

      const rung = new Line2D.Double(rungLx, rungLy, rungRx, rungRy);
      g2d.draw(rung);
    }

    // Draw rails
    const left = new Line2D.Double(l0x, l0y, l1x, l1y);
    const right = new Line2D.Double(r0x, r0y, r1x, r1y);

    g2d.draw(left);
    g2d.draw(right);
  }

  // --------------------------------------------------------------------------

  /**
   * Draws the snakes on the board.
   *
   * @java SnakesAndLaddersDesign#drawSnake(Graphics2D, int, int)
   */
  private drawSnake(g2d: Graphics2D, from: number, to: number): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const cells = this.topology().cells() as Array<{ centroid(): { getX(): number; getY(): number } }>;

    // Amount to clip
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const u = (this.boardStyle.cellRadius() as number) * (this.boardStyle.placement().width as number);
    const clipTail = 0.5 * u;
    const clipHead = 0.75 * u;

    const cellA = cells[from];
    const cellB = cells[to];
    if (cellA === undefined || cellB === undefined) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pixelA: Point = this.boardStyle.screenPosn(cellA.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pixelB: Point = this.boardStyle.screenPosn(cellB.centroid()) as Point;

    const angle = Math.atan2(pixelB.y - pixelA.y, pixelB.x - pixelA.x);

    const ptA = new Point2D.Double(
      pixelA.x + clipTail * Math.cos(angle),
      pixelA.y + clipTail * Math.sin(angle),
    );
    const ptB = new Point2D.Double(
      pixelB.x + clipHead * Math.cos(angle + Math.PI),
      pixelB.y + clipHead * Math.sin(angle + Math.PI),
    );

    // Undulations
    const offI = 0.2 * u;
    const offO = 0.6 * u;

    const length = distancePt2D(ptA, ptB);
    const numBends = 4 + Math.trunc(0.5 * length / u);

    // Each control-point pair: [outer, inner]
    const cps: [Point2D.Double, Point2D.Double][] = [];
    for (let i = 0; i <= numBends; i++) {
      cps.push([new Point2D.Double(0, 0), new Point2D.Double(0, 0)]);
    }
    const cpA = cps[0];
    if (cpA) { cpA[0] = ptA; cpA[1] = ptA; }
    const cpNm1 = cps[numBends - 1];
    if (cpNm1) { cpNm1[0] = ptB; cpNm1[1] = ptB; }

    for (let b = 1; b < numBends - 1; b++) {
      const t = b / (numBends - 1);

      const tx = ptA.x + t * (ptB.x - ptA.x);
      const ty = ptA.y + t * (ptB.y - ptA.y);

      const cpB = cps[b];
      if (cpB === undefined) continue;
      if (b % 2 === 0) {
        cpB[0] = new Point2D.Double(tx + offI * Math.cos(angle + Math.PI / 2), ty + offI * Math.sin(angle + Math.PI / 2));
        cpB[1] = new Point2D.Double(tx + offO * Math.cos(angle + Math.PI / 2), ty + offO * Math.sin(angle + Math.PI / 2));
      } else {
        cpB[1] = new Point2D.Double(tx + offI * Math.cos(angle - Math.PI / 2), ty + offI * Math.sin(angle - Math.PI / 2));
        cpB[0] = new Point2D.Double(tx + offO * Math.cos(angle - Math.PI / 2), ty + offO * Math.sin(angle - Math.PI / 2));
      }
    }

    // Draw snake
    const path = new GeneralPath();
    path.moveTo(ptA.x, ptA.y);

    const off = 0.6;

    for (let b = 0; b < numBends - 2; b++) {
      const cp0 = cps[b];
      const cp1 = cps[b + 1];
      const cp2 = cps[b + 2];
      if (cp0 === undefined || cp1 === undefined || cp2 === undefined) continue;

      const b0x = cp0[0].x;
      const b0y = cp0[0].y;
      const b1x = cp1[0].x;
      const b1y = cp1[0].y;
      const b2x = cp2[0].x;
      const b2y = cp2[0].y;

      const ax = (b0x + b1x) / 2.0;
      const ay = (b0y + b1y) / 2.0;
      const dx = (b1x + b2x) / 2.0;
      const dy = (b1y + b2y) / 2.0;

      const bx = ax + off * (b1x - ax);
      const by = ay + off * (b1y - ay);
      const cx = dx + off * (b1x - dx);
      const cy = dy + off * (b1y - dy);

      path.curveTo(bx, by, cx, cy, dx, dy);
    }
    path.lineTo(ptB.x, ptB.y);

    for (let b = numBends - 3; b >= 0; b--) {
      const cp2 = cps[b + 2];
      const cp1 = cps[b + 1];
      const cp0 = cps[b];
      if (cp0 === undefined || cp1 === undefined || cp2 === undefined) continue;

      const b0x = cp2[1].x;
      const b0y = cp2[1].y;
      const b1x = cp1[1].x;
      const b1y = cp1[1].y;
      const b2x = cp0[1].x;
      const b2y = cp0[1].y;

      const ax = (b0x + b1x) / 2.0;
      const ay = (b0y + b1y) / 2.0;
      const dx = (b1x + b2x) / 2.0;
      const dy = (b1y + b2y) / 2.0;

      const bx = ax + off * (b1x - ax);
      const by = ay + off * (b1y - ay);
      const cx = dx + off * (b1x - dx);
      const cy = dy + off * (b1y - dy);

      path.curveTo(bx, by, cx, cy, dx, dy);
    }
    path.closePath();

    g2d.setColor(new Color(0, 127, 0));
    g2d.fill(path);

    const stroke = new BasicStroke(0.5, CAP_BUTT, JOIN_MITER);
    g2d.setStroke(stroke as unknown as Stroke);

    g2d.setColor(new Color(0, 0, 0));
    g2d.draw(path);
  }

  // --------------------------------------------------------------------------

  /**
   * Fills cells with alternating colours and draws cell number labels.
   *
   * @java SnakesAndLaddersDesign#fillCells(Bridge, Graphics2D, Context)
   */
  protected fillCells(_bridge: unknown, g2d: Graphics2D, _context: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const cells = this.topology().cells() as Array<{
      index(): number;
      col(): number;
      row(): number;
      vertices(): Array<{ centroid(): { getX(): number; getY(): number } }>;
    }>;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const fontSize = Math.trunc(0.85 * (this.boardStyle.cellRadius() as number) * (this.boardStyle.placement().width as number) + 0.5);
    const font = new Font('Arial', PLAIN, fontSize);
    g2d.setFont(font);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    g2d.setStroke(this.strokeThin as Stroke);

    for (const cell of cells) {
      const path = new GeneralPath();
      const verts = cell.vertices();
      for (let v = 0; v < verts.length; v++) {
        if (path.getCurrentPoint() === null) {
          const prev = verts[verts.length - 1];
          if (prev === undefined) continue;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const prevPosn: Point = this.boardStyle.screenPosn(prev.centroid()) as Point;
          path.moveTo(prevPosn.x, prevPosn.y);
        }
        const corner = verts[v];
        if (corner === undefined) continue;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const cornerPosn: Point = this.boardStyle.screenPosn(corner.centroid()) as Point;
        path.lineTo(cornerPosn.x, cornerPosn.y);
      }

      if ((cell.col() + cell.row()) % 2 === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        g2d.setColor(this.colorFillPhase1 as Color);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        g2d.setColor(this.colorFillPhase0 as Color);
      }

      g2d.fill(path);
    }

    // Draw cell coordinates
    g2d.setColor(Color.WHITE);
    for (const cell of cells) {
      const cellNumber =
        cell.row() % 2 === 0
          ? String(cell.index() + 1)
          : String(cell.row() * 10 + 10 - cell.col());

      const fm = g2d.getFontMetrics();
      const bW = fm.stringWidth(cellNumber);
      const bH = fm.getHeight();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const pt: Point = this.boardStyle.screenPosn(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (cell as unknown as { centroid(): unknown }).centroid(),
      ) as Point;
      g2d.drawString(
        cellNumber,
        pt.x - Math.trunc(0.5 * bW),
        pt.y + Math.trunc(0.3 * bH),
      );
    }
  }

  // --------------------------------------------------------------------------
}
