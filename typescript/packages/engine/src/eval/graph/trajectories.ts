/**
 * Play-site adjacency facade over the faithful {@link TrajectoriesCore} engine
 * (src/eval/graph/trajectory/), which is the direct port of Java
 * Core/src/game/util/graph/Trajectories.java.
 *
 * A Ludii board plays either on faces (`use:Cell`, the default) or on vertices
 * (`use:Vertex` / `use:Edge`). This class projects the core's full
 * SiteType×direction Steps/Radials onto a single play SiteType and exposes the
 * compact `step / ray / group / neighbours` interface the evaluator consumes.
 * Site ids are element ids of the play type, i.e. identical to the Graph's
 * `faces[i]` / `vertices[i]` ordering — so numbering is unchanged from the
 * previous lattice-derived facade.
 *
 * All adjacency and direction decisions now come from the core (one mechanism,
 * matching Java on every tiling), replacing the old 8-compass `Math.round`
 * shortcut. See PARITY.md (roadmap item 1).
 */

import { type Graph } from "./graph.js";
import {
  AbsoluteDirection,
  directionByName,
  directionName,
} from "./trajectory/absolute-direction.js";
import { EdgeEl, type GElement, SiteType } from "./trajectory/graph-element.js";
import { TrajectoriesCore } from "./trajectory/trajectories.js";

/**
 * The 16-point compass in clockwise order from N, identical to Java's
 * `CompassDirection` enum declaration (its ordinal order). `right()`/`left()`
 * advance one notch CW/CCW here; a turtle walk's `R`/`L` then keep advancing
 * until they land on a *supported* orthogonal direction of the board topology.
 * @java game.util.directions.CompassDirection
 */
const COMPASS_CW: readonly string[] = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

/** AbsoluteDirection ordinals of the 16 compass headings (for step tagging). */
const COMPASS_ABS: readonly AbsoluteDirection[] = COMPASS_CW.map(
  (n) => directionByName(n) as AbsoluteDirection,
);

export type SiteKind = "Cell" | "Vertex" | "Edge";

/**
 * Adjacency + direction view of a graph as a set of play-sites. `numSites` is
 * the count of faces (Cell) or vertices (Vertex); methods take a site index in
 * `[0, numSites)`.
 */
export class Trajectories {
  public readonly kind: SiteKind;
  public readonly numSites: number;
  private readonly core: TrajectoriesCore;
  private readonly playType: SiteType;
  private readonly els: readonly GElement[];
  // The board graph is immutable after construction, so every trajectory query
  // is a pure function of (site, direction). The morris/connection families
  // probe `step`/`group` O(numSites²) times per move generation via region
  // ludemes like `(sites Around (site))`, so memoising these turns an
  // O(numSites)-per-call radial recomputation into an O(1) lookup. Keys are
  // `${site}|${dir}`.
  private readonly stepCache = new Map<string, number>();
  private readonly rayCache = new Map<string, number[]>();
  private readonly groupCache = new Map<string, number[]>();
  /** Memoised supported-orthogonal-direction names (Java `Topology.
   *  supportedOrthogonalDirections`) — immutable, used by every turtle walk. */
  private orthoDirNamesCache?: readonly string[];

  /** Graph-vertex ids of the board perimeter (outer-face ring). */
  private readonly perimeterVertexIds: readonly number[];
  /** Graph-vertex ids flagged as board corners (Java measureCorners). */
  private readonly cornerVertexIds: readonly number[];

  private readonly srcGraph: Graph;
  private altViews?: Map<string, Trajectories>;

  /**
   * The same board graph viewed with a DIFFERENT play type (@java per-type
   * topology accessors): dual-SiteType games move pieces on the non-play
   * elements (Guerrilla Checkers' Cell counters on a Vertex board).
   */
  public viewOf(kind: SiteKind): Trajectories {
    if (kind === (this.playType as unknown as SiteKind)) return this;
    this.altViews ??= new Map();
    let v = this.altViews.get(kind as unknown as string);
    if (!v) {
      v = new Trajectories(this.srcGraph, kind);
      this.altViews.set(kind as unknown as string, v);
    }
    return v;
  }

  public constructor(graph: Graph, kind: SiteKind) {
    this.kind = kind;
    this.srcGraph = graph;
    this.core = new TrajectoriesCore(graph);
    this.playType =
      kind === "Vertex"
        ? SiteType.Vertex
        : kind === "Edge"
          ? SiteType.Edge
          : SiteType.Cell;
    this.els = this.core.topo.elements(this.playType);
    this.numSites = this.els.length;
    this.perimeterVertexIds = [...graph.perimeter];
    this.cornerVertexIds = graph.cornerVertices();
  }

