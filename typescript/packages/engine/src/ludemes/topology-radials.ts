/**
 * Flat-board radial precomputation for the 1:1 Java→TS port.
 *
 * @java other/topology/Topology.java — radials() (trajectories) computation
 * @java game/util/graph/Radial.java — Radial class (a directed ray of steps)
 *
 * For a W×H flat board, we precompute for each cell the 4 distinct axis rays:
 *   - E/W (horizontal)   → row ray in +x and -x directions
 *   - N/S (vertical)     → column ray in +y and -y directions
 *   - NE/SW (diagonal /) → diagonal ray in +x+y and -x-y directions
 *   - NW/SE (diagonal \) → diagonal ray in -x+y and +x-y directions
 *
 * Each axis is stored as a distinct { ray, opposite } pair in the cell's
 * radial map. Java's `radials(type, pivot).distinctInDirection(Adjacent)` for
 * a square board returns these 4 pairs (one per unique undirected axis) when
 * direction=Adjacent. IsLine walks the forward ray, then the opposite ray,
 * counting the contiguous run through the pivot.
 *
 * The structure mirrors Java's Trajectories.distinctInDirection():
 *   for each pair { ray, opposite }:
 *     ray[0] == pivot, ray[1..] == forward sites
 *     opposite[0] == pivot, opposite[1..] == backward sites
 */

// Lazy import to avoid circular deps — only used by buildGraphRadials.
import type { Trajectories } from "../eval/graph/trajectories.js";

export interface FlatRadial {
  /** Sites from pivot outward in this direction, starting with pivot. */
  readonly ray: readonly number[];
  /** Sites from pivot in the opposite direction, starting with pivot. */
  readonly opposite: readonly number[];
}

/** All 4 axis radials for a single cell. */
export interface CellFlatRadials {
  // Stored as a list of distinct axis pairs.
  readonly axes: readonly FlatRadial[];
}

/**
 * Build the full radial precomputation table for a W×H board.
 * Returns an array indexed by cell index (row-major, y*W+x).
 *
 * @java other/topology/Topology.java — radials/trajectories build
 * @java game/util/graph/Radial.java
 */
export function buildFlatRadials(width: number, height: number): CellFlatRadials[] {
  const n = width * height;
  const result: CellFlatRadials[] = new Array(n);

  for (let site = 0; site < n; site++) {
    const x = site % width;
    const y = Math.floor(site / width);

    // Build ray in a direction (dx, dy) starting from (x, y), inclusive.
    const buildRay = (dx: number, dy: number): number[] => {
      const ray: number[] = [site];
      let cx = x + dx, cy = y + dy;
      while (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        ray.push(cy * width + cx);
        cx += dx;
        cy += dy;
      }
      return ray;
    };

    // Axis 0: Horizontal E(+x) / W(-x)
    const axisEW: FlatRadial = {
      ray: buildRay(1, 0),
      opposite: buildRay(-1, 0),
    };

    // Axis 1: Vertical N(+y) / S(-y)
    const axisNS: FlatRadial = {
      ray: buildRay(0, 1),
      opposite: buildRay(0, -1),
    };

    // Axis 2: Diagonal NE(+x+y) / SW(-x-y)
    const axisNESW: FlatRadial = {
      ray: buildRay(1, 1),
      opposite: buildRay(-1, -1),
    };

    // Axis 3: Diagonal NW(-x+y) / SE(+x-y)
    const axisNWSE: FlatRadial = {
      ray: buildRay(-1, 1),
      opposite: buildRay(1, -1),
    };

    result[site] = { axes: [axisEW, axisNS, axisNESW, axisNWSE] };
  }

  return result;
}

/**
 * Filter radials by direction name.
 * Returns the subset of the 4 axes that match the requested direction.
 *
 * For "Adjacent" or "Diagonal" or "Orthogonal" or specific compass names,
 * we select the appropriate subset, mirroring Java IsLine's dirn parameter.
 *
 * @java game/functions/directions/Directions.java — absoluteDirection()
 * @java game/util/directions/AbsoluteDirection.java
 */
export function radialsForDirection(
  radials: CellFlatRadials,
  dirName: string,
): readonly FlatRadial[] {
  const upper = dirName.toUpperCase();
  const axes = radials.axes;

  // Adjacent = all 8 directions = all 4 axes
  // Orthogonal = N,S,E,W = axes 0 (EW) + 1 (NS)
  // Diagonal = NE,NW,SE,SW = axes 2 (NESW) + 3 (NWSE)
  switch (upper) {
    case "ADJACENT":
    case "ALL":
      return axes; // all 4 axes
    case "ORTHOGONAL":
      return [axes[0]!, axes[1]!]; // EW, NS
    case "DIAGONAL":
      return [axes[2]!, axes[3]!]; // NESW, NWSE
    case "E":
    case "EAST":
      return [axes[0]!];
    case "W":
    case "WEST":
      return [{ ray: axes[0]!.opposite, opposite: axes[0]!.ray }];
    case "N":
    case "NORTH":
      return [axes[1]!];
    case "S":
    case "SOUTH":
      return [{ ray: axes[1]!.opposite, opposite: axes[1]!.ray }];
    case "NE":
    case "NORTHEAST":
      return [axes[2]!];
    case "SW":
    case "SOUTHWEST":
      return [{ ray: axes[2]!.opposite, opposite: axes[2]!.ray }];
    case "NW":
    case "NORTHWEST":
      return [axes[3]!];
    case "SE":
    case "SOUTHEAST":
      return [{ ray: axes[3]!.opposite, opposite: axes[3]!.ray }];
    default:
      // Fallback: Adjacent
      return axes;
  }
}

/**
 * Build a CellFlatRadials table from a graph-based Trajectories object.
 *
 * This is the graph-adjacency-driven version of buildFlatRadials, faithful for
 * hex/tri/concentric/any board shape. For each cell, for each "Adjacent"
 * distinct radial pair from Java's distinctInDirection(Adjacent), we collect:
 *   - ray: the forward direction (starts with pivot)
 *   - opposite: the backward direction (starts with pivot, or just [pivot])
 *
 * @java other/topology/Topology.java — preGenerateDirection(game): builds each
 *   cell's directional rays by walking the graph's neighbour relation.
 * @java game/util/graph/Radials.java — distinctInDirection(Adjacent)
 */
export function buildGraphRadials(traj: Trajectories): CellFlatRadials[] {
  const n = traj.numSites;
  const result: CellFlatRadials[] = new Array(n);

  for (let site = 0; site < n; site++) {
    // Get all distinct radials for the "Adjacent" direction group.
    // Java: radials(type, site).distinctInDirection(Adjacent)
    const distinctRadials = traj.distinctRadialsByName(site, "Adjacent");

    const axes: FlatRadial[] = [];
    for (const { ray, opposites } of distinctRadials) {
      // ray[0] is the pivot (site itself); ray[1..] are the forward steps.
      // opposites[0] (if present) is the geometric opposite ray starting at pivot.
      const opposite = (opposites.length > 0 && opposites[0] !== undefined)
        ? opposites[0]
        : [site];
      axes.push({ ray, opposite });
    }

    result[site] = { axes };
  }

  return result;
}
