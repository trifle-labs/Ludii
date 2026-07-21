// @java Player/src/app/views/tools/buttons/ButtonOther.java

import { Ellipse2D } from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ToolButton, type PlayerApp } from '../ToolButton.js';

/** @java other.move.Move */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Move = any;

// ---------------------------------------------------------------------------

/**
 * Generic button for "other" operations that don't have a dedicated button.
 *
 * @java app.views.tools.buttons.ButtonOther
 * @author Matthew.Stephenson and cambolbro
 */
export class ButtonOther extends ToolButton {

  /** @java ButtonOther#otherPossibleMoves */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private otherPossibleMoves: Move[] = [];

  // -------------------------------------------------------------------------

  /**
   * @java ButtonOther(PlayerApp app, int cx, int cy, int sx, int sy, int otherButtonIndex)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    otherButtonIndex: number,
  ) {
    super(app, 'Other', cx, cy, sx, sy, otherButtonIndex);
    this.tooltipMessage = 'Miscellaneous';
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonOther#draw(Graphics2D)
   */
  public override draw(g2d: Graphics2D): void {
    const cx = this.rect.getCenterX();
    const cy = this.rect.getCenterY();

    g2d.setColor(this.getButtonColour());

    // Scale buttons for mobile (desktop toolbar = 32 px; mobile = 64 px).
    const scale = this.scaleForDevice();

    const r = 2.75 * scale;
    g2d.fill(new Ellipse2D.Double(cx - r, cy - r - 9 * scale, 2 * r, 2 * r));
    g2d.fill(new Ellipse2D.Double(cx - r, cy - r,             2 * r, 2 * r));
    g2d.fill(new Ellipse2D.Double(cx - r, cy - r + 9 * scale, 2 * r, 2 * r));

    if (this.otherPossibleMoves.length > 0) {
      this.showPossibleMovesTemporaryMessage();
    }
  }

  // -------------------------------------------------------------------------

  /** @java ButtonOther#isEnabled() */
  protected override isEnabled(): boolean {
    this.otherPossibleMoves = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const context = (this.app as PlayerApp).contextSnapshot().getContext(this.app);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const legal = context.moves(context);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    for (const m of legal.moves() as Move[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if ((m as { isOtherMove(): boolean }).isOtherMove())
        this.otherPossibleMoves.push(m);
    }

    if (this.otherPossibleMoves.length > 0) return true;
    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * The user wants to either pass or indicate "end of turn".
   *
   * @java ButtonOther#press()
   */
  public override press(): void {
    if (this.isEnabled()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (this.app as PlayerApp).showOtherDialog(this.otherPossibleMoves);
    }
  }

  // -------------------------------------------------------------------------
}