  /**
   * Play-sites on the board perimeter (Java MeasureGraph: PERIMETER property).
   * In Vertex play these are the outer-ring vertices directly; in Cell play
   * they are the faces incident to any perimeter vertex (Java
   * `measureInnerOuter`, which marks a face OUTER when it touches a perimeter
   * vertex). Returned ascending by site id.
   */
  public perimeterSites(): number[] {
    const onPerim = new Set(this.perimeterVertexIds);
    if (this.playType === SiteType.Vertex) {
      return [...onPerim].filter((s) => s >= 0 && s < this.numSites).sort(
        (a, b) => a - b,
      );
    }
    const out = new Set<number>();
    const faces = this.core.topo.faceEls;
    for (let i = 0; i < faces.length; i += 1) {
      const f = faces[i];
      if (f && f.vertices.some((v) => onPerim.has(v.id))) out.add(i);
    }
    return [...out].sort((a, b) => a - b);
  }

  /**
   * Play-sites flagged as board corners (Java MeasureGraph.measureCorners), or
   * `undefined` when the corner geometry is not modelled for this play type.
   * In Vertex play the corner vertices are returned directly; Cell play returns
   * `undefined` so the caller keeps its bounding-box fallback (the cell-corner
   * edge/face logic is not yet ported). Ascending by site id.
   */
  public cornerSites(): number[] | undefined {
    if (this.playType !== SiteType.Vertex) return undefined;
    return this.cornerVertexIds
      .filter((s) => s >= 0 && s < this.numSites)
      .sort((a, b) => a - b);
  }

  public xOf(site: number): number {
    return this.els[site]?.pt.x ?? Number.NaN;
  }
  public yOf(site: number): number {
    return this.els[site]?.pt.y ?? Number.NaN;
  }
  /** Elevation of a play-site (Shibumi pyramidal boards); 0 on planar boards. */
  public zOf(site: number): number {
    return this.els[site]?.pt.z ?? 0;
  }

  /**
   * Number of graph vertices underlying this board. Used by the graph-theory
   * predicates `(is Tree …)` / `(is RegularGraph …)`, which iterate over the
   * full vertex set. @java Topology.vertices().size().
   */
  public get vertexCount(): number {
    return this.core.topo.verts.length;
  }

  /**
   * Endpoint graph-vertex ids of an Edge play-site, or `undefined` when this is
   * not an Edge-play board or the site is out of range. The play-sites of an
   * Edge board ARE the graph edges (in order), so `site` indexes `edgeEls`.
   * @java Edge.vA().index() / Edge.vB().index().
   */
  public edgeEndpoints(site: number): readonly [number, number] | undefined {
    if (this.playType !== SiteType.Edge) return undefined;
    const el = this.els[site];
    if (!(el instanceof EdgeEl)) return undefined;
    return [el.va.id, el.vb.id];
  }

  /**
   * Planar (x, y) centroids of an Edge play-site's two endpoint vertices as the
   * flat tuple `[ax, ay, bx, by]`, or `undefined` for non-Edge boards / out of
   * range. Used by `(sites Crossing …)` for its segment-intersection test.
   * @java Edge.vA().centroid() / Edge.vB().centroid().
   */
  public edgeEndpointPts(
    site: number,
  ): readonly [number, number, number, number] | undefined {
    if (this.playType !== SiteType.Edge) return undefined;
    const el = this.els[site];
    if (!(el instanceof EdgeEl)) return undefined;
    return [el.va.pt.x, el.va.pt.y, el.vb.pt.x, el.vb.pt.y];
  }

  /** Nearest play-site neighbour in a compass/structural direction, or -1. */
  public step(site: number, dir: string): number {
    const key = `${site}|${dir}`;
    const cached = this.stepCache.get(key);
    if (cached !== undefined) return cached;
    const result = this.stepUncached(site, dir);
    this.stepCache.set(key, result);
    return result;
  }

  private stepUncached(site: number, dir: string): number {
    const d = directionByName(dir);
    if (d === undefined) return -1;
    const steps = this.core.stepsToTypeInDirection(
      this.playType, site, this.playType, d,
    );
    if (steps.length === 0) return -1;
    // On a collision keep the nearest, matching the legacy facade.
    const from = this.els[site];
    if (!from) return steps[0]!.to.id;
    let best = steps[0]!.to;
    let bestD = sqDist(from, best);
    for (let i = 1; i < steps.length; i += 1) {
      const to = steps[i]!.to;
      const dd = sqDist(from, to);
      if (dd < bestD) {
        bestD = dd;
        best = to;
      }
    }
    return best.id;
  }

