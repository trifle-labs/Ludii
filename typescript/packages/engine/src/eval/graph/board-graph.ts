/**
 * Compile a board-shape ludeme (`(board <shape> use:…)`) into a planar
 * {@link Graph} plus the play-site kind (Cell / Vertex). Returns `undefined`
 * for shapes not yet modelled, so the caller can fall back to the legacy
 * lattice path or report an honest "unsupported tiling".
 *
 * Handles the board-algebra generators and operators (square / rectangle /
 * circle / concentric / merge / add / remove / dual / rotate / scale / shift /
 * skew / intersect / explicit graph) plus best-effort pass-through for
 * geometry-preserving wrappers (clip / trim / keep / subdivide / …).
 */

import {
  isIdent,
  isList,
  isNumber,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";
import {
  genCircle,
  genConcentricCounts,
  genConcentricPolygon,
  genRectangle,
  genSquare,
  genSquarePyramidal,
} from "./generators.js";
import { Graph } from "./graph.js";
import {
  buildNamedTiling,
  genBrick,
  genHex,
  genQuadhex,
  genRegular,
  genSpiral,
  genTri,
  genTriCustom,
  genWedge,
} from "./named-tilings.js";
import {
  add,
  dual,
  intersect,
  merge,
  remove,
  reorderByPosition,
  rotate,
  scale,
  shift,
  skew,
  splitCrossings,
} from "./operators.js";
import { type SiteKind, Trajectories } from "./trajectories.js";

const num = (n: LudNode | undefined, dflt = Number.NaN): number =>
  n && isNumber(n) ? n.value : dflt;

/** Split items after the head into positional nodes + `key:` → value map. */
function args(items: readonly LudNode[]): {
  pos: LudNode[];
  named: Map<string, LudNode>;
} {
  const pos: LudNode[] = [];
  const named = new Map<string, LudNode>();
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (!it) continue;
    if (isIdent(it) && it.name.endsWith(":")) {
      const v = items[i + 1];
      if (v) {
        named.set(it.name.slice(0, -1), v);
        i += 1;
      }
      continue;
    }
    pos.push(it);
  }
  return { pos, named };
}

const isTrue = (n: LudNode | undefined): boolean =>
  !!n && isIdent(n) && n.name === "True";

/**
 * Evaluate a node to a number, handling literal numbers and simple integer
 * arithmetic (`+ - * /`) recursively. Resolves option-substituted expressions
 * like `(* 3 5)` that appear inside board-shape argument lists.
 */
function evalNum(node: LudNode | undefined): number | undefined {
  if (!node) return undefined;
  if (isNumber(node)) return node.value;
  if (!isList(node) || node.delimiter !== "round") return undefined;
  const h = node.items[0];
  if (!h || !isIdent(h)) return undefined;
  const args: number[] = [];
  for (let i = 1; i < node.items.length; i += 1) {
    const v = evalNum(node.items[i]);
    if (v === undefined) return undefined;
    args.push(v);
  }
  if (args.length === 0) return undefined;
  switch (h.name) {
    case "+":
      return args.reduce((a, b) => a + b);
    case "-":
      return args.length === 1 ? -args[0]! : args.reduce((a, b) => a - b);
    case "*":
      return args.reduce((a, b) => a * b);
    case "/":
      return args.length === 2 && args[1] !== 0
        ? Math.trunc(args[0]! / args[1]!)
        : undefined;
    case "%":
      return args.length === 2 && args[1] !== 0 ? args[0]! % args[1]! : undefined;
    case "^":
    case "**":
    case "pow":
      return args.length === 2 ? args[0]! ** args[1]! : undefined;
    case "min":
      return Math.min(...args);
    case "max":
      return Math.max(...args);
    case "abs":
      return args.length === 1 ? Math.abs(args[0]!) : undefined;
    default:
      return undefined;
  }
}

/** Numbers inside a `{ … }` curly list; evaluates simple arithmetic expressions. */
function numberList(n: LudNode | undefined): number[] {
  if (!n || !isList(n) || n.delimiter !== "curly") return [];
  const out: number[] = [];
  for (const item of n.items) {
    const v = evalNum(item);
    if (v !== undefined) out.push(v);
  }
  return out;
}

/**
 * Face *indices* inside a `cells:{int…}` / `Cells:{int…}` curly list. Returns
 * `[]` when the list nests sub-lists (the coordinate-face form `{{x y}…}`,
 * which names faces by vertex position rather than index) so only the bare-int
 * index form drives `removeFacesByIndex`.
 */
function faceIndexList(n: LudNode | undefined): number[] {
  if (!n || !isList(n) || n.delimiter !== "curly") return [];
  if (n.items.some((it) => isList(it))) return [];
  return numberList(n);
}

/**
 * Faces named by *vertex index*: `{ {i j k…} {…} }` — each inner curly list of
 * bare ints is one face's boundary ring. Returns `[]` when the inner lists hold
 * coordinate pairs (the `{{x y}…}` form), which {@link faceCoordLists} handles.
 * Used by `(add … cells:{…} / Cells:{…})`.
 */
