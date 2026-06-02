// @java Core/src/other/GraphUtilities.java GraphUtilities
/**
 * Faithful 1:1 transliteration of other.GraphUtilities.
 *
 * Java parity: other/GraphUtilities.java
 *
 * Static utility class for mutating neighbour / adjacency lists on topology
 * graph elements (Cell, Vertex, Edge).
 *
 * Deferrals:
 *  - Cell / Vertex / Edge: imported from their TS transliterations in the
 *    topology subfolder.
 *  - TopologyElement: same import path.
 *  - SiteType: reuses the string-union already established in TopologyElement.ts.
 *
 * @author Eric.Piette (Java)
 * TypeScript transliteration.
 */

import { type SiteType } from "../topology/TopologyElement.js";
import { Cell }           from "../topology/Cell.js";
import { Edge }           from "../topology/Edge.js";
import { Vertex }         from "../topology/Vertex.js";

// Re-export so callers can reference TopologyElement via this module if desired.
export type { SiteType };

/** Union of concrete element types returned from the topology package. */
export type TopologyElement = Cell | Vertex | Edge;

// ---------------------------------------------------------------------------
// GraphUtilities — utility class, do not construct
// ---------------------------------------------------------------------------

/**
 * Graph utility methods.
 *
 * @author Eric.Piette (Java)
 * TypeScript transliteration.
 */
export class GraphUtilities {

  /** @java private GraphUtilities() — utility class, do not construct */
  private constructor() {
    // Nothing to do
  }

  // -------------------------------------------------------------------------

  /**
   * Add a neighbour element to a graph element.
   *
   * @param type      The type of the graph element.
   * @param element   The element.
   * @param neighbour The neighbour to add.
   *
   * @java public static void addNeighbour(SiteType type, TopologyElement element, TopologyElement neighbour)
   */
  static addNeighbour(type: SiteType, element: TopologyElement, neighbour: TopologyElement): void {
    switch (type) {
      case "Cell":
        (element as Cell).neighbours().push(neighbour as Cell);
        break;
      case "Vertex":
        (element as Vertex).neighbours().push(neighbour as Vertex);
        break;
      case "Edge":
        (element as Edge).neighbours().push(neighbour as Edge);
        break;
      default:
        break;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Add an adjacent element to a graph element.
   *
   * @param type     The type of the graph element.
   * @param element  The element.
   * @param adjacent The adjacent element to add.
   *
   * @java public static void addAdjacent(SiteType type, TopologyElement element, TopologyElement adjacent)
   */
  static addAdjacent(type: SiteType, element: TopologyElement, adjacent: TopologyElement): void {
    switch (type) {
      case "Cell":
        (element as Cell).adjacent().push(adjacent as Cell);
        break;
      case "Vertex":
        (element as Vertex).adjacent().push(adjacent as Vertex);
        break;
      case "Edge":
        // @java Edge has no adjacent list — fall through
        break;
      default:
        break;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Add an orthogonal element to a graph element.
   *
   * @param type       The type of the graph element.
   * @param element    The element.
   * @param orthogonal The orthogonal element to add.
   *
   * @java public static void addOrthogonal(SiteType type, TopologyElement element, TopologyElement orthogonal)
   */
  static addOrthogonal(type: SiteType, element: TopologyElement, orthogonal: TopologyElement): void {
    switch (type) {
      case "Cell":
        (element as Cell).orthogonal().push(orthogonal as Cell);
        break;
      case "Vertex":
        (element as Vertex).orthogonal().push(orthogonal as Vertex);
        break;
      case "Edge":
        // @java Edge has no orthogonal list — fall through
        break;
      default:
        break;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Add a diagonal element to a graph element.
   *
   * @param type     The type of the graph element.
   * @param element  The element.
   * @param diagonal The diagonal element to add.
   *
   * @java public static void addDiagonal(SiteType type, TopologyElement element, TopologyElement diagonal)
   */
  static addDiagonal(type: SiteType, element: TopologyElement, diagonal: TopologyElement): void {
    switch (type) {
      case "Cell":
        (element as Cell).diagonal().push(diagonal as Cell);
        break;
      case "Vertex":
        (element as Vertex).diagonal().push(diagonal as Vertex);
        break;
      case "Edge":
        // @java Edge has no diagonal list — fall through
        break;
      default:
        break;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Add an off element to a graph element.
   *
   * @param type    The type of the graph element.
   * @param element The element.
   * @param off     The off element to add.
   *
   * @java public static void addOff(SiteType type, TopologyElement element, TopologyElement off)
   */
  static addOff(type: SiteType, element: TopologyElement, off: TopologyElement): void {
    switch (type) {
      case "Cell":
        (element as Cell).off().push(off as Cell);
        break;
      case "Vertex":
        (element as Vertex).off().push(off as Vertex);
        break;
      case "Edge":
        // @java Edge has no off list — fall through
        break;
      default:
        break;
    }
  }

  // -------------------------------------------------------------------------
}
