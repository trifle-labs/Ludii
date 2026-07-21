// @java Common/src/graphics/svg/element/shape/Circle.java

/**
 * SVG circle shape.
 *
 * @java graphics/svg/element/shape/Circle.java
 * @author cambolbro
 */

// Shape / BaseElement / Element / Style are ported in batch Common#0.
// Use escape-hatch interfaces until those files are available.

/** @java graphics/svg/element/Style.java (escape hatch) */
interface StyleLike {
  fill(): unknown;
  stroke(): unknown;
  strokeWidth(): number;
  load(expr: string): boolean;
}

function makeStyleLike(): StyleLike {
  return {
    fill(): unknown { return null; },
    stroke(): unknown { return null; },
    strokeWidth(): number { return 0; },
    load(_expr: string): boolean { return true; },
  };
}

/** Minimal Rectangle2D.Double shim */
interface Rect2D {
  x: number; y: number; width: number; height: number;
  setRect(x: number, y: number, w: number, h: number): void;
}

function makeRect2D(): Rect2D {
  const r: Rect2D = {
    x: 0, y: 0, width: 0, height: 0,
    setRect(x: number, y: number, w: number, h: number): void {
      r.x = x; r.y = y; r.width = w; r.height = h;
    },
  };
  return r;
}

// Format: <circle cx="50" cy="50" r="25" />

// SVGParser helper inlined (SVGParser not yet ported)
function isNumeric(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
}

function extractDouble(expr: string, heading: string): number | null {
  const pos = expr.indexOf(heading);
  if (pos < 0) return null;
  let c = pos + heading.length;
  while (c < expr.length && !isNumeric(expr.charAt(c)))
    c++;
  let cc = c + 1;
  while (cc < expr.length && isNumeric(expr.charAt(cc)))
    cc++;
  const sub = expr.substring(c, cc);
  const result = parseFloat(sub);
  return isNaN(result) ? null : result;
}

// -----------------------------------------------------------------------------

/**
 * SVG circle shape.
 * Mirrors Shape → BaseElement → Element hierarchy via local minimal base.
 *
 * @java graphics/svg/element/shape/Circle.java
 */
export class Circle {
  /** @java BaseElement.label */
  private readonly _label: string;

  /** @java BaseElement.filePos */
  private filePos: number = 0;

  /** @java BaseElement.style */
  protected readonly style: StyleLike = makeStyleLike();

  /** @java BaseElement.bounds */
  protected readonly _bounds: Rect2D = makeRect2D();

  // Circle fields
  /** @java Circle.cx */
  private cx: number = 0;

  /** @java Circle.cy */
  private cy: number = 0;

  /** @java Circle.r */
  private r: number = 0;

  // --------------------------------------------------------------------------

  /** @java Circle() */
  public constructor() {
    this._label = "circle";
  }

  // --------------------------------------------------------------------------

  /** @java BaseElement.label() */
  public label(): string { return this._label; }

  /** @java BaseElement.filePos() */
  public getFilePos(): number { return this.filePos; }

  /** @java BaseElement.setFilePos(int) */
  public setFilePos(pos: number): void { this.filePos = pos; }

  /** @java BaseElement.style() */
  public getStyle(): StyleLike { return this.style; }

  /** @java BaseElement.bounds() */
  public bounds(): Rect2D { return this._bounds; }

  /** @java BaseElement.strokeWidth() */
  public strokeWidth(): number { return this.style.strokeWidth(); }

  // --------------------------------------------------------------------------

  /** @java BaseElement.compare(Element) */
  public compare(other: Circle): number {
    return this.filePos - other.filePos;
  }

  // --------------------------------------------------------------------------

  /** @java Circle.cx() */
  public getCx(): number { return this.cx; }

  /** @java Circle.cy() */
  public getCy(): number { return this.cy; }

  /** @java Circle.r() */
  public getR(): number { return this.r; }

  // --------------------------------------------------------------------------

  /** @java Circle.newInstance() */
  public newInstance(): Circle {
    return new Circle();
  }

  /** @java Element.newOne() */
  public newOne(): Circle {
    return new Circle();
  }

  // --------------------------------------------------------------------------

  /** @java Circle.setBounds() */
  public setBounds(): void {
    const x = this.cx - this.r;
    const y = this.cy - this.r;
    const width  = 2 * this.r;
    const height = 2 * this.r;
    this._bounds.setRect(x, y, width, height);
  }

  // --------------------------------------------------------------------------

  /** @java Circle.load(String) */
  public load(expr: string): boolean {
    if (!this.style.load(expr))
      return false;

    if (expr.includes(" cx=")) {
      const result = extractDouble(expr, " cx=");
      if (result === null)
        return false;
      this.cx = result;
    }

    if (expr.includes(" cy=")) {
      const result = extractDouble(expr, " cy=");
      if (result === null)
        return false;
      this.cy = result;
    }

    if (expr.includes(" r=")) {
      const result = extractDouble(expr, " r=");
      if (result === null)
        return false;
      this.r = result;
    }

    return true;
  }

  // --------------------------------------------------------------------------

  /** @java Circle.toString() */
  public toString(): string {
    return (
      this._label +
      ": fill=" + this.style.fill() +
      ", stroke=" + this.style.stroke() +
      ", strokeWidth=" + this.style.strokeWidth() +
      " : cx=" + this.cx +
      ", cy=" + this.cy +
      ", r=" + this.r
    );
  }

  // --------------------------------------------------------------------------

  /** @java Circle.render(Graphics2D, double, double, Color, Color, Color) */
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

  // --------------------------------------------------------------------------
}
