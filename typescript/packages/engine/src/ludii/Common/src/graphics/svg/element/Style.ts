// @java Common/src/graphics/svg/element/Style.java

/**
 * Paint style for SVG element.
 *
 * @java graphics/svg/element/Style.java
 * @author cambolbro
 */

import { Color } from "../../../../../awt/Color.js";

// SVGParser helpers needed for load() — inlined here to avoid circular dep
// (SVGParser is in this same batch so will be available after compilation)
function svgExtractStringAt(str: string, pos: number): string | null {
  const sb: string[] = [];
  if (str.charAt(pos) === '"') {
    // Is a string, look for closing quote marks
    for (let c = pos + 1; c < str.length && str.charAt(c) !== '"'; c++)
      sb.push(str.charAt(c));
  } else {
    // Is not a string, look for other terminator
    for (let c = pos; c < str.length && str.charAt(c) !== ';' && str.charAt(c) !== ' ' && str.charAt(c) !== '"'; c++)
      sb.push(str.charAt(c));
  }
  return sb.join('');
}

function svgIsNumeric(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
}

function svgExtractDouble(str: string, _heading: string): number | null {
  let c = 0;
  while (c < str.length && !svgIsNumeric(str.charAt(c)))
    c++;
  let cc = c + 1;
  while (cc < str.length && svgIsNumeric(str.charAt(cc)))
    cc++;
  const sub = str.substring(c, cc);
  const result = parseFloat(sub);
  return isNaN(result) ? null : result;
}

// ---------------------------------------------------------------------------

/**
 * Paint style for SVG element.
 *
 * @java graphics.svg.element.Style
 */
export class Style {
  /** @java Style.stroke */
  private _stroke: Color | null = null;

  /** @java Style.fill */
  private _fill: Color | null = null;

  /** @java Style.strokeWidth */
  private _strokeWidth = 0;

  // --------------------------------------------------------------------------

  /** @java Style() */
  public constructor() {
    // nothing
  }

  // --------------------------------------------------------------------------

  /** @java Style.stroke() */
  public stroke(): Color | null {
    return this._stroke;
  }

  /** @java Style.setStroke(Color) */
  public setStroke(clr: Color | null): void {
    this._stroke = clr;
  }

  /** @java Style.fill() */
  public fill(): Color | null {
    return this._fill;
  }

  /** @java Style.setFill(Color) */
  public setFill(clr: Color | null): void {
    this._fill = clr;
  }

  /** @java Style.strokeWidth() */
  public strokeWidth(): number {
    return this._strokeWidth;
  }

  /** @java Style.setStrokeWidth(double) */
  public setStrokeWidth(val: number): void {
    this._strokeWidth = val;
  }

  // --------------------------------------------------------------------------

  /** @java Style.load(String) */
  public load(expr: string): boolean {
    const okay = true;

    let str = expr.replaceAll(":", "=");
    str = str.replaceAll('"', " ");
    str = str.replaceAll(",", " ");
    str = str.replaceAll(";", " ");

    const strokePos = str.indexOf("stroke=");
    if (strokePos !== -1) {
      const result = svgExtractStringAt(str, strokePos + 7);
      if (result !== null && result !== "") {
        if (result === "red")
          this._stroke = new Color(255, 0, 0);
        else if (result === "green")
          this._stroke = new Color(0, 175, 0);
        else if (result === "blue")
          this._stroke = new Color(0, 0, 255);
        else if (result === "white")
          this._stroke = new Color(255, 255, 255);
        else if (result === "black")
          this._stroke = new Color(0, 0, 0);
        else if (result === "orange")
          this._stroke = new Color(255, 175, 0);
        else if (result === "yellow")
          this._stroke = new Color(255, 240, 0);
        else if (result.includes("#"))
          this._stroke = Style.colourFromCode(result);
      }
    }

    const fillPos = str.indexOf("fill=");
    if (fillPos !== -1) {
      const result = svgExtractStringAt(str, fillPos + 5);
      if (result !== null && result !== "") {
        if (result === "transparent")
          this._fill = null;
        else if (result === "red")
          this._fill = new Color(255, 0, 0);
        else if (result === "green")
          this._fill = new Color(0, 175, 0);
        else if (result === "blue")
          this._fill = new Color(0, 0, 255);
        else if (result === "white")
          this._fill = new Color(255, 255, 255);
        else if (result === "black")
          this._fill = new Color(0, 0, 0);
        else if (result === "orange")
          this._fill = new Color(255, 175, 0);
        else if (result === "yellow")
          this._fill = new Color(255, 240, 0);
        else if (result.includes("#"))
          this._fill = Style.colourFromCode(result);
      }
    }

    if (str.includes("stroke-width=")) {
      const swStr = str.substring(str.indexOf("stroke-width=") + "stroke-width=".length);
      const result = svgExtractDouble(swStr, "stroke-width=");
      if (result !== null) {
        this._strokeWidth = result;
      }
    }

    return okay;
  }

  // --------------------------------------------------------------------------

  /**
   * @return Color object defined in format #RRGGBB
   *
   * @java Style.colourFromCode(String)
   */
  public static colourFromCode(strIn: string): Color | null {
    const str = strIn.replaceAll('"', "").trim();

    if (str.charAt(0) !== '#' || str.length !== 7)
      return null;

    const values: number[] = new Array<number>(7).fill(0);
    for (let c = 1; c < str.length; c++) {
      const ch = str.charAt(c).toLowerCase();
      if (ch >= '0' && ch <= '9')
        values[c] = ch.charCodeAt(0) - '0'.charCodeAt(0);
      else if (ch >= 'a' && ch <= 'f')
        values[c] = ch.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
      else
        return null; // not a numeric value
    }

    const r = ((values[1] ?? 0) << 4) | (values[2] ?? 0);
    const g = ((values[3] ?? 0) << 4) | (values[4] ?? 0);
    const b = ((values[5] ?? 0) << 4) | (values[6] ?? 0);

    return new Color(r, g, b);
  }

  // --------------------------------------------------------------------------

  /** @java Style.toString() */
  public toString(): string {
    return `<fill=(${this._fill}) stroke=(${this._stroke}) strokeWidth=(${this._strokeWidth})>`;
  }

  // --------------------------------------------------------------------------
}
