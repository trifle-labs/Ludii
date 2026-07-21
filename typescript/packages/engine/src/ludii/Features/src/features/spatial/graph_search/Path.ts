// @java Features/src/features/spatial/graph_search/Path.java

/**
 * A Path used in graph search algorithms for features. A path consists of a
 * starting site, a destination site (may be null for off-board, or may be
 * the same as the start vertex for a 0-length path), and a Walk that moves from
 * the start to the destination.
 *
 * @java features/spatial/graph_search/Path.java
 * @author Dennis Soemers
 */

import { Walk, TopologyElement } from "../Walk.js";

//-----------------------------------------------------------------------------

/**
 * @java features.spatial.graph_search.Path
 */
export class Path {

  //-------------------------------------------------------------------------

  /** List of sites on this path */
  protected readonly sites_: TopologyElement[];

  /** */
  protected readonly walk_: Walk;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param sites
   * @param walk
   * @java Path(List, Walk)
   */
  constructor(sites: TopologyElement[], walk: Walk) {
    this.sites_ = sites;
    this.walk_ = walk;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Destination TopologyElement
   * @java Path.destination()
   */
  public destination(): TopologyElement {
    return this.sites_[this.sites_.length - 1]!;
  }

  /**
   * @return Start TopologyElement
   * @java Path.start()
   */
  public start(): TopologyElement {
    return this.sites_[0]!;
  }

  /**
   * @return All sites on the path
   * @java Path.sites()
   */
  public sites(): TopologyElement[] {
    return this.sites_;
  }

  /**
   * @return The Walk
   * @java Path.walk()
   */
  public walk(): Walk {
    return this.walk_;
  }

  //-------------------------------------------------------------------------
}
