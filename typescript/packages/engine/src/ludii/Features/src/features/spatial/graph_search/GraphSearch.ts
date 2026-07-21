// @java Features/src/features/spatial/graph_search/GraphSearch.java

/**
 * Some useful graph search algorithms. These are intended to be used specifically
 * with features (e.g. for finding / constructing features), so they follow similar
 * rules as the Walks in features do (e.g. no diagonal connections, allow connections
 * to off-board "locations", ...)
 *
 * @java features/spatial/graph_search/GraphSearch.java
 * @author Dennis Soemers
 */

import { Walk, TopologyElement, Game } from "../Walk.js";
import { Path } from "./Path.js";

//-----------------------------------------------------------------------------

/**
 * @java features.spatial.graph_search.GraphSearch
 */
export class GraphSearch {

  //-------------------------------------------------------------------------

  /**
   * Private constructor — no need to instantiate
   * @java GraphSearch()
   */
  private constructor() {
    // no need to instantiate
  }

  //-------------------------------------------------------------------------

  /**
   * Implemented using uniform-cost search, we don't really have meaningful
   * costs or heuristics for Dijkstra's or A*
   *
   * @param game
   * @param startSite
   * @param destination
   * @return Shortest path from startSite to destination
   * @java GraphSearch.shortestPathTo(Game, TopologyElement, TopologyElement)
   */
  public static shortestPathTo(
    game: Game,
    startSite: TopologyElement,
    destination: TopologyElement,
  ): Path | null {
    const alreadyVisited = new Set<number>();

    const fringe: Path[] = [];
    let pathSites: TopologyElement[] = [startSite];
    fringe.push(new Path(pathSites, new Walk()));
    alreadyVisited.add(startSite.index());
    const sites = game.graphPlayElements();

    while (fringe.length > 0) {
      const path = fringe.shift()!;
      const pathEnd = path.destination();
      const numOrthos = pathEnd.sortedOrthos().length;
      const rotations = Walk.rotationsForNumOrthos(numOrthos);

      for (let i = 0; i < rotations.length; ++i) {
        const nextStep = rotations[i]!;

        // create a new walk with this new step
        const newWalk = new Walk(path.walk());
        newWalk.steps.push(nextStep);

        // see where we would end up if we were to follow this walk
        const destinations = newWalk.resolveWalk(game, startSite, 0.0, 1);

        if (destinations.length !== 1) {
          console.error(
            "WARNING: GraphSearch.shortestPathTo() resolved " +
            "a walk with " + destinations.length + " destinations!",
          );
        }

        const endWalkIdx = destinations[0]!;

        if (destination.index() === endWalkIdx) {
          // we're done
          pathSites = [...path.sites(), destination];
          return new Path(pathSites, newWalk);
        } else if (endWalkIdx >= 0 && !alreadyVisited.has(endWalkIdx)) {
          // new path for fringe
          alreadyVisited.add(endWalkIdx);
          pathSites = [...path.sites(), sites[endWalkIdx]!];
          fringe.push(new Path(pathSites, newWalk));
        }
      }
    }

    return null;
  }

  //-------------------------------------------------------------------------
}