  /**
   * ALL play-site neighbours one step away from `site` in a named direction —
   * `[]` if the name is not an AbsoluteDirection (a player-relative token).
   * Unlike `step` (which collapses to the single nearest), this returns every
   * step tagged with the direction, faithful to Java `Step.eval`, which
   * iterates `topology.trajectories().steps(type, from, type, dir)` in full.
   * This is what makes `Step Rotational` reach all of In/Out/CW/CCW.
   */
  public steps(site: number, dir: string): number[] {
    const d = directionByName(dir);
    if (d === undefined) return [];
    return this.core
      .stepsToTypeInDirection(this.playType, site, this.playType, d)
      .map((s) => s.to.id);
  }

  /** The ray of play-sites reached by repeatedly stepping `dir` from `site`. */
  public ray(site: number, dir: string): number[] {
    const key = `${site}|${dir}`;
    const cached = this.rayCache.get(key);
    if (cached !== undefined) return cached;
    const result = this.rayUncached(site, dir);
    this.rayCache.set(key, result);
    return result;
  }

  private rayUncached(site: number, dir: string): number[] {
    const d = directionByName(dir);
    if (d === undefined) return [];
    const radials = this.core.radialsInDirection(this.playType, site, d);
    if (radials.length === 0) return [];
    // The longest radial is the full line; its tail (beyond the origin) is the ray.
    let longest = radials[0]!;
    for (const r of radials) {
      if (r.steps.length > longest.steps.length) longest = r;
    }
    return longest.steps.slice(1).map((e) => e.id);
  }

  /** Neighbour play-sites in a named direction group (Orthogonal/Diagonal/Adjacent/All). */
  public group(site: number, name: string): number[] {
    const key = `${site}|${name}`;
    const cached = this.groupCache.get(key);
    if (cached !== undefined) return cached;
    // Unknown names behave like the legacy "all neighbours" fallback.
    const d = directionByName(name) ?? AbsoluteDirection.Adjacent;
    const result = this.core
      .stepsToTypeInDirection(this.playType, site, this.playType, d)
      .map((s) => s.to.id);
    this.groupCache.set(key, result);
    return result;
  }

  /** All orthogonal neighbours (edge-sharing). */
  public neighbours(site: number): number[] {
    return this.group(site, "Orthogonal");
  }

  /**
   * The compass directions (e.g. `["N","E","S","W"]` on a square board, six
   * names on a hex board) for which *some* play-site has an Orthogonal step,
   * in first-encounter scan order. Faithful to Java `Topology.
   * computeSupportedDirection`, which walks every element's Orthogonal steps
   * and collects each step's `AbsoluteDirection.convert`-ible compass tag in
   * order. This is the set a turtle walk rotates through and starts from.
   */
  public supportedOrthogonalDirNames(): readonly string[] {
    if (this.orthoDirNamesCache) return this.orthoDirNamesCache;
    const out: string[] = [];
    const seen = new Set<string>();
    for (let id = 0; id < this.numSites; id += 1) {
      const steps = this.core.stepsToTypeInDirection(
        this.playType, id, this.playType, AbsoluteDirection.Orthogonal,
      );
      for (const step of steps) {
        for (const c of COMPASS_ABS) {
          if (step.directions.has(c)) {
            const nm = directionName(c);
            if (!seen.has(nm)) {
              seen.add(nm);
              out.push(nm);
            }
          }
        }
      }
    }
    this.orthoDirNamesCache = out;
    return out;
  }

  /**
   * True when the board is a square lattice for movement purposes — exactly four
   * orthogonal directions (a square cell or square vertex grid, possibly rotated).
   * On such boards the Cartesian dx/dy offset stepping used by the slide / leap
   * compilers is valid and proven, so they stay on that path. Hexagonal (six
   * orthogonals) and triangular (three) boards return false and route through the
   * faithful topology walk / radial slide instead.
   */
  public isCartesianSliceable(): boolean {
    return this.supportedOrthogonalDirNames().length === 4;
  }

