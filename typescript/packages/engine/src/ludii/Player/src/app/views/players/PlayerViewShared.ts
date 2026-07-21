// @java Player/src/app/views/players/PlayerViewShared.java

import { Color, Graphics2D, Rectangle } from "../../../../../awt/index.js";
import { PlayerViewUser } from "./PlayerViewUser.js";
import type { PlayerView } from "./PlayerView.js";
import type { PlayerApp } from "../View.js";

// ---------------------------------------------------------------------------
// Escape-hatch types
// ---------------------------------------------------------------------------

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

// ---------------------------------------------------------------------------

/**
 * Panel showing the Shared pieces.
 *
 * @author Matthew.Stephenson and cambolbro and Eric.Piette
 * @java app.views.players.PlayerViewShared
 */
export class PlayerViewShared extends PlayerViewUser {

  // -------------------------------------------------------------------------

  /**
   * @java PlayerViewShared(PlayerApp, Rectangle, int, PlayerView)
   */
  constructor(app: PlayerApp, rect: Rectangle, pid: number, playerView: PlayerView) {
    super(app, rect, pid, playerView);
  }

  // -------------------------------------------------------------------------

  /**
   * @java PlayerViewShared#paint(Graphics2D)
   */
  public override paint(g2d: Graphics2D): void {
    if (this.hand !== null) {
      const context: Context = this.app.contextSnapshot().getContext(this.app);
      const containerPlacement = new Rectangle(
        this.placement.x,
        this.placement.y - Math.trunc(this.placement.height / 2),
        this.placement.width,
        this.placement.height,
      );
      this.playerView.paintHand(g2d, context, containerPlacement, this.hand.index());
    }

    this.paintDebug(g2d, Color.ORANGE);
  }

  // -------------------------------------------------------------------------
}
