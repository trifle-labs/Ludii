// @java Common/src/graphics/svg/element/shape/Shape.java

import { Color } from '../../../../../../awt/Color.js';
import type { Graphics2D } from '../../../../../../awt/Graphics2D.js';
import { Rectangle2D } from '../../../../../../awt/geom/Rectangle2D.js';

// BaseElement and Element are ported by batch Common#0; use structural stubs here.
/** @java graphics.svg.element.Element */
export interface Element {
  label(): string;
  style(): ElementStyle;
  compare(other: Element): number;
  newInstance(): Element | null;
  newOne(): Element;
  load(expr: string): boolean;
  render(
    g2d: Graphics2D,
    x0: number,
    y0: number,
    footprintColour: Color | null,
    fillColour: Color | null,
    strokeColour: Color | null,
  ): void;
}

/** @java graphics.svg.element.Style (paint style) */
export interface ElementStyle {
  stroke(): Color | null;
  setStroke(clr: Color): void;
  fill(): Color | null;
  setFill(clr: Color): void;
  strokeWidth(): number;
  setStrokeWidth(val: number): void;
  load(expr: string): boolean;
}

/** Minimal implementation of Style used by shapes (mirrors graphics.svg.element.Style). */
class ShapeStyle implements ElementStyle {
  private _stroke: Color | null = null;
  private _fill: Color | null = null;
  private _strokeWidth: number = 0;

  stroke(): Color | null { return this._stroke; }
  setStroke(clr: Color): void { this._stroke = clr; }
  fill(): Color | null { return this._fill; }
  setFill(clr: Color): void { this._fill = clr; }
  strokeWidth(): number { return this._strokeWidth; }
  setStrokeWidth(val: number): void { this._strokeWidth = val; }

