// @java Common/src/graphics/svg/element/style/FillOpacity.java

import type { Color } from '../../../../../../awt/Color.js';
import type { Graphics2D } from '../../../../../../awt/Graphics2D.js';
import { Rectangle2D } from '../../../../../../awt/geom/Rectangle2D.js';

// Style and BaseElement are ported by batch Common#3 / Common#0.
// Provide a structural base here so this file compiles independently.

/** @java graphics.svg.element.Element */
export interface Element {
  label(): string;
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

/** Abstract base mirroring BaseElement + style.Style for the style subclasses. */
abstract class StyleBase implements Element {
  private readonly _label: string;
  private _filePos: number = 0;
  protected readonly _bounds: Rectangle2D.Double = new Rectangle2D.Double();

  protected constructor(label: string) {
    this._label = label;
  }

  label(): string { return this._label; }
  compare(other: Element): number {
    return this._filePos - (other as unknown as { _filePos: number })._filePos;
  }
  filePos(): number { return this._filePos; }
  setFilePos(pos: number): void { this._filePos = pos; }

  // Default load — subclasses override
  load(_expr: string): boolean { return true; }

  abstract newOne(): Element;
  abstract newInstance(): Element | null;
  abstract render(
    g2d: Graphics2D,
    x0: number,
    y0: number,
    footprintColour: Color | null,
    fillColour: Color | null,
    strokeColour: Color | null,
  ): void;
  abstract setBounds(): void;
}

// -----------------------------------------------------------------------------

/**
 * SVG fill opacity property.
 *
 * @java graphics/svg/element/style/FillOpacity.java
 * @author cambolbro
 */
export class FillOpacity extends StyleBase {
  // Format:  fill-opacity=".5"

  /** @java FillOpacity.opacity */
  private readonly _opacity: number = 1;

  // ---------------------------------------------------------------------------

  /** @java FillOpacity() */
  public constructor() {
    super('fill-opacity');
  }

  // ---------------------------------------------------------------------------

  /** @java FillOpacity.opacity() */
  public opacity(): number {
    return this._opacity;
  }

  // ---------------------------------------------------------------------------

  /** @java FillOpacity.newOne() */
  public override newOne(): Element {
    return new FillOpacity();
  }

  // ---------------------------------------------------------------------------

  /** @java FillOpacity.load(String) */
  public override load(_expr: string): boolean {
    const okay = true;

    // ...

    return okay;
  }

  /** @java FillOpacity.newInstance() */
  public override newInstance(): Element | null {
    return null;
  }

  /** @java FillOpacity.render(Graphics2D, double, double, Color, Color, Color) */
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

  /** @java FillOpacity.setBounds() */
  public override setBounds(): void {
    // ...
  }

  // ---------------------------------------------------------------------------
}
