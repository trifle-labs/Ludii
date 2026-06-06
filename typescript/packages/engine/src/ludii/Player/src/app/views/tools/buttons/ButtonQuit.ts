// @java Player/src/app/views/tools/buttons/ButtonQuit.java

import { Font } from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ToolButton, type PlayerApp } from '../ToolButton.js';

// ---------------------------------------------------------------------------

/**
 * Quit button — exits the application.
 *
 * @java app.views.tools.buttons.ButtonQuit
 * @author Matthew.Stephenson and cambolbro
 */
export class ButtonQuit extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonQuit(PlayerApp app, int cx, int cy, int sx, int sy, int quitButtonIndex)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    quitButtonIndex: number,
  ) {
    super(app, 'Quit', cx, cy, sx, sy, quitButtonIndex);
    this.tooltipMessage = 'Quit';
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonQuit#draw(Graphics2D)
   */
  public override draw(g2d: Graphics2D): void {
    const cx = Math.trunc(this.rect.getCenterX());
    const cy = Math.trunc(this.rect.getCenterY()) + 5;

    g2d.setColor(this.getButtonColour());

    const oldFont = g2d.getFont();

    // Scale buttons for mobile (desktop toolbar = 32 px; mobile = 64 px).
    const scale = this.scaleForDevice();

    const fontSize = Math.trunc(26 * scale);
    const flags = Font.BOLD;
    const font = new Font('Arial', flags, fontSize);
    g2d.setFont(font);
    g2d.setColor(this.getButtonColour());
    g2d.drawString('X', cx - Math.trunc(3 * scale), cy + Math.trunc(6 * scale));
    g2d.setFont(oldFont);
  }

  // -------------------------------------------------------------------------

  /**
   * Exits the application.
   *
   * In a browser environment this is a no-op (there is no System.exit()).
   *
   * @java ButtonQuit#press()  System.exit(0)
   */
  public override press(): void {
    // Java: System.exit(0)
    // Browser: no equivalent — caller may override or handle lifecycle externally.
    if (typeof process !== 'undefined' && typeof process.exit === 'function') {
      process.exit(0);
    }
  }

  // -------------------------------------------------------------------------
}
