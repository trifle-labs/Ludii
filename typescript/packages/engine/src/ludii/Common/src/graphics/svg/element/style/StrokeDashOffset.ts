// @java Common/src/graphics/svg/element/style/StrokeDashOffset.java

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
 * SVG dash offset property.
 *
 * @java graphics/svg/element/style/StrokeDashOffset.java
 * @author cambolbro
 */
export class StrokeDashOffset extends StyleBase {
  // Format:  stroke-dashoffset="1"

  /** @java StrokeDashOffset.offset */
  private readonly _offset: number = 1;

  // ---------------------------------------------------------------------------

  /** @java StrokeDashOffset() */
  public constructor() {
    super('stroke-dashoffset');
  }

  // ---------------------------------------------------------------------------

  /** @java StrokeDashOffset.offset() */
  public offset(): number {
    return this._offset;
  }

  // ---------------------------------------------------------------------------

  /** @java StrokeDashOffset.newOne() */
  public override newOne(): Element {
    return new StrokeDashOffset();
  }

  // ---------------------------------------------------------------------------

  /** @java StrokeDashOffset.load(String) */
  public override load(_expr: string): boolean {
    const okay = true;

    // ...

    return okay;
  }

  /** @java StrokeDashOffset.newInstance() */
  public override newInstance(): Element | null {
    return null;
  }

  /** @java StrokeDashOffset.render(Graphics2D, double, double, Color, Color, Color) */
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

  /** @java StrokeDashOffset.setBounds() */
  public override setBounds(): void {
    // ...
  }

  // ---------------------------------------------------------------------------
}
