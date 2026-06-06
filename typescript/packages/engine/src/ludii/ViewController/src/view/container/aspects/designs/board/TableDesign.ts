// @java ViewController/src/view/container/aspects/designs/board/TableDesign.java

/**
 * Design for Table board (Backgammon-family).
 *
 * @author Eric.Piette (Java original)
 * @java view.container.aspects.designs.board.TableDesign
 */

import {
  Color,
  Ellipse2D,
  type Stroke,
} from '../../../../../../../../ludii/awt/index.js';
import { Point } from '../../../../../../../../ludii/awt/index.js';
import type { SVGGraphics2D } from '../../../../../../../../ludii/awt/index.js';
import type { Graphics2D } from '../../../../../../../../ludii/awt/index.js';
import type { Bridge } from '../../../../../bridge/Bridge.js';
import type { Context } from '../../../../../../../../ludemes/other/context/Context.js';

// ---------------------------------------------------------------------------
// Escape hatch for BoardDesign (batch 26), TableStyle (batch 23), and
// TablePlacement (batch 27) not yet ported.
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected screenPosn(_pt: unknown): any { return null; }
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/**
 * Design for Table board.
 *
 * @java view.container.aspects.designs.board.TableDesign
 */
export class TableDesign extends BoardDesignBase {

  /** @java TableDesign.tableStyle */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly tableStyle: any;

  /** @java TableDesign.tablePlacement */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly tablePlacement: any;

  // --------------------------------------------------------------------------

  /**
   * @java TableDesign(TableStyle, TablePlacement)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardStyle: any, boardPlacement: any) {
    super(boardStyle, boardPlacement);
    this.tableStyle = boardStyle;
    this.tablePlacement = boardPlacement;
  }

  // --------------------------------------------------------------------------

  /** @java TableDesign.boardColours */
  private readonly boardColours: Color[] = [
    new Color(153, 76, 0),    // base
    new Color(223, 178, 110), // frame
  ];

  // --------------------------------------------------------------------------

