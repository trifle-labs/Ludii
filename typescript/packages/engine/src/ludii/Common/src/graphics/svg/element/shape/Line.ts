// @java Common/src/graphics/svg/element/shape/Line.java

import type { Color } from '../../../../../../awt/Color.js';
import type { Graphics2D } from '../../../../../../awt/Graphics2D.js';
import type { Element } from './Shape.js';
import { Shape } from './Shape.js';

// SVGParser is ported by batch Common#3; use a local structural stub.
function extractDouble(expr: string, _heading: string): number | null {
  let c = 0;
  while (c < expr.length && !isNumericChar(expr.charAt(c))) c++;
  let cc = c + 1;
  while (cc < expr.length && isNumericChar(expr.charAt(cc))) cc++;
  const sub = expr.substring(c, cc);
  const result = parseFloat(sub);
  return isNaN(result) ? null : result;
}

function isNumericChar(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
}

// -----------------------------------------------------------------------------

/**
 * SVG line shape.
 *
 * @java graphics/svg/element/shape/Line.java
 * @author cambolbro
 */
export class Line extends Shape {
  // Format: <line x1="0" y1="150" x2="400" y2="150" stroke-width="2" stroke="blue"/>

  /** @java Line.x1 */
  private _x1: number = 0;

  /** @java Line.y1 */
  private _y1: number = 0;

  /** @java Line.x2 */
  private _x2: number = 0;

  /** @java Line.y2 */
  private _y2: number = 0;

  // ---------------------------------------------------------------------------

  /** @java Line() */
  public constructor() {
    super('line');
  }

  // ---------------------------------------------------------------------------

  /** @java Line.x1() */
  public x1(): number { return this._x1; }

  /** @java Line.y1() */
  public y1(): number { return this._y1; }

  /** @java Line.x2() */
  public x2(): number { return this._x2; }

  /** @java Line.y2() */
  public y2(): number { return this._y2; }

  // ---------------------------------------------------------------------------

  /** @java Line.newInstance() */
  public override newInstance(): Element {
    return new Line();
  }

  // ---------------------------------------------------------------------------

  /** @java Line.setBounds() */
  public override setBounds(): void {
    const x = Math.min(this._x1, this._x2);
    const y = Math.min(this._y1, this._y2);
    const width = Math.max(this._x1, this._x2) - x;
    const height = Math.max(this._y1, this._y2) - y;

    this._bounds.setRect(x, y, width, height);
  }

  // ---------------------------------------------------------------------------

  /** @java Line.load(String) */
  public override load(expr: string): boolean {
    const okay = true;

    if (!super.load(expr))
      return false;

    if (expr.includes(' x1=')) {
      const result = extractDouble(expr, ' x1=');
      if (result === null) return false;
      this._x1 = result;
    }

    if (expr.includes(' y1=')) {
      const result = extractDouble(expr, ' y1=');
      if (result === null) return false;
      this._y1 = result;
    }

    if (expr.includes(' x2=')) {
      const result = extractDouble(expr, ' x2=');
      if (result === null) return false;
      this._x2 = result;
    }

    if (expr.includes(' y2=')) {
      const result = extractDouble(expr, ' y2=');
      if (result === null) return false;
      this._y2 = result;
    }

    return okay;
  }

  // ---------------------------------------------------------------------------

  /** @java Line.toString() */
  public override toString(): string {
    return (
      this.label() +
      ': fill=' + this._style.fill() +
      ', stroke=' + this._style.stroke() +
      ', strokeWidth=' + this._style.strokeWidth() +
      ' : x1=' + this._x1 + ', y1=' + this._y1 +
      ', x2=' + this._x2 + ', y2=' + this._y2
    );
  }

  // ---------------------------------------------------------------------------

  /** @java Line.render(Graphics2D, double, double, Color, Color, Color) */
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

  /** @java Line.newOne() */
  public override newOne(): Element {
    return new Line();
  }

  // ---------------------------------------------------------------------------
}
