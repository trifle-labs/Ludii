/**
 * LudemeGame — a `Game` that plays a `.lud` definition by *interpreting*
 * its ludeme tree, rather than pattern-matching it onto a hand-rolled
 * template (FlatBoardGame etc.).
 *
 * Java parity:
 * - Core/src/game/Game.java — the real engine instantiates a tree of
 *   ludeme objects and calls `start`/`moves`/`apply`/`over`. This is the
 *   TS analogue: the `(play …)` clause compiles to a move generator and
 *   the `(end …)` clause to a set of ending rules, both evaluated against
 *   the live state via `EvalContext`.
 *
 * The constructor takes a *define-expanded, option-applied* `(game …)`
 * AST node — i.e. the output of `parseLud → applyOptions → expandDefines`.
 */

import {
  isIdent,
  isList,
  isNumber,
  isString,
  type LudList,
  type LudNode,
  listHead,
  parseLud,
} from "@ludii/typescript-language";
import { getBuiltinDefines } from "../builtin-defines.js";
import { Context } from "../context.js";
import type { Game } from "../game.js";
import { expandDefines } from "../lud-defines.js";
import { applyOptions } from "../lud-options.js";
import type { Move } from "../move.js";
import { State } from "../state.js";
import { Trial } from "../trial.js";
import {
  type CompileEnv,
  type DiceDef,
  compileBool,
  compileEnd,
  compileMoves,
  compileRegion,
} from "./compile.js";
import {
  type BoolFn,
  type EndRule,
  EvalContext,
  InterpBoard,
  type MancalaTrack,
  type MovesFn,
  type RegionFn,
} from "./eval-context.js";
import { buildBoardGraph } from "./graph/board-graph.js";
import type { Trajectories } from "./graph/trajectories.js";
import {
  type Tiling,
  SQUARE_TILING,
  HEX_TILING,
  TRI_TILING,
  hexagonMask,
  rhombusMask,
  triangleMask,
  triHexagonMask,
  triRectangleMask,
} from "./tilings.js";

function child(node: LudList, head: string): LudList | undefined {
  for (const item of node.items) {
    if (isList(item) && listHead(item) === head) return item;
  }
  return undefined;
}

/**
 * Locate the `(play …)` clause for a game's rules. Most games carry it as a
 * direct child of `(rules …)`; phase-structured games instead nest it inside
 * `phases:{ (phase "Name" (play …) …) … }`. We use the first phase's play —
 * games always start in phase 0, and per-phase switching (driven by
 * `(nextPhase …)`) is a separate follow-on to the initial-move generation.
 */
function findPlayClause(rules: LudList): LudList | undefined {
  const direct = child(rules, "play");
  if (direct) return direct;
  const phasesBlock = findPhasesBlock(rules);
  if (!phasesBlock) return undefined;
  for (const item of phasesBlock.items) {
    if (isList(item) && listHead(item) === "phase") {
      const play = child(item, "play");
      if (play) return play;
    }
  }
  return undefined;
}

/** A `(nextPhase [<who>] [<cond>] "Target")` transition compiled for runtime. */
interface NextPhaseRule {
  /** Condition gating the switch; undefined = always taken. */
  readonly cond?: BoolFn;
  /** Index into the phase list of the destination phase. */
  readonly target: number;
  /** Whose phase advances: "Mover" (default) or "Next". */
  readonly who: "Mover" | "Next";
}

/** One `(phase "Name" (play …) (nextPhase …)*)` compiled for runtime. */
interface CompiledPhase {
  readonly name: string;
  readonly play: MovesFn;
  readonly nextPhases: readonly NextPhaseRule[];
}

/**
 * Compile every `(phase …)` in a phase-structured game into a runtime list,
 * resolving each `(nextPhase … "Target")` to the destination phase's index.
 * A game with a direct `(play …)` (no phases) yields a single nameless phase
 * with no transitions — the common, switch-free fast path.
 */
function parsePhases(rules: LudList, env: CompileEnv): CompiledPhase[] {
  const direct = child(rules, "play");
  if (direct?.items[1]) {
    return [
      { name: "", play: compileMoves(direct.items[1], env), nextPhases: [] },
    ];
  }
  const phasesBlock = findPhasesBlock(rules);
  if (!phasesBlock) {
    throw new Error("LudemeGame: rules has no (play …).");
  }
  const phaseNodes = phasesBlock.items.filter(
    (n): n is LudList => isList(n) && listHead(n) === "phase",
  );
  // Phase name → index, so `(nextPhase … "Name")` can be resolved.
  const indexByName = new Map<string, number>();
  phaseNodes.forEach((node, i) => {
    const nameNode = node.items[1];
    if (nameNode && isString(nameNode)) indexByName.set(nameNode.value, i);
  });
  const phases: CompiledPhase[] = [];
  for (const node of phaseNodes) {
    const nameNode = node.items[1];
    const name = nameNode && isString(nameNode) ? nameNode.value : "";
    const playNode = child(node, "play");
    if (!playNode?.items[1]) {
      // A phase with no (play …) generates nothing; keep it as a placeholder
      // so indices line up, but it will yield no moves.
      phases.push({ name, play: { generate: () => [] }, nextPhases: [] });
      continue;
    }
    const play = compileMoves(playNode.items[1], env);
    const nextPhases: NextPhaseRule[] = [];
    for (const item of node.items) {
      if (!isList(item) || listHead(item) !== "nextPhase") continue;
      const after = item.items.slice(1);
      // The destination is the trailing string; an optional leading role ident
      // (Mover/Next) and an optional boolean (a list) may precede it.
      const targetNode = [...after].reverse().find((n) => isString(n));
      const targetName =
        targetNode && isString(targetNode) ? targetNode.value : undefined;
      const target =
        targetName !== undefined ? indexByName.get(targetName) : undefined;
      if (target === undefined) continue;
      const roleNode = after.find((n) => isIdent(n));
      const who =
        roleNode && isIdent(roleNode) && roleNode.name === "Next"
          ? "Next"
          : "Mover";
      const condNode = after.find((n) => isList(n));
      let cond: BoolFn | undefined;
      if (condNode) {
        try {
          cond = compileBool(condNode, env);
        } catch {
          // An unsupported transition condition is treated as never-taken,
          // so the game stays in its current phase rather than failing.
          continue;
        }
      }
      nextPhases.push({ cond, target, who });
    }
    phases.push({ name, play, nextPhases });
  }
  return phases.length > 0
    ? phases
    : [{ name: "", play: { generate: () => [] }, nextPhases: [] }];
}

/** The curly block of phases, from either `(phases {…})` or `phases:{…}`. */
function findPhasesBlock(rules: LudList): LudList | undefined {
  const phasesChild = child(rules, "phases");
  if (phasesChild) {
    const curly = phasesChild.items.find(
      (n): n is LudList => isList(n) && n.delimiter === "curly",
    );
    if (curly) return curly;
  }
  for (let i = 0; i < rules.items.length - 1; i += 1) {
    const cur = rules.items[i];
    const nxt = rules.items[i + 1];
    if (
      cur &&
      isIdent(cur) &&
      cur.name === "phases:" &&
      nxt &&
      isList(nxt) &&
      nxt.delimiter === "curly"
    ) {
      return nxt;
    }
  }
  return undefined;
}

