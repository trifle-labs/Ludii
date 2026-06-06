// @java Player/src/app/views/players/PlayerViewUser.java

import { BasicStroke, Color, Font, Graphics2D, Point, Rectangle } from "../../../../../awt/index.js";
import { View, type PlayerApp } from "../View.js";
import { SettingsExhibition } from "../../utils/SettingsExhibition.js";
import { SVGUtil } from "../../utils/SVGUtil.js";
import { GUIUtil } from "../../utils/GUIUtil.js";
import { Spinner } from "../../utils/Spinner.js";
import { ColourRoutines } from "../../../../../../ludemes/metadata/graphics/util/colour/ColourRoutines.js";
import type { RgbaColour } from "../../../../../../ludemes/metadata/graphics/util/colour/UserColourType.js";
import type { PlayerView } from "./PlayerView.js";

// ---------------------------------------------------------------------------
// Escape-hatch types
// ---------------------------------------------------------------------------

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java other.AI */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AI = any;

/** @java game.types.state.GameType.Score flag value. */
const GAME_TYPE_SCORE: bigint = 4n;

// ---------------------------------------------------------------------------
// Helper: approximate java.awt.Font.getStringBounds() via size heuristics.
// ---------------------------------------------------------------------------
function fontStringBounds(
  font: Font,
  str: string,
): { getWidth(): number; getHeight(): number; getCenterX(): number; getCenterY(): number; getX(): number; getY(): number; getMinX(): number } {
  const w = str.length * font.getSize() * 0.6;
  const h = font.getSize() * 1.0;
  return {
    getWidth(): number { return w; },
    getHeight(): number { return h; },
    getCenterX(): number { return w / 2; },
    getCenterY(): number { return h / 2; },
    getX(): number { return 0; },
    getY(): number { return -h; },
    getMinX(): number { return 0; },
  };
}

/** Convert awt.Color → RgbaColour for ColourRoutines. */
function colorToRgba(c: Color): RgbaColour {
  return { r: c.getRed(), g: c.getGreen(), b: c.getBlue(), a: c.getAlpha() };
}

/** Convert RgbaColour → awt.Color. */
function rgbaToColor(c: RgbaColour): Color {
  return new Color(c.r, c.g, c.b, c.a);
}

// ---------------------------------------------------------------------------

/**
 * Panel showing a specific player's status and details.
 *
 * @author Matthew.Stephenson and cambolbro and Eric.Piette
 * @java app.views.players.PlayerViewUser
 */
export class PlayerViewUser extends View {

  /** Player index: 1, 2, ... 0 is shared. @java PlayerViewUser#playerId */
  protected playerId: number = 0;

  /** PlayerView object that generated this UserView. @java PlayerViewUser#playerView */
  public playerView: PlayerView;

  /** Container associated with this view. @java PlayerViewUser#hand */
  protected hand: Container | null = null;

  /** Store a spinner for this player. @java PlayerViewUser#spinner */
  public spinner: Spinner | null = null;

  /** @java PlayerViewUser#moverTextColour */
  protected static moverTextColour: Color = new Color(50, 50, 50);
  /** @java PlayerViewUser#nonMoverTextColour */
  protected static nonMoverTextColour: Color = new Color(215, 215, 215);

  // -------------------------------------------------------------------------

