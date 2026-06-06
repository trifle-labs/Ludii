// @java Common/src/graphics/svg/element/shape/Polygon.java

/**
 * SVG polygon shape.
 *
 * @java graphics/svg/element/shape/Polygon.java
 * @author cambolbro
 */

// Polyline is not yet ported (batch Common#2); use an escape-hatch base class.
// Once Polyline.ts is available, this import can be replaced with the real class.
import type { Element } from "../Element.js";
import { Style } from "../Style.js";

/** @java graphics.svg.element.shape.Polyline — escape-hatch interface until Polyline is ported */
interface PolylineLike extends Element {
  setBounds(): void;
  strokeWidth(): number;
  filePos(): number;
  setFilePos(pos: number): void;
  getBounds(): { x: number; y: number; width: number; height: number };
  points(): ReadonlyArray<{ x: number; y: number }>;
}

/** Minimal Polyline base that Polygon can extend without the real Polyline class. */
abstract class PolylineBase implements PolylineLike {
  protected _label: string;
  protected _filePos: number = 0;
  protected readonly _points: Array<{ x: number; y: number }> = [];
  protected readonly _bounds = { x: 0, y: 0, width: 0, height: 0 };

  /** @java PolylineBase.style_ — inlined style object (no full Style import to keep slim) */
  protected readonly _styleObj = {
    _stroke: null as unknown,
    _fill: null as unknown,
    _strokeWidth: 0,
    stroke() { return this._stroke; },
    fill() { return this._fill; },
    strokeWidth() { return this._strokeWidth; },
    setStroke(c: unknown) { this._stroke = c; },
    setFill(c: unknown) { this._fill = c; },
    setStrokeWidth(v: number) { this._strokeWidth = v; },
    load(_expr: string): boolean { return true; },
    toString() { return `<fill=(${this._fill}) stroke=(${this._stroke}) strokeWidth=(${this._strokeWidth})>`; },
  };

  public constructor(label: string) {
    this._label = label;
  }

  /** @java Polyline.label() */
  public label(): string { return this._label; }

  /** @java Polyline.style() */
  public style(): Style { return this._styleObj as unknown as Style; }

  /** @java Polyline.compare(Element) */
  public compare(other: Element): number {
    return this._filePos - (other as unknown as PolylineBase)._filePos;
  }

  /** @java Polyline.filePos() */
  public filePos(): number { return this._filePos; }

  /** @java Polyline.setFilePos(int) */
  public setFilePos(pos: number): void { this._filePos = pos; }

  /** @java Polyline.getBounds() */
  public getBounds(): { x: number; y: number; width: number; height: number } { return this._bounds; }

  /** @java Polyline.strokeWidth() */
  public strokeWidth(): number { return this._styleObj._strokeWidth; }

  /** @java Polyline.points() */
  public points(): ReadonlyArray<{ x: number; y: number }> { return this._points; }

  /** @java Polyline.setBounds() */
  public setBounds(): void {
    let x0 =  10000, y0 =  10000, x1 = -10000, y1 = -10000;
    for (const pt of this._points) {
      if (pt.x < x0) x0 = pt.x;
      if (pt.y < y0) y0 = pt.y;
      if (pt.x > x1) x1 = pt.x;
      if (pt.y > x1) y1 = pt.y;
    }
    this._bounds.x = x0; this._bounds.y = y0;
    this._bounds.width = x1 - x0; this._bounds.height = y1 - y0;
  }

  /** @java Polyline.load(String) */
  public load(expr: string): boolean {
    if (!this._styleObj.load(expr))
      return false;

    const pos = expr.indexOf(" points=\"");
    if (pos === -1) return false;

    let to = pos + 9;
    while (to < expr.length && expr.charAt(to) !== '"')
      to++;

    if (to >= expr.length) {
      console.log("* Failed to close points list in Polyline.");
      return false;
    }

    const subs = expr.substring(pos + 9, to).split(" ");
    for (let n = 0; n < subs.length - 1; n += 2) {
      const x = parseFloat(subs[n] ?? "0");
      const y = parseFloat(subs[n + 1] ?? "0");
      this._points.push({ x, y });
    }
    return true;
  }

  /** @java Polyline.toString() */
  public toString(): string {
    const sb: string[] = [];
    sb.push(`${this._label}: fill=${this._styleObj.fill()}, stroke=${this._styleObj.stroke()}, strokeWidth=${this._styleObj.strokeWidth()}`);
    sb.push(" :");
    for (const pt of this._points)
      sb.push(` (${pt.x},${pt.y})`);
    return sb.join("");
  }

  /** @java Polyline.render(...) */
  public render(
    _g2d: unknown,
    _x0: number,
    _y0: number,
    _footprintColour: unknown,
    _fillColour: unknown,
    _strokeColour: unknown
  ): void {
    // ...
  }

  public abstract newInstance(): Element;
  public abstract newOne(): Element;
}

// ---------------------------------------------------------------------------

/**
 * SVG polygon shape.
 *
 * @java graphics.svg.element.shape.Polygon
 */
export class Polygon extends PolylineBase {

  // --------------------------------------------------------------------------

  /** @java Polygon() */
  public constructor() {
    super("polygon"); // load using Polyline.load()
  }

  // --------------------------------------------------------------------------

  /** @java Polygon.newInstance() */
  public override newInstance(): Element {
    return new Polygon();
  }

  /** @java Polygon.newOne() */
  public override newOne(): Element {
    return new Polygon();
  }

  // --------------------------------------------------------------------------

  /** @java Polygon.render(Graphics2D, double, double, Color, Color, Color) */
  public override render(
    _g2d: unknown,
    _x0: number,
    _y0: number,
    _footprintColour: unknown,
    _fillColour: unknown,
    _strokeColour: unknown
  ): void {
    // ...
  }

  // --------------------------------------------------------------------------
}