/** Find a child list by head, descending through curly groups. */
function childDeep(node: LudList, head: string): LudList | undefined {
  for (const item of node.items) {
    if (!isList(item)) continue;
    if (listHead(item) === head) return item;
    // Recurse into curly groups (the normal equipment list) and into paren-shell
    // nodes left behind when an option placeholder `(<Tag:arg>)` was the sole
    // child of a parenthesised expression — those have no ident head.
    if (item.delimiter === "curly" || !listHead(item)) {
      const inner = childDeep(item, head);
      if (inner) return inner;
    }
  }
  return undefined;
}

interface ParsedGame {
  readonly name: string;
  readonly numPlayers: number;
  readonly board: InterpBoard;
  readonly componentLabels: readonly string[];
  readonly pieceOwner: ReadonlyMap<string, number>;
  /** Number of hand sites appended to the board in `State.cells`. */
  readonly totalHandSites: number;
  /** Number of mancala store cells appended after the hands. */
  readonly totalStoreSites: number;
  /** Dice declared by `(dice …)` in equipment, if any. */
  readonly diceDef?: DiceDef;
}

interface ParsedHands {
  /** Hand-site count per player (1-based; [0] unused). */
  readonly handSizes: number[];
  /** Global cell index where each player's hand begins (1-based). */
  readonly handStart: number[];
  /** Total hand sites across all players. */
  readonly totalHandSites: number;
}

/**
 * Scan the equipment for `(hand <role> [size:N])` declarations and lay each
 * player's hand out contiguously after the board sites. Java parity:
 * `Equipment.java` appends one container per hand; `(hand Each)` expands to
 * one hand per player. Defaults to one site per hand when no `size:` given.
 */
function parseHands(
  equipment: LudList,
  numPlayers: number,
  boardNumSites: number,
): ParsedHands {
  const handSizes = new Array<number>(numPlayers + 1).fill(0);
  const scan = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      if (listHead(item) === "hand") {
        const roleNode = item.items[1];
        // Optional `size:N` keyword (lexer emits `size:` as its own ident).
        let size = 1;
        for (let i = 2; i < item.items.length; i += 1) {
          const tok = item.items[i];
          if (tok && isIdent(tok) && tok.name === "size:") {
            const v = item.items[i + 1];
            if (v && isNumber(v)) size = v.value;
          }
        }
        if (roleNode && isIdent(roleNode)) {
          const role = roleNode.name;
          if (role === "Each") {
            for (let p = 1; p <= numPlayers; p += 1) handSizes[p] = size;
          } else {
            const m = /^P(\d+)$/.exec(role);
            if (m?.[1]) {
              const p = Number(m[1]);
              if (p >= 1 && p <= numPlayers) handSizes[p] = size;
            }
            // `Shared` and other roles are not modelled yet.
          }
        }
      } else if (item.delimiter === "curly") {
        scan(item);
      }
    }
  };
  scan(equipment);

  const handStart = new Array<number>(numPlayers + 1).fill(0);
  let offset = boardNumSites;
  for (let p = 1; p <= numPlayers; p += 1) {
    handStart[p] = offset;
    offset += handSizes[p] ?? 0;
  }
  return { handSizes, handStart, totalHandSites: offset - boardNumSites };
}

interface ParsedBoard {
  width: number;
  height: number;
  tiling: Tiling;
  onBoard?: readonly boolean[];
  tracks?: readonly MancalaTrack[];
  /** Number of store cells (mancala). 0 for `store:None` and normal boards. */
  numStores?: number;
  /** Graph-algebra board adjacency (merge / dual / concentric / …). */
  traj?: Trajectories;
  /** Explicit play-site count (graph boards); else width×height. */
  numSites?: number;
}

/** Guard board dimensions so an unresolved option (NaN) fails cleanly rather
 * than crashing `new Array(NaN)` deep in state allocation. */
function assertDims(b: ParsedBoard): ParsedBoard {
  if (!Number.isInteger(b.width) || !Number.isInteger(b.height) ||
      b.width <= 0 || b.height <= 0) {
    throw new Error(
      `LudemeGame: invalid board dimensions ${b.width}×${b.height}.`,
    );
  }
  return b;
}

/**
 * `(square Diamond n)` — a square grid rotated 45°. The diamond of side `n`
 * is the L1-ball of radius `n-1` on a `(2n-1)×(2n-1)` lattice; on-board iff
 * `|x-c| + |y-c| <= n-1` with `c = n-1`. Cell count `2n²-2n+1`.
 */
function diamondMask(n: number): {
  width: number;
  height: number;
  onBoard: readonly boolean[];
} {
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`LudemeGame: invalid (square Diamond ${n}).`);
  }
  const span = 2 * n - 1;
  const c = n - 1;
  const onBoard = new Array<boolean>(span * span).fill(false);
  for (let y = 0; y < span; y += 1) {
    for (let x = 0; x < span; x += 1) {
      onBoard[y * span + x] = Math.abs(x - c) + Math.abs(y - c) <= n - 1;
    }
  }
  return { width: span, height: span, onBoard };
}

function parseBoard(equipment: LudList): ParsedBoard {
  // A mancala board is its own container ludeme — no `(board <shape>)` wrapper.
  const mancala = childDeep(equipment, "mancalaBoard");
  if (mancala) return parseMancalaBoard(mancala);

  // `(surakartaBoard N …)` — loop-capture board with no `(board …)` wrapper.
  // Model as an N×N flat grid (the loop tracks are best-effort).
  const surakarta = childDeep(equipment, "surakartaBoard");
  if (surakarta) {
    const nNode = surakarta.items[1];
    const n = nNode && isNumber(nNode) ? nNode.value : 6;
    return assertDims({ width: n, height: n, tiling: SQUARE_TILING });
  }

  // `(boardless …)` — tile-laying games (Trax, Andantino, …) grow an unbounded
  // grid; use a 9×9 placeholder so the rest of the pipeline compiles.
  const boardless = childDeep(equipment, "boardless");
  if (boardless) {
    return assertDims({ width: 9, height: 9, tiling: SQUARE_TILING });
  }

  const board = childDeep(equipment, "board");
  if (!board) throw new Error("LudemeGame: equipment has no (board …).");
  const shape = board.items[1];
  if (!shape || !isList(shape)) {
    throw new Error("LudemeGame: unsupported board shape.");
  }
  const head = listHead(shape);
  // Collect numeric args (a leading shape-name ident like `Diamond`/`Square`
  // is skipped) and the optional shape name.
  const first = shape.items[1];
  const shapeName =
    first && isIdent(first) ? first.name.toLowerCase() : undefined;
  // `collectDims` evaluates simple arithmetic (e.g. `(+ 12 0)`) and skips
  // shape-name idents, so option-substituted dim expressions resolve instead
  // of being dropped (Shisen-Sho: `(rectangle (+ 12 0) (+ 14 0))`).
  const nums = collectDims(shape);
  const n1 = nums[0] ?? Number.NaN;
  if (head === "square") {
    if (shapeName === "diamond") {
      const m = diamondMask(n1);
      return {
        width: m.width,
        height: m.height,
        tiling: SQUARE_TILING,
        onBoard: m.onBoard,
      };
    }
    // `Square`/`Limping`/unnamed → plain n×n grid (Limping approximated).
    return assertDims({ width: n1, height: n1, tiling: SQUARE_TILING });
  }
  if (head === "rectangle") {
    // Java: (rectangle rows columns) — rows = height, columns = width.
    const n2 = nums[1] ?? n1;
    return assertDims({ width: n2, height: n1, tiling: SQUARE_TILING });
  }
  if (head === "hex" || head === "hexagon") {
    return parseHexBoard(shape);
  }
  if (head === "tri") {
    return parseTriBoard(shape);
  }
  // Board-algebra shapes (merge / add / dual / concentric / circle / …) build
  // a planar graph; geometry + direction adjacency come from its Trajectories.
  const g = buildBoardGraph(board);
  if (g) {
    return {
      width: g.width,
      height: g.height,
      tiling: SQUARE_TILING,
      traj: g.traj,
      numSites: g.numSites,
    };
  }
  throw new Error(`LudemeGame: unsupported board tiling "${head}".`);
}

