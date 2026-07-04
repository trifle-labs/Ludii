// @java Core/src/game/equipment/container/board/Board.java

/**
 * Defines a board by its graph, consisting of vertex locations and edge pairs.
 *
 * @java game/equipment/container/board/Board.java
 * @author Eric.Piette and cambolbro
 *
 * @remarks The values range are used for deduction puzzles. The state model for
 *          these puzzles is a Constraint Satisfaction Problem (CSP) model.
 */

import { Container } from "../Container.js";
import type { SiteType } from "../../../../other/action/SiteType.js";
import type { ContainerStyleType } from "../../../../metadata/graphics/util/ContainerStyleType.js";
import { Trajectories } from "../../../../../eval/graph/trajectories.js";
import { buildGraphRadials, type CellFlatRadials } from "../../../../topology-radials.js";
import { Topology } from "../../../../other/topology/Topology.js";
import { Vertex } from "../../../../other/topology/Vertex.js";
import { Edge } from "../../../../other/topology/Edge.js";
import { Cell } from "../../../../other/topology/Cell.js";

/** Minimal Graph shape read by createTopology (faces drive containerSpan). */
interface GraphLike {
  vertices?: readonly { id: number; x: number; y: number; z?: number }[];
  edges?: readonly { id: number; a: number; b: number }[];
  faces?: readonly { id: number; vertices: readonly number[]; cx: number; cy: number }[];
  perimeter?: readonly number[];
  pivots?: ReadonlyMap<number, number>;
}

/** Minimal GraphFunction interface for Board.graphFunction. */
export interface GraphFunction {
  /** @java GraphFunction.eval(Context, SiteType) */
  eval(context: unknown, siteType: SiteType): unknown;
  /** @java BaseLudeme.gameFlags(Game) */
  gameFlags(game: unknown): bigint;
  /** @java BaseLudeme.preprocess(Game) */
  preprocess(game: unknown): void;
}

/** Minimal Range interface used for deduction puzzle ranges. */
export interface Range {
  min(ctx: unknown): number;
  max(ctx: unknown): number;
}

/** Minimal Track-like interface for Board's track list. */
export interface TrackDescriptor {
  name(): string;
  owner(): number;
  islooped(): boolean;
}

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Board — the main playing surface defined by a graph function.
 *
 * @java game/equipment/container/board/Board.java — class Board extends Container
 */
export class Board extends Container {
  /** @java Board.graph — built by init() */
  protected graph: unknown = null;

  /** @java Board.graphFunction */
  private readonly graphFunction: GraphFunction;

  // ---- Topology surface (BoardSurface-compatible) -----------------------------
  // Built by createTopology() from the graph function, or lazily on first read.
  // These mirror BoardSurface's public fields so the faithful Board duck-types as
  // the board the engine (Game, evals) reads: numSites/width/height/radials/
  // trajectories/containerSpan.
  // @java game/equipment/container/board/Board.java — createTopology / topology()
  /** Board bounding-box width. @java Board.topology() */
  public width = 1;
  /** Board bounding-box height. @java Board.topology() */
  public height = 1;
  /** Precomputed per-cell radials. @java other/topology/Topology.java — radials */
  public radials: readonly CellFlatRadials[] = [];
  /** Graph adjacency/direction view. @java other/topology/Topology.java */
  public trajectories: Trajectories | null = null;
  /** Container index span = max(numFaces, numPlaySites). @java Equipment.initContainer */
  public containerSpan = 1;
  /** True once createTopology() has run (or lazy build completed). */
  private topologyBuilt = false;

  /** @java Board.edgeRange */
  private edgeRange: Range | null = null;

  /** @java Board.cellRange */
  private cellRange: Range | null = null;

  /** @java Board.vertexRange */
  private vertexRange: Range | null = null;

  /** @java Board.largeStack */
  private readonly largeStack: boolean;

