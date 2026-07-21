// @java org.jfree.graphics2d.svg.SVGGraphics2D

import { Graphics2D } from './Graphics2D.js';
import { Color } from './Color.js';
import { Font, FontMetrics, FontRenderContext } from './Font.js';
import { BasicStroke, Stroke } from './Stroke.js';
import { RenderingHints, RenderingHintsKey } from './RenderingHints.js';
import { AffineTransform } from './geom/AffineTransform.js';
import { Rectangle2D } from './geom/Rectangle2D.js';
import { Ellipse2D } from './geom/Ellipse2D.js';
import { Line2D } from './geom/Line2D.js';
import { Arc2D } from './geom/Arc2D.js';
import { RoundRectangle2D } from './geom/RoundRectangle2D.js';
import { GeneralPath, WIND_EVEN_ODD } from './geom/GeneralPath.js';
import { Rectangle, Polygon } from './Point.js';
import type { Shape } from './geom/Shape.js';
import {
  PathIterator,
  SEG_MOVETO, SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, SEG_CLOSE,
} from './geom/PathIterator.js';

// ---- internal state ----

interface GraphicsState {
  color: Color;
  background: Color;
  stroke: Stroke;
  font: Font;
  transform: AffineTransform;
  clip: Shape | null;
  hints: Map<RenderingHintsKey, unknown>;
}

let _clipIdCounter = 0;

/**
 * Concrete SVG-emitting Graphics2D.
 * Matches the JFreeChart SVGGraphics2D API that Ludii's ViewController uses.
 *
 * @java org.jfree.graphics2d.svg.SVGGraphics2D
 */
export class SVGGraphics2D extends Graphics2D {
  private _w: number;
  private _h: number;

  private _state: GraphicsState;
  private _stateStack: GraphicsState[] = [];

  /** Accumulated SVG element strings (children of the root <svg>). */
  private _elements: string[] = [];

  /** Any <defs> entries (clip paths). */
  private _defs: string[] = [];

  private _fontRenderContext = new FontRenderContext();

  constructor(width: number, height: number) {
    super();
    this._w = width;
    this._h = height;
    this._state = {
      color:      Color.BLACK,
      background: Color.WHITE,
      stroke:     new BasicStroke(1),
      font:       new Font('Arial', Font.PLAIN, 12),
      transform:  new AffineTransform(),
      clip:       null,
      hints:      new Map(),
    };
  }

  // ---- dimensions ----

  getWidth():  number { return this._w; }
  getHeight(): number { return this._h; }

  // ---- color ----

  setColor(c: Color): void  { this._state.color = c; }
  getColor(): Color          { return this._state.color; }
  setBackground(c: Color): void { this._state.background = c; }

  // ---- stroke ----

  setStroke(s: Stroke): void { this._state.stroke = s; }
  getStroke(): Stroke         { return this._state.stroke; }

  // ---- font ----

  setFont(f: Font): void     { this._state.font = f; }
  getFont(): Font             { return this._state.font; }

  getFontMetrics(font?: Font): FontMetrics {
    return new FontMetrics(font ?? this._state.font);
  }

  getFontRenderContext(): FontRenderContext {
    return this._fontRenderContext;
  }

  // ---- rendering hints (no-op) ----

  override setRenderingHint(key: RenderingHintsKey, value: unknown): void {
    this._state.hints.set(key, value);
  }

  setRenderingHints(hints: RenderingHints): void {
    // hints.get() is not iterable in this shim — intentional no-op
    void hints;
  }

  // ---- transforms ----

  getTransform(): AffineTransform { return this._state.transform.clone(); }

  setTransform(tx: AffineTransform): void {
    this._state.transform = tx.clone();
  }

  translate(tx: number, ty: number): void {
    this._state.transform.translate(tx, ty);
  }

  rotate(theta: number, anchorX?: number, anchorY?: number): void {
    this._state.transform.rotate(theta, anchorX ?? 0, anchorY ?? 0);
  }

  scale(sx: number, sy: number): void {
    this._state.transform.scale(sx, sy);
  }

  transform(Tx: AffineTransform): void {
    this._state.transform.concatenate(Tx);
  }

  // ---- clip ----

  setClip(shape: Shape | null): void {
    this._state.clip = shape;
  }

  clip(shape: Shape): void {
    // Intersect with current clip — for SVG purposes just replace
    this._state.clip = shape;
  }

  getClip(): Shape | null { return this._state.clip; }

  // ---- create / dispose ----

  create(): SVGGraphics2D {
    const child = new SVGGraphics2D(this._w, this._h);
    child._state = cloneState(this._state);
    child._elements = this._elements; // shared reference: child writes to same list
    child._defs     = this._defs;
    return child;
  }

  dispose(): void {
    // Nothing to do — child shares element list with parent
  }

  // ---- Shape drawing ----

  draw(shape: Shape): void {
    this._emit(this._shapeToSVG(shape, false));
  }

  fill(shape: Shape): void {
    this._emit(this._shapeToSVG(shape, true));
  }

