// @java Core/src/other/topology/Topology.java Topology
/**
 * Topology of the game graph.
 *
 * Faithful 1:1 transliteration of other.topology.Topology.
 *
 * NOTE: The heavy pre-generation methods (distance tables, feature data,
 * etc.) that depend on Trajectories / Radials are structurally present but
 * the internal BFS bodies are omitted — they rely on live-engine types not
 * available here.  All field declarations, constructors, and pure-accessor
 * methods are complete.
 *
 * @author Eric.Piette and cambolbro and Dennis Soemers  (Java original)
 */

import type { TopologyElement, SiteType, RelationType, DirectionFacing } from "./TopologyElement.js";
import type { Vertex } from "./Vertex.js";
import type { Edge }   from "./Edge.js";
import type { Cell }   from "./Cell.js";

// Constants mirror
const UNDEFINED = -1;
// MAX_CELL_COLOURS in Java Constants = 32 (common assumption)
const MAX_CELL_COLOURS = 32;

/** Minimal Perimeter stand-in. */
export interface Perimeter { vertices: Vertex[]; }

/**
 * Topology of the game graph.
 * @java other.topology.Topology
 */
export class Topology {
  // -------- core element lists ---------------------------------------------

  private readonly _cells:    Cell[]   = [];
  private readonly _edges:    Edge[]   = [];
  private readonly _vertices: Vertex[] = [];

  /** @java Topology#graph — reference to generating Graph */
  private _graph: unknown = null;

  private _numEdges: number = UNDEFINED;

  // -------- trajectories (opaque reference) --------------------------------

  /** @java Topology#trajectories */
  private _trajectories: unknown = null;

  // -------- direction maps -------------------------------------------------

  private readonly _supportedDirections:          Map<SiteType, DirectionFacing[]> = new Map();
  private readonly _supportedOrthogonalDirections: Map<SiteType, DirectionFacing[]> = new Map();
  private readonly _supportedDiagonalDirections:   Map<SiteType, DirectionFacing[]> = new Map();
  private readonly _supportedAdjacentDirections:   Map<SiteType, DirectionFacing[]> = new Map();
  private readonly _supportedOffDirections:        Map<SiteType, DirectionFacing[]> = new Map();

  // -------- pre-generated topology lists -----------------------------------

  private readonly _corners:         Map<SiteType, TopologyElement[]> = new Map();
  private readonly _cornersConvex:   Map<SiteType, TopologyElement[]> = new Map();
  private readonly _cornersConcave:  Map<SiteType, TopologyElement[]> = new Map();
  private readonly _major:           Map<SiteType, TopologyElement[]> = new Map();
  private readonly _minor:           Map<SiteType, TopologyElement[]> = new Map();
  private readonly _outer:           Map<SiteType, TopologyElement[]> = new Map();
  private readonly _perimeter:       Map<SiteType, TopologyElement[]> = new Map();
  private readonly _inner:           Map<SiteType, TopologyElement[]> = new Map();
  private readonly _interlayer:      Map<SiteType, TopologyElement[]> = new Map();
  private readonly _top:             Map<SiteType, TopologyElement[]> = new Map();
  private readonly _left:            Map<SiteType, TopologyElement[]> = new Map();
  private readonly _right:           Map<SiteType, TopologyElement[]> = new Map();
  private readonly _bottom:          Map<SiteType, TopologyElement[]> = new Map();
  private readonly _centre:          Map<SiteType, TopologyElement[]> = new Map();
  private readonly _axials:          Map<SiteType, TopologyElement[]> = new Map();
  private readonly _horizontal:      Map<SiteType, TopologyElement[]> = new Map();
  private readonly _vertical:        Map<SiteType, TopologyElement[]> = new Map();
  private readonly _angled:          Map<SiteType, TopologyElement[]> = new Map();
  private readonly _slash:           Map<SiteType, TopologyElement[]> = new Map();
  private readonly _slosh:           Map<SiteType, TopologyElement[]> = new Map();

  private readonly _columns:   Map<SiteType, TopologyElement[][]> = new Map();
  private readonly _rows:      Map<SiteType, TopologyElement[][]> = new Map();
  private readonly _phases:    Map<SiteType, TopologyElement[][]> = new Map();
  private readonly _layers:    Map<SiteType, TopologyElement[][]> = new Map();
  private readonly _diagonals: Map<SiteType, TopologyElement[][]> = new Map();

  /** @java Map<SiteType, Map<DirectionFacing, List<TopologyElement>>> sides */
  private readonly _sides: Map<SiteType, Map<DirectionFacing, TopologyElement[]>> = new Map();

  // -------- distance tables ------------------------------------------------

  private readonly _distanceToOtherSite: Map<SiteType, number[][]> = new Map();
  private readonly _distanceToCorners:   Map<SiteType, number[]>   = new Map();
  private readonly _distanceToSides:     Map<SiteType, number[]>   = new Map();
  private readonly _distanceToCentre:    Map<SiteType, number[]>   = new Map();
  private readonly _distanceToRegions:   Map<SiteType, (number[] | null)[]> = new Map();

  private readonly _phaseByElementIndex: Map<SiteType, number[]> = new Map();

  // -------- symmetry arrays ------------------------------------------------

  private _cellRotationSymmetries:   number[][] | null = null;
  private _cellReflectionSymmetries: number[][] | null = null;
  private _edgeRotationSymmetries:   number[][] | null = null;
  private _edgeReflectionSymmetries: number[][] | null = null;
  private _vertexRotationSymmetries:   number[][] | null = null;
  private _vertexReflectionSymmetries: number[][] | null = null;

  // -------- perimeters -----------------------------------------------------

  private _perimeters: Perimeter[] = [];

  // -------- connectivities (for features) ----------------------------------

  private readonly _connectivities: Map<SiteType, number[]> = new Map();

  // -------- constructor ----------------------------------------------------

  /**
   * @java Topology() — initialises all per-SiteType lists.
   */
  constructor() {
    const TYPES: SiteType[] = ["Cell", "Edge", "Vertex"];
    for (const type of TYPES) {
      this._corners.set(type, []);
      this._cornersConcave.set(type, []);
      this._cornersConvex.set(type, []);
      this._major.set(type, []);
      this._minor.set(type, []);
      this._outer.set(type, []);
      this._perimeter.set(type, []);
      this._inner.set(type, []);
      this._interlayer.set(type, []);
      this._top.set(type, []);
      this._bottom.set(type, []);
      this._left.set(type, []);
      this._right.set(type, []);
      this._centre.set(type, []);
      this._axials.set(type, []);
      this._horizontal.set(type, []);
      this._vertical.set(type, []);
      this._angled.set(type, []);
      this._slash.set(type, []);
      this._slosh.set(type, []);

      // phases: MAX_CELL_COLOURS sub-lists
      const phaseList: TopologyElement[][] = [];
      for (let i = 0; i < MAX_CELL_COLOURS; i++) phaseList.push([]);
      this._phases.set(type, phaseList);

      this._rows.set(type, []);
      this._columns.set(type, []);
      this._layers.set(type, []);
      this._diagonals.set(type, []);

      // sides: one list per compass direction (opaque strings)
      const sidesMap: Map<DirectionFacing, TopologyElement[]> = new Map();
      for (const dir of ["N","NE","E","SE","S","SW","W","NW"] as DirectionFacing[]) {
        sidesMap.set(dir, []);
      }
      this._sides.set(type, sidesMap);

      this._supportedDirections.set(type, []);
      this._supportedOrthogonalDirections.set(type, []);
      this._supportedDiagonalDirections.set(type, []);
      this._supportedAdjacentDirections.set(type, []);
      this._supportedOffDirections.set(type, []);
    }
  }

