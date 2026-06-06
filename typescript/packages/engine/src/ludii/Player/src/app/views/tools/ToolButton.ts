// @java Player/src/app/views/tools/ToolButton.java

import { Color, Graphics2D, Rectangle } from "../../../../../awt/index.js";
import { SettingsExhibition } from "../../utils/SettingsExhibition.js";

// ---------------------------------------------------------------------------
// Escape-hatch types
// ---------------------------------------------------------------------------

/** @java app.PlayerApp */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PlayerApp = any;

// ---------------------------------------------------------------------------

/**
 * Tool panel button.
 *
 * @author Matthew.Stephenson and cambolbro
 * @java app.views.tools.ToolButton
 */
export abstract class ToolButton {

  protected readonly app: PlayerApp;

  /** Button name. @java ToolButton#name */
  protected name: string = "?";

  /** Default Button colour. @java ToolButton#buttonColour */
  protected static buttonColour: Color = new Color(50, 50, 50);

  /** Rollover button colour. @java ToolButton#rolloverButtonColour */
  protected static rolloverButtonColour: Color = new Color(127, 127, 127);

  /** Default grayed out / invalid Button colour. @java ToolButton#invalidButtonColour */
  protected static invalidButtonColour: Color = new Color(220, 220, 220);

  /** Rectangle bounding box for button. @java ToolButton#rect */
  protected rect: Rectangle = new Rectangle();

  /** Whether or not a mouse is over the button. @java ToolButton#mouseOver */
  protected mouseOver_: boolean = false;

  /** Tooltip message for when cursor is over this button. @java ToolButton#tooltipMessage */
  protected tooltipMessage: string = "Default Message";

  /** @java ToolButton#buttonIndex */
  public buttonIndex: number = -1;

  // -------------------------------------------------------------------------

  /**
   * @java ToolButton(PlayerApp, String, int, int, int, int, int)
   */
  constructor(
    app: PlayerApp,
    name: string,
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    buttonIndex: number,
  ) {
    this.app = app;
    this.name = name;
    this.buttonIndex = buttonIndex;

    this.rect.x = cx;
    this.rect.y = cy;
    this.rect.width = sx;
    this.rect.height = sy;

    if (SettingsExhibition.exhibitionVersion) {
      ToolButton.buttonColour = new Color(220, 220, 220);
      ToolButton.invalidButtonColour = new Color(100, 100, 100);
      this.rect.width *= 2;
      this.rect.height *= 2;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return Button name.
   * @java ToolButton#name()
   */
  public getName(): string {
    return this.name;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ToolButton#setPosition(int, int)
   */
  public setPosition(x: number, y: number): void {
    this.rect.x = x;
    this.rect.y = y;
  }

  /**
   * Scale toolbar buttons depending on type of device.
   * @return 2 for mobile device, 1 for everything else.
   * @java ToolButton#scaleForDevice()
   */
  public scaleForDevice(): number {
    // Based on default toolbar height for desktop player of 32 pixels.
    return this.rect.getHeight() / 32.0;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ToolButton#draw(Graphics2D)
   */
  public abstract draw(g2d: Graphics2D): void;

  // -------------------------------------------------------------------------

  /**
   * Execute the button press.
   * @java ToolButton#press()
   */
  public abstract press(): void;

  // -------------------------------------------------------------------------

  /**
   * @param x X screen pixel.
   * @param y Y screen pixel.
   * @return Whether the specified point hits this button.
   * @java ToolButton#hit(int, int)
   */
  public hit(x: number, y: number): boolean {
    return (
      x >= this.rect.x &&
      x <= this.rect.x + this.rect.width &&
      y >= this.rect.y &&
      y <= this.rect.y + this.rect.height
    );
  }

  // -------------------------------------------------------------------------

  /**
   * Set if the mouse if over the button.
   * @java ToolButton#setMouseOver(boolean)
   */
  public setMouseOver(b: boolean): void {
    this.mouseOver_ = b;
  }

  /**
   * If the mouse cursor is over the button.
   * @java ToolButton#mouseOver()
   */
  public mouseOver(): boolean {
    return this.mouseOver_;
  }

  /**
   * The bounding box of the button.
   * @java ToolButton#rect()
   */
  public rect_(): Rectangle {
    return this.rect;
  }

  /**
   * The tooltip message when the cursor hovers over the button.
   * @java ToolButton#tooltipMessage()
   */
  public tooltipMessage_(): string {
    return this.tooltipMessage;
  }

  /**
   * If the button is enabled and can be pressed. True by default.
   * @java ToolButton#isEnabled()
   */
  protected isEnabled(): boolean {
    return true;
  }

  // -------------------------------------------------------------------------

  /**
   * Set temporary message to all legal actions.
   * @java ToolButton#showPossibleMovesTemporaryMessage()
   */
  protected showPossibleMovesTemporaryMessage(): void {
    const context = this.app.contextSnapshot().getContext(this.app);
    const legal = context.moves(context);
    const allOtherMoveDescriptions: string[] = [];
    for (const move of legal.moves()) {
      for (let i = 0; i < move.actions().size(); i++) {
        if (move.actions().get(i).isDecision()) {
          const decisionAction = move.actions().get(i);
          const desc: string = decisionAction.getDescription();
          if (!allOtherMoveDescriptions.includes(desc)) {
            allOtherMoveDescriptions.push(desc);
          }
          break;
        }
      }
    }
    if (allOtherMoveDescriptions.length > 0) {
      let tempMessageString = "You may ";
      if (legal.moves().size() === 1) {
        tempMessageString = "You must ";
      }
      for (const s of allOtherMoveDescriptions) {
        tempMessageString += s + " or ";
      }
      tempMessageString = tempMessageString.substring(0, tempMessageString.length - 4);
      tempMessageString += ".";
      this.app.setTemporaryMessage(tempMessageString);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * The colour of the button.
   * @java ToolButton#getButtonColour()
   */
  protected getButtonColour(): Color {
    if (this.isEnabled()) {
      if (this.mouseOver_) {
        return ToolButton.rolloverButtonColour;
      } else {
        return ToolButton.buttonColour;
      }
    } else {
      return ToolButton.invalidButtonColour;
    }
  }
}
