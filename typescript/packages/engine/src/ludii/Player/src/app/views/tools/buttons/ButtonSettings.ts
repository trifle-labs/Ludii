// @java Player/src/app/views/tools/buttons/ButtonSettings.java

import { Color } from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ToolButton, type PlayerApp } from '../ToolButton.js';
import { FullLocation } from '../../../../../../../ludemes/other/location/FullLocation.js';

/** @java main.Constants.UNDEFINED */
const CONSTANTS_UNDEFINED = -1;

// ---------------------------------------------------------------------------

/**
 * Settings button — opens the preferences dialog.
 *
 * @java app.views.tools.buttons.ButtonSettings
 * @author Matthew.Stephenson and cambolbro
 */
export class ButtonSettings extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonSettings(PlayerApp app, int cx, int cy, int sx, int sy, int settingsButtonIndex)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    settingsButtonIndex: number,
  ) {
    super(app, 'Settings', cx, cy, sx, sy, settingsButtonIndex);
    this.tooltipMessage = 'Preferences';
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonSettings#draw(Graphics2D)
   */
  public override draw(g2d: Graphics2D): void {
    const cx = Math.trunc(this.rect.getCenterX());
    const cy = Math.trunc(this.rect.getCenterY());

    g2d.setColor(this.getButtonColour());

    // Scale buttons for mobile (desktop toolbar = 32 px; mobile = 64 px).
    const scale = this.scaleForDevice();

    const d  = Math.trunc(10 * scale);
    const dd = Math.trunc(7  * scale);

    g2d.drawLine(cx - d,  cy,      cx + d,  cy);
    g2d.drawLine(cx,      cy - d,  cx,      cy + d);

    g2d.drawLine(cx - dd, cy - dd, cx + dd, cy + dd);
    g2d.drawLine(cx - dd, cy + dd, cx + dd, cy - dd);

    const r = 7;
    g2d.fillArc(cx - r, cy - r, 2 * r + 1, 2 * r + 1, 0, 360);

    const rr = 3;
    g2d.setColor(Color.white);
    g2d.fillArc(cx - rr, cy - rr, 2 * rr + 1, 2 * rr + 1, 0, 360);
  }

  // -------------------------------------------------------------------------

  /**
   * Displays the settings popup.
   *
   * @java ButtonSettings#press()
   */
  public override press(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.app as PlayerApp).showSettingsDialog();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.app as PlayerApp).bridge().settingsVC().setSelectedFromLocation(
      new FullLocation(CONSTANTS_UNDEFINED),
    );
  }

  // -------------------------------------------------------------------------
}