  load(expr: string): boolean {
    let str = expr.replace(/:/g, '=');
    str = str.replace(/"/g, ' ');
    str = str.replace(/,/g, ' ');
    str = str.replace(/;/g, ' ');

    const strokePos = str.indexOf('stroke=');
    if (strokePos !== -1) {
      const result = extractStringAt(str, strokePos + 7);
      if (result !== null) {
        const c = namedColour(result);
        if (c !== null) this._stroke = c;
        else if (result.includes('#')) {
          const c2 = colourFromCode(result);
          if (c2 !== null) this._stroke = c2;
        }
      }
    }

    const fillPos = str.indexOf('fill=');
    if (fillPos !== -1) {
      const result = extractStringAt(str, fillPos + 5);
      if (result !== null) {
        if (result === 'transparent') {
          this._fill = null;
        } else {
          const c = namedColour(result);
          if (c !== null) this._fill = c;
          else if (result.includes('#')) {
            const c2 = colourFromCode(result);
            if (c2 !== null) this._fill = c2;
          }
        }
      }
    }

    if (str.includes('stroke-width=')) {
      const result = extractDoubleFromHeading(str, 'stroke-width=');
      if (result !== null) this._strokeWidth = result;
    }

    return true;
  }
}

function namedColour(name: string): Color | null {
  switch (name) {
    case 'red':    return new Color(255, 0, 0);
    case 'green':  return new Color(0, 175, 0);
    case 'blue':   return new Color(0, 0, 255);
    case 'white':  return new Color(255, 255, 255);
    case 'black':  return new Color(0, 0, 0);
    case 'orange': return new Color(255, 175, 0);
    case 'yellow': return new Color(255, 240, 0);
    default: return null;
  }
}

function colourFromCode(strIn: string): Color | null {
  const str = strIn.replace(/"/g, '').trim();
  if (str.charAt(0) !== '#' || str.length !== 7) return null;
  const values: number[] = new Array(7).fill(0) as number[];
  for (let c = 1; c < str.length; c++) {
    const ch = str.charAt(c).toLowerCase();
    if (ch >= '0' && ch <= '9') values[c] = ch.charCodeAt(0) - '0'.charCodeAt(0);
    else if (ch >= 'a' && ch <= 'f') values[c] = ch.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
    else return null;
  }
  const r = ((values[1] ?? 0) << 4) | (values[2] ?? 0);
  const g = ((values[3] ?? 0) << 4) | (values[4] ?? 0);
  const b = ((values[5] ?? 0) << 4) | (values[6] ?? 0);
  return new Color(r, g, b);
}

function extractStringAt(str: string, pos: number): string | null {
  const sb: string[] = [];
  if (str.charAt(pos) === '"') {
    for (let c = pos + 1; c < str.length && str.charAt(c) !== '"'; c++)
      sb.push(str.charAt(c));
  } else {
    for (let c = pos; c < str.length && str.charAt(c) !== ';' && str.charAt(c) !== ' ' && str.charAt(c) !== '"'; c++)
      sb.push(str.charAt(c));
  }
  return sb.join('');
}

function extractDoubleFromHeading(str: string, heading: string): number | null {
  const pos = str.indexOf(heading);
  if (pos === -1) return null;
  const start = pos + heading.length;
  let c = start;
  while (c < str.length && !isNumeric(str.charAt(c))) c++;
  let cc = c + 1;
  while (cc < str.length && isNumeric(str.charAt(cc))) cc++;
  const sub = str.substring(c, cc);
  const result = parseFloat(sub);
  return isNaN(result) ? null : result;
}

function isNumeric(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
}

// -----------------------------------------------------------------------------

/**
 * Base class for SVG shapes. Shapes are scoped by angled brackets.
 *
 * @java graphics/svg/element/shape/Shape.java
 * @author cambolbro
 */
export abstract class Shape implements Element {
  /** @java BaseElement.label */
  private readonly _label: string;

  /** @java BaseElement.filePos */
  private _filePos: number = 0;

  /** @java BaseElement.style */
  protected readonly _style: ShapeStyle = new ShapeStyle();

  /** @java BaseElement.bounds */
  protected readonly _bounds: Rectangle2D.Double = new Rectangle2D.Double();

  // ---------------------------------------------------------------------------

  /** @java Shape(String) */
  public constructor(label: string) {
    this._label = label;
  }

  // ---------------------------------------------------------------------------

  /** @java BaseElement.label() */
  public label(): string {
    return this._label;
  }

  /** @java BaseElement.compare(Element) */
  public compare(other: Element): number {
    return this._filePos - (other as unknown as { _filePos: number })._filePos;
  }

  /** @java BaseElement.filePos() */
  public filePos(): number {
    return this._filePos;
  }

  /** @java BaseElement.setFilePos(int) */
  public setFilePos(pos: number): void {
    this._filePos = pos;
  }

  /** @java BaseElement.style() */
  public style(): ElementStyle {
    return this._style;
  }

  /** @java Shape.bounds() */
  public bounds(): Rectangle2D.Double {
    return this._bounds;
  }

  /** @java BaseElement.strokeWidth() — default implementation */
  public strokeWidth(): number {
    return 0;
  }

  // ---------------------------------------------------------------------------

  /** @java Shape.load(String) — loads style */
  public load(expr: string): boolean {
    return this._style.load(expr);
  }

  /** @java Shape.strokeWidth() */
  // (override in Shape to delegate to style)
  // Already defined above; subclasses that need style strokeWidth should override.

  // ---------------------------------------------------------------------------

  /** @java Shape.setBounds() — abstract */
  public abstract setBounds(): void;

  /** @java Element.newInstance() — abstract */
  public abstract newInstance(): Element | null;

  /** @java Element.newOne() — abstract */
  public abstract newOne(): Element;

  /** @java Element.render(...) — abstract */
  public abstract render(
    g2d: Graphics2D,
    x0: number,
    y0: number,
    footprintColour: Color | null,
    fillColour: Color | null,
    strokeColour: Color | null,
  ): void;

  // ---------------------------------------------------------------------------
}