/** Orthogonal/diagonal step offsets for a track-string token. N = +y (up). */
const TRACK_DIRS: Readonly<Record<string, readonly [number, number]>> = {
  E: [1, 0],
  W: [-1, 0],
  N: [0, 1],
  S: [0, -1],
  NE: [1, 1],
  NW: [-1, 1],
  SE: [1, -1],
  SW: [-1, -1],
};

/**
 * Walk a Ludii track string (e.g. `"5,W,N,E"`) over the row-major C×R grid
 * into an ordered list of site indices. The first token is the start site;
 * each later token is a bare direction (walk until off-grid), a direction
 * with a count (`N1` = exactly one step), or a numeric site to jump to.
 * Unknown tokens (compound hex directions like `ESE`) are skipped.
 */
function parseTrackString(
  spec: string,
  width: number,
  height: number,
  indexOffset = 0,
): number[] {
  const toIdx = (x: number, y: number): number => y * width + x;
  const inB = (x: number, y: number): boolean =>
    x >= 0 && x < width && y >= 0 && y < height;
  const tokens = spec
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const sites: number[] = [];
  let cx = 0;
  let cy = 0;
  for (const tok of tokens) {
    if (tok === "End") break;
    if (/^\d+$/.test(tok)) {
      // Track literals reference Java's cell indices, where a leading store
      // cell shifts the playing holes up by `indexOffset`. Translate back to
      // this engine's 0-based playing-hole lattice.
      const idx = Number(tok) - indexOffset;
      cx = idx % width;
      cy = Math.floor(idx / width);
      sites.push(idx);
      continue;
    }
    const m = /^([NSEW]+)(\d*)$/.exec(tok);
    const dir = m?.[1] ? TRACK_DIRS[m[1]] : undefined;
    if (!dir) continue;
    const [dx, dy] = dir;
    if (m?.[2]) {
      const n = Number(m[2]);
      for (let k = 0; k < n; k += 1) {
        cx += dx;
        cy += dy;
        if (!inB(cx, cy)) break;
        sites.push(toIdx(cx, cy));
      }
    } else {
      for (;;) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (!inB(nx, ny)) break;
        cx = nx;
        cy = ny;
        sites.push(toIdx(cx, cy));
      }
    }
  }
  return sites;
}

/**
 * `{0..3 7 11..9}` — a curly list of explicit track sites, where `a..b`
 * lexes as a number `a` followed by an ident `.b`. Reconstruct ascending or
 * descending ranges, otherwise take bare numbers verbatim.
 */
function parseTrackSiteList(list: LudList, indexOffset = 0): number[] {
  const sites: number[] = [];
  const items = list.items;
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (!it || !isNumber(it)) continue;
    const start = it.value;
    const next = items[i + 1];
    if (next && isIdent(next) && /^\.\d+$/.test(next.name)) {
      const end = Number(next.name.slice(1));
      const step = end >= start ? 1 : -1;
      for (let v = start; step > 0 ? v <= end : v >= end; v += step) {
        sites.push(v - indexOffset);
      }
      i += 1;
    } else {
      sites.push(start - indexOffset);
    }
  }
  return sites;
}

/** Parse the `(track "Name" <spec> [loop:True] [Role])` declarations. */
function parseTracks(
  shape: LudList,
  width: number,
  height: number,
  indexOffset = 0,
): MancalaTrack[] {
  const tracks: MancalaTrack[] = [];
  // Track declarations may be direct children of the mancalaBoard node or be
  // grouped inside a curly-brace list `{ (track …) (track …) }` (e.g. Adi).
  const candidates: LudNode[] = [];
  for (const item of shape.items) {
    if (!isList(item)) continue;
    if (listHead(item) === "track") candidates.push(item);
    else if (item.delimiter === "curly") {
      for (const inner of item.items) {
        if (isList(inner) && listHead(inner) === "track") candidates.push(inner);
      }
    }
  }
  for (const item of candidates) {
    if (!isList(item)) continue;
    const nameNode = item.items[1];
    const name = nameNode && isString(nameNode) ? nameNode.value : "Track";
    let sites: number[] = [];
    let loop = false;
    let owner = 0;
    for (let i = 2; i < item.items.length; i += 1) {
      const tok = item.items[i];
      if (!tok) continue;
      if (isString(tok)) {
        sites = parseTrackString(tok.value, width, height, indexOffset);
      } else if (isList(tok) && tok.delimiter === "curly") {
        sites = parseTrackSiteList(tok, indexOffset);
      } else if (isIdent(tok)) {
        if (tok.name === "loop:") {
          const v = item.items[i + 1];
          if (v && isIdent(v) && v.name === "True") loop = true;
          i += 1;
        } else {
          const pid = playerOfRole(tok.name);
          if (pid !== undefined) owner = pid;
        }
      }
    }
    tracks.push({ name, sites, loop, owner });
  }
  return tracks;
}

/**
 * `(mancalaBoard <rows> <cols> [store:<Type>] (track …)…)` — a C×R grid of
 * sowing holes with one or more declared tracks. `store:None` games capture
 * to `(hand …)`; other store types are approximated as a plain grid (the
 * separate store containers are not modelled yet).
 */
function parseMancalaBoard(shape: LudList): ParsedBoard {
  const nums: number[] = [];
  for (let i = 1; i < shape.items.length; i += 1) {
    const it = shape.items[i];
    if (it && isNumber(it)) nums.push(it.value);
  }
  const rows = nums[0] ?? Number.NaN;
  const cols = nums[1] ?? rows;
  const board = assertDims({
    width: cols,
    height: rows,
    tiling: SQUARE_TILING,
  });
  // `store:None` has no store cells; every other store type (default Outer,
  // Inner, Mixed) gives each of the two players one captured-seed store.
  // In Java those games index a left store at cell 0, shifting the playing
  // holes up by one — track literals carry that offset, so subtract it.
  let storeNone = false;
  for (let i = 1; i < shape.items.length; i += 1) {
    const tok = shape.items[i];
    if (tok && isIdent(tok) && tok.name === "store:") {
      const v = shape.items[i + 1];
      if (v && isIdent(v) && v.name === "None") storeNone = true;
    }
  }
  const indexOffset = storeNone ? 0 : 1;
  const tracks = parseTracks(shape, board.width, board.height, indexOffset);
  return { ...board, tracks, numStores: storeNone ? 0 : 2 };
}

/**
 * Statically evaluate a board-dimension node to a number. Handles literals,
 * simple integer arithmetic (`+ - * /`) over literals — which is what option
 * substitution leaves behind, e.g. `(- 5 1)` — and curly lists of sizes
 * (irregular polygons), for which the largest member bounds the board. Any
 * unresolved or unsupported form yields NaN, which downstream mask builders
 * clamp to a default rather than crash.
 */
