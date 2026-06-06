// @java Player/src/app/views/tools/buttons/ButtonPass.java

// MoveHandler -> batch 35: src/ludii/Player/src/app/move/MoveHandler.ts

import { GeneralPath } from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ToolButton, type PlayerApp } from '../ToolButton.js';

/** @java other.move.Move */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Move = any;

/** @java app.move.MoveHandler — escape-hatched until batch 35 */
type MoveHandlerStatic = {
  tryGameMove(
    app: PlayerApp,
    from: unknown,
    to: unknown,
    isPass: boolean,
    extraInfo: number,
  ): void;
};

// ---------------------------------------------------------------------------

/**
 * Pass button — pass or indicate "end of turn".
 *
 * @java app.views.tools.buttons.ButtonPass
 * @author Matthew.Stephenson and cambolbro
 */
export class ButtonPass extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonPass(PlayerApp app, int cx, int cy, int sx, int sy, int passButtonIndex)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    passButtonIndex: number,
  ) {
    super(app, 'Pass', cx, cy, sx, sy, passButtonIndex);
    this.tooltipMessage = 'Pass/End Move';
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonPass#draw(Graphics2D)
   */
  public override draw(g2d: Graphics2D): void {
    const cx = this.rect.getCenterX();
    const cy = this.rect.getCenterY();

    g2d.setColor(this.getButtonColour());

    // Scale buttons for mobile (desktop toolbar = 32 px; mobile = 64 px).
    const scale = this.scaleForDevice();

    const path = new GeneralPath();
    path.moveTo( cx - 15 * scale, cy + 10 * scale);
    path.curveTo(cx - 15 * scale, cy, cx - 8 * scale, cy - 7 * scale, cx + 2 * scale, cy - 7 * scale);
    path.lineTo( cx,              cy - 12 * scale);
    path.lineTo( cx + 15 * scale, cy -  5 * scale);
    path.lineTo( cx,              cy +  2 * scale);
    path.lineTo( cx +  2 * scale, cy -  3 * scale);
    path.curveTo(cx -  7 * scale, cy - 3 * scale, cx - 13 * scale, cy + 6 * scale, cx - 15 * scale, cy + 10 * scale);
    g2d.fill(path);
  }

  // -------------------------------------------------------------------------

  /** @java ButtonPass#isEnabled() */
  protected override isEnabled(): boolean {
    let canPass = false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const context = (this.app as PlayerApp).contextSnapshot().getContext(this.app);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const legal = context.moves(context);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    for (const m of legal.moves() as Move[]) {
      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (m as { isPass(): boolean }).isPass()
        &&
        (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          (this.app as PlayerApp).manager().settingsNetwork().getNetworkPlayerNumber()
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          === (m as { mover(): number }).mover()
          ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          (this.app as PlayerApp).manager().settingsNetwork().getNetworkPlayerNumber()
          === 0
        )
      ) {
        canPass = true;
      }

      // If going from one game to the next in a match, use the pass button to trigger this.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if ((m as { containsNextInstance(): boolean }).containsNextInstance())
        canPass = true;
    }

    if (canPass) {
      this.showPossibleMovesTemporaryMessage();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * The user wants to either pass or indicate "end of turn".
   *
   * @java ButtonPass#press()
   */
  public override press(): void {
    if (this.isEnabled()) {
      // @java app.move.MoveHandler#tryGameMove — escape-hatched until batch 35
      ButtonPass._getMoveHandler().tryGameMove(this.app, null, null, true, -1);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Escape-hatch for MoveHandler.tryGameMove.
   * @java app.move.MoveHandler#tryGameMove(PlayerApp, Location, Location, boolean, int)
   */
  private static _getMoveHandler(): MoveHandlerStatic {
    // No-op fallback until MoveHandler is ported in batch 35.
    return {
      tryGameMove(_app, _from, _to, _isPass, _extra) {
        /* MoveHandler not yet available — no-op */
      },
    };
  }

  // -------------------------------------------------------------------------
}