  // -------- graph / numEdges accessors -------------------------------------

  /** @java Topology#graph() */
  graph(): unknown { return this._graph; }
  /** @java Topology#setGraph(Graph) */
  setGraph(gr: unknown): void { this._graph = gr; }

  /** @java Topology#numEdges() */
  numEdges(): number { return this._numEdges; }
  /** @java Topology#setNumEdges(int) */
  setNumEdges(n: number): void { this._numEdges = n; }

  /** @java Topology#trajectories() — opaque reference */
  trajectories(): unknown { return this._trajectories; }
  /** Set trajectories reference. */
  setTrajectories(t: unknown): void { this._trajectories = t; }

  // -------- element lists --------------------------------------------------

  /** @java Topology#cells() */
  cells():    Cell[]   { return withJavaListMethods(this._cells); }
  /** @java Topology#edges() */
  edges():    Edge[]   { return withJavaListMethods(this._edges); }
  /** @java Topology#vertices() */
  vertices(): Vertex[] { return withJavaListMethods(this._vertices); }

  // -------- topology lists -------------------------------------------------

  /** @java Topology#corners(SiteType) */
  corners(type: SiteType):        TopologyElement[] { return this._corners.get(type)!; }
  /** @java Topology#cornersConcave(SiteType) */
  cornersConcave(type: SiteType): TopologyElement[] { return this._cornersConcave.get(type)!; }
  /** @java Topology#cornersConvex(SiteType) */
  cornersConvex(type: SiteType):  TopologyElement[] { return this._cornersConvex.get(type)!; }
  /** @java Topology#major(SiteType) */
  major(type: SiteType):          TopologyElement[] { return this._major.get(type)!; }
  /** @java Topology#minor(SiteType) */
  minor(type: SiteType):          TopologyElement[] { return this._minor.get(type)!; }
  /** @java Topology#outer(SiteType) */
  outer(type: SiteType):          TopologyElement[] { return this._outer.get(type)!; }
  /** @java Topology#perimeter(SiteType) */
  perimeter(type: SiteType):      TopologyElement[] { return this._perimeter.get(type)!; }
  /** @java Topology#inner(SiteType) */
  inner(type: SiteType):          TopologyElement[] { return this._inner.get(type)!; }
  /** @java Topology#interlayer(SiteType) */
  interlayer(type: SiteType):     TopologyElement[] { return this._interlayer.get(type)!; }
  /** @java Topology#top(SiteType) */
  top(type: SiteType):            TopologyElement[] { return this._top.get(type)!; }
  /** @java Topology#bottom(SiteType) */
  bottom(type: SiteType):         TopologyElement[] { return this._bottom.get(type)!; }
  /** @java Topology#left(SiteType) */
  left(type: SiteType):           TopologyElement[] { return this._left.get(type)!; }
  /** @java Topology#right(SiteType) */
  right(type: SiteType):          TopologyElement[] { return this._right.get(type)!; }
  /** @java Topology#centre(SiteType) */
  centre(type: SiteType):         TopologyElement[] {
    this.ensureCentre(type);
    return withJavaListMethods(this._centre.get(type)!);
  }
  /** @java Topology#axial(SiteType) */
  axial(type: SiteType):          TopologyElement[] { return this._axials.get(type)!; }
  /** @java Topology#horizontal(SiteType) */
  horizontal(type: SiteType):     TopologyElement[] { return this._horizontal.get(type)!; }
  /** @java Topology#vertical(SiteType) */
  vertical(type: SiteType):       TopologyElement[] { return this._vertical.get(type)!; }
  /** @java Topology#angled(SiteType) */
  angled(type: SiteType):         TopologyElement[] { return this._angled.get(type)!; }
  /** @java Topology#slash(SiteType) */
  slash(type: SiteType):          TopologyElement[] { return this._slash.get(type)!; }
  /** @java Topology#slosh(SiteType) */
  slosh(type: SiteType):          TopologyElement[] { return this._slosh.get(type)!; }

  // -------- nested lists ---------------------------------------------------

  /** @java Topology#rows(SiteType) */
  rows(type: SiteType):      TopologyElement[][] { return this._rows.get(type)!; }
  /** @java Topology#columns(SiteType) */
  columns(type: SiteType):   TopologyElement[][] { return this._columns.get(type)!; }
  /** @java Topology#layers(SiteType) */
  layers(type: SiteType):    TopologyElement[][] { return this._layers.get(type)!; }
  /** @java Topology#diagonals(SiteType) */
  diagonals(type: SiteType): TopologyElement[][] { return this._diagonals.get(type)!; }
  /** @java Topology#phases(SiteType) */
  phases(type: SiteType):    TopologyElement[][] { return this._phases.get(type)!; }

  /** @java Topology#sides(SiteType) */
  sides(type: SiteType): Map<DirectionFacing, TopologyElement[]> {
    return this._sides.get(type)!;
  }

  // -------- direction support accessors ------------------------------------

  /** @java Topology#supportedDirections(RelationType,SiteType) */
  supportedDirections(relationTypeOrType: RelationType | SiteType, type?: SiteType): DirectionFacing[] {
    if (type === undefined) {
      // called as supportedDirections(SiteType)
      return this._supportedDirections.get(relationTypeOrType as SiteType) ?? [];
    }
    const t = type;
    switch (relationTypeOrType as RelationType) {
      case "Adjacent":    return this._supportedAdjacentDirections.get(t) ?? [];
      case "Diagonal":    return this._supportedDiagonalDirections.get(t) ?? [];
      case "All":         return this._supportedDirections.get(t) ?? [];
      case "OffDiagonal": return this._supportedOffDirections.get(t) ?? [];
      case "Orthogonal":  return this._supportedOrthogonalDirections.get(t) ?? [];
      default:            return this._supportedDirections.get(t) ?? [];
    }
  }

  /** @java Topology#supportedOrthogonalDirections(SiteType) */
  supportedOrthogonalDirections(type: SiteType): DirectionFacing[] {
    return this._supportedOrthogonalDirections.get(type) ?? [];
  }

  /** @java Topology#supportedDiagonalDirections(SiteType) */
  supportedDiagonalDirections(type: SiteType): DirectionFacing[] {
    return this._supportedDiagonalDirections.get(type) ?? [];
  }

