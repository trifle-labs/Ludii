// @java ViewController/src/view/container/aspects/designs/board/Connect4Design.java

/**
 * Board design for Connect Four.
 *
 * @java view.container.aspects.designs.board.Connect4Design
 */

import { Color } from '../../../../../../../../ludii/awt/index.js';
import type { SVGGraphics2D } from '../../../../../../../../ludii/awt/index.js';
import type { Graphics2D } from '../../../../../../../../ludii/awt/index.js';
import type { Bridge } from '../../../../../bridge/Bridge.js';
import type { Context } from '../../../../../../../../ludemes/other/context/Context.js';

// ---------------------------------------------------------------------------
// Escape hatch for BoardDesign (batch 26), Connect4Style (batch 23) not
// yet ported.
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
  public ignorePieceSelectionLimit(): boolean { return false; }
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/**
 * Board design for Connect Four.
 *
 * @java view.container.aspects.designs.board.Connect4Design
 */
export class Connect4Design extends BoardDesignBase {

  /** @java Connect4Design.Connect4Rows */
  private static readonly Connect4Rows = 6;

  /** @java Connect4Design.connect4Style */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly connect4Style: any;

  // --------------------------------------------------------------------------

  /**
   * @java Connect4Design(Connect4Style, BoardPlacement)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardStyle: any, boardPlacement: any) {
    super(boardStyle, boardPlacement);
    this.connect4Style = boardStyle;
  }

  // --------------------------------------------------------------------------

  /**
   * @java Connect4Design#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // Board image
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues() as SVGGraphics2D;

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
    this.drawConnect4Board(g2d as unknown as Graphics2D);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    (this.topology().vertices() as unknown[]).length = 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    (this.topology().edges() as unknown[]).length = 0;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
  }

  // --------------------------------------------------------------------------

  /**
   * Draws the connect-4 board design.
   *
   * @java Connect4Design#drawConnect4Board(Graphics2D)
   */
  drawConnect4Board(g2d: Graphics2D): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const cols = (this.topology().columns('Cell') as unknown[]).length;
    const rows = Connect4Design.Connect4Rows;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const u = Math.trunc((this.boardStyle.placement().width as number) / (cols + 1));
    const r = Math.trunc(0.425 * u + 0.5);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const x0 = Math.trunc((this.boardStyle.placement().width as number) / 2 - 0.5 * cols * u + 0.5);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const y0 = Math.trunc((this.boardStyle.placement().width as number) / 2 - 0.5 * rows * u + 0.5);

    const expand = Math.trunc(0.1 * u);

    g2d.setColor(new Color(0, 100, 200));

    const corner = Math.trunc(u / 4);
    g2d.fillRoundRect(x0 - expand, y0 - expand, cols * u + 2 * expand, rows * u + 2 * expand, corner, corner);

    // Draw the holes
    g2d.setColor(Color.WHITE);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = x0 + col * u + Math.trunc(u / 2);
        const cy = y0 + row * u + Math.trunc(u / 2);
        g2d.fillArc(cx - r, cy - r, 2 * r, 2 * r, 0, 360);
      }
    }
  }

  // --------------------------------------------------------------------------

  /**
   * @java Connect4Design#ignorePieceSelectionLimit()
   */
  ignorePieceSelectionLimit(): boolean {
    return true;
  }

  /**
   * @java Connect4Design#getConnect4Style()
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getConnect4Style(): any {
    return this.connect4Style;
  }

  // --------------------------------------------------------------------------
}