  /**
   * @java game/equipment/container/board/Board.java constructor
   *
   * @param graphFn      The graph function used to build the board.
   * @param track        A single track on the board.
   * @param tracks       Multiple tracks on the board.
   * @param values       A single Values range entry for a deduction puzzle.
   * @param valuesArray  Multiple Values range entries for a deduction puzzle.
   * @param use          Graph element type to use by default [Cell].
   * @param largeStack   True if the game can involve stacks higher than 32.
   */
  public constructor(
    graphFn: GraphFunction,
    track: TrackDescriptor | null,
    tracks: TrackDescriptor[] | null,
    values: { type(): SiteType; range(): Range } | null,
    valuesArray: { type(): SiteType; range(): Range }[] | null,
    use: SiteType | null,
    largeStack: boolean | null,
  ) {
    // @java Board.java:92 — super("Board", Constants.UNDEFINED, RoleType.Neutral)
    super("Board", UNDEFINED, "Neutral");

    // @java Board.java:94–101 — track/tracks exclusivity check
    let numNonNull = 0;
    if (track !== null) numNonNull++;
    if (tracks !== null) numNonNull++;
    if (numNonNull > 1)
      throw new Error("Board: Only one of `track' or `tracks' can be non-null.");

    // @java Board.java:103–110 — values/valuesArray exclusivity check
    let valuesNonNull = 0;
    if (values !== null) valuesNonNull++;
    if (valuesArray !== null) valuesNonNull++;
    if (valuesNonNull > 1)
      throw new Error("Board(): Only one of `values' or `valuesArray' parameter can be non-null.");

    // @java Board.java:112–113
    this.defaultSite = (use === null) ? "Cell" : use;
    this.graphFunction = graphFn;

    // @java Board.java:115–158
    if (valuesNonNull === 1) {
      // Deduction puzzle path
      const valuesLocal: { type(): SiteType; range(): Range }[] =
        (valuesArray !== null) ? valuesArray : [values!];

      for (const valuesGraphElement of valuesLocal) {
        switch (valuesGraphElement.type()) {
          case "Cell":
            this.cellRange = valuesGraphElement.range();
            break;
          case "Edge":
            this.edgeRange = valuesGraphElement.range();
            break;
          case "Vertex":
            this.vertexRange = valuesGraphElement.range();
            break;
        }
      }

      // @java Board.java:135–143 — default zero-ranges
      if (this.vertexRange === null) this.vertexRange = makeZeroRange();
      if (this.edgeRange   === null) this.edgeRange   = makeZeroRange();
      if (this.cellRange   === null) this.cellRange   = makeZeroRange();

      // @java Board.java:144
      this.style = "Puzzle";
    } else {
      // Normal board path
      // @java Board.java:148–152
      if (tracks !== null) {
        for (const t of tracks) this.tracks.push(t);
      } else if (track !== null) {
        this.tracks.push(track);
      }

      // @java Board.java:154–157
      if (this.defaultSite === "Vertex" || this.defaultSite === "Edge")
        this.style = "Graph";
      else
        this.style = "Board";
    }

    // @java Board.java:160
    this.largeStack = (largeStack === null) ? false : largeStack;
  }

  // @java Board.java:167–170 — graph()
  /** @java Board.graph() */
  public getGraph(): unknown { return this.graph; }

  /** @java Board.largeStack() */
  public isLargeStack(): boolean { return this.largeStack; }

  /** @java Board.vertexRange() */
  public getVertexRange(): Range | null { return this.vertexRange; }

  /** @java Board.edgeRange() */
  public getEdgeRange(): Range | null { return this.edgeRange; }

  /** @java Board.cellRange() */
  public getCellRange(): Range | null { return this.cellRange; }

  /**
   * @java Board.getRange(SiteType)
   */
  public getRange(type: SiteType): Range | null {
    switch (type) {
      case "Vertex": return this.getVertexRange();
      case "Cell":   return this.getCellRange();
      case "Edge":   return this.getEdgeRange();
    }
    return null;
  }