  /** @java Topology#supportedAdjacentDirections(SiteType) */
  supportedAdjacentDirections(type: SiteType): DirectionFacing[] {
    return this._supportedAdjacentDirections.get(type) ?? [];
  }

  /** @java Topology#supportedOffDirections(SiteType) */
  supportedOffDirections(type: SiteType): DirectionFacing[] {
    return this._supportedOffDirections.get(type) ?? [];
  }

  // -------- distance accessors ---------------------------------------------

  /** @java Topology#distancesToCorners(SiteType) */
  distancesToCorners(type: SiteType): number[] | undefined {
    return this._distanceToCorners.get(type);
  }

  /** @java Topology#distancesToSides(SiteType) */
  distancesToSides(type: SiteType): number[] | undefined {
    return this._distanceToSides.get(type);
  }

  /** @java Topology#distancesToCentre(SiteType) */
  distancesToCentre(type: SiteType): number[] | undefined {
    return this._distanceToCentre.get(type);
  }

  /** @java Topology#distancesToOtherSite(SiteType) */
  distancesToOtherSite(type: SiteType): number[][] | undefined {
    return this._distanceToOtherSite.get(type);
  }

  /** @java Topology#distancesToRegions(SiteType) */
  distancesToRegions(type: SiteType): (number[] | null)[] | undefined {
    return this._distanceToRegions.get(type);
  }

  /** @java Topology#setDistanceToCorners(SiteType,int[]) */
  setDistanceToCorners(type: SiteType, d: number[]): void {
    this._distanceToCorners.set(type, d);
  }

  /** @java Topology#setDistanceToSides(SiteType,int[]) */
  setDistanceToSides(type: SiteType, d: number[]): void {
    this._distanceToSides.set(type, d);
  }

  /** @java Topology#setDistanceToCentre(SiteType,int[]) */
  setDistanceToCentre(type: SiteType, d: number[]): void {
    this._distanceToCentre.set(type, d);
  }

  // -------- phaseByElementIndex --------------------------------------------

  /** @java Topology#phaseByElementIndex(SiteType,int) */
  phaseByElementIndex(type: SiteType, index: number): number {
    return this._phaseByElementIndex.get(type)?.[index] ?? 0;
  }

  // -------- getGraphElement helpers ----------------------------------------

  /** @java Topology#getGraphElement(SiteType,int) */
  getGraphElement(type: SiteType, index: number): TopologyElement | null {
    switch (type) {
      case "Vertex": return this._vertices[index] ?? null;
      case "Edge":   return this._edges[index]    ?? null;
      case "Cell":   return this._cells[index]    ?? null;
    }
  }

  /** @java Topology#getGraphElements(SiteType) */
  getGraphElements(type: SiteType): TopologyElement[] {
    switch (type) {
      case "Vertex": return withJavaListMethods(this._vertices);
      case "Edge":   return withJavaListMethods(this._edges);
      case "Cell":   return withJavaListMethods(this._cells);
    }
  }

  /**
   * Java compatibility for SiteFinder-style coordinate lookup.
   * @java SiteFinder.find(board, coord, type) via Context.board().topology()
   */
  /** The owning board's default play type — set when the board builds this
   *  topology. @java SiteFinder.find resolves a null type to board.defaultSite(). */
  public defaultSiteType: SiteType | null = null;

  getElement(coord: string, type: SiteType | null = null): TopologyElement | null {
    // @java other/topology/SiteFinder.java — find(board, coord, type): a null type
    // resolves to the BOARD'S default site type, and the search is label-driven on
    // that single type. Iterating Cell-first regardless of play type made vertex-play
    // boards centroid-match a FACE once faces existed (Adugo's C5 -> cell 18).
    const types: SiteType[] = type !== null
      ? [type]
      : this.defaultSiteType !== null
        ? [this.defaultSiteType]
        : ["Cell", "Vertex", "Edge"];
    for (const realType of types) {
      const elements = this.getGraphElements(realType);
      // @java MeasureGraph labels take precedence (computed below); banded
      // element.label() values only match when clustering yields no hit.
      const clusteredFirst = this.clusteredLabelLookup(realType, elements);
      const cfHit = clusteredFirst?.get(coord.toUpperCase());
      if (cfHit !== undefined) return cfHit;
      // @java MeasureGraph labels are AUTHORITATIVE once clustering succeeds:
      // a coord absent from the map resolves to NOTHING (Java skips the
      // placement). The banded/centroid fallbacks below synthesized matches
      // for nonexistent labels — Terhuchu's "G6" (no such vertex in Java)
      // centroid-parsed to (6,5) = site 19, planting a phantom piece that
      // diverged the whole game from ply 1.
      if (clusteredFirst !== null && clusteredFirst !== undefined && clusteredFirst.size > 0) continue;

      for (const element of elements) {
        if (element.label() === coord) return element;
      }

      // @java Topology.computeRows/computeColumns + computeCoordinates —
      // labels are colLetter(row-banded x) + (y-band index + 1) computed on
      // the FINAL geometry. Rotated boards (HeXentafl's (rotate 90 (hex 4)))
      // get labels from these bands, not from unrotated axes.
      // @java MeasureGraph.measureSituation → setCoordinateLabels: labels come
      // from best-fit-angle row/column clustering (rotated hexes pick theta=60°
      // rows), falling back to centroid banding only on duplicate labels.
      const clustered = this.clusteredLabelLookup(realType, elements);
      const chit = clustered?.get(coord.toUpperCase());
      if (chit !== undefined) return chit;

      const banded = this.bandedLabelLookup(realType, elements);
      const hit = banded.get(coord.toUpperCase());
      if (hit !== undefined) return hit;

      const parsed = parseAlgebraicCoord(coord);
      if (parsed === null) continue;
      const targetX = parsed.col + (realType === "Cell" ? 0.5 : 0);
      const targetY = parsed.row + (realType === "Cell" ? 0.5 : 0);
      for (const element of elements) {
        const centroid = element.centroid3D();
        if (
          Math.abs(centroid.x() - targetX) < 0.25 &&
          Math.abs(centroid.y() - targetY) < 0.25
        ) {
          return element;
        }
      }
    }
    return null;
  }

  private _clusteredLabels = new Map<string, Map<string, TopologyElement> | null>();

