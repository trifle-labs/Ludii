// @java Common/src/graphics/svg/element/style/Style.java

/**
 * Base class for SVG paint elements.
 *
 * @java graphics/svg/element/style/Style.java
 * @author cambolbro
 */

import type { Color } from "../../../../../../awt/Color.js";
import type { Graphics2D } from "../../../../../../awt/Graphics2D.js";

// ---------------------------------------------------------------------------
// Minimal shims for not-yet-ported types referenced by BaseElement
// ---------------------------------------------------------------------------

/** Minimal Rectangle2D.Double shim */
export interface RectDouble {
  x: number;
  y: number;
  width: number;
  height: number;
  getX(): number;
  getY(): number;
  getWidth(): number;
  getHeight(): number;
  setRect(x: number, y: number, w: number, h: number): void;
  add(other: RectDouble): void;
}

export function makeRectDouble(x = 0, y = 0, width = 0, height = 0): RectDouble {
  const r: RectDouble = {
    x, y, width, height,
    getX() { return this.x; },
    getY() { return this.y; },
    getWidth() { return this.width; },
    getHeight() { return this.height; },
    setRect(nx, ny, nw, nh) { this.x = nx; this.y = ny; this.width = nw; this.height = nh; },
    add(other: RectDouble) {
      const x1 = Math.min(this.x, other.x);
      const y1 = Math.min(this.y, other.y);
      const x2 = Math.max(this.x + this.width, other.x + other.width);
      const y2 = Math.max(this.y + this.height, other.y + other.height);
      this.x = x1; this.y = y1; this.width = x2 - x1; this.height = y2 - y1;
    },
  };
  return r;
}

// ---------------------------------------------------------------------------
// ElementStyle (from graphics.svg.element.Style)
// ---------------------------------------------------------------------------

/** @java graphics.svg.element.Style — paint style stored on each element */
export interface ElementStyle {
  stroke(): Color | null;
  setStroke(clr: Color | null): void;
  fill(): Color | null;
  setFill(clr: Color | null): void;
  strokeWidth(): number;
  setStrokeWidth(val: number): void;
  load(expr: string): boolean;
  toString(): string;
}

// ---------------------------------------------------------------------------
// Element interface
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// BaseElement abstract class
// ---------------------------------------------------------------------------

/** @java graphics.svg.element.BaseElement */
export abstract class BaseElement implements Element {
  /** @java BaseElement.label */
  private readonly _label: string;

  /** @java BaseElement.filePos */
  private _filePos = 0;

  /** @java BaseElement.style */
  protected readonly _style: ElementStyle = makeElementStyle();

  /** @java BaseElement.bounds */
  protected _bounds: RectDouble = makeRectDouble();

  // --------------------------------------------------------------------------

  /** @java BaseElement(String) */
  public constructor(label: string) {
    this._label = label;
  }

  // --------------------------------------------------------------------------

  /** @java BaseElement.label() */
  public label(): string {
    return this._label;
  }

  /** @java BaseElement.compare(Element) */
  public compare(other: Element): number {
    return this._filePos - (other as unknown as BaseElement)._filePos;
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

  /** @java BaseElement.bounds() */
  public bounds(): RectDouble {
    return this._bounds;
  }

  /** @java BaseElement.strokeWidth() */
  public strokeWidth(): number {
    return 0;
  }

  // --------------------------------------------------------------------------

  /** @java BaseElement.setBounds() */
  public abstract setBounds(): void;

  /** @java Element.newInstance() */
  public abstract newInstance(): Element | null;

  /** @java Element.newOne() */
  public abstract newOne(): Element;

  /** @java Element.load(String) */
  public abstract load(expr: string): boolean;

  /** @java Element.render(...) */
  public abstract render(
    g2d: Graphics2D,
    x0: number,
    y0: number,
    footprintColour: Color | null,
    fillColour: Color | null,
    strokeColour: Color | null,
  ): void;
}

// ---------------------------------------------------------------------------
// Style abstract class (graphics.svg.element.style.Style)
// ---------------------------------------------------------------------------

/** @java graphics.svg.element.style.Style — base class for SVG paint style elements */
export abstract class Style extends BaseElement {
  // --------------------------------------------------------------------------

  /** @java Style(String) */
  public constructor(label: string) {
    super(label);
  }

  // --------------------------------------------------------------------------

  /**
   * Load this element's painting properties.
   * @return Whether expression is in the right format and data was loaded.
   *
   * @java Style.load(String)
   */
  public override load(_expr: string): boolean {
    return true;
  }

  // --------------------------------------------------------------------------

  /** @java Style.newOne() */
  public override newOne(): Element {
    // Java returns new StrokeDashArray() — not yet ported; return self as placeholder
    return this.newInstance() ?? (this as unknown as Element);
  }

  // --------------------------------------------------------------------------
}

// ---------------------------------------------------------------------------
// Helper: create a concrete ElementStyle
// ---------------------------------------------------------------------------

/** @java graphics.svg.element.Style (the separate plain class, not the abstract one above) */
function makeElementStyle(): ElementStyle {
  let _stroke: import("../../../../../../awt/Color.js").Color | null = null;
  let _fill: import("../../../../../../awt/Color.js").Color | null = null;
  let _strokeWidth = 0;

  return {
    stroke() { return _stroke; },
    setStroke(clr) { _stroke = clr; },
    fill() { return _fill; },
    setFill(clr) { _fill = clr; },
    strokeWidth() { return _strokeWidth; },
    setStrokeWidth(val) { _strokeWidth = val; },
    load(_expr: string) { return true; },
    toString() {
      return `<fill=(${_fill}) stroke=(${_stroke}) strokeWidth=(${_strokeWidth})>`;
    },
  };
}