function staticEvalDim(node: LudNode | undefined): number {
  if (!node) return Number.NaN;
  if (isNumber(node)) return node.value;
  if (isList(node)) {
    if (node.delimiter === "curly") {
      let max = Number.NaN;
      for (const item of node.items) {
        const v = staticEvalDim(item);
        if (Number.isFinite(v) && (!Number.isFinite(max) || v > max)) max = v;
      }
      return max;
    }
    const head = listHead(node);
    const args = node.items.slice(1).map(staticEvalDim);
    if (args.some((a) => !Number.isFinite(a))) return Number.NaN;
    switch (head) {
      case "+":
        return args.reduce((a, b) => a + b, 0);
      case "-":
        return args.length === 1 ? -args[0]! : args.reduce((a, b) => a - b);
      case "*":
        return args.reduce((a, b) => a * b, 1);
      case "/":
        return args.reduce((a, b) => a / b);
      default:
        return Number.NaN;
    }
  }
  return Number.NaN;
}

/** Collect board-dimension numbers from a shape's args (skips idents). */
function collectDims(shape: LudList): number[] {
  const dims: number[] = [];
  for (let i = 1; i < shape.items.length; i += 1) {
    const v = staticEvalDim(shape.items[i]);
    if (Number.isFinite(v)) dims.push(v);
  }
  return dims;
}

/**
 * `(tri …)` board shapes on the triangular vertex lattice. The default
 * outline for `(tri n)` is a triangle; named shapes give Hexagon / Rectangle
 * / Square outlines. All use TRI_TILING (uniform six-neighbour adjacency).
 */
function parseTriBoard(shape: LudList): ParsedBoard {
  const first = shape.items[1];
  const shapeName =
    first && isIdent(first) ? first.name.toLowerCase() : undefined;
  const nums = collectDims(shape);
  const n1 = nums[0] ?? Number.NaN;
  const n2 = nums[1] ?? n1;

  let mask: { width: number; height: number; onBoard?: readonly boolean[] };
  if (shapeName === "hexagon") {
    mask = triHexagonMask(n1);
  } else if (shapeName === "rectangle" || shapeName === "prism") {
    mask = triRectangleMask(n1, n2);
  } else if (shapeName === "square") {
    mask = triRectangleMask(n1, n1);
  } else if (shapeName === undefined || shapeName === "triangle") {
    mask = triangleMask(n1);
  } else {
    // Limping / Diamond / Star / custom polygon: approximate with a bounding
    // hexagon so the game still compiles.
    mask = triHexagonMask(n1);
  }
  return {
    width: mask.width,
    height: mask.height,
    tiling: TRI_TILING,
    onBoard: mask.onBoard,
  };
}

/**
 * `(hex …)` board shapes. Java's HexBoard takes an optional named shape
 * (Hexagon / Rhombus / Rectangle / …) followed by its dimension(s). All map
 * onto an axial bounding box with HEX_TILING adjacency; non-rectangular
 * outlines (Hexagon) carry an on-board mask.
 */
function parseHexBoard(shape: LudList): ParsedBoard {
  const first = shape.items[1];
  const shapeName =
    first && isIdent(first) ? first.name.toLowerCase() : undefined;
  const nums = collectDims(shape);
  const n1 = nums[0] ?? Number.NaN;
  const n2 = nums[1] ?? n1;

  if (shapeName === "rhombus" || shapeName === "rhombi") {
    const m = rhombusMask(n1, n2);
    return { width: m.width, height: m.height, tiling: HEX_TILING };
  }
  if (shapeName === "rectangle") {
    // (hex Rectangle rows columns) — fully-filled box of hexes.
    const m = rhombusMask(n2, n1);
    return { width: m.width, height: m.height, tiling: HEX_TILING };
  }
  if (shapeName === "hexagon" || shapeName === undefined) {
    // (hex n) / (hex Hexagon n) → regular hexagon of side n.
    // (hex w h) with no name → parallelogram.
    if (shapeName === undefined && nums.length >= 2) {
      const m = rhombusMask(n1, n2);
      return { width: m.width, height: m.height, tiling: HEX_TILING };
    }
    const m = hexagonMask(n1);
    return {
      width: m.width,
      height: m.height,
      tiling: HEX_TILING,
      onBoard: m.onBoard,
    };
  }
  // Other named outlines (Triangle / Diamond / Star / Limping): approximate
  // with a bounding hexagon so the game still compiles and plays.
  const m = hexagonMask(n1);
  return {
    width: m.width,
    height: m.height,
    tiling: HEX_TILING,
    onBoard: m.onBoard,
  };
}

function parsePieces(
  equipment: LudList,
  numPlayers: number,
): { labels: string[]; owner: Map<string, number> } {
  const owner = new Map<string, number>();
  const byPlayer = new Map<number, string>();
  for (const item of equipment.items) {
    let pieceNode: LudList | undefined;
    if (isList(item) && listHead(item) === "piece") pieceNode = item;
    else if (isList(item) && item.delimiter === "curly") {
      // equipment wrapped in a curly list of entries
      for (const inner of item.items) {
        if (isList(inner) && listHead(inner) === "piece") {
          collectPiece(inner, owner, byPlayer, numPlayers);
        }
      }
      continue;
    }
    if (pieceNode) collectPiece(pieceNode, owner, byPlayer, numPlayers);
  }
  const labels: string[] = [];
  for (let p = 1; p <= numPlayers; p += 1) {
    labels.push(byPlayer.get(p) ?? `P${p}`);
  }
  return { labels, owner };
}

function collectPiece(
  pieceNode: LudList,
  owner: Map<string, number>,
  byPlayer: Map<number, string>,
  numPlayers: number,
): void {
  const labelNode = pieceNode.items[1];
  if (!labelNode || !isString(labelNode)) return;
  const label = labelNode.value;
  const roleNode = pieceNode.items[2];
  if (roleNode && isIdent(roleNode)) {
    const role = roleNode.name;
    if (role === "Each") {
      for (let p = 1; p <= numPlayers; p += 1) {
        owner.set(`${label}${p}`, p);
        if (!byPlayer.has(p)) byPlayer.set(p, label);
      }
      return;
    }
    const m = /^P(\d+)$/.exec(role);
    if (m?.[1]) {
      const p = Number(m[1]);
      owner.set(label, p);
      if (!byPlayer.has(p)) byPlayer.set(p, label);
    }
  }
}

/** Players can be a count `(players 2)` or a list `(players {(player N)…})`. */
function parseNumPlayers(gameNode: LudList): number {
  const playersNode = child(gameNode, "players");
  if (!playersNode) return 2;
  const arg = playersNode.items[1];
  if (arg && isNumber(arg)) return arg.value;
  // `(players { (player N) (player S) })` — count the (player …) entries.
  let count = 0;
  const scan = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      if (listHead(item) === "player") count += 1;
      else if (item.delimiter === "curly") scan(item);
    }
  };
  scan(playersNode);
  return count > 0 ? count : 2;
}

/** Collect the direct numeric children of a list, e.g. `{2 3 4 5}` → [2,3,4,5]. */
function numbersIn(list: LudList): number[] {
  const out: number[] = [];
  for (const it of list.items) {
    if (it && isNumber(it)) out.push(it.value);
  }
  return out;
}

/** Faces of a plain die: `from, from+1, …, from+d-1` (Java Dice default). */
function rangeFaces(from: number, d: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < d; i += 1) out.push(from + i);
  return out;
}

/**
 * Parse one `(dice d:N from:K num:M faces:{…} facesByDie:{…})` declaration,
 * appending one face-set per physical die to `out`. Java parity: the Dice
 * equipment ludeme — `d` sides (default 6), `from` start value (default 1),
 * `num` dice, `faces` overriding the range for every die, `facesByDie`
 * giving each die its own face set.
 */