function faceIndexLists(n: LudNode | undefined): number[][] {
  if (!n || !isList(n) || n.delimiter !== "curly") return [];
  const out: number[][] = [];
  for (const face of n.items) {
    if (!isList(face) || face.delimiter !== "curly") return [];
    if (face.items.some((it) => isList(it))) return []; // coordinate form
    const ids = numberList(face);
    if (ids.length >= 3) out.push(ids);
  }
  return out;
}

/**
 * Faces named by vertex *coordinate*: `{ {{x y}{x y}…} … }` — each inner curly
 * list of coordinate pairs is one face's boundary ring (Java `Add` lowercase
 * `cells` Float[][][] form). The coordinates resolve to existing vertices via
 * `findVertex`.
 */
function faceCoordLists(n: LudNode | undefined): [number, number][][] {
  if (!n || !isList(n) || n.delimiter !== "curly") return [];
  const out: [number, number][][] = [];
  for (const face of n.items) {
    if (!isList(face) || face.delimiter !== "curly") continue;
    const pts = pairList(face);
    if (pts.length >= 3) out.push(pts);
  }
  return out;
}

/**
 * Java `Polygon.contains` — ray-cast (even-odd) point-in-polygon test, ported
 * verbatim so a face centroid is judged inside the hole identically to Java.
 */
function polygonContains(
  poly: readonly [number, number][],
  px: number,
  py: number,
): boolean {
  const num = poly.length;
  let j = num - 1;
  let odd = false;
  for (let i = 0; i < num; i += 1) {
    const [ix, iy] = poly[i] as [number, number];
    const [jx, jy] = poly[j] as [number, number];
    if (((iy < py && jy >= py) || (jy < py && iy >= py)) && (ix <= px || jx <= px)) {
      if (ix + ((py - iy) / (jy - iy)) * (jx - ix) < px) odd = !odd;
    }
    j = i;
  }
  return odd;
}

/**
 * Java `Polygon.inflate` — push every vertex outward along its angle bisector by
 * `amount`, so a hole clip catches face centroids that sit exactly on the
 * polygon boundary. Ported verbatim (vector bisector, Java
 * `MathRoutines.clockwise` turn sign).
 */
function inflatePolygon(
  poly: [number, number][],
  amount: number,
): [number, number][] {
  const size = poly.length;
  const norm = (vx: number, vy: number): [number, number] => {
    const mag = Math.sqrt(vx * vx + vy * vy);
    return mag < 1e-7 ? [vx, vy] : [vx / mag, vy / mag];
  };
  const adjustments: [number, number][] = [];
  for (let n = 0; n < size; n += 1) {
    const [ax, ay] = poly[n] as [number, number];
    const [bx, by] = poly[(n + 1) % size] as [number, number];
    const [cx, cy] = poly[(n + 2) % size] as [number, number];
    // MathRoutines.clockwise(a, b, c): turn sign of a→b→c.
    const turn = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    const clockwise = turn < 1e-7;
    let vIn: [number, number];
    let vOut: [number, number];
    if (clockwise) {
      vIn = norm(bx - ax, by - ay);
      vOut = norm(bx - cx, by - cy);
    } else {
      vIn = norm(ax - bx, ay - by);
      vOut = norm(cx - bx, cy - by);
    }
    adjustments.push([
      ((vIn[0] + vOut[0]) * 0.5) * amount,
      ((vIn[1] + vOut[1]) * 0.5) * amount,
    ]);
  }
  return poly.map((pt, n) => {
    const adj = adjustments[(n - 1 + size) % size] as [number, number];
    return [pt[0] + adj[0], pt[1] + adj[1]] as [number, number];
  });
}

/** Coordinate pairs inside `{ {x y} … }`. */
function pairList(n: LudNode | undefined): [number, number][] {
  if (!n || !isList(n) || n.delimiter !== "curly") return [];
  const out: [number, number][] = [];
  for (const it of n.items) {
    if (isList(it) && it.delimiter === "curly") {
      const xs = it.items.filter(isNumber).map((x) => x.value);
      if (xs.length >= 2) out.push([xs[0] as number, xs[1] as number]);
    }
  }
  return out;
}

/**
 * Parse the lowercase `edges:` argument (Java `Float[][][] edges`). It carries
 * two shapes that the grammar's scalar→array coercion both accept:
 *
 *   • `{ {{ax ay}{bx by}} … }` — each entry is two coordinate pairs naming the
 *     edge's endpoints by *position* (diamond / alternating-diagonal boards).
 *   • `{ {a b} … }` — each entry is two scalars naming the endpoints by *vertex
 *     index* (e.g. the grammar example `(remove (square 4) edges:{ {0 1} … })`
 *     and the hand-drawn hunt boards like Bam Blang Beh Khla). Geometrically a
 *     pair like `{3 8}` cannot be a coordinate on these tiny boards, so Ludii
 *     resolves it as the index pair (0,1)-style edge.
 *
 * We disambiguate per entry by nesting depth and return both lists.
 */
