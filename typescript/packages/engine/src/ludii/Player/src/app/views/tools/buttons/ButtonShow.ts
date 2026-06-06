// @java Player/src/app/views/tools/buttons/ButtonShow.java

import {
  Color,
  Font,
} from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ToolButton, type PlayerApp } from '../ToolButton.js';

// ---------------------------------------------------------------------------

/**
 * Show button — toggles display of legal moves.
 *
 * @java app.views.tools.buttons.ButtonShow
 * @author cambolbro and Matthew.Stephenson
 */
export class ButtonShow extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonShow(PlayerApp app, int cx, int cy, int sx, int sy, int infoButtonIndex)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    infoButtonIndex: number,
  ) {
    super(app, 'Show', cx, cy, sx, sy, infoButtonIndex);
    this.tooltipMessage = 'Show moves';
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonShow#draw(Graphics2D)
   */
  public override draw(g2d: Graphics2D): void {
    const cx = Math.trunc(this.rect.getCenterX());
    const cy = Math.trunc(this.rect.getCenterY());

    g2d.setColor(this.getButtonColour());

    const oldFont = g2d.getFont();

    // Scale buttons for mobile (desktop toolbar = 32 px; mobile = 64 px).
    const scale = this.scaleForDevice();

    const r = Math.trunc(10 * scale);
    g2d.fillArc(cx - r, cy - r, 2 * r + 1, 2 * r + 1, 0, 360);

    const fontSize = Math.trunc(17 * scale);
    const flags = Font.BOLD;
    const font = new Font('Arial', flags, fontSize);
    g2d.setFont(font);

    g2d.setColor(Color.white);

    const str = '?';
    // @java g2d.getFontMetrics().getStringBounds(str, g2d)
    // FontMetrics shim lacks getStringBounds; approximate with stringWidth/getHeight.
    const fm = g2d.getFontMetrics();
    const boundsWidth  = fm.stringWidth(str);
    const boundsHeight = fm.getHeight();

    const tx = Math.trunc(cx - boundsWidth  / 2 + 0 * scale);
    const ty = Math.trunc(cy + boundsHeight / 2 - 3 * scale);

    g2d.drawString(str, tx, ty);

    g2d.setFont(oldFont);
  }

  // -------------------------------------------------------------------------

  /**
   * Toggles the "Show Legal Moves" setting on/off.
   *
   * @java ButtonShow#press()
   */
  public override press(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.app as PlayerApp).bridge().settingsVC().setShowPossibleMoves(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      !(this.app as PlayerApp).bridge().settingsVC().showPossibleMoves(),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.app as PlayerApp).resetMenuGUI();
  }

  // -------------------------------------------------------------------------
}
