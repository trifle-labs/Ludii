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

  /** @java Topology#trajectories() — opaque reference */
  trajectories(): unknown { return this._trajectories; }
  /** Set trajectories reference. */
  setTrajectories(t: unknown): void { this._trajectories = t; }

  // -------- element lists --------------------------------------------------

  /** @java Topology#cells() */
  cells():    Cell[]   { return this._cells; }
  /** @java Topology#edges() */
  edges():    Edge[]   { return this._edges; }
  /** @java Topology#vertices() */
  vertices(): Vertex[] { return this._vertices; }

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
  centre(type: SiteType):         TopologyElement[] { return this._centre.get(type)!; }
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
      case "Vertex": return this._vertices;
      case "Edge":   return this._edges;
      case "Cell":   return this._cells;
    }
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

  // -------- memory ---------------------------------------------------------

  /** @java Topology#optimiseMemory() — no-op in TS */
  optimiseMemory(): void { /* no-op */ }
}