  /**
   * @java MeasureGraph.clusterByDimension — distance-to-reference-line
   * clustering with margin 0.6*unit; Row tries theta 0..60° (step 15°),
   * Column tries bestRowTheta + 90..120°. Returns null when labels collide
   * (Java sets duplicateCoordinates and Topology bands instead).
   */
  private clusteredLabelLookup(
    realType: SiteType,
    elements: readonly TopologyElement[],
  ): Map<string, TopologyElement> | null {
    const cached = this._clusteredLabels.get(realType);
    if (cached !== undefined) return cached;
    if (elements.length === 0) { this._clusteredLabels.set(realType, null); return null; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of elements) {
      const c = e.centroid3D();
      if (c.x() < minX) minX = c.x(); if (c.x() > maxX) maxX = c.x();
      if (c.y() < minY) minY = c.y(); if (c.y() > maxY) maxY = c.y();
    }
    const W = Math.max(maxX - minX, 1e-9), H = Math.max(maxY - minY, 1e-9);
    const unit = (W + H) / 2 / Math.sqrt(elements.length);
    const margin = 0.6 * unit;
    const cluster = (kind: "Row" | "Column", theta: number): { buckets: number[]; error: number } => {
      let ax: number, ay: number;
      if (kind === "Row") { ax = minX + W / 2; ay = minY - H; }
      else { ax = minX - W; ay = minY + H / 2; }
      const bx = ax + W * Math.cos(theta), by = ay + W * Math.sin(theta);
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
      const rank = elements.map((e, n) => {
        const c = e.centroid3D();
        return { n, score: Math.abs((c.y() - ay) * dx - (c.x() - ax) * dy) / len };
      }).sort((a, b) => a.score - b.score);
      const buckets: number[] = new Array(elements.length).fill(-1);
      const groups: { sum: number; cnt: number; items: number[] }[] = [];
      let g: { sum: number; cnt: number; items: number[] } | null = null;
      for (const it of rank) {
        if (g === null || Math.abs(it.score - g.sum / g.cnt) > margin) {
          g = { sum: 0, cnt: 0, items: [] };
          groups.push(g);
        }
        g.sum += it.score; g.cnt += 1; g.items.push(it.n);
      }
      let error = 0;
      groups.forEach((grp, bid) => {
        let acc = 0;
        const mean = grp.sum / grp.cnt;
        for (const n of grp.items) buckets[n] = bid;
        for (const it of rank) if (grp.items.includes(it.n)) acc = (mean - it.score) ** 2;
        error += acc / grp.cnt;
      });
      error += 0.01 * groups.length;
      return { buckets, error };
    };
    let bestRow = cluster("Row", 0); let bestRowTheta = 0;
    for (let a = 0; a <= 60; a += 15) {
      const t = (a / 180) * Math.PI;
      const r = cluster("Row", t);
      if (r.error < bestRow.error) { bestRow = r; bestRowTheta = t; if (r.error < 0.01) break; }
    }
    let bestCol = cluster("Column", bestRowTheta + Math.PI / 2);
    for (let a = 90; a <= 120; a += 15) {
      const t = bestRowTheta + (a / 180) * Math.PI;
      const r = cluster("Column", t);
      if (r.error < bestCol.error) { bestCol = r; if (r.error < 0.01) break; }
    }
    const map = new Map<string, TopologyElement>();
    for (let n = 0; n < elements.length; n += 1) {
      const label = `${columnLabel(bestCol.buckets[n]!)}${bestRow.buckets[n]! + 1}`;
      if (map.has(label)) { this._clusteredLabels.set(realType, null); return null; }
      map.set(label, elements[n]!);
    }
    this._clusteredLabels.set(realType, map);
    return map;
  }

  private _bandedLabels = new Map<string, Map<string, TopologyElement>>();

  /**
   * Java-style banded coordinate labels for a site type, memoized.
   * @java Topology.computeRows (distinct y centroids, tolerance .001, sorted)
   * + computeColumns (x likewise) + computeCoordinates (label = colLetter +
   * (row+1)).
   */
  private bandedLabelLookup(
    realType: SiteType,
    elements: readonly TopologyElement[],
  ): Map<string, TopologyElement> {
    const cached = this._bandedLabels.get(realType);
    if (cached !== undefined) return cached;
    const tol = 0.001;
    const band = (vals: number[]): number[] => {
      const out: number[] = [];
      for (const v of vals) if (!out.some((b) => Math.abs(b - v) < tol)) out.push(v);
      return out.sort((a, b) => a - b);
    };
    const ys = band(elements.map((e) => e.centroid3D().y()));
    const xs = band(elements.map((e) => e.centroid3D().x()));
    const map = new Map<string, TopologyElement>();
    for (const e of elements) {
      const c = e.centroid3D();
      const row = ys.findIndex((y) => Math.abs(y - c.y()) < tol);
      const col = xs.findIndex((x) => Math.abs(x - c.x()) < tol);
      if (row < 0 || col < 0) continue;
      map.set(`${columnLabel(col)}${row + 1}`, e);
    }
    this._bandedLabels.set(realType, map);
    return map;
  }

  /** @java Topology#numSites(SiteType) */
  numSites(type: SiteType): number {
    switch (type) {
      case "Vertex": return this._vertices.length;
      case "Edge":   return this._edges.length;
      case "Cell":   return this._cells.length;
      default:       return UNDEFINED;
    }
  }

  // -------- getAllGraphElements --------------------------------------------

  /** @java Topology#getAllGraphElements() */
  getAllGraphElements(): TopologyElement[] {
    return [
      ...this._vertices,
      ...this._edges,
      ...this._cells,
    ];
  }

  // -------- find helpers ---------------------------------------------------

  /** @java Topology#findCell(double,double) */
  findCell(x: number, y: number): Cell | null {
    for (const cell of this._cells) {
      if (cell.matchesXY(x, y)) return cell;
    }
    return null;
  }

  /** @java Topology#findEdge(Vertex,Vertex) */
  findEdge(va: Vertex, vb: Vertex): Edge | null {
    for (const edge of this._edges) {
      if (edge.matchesVertices(va, vb)) return edge;
    }
    return null;
  }

  /** @java Topology#midpointEdgeUsed(Point2D) */
  midpointEdgeUsed(x: number, y: number): Edge | null {
    for (const edge of this._edges) {
      const c = edge.centroid();
      if (Math.abs(c.x - x) < 0.0001 && Math.abs(c.y - y) < 0.0001) {
        return edge;
      }
    }
    return null;
  }

  /** @java Topology#getCellWithCoords(int,int,int) */
  getCellWithCoords(row: number, col: number, level: number): Cell | null {
    for (const c of this._cells) {
      if (c.row() === row && c.col() === col && c.layer() === level) return c;
    }
    return null;
  }

  /** @java Topology#getVertexWithCoords(int,int,int) */
  getVertexWithCoords(row: number, col: number, level: number): Vertex | null {
    for (const v of this._vertices) {
      if (v.row() === row && v.col() === col && v.layer() === level) return v;
    }
    return null;
  }

  // -------- centrePoint ----------------------------------------------------

  /** @java Topology#centrePoint() */
  centrePoint(): { x: number; y: number } {
    const centreList = this._centre.get("Cell") ?? [];
    if (centreList.length === 0) return { x: 0.5, y: 0.5 };
    let avgX = 0;
    let avgY = 0;
    for (const elem of centreList) {
      avgX += elem.centroid().x;
      avgY += elem.centroid().y;
    }
    return { x: avgX / centreList.length, y: avgY / centreList.length };
  }

  // -------- symmetry setters/getters ---------------------------------------

