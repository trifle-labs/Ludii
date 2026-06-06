// @java Common/src/graphics/svg/element/shape/path/PathOp.java

/**
 * An SVG path operation.
 *
 * @java graphics/svg/element/shape/path/PathOp.java
 * @author cambolbro
 */

/** Minimal Point2D shim — mirrors java.awt.geom.Point2D.Double */
export interface Point2D {
  getX(): number;
  getY(): number;
}

export function makePoint2D(x: number, y: number): Point2D {
  return { getX: () => x, getY: () => y };
}

/** Minimal Rectangle2D shim — mirrors java.awt.geom.Rectangle2D.Double */
export interface Rectangle2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function makeRect(x: number, y: number, width: number, height: number): Rectangle2D {
  return { x, y, width, height };
}

/** Minimal GeneralPath shim — mirrors java.awt.geom.GeneralPath */
export interface GeneralPath {
  getCurrentPoint(): Point2D;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadTo(x1: number, y1: number, x: number, y: number): void;
  curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void;
  closePath(): void;
}

export function makeGeneralPath(): GeneralPath {
  let currentX = 0;
  let currentY = 0;
  return {
    getCurrentPoint(): Point2D { return makePoint2D(currentX, currentY); },
    moveTo(x: number, y: number): void { currentX = x; currentY = y; },
    lineTo(x: number, y: number): void { currentX = x; currentY = y; },
    quadTo(_x1: number, _y1: number, x: number, y: number): void { currentX = x; currentY = y; },
    curveTo(_x1: number, _y1: number, _x2: number, _y2: number, x: number, y: number): void { currentX = x; currentY = y; },
    closePath(): void { /* no-op in shim */ },
  };
}

// -----------------------------------------------------------------------------

/**
 * Abstract base class for SVG path operations.
 *
 * @java graphics/svg/element/shape/path/PathOp.java
 */
export abstract class PathOp {
  /**
   * Single char label. Can change upper/lower case when loaded.
   *
   * @java PathOp.label
   */
  protected label: string;

  // --------------------------------------------------------------------------

  /**
   * Note: Label will be passed in as upper case, but visible case
   *       will depend on whether it's absolute or relative.
   *
   * @java PathOp(char)
   */
  public constructor(label: string) {
    this.label = label;
  }

  // --------------------------------------------------------------------------

  /**
   * @return Op is absolute if its label is uppercase.
   *
   * @java PathOp.absolute()
   */
  public absolute(): boolean {
    return this.label === this.label.toUpperCase();
  }

  // --------------------------------------------------------------------------

  /**
   * @return Bounds for this path op, or null if none.
   *
   * @java PathOp.bounds()
   */
  public bounds(): Rectangle2D | null {
    return null;
  }

  // --------------------------------------------------------------------------

  /** @java PathOp.label() */
  public getLabel(): string {
    return this.label;
  }

  /** @java PathOp.setLabel(char) */
  public setLabel(ch: string): void {
    this.label = ch;
  }

  /** @java PathOp.matchesLabel(char) */
  public matchesLabel(ch: string): boolean {
    return ch.toUpperCase() === this.label.toUpperCase();
  }

  // --------------------------------------------------------------------------

  /** @java PathOp.isMoveTo() */
  public isMoveTo(): boolean {
    return this.label.toLowerCase() === 'm';
  }

  // --------------------------------------------------------------------------

  /**
   * @return Expected number of number arguments.
   *
   * @java PathOp.expectedNumValues()
   */
  public abstract expectedNumValues(): number;

  // --------------------------------------------------------------------------

  /**
   * @return New element of own type.
   *
   * @java PathOp.newInstance()
   */
  public abstract newInstance(): PathOp;

  /**
   * Load this shape's data from an SVG expression.
   * @return Whether expression is in the right format and data was loaded.
   *
   * @java PathOp.load(String)
   */
  public abstract load(expr: string): boolean;

  // --------------------------------------------------------------------------

  /**
   * Load this shape's data from a list of Doubles.
   *
   * @java PathOp.setValues(List<Double>, Point2D[])
   */
  public abstract setValues(values: number[], current: (Point2D | null)[]): void;

  /**
   * Get points from this path op.
   *
   * @java PathOp.getPoints(List<Point2D>)
   */
  public abstract getPoints(pts: Point2D[]): void;

  // --------------------------------------------------------------------------

  /**
   * Apply this operation to the given path.
   *
   * @java PathOp.apply(GeneralPath, double, double)
   */
  public abstract apply(path: GeneralPath, x0: number, y0: number): void;

  // --------------------------------------------------------------------------
}
