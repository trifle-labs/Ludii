// @java Common/src/graphics/svg/element/shape/Polyline.java

import type { Color } from '../../../../../../awt/Color.js';
import type { Graphics2D } from '../../../../../../awt/Graphics2D.js';
import { Point2D } from '../../../../../../awt/geom/Point2D.js';
import type { Element } from './Shape.js';
import { Shape } from './Shape.js';

// -----------------------------------------------------------------------------

/**
 * SVG polyline shape.
 *
 * @java graphics/svg/element/shape/Polyline.java
 * @author cambolbro
 */
export class Polyline extends Shape {
  // Format: <polyline points="50,175 150,175 150,125 250,200" />

  /** @java Polyline.points */
  protected readonly _points: Point2D.Double[] = [];

  // ---------------------------------------------------------------------------

  /** @java Polyline() */
  public constructor();
  /** @java Polyline(String) */
  public constructor(label: string);
  public constructor(label: string = 'polyline') {
    super(label);
  }

  // ---------------------------------------------------------------------------

  /** @java Polyline.points() — returns unmodifiable view */
  public points(): readonly Point2D.Double[] {
    return this._points;
  }

  // ---------------------------------------------------------------------------

  /** @java Polyline.newInstance() */
  public override newInstance(): Element {
    return new Polyline();
  }

  // ---------------------------------------------------------------------------

  /** @java Polyline.setBounds() */
  public override setBounds(): void {
    let x0 =  10000;
    let y0 =  10000;
    let x1 = -10000;
    let y1 = -10000;

    for (const pt of this._points) {
      if (pt.x < x0) x0 = pt.x;
      if (pt.y < y0) y0 = pt.y;
      if (pt.x > x1) x1 = pt.x;
      if (pt.y > x1) y1 = pt.y;  // Java source bug: compares pt.y > x1 (faithfully reproduced)
    }

    this._bounds.setRect(x0, y0, x1 - x0, y1 - y0);
  }

  // ---------------------------------------------------------------------------

  /** @java Polyline.load(String) */
  public override load(expr: string): boolean {
    const okay = true;

    if (!super.load(expr))
      return false;

    const pos = expr.indexOf(' points="');

    let to = pos + 9;
    while (to < expr.length && expr.charAt(to) !== '"')
      to++;

    if (to >= expr.length) {
      console.log('* Failed to close points list in Polyline.');
      return false;
    }

    const subs = expr.substring(pos + 9, to).split(' ');
    for (let n = 0; n < subs.length - 1; n += 2) {
      const x = parseFloat(subs[n] ?? '0');
      const y = parseFloat(subs[n + 1] ?? '0');
      this._points.push(new Point2D.Double(x, y));
    }

    return okay;
  }

  // ---------------------------------------------------------------------------

  /** @java Polyline.toString() */
  public override toString(): string {
    const sb: string[] = [];
    sb.push(
      this.label() +
      ': fill=' + this._style.fill() +
      ', stroke=' + this._style.stroke() +
      ', strokeWidth=' + this._style.strokeWidth(),
    );
    sb.push(' :');
    for (const pt of this._points)
      sb.push(' (' + pt.x + ',' + pt.y + ')');
    return sb.join('');
  }

  // ---------------------------------------------------------------------------

  /** @java Polyline.render(Graphics2D, double, double, Color, Color, Color) */
  public override render(
    _g2d: Graphics2D,
    _x0: number,
    _y0: number,
    _footprintColour: Color | null,
    _fillColour: Color | null,
    _strokeColour: Color | null,
  ): void {
    // ...
  }

  /** @java Polyline.newOne() */
  public override newOne(): Element {
    return new Polyline();
  }

  // ---------------------------------------------------------------------------
}
