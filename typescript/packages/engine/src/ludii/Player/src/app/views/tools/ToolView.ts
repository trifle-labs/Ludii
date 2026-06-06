// @java Player/src/app/views/tools/ToolView.java

import { Color, Graphics2D } from "../../../../../awt/index.js";
import { View, type PlayerApp } from "../View.js";
import { ToolButton } from "./ToolButton.js";
import { ButtonStart } from "./buttons/ButtonStart.js";
import { ButtonPlayPause } from "./buttons/ButtonPlayPause.js";
import { ButtonEnd } from "./buttons/ButtonEnd.js";
import { SettingsExhibition } from "../../utils/SettingsExhibition.js";
import { FullLocation } from "../../../../../../ludemes/other/location/FullLocation.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported deps (batch-37 buttons, GameUtil, etc.)
// ---------------------------------------------------------------------------

/** @java app.views.tools.buttons.ButtonBack (batch 37) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyButton = any;

/** @java main.Constants.UNDEFINED */
const UNDEFINED = -1;

// ---------------------------------------------------------------------------

/**
 * View showing the tool buttons.
 *
 * @author Matthew.Stephenson and cambolbro
 * @java app.views.tools.ToolView
 */
export class ToolView extends View {

  /** List of buttons. @java ToolView#buttons */
  public buttons: (ToolButton | null)[] = [];

  /** @java ToolView.START_BUTTON_INDEX */
  public static readonly START_BUTTON_INDEX: number = 0;
  /** @java ToolView.BACK_BUTTON_INDEX */
  public static readonly BACK_BUTTON_INDEX: number = 1;
  /** @java ToolView.PLAY_BUTTON_INDEX */
  public static readonly PLAY_BUTTON_INDEX: number = 2;
  /** @java ToolView.FORWARD_BUTTON_INDEX */
  public static readonly FORWARD_BUTTON_INDEX: number = 3;
  /** @java ToolView.END_BUTTON_INDEX */
  public static readonly END_BUTTON_INDEX: number = 4;
  /** @java ToolView.PASS_BUTTON_INDEX */
  public static readonly PASS_BUTTON_INDEX: number = 5;
  /** @java ToolView.OTHER_BUTTON_INDEX */
  public static readonly OTHER_BUTTON_INDEX: number = 6;
  /** @java ToolView.SHOW_BUTTON_INDEX */
  public static readonly SHOW_BUTTON_INDEX: number = 7;
  /** @java ToolView.SETTINGS_BUTTON_INDEX */
  public static readonly SETTINGS_BUTTON_INDEX: number = 8;
  /** @java ToolView.INFO_BUTTON_INDEX */
  public static readonly INFO_BUTTON_INDEX: number = 9;
  /** @java ToolView.QUIT_BUTTON_INDEX */
  public static readonly QUIT_BUTTON_INDEX: number = 10;

  // -------------------------------------------------------------------------

  /**
   * @java ToolView(PlayerApp, boolean)
   */
  constructor(app: PlayerApp, portraitMode: boolean) {
    super(app);

    let toolHeight = 40;

    if (portraitMode && app.manager().isWebApp()) {
      toolHeight = 80;
    }

    let boardSize = app.height();
    let startX = boardSize;
    let startY = app.height() - toolHeight;
    let width = app.width() - boardSize - toolHeight;

    if (SettingsExhibition.exhibitionVersion) {
      startX = 450;
      startY = 950;
    }

    if (portraitMode) {
      boardSize = app.width();
      startX = 0;
      startY = boardSize + 8;
      width = app.width() - toolHeight;
    }

    this.placement.setRect(startX, startY, width, toolHeight);
    this.drawButtons(toolHeight);
  }

  // -------------------------------------------------------------------------

