// @java Player/src/app/views/tools/buttons/ButtonCycleAI.java

import {
  Color,
  Font,
} from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ToolButton, type PlayerApp } from '../ToolButton.js';
import { FullLocation } from '../../../../../../../ludemes/other/location/FullLocation.js';
import { AIUtil } from '../../../../../../Manager/src/manager/ai/AIUtil.js';

/** @java main.Constants.UNDEFINED */
const CONSTANTS_UNDEFINED = -1;

// ---------------------------------------------------------------------------

/**
 * Cycle AI button — cycles the AI agent for the current player.
 *
 * @java app.views.tools.buttons.ButtonCycleAI
 * @author Matthew.Stephenson
 */
export class ButtonCycleAI extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonCycleAI(PlayerApp app, int cx, int cy, int sx, int sy, int settingsButtonIndex)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    settingsButtonIndex: number,
  ) {
    super(app, 'Cycle AI', cx, cy, sx, sy, settingsButtonIndex);
    this.tooltipMessage = 'Preferences';
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonCycleAI#draw(Graphics2D)
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
    g2d.drawString('c', cx - Math.trunc(3 * scale), cy + Math.trunc(6 * scale));
    g2d.setFont(oldFont);
  }

  // -------------------------------------------------------------------------

  /**
   * Cycles AI agents and resets the selected location.
   *
   * @java ButtonCycleAI#press()
   */
  public override press(): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    AIUtil.cycleAgents((this.app as PlayerApp).manager());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.app as PlayerApp).bridge().settingsVC().setSelectedFromLocation(
      new FullLocation(CONSTANTS_UNDEFINED),
    );
  }

  // -------------------------------------------------------------------------
}
