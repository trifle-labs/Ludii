// @java Player/src/app/utils/Spinner.java

import { Color, Graphics2D } from "../../../../awt/index.js";
import { Arc2D } from "../../../../awt/index.js";
import { Point2D } from "../../../../awt/index.js";
import { Rectangle2D } from "../../../../awt/index.js";
import { Rectangle } from "../../../../awt/index.js";

/**
 * Functions for the spinner graphic.
 *
 * @author cambolbro and matthew.stephenson
 * @java app.utils.Spinner
 */
export class Spinner {

  // ---------------------------------------------------------------------------
  // parameters relating to the spinning loading icon.

  /** @java Spinner#numPts */
  private numPts: number = 12;

  /** @java Spinner#dotRadius */
  private dotRadius: number = 1.5;

  /** @java Spinner#originalRect */
  private originalRect: Rectangle2D.Double = new Rectangle2D.Double();

  /** @java Spinner#spinRect */
  private readonly spinRect: Rectangle = new Rectangle();

  /** @java Spinner#spinPts */
  private readonly spinPts: Point2D.Double[] = [];

  /**
   * Swing javax.swing.Timer escape-hatch — represented as a numeric interval
   * id (from setInterval) or null when not running.
   * @java javax.swing.Timer
   */
  private spinTimer: ReturnType<typeof setInterval> | null = null;

  /** @java Spinner#spinTicks */
  spinTicks: number = -1;

  // ---------------------------------------------------------------------------

  /**
   * @java Spinner(Rectangle2D.Double)
   */
  constructor(bounds: Rectangle2D.Double) {
    this.originalRect = bounds;

    const r = Math.trunc(bounds.getWidth() / 2);
    const cx = Math.trunc(bounds.getX() + r);
    const cy = Math.trunc(bounds.getY() + r);

    for (let n = 0; n < this.numPts - 1; n++) {
      const t = n / (this.numPts - 1);
      const x = cx + r * Math.sin(t * 2 * Math.PI);
      const y = cy - r * Math.cos(t * 2 * Math.PI);
      this.spinPts.push(new Point2D.Double(x, y));
    }

    this.spinRect.setRect(cx - 2 * r, cy - 2 * r, 4 * r, 4 * r);
  }

  // ---------------------------------------------------------------------------

  /**
   * @java Spinner#startSpinner()
   */
  public startSpinner(): void {
    if (this.spinTimer !== null)
      return;

    this.spinTicks = 0;

    const ms = Math.trunc((1.0 / this.numPts) * 1000);
    this.spinTimer = setInterval(() => {
      this.spinTicks++;
    }, ms);
  }

  // ---------------------------------------------------------------------------

  /**
   * @java Spinner#stopSpinner()
   */
  public stopSpinner(): void {
    if (this.spinTimer !== null) {
      clearInterval(this.spinTimer);
      this.spinTimer = null;
    }
    this.spinTicks = -1;
  }

  // ---------------------------------------------------------------------------

  /**
   * @java Spinner#drawSpinner(Graphics2D)
   */
  public drawSpinner(g2d: Graphics2D): void {
    if (this.spinTicks < 0)
      return;

    for (let n = 0; n < this.numPts; n++) {
      const dotAt = this.spinTicks - n;
      if (dotAt < 0)
        continue;

      const pt = this.spinPts[dotAt % this.spinPts.length];
      if (pt === undefined) continue;
      const dot = new Arc2D.Double(
        pt.x - this.dotRadius,
        pt.y - this.dotRadius,
        2 * this.dotRadius + 1,
        2 * this.dotRadius + 1,
        0, 360,
        Arc2D.OPEN,
      );

      const t = Math.pow((this.numPts - n) / this.numPts, 3);
      const alpha = Math.trunc(t * 255);
      const dotColour = new Color(160, 160, 160, alpha);

      g2d.setColor(dotColour);
      g2d.fill(dot);
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * @java Spinner#originalRect()
   */
  public originalRect2D(): Rectangle2D.Double {
    return this.originalRect;
  }

  /**
   * @java Spinner#setDotRadius(double)
   */
  public setDotRadius(dotRadius: number): void {
    this.dotRadius = dotRadius;
  }

  /**
   * @java Spinner#setNumPts(int)
   */
  public setNumPts(numPts: number): void {
    this.numPts = numPts;
  }

  // ---------------------------------------------------------------------------
}
