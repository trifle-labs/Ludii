// @java Player/src/app/views/tools/buttons/ButtonEnd.java

import {
  BasicStroke,
  CAP_BUTT,
  JOIN_ROUND,
  GeneralPath,
} from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ToolButton, type PlayerApp } from '../ToolButton.js';
import { ToolView } from '../ToolView.js';

/** @java app.utils.TrialUtil — escape-hatch until batch 35 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TrialUtilT = any;

// ---------------------------------------------------------------------------

/**
 * End button — jumps to the last move in the trial.
 *
 * @java app.views.tools.buttons.ButtonEnd
 * @author Matthew.Stephenson and cambolbro
 */
export class ButtonEnd extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonEnd(PlayerApp app, int cx, int cy, int sx, int sy, int endButtonIndex)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    endButtonIndex: number,
  ) {
    super(app, 'End', cx, cy, sx, sy, endButtonIndex);
    this.tooltipMessage = 'Forward to End';
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonEnd#draw(Graphics2D)
   */
  public override draw(g2d: Graphics2D): void {
    const cx = this.rect.getCenterX();
    const cy = this.rect.getCenterY();

    g2d.setColor(this.getButtonColour());

    // Scale buttons for mobile (desktop toolbar = 32 px; mobile = 64 px).
    const scale = this.scaleForDevice();

    g2d.setStroke(new BasicStroke(3 * scale, CAP_BUTT, JOIN_ROUND));

    let path = new GeneralPath();
    path.moveTo(cx - 10 * scale, cy + 7 * scale);
    path.lineTo(cx,              cy);
    path.lineTo(cx - 10 * scale, cy - 7 * scale);
    g2d.draw(path);

    g2d.setStroke(new BasicStroke(2 * scale, CAP_BUTT, JOIN_ROUND));
    path = new GeneralPath();
    path.moveTo(cx + 4 * scale, cy + 9 * scale);
    path.lineTo(cx + 4 * scale, cy - 9 * scale);
    g2d.draw(path);
  }

  // -------------------------------------------------------------------------

  /** @java ButtonEnd#isEnabled() */
  protected override isEnabled(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
   * Goes to the end (last) location of the match.
   *
   * @java ButtonEnd#press()
   */
  public override press(): void {
    if (this.isEnabled()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      let context = (this.app as PlayerApp).manager().ref().context() as {
        trial(): { numMoves(): number };
      };

      // Go forward one move first.
      ToolView.jumpToMove(this.app, context.trial().numMoves() + 1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      context = (this.app as PlayerApp).manager().ref().context();

      // @java app.utils.TrialUtil#getInstanceEndIndex(Manager, Context)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const manager = (this.app as PlayerApp).manager() as TrialUtilT;
      ToolView.jumpToMove(
        this.app,
        ButtonEnd._trialUtilGetInstanceEndIndex(manager, context),
      );
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Faithful fallback for TrialUtil.getInstanceEndIndex.
   * @java app.utils.TrialUtil#getInstanceEndIndex(Manager, Context)
   */
  private static _trialUtilGetInstanceEndIndex(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    manager: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any,
  ): number {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const allMoves: unknown[] = [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ...context.trial().generateCompleteMovesList(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      ...manager.undoneMoves(),
    ];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (context.isAMatch && context.isAMatch()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      let endOfInstance: number = context.trial().numMoves();
      while (endOfInstance < allMoves.length) {
        if (
          (allMoves[endOfInstance] as { containsNextInstance?(): boolean })
            .containsNextInstance?.()
        ) break;
        endOfInstance++;
      }
      return endOfInstance;
    }
    return allMoves.length;
  }

  // -------------------------------------------------------------------------
}