  /**
   * @java ToolView#drawButtons(int)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public drawButtons(_toolHeight: number): void {
    let cx = this.placement.x;
    const cy = this.placement.y;

    const sx = this.placement.height - 8;
    const sy = this.placement.height - 8;

    this.buttons.push(new ButtonStart(this.app, cx, cy, sx, sy, ToolView.START_BUTTON_INDEX));

    // ButtonBack — batch 37, escape-hatch via globalThis registry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ButtonBackCtor = (globalThis as any).__LudiiButtons?.ButtonBack as (new (app: PlayerApp, cx: number, cy: number, sx: number, sy: number, idx: number) => AnyButton) | undefined;
    this.buttons.push(ButtonBackCtor != null ? new ButtonBackCtor(this.app, cx, cy, sx, sy, ToolView.BACK_BUTTON_INDEX) as unknown as ToolButton : null);

    this.buttons.push(new ButtonPlayPause(this.app, cx, cy, sx, sy, ToolView.PLAY_BUTTON_INDEX));

    // ButtonForward — batch 37
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ButtonForwardCtor = (globalThis as any).__LudiiButtons?.ButtonForward as (new (app: PlayerApp, cx: number, cy: number, sx: number, sy: number, idx: number) => AnyButton) | undefined;
    this.buttons.push(ButtonForwardCtor != null ? new ButtonForwardCtor(this.app, cx, cy, sx, sy, ToolView.FORWARD_BUTTON_INDEX) as unknown as ToolButton : null);

    this.buttons.push(new ButtonEnd(this.app, cx, cy, sx, sy, ToolView.END_BUTTON_INDEX));

    // ButtonPass — batch 37
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ButtonPassCtor = (globalThis as any).__LudiiButtons?.ButtonPass as (new (app: PlayerApp, cx: number, cy: number, sx: number, sy: number, idx: number) => AnyButton) | undefined;
    this.buttons.push(ButtonPassCtor != null ? new ButtonPassCtor(this.app, cx, cy, sx, sy, ToolView.PASS_BUTTON_INDEX) as unknown as ToolButton : null);

    if (!SettingsExhibition.exhibitionVersion) {
      const context = this.app.manager().ref().context();
      if (ToolView.otherButtonShown(context)) {
        // ButtonOther — batch 37
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ButtonOtherCtor = (globalThis as any).__LudiiButtons?.ButtonOther as (new (app: PlayerApp, cx: number, cy: number, sx: number, sy: number, idx: number) => AnyButton) | undefined;
        this.buttons.push(ButtonOtherCtor != null ? new ButtonOtherCtor(this.app, cx, cy, sx, sy, ToolView.OTHER_BUTTON_INDEX) as unknown as ToolButton : null);
      } else {
        this.buttons.push(null); // spacer
      }

      // ButtonShow — batch 37
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ButtonShowCtor = (globalThis as any).__LudiiButtons?.ButtonShow as (new (app: PlayerApp, cx: number, cy: number, sx: number, sy: number, idx: number) => AnyButton) | undefined;
      this.buttons.push(ButtonShowCtor != null ? new ButtonShowCtor(this.app, cx, cy, sx, sy, ToolView.SHOW_BUTTON_INDEX) as unknown as ToolButton : null);

      if (!this.app.manager().isWebApp()) {
        // ButtonSettings — batch 37
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ButtonSettingsCtor = (globalThis as any).__LudiiButtons?.ButtonSettings as (new (app: PlayerApp, cx: number, cy: number, sx: number, sy: number, idx: number) => AnyButton) | undefined;
        this.buttons.push(ButtonSettingsCtor != null ? new ButtonSettingsCtor(this.app, cx, cy, sx, sy, ToolView.SETTINGS_BUTTON_INDEX) as unknown as ToolButton : null);

        // ButtonInfo — batch 37
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ButtonInfoCtor = (globalThis as any).__LudiiButtons?.ButtonInfo as (new (app: PlayerApp, cx: number, cy: number, sx: number, sy: number, idx: number) => AnyButton) | undefined;
        this.buttons.push(ButtonInfoCtor != null ? new ButtonInfoCtor(this.app, cx, cy, sx, sy, ToolView.INFO_BUTTON_INDEX) as unknown as ToolButton : null);
      }
    } else {
      // ButtonQuit — batch 37
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ButtonQuitCtor = (globalThis as any).__LudiiButtons?.ButtonQuit as (new (app: PlayerApp, cx: number, cy: number, sx: number, sy: number, idx: number) => AnyButton) | undefined;
      this.buttons.push(ButtonQuitCtor != null ? new ButtonQuitCtor(this.app, cx, cy, sx, sy, ToolView.QUIT_BUTTON_INDEX) as unknown as ToolButton : null);
    }

    let spacing = this.placement.width / this.buttons.length;
    if (SettingsExhibition.exhibitionVersion) {
      spacing = 50;
    }

    for (let b = 0; b < this.buttons.length; b++) {
      const btn = this.buttons[b];
      if (btn === null || btn === undefined) continue;

      cx = this.placement.x + Math.trunc((b + 0.25) * spacing) + 10;
      btn.setPosition(cx, cy);

      // Don't show any buttons except the pass and reset buttons in exhibition version.
      if (
        SettingsExhibition.exhibitionVersion &&
        btn.buttonIndex !== ToolView.PASS_BUTTON_INDEX &&
        btn.buttonIndex !== ToolView.START_BUTTON_INDEX
      ) {
        btn.setPosition(-1000, -1000);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java ToolView#paint(Graphics2D)
   */
  public override paint(g2d: Graphics2D): void {
    for (const button of this.buttons) {
      if (button !== null && button !== undefined) {
        button.draw(g2d);
      }
    }
    this.paintDebug(g2d, Color.BLUE);
  }