  setCellRotationSymmetries(v: number[][]): void   { this._cellRotationSymmetries = v; }
  setCellReflectionSymmetries(v: number[][]): void { this._cellReflectionSymmetries = v; }
  setEdgeRotationSymmetries(v: number[][]): void   { this._edgeRotationSymmetries = v; }
  setEdgeReflectionSymmetries(v: number[][]): void { this._edgeReflectionSymmetries = v; }
  setVertexRotationSymmetries(v: number[][]): void   { this._vertexRotationSymmetries = v; }
  setVertexReflectionSymmetries(v: number[][]): void { this._vertexReflectionSymmetries = v; }

  cellRotationSymmetries():   number[][] | null { return this._cellRotationSymmetries; }
  cellReflectionSymmetries(): number[][] | null { return this._cellReflectionSymmetries; }
  edgeRotationSymmetries():   number[][] | null { return this._edgeRotationSymmetries; }
  edgeReflectionSymmetries(): number[][] | null { return this._edgeReflectionSymmetries; }
  vertexRotationSymmetries():   number[][] | null { return this._vertexRotationSymmetries; }
  vertexReflectionSymmetries(): number[][] | null { return this._vertexReflectionSymmetries; }

  // -------- perimeters -----------------------------------------------------

  /** @java Topology#perimeters() */
  perimeters(): Perimeter[] { return this._perimeters; }
  /** @java Topology#setPerimeter(List<Perimeter>) */
  setPerimeter(p: Perimeter[]): void { this._perimeters = p; }

  // -------- connectivities -------------------------------------------------

  /** @java Topology#connectivities(SiteType) */
  connectivities(type: SiteType): number[] {
    return this._connectivities.get(type) ?? [];
  }

  // -------- pre-generation methods -----------------------------------------

  /**
   * @java Core/src/other/topology/Topology.java:computeRelation
   */
  computeRelation(type: SiteType): void {
    const elements = this.getGraphElements(type);
    for (const element of elements) {
      clearArray(element.neighbours());
      clearArray(element.adjacent());
      clearArray(element.orthogonal());
      clearArray(element.diagonal());
      clearArray(element.off());
    }

    // @java Topology.java:2075-2114 — relations come from the trajectories'
    // per-relation steps (trajectories.steps(type, idx, type, dir)). The
    // geometric fallback below misses vertex DIAGONALS entirely (square-
    // vertex boards: supportedDirections(All) lacked NE/SE/SW/NW, so La
    // Dama's (directions Forwards of:All) lost its diagonal steps).
    {
      const trajRoot = this._trajectories as
        | { viewOf?: (kind: string) => unknown }
        | null;
      let view: { steps?: (site: number, dir: string) => number[] } | undefined;
      try {
        view = trajRoot?.viewOf?.(type) as typeof view;
      } catch {
        view = undefined;
      }
      if (view && typeof view.steps === "function") {
        const fill: Array<[string, (el: TopologyElement) => TopologyElement[]]> = [
          ["All", (el) => el.neighbours()],
          ["Adjacent", (el) => el.adjacent()],
          ["Orthogonal", (el) => el.orthogonal()],
          ["Diagonal", (el) => el.diagonal()],
          ["OffDiagonal", (el) => el.off()],
        ];
        for (const element of elements) {
          const idx = element.index();
          for (const [dir, listOf] of fill) {
            for (const to of view.steps!(idx, dir)) {
              const target = elements[to];
              if (target) addUnique(listOf(element), target);
            }
          }
        }
        return;
      }
    }

    if (type === "Cell") {
      for (let i = 0; i < this._cells.length; i += 1) {
        const a = this._cells[i]!;
        for (let j = i + 1; j < this._cells.length; j += 1) {
          const b = this._cells[j]!;
          const sharedEdges = countShared(a.edges(), b.edges());
          const sharedVertices = countShared(a.vertices(), b.vertices());
          if (sharedEdges > 0) {
            addUnique(a.orthogonal(), b);
            addUnique(b.orthogonal(), a);
            addUnique(a.adjacent(), b);
            addUnique(b.adjacent(), a);
            addUnique(a.neighbours(), b);
            addUnique(b.neighbours(), a);
          } else if (sharedVertices > 0) {
            addUnique(a.diagonal(), b);
            addUnique(b.diagonal(), a);
            addUnique(a.neighbours(), b);
            addUnique(b.neighbours(), a);
          }
        }
      }
      return;
    }

    if (type === "Vertex") {
      for (const edge of this._edges) {
        const a = edge.vA();
        const b = edge.vB();
        addUnique(a.orthogonal(), b);
        addUnique(b.orthogonal(), a);
        addUnique(a.adjacent(), b);
        addUnique(b.adjacent(), a);
        addUnique(a.neighbours(), b);
        addUnique(b.neighbours(), a);
      }
      return;
    }

    for (let i = 0; i < this._edges.length; i += 1) {
      const a = this._edges[i]!;
      for (let j = i + 1; j < this._edges.length; j += 1) {
        const b = this._edges[j]!;
        if (a.containsVertex(b.vA().index()) || a.containsVertex(b.vB().index())) {
          addUnique(a.orthogonal(), b);
          addUnique(b.orthogonal(), a);
          addUnique(a.adjacent(), b);
          addUnique(b.adjacent(), a);
          addUnique(a.neighbours(), b);
          addUnique(b.neighbours(), a);
        }
      }
    }
  }

  /**
   * @java Core/src/other/topology/Topology.java:computeSupportedDirection
   */
  computeSupportedDirection(type: SiteType): void {
    const all = this._supportedDirections.get(type)!;
    const orthogonal = this._supportedOrthogonalDirections.get(type)!;
    const diagonal = this._supportedDiagonalDirections.get(type)!;
    const adjacent = this._supportedAdjacentDirections.get(type)!;
    const off = this._supportedOffDirections.get(type)!;
    clearArray(all);
    clearArray(orthogonal);
    clearArray(diagonal);
    clearArray(adjacent);
    clearArray(off);

    for (const element of this.getGraphElements(type)) {
      fillDirections(element, element.neighbours(), element.supportedDirections(), all);
      fillDirections(element, element.orthogonal(), element.supportedOrthogonalDirections(), orthogonal);
      fillDirections(element, element.diagonal(), element.supportedDiagonalDirections(), diagonal);
      fillDirections(element, element.adjacent(), element.supportedAdjacentDirections(), adjacent);
      fillDirections(element, element.off(), element.supportedOffDirections(), off);
    }

    sortDirections(all);
    sortDirections(orthogonal);
    sortDirections(diagonal);
    sortDirections(adjacent);
    sortDirections(off);
  }