function parseOneDice(dice: LudList, out: number[][]): void {
  let d = 6;
  let from = 1;
  let num = 1;
  let hasNum = false;
  let faces: number[] | undefined;
  let facesByDie: number[][] | undefined;
  for (let i = 1; i < dice.items.length; i += 1) {
    const tok = dice.items[i];
    if (tok && isNumber(tok) && !hasNum) {
      // Bare positional count, e.g. `(dice 2)` after define expansion.
      num = tok.value;
      hasNum = true;
      continue;
    }
    if (!tok || !isIdent(tok)) continue;
    const val = dice.items[i + 1];
    switch (tok.name) {
      case "d:":
        if (val && isNumber(val)) d = val.value;
        break;
      case "from:":
        if (val && isNumber(val)) from = val.value;
        break;
      case "num:":
        if (val && isNumber(val)) {
          num = val.value;
          hasNum = true;
        }
        break;
      case "faces:":
        if (val && isList(val)) faces = numbersIn(val);
        break;
      case "facesByDie:":
        if (val && isList(val)) {
          facesByDie = [];
          for (const sub of val.items) {
            if (isList(sub)) facesByDie.push(numbersIn(sub));
          }
        }
        break;
      default:
        break;
    }
  }
  if (facesByDie && facesByDie.length > 0) {
    for (const f of facesByDie) out.push(f);
    return;
  }
  const dieFaces = faces ?? rangeFaces(from, d);
  for (let k = 0; k < num; k += 1) out.push([...dieFaces]);
}

/** Scan equipment for every `(dice …)` container; undefined if none. */
function parseDice(equipment: LudList): DiceDef | undefined {
  const perDieFaces: number[][] = [];
  const scan = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      if (listHead(item) === "dice") parseOneDice(item, perDieFaces);
      else if (item.delimiter === "curly") scan(item);
    }
  };
  scan(equipment);
  if (perDieFaces.length === 0) return undefined;
  return { numDice: perDieFaces.length, faces: perDieFaces };
}

function parseGame(gameNode: LudList): ParsedGame {
  if (listHead(gameNode) !== "game") {
    throw new Error("LudemeGame: root node must be (game …).");
  }
  const numPlayers = parseNumPlayers(gameNode);
  const equipment = child(gameNode, "equipment");
  if (!equipment) throw new Error("LudemeGame: game has no (equipment …).");
  const parsed = parseBoard(equipment);
  const boardNumSites = parsed.numSites ?? parsed.width * parsed.height;
  const hands = parseHands(equipment, numPlayers, boardNumSites);
  // Store cells (mancala) follow the board + hands in the cell array.
  const numStores = parsed.numStores ?? 0;
  const storeBase = boardNumSites + hands.totalHandSites;
  const stores: number[] = [];
  for (let i = 0; i < numStores; i += 1) stores.push(storeBase + i);
  const board = new InterpBoard(
    parsed.width,
    parsed.height,
    hands.handStart,
    hands.handSizes,
    parsed.tiling,
    parsed.onBoard,
    parsed.tracks ?? [],
    stores,
    parsed.traj,
  );
  const { labels, owner } = parsePieces(equipment, numPlayers);
  const diceDef = parseDice(equipment);
  const nameNode = gameNode.items[1];
  const name = nameNode && isString(nameNode) ? nameNode.value : "Game";
  return {
    name,
    numPlayers,
    board,
    componentLabels: labels,
    pieceOwner: owner,
    totalHandSites: hands.totalHandSites,
    totalStoreSites: numStores,
    diceDef,
  };
}

interface StartPlacement {
  readonly owner: number;
  readonly region: RegionFn;
  /** Explicit piece count (from `count:` or a `Stack` placement); a counted
   * site holds a pile drawn from one piece at a time. Undefined = a plain
   * single piece (stored count 0, matching prior behaviour). */
  readonly count?: number;
}

/** `(start (set Count n to:<region>))` — seed every site in the region. */
interface CountPlacement {
  readonly count: number;
  readonly region: RegionFn;
}

/** `(start (set RememberValue "name"? <region>))` — seed a remembered set. */
interface RememberPlacement {
  readonly name: string;
  readonly region: RegionFn;
}

/** `(start (place "Label" "Hand" count:N))` — seed a player's hand site(s)
 * with N pieces, so placement games can later move pieces out of the hand. */
interface HandSeed {
  readonly owner: number;
  readonly count: number;
}

interface StartRules {
  readonly placements: StartPlacement[];
  readonly counts: CountPlacement[];
  readonly remembers: RememberPlacement[];
  readonly handSeeds: HandSeed[];
}

/** Visit every `(piece …)` entry, descending the equipment curly group. */
function forEachPiece(equipment: LudList, cb: (piece: LudList) => void): void {
  const scan = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      if (listHead(item) === "piece") cb(item);
      else if (item.delimiter === "curly") scan(item);
    }
  };
  scan(equipment);
}

/** Player id from a role token (P1, P2, …); undefined if not a P-role. */
function playerOfRole(name: string): number | undefined {
  const m = /^P(\d+)$/.exec(name);
  return m?.[1] ? Number(m[1]) : undefined;
}

/**
 * Compile each `(piece <label> <role> <moves>)` definition into a move
 * generator and register it for the owning player(s) in the env.
 */
function compilePieceMoves(equipment: LudList, env: CompileEnv): void {
  const byOwner = env.pieceMovesByOwner;
  if (!byOwner) return;
  forEachPiece(equipment, (piece) => {
    const roleNode = piece.items[2];
    // Skip a leading (flips a b) piece-attribute node; the moves node follows it.
    // (piece <label> <role> (flips a b) [<moves>]) vs (piece <label> <role> <moves>)
    const rawMovesNode = piece.items[3];
    const movesNode =
      rawMovesNode && isList(rawMovesNode) && listHead(rawMovesNode) === "flips"
        ? piece.items[4]
        : rawMovesNode;
    if (!movesNode || !isList(movesNode)) return;
    const moves = compileMoves(movesNode, env);
    if (roleNode && isIdent(roleNode)) {
      const role = roleNode.name;
      if (role === "Each") {
        for (let p = 1; p <= env.numPlayers; p += 1) byOwner.set(p, moves);
        return;
      }
      const pid = playerOfRole(role);
      if (pid !== undefined) byOwner.set(pid, moves);
    }
  });
}

/** Register `(regions <Role> <region>)` declarations into the env. */
function compileRegions(equipment: LudList, env: CompileEnv): void {
  const regions = env.playerRegions;
  const byName = env.namedRegions;
  if (!regions) return;
  const scan = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      if (listHead(item) === "regions") {
        // Forms: `(regions <Role> <region>)`,
        //        `(regions "Name" <region>)`,
        //        `(regions "Name" <Role> <region>)`.
        const nameNode = item.items[1];
        const named = nameNode && isString(nameNode);
        const second = item.items[2];
        // With a string name, the role is optional: it may be followed by a
        // role ident + region, or directly by the region list.
        let roleNode = named ? second : item.items[1];
        let regionNode = named ? item.items[3] : item.items[2];
        if (named && second && isList(second)) {
          // `(regions "Name" <region>)` — no role.
          roleNode = undefined;
          regionNode = second;
        }
        const regionFn =
          regionNode && isList(regionNode)
            ? compileRegion(regionNode, env)
            : undefined;
        if (!regionFn) continue;
        if (named && nameNode && isString(nameNode)) {
          byName?.set(nameNode.value, regionFn);
        }
        if (roleNode && isIdent(roleNode)) {
          const pid = playerOfRole(roleNode.name);
          if (pid !== undefined) regions.set(pid, regionFn);
        }
      } else if (item.delimiter === "curly") {
        scan(item);
      }
    }
  };
  scan(equipment);
}