  /**
   * Faithful port of Java `SitesWalk.eval` (the `(leap <walk> …)` landing-site
   * resolver). Each walk is a turtle path of `F` (forward one step along the
   * current heading), `R`/`L` (rotate the heading to the next supported
   * orthogonal direction CW/CCW). Runs from every supported orthogonal heading
   * when `allRotations`, else from the first one only. Returns one landing site
   * per (heading × walk) that completes without stepping off the board — NOT
   * de-duplicated, matching Java (which adds every successful `currentLoc`).
   *
   * This replaces the Cartesian dx/dy shortcut for graph boards, so knight-style
   * leaps resolve correctly on hex / triangular / merged topologies.
   */
  public walkSites(
    from: number,
    walks: readonly (readonly string[])[],
    allRotations: boolean,
  ): number[] {
    const orthoDirs = this.supportedOrthogonalDirNames();
    if (orthoDirs.length === 0) return [];
    const orthoSet = new Set(orthoDirs);
    const startDirs = allRotations ? orthoDirs : [orthoDirs[0] as string];
    const out: number[] = [];

    for (const startDir of startDirs) {
      for (const steps of walks) {
        let currentLoc = from;
        let currentDir = startDir;
        let broke = false;
        for (const step of steps) {
          if (step === "F") {
            const dAbs = directionByName(currentDir);
            let to = -1;
            if (dAbs !== undefined) {
              const tos = this.core.stepsToTypeInDirection(
                this.playType, currentLoc, this.playType, dAbs,
              );
              // Java keeps the LAST same-type step in the direction list.
              if (tos.length > 0) to = (tos[tos.length - 1] as { to: GElement }).to.id;
            }
            currentLoc = to;
            if (to === -1) {
              broke = true;
              break;
            }
          } else if (step === "R") {
            currentDir = this.rotateToSupported(currentDir, +1, orthoSet);
          } else if (step === "L") {
            currentDir = this.rotateToSupported(currentDir, -1, orthoSet);
          }
        }
        if (!broke && currentLoc !== -1) out.push(currentLoc);
      }
    }
    return out;
  }

  /**
   * Rotate `dir` one notch in `delta` direction (+1 CW / -1 CCW) on the 16-point
   * compass, then keep going the same way until the heading is a supported
   * orthogonal direction. Mirrors Java's `do { right() } while (!supported)`.
   */
  private rotateToSupported(
    dir: string,
    delta: number,
    supported: Set<string>,
  ): string {
    let idx = COMPASS_CW.indexOf(dir);
    if (idx < 0) return dir;
    for (let guard = 0; guard < COMPASS_CW.length; guard += 1) {
      idx = (idx + delta + COMPASS_CW.length) % COMPASS_CW.length;
      const name = COMPASS_CW[idx] as string;
      if (supported.has(name)) return name;
    }
    return dir;
  }

  /**
   * The maximal radial paths from `site` in a named absolute direction (e.g.
   * "Adjacent", "Orthogonal", "N"), each as a list of play-site ids starting
   * with `site` itself. Mirrors Java `graph.trajectories().radials(type, site)
   * .distinctInDirection(dir)`, used by `(is Line …)` line detection on graph
   * boards where straight lines follow topology edges, not Cartesian steps.
   * Returns `[]` for an unknown direction name.
   */
  public radialsByName(site: number, dirName: string): number[][] {
    const d = directionByName(dirName);
    if (d === undefined) return [];
    return this.core
      .radialsInDirection(this.playType, site, d)
      .map((r) => r.steps.map((e) => e.id));
  }

  /**
   * The DISTINCT radials from `site` in a named absolute direction, each paired
   * with its opposite radials, as play-site id arrays beginning with `site`.
   * Mirrors Java `graph.trajectories().radials(type, site)
   * .distinctInDirection(dir)` followed by `radial.opposites()`, which
   * `(is Line …)` uses to walk a pivot bidirectionally (forward radial + its
   * geometric opposite) and count a single contiguous run through the pivot.
   * Returns `[]` for an unknown direction name.
   */
  public distinctRadialsByName(
    site: number,
    dirName: string,
  ): { ray: number[]; opposites: number[][] }[] {
    const d = directionByName(dirName);
    if (d === undefined) return [];
    const radials = this.core.radialsOf(this.playType, site);
    if (radials === undefined) return [];
    return radials.distinctInDirection(d).map((r) => ({
      ray: r.steps.map((e) => e.id),
      opposites: (r.opposites() ?? []).map((o) => o.steps.map((e) => e.id)),
    }));
  }
}

/** Squared planar distance between two graph elements. */
function sqDist(a: GElement, b: GElement): number {
  const dx = b.pt.x - a.pt.x;
  const dy = b.pt.y - a.pt.y;
  return dx * dx + dy * dy;
}