  /**
   * @java Core/src/other/topology/Topology.java:convertPropertiesToList
   */
  convertPropertiesToList(type: SiteType, elementIn: unknown): void {
    const element = elementIn as TopologyElement;
    const properties = element.properties();
    const addIf = (bit: number, list: TopologyElement[]): void => {
      if (properties.get(bit)) addUnique(list, element);
    };

    addIf(PROP.INNER, this.inner(type));
    addIf(PROP.OUTER, this.outer(type));
    addIf(PROP.INTERLAYER, this.interlayer(type));
    addIf(PROP.PERIMETER, this.perimeter(type));
    addIf(PROP.CORNER, this.corners(type));
    addIf(PROP.CORNER_CONCAVE, this.cornersConcave(type));
    addIf(PROP.CORNER_CONVEX, this.cornersConvex(type));
    addIf(PROP.MAJOR, this.major(type));
    addIf(PROP.MINOR, this.minor(type));
    addIf(PROP.CENTRE, this.centre(type));
    addIf(PROP.LEFT, this.left(type));
    addIf(PROP.TOP, this.top(type));
    addIf(PROP.RIGHT, this.right(type));
    addIf(PROP.BOTTOM, this.bottom(type));
    addIf(PROP.AXIAL, this.axial(type));
    addIf(PROP.SLASH, this.slash(type));
    addIf(PROP.SLOSH, this.slosh(type));
    addIf(PROP.VERTICAL, this.vertical(type));
    addIf(PROP.HORIZONTAL, this.horizontal(type));
    addIf(PROP.ANGLED, this.angled(type));

    for (let phase = 0; phase <= 5; phase += 1) {
      if (properties.get(PROP.PHASE_0 + phase)) {
        addUnique(this.phases(type)[phase]!, element);
        element.setPhase(phase);
      }
    }

    for (const [bit, dir] of PROP_SIDES) {
      if (properties.get(bit)) addUnique(this.sides(type).get(dir)!, element);
    }
  }

  /**
   * @java Core/src/other/topology/Topology.java:computeRows
   */
  computeRows(type: SiteType, threeDimensions: boolean): void {
    const rows = this.rows(type);
    clearArray(rows);
    if (this.shouldComputeFromCentroids(type, threeDimensions)) {
      const values = uniqueSorted(
        this.getGraphElements(type)
          .filter((e) => e.centroid3D().z() === 0)
          .map((e) => e.centroid3D().y()),
      );
      for (let i = 0; i < values.length; i += 1) {
        rows.push([]);
        for (const element of this.getGraphElements(type)) {
          if (Math.abs(element.centroid3D().y() - values[i]!) < 0.001) {
            rows[i]!.push(element);
            element.setRow(i);
          }
        }
      }
    } else {
      bucketByCoordinate(this.getGraphElements(type), rows, (e) => e.row());
    }
  }

  /**
   * @java Core/src/other/topology/Topology.java:computeColumns
   */
  computeColumns(type: SiteType, threeDimensions: boolean): void {
    const columns = this.columns(type);
    clearArray(columns);
    if (this.shouldComputeFromCentroids(type, threeDimensions)) {
      const values = uniqueSorted(
        this.getGraphElements(type)
          .filter((e) => e.centroid3D().z() === 0)
          .map((e) => e.centroid3D().x()),
      );
      for (let i = 0; i < values.length; i += 1) {
        columns.push([]);
        for (const element of this.getGraphElements(type)) {
          if (Math.abs(element.centroid3D().x() - values[i]!) < 0.001) {
            columns[i]!.push(element);
            element.setColumn(i);
          }
        }
      }
    } else {
      bucketByCoordinate(this.getGraphElements(type), columns, (e) => e.col());
    }
  }

  /**
   * @java Core/src/other/topology/Topology.java:crossReferencePhases
   */
  crossReferencePhases(type: SiteType): void {
    const elements = this.getGraphElements(type);
    const values = new Array<number>(elements.length);
    for (let e = 0; e < elements.length; e += 1) values[e] = this.elementPhase(type, e);
    this._phaseByElementIndex.set(type, values);
  }

  /**
   * @java Core/src/other/topology/Topology.java:computeLayers
   */
  computeLayers(type: SiteType): void {
    const layers = this.layers(type);
    clearArray(layers);
    if (this.shouldComputeFromCentroids(type, false)) {
      const values = uniqueSorted(this.getGraphElements(type).map((e) => e.centroid3D().z()));
      for (let i = 0; i < values.length; i += 1) {
        layers.push([]);
        for (const element of this.getGraphElements(type)) {
          if (element.centroid3D().z() === values[i]) {
            layers[i]!.push(element);
            element.setLayer(i);
          }
        }
      }
    } else {
      bucketByCoordinate(this.getGraphElements(type), layers, (e) => e.layer());
    }
  }

  /**
   * @java Core/src/other/topology/Topology.java:computeCoordinates
   */
  computeCoordinates(type: SiteType): void {
    if (!this.shouldComputeFromCentroids(type, false)) return;
    for (const element of this.getGraphElements(type)) {
      element.setLabel(`${columnLabel(element.col())}${element.row() + 1}`);
    }
  }

  /**
   * @java Core/src/other/topology/Topology.java:preGenerateDistanceTables
   */
  preGenerateDistanceTables(type: SiteType): void {
    this.ensureBasicPrecomputedRegions(type);
    this.preGenerateDistanceToPrecomputed(type, this._centre, this._distanceToCentre);
    this.preGenerateDistanceToPrecomputed(type, this._corners, this._distanceToCorners);
    this.preGenerateDistanceToPrecomputed(type, this._perimeter, this._distanceToSides);
  }

  /**
   * @java Core/src/other/topology/Topology.java:preGenerateDistanceToEachElementToEachOther
   */
  preGenerateDistanceToEachElementToEachOther(type: SiteType, relation: RelationType): void {
    if (this._distanceToOtherSite.get(type) !== undefined) return;
    const elements = this.getGraphElements(type);
    const distances = elements.map(() => new Array<number>(elements.length).fill(0));

    for (let idElem = 0; idElem < elements.length; idElem += 1) {
      const queue: number[] = relationNeighbours(elements[idElem]!, relation).map((e) => e.index());
      const queued = new Set(queue);
      let currDist = 0;
      while (queue.length > 0) {
        currDist += 1;
        const level = queue.splice(0, queue.length);
        queued.clear();
        for (const idNeighbour of level) {
          if (idNeighbour === idElem || distances[idElem]![idNeighbour]! > 0) continue;
          distances[idElem]![idNeighbour] = currDist;
          for (const next of relationNeighbours(elements[idNeighbour]!, relation)) {
            const nextIndex = next.index();
            if (!queued.has(nextIndex) && !level.includes(nextIndex)) {
              queued.add(nextIndex);
              queue.push(nextIndex);
            }
          }
        }
      }
    }

    this._distanceToOtherSite.set(type, distances);
    for (let idElem = 0; idElem < elements.length; idElem += 1) {
      const element = elements[idElem]!;
      clearArray(element.sitesAtDistance());
      let maxDistance = 0;
      for (const d of distances[idElem]!) if (maxDistance < d) maxDistance = d;
      element.sitesAtDistance().push([element]);
      for (let distance = 1; distance <= maxDistance; distance += 1) {
        const sitesAtDistance: TopologyElement[] = [];
        for (let idOther = 0; idOther < elements.length; idOther += 1) {
          if (distances[idElem]![idOther] === distance) sitesAtDistance.push(elements[idOther]!);
        }
        element.sitesAtDistance().push(sitesAtDistance);
      }
    }
  }