function lowerEdges(n: LudNode | undefined): {
  byCoord: [[number, number], [number, number]][];
  byIndex: [number, number][];
} {
  const byCoord: [[number, number], [number, number]][] = [];
  const byIndex: [number, number][] = [];
  if (!n || !isList(n) || n.delimiter !== "curly") return { byCoord, byIndex };
  for (const edge of n.items) {
    if (!isList(edge) || edge.delimiter !== "curly") continue;
    const nested = edge.items.filter(
      (it): it is LudList => isList(it) && it.delimiter === "curly",
    );
    if (nested.length >= 2) {
      // Double-nested: two coordinate-pair endpoints.
      const pts = pairList(edge);
      if (pts.length >= 2)
        byCoord.push([pts[0] as [number, number], pts[1] as [number, number]]);
    } else {
      // Flat scalar pair: endpoint vertex indices.
      const xs = edge.items.filter(isNumber).map((x) => x.value);
      if (xs.length >= 2) byIndex.push([xs[0] as number, xs[1] as number]);
    }
  }
  return { byCoord, byIndex };
}

/** Recurse into operands: positional list children (flattening curly groups). */
function operandGraphs(pos: readonly LudNode[], vertexMode: boolean): Graph[] {
  const out: Graph[] = [];
  for (const p of pos) {
    if (!isList(p)) continue;
    if (p.delimiter === "curly") {
      for (const inner of p.items) {
        if (isList(inner)) {
          const g = toGraph(inner, vertexMode);
          if (g) out.push(g);
        }
      }
      continue;
    }
    const g = toGraph(p, vertexMode);
    if (g) out.push(g);
  }
  return out;
}

/** First positional list child that compiles to a graph. */
function firstOperand(
  pos: readonly LudNode[],
  vertexMode: boolean,
): Graph | undefined {
  for (const p of pos) {
    if (isList(p)) {
      const g = toGraph(p, vertexMode);
      if (g) return g;
    }
  }
  return undefined;
}

const PASSTHROUGH = new Set([
  "clip",
  "trim",
  "splitcrossings",
  "makefaces",
  "mesh",
  "layers",
  "renumberclockwise",
  "recoordinate",
]);

/**
 * Dispatch a shape/operator node to a Graph, or undefined if unmodelled.
 * `vertexMode` (from the board's `use:` clause) selects the Java
 * `RectangleOnSquare` vertex-grid sizing for square/rectangle bases.
 */
