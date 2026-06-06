// @java Player/src/app/views/tools/buttons/ButtonStart.java

import { BasicStroke, GeneralPath, Graphics2D } from "../../../../../../awt/index.js";
import { ToolButton, type PlayerApp } from "../ToolButton.js";

// ---------------------------------------------------------------------------

/**
 * Settings button (Back to Start).
 *
 * @author Matthew.Stephenson and cambolbro
 * @java app.views.tools.buttons.ButtonStart
 */
export class ButtonStart extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonStart(PlayerApp, int, int, int, int, int)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    startButtonIndex: number,
  ) {
    super(app, "Start", cx, cy, sx, sy, startButtonIndex);
    this.tooltipMessage = "Back to Start";
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonStart#draw(Graphics2D)
   */
  public override draw(g2d: Graphics2D): void {
    const cx = this.rect.getCenterX();
    const cy = this.rect.getCenterY();

    g2d.setColor(this.getButtonColour());

    // Determine button scale, so that buttons are scaled up on the mobile version.
    // The desktop version assume a toolbar height of 32 pixels, this should be 64 for mobile version.
    const scale = this.scaleForDevice();

    g2d.setStroke(new BasicStroke(3 * scale, BasicStroke.CAP_BUTT, BasicStroke.JOIN_ROUND));

    let path = new GeneralPath();
    path.moveTo(cx + 10 * scale, cy + 7 * scale);
    path.lineTo(cx, cy);
    path.lineTo(cx + 10 * scale, cy - 7 * scale);
    g2d.draw(path);

    g2d.setStroke(new BasicStroke(2, BasicStroke.CAP_BUTT, BasicStroke.JOIN_ROUND));
    path = new GeneralPath();
    path.moveTo(cx - 4 * scale, cy + 9 * scale);
    path.lineTo(cx - 4 * scale, cy - 9 * scale);
    g2d.draw(path);
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonStart#isEnabled()
   */
  protected override isEnabled(): boolean {
    const context = this.app.manager().ref().context();
    const numInitialPlacementMoves: number =
      context.currentInstanceContext().trial().numInitialPlacementMoves();
    if (
      (
        context.currentSubgameIdx() > 1 ||
        context.trial().numMoves() > numInitialPlacementMoves
      ) &&
      this.app.manager().settingsNetwork().getActiveGameId() === 0
    ) {
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * Goes to the start (first) location of the current trial.
   * @java ButtonStart#press()
   */
  public override press(): void {
    if (this.isEnabled()) {
      let context = this.app.manager().ref().context();

      // Go back one move first.
      // Import ToolView dynamically to avoid circular dependency.
      // ToolView is in the sibling module; use globalThis registry as escape-hatch.
      const jumpToMove = ButtonStart._resolveJumpToMove();
      jumpToMove(this.app, context.trial().numMoves() - 1);

      context = this.app.manager().ref().context();

      // TrialUtil.getInstanceStartIndex — inline the logic.
      // @java app.utils.TrialUtil#getInstanceStartIndex(Context)
      const instanceCtx = context.currentInstanceContext();
      const numInitialMoves: number = instanceCtx.trial().numInitialPlacementMoves();
      const startIndex: number =
        context.trial().numMoves() - instanceCtx.trial().numMoves() + numInitialMoves;

      jumpToMove(this.app, startIndex);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Resolves ToolView.jumpToMove at runtime.
   * Uses the globalThis registry set by ToolView, or a no-op fallback.
   * @java app.views.tools.ToolView#jumpToMove(PlayerApp, int)
   */
  private static _resolveJumpToMove(): (app: PlayerApp, move: number) => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reg = (globalThis as any).__LudiiToolView as
      | { jumpToMove(app: PlayerApp, move: number): void }
      | undefined;
    if (reg?.jumpToMove) {
      return (a, m) => reg.jumpToMove(a, m);
    }
    // No-op fallback — will be wired at runtime.
    return () => { /* ToolView not yet registered */ };
  }

  // -------------------------------------------------------------------------
}
