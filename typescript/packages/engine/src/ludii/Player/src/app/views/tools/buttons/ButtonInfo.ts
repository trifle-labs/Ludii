// @java Player/src/app/views/tools/buttons/ButtonInfo.java

import {
  Color,
  Font,
} from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ToolButton, type PlayerApp } from '../ToolButton.js';
import { FullLocation } from '../../../../../../../ludemes/other/location/FullLocation.js';

/** @java main.Constants.UNDEFINED */
const CONSTANTS_UNDEFINED = -1;

// ---------------------------------------------------------------------------

/**
 * Info button — displays the game information dialog.
 *
 * @java app.views.tools.buttons.ButtonInfo
 * @author Matthew.Stephenson and cambolbro
 */
export class ButtonInfo extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonInfo(PlayerApp app, int cx, int cy, int sx, int sy, int infoButtonIndex)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    infoButtonIndex: number,
  ) {
    super(app, 'Info', cx, cy, sx, sy, infoButtonIndex);
    this.tooltipMessage = 'Info';
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonInfo#draw(Graphics2D)
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
    const flags = Font.ITALIC | Font.BOLD;
    const font = new Font('Arial', flags, fontSize);
    g2d.setFont(font);
    g2d.setColor(Color.white);
    g2d.drawString('i', cx - Math.trunc(3 * scale), cy + Math.trunc(6 * scale));
    g2d.setFont(oldFont);
  }

  // -------------------------------------------------------------------------

  /**
   * Displays the information popup.
   *
   * @java ButtonInfo#press()
   */
  public override press(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.app as PlayerApp).showInfoDialog();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.app as PlayerApp).bridge().settingsVC().setSelectedFromLocation(
      new FullLocation(CONSTANTS_UNDEFINED),
    );
  }

  // -------------------------------------------------------------------------
}