export function toGraph(node: LudNode, vertexMode = false): Graph | undefined {
  if (!isList(node)) return undefined;
  const head = (listHead(node) ?? "").toLowerCase();
  const { pos, named } = args(node.items.slice(1));

  switch (head) {
    case "square": {
      // `(square n pyramidal:True)` use:Vertex — the Shibumi square pyramid.
      // Java forbids combining `pyramidal` with `diagonals`, so this branch is
      // exclusive. Always Vertex-played (the pyramid is a stack of points).
      if (isTrue(named.get("pyramidal"))) {
        return genSquarePyramidal(evalNum(pos[0]) ?? 1);
      }
      // Optional leading shape ident: `(square Square 8)` is equivalent to
      // `(square 8)` — `Square` is the default shape. Skip the ident to find
      // the numeric dimension. @java Square.java:56-80 — `SquareShapeType shape`
      // defaults to Square when null, and Square/Rectangle route through
      // `RectangleOnSquare(dimA, dimB)` with no special treatment.
      const sqOff = pos[0] && isIdent(pos[0]) ? 1 : 0;
      const diag = named.get("diagonals");
      return genSquare(
        evalNum(pos[sqOff]) ?? 1,
        vertexMode,
        diag && isIdent(diag) ? diag.name : undefined,
      );
    }
    case "rectangle":
    case "rect": {
      const diag = named.get("diagonals");
      const h = evalNum(pos[0]) ?? 1;
      return genRectangle(
        h,
        evalNum(pos[1]) ?? h,
        vertexMode,
        diag && isIdent(diag) ? diag.name : undefined,
      );
    }
    case "circle":
      return genCircle(numberList(pos[0]), isTrue(named.get("stagger")));
    case "quadhex":
      return genQuadhex(num(pos[0], 4));
    case "spiral":
      return genSpiral(
        num(named.get("turns"), 4),
        num(named.get("sites"), 80),
        !(named.has("clockwise") && !isTrue(named.get("clockwise"))),
      );
    case "tiling": {
      const tname = pos[0];
      if (!tname || !isIdent(tname)) return undefined;
      return buildNamedTiling(tname.name, num(pos[1], 3), num(pos[2]));
    }
    case "hex":
    case "tri":
    case "brick": {
      // `(tri {s1 s2 s3 …})` / `(hex {s1 s2 …})` — a curly-list of side
      // lengths routes to Java's CustomOnTri/CustomOnHex({sides}) constructor.
      // @java Tri.java:85-103 — `construct(DimFunction[] sides)` calls
      // `new CustomOnTri(sides)` when the first argument is an array.
      if (head === "tri" && pos[0] && isList(pos[0]) && pos[0].delimiter === "curly") {
        const sides = pos[0].items
          .filter(isNumber)
          .map((n) => n.value);
        if (sides.length > 0) return genTriCustom(sides);
      }
      // Optional leading shape ident: (hex Diamond 11) vs (hex 5).
      const shape = pos[0] && isIdent(pos[0]) ? pos[0].name : undefined;
      const off = shape ? 1 : 0;
      const dimA = num(pos[off], 3);
      const dimB = num(pos[off + 1]);
      if (head === "hex") return genHex(shape, dimA, dimB);
      if (head === "tri") return genTri(shape, dimA, dimB, vertexMode);
      return genBrick(shape, dimA, dimB, isTrue(named.get("trim")));
    }
    case "wedge":
      return genWedge(num(pos[0], 3), pos[1] ? num(pos[1]) : undefined);
    case "regular": {
      // (regular [Star] numSides) — a regular polygon ring or star polygon.
      const first = pos[0];
      const isStar = !!first && isIdent(first) && first.name.toLowerCase() === "star";
      const nArg = isStar ? pos[1] : first;
      return genRegular(isStar, num(nArg, 6));
    }
    case "celtic": {
      // (celtic rows [cols]) — Celtic-knot board. Exact geometry needs a
      // perimeter-curve algorithm; approximate as a rows×cols square grid so
      // the file compiles.
      const rows = num(pos[0], 3);
      const cols = pos[1] && isNumber(pos[1]) ? num(pos[1]) : rows;
      return genRectangle(Math.max(1, rows), Math.max(1, cols), vertexMode);
    }
    case "shape": {
      // (shape [Star] N) — a regular polygon perimeter; compound shapes fall
      // back to passing through their first subgraph operand.
      const first = pos[0];
      const isStar = !!first && isIdent(first) && first.name.toLowerCase() === "star";
      const nArg = isStar ? pos[1] : first;
      if (nArg && isNumber(nArg)) return genRegular(isStar, nArg.value);
      return firstOperand(pos, vertexMode);
    }
    case "concentric": {
      const first = pos[0];
      if (first && isIdent(first)) {
        return genConcentricPolygon(
          first.name,
          num(named.get("rings"), 3),
          isTrue(named.get("joinCorners")),
          // @java Concentric: joinMidpoints defaults True (joinCorners False).
          // Must honour the default explicitly — boards that set joinCorners:True
          // (e.g. Twelve Men's Morris "With Diagonal") still need the orthogonal
          // midpoint spokes, which would otherwise be dropped.
          named.has("joinMidpoints") ? isTrue(named.get("joinMidpoints")) : true,
          named.has("steps") ? num(named.get("steps")) : undefined,
        );
      }
      return genConcentricCounts(
        numberList(first),
        vertexMode,
        isTrue(named.get("stagger")),
      );
    }
    case "merge":
    case "union": {
      const gs = operandGraphs(pos, vertexMode);
      // @java game/functions/graph/operators/Merge.eval — Java does NOT reorder
      // the merged graph. Each sub-graph (e.g. square) reorders itself internally,
      // but the merge result preserves the per-sub-graph vertex order: sub-graph 0
      // sites come first (0..N0-1), then sub-graph 1's new sites (N0..N0+N1-1),
      // etc. Applying reorderByPosition here produces globally y*100+x sorted IDs
      // that differ from Java's recorded trial indices for Alquerque+triangle boards
      // (e.g. AlquerqueBoardWithBottomAndTopTriangles, AlquerqueGraphWithFourTriangles)
      // and all other merge boards where sub-graph ordering determines site indices.
      return gs.length > 0 ? merge(gs) : undefined;
    }
    case "intersect": {
      const gs = operandGraphs(pos, vertexMode);
      return gs.length > 0 ? intersect(gs) : undefined;
    }
    case "dual": {
      const g = firstOperand(pos, vertexMode);
      return g ? dual(g) : undefined;
    }
    case "splitcrossings": {
      const g = firstOperand(pos, vertexMode);
      return g ? splitCrossings(g) : undefined;
    }
    case "subdivide": {
      // @java Subdivide.eval → graph.subdivide: split each cell with ≥ min
      // sides into triangles about its centroid (pivot vertex + spokes). For
      // Vertex play the cells are cleared afterward, leaving the vertex set
      // (originals + appended pivots) and spoke edges. `min:` defaults to 1.
      const g = firstOperand(pos, vertexMode);
      if (!g) return undefined;
      g.subdivide(num(named.get("min"), 1), !vertexMode);
      return g;
    }
    case "trim": {
      // @java Trim.eval → graph.trim(): drop dangling-spur edges and the
      // edgeless vertices they leave behind. Common after `(remove … cells:{…})`
      // (Archworm) or a symmetric removal (There and Back), which can leave the
      // outer edges orphaned. Mutates the operand graph in place.
      const g = firstOperand(pos, vertexMode);
      if (!g) return undefined;
      g.trim();
      return g;
    }
    case "rotate": {
      const g = firstOperand(pos, vertexMode);
      return g ? rotate(evalNum(pos[0]) ?? 0, g) : undefined;
    }
    case "renumber": {
      // @java game.functions.graph.operators.Renumber — re-index the graph
      // elements of one SiteType by their geometric position (centroid score
      // y*100+x ascending), via Graph.reorder(siteType). Used after a transform
      // that has moved sites out of index order (e.g. Xiang Hex's
      // `(renumber Cell (rotate 90 (remove …)))`). Only the `Cell` form is
      // modelled here (faces-only reorder); the `Vertex`/`Edge`/no-arg forms are
      // passthrough — the 22 other renumber boards don't depend on the reindex
      // for piece-placement correctness, and rebuilding their order would risk
      // regressions, so we leave them untouched (prior PASSTHROUGH behaviour).
      const g = firstOperand(pos, vertexMode);
      if (!g) return undefined;
      const typeNames = pos.filter((p) => isIdent(p)).map((p) => p.name);
      if (typeNames.length === 0) {
        // Bare `(renumber g)` — Java Renumber.eval (no SiteType) calls
        // `result.reorder()`, which renumbers EVERYTHING (vertices, edges,
        // faces) by position score y*100+x. All 15 corpus uses are
        // `(renumber (rotate …))` (the SymRemover symmetry pattern, e.g.
        // Stargazers): since `rotate` now preserves the pre-rotation numbering
        // (faithful Graph.rotate mutates coords only), this renumber is what
        // performs the geometric re-sort the board relies on.
        g.reorder();
      } else if (typeNames.includes("Cell")) {
        // `(renumber Cell …)` — Java `result.reorder(SiteType.Cell)`: faces
        // only (Xiang Hex). Vertices/edges keep their ids.
        g.reorderFaces();
      }
      // `(renumber Vertex …)` / `(renumber Edge …)` — left unchanged (the lone
      // corpus use of each currently replays correctly as a no-op; a faithful
      // per-type reorder can be added if a trial shows it is needed).
      return g;
    }
    case "scale": {
      const g = firstOperand(pos, vertexMode);
      if (!g) return undefined;
      const sx = evalNum(pos[0]) ?? 1;
      const sy = pos.length >= 3 ? (evalNum(pos[1]) ?? sx) : sx;
      return scale(sx, sy, g);
    }
    case "shift": {
      const g = firstOperand(pos, vertexMode);
      return g
        ? shift(evalNum(pos[0]) ?? 0, evalNum(pos[1]) ?? 0, g)
        : undefined;
    }
    case "skew": {
      const g = firstOperand(pos, vertexMode);
      return g ? skew(evalNum(pos[0]) ?? 0, g) : undefined;
    }
    case "add": {
      const g = firstOperand(pos, vertexMode);
      if (!g) return undefined;
      // `(add … cells:{…} / Cells:{…})` appends faces by vertex index (or by
      // coordinate). Java `Add.eval` does this *in place* via `findOrAddFace`
      // and never rebuilds the face list, so a preceding `(hole …)`'s removals
      // survive. Handle this before the vertex/edge form (which rebuilds faces).
      const cellsNode = named.get("cells") ?? named.get("Cells");
      const facesByIdx = faceIndexLists(cellsNode);
      const facesByCoord = faceCoordLists(cellsNode);
      if (facesByIdx.length > 0 || facesByCoord.length > 0) {
        for (const ring of facesByIdx) g.findOrAddFace(ring);
        for (const ring of facesByCoord) {
          const ids = ring.map(([x, y]) => g.findVertex(x, y));
          if (ids.every((id) => id >= 0)) g.findOrAddFace(ids);
        }
        return g;
      }
      // `edges:` (lowercase) carries coordinate- *or* index-pair endpoints;
      // `Edges:` (capital) is always vertex indices.
      const le = lowerEdges(named.get("edges"));
      return add(g, {
        vertices: pairList(named.get("vertices")),
        edgesByIndex: [...pairList(named.get("Edges")), ...le.byIndex],
        edgesByCoord: le.byCoord,
      });
    }
    case "hole": {
      // @java game.functions.graph.operators.Hole — cut a hole: remove any face
      // whose centroid (pt2D) lies within the clip polygon, after inflating the
      // polygon by 0.1 (so boundary centroids are caught). Vertices/edges are
      // kept (an edge orphaned by the removal borders no surviving face and so
      // can't change Cell adjacency — same convention as `removeFacesByIndex`).
      const g = firstOperand(pos, vertexMode);
      if (!g) return undefined;
      const polyNode = pos.find(
        (p) => isList(p) && (listHead(p) ?? "").toLowerCase() === "poly",
      );
      const pts = polyNode && isList(polyNode) ? pairList(polyNode.items[1]) : [];
      if (pts.length < 3) return g; // Java: "Clip region only has N points."
      const inflated = inflatePolygon([...pts], 0.1);
      const drop: number[] = [];
      g.faces.forEach((f) => {
        if (polygonContains(inflated, f.cx, f.cy)) drop.push(f.id);
      });
      g.removeFacesByIndex(drop);
      return g;
    }
    case "remove": {
      const g = firstOperand(pos, vertexMode);
      if (!g) return undefined;
      // `cells:{int…}` / `Cells:{int…}` — remove board *faces* (Cell sites) by
      // index. Java disambiguates the lowercase `cells` (Float[][][] face
      // coords) from the capital `Cells` (DimFunction[] indices) by type; the
      // hand-written boards (Tic Tactics, MacBeth, …) all use the bare-int form,
      // which can only be the index list. Faces are removed in place and NOT
      // rebuilt, so `(square 11)`'s 121 cells drop to the intended subset and
      // recorded trials land on the right sites.
      const faceIdx = faceIndexList(named.get("cells") ?? named.get("Cells"));
      if (faceIdx.length > 0) {
        g.removeFacesByIndex(faceIdx);
        return g;
      }
      const le = lowerEdges(named.get("edges"));
      return remove(g, {
        vertices: numberList(named.get("vertices")),
        edgesByIndex: [...pairList(named.get("Edges")), ...le.byIndex],
        edgesByCoord: le.byCoord,
      });
    }
    case "graph": {
      const g = new Graph();
      for (const [x, y] of pairList(named.get("vertices"))) g.addVertex(x, y);
      for (const [a, b] of pairList(named.get("edges"))) g.addEdge(a, b);
      g.makeFaces();
      return g.vertices.length > 0 ? g : undefined;
    }
    case "poly": {
      // (poly {{x y}…}) — a (possibly concave) polygon: its vertices plus the
      // closed perimeter edges (point n → point (n+1) mod size). Java
      // game.util.graph.Poly + Repeat.eval's perimeter loop.
      const pts = pairList(pos[0]);
      if (pts.length < 2) return undefined;
      const g = new Graph();
      const ids = pts.map(([x, y]) => g.addVertex(x, y));
      for (let i = 0; i < ids.length; i++) {
        g.addEdge(ids[i] as number, ids[(i + 1) % ids.length] as number);
      }
      g.makeFaces();
      return g;
    }
    case "repeat": {
      // (repeat rows cols step:{{cx cy}{rx ry}} <poly>|{<poly>…}) — tile the
      // polygon operand(s) across a rows×cols lattice, offsetting copy (row,col)
      // by col·stepColumn + row·stepRow. Java
      // game.functions.graph.generators.shape.Repeat.eval. Coincident corners of
      // adjacent tiles fuse via the merge/addVertex tolerance dedup.
      const rows = num(pos[0], 1);
      const cols = num(pos[1], 1);
      const step = pairList(named.get("step"));
      const stepCol = step[0] ?? [1, 0];
      const stepRow = step[1] ?? [0, 1];
      const operands = operandGraphs(pos.slice(2), vertexMode);
      if (operands.length === 0) return firstOperand(pos.slice(2), vertexMode);
      const copies: Graph[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const dx = col * stepCol[0] + row * stepRow[0];
          const dy = col * stepCol[1] + row * stepRow[1];
          for (const g of operands) copies.push(shift(dx, dy, g));
        }
      }
      // Repeat.eval fuses tile corners (findOrAddVertex) then reorders the
      // resulting graph by position before returning, so its vertex indices
      // follow Java's y·100+x order.
      return copies.length > 0 ? reorderByPosition(merge(copies)) : undefined;
    }
    case "keep": {
      // @java game.functions.graph.operators.Keep — clip the source graph to a
      // polygon REGION by VERTEX containment (NOT faces, unlike `hole`/`remove
      // cells:`). Java: inflate the poly by 0.1, drop every vertex whose pt2D
      // lies outside it, keep only edges whose BOTH endpoints survive, then
      // renumber the survivors 0..N-1 in source-iteration order (Keep.java:80-
      // 113). Java returns a vertex+edge graph (ShapeType.NoShape) and lets the
      // topology recompute faces afterwards; we makeFaces()+reorder() here so
      // the rebuilt Cell ids follow the same canonical (y*100+x) numbering that
      // buildTiling/RectangleOnSquare produce — required for `use:Cell` boards
      // (Go with the Floe, Camelot) where the recorded moves index cells. For
      // `use:Vertex` boards (Peg Solitaire "European") the surviving vertices
      // are the sites; makeFaces is harmless there. Was a no-op PASSTHROUGH,
      // which left clipped boards at full size with raw square numbering.
      const src = firstOperand(pos, vertexMode);
      if (!src) return undefined;
      const polyNode = pos.find(
        (p) => isList(p) && (listHead(p) ?? "").toLowerCase() === "poly",
      );
      const pts =
        polyNode && isList(polyNode) ? pairList(polyNode.items[1]) : [];
      if (pts.length < 3) return src; // Java: "Keep region only has N points."
      const inflated = inflatePolygon([...pts], 0.1);
      const g = new Graph();
      const idMap = new Map<number, number>();
      for (const v of src.vertices) {
        if (polygonContains(inflated, v.x, v.y)) {
          idMap.set(v.id, g.addVertex(v.x, v.y));
        }
      }
      for (const e of src.edges) {
        const a = idMap.get(e.a);
        const b = idMap.get(e.b);
        if (a !== undefined && b !== undefined) g.addEdge(a, b);
      }
      g.makeFaces();
      g.reorder();
      return g;
    }
    case "complete": {
      // @java Complete.java:83-91 — `(complete graph)` creates an edge between
      // every pair of vertices (graph.clear(Edge), then findOrAddEdge for all
      // (va,vb) pairs, then makeFaces). Used by Oriath et al. on edge-play boards.
      // @java Core/src/game/functions/graph/operators/Complete.java:83-96
      const src = firstOperand(pos, vertexMode);
      if (!src) return undefined;
      const g = new Graph();
      // Copy vertices only (no edges), then add all-pairs edges.
      for (const v of src.vertices) g.addVertex(v.x, v.y);
      const n = g.vertices.length;
      for (let va = 0; va < n; va += 1)
        for (let vb = va + 1; vb < n; vb += 1)
          g.addEdge(va, vb);
      g.makeFaces();
      return g;
    }
    default:
      if (PASSTHROUGH.has(head)) return firstOperand(pos, vertexMode);
      return undefined;
  }
}