  /**
   * @java PlayerViewUser(PlayerApp, Rectangle, int, PlayerView)
   */
  constructor(app: PlayerApp, rect: Rectangle, pid: number, playerView: PlayerView) {
    super(app);
    this.playerView = playerView;
    this.playerId = pid;
    this.determineHand(app.contextSnapshot().getContext(app).equipment());
    this.placement = rect;

    if (SettingsExhibition.exhibitionVersion) {
      this.placement.y += 30 * this.playerId;
      PlayerViewUser.moverTextColour = new Color(220, 220, 220);
      PlayerViewUser.nonMoverTextColour = new Color(100, 100, 100);
      this.playerView.playerNameFont = new Font("Arial", Font.PLAIN, 30);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java PlayerViewUser#paint(Graphics2D)
   */
  public override paint(g2d: Graphics2D): void {
    const context: Context = this.app.contextSnapshot().getContext(this.app);
    const mover: number = context.state().mover();
    const winnerNumbers: number[] = PlayerViewUser.getWinnerNumbers(context);

    let componentPushBufferX = 0;

    if (!this.app.settingsPlayer().usingMYOGApp()) {
      this.drawColourSwatch(g2d, mover, winnerNumbers, context);
      this.drawPlayerName(g2d, mover, winnerNumbers, context);

      if (!SettingsExhibition.exhibitionVersion) {
        this.drawAIFace(g2d);
      }

      const swatchWidth: number = this.app.playerSwatchList()[this.playerId].width;
      const maxNameWidth: number = this.playerView.maximalPlayerNameWidth(context, g2d);
      const nameHeight: number = this.app.playerNameList()[this.playerId].getHeight();
      componentPushBufferX = Math.trunc(swatchWidth + maxNameWidth + nameHeight * 2);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyAIPlayer: boolean = (globalThis as any).__LudiiAIUtil?.anyAIPlayer?.(this.app.manager()) ?? false;
      if (anyAIPlayer) {
        componentPushBufferX += this.playerView.playerNameFont.getSize() * 3;
      }
    }

    if (this.hand !== null) {
      const containerMarginWidth = Math.trunc(0.05 * this.placement.height);
      const containerPlacement = new Rectangle(
        this.placement.x + componentPushBufferX + containerMarginWidth,
        this.placement.y - Math.trunc(this.placement.height / 2),
        this.placement.width - componentPushBufferX - containerMarginWidth * 2,
        this.placement.height,
      );
      this.playerView.paintHand(g2d, context, containerPlacement, this.hand.index());
    }

    if (!SettingsExhibition.exhibitionVersion) {
      this.drawAISpinner(g2d, context);
    }

    this.paintDebug(g2d, Color.RED);
  }

  // -------------------------------------------------------------------------

  /**
   * Draw Swatch showing player number and colour.
   * @java PlayerViewUser#drawColourSwatch(Graphics2D, int, ArrayList, Context)
   */
  private drawColourSwatch(
    g2d: Graphics2D,
    mover: number,
    winnerNumbers: number[],
    context: Context,
  ): void {
    g2d.setStroke(new BasicStroke(1, BasicStroke.CAP_BUTT, BasicStroke.JOIN_ROUND));

    const discR = Math.trunc(0.275 * this.placement.height);
    const cx = this.placement.x + discR;
    const cy = this.placement.y + Math.trunc(this.placement.height / 2);

    const fillColour: Color = this.app.bridge().settingsColour().playerColour(context, this.playerId);
    const trialOver: boolean = this.app.contextSnapshot().getContext(this.app).trial().over();
    const fullColour: boolean =
      (trialOver && winnerNumbers.includes(this.playerId)) ||
      (!trialOver && this.playerId === mover) ||
      SettingsExhibition.exhibitionVersion;

    const fcr = fillColour.getRed();
    const fcg = fillColour.getGreen();
    const fcb = fillColour.getBlue();

    // Draw a coloured ring around the swatch if network game to represent player is online/offline.
    if (this.app.manager().settingsNetwork().getActiveGameId() !== 0) {
      let markerColour = Color.RED;
      if (this.app.manager().settingsNetwork().onlinePlayers()[this.playerId] === true) {
        markerColour = Color.GREEN;
      }
      g2d.setColor(markerColour);
      g2d.fillArc(cx - discR - 4, cy - discR - 4, discR * 2 + 8, discR * 2 + 8, 0, 360);
    }

    // Draw faint outline.
    g2d.setColor(fullColour ? new Color(63, 63, 63) : new Color(215, 215, 215));
    g2d.fillArc(cx - discR - 2, cy - discR - 2, discR * 2 + 4, discR * 2 + 4, 0, 360);

    if (this.app.playerSwatchHover()[this.playerId]) {
      // Draw faded colour.
      const rr = fcr + Math.trunc((255 - fcr) * 0.5);
      const gg = fcg + Math.trunc((255 - fcg) * 0.5);
      const bb = fcb + Math.trunc((255 - fcb) * 0.5);
      g2d.setColor(new Color(rr, gg, bb));
    } else {
      if (fullColour) {
        g2d.setColor(fillColour);
      } else {
        const rr = fcr + Math.trunc((255 - fcr) * 0.75);
        const gg = fcg + Math.trunc((255 - fcg) * 0.75);
        const bb = fcb + Math.trunc((255 - fcb) * 0.75);
        g2d.setColor(new Color(rr, gg, bb));
      }
    }
    g2d.fillArc(cx - discR, cy - discR, discR * 2, discR * 2, 0, 360);

    if (this.app.playerSwatchHover()[this.playerId]) {
      g2d.setColor(new Color(150, 150, 150));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isSimultaneous: boolean = (this.app.contextSnapshot().getContext(this.app).model() as any)?.isSimultaneousMove?.() ?? false;
      if (this.playerId === mover || isSimultaneous) {
        g2d.setColor(PlayerViewUser.moverTextColour);
      } else {
        g2d.setColor(PlayerViewUser.nonMoverTextColour);
      }
    }

    // Draw the player number.
    const oldFont = g2d.getFont();
    const indexFont = new Font("Arial", Font.BOLD, Math.trunc(1.0 * discR));
    g2d.setFont(indexFont);
    const str = String(this.playerId);
    const bounds = fontStringBounds(indexFont, str);

    const tx = cx - Math.trunc(0.5 * bounds.getWidth());
    const ty = cy + Math.trunc(0.3 * bounds.getHeight()) + 1;

    // getContrastColorFavourLight expects RgbaColour
    const fillRgba = colorToRgba(fillColour);
    const contrastRgba: RgbaColour = ColourRoutines.getContrastColorFavourLight(fillRgba);
    const contrastColour: Color = rgbaToColor(contrastRgba);
    if (fullColour) {
      g2d.setColor(contrastColour);
    } else {
      g2d.setColor(
        new Color(
          Math.max(contrastColour.getRed(), 215),
          Math.max(contrastColour.getGreen(), 215),
          Math.max(contrastColour.getBlue(), 215),
        ),
      );
    }
    g2d.drawString(str, tx, ty);
    g2d.setFont(oldFont);

    // Indicate if player is no longer active in game.
    const gameOver: boolean = context.trial().over();
    if (!context.active(this.playerId) && !gameOver) {
      // Player not active -- strike through.
      g2d.setColor(new Color(255, 255, 255));
      g2d.setStroke(new BasicStroke(7, BasicStroke.CAP_BUTT, BasicStroke.JOIN_ROUND));
      g2d.drawLine(cx - 20, cy - 20, cx + 20, cy + 20);
      g2d.drawLine(cx - 20, cy + 20, cx + 20, cy - 20);
    }

    this.app.playerSwatchList()[this.playerId] = new Rectangle(cx - discR, cy - discR, discR * 2, discR * 2);
  }

  // -------------------------------------------------------------------------

  /**
   * Draws the player's name.
   * @java PlayerViewUser#drawPlayerName(Graphics2D, int, ArrayList, Context)
   */
  private drawPlayerName(
    g2d: Graphics2D,
    mover: number,
    winnerNumbers: number[],
    context: Context,
  ): void {
    g2d.setFont(this.playerView.playerNameFont);

    const stringNameAndExtras = this.getNameAndExtrasString(context, g2d);
    const bounds = fontStringBounds(this.playerView.playerNameFont, stringNameAndExtras);

    const square: Rectangle = this.app.playerSwatchList()[this.playerId];
    const drawPosnX = square.getCenterX() + square.getWidth();
    const drawPosnY = square.getCenterY();

    // Determine name and comboBox placement.
    const strNameY = Math.trunc(drawPosnY + bounds.getHeight() / 3);
    const strNameX = Math.trunc(drawPosnX);

    // Determine the colour of the player name.
    if (!context.trial().over() || !winnerNumbers.includes(this.playerId)) {
      if (this.app.playerNameHover()[this.playerId]) {
        g2d.setColor(new Color(150, 150, 150));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isSimultaneous: boolean = (this.app.contextSnapshot().getContext(this.app).model() as any)?.isSimultaneousMove?.() ?? false;
        if (this.playerId === mover || isSimultaneous) {
          g2d.setColor(PlayerViewUser.moverTextColour);
        } else {
          g2d.setColor(PlayerViewUser.nonMoverTextColour);
        }
      }
    } else {
      // Show winner.
      g2d.setColor(Color.red);
    }

    const NameAndExtrasBounds = new Rectangle(
      strNameX,
      Math.trunc(strNameY - bounds.getHeight()),
      Math.trunc(bounds.getWidth()),
      Math.trunc(bounds.getHeight()),
    );

    this.app.playerNameList()[this.playerId] = NameAndExtrasBounds;

    if (SettingsExhibition.exhibitionVersion) {
      // In Java this loads /National-Regular.ttf from the classpath.
      // In the TS port we use a system font fallback.
      g2d.setFont(new Font("serif", Font.PLAIN, 32));
    }

    g2d.drawString(stringNameAndExtras, strNameX, strNameY);
  }

  // -------------------------------------------------------------------------

  /**
   * Draw AI face with expression showing positional estimate.
   * @java PlayerViewUser#drawAIFace(Graphics2D)
   */
  drawAIFace(g2d: Graphics2D): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai: AI = this.app.manager().aiSelected()[this.app.manager().playerToAgent(this.playerId)]?.ai();

    if (ai != null) {
      const happinessValue: number = ai.estimateValue() as number;

      let imagePath = "/svg/faces/symbola_cool.svg";
      if (happinessValue < -0.8) {
        imagePath = "/svg/faces/symbola_sad.svg";
      } else if (happinessValue < -0.5) {
        imagePath = "/svg/faces/symbola_scared.svg";
      } else if (happinessValue < -0.2) {
        imagePath = "/svg/faces/symbola_worried.svg";
      } else if (happinessValue < 0.2) {
        imagePath = "/svg/faces/symbola_neutral.svg";
      } else if (happinessValue < 0.5) {
        imagePath = "/svg/faces/symbola_pleased.svg";
      } else if (happinessValue < 0.8) {
        imagePath = "/svg/faces/symbola_happy.svg";
      }

      // In the TS/browser port, fetch the SVG via a pre-loaded SVG registry when available.
      // The Java version uses a BufferedReader from a classpath resource.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svgRegistry = (globalThis as any).__LudiiSVGRegistry as Record<string, string> | undefined;
      const svgContent: string | undefined = svgRegistry?.[imagePath];

      if (svgContent != null) {
        const nameRect: Rectangle = this.app.playerNameList()[this.playerId];
        const r = this.playerView.playerNameFont.getSize();
        const drawPosnX = nameRect.getX() + nameRect.getWidth() + g2d.getFont().getSize() / 5;
        const drawPosnY = nameRect.getCenterY() - g2d.getFont().getSize() / 5;
        const img = SVGUtil.createSVGImage(svgContent, Math.trunc(r), Math.trunc(r));
        if (img != null) {
          // escape-hatch: drawImage with SVGBufferedImage
          g2d.drawImage(img, Math.trunc(drawPosnX), Math.trunc(drawPosnY), Math.trunc(r), Math.trunc(r));
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Start the spinner for each AI that is thinking/moving.
   * @java PlayerViewUser#drawAISpinner(Graphics2D, Context)
   */
  private drawAISpinner(g2d: Graphics2D, context: Context): void {
    if (this.app.manager().isWebApp()) return;

    if (this.app.settingsPlayer().usingMYOGApp()) {
      if (this.spinner === null) {
        // Rectangle2D.Double for (905, 335, 100, 100)
        import("../../../../../awt/index.js").then(({ Rectangle2D }) => {
          this.spinner = new Spinner(new Rectangle2D.Double(905, 335, 100, 100));
        }).catch(() => { /* ignore */ });
        return;
      }
      this.spinner.setDotRadius(4);
    } else {
      const nameRect: Rectangle = this.app.playerNameList()[this.playerId];
      const r = this.playerView.playerNameFont.getSize();
      const drawPosnX = nameRect.getX() + nameRect.getWidth() + r + 15;
      const drawPosnY = nameRect.getCenterY() - 3;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spinnerOrigX: number = (this.spinner as any)?.originalRect2D?.()?.getX?.() ?? NaN;

      if (SettingsExhibition.exhibitionVersion) {
        const newX = drawPosnX + 30;
        if (this.spinner === null || spinnerOrigX !== newX) {
          import("../../../../../awt/index.js").then(({ Rectangle2D }) => {
            this.spinner = new Spinner(new Rectangle2D.Double(newX, drawPosnY, r, r));
          }).catch(() => { /* ignore */ });
        }
      } else {
        if (this.spinner === null || spinnerOrigX !== drawPosnX) {
          import("../../../../../awt/index.js").then(({ Rectangle2D }) => {
            this.spinner = new Spinner(new Rectangle2D.Double(drawPosnX, drawPosnY, r, r));
          }).catch(() => { /* ignore */ });
        }
      }
    }

    if (this.spinner !== null) {
      if (
        context.state().mover() === this.playerId &&
        this.app.manager().aiSelected()[this.app.manager().playerToAgent(this.playerId)]?.menuItemName() !== "Human" &&
        this.app.manager().liveAIs() != null &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.app.manager().liveAIs() as unknown[]).length > 0
      ) {
        this.spinner.startSpinner();
      } else {
        this.spinner.stopSpinner();
      }

      this.spinner.drawSpinner(g2d);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Check if the mouse position is over any items that have hover colours.
   * @java PlayerViewUser#mouseOverAt(Point)
   */
  public override mouseOverAt(pixel: { x: number; y: number }): void {
    const pt = new Point(pixel.x, pixel.y);

    // Check if mouse is over player swatch.
    for (let i = 0; i < this.app.playerSwatchList().length; i++) {
      const rectangle: Rectangle = this.app.playerSwatchList()[i];
      if (rectangle == null) continue;
      const overlap: boolean = GUIUtil.pointOverlapsRectangle(pt, rectangle);

      if (this.app.playerSwatchHover()[i] !== overlap) {
        this.app.playerSwatchHover()[i] = overlap;
        this.app.repaint(rectangle);
      }
    }

    // Check if mouse is over player name.
    for (let i = 0; i < this.app.playerNameList().length; i++) {
      const rectangle: Rectangle = this.app.playerNameList()[i];
      if (rectangle == null) continue;
      const overlap: boolean = GUIUtil.pointOverlapsRectangle(pt, rectangle);

      if (this.app.playerNameHover()[i] !== overlap) {
        this.app.playerNameHover()[i] = overlap;
        this.app.repaint(rectangle);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Gets the complete string to be printed for this player, including name, score, algorithm, etc.
   * @java PlayerViewUser#getNameAndExtrasString(Context, Graphics2D)
   */
  public getNameAndExtrasString(context: Context, g2d: Graphics2D): string {
    const instanceContext: Context = context.currentInstanceContext();
    const instance = instanceContext.game();

    const playerIndex: number = this.app.manager().playerToAgent(this.playerId);
    const playerNameFont: Font = g2d.getFont();

    let strName: string = String(this.app.manager().aiSelected()[playerIndex].name());

    // If Metadata overrides this, include this metadata name.
    const metadataName: string | null =
      context.game().metadata().graphics().playerName(context, playerIndex);
    if (metadataName != null) {
      strName += " (" + metadataName + ")";
    }

    let strExtras = "";
    let strAIName = "";

    const selectedAI = this.app.manager().aiSelected()[playerIndex];
    if (selectedAI?.ai() != null) {
      strAIName += " (" + String(selectedAI.ai().friendlyName) + ") ";
    }

    if (selectedAI?.ai() != null && SettingsExhibition.exhibitionVersion) {
      strName = "AI";
      strAIName = "";
    }

    // Score.
    const scoreDisplayInfo = instance.metadata().graphics().scoreDisplayInfo(instanceContext, this.playerId);
    if (scoreDisplayInfo.scoreReplacement() != null) {
      const showScore: string = String(scoreDisplayInfo.showScore());
      if (showScore === "Always" || (showScore === "AtEnd" && instanceContext.trial().over())) {
        const replacementScoreFunction = scoreDisplayInfo.scoreReplacement();
        replacementScoreFunction.preprocess(instance);
        const replacementScore: number = replacementScoreFunction.eval(instanceContext) as number;
        strExtras += " (" + replacementScore;
      }
    } else {
      // game.gameFlags() is a long in Java; in TS it's a bigint or number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gameFlags: bigint = BigInt((instance.gameFlags() as any) ?? 0);
      if ((gameFlags & GAME_TYPE_SCORE) !== 0n) {
        const showScore: string = String(scoreDisplayInfo.showScore());
        if (showScore === "Always" || (showScore === "AtEnd" && instanceContext.trial().over())) {
          strExtras += " (" + String(instanceContext.score(this.playerId));
        }
      }
    }
    strExtras += String(scoreDisplayInfo.scoreSuffix() ?? "");

    if (context.isAMatch()) {
      if (strExtras === "") {
        strExtras += " (";
      } else {
        strExtras += " : ";
      }
      strExtras += String(context.score(this.playerId));
    }

    if (strExtras !== "") {
      strExtras += ")";
    }

    if (this.app.contextSnapshot().getContext(this.app).game().requiresBet()) {
      strExtras += " $" + String(context.state().amount(this.playerId));
    }

    if (this.app.contextSnapshot().getContext(this.app).game().requiresTeams()) {
      strExtras += " Team " + String(this.app.contextSnapshot().getContext(this.app).state().getTeam(this.playerId));
    }

    const timeRemaining: number =
      this.app.manager().settingsNetwork().playerTimeRemaining()[
        this.app.manager().playerToAgent(this.playerId) - 1
      ];
    if (timeRemaining > 0) {
      strExtras +=
        " Time: " +
        String(this.app.manager().settingsNetwork().playerTimeRemaining()[
          this.app.contextSnapshot().getContext(this.app).state().playerToAgent(this.playerId) - 1
        ]) +
        "s";
    }

    strName += strAIName;

    // Cut string off at a specified pixel width.
    const maxLengthPixels = g2d.getFont().getSize() > 20 ? 250 : 200;
    let shortenedString = "";
    for (let i = 0; i < strName.length; i++) {
      shortenedString += strName.charAt(i);
      const stringWidth = Math.trunc(
        fontStringBounds(playerNameFont, shortenedString).getWidth(),
      );
      if (stringWidth > maxLengthPixels) {
        shortenedString = shortenedString.substring(0, i - 2) + "...";
        strName = shortenedString;
        break;
      }
    }

    return strName + strExtras;
  }

  // -------------------------------------------------------------------------

  /**
   * Returns all the players who are winners, can be multiple if a team game.
   * @java PlayerViewUser#getWinnerNumbers(Context)
   */
  private static getWinnerNumbers(context: Context): number[] {
    const game = context.game();
    const winnerNumbers: number[] = [];
    const firstWinner: number =
      context.trial().status() == null ? 0 : (context.trial().status().winner() as number);
    if (game.requiresTeams()) {
      const winningTeam: number = context.state().getTeam(firstWinner) as number;
      for (let i = 1; i < game.players().size(); i++) {
        if ((context.state().getTeam(i) as number) === winningTeam) {
          winnerNumbers.push(i);
        }
      }
    } else {
      winnerNumbers.push(firstWinner);
    }
    return winnerNumbers;
  }

  // -------------------------------------------------------------------------

  /**
   * Determine the hand container associated with this view.
   * @java PlayerViewUser#determineHand(Equipment)
   */
  private determineHand(equipment: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containers = (equipment as any).containers() as Container[];
    for (let i = 0; i < containers.length; i++) {
      const c = containers[i];
      if (c != null && c.isHand() && (c.owner() as number) === this.playerId) {
        this.hand = c;
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java PlayerViewUser#containerIndex()
   */
  public override containerIndex(): number {
    if (this.hand === null) return -1;
    return this.hand.index() as number;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Player index.
   * @java PlayerViewUser#playerId()
   */
  public getPlayerId(): number {
    return this.playerId;
  }
}
