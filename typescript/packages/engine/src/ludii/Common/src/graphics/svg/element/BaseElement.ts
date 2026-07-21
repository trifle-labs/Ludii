// @java Common/src/graphics/svg/element/BaseElement.java

/**
 * Base SVG element type.
 *
 * @java graphics/svg/element/BaseElement.java
 * @author cambolbro
 */

import type { Element } from "./Element.js";
import { Style } from "./Style.js";

// Rectangle2D.Double shim for bounds — using a simple plain object
// (java.awt.geom.Rectangle2D.Double is in the awt shim but not imported here
// to avoid a dependency chain; a simple struct suffices).
interface Rect2D {
  x: number;
  y: number;
  width: number;
  height: number;
  setRect(x: number, y: number, w: number, h: number): void;
}

function makeRect2D(x = 0, y = 0, width = 0, height = 0): Rect2D {
  const r: Rect2D = { x, y, width, height, setRect(nx, ny, nw, nh) { r.x = nx; r.y = ny; r.width = nw; r.height = nh; } };
  return r;
}

// ---------------------------------------------------------------------------

/**
 * Base SVG element type.
 *
 * @java graphics.svg.element.BaseElement
 */
export abstract class BaseElement implements Element {
  /** @java BaseElement.label */
  private readonly _label: string;

  /** @java BaseElement.filePos */
  private _filePos: number = 0;

  /** @java BaseElement.style */
  protected readonly style_: Style = new Style();

  /** @java BaseElement.bounds */
  protected bounds: Rect2D = makeRect2D();

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

  // --------------------------------------------------------------------------

  /** @java BaseElement.filePos() */
  public filePos(): number {
    return this._filePos;
  }

  /** @java BaseElement.setFilePos(int) */
  public setFilePos(pos: number): void {
    this._filePos = pos;
  }

  /** @java BaseElement.style() */
  public style(): Style {
    return this.style_;
  }

  // --------------------------------------------------------------------------

  /** @java BaseElement.bounds() */
  public getBounds(): Rect2D {
    return this.bounds;
  }

  /**
   * Set bounds for this shape.
   *
   * @java BaseElement.setBounds()
   */
  public abstract setBounds(): void;

  // --------------------------------------------------------------------------

  /**
   * @return Stroke width of element (else 0 is none specified).
   *
   * @java BaseElement.strokeWidth()
   */
  public strokeWidth(): number {
    return 0; // default implementation
  }

  // --------------------------------------------------------------------------

  // Abstract methods required by Element interface
  public abstract newInstance(): Element;
  public abstract newOne(): Element;
  public abstract load(expr: string): boolean;
  public abstract render(
    g2d: unknown,
    x0: number,
    y0: number,
    footprintColour: unknown,
    fillColour: unknown,
    strokeColour: unknown
  ): void;
}
