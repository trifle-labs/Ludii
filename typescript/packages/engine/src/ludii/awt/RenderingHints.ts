// @java java.awt.RenderingHints

/**
 * No-op key/value store matching java.awt.RenderingHints.
 * Values are opaque objects; we only need to hold and pass them through.
 */

// ---- Key base class (must be defined before the static singleton instances) ----

/** Abstract key for RenderingHints. */
export abstract class RenderingHintsKey {
  readonly privateKey: number;
  constructor(privateKey: number) { this.privateKey = privateKey; }
  isCompatibleValue(_val: unknown): boolean { return true; }
}

// ---- Concrete key singletons (plain classes, no inline extends hack) ----

class Key1 extends RenderingHintsKey { constructor() { super(1); } }
class Key2 extends RenderingHintsKey { constructor() { super(2); } }
class Key3 extends RenderingHintsKey { constructor() { super(3); } }
class Key4 extends RenderingHintsKey { constructor() { super(4); } }
class Key5 extends RenderingHintsKey { constructor() { super(5); } }
class Key6 extends RenderingHintsKey { constructor() { super(6); } }
class Key7 extends RenderingHintsKey { constructor() { super(7); } }
class Key8 extends RenderingHintsKey { constructor() { super(8); } }
class Key9 extends RenderingHintsKey { constructor() { super(9); } }

/**
 * @java java.awt.RenderingHints
 */
export class RenderingHints {
  private _map = new Map<RenderingHintsKey, unknown>();

  constructor(key?: RenderingHintsKey, value?: unknown) {
    if (key !== undefined) this._map.set(key, value);
  }

  put(key: RenderingHintsKey, value: unknown): void {
    this._map.set(key, value);
  }

  get(key: RenderingHintsKey): unknown {
    return this._map.get(key);
  }

  /** Key constants */
  static readonly KEY_ANTIALIASING:        RenderingHintsKey = new Key1();
  static readonly KEY_RENDERING:           RenderingHintsKey = new Key2();
  static readonly KEY_INTERPOLATION:       RenderingHintsKey = new Key3();
  static readonly KEY_COLOR_RENDERING:     RenderingHintsKey = new Key4();
  static readonly KEY_ALPHA_INTERPOLATION: RenderingHintsKey = new Key5();
  static readonly KEY_TEXT_ANTIALIASING:   RenderingHintsKey = new Key6();
  static readonly KEY_FRACTIONALMETRICS:   RenderingHintsKey = new Key7();
  static readonly KEY_STROKE_CONTROL:      RenderingHintsKey = new Key8();
  static readonly KEY_DITHERING:           RenderingHintsKey = new Key9();

  /** Value constants */
  static readonly VALUE_ANTIALIAS_ON          = Symbol('ANTIALIAS_ON');
  static readonly VALUE_ANTIALIAS_OFF         = Symbol('ANTIALIAS_OFF');
  static readonly VALUE_RENDER_QUALITY        = Symbol('RENDER_QUALITY');
  static readonly VALUE_RENDER_SPEED          = Symbol('RENDER_SPEED');
  static readonly VALUE_RENDER_DEFAULT        = Symbol('RENDER_DEFAULT');
  static readonly VALUE_INTERPOLATION_BICUBIC = Symbol('INTERPOLATION_BICUBIC');
  static readonly VALUE_INTERPOLATION_BILINEAR = Symbol('INTERPOLATION_BILINEAR');
  static readonly VALUE_INTERPOLATION_NEAREST_NEIGHBOR = Symbol('INTERPOLATION_NEAREST_NEIGHBOR');
  static readonly VALUE_COLOR_RENDER_QUALITY  = Symbol('COLOR_RENDER_QUALITY');
  static readonly VALUE_COLOR_RENDER_SPEED    = Symbol('COLOR_RENDER_SPEED');
  static readonly VALUE_COLOR_RENDER_DEFAULT  = Symbol('COLOR_RENDER_DEFAULT');
  static readonly VALUE_ALPHA_INTERPOLATION_QUALITY = Symbol('ALPHA_INTERP_QUALITY');
  static readonly VALUE_ALPHA_INTERPOLATION_SPEED   = Symbol('ALPHA_INTERP_SPEED');
  static readonly VALUE_ALPHA_INTERPOLATION_DEFAULT = Symbol('ALPHA_INTERP_DEFAULT');
  static readonly VALUE_TEXT_ANTIALIAS_ON     = Symbol('TEXT_ANTIALIAS_ON');
  static readonly VALUE_TEXT_ANTIALIAS_OFF    = Symbol('TEXT_ANTIALIAS_OFF');
  static readonly VALUE_TEXT_ANTIALIAS_DEFAULT = Symbol('TEXT_ANTIALIAS_DEFAULT');
  static readonly VALUE_FRACTIONALMETRICS_ON  = Symbol('FRACTIONALMETRICS_ON');
  static readonly VALUE_FRACTIONALMETRICS_OFF = Symbol('FRACTIONALMETRICS_OFF');
  static readonly VALUE_STROKE_NORMALIZE      = Symbol('STROKE_NORMALIZE');
  static readonly VALUE_STROKE_PURE           = Symbol('STROKE_PURE');
  static readonly VALUE_DITHER_ENABLE         = Symbol('DITHER_ENABLE');
  static readonly VALUE_DITHER_DISABLE        = Symbol('DITHER_DISABLE');

  /** Namespace alias so existing code using RenderingHints.Key still compiles. */
  static readonly Key = RenderingHintsKey;
}

export namespace RenderingHints {
  export type Key = RenderingHintsKey;
}
