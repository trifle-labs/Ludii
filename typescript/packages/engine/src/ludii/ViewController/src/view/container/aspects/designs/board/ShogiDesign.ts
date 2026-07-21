// @java ViewController/src/view/container/aspects/designs/board/ShogiDesign.java

/**
 * Board design for Shogi-style boards.
 *
 * @author cambolbro (Java original)
 * @java view.container.aspects.designs.board.ShogiDesign
 */

import { Color } from '../../../../../../../../ludii/awt/index.js';
import type { SVGGraphics2D } from '../../../../../../../../ludii/awt/index.js';
import type { Bridge } from '../../../../../bridge/Bridge.js';
import type { Context } from '../../../../../../../../ludemes/other/context/Context.js';
import { MetadataImageInfo } from '../../../../../../../../ludemes/metadata/graphics/util/MetadataImageInfo.js';

// ---------------------------------------------------------------------------
// Escape hatch for BoardDesign (batch 26) and related deps not yet ported.
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
  protected symbols: MetadataImageInfo[] = [];
  protected setStrokesAndColours(..._args: unknown[]): void { /* shim */ }
  protected fillCells(_bridge: unknown, _g2d: unknown, _context: unknown): void { /* shim */ }
  protected drawInnerCellEdges(_g2d: unknown, _context: unknown): void { /* shim */ }
  protected drawOuterCellEdges(_bridge: unknown, _g2d: unknown, _context: unknown): void { /* shim */ }
  protected drawSymbols(_g2d: unknown, _context: unknown): void { /* shim */ }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected topology(): any { return null; }
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/**
 * Board design for Shogi-style boards.
 *
 * @java view.container.aspects.designs.board.ShogiDesign
 */
export class ShogiDesign extends BoardDesignBase {

  /**
   * @java ShogiDesign(BoardStyle, BoardPlacement)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardStyle: any, boardPlacement: any) {
    super(boardStyle, boardPlacement);
  }

  // --------------------------------------------------------------------------

  /**
   * @java ShogiDesign#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues() as SVGGraphics2D;

    const swRatio = 4 / 1000.0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const swThin = Math.max(1, Math.trunc((swRatio * 100) / this.topology().vertices().length * this.boardStyle.placement().width + 0.5));
    const swThick = swThin;

    this.setStrokesAndColours(
      bridge,
      context,
      new Color(100, 75, 50),
      new Color(100, 75, 50),
      new Color(255, 230, 130),
      null,
      null,
      null,
      null,
      null,
      new Color(0, 0, 0),
      swThin,
      swThick,
    );

    this.fillCells(bridge, g2d, context);
    this.drawInnerCellEdges(g2d, context);

    // Load the decoration for special cells
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const boardCellsWidth: number = (this.topology().columns((context as unknown as { board(): { defaultSite(): unknown } }).board().defaultSite()) as unknown[]).length + 1;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const boardCellsHeight: number = (this.topology().rows((context as unknown as { board(): { defaultSite(): unknown } }).board().defaultSite()) as unknown[]).length + 1;

    let dotInwardsValueVertical: number = Math.trunc(boardCellsWidth / 3);
    let dotInwardsValueHorizontal: number = dotInwardsValueVertical;

    // Taikyoku Shogi
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if ((this.topology().cells() as unknown[]).length === 1296) {
      dotInwardsValueVertical = 6;
      dotInwardsValueHorizontal = 7;
    }

    const symbolLocations: number[] = [];
    symbolLocations.push(boardCellsWidth * dotInwardsValueVertical + dotInwardsValueHorizontal);
    symbolLocations.push(boardCellsWidth * dotInwardsValueVertical + boardCellsWidth - dotInwardsValueHorizontal - 1);
    symbolLocations.push(boardCellsWidth * (boardCellsHeight - dotInwardsValueVertical - 1) + dotInwardsValueHorizontal);
    symbolLocations.push(boardCellsWidth * (boardCellsHeight - dotInwardsValueVertical - 1) + boardCellsWidth - dotInwardsValueHorizontal - 1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if ((this.topology() as unknown as { numEdges(): number }).numEdges() === 4) {
      for (const i of symbolLocations) {
        this.symbols.push(MetadataImageInfo.forSitePath(i, 'Vertex', 'dot', 0.2));
      }
    }

    this.drawSymbols(g2d, context);
    this.drawOuterCellEdges(bridge, g2d, context);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
  }

  // --------------------------------------------------------------------------
}
