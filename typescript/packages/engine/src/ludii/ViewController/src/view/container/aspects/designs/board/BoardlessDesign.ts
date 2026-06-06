// @java ViewController/src/view/container/aspects/designs/board/BoardlessDesign.java

/**
 * Board design for boardless (dynamic) boards.
 *
 * @java view.container.aspects.designs.board.BoardlessDesign
 */

import type { Bridge } from '../../../../../bridge/Bridge.js';
import type { Context } from '../../../../../../../../ludemes/other/context/Context.js';

// ---------------------------------------------------------------------------
// Escape hatch for BoardDesign (batch 26), BoardlessStyle (batch 23) and
// BoardlessPlacement (batch 27) not yet ported.
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
  public createSVGImage(_bridge: unknown, _context: unknown): string { return ''; }
};

// ---------------------------------------------------------------------------

/**
 * Board design for boardless (dynamic) boards.
 *
 * @java view.container.aspects.designs.board.BoardlessDesign
 */
export class BoardlessDesign extends BoardDesignBase {

  /** @java BoardlessDesign.boardlessStyle */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly boardlessStyle: any;

  /** @java BoardlessDesign.boardlessPlacement */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly boardlessPlacement: any;

  // --------------------------------------------------------------------------

  /**
   * @java BoardlessDesign(BoardlessStyle, BoardlessPlacement)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(boardlessStyle: any, boardlessPlacement: any) {
    super(boardlessStyle, boardlessPlacement);
    this.boardlessStyle = boardlessStyle;
    this.boardlessPlacement = boardlessPlacement;
  }

  // --------------------------------------------------------------------------

  /**
   * @java BoardlessDesign#createSVGImage(Bridge, Context)
   */
  createSVGImage(bridge: Bridge, context: Context): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.boardlessPlacement as { updateZoomImage(c: Context): void })
      .updateZoomImage(context);

    // Board image — no drawing for boardless, just set colours
    this.setStrokesAndColours(
      bridge,
      context,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      1,
      1,
    );
    return '';
  }

  // --------------------------------------------------------------------------

  /**
   * @java BoardlessDesign#getBoardlessStyle()
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getBoardlessStyle(): any {
    return this.boardlessStyle;
  }

  // --------------------------------------------------------------------------
}