export interface GraphBoardSpec {
  readonly traj: Trajectories;
  readonly width: number;
  readonly height: number;
  readonly numSites: number;
  /**
   * Number of board *faces* (Cell sites). Java indexes each SiteType
   * independently and seeds non-board containers (hands/stores) after
   * `maxSiteMainBoard = max(numFaces, numPlaySites)` (Equipment.initContainer).
   * On a Vertex-play board this exceeds {@link numSites}, so a hand site's
   * index is its Cell-space index — what recorded trials reference.
   */
  readonly numFaces: number;
  /**
   * Compass board sides for the active play type — Java
   * `Topology.sides(SiteType)`. Direction name (`N`/`NE`/…) → play-site ids on
   * that side. Drives `(sites Side <compass>)` faithfully on slanted boards
   * (rhombus Hex, triangle, …) where the four sides are diagonal perimeter
   * edges, not bounding-box rows/columns.
   */
  readonly sideRegions?: Partial<Record<string, readonly number[]>>;
}

/** Build a graph-backed board spec from a `(board <shape> use:…)` node. */
export function buildBoardGraph(board: LudList): GraphBoardSpec | undefined {
  const { pos, named } = args(board.items.slice(1));
  const shape = pos[0];
  if (!shape || !isList(shape)) return undefined;

  const useNode = named.get("use");
  // `use:Edge` plays on the graph's EDGES (Java SiteType.Edge): the play-sites
  // are the segments between vertices, not the vertices. For a linear track
  // board like `(rectangle 1 20)` that means 19 edge sites (the 19 segments of
  // a 20-vertex line), not 20 vertices — the off-by-one that shifted every hand
  // container up by one and desynced the Maya stick-dice family / Puluc / etc.
  // from ply 2 (`(forEach Piece container:(mover))` resolved to the next
  // player's hand). The underlying vertex grid is sized exactly as for Vertex
  // play; only the played element type differs.
  const useStr = useNode && isIdent(useNode) ? useNode.name : "";
  const kind: SiteKind =
    useStr === "Edge"
      ? "Edge"
      : useStr === "Vertex"
        ? "Vertex"
        : "Cell";

  let graph: Graph | undefined;
  try {
    // Java RectangleOnSquare sizes its vertex grid from the `use:` site type
    // (n×n vertices for Vertex play, (n+1)² for Cell play). Edge play sits on
    // the same vertex grid as Vertex play, so build it the same way.
    graph = toGraph(shape, kind === "Vertex" || kind === "Edge");
  } catch {
    return undefined;
  }
  if (!graph) return undefined;
  let traj = new Trajectories(graph, kind);
  // Lenient fallback: a graph with no faces (spiral, dual of a sparse graph,
  // explicit `(graph …)` with edge play, …) yields zero Cell sites — retry as
  // Vertex play so the board still compiles. An edge-play graph with no edges
  // is likewise degenerate; fall back to Vertex so it still compiles.
  if (traj.numSites === 0 && (kind === "Cell" || kind === "Edge")) {
    traj = new Trajectories(graph, "Vertex");
  }
  if (traj.numSites === 0) return undefined;

  // Bounding box → integer dims for the legacy region helpers / FlatTopology.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let s = 0; s < traj.numSites; s += 1) {
    minX = Math.min(minX, traj.xOf(s));
    maxX = Math.max(maxX, traj.xOf(s));
    minY = Math.min(minY, traj.yOf(s));
    maxY = Math.max(maxY, traj.yOf(s));
  }
  const width = Math.max(1, Math.ceil(maxX - minX) + 1);
  const height = Math.max(1, Math.ceil(maxY - minY) + 1);
  return {
    traj,
    width,
    height,
    numSites: traj.numSites,
    numFaces: graph.faces.length,
    sideRegions: sideRegionsOf(graph, kind),
  };
}

