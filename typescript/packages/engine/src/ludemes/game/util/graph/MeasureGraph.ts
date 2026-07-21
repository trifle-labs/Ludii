// @java Core/src/game/util/graph/MeasureGraph.java

/**
 * Measure graph properties. This helper class is not meant to be instantiated.
 * All methods are static.
 *
 * @java game.util.graph.MeasureGraph
 * @author cambolbro
 */

import { Properties } from "./Properties.js";
import { Perimeter } from "./Perimeter.js";
import { Bucket } from "./Bucket.js";
import { ItemScore } from "./ItemScore.js";
import { RCL } from "./Situation.js";

// ---------------------------------------------------------------------------
// Local structural interfaces matching game.util.graph Java types.
// These shadow the not-yet-ported Graph/Vertex/Edge/Face classes.
// ---------------------------------------------------------------------------

/** Java parity: main.math.Point3D */
interface Point3D {
  x(): number;
  y(): number;
  z(): number;
}

/** Java parity: java.awt.geom.Point2D (used as {x,y}) */
interface Point2D {
  getX(): number;
  getY(): number;
}

/** Java parity: java.awt.geom.Rectangle2D */
interface Rectangle2D {
  getX(): number;
  getY(): number;
  getWidth(): number;
  getHeight(): number;
}

/** Java parity: game.util.graph.GraphElement */
interface GraphElement {
  id(): number;
  pt(): Point3D;
  pt2D(): Point2D;
  properties(): Properties;
  /** @java GraphElement.situation() */
  situation(): { rcl(): RCL; setLabel(s: string): void; label(): string };
  /** @java GraphElement.nbors() */
  nbors(): GraphElement[];
}

/** Java parity: game.util.graph.Vertex */
interface Vertex extends GraphElement {
  pivot(): Vertex | null;
  edges(): Edge[];
  faces(): Face[];
  /** @java Vertex.edgePosition(Edge) */
  edgePosition(edge: Edge): number;
  /** @java Vertex.incidentEdge(Vertex) */
  incidentEdge(other: Vertex): Edge | null;
}

/** Java parity: game.util.graph.Edge */
interface Edge extends GraphElement {
  vertexA(): Vertex;
  vertexB(): Vertex;
  left(): Face | null;
  right(): Face | null;
  /** @java Edge.otherVertex(Vertex) */
  otherVertex(v: Vertex): Vertex;
}

/** Java parity: game.util.graph.Face */
interface Face extends GraphElement {
  vertices(): Vertex[];
  edges(): Edge[];
}

/** Java parity: game.types.board.SiteType */
type SiteType = "Vertex" | "Edge" | "Cell";

/** Java parity: main.math.RCLType */
type RCLType = "Row" | "Column" | "Layer";

/** Java parity: game.util.graph.Graph (partial interface for MeasureGraph usage) */
interface Graph {
  vertices(): Vertex[];
  edges(): Edge[];
  faces(): Face[];
  perimeters(): Perimeter[];
  clearProperties(): void;
  clearPerimeters(): void;
  addPerimeter(p: Perimeter): void;
  removePerimeter(n: number): void;
  elements(type: SiteType): GraphElement[];
  /** @java Graph.centroid() */
  centroid(): Point2D;
  /** @java Graph.bounds(List) */
  setDuplicateCoordinates(type: SiteType): void;
}

// ---------------------------------------------------------------------------
// The siteTypes array (Java: Graph.siteTypes)
// ---------------------------------------------------------------------------

const SITE_TYPES: SiteType[] = ["Vertex", "Edge", "Cell"];

// ---------------------------------------------------------------------------
// MathRoutines helpers (inlined from Java main.math.MathRoutines)
// ---------------------------------------------------------------------------

/** Java: MathRoutines.pointInPolygon(Point2D, List<Point2D>) */
function pointInPolygon(pt: Point2D, polygon: readonly Point2D[]): boolean {
  const x = pt.getX();
  const y = pt.getY();
  const n = polygon.length;
  let odd = false;
  let j = n - 1;
  for (let i = 0; i < n; i++) {
    const ix = polygon[i]!.getX();
    const iy = polygon[i]!.getY();
    const jx = polygon[j]!.getX();
    const jy = polygon[j]!.getY();
    if (((iy < y && jy >= y) || (jy < y && iy >= y)) && (ix <= x || jx <= x)) {
      if (ix + ((y - iy) / (jy - iy)) * (jx - ix) < x) odd = !odd;
    }
    j = i;
  }
  return odd;
}

/** Java: MathRoutines.distanceToLine(Point2D pt, Point2D a, Point2D b) */
function distanceToLine(pt: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.getX() - a.getX();
  const dy = b.getY() - a.getY();
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-14) {
    const ex = pt.getX() - a.getX();
    const ey = pt.getY() - a.getY();
    return Math.sqrt(ex * ex + ey * ey);
  }
  const cross = (pt.getY() - a.getY()) * dx - (pt.getX() - a.getX()) * dy;
  return Math.abs(cross) / Math.sqrt(len2);
}