  /**
   * @java Board.createTopology(int, int) — builds graph and fills topology.
   *
   * Faithful port: evaluate the graph function to get the board Graph, then build
   * the adjacency/direction view (Trajectories) and per-cell radials, and derive
   * width/height/numSites/containerSpan. This is what Java's Game.create() drives
   * (board.createTopology → topology population). Mirrors the proven graph-board
   * build path (Trajectories + buildGraphRadials + bounding-box dims).
   *
   * Subclass overrides (SurakartaBoard) call super then extend tracks.
   */
  public createTopology(_beginIndex: number, _numEdges: number): void {
    this.buildTopology();
  }

  /** @java Container.topology() */
  public override topology(): Topology {
    if (!this.topologyBuilt) this.buildTopology();
    return this.faithfulTopology;
  }

  /**
   * Build (and memoise) the topology from the graph function. Idempotent.
   * Called by createTopology() and lazily by topology getters, so the faithful
   * Board reports a real site count regardless of whether Game.create() ran.
   * @java game/equipment/container/board/Board.java — graph eval + topology fill
   */
  private buildTopology(): void {
    if (this.topologyBuilt) return;
    this.topologyBuilt = true;

    const siteType: SiteType = this.defaultSite ?? "Cell";
    // @java Board.java — graphFunction.eval(context, siteType). The faithful graph
    // generators (RectangleOnSquare etc.) take the SiteType as their first arg, the
    // same way the proven makeBoard path calls graphFn.eval(siteType).
    const evalGraph = (st: SiteType): GraphLike =>
      (this.graphFunction.eval as unknown as (s: SiteType) => unknown)(st) as GraphLike;
    let graph = evalGraph(siteType);
    this.graph = graph;
    let traj = new Trajectories(graph as never, siteType as never);
    // Cell/Edge boards with no faces fall back to Vertex play (e.g. Hex).
    if (traj.numSites === 0 && (siteType === "Cell" || siteType === "Edge")) {
      graph = evalGraph("Vertex");
      this.graph = graph;
      traj = new Trajectories(graph as never, "Vertex" as never);
    }
    if (traj.numSites === 0) return; // degenerate / boardless — leave defaults

    this.trajectories = traj;
    this.populateFaithfulTopology(graph);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let site = 0; site < traj.numSites; site += 1) {
      const x = traj.xOf(site), y = traj.yOf(site);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    this.width = Math.max(1, Math.ceil(maxX - minX) + 1);
    this.height = Math.max(1, Math.ceil(maxY - minY) + 1);
    this.radials = buildGraphRadials(traj);
    this.setNumSites(traj.numSites);
    const numFaces = (graph.faces?.length) ?? traj.numSites;
    this.containerSpan = Math.max(numFaces, traj.numSites);
    for (const track of this.tracks) {
      (track as unknown as { buildTrack?: (w: number, h: number, t: Trajectories | null) => void })
        .buildTrack?.(this.width, this.height, this.trajectories);
    }
  }