/**
 * Compass side regions for the active play type, as a plain record indexed by
 * direction name. Returns `undefined` when no side is found (degenerate boards),
 * so `(sites Side)` cleanly falls back to the bounding-box heuristic.
 */
export function sideRegionsOf(
  graph: Graph,
  kind: SiteKind,
): Partial<Record<string, readonly number[]>> | undefined {
  const sides = graph.measureSides();
  const map = kind === "Vertex" ? sides.vertex : sides.cell;
  if (map.size === 0) return undefined;
  const out: Record<string, readonly number[]> = {};
  for (const [dir, ids] of map) out[dir] = ids;
  return out;
}

/** A mancala store board, plus the board-site ids of its two store cells. */
export interface MancalaGraphSpec extends GraphBoardSpec {
  /** The faithful Mancala graph built from `MancalaBoard.makeMancala*Rows`. */
  readonly graph: Graph;

  /**
   * Board-site ids of the two store vertices, [left, right]. With the faithful
   * Union ordering these are 0 and 2N+1 (Java cells 0 and `2·cols·rows+1`),
   * which is what `(map {(pair P1 FirstSite) (pair P2 LastSite)})` resolves to.
   */
  readonly storeSites: readonly number[];
}

/**
 * Per-row-count store vertex coordinates, transcribed from
 * `MancalaBoard.makeMancala{Two..Six}Rows`. The right store's x is given
 * relative to `cols` (Java places it near the last column then `Shift`s it).
 * The exact positions matter: `Union(connect:true)` only adds an edge between
 * vertices within `1.1×avgEdgeLength`, and the Trajectories compass
 * classification of those store edges decides whether a track step like `E`/`W`
 * spills into a store.
 */
