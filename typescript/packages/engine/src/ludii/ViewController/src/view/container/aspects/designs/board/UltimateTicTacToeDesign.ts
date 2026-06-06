// @java ViewController/src/view/container/aspects/designs/board/UltimateTicTacToeDesign.java

/**
 * Board design for Ultimate Tic-Tac-Toe.
 *
 * @java view.container.aspects.designs.board.UltimateTicTacToeDesign
 */

import { Color, type Stroke } from '../../../../../../../../ludii/awt/index.js';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected strokeThin: any = null;
  protected setStrokesAndColours(..._args: unknown[]): void { /* shim */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected topology(): any { return null; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected strokeThick(): any { return null; }
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/**
 * Board design for Ultimate Tic-Tac-Toe.
 *
 * @java view.container.aspects.designs.board.UltimateTicTacToeDesign
 */
export class UltimateTicTacToeDesign extends BoardDesignBase {

  /**
   * @java UltimateTicTacToeDesign(BoardStyle, BoardPlacement)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardStyle: any, boardPlacement: any) {
    super(boardStyle, boardPlacement);
  }

  // --------------------------------------------------------------------------

  /**
   * @java UltimateTicTacToeDesign#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues() as SVGGraphics2D;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const swThin = Math.max(1, 0.005 * (this.boardStyle.placement().width as number) + 0.5);
    const swThick = 2 * swThin;

    this.setStrokesAndColours(
      bridge,
      context,
      new Color(50, 150, 255),
      null,
      new Color(180, 230, 255),
      new Color(0, 175, 0),
      new Color(230, 50, 20),
      new Color(0, 100, 200),
      null,
      null,
      null,
      swThin,
      swThick,
    );
    this.drawBoard(g2d as unknown as Graphics2D);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
  }

  // --------------------------------------------------------------------------

  /**
   * Draws the board design.
   *
   * @java UltimateTicTacToeDesign#drawBoard(Graphics2D)
   */
  protected drawBoard(g2d: Graphics2D): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const allCells = this.topology().cells() as Array<{ centroid(): { getX(): number; getY(): number } }>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const containerCells = (this.boardStyle.container() as { topology(): { cells(): unknown[] } }).topology().cells() as Array<{ centroid(): { getX(): number; getY(): number } }>;

    const dots = Math.trunc(0.9 * containerCells.length);
    const dim  = Math.trunc(Math.sqrt(dots));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptMid: Point = this.boardStyle.screenPosn(allCells[Math.trunc(dots / 2)]?.centroid()) as Point;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptC0: Point = this.boardStyle.screenPosn(allCells[0]?.centroid()) as Point;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ptC1: Point = this.boardStyle.screenPosn(allCells[1]?.centroid()) as Point;
    const unit = Math.abs(ptC1.x - ptC0.x);

    // Draw faint thin lines of subgames
    g2d.setColor(new Color(200, 220, 255));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    g2d.setStroke(this.strokeThin as Stroke);

    const x0 = ptMid.x - 5 * unit + Math.trunc(unit / 2);
    const y0 = ptMid.y - 5 * unit + Math.trunc(unit / 2);

    let ax: number, ay: number, bx: number, by: number;
    const off = 0.15;

    for (let n = 1; n < dim; n++) {
      ax = x0 + unit * n;
      ay = y0 + (unit * 0);
      bx = ax;
      by = y0 + Math.trunc(unit * (3 - off));
      g2d.drawLine(ax, ay, bx, by);

      ax = x0 + unit * n;
      ay = y0 + Math.trunc(unit * (3 + off));
      bx = ax;
      by = y0 + Math.trunc(unit * (6 - off));
      g2d.drawLine(ax, ay, bx, by);

      ax = x0 + unit * n;
      ay = y0 + Math.trunc(unit * (6 + off));
      bx = ax;
      by = y0 + (unit * dim);
      g2d.drawLine(ax, ay, bx, by);

      ax = x0 + (unit * 0);
      ay = y0 + unit * n;
      bx = x0 + Math.trunc(unit * (3 - off));
      by = ay;
      g2d.drawLine(ax, ay, bx, by);

      ax = x0 + Math.trunc(unit * (3 + off));
      ay = y0 + unit * n;
      bx = x0 + Math.trunc(unit * (6 - off));
      by = ay;
      g2d.drawLine(ax, ay, bx, by);

      ax = x0 + Math.trunc(unit * (6 + off));
      ay = y0 + unit * n;
      bx = x0 + (unit * dim);
      by = ay;
      g2d.drawLine(ax, ay, bx, by);
    }

    // Draw thick lines for supergame
    g2d.setColor(new Color(20, 100, 200));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    g2d.setStroke(this.strokeThick() as Stroke);

    for (let n = 3; n < dim; n += 3) {
      ax = x0 + n * unit;
      ay = y0 + 0 * unit;
      bx = x0 + n * unit;
      by = y0 + dim * unit;
      g2d.drawLine(ax, ay, bx, by);

      ax = x0 + 0 * unit;
      ay = y0 + n * unit;
      bx = x0 + dim * unit;
      by = y0 + n * unit;
      g2d.drawLine(ax, ay, bx, by);
    }
  }

  // --------------------------------------------------------------------------
}
