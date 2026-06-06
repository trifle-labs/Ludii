// @java java.awt.Font

/** Style constants matching java.awt.Font */
export const PLAIN  = 0;
export const BOLD   = 1;
export const ITALIC = 2;

/** @java java.awt.Font */
export class Font {
  static readonly PLAIN  = PLAIN;
  static readonly BOLD   = BOLD;
  static readonly ITALIC = ITALIC;

  readonly name: string;
  readonly style: number;
  readonly size: number;

  constructor(name: string, style: number, size: number) {
    this.name = name;
    this.style = style;
    this.size = size;
  }

  getFontName(): string { return this.name; }
  getName(): string     { return this.name; }
  getStyle(): number    { return this.style; }
  getSize(): number     { return this.size; }
  getSize2D(): number   { return this.size; }

  isBold():   boolean { return (this.style & BOLD) !== 0; }
  isItalic(): boolean { return (this.style & ITALIC) !== 0; }
  isPlain():  boolean { return this.style === PLAIN; }

  /** Return a new font with a different size. */
  deriveFont(style: number, size?: number): Font;
  deriveFont(size: number): Font;
  deriveFont(styleOrSize: number, sizeArg?: number): Font {
    if (sizeArg !== undefined) {
      return new Font(this.name, styleOrSize, sizeArg);
    }
    // Single float argument: change size only
    return new Font(this.name, this.style, styleOrSize);
  }

  /** CSS font string, e.g. "bold italic 14px Arial". */
  toCSSString(): string {
    const parts: string[] = [];
    if (this.isBold())   parts.push('bold');
    if (this.isItalic()) parts.push('italic');
    parts.push(`${this.size}px`);
    parts.push(this.name);
    return parts.join(' ');
  }

  toString(): string {
    return `Font[family=${this.name},style=${this.style},size=${this.size}]`;
  }
}

/** Minimal FontRenderContext shim – Ludii only uses it to pass to TextLayout / getStringBounds. */
export class FontRenderContext {
  constructor(
    readonly _at: unknown = null,
    readonly _isAntiAliased = true,
    readonly _usesFractionalMetrics = false
  ) {}
}

/** Minimal FontMetrics shim – provides approximate string width. */
export class FontMetrics {
  constructor(private font: Font) {}

  getFont(): Font { return this.font; }

  /** Approximate character width in pixels (≈ 0.6 × font size). */
  charWidth(_ch: number): number {
    return Math.ceil(this.font.size * 0.6);
  }

  /** Approximate string width. */
  stringWidth(str: string): number {
    return Math.ceil(str.length * this.font.size * 0.6);
  }

  getAscent():  number { return Math.ceil(this.font.size * 0.8); }
  getDescent(): number { return Math.ceil(this.font.size * 0.2); }
  getHeight():  number { return this.font.size; }
  getLeading(): number { return Math.ceil(this.font.size * 0.1); }
}