const MANCALA_STORE_COORDS: Readonly<
  Record<number, { leftX: number; y: number; rightDX: number }>
> = {
  2: { leftX: -0.85, y: 0.5, rightDX: -0.15 },
  3: { leftX: -1.0, y: 1.0, rightDX: 0.0 },
  4: { leftX: -0.9, y: 1.5, rightDX: -0.1 },
  5: { leftX: -1.0, y: 2.0, rightDX: 0.0 },
  6: { leftX: -0.9, y: 2.5, rightDX: -0.1 },
};

/**
 * Build the Java MancalaBoard graph for `(mancalaBoard rows cols)` with two
 * Outer/Mixed stores. Faithful port of `MancalaBoard.makeMancala*Rows` followed
 * by `Union(…, connect:true)`:
 *   1. Add vertices in Union order — leftStore, then each row bottom→top as a
 *      left→right run of `cols` vertices, then rightStore.
 *   2. Add the within-row path edges (the `Rectangle(1, cols)` generators).
 *   3. `connect:true`: add an edge between every pair of vertices closer than
 *      `1.1 × averageEdgeLength` (avg = 1.0 over the unit row edges), then
 *      `makeFaces`.
 * Played on `SiteType.Vertex`, so numbering is the vertex order: leftStore = 0,
 * holes = 1..2N, rightStore = 2N+1 — matching the recorded trials.
 *
 * Returns `undefined` outside the 2..6-row range Java special-cases (callers
 * fall back to the lattice / square approximation), and for `store:None`
 * boards, which keep the existing rectangular path (numbering already matches).
 */