  // -------------------------------------------------------------------------

  /**
   * Handle click on tool panel.
   * @java ToolView#clickAt(Point)
   */
  public clickAt(pixel: { x: number; y: number }): void {
    for (const button of this.buttons) {
      if (button !== null && button !== undefined && button.hit(pixel.x, pixel.y)) {
        button.press();
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java ToolView#mouseOverAt(Point)
   */
  public override mouseOverAt(pixel: { x: number; y: number }): void {
    for (const button of this.buttons) {
      if (button === null || button === undefined) continue;

      if (button.hit(pixel.x, pixel.y)) {
        if (!button.mouseOver()) {
          button.setMouseOver(true);
          this.app.repaint(button.rect_());
        }
      } else {
        if (button.mouseOver()) {
          button.setMouseOver(false);
          this.app.repaint(button.rect_());
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java ToolView#jumpToMove(PlayerApp, int)
   */
  public static jumpToMove(app: PlayerApp, moveToJumpTo: number): void {
    app.manager().settingsManager().setAgentsPaused(app.manager(), true);
    app.settingsPlayer().setWebGameResultValid(false);

    const context = app.manager().ref().context();

    // Store the previous saved trial, and reload it after resetting the game.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completeMoves: unknown[] = context.trial().generateCompleteMovesList() as unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const undoneMoves: unknown[] = [...(app.manager().undoneMoves() as any)];
    const allMoves: unknown[] = [...completeMoves, ...undoneMoves];

    // GameUtil.resetGame(app, true) — escape-hatch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GameUtilMod = (globalThis as any).__LudiiGameUtil;
    if (GameUtilMod?.resetGame) {
      GameUtilMod.resetGame(app, true);
    }
    app.manager().settingsManager().setAgentsPaused(app.manager(), true);

    const moveToJumpToWithSetup: number =
      moveToJumpTo === 0
        ? context.currentInstanceContext().trial().numInitialPlacementMoves()
        : moveToJumpTo;

    const newDoneMoves = allMoves.slice(0, moveToJumpToWithSetup);
    const newUndoneMoves = allMoves.slice(moveToJumpToWithSetup);

    app.manager().ref().makeSavedMoves(app.manager(), newDoneMoves);
    app.manager().setUndoneMoves(newUndoneMoves);

    // This is just a tiny bit hacky, but makes sure MCTS won't reuse incorrect tree after going back in Trial.
    context.game().incrementGameStartCount();

    app.bridge().settingsVC().setSelectedFromLocation(new FullLocation(UNDEFINED));

    // GameUtil.resetUIVariables(app) — escape-hatch
    if (GameUtilMod?.resetUIVariables) {
      GameUtilMod.resetUIVariables(app);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return If the Other button should be shown for this game.
   * @java ToolView#otherButtonShown(Context)
   */
  private static otherButtonShown(context: unknown): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const game = (context as any).game();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const booleanConcepts = game.booleanConcepts() as { get(id: unknown): boolean };

    // Concept enum — escape-hatch: resolve at runtime via globalThis
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ConceptEnum = (globalThis as any).__LudiiConcept as Record<string, { id(): number }> | undefined;

    const check = (name: string): boolean => {
      if (ConceptEnum != null) {
        const c = ConceptEnum[name];
        if (c != null) return booleanConcepts.get(c.id());
      }
      return false;
    };

    if (check("BetDecision")) return true;
    if (check("VoteDecision")) return true;
    if (check("SetNextPlayer")) return true;
    if (check("ChooseTrumpSuitDecision")) return true;
    if (check("SwapOption")) return true;
    if (check("SwapPlayersDecision")) return true;
    if (check("ProposeDecision")) return true;
    return false;
  }

  // -------------------------------------------------------------------------
}