  /**
   * @java Core/src/other/topology/Topology.java:computeDoesCross
   */
  computeDoesCross(): void {
    for (const edge of this._edges) edge.setDoesCrossSet(new Set<number>());
    for (let i = 0; i < this._edges.length; i += 1) {
      const edge = this._edges[i]!;
      const a = edge.vA().centroid();
      const b = edge.vB().centroid();
      for (let j = i + 1; j < this._edges.length; j += 1) {
        const other = this._edges[j]!;
        const c = other.vA().centroid();
        const d = other.vB().centroid();
        if (
          pointDistance(a, c) < 0.001 ||
          pointDistance(a, d) < 0.001 ||
          pointDistance(b, c) < 0.001 ||
          pointDistance(b, d) < 0.001
        ) continue;
        if (segmentsIntersect(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y)) {
          edge.setDoesCross(other.index());
          other.setDoesCross(edge.index());
        }
      }
    }
  }

  /**
   * @java Core/src/other/topology/Topology.java:pregenerateFeaturesData(Game,Container)
   */
  pregenerateFeaturesData(game: {
    board?: () => { defaultSite?: (() => SiteType) | SiteType; getDefaultSite?: () => SiteType };
  }, container: unknown): void {
    this.pregenerateFeaturesDataForType(container, "Cell");
    this.pregenerateFeaturesDataForType(container, "Vertex");
    const board = game.board?.();
    const defaultSite = typeof board?.defaultSite === "function"
      ? board.defaultSite()
      : typeof board?.getDefaultSite === "function"
        ? board.getDefaultSite()
        : board?.defaultSite;
    if (defaultSite === "Edge") this.pregenerateFeaturesDataForType(container, "Edge");
  }

  /**
   * @java Core/src/other/topology/Topology.java:pregenerateFeaturesData(Container,SiteType)
   */
  pregenerateFeaturesDataForType(_container: unknown, type: SiteType): void {
    const connectivities: number[] = [];
    this._connectivities.set(type, connectivities);
    for (const element of this.getGraphElements(type)) {
      const orthos = [...element.orthogonal()].sort(angleComparator(element));
      element.setSortedOrthos(orthos);
      if (!connectivities.includes(orthos.length)) connectivities.push(orthos.length);
    }
    connectivities.sort((a, b) => a - b);
  }

  /** @java Topology#elementPhase(SiteType,int) */
  elementPhase(type: SiteType, index: number): number {
    const element = this.getGraphElements(type)[index];
    if (!element) return -1;
    for (let c = 0; c < MAX_CELL_COLOURS; c += 1) {
      if (this.phases(type)[c]?.includes(element)) return c;
    }
    return -1;
  }

  /** @java Topology#computeNumEdgeIfRegular() */
  computeNumEdgeIfRegular(): void {
    if (this._cells.length === 0) {
      this._numEdges = UNDEFINED;
      return;
    }
    const count = this._cells[0]!.edges().length;
    for (const cell of this._cells) {
      if (cell.edges().length !== count) {
        this._numEdges = UNDEFINED;
        return;
      }
    }
    this._numEdges = count;
  }

  private shouldComputeFromCentroids(type: SiteType, threeDimensions: boolean): boolean {
    if (threeDimensions) return true;
    const graph = this._graph as { duplicateCoordinates?: (type: SiteType) => boolean } | null;
    if (graph === null || typeof graph.duplicateCoordinates !== "function") return true;
    return graph.duplicateCoordinates(type);
  }

  private preGenerateDistanceToPrecomputed(
    type: SiteType,
    precomputed: Map<SiteType, TopologyElement[]>,
    distancesMap: Map<SiteType, number[]>,
  ): void {
    const elements = this.getGraphElements(type);
    if (elements.length === 0) return;
    const distances = new Array<number>(elements.length).fill(-1);
    let maxDistance = -1;
    const startingPoint = new Set<number>();

    for (const start of precomputed.get(type) ?? []) {
      const visited = new Set<number>();
      distances[start.index()] = 0;
      visited.add(start.index());
      startingPoint.add(start.index());
      let currDist = 0;
      let curr = [...start.adjacent()];
      while (curr.length > 0) {
        currDist += 1;
        const next: TopologyElement[] = [];
        for (const neighbour of curr) {
          const idx = neighbour.index();
          if (visited.has(idx) || startingPoint.has(idx)) continue;
          if (distances[idx]! > 0 && distances[idx]! <= currDist) continue;
          maxDistance = Math.max(maxDistance, currDist);
          distances[idx] = currDist;
          visited.add(idx);
          next.push(...neighbour.adjacent());
        }
        curr = next;
      }
    }

    const disconnectedDistance = maxDistance + 1;
    for (let i = 0; i < distances.length; i += 1) {
      if (distances[i] === -1) distances[i] = disconnectedDistance;
    }
    distancesMap.set(type, distances);
  }

  private ensureBasicPrecomputedRegions(type: SiteType): void {
    const elements = this.getGraphElements(type);
    if (elements.length === 0) return;

    const perimeter = this.perimeter(type);
    if (perimeter.length === 0) {
      for (const element of elements) {
        if (element.adjacent().length < maxAdjacent(elements)) addUnique(perimeter, element);
      }
    }

    const corners = this.corners(type);
    if (corners.length === 0 && perimeter.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const element of elements) {
        const c = element.centroid();
        minX = Math.min(minX, c.x);
        maxX = Math.max(maxX, c.x);
        minY = Math.min(minY, c.y);
        maxY = Math.max(maxY, c.y);
      }
      for (const element of perimeter) {
        const c = element.centroid();
        if (
          (Math.abs(c.x - minX) < 0.001 || Math.abs(c.x - maxX) < 0.001) &&
          (Math.abs(c.y - minY) < 0.001 || Math.abs(c.y - maxY) < 0.001)
        ) addUnique(corners, element);
      }
    }

    this.ensureCentre(type);
  }

  /**
   * Lazily computes Java's centre list: graph elements closest to the board
   * centroid. Odd rectangular cell boards therefore return the single middle
   * cell, while even/symmetric boards can return multiple equally central sites.
   * @java Topology#centre(SiteType)
   */
  private ensureCentre(type: SiteType): void {
    const centre = this._centre.get(type);
    if (centre === undefined || centre.length > 0) return;

    const elements = this.getGraphElements(type);
    if (elements.length === 0) return;

    let avgX = 0;
    let avgY = 0;
    for (const element of elements) {
      const c = element.centroid();
      avgX += c.x;
      avgY += c.y;
    }
    avgX /= elements.length;
    avgY /= elements.length;

    let bestDist = Infinity;
    for (const element of elements) {
      const c = element.centroid();
      const d = (c.x - avgX) * (c.x - avgX) + (c.y - avgY) * (c.y - avgY);
      if (d < bestDist) bestDist = d;
    }

    const tolerance = 1.0e-6;
    for (const element of elements) {
      const c = element.centroid();
      const d = (c.x - avgX) * (c.x - avgX) + (c.y - avgY) * (c.y - avgY);
      if (Math.abs(d - bestDist) <= tolerance) centre.push(element);
    }
  }

  // -------- memory ---------------------------------------------------------

  /** @java Topology#optimiseMemory() — no-op in TS */
  optimiseMemory(): void { /* no-op */ }
}