export function buildMancalaGraph(
  rows: number,
  cols: number,
  includeStores = true,
): MancalaGraphSpec | undefined {
  const coords = MANCALA_STORE_COORDS[rows];
  if (
    !coords ||
    !Number.isInteger(rows) ||
    !Number.isInteger(cols) ||
    cols < 1
  ) {
    return undefined;
  }
  const graph = new Graph();
  // `store:None` boards omit the store vertices entirely (Java `Union[rows…]`
  // with no leftStore/rightStore), so numbering starts at row site 0. The
  // cross-row proximity edges from connect:true are still essential — they are
  // what makes the N/S track steps resolve, which the old lattice fallback
  // lacked.
  const leftStoreId = includeStores
    ? graph.addVertex(coords.leftX, coords.y)
    : -1;
  // Rows bottom (y = 0) → top (y = rows-1), each a left→right run of `cols`.
  const rowStart: number[] = [];
  for (let r = 0; r < rows; r += 1) {
    rowStart.push(graph.vertices.length);
    for (let x = 0; x < cols; x += 1) graph.addVertex(x, r);
  }
  const rightStoreId = includeStores
    ? graph.addVertex(cols + coords.rightDX, coords.y)
    : -1;
  // Within-row path edges (the Rectangle generators); all length 1, so the
  // average edge length used by connect:true is 1.0.
  for (let r = 0; r < rows; r += 1) {
    const s = rowStart[r] as number;
    for (let x = 0; x + 1 < cols; x += 1) graph.addEdge(s + x, s + x + 1);
  }
  const threshold = 1.1 * graph.averageEdgeLength();
  const vs = graph.vertices;
  for (let i = 0; i < vs.length; i += 1) {
    for (let j = i + 1; j < vs.length; j += 1) {
      const a = vs[i] as { id: number; x: number; y: number };
      const b = vs[j] as { id: number; x: number; y: number };
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) graph.addEdge(a.id, b.id);
    }
  }
  graph.makeFaces();
  const traj = new Trajectories(graph, "Vertex");
  if (traj.numSites === 0) return undefined;
  return {
    graph,
    traj,
    width: cols,
    height: rows,
    numSites: traj.numSites,
    numFaces: graph.faces.length,
    storeSites: includeStores ? [leftStoreId, rightStoreId] : [],
  };
}
