// @java Player/src/app/views/tools/buttons/ButtonForward.java

import {
  BasicStroke,
  CAP_BUTT,
  JOIN_ROUND,
  GeneralPath,
} from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ToolButton, type PlayerApp } from '../ToolButton.js';
import { ToolView } from '../ToolView.js';

// ---------------------------------------------------------------------------

/**
 * Forward button — goes forward a single move in the current trial.
 *
 * @java app.views.tools.buttons.ButtonForward
 * @author Matthew.Stephenson and cambolbro
 */
export class ButtonForward extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonForward(PlayerApp app, int cx, int cy, int sx, int sy, int forwardButtonIndex)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    forwardButtonIndex: number,
  ) {
    super(app, 'Forward', cx, cy, sx, sy, forwardButtonIndex);
    this.tooltipMessage = 'Forward a Move';
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonForward#draw(Graphics2D)
   */
  public override draw(g2d: Graphics2D): void {
    const cx = this.rect.getCenterX();
    const cy = this.rect.getCenterY();

    g2d.setColor(this.getButtonColour());

    // Scale buttons for mobile (desktop toolbar = 32 px; mobile = 64 px).
    const scale = this.scaleForDevice();

    g2d.setStroke(new BasicStroke(3 * scale, CAP_BUTT, JOIN_ROUND));

    const path = new GeneralPath();
    path.moveTo(cx - 5 * scale, cy + 7 * scale);
    path.lineTo(cx + 5 * scale, cy);
    path.lineTo(cx - 5 * scale, cy - 7 * scale);
    g2d.draw(path);
  }

  // -------------------------------------------------------------------------

  /** @java ButtonForward#isEnabled() */
  protected override isEnabled(): boolean {
    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (this.app as PlayerApp).manager().undoneMoves().size() > 0
      &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (this.app as PlayerApp).manager().settingsNetwork().getActiveGameId() === 0
    ) {
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * Goes forward a single action in the current trial.
   *
   * @java ButtonForward#press()
   */
  public override press(): void {
    if (this.isEnabled()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const context = (this.app as PlayerApp).manager().ref().context() as {
        trial(): { numMoves(): number };
      };
      ToolView.jumpToMove(this.app, context.trial().numMoves() + 1);
    }
  }

  // -------------------------------------------------------------------------
}
