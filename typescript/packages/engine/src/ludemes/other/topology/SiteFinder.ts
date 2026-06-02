// @java Core/src/other/topology/SiteFinder.java SiteFinder
/**
 * Find a topology element with a specified coordinate label.
 *
 * Faithful 1:1 transliteration of other.topology.SiteFinder.
 *
 * @author cambolbro and Eric.Piette  (Java original)
 */

import type { TopologyElement, SiteType } from "./TopologyElement.js";
import type { Topology } from "./Topology.js";

/**
 * Minimal Board surface needed by SiteFinder.
 * The real Board lives in game.equipment.container.board; we use a structural
 * interface here to stay self-contained.
 */
export interface BoardLike {
  defaultSite(): SiteType;
  topology(): Topology;
}

/**
 * Utility class for looking up a topology element by its coordinate label.
 * @java other.topology.SiteFinder
 */
export class SiteFinder {
  /** Utility class — do not instantiate. */
  private constructor() { /* no-op */ }

  /**
   * Find the topology element matching the given coordinate label.
   *
   * @param board  The board.
   * @param coord  The coordinate label (e.g. "A4", "D1").
   * @param type   The graph element type, or null to use board default.
   * @returns The matching element, or null if not found.
   *
   * @java SiteFinder#find(Board,String,SiteType)
   */
  static find(
    board: BoardLike,
    coord: string,
    type: SiteType | null,
  ): TopologyElement | null {
    if (
      (type === null && board.defaultSite() === "Cell") ||
      (type !== null && type === "Cell")
    ) {
      for (const cell of board.topology().cells()) {
        if (cell.label() === coord) return cell;
      }
    } else if (
      (type === null && board.defaultSite() === "Vertex") ||
      (type !== null && type === "Vertex")
    ) {
      for (const vertex of board.topology().vertices()) {
        if (vertex.label() === coord) return vertex;
      }
    }

    return null;
  }
}