// @java Core/src/game/util/graph/Properties.java
const PROP = {
  INNER: 0,
  OUTER: 1,
  PERIMETER: 2,
  CENTRE: 3,
  MAJOR: 4,
  MINOR: 5,
  INTERLAYER: 7,
  CORNER: 10,
  CORNER_CONVEX: 11,
  CORNER_CONCAVE: 12,
  PHASE_0: 13,
  LEFT: 25,
  RIGHT: 26,
  TOP: 27,
  BOTTOM: 28,
  AXIAL: 30,
  HORIZONTAL: 31,
  VERTICAL: 32,
  ANGLED: 33,
  SLASH: 34,
  SLOSH: 35,
  SIDE_N: 40,
  SIDE_E: 41,
  SIDE_S: 42,
  SIDE_W: 43,
  SIDE_NE: 44,
  SIDE_SE: 45,
  SIDE_SW: 46,
  SIDE_NW: 47,
} as const;

const PROP_SIDES: readonly (readonly [number, DirectionFacing])[] = [
  [PROP.SIDE_E, "E" as DirectionFacing],
  [PROP.SIDE_W, "W" as DirectionFacing],
  [PROP.SIDE_N, "N" as DirectionFacing],
  [PROP.SIDE_S, "S" as DirectionFacing],
  [PROP.SIDE_NE, "NE" as DirectionFacing],
  [PROP.SIDE_NW, "NW" as DirectionFacing],
  [PROP.SIDE_SW, "SW" as DirectionFacing],
  [PROP.SIDE_SE, "SE" as DirectionFacing],
];

const DIRECTION_ORDER = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

function clearArray<T>(array: T[]): void {
  array.length = 0;
}

function addUnique<T>(array: T[], value: T): void {
  if (!array.includes(value)) array.push(value);
}

function countShared<T>(a: readonly T[], b: readonly T[]): number {
  let count = 0;
  for (const item of a) if (b.includes(item)) count += 1;
  return count;
}

function uniqueSorted(values: readonly number[]): number[] {
  const out: number[] = [];
  for (const value of values) {
    let found = false;
    for (const existing of out) {
      if (Math.abs(value - existing) < 0.001) {
        found = true;
        break;
      }
    }
    if (!found) out.push(value);
  }
  out.sort((a, b) => a - b);
  return out;
}

function bucketByCoordinate(
  elements: readonly TopologyElement[],
  buckets: TopologyElement[][],
  coord: (element: TopologyElement) => number,
): void {
  for (const element of elements) {
    const id = coord(element);
    while (buckets.length <= id) buckets.push([]);
    buckets[id]!.push(element);
  }
}

function columnLabel(col: number): string {
  let label = "";
  if (col >= 26) label = String.fromCharCode("A".charCodeAt(0) + Math.floor(col / 26) - 1);
  return label + String.fromCharCode("A".charCodeAt(0) + (col % 26));
}

function parseAlgebraicCoord(coord: string): { col: number; row: number } | null {
  const match = coord.match(/^([A-Za-z]+)(\d+)$/);
  if (!match || match[1]!.length !== 1) return null;
  const col = match[1]!.toUpperCase().charCodeAt(0) - 65;
  const row = Number.parseInt(match[2]!, 10) - 1;
  if (!Number.isFinite(row) || col < 0 || row < 0) return null;
  return { col, row };
}

function withJavaListMethods<T>(list: T[]): T[] {
  const target = list as T[] & { size?: () => number; get?: (index: number) => T | undefined };
  if (typeof target.size !== "function") {
    Object.defineProperty(target, "size", {
      value: () => target.length,
      enumerable: false,
    });
  }
  if (typeof target.get !== "function") {
    Object.defineProperty(target, "get", {
      value: (index: number) => target[index],
      enumerable: false,
    });
  }
  return list;
}

function relationNeighbours(element: TopologyElement, relation: RelationType): TopologyElement[] {
  switch (relation) {
    case "Adjacent": return element.adjacent();
    case "All": return element.neighbours();
    case "Diagonal": return element.diagonal();
    case "OffDiagonal": return element.off();
    case "Orthogonal": return element.orthogonal();
    default: return [];
  }
}

function fillDirections(
  from: TopologyElement,
  neighbours: readonly TopologyElement[],
  elementDirections: DirectionFacing[],
  topologyDirections: DirectionFacing[],
): void {
  clearArray(elementDirections);
  for (const to of neighbours) {
    const dir = directionBetween(from, to);
    if (dir === null) continue;
    addUnique(elementDirections, dir);
    addUnique(topologyDirections, dir);
  }
}

function directionBetween(from: TopologyElement, to: TopologyElement): DirectionFacing | null {
  const a = from.centroid();
  const b = to.centroid();
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) < 0.000001 && Math.abs(dy) < 0.000001) return null;
  const angle = Math.atan2(dy, dx);
  const sector = ((Math.round((Math.PI / 2 - angle) / (Math.PI / 8)) % 16) + 16) % 16;
  return DIRECTION_ORDER[sector] as DirectionFacing;
}

function sortDirections(dirs: DirectionFacing[]): void {
  dirs.sort((a, b) => DIRECTION_ORDER.indexOf(a) - DIRECTION_ORDER.indexOf(b));
}

function pointDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function orientation(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): number {
  const value = (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
  if (Math.abs(value) < 1e-9) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): boolean {
  return bx <= Math.max(ax, cx) && bx >= Math.min(ax, cx) &&
    by <= Math.max(ay, cy) && by >= Math.min(ay, cy);
}

function segmentsIntersect(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
  dx: number, dy: number,
): boolean {
  const o1 = orientation(ax, ay, bx, by, cx, cy);
  const o2 = orientation(ax, ay, bx, by, dx, dy);
  const o3 = orientation(cx, cy, dx, dy, ax, ay);
  const o4 = orientation(cx, cy, dx, dy, bx, by);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(ax, ay, cx, cy, bx, by)) return true;
  if (o2 === 0 && onSegment(ax, ay, dx, dy, bx, by)) return true;
  if (o3 === 0 && onSegment(cx, cy, ax, ay, dx, dy)) return true;
  if (o4 === 0 && onSegment(cx, cy, bx, by, dx, dy)) return true;
  return false;
}

function angleComparator(origin: TopologyElement): (a: TopologyElement, b: TopologyElement) => number {
  const o = origin.centroid();
  return (a, b) => {
    const ac = a.centroid();
    const bc = b.centroid();
    return Math.atan2(ac.y - o.y, ac.x - o.x) - Math.atan2(bc.y - o.y, bc.x - o.x);
  };
}

function maxAdjacent(elements: readonly TopologyElement[]): number {
  let max = 0;
  for (const element of elements) max = Math.max(max, element.adjacent().length);
  return max;
}
