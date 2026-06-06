// @java java.awt.Color

const BRIGHTER_FACTOR = 0.7;
const DARKER_FACTOR = 0.7;

/** @java java.awt.Color */
export class Color {
  private readonly _r: number; // 0-255
  private readonly _g: number;
  private readonly _b: number;
  private readonly _a: number; // 0-255

  // ---- constructors ----

  /** r/g/b in [0,255], optional alpha in [0,255]. */
  constructor(r: number, g: number, b: number, a = 255) {
    this._r = Math.max(0, Math.min(255, Math.round(r)));
    this._g = Math.max(0, Math.min(255, Math.round(g)));
    this._b = Math.max(0, Math.min(255, Math.round(b)));
    this._a = Math.max(0, Math.min(255, Math.round(a)));
  }

  // ---- accessors ----

  getRed():   number { return this._r; }
  getGreen(): number { return this._g; }
  getBlue():  number { return this._b; }
  getAlpha(): number { return this._a; }

  /** Packed ARGB int (same as java.awt.Color.getRGB()). */
  getRGB(): number {
    return ((this._a & 0xFF) << 24) | ((this._r & 0xFF) << 16) | ((this._g & 0xFF) << 8) | (this._b & 0xFF);
  }

  // ---- Java semantics: brighter / darker ----

  /**
   * Returns a brighter version.
   * Java spec: each channel is scaled by 1/BRIGHTER_FACTOR, but at least 3 if non-zero.
   */
  brighter(): Color {
    let r = this._r, g = this._g, b = this._b;
    const factor = 1 / BRIGHTER_FACTOR;
    // Special case: very dark colours need a minimum bump
    const i = Math.floor(1 / (1 - BRIGHTER_FACTOR));
    if (r === 0 && g === 0 && b === 0) return new Color(i, i, i, this._a);
    if (r > 0 && r < i) r = i;
    if (g > 0 && g < i) g = i;
    if (b > 0 && b < i) b = i;
    return new Color(
      Math.min(255, Math.floor(r * factor)),
      Math.min(255, Math.floor(g * factor)),
      Math.min(255, Math.floor(b * factor)),
      this._a,
    );
  }

  /** Returns a darker version (each channel × DARKER_FACTOR). */
  darker(): Color {
    return new Color(
      Math.max(0, Math.floor(this._r * DARKER_FACTOR)),
      Math.max(0, Math.floor(this._g * DARKER_FACTOR)),
      Math.max(0, Math.floor(this._b * DARKER_FACTOR)),
      this._a,
    );
  }

  /** CSS rgba() string for use in SVG. */
  toCSSString(): string {
    if (this._a === 255) {
      return `rgb(${this._r},${this._g},${this._b})`;
    }
    return `rgba(${this._r},${this._g},${this._b},${(this._a / 255).toFixed(4)})`;
  }

  /** Hex string "#rrggbb" (or "#rrggbbaa"). */
  toHexString(): string {
    const hex = (n: number) => n.toString(16).padStart(2, '0');
    if (this._a === 255) return `#${hex(this._r)}${hex(this._g)}${hex(this._b)}`;
    return `#${hex(this._r)}${hex(this._g)}${hex(this._b)}${hex(this._a)}`;
  }

  /** Opacity in [0,1] for SVG fill-opacity / stroke-opacity attributes. */
  getOpacity(): number { return this._a / 255; }

  equals(other: Color): boolean {
    return this._r === other._r && this._g === other._g &&
           this._b === other._b && this._a === other._a;
  }

  toString(): string {
    return `Color[r=${this._r},g=${this._g},b=${this._b},a=${this._a}]`;
  }

  // ---- static factory ----

  /** Decode "#rrggbb" or "#rrggbbaa" or "rgb(r,g,b)" strings. */
  static decode(hex: string): Color {
    const s = hex.trim();
    if (s.startsWith('#')) {
      const h = s.slice(1);
      if (h.length === 3) {
        const c0 = h[0] ?? '0';
        const c1 = h[1] ?? '0';
        const c2 = h[2] ?? '0';
        const r = parseInt(c0 + c0, 16);
        const g = parseInt(c1 + c1, 16);
        const b = parseInt(c2 + c2, 16);
        return new Color(r, g, b);
      }
      if (h.length === 6) {
        return new Color(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
      }
      if (h.length === 8) {
        return new Color(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), parseInt(h.slice(6, 8), 16));
      }
    }
    throw new Error(`Cannot decode color: ${hex}`);
  }

  // ---- java.awt.Color constants ----

  static readonly BLACK       = new Color(0, 0, 0);
  static readonly WHITE       = new Color(255, 255, 255);
  static readonly RED         = new Color(255, 0, 0);
  static readonly GREEN       = new Color(0, 255, 0);
  static readonly BLUE        = new Color(0, 0, 255);
  static readonly YELLOW      = new Color(255, 255, 0);
  static readonly CYAN        = new Color(0, 255, 255);
  static readonly MAGENTA     = new Color(255, 0, 255);
  static readonly ORANGE      = new Color(255, 200, 0);
  static readonly PINK        = new Color(255, 175, 175);
  static readonly LIGHT_GRAY  = new Color(192, 192, 192);
  static readonly GRAY        = new Color(128, 128, 128);
  static readonly DARK_GRAY   = new Color(64, 64, 64);
  static readonly TRANSPARENT = new Color(0, 0, 0, 0);

  // camelCase aliases (Java 1.4 added both forms)
  static readonly black       = Color.BLACK;
  static readonly white       = Color.WHITE;
  static readonly red         = Color.RED;
  static readonly green       = Color.GREEN;
  static readonly blue        = Color.BLUE;
  static readonly yellow      = Color.YELLOW;
  static readonly cyan        = Color.CYAN;
  static readonly magenta     = Color.MAGENTA;
  static readonly orange      = Color.ORANGE;
  static readonly pink        = Color.PINK;
  static readonly lightGray   = Color.LIGHT_GRAY;
  static readonly gray        = Color.GRAY;
  static readonly darkGray    = Color.DARK_GRAY;
}
