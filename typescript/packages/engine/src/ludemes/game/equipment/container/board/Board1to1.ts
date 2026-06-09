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
import type { Track } from "./Track.js";

export class Board1to1 {
  /** Number of play sites on the board (vertices for vertex-play boards). @java Board.numSites() */
  public readonly numSites: number;
  /**
   * The board container's index span = max(numFaces, numPlaySites). Java offsets
   * the NEXT container (hands) by this, NOT by the play-site count — so on a
   * vertex-played board with more cells than vertices (e.g. AlquerqueBoard 5×5:
   * 25 vertices, 32 cells) the hand sits at index 32, not 25.
   * @java game/equipment/Equipment.java — initContainer maxSiteMainBoard
   */
  public readonly containerSpan: number;
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
  /** @java Container.tracks */
  private readonly trackList: Track[];
  /** @java Container.ownedTracks */
  private ownedTrackList: Track[][] = [];

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
  public constructor(width: number, height: number, numSites: number, traj: Trajectories, numFaces?: number, tracks?: readonly Track[]);
  public constructor(
    width: number,
    height: number,
    numSitesOrUndefined?: number,
    traj?: Trajectories,
    numFaces?: number,
    tracks: readonly Track[] = [],
  ) {
    this.width = width;
    this.height = height;
    this.trackList = [...tracks];
    if (traj !== undefined && numSitesOrUndefined !== undefined) {
      // Graph-based path: use pre-built Trajectories.
      this.numSites = numSitesOrUndefined;
      this.trajectories = traj;
      // @java other/topology/Topology.java — preGenerateDirection(game)
      this.radials = buildGraphRadials(traj);
      // Container span = max(numFaces, numPlaySites) — see field doc.
      this.containerSpan = Math.max(numFaces ?? this.numSites, this.numSites);
    } else {
      // Square/rectangle path: cells == play sites, so the span equals numSites.
      this.numSites = width * height;
      this.trajectories = null;
      // @java other/topology/Topology.java — buildRadials() (called during Game.create)
      this.radials = buildFlatRadials(width, height);
      this.containerSpan = this.numSites;
    }
    for (const track of this.trackList) track.buildTrack(this.width, this.height, this.trajectories);
  }

  /** @java Container.tracks() */
  public tracks(): Track[] { return this.trackList; }

  /** @java Container.tracks() adapter used by faithful Equipment. */
  public getTracks(): readonly Track[] { return this.trackList; }

  /** @java Container.ownedTracks(int) */
  public ownedTracks(owner: number): Track[] {
    return this.ownedTrackList[owner] ?? [];
  }

  /** @java Container.setOwnedTrack(Track[][]) */
  public setOwnedTrack(ownedTracks: Track[][]): void {
    this.ownedTrackList = ownedTracks;
  }

  /** @java Container.defaultSite() */
  public defaultSite(): string { return "Cell"; }

  /** @java Container.numSites() */
  public numSitesFn(): number { return this.numSites; }
}
