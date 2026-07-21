// @java java.awt.Graphics2D

import type { Color } from './Color.js';
import type { Font } from './Font.js';
import type { FontMetrics, FontRenderContext } from './Font.js';
import type { BasicStroke, Stroke } from './Stroke.js';
import type { RenderingHints, RenderingHintsKey } from './RenderingHints.js';
import type { AffineTransform } from './geom/AffineTransform.js';
import type { Shape } from './geom/Shape.js';
import type { Rectangle2D } from './geom/Rectangle2D.js';

/**
 * Abstract drawing API matching java.awt.Graphics2D.
 * Concrete subclass: SVGGraphics2D.
 *
 * @java java.awt.Graphics2D
 */
export abstract class Graphics2D {

  // ---- color ----
  abstract setColor(color: Color): void;
  abstract getColor(): Color;
  abstract setBackground(color: Color): void;

  // ---- stroke ----
  abstract setStroke(stroke: Stroke): void;
  abstract getStroke(): Stroke;

  // ---- font ----
  abstract setFont(font: Font): void;
  abstract getFont(): Font;
  abstract getFontMetrics(font?: Font): FontMetrics;
  abstract getFontRenderContext(): FontRenderContext;

  // ---- rendering hints ----
  abstract setRenderingHint(key: RenderingHintsKey, value: unknown): void;
  abstract setRenderingHints(hints: RenderingHints): void;

  // ---- shape drawing ----
  abstract draw(shape: Shape): void;
  abstract fill(shape: Shape): void;

  // ---- convenience integer-coordinate draw calls ----
  abstract drawLine(x1: number, y1: number, x2: number, y2: number): void;
  abstract drawRect(x: number, y: number, w: number, h: number): void;
  abstract fillRect(x: number, y: number, w: number, h: number): void;
  abstract clearRect(x: number, y: number, w: number, h: number): void;
  abstract drawOval(x: number, y: number, w: number, h: number): void;
  abstract fillOval(x: number, y: number, w: number, h: number): void;
  abstract drawArc(x: number, y: number, w: number, h: number, startAngle: number, arcAngle: number): void;
  abstract fillArc(x: number, y: number, w: number, h: number, startAngle: number, arcAngle: number): void;
  abstract drawRoundRect(x: number, y: number, w: number, h: number, arcW: number, arcH: number): void;
  abstract fillRoundRect(x: number, y: number, w: number, h: number, arcW: number, arcH: number): void;
  abstract drawPolygon(xPoints: number[], yPoints: number[], nPoints: number): void;
  abstract fillPolygon(xPoints: number[], yPoints: number[], nPoints: number): void;

  // ---- text ----
  abstract drawString(str: string, x: number, y: number): void;

  // ---- images ----
  abstract drawImage(img: unknown, x: number, y: number, w: number, h: number, observer?: unknown): boolean;

  // ---- transform ----
  abstract translate(tx: number, ty: number): void;
  abstract rotate(theta: number, anchorX?: number, anchorY?: number): void;
  abstract scale(sx: number, sy: number): void;
  abstract transform(Tx: AffineTransform): void;
  abstract setTransform(Tx: AffineTransform): void;
  abstract getTransform(): AffineTransform;

  // ---- clip ----
  abstract clip(shape: Shape): void;
  abstract setClip(shape: Shape | null): void;
  abstract getClip(): Shape | null;

  // ---- lifecycle ----
  /** Return a child Graphics2D that inherits the current state (like Java g2d.create()). */
  abstract create(): Graphics2D;
  abstract dispose(): void;

  // ---- JFreeChart-compatible dimensions (set by SVGGraphics2D constructor) ----
  abstract getWidth(): number;
  abstract getHeight(): number;

  // ---- Java convenience: getFont().getStringBounds via FontRenderContext ----
  // (StringUtil calls g2d.getFont().getStringBounds(str, g2d.getFontRenderContext()))
  // Those live on Font + FontRenderContext — Graphics2D just needs to expose getFontRenderContext().
}
