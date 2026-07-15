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
  width?: number,
): readonly FlatRadial[] {
  const upper = dirName.toUpperCase();
  const axes = radials.axes;

  // Geometry-based match for a single compass direction. The index-based
  // lookups below assume axes are ordered [EW, NS, NESW, NWSE] (buildFlatRadials),
  // but graph-derived _radials (square Cell boards via the trajectory path) store
  // axes in DISCOVERY order — for the corner site 0, axes[0] is the COLUMN, so
  // "E" wrongly returned it and a push ran down the wrong line (Quixo/Tara). When
  // the board width is known, pick the axis whose ray[0]→ray[1] step matches the
  // requested (dx,dy), orienting via `opposite` when the axis points the other way.
  const COMPASS: Record<string, [number, number]> = {
    E: [1, 0], EAST: [1, 0], W: [-1, 0], WEST: [-1, 0],
    N: [0, 1], NORTH: [0, 1], S: [0, -1], SOUTH: [0, -1],
    NE: [1, 1], NORTHEAST: [1, 1], NW: [-1, 1], NORTHWEST: [-1, 1],
    SE: [1, -1], SOUTHEAST: [1, -1], SW: [-1, -1], SOUTHWEST: [-1, -1],
  };
  if (width !== undefined && width > 0 && COMPASS[upper]) {
    const [wantDx, wantDy] = COMPASS[upper]!;
    for (const axis of axes) {
      // try the ray, then its opposite, matching the first-step direction
      for (const cand of [axis, { ray: axis.opposite, opposite: axis.ray }]) {
        const a = cand.ray[0], b = cand.ray[1];
        if (a === undefined || b === undefined) continue;
        const dx = Math.sign((b % width) - (a % width));
        const dy = Math.sign(Math.floor(b / width) - Math.floor(a / width));
        if (dx === wantDx && dy === wantDy) return [cand];
      }
    }
    return [];
  }

  // Adjacent = all 8 directions = all 4 axes
  // Orthogonal = N,S,E,W = axes 0 (EW) + 1 (NS)
  // Diagonal = NE,NW,SE,SW = axes 2 (NESW) + 3 (NWSE)
  //
  // NOTE: For non-square boards (hex/tri/concentric), `axes` has fewer than 4
  // entries. The index-based lookups below use the correct non-null assertion
  // operator AND filter undefined results so callers never receive undefined
  // FlatRadial elements. Graph boards should prefer using Trajectories.distinctRadialsByName
  // for direction-correct lookups (done by Step1to1 / Slide1to1 / Hop evaluators).
  // @java game/util/directions/AbsoluteDirection.java — axis assignment for square boards
  const notUndefined = (x: FlatRadial | undefined): x is FlatRadial => x !== undefined;
  switch (upper) {
    case "ADJACENT":
    case "ALL":
      return axes; // all available axes (3 for hex, 4 for square, etc.)
    case "ORTHOGONAL":
      return [axes[0], axes[1]].filter(notUndefined); // EW, NS
    case "DIAGONAL":
      return [axes[2], axes[3]].filter(notUndefined); // NESW, NWSE
    case "E":
    case "EAST":
      return axes[0] ? [axes[0]] : [];
    case "W":
    case "WEST":
      return axes[0] ? [{ ray: axes[0].opposite, opposite: axes[0].ray }] : [];
    case "N":
    case "NORTH":
      return axes[1] ? [axes[1]] : [];
    case "S":
    case "SOUTH":
      return axes[1] ? [{ ray: axes[1].opposite, opposite: axes[1].ray }] : [];
    case "NE":
    case "NORTHEAST":
      return axes[2] ? [axes[2]] : [];
    case "SW":
    case "SOUTHWEST":
      return axes[2] ? [{ ray: axes[2].opposite, opposite: axes[2].ray }] : [];
    case "NW":
    case "NORTHWEST":
      return axes[3] ? [axes[3]] : [];
    case "SE":
    case "SOUTHEAST":
      return axes[3] ? [{ ray: axes[3].opposite, opposite: axes[3].ray }] : [];
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

  // @java Topology.java preGenerateDirection derives diagonal rays
  // GEOMETRICALLY per SiteType for square-coordinate boards, not from
  // literal edge presence. A plain (square N) Vertex board has ZERO diagonal
  // graph edges, so "Adjacent" below only ever returns the 2 orthogonal
  // axes — never NE/SW or NW/SE — even when a ruleset's push directions
  // require diagonals (Tennessee Waltz's sashay push read [] radials and the
  // whole (then …) cascade silently produced zero actions). Synthesize the 2
  // missing diagonal axis-pairs from vertex coordinates, but ONLY for
  // Vertex boards forming a COMPLETE, unmodified square lattice (whole-board
  // density + orthogonal-edge completeness, checked once up front): a board
  // carved via (remove (square N) edges:{…}) (Gurvan Xudag) still sits on
  // lattice coordinates but is NOT complete — synthesizing there introduced
  // phantom adjacency Java never has (validated as a WINNER_MISMATCH
  // regression before this guard).
  const coordMap = traj.kind === "Vertex" ? buildRegularSquareLatticeCoordMap(traj) : undefined;

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

    if (coordMap !== undefined) {
      const synthesized = synthesizeDiagonalAxes(traj, coordMap, site, axes);
      if (synthesized !== null) axes.push(...synthesized);
    }

    result[site] = { axes };
  }

  return result;
}

