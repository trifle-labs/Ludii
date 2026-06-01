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

import {
  buildFlatRadials,
  buildGraphRadials,
  type CellFlatRadials,
} from "../../../../topology-radials.js";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";

export class Board1to1 {
  /** Number of cells on the board. @java Board.numSites() */
  public readonly numSites: number;
  /** Board width (for square boards, or bounding-box width for others). */
  public readonly width: number;
  /** Board height (for square boards, or bounding-box height for others). */
  public readonly height: number;
  /**
   * Precomputed radials for each cell, indexed by cell index.
   * @java other/topology/Topology.java — trajectories().radials(type, site)
   */
  public readonly radials: readonly CellFlatRadials[];
  /**
   * Trajectories object (non-square boards). Null for W×H square boards.
   * Used by Step/Slide evaluators that need graph adjacency.
   * @java other/topology/Topology.java
   */
  public readonly trajectories: Trajectories | null;

  /**
   * @java game/equipment/container/board/Board.java — create()/build()
   *
   * Square/rectangle path: builds W×H row-major radials.
   */
  public constructor(width: number, height: number);
  /**
   * Graph path: accepts pre-built Trajectories (from buildBoardGraph).
   * @param width  Bounding-box width (for coord helpers)
   * @param height Bounding-box height
   * @param numSites Actual play-site count
   * @param traj Trajectories object for adjacency/radial queries
   */
  public constructor(width: number, height: number, numSites: number, traj: Trajectories);
  public constructor(
    width: number,
    height: number,
    numSitesOrUndefined?: number,
    traj?: Trajectories,
  ) {
    this.width = width;
    this.height = height;
    if (traj !== undefined && numSitesOrUndefined !== undefined) {
      // Graph-based path: use pre-built Trajectories.
      this.numSites = numSitesOrUndefined;
      this.trajectories = traj;
      // @java other/topology/Topology.java — preGenerateDirection(game)
      this.radials = buildGraphRadials(traj);
    } else {
      // Square/rectangle path.
      this.numSites = width * height;
      this.trajectories = null;
      // @java other/topology/Topology.java — buildRadials() (called during Game.create)
      this.radials = buildFlatRadials(width, height);
    }
  }
}