  /**
   * @java Core/src/game/equipment/container/board/Board.java:createTopology
   */
  private populateFaithfulTopology(graph: GraphLike): void {
    const topology = this.faithfulTopology;
    // @java SiteFinder.find — null-type lookups resolve to the board's default site.
    topology.defaultSiteType = (this.defaultSite ?? "Cell") as SiteType;
    topology.cells().length = 0;
    topology.edges().length = 0;
    topology.vertices().length = 0;
    topology.setGraph(graph);

    const graphVertices = graph.vertices ?? [];
    for (let i = 0; i < graphVertices.length; i += 1) {
      const gv = graphVertices[i]!;
      const vertex = new Vertex(i, gv.x, gv.y, gv.z ?? 0);
      vertex.setRow(Math.round(gv.y));
      vertex.setColumn(Math.round(gv.x));
      vertex.setLayer(Math.round(gv.z ?? 0));
      vertex.setLabel(`${i}`);
      topology.vertices().push(vertex);
    }

    if (graph.pivots) {
      for (const [vid, pivotId] of graph.pivots) {
        const vertex = topology.vertices()[vid];
        const pivot = topology.vertices()[pivotId];
        if (vertex && pivot) vertex.setPivot(pivot);
      }
    }

    const graphEdges = graph.edges ?? [];
    for (let i = 0; i < graphEdges.length; i += 1) {
      const ge = graphEdges[i]!;
      const vA = topology.vertices()[ge.a];
      const vB = topology.vertices()[ge.b];
      if (!vA || !vB) continue;
      const edge = new Edge(i, vA, vB);
      edge.setRow(Math.round(edge.centroid3D().y()));
      edge.setColumn(Math.round(edge.centroid3D().x()));
      edge.setLayer(Math.round(edge.centroid3D().z()));
      topology.edges().push(edge);
      vA.edges().push(edge);
      vB.edges().push(edge);
    }

    const edgeByVertices = new Map<string, Edge>();
    for (const edge of topology.edges()) {
      const a = edge.vA().index();
      const b = edge.vB().index();
      edgeByVertices.set(a < b ? `${a}:${b}` : `${b}:${a}`, edge);
    }

    const graphFaces = graph.faces ?? [];
    for (let i = 0; i < graphFaces.length; i += 1) {
      const face = graphFaces[i]!;
      const cell = new Cell(face.id, face.cx, face.cy, 0);
      cell.setRow(Math.round(face.cy));
      cell.setColumn(Math.round(face.cx));
      cell.setLayer(0);
      cell.setLabel(`${face.id}`);
      topology.cells().push(cell);

      for (const vid of face.vertices) {
        const vertex = topology.vertices()[vid];
        if (!vertex) continue;
        cell.vertices().push(vertex);
        vertex.cells().push(cell);
      }

      for (let n = 0; n < face.vertices.length; n += 1) {
        const a = face.vertices[n]!;
        const b = face.vertices[(n + 1) % face.vertices.length]!;
        const edge = edgeByVertices.get(a < b ? `${a}:${b}` : `${b}:${a}`);
        if (!edge) continue;
        cell.edges().push(edge);
        edge.cells().push(cell);
      }
    }

    // @java MeasureGraph.measurePhase (Core/src/game/util/graph/MeasureGraph.java:992)
    // — greedy graph-coloring (lowest phase 0..3 not used by any edge-adjacent cell)
    // so no two cells sharing an edge have the same phase. The faithful topology path
    // never ran this, leaving every cell at phase 0; (phase of:s) / IsPhaseOne then
    // returned 0 everywhere, so Bizingo's triangular board could not tell up-faces
    // from down-faces and dropped every outer-edge Surround capture. Cells sharing an
    // edge are neighbours (Java face.nbors()); BFS from each uncoloured cell.
    {
      const cellList = topology.cells();
      const nc = cellList.length;
      if (nc > 0) {
        const idxOf = new Map<Cell, number>();
        cellList.forEach((c, i) => idxOf.set(c, i));
        const adj: number[][] = Array.from({ length: nc }, () => []);
        for (const edge of topology.edges()) {
          const ec = edge.cells();
          for (let i = 0; i < ec.length; i += 1) {
            for (let j = i + 1; j < ec.length; j += 1) {
              const a = idxOf.get(ec[i]!);
              const b = idxOf.get(ec[j]!);
              if (a === undefined || b === undefined) continue;
              adj[a]!.push(b);
              adj[b]!.push(a);
            }
          }
        }
        // @java MeasureGraph.measurePhase:1002-1073 — greedy smallest-free-phase
        // BFS over a DEQUE: the popped element takes the lowest phase 0..3 not
        // used by any already-phased neighbour (all four used → PHASE_4), and
        // unvisited neighbours whose own neighbourhoods already show more than
        // one distinct phase are pushed to the FRONT (more constrained first).
        // The priority order matters for parity: hex boards 3-colour, and
        // Triad's (mapEntry "PlayerPhase" (phase of:(to))) needs Java's exact
        // per-cell assignment, not just any legal colouring.
        const phase = new Array<number>(nc).fill(-1);
        for (let s = 0; s < nc; s += 1) {
          if (phase[s] !== -1) continue;
          phase[s] = 0;
          const deque: number[] = [s];
          const visited = new Set<number>();
          while (deque.length > 0) {
            const ge = deque.shift()!;
            if (visited.has(ge)) continue;
            const used = new Set<number>();
            for (const nb of adj[ge]!) {
              const np = phase[nb] ?? -1;
              if (np >= 0) used.add(np);
            }
            let p = 0;
            while (p < 4 && used.has(p)) p += 1;
            phase[ge] = p; // p == 4 → @java PHASE_4
            visited.add(ge);
            for (const nb of adj[ge]!) {
              if (visited.has(nb)) continue;
              const nnPhases = new Set<number>();
              for (const nn of adj[nb]!) {
                const np = phase[nn] ?? -1;
                if (np >= 0) nnPhases.add(np);
              }
              if (nnPhases.size > 1) deque.unshift(nb);
              else deque.push(nb);
            }
          }
        }
        for (let i = 0; i < nc; i += 1) cellList[i]!.setPhase(phase[i]! < 0 ? 0 : phase[i]!);
        // @java Topology.phases(type) — (sites Phase N) reads the topology's
        // per-phase element lists, which the property path never populated on
        // this route: they stayed empty, so Catapult's start
        // (difference (expand …) (sites Phase 0)) removed nothing and the
        // checkerboard placement collapsed.
        {
          const phaseLists = (topology as unknown as {
            phases?: (t: string) => Array<Array<unknown>>;
          }).phases?.("Cell");
          if (phaseLists) {
            for (let i = 0; i < nc; i += 1) {
              const p = phase[i]! < 0 ? 0 : phase[i]!;
              const list = phaseLists[p];
              if (list && !list.includes(cellList[i]!)) list.push(cellList[i]!);
            }
          }
        }
      }
    }

    const perimVertices = (graph.perimeter ?? [])
      .map((vid) => topology.vertices()[vid])
      .filter((v): v is Vertex => v !== undefined);
    topology.setPerimeter(perimVertices.length > 0 ? [{ vertices: perimVertices }] : []);
    topology.setTrajectories(this.trajectories);
    topology.setNumEdges(regularFaceEdgeCount(graphFaces));
    // Play-site count, not face count: a faceless vertex graph (Game of
    // Solomon's split star) has zero cells and numSites=0 killed every
    // downstream consumer (FEP bounds, hand detection, region scans). Java
    // consumers read per-type sizes; our numSites contract is the PLAY type
    // (matches the trajectories path above).
    const playType = (this as unknown as { defaultSite?: string | (() => string) }).defaultSite;
    const pt = typeof playType === "function" ? playType.call(this) : (playType ?? "Cell");
    const playEls = topology.getGraphElements(pt as never).length;
    this.setNumSites(playEls > 0 ? playEls : topology.cells().length);
  }

  /**
   * @java Board.numSites() — site count, building topology lazily if create()
   * hasn't run yet. Container stores `numSites` (protected); expose it here so
   * the faithful Board duck-types as BoardSurface for the engine.
   */
  public getNumSitesBuilt(): number {
    if (!this.topologyBuilt) this.buildTopology();
    return this.getNumSites();
  }

  /** @java Board.numSites() */
  public override numSites(): number {
    if (!this.topologyBuilt) this.buildTopology();
    return this.getNumSites();
  }

  /** @java Board.isBoardless() — always false for a plain Board */
  public override isBoardless(): boolean { return false; }
}

/** Helper: a range that is always [0..0]. */
function makeZeroRange(): Range {
  return { min: () => 0, max: () => 0 };
}

function regularFaceEdgeCount(faces: readonly { vertices: readonly number[] }[]): number {
  if (faces.length === 0) return UNDEFINED;
  const count = faces[0]!.vertices.length;
  for (const face of faces) if (face.vertices.length !== count) return UNDEFINED;
  return count;
}