function coordKey(x: number, y: number): string {
  return `${Math.round(x * 1e6)}:${Math.round(y * 1e6)}`;
}

/**
 * Whole-board density+completeness check (see buildGraphRadials doc above).
 * Returns the coordinate→site map iff the board is a COMPLETE, unmodified
 * square lattice; otherwise undefined (NO synthesis anywhere on this board).
 */
function buildRegularSquareLatticeCoordMap(traj: Trajectories): Map<string, number> | undefined {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const coordMap = new Map<string, number>();
  for (let s = 0; s < traj.numSites; s += 1) {
    const x = traj.xOf(s);
    const y = traj.yOf(s);
    if (Number.isNaN(x) || Number.isNaN(y)) return undefined;
    if (Math.abs(x - Math.round(x)) > 1e-9 || Math.abs(y - Math.round(y)) > 1e-9) return undefined;
    coordMap.set(coordKey(x, y), s);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const rx0 = Math.round(minX), rx1 = Math.round(maxX);
  const ry0 = Math.round(minY), ry1 = Math.round(maxY);

  // Density: every integer point in the bounding box must be a real site.
  for (let x = rx0; x <= rx1; x += 1) {
    for (let y = ry0; y <= ry1; y += 1) {
      if (!coordMap.has(coordKey(x, y))) return undefined;
    }
  }

  // Completeness: every orthogonally-adjacent lattice pair within the box
  // must have a literal graph edge (a removed edge disqualifies the WHOLE
  // board — edge removal is a board-wide game-authoring decision).
  for (let x = rx0; x <= rx1; x += 1) {
    for (let y = ry0; y <= ry1; y += 1) {
      const site = coordMap.get(coordKey(x, y));
      if (site === undefined) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (nx > rx1 || ny > ry1) continue;
        const neighbour = coordMap.get(coordKey(nx, ny));
        if (neighbour === undefined) continue;
        const axes = traj.distinctRadialsByName(site, "Adjacent");
        const hasEdge = axes.some((axis) => axis.ray[1] === neighbour)
          || axes.some((axis) => (axis.opposites[0] ?? [])[1] === neighbour);
        if (!hasEdge) return undefined;
      }
    }
  }

  return coordMap;
}

/**
 * Synthesize the 2 diagonal axis-pairs (NE/SW, NW/SE) for `site` on a
 * regular square lattice — only when every existing axis at this site is a
 * strict orthogonal unit step and no diagonals are already present.
 */
function synthesizeDiagonalAxes(
  traj: Trajectories,
  coordMap: Map<string, number>,
  site: number,
  existingAxes: readonly FlatRadial[],
): FlatRadial[] | null {
  for (const axis of existingAxes) {
    const a = axis.ray[0];
    const b = axis.ray[1];
    if (a === undefined || b === undefined) continue; // degenerate ray (isolated site) is fine
    const dx = traj.xOf(b) - traj.xOf(a);
    const dy = traj.yOf(b) - traj.yOf(a);
    const isUnitOrtho =
      (Math.abs(dx - 1) < 1e-9 && Math.abs(dy) < 1e-9) ||
      (Math.abs(dx + 1) < 1e-9 && Math.abs(dy) < 1e-9) ||
      (Math.abs(dx) < 1e-9 && Math.abs(dy - 1) < 1e-9) ||
      (Math.abs(dx) < 1e-9 && Math.abs(dy + 1) < 1e-9);
    if (!isUnitOrtho) return null; // not a square lattice at this site — untouched
  }
  if (existingAxes.length > 2) return null; // diagonals already present — untouched

  const buildDiagonalRay = (dx: number, dy: number): number[] => {
    const ray = [site];
    let x = traj.xOf(site);
    let y = traj.yOf(site);
    for (;;) {
      x += dx;
      y += dy;
      const next = coordMap.get(coordKey(x, y));
      if (next === undefined) break;
      ray.push(next);
    }
    return ray;
  };

  const synthesized: FlatRadial[] = [];
  const neRay = buildDiagonalRay(1, 1);
  const swRay = buildDiagonalRay(-1, -1);
  if (neRay.length > 1 || swRay.length > 1) synthesized.push({ ray: neRay, opposite: swRay });
  const nwRay = buildDiagonalRay(-1, 1);
  const seRay = buildDiagonalRay(1, -1);
  if (nwRay.length > 1 || seRay.length > 1) synthesized.push({ ray: nwRay, opposite: seRay });

  return synthesized.length > 0 ? synthesized : null;
}
