// @java Player/src/app/views/tools/buttons/ButtonPlayPause.java

import { GeneralPath, Graphics2D } from "../../../../../../awt/index.js";
import { ToolButton, type PlayerApp } from "../ToolButton.js";
import { FullLocation } from "../../../../../../../ludemes/other/location/FullLocation.js";

// ---------------------------------------------------------------------------
// Escape-hatch types
// ---------------------------------------------------------------------------

/** @java game.types.play.ModeType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModeType = any;

/** @java main.Constants.UNDEFINED */
const UNDEFINED = -1;

// ---------------------------------------------------------------------------

/**
 * Play/Pause button.
 *
 * @author Matthew.Stephenson and cambolbro
 * @java app.views.tools.buttons.ButtonPlayPause
 */
export class ButtonPlayPause extends ToolButton {

  // -------------------------------------------------------------------------

  /**
   * @java ButtonPlayPause(PlayerApp, int, int, int, int, int)
   */
  constructor(
    app: PlayerApp,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    playButtonIndex: number,
  ) {
    super(app, "PlayPause", cx, cy, sx, sy, playButtonIndex);
    this.tooltipMessage = "Player/Pause";
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonPlayPause#draw(Graphics2D)
   */
  public override draw(g2d: Graphics2D): void {
    const cx = this.rect.getCenterX();
    const cy = this.rect.getCenterY();

    g2d.setColor(this.getButtonColour());

    let path = new GeneralPath();

    // Determine button scale, so that buttons are scaled up on the mobile version.
    // The desktop version assume a toolbar height of 32 pixels, this should be 64 for mobile version.
    const scale = this.scaleForDevice();

    if (this.app.manager().settingsManager().agentsPaused()) {
      // Display Play Symbol
      path.moveTo(cx + 9 * scale, cy);
      path.lineTo(cx - 7 * scale, cy - 9 * scale);
      path.lineTo(cx - 7 * scale, cy + 9 * scale);
      g2d.fill(path);
    } else {
      // Display Pause Symbol
      path.moveTo(cx - 7 * scale, cy + 9 * scale);
      path.lineTo(cx - 7 * scale, cy - 9 * scale);
      path.lineTo(cx - 2 * scale, cy - 9 * scale);
      path.lineTo(cx - 2 * scale, cy + 9 * scale);
      g2d.fill(path);
      path = new GeneralPath();
      path.moveTo(cx + 2 * scale, cy + 9 * scale);
      path.lineTo(cx + 2 * scale, cy - 9 * scale);
      path.lineTo(cx + 7 * scale, cy - 9 * scale);
      path.lineTo(cx + 7 * scale, cy + 9 * scale);
      g2d.fill(path);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java ButtonPlayPause#isEnabled()
   */
  protected override isEnabled(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const modeType: ModeType = this.app.manager().ref().context().game().mode().mode();
    // escape-hatch: compare by value/name since ModeType enum is not ported
    if (modeType === "Simulation" || String(modeType) === "Simulation") {
      return true;
    }

    // AIUtil.anyAIPlayer
    const AIUtil = (globalThis as any).AIUtil;
    const anyAI: boolean =
      AIUtil != null
        ? AIUtil.anyAIPlayer(this.app.manager())
        : this.app.manager().aiSelected().some((ai: any) => ai?.ai() != null);

    if (
      anyAI &&
      (
        this.app.manager().settingsNetwork().getActiveGameId() === 0 ||
        this.app.manager().settingsNetwork().getOnlineAIAllowed()
      )
    ) {
      return true;
    }

    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * Either pauses or resumes the agents playing the game.
   * @java ButtonPlayPause#press()
   */
  public override press(): void {
    if (this.isEnabled()) {
      if (!this.app.manager().settingsManager().agentsPaused()) {
        this.app.manager().settingsManager().setAgentsPaused(this.app.manager(), true);
      } else {
        this.app.manager().settingsManager().setAgentsPaused(this.app.manager(), false);
        this.app.manager().ref().nextMove(this.app.manager(), false);
      }

      this.app.bridge().settingsVC().setSelectedFromLocation(new FullLocation(UNDEFINED));
    }
  }

  // -------------------------------------------------------------------------
}
