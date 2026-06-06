// @java Common/src/graphics/svg/element/shape/Rect.java

import type { Color } from '../../../../../../awt/Color.js';
import type { Graphics2D } from '../../../../../../awt/Graphics2D.js';
import type { Element } from './Shape.js';
import { Shape } from './Shape.js';

// SVGParser is ported by batch Common#3; use a local structural stub.
/** @java graphics.svg.SVGParser */
interface ISVGParser {
  extractDouble(expr: string, heading: string): number | null;
  isNumeric(ch: string): boolean;
}

const SVGParser: ISVGParser = {
  extractDouble(expr: string, _heading: string): number | null {
    let c = 0;
    while (c < expr.length && !isNumericChar(expr.charAt(c))) c++;
    let cc = c + 1;
    while (cc < expr.length && isNumericChar(expr.charAt(cc))) cc++;
    const sub = expr.substring(c, cc);
    const result = parseFloat(sub);
    return isNaN(result) ? null : result;
  },
  isNumeric(ch: string): boolean {
    return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
  },
};

function isNumericChar(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
}

// -----------------------------------------------------------------------------

/**
 * SVG rectangle shape.
 *
 * @java graphics/svg/element/shape/Rect.java
 * @author cambolbro
 */
export class Rect extends Shape {
  // Formats:
  // <rect x="155" y="5" width="75" height="100"/>
  // <rect x="250" y="5" width="75" height="100" rx="30" ry="20" />

  /** @java Rect.x */
  private _x: number = 0;

  /** @java Rect.y */
  private _y: number = 0;

  /** @java Rect.width */
  private _width: number = 0;

  /** @java Rect.height */
  private _height: number = 0;

  /** @java Rect.rx */
  private _rx: number = 0;

  /** @java Rect.ry */
  private _ry: number = 0;

  // ---------------------------------------------------------------------------

  /** @java Rect() */
  public constructor() {
    super('rect');
  }

  // ---------------------------------------------------------------------------

  /** @java Rect.x() */
  public x(): number { return this._x; }

  /** @java Rect.y() */
  public y(): number { return this._y; }

  /** @java Rect.width() */
  public width(): number { return this._width; }

  /** @java Rect.height() */
  public height(): number { return this._height; }

  /** @java Rect.rx() */
  public rx(): number { return this._rx; }

  /** @java Rect.ry() */
  public ry(): number { return this._ry; }

  // ---------------------------------------------------------------------------

  /** @java Rect.newInstance() */
  public override newInstance(): Element {
    return new Rect();
  }

  // ---------------------------------------------------------------------------

  /** @java Rect.setBounds() */
  public override setBounds(): void {
    this._bounds.setRect(this._x, this._y, this._width, this._height);
  }

  // ---------------------------------------------------------------------------

  /** @java Rect.load(String) */
  public override load(expr: string): boolean {
    const okay = true;

    if (!super.load(expr))
      return false;

    if (expr.includes(' x=')) {
      const result = SVGParser.extractDouble(expr, ' x=');
      if (result === null) return false;
      this._x = result;
    }

    if (expr.includes(' y=')) {
      const result = SVGParser.extractDouble(expr, ' y=');
      if (result === null) return false;
      this._y = result;
    }

    if (expr.includes(' rx=')) {
      const result = SVGParser.extractDouble(expr, ' rx=');
      if (result === null) return false;
      this._rx = result;
    }

    if (expr.includes(' ry=')) {
      const result = SVGParser.extractDouble(expr, ' ry=');
      if (result === null) return false;
      this._ry = result;
    }

    if (expr.includes(' width=')) {
      const result = SVGParser.extractDouble(expr, ' width=');
      if (result === null) return false;
      this._width = result;
    }

    if (expr.includes(' height=')) {
      const result = SVGParser.extractDouble(expr, ' height=');
      if (result === null) return false;
      this._height = result;
    }

    return okay;
  }

  // ---------------------------------------------------------------------------

  /** @java Rect.toString() */
  public override toString(): string {
    return (
      this.label() +
      ': fill=' + this._style.fill() +
      ', stroke=' + this._style.stroke() +
      ', strokeWidth=' + this._style.strokeWidth() +
      ' : x=' + this._x + ', y=' + this._y +
      ', rx=' + this._rx + ', ry=' + this._ry +
      ', width=' + this._width + ', height=' + this._height
    );
  }

  // ---------------------------------------------------------------------------

  /** @java Rect.render(Graphics2D, double, double, Color, Color, Color) */
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

  /** @java Rect.newOne() */
  public override newOne(): Element {
    return new Rect();
  }

  // ---------------------------------------------------------------------------
}