/** Java: MathRoutines.clockwise(Point2D a, Point2D pt, Point2D b) */
function clockwise(a: Point2D, pt: Point2D, b: Point2D): boolean {
  return (
    (pt.getX() - a.getX()) * (b.getY() - a.getY()) -
    (b.getX() - a.getX()) * (pt.getY() - a.getY())
  ) < 1e-7;
}

/** Java: MathRoutines.distanceSquared(Point2D a, Point2D b) */
function distanceSquared(a: Point2D, b: Point2D): number {
  const dx = a.getX() - b.getX();
  const dy = a.getY() - b.getY();
  return dx * dx + dy * dy;
}

// ---------------------------------------------------------------------------
// Static bounds helper (Java: Graph.bounds(List<? extends GraphElement>))
// ---------------------------------------------------------------------------

function boundsOf(elements: GraphElement[]): Rectangle2D {
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const ge of elements) {
    const x = ge.pt().x();
    const y = ge.pt().y();
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (elements.length === 0) { minX = minY = maxX = maxY = 0; }
  return {
    getX() { return minX; },
    getY() { return minY; },
    getWidth()  { return maxX - minX; },
    getHeight() { return maxY - minY; },
  };
}

// ---------------------------------------------------------------------------
// MeasureGraph
// ---------------------------------------------------------------------------

export abstract class MeasureGraph {

  // -------------------------------------------------------------------------

  /**
   * @java MeasureGraph.measure(Graph, boolean)
   */
  public static measure(graph: Graph, boardless: boolean): void {
    graph.clearProperties();

    if (!boardless) {
      MeasureGraph.measurePivot(graph);
      MeasureGraph.measurePerimeter(graph);
      MeasureGraph.measureInnerOuter(graph);
      MeasureGraph.measureExtremes(graph);
      MeasureGraph.measureMajorMinor(graph);
      MeasureGraph.measureCorners(graph);
      MeasureGraph.measureSides(graph);
      MeasureGraph.measurePhase(graph);
      MeasureGraph.measureEdgeOrientation(graph);
      MeasureGraph.measureSituation(graph);
    }

    MeasureGraph.measureCentre(graph);
  }

  // -------------------------------------------------------------------------