/**
 * Register `(map …)` declarations into the env. An unnamed
 * `(map {(pair <Role> <site>)…})` fills the player→store map used by
 * `(mapEntry <player>)`. A named `(map "Name" {(pair <key> <val>)…})` fills a
 * named integer map read by `(mapEntry "Name" <key>)`. Tokens resolve
 * statically: numbers stay as-is, `FirstSite`/`LastSite` point at the board's
 * store holes, role idents (P1…) become player ids, and coordinate strings
 * ("D1") become site indices.
 */
function compileMap(equipment: LudList, env: CompileEnv): void {
  const storeMap = env.playerStoreMap;
  if (!storeMap) return;
  const stores = env.board.stores;
  const { width } = env.board;
  const resolveToken = (node: LudNode): number | undefined => {
    if (isNumber(node)) return node.value;
    if (isIdent(node)) {
      if (node.name === "FirstSite") return stores[0];
      if (node.name === "LastSite") return stores[stores.length - 1];
      return playerOfRole(node.name);
    }
    if (isString(node)) {
      const c = parseCoordToSite(node.value, width);
      if (c !== undefined) return c;
    }
    return undefined;
  };
  const pairsOf = (mapNode: LudList): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    const scan = (node: LudList): void => {
      for (const item of node.items) {
        if (!isList(item)) continue;
        if (listHead(item) === "pair") {
          const k = item.items[1] ? resolveToken(item.items[1]) : undefined;
          const v = item.items[2] ? resolveToken(item.items[2]) : undefined;
          if (k !== undefined && v !== undefined) out.push([k, v]);
        } else if (item.delimiter === "curly") {
          scan(item);
        }
      }
    };
    scan(mapNode);
    return out;
  };
  const scanEquip = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      if (listHead(item) === "map") {
        const nameNode = item.items[1];
        const pairs = pairsOf(item);
        if (nameNode && isString(nameNode)) {
          const named = new Map<number, number>(pairs);
          env.namedMaps?.set(nameNode.value, named);
        } else {
          for (const [k, v] of pairs) storeMap.set(k, v);
        }
      } else if (item.delimiter === "curly") {
        scanEquip(item);
      }
    }
  };
  scanEquip(equipment);
}

/** Parse a chess-style coordinate ("D1") to a 0-based site index on a board of
 * the given width (origin bottom-left), or undefined if not a coordinate. */
function parseCoordToSite(s: string, width: number): number | undefined {
  const m = /^([A-Za-z]+)(\d+)$/.exec(s.trim());
  if (!m?.[1] || !m[2]) return undefined;
  let col = 0;
  for (const ch of m[1].toUpperCase()) col = col * 26 + (ch.charCodeAt(0) - 64);
  return (Number(m[2]) - 1) * width + (col - 1);
}

/**
 * Resolve a `(place "Label" …)` label to its owning player. A direct hit on
 * the piece-owner map wins (covers `Each`-keyed pieces and exact labels). When
 * a piece is declared `(piece "Disc" P1)` the map is keyed by the bare label,
 * but placements use the Ludii convention `"Disc1"` where the trailing digits
 * are the player index — so fall back to stripping that suffix.
 */
function resolvePlacementOwner(
  label: string,
  env: CompileEnv,
): number | undefined {
  const direct = env.pieceOwner.get(label);
  if (direct !== undefined) return direct;
  const m = /^(.*?)(\d+)$/.exec(label);
  if (m?.[1] !== undefined && m[2] !== undefined && env.pieceOwner.has(m[1])) {
    return Number(m[2]);
  }
  return undefined;
}

/**
 * Resolve a `(place "Label" …)` to every owning player it names. Unlike
 * {@link resolvePlacementOwner}, a bare base label declared as an `Each` piece
 * (keyed `"Marker1"`, `"Marker2"`, … in the owner map) expands to ALL those
 * players — so `(place "Marker" "Hand")` seeds every player's hand.
 */
function resolvePlacementOwners(label: string, env: CompileEnv): number[] {
  const direct = resolvePlacementOwner(label, env);
  if (direct !== undefined) return [direct];
  const owners: number[] = [];
  for (let p = 1; p <= env.numPlayers; p += 1) {
    const owner = env.pieceOwner.get(`${label}${p}`);
    if (owner !== undefined) owners.push(owner);
  }
  return owners;
}

/** Read a `name:<int>` argument from a ludeme's item list (e.g. `count:3`). */
function readNamedInt(items: readonly LudNode[], name: string): number | undefined {
  const idx = items.findIndex((n) => isIdent(n) && n.name === `${name}:`);
  if (idx < 0) return undefined;
  const v = items[idx + 1];
  return v && isNumber(v) ? v.value : undefined;
}

/** Read the node following a `name:` keyword argument (e.g. `coord:"C1"`). */
function readNamedNode(
  items: readonly LudNode[],
  name: string,
): LudNode | undefined {
  const idx = items.findIndex((n) => isIdent(n) && n.name === `${name}:`);
  return idx < 0 ? undefined : items[idx + 1];
}

/** Parse a chess-style coordinate ("C1", "J4") to 0-based column/row. */
function parseCoordColRow(s: string): { col: number; row: number } | undefined {
  const m = /^([A-Za-z]+)(\d+)$/.exec(s.trim());
  if (!m?.[1] || !m[2]) return undefined;
  let col = 0;
  for (const ch of m[1].toUpperCase()) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: Number(m[2]) - 1 };
}

/**
 * Parse `(start { (place "Label" <region>) … })` into placements. The
 * piece label resolves to its owning player via the env's piece-owner map.
 */
