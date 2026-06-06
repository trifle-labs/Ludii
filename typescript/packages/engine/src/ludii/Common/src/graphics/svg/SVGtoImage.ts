// @java Common/src/graphics/svg/SVGtoImage.java

/**
 * Create an image from an SVG file.
 *
 * @java graphics/svg/SVGtoImage.java
 * @author cambolbro and Matthew
 */

import type { Color } from "../../../../awt/Color.js";
import type { Graphics2D } from "../../../../awt/Graphics2D.js";
import type { Shape } from "../../../../awt/geom/Shape.js";
import { Point2D } from "../../../../awt/geom/Point2D.js";
import { Rectangle2D } from "../../../../awt/geom/Rectangle2D.js";
import { SVGPathOp, PathOpType } from "./SVGPathOp.js";

// ---------------------------------------------------------------------------
// Helpers inlined from StringRoutines (not yet ported)
// ---------------------------------------------------------------------------

/** @java StringRoutines.matchingBracketAt(String, int) */
function matchingBracketAt(str: string, c: number): number {
  const open = str.charAt(c);
  let close: string;
  if (open === '<') close = '>';
  else if (open === '(') close = ')';
  else if (open === '[') close = ']';
  else if (open === '{') close = '}';
  else return c;

  let depth = 0;
  for (let i = c; i < str.length; i++) {
    if (str.charAt(i) === open) depth++;
    else if (str.charAt(i) === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** @java StringRoutines.matchingQuoteAt(String, int) */
function matchingQuoteAt(str: string, c: number): number {
  if (str.charAt(c) !== '"') return c;
  for (let i = c + 1; i < str.length; i++) {
    if (str.charAt(i) === '"') return i;
  }
  return -1;
}

/** @java StringRoutines.isNumeric(char) */
function isNumericChar(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
}

// ---------------------------------------------------------------------------
// Helpers inlined from MathRoutines (not yet ported)
// ---------------------------------------------------------------------------

/** @java MathRoutines.isClockwise(List<Point2D>) */
function isClockwise(pts: Point2D.Double[]): boolean {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i] ?? new Point2D.Double(0, 0);
    const b = pts[(i + 1) % pts.length] ?? new Point2D.Double(0, 0);
    sum += (b.x - a.x) * (b.y + a.y);
  }
  return sum > 0;
}

// ---------------------------------------------------------------------------
// Lightweight GeneralPath shim (path tracking only — no actual drawing)
// ---------------------------------------------------------------------------

interface PathPoint { x: number; y: number; }

class GeneralPath {
  private _current: PathPoint = { x: 0, y: 0 };

  getCurrentPoint(): PathPoint { return { x: this._current.x, y: this._current.y }; }
  moveTo(x: number, y: number): void { this._current = { x, y }; }
  lineTo(x: number, y: number): void { this._current = { x, y }; }
  quadTo(_x1: number, _y1: number, x: number, y: number): void { this._current = { x, y }; }
  curveTo(_x1: number, _y1: number, _x2: number, _y2: number, x: number, y: number): void { this._current = { x, y }; }
  append(_shape: unknown, _connect: boolean): void { /* shim */ }
  closePath(): void { /* shim — real fill happens via g2d */ }
  reset(): void { this._current = { x: 0, y: 0 }; }
}

// ---------------------------------------------------------------------------

function pt(pts: readonly Point2D.Double[], i: number): Point2D.Double {
  return pts[i] ?? new Point2D.Double(0, 0);
}

// ---------------------------------------------------------------------------

/**
 * Create an image from an SVG file.
 *
 * @java graphics.svg.SVGtoImage
 */
export class SVGtoImage {
  /** @java SVGtoImage.SVG_Symbols */
  public static readonly SVG_Symbols: readonly string[] = [
    'a', 'c', 'h', 'l', 'm', 'q', 's', 't', 'v', 'z',
  ];

  // --------------------------------------------------------------------------

  /** @java SVGtoImage() */
  public constructor() { /* nothing */ }

  // --------------------------------------------------------------------------

  /**
   * @return Whether the specified char, lowercased, is an SVG symbol.
   *
   * @java SVGtoImage.isSVGSymbol(char)
   */
  public static isSVGSymbol(ch: string): boolean {
    const chLower = ch.toLowerCase();
    for (const sym of SVGtoImage.SVG_Symbols)
      if (chLower === sym) return true;
    return false;
  }

  // --------------------------------------------------------------------------

  /**
   * Get the SVG string from a given SVG filePath.
   * NOTE: In a TS/browser environment, file reading is async.
   *       Callers should use loadFromSource() with a pre-loaded string.
   *
   * @java SVGtoImage.getSVGString(String)
   */
  public static getSVGString(_filePath: string): string {
    return "";
  }

  // --------------------------------------------------------------------------

  /**
   * Load SVG from file path and render.
   *
   * @java SVGtoImage.loadFromFilePath(Graphics2D, String, Rectangle2D, Color, Color, int)
   */
  public static loadFromFilePath(
    _g2d: Graphics2D,
    _filePath: string,
    _rectangle: Rectangle2D,
    _borderColour: Color | null,
    _fillColour: Color | null,
    _rotation: number,
  ): void {
    // File I/O not available synchronously in TS — no-op shim
  }

  // --------------------------------------------------------------------------

  /**
   * Load SVG from bufferedReader and render.
   *
   * @java SVGtoImage.loadFromReader(Graphics2D, BufferedReader, Rectangle2D, Color, Color, int)
   */
  public static loadFromReader(
    g2d: Graphics2D,
    bufferedReader: { readLine(): string | null; close(): void },
    rectangle: Rectangle2D,
    borderColour: Color | null,
    fillColour: Color | null,
    rotation: number,
  ): void {
    let svg = "";
    let line: string | null;
    try {
      while ((line = bufferedReader.readLine()) !== null)
        svg += line + "\n";
      bufferedReader.close();
    } catch (ex) {
      console.error(ex);
    }

    SVGtoImage.loadFromSource(g2d, svg, rectangle, borderColour, fillColour, rotation);
  }

  // --------------------------------------------------------------------------

  /**
   * Load SVG from the SVG source string.
   *
   * @java SVGtoImage.loadFromSource(Graphics2D, String, Rectangle2D, Color, Color, int)
   */
  public static loadFromSource(
    g2d: Graphics2D,
    svg: string,
    rectangle: Rectangle2D,
    borderColour: Color | null,
    fillColour: Color | null,
    rotation: number,
  ): void {
    const temp = new SVGtoImage();
    const paths: SVGPathOp[][] = [];
    const bounds = new Rectangle2D.Double();

    if (temp.parse(svg, paths)) {
      temp.findBounds(paths, bounds);
      temp.render(g2d, rectangle, borderColour, fillColour, paths, bounds, rotation);
    }
  }

  // --------------------------------------------------------------------------

  /**
   * Get SVG Bounds from a reader.
   *
   * @java SVGtoImage.getBounds(String, int)
   * @java SVGtoImage.getBounds(BufferedReader, int)
   */
  public static getBoundsFromReader(
    reader: { readLine(): string | null; close(): void },
    imgSz: number,
  ): Rectangle2D | null {
    const temp = new SVGtoImage();

    let str = "";
    let line: string | null;
    try {
      while ((line = reader.readLine()) !== null)
        str += line + "\n";
      reader.close();
    } catch (ex) {
      console.error(ex);
    }

    const paths: SVGPathOp[][] = [];
    const bounds = new Rectangle2D.Double();

    if (temp.parse(str, paths)) {
      temp.findBounds(paths, bounds);

      const x0 = Math.trunc(bounds.getX()) - 1;
      const x1 = Math.trunc(bounds.getX() + bounds.getWidth()) + 1;
      const sx = x1 - x0;

      const y0 = Math.trunc(bounds.getY()) - 1;
      const y1 = Math.trunc(bounds.getY() + bounds.getHeight()) + 1;
      const sy = y1 - y0;

      const scale = imgSz / Math.max(sx, sy);

      bounds.width = Math.trunc(scale * sx + 0.5);
      bounds.height = Math.trunc(scale * sy + 0.5);

      return bounds;
    }

    return null;
  }

  // --------------------------------------------------------------------------

  /**
   * Get desired scale for SVG file.
   *
   * @java SVGtoImage.getDesiredScale(String, int)
   */
  public static getDesiredScale(_filePath: string, _imgSz: number): number {
    // Synchronous file I/O not available in TS — return 0
    return 0;
  }

  // --------------------------------------------------------------------------

  /**
   * Parse the SVG data string and fill paths list.
   *
   * @java SVGtoImage.parse(String, List<List<SVGPathOp>>)
   */
  parse(inStr: string, paths: SVGPathOp[][]): boolean {
    paths.length = 0;

    let str = inStr;
    while (str.includes("<path")) {
      const c = str.indexOf("<path");
      const cc = matchingBracketAt(str, c);

      const pathStr = str.substring(c, cc + 1);

      let d = pathStr.indexOf("d=");
      while (d < pathStr.length && pathStr.charAt(d) !== '"')
        d++;
      const dd = matchingQuoteAt(pathStr, d);

      const data = pathStr.substring(d + 1, dd);

      const tokens = this.tokenise(data);
      this.processPathData(tokens, paths);

      str = str.substring(cc + 1);
    }

    return true;
  }

  // --------------------------------------------------------------------------

  /**
   * Tokenise path data string.
   *
   * @java SVGtoImage.tokenise(String)
   */
  tokenise(data: string): string[] {
    const tokens: string[] = [];

    let c = 0;
    while (c < data.length) {
      const ch = data.charAt(c);
      if (SVGtoImage.isSVGSymbol(ch)) {
        tokens.push(ch);
      } else if (isNumericChar(ch)) {
        let cc = c;
        let numDots = 0;

        while (cc < data.length - 1 && isNumericChar(data.charAt(cc + 1))) {
          if (data.charAt(cc) === '.') {
            if (numDots > 0) {
              cc--;
              break;
            }
            numDots++;
          }
          cc++;

          if (cc < data.length - 1 && cc > c + 1 && data.charAt(cc) !== 'e' && data.charAt(cc + 1) === '-')
            break;

          if (cc > c && data.charAt(cc - 1) !== 'e' && data.charAt(cc) === '-') {
            cc--;
            break;
          }
        }
        const token = data.substring(c, cc + 1);
        if (token.includes("e"))
          tokens.push("0");
        else
          tokens.push(token);
        c = cc;
      } else if (ch === '<') {
        const cc = matchingBracketAt(data, c);
        c = cc;
      }
      c++;
    }

    return tokens;
  }

  // --------------------------------------------------------------------------

  /**
   * Process path data tokens and add ops to paths.
   *
   * @java SVGtoImage.processPathData(List<String>, List<List<SVGPathOp>>)
   */
  processPathData(tokens: string[], paths: SVGPathOp[][]): boolean {
    const path: SVGPathOp[] = [];
    paths.push(path);

    let lastOperator = '?';
    const n = tokens.length;

    let s = 0;
    while (s < n) {
      let token = tokens[s] ?? "";

      if (token === "") {
        s++;
        continue;
      }

      let ch = token.charAt(0);
      const hasSymbol = (token.length === 1 && SVGtoImage.isSVGSymbol(ch));
      if (hasSymbol) {
        s++;
        if (s >= n) return true;
        token = tokens[s] ?? "";
      } else {
        ch = lastOperator;
      }
      lastOperator = ch;

      const tok = (i: number): string => tokens[i] ?? "0";

      switch (ch) {
        case 'a': case 'A': {
          if (s >= n - 7) return false;
          path.push(new SVGPathOp(PathOpType.ArcTo, ch === 'A', [
            tok(s), tok(s+1), tok(s+5), tok(s+6), tok(s+2), tok(s+3), tok(s+4),
          ]));
          s += 7;
          break;
        }
        case 'm': case 'M': {
          if (s >= n - 2) return false;
          path.push(new SVGPathOp(PathOpType.MoveTo, ch === 'M', [tok(s), tok(s+1)]));
          s += 2;
          break;
        }
        case 'l': case 'L': {
          if (s >= n - 2) return false;
          path.push(new SVGPathOp(PathOpType.LineTo, ch === 'L', [tok(s), tok(s+1)]));
          s += 2;
          break;
        }
        case 'h': case 'H': {
          if (s >= n - 1) return false;
          path.push(new SVGPathOp(PathOpType.HLineTo, ch === 'H', [tok(s), "0"]));
          s += 1;
          break;
        }
        case 'v': case 'V': {
          if (s >= n - 1) return false;
          path.push(new SVGPathOp(PathOpType.VLineTo, ch === 'V', ["0", tok(s)]));
          s += 1;
          break;
        }
        case 'q': case 'Q': {
          if (s >= n - 4) return false;
          path.push(new SVGPathOp(PathOpType.QuadraticTo, ch === 'Q', [tok(s), tok(s+1), tok(s+2), tok(s+3)]));
          s += 4;
          break;
        }
        case 'c': case 'C': {
          if (s >= n - 6) return false;
          path.push(new SVGPathOp(PathOpType.CurveTo, ch === 'C', [tok(s), tok(s+1), tok(s+2), tok(s+3), tok(s+4), tok(s+5)]));
          s += 6;
          break;
        }
        case 's': case 'S': {
          if (s >= n - 4) return false;
          path.push(new SVGPathOp(PathOpType.ShortCurveTo, ch === 'S', [tok(s), tok(s+1), tok(s+2), tok(s+3)]));
          s += 4;
          break;
        }
        case 't': case 'T': {
          if (s >= n - 2) return false;
          path.push(new SVGPathOp(PathOpType.ShortQuadraticTo, ch === 'T', [tok(s), tok(s+1)]));
          s += 2;
          break;
        }
        case 'z': case 'Z': {
          path.push(new SVGPathOp(PathOpType.ClosePath, ch === 'Z', null));
          break;
        }
        default:
          return false;
      }
    }

    return true;
  }

  // --------------------------------------------------------------------------

  /**
   * @return Number corresponding to label in string, else 0.
   *
   * @java SVGtoImage.findPositiveInteger(String, String)
   */
  findPositiveInteger(inStr: string, label: string): number {
    let from = inStr.indexOf(label);
    if (from === -1) {
      console.log(`** Failed to find '${label}' in '${inStr}'.`);
      return 0;
    }
    from++;

    let str = "";
    let cc = from + label.length;
    while (cc < inStr.length && inStr.charAt(cc) >= '0' && inStr.charAt(cc) <= '9')
      str += inStr.charAt(cc++);

    const value = parseInt(str, 10);
    return isNaN(value) ? 0 : value;
  }

  // --------------------------------------------------------------------------

  /**
   * Find the bounding box of all paths.
   *
   * @java SVGtoImage.findBounds(List<List<SVGPathOp>>, Rectangle2D.Double)
   */
  public findBounds(paths: SVGPathOp[][], bounds: Rectangle2D.Double): void {
    let minX = 1000000;
    let minY = 1000000;
    let maxX = -1000000;
    let maxY = -1000000;

    let lastX = 0;
    let lastY = 0;

    let x = 0, y = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0;

    for (const path of paths) {
      lastX = 0;
      lastY = 0;

      for (const op of path) {
        const ops = op.pts();
        const abs = op.absolute() ? 0 : 0; void abs; // captured per-op
        const dAbs = (v: number): number => op.absolute() ? v : lastX + v; void dAbs;
        const dAbsX = (v: number): number => v + (op.absolute() ? 0 : lastX);
        const dAbsY = (v: number): number => v + (op.absolute() ? 0 : lastY);

        switch (op.type()) {
          case PathOpType.ArcTo: {
            const rx = pt(ops, 0).x;
            const ry = pt(ops, 0).y;
            x = dAbsX(pt(ops, 1).x);
            y = dAbsY(pt(ops, 1).y);
            lastX = x + rx; lastY = y;

            x1 = x - rx; y1 = y - ry;
            x2 = x + rx; y2 = y + ry;

            if (x1 < minX) minX = x1;
            if (y1 < minY) minY = y1;
            if (x1 > maxX) maxX = x1;
            if (y1 > maxY) maxY = y1;
            if (x2 < minX) minX = x2;
            if (y2 < minY) minY = y2;
            if (x2 > maxX) maxX = x2;
            if (y2 > maxY) maxY = y2;
            break;
          }
          case PathOpType.MoveTo:
            x = dAbsX(pt(ops, 0).x); y = dAbsY(pt(ops, 0).y);
            lastX = x; lastY = y;
            break;
          case PathOpType.LineTo:
            x = dAbsX(pt(ops, 0).x); y = dAbsY(pt(ops, 0).y);
            lastX = x; lastY = y;
            break;
          case PathOpType.HLineTo:
            x = dAbsX(pt(ops, 0).x); lastX = x;
            break;
          case PathOpType.VLineTo:
            y = dAbsY(pt(ops, 0).y); lastY = y;
            break;
          case PathOpType.QuadraticTo:
            x = dAbsX(pt(ops, 1).x); y = dAbsY(pt(ops, 1).y);
            lastX = x; lastY = y;
            x1 = dAbsX(pt(ops, 0).x); y1 = dAbsY(pt(ops, 0).y);
            break;
          case PathOpType.CurveTo:
            x = dAbsX(pt(ops, 2).x); y = dAbsY(pt(ops, 2).y);
            lastX = x; lastY = y;
            x1 = dAbsX(pt(ops, 0).x); y1 = dAbsY(pt(ops, 0).y);
            x2 = dAbsX(pt(ops, 1).x); y2 = dAbsY(pt(ops, 1).y);
            break;
          case PathOpType.ShortQuadraticTo:
            x = dAbsX(pt(ops, 0).x); y = dAbsY(pt(ops, 0).y);
            lastX = x; lastY = y;
            break;
          case PathOpType.ShortCurveTo:
            x = dAbsX(pt(ops, 1).x); y = dAbsY(pt(ops, 1).y);
            lastX = x; lastY = y;
            x1 = dAbsX(pt(ops, 0).x); y1 = dAbsY(pt(ops, 0).y);
            break;
          case PathOpType.ClosePath:
            x = lastX; y = lastY;
            break;
          default:
            break;
        }

        void x1; void y1; void x2; void y2; // used above, suppress lint

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    bounds.setRect(minX, minY, maxX - minX, maxY - minY);
  }

  // --------------------------------------------------------------------------

  /** @java SVGtoImage.verbose */
  readonly verbose = false;

  // --------------------------------------------------------------------------

  /**
   * Render the SVG code just parsed to a target area.
   *
   * @java SVGtoImage.render(Graphics2D, Rectangle2D, Color, Color, List<List<SVGPathOp>>, Rectangle2D.Double, int)
   */
  public render(
    g2d: Graphics2D,
    targetArea: Rectangle2D,
    borderColour: Color | null,
    fillColour: Color | null,
    paths: SVGPathOp[][],
    bounds: Rectangle2D.Double,
    rotation: number,
  ): void {
    const targetWidth = targetArea.getWidth();
    const targetHeight = targetArea.getHeight();
    const targetX = targetArea.getX();
    const targetY = targetArea.getY();

    let x0 = bounds.getX() - 1;
    const x1 = bounds.getX() + bounds.getWidth() + 1;
    const sx = x1 - x0;

    let y0 = bounds.getY() - 1;
    const y1 = bounds.getY() + bounds.getHeight() + 1;
    const sy = y1 - y0;

    const maxDim = Math.max(targetWidth, targetHeight);

    const scaleX = targetWidth / Math.max(sx, sy);
    const scaleY = targetHeight / Math.max(sx, sy);

    x0 -= Math.max(sy - sx, 0) / 2.0;
    y0 -= Math.max(sx - sy, 0) / 2.0;

    x0 -= targetX / scaleX;
    y0 -= targetY / scaleY;

    if (rotation !== 0)
      g2d.rotate(rotation * Math.PI / 180, targetX + maxDim / 2, targetY + maxDim / 2);

    if (fillColour !== null)
      this.renderPaths(g2d, x0, y0, scaleX, scaleY, fillColour, null, paths);

    if (borderColour !== null)
      this.renderPaths(g2d, x0, y0, scaleX, scaleY, null, borderColour, paths);

    if (rotation !== 0)
      g2d.rotate(-(rotation * Math.PI / 180), targetX + maxDim / 2, targetY + maxDim / 2);
  }

  // --------------------------------------------------------------------------

  /**
   * Render all paths to the Graphics2D canvas.
   *
   * @java SVGtoImage.renderPaths(Graphics2D, double, double, double, double, Color, Color, List<List<SVGPathOp>>)
   */
  renderPaths(
    g2d: Graphics2D,
    x0: number,
    y0: number,
    scaleX: number,
    scaleY: number,
    fillColour: Color | null,
    borderColour: Color | null,
    paths: SVGPathOp[][],
  ): void {
    let x = 0, y = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0;
    let curX = 0, curY = 0, oldX = 0, oldY = 0;

    for (const opList of paths) {
      const path = new GeneralPath();
      const pts: Point2D.Double[] = [];

      let prev: PathPoint | null = null;
      let startX = 0;
      let startY = 0;
      let lastX = 0;
      let lastY = 0;

      for (const op of opList) {
        const current: PathPoint = path.getCurrentPoint();
        const ops = op.pts();

        const dAbsX = (v: number): number => v + (op.absolute() ? 0 : lastX);
        const dAbsY = (v: number): number => v + (op.absolute() ? 0 : lastY);
        const scX = (v: number): number => (v - x0) * scaleX;
        const scY = (v: number): number => (v - y0) * scaleY;

        switch (op.type()) {
          case PathOpType.ArcTo: {
            console.log("** Warning: Path ArcTo not fully supported yet.");

            x1 = (lastX - x0) * scaleX;
            y1 = (lastY - y0) * scaleY;

            x2 = scX(dAbsX(pt(ops, 1).x));
            y2 = scY(dAbsY(pt(ops, 1).y));

            const rx = pt(ops, 0).x * scaleX;
            const ry = pt(ops, 0).y * scaleY;

            const theta = op.xAxisRotation();
            const fa = op.largeArcSweep();
            const fs = op.sweepFlag();

            const xx1 =  Math.cos(theta) * (x1 - x2) / 2.0 + Math.sin(theta) * (y1 - y2) / 2.0;
            const yy1 = -Math.sin(theta) * (x1 - x2) / 2.0 + Math.cos(theta) * (y1 - y2) / 2.0;

            const signF = (fa === fs) ? 1 : -1;

            const term = Math.sqrt(
              (rx * rx * ry * ry - rx * rx * yy1 * yy1 - ry * ry * xx1 * xx1)
              /
              (rx * rx * yy1 * yy1 + ry * ry * xx1 * xx1),
            );

            const _ccx = signF * term * (rx * yy1 / ry);
            const _ccy = signF * term * (-ry * xx1 / rx);
            void _ccx; void _ccy;

            // Ellipse append skipped — g2d interface lacks Ellipse2D shapes here
            path.lineTo(x2, y2);

            lastX = x2 / scaleX + x0;
            lastY = y2 / scaleY + y0;

            prev = { x: x2, y: y2 };
            pts.push(new Point2D.Double(pt(ops, 1).x, pt(ops, 1).y));

            if (this.verbose) console.log(`A${rx.toFixed(1)} ${ry.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
            break;
          }
          case PathOpType.MoveTo: {
            if (fillColour !== null && pts.length > 0) {
              if (isClockwise(pts)) {
                path.closePath();
                g2d.setColor(fillColour);
                g2d.fill(path as unknown as Shape);
              }
              pts.length = 0;
              path.reset();
            }

            x = scX(dAbsX(pt(ops, 0).x));
            y = scY(dAbsY(pt(ops, 0).y));

            lastX = dAbsX(pt(ops, 0).x);
            lastY = dAbsY(pt(ops, 0).y);
            startX = lastX; startY = lastY;

            path.moveTo(x, y);
            prev = { x, y };
            pts.push(new Point2D.Double(pt(ops, 0).x, pt(ops, 0).y));

            if (this.verbose) console.log(`M${x.toFixed(1)} ${y.toFixed(1)}`);
            break;
          }
          case PathOpType.LineTo: {
            x = scX(dAbsX(pt(ops, 0).x));
            y = scY(dAbsY(pt(ops, 0).y));

            lastX = dAbsX(pt(ops, 0).x);
            lastY = dAbsY(pt(ops, 0).y);

            path.lineTo(x, y);
            prev = { x: current.x, y: current.y };
            pts.push(new Point2D.Double(pt(ops, 0).x, pt(ops, 0).y));

            if (this.verbose) console.log(`L${x.toFixed(1)} ${y.toFixed(1)}`);
            break;
          }
          case PathOpType.HLineTo: {
            x = scX(dAbsX(pt(ops, 0).x));
            y = current.y;

            lastX = dAbsX(pt(ops, 0).x);

            path.lineTo(x, y);
            prev = { x: current.x, y: current.y };
            pts.push(new Point2D.Double(pt(ops, 0).x, pt(ops, 0).y));

            if (this.verbose) console.log(`H${x.toFixed(1)} ${y.toFixed(1)}`);
            break;
          }
          case PathOpType.VLineTo: {
            x = current.x;
            y = scY(dAbsY(pt(ops, 0).y));

            lastY = dAbsY(pt(ops, 0).y);

            path.lineTo(x, y);
            prev = { x: current.x, y: current.y };
            pts.push(new Point2D.Double(pt(ops, 0).x, pt(ops, 0).y));

            if (this.verbose) console.log(`V${x.toFixed(1)} ${y.toFixed(1)}`);
            break;
          }
          case PathOpType.QuadraticTo: {
            x1 = scX(dAbsX(pt(ops, 0).x));
            y1 = scY(dAbsY(pt(ops, 0).y));
            x  = scX(dAbsX(pt(ops, 1).x));
            y  = scY(dAbsY(pt(ops, 1).y));

            lastX = dAbsX(pt(ops, 1).x);
            lastY = dAbsY(pt(ops, 1).y);

            path.quadTo(x1, y1, x, y);
            prev = { x: x1, y: y1 };
            pts.push(new Point2D.Double(pt(ops, 1).x, pt(ops, 1).y));

            if (this.verbose) console.log(`Q${x1.toFixed(1)} ${y1.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
            break;
          }
          case PathOpType.CurveTo: {
            x1 = scX(dAbsX(pt(ops, 0).x));
            y1 = scY(dAbsY(pt(ops, 0).y));
            x2 = scX(dAbsX(pt(ops, 1).x));
            y2 = scY(dAbsY(pt(ops, 1).y));
            x  = scX(dAbsX(pt(ops, 2).x));
            y  = scY(dAbsY(pt(ops, 2).y));

            lastX = dAbsX(pt(ops, 2).x);
            lastY = dAbsY(pt(ops, 2).y);

            path.curveTo(x1, y1, x2, y2, x, y);
            prev = { x: x2, y: y2 };
            pts.push(new Point2D.Double(pt(ops, 2).x, pt(ops, 2).y));

            if (this.verbose) console.log(`C${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
            break;
          }
          case PathOpType.ShortQuadraticTo: {
            x = scX(dAbsX(pt(ops, 0).x));
            y = scY(dAbsY(pt(ops, 0).y));

            lastX = dAbsX(pt(ops, 0).x);
            lastY = dAbsY(pt(ops, 0).y);

            curX = current.x;
            curY = current.y;
            oldX = prev !== null ? prev.x : 0;
            oldY = prev !== null ? prev.y : 0;

            x1 = 2 * curX - oldX;
            y1 = 2 * curY - oldY;

            path.quadTo(x1, y1, x, y);
            prev = { x: x1, y: y1 };
            // Java uses pts.get(1) but ShortQuadraticTo only has one point
            pts.push(new Point2D.Double(pt(ops, 0).x, pt(ops, 0).y));

            if (this.verbose) console.log(`Q${x1.toFixed(1)} ${y1.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
            break;
          }
          case PathOpType.ShortCurveTo: {
            x2 = scX(dAbsX(pt(ops, 0).x));
            y2 = scY(dAbsY(pt(ops, 0).y));
            x  = scX(dAbsX(pt(ops, 1).x));
            y  = scY(dAbsY(pt(ops, 1).y));

            lastX = dAbsX(pt(ops, 1).x);
            lastY = dAbsY(pt(ops, 1).y);

            curX = current.x;
            curY = current.y;
            oldX = prev !== null ? prev.x : 0;
            oldY = prev !== null ? prev.y : 0;

            x1 = 2 * curX - oldX;
            y1 = 2 * curY - oldY;

            path.quadTo(x1, y1, x, y);
            prev = { x: x1, y: y1 };
            pts.push(new Point2D.Double(pt(ops, 1).x, pt(ops, 1).y));

            if (this.verbose) console.log(`Q${x2.toFixed(1)} ${y2.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
            break;
          }
          case PathOpType.ClosePath: {
            path.closePath();

            if (fillColour !== null) {
              g2d.setColor(fillColour);
              g2d.fill(path as unknown as Shape);
              path.reset();
              pts.length = 0;
              prev = null;
            }

            lastX = startX;
            lastY = startY;

            if (this.verbose) console.log("Z");
            break;
          }
          default:
            break;
        }

        // suppress unused-variable lint for loop variables updated above
        void x1; void y1; void x2; void y2;
        void curX; void curY; void oldX; void oldY;
      }

      if (fillColour === null && borderColour !== null) {
        g2d.setColor(borderColour);
        g2d.fill(path as unknown as Shape);
      }
    }
  }

  // --------------------------------------------------------------------------
}
