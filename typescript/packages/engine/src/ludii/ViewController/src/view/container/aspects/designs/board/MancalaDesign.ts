// @java ViewController/src/view/container/aspects/designs/board/MancalaDesign.java

/**
 * Graphics for Mancala boards.
 *
 * @author cambolbro and Eric.Piette (Java original)
 * @java view.container.aspects.designs.board.MancalaDesign
 */

import {
  Color,
  Ellipse2D,
  GeneralPath,
  Arc2D,
  RoundRectangle2D,
  type Stroke,
} from '../../../../../../../../ludii/awt/index.js';
import { Point } from '../../../../../../../../ludii/awt/index.js';
import type { SVGGraphics2D } from '../../../../../../../../ludii/awt/index.js';
import type { Graphics2D } from '../../../../../../../../ludii/awt/index.js';
import { Rectangle2D } from '../../../../../../../../ludii/awt/index.js';
import type { Bridge } from '../../../../../bridge/Bridge.js';
import type { Context } from '../../../../../../../../ludemes/other/context/Context.js';
import { MancalaBoard } from '../../../../../../../../ludemes/game/equipment/container/board/custom/MancalaBoard.js';
import type { HoleType } from '../../../../../../../../ludemes/metadata/graphics/util/HoleType.js';
import { Concept } from '../../../../../../../../ludemes/other/concept/Concept.js';

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
  protected strokeThin: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected _strokeThick: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected colorFillPhase0: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected colorEdgesOuter: any = null;
  protected setStrokesAndColours(..._args: unknown[]): void { /* shim */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected topology(): any { return null; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected screenPosn(_pt: unknown): any { return null; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public strokeThick(): any { return this._strokeThick; }
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/** Inline java.awt.Color.RGBtoHSB — converts r,g,b to [h, s, b]. */
function rgbToHsb(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b) / 255.0;
  const min = Math.min(r, g, b) / 255.0;
  const brightness = max;
  const saturation = max === 0 ? 0 : (max - min) / max;
  let hue = 0;
  if (saturation !== 0) {
    const rc = (max - r / 255.0) / (max - min);
    const gc = (max - g / 255.0) / (max - min);
    const bc = (max - b / 255.0) / (max - min);
    if (r / 255.0 === max) hue = bc - gc;
    else if (g / 255.0 === max) hue = 2.0 + rc - bc;
    else hue = 4.0 + gc - rc;
    hue = hue / 6.0;
    if (hue < 0) hue += 1.0;
  }
  return [hue, saturation, brightness];
}

/** Inline java.awt.Color.HSBtoRGB — converts h,s,b to packed ARGB int. */
function hsbToRgbColor(h: number, s: number, b: number): Color {
  if (s === 0) {
    const v = Math.round(b * 255);
    return new Color(v, v, v);
  }
  const hh = (h - Math.floor(h)) * 6.0;
  const f = hh - Math.floor(hh);
  const p = Math.round(b * (1.0 - s) * 255);
  const q = Math.round(b * (1.0 - s * f) * 255);
  const t = Math.round(b * (1.0 - (s * (1.0 - f))) * 255);
  const bv = Math.round(b * 255);
  const hi = Math.floor(hh) % 6;
  switch (hi) {
    case 0: return new Color(bv, t, p);
    case 1: return new Color(q, bv, p);
    case 2: return new Color(p, bv, t);
    case 3: return new Color(p, q, bv);
    case 4: return new Color(t, p, bv);
    default: return new Color(bv, p, q);
  }
}

// ---------------------------------------------------------------------------

/**
 * Graphics for Mancala boards.
 *
 * @java view.container.aspects.designs.board.MancalaDesign
 */
export class MancalaDesign extends BoardDesignBase {

  /**
   * @java MancalaDesign(BoardStyle)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardStyle: any) {
    super(boardStyle, null);
  }

  // --------------------------------------------------------------------------

  /**
   * @java MancalaDesign#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues() as SVGGraphics2D;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const swThin = Math.max(1, Math.trunc(0.001 * (this.boardStyle.placement().width as number) + 0.5));
    const swThick = 2 * swThin;

    this.setStrokesAndColours(
      bridge,
      context,
      null,
      new Color(125, 75, 0),
      new Color(255, 220, 100),
      null,
      null,
      null,
      null,
      null,
      new Color(127, 100, 50),
      swThin,
      swThick,
    );

    const ctx = context as unknown as {
      board(): {
        graph(): { bounds(): Rectangle2D };
        defaultSite(): unknown;
      };
      metadata(): {
        graphics(): {
          sitesAsSpecialHoles(): number[];
          shapeSpecialHole(): HoleType;
        };
      };
      game(): {
        booleanConcepts(): { get(id: number): boolean };
      };
    };

    const bounds: Rectangle2D = ctx.board().graph().bounds();
    const boardObj = ctx.board();
    const isMancala = boardObj instanceof MancalaBoard;

    const numColumns: number = isMancala
      ? (boardObj as MancalaBoard).getNumColumns()
      : Math.trunc(bounds.getWidth() - 0.5);
    const numRows: number = isMancala
      ? (boardObj as MancalaBoard).getNumRows()
      : Math.trunc(bounds.getHeight() + 0.5) + 1;

    const withStore: boolean = isMancala
      ? (boardObj as MancalaBoard).getStoreType() !== 'None'
      : true;

    const specialHolesArr: number[] = ctx.metadata().graphics().sitesAsSpecialHoles();
    const type: HoleType = ctx.metadata().graphics().shapeSpecialHole();

    const circleTiling: boolean = ctx.game().booleanConcepts().get(Concept.CircleTiling);
    const notMancalaBoard: boolean = !circleTiling && !isMancala;

    this.drawMancalaBoard(
      g2d as unknown as Graphics2D,
      numRows, numColumns, withStore, circleTiling,
      specialHolesArr, type, notMancalaBoard,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
  }

  // --------------------------------------------------------------------------

  /**
   * Draw the Mancala board.
   *
   * @java MancalaDesign#drawMancalaBoard(Graphics2D, int, int, boolean, boolean,
   *       TIntArrayList, HoleType, boolean)
   */
  drawMancalaBoard(
    g2d: Graphics2D,
    rows: number,
    cols: number,
    withStore: boolean,
    circleTiling: boolean,
    specialHoles: number[],
    type: HoleType,
    notMancalaBoard: boolean,
  ): void {
    const indexHoleBL = withStore ? 1 : 0;
    const indexHoleTR = withStore ? rows * cols : rows * cols - 1;
    const indexHoleBR = withStore ? cols : cols - 1;
    const indexHoleTL = indexHoleBR + 1 + (rows - 2) * cols;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const vertices = this.topology().vertices() as Array<{ centroid(): { getX(): number; getY(): number } }>;

    // Distance between pits in x direction
    const v0 = vertices[circleTiling ? 0 : indexHoleBL];
    const v1 = vertices[circleTiling ? 1 : (indexHoleBL + 1)];
    if (v0 === undefined || v1 === undefined) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt1: Point = this.boardStyle.screenPosn(v0.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt2: Point = this.boardStyle.screenPosn(v1.centroid()) as Point;
    const dx = Math.abs(pt2.x - pt1.x);

    const radius = 0.666 * dx; // radius of rounded board ends
    let pt: Point | null = null;

    if (circleTiling) {
      // Compute the centre of the board
      let sumX = 0.0;
      let sumY = 0.0;
      let circleDx = 0.0;
      let circleDy = 0.0;

      for (const v of vertices) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const sp: Point = this.boardStyle.screenPosn(v.centroid()) as Point;
        sumX += sp.getX();
        sumY += sp.getY();

        for (const v2 of vertices) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const sp2: Point = this.boardStyle.screenPosn(v2.centroid()) as Point;
          const currentDx = Math.abs(sp.getX() - sp2.getX());
          const currentDy = Math.abs(sp.getY() - sp2.getY());
          if (currentDx > circleDx) circleDx = currentDx;
          if (currentDy > circleDy) circleDy = currentDy;
        }
      }

      const centreX = sumX / vertices.length;
      const centreY = sumY / vertices.length;
      circleDx = circleDx / 2 + radius;
      circleDy = circleDy / 2 + radius;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setColor(this.colorFillPhase0 as Color);
      const circleShape = new Ellipse2D.Double(
        centreX - circleDx, centreY - circleDy,
        2.0 * circleDx, 2.0 * circleDy,
      );
      g2d.fill(circleShape);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setColor(this.colorEdgesOuter as Color);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setStroke(this.strokeThick() as Stroke);
      g2d.draw(circleShape);

    } else if (notMancalaBoard) {
      let maxDx = 0.0;
      let maxDy = 0.0;
      let topY = (this.boardStyle.screenPosn(vertices[0]?.centroid()) as Point).getY();
      let leftX = (this.boardStyle.screenPosn(vertices[0]?.centroid()) as Point).getX();

      for (const v of vertices) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const screenPosnV: Point = this.boardStyle.screenPosn(v.centroid()) as Point;
        if (topY > screenPosnV.getY()) topY = screenPosnV.getY();
        if (leftX > screenPosnV.getX()) leftX = screenPosnV.getX();

        for (const v2 of vertices) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const screenPosnV2: Point = this.boardStyle.screenPosn(v2.centroid()) as Point;
          const dY = Math.abs(screenPosnV.getY() - screenPosnV2.getY());
          if (maxDy < dY) maxDy = dY;
          const dX = Math.abs(screenPosnV.getX() - screenPosnV2.getX());
          if (maxDx < dX) maxDx = dX;
        }
      }

      const angle = 60;
      maxDx += dx;
      maxDy += dx;
      leftX -= dx / 2;
      topY -= dx / 2;

      const shape = new RoundRectangle2D.Double(leftX, topY, maxDx, maxDy, angle, angle);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setColor(this.colorFillPhase0 as Color);
      g2d.fill(shape);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setColor(this.colorEdgesOuter as Color);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setStroke(this.strokeThick() as Stroke);
      g2d.draw(shape);

    } else if (withStore) {
      const ptBL = vertices[indexHoleBL]?.centroid();
      const ptTR = vertices[indexHoleTR]?.centroid();
      const ptBR = vertices[indexHoleBR]?.centroid();
      const ptTL = vertices[indexHoleTL]?.centroid();
      const ptL = vertices[0]?.centroid();
      const ptRVert = withStore ? vertices[rows * cols + 1]?.centroid() : vertices[0]?.centroid();

      if (!ptBL || !ptTR || !ptBR || !ptTL || !ptL || !ptRVert) return;

      const angleForStorage = Math.trunc(120 / rows);
      const angleForCorners = rows * 15;

      const boardShape = new GeneralPath();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      pt = this.boardStyle.screenPosn(withStore ? ptL : ptBL) as Point;
      boardShape.append(new Arc2D.Double(pt.x - radius, pt.y - radius, 2 * radius, 2 * radius,
        180 - angleForStorage, 2 * angleForStorage, Arc2D.OPEN), true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      pt = this.boardStyle.screenPosn(ptBL) as Point;
      boardShape.append(new Arc2D.Double(pt.x - radius, pt.y - radius, 2 * radius, 2 * radius,
        270 - angleForCorners, angleForCorners, Arc2D.OPEN), true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      pt = this.boardStyle.screenPosn(ptBR) as Point;
      boardShape.append(new Arc2D.Double(pt.x - radius, pt.y - radius, 2 * radius, 2 * radius,
        270, angleForCorners, Arc2D.OPEN), true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      pt = this.boardStyle.screenPosn(ptRVert) as Point;
      boardShape.append(new Arc2D.Double(pt.x - radius, pt.y - radius, 2 * radius, 2 * radius,
        360 - angleForStorage, 2 * angleForStorage, Arc2D.OPEN), true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      pt = this.boardStyle.screenPosn(ptTR) as Point;
      boardShape.append(new Arc2D.Double(pt.x - radius, pt.y - radius, 2 * radius, 2 * radius,
        90 - angleForCorners, angleForCorners, Arc2D.OPEN), true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      pt = this.boardStyle.screenPosn(ptTL) as Point;
      boardShape.append(new Arc2D.Double(pt.x - radius, pt.y - radius, 2 * radius, 2 * radius,
        90, angleForCorners, Arc2D.OPEN), true);

      boardShape.closePath();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setColor(this.colorFillPhase0 as Color);
      g2d.fill(boardShape);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setColor(this.colorEdgesOuter as Color);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setStroke(this.strokeThick() as Stroke);
      g2d.draw(boardShape);

    } else {
      const ptBL = vertices[indexHoleBL]?.centroid();
      const ptTR = vertices[indexHoleTR]?.centroid();
      const ptBR = vertices[indexHoleBR]?.centroid();
      const ptTL = vertices[indexHoleTL]?.centroid();
      if (!ptBL || !ptTR || !ptBR || !ptTL) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const ptTLScreen: Point = this.boardStyle.screenPosn(ptTL) as Point;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const ptBRScreen: Point = this.boardStyle.screenPosn(ptBR) as Point;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const ptBLScreen: Point = this.boardStyle.screenPosn(ptBL) as Point;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const ptTRScreen: Point = this.boardStyle.screenPosn(ptTR) as Point;

      const width2 = ptBRScreen.x - ptBLScreen.x + 2 * radius;
      const height2 = ptBRScreen.y - ptTRScreen.y + 2 * radius;

      const angle2 = rows < 30 ? rows * 15 : rows * 10;
      const shape2 = new RoundRectangle2D.Double(
        ptTLScreen.x - radius, ptTLScreen.y - radius, width2, height2, angle2, angle2,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setColor(this.colorFillPhase0 as Color);
      g2d.fill(shape2);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setColor(this.colorEdgesOuter as Color);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      g2d.setStroke(this.strokeThick() as Stroke);
      g2d.draw(shape2);
    }

    // Determine pit colours based on board colour
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const fillR = (this.colorFillPhase0 as Color).getRed();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const fillG = (this.colorFillPhase0 as Color).getGreen();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const fillB = (this.colorFillPhase0 as Color).getBlue();

    const hsv = rgbToHsb(fillR, fillG, fillB);

    const dark   = hsbToRgbColor(hsv[0], hsv[1], 0.75 * hsv[2]);
    const darker = hsbToRgbColor(hsv[0], hsv[1], 0.5 * hsv[2]);

    // Draw pits
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    g2d.setStroke(this.strokeThin as Stroke);
    const r = Math.trunc(0.45 * dx); // pit radius

    for (const vertex of vertices) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const ptVert: Point = this.boardStyle.screenPosn(vertex.centroid()) as Point;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const vIdx: number = (vertex as unknown as { index(): number }).index();
      if (specialHoles.includes(vIdx)) {
        if (type === 'Square') {
          this.drawSquare(g2d, ptVert.x, ptVert.y, r, null, dark, darker);
        } else if (type === 'Oval') {
          this.drawOval(g2d, ptVert.x, ptVert.y, r, null, dark, darker);
        }
      } else {
        this.drawPit(g2d, ptVert.x, ptVert.y, r, null, dark, darker);
      }
    }
  }

  // --------------------------------------------------------------------------

  /**
   * Draws a board pit at the specified location.
   *
   * @java MancalaDesign#drawPit(Graphics2D, int, int, int, Color, Color, Color)
   */
  drawPit(
    g2d: Graphics2D,
    x: number, y: number, r: number,
    lines: Color | null, dark: Color, darker: Color,
  ): void {
    const rr = Math.trunc(0.85 * r);

    g2d.setColor(darker);
    g2d.fillArc(x - r, y - r, 2 * r, 2 * r, 0, 360);

    g2d.setColor(dark);
    g2d.fillArc(x - r, y - r, 2 * r, 2 * r, 180, 180);
    g2d.fillArc(x - r, y - rr, 2 * r, 2 * rr, 0, 360);

    if (lines !== null) {
      g2d.setColor(lines);
      g2d.drawArc(x - r, y - r, 2 * r, 2 * r, 0, 360);
    }
  }

  /**
   * Draws a square pit at the specified location.
   *
   * @java MancalaDesign#drawSquare(Graphics2D, int, int, int, Color, Color, Color)
   */
  drawSquare(
    g2d: Graphics2D,
    x: number, y: number, r: number,
    _lines: Color | null, dark: Color, darker: Color,
  ): void {
    const rr = Math.trunc(0.95 * r);

    g2d.setColor(darker);
    g2d.fillRect(x - r, y - r, r * 2, r * 2);
    g2d.setColor(dark);
    g2d.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }

  /**
   * Draws an oval pit at the specified location.
   *
   * @java MancalaDesign#drawOval(Graphics2D, int, int, int, Color, Color, Color)
   */
  drawOval(
    g2d: Graphics2D,
    x: number, y: number, r: number,
    lines: Color | null, dark: Color, darker: Color,
  ): void {
    const rr = Math.trunc(0.85 * r);

    g2d.setColor(darker);
    g2d.fillArc(x - 3 * r, y - r, 6 * r, 2 * r, 0, 360);

    g2d.setColor(dark);
    g2d.fillArc(x - r * 3, y - r, 6 * r, 2 * r, 180, 180);
    g2d.fillArc(x - r * 3, y - rr, 6 * r, 2 * rr, 0, 360);

    if (lines !== null) {
      g2d.setColor(lines);
      g2d.drawArc(x - r * 3, y - r, 6 * r, 2 * r, 0, 360);
    }
  }

  // --------------------------------------------------------------------------
}