  // ---- Convenience calls ----

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.draw(new Line2D(x1, y1, x2, y2));
  }

  drawRect(x: number, y: number, w: number, h: number): void {
    this.draw(new Rectangle(x, y, w, h));
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this.fill(new Rectangle(x, y, w, h));
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    const savedColor = this._state.color;
    this._state.color = this._state.background;
    this.fill(new Rectangle(x, y, w, h));
    this._state.color = savedColor;
  }

  drawOval(x: number, y: number, w: number, h: number): void {
    this.draw(new Ellipse2D(x, y, w, h));
  }

  fillOval(x: number, y: number, w: number, h: number): void {
    this.fill(new Ellipse2D(x, y, w, h));
  }

  drawArc(x: number, y: number, w: number, h: number, startAngle: number, arcAngle: number): void {
    this.draw(new Arc2D(x, y, w, h, startAngle, arcAngle, Arc2D.OPEN));
  }

  fillArc(x: number, y: number, w: number, h: number, startAngle: number, arcAngle: number): void {
    this.fill(new Arc2D(x, y, w, h, startAngle, arcAngle, Arc2D.PIE));
  }

  drawRoundRect(x: number, y: number, w: number, h: number, arcW: number, arcH: number): void {
    this.draw(new RoundRectangle2D(x, y, w, h, arcW, arcH));
  }

  fillRoundRect(x: number, y: number, w: number, h: number, arcW: number, arcH: number): void {
    this.fill(new RoundRectangle2D(x, y, w, h, arcW, arcH));
  }

  drawPolygon(xPoints: number[], yPoints: number[], nPoints: number): void {
    this.draw(new Polygon(xPoints, yPoints, nPoints));
  }

  fillPolygon(xPoints: number[], yPoints: number[], nPoints: number): void {
    this.fill(new Polygon(xPoints, yPoints, nPoints));
  }

  // ---- text ----

  drawString(str: string, x: number, y: number): void {
    const attrs = this._commonTextAttrs();
    const transform = this._currentTransformAttr();
    const clip = this._clipAttr();
    let el = `<text x="${n(x)}" y="${n(y)}" ${attrs}`;
    if (transform) el += ` transform="${transform}"`;
    if (clip)      el += ` clip-path="url(#${clip})"`;
    el += `>${escapeXml(str)}</text>`;
    this._emit(el);
  }

  // ---- images ----

  drawImage(img: unknown, x: number, y: number, w: number, h: number, _observer?: unknown): boolean {
    // Record as an SVG <image> element with data URI if possible
    let href = '';
    if (typeof img === 'string') {
      href = img;
    } else if (img && typeof (img as Record<string, unknown>)['toDataURL'] === 'function') {
      href = (img as { toDataURL(): string }).toDataURL();
    }
    const transform = this._currentTransformAttr();
    const clip = this._clipAttr();
    let el = `<image x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" href="${href}"`;
    if (transform) el += ` transform="${transform}"`;
    if (clip)      el += ` clip-path="url(#${clip})"`;
    el += `/>`;
    this._emit(el);
    return true;
  }

  // ---- SVG output ----

  /**
   * Returns the full SVG document string.
   * Matches org.jfree.graphics2d.svg.SVGGraphics2D.getSVGDocument()
   */
  getSVGDocument(): string {
    const defs = this._defs.length > 0
      ? `<defs>${this._defs.join('\n')}</defs>\n`
      : '';
    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `width="${this._w}" height="${this._h}" ` +
      `viewBox="0 0 ${this._w} ${this._h}">\n` +
      defs +
      this._elements.join('\n') +
      `\n</svg>`
    );
  }

  /**
   * Returns only the inner SVG element (no XML declaration, no <svg> wrapper).
   * Matches JFreeChart's getSVGElement() for embedding.
   */
  getSVGElement(): string {
    const defs = this._defs.length > 0
      ? `<defs>${this._defs.join('\n')}</defs>\n`
      : '';
    return defs + this._elements.join('\n');
  }

  // ---- internals ----

  private _emit(el: string): void {
    this._elements.push(el);
  }

  /** Build stroke/fill SVG attributes for the current state. */
  private _shapeAttrs(filled: boolean): string {
    const stroke = this._state.stroke as BasicStroke;
    const color  = this._state.color;

    if (filled) {
      const fillColor = color.toHexString();
      const fillOpacity = color.getOpacity() < 1 ? ` fill-opacity="${color.getOpacity().toFixed(4)}"` : '';
      return `fill="${fillColor}"${fillOpacity} stroke="none"`;
    }

    // Stroked
    const strokeColor = color.toHexString();
    const strokeOpacity = color.getOpacity() < 1 ? ` stroke-opacity="${color.getOpacity().toFixed(4)}"` : '';
    let attrs = `fill="none" stroke="${strokeColor}"${strokeOpacity}`;
    if (stroke instanceof BasicStroke) {
      attrs += ` stroke-width="${n(stroke.lineWidth)}"`;
      attrs += ` stroke-linecap="${stroke.toSVGStrokeLinecap()}"`;
      attrs += ` stroke-linejoin="${stroke.toSVGStrokeLinejoin()}"`;
      if (stroke.dashArray && stroke.dashArray.length > 0) {
        attrs += ` stroke-dasharray="${stroke.toSVGStrokeDasharray()}"`;
        if (stroke.dashPhase !== 0) attrs += ` stroke-dashoffset="${stroke.toSVGStrokeDashoffset()}"`;
      }
    }
    return attrs;
  }

  private _commonTextAttrs(): string {
    const font  = this._state.font;
    const color = this._state.color;
    const fillColor = color.toHexString();
    const fillOpacity = color.getOpacity() < 1 ? ` fill-opacity="${color.getOpacity().toFixed(4)}"` : '';
    let style = `font-family="${font.name}" font-size="${n(font.size)}"`;
    if (font.isBold())   style += ' font-weight="bold"';
    if (font.isItalic()) style += ' font-style="italic"';
    return `${style} fill="${fillColor}"${fillOpacity}`;
  }

  private _currentTransformAttr(): string | null {
    const at = this._state.transform;
    const isIdentity = at.getScaleX() === 1 && at.getScaleY() === 1 &&
                       at.getShearX() === 0 && at.getShearY() === 0 &&
                       at.getTranslateX() === 0 && at.getTranslateY() === 0;
    if (isIdentity) return null;
    return at.toCSS();
  }

  /** Register current clip as a clipPath def; returns clip id or null. */
  private _clipAttr(): string | null {
    const clip = this._state.clip;
    if (!clip) return null;
    const id = `clip${_clipIdCounter++}`;
    const pathD = shapeToPathData(clip);
    this._defs.push(
      `<clipPath id="${id}"><path d="${pathD}" clip-rule="nonzero"/></clipPath>`
    );
    return id;
  }

  private _shapeToSVG(shape: Shape, filled: boolean): string {
    const attrs  = this._shapeAttrs(filled);
    const transform = this._currentTransformAttr();
    const clipId = this._clipAttr();
    let extra = '';
    if (transform) extra += ` transform="${transform}"`;
    if (clipId)    extra += ` clip-path="url(#${clipId})"`;

    // Dispatch to efficient element types for simple shapes
    if (shape instanceof Rectangle) {
      const { x, y, width: w, height: h } = shape;
      return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${attrs}${extra}/>`;
    }

    if (shape instanceof Ellipse2D) {
      // Emit a native <ellipse> element
      const rx = shape.width / 2, ry = shape.height / 2;
      const cx = shape.x + rx, cy = shape.y + ry;
      return `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${attrs}${extra}/>`;
    }

    if (shape instanceof Line2D) {
      const { x1, y1, x2, y2 } = shape;
      // Lines only make sense as strokes
      return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${attrs}${extra}/>`;
    }

    // General path for everything else
    const d = shapeToPathData(shape);
    const fr = filled ? ` fill-rule="${shape instanceof GeneralPath && shape.getWindingRule() === WIND_EVEN_ODD ? 'evenodd' : 'nonzero'}"` : '';
    return `<path d="${d}" ${attrs}${fr}${extra}/>`;
  }
}

