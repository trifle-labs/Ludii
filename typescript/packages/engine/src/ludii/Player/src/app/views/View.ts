// @java Player/src/app/views/View.java

import { BasicStroke, Color, Graphics2D, Rectangle } from "../../../../awt/index.js";

// ---------------------------------------------------------------------------
// Escape-hatch types
// ---------------------------------------------------------------------------

/** @java app.PlayerApp */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PlayerApp = any;

// ---------------------------------------------------------------------------

/**
 * Abstract View concept for defining different sections of the Main Window.
 *
 * @author Matthew.Stephenson and cambolbro
 * @java app.views.View
 */
export abstract class View {

  /** Panel's placement. @java View#placement */
  public placement: Rectangle;

  private readonly debug: boolean = false;

  protected readonly app: PlayerApp;

  // -------------------------------------------------------------------------

  /**
   * @java View(PlayerApp)
   */
  constructor(app: PlayerApp) {
    this.placement = new Rectangle(0, 0, app.width(), app.height());
    this.app = app;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Panel's placement.
   * @java View#placement()
   */
  public placement_(): Rectangle {
    return this.placement;
  }

  /**
   * @java View#setPlacement(Rectangle)
   */
  public setPlacement(rect: Rectangle): void {
    this.placement = new Rectangle(rect.x, rect.y, rect.width, rect.height);
  }

  /** Convenience: width accessor used by subclasses (mirrors Java's Rectangle.width). */
  public get width(): number { return this.placement.width; }
  /** Convenience: height accessor. */
  public get height(): number { return this.placement.height; }

  // -------------------------------------------------------------------------

  /**
   * Paint this panel.
   * @java View#paint(Graphics2D)
   */
  public abstract paint(g2d: Graphics2D): void;

  /**
   * Paint a debug rectangle around this panel.
   * @java View#paintDebug(Graphics2D, Color)
   */
  public paintDebug(g2d: Graphics2D, colour: Color): void {
    if (this.debug) {
      g2d.setColor(colour);
      g2d.setStroke(new BasicStroke(5, BasicStroke.CAP_SQUARE, BasicStroke.JOIN_MITER));
      g2d.drawRect(this.placement.x, this.placement.y, this.placement.width, this.placement.height);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return Index of the container associated with this view.
   * @java View#containerIndex()
   */
  public containerIndex(): number {
    return -1;
  }

  // -------------------------------------------------------------------------

  /**
   * Perform necessary functionality for cursor being on this View.
   * @java View#mouseOverAt(Point)
   */
  public mouseOverAt(_pt: { x: number; y: number }): void {
    // By default, do nothing.
  }
}