  /**
   * @java TableDesign#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.tablePlacement as { customiseGraphElementLocations(c: Context): void })
      .customiseGraphElementLocations(context);

    // Board image
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const g2d: SVGGraphics2D = (this.boardStyle as { setSVGRenderingValues(): SVGGraphics2D })
      .setSVGRenderingValues();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const baseThickness = Math.max(1, Math.trunc(0.0025 * (this.boardStyle.placement().width as number) + 0.5));
    this.setStrokesAndColours(
      bridge,
      context,
      new Color(120, 190, 240),
      new Color(125, 75, 0),
      new Color(210, 230, 255),
      null,
      null,
      null,
      null,
      null,
      new Color(0, 0, 0),
      baseThickness,
      Math.trunc(2.0 * baseThickness),
    );
    this.drawTableBoard(g2d as unknown as Graphics2D);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
  }

  // --------------------------------------------------------------------------

  /**
   * Draws the board design.
   *
   * @java TableDesign#drawTableBoard(Graphics2D)
   */
  drawTableBoard(g2d: Graphics2D): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const vertices = this.topology().vertices() as Array<{ centroid(): { getX(): number; getY(): number } }>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt0: Point = this.boardStyle.screenPosn(vertices[0]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const pt1: Point = this.boardStyle.screenPosn(vertices[1]?.centroid()) as Point;
    const off = pt1.x - pt0.x;
    const unit = off;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const homeSize: number = (this.tablePlacement as { homeSize(): number }).homeSize();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptBottomLeftRight: Point = this.boardStyle.screenPosn(vertices[homeSize - 1]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptBottomRightLeft: Point = this.boardStyle.screenPosn(vertices[homeSize]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptBottomRightRight: Point = this.boardStyle.screenPosn(vertices[homeSize * 2 - 1]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptTopLeftLeft: Point = this.boardStyle.screenPosn(vertices[homeSize * 2]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptTopRightLeft: Point = this.boardStyle.screenPosn(vertices[homeSize * 3]?.centroid()) as Point;

    const pr = Math.trunc(unit * 0.5);      // half a unit
    const borderX = Math.trunc(unit * 0.2); // border size
    const borderY = unit * 0;               // border size
    const diameterCircle = unit;            // diameter of circle for pieces
    const gapYCircle = Math.trunc(diameterCircle * 0.7); // gap y vertex and centre circle

    const topLeftLeftX = ptTopLeftLeft.x - pr;
    const topLeftLeftY = ptTopLeftLeft.y - pr;

    const topRightLeftX = ptTopRightLeft.x - pr;
    const topRightLeftY = ptTopRightLeft.y - pr;

    const bottomLeftRightX = ptBottomLeftRight.x + pr;
    const bottomLeftRightY = ptBottomLeftRight.y + pr;
    const bottomRightLeftX = ptBottomRightLeft.x + pr;

    const bottomRightRightX = ptBottomRightRight.x + pr;
    const bottomRightRightY = ptBottomRightRight.y + pr;

    const topLeftBorderX = topLeftLeftX - borderX;
    const topLeftBorderY = topLeftLeftY - borderY;

    const bottomRightBorderX = bottomRightRightX + borderX;
    const bottomRightBorderY = bottomRightRightY + borderY;

    // Draw the base of the board (rectangle)
    const boardColour1 = this.boardColours[1];
    if (boardColour1) {
      g2d.setColor(boardColour1);
    }
    g2d.fillRect(
      topLeftBorderX, topLeftBorderY,
      Math.abs(bottomRightBorderX - topLeftBorderX),
      Math.abs(bottomRightBorderY - topLeftBorderY),
    );

    // Draw middle of each side without the space for the circles
    const boardColour0 = this.boardColours[0];
    if (boardColour0) {
      g2d.setColor(boardColour0);
    }
    g2d.fillRect(
      topLeftLeftX, topLeftLeftY + gapYCircle,
      Math.abs(bottomLeftRightX - topLeftLeftX),
      Math.abs((bottomLeftRightY - gapYCircle) - (topLeftLeftY + gapYCircle)),
    );
    g2d.fillRect(
      topRightLeftX, topRightLeftY + gapYCircle,
      Math.abs(bottomRightRightX - topRightLeftX),
      Math.abs((bottomRightRightY - gapYCircle) - (topRightLeftY + gapYCircle)),
    );

    // Draw gap in the middle bar in the middle
    const bottomMiddleY = bottomLeftRightY - Math.trunc(Math.abs(topRightLeftY - bottomLeftRightY) * 0.65);
    const sizeXMiddle = Math.abs(bottomLeftRightX - bottomRightLeftX);
    const sizeYMiddle = Math.trunc(Math.abs((bottomRightRightY - topLeftLeftY) * 0.35));
    g2d.fillRect(bottomLeftRightX, bottomMiddleY, sizeXMiddle, sizeYMiddle);

    if (boardColour1) {
      g2d.setColor(boardColour1);
    }
    const offErrorMiddleCircle = 1.025;
    const topMiddleCircle = new Ellipse2D.Double(
      bottomLeftRightX,
      bottomLeftRightY - Math.trunc(Math.abs(topRightLeftY - bottomLeftRightY) * 0.7),
      diameterCircle * offErrorMiddleCircle,
      diameterCircle * offErrorMiddleCircle,
    );
    g2d.fill(topMiddleCircle);
    const bottomMiddleCircle = new Ellipse2D.Double(
      bottomLeftRightX,
      bottomLeftRightY - Math.trunc(Math.abs(topRightLeftY - bottomLeftRightY) * 0.35),
      diameterCircle * offErrorMiddleCircle,
      diameterCircle * offErrorMiddleCircle,
    );
    g2d.fill(bottomMiddleCircle);

    // Draw the circles
    if (boardColour0) {
      g2d.setColor(boardColour0);
    }
    const offErrorCircle = 0.99;
    const halfSize = Math.trunc(vertices.length / 2);
    for (let n = 0; n < halfSize; n++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const ptVertex: Point = this.boardStyle.screenPosn(vertices[n]?.centroid()) as Point;
      const circle = new Ellipse2D.Double(
        ptVertex.x - pr, ptVertex.y - gapYCircle,
        diameterCircle * offErrorCircle, diameterCircle * offErrorCircle,
      );
      g2d.fill(circle);
    }
    for (let n = halfSize; n < halfSize * 2; n++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const ptVertex: Point = this.boardStyle.screenPosn(vertices[n]?.centroid()) as Point;
      const circle = new Ellipse2D.Double(
        ptVertex.x - pr, ptVertex.y - gapYCircle / 2,
        diameterCircle * offErrorCircle, diameterCircle * offErrorCircle,
      );
      g2d.fill(circle);
    }
  }

  // --------------------------------------------------------------------------

  /**
   * @java TableDesign#getTableStyle()
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTableStyle(): any {
    return this.tableStyle;
  }

  // --------------------------------------------------------------------------
}