// ---- free helpers ----

/** Format a number with limited decimal places to keep SVG readable. */
function n(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(4).replace(/\.?0+$/, '');
}

/** Escape XML special chars in text content. */
function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
}

/** Convert any Shape to an SVG path data string via PathIterator. */
function shapeToPathData(shape: Shape): string {
  const pi: PathIterator = shape.getPathIterator(null);
  const coords = [0, 0, 0, 0, 0, 0];
  const parts: string[] = [];
  while (!pi.isDone()) {
    const type = pi.currentSegment(coords);
    const c0 = coords[0] ?? 0, c1 = coords[1] ?? 0;
    const c2 = coords[2] ?? 0, c3 = coords[3] ?? 0;
    const c4 = coords[4] ?? 0, c5 = coords[5] ?? 0;
    switch (type) {
      case SEG_MOVETO:  parts.push(`M ${n(c0)} ${n(c1)}`); break;
      case SEG_LINETO:  parts.push(`L ${n(c0)} ${n(c1)}`); break;
      case SEG_QUADTO:  parts.push(`Q ${n(c0)} ${n(c1)} ${n(c2)} ${n(c3)}`); break;
      case SEG_CUBICTO: parts.push(`C ${n(c0)} ${n(c1)} ${n(c2)} ${n(c3)} ${n(c4)} ${n(c5)}`); break;
      case SEG_CLOSE:   parts.push('Z'); break;
    }
    pi.next();
  }
  return parts.join(' ');
}

function cloneState(s: GraphicsState): GraphicsState {
  return {
    color:      s.color,
    background: s.background,
    stroke:     s.stroke,
    font:       s.font,
    transform:  s.transform.clone(),
    clip:       s.clip,
    hints:      new Map(s.hints),
  };
}
