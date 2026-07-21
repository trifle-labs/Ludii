// @java Player/src/app/views/players/PlayerView.java

import { Color, Font, Graphics2D, Rectangle } from "../../../../../awt/index.js";
import { View, type PlayerApp } from "../View.js";
import { SettingsExhibition } from "../../utils/SettingsExhibition.js";
import { PlayerViewUser } from "./PlayerViewUser.js";
import { PlayerViewShared } from "./PlayerViewShared.js";
import { PlaneType } from "../../../../../ViewController/src/util/PlaneType.js";

// ---------------------------------------------------------------------------
// Helper: approximate java.awt.Font.getStringBounds() via size heuristics.
// ---------------------------------------------------------------------------
function fontStringBounds(
  font: Font,
  str: string,
): { getWidth(): number; getHeight(): number } {
  const w = str.length * font.getSize() * 0.6;
  const h = font.getSize() * 1.0;
  return {
    getWidth(): number { return w; },
    getHeight(): number { return h; },
  };
}

// ---------------------------------------------------------------------------
// Escape-hatch types
// ---------------------------------------------------------------------------

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

// ---------------------------------------------------------------------------

/**
 * View area containing all specific player views.
 *
 * @author Matthew.Stephenson and cambolbro and Eric.Piette
 * @java app.views.players.PlayerView
 */
export class PlayerView extends View {

  /** Player areas/sections/pages. @java PlayerView#playerSections */
  public playerSections: PlayerViewUser[] = [];

  /** Font. @java PlayerView#playerNameFont */
  public playerNameFont: Font = new Font("Arial", Font.PLAIN, 16);

  // -------------------------------------------------------------------------

  /**
   * @java PlayerView(PlayerApp, boolean, boolean)
   */
  constructor(app: PlayerApp, portraitMode: boolean, exhibitionMode: boolean) {
    super(app);
    this.playerSections = [];
    const game = app.contextSnapshot().getContext(app).game();
    const numPlayers: number = game.players().count();

    const maxHandHeight = 100;                 // Maximum height of a player's hand.
    const maxPanelPercentageHeight = 0.7;      // Maximum height of the entire panel (as percentage of app height).

    let boardSize = app.height();
    if (SettingsExhibition.exhibitionVersion) {
      boardSize = app.getPanels().get(0).placement().width;  // Allows for custom board sizes.
    }
    let startX = boardSize + 8;
    let startY = 8;
    let width = app.width() - boardSize;
    let height = Math.min(maxHandHeight, Math.trunc(app.height() * maxPanelPercentageHeight / numPlayers));

    if (SettingsExhibition.exhibitionVersion) {
      startY += 40;
    }

    if (app.manager().isWebApp() && portraitMode && numPlayers <= 4) {
      this.playerNameFont = new Font("Arial", Font.PLAIN, 32);
    }

    if (portraitMode) {
      boardSize = app.width();
      startX = 8;
      startY = app.manager().isWebApp() ? boardSize + 88 : boardSize + 48;  // +40 for height of toolView, +80 on mobile
      width = boardSize - 8;
      height = Math.min(maxHandHeight, Math.trunc((app.height() - boardSize) * maxPanelPercentageHeight / numPlayers));
    }

    if (exhibitionMode) {
      for (let pid = 1; pid <= numPlayers; pid++) {
        const x0 = startX + 5;
        let y0 = 75;
        if (pid === 2) {
          y0 = 600;
        }
        const eWidth = 600;
        const eHeight = 150;
        const place = new Rectangle(x0, y0, eWidth, Math.trunc(eHeight * 0.7));
        const playerPage = new PlayerViewUser(app, place, pid, this);
        app.getPanels().add(playerPage);
        this.playerSections.push(playerPage);
      }
    } else {
      // Create a specific user page for each player.
      for (let pid = 1; pid <= numPlayers; pid++) {
        const x0 = startX;
        const y0 = startY + (pid - 1) * height;
        const place = new Rectangle(x0, y0, width, height);
        const playerPage = new PlayerViewUser(app, place, pid, this);
        app.getPanels().add(playerPage);
        this.playerSections.push(playerPage);
      }
    }

    // Create the shared player page (if it exists).
    if (app.contextSnapshot().getContext(app).hasSharedPlayer()) {
      let place = new Rectangle(0, 0, boardSize, Math.trunc(boardSize / 10));

      // Place the shared hand in different location for exhibition app.
      if (app.settingsPlayer().usingMYOGApp()) {
        place = new Rectangle(360, 280, 180, 130);  // last argument changes piece size
      }
      if (SettingsExhibition.exhibitionVersion) {
        if (app.contextSnapshot().getContext(app).game().name().includes("Senet")) {
          place = new Rectangle(0, 90, boardSize, Math.trunc(boardSize / 7));
        } else {
          place = new Rectangle(0, -90, boardSize, Math.trunc(boardSize / 7));
        }
      }

      const naturePlayerPage = new PlayerViewShared(app, place, numPlayers + 1, this);
      app.getPanels().add(naturePlayerPage);
      this.playerSections.push(naturePlayerPage);
    }

    const playerPanelWidth = app.width() - boardSize;
    const playerPanelHeight = numPlayers * height + 24;

    this.placement.setRect(boardSize, 0, playerPanelWidth, playerPanelHeight);
  }

  // -------------------------------------------------------------------------

  /**
   * Draw player details and hand/dice/deck of the player.
   * @java PlayerView#paint(Graphics2D)
   */
  public override paint(g2d: Graphics2D): void {
    for (const p of this.playerSections) {
      p.paint(g2d);
    }
    this.paintDebug(g2d, Color.PINK);
  }

  // -------------------------------------------------------------------------

  /**
   * Get the Maximum width of all player names (including extras).
   * @java PlayerView#maximalPlayerNameWidth(Context, Graphics2D)
   */
  public maximalPlayerNameWidth(context: Context, g2d: Graphics2D): number {
    let numUsers = this.playerSections.length;
    if (this.app.contextSnapshot().getContext(this.app).hasSharedPlayer()) {
      numUsers -= 1;
    }

    let maxNameWidth = 0;
    for (let panelIndex = 0; panelIndex < numUsers; panelIndex++) {
      const section = this.playerSections[panelIndex];
      if (section == null) continue;
      const stringNameAndExtras = section.getNameAndExtrasString(context, g2d);
      const bounds = fontStringBounds(this.playerNameFont, stringNameAndExtras);
      maxNameWidth = Math.max(Math.trunc(bounds.getWidth()), maxNameWidth);
    }
    return maxNameWidth;
  }

  // -------------------------------------------------------------------------

  /**
   * @java PlayerView#paintHand(Graphics2D, Context, Rectangle, int)
   */
  public paintHand(g2d: Graphics2D, context: Context, place: Rectangle, handIndex: number): void {
    this.app.bridge().getContainerStyle(handIndex).setPlacement(context, place);

    if (this.app.settingsPlayer().showPieces()) {
      this.app.bridge().getContainerStyle(handIndex).draw(g2d, PlaneType.COMPONENTS, context);
    }

    this.app.bridge().getContainerStyle(handIndex).draw(g2d, PlaneType.INDICES, context);
    this.app.bridge().getContainerStyle(handIndex).draw(g2d, PlaneType.POSSIBLEMOVES, context);
  }
}
