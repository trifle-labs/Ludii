/**
 * @java game/equipment/container/board/Board.java Board
 *
 * 1:1-port board data structure.
 *
 * Holds: the number of sites (cell count), the board dimensions for square
 * boards, and the precomputed radials table used by IsLine.
 *
 * @java game/equipment/container/board/Board.java — numSites(), topology()
 * @java other/topology/Topology.java — radials/trajectories
 */

import { buildFlatRadials, type CellFlatRadials } from "../../../../topology-radials.js";

export class Board1to1 {
  /** Number of cells on the board. @java Board.numSites() */
  public readonly numSites: number;
  /** Board width (for square boards). */
  public readonly width: number;
  /** Board height (for square boards). */
  public readonly height: number;
  /**
   * Precomputed radials for each cell, indexed by cell index.
   * @java other/topology/Topology.java — trajectories().radials(type, site)
   */
  public readonly radials: readonly CellFlatRadials[];

  /**
   * @java game/equipment/container/board/Board.java — create()/build()
   *
   * @param width  Board width
   * @param height Board height
   */
  public constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.numSites = width * height;
    // Precompute all radials.
    // @java other/topology/Topology.java — buildRadials() (called during Game.create)
    this.radials = buildFlatRadials(width, height);
  }
}