  /**
   * @java MeasureGraph.measurePivot(Graph)
   */
  public static measurePivot(graph: Graph): void {
    for (const vertex of graph.vertices()) {
      if (vertex.pivot() !== null) {
        vertex.pivot()!.properties().set(Properties.PIVOT);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Sets elements on the graph perimeter.
   *
   * @java MeasureGraph.measurePerimeter(Graph)
   */
  public static measurePerimeter(graph: Graph): void {
    graph.clearPerimeters();

    const covered = new Set<number>();

    // Generate the candidate polygons
    while (true) {
      const perimeter = MeasureGraph.createNextPerimeter(graph, covered);
      if (perimeter === null) break;
      graph.addPerimeter(perimeter);
    }

    // Remove candidates contained in other candidates
    for (let pa = graph.perimeters().length - 1; pa >= 0; pa--) {
      const ptA = graph.perimeters()[pa]!.startPoint();

      let isInside = false;
      for (let pb = 0; pb < graph.perimeters().length; pb++) {
        if (pa === pb) continue;

        if (ptA !== null && pointInPolygon(ptA as unknown as Point2D, graph.perimeters()[pb]!.positions() as unknown as Point2D[])) {
          isInside = true;
          break;
        }
      }

      if (isInside) {
        graph.removePerimeter(pa);
      }
    }

    // Set properties of perimeter elements
    for (const perimeter of graph.perimeters()) {
      const numVerts = perimeter.elements().length;
      for (let n = 0; n < numVerts; n++) {
        const vertexA = perimeter.elements()[n] as unknown as Vertex;
        const vertexB = perimeter.elements()[(n + 1) % numVerts] as unknown as Vertex;

        vertexA.properties().set(Properties.PERIMETER);
        vertexB.properties().set(Properties.PERIMETER);

        const edge = vertexA.incidentEdge(vertexB);
        if (edge === null) continue;

        edge.properties().set(Properties.PERIMETER);

        if (edge.left() !== null) {
          edge.left()!.properties().set(Properties.PERIMETER);
        } else if (edge.right() !== null) {
          edge.right()!.properties().set(Properties.PERIMETER);
        }
      }
    }
  }

  /**
   * @java MeasureGraph.createNextPerimeter(Graph, BitSet)
   */
  private static createNextPerimeter(graph: Graph, covered: Set<number>): Perimeter | null {
    // Find leftmost unused vertex
    let start: Vertex | null = null;
    let minX = 1000000;

    for (const vertex of graph.vertices()) {
      if (!covered.has(vertex.id()) && vertex.pt().x() < minX) {
        start = vertex;
        minX = vertex.pt().x();
      }
    }

    if (start === null) return null;

    const perimeter = MeasureGraph.followPerimeterClockwise(start);
    if (perimeter === null) return null;

    // Mark polygon vertices as covered
    for (const ge of perimeter.elements()) {
      covered.add(ge.id());
    }

    // Make a copy of this polygon converted to Point2D
    const polygon2D = perimeter.positions();

    // Mark vertices contained by this polygon as covered
    for (const vertex of graph.vertices()) {
      if (!covered.has(vertex.id()) && pointInPolygon(vertex.pt2D() as unknown as Point2D, polygon2D as unknown as Point2D[])) {
        if (!perimeter.on.has(vertex.id())) {
          perimeter.addInside(vertex as unknown as import("./Perimeter.js").Vertex);
        }
        covered.add(vertex.id());
      }
    }

    return perimeter;
  }

  /**
   * @java MeasureGraph.followPerimeterClockwise(Vertex)
   */
  private static followPerimeterClockwise(from: Vertex): Perimeter {
    const perimeter = new Perimeter();

    if (from.edges().length === 0) {
      perimeter.add(from as unknown as import("./Perimeter.js").Vertex);
      return perimeter;
    }

    // Find vertex edge closest to 90 degrees (straight up)
    let bestEdge: Edge | null = null;
    let bestAngle = 1000000;

    for (const edge of from.edges()) {
      const to = edge.otherVertex(from);
      const dx = to.pt().x() - from.pt().x();
      const dy = to.pt().y() - from.pt().y();

      const angle = Math.atan2(dx, -dy); // minimises in up direction

      if (angle < bestAngle) {
        bestEdge = edge;
        bestAngle = angle;
      }
    }

    // Follow this vertex around this perimeter
    let vertex: Vertex = from;
    let prev: Vertex = from;
    let edge: Edge = bestEdge!;

    while (true) {
      perimeter.add(vertex as unknown as import("./Perimeter.js").Vertex);

      // Step to next vertex
      prev = vertex;
      vertex = edge.otherVertex(vertex);

      const i = vertex.edgePosition(edge);

      for (let n = 1; n < vertex.edges().length; n++) {
        edge = vertex.edges()[(i + n) % vertex.edges().length]!;
        if (edge.otherVertex(vertex).id() !== prev.id()) break;
      }

      if (vertex.id() === from.id()) break;
    }

    return perimeter;
  }

  // -------------------------------------------------------------------------

  /**
   * Determines inner and outer graph elements.
   *
   * @java MeasureGraph.measureInnerOuter(Graph)
   */
  public static measureInnerOuter(graph: Graph): void {
    // Set all perimeter elements to outer
    for (const st of SITE_TYPES) {
      for (const ge of graph.elements(st)) {
        if (ge.properties().getFlag(Properties.PERIMETER)) {
          ge.properties().set(Properties.OUTER);
        }
      }
    }

    // Set faces with a perimeter vertex to outer
    for (const face of graph.faces()) {
      for (const vertex of face.vertices()) {
        if (vertex.properties().getFlag(Properties.PERIMETER)) {
          face.properties().set(Properties.OUTER);
          face.properties().set(Properties.PERIMETER);
        }
      }
    }

    // Set edges with a perimeter vertex to outer
    for (const edge of graph.edges()) {
      if (
        edge.vertexA().properties().getFlag(Properties.PERIMETER) &&
        edge.vertexB().properties().getFlag(Properties.PERIMETER) &&
        (edge.left() === null || edge.right() === null)
      ) {
        edge.properties().set(Properties.OUTER);
        edge.properties().set(Properties.PERIMETER);
      }
    }

    // Set faces with a null neighbour
    for (const face of graph.faces()) {
      for (const edge of face.edges()) {
        if (edge.left() === null || edge.right() === null) {
          face.properties().set(Properties.NULL_NBOR);
        }
      }
    }

    // Set non-outer items to inner
    for (const st of SITE_TYPES) {
      for (const ge of graph.elements(st)) {
        if (!ge.properties().getFlag(Properties.OUTER)) {
          ge.properties().set(Properties.INNER);
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Determines the left/right/top/bottom graph elements.
   *
   * @java MeasureGraph.measureExtremes(Graph)
   */
  public static measureExtremes(graph: Graph): void {
    const tolerance = 0.01;

    for (const st of SITE_TYPES) {
      let minX =  1000000;
      let minY =  1000000;
      let maxX = -1000000;
      let maxY = -1000000;

      for (const ge of graph.elements(st)) {
        if (ge.pt().x() < minX) minX = ge.pt().x();
        if (ge.pt().y() < minY) minY = ge.pt().y();
        if (ge.pt().x() > maxX) maxX = ge.pt().x();
        if (ge.pt().y() > maxY) maxY = ge.pt().y();
      }

      for (const ge of graph.elements(st)) {
        if (ge.pt().x() - minX < tolerance) ge.properties().set(Properties.LEFT);
        if (ge.pt().y() - minY < tolerance) ge.properties().set(Properties.BOTTOM);
        if (maxX - ge.pt().x() < tolerance) ge.properties().set(Properties.RIGHT);
        if (maxY - ge.pt().y() < tolerance) ge.properties().set(Properties.TOP);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Determines which cells are major and which are minor.
   *
   * @java MeasureGraph.measureMajorMinor(Graph)
   */
  public static measureMajorMinor(graph: Graph): void {
    let maxSides = 0;

    for (const face of graph.faces()) {
      if (face.vertices().length > maxSides) maxSides = face.vertices().length;
    }

    for (const face of graph.faces()) {
      if (face.vertices().length === maxSides) {
        face.properties().set(Properties.MAJOR);
      } else {
        face.properties().set(Properties.MINOR);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Determines outer graph elements that are corners.
   *
   * @java MeasureGraph.measureCorners(Graph)
   */
  public static measureCorners(graph: Graph): void {
    MeasureGraph.cornersFromPerimeters(graph);

    for (const vertex of graph.vertices()) {
      if (!vertex.properties().getFlag(Properties.CORNER)) continue;

      const isConcave = vertex.properties().getFlag(Properties.CORNER_CONCAVE);

      // Check for incident edge with other endpoint on perimeter
      let singleEdge = false;
      for (const edge of vertex.edges()) {
        const other = edge.otherVertex(vertex);
        if (other.properties().getFlag(Properties.CORNER)) {
          // Both endpoints of this edge are corners
          edge.properties().set(Properties.CORNER);

          if (isConcave) {
            edge.properties().set(Properties.CORNER_CONCAVE);
          } else {
            edge.properties().set(Properties.CORNER_CONVEX);
          }

          const faceL = edge.left();
          const faceR = edge.right();

          if (faceL !== null) {
            faceL.properties().set(Properties.CORNER);
            if (isConcave) {
              faceL.properties().set(Properties.CORNER_CONCAVE);
            } else {
              faceL.properties().set(Properties.CORNER_CONVEX);
            }
          } else if (faceR !== null) {
            faceR.properties().set(Properties.CORNER);
            if (isConcave) {
              faceR.properties().set(Properties.CORNER_CONCAVE);
            } else {
              faceR.properties().set(Properties.CORNER_CONVEX);
            }
          }

          singleEdge = true;
        }
      }

      if (singleEdge) continue;

      // Vertex is a corner on its own
      for (const edge of vertex.edges()) {
        if (!edge.properties().getFlag(Properties.PERIMETER)) continue;

        edge.properties().set(Properties.CORNER);

        if (isConcave) {
          edge.properties().set(Properties.CORNER_CONCAVE);
        } else {
          edge.properties().set(Properties.CORNER_CONVEX);
        }

        if (isConcave) {
          for (const face of vertex.faces()) {
            if (MeasureGraph.numPerimeterVertices(face) === 1) {
              face.properties().set(Properties.CORNER);
              if (isConcave) {
                face.properties().set(Properties.CORNER_CONCAVE);
              } else {
                face.properties().set(Properties.CORNER_CONVEX);
              }
            }
          }
        } else {
          const faceL = edge.left();
          const faceR = edge.right();

          if (faceL !== null) {
            faceL.properties().set(Properties.CORNER);
            faceL.properties().set(Properties.CORNER_CONVEX);
          } else if (faceR !== null) {
            faceR.properties().set(Properties.CORNER);
            faceR.properties().set(Properties.CORNER_CONVEX);
          }
        }
      }
    }
  }

  /** @java MeasureGraph.numPerimeterVertices(Face) */
  static numPerimeterVertices(face: Face): number {
    let num = 0;
    for (const vertex of face.vertices()) {
      if (vertex.properties().getFlag(Properties.PERIMETER)) num++;
    }
    return num;
  }

  /** @java MeasureGraph.cornersFromPerimeters(Graph) */
  static cornersFromPerimeters(graph: Graph): void {
    for (const perimeter of graph.perimeters()) {
      MeasureGraph.cornersFromPerimeter(graph, perimeter);
    }
  }

  /** @java MeasureGraph.cornersFromPerimeter(Graph, Perimeter) */
  static cornersFromPerimeter(graph: Graph, perimeter: Perimeter): void {
    const tolerance = 0.001;

    if (perimeter.elements().length < 6) {
      // Simple convex polygon
      for (const ge of perimeter.elements()) {
        const e = ge as unknown as GraphElement;
        e.properties().set(Properties.CORNER);
        e.properties().set(Properties.CORNER_CONVEX);
      }
      return;
    }

    const num = perimeter.elements().length;
    const polygon2D = perimeter.positions() as unknown as Point2D[];

    // Calculate average determinant at each perimeter site
    const scores = new Array<number>(num).fill(0);
    const numK = 4;

    for (let n = 0; n < num; n++) {
      const pt = polygon2D[n]!;

      // Accumulated line segment error approach
      let score = 0;
      for (let k = 1; k < numK; k++) {
        const ptA = polygon2D[(n - k + num) % num]!;
        const ptB = polygon2D[(n + k) % num]!;

        let dist = distanceToLine(pt, ptA, ptB);

        if (clockwise(ptA, pt, ptB)) {
          dist = -dist;
        }

        score += dist / k;
      }
      scores[n] = score;
    }

    // Smooth the scores
    const numSmoothingPasses = 1;
    const temp = new Array<number>(num).fill(0);

    for (let pass = 0; pass < numSmoothingPasses; pass++) {
      for (let n = 0; n < num; n++) {
        temp[n] = (4 * scores[n]! + scores[(n + 1) % num]! + scores[(n - 1 + num) % num]!) / 6;
      }
      for (let n = 0; n < num; n++) {
        scores[n] = temp[n]!;
      }
    }

    // Detect convex corners
    const keep = new Uint8Array(num).fill(1);

    for (let n = 0; n < num; n++) {
      if (
        scores[n]! < 0.320 ||
        scores[n]! < scores[(n - 1 + num) % num]! - tolerance ||
        scores[n]! < scores[(n + 1) % num]! - tolerance
      ) {
        keep[n] = 0;
      }
    }

    // Keep similar nbors
    const similar = 0.95;
    for (let n = 0; n < num; n++) {
      if (!keep[n]) continue;
      if (scores[(n - 1 + num) % num]! >= similar * scores[n]!) keep[(n - 1 + num) % num] = 1;
      if (scores[(n + 1) % num]!         >= similar * scores[n]!) keep[(n + 1) % num] = 1;
    }

    for (let n = 0; n < num; n++) {
      if (keep[n]) {
        const ge = perimeter.elements()[n] as unknown as GraphElement;
        ge.properties().set(Properties.CORNER);
        ge.properties().set(Properties.CORNER_CONVEX);
      }
    }

    // Detect concave corners
    keep.fill(1);

    for (let n = 0; n < num; n++) {
      if (
        scores[n]! > -0.25 ||
        scores[n]! > scores[(n - 1 + num) % num]! + tolerance ||
        scores[n]! > scores[(n + 1) % num]! + tolerance
      ) {
        keep[n] = 0;
      }
    }

    for (let n = 0; n < num; n++) {
      if (keep[n]) {
        const ge = perimeter.elements()[n] as unknown as GraphElement;
        ge.properties().set(Properties.CORNER);
        ge.properties().set(Properties.CORNER_CONCAVE);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Determines which board side perimeter graph elements are on.
   *
   * @java MeasureGraph.measureSides(Graph)
   */
  public static measureSides(graph: Graph): void {
    const mid = graph.centroid();

    for (const perimeter of graph.perimeters()) {
      MeasureGraph.findSides(graph, mid, perimeter);
    }

    // Determine edge and cell sides based on perimeter vertices
    const sides: bigint[] = [
      Properties.SIDE_N,  Properties.SIDE_E,  Properties.SIDE_S,  Properties.SIDE_W,
      Properties.SIDE_NE, Properties.SIDE_SE, Properties.SIDE_SW, Properties.SIDE_NW,
    ];

    for (const vertex of graph.vertices()) {
      if (!vertex.properties().getFlag(Properties.CORNER)) continue;

      for (const sideCode of sides) {
        if (!vertex.properties().getFlag(sideCode)) continue;

        // Edges: both end points must be on this side
        for (const edge of vertex.edges()) {
          const other = edge.otherVertex(vertex);
          if (other.properties().getFlag(sideCode)) {
            edge.properties().set(sideCode);
          }
        }

        // Cells: any face with this vertex is on this side
        for (const face of vertex.faces()) {
          face.properties().set(sideCode);
        }
      }
    }

    // Ensure that edges and faces inherit the side(s) their vertices are on
    const sidesMask: bigint =
      Properties.SIDE_N | Properties.SIDE_E | Properties.SIDE_S | Properties.SIDE_W |
      Properties.SIDE_NE | Properties.SIDE_SE | Properties.SIDE_SW | Properties.SIDE_NW;

    for (const vertex of graph.vertices()) {
      for (const edge of vertex.edges()) {
        edge.properties().add(vertex.properties().get() & sidesMask);
      }

      for (const face of vertex.faces()) {
        face.properties().add(vertex.properties().get() & sidesMask);
      }
    }
  }

  /** @java MeasureGraph.findSides(Graph, Point2D, Perimeter) */
  static findSides(graph: Graph, mid: Point2D, perimeter: Perimeter): void {
    const num = perimeter.elements().length;
    for (let from = 0; from < num; from++) {
      const geFrom = perimeter.elements()[from] as unknown as GraphElement;
      if (geFrom.properties().getFlag(Properties.CORNER)) {
        // Handle this side run
        let to = from;
        let geTo: GraphElement;
        do {
          to++;
          geTo = perimeter.elements()[to % num] as unknown as GraphElement;
        } while (!geTo.properties().getFlag(Properties.CORNER));

        const runLength = to - from;
        MeasureGraph.sideFromRun(graph, perimeter, mid, from, runLength);
      }
    }
  }

  /** @java MeasureGraph.sideFromRun(Graph, Perimeter, Point2D, int, int) */
  static sideFromRun(
    graph: Graph,
    perimeter: Perimeter,
    mid: Point2D,
    from: number,
    runLength: number,
  ): void {
    const numDirections = 16;
    const num = perimeter.elements().length;
    const geFrom = perimeter.elements()[from] as unknown as GraphElement;

    // Locate average position of elements along run
    let avgX = geFrom.pt().x();
    let avgY = geFrom.pt().y();

    let ge: GraphElement | null = null;
    for (let r = 0; r < runLength; r++) {
      ge = perimeter.elements()[(from + 1 + r) % num] as unknown as GraphElement;
      avgX += ge.pt().x();
      avgY += ge.pt().y();
    }
    avgX /= (runLength + 1);
    avgY /= (runLength + 1);

    const midAsPt2D: Point2D = {
      getX() { return mid.getX(); },
      getY() { return mid.getY(); },
    };
    const avgPt: Point2D = {
      getX() { return avgX; },
      getY() { return avgY; },
    };

    const dirn = MeasureGraph.discreteDirectionPts(midAsPt2D, avgPt, numDirections);

    let property: bigint = 0n;

    if (dirn === 0) {
      property = Properties.SIDE_E;
    } else if (dirn === Math.floor(numDirections / 4)) {
      property = Properties.SIDE_N;
    } else if (dirn === Math.floor(numDirections / 2)) {
      property = Properties.SIDE_W;
    } else if (dirn === Math.floor(3 * numDirections / 4)) {
      property = Properties.SIDE_S;
    } else if (dirn > 0 && dirn < Math.floor(numDirections / 4)) {
      property = Properties.SIDE_NE;
    } else if (dirn > Math.floor(numDirections / 4) && dirn < Math.floor(numDirections / 2)) {
      property = Properties.SIDE_NW;
    } else if (dirn > Math.floor(numDirections / 2) && dirn < Math.floor(3 * numDirections / 4)) {
      property = Properties.SIDE_SW;
    } else {
      property = Properties.SIDE_SE;
    }

    // Store result in run elements
    for (let r = 0; r < runLength + 1; r++) {
      const g = perimeter.elements()[(from + r) % num] as unknown as GraphElement;
      g.properties().set(property);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java MeasureGraph.discreteDirection(double, int)
   */
  public static discreteDirection(angleIn: number, numDirections: number): number {
    const arc = 2 * Math.PI / numDirections;
    const off = arc / 2;

    let angle = angleIn;
    while (angle < 0) angle += 2 * Math.PI;
    while (angle > 2 * Math.PI) angle -= 2 * Math.PI;

    return ((Math.trunc((angle + off) / arc) + numDirections)) % numDirections;
  }

  /**
   * @java MeasureGraph.discreteDirection(Point2D, Point2D, int)
   */
  public static discreteDirectionPts(ptA: Point2D, ptB: Point2D, numDirections: number): number {
    const angle = Math.atan2(ptB.getY() - ptA.getY(), ptB.getX() - ptA.getX());
    return MeasureGraph.discreteDirection(angle, numDirections);
  }

  // -------------------------------------------------------------------------

  /**
   * Determines which graph element(s) are at the centre.
   *
   * @java MeasureGraph.measureCentre(Graph)
   */
  public static measureCentre(graph: Graph): void {
    const bounds = boundsOf(graph.elements("Vertex"));
    const midX = bounds.getX() + bounds.getWidth()  / 2.0;
    const midY = bounds.getY() + bounds.getHeight() / 2.0;
    const mid: Point2D = { getX() { return midX; }, getY() { return midY; } };

    for (const st of SITE_TYPES) {
      MeasureGraph.measureGeometricCentre(graph, mid, st);
    }
  }

  /**
   * Measures total distance squared to perimeter and corner elements.
   *
   * @java MeasureGraph.measureGeometricCentre(Graph, Point2D, SiteType)
   */
  private static measureGeometricCentre(graph: Graph, mid: Point2D, type: SiteType): void {
    const tolerance = 0.0001;
    const list = graph.elements(type);

    const perimeterGE: GraphElement[] = [];

    // If board is large, do not include perimeter, just use the corners
    if (list.length < 100) {
      for (const ge of list) {
        if (ge.properties().getFlag(Properties.PERIMETER)) {
          perimeterGE.push(ge);
        }
      }
    }

    const cornersGE: GraphElement[] = [];
    for (const ge of list) {
      if (ge.properties().getFlag(Properties.CORNER)) {
        cornersGE.push(ge);
      }
    }

    const distances = new Array<number>(list.length).fill(0);

    for (const geA of list) {
      let acc = 0;
      for (const geB of perimeterGE) {
        acc += distanceSquared(geA.pt2D() as unknown as Point2D, geB.pt2D() as unknown as Point2D);
      }
      for (const geB of cornersGE) {
        acc += distanceSquared(geA.pt2D() as unknown as Point2D, geB.pt2D() as unknown as Point2D);
      }
      distances[geA.id()] = acc;
    }

    let minDistance = 1000000;
    for (let n = 0; n < distances.length; n++) {
      if (distances[n]! < minDistance) minDistance = distances[n]!;
    }

    for (let n = 0; n < distances.length; n++) {
      if (Math.abs(distances[n]! - minDistance) < tolerance) {
        list[n]!.properties().set(Properties.CENTRE);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Determines the phase of each cell.
   *
   * @java MeasureGraph.measurePhase(Graph)
   */
  public static measurePhase(graph: Graph): void;
  /**
   * @java MeasureGraph.measurePhase(Graph, SiteType)
   */
  public static measurePhase(graph: Graph, type: SiteType): void;
  public static measurePhase(graph: Graph, type?: SiteType): void {
    if (type === undefined) {
      for (const st of SITE_TYPES) {
        MeasureGraph.measurePhase(graph, st);
      }
      return;
    }

    const elements = graph.elements(type);
    if (elements.length === 0) return;

    const UNDEFINED = -1;

    while (true) {
      // Find the starting element, if any
      let start: GraphElement | null = null;
      for (const ge of elements) {
        if (ge.properties().phase() === UNDEFINED) {
          start = ge;
          break;
        }
      }
      if (start === null) break;

      // BFS queue
      const queue: GraphElement[] = [];
      const visited = new Set<number>();

      start.properties().set(Properties.PHASE_0);
      queue.push(start);

      while (queue.length > 0) {
        const ge = queue.shift()!;

        if (visited.has(ge.id())) continue;

        // Gather known phases of all nbors
        const nbors = ge.nbors();
        const nborPhases = MeasureGraph.nborPhases(nbors);

        let phase = 0;
        for (phase = 0; phase < 4; phase++) {
          if (!nborPhases.has(phase)) break;
        }

        // Set this element's phase
        if (phase === 0) ge.properties().set(Properties.PHASE_0);
        else if (phase === 1) ge.properties().set(Properties.PHASE_1);
        else if (phase === 2) ge.properties().set(Properties.PHASE_2);
        else if (phase === 3) ge.properties().set(Properties.PHASE_3);
        else if (phase === 4) ge.properties().set(Properties.PHASE_4);
        else if (phase === 5) ge.properties().set(Properties.PHASE_5);

        visited.add(ge.id());

        // Visit each nbor, prioritising more constrained ones
        for (const nbor of nbors) {
          if (visited.has(nbor.id())) continue;

          const nborNbors = nbor.nbors();
          const nborNborPhases = MeasureGraph.nborPhases(nborNbors);
          const numNborNborPhases = nborNborPhases.size;

          if (numNborNborPhases > 1) {
            queue.unshift(nbor); // higher priority
          } else {
            queue.push(nbor);
          }
        }
      }
    }
  }

  /** @java MeasureGraph.nborPhases(List<GraphElement>) */
  static nborPhases(nbors: GraphElement[]): Set<number> {
    const phases = new Set<number>();

    for (const nbor of nbors) {
      if (nbor.properties().getFlag(Properties.PHASE_0)) phases.add(0);
      else if (nbor.properties().getFlag(Properties.PHASE_1)) phases.add(1);
      else if (nbor.properties().getFlag(Properties.PHASE_2)) phases.add(2);
      else if (nbor.properties().getFlag(Properties.PHASE_3)) phases.add(3);
      else if (nbor.properties().getFlag(Properties.PHASE_4)) phases.add(4);
      else if (nbor.properties().getFlag(Properties.PHASE_5)) phases.add(5);
    }

    return phases;
  }

  // -------------------------------------------------------------------------

  /**
   * Determines the orientation of each edge.
   *
   * @java MeasureGraph.measureEdgeOrientation(Graph)
   */
  public static measureEdgeOrientation(graph: Graph): void {
    const numDirections = 16;

    for (const edge of graph.edges()) {
      const va = edge.vertexA();
      const vb = edge.vertexB();

      const vaPt: Point2D = { getX() { return va.pt().x(); }, getY() { return va.pt().y(); } };
      const vbPt: Point2D = { getX() { return vb.pt().x(); }, getY() { return vb.pt().y(); } };

      const direction = MeasureGraph.discreteDirectionPts(vaPt, vbPt, numDirections);

      if (direction === 0 || direction === Math.floor(numDirections / 2)) {
        edge.properties().set(Properties.AXIAL);
        edge.properties().set(Properties.HORIZONTAL);
      } else if (direction === Math.floor(numDirections / 4) || direction === Math.floor(3 * numDirections / 4)) {
        edge.properties().set(Properties.AXIAL);
        edge.properties().set(Properties.VERTICAL);
      } else if (
        (direction > 0 && direction < Math.floor(numDirections / 4)) ||
        (direction > Math.floor(numDirections / 2) && direction < Math.floor(3 * numDirections / 4))
      ) {
        edge.properties().set(Properties.ANGLED);
        edge.properties().set(Properties.SLASH);
      } else {
        edge.properties().set(Properties.ANGLED);
        edge.properties().set(Properties.SLOSH);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Determines the coordinate label and row/column/level of each graph element.
   *
   * @java MeasureGraph.measureSituation(Graph)
   */
  public static measureSituation(graph: Graph): void {
    const bestVertexThetas = [0, 0.5];

    const siteTypeValues: SiteType[] = ["Vertex", "Edge", "Cell"];

    for (const siteType of siteTypeValues) {
      const elements = graph.elements(siteType);
      if (elements.length === 0) continue;

      const bounds = boundsOf(elements);
      const unit = (bounds.getWidth() + bounds.getHeight()) / 2 / Math.sqrt(elements.length);

      if (siteType === "Edge") {
        MeasureGraph.clusterByRowAndColumn(elements, unit, bestVertexThetas, true);
      } else {
        MeasureGraph.clusterByRowAndColumn(elements, unit, bestVertexThetas, false);
      }
      MeasureGraph.clusterByDimension(elements, "Layer", unit, 0);

      MeasureGraph.setCoordinateLabels(graph, siteType, elements);
    }
  }

  /**
   * @java MeasureGraph.clusterByRowAndColumn(List, double, double[], boolean)
   */
  public static clusterByRowAndColumn(
    elements: GraphElement[],
    unit: number,
    bestThetas: number[],
    useBestThetas: boolean,
  ): void {
    if (useBestThetas) {
      MeasureGraph.clusterByDimension(elements, "Row",    unit, bestThetas[0]!);
      MeasureGraph.clusterByDimension(elements, "Column", unit, bestThetas[1]!);
      return;
    }

    // Find best row angle
    let bestError = 1000;
    bestThetas[0] = 0;

    for (let angle = 0; angle <= 60; angle += 15) {
      const theta = angle / 180.0 * Math.PI;
      const error = MeasureGraph.clusterByDimension(elements, "Row", unit, theta);

      if (error < bestError) {
        bestError = error;
        bestThetas[0] = theta;
        if (error < 0.01) break;
      }
    }
    MeasureGraph.clusterByDimension(elements, "Row", unit, bestThetas[0]!);

    // Find best column angle, based on best row angle
    bestError = 1000;
    bestThetas[1] = 0;

    for (let angle = 90; angle <= 120; angle += 15) {
      const theta = bestThetas[0]! + angle / 180.0 * Math.PI;
      const error = MeasureGraph.clusterByDimension(elements, "Column", unit, theta);

      if (error < bestError) {
        bestError = error;
        bestThetas[1] = theta;
        if (error < 0.01) break;
      }
    }
    MeasureGraph.clusterByDimension(elements, "Column", unit, bestThetas[1]!);
  }

  /**
   * @java MeasureGraph.clusterByDimension(List, RCLType, double, double)
   */
  public static clusterByDimension(
    elements: GraphElement[],
    rclType: RCLType,
    unit: number,
    theta: number,
  ): number {
    const bounds = boundsOf(elements);

    // Prepare base line to measure from
    let refAx = 0, refAy = 0, refBx = 0, refBy = 0;

    if (rclType === "Row") {
      refAx = bounds.getX() + bounds.getWidth() / 2;
      refAy = bounds.getY() - bounds.getHeight();
      refBx = refAx + bounds.getWidth() * Math.cos(theta);
      refBy = refAy + bounds.getWidth() * Math.sin(theta);
    } else if (rclType === "Column") {
      refAx = bounds.getX() - bounds.getWidth();
      refAy = bounds.getY() + bounds.getHeight() / 2;
      refBx = refAx + bounds.getWidth() * Math.cos(theta);
      refBy = refAy + bounds.getWidth() * Math.sin(theta);
    }

    const refA: Point2D = { getX() { return refAx; }, getY() { return refAy; } };
    const refB: Point2D = { getX() { return refBx; }, getY() { return refBy; } };

    // Sort elements by distance from reference line AB
    const rank: ItemScore[] = [];
    const margin = 0.6 * unit;

    for (let n = 0; n < elements.length; n++) {
      const dist = (rclType === "Layer")
        ? elements[n]!.pt().z()
        : distanceToLine(elements[n]!.pt2D() as unknown as Point2D, refA, refB);
      rank.push(new ItemScore(n, dist));
    }
    rank.sort((a, b) => a.score - b.score);

    // Cluster
    const buckets: Bucket[] = [];
    let bucket: Bucket | null = null;

    for (const item of rank) {
      if (bucket === null || Math.abs(item.score - bucket.mean()) > margin) {
        bucket = new Bucket();
        buckets.push(bucket);
      }
      bucket.addItem(item);
    }

    // Assign elements to buckets
    for (let bid = 0; bid < buckets.length; bid++) {
      for (const item of buckets[bid]!.items()) {
        const rcl = elements[item.id]!.situation().rcl();
        switch (rclType) {
          case "Row":    rcl.setRow(bid);    break;
          case "Column": rcl.setColumn(bid); break;
          case "Layer":  rcl.setLayer(bid);  break;
        }
      }
    }

    // Determine error
    let error = 0;
    for (const bkt of buckets) {
      let acc = 0;
      for (const item of bkt.items()) {
        acc = (bkt.mean() - item.score) * (bkt.mean() - item.score);
      }
      error += acc / bkt.items().length;
    }
    error += 0.01 * buckets.length;

    return error;
  }

  /**
   * @java MeasureGraph.setCoordinateLabels(Graph, SiteType, List)
   */
  public static setCoordinateLabels(
    graph: Graph,
    siteType: SiteType,
    elements: GraphElement[],
  ): void {
    // Check if distinct layers
    let distinctLayers = false;
    for (let eid = 0; eid < elements.length - 1; eid++) {
      if (
        elements[eid]!.situation().rcl().layer() !==
        elements[eid + 1]!.situation().rcl().layer()
      ) {
        distinctLayers = true;
        break;
      }
    }

    // Create coordinates, checking for duplicates within this site type
    const map = new Map<string, GraphElement>();

    for (const element of elements) {
      // Column label
      let column = element.situation().rcl().column();
      let label = String.fromCharCode("A".charCodeAt(0) + (column % 26));

      while (column >= 26) {
        column = Math.trunc(column / 26);
        label = String.fromCharCode("A".charCodeAt(0) + (column % 26) - 1) + label;
      }

      // Row label
      label += (element.situation().rcl().row() + 1).toString();

      // Layer label
      if (distinctLayers) {
        label += "/" + element.situation().rcl().layer();
      }

      if (map.get(label) !== undefined) {
        graph.setDuplicateCoordinates(siteType);
      } else {
        map.set(label, element);
      }

      element.situation().setLabel(label);
    }
  }

  // -------------------------------------------------------------------------
}
