// @java Core/src/game/util/graph/Perimeter.java
//
// Vertex perimeter of a connected component in a graph.
// Tracks elements on/inside the perimeter using arrays (Java List) and
// BitSet equivalents (plain Set<number>).

/**
 * Minimal structural stand-in for Java's Point2D interface.
 * @java java.awt.geom.Point2D
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Minimal structural stand-in for a GraphElement.
 * @java game.util.graph.GraphElement
 */
export interface GraphElement {
  id(): number;
  pt2D(): Point2D;
}

/**
 * Minimal structural stand-in for a Vertex.
 * @java game.util.graph.Vertex
 */
export interface Vertex extends GraphElement {
  id(): number;
  pt2D(): Point2D;
}

/**
 * Vertex perimeter of a connected component in a graph.
 *
 * @java game.util.graph.Perimeter
 */
export class Perimeter {
  /** @java Perimeter.elements — vertices on this perimeter. */
  private readonly _elements: GraphElement[] = [];

  /** @java Perimeter.positions — 2D positions of vertices on this perimeter. */
  private readonly _positions: Point2D[] = [];

  /** @java Perimeter.inside — vertices inside this perimeter (not on it). */
  private readonly _inside: GraphElement[] = [];

  /** @java Perimeter.on — indices of vertices on this perimeter. */
  readonly on: Set<number> = new Set<number>();

  /** @java Perimeter.in — indices of vertices inside this perimeter. */
  readonly in: Set<number> = new Set<number>();

  // -------------------------------------------------------------------------

  /**
   * @java Perimeter.elements() — unmodifiable view.
   */
  public elements(): readonly GraphElement[] {
    return this._elements;
  }

  /**
   * @java Perimeter.positions() — unmodifiable view.
   */
  public positions(): readonly Point2D[] {
    return this._positions;
  }

  /**
   * @java Perimeter.inside() — unmodifiable view.
   */
  public inside(): readonly GraphElement[] {
    return this._inside;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Perimeter.startPoint()
   */
  public startPoint(): Point2D | null {
    if (this._positions.length === 0) return null;
    return this._positions[0]!;
  }

  // -------------------------------------------------------------------------

  /**
   * Clear the perimeter.
   *
   * @java Perimeter.clear()
   */
  public clear(): void {
    this._elements.length = 0;
    this._positions.length = 0;
    this._inside.length = 0;
    this.on.clear();
    this.in.clear();
  }

  // -------------------------------------------------------------------------

  /**
   * Add a vertex to the perimeter.
   *
   * @java Perimeter.add(Vertex vertex)
   */
  public add(vertex: Vertex): void {
    this._elements.push(vertex);
    this._positions.push(vertex.pt2D());
    this.on.add(vertex.id());
  }

  /**
   * Add a vertex inside the perimeter.
   *
   * @java Perimeter.addInside(Vertex vertex)
   */
  public addInside(vertex: Vertex): void {
    this._inside.push(vertex);
    this.in.add(vertex.id());
  }
}
