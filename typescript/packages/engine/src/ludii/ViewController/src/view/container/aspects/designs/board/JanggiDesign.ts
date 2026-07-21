// @java ViewController/src/view/container/aspects/designs/board/JanggiDesign.java

/**
 * Board design for Janggi (Korean Chess).
 *
 * @java view.container.aspects.designs.board.JanggiDesign
 */

import {
  Color,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected strokeThin: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected colorEdgesInner: any = null;
  protected setStrokesAndColours(..._args: unknown[]): void { /* shim */ }
  protected drawBoardOutline(_g2d: unknown): void { /* shim */ }
  protected drawOuterCellEdges(_bridge: unknown, _g2d: unknown, _context: unknown): void { /* shim */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected topology(): any { return null; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected screenPosn(_pt: unknown): any { return null; }
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/**
 * Board design for Janggi (Korean Chess).
 *
 * @java view.container.aspects.designs.board.JanggiDesign
 */
export class JanggiDesign extends BoardDesignBase {

  /**
   * @java JanggiDesign(BoardStyle, BoardPlacement)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardStyle: any, boardPlacement: any) {
    super(boardStyle, boardPlacement);
  }

  // --------------------------------------------------------------------------

  /**
   * @java JanggiDesign#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues() as SVGGraphics2D;

    const swRatio = 5 / 1000.0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const swThin = Math.max(1, Math.trunc(swRatio * (this.boardStyle.placement().width as number) + 0.5));
    const swThick = swThin;

    this.setStrokesAndColours(
      bridge,
      context,
      new Color(100, 75, 50),
      new Color(100, 75, 50),
      new Color(255, 165, 0),
      null,
      null,
      null,
      null,
      null,
      new Color(0, 0, 0),
      swThin,
      swThick,
    );

    this.drawBoardOutline(g2d);
    this.drawInnerCellEdges(g2d as unknown as Graphics2D, context);
    this.drawOuterCellEdges(bridge, g2d, context);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
  }

  // --------------------------------------------------------------------------

  /**
   * Overrides inner cell edges to skip the river area and draw diagonal lines
   * for the palace.
   *
   * @java JanggiDesign#drawInnerCellEdges(Graphics2D, Context)
   */
  protected drawInnerCellEdges(g2d: Graphics2D, _context: Context): void {
    // Draw cell edges (inner)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    g2d.setStroke(this.strokeThin as Stroke);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    g2d.setColor(this.colorEdgesInner as Color);

    const path = new GeneralPath();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const vertices = this.topology().vertices() as Array<{
      centroid(): { getX(): number; getY(): number };
      orthogonal(): Array<{ centroid(): { getX(): number; getY(): number } }>;
    }>;

    for (const vA of vertices) {
      for (const vB of vA.orthogonal()) {
        const va = vA.centroid();
        const vb = vB.centroid();

        // only draw inner edges if not overlapping the river
        if (
          (va.getY() < 0.5 || vb.getY() > 0.5) &&
          (va.getY() > 0.5 || vb.getY() < 0.5)
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const vaWorld: Point = this.boardStyle.screenPosn(vA.centroid()) as Point;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const vbWorld: Point = this.boardStyle.screenPosn(vB.centroid()) as Point;

          path.moveTo(vaWorld.x, vaWorld.y);
          path.lineTo(vbWorld.x, vbWorld.y);
        }
      }
    }

    // Palace diagonal lines
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    let sp: Point = this.boardStyle.screenPosn(vertices[3]?.centroid()) as Point;
    path.moveTo(sp.x, sp.y);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    sp = this.boardStyle.screenPosn(vertices[23]?.centroid()) as Point;
    path.lineTo(sp.x, sp.y);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    sp = this.boardStyle.screenPosn(vertices[5]?.centroid()) as Point;
    path.moveTo(sp.x, sp.y);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    sp = this.boardStyle.screenPosn(vertices[21]?.centroid()) as Point;
    path.lineTo(sp.x, sp.y);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    sp = this.boardStyle.screenPosn(vertices[86]?.centroid()) as Point;
    path.moveTo(sp.x, sp.y);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    sp = this.boardStyle.screenPosn(vertices[66]?.centroid()) as Point;
    path.lineTo(sp.x, sp.y);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    sp = this.boardStyle.screenPosn(vertices[84]?.centroid()) as Point;
    path.moveTo(sp.x, sp.y);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    sp = this.boardStyle.screenPosn(vertices[68]?.centroid()) as Point;
    path.lineTo(sp.x, sp.y);

    g2d.draw(path);
  }

  // --------------------------------------------------------------------------
}
