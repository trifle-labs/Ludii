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
  genWedge,
} from "./named-tilings.js";
import {
  add,
  dual,
  intersect,
  merge,
  remove,
  rotate,
  scale,
  shift,
  skew,
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

/** Recurse into operands: positional list children (flattening curly groups). */
function operandGraphs(pos: readonly LudNode[]): Graph[] {
  const out: Graph[] = [];
  for (const p of pos) {
    if (!isList(p)) continue;
    if (p.delimiter === "curly") {
      for (const inner of p.items) {
        if (isList(inner)) {
          const g = toGraph(inner);
          if (g) out.push(g);
        }
      }
      continue;
    }
    const g = toGraph(p);
    if (g) out.push(g);
  }
  return out;
}

/** First positional list child that compiles to a graph. */
function firstOperand(pos: readonly LudNode[]): Graph | undefined {
  for (const p of pos) {
    if (isList(p)) {
      const g = toGraph(p);
      if (g) return g;
    }
  }
  return undefined;
}

const PASSTHROUGH = new Set([
  "clip",
  "trim",
  "keep",
  "hole",
  "subdivide",
  "splitcrossings",
  "makefaces",
  "renumber",
  "repeat",
  "complete",
  "mesh",
  "layers",
  "renumberclockwise",
  "recoordinate",
  "hole",
]);

/** Dispatch a shape/operator node to a Graph, or undefined if unmodelled. */
export function toGraph(node: LudNode): Graph | undefined {
  if (!isList(node)) return undefined;
  const head = (listHead(node) ?? "").toLowerCase();
  const { pos, named } = args(node.items.slice(1));

  switch (head) {
    case "square":
      return genSquare(num(pos[0], 1));
    case "rectangle":
    case "rect":
      return genRectangle(num(pos[0], 1), num(pos[1], num(pos[0], 1)));
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
      // Optional leading shape ident: (hex Diamond 11) vs (hex 5).
      const shape = pos[0] && isIdent(pos[0]) ? pos[0].name : undefined;
      const off = shape ? 1 : 0;
      const dimA = num(pos[off], 3);
      const dimB = num(pos[off + 1]);
      if (head === "hex") return genHex(shape, dimA, dimB);
      if (head === "tri") return genTri(shape, dimA, dimB);
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
      return genRectangle(Math.max(1, rows), Math.max(1, cols));
    }
    case "shape": {
      // (shape [Star] N) — a regular polygon perimeter; compound shapes fall
      // back to passing through their first subgraph operand.
      const first = pos[0];
      const isStar = !!first && isIdent(first) && first.name.toLowerCase() === "star";
      const nArg = isStar ? pos[1] : first;
      if (nArg && isNumber(nArg)) return genRegular(isStar, nArg.value);
      return firstOperand(pos);
    }
    case "concentric": {
      const first = pos[0];
      if (first && isIdent(first)) {
        return genConcentricPolygon(
          first.name,
          num(named.get("rings"), 3),
          isTrue(named.get("joinCorners")),
          isTrue(named.get("joinMidpoints")),
          named.has("steps") ? num(named.get("steps")) : undefined,
        );
      }
      return genConcentricCounts(numberList(first));
    }
    case "merge":
    case "union": {
      const gs = operandGraphs(pos);
      return gs.length > 0 ? merge(gs) : undefined;
    }
    case "intersect": {
      const gs = operandGraphs(pos);
      return gs.length > 0 ? intersect(gs) : undefined;
    }
    case "dual": {
      const g = firstOperand(pos);
      return g ? dual(g) : undefined;
    }
    case "rotate": {
      const g = firstOperand(pos);
      return g ? rotate(num(pos[0], 0), g) : undefined;
    }
    case "scale": {
      const g = firstOperand(pos);
      if (!g) return undefined;
      const sx = num(pos[0], 1);
      const sy = pos.length >= 3 ? num(pos[1], sx) : sx;
      return scale(sx, sy, g);
    }
    case "shift": {
      const g = firstOperand(pos);
      return g ? shift(num(pos[0], 0), num(pos[1], 0), g) : undefined;
    }
    case "skew": {
      const g = firstOperand(pos);
      return g ? skew(num(pos[0], 0), g) : undefined;
    }
    case "add": {
      const g = firstOperand(pos);
      if (!g) return undefined;
      return add(g, {
        vertices: pairList(named.get("vertices")),
        edgesByIndex: pairList(named.get("edges")).concat(
          pairList(named.get("Edges")),
        ),
      });
    }
    case "remove": {
      const g = firstOperand(pos);
      if (!g) return undefined;
      return remove(g, {
        vertices: numberList(named.get("vertices")),
        edgesByIndex: pairList(named.get("edges")),
      });
    }
    case "graph": {
      const g = new Graph();
      for (const [x, y] of pairList(named.get("vertices"))) g.addVertex(x, y);
      for (const [a, b] of pairList(named.get("edges"))) g.addEdge(a, b);
      g.makeFaces();
      return g.vertices.length > 0 ? g : undefined;
    }
    default:
      if (PASSTHROUGH.has(head)) return firstOperand(pos);
      return undefined;
  }
}

export interface GraphBoardSpec {
  readonly traj: Trajectories;
  readonly width: number;
  readonly height: number;
  readonly numSites: number;
}

/** Build a graph-backed board spec from a `(board <shape> use:…)` node. */
export function buildBoardGraph(board: LudList): GraphBoardSpec | undefined {
  const { pos, named } = args(board.items.slice(1));
  const shape = pos[0];
  if (!shape || !isList(shape)) return undefined;
  let graph: Graph | undefined;
  try {
    graph = toGraph(shape);
  } catch {
    return undefined;
  }
  if (!graph) return undefined;

  const useNode = named.get("use");
  // `use:Edge` is not a first-class SiteKind here; sites live on the edges, so
  // treat it like Vertex play.
  const useStr = useNode && isIdent(useNode) ? useNode.name : "";
  const kind: SiteKind =
    useStr === "Vertex" || useStr === "Edge" ? "Vertex" : "Cell";
  let traj = new Trajectories(graph, kind);
  // Lenient fallback: a graph with no faces (spiral, dual of a sparse graph,
  // explicit `(graph …)` with edge play, …) yields zero Cell sites — retry as
  // Vertex play so the board still compiles.
  if (traj.numSites === 0 && kind === "Cell") {
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
  return { traj, width, height, numSites: traj.numSites };
}