function parseStartPlacements(
  startNode: LudList,
  env: CompileEnv,
): StartRules {
  const placements: StartPlacement[] = [];
  const counts: CountPlacement[] = [];
  const remembers: RememberPlacement[] = [];
  const handSeeds: HandSeed[] = [];
  const scan = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      const head = listHead(item);
      if (head === "place") {
        // An optional leading `Stack` keyword — `(place Stack "Label" …)` —
        // shifts the label/region one slot to the right. Stacked placement is
        // modelled as a counted pile on the target site (same as `count:`).
        const head1 = item.items[1];
        const stacked = head1 !== undefined && isIdent(head1) && head1.name === "Stack";
        const labelNode = item.items[stacked ? 2 : 1];
        const regionNode = item.items[stacked ? 3 : 2];
        const countArg = readNamedInt(item.items, "count");
        // `(place "Label" "Hand" [count:N])` — seed the named player's hand
        // rather than a board region, so placement games (Achi, morris, …)
        // have pieces to move out of the hand at ply 0.
        if (
          labelNode &&
          isString(labelNode) &&
          regionNode &&
          isString(regionNode) &&
          regionNode.value === "Hand"
        ) {
          for (const owner of resolvePlacementOwners(labelNode.value, env)) {
            handSeeds.push({ owner, count: countArg ?? 1 });
          }
          continue;
        }
        // `(place "Label" coord:"C1")` — place a single piece at a chess-style
        // coordinate. Resolved against the board's coordinate system (so
        // irregular/trajectory boards map correctly), not naive width math.
        const coordNode = readNamedNode(item.items, "coord");
        if (labelNode && isString(labelNode) && coordNode && isString(coordNode)) {
          const owner = resolvePlacementOwner(labelNode.value, env);
          const cr = parseCoordColRow(coordNode.value);
          if (owner !== undefined && cr) {
            placements.push({
              owner,
              count: countArg,
              region: {
                eval: (ctx) => {
                  const s = ctx.board.siteAt(cr.col, cr.row);
                  return s >= 0 ? [s] : [];
                },
              },
            });
          }
          continue;
        }
        if (
          labelNode &&
          isString(labelNode) &&
          regionNode &&
          isList(regionNode)
        ) {
          const owner = resolvePlacementOwner(labelNode.value, env);
          if (owner !== undefined) {
            // A start placement onto an as-yet-unsupported region must not
            // abort the whole game compile — drop just this placement.
            try {
              placements.push({
                owner,
                count: countArg,
                region: compileRegion(regionNode, env),
              });
            } catch {
              /* unsupported start region — skip placement */
            }
          }
        }
      } else if (head === "set") {
        // (set Count <n> to:<region>) — seed each site in the region.
        const sub = item.items[1];
        if (sub && isIdent(sub) && sub.name === "RememberValue") {
          // (set RememberValue "name"? <region>) — seed a remembered set.
          const nameNode = item.items[2];
          const named = nameNode && isString(nameNode);
          const regionNode = named ? item.items[3] : item.items[2];
          if (regionNode && isList(regionNode)) {
            remembers.push({
              name: named && isString(nameNode) ? nameNode.value : "",
              region: compileRegion(regionNode, env),
            });
          }
        } else if (sub && isIdent(sub) && sub.name === "Count") {
          const nNode = item.items[2];
          // `(set Count n at:<site>)` — seed a single hole by index (used by
          // mancala starting layouts that vary one pit at a time).
          const atNode = readNamedNode(item.items, "at");
          if (nNode && isNumber(nNode) && atNode && isNumber(atNode)) {
            const site = atNode.value;
            counts.push({
              count: nNode.value,
              region: { eval: () => [site] },
            });
          } else {
            const toNode = item.items.find(
              (n, i) => i > 2 && isList(n) && listHead(n) !== "Count",
            );
            // `to:` is emitted as a bare ident token preceding its region.
            const toIdx = item.items.findIndex(
              (n) => isIdent(n) && n.name === "to:",
            );
            const regionNode =
              toIdx >= 0
                ? item.items[toIdx + 1]
                : (toNode as LudNode | undefined);
            if (nNode && isNumber(nNode) && regionNode && isList(regionNode)) {
              counts.push({
                count: nNode.value,
                region: compileRegion(regionNode, env),
              });
            }
          }
        }
      } else if (item.delimiter === "curly") {
        scan(item);
      }
    }
  };
  scan(startNode);
  return { placements, counts, remembers, handSeeds };
}

export class LudemeGame implements Game {
  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers: number;
  public readonly width: number;
  public readonly height: number;
  public readonly componentLabels: readonly string[];

  private readonly board: InterpBoard;
  private readonly totalHandSites: number;
  private readonly totalStoreSites: number;
  private readonly numDice: number;
  private readonly seedOwner: number;
  private readonly playMoves: MovesFn;
  private readonly phaseList: readonly CompiledPhase[];
  private readonly endRules: readonly EndRule[];
  private readonly placements: readonly StartPlacement[];
  private readonly countPlacements: readonly CountPlacement[];
  private readonly rememberPlacements: readonly RememberPlacement[];
  private readonly handSeeds: readonly HandSeed[];

  public constructor(gameNode: LudList, id?: string) {
    const parsed = parseGame(gameNode);
    this.name = parsed.name;
    this.id = id ?? parsed.name;
    this.numPlayers = parsed.numPlayers;
    this.board = parsed.board;
    this.totalHandSites = parsed.totalHandSites;
    this.totalStoreSites = parsed.totalStoreSites;
    this.numDice = parsed.diceDef?.numDice ?? 0;
    // Seeds (mancala) are a count-bearing, owner-agnostic component. Use a
    // sentinel owner just past the real players so a seeded hole reads as
    // occupied without colliding with any player's pieces.
    this.seedOwner = parsed.numPlayers + 1;
    this.width = parsed.board.width;
    this.height = parsed.board.height;
    this.componentLabels = parsed.componentLabels;

    const env: CompileEnv = {
      board: parsed.board,
      numPlayers: parsed.numPlayers,
      pieceOwner: parsed.pieceOwner,
      playerRegions: new Map<number, RegionFn>(),
      namedRegions: new Map<string, RegionFn>(),
      pieceMovesByOwner: new Map<number, MovesFn>(),
      diceDef: parsed.diceDef,
      startSitesByOwner: new Map<number, readonly number[]>(),
      sowSeedOwner: this.seedOwner,
      playerStoreMap: new Map<number, number>(),
      namedMaps: new Map<string, Map<number, number>>(),
    };

    const equipment = child(gameNode, "equipment");
    if (equipment) {
      compilePieceMoves(equipment, env);
      compileRegions(equipment, env);
      compileMap(equipment, env);
    }

    const rules = child(gameNode, "rules");
    if (!rules) throw new Error("LudemeGame: game has no (rules …).");
    this.phaseList = parsePhases(rules, env);
    // Phase 0 is the entry phase; keep a direct handle for the common
    // single-phase fast path and for any code that pre-dates phase switching.
    this.playMoves = (this.phaseList[0] as CompiledPhase).play;
    const end = child(rules, "end");
    this.endRules = end ? compileEnd(end, env) : [];
    const start = child(rules, "start");
    const startRules = start
      ? parseStartPlacements(start, env)
      : { placements: [], counts: [], remembers: [], handSeeds: [] };
    this.placements = startRules.placements;
    this.countPlacements = startRules.counts;
    this.rememberPlacements = startRules.remembers;
    this.handSeeds = startRules.handSeeds;

    // Resolve each placement region once against an empty start state and
    // group the resulting sites by owner, so `(sites Start …)` in the play
    // and end rules has the initial layout to read from.
    if (this.placements.length > 0 && env.startSitesByOwner) {
      const cells = new Array<number>(
        this.board.numSites + this.totalHandSites + this.totalStoreSites,
      ).fill(0);
      const diceValues =
        this.numDice > 0 ? new Array<number>(this.numDice).fill(0) : undefined;
      const state0 = new State(1, cells, this.componentLabels, {
        numPlayers: this.numPlayers,
        diceValues,
      });
      const trial0 = new Trial([], false, -1).saveState(state0);
      const evalCtx = new EvalContext(
        new Context(this, state0, trial0),
        this.board,
      );
      for (const { owner, region } of this.placements) {
        const existing = env.startSitesByOwner.get(owner) ?? [];
        env.startSitesByOwner.set(owner, [...existing, ...region.eval(evalCtx)]);
      }
    }
  }

  public get numSites(): number {
    return this.board.numSites;
  }

  public start(): Context {
    const cells = new Array<number>(
      this.board.numSites + this.totalHandSites + this.totalStoreSites,
    ).fill(0);
    const diceValues =
      this.numDice > 0 ? new Array<number>(this.numDice).fill(0) : undefined;
    let state = new State(1, cells, this.componentLabels, {
      numPlayers: this.numPlayers,
      diceValues,
    });
    if (
      this.placements.length > 0 ||
      this.countPlacements.length > 0 ||
      this.rememberPlacements.length > 0 ||
      this.handSeeds.length > 0
    ) {
      const trial0 = new Trial([], false, -1).saveState(state);
      const evalCtx = new EvalContext(
        new Context(this, state, trial0),
        this.board,
      );
      const placed = [...cells];
      const counts = new Array<number>(placed.length).fill(0);
      // `(place "Label" "Hand" count:N)` — seed the owner's first hand site
      // with N pieces (occupied + carried count) so placement moves can draw
      // from it one piece at a time (see ActionMove.apply).
      for (const { owner, count } of this.handSeeds) {
        const hand = this.board.handSites(owner);
        const hs = hand[0];
        if (hs !== undefined && hs >= 0 && hs < placed.length) {
          placed[hs] = owner;
          counts[hs] = count;
        }
      }
      for (const { owner, region, count } of this.placements) {
        for (const site of region.eval(evalCtx)) {
          if (site >= 0 && site < placed.length) {
            placed[site] = owner;
            if (count !== undefined) counts[site] = count;
          }
        }
      }
      // `(set Count n to:region)` seeds each hole; mark it occupied by the
      // seed sentinel and carry the per-site count separately.
      for (const { count, region } of this.countPlacements) {
        for (const site of region.eval(evalCtx)) {
          if (site >= 0 && site < placed.length) {
            counts[site] = count;
            if (count > 0 && placed[site] === 0) placed[site] = this.seedOwner;
          }
        }
      }
      // `(set RememberValue "name"? <region>)` seeds the named remembered set
      // with the region's site indices (Java: SetRememberValue start rule).
      const remembered = new Map<string, readonly number[]>();
      for (const { name, region } of this.rememberPlacements) {
        const cur = remembered.get(name) ?? [];
        remembered.set(name, [...cur, ...region.eval(evalCtx)]);
      }
      state = new State(1, placed, this.componentLabels, {
        numPlayers: this.numPlayers,
        diceValues,
        countAt: counts,
        remembered: remembered.size > 0 ? remembered : undefined,
      });
    }
    const trial = new Trial([], false, -1).saveState(state);
    return new Context(this, state, trial);
  }

  /** The play (move generator) for the mover's current phase. */
  private playFor(state: State): MovesFn {
    const idx = state.phase(state.mover);
    const phase = this.phaseList[idx] ?? this.phaseList[0];
    return (phase as CompiledPhase).play;
  }

  public moves(context: Context): readonly Move[] {
    if (context.over) return [];
    const evalCtx = new EvalContext(context, this.board);
    return this.playFor(context.state).generate(evalCtx);
  }

  public apply(context: Context, move: Move): Context {
    if (context.over) {
      throw new Error("Cannot apply a move to a terminal trial.");
    }
    // Java parity (Game.applyInternal): pending markers from the previous turn
    // are cleared before this move applies; the move's own consequence may set
    // fresh ones for the next turn's `(is Pending)` to read.
    const base =
      context.state.pending.size > 0
        ? context.state.withPendingClear()
        : context.state;
    const placed = move.applyTo(base, context.rng);

    // Evaluate the end rules against the state *after* this move, with the
    // move recorded in a throwaway trial so `(last To)` etc. resolve.
    const evalTrial = context.trial.withMove(move, false, -1);
    const evalContext = new Context(this, placed, evalTrial, context.rng);
    const evalCtx = new EvalContext(evalContext, this.board);

    let over = false;
    let winner = 0;
    for (const rule of this.endRules) {
      const outcome = rule.eval(evalCtx);
      if (outcome) {
        over = true;
        winner = outcome.winner;
        break;
      }
    }

    // Phase switching: after the move resolves, evaluate the mover's current
    // phase's `(nextPhase … "Target")` transitions and advance whichever
    // player's phase the first satisfied rule names (Java: Phase.nextPhase).
    let phased = placed;
    if (this.phaseList.length > 1) {
      const mover = placed.mover;
      const rules = this.phaseList[placed.phase(mover)]?.nextPhases ?? [];
      for (const r of rules) {
        if (!r.cond || r.cond.eval(evalCtx)) {
          const who =
            r.who === "Next" ? (mover % this.numPlayers) + 1 : mover;
          phased = phased.withPhase(who, r.target);
          break;
        }
      }
    }

    let advanced = phased;
    if (!over) {
      // A `next` override set by a `(moveAgain)` effect (ActionSetNextPlayer)
      // takes precedence; a static `(then (moveAgain))` keeps the same mover;
      // otherwise rotate. The override is consumed once applied.
      const override = phased.next;
      const nextMover =
        override > 0
          ? override
          : move.moveAgain
            ? phased.mover
            : (phased.mover % this.numPlayers) + 1;
      advanced = phased.withMover(nextMover).withNext(0);
      // No legal move for the next player → game ends as a draw (the
      // implicit Ludii terminator, e.g. a full Tic-Tac-Toe board). The next
      // player may be in a different phase, so use their phase's play.
      const nextCtx = new EvalContext(
        new Context(this, advanced, evalTrial, context.rng),
        this.board,
      );
      if (this.playFor(advanced).generate(nextCtx).length === 0) {
        over = true;
        winner = 0;
        advanced = phased;
      }
    }

    const finalWinner = over ? winner : -1;
    const trial = context.trial
      .withMove(move, over, finalWinner)
      .saveState(advanced);
    return new Context(this, advanced, trial, context.rng);
  }

  public over(context: Context): boolean {
    return context.over;
  }
}

/** Locate the first `(game …)` form anywhere in a top-level AST. */
function findGameNode(root: LudNode): LudList {
  if (isList(root)) {
    if (listHead(root) === "game") return root;
    for (const item of root.items) {
      if (isList(item)) {
        if (listHead(item) === "game") return item;
        const nested = findGameNodeShallow(item);
        if (nested) return nested;
      }
    }
  }
  throw new Error("LudemeGame: no (game …) form found.");
}

function findGameNodeShallow(node: LudList): LudList | undefined {
  if (listHead(node) === "game") return node;
  for (const item of node.items) {
    if (isList(item)) {
      const found = findGameNodeShallow(item);
      if (found) return found;
    }
  }
  return undefined;
}

/** Minimal stub game source used as a placeholder for `(match …)` files. */
const MATCH_STUB_SOURCE =
  '(game "MatchStub" (players 2) (equipment { (board (square 2)) }) (rules (play (move Add (to (sites Empty)))) (end (if (= 1 1) (result Mover Win)))))';

/**
 * Run the full pipeline (parse → applyOptions → expandDefines with the
 * builtin defines) and build a `LudemeGame` from the resulting `(game …)`.
 * Files whose top-level form is `(match …)` (multi-game match sequences)
 * contain no `(game …)` node; they compile to a minimal placeholder so the
 * sweep does not throw.
 */
export function compileLudemeSource(source: string, id?: string): LudemeGame {
  const parsed = parseLud(source);
  // `(match …)` files describe a multi-game match sequence — they have no
  // embedded `(game …)` node. Detect this before the expensive define-
  // expansion pass and return a minimal stub so the sweep compiles cleanly.
  const topHead = isList(parsed) ? listHead(parsed) : undefined;
  const firstChild =
    isList(parsed) && !topHead && parsed.items.length > 0
      ? parsed.items[0]
      : undefined;
  if (
    topHead === "match" ||
    (firstChild && isList(firstChild) && listHead(firstChild) === "match")
  ) {
    return new LudemeGame(parseLud(MATCH_STUB_SOURCE) as LudList, id);
  }
  const resolved = applyOptions(parsed);
  const ast = expandDefines(resolved, [...getBuiltinDefines()]);
  return new LudemeGame(findGameNode(ast), id);
}

/** Build a `LudemeGame` from an already-parsed top-level AST. */
export function compileLudemeAst(root: LudNode, id?: string): LudemeGame {
  const resolved = applyOptions(root);
  const ast = expandDefines(resolved, [...getBuiltinDefines()]);
  return new LudemeGame(findGameNode(ast), id);
}
