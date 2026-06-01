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
  type LudIdent,
  type LudList,
  type LudNode,
  type LudNumber,
  listHead,
  parseLud,
} from "@ludii/typescript-language";
import { getBuiltinDefines } from "../builtin-defines.js";
import { Context } from "../context.js";
import type { Game } from "../game.js";
import { expandDefines } from "../lud-defines.js";
import { applyOptions } from "../lud-options.js";
import { Move } from "../move.js";
import { ActionPass } from "../action/action-pass.js";
import { ActionRemove } from "../action/action-remove.js";
import {
  buildInitialOnTrackIndices,
  buildTrackLocToIndex,
} from "../on-track-indices.js";
import { SeededRng } from "../rng.js";
import { State } from "../state.js";
import { Trial } from "../trial.js";
import {
  type CompileEnv,
  type DiceDef,
  compileBool,
  compileEnd,
  compileInt,
  compileMoves,
  compileRegion,
  largePieceFootprint,
  parseArgs,
} from "./compile.js";
import {
  type BoolFn,
  END,
  type EndEvalState,
  type EndOutcome,
  type EndRule,
  EvalContext,
  InterpBoard,
  type IntFn,
  type MancalaTrack,
  type MovesFn,
  OFF,
  type RegionFn,
} from "./eval-context.js";
import { buildBoardGraph, buildMancalaGraph } from "./graph/board-graph.js";
import type { Trajectories } from "./graph/trajectories.js";
import {
  type Tiling,
  SQUARE_TILING,
  SQUARE_VERTEX_TILING,
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
 * Java parity: `Game.isStacking()` (Core Game.java:946) =
 * `(gameFlags() & GameType.Stacking) != 0 || hasCard() || board().largeStack()`.
 * The Stacking bit is OR-propagated bottom-up from every ludeme that touches
 * real per-level stacks — moves with `stack:True` (Step/Slide/Hop/FromTo/Add/
 * forEach Piece), `(place Stack …)` (PlaceCustomStack/PlaceMonotonousStack),
 * `(level)`, `(where … level:)`, `(size Stack)`, `(count Stack)` — plus card
 * games and `(board … largeStack:True)`.
 *
 * We approximate that bit with a syntactic scan of the (define-expanded) game
 * tree. This flag only gates `ActionRemove`'s clear-vs-pop behaviour, and the
 * two misclassification directions are asymmetric:
 *   • stacking-as-flat → `(remove)` would wrongly wipe a whole pile → REGRESSION
 *   • flat-as-stacking → keeps the (harmless on single-piece sites) decrement
 * so we deliberately OVER-detect stacking: any marker below flips it true.
 */
function gameUsesStacking(node: LudNode): boolean {
  if (isIdent(node)) {
    const n = node.name;
    // `(place Stack …)`, `(size Stack …)`, `(count Stack …)`; `stack:True`
    // keyword; `level:` keyword on from/to/where; `(board … largeStack:True)`.
    return (
      n === "Stack" || n === "stack:" || n === "level:" || n === "largeStack:"
    );
  }
  if (isList(node)) {
    const head = listHead(node);
    if (head === "level" || head === "card") return true; // (level), (card …)
    for (const item of node.items) {
      if (gameUsesStacking(item)) return true;
    }
  }
  return false;
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
  /**
   * Destination phase. A number is an explicit index; `"next"` means the
   * target phase name was omitted, so Java advances to `(currentPhase + 1) %
   * phases.length` for the player whose phase changes (NextPhase.eval).
   */
  readonly target: number | "next";
  /**
   * Whose phase advances (Java NextPhase `who`): `"all"` when no player/role
   * argument is given (Java `RoleType.Shared`, evaluates to `numPlayers+1` =
   * every player); `"Mover"`/`"Next"` for those roles; a positive integer for
   * an explicit `P<k>`.
   */
  readonly who: "all" | "Mover" | "Next" | number;
}

/** One `(phase "Name" (play …) (nextPhase …)*)` compiled for runtime. */
interface CompiledPhase {
  readonly name: string;
  readonly play: MovesFn;
  readonly nextPhases: readonly NextPhaseRule[];
  /**
   * Optional role restricting which players this phase applies to (Java:
   * `Phase.owner`). `(phase "Placement" P1 …)` only applies to player 1; a
   * player's initial phase is the first phase whose role includes them. `""`
   * (no role) / `Each` / `All` / `Shared` apply to every player.
   */
  readonly role: string;
  /**
   * Phase-scoped `(end …)` clause (Java `Phase.end()`). Evaluated *before* the
   * game-level end rules whenever the mover is in this phase
   * (Game.java:3063). Hunt games (Kaooa, Fox & Geese, …) put their entire win
   * condition here, e.g. `(end ("NoMoves" Loss))` in the movement phase only.
   */
  readonly endRules: readonly EndRule[];
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
      {
        name: "",
        play: compileMoves(direct.items[1], env),
        nextPhases: [],
        role: "",
        endRules: [],
      },
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
    // An optional role ident sits between the name and the `(play …)` /
    // `(nextPhase …)` lists, e.g. `(phase "Placement" P1 (play …))`.
    const roleNode = node.items[2];
    const role = roleNode && isIdent(roleNode) ? roleNode.name : "";
    // Phase-scoped `(end …)` (Java Phase.end()). Compiled here so a phase like
    // hunt-family "Movement" can carry its own win condition independent of the
    // game-level (end …).
    const endNode = child(node, "end");
    let endRules: readonly EndRule[] = [];
    if (endNode) {
      try {
        endRules = compileEnd(endNode, env);
      } catch {
        endRules = [];
      }
    }
    const playNode = child(node, "play");
    if (!playNode?.items[1]) {
      // A phase with no (play …) generates nothing; keep it as a placeholder
      // so indices line up, but it will yield no moves.
      phases.push({
        name,
        play: { generate: () => [] },
        nextPhases: [],
        role,
        endRules,
      });
      continue;
    }
    const play = compileMoves(playNode.items[1], env);
    const nextPhases: NextPhaseRule[] = [];
    // Collect (nextPhase …) declarations, descending into any curly `{ … }`
    // wrapper — a phase may group several `(nextPhase Px … "Target")` rules in
    // one block (Diviyan Keliya), which Java parses regardless of the wrapper.
    const phaseItems: LudNode[] = [];
    const collectNextPhase = (items: readonly LudNode[]): void => {
      for (const it of items) {
        if (!isList(it)) continue;
        if (it.delimiter === "curly") collectNextPhase(it.items);
        else phaseItems.push(it);
      }
    };
    collectNextPhase(node.items);
    for (const item of phaseItems) {
      if (!isList(item) || listHead(item) !== "nextPhase") continue;
      const after = item.items.slice(1);
      // The destination is the trailing string; an optional leading role ident
      // (Mover/Next) and an optional boolean (a list) may precede it.
      const targetNode = [...after].reverse().find((n) => isString(n));
      const targetName =
        targetNode && isString(targetNode) ? targetNode.value : undefined;
      // No target name → Java advances to the next phase in sequence
      // (`(currentPhase + 1) % phases.length`); we mark it `"next"` and resolve
      // at runtime against the player whose phase changes.
      const resolved =
        targetName !== undefined ? indexByName.get(targetName) : undefined;
      const target: number | "next" =
        targetName === undefined ? "next" : (resolved ?? -1);
      if (target === -1) continue; // named target that didn't resolve
      // Java NextPhase: an optional leading role/player argument. With none,
      // `who` defaults to RoleType.Shared = every player (`"all"`). `Mover` and
      // `Next` resolve at runtime; `All`/`Each`/`Shared` are also every player;
      // `P<k>` names player k.
      const roleNode = after.find((n) => isIdent(n));
      const roleName =
        roleNode && isIdent(roleNode) ? roleNode.name : undefined;
      let who: "all" | "Mover" | "Next" | number;
      if (roleName === undefined) who = "all";
      else if (roleName === "Mover") who = "Mover";
      else if (roleName === "Next") who = "Next";
      else if (
        roleName === "All" ||
        roleName === "Each" ||
        roleName === "Shared"
      )
        who = "all";
      else if (/^P\d+$/.test(roleName)) who = Number(roleName.slice(1));
      else who = "Mover";
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
    phases.push({ name, play, nextPhases, role, endRules });
  }
  return phases.length > 0
    ? phases
    : [
        {
          name: "",
          play: { generate: () => [] },
          nextPhases: [],
          role: "",
          endRules: [],
        },
      ];
}

/**
 * Each player's starting phase index. A player starts in the first phase whose
 * role includes them (Java: the engine assigns `Phase.owner`-matching phases).
 * A roleless phase (or `Each`/`All`/`Shared`/`Mover`) applies to everyone;
 * `P<k>` applies only to player k. Players with no matching phase default to 0.
 */
function computeInitialPhases(
  phases: readonly CompiledPhase[],
  numPlayers: number,
): number[] {
  const appliesToAll = (role: string): boolean =>
    role === "" ||
    role === "All" ||
    role === "Each" ||
    role === "Shared" ||
    role === "Mover" ||
    role === "Next";
  const out = new Array<number>(numPlayers + 1).fill(0);
  for (let p = 1; p <= numPlayers; p += 1) {
    for (let i = 0; i < phases.length; i += 1) {
      const role = (phases[i] as CompiledPhase).role;
      const m = /^P(\d+)$/.exec(role);
      if (appliesToAll(role) || (m && Number(m[1]) === p)) {
        out[p] = i;
        break;
      }
    }
  }
  return out;
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
  /** Full piece-label → component `what` id. */
  readonly componentIdByLabel: ReadonlyMap<string, number>;
  /** Component `what` id → owning player. */
  readonly componentOwnerById: readonly number[];
  /** Component `what` id → base piece name (collision-free; `Each` keeps the bare label). */
  readonly componentBaseNameById: readonly string[];
  /** Component `what` id → its `(flips a b)` state pair (for the `(flip …)` effect). */
  readonly componentFlipsById: readonly ([number, number] | undefined)[];
  /** Component `what` id → its large-piece turtle walk(s) (`(tile …)` shapes). */
  readonly componentWalkById: readonly (string[][] | undefined)[];
  /** Number of hand sites appended to the board in `State.cells`. */
  readonly totalHandSites: number;
  /** Number of mancala store cells appended after the hands. */
  readonly totalStoreSites: number;
  /**
   * Cell-array index where the first hand/store begins — `max(numFaces,
   * numPlaySites)`, matching Java's `maxSiteMainBoard`. On a Vertex-play graph
   * board this exceeds {@link board}'s `numSites`, leaving a gap so hand sites
   * land at their Cell-space index (what recorded trials reference).
   */
  readonly cellBase: number;
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
  // Hand owners in declaration order — Java appends one container per hand in
  // the order they appear in `(equipment …)`, so the cell offsets follow that
  // order, not player-index order. `(hand Shared)`/`Neutral` uses index 0.
  const order: number[] = [];
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
            for (let p = 1; p <= numPlayers; p += 1) {
              handSizes[p] = size;
              order.push(p);
            }
          } else if (role === "Shared" || role === "Neutral") {
            // Java `RoleType.Shared`/`Neutral` owner() == 0 (Constants.NOBODY).
            // Park the shared hand at index 0 (the otherwise-unused slot) so
            // `(sites Hand Shared)` / `(handSite Shared)` resolve to it.
            handSizes[0] = size;
            order.push(0);
          } else {
            const m = /^P(\d+)$/.exec(role);
            if (m?.[1]) {
              const p = Number(m[1]);
              if (p >= 1 && p <= numPlayers) {
                handSizes[p] = size;
                order.push(p);
              }
            }
            // Other roles are not modelled yet.
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
  // Lay hands out in declaration order (Java container ordering).
  for (const p of order) {
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
  /**
   * Board-site ids of mancala store cells, when the stores are vertices of the
   * board graph itself (the faithful graph path) rather than separate
   * containers appended after the hands. When present, these become the
   * EvalContext `stores` array directly. Java cells 0 and 2N+1.
   */
  storeSites?: readonly number[];
  /** Graph-algebra board adjacency (merge / dual / concentric / …). */
  traj?: Trajectories;
  /** Explicit play-site count (graph boards); else width×height. */
  numSites?: number;
  /**
   * Number of board faces (Cell sites). On a Vertex-play graph board this can
   * exceed {@link numSites}; Java seeds hands/stores after
   * `max(numFaces, numPlaySites)`, so a hand's index lives in Cell space.
   */
  numFaces?: number;
  /**
   * Compass board sides (Java `Topology.sides`) for graph boards — direction
   * name → play-site ids. Threaded onto `InterpBoard` so `(sites Side …)` uses
   * the real perimeter edges on slanted boards instead of bounding-box rows.
   */
  sideRegions?: Partial<Record<string, readonly number[]>>;
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

/** True if `shape`'s argument list contains a `name:` keyword token. */
function hasNamedArg(shape: LudList, name: string): boolean {
  const key = `${name}:`;
  return shape.items.some((it) => isIdent(it) && it.name === key);
}

/**
 * True when a `(board <shape> … use:Vertex)` declares Vertex play. The lexer
 * splits the named arg into the key ident `use:` followed by its value ident
 * (`Vertex` / `Cell` / `Edge`). On a Vertex board the default `Adjacent`
 * neighbourhood is the four orthogonal grid edges, not the 8-way cell king-
 * neighbourhood (see {@link SQUARE_VERTEX_TILING}), so a bare `(move Slide)` /
 * `(move Step)` runs orthogonally rather than like a queen.
 */
function boardUsesVertex(board: LudList): boolean {
  const items = board.items;
  for (let i = 0; i < items.length - 1; i += 1) {
    const it = items[i];
    if (it && isIdent(it) && it.name === "use:") {
      const val = items[i + 1];
      return !!(val && isIdent(val) && val.name === "Vertex");
    }
  }
  return false;
}

/**
 * True when a `(board <shape> … use:Edge)` declares Edge play. The play-sites
 * are then the graph's EDGES (segments between vertices), so a rectangle/square
 * shape must be routed through {@link buildBoardGraph} rather than the flat
 * width×height lattice — a `(rectangle 1 N)` race track has N−1 edge sites, not
 * N lattice cells, and getting that count right keeps the hand containers (which
 * Java appends after the board sites) at the indices the tracks reference.
 */
function boardUsesEdge(board: LudList): boolean {
  const items = board.items;
  for (let i = 0; i < items.length - 1; i += 1) {
    const it = items[i];
    if (it && isIdent(it) && it.name === "use:") {
      const val = items[i + 1];
      return !!(val && isIdent(val) && val.name === "Edge");
    }
  }
  return false;
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

  // `(boardless <tiling> [dim])` — tile-laying games (Trax, Andantino, …).
  // Java's Boardless does NOT use a special unbounded topology: it pre-builds a
  // fixed "fake" grid sized by `Constants.SIZE_BOARDLESS` (= 41 for Square/Tri)
  // or `SIZE_HEX_BOARDLESS` (= 21 for Hex) and lets `(sites Playable)` restrict
  // placement, so the board only *appears* to grow. Concretely Java builds
  // `RectangleOnSquare(41)`, `HexagonOnHex(21)` or `TriangleOnTri(41)`
  // (Boardless.java:51-55). The previous 9×9 placeholder put `(centrePoint)` and
  // every site index in a different space than the recorded trials (e.g.
  // Andantino centre 671, Plotto hand 1262), so every boardless game mismatched
  // at ply 0. Synthesize the matching shape node and route it through the normal
  // (and already Java-faithful — Hex/Y/DuploHex replay clean) shape pipeline.
  const boardless = childDeep(equipment, "boardless");
  if (boardless) {
    const range = boardless.range;
    const ident = (name: string): LudIdent => ({ kind: "ident", name, range });
    const num = (value: number): LudNumber => ({ kind: "number", value, range });
    const list = (items: LudNode[]): LudList => ({
      kind: "list",
      delimiter: "round",
      range,
      items,
    });
    // The tiling token; option substitution can wrap it as `(Hexagonal)`, so
    // peel a single-element list down to its ident.
    let tilingNode = boardless.items[1];
    while (
      tilingNode &&
      isList(tilingNode) &&
      tilingNode.items.length === 1 &&
      tilingNode.items[0] !== undefined
    ) {
      tilingNode = tilingNode.items[0];
    }
    const tiling =
      tilingNode && isIdent(tilingNode) ? tilingNode.name : "Square";
    // Optional explicit dimension `(boardless <tiling> <n>)`; otherwise the
    // Java default for that tiling (SIZE_HEX_BOARDLESS / SIZE_BOARDLESS).
    const dimNode = boardless.items[2];
    const explicitDim =
      dimNode && isNumber(dimNode) ? dimNode.value : undefined;
    let shape: LudList;
    if (tiling === "Hexagonal") {
      shape = list([ident("hex"), ident("Hexagon"), num(explicitDim ?? 21)]);
    } else if (tiling === "Triangular" || tiling === "Triangle") {
      shape = list([ident("tri"), ident("Triangle"), num(explicitDim ?? 41)]);
    } else {
      // Square (and any unrecognised tiling) → RectangleOnSquare(41).
      shape = list([ident("square"), num(explicitDim ?? 41)]);
    }
    return parseBoardShape(list([ident("board"), shape]));
  }

  const board = childDeep(equipment, "board");
  if (!board) throw new Error("LudemeGame: equipment has no (board …).");
  const base = parseBoardShape(board);
  // Tracks can be declared directly inside a generic `(board <shape> { (track
  // …) } …)` container (not just `(mancalaBoard …)`) — many sow games on a
  // plain rectangle/graph board do this. Attach any such tracks so `(sites
  // Track)` / `(trackSite …)` resolve. indexOffset is 0 here: a generic board
  // has no implicit leading store cell.
  const trackStepper = base.traj
    ? (site: number, dir: string) => base.traj!.step(site, dir)
    : undefined;
  const boardTracks = parseTracks(board, base.width, base.height, 0, trackStepper);
  if (boardTracks.length > 0 && (base.tracks?.length ?? 0) === 0) {
    return { ...base, tracks: boardTracks };
  }
  return base;
}

/** Parse just the `(board <shape> …)` geometry, ignoring track declarations. */
function parseBoardShape(board: LudList): ParsedBoard {
  const shape0 = board.items[1];
  if (!shape0 || !isList(shape0)) {
    throw new Error("LudemeGame: unsupported board shape.");
  }
  // Unwrap an extra round-paren wrapper produced when an option token like
  // `(<BoardShape:type>)` is substituted: the angle-bracket sits inside its own
  // parentheses, so after substitution the shape is `((hex 6))` — a list whose
  // sole element is the real `(hex 6)`. Java's grammar resolves this away; we
  // strip the redundant wrapper so `head` reads the true tiling (Rascals).
  let shape: LudList = shape0;
  while (
    shape.delimiter === "round" &&
    shape.items.length === 1 &&
    listHead(shape) === undefined &&
    shape.items[0] !== undefined &&
    isList(shape.items[0])
  ) {
    shape = shape.items[0];
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
  // A `diagonals:` arg adds real diagonal edges (alquerque lines / split
  // faces) which the flat lattice can't represent — and, crucially, changes
  // the board's *face* count, which Java uses as the hand/store site offset
  // (`Board.numSites = topology.cells().size()`). Route these through the
  // planar-graph builder so adjacency and the Cell-space offset both match.
  if ((head === "square" || head === "rectangle") && hasNamedArg(shape, "diagonals")) {
    const g = buildBoardGraph(board);
    if (g) {
      return {
        width: g.width,
        height: g.height,
        tiling: SQUARE_TILING,
        traj: g.traj,
        numSites: g.numSites,
        numFaces: g.numFaces,
        sideRegions: g.sideRegions,
      };
    }
    // Fall through to the lattice approximation if the graph build failed.
  }
  // `(square n pyramidal:True)` — the Shibumi stacked-vertex pyramid. The flat
  // n×n lattice can only model the base layer, so route through the planar-graph
  // builder, which emits all (n²+(n-1)²+…+1) vertices with per-site elevation.
  if (head === "square" && hasNamedArg(shape, "pyramidal")) {
    const g = buildBoardGraph(board);
    if (g) {
      return {
        width: g.width,
        height: g.height,
        tiling: SQUARE_TILING,
        traj: g.traj,
        numSites: g.numSites,
        numFaces: g.numFaces,
        sideRegions: g.sideRegions,
      };
    }
    // Fall through to the lattice approximation if the graph build failed.
  }
  // A `use:Edge` square/rectangle board plays on the graph's edges, not its
  // cells/vertices, so the flat width×height lattice would over-count by one per
  // row (N vertices → N−1 edge segments). Route through the planar-graph builder
  // (which now models Edge play) so the site count — and hence the hand-site
  // offset the tracks reference — matches Java. Linear race tracks (Maya
  // stick-dice family, Puluc, Tugi-Epfe) all hinge on this.
  if ((head === "square" || head === "rectangle") && boardUsesEdge(board)) {
    const g = buildBoardGraph(board);
    if (g) {
      return {
        width: g.width,
        height: g.height,
        tiling: SQUARE_TILING,
        traj: g.traj,
        numSites: g.numSites,
        numFaces: g.numFaces,
        sideRegions: g.sideRegions,
      };
    }
    // Fall through to the lattice approximation if the graph build failed.
  }
  // A `use:Vertex` square/rectangle board plays on the grid intersections,
  // whose `Adjacent` relation is orthogonal-only (no diagonal edge between
  // intersections) — see SQUARE_VERTEX_TILING. Cell boards keep the 8-way table.
  const squareTiling = boardUsesVertex(board) ? SQUARE_VERTEX_TILING : SQUARE_TILING;
  if (head === "square") {
    if (shapeName === "diamond") {
      const m = diamondMask(n1);
      return {
        width: m.width,
        height: m.height,
        tiling: squareTiling,
        onBoard: m.onBoard,
      };
    }
    // `Square`/`Limping`/unnamed → plain n×n grid (Limping approximated).
    return assertDims({ width: n1, height: n1, tiling: squareTiling });
  }
  if (head === "rectangle") {
    // Java: (rectangle rows columns) — rows = height, columns = width.
    const n2 = nums[1] ?? n1;
    return assertDims({ width: n2, height: n1, tiling: squareTiling });
  }
  if (head === "hex" || head === "hexagon") {
    return parseHexBoard(shape, board);
  }
  if (head === "tri") {
    return parseTriBoard(shape, board);
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
      numFaces: g.numFaces,
      sideRegions: g.sideRegions,
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
  stepper?: (site: number, dir: string) => number,
): number[] {
  const toIdx = (x: number, y: number): number => y * width + x;
  const inB = (x: number, y: number): boolean =>
    x >= 0 && x < width && y >= 0 && y < height;
  const tokens = spec
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const sites: number[] = [];
  // Graph/merged boards (`traj` present) number sites irregularly, so the
  // rectangular `y*width+x` formula below is wrong: a number token is already
  // the play-site id, and a direction token must step through the real board
  // topology (Java resolves track directions via the board graph's relative
  // directions). Walk via the provided `stepper` instead. Falls through to the
  // lattice path when no stepper is supplied (plain rectangular mancala boards).
  if (stepper) {
    let cur = -1;
    for (const tok of tokens) {
      if (tok === "End") {
        sites.push(END);
        break;
      }
      if (tok === "Off") break;
      if (/^<[^>]+:end>$/.test(tok)) {
        cur = width === 1 ? height - 1 : width * height - 1;
        sites.push(cur);
        continue;
      }
      if (/^-?\d+$/.test(tok)) {
        cur = Number(tok) - indexOffset;
        sites.push(cur);
        continue;
      }
      const m = /^([NSEW]+)(\d*)$/.exec(tok);
      if (!m?.[1] || cur < 0) continue;
      const dir = m[1];
      const limit = m[2] ? Number(m[2]) : Number.POSITIVE_INFINITY;
      for (let k = 0; k < limit; k += 1) {
        let nx = stepper(cur, dir);
        // @java Core/src/game/equipment/container/board/Track.java
        // Linear vertex tracks on `(rectangle 1 N)` are written as `"N,W"` in
        // mancala-style puzzles such as Tchoukaillon. The graph trajectory has
        // no geometric west edge on a one-column board, but Java's track parser
        // still walks the linear site ids downward. Mirror that narrow case so
        // the declared track is `N,N-1,...,0` instead of empty after its start.
        if (nx < 0 && width === 1 && dir === "W" && cur > 0) nx = cur - 1;
        if (nx < 0 && width === 1 && dir === "E" && cur < height - 1) nx = cur + 1;
        if (nx < 0) break;
        cur = nx;
        sites.push(cur);
      }
    }
    return sites;
  }
  let cx = 0;
  let cy = 0;
  for (const tok of tokens) {
    if (tok === "End") {
      sites.push(END);
      break;
    }
    if (/^<[^>]+:end>$/.test(tok)) {
      const idx = width === 1 ? height - 1 : width * height - 1;
      cx = idx % width;
      cy = Math.floor(idx / width);
      sites.push(idx);
      continue;
    }
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
    // `End` step (Java Track.java: appends an elem with site == Constants.END).
    // A backgammon/race track that finishes with `End` carries this terminal
    // marker so a piece bears off only by landing exactly on it. Unfilled
    // `#k` placeholders (define called without the End arg) are skipped.
    if (it && isIdent(it) && it.name === "End") {
      sites.push(END);
      continue;
    }
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
  stepper?: (site: number, dir: string) => number,
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
        sites = parseTrackString(tok.value, width, height, indexOffset, stepper);
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
      } else if (isNumber(tok)) {
        // Java Track.java:181 — a bare positional Integer is the @Or `owner`
        // arg: `this.owner = owner.intValue()`. e.g. (track "Track2" "…" 2 …).
        owner = tok.value;
      }
    }
    // Internal-loop detection (Java Track.java:422-478). A "bump" is two
    // *consecutive* elems on the same site; Java collapses those before testing
    // for a recurrence, and only a no-bump track with a non-consecutive repeat
    // is an internal loop. `locToIndex` maps each site to every ring index it
    // occupies — built from `sites` (the ring `(trackSite Move …)` walks), so the
    // OnTrackIndices structure stays self-consistent with the ring TS uses.
    let hasBump = false;
    for (let i = 0; i + 1 < sites.length; i += 1) {
      if (sites[i] === sites[i + 1]) hasBump = true;
    }
    let internalLoop = false;
    if (!hasBump) {
      const seen = new Set<number>();
      for (const s of sites) {
        if (seen.has(s)) {
          internalLoop = true;
          break;
        }
        seen.add(s);
      }
    }
    const locToIndex = new Map<number, number[]>();
    for (let i = 0; i < sites.length; i += 1) {
      const s = sites[i] as number;
      const list = locToIndex.get(s);
      if (list) list.push(i);
      else locToIndex.set(s, [i]);
    }
    tracks.push({
      name,
      sites,
      loop,
      owner,
      trackIdx: tracks.length,
      internalLoop,
      locToIndex,
    });
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
  // `store:None` has no store cells; every other store type (default Outer,
  // Inner, Mixed) gives each of the two players one captured-seed store.
  let storeNone = false;
  let storeInner = false;
  for (let i = 1; i < shape.items.length; i += 1) {
    const tok = shape.items[i];
    if (tok && isIdent(tok) && tok.name === "store:") {
      const v = shape.items[i + 1];
      if (v && isIdent(v) && v.name === "None") storeNone = true;
      if (v && isIdent(v) && v.name === "Inner") storeInner = true;
    }
  }

  // Faithful path for the common two-outer-store board (Java special-cases 2..6
  // rows, non-Inner, exactly two stores): build the actual MancalaBoard graph
  // — `Union(leftStore, rows…, rightStore, connect:true)` on SiteType.Vertex —
  // so site numbering is Java's (leftStore = 0, holes = 1..2N, rightStore =
  // 2N+1) and the track follows the real topology. This removes the old
  // index-offset approximation, which numbered holes 0..2N-1 and appended the
  // stores after the hands (breaking parity against recorded trials).
  // `store:None` builds the same Union[rows…] graph minus the store vertices,
  // so the cross-row proximity edges (which the lattice fallback lacked) are
  // present and N/S track steps resolve. `store:Inner` still falls through to
  // the square/lattice path (Java itself uses Square.construct for Inner).
  if (!storeInner) {
    const g = buildMancalaGraph(rows, cols, !storeNone);
    if (g) {
      const stepper = (site: number, dir: string): number =>
        g.traj.step(site, dir);
      const tracks = parseTracks(shape, g.width, g.height, 0, stepper);
      return {
        width: g.width,
        height: g.height,
        tiling: SQUARE_TILING,
        traj: g.traj,
        numSites: g.numSites,
        numFaces: g.numFaces,
        tracks,
        numStores: 0,
        storeSites: g.storeSites,
      };
    }
    // Fall through to the lattice approximation if the graph build failed.
  }

  const board = assertDims({
    width: cols,
    height: rows,
    tiling: SQUARE_TILING,
  });
  // Lattice fallback (store:None, Inner, or out-of-range rows). For store games
  // Java indexes a left store at cell 0, shifting the playing holes up by one —
  // track literals carry that offset, so subtract it.
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
    if (args.length === 0) return Number.NaN;
    switch (head) {
      case "+":
        return args.reduce((a, b) => a + b, 0);
      case "-":
        return args.length === 1 ? -args[0]! : args.reduce((a, b) => a - b);
      case "*":
        return args.reduce((a, b) => a * b, 1);
      case "/":
        return args.reduce((a, b) => a / b);
      case "%":
        return args.length === 2 && args[1] !== 0 ? args[0]! % args[1]! : Number.NaN;
      case "^":
      case "**":
      case "pow":
        return args.length === 2 ? args[0]! ** args[1]! : Number.NaN;
      case "min":
        return Math.min(...args);
      case "max":
        return Math.max(...args);
      case "abs":
        return args.length === 1 ? Math.abs(args[0]!) : Number.NaN;
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
function parseTriBoard(shape: LudList, board: LudList): ParsedBoard {
  const first = shape.items[1];
  const shapeName =
    first && isIdent(first) ? first.name.toLowerCase() : undefined;
  const nums = collectDims(shape);
  const n1 = nums[0] ?? Number.NaN;
  const n2 = nums[1] ?? n1;

  // Faithful path for the shapes Java's *OnTri generators model exactly
  // (HexagonOnTri / TriangleOnTri / RectangleOnTri / DiamondOnTri). Route them
  // through the planar-graph builder so the compact `reorder()` site numbering
  // and real triangular-lattice adjacency match Java — recorded trials index
  // sites by that numbering. The `onBoard`-mask lattice fallback below kept the
  // full bounding box under a sparse, hole-punched numbering (e.g. 81 sites for
  // `(tri Hexagon 5)` instead of 61), so both site indices and neighbours
  // diverged from Java. Limping is Java `CustomOnTri(dimA, dimA+1)`; Star /
  // custom-polygon outlines are not modelled by genTri, so they keep the lattice
  // approximation below.
  if (
    shapeName === undefined ||
    shapeName === "hexagon" ||
    shapeName === "triangle" ||
    shapeName === "rectangle" ||
    shapeName === "square" ||
    shapeName === "diamond" ||
    shapeName === "prism" ||
    shapeName === "limping"
  ) {
    const g = buildBoardGraph(board);
    if (g) {
      return {
        width: g.width,
        height: g.height,
        tiling: TRI_TILING,
        traj: g.traj,
        numSites: g.numSites,
        numFaces: g.numFaces,
        sideRegions: g.sideRegions,
      };
    }
  }

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
function parseHexBoard(shape: LudList, board: LudList): ParsedBoard {
  const first = shape.items[1];
  const shapeName =
    first && isIdent(first) ? first.name.toLowerCase() : undefined;
  const nums = collectDims(shape);
  const n1 = nums[0] ?? Number.NaN;
  const n2 = nums[1] ?? n1;

  // Faithful path for the single-dimension hexagon `(hex n)` / `(hex Hexagon n)`
  // (Java's HexagonOnHex) and the triangular Y board `(hex Triangle n)` (Java's
  // TriangleOnHex — keep cells where r ≤ c over an n×n hex block, then
  // `reorder()`). Both flow through the same `buildTiling` + `reorder()` planar
  // graph machinery, giving the compact site numbering and real-geometry
  // adjacency the recorded trials use. The lattice/`onBoard`-mask fallback below
  // kept the full `(2n−1)²` bounding box under its own numbering (e.g. 441 sites
  // for `(hex Triangle 11)` instead of 66), so both site indices and neighbours
  // diverged from Java. Other forms — the two-dimension `(hex w h)` (Java
  // CustomOnHex), Rhombus, Rectangle, Diamond, Star — keep the lattice path
  // below, which the existing tests pin.
  if (
    (shapeName === undefined ||
      shapeName === "hexagon" ||
      shapeName === "triangle") &&
    nums.length === 1
  ) {
    const g = buildBoardGraph(board);
    if (g) {
      return {
        width: g.width,
        height: g.height,
        tiling: HEX_TILING,
        traj: g.traj,
        numSites: g.numSites,
        numFaces: g.numFaces,
        sideRegions: g.sideRegions,
      };
    }
  }

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
  // Diamond / Prism (Java DiamondOnHex): a rhombus on the hex tiling. Route
  // through the planar-graph builder so the cell count, real-geometry adjacency
  // and canonical `reorder()` site numbering all match Java — the recorded
  // trials index sites by that numbering. The bounding-hexagon mask below gave
  // the wrong cell count (e.g. 169 instead of 49 for `(hex Diamond 7)`) and a
  // different numbering, so both site indices and neighbours diverged.
  if (shapeName === "diamond" || shapeName === "prism") {
    const g = buildBoardGraph(board);
    if (g) {
      return {
        width: g.width,
        height: g.height,
        tiling: HEX_TILING,
        traj: g.traj,
        numSites: g.numSites,
        numFaces: g.numFaces,
        sideRegions: g.sideRegions,
      };
    }
  }
  // Other named outlines (Triangle / Star / Limping): approximate with a
  // bounding hexagon so the game still compiles and plays.
  const m = hexagonMask(n1);
  return {
    width: m.width,
    height: m.height,
    tiling: HEX_TILING,
    onBoard: m.onBoard,
  };
}

/**
 * Per-game component table. Java parity: `Equipment.components()` is a flat
 * `Component[]` indexed by `what` (1-based; index 0 is the null/empty
 * component). The TS port assigns `what` ids so that the *first* piece type a
 * player owns keeps `what == owner` (single-piece games are then unchanged:
 * `whats` mirrors `cells`), while each *additional* piece type a player owns
 * (chess pawn vs rook vs knight…) gets a fresh id past `numPlayers`. This
 * lets `forEach Piece` dispatch the right generator per occupied site without
 * disturbing the owner==what assumption baked into single-piece games.
 */
interface ComponentTable {
  /** Per-player display label (one per player) for `cellAt().componentLabel`. */
  readonly labels: string[];
  /** Full piece-label ("Pawn1", or bare "Disc") → owning player. */
  readonly owner: Map<string, number>;
  /** Full piece-label → component `what` id. */
  readonly idByLabel: Map<string, number>;
  /** Component `what` id → owning player. */
  readonly ownerById: number[];
  /**
   * Component `what` id → base piece name (the `(piece "Name" …)` string,
   * without the per-player suffix Each-pieces carry). `(forEach Piece "Name")`
   * matches on this — bare labels collide across players (both `(piece
   * "Counter" P1)` and `(piece "Counter" P2)` register label "Counter"), so the
   * label map cannot answer "which components are named Counter?" on its own.
   */
  readonly baseNameById: string[];
  /**
   * Component `what` id → its `(flips a b)` state pair, when the piece declares
   * one. Java: `Component.getFlips()` — read by the `(flip <site>)` effect to
   * toggle a placed piece's local state between the two faces (Reversi/Othello
   * discs, Ludus Latrunculorum's Vagi). Absent entry ⇒ the piece has no flips.
   */
  readonly flipsById: ([number, number] | undefined)[];
  /**
   * Component `what` id → its declared facing direction token (the optional
   * `<dirn>` after the role in `(piece "Toad" P1 E …)`). Java: `Component.
   * getDirn()`, used by `Directions.convertToAbsolute` to rotate relative
   * directions (Forward/Backward/…). Absent entry ⇒ no per-piece facing, so the
   * owning player's `(player <Dir>)` facing (or North) is used instead.
   */
  readonly facingById: (string | undefined)[];
  /**
   * Component `what` id → its turtle-graphics walk(s), when the component is a
   * large piece (`(tile "Name" Owner {F R …} …)`). Java: `Component.walk()` —
   * a non-null walk makes `Component.isLargePiece()` true. Each walk is a list
   * of step tokens (`F` forward, `R`/`L` rotate); a `(tile)` with a single walk
   * `{F}` has one entry, one with `{{…}{…}}` has several (rotation variants).
   * Read by the `(move Add …)`/`(move (from)(to))` compilers to expand a single
   * anchor placement into its multi-cell footprint. Absent entry ⇒ not a large
   * piece (ordinary single-cell component).
   */
  readonly walksById: (string[][] | undefined)[];
}

function parsePieces(equipment: LudList, numPlayers: number): ComponentTable {
  const table: ComponentTable = {
    labels: [],
    owner: new Map<string, number>(),
    idByLabel: new Map<string, number>(),
    ownerById: [],
    baseNameById: [],
    flipsById: [],
    facingById: [],
    walksById: [],
  };
  const byPlayer = new Map<number, string>();
  // Players who already received their primary (id == owner) component.
  const primaryAssigned = new Set<number>();
  const nextId = { value: numPlayers + 1 };
  for (const item of equipment.items) {
    let pieceNode: LudList | undefined;
    // Tiles are first-class components in Java (Tile extends Component), so a
    // `(tile …)` declaration must register an owner/index just like `(piece …)`
    // — otherwise its start placements resolve to no owner and are skipped.
    if (isList(item) && (listHead(item) === "piece" || listHead(item) === "tile"))
      pieceNode = item;
    else if (isList(item) && item.delimiter === "curly") {
      // equipment wrapped in a curly list of entries
      for (const inner of item.items) {
        if (
          isList(inner) &&
          (listHead(inner) === "piece" || listHead(inner) === "tile")
        ) {
          collectPiece(inner, table, byPlayer, numPlayers, primaryAssigned, nextId);
        }
      }
      continue;
    }
    if (pieceNode)
      collectPiece(pieceNode, table, byPlayer, numPlayers, primaryAssigned, nextId);
  }
  for (let p = 1; p <= numPlayers; p += 1) {
    table.labels.push(byPlayer.get(p) ?? `P${p}`);
  }
  return table;
}

/** Register one (label, owner) pair: owner map + a fresh-or-primary `what` id. */
function assignComponent(
  label: string,
  owner: number,
  table: ComponentTable,
  byPlayer: Map<number, string>,
  primaryAssigned: Set<number>,
  nextId: { value: number },
  baseName: string = label,
  flips?: [number, number],
  facing?: string,
  walks?: string[][],
): void {
  table.owner.set(label, owner);
  if (!byPlayer.has(owner)) byPlayer.set(owner, label);
  let id: number;
  if (!primaryAssigned.has(owner)) {
    id = owner;
    primaryAssigned.add(owner);
    // Keep the secondary-id cursor past every primary id. Players 1..N take
    // ids 1..N and the cursor starts at N+1, but the neutral/shared owner is
    // *also* N+1 — so its primary id (N+1) would collide with the first
    // secondary allocation. Bumping the cursor past it gives each extra
    // neutral component (Pentomino's 12 `Shared` tiles, Quixo's blockers) a
    // distinct `what`, while ordinary per-player primaries (id ≤ N < cursor)
    // never trigger the bump and so keep their existing ids.
    if (id >= nextId.value) nextId.value = id + 1;
  } else {
    id = nextId.value;
    nextId.value += 1;
  }
  table.idByLabel.set(label, id);
  table.ownerById[id] = owner;
  table.baseNameById[id] = baseName;
  if (flips) table.flipsById[id] = flips;
  if (facing) table.facingById[id] = facing;
  if (walks) table.walksById[id] = walks;
}

/**
 * Extract the turtle walk(s) from a `(tile "Name" Owner {…} …)` declaration.
 * Java's Tile component stores a `StepType[][] walk`; the .lud gives it as a
 * single curly list of step tokens `{F R F}` (one walk) or a nested list of
 * such lists `{{F R F}{F L F}}` (rotation variants). Returns undefined for an
 * ordinary `(piece …)` or a `(tile …)` with no walk argument, leaving the
 * component single-cell. Only `(tile …)` nodes carry walks in Ludii.
 */
function parseTileWalk(pieceNode: LudList): string[][] | undefined {
  if (listHead(pieceNode) !== "tile") return undefined;
  // The walk is the first curly LudList positional after the name/role; named
  // args (numSides:N) and the name string are skipped by the isList check.
  for (const it of pieceNode.items.slice(2)) {
    if (isList(it) && it.delimiter === "curly") {
      const nested = it.items.length > 0 && it.items.every((s) => isList(s));
      if (nested) {
        const walks: string[][] = [];
        for (const inner of it.items) {
          if (isList(inner)) {
            walks.push(inner.items.filter(isIdent).map((s) => s.name));
          }
        }
        return walks;
      }
      return [it.items.filter(isIdent).map((s) => s.name)];
    }
  }
  return undefined;
}

/** Extract a `(flips a b)` attribute pair from a piece declaration, if present. */
function parsePieceFlips(pieceNode: LudList): [number, number] | undefined {
  for (const n of pieceNode.items) {
    if (isList(n) && listHead(n) === "flips") {
      const a = n.items[1];
      const b = n.items[2];
      if (a && isNumber(a) && b && isNumber(b)) return [a.value, b.value];
    }
  }
  return undefined;
}

function collectPiece(
  pieceNode: LudList,
  table: ComponentTable,
  byPlayer: Map<number, string>,
  numPlayers: number,
  primaryAssigned: Set<number>,
  nextId: { value: number },
): void {
  const labelNode = pieceNode.items[1];
  if (!labelNode || !isString(labelNode)) return;
  const label = labelNode.value;
  // The slot after the name is an optional RoleType keyword; anything else
  // (the move-rules list, or nothing) means no role was given. Java's Piece
  // constructor treats a missing role as `RoleType.Each`, so a bare
  // `(piece "Pawn" <rules>)` is one component per player — register it that
  // way rather than dropping it.
  const roleNode = pieceNode.items[2];
  const hasRole = roleNode !== undefined && isIdent(roleNode);
  const role = hasRole ? (roleNode as { name: string }).name : "Each";
  const flips = parsePieceFlips(pieceNode);
  // Optional facing `<dirn>` follows the role (Java Piece's `dirn` arg →
  // `Component.getDirn()`): `(piece "Toad" P1 E …)` faces East. Relative
  // directions (Forward/Backward) rotate to this per-piece facing.
  const facingNode = hasRole ? pieceNode.items[3] : undefined;
  const facing =
    facingNode !== undefined && isIdent(facingNode) ? facingNode.name : undefined;
  const walks = parseTileWalk(pieceNode);
  if (role === "Each") {
    for (let p = 1; p <= numPlayers; p += 1) {
      assignComponent(`${label}${p}`, p, table, byPlayer, primaryAssigned, nextId, label, flips, facing, walks);
    }
    return;
  }
  // `Shared`/`Neutral` pieces (mancala seeds, neutral blockers) belong to no
  // player. Java maps `RoleType.Shared`/`Neutral` to the neutral player id
  // `numPlayers + 1`; register them under that owner so their start placements
  // (e.g. `(place Stack "Seed" (sites Track) count:2)`) resolve to an owner
  // and actually populate the board — matching the engine's `seedOwner`.
  if (role === "Shared" || role === "Neutral") {
    assignComponent(label, numPlayers + 1, table, byPlayer, primaryAssigned, nextId, label, flips, facing, walks);
    // Java names a neutral/shared component with the player-0 owner suffix:
    // `(piece "Square" Neutral)` becomes component "Square0", and the .lud
    // refers to it by that suffixed name — Quixo's `(id "Square0")` and
    // `(place "Square0" …)`. Register a "<label>0" alias to the same `what` so
    // exact-name lookups (`(id "Square0")`) resolve; the bare label already
    // covers `(place "Square" …)`/`(count "Square" …)` forms.
    const id = table.idByLabel.get(label);
    if (id !== undefined && !table.idByLabel.has(`${label}0`)) {
      table.idByLabel.set(`${label}0`, id);
    }
    return;
  }
  const m = /^P(\d+)$/.exec(role);
  if (m?.[1]) {
    const p = Number(m[1]);
    // Register under the disambiguated `${label}${p}` name, exactly like the
    // `Each` expansion. Java gives every component a unique name by appending
    // the owner index, so two pieces sharing a base name — Asalto's
    // `(piece "Marker" P1 …)` and `(piece "Marker" P2 …)` — become distinct
    // components "Marker1" (what=1) and "Marker2" (what=2). Registering both
    // under the bare label instead let the second overwrite the first, so P1's
    // "Marker1" placements wrongly resolved to P2's `what`.
    assignComponent(`${label}${p}`, p, table, byPlayer, primaryAssigned, nextId, label, flips, facing, walks);
    // First-writer-wins bare alias so a single PN piece placed by its bare name
    // — `(place "King" …)` against `(piece "King" P1)` — still resolves its
    // owner/what. When two pieces share a name the suffixed labels keep them
    // distinct and the alias harmlessly points at the first declaration.
    if (!table.owner.has(label)) {
      const id = table.idByLabel.get(`${label}${p}`);
      if (id !== undefined) {
        table.owner.set(label, p);
        table.idByLabel.set(label, id);
      }
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

/**
 * Per-player facing directions from `(players {(player N) (player S) …})`.
 * Returns a 1-based array (`[0]` unused); an entry is the facing token (N/S/
 * E/W/…) the player declared, or `undefined` for the count form `(players N)`
 * and any player without an explicit `(player <Dir>)`. Java parity:
 * `Game.create` copies each `Player.direction()` onto that player's components,
 * and an undeclared facing defaults to `CompassDirection.N`.
 */
function parsePlayerFacings(
  gameNode: LudList,
  numPlayers: number,
): (string | undefined)[] {
  const facings: (string | undefined)[] = new Array<string | undefined>(
    numPlayers + 1,
  ).fill(undefined);
  const playersNode = child(gameNode, "players");
  if (!playersNode) return facings;
  let idx = 0;
  const scan = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      if (listHead(item) === "player") {
        idx += 1;
        const arg = item.items[1];
        if (idx <= numPlayers && arg && isIdent(arg)) facings[idx] = arg.name;
      } else if (item.delimiter === "curly") scan(item);
    }
  };
  scan(playersNode);
  return facings;
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
  // Java seeds non-board containers after `maxSiteMainBoard = max(numFaces,
  // numPlaySites)`. On a Vertex-play graph board faces outnumber the play
  // sites, so a hand's index lives in Cell space past the board faces.
  const numBoardFaces = parsed.numFaces ?? boardNumSites;
  const cellBase = Math.max(numBoardFaces, boardNumSites);
  const hands = parseHands(equipment, numPlayers, cellBase);
  // Store cells (mancala). On the faithful graph path the stores ARE board
  // vertices (Java cells 0 and 2N+1), so use those ids directly. Otherwise
  // (lattice fallback) they follow the board + hands in the cell array.
  const numStores = parsed.numStores ?? 0;
  const storeBase = cellBase + hands.totalHandSites;
  const stores: number[] = [];
  if (parsed.storeSites && parsed.storeSites.length > 0) {
    stores.push(...parsed.storeSites);
  } else {
    for (let i = 0; i < numStores; i += 1) stores.push(storeBase + i);
  }
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
  board.playerFacing = parsePlayerFacings(gameNode, numPlayers);
  if (parsed.sideRegions) board.sideRegions = parsed.sideRegions;
  const components = parsePieces(equipment, numPlayers);
  board.componentFacing = components.facingById;
  const diceDef = parseDice(equipment);
  const nameNode = gameNode.items[1];
  const name = nameNode && isString(nameNode) ? nameNode.value : "Game";
  return {
    name,
    numPlayers,
    board,
    componentLabels: components.labels,
    pieceOwner: components.owner,
    componentIdByLabel: components.idByLabel,
    componentOwnerById: components.ownerById,
    componentBaseNameById: components.baseNameById,
    componentFlipsById: components.flipsById,
    componentWalkById: components.walksById,
    totalHandSites: hands.totalHandSites,
    totalStoreSites: numStores,
    cellBase,
    diceDef,
  };
}

interface StartPlacement {
  readonly owner: number;
  readonly region: RegionFn;
  /** Component `what` id for the placed piece (Java: the component index).
   * Defaults to `owner` (single-piece-per-player games). */
  readonly what?: number;
  /** Explicit piece count (from `count:` or a `Stack` placement); a counted
   * site holds a pile drawn from one piece at a time. Undefined = a plain
   * single piece (stored count 0, matching prior behaviour). */
  readonly count?: number;
  /** Pile heights from `… counts:{n …}`. For `(place Stack …)` these pair
   * positionally with the region's enumerated sites (Java PlaceMonotonousStack
   * indexes per site). For a PLAIN `(place …)` region, Java PlaceItem sets
   * `countFn = counts[0]` and applies that single count to EVERY site
   * (PlaceItem.java:156 + evalFill), so only the first element is used —
   * {@link stacked} selects which semantics the apply loop uses. Overrides
   * {@link count}. */
  readonly counts?: readonly number[];
  /** True iff parsed from `(place Stack …)`. Selects per-site `counts`
   * indexing (stack) vs Java PlaceItem's broadcast of `counts[0]` to all
   * region sites (plain place). */
  readonly stacked?: boolean;
  /** Local site state to seed (Java: ContainerState.state) from `state:N`.
   * Undefined leaves the site state at 0. */
  readonly state?: number;
  /** Per-site piece value to seed (Java: ContainerState.value) from `value:N`.
   * Quarto encodes a piece's 4th attribute here. Undefined leaves it at 0. */
  readonly value?: number;
  /** Per-site piece rotation to seed (Java: ContainerState.rotation) from
   * `rotation:N`. Ploy and Kriegsspiel encode initial piece orientation here.
   * Undefined leaves the rotation at 0. */
  readonly rotation?: number;
  /** `(place Random {label} count:N)` — instead of placing one piece at every
   * region site, draw {@link count} *empty* sites at random from the region
   * (one piece each) using the context RNG. The draw sequence reproduces Java's
   * `PlaceRandom` (`site = emptySites[rng.nextInt(emptySites.length)]`), so with
   * the trial's recorded seed the chosen sites match Java's initial placement. */
  readonly random?: boolean;
  /**
   * `(place Stack items:{…} <loc>)` — an ordered list of (owner, what) pairs,
   * bottom-to-top, building a genuine per-level stack at the placement's single
   * site (Java PlaceCustomStack). When present the apply loop seeds a real
   * `stacks[]`/`whatStacks[]` entry rather than the flat single-piece slot, so a
   * buried piece keeps a distinct `what` from the piece above it.
   */
  readonly stackItems?: readonly { owner: number; what: number }[];
}

/** `(start (set Count n to:<region>))` — seed every site in the region.
 * Java's `SetCount` start rule holds `count` as an `IntFunction`, evaluated
 * once in the start context — so compound expressions like
 * `(- (- (* 4 cols) 2) (* 2 (- cols 1)))` (Muvalavala/Luena seed totals) work,
 * not just integer literals. */
interface CountPlacement {
  readonly count: IntFn;
  readonly region: RegionFn;
}

/** `(start (set RememberValue "name"? <region>))` — seed a remembered set. */
interface RememberPlacement {
  readonly name: string;
  readonly region: RegionFn;
}

/** `(start (set Cost n [<type>] at:<site>|to:<region>))` — seed graph weights. */
interface CostPlacement {
  readonly cost: number;
  readonly region: RegionFn;
}

/** Deduction-puzzle `(start (set {{site value}...}))` givens. */
interface PuzzleValuePlacement {
  readonly site: number;
  readonly value: number;
}

/** `(start (place "Label" "Hand" count:N))` — seed a player's hand site(s)
 * with N pieces, so placement games can later move pieces out of the hand. */
interface HandSeed {
  readonly owner: number;
  readonly count: number;
}

/** `(start (set Team <id> {P1 P3 …}))` — assign players to a team. Java:
 * game.rules.start.set.players.SetTeam → ActionAddPlayerToTeam per player. */
interface TeamAssignment {
  readonly team: number;
  readonly players: readonly number[];
}

/** `(start (set Hidden ...))` — seed per-player hidden flags. */
interface HiddenPlacement {
  readonly players: readonly number[];
  readonly region: RegionFn;
  readonly hidden: boolean;
}

interface StartRules {
  readonly placements: StartPlacement[];
  readonly counts: CountPlacement[];
  readonly remembers: RememberPlacement[];
  readonly handSeeds: HandSeed[];
  readonly costs: CostPlacement[];
  readonly teams: TeamAssignment[];
  readonly puzzleValues: PuzzleValuePlacement[];
  readonly hidden: HiddenPlacement[];
}

/**
 * Move-generating ludeme heads — the set the `compileMoves` switch in compile.ts
 * accepts as a `Moves` generator (minus `flips`, which on a component is the
 * flip-state attribute `(flips a b)`, not a move). Used to locate the optional
 * `Moves generator` positional arg of a `(tile …)`, which may sit after walk /
 * `numSides:` / `slots:` / `(path …)` attributes.
 */
const MOVE_LUDEME_HEADS: ReadonlySet<string> = new Set([
  "move", "select", "leap", "forEach", "do", "or", "and", "priority", "roll",
  "max", "min", "satisfy", "avoidStoredState", "add", "seq", "while", "set",
  "sow", "if", "step", "slide", "hop", "vote", "propose", "fromTo", "remember",
  "forget", "append", "custodial", "trigger", "remove", "firstMoveOnTrack",
]);

/**
 * Visit every move-bearing component entry, descending the equipment curly
 * group. Both `(piece …)` and `(tile …)` are first-class `Component`s in Java
 * (Tile extends Component) and either may carry a `Moves generator` — e.g.
 * Dōbutsu Shogi's `(tile "Giraffe" Each ("StepMove" Orthogonal))` or Chex's
 * `(tile "Pawn" Each numSides:4 (or …))`. A `(tile …)` with only a turtle-walk
 * shape ({F R L B} / "LWalk") has no generator and is skipped by the caller.
 */
function forEachPiece(equipment: LudList, cb: (piece: LudList) => void): void {
  const scan = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      const head = listHead(item);
      if (head === "piece" || head === "tile") cb(item);
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
  const byWhat = env.pieceMovesByWhat;
  const idByLabel = env.componentIdByLabel;
  forEachPiece(equipment, (piece) => {
    const isTile = listHead(piece) === "tile";
    const labelNode = piece.items[1];
    const label = labelNode && isString(labelNode) ? labelNode.value : undefined;
    // The slot after the name is an optional RoleType keyword. Anything that
    // is not an ident (a moves list, or absent) means no role was declared.
    // Java's Piece constructor treats that as `RoleType.Each`; Tile defaults to
    // `RoleType.Shared` (Tile.java: `(role == null) ? RoleType.Shared : role`).
    const roleNode = piece.items[2];
    const hasRole = roleNode !== undefined && isIdent(roleNode);
    const role = hasRole
      ? (roleNode as { name: string }).name
      : isTile
        ? "Shared"
        : "Each";
    let movesNode: LudNode | undefined;
    if (isTile) {
      // Tile grammar `(tile <label> [<role>] [<walk>] [numSides:…] [slots:…]
      // [(path …)] [(flips …)] [<generator>] …)`. The optional Moves generator
      // is the round-paren child whose head is a move-generating ludeme (defines
      // such as StepMove/SlideMove have already expanded to move/or/do/… heads).
      // Walks ({F R F} / "LWalk"), numSides:/slots: named args and (path …)/
      // (flips …) attributes are not move ludemes and so are skipped. A shape-
      // only tile has no such child and contributes no move generator.
      movesNode = piece.items
        .slice(2)
        .find(
          (n): n is LudList =>
            isList(n) &&
            n.delimiter === "round" &&
            MOVE_LUDEME_HEADS.has(listHead(n) ?? ""),
        );
    } else {
      // With an explicit role the moves node follows it (items[3]); without one
      // the moves node IS items[2]. The grammar then allows an optional
      // facing-direction ident (e.g. `S` in `(piece "Fox" P1 S (or …))`) before
      // the moves list, plus an optional leading `(flips a b)` attribute node —
      // both are skipped here so the move generator is still located. Faithful to
      // Java's piece grammar `(piece <label> [<role>] [<dirn>] [(flips …)] <moves>)`.
      let mi = hasRole ? 3 : 2;
      while (mi < piece.items.length && isIdent(piece.items[mi] as LudNode)) {
        mi += 1;
      }
      const rawMovesNode = piece.items[mi];
      movesNode =
        rawMovesNode && isList(rawMovesNode) && listHead(rawMovesNode) === "flips"
          ? piece.items[mi + 1]
          : rawMovesNode;
    }
    if (!movesNode || !isList(movesNode)) {
      // Piece defined with no move generator (Chessence's `(piece "King" Each)`
      // — "kings do not move"). Record its component `what` id(s) so the bare
      // `(forEach Piece)` dispatch skips it instead of falling back to a sibling
      // piece's generator. Mirror the role→what resolution used below.
      const noMove = env.componentsWithoutMoves;
      if (noMove && label) {
        if (role === "Each") {
          for (let p = 1; p <= env.numPlayers; p += 1) {
            const id = idByLabel?.get(`${label}${p}`);
            if (id !== undefined) noMove.add(id);
          }
        } else if (role === "Shared" || role === "Neutral") {
          const id = idByLabel?.get(label);
          if (id !== undefined) noMove.add(id);
        } else {
          const pid = playerOfRole(role);
          const id = pid !== undefined ? idByLabel?.get(`${label}${pid}`) : undefined;
          if (id !== undefined) noMove.add(id);
        }
      }
      return;
    }
    const moves = compileMoves(movesNode, env);
    if (role === "Each") {
      for (let p = 1; p <= env.numPlayers; p += 1) {
        byOwner.set(p, moves);
        // Per-component dispatch: each player owns a distinct "<label><p>"
        // component, so register its generator under that component's `what`.
        const id = label ? idByLabel?.get(`${label}${p}`) : undefined;
        if (id !== undefined) byWhat?.set(id, moves);
      }
      return;
    }
    if (role === "Shared" || role === "Neutral") {
      // Shared/Neutral pieces belong to the neutral owner `numPlayers + 1`
      // (matching `collectPiece`'s placement assignment). Register the move
      // generator under that owner — and the bare-label component id, since
      // such pieces are placed by their bare name — so `(forEach Piece Shared)`
      // can dispatch the rule. Without this the generator was never registered
      // (`playerOfRole("Shared")` is undefined) and Slimetrail's Snail produced
      // no moves, leaving only a forced Pass.
      const owner = env.numPlayers + 1;
      byOwner.set(owner, moves);
      const id = label ? idByLabel?.get(label) : undefined;
      if (id !== undefined) byWhat?.set(id, moves);
      return;
    }
    const pid = playerOfRole(role);
    if (pid !== undefined) {
      byOwner.set(pid, moves);
      // Per-component dispatch must use the disambiguated `${label}${pid}` id,
      // matching `collectPiece`. Two pieces sharing a base name (Asalto's
      // `(piece "Marker" P1 …)` / `(piece "Marker" P2 …)`) both resolve the bare
      // "Marker" alias to the *first* component's id, so keying byWhat on the
      // bare label let P2's rule overwrite P1's — the officer then lost its
      // HopCapture half and only kept StepToEmpty.
      const id = label ? idByLabel?.get(`${label}${pid}`) : undefined;
      if (id !== undefined) byWhat?.set(id, moves);
    }
  });
}

/** Union two region functions into one (dedup at eval time). */
function unionRegions(a: RegionFn | undefined, b: RegionFn): RegionFn {
  if (!a) return b;
  return {
    eval: (ctx) => {
      const set = new Set<number>(a.eval(ctx));
      for (const s of b.eval(ctx)) set.add(s);
      return [...set];
    },
  };
}

/** Register `(regions <Role> <region>)` declarations into the env. */
function compileRegions(equipment: LudList, env: CompileEnv): void {
  const regions = env.playerRegions;
  const byName = env.namedRegions;
  const byNamePlayer = env.namedPlayerRegions;
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
        const pid =
          roleNode && isIdent(roleNode) ? playerOfRole(roleNode.name) : undefined;
        if (named && nameNode && isString(nameNode)) {
          const rName = nameNode.value;
          // A bare-name lookup `(sites "Name")` keeps the union of all owners'
          // regions of that name (last-write would lose P1's when P2's is
          // declared); a role-scoped lookup `(sites Mover "Name")` reads the
          // per-player table below.
          byName?.set(rName, unionRegions(byName.get(rName), regionFn));
          if (pid !== undefined && byNamePlayer) {
            let perPlayer = byNamePlayer.get(rName);
            if (!perPlayer) {
              perPlayer = new Map<number, RegionFn>();
              byNamePlayer.set(rName, perPlayer);
            }
            perPlayer.set(pid, unionRegions(perPlayer.get(pid), regionFn));
          }
        }
        // A player may declare several (unnamed) regions; union rather than
        // overwrite so `(sites Mover)` sees them all.
        if (pid !== undefined) {
          regions.set(pid, unionRegions(regions.get(pid), regionFn));
          // Also keep the regions *un-unioned* for `(is Connected <Role>)`,
          // which must count how many distinct owned regions a group reaches.
          // `(regions P1 {A B})` declares two goal regions, not one: split the
          // curly array into individual region fns (Java's RegionFunction[]).
          const list = env.playerRegionList?.get(pid) ?? [];
          if (
            regionNode &&
            isList(regionNode) &&
            regionNode.delimiter === "curly" &&
            regionNode.items.every((it) => isList(it))
          ) {
            for (const sub of regionNode.items) {
              if (isList(sub)) list.push(compileRegion(sub, env));
            }
          } else {
            list.push(regionFn);
          }
          env.playerRegionList?.set(pid, list);
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
function compileMap(
  equipment: LudList,
  env: CompileEnv,
  staticCtx: EvalContext,
): void {
  const storeMap = env.playerStoreMap;
  const ordered = env.orderedMaps as
    | Array<{ name?: string; map: Map<number, number> }>
    | undefined;
  if (!storeMap && !ordered) return;
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
    // Java `Map.computeMap` evaluates the key/value as an IntFunction in an
    // initial context — so list expressions like `(id "Pawn" P1)`,
    // `(handSite P1 2)` or `(mapEntry …)` resolve to a concrete site/component
    // id. A result of OFF (-1) means "no entry"; Java skips such pairs (after a
    // string/coordinate fallback already handled above), so return undefined.
    if (isList(node)) {
      const v = compileInt(node, env).eval(staticCtx);
      return v === OFF ? undefined : v;
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
          ordered?.push({ name: nameNode.value, map: named });
        } else {
          if (storeMap) {
            for (const [k, v] of pairs) storeMap.set(k, v);
          }
          ordered?.push({ map: new Map<number, number>(pairs) });
        }
      } else if (item.delimiter === "curly") {
        scanEquip(item);
      }
    }
  };
  scanEquip(equipment);
}

function parsePuzzleValueRange(
  equipment: LudList,
): { min: number; max: number } | undefined {
  let found: { min: number; max: number } | undefined;
  const scan = (node: LudList): void => {
    if (found) return;
    if (listHead(node) === "values") {
      for (const item of node.items) {
        if (isList(item) && listHead(item) === "range") {
          const min = item.items[1];
          const max = item.items[2];
          if (min && max && isNumber(min) && isNumber(max)) {
            found = { min: min.value, max: max.value };
            return;
          }
        }
      }
    }
    for (const item of node.items) if (isList(item)) scan(item);
  };
  scan(equipment);
  return found;
}

function parseDeductionRegionTypes(equipment: LudList): string[] {
  const out: string[] = [];
  const scan = (node: LudList): void => {
    if (listHead(node) === "regions") {
      const arg = node.items[1];
      const items = arg && isList(arg) && arg.delimiter === "curly" ? arg.items : [arg];
      for (const item of items) if (item && isIdent(item)) out.push(item.name);
    }
    for (const item of node.items) if (isList(item)) scan(item);
  };
  scan(equipment);
  return out;
}

function parseDeductionHints(
  equipment: LudList,
): { sites: readonly number[]; hint?: number }[] {
  const hints: { sites: readonly number[]; hint?: number }[] = [];
  const scan = (node: LudList): void => {
    if (listHead(node) === "hint") {
      const first = node.items[1];
      const second = node.items[2];
      if (first && isList(first) && first.delimiter === "curly") {
        const sites: number[] = [];
        for (const n of first.items) if (isNumber(n)) sites.push(n.value);
        hints.push({
          sites,
          hint: second && isNumber(second) ? second.value : undefined,
        });
      } else if (first && isNumber(first)) {
        hints.push({
          sites: [first.value],
          hint: second && isNumber(second) ? second.value : undefined,
        });
      }
      return;
    }
    for (const item of node.items) if (isList(item)) scan(item);
  };
  scan(equipment);
  return hints;
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
  // @java Core/src/game/equipment/component/Piece.java
  // A missing role means RoleType.Each. In a one-player game Java still lets
  // placements use the bare component name; this port registers the concrete
  // component as "<label>1", so bridge that unambiguous case here.
  if (env.numPlayers === 1) {
    const onlyPlayer = env.pieceOwner.get(`${label}1`);
    if (onlyPlayer !== undefined) return onlyPlayer;
  }
  const m = /^(.*?)(\d+)$/.exec(label);
  if (m?.[1] !== undefined && m[2] !== undefined && env.pieceOwner.has(m[1])) {
    return Number(m[2]);
  }
  return undefined;
}

/**
 * Resolve a `(place "Label" …)` label to its component `what` id, using the
 * same label/suffix scheme as {@link resolvePlacementOwner}. Returns undefined
 * when the label isn't a known component (placement then defaults `what` to the
 * owner, preserving single-piece-per-player behaviour).
 */
function resolvePlacementWhat(
  label: string,
  env: CompileEnv,
): number | undefined {
  const map = env.componentIdByLabel;
  if (!map) return undefined;
  const direct = map.get(label);
  if (direct !== undefined) return direct;
  // @java Core/src/game/equipment/component/Piece.java
  // Bare labels for one-player RoleType.Each pieces resolve to that sole
  // player's component, mirroring resolvePlacementOwner() above.
  if (env.numPlayers === 1) {
    const onlyPlayer = map.get(`${label}1`);
    if (onlyPlayer !== undefined) return onlyPlayer;
  }
  // The Ludii convention names the placement `"<base><playerIndex>"` even when
  // the component is registered under the bare base label — e.g. a Neutral
  // `(piece "Disc" …)` is registered as "Disc" but placed as "Disc0", and a
  // `(piece "King" P1)` is registered as "King" but placed as "King1". Strip
  // the trailing player-index digits and look up the base component so the
  // per-site `what` is the real component id (non-zero), not the owner default.
  // For owned single-type pieces this equals the owner; for Neutral/Shared and
  // multi-type players it recovers the distinct component id.
  const m = /^(.*?)(\d+)$/.exec(label);
  if (m?.[1] !== undefined && m[2] !== undefined) {
    const base = map.get(m[1]);
    if (base !== undefined) return base;
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
  // Prefer the per-player `Each` expansion: a label registered as `${label}1`,
  // `${label}2`, … seeds every one of those players, because Java places each
  // player's own piece into their own hand. This takes precedence over a bare
  // label registration so a piece declared BOTH `Each` and `Neutral` (e.g.
  // Shibumi "Ball") still seeds the player hands rather than collapsing onto
  // the single Neutral owner (numPlayers+1).
  const owners: number[] = [];
  for (let p = 1; p <= env.numPlayers; p += 1) {
    const owner = env.pieceOwner.get(`${label}${p}`);
    if (owner !== undefined) owners.push(owner);
  }
  if (owners.length > 0) return owners;
  const direct = resolvePlacementOwner(label, env);
  return direct !== undefined ? [direct] : [];
}

/**
 * Resolve a `(set <RoleType> <SiteType>? <region>)` start rule's role to the
 * `(owner, what)` it places — Java `game.rules.start.set.sites.SetSite.eval`.
 *
 *  - `P1..Pn` → owner = the player index, `what` = that player's primary
 *    component id (id == owner in this port). When the game declares no pieces
 *    Java auto-creates `"Ball"+pid` with index == pid (Equipment.java), so the
 *    `what = p` fallback matches that synthetic component.
 *  - `Neutral` / `Shared` / `All` → the neutral/shared owner (`numPlayers + 1`
 *    in this port), `what` = the first component registered with that owner
 *    (the declared `(piece … Neutral|Shared)`). With no such component Java's
 *    SetSite places nothing, so we return undefined.
 *
 * Returns undefined for unrecognised roles or a missing required component, so
 * the placement is simply skipped (Java's no-op path).
 */
function resolveStartRoleOwnerWhat(
  role: string,
  env: CompileEnv,
): { owner: number; what: number } | undefined {
  const ownerById = env.componentOwnerById ?? [];
  const firstComponentOwnedBy = (owner: number): number => {
    for (let id = 1; id < ownerById.length; id += 1) {
      if (ownerById[id] === owner) return id;
    }
    return 0;
  };
  if (role === "Neutral" || role === "Shared" || role === "All") {
    const owner = env.numPlayers + 1;
    const what = firstComponentOwnedBy(owner);
    return what > 0 ? { owner, what } : undefined;
  }
  const m = /^P(\d+)$/.exec(role);
  if (m?.[1] !== undefined) {
    const p = Number(m[1]);
    if (p < 1 || p > env.numPlayers) return undefined;
    const found = firstComponentOwnedBy(p);
    return { owner: p, what: found > 0 ? found : p };
  }
  return undefined;
}

/** Read a `name:<int>` argument from a ludeme's item list (e.g. `count:3`). */
function readNamedInt(items: readonly LudNode[], name: string): number | undefined {
  const idx = items.findIndex((n) => isIdent(n) && n.name === `${name}:`);
  if (idx < 0) return undefined;
  const v = items[idx + 1];
  return v && isNumber(v) ? v.value : undefined;
}

/** Read a named curly int-list argument (e.g. `counts:{5 5 5 5}`). */
function readNamedIntList(
  items: readonly LudNode[],
  name: string,
): number[] | undefined {
  const idx = items.findIndex((n) => isIdent(n) && n.name === `${name}:`);
  if (idx < 0) return undefined;
  const v = items[idx + 1];
  if (!v || !isList(v) || v.delimiter !== "curly") return undefined;
  return v.items.filter(isNumber).map((n) => n.value);
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

/** The element space a board plays on by default (`use:Vertex|Edge`, else Cell). */
function boardDefaultPlayType(
  equipment: LudList | undefined,
): "Cell" | "Vertex" | "Edge" {
  if (!equipment) return "Cell";
  // Java MancalaBoard builds/plays on vertices (the holes / stores are graph
  // vertices, while hands stay Cell sites). Treat it as Vertex-played so bare
  // `(count at:...)` / `(place ... <SiteType> ...)` semantics match recorded
  // sow-game trials.
  if (childDeep(equipment, "mancalaBoard")) return "Vertex";
  const board = childDeep(equipment, "board");
  if (!board) return "Cell";
  if (boardUsesEdge(board)) return "Edge";
  if (boardUsesVertex(board)) return "Vertex";
  return "Cell";
}

/**
 * Parse `(start { (place "Label" <region>) … })` into placements. The
 * piece label resolves to its owning player via the env's piece-owner map.
 *
 * `boardDefault` is the board's own play type. A `(place "L" <SiteType> <region>)`
 * keyword that *matches* it is a redundant marker we can skip (the region's
 * indices/coords already address that element space). A keyword that *differs*
 * (e.g. `(place "Counter2" Cell …)` on a `use:Vertex` board — Guerrilla Checkers
 * seeds checkers onto the squares of a vertex-played board) is a genuine
 * cross-element placement the flat placement path can't resolve correctly, so it
 * is left to fall through (as before this routing existed) rather than mis-placed.
 */
function parseStartPlacements(
  startNode: LudList,
  env: CompileEnv,
  boardDefault: "Cell" | "Vertex" | "Edge" = "Cell",
): StartRules {
  const placements: StartPlacement[] = [];
  const counts: CountPlacement[] = [];
  const remembers: RememberPlacement[] = [];
  const handSeeds: HandSeed[] = [];
  const costs: CostPlacement[] = [];
  const teams: TeamAssignment[] = [];
  const puzzleValues: PuzzleValuePlacement[] = [];
  const hidden: HiddenPlacement[] = [];
  const scan = (node: LudList): void => {
    for (const item of node.items) {
      if (!isList(item)) continue;
      const head = listHead(item);
      if (head === "place") {
        // An optional leading `Stack` keyword — `(place Stack "Label" …)` —
        // shifts the label/region one slot to the right. Stacked placement is
        // modelled as a counted pile on the target site (same as `count:`).
        const head1 = item.items[1];
        // `(place Random <region>? {labels} count:N state:N value:N)` — Java
        // PlaceRandom (board-region form). Java loops over each named label and
        // draws `count` empty sites from the region via `rng.nextInt`, placing
        // one piece per draw; start() reproduces the draw sequence from the
        // trial's recorded seed so the chosen sites match Java's recorded
        // initial placement. The stack form (`(place Random {labels} <where>)`)
        // and `randPiecOrder` are not modelled here. Without this, the label is
        // read as the bare `Random` ident, `isString` fails, and the whole
        // placement is silently dropped (empty board → forced Pass at ply 0).
        if (head1 !== undefined && isIdent(head1) && head1.name === "Random") {
          // Collect positional args after `Random`, skipping `name:value` pairs.
          const positional: LudNode[] = [];
          for (let i = 2; i < item.items.length; i += 1) {
            const n = item.items[i];
            if (n === undefined) continue;
            if (isIdent(n) && /:$/.test(n.name)) {
              i += 1; // skip the value following a `name:` keyword
              continue;
            }
            positional.push(n);
          }
          const labels: string[] = [];
          let randRegionNode: LudNode | undefined;
          for (const n of positional) {
            if (
              isList(n) &&
              n.delimiter === "curly" &&
              n.items.length > 0 &&
              n.items.every(isString)
            ) {
              for (const s of n.items) if (isString(s)) labels.push(s.value);
            } else if (isString(n)) {
              labels.push(n.value);
            } else if (isList(n)) {
              randRegionNode = n; // an optional leading region
            }
          }
          const randCount = readNamedInt(item.items, "count") ?? 1;
          const randState = readNamedInt(item.items, "state");
          const randValue = readNamedInt(item.items, "value");
          // Default region = every board site (Java SitesBoard of the default
          // play type): the flat path numbers board cells 0..numSites−1.
          let randRegion: RegionFn;
          if (randRegionNode && isList(randRegionNode)) {
            try {
              randRegion = compileRegion(randRegionNode, env);
            } catch {
              randRegion = { eval: () => [] };
            }
          } else {
            randRegion = {
              eval: (ctx) => {
                const out: number[] = [];
                for (let i = 0; i < ctx.board.numSites; i += 1) out.push(i);
                return out;
              },
            };
          }
          // One placement per label, processed in array order — Java's outer
          // `for (it : item)` loop, each independently re-filtering empties.
          for (const label of labels) {
            const owner = resolvePlacementOwner(label, env);
            if (owner === undefined) continue;
            placements.push({
              owner,
              what: resolvePlacementWhat(label, env),
              count: randCount,
              state: randState,
              value: randValue,
              region: randRegion,
              random: true,
            });
          }
          continue;
        }
        const stacked = head1 !== undefined && isIdent(head1) && head1.name === "Stack";
        // `(place Stack items:{"A" "B" …} <loc>)` — Java PlaceCustomStack builds
        // a real per-level stack at a SINGLE site: items[0] is the bottom piece,
        // items[last] the top. Each label resolves to its own (owner, what) so a
        // buried piece keeps a distinct component from the one above it — Tower of
        // Hanoi's Counter9/Counter4 disks, the snakes-and-ladders pawn piles. The
        // flat single-`what` placement below cannot represent this, so handle it
        // first (the structure has no single label token: item.items[2] is the
        // `items:` keyword, which is why these placements were silently dropped).
        const itemsNode = stacked
          ? readNamedNode(item.items, "items")
          : undefined;
        if (
          stacked &&
          itemsNode &&
          isList(itemsNode) &&
          itemsNode.delimiter === "curly"
        ) {
          const stackItems: { owner: number; what: number }[] = [];
          for (const labelN of itemsNode.items) {
            if (!isString(labelN)) continue;
            const owner = resolvePlacementOwner(labelN.value, env);
            if (owner === undefined) continue;
            stackItems.push({
              owner,
              what: resolvePlacementWhat(labelN.value, env) ?? owner,
            });
          }
          // Location: `coord:"A1"` (chess-style), a bare integer site, or a
          // region/IntFunction expression (e.g. `(handSite Mover)`).
          let region: RegionFn | undefined;
          const coordNode = readNamedNode(item.items, "coord");
          if (coordNode && isString(coordNode)) {
            const cr = parseCoordColRow(coordNode.value);
            if (cr) {
              region = {
                eval: (ctx) => {
                  const s = ctx.board.siteAtLabel(cr.col, cr.row);
                  return s >= 0 ? [s] : [];
                },
              };
            }
          } else {
            // First positional (non-keyword) token after `Stack`, skipping a
            // redundant SiteType marker that matches the board's own play type.
            let locNode: LudNode | undefined;
            for (let i = 2; i < item.items.length; i += 1) {
              const node = item.items[i];
              if (node === undefined) continue;
              if (isIdent(node) && /:$/.test(node.name)) {
                i += 1; // skip keyword and its value (items:{…}, count:N, …)
                continue;
              }
              if (isIdent(node) && node.name === boardDefault) continue;
              locNode = node;
              break;
            }
            if (locNode && isNumber(locNode)) {
              const site = locNode.value;
              region = { eval: () => [site] };
            } else if (locNode && isList(locNode)) {
              try {
                region = compileRegion(locNode, env);
              } catch {
                /* unsupported start location — drop this placement */
              }
            }
          }
          if (region && stackItems.length > 0) {
            const top = stackItems[stackItems.length - 1];
            placements.push({
              owner: top?.owner ?? 0,
              what: top?.what,
              region,
              stackItems,
            });
          }
          continue;
        }
        const labelNode = item.items[stacked ? 2 : 1];
        // An optional SiteType keyword (Cell/Vertex/Edge) may sit between the
        // label and the region — `(place "Stick1" Edge (mapEntry "Start" P1))`
        // (Tasholiwe and the Zuni/Arabic stick-dice race family seed their
        // pieces onto edge sites this way). When the keyword matches the board's
        // own play type it is a redundant parse marker: the region's indices
        // already address that element space (a `use:Edge` race board numbers
        // its edges 0..N−1), so skip it, else the region is mis-read as the bare
        // ident and the placement is silently dropped (no piece on board →
        // `forEach Piece` finds nothing → Pass at ply 0). A keyword that DIFFERS
        // from the board default (`(place "Counter2" Cell …)` on a `use:Vertex`
        // board) is a genuine cross-element placement the flat path can't resolve
        // — leave it to fall through rather than mis-place onto the wrong space.
        let regionIdx = stacked ? 3 : 2;
        const maybeType = item.items[regionIdx];
        if (
          maybeType !== undefined &&
          isIdent(maybeType) &&
          maybeType.name === boardDefault
        ) {
          regionIdx += 1;
        }
        const regionNode = item.items[regionIdx];
        const countArg = readNamedInt(item.items, "count");
        // `(place Stack "Goat" (sites {…}) counts:{n …})` — per-site pile
        // heights paired positionally with the region's sites (hunt-family
        // boards seed several piece-piles at once, e.g. Bagh goats).
        const countsArg = readNamedIntList(item.items, "counts");
        // `(place "Disc0" <region> state:N)` — seed each placed piece's local
        // site state (Java: ContainerState.state). Neutral flip-piece games
        // (Reversi/Rolit) encode ownership in the state; chess uses it for
        // castling/en-passant flags. Undefined leaves the state at 0.
        const stateArg = readNamedInt(item.items, "state");
        // `(place "Disc1" <site> value:N)` — seed the placed piece's value
        // (Java: ContainerState.value). Quarto's 16 hand pieces split on this.
        const valueArg = readNamedInt(item.items, "value");
        // `(place "Commander1" coord:"E1" rotation:N)` — seed the placed
        // piece's rotation (Java: ContainerState.rotation). Ploy and
        // Kriegsspiel encode initial piece orientation here.
        const rotationArg = readNamedInt(item.items, "rotation");
        // `(place "Label" "Hand" [count:N])` — seed the named player's hand
        // rather than a board region, so placement games (Achi, morris, …)
        // have pieces to move out of the hand at ply 0.
        if (
          labelNode &&
          isString(labelNode) &&
          regionNode &&
          isString(regionNode) &&
          /^Hand\d*$/.test(regionNode.value)
        ) {
          // `"HandN"` names player N's hand directly (Java container "HandN");
          // bare `"Hand"` falls back to the label's owner (e.g. "Marker2").
          const m = /^Hand(\d+)$/.exec(regionNode.value);
          if (m) {
            handSeeds.push({ owner: Number(m[1]), count: countArg ?? 1 });
          } else {
            for (const owner of resolvePlacementOwners(labelNode.value, env)) {
              handSeeds.push({ owner, count: countArg ?? 1 });
            }
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
              what: resolvePlacementWhat(labelNode.value, env),
              count: countArg,
              state: stateArg,
              value: valueArg,
              rotation: rotationArg,
              region: {
                eval: (ctx) => {
                  const s = ctx.board.siteAtLabel(cr.col, cr.row);
                  return s >= 0 ? [s] : [];
                },
              },
            });
          }
          continue;
        }
        // `(place Stack "Goat2" 6 count:8)` — a bare integer names a single
        // site directly (no `(sites …)` wrapper). Common in hunt-family seeds.
        if (labelNode && isString(labelNode) && regionNode && isNumber(regionNode)) {
          const owner = resolvePlacementOwner(labelNode.value, env);
          if (owner !== undefined) {
            const site = regionNode.value;
            placements.push({
              owner,
              what: resolvePlacementWhat(labelNode.value, env),
              count: countArg,
              counts: countsArg,
              stacked,
              state: stateArg,
              value: valueArg,
              rotation: rotationArg,
              region: { eval: () => [site] },
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
                what: resolvePlacementWhat(labelNode.value, env),
                count: countArg,
                counts: countsArg,
                stacked,
                state: stateArg,
                value: valueArg,
                rotation: rotationArg,
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
        if (sub && isList(sub) && sub.delimiter === "curly") {
          // Deduction puzzle givens: (set { {site value} ... }).
          // @java Core/src/game/rules/start/deductionPuzzle/Set.java
          for (const pair of sub.items) {
            if (!isList(pair) || pair.delimiter !== "curly") continue;
            const siteNode = pair.items[0];
            const valueNode = pair.items[1];
            if (siteNode && valueNode && isNumber(siteNode) && isNumber(valueNode)) {
              puzzleValues.push({ site: siteNode.value, value: valueNode.value });
            }
          }
          continue;
        }
        if (sub && isIdent(sub) && sub.name === "Hidden") {
          // @java Core/src/game/rules/start/set/hidden/SetHidden.java
          // Banqi starts every board site face-down for both players. The TS
          // replay engine stores the hidden subtypes in one per-player matrix;
          // that is enough for legal flip-vs-move generation.
          const { positional, named } = parseArgs(item.items.slice(2));
          const regionNode = positional.find(
            (n) =>
              isList(n) &&
              !(n.delimiter === "curly" && n.items.every((it) => isIdent(it))),
          );
          const valueNode = positional.find(
            (n) => isIdent(n) && (n.name === "True" || n.name === "False"),
          );
          const toNode = named.get("to") ?? named.get("To");
          const players: number[] = [];
          if (toNode && isIdent(toNode)) {
            if (toNode.name === "All" || toNode.name === "Each") {
              for (let p = 1; p <= env.numPlayers; p += 1) players.push(p);
            } else {
              const p =
                toNode.name === "P1"
                  ? 1
                  : toNode.name === "P2"
                    ? 2
                    : toNode.name === "P3"
                      ? 3
                      : toNode.name === "P4"
                        ? 4
                        : /^P\d+$/.test(toNode.name)
                          ? Number(toNode.name.slice(1))
                          : undefined;
              if (p !== undefined && p >= 1 && p <= env.numPlayers) players.push(p);
            }
          }
          if (regionNode && players.length > 0) {
            hidden.push({
              players,
              region: compileRegion(regionNode, env),
              hidden: !(valueNode && isIdent(valueNode) && valueNode.name === "False"),
            });
          }
          continue;
        }
        // (set <RoleType> <SiteType>? <region>) — fill every site of a region
        // with a player/neutral/shared piece (Java SetSite). This is how the
        // graph-theory family (Nein Ari, Ciri Amber, OddEvenTree, …) seeds its
        // edges before play removes them: `(set Neutral Edge (sites Board Edge))`,
        // `(set P1 Edge (sites {0..9}))`. The role ident is distinct from the
        // Count/Cost/RememberValue/Team keyword subs, so match it first.
        const roleOwnerWhat =
          sub && isIdent(sub)
            ? resolveStartRoleOwnerWhat(sub.name, env)
            : undefined;
        if (roleOwnerWhat) {
          // An optional SiteType keyword (Edge/Vertex/Cell) may sit between the
          // role and the region. When it matches the board's own play type the
          // region's indices already address that element space, so consume the
          // token and read the region after it; a keyword that DIFFERS from the
          // board default is a cross-element placement the flat site array can't
          // resolve, so skip the placement rather than mis-place it.
          let regionIdx = 2;
          const maybeType = item.items[regionIdx];
          let typeMismatch = false;
          if (maybeType !== undefined && isIdent(maybeType)) {
            if (maybeType.name === boardDefault) regionIdx += 1;
            else typeMismatch = true;
          }
          const regionNode = item.items[regionIdx];
          if (!typeMismatch && regionNode && isList(regionNode)) {
            try {
              placements.push({
                owner: roleOwnerWhat.owner,
                what: roleOwnerWhat.what,
                region: compileRegion(regionNode, env),
              });
            } catch {
              /* unsupported start region — skip placement */
            }
          }
        } else if (sub && isIdent(sub) && sub.name === "RememberValue") {
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
          // The count is an IntFunction in Java (SetCount), so a literal int OR
          // a compound expression like `(- (- (* 4 cols) 2) (* 2 (- cols 1)))`.
          // Compile it once; eval at start-application time (constant in
          // practice, but faithful to Java's per-rule single evaluation).
          // `(set Count n at:<site>)` — seed a single hole by index (used by
          // mancala starting layouts that vary one pit at a time).
          const atNode = readNamedNode(item.items, "at");
          if (nNode && atNode && isNumber(atNode)) {
            const site = atNode.value;
            counts.push({
              count: compileInt(nNode, env),
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
            if (nNode && regionNode && isList(regionNode)) {
              counts.push({
                count: compileInt(nNode, env),
                region: compileRegion(regionNode, env),
              });
            }
          }
        } else if (sub && isIdent(sub) && sub.name === "Cost") {
          // `(set Cost <n> [<SiteType>] at:<site>|to:<region>)` — graph weight.
          // @java game.rules.start.set.sites.SetCost. The cost is items[2]; the
          // optional SiteType ident is dropped (single graph-play type). The
          // target is `at:<site>` (a bare int) or a `to:`/`in:` region.
          const nNode = item.items[2];
          if (nNode && isNumber(nNode)) {
            const atNode = readNamedNode(item.items, "at");
            if (atNode && isNumber(atNode)) {
              const site = atNode.value;
              costs.push({ cost: nNode.value, region: { eval: () => [site] } });
            } else {
              const toIdx = item.items.findIndex(
                (n) => isIdent(n) && (n.name === "to:" || n.name === "in:"),
              );
              const regionNode =
                toIdx >= 0 ? item.items[toIdx + 1] : undefined;
              if (regionNode && isList(regionNode)) {
                try {
                  costs.push({
                    cost: nNode.value,
                    region: compileRegion(regionNode, env),
                  });
                } catch {
                  /* unsupported region — skip */
                }
              }
            }
          }
        } else if (sub && isIdent(sub) && sub.name === "Team") {
          // `(set Team <id> {P1 P3 …})` — assign the listed players to a team.
          // @java game.rules.start.set.players.SetTeam. The team id is items[2];
          // the players are role idents in a following curly group (or listed
          // positionally). Resolve `Pn` idents to their player index; other role
          // forms are skipped (teams are only used by explicit `Pn` listings).
          const idNode = item.items[2];
          if (idNode && isNumber(idNode)) {
            const roleNodes: LudNode[] = [];
            for (let i = 3; i < item.items.length; i += 1) {
              const n = item.items[i];
              if (n && isList(n) && n.delimiter === "curly") {
                roleNodes.push(...n.items);
              } else if (n) {
                roleNodes.push(n);
              }
            }
            const players: number[] = [];
            for (const rn of roleNodes) {
              if (isIdent(rn)) {
                const m = /^P(\d+)$/.exec(rn.name);
                if (m) players.push(Number(m[1]));
              }
            }
            if (players.length > 0) teams.push({ team: idNode.value, players });
          }
        }
      } else if (head === "forEach") {
        // `(forEach Value min:N max:M (set RememberValue (value)))` — a start
        // loop that remembers each integer in [N, M]. Java's StartRule.eval
        // runs the body once per value; for the RememberValue body that just
        // seeds the remembered set with the range, which `(values Remembered)`
        // / `(is In (site) (values Remembered))` later read.
        const kindNode = item.items[1];
        const isValue = kindNode && isIdent(kindNode) && kindNode.name === "Value";
        const body = item.items.find(
          (n) => isList(n) && listHead(n) === "set",
        );
        const setsRemember =
          body &&
          isList(body) &&
          (() => {
            const sub = body.items[1];
            return sub && isIdent(sub) && sub.name === "RememberValue";
          })();
        if (isValue && setsRemember) {
          const min = readNamedInt(item.items, "min") ?? 1;
          const max = readNamedInt(item.items, "max");
          if (max !== undefined && max >= min) {
            const values: number[] = [];
            for (let v = min; v <= max; v += 1) values.push(v);
            remembers.push({ name: "", region: { eval: () => values } });
          }
        }
      } else if (item.delimiter === "curly") {
        scan(item);
      }
    }
  };
  scan(startNode);
  return { placements, counts, remembers, handSeeds, costs, teams, puzzleValues, hidden };
}

export class LudemeGame implements Game {
  /** Java parity: `Constants.DEFAULT_TURN_LIMIT`. */
  private static readonly DEFAULT_TURN_LIMIT = 1250;
  /** Java parity: `Constants.DEFAULT_MOVES_LIMIT`. */
  private static readonly DEFAULT_MOVES_LIMIT = 10000;

  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers: number;
  public readonly width: number;
  public readonly height: number;
  public readonly componentLabels: readonly string[];
  /**
   * Component `what` id → its large-piece turtle walk(s) (Java:
   * `Component.walk`). Used by `start()` to lay a tile's full footprint when a
   * `(place …)` rule seeds a large piece on the board (Java:
   * `ActionAdd.applyLargePiece`). Empty for games without `(tile …)` pieces.
   */
  private readonly componentWalkById: readonly (readonly string[][] | undefined)[];

  private readonly board: InterpBoard;
  private readonly totalHandSites: number;
  private readonly totalStoreSites: number;
  /** Cell-array index where hands/stores begin (`max(numFaces, numSites)`). */
  private readonly cellBase: number;
  private readonly numDice: number;
  private readonly seedOwner: number;
  private readonly playMoves: MovesFn;
  private readonly phaseList: readonly CompiledPhase[];
  /** Each player's starting phase index (1-based; [0] unused). */
  private readonly initialPhases: readonly number[];
  private readonly endRules: readonly EndRule[];
  private readonly placements: readonly StartPlacement[];
  private readonly countPlacements: readonly CountPlacement[];
  private readonly costPlacements: readonly CostPlacement[];
  private readonly rememberPlacements: readonly RememberPlacement[];
  private readonly handSeeds: readonly HandSeed[];
  private readonly teamPlacements: readonly TeamAssignment[];
  private readonly puzzleValuePlacements: readonly PuzzleValuePlacement[];
  private readonly hiddenPlacements: readonly HiddenPlacement[];
  /** Java parity: whether this game uses real per-level stacks. */
  private readonly isStacking: boolean;
  /** Java parity: `GameType.NotAllPass` (e.g. explicit `(move Pass)`). */
  private readonly notAllPass: boolean;
  /** Java parity: `Game.maxTurnLimit` / `Game.maxMovesLimit` defaults. */
  private readonly maxTurnLimit: number;
  private readonly maxMovesLimit: number;
  /**
   * Java parity: `Game.requiresVisited()` — true when the game uses
   * `(is Visited …)` (set while compiling that ludeme). Drives the per-turn
   * `visited` accumulation in {@link apply}.
   */
  private readonly requiresVisited: boolean;

  public constructor(gameNode: LudList, id?: string) {
    const parsed = parseGame(gameNode);
    this.name = parsed.name;
    this.id = id ?? parsed.name;
    this.numPlayers = parsed.numPlayers;
    this.board = parsed.board;
    this.totalHandSites = parsed.totalHandSites;
    this.totalStoreSites = parsed.totalStoreSites;
    this.cellBase = parsed.cellBase;
    this.numDice = parsed.diceDef?.numDice ?? 0;
    // Seeds (mancala) are a count-bearing, owner-agnostic component. Use a
    // sentinel owner just past the real players so a seeded hole reads as
    // occupied without colliding with any player's pieces.
    this.seedOwner = parsed.numPlayers + 1;
    this.width = parsed.board.width;
    this.height = parsed.board.height;
    this.componentLabels = parsed.componentLabels;
    this.componentWalkById = parsed.componentWalkById;

    const visitedFlag = { required: false };
    const notAllPassFlag = { required: false };
    // Java `Game.isStacking()` — decides whether `(remove)` clears a whole site
    // (flat count-piles, e.g. mancala pits) or pops one piece (stacking games,
    // e.g. Bagh goat stacks, Murus Gallicus). See gameUsesStacking above.
    const isStacking = gameUsesStacking(gameNode);
    this.isStacking = isStacking;
    const equipment = child(gameNode, "equipment");
    const env: CompileEnv = {
      board: parsed.board,
      numPlayers: parsed.numPlayers,
      boardDefaultSiteType: boardDefaultPlayType(equipment),
      visitedFlag,
      notAllPassFlag,
      isStacking,
      pieceOwner: parsed.pieceOwner,
      componentIdByLabel: parsed.componentIdByLabel,
      componentOwnerById: parsed.componentOwnerById,
      componentBaseNameById: parsed.componentBaseNameById,
      componentFlipsById: parsed.componentFlipsById,
      componentWalkById: parsed.componentWalkById,
      playerRegions: new Map<number, RegionFn>(),
      playerRegionList: new Map<number, RegionFn[]>(),
      namedRegions: new Map<string, RegionFn>(),
      namedPlayerRegions: new Map<string, Map<number, RegionFn>>(),
      pieceMovesByOwner: new Map<number, MovesFn>(),
      pieceMovesByWhat: new Map<number, MovesFn>(),
      componentsWithoutMoves: new Set<number>(),
      diceDef: parsed.diceDef,
      startSitesByOwner: new Map<number, readonly number[]>(),
      startSitesByComponent: new Map<number, readonly number[]>(),
      sowSeedOwner: this.seedOwner,
      playerStoreMap: new Map<number, number>(),
      namedMaps: new Map<string, Map<number, number>>(),
      orderedMaps: [],
      deductionConstraints: [],
      deductionConstraintDepth: { depth: 0 },
      deductionRegionTypes: equipment ? parseDeductionRegionTypes(equipment) : [],
      deductionHints: equipment ? parseDeductionHints(equipment) : [],
      puzzleValueRange: equipment ? parsePuzzleValueRange(equipment) : undefined,
    };

    if (equipment) {
      compilePieceMoves(equipment, env);
      compileRegions(equipment, env);
      // Java `Map.computeMap` evaluates each pair's key/value IntFunction once
      // in a fresh initial `Context`. Build the equivalent minimal context (an
      // empty start state) so map keys/values written as `(id "Pawn" P1)`,
      // `(handSite P1 2)`, etc. resolve to their static ints rather than being
      // dropped. Reuses the same scaffolding as the placement-region resolver.
      const mapCells = new Array<number>(
        this.cellBase + this.totalHandSites + this.totalStoreSites,
      ).fill(0);
      const mapDice =
        this.numDice > 0 ? new Array<number>(this.numDice).fill(0) : undefined;
      const mapState0 = new State(1, mapCells, this.componentLabels, {
        numPlayers: this.numPlayers,
        diceValues: mapDice,
        // Java State.tempValue starts at UNDEFINED (-1). Compiled `.lud` games
        // read bare `(var)` through this global slot, so seed it here too.
        temps: [-1],
      });
      const mapTrial0 = new Trial([], false, -1).saveState(mapState0);
      const mapCtx = new EvalContext(
        new Context(this, mapState0, mapTrial0),
        this.board,
      );
      compileMap(equipment, env, mapCtx);
    }

    const rules = child(gameNode, "rules");
    if (!rules) throw new Error("LudemeGame: game has no (rules …).");
    this.phaseList = parsePhases(rules, env);
    // Phase 0 is the entry phase; keep a direct handle for the common
    // single-phase fast path and for any code that pre-dates phase switching.
    this.playMoves = (this.phaseList[0] as CompiledPhase).play;
    // A player starts in the first phase whose role includes them (Java:
    // Phase.owner). `(phase "Placement" P1 …)` only applies to player 1, so a
    // second player whose only matching phase is "Movement" begins there.
    this.initialPhases = computeInitialPhases(this.phaseList, this.numPlayers);
    const end = child(rules, "end");
    this.endRules = end ? compileEnd(end, env) : [];
    const start = child(rules, "start");
    const startRules = start
      ? parseStartPlacements(start, env, boardDefaultPlayType(equipment))
      : {
          placements: [],
          counts: [],
          remembers: [],
          handSeeds: [],
          costs: [],
          teams: [],
          puzzleValues: [],
          hidden: [],
        };
    this.placements = startRules.placements;
    this.countPlacements = startRules.counts;
    this.costPlacements = startRules.costs;
    this.rememberPlacements = startRules.remembers;
    this.handSeeds = startRules.handSeeds;
    this.teamPlacements = startRules.teams;
    this.puzzleValuePlacements = startRules.puzzleValues;
    this.hiddenPlacements = startRules.hidden;

    // Resolve each placement region once against an empty start state and
    // group the resulting sites by owner, so `(sites Start …)` in the play
    // and end rules has the initial layout to read from.
    if (this.placements.length > 0 && env.startSitesByOwner) {
      const cells = new Array<number>(
        this.cellBase + this.totalHandSites + this.totalStoreSites,
      ).fill(0);
      const diceValues =
        this.numDice > 0 ? new Array<number>(this.numDice).fill(0) : undefined;
      const state0 = new State(1, cells, this.componentLabels, {
        numPlayers: this.numPlayers,
        diceValues,
        temps: [-1],
      });
      const trial0 = new Trial([], false, -1).saveState(state0);
      const evalCtx = new EvalContext(
        new Context(this, state0, trial0),
        this.board,
      );
      for (const { owner, region, what } of this.placements) {
        const sites = region.eval(evalCtx);
        const existing = env.startSitesByOwner.get(owner) ?? [];
        env.startSitesByOwner.set(owner, [...existing, ...sites]);
        // Java SitesStart keys by component index (`startingPos().get(index)`);
        // mirror that with a component-keyed map. Use `what ?? owner` — exactly
        // the value written to `state.whats` below — so a `(sites Start (piece
        // (what at:(from))))` lookup keys on the same index `(what at:…)` reads.
        if (env.startSitesByComponent) {
          const comp = what ?? owner;
          const prev = env.startSitesByComponent.get(comp) ?? [];
          env.startSitesByComponent.set(comp, [...prev, ...sites]);
        }
      }
    }

    // All ludemes (equipment moves, play, end, start) have now been compiled,
    // so the visited flag reflects whether `(is Visited …)` appears anywhere.
    this.notAllPass = notAllPassFlag.required;
    this.maxTurnLimit = LudemeGame.DEFAULT_TURN_LIMIT;
    this.maxMovesLimit = LudemeGame.DEFAULT_MOVES_LIMIT;
    this.requiresVisited = visitedFlag.required;
  }

  public get numSites(): number {
    return this.board.numSites;
  }

  public start(rng?: SeededRng): Context {
    const cells = new Array<number>(
      this.cellBase + this.totalHandSites + this.totalStoreSites,
    ).fill(0);
    const diceValues =
      this.numDice > 0 ? new Array<number>(this.numDice).fill(0) : undefined;
    // Seed per-player starting phases when any player begins outside phase 0
    // (role-restricted phases, e.g. hunt-family `(phase "Placement" P1 …)`).
    const phases = this.initialPhases.some((p) => p !== 0)
      ? [...this.initialPhases]
      : undefined;
    // `(set Team …)` seeds each listed player's team into the per-player value
    // array (Java: ActionAddPlayerToTeam → valuePlayer). Threat detection and
    // team roles read this to tell allies from enemies.
    let valuesPlayer: number[] | undefined;
    if (this.teamPlacements.length > 0) {
      // Unassigned players default to UNDEFINED (-1), as Java fills the array
      // before `(set Team …)` overwrites the listed players with their (positive)
      // team id. "No team" therefore reads -1; teammate tests must use `> 0`.
      valuesPlayer = new Array<number>(this.numPlayers + 1).fill(-1);
      for (const { team, players } of this.teamPlacements) {
        for (const p of players) {
          if (p >= 1 && p <= this.numPlayers) valuesPlayer[p] = team;
        }
      }
    }
    let state = new State(1, cells, this.componentLabels, {
      numPlayers: this.numPlayers,
      diceValues,
      phases,
      temps: [-1],
      valuesPlayer,
    });
    if (
      this.placements.length > 0 ||
      this.countPlacements.length > 0 ||
      this.costPlacements.length > 0 ||
      this.rememberPlacements.length > 0 ||
      this.handSeeds.length > 0 ||
      this.hiddenPlacements.length > 0
    ) {
      const trial0 = new Trial([], false, -1).saveState(state);
      const evalCtx = new EvalContext(
        new Context(this, state, trial0),
        this.board,
      );
      const placed = [...cells];
      const counts = new Array<number>(placed.length).fill(0);
      // Per-site graph weight (Java: topology element cost) — `(set Cost …)`.
      const costsArr = new Array<number>(placed.length).fill(0);
      // Per-site component id (Java: ContainerState.what), populated alongside
      // the owner so heterogeneous-piece games dispatch the right generator.
      const whats = new Array<number>(placed.length).fill(0);
      // Per-site local state (Java: ContainerState.state) — `(place … state:N)`.
      const states = new Array<number>(placed.length).fill(0);
      // Per-site piece value (Java: ContainerState.value) — `(place … value:N)`.
      const values = new Array<number>(placed.length).fill(0);
      // Per-site piece rotation (Java: ContainerState.rotation) — `(place … rotation:N)`.
      // Ploy/Kriegsspiel encode initial piece orientation here.
      const rotations = new Array<number>(placed.length).fill(0);
      // Per-player hidden flags (Java ContainerState hidden What/Who/etc.).
      const hiddenForPlayer = Array.from(
        { length: this.numPlayers + 1 },
        () => new Array<boolean>(placed.length).fill(false),
      );
      // Real per-level stacks seeded by `(place Stack items:{…})` (Java
      // PlaceCustomStack). Sparse: a non-null entry is a distinct-piece stack at
      // that site (owners + parallel whats, bottom→top); every other site keeps
      // the flat cells-derived single level. Only materialised into the State's
      // `stacks`/`whatStacks` options when at least one such stack was placed.
      const stackOwners: (number[] | null)[] = new Array(placed.length).fill(
        null,
      );
      const stackWhats: (number[] | null)[] = new Array(placed.length).fill(
        null,
      );
      let anyItemStack = false;
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
      for (const { owner, region, count, counts: perSite, stacked, what, state: st, value: val, rotation: rot, random, stackItems } of this
        .placements) {
        // `(place Stack items:{…} <loc>)` — lay a genuine per-level stack at the
        // placement's single site (items[0] bottom … items[last] top). Sets the
        // cell to the top owner, `whats[]` to the top component, and records the
        // full owner/what columns so a buried piece keeps its own identity.
        if (stackItems && stackItems.length > 0) {
          for (const site of region.eval(evalCtx)) {
            if (site < 0 || site >= placed.length) continue;
            const owners = stackItems.map((it) => it.owner);
            const ws = stackItems.map((it) => it.what);
            stackOwners[site] = owners;
            stackWhats[site] = ws;
            placed[site] = owners[owners.length - 1] ?? 0;
            whats[site] = ws[ws.length - 1] ?? 0;
            // Height rides in the stack length (max(stackLen, count, 1)); leave
            // countAt at its default 0 so it never overstates the pile — Java's
            // real per-level stacks (Lasca/Focus) keep count at the default too.
            anyItemStack = true;
          }
          continue;
        }
        // `(place Random {label} count:N)` — faithful Java PlaceRandom: snapshot
        // the region's empty sites, then draw `count` times, placing one piece
        // per draw and removing the drawn site (`site = emptySites[rng.nextInt(
        // emptySites.length)]; sites.remove(site)`). The same stateful RNG the
        // harness seeds from the trial reproduces Java's exact chosen sites.
        if (random) {
          const placeRng = rng ?? evalCtx.context.rng;
          const whatId = what ?? owner;
          const empties: number[] = [];
          for (const s of region.eval(evalCtx)) {
            if (s >= 0 && s < placed.length && placed[s] === 0 && whats[s] === 0) {
              empties.push(s);
            }
          }
          const n = count ?? 1;
          for (let i = 0; i < n; i += 1) {
            if (empties.length === 0) break;
            const drawIdx = placeRng.nextInt(empties.length);
            const site = empties[drawIdx];
            empties.splice(drawIdx, 1);
            if (site === undefined) continue;
            placed[site] = owner;
            whats[site] = whatId;
            if (st !== undefined) states[site] = st;
            if (val !== undefined) values[site] = val;
            if (rot !== undefined) rotations[site] = rot;
          }
          continue;
        }
        let idx = 0;
        const placeWalks = this.componentWalkById[what ?? owner];
        for (const site of region.eval(evalCtx)) {
          if (site >= 0 && site < placed.length) {
            const existingCount = counts[site] ?? 0;
            const existingOwner = placed[site] ?? 0;
            if (this.isStacking && existingCount > 0 && existingOwner > 0) {
              const existingWhat = whats[site] || existingOwner;
              const owners = stackOwners[site]
                ? [...(stackOwners[site] as number[])]
                : Array.from({ length: existingCount }, () => existingOwner);
              const ws = stackWhats[site]
                ? [...(stackWhats[site] as number[])]
                : Array.from({ length: existingCount }, () => existingWhat);
              owners.push(owner);
              ws.push(what ?? owner);
              stackOwners[site] = owners;
              stackWhats[site] = ws;
              placed[site] = owner;
              whats[site] = what ?? owner;
              counts[site] = 0;
              anyItemStack = true;
              if (st !== undefined) states[site] = st;
              if (val !== undefined) values[site] = val;
              if (rot !== undefined) rotations[site] = rot;
              idx += 1;
              continue;
            }
            placed[site] = owner;
            whats[site] = what ?? owner;
            if (st !== undefined) states[site] = st;
            if (val !== undefined) values[site] = val;
            if (rot !== undefined) rotations[site] = rot;
            // Pile height. Java PlaceItem.java:156 sets countFn =
            // counts[0] (a single fn) and evalFill applies it to EVERY region
            // site — so a plain `(place … counts:{N})` broadcasts counts[0] to
            // all sites. Per-site indexing of the counts[] array is exclusive
            // to `(place Stack …)` (PlaceMonotonousStack/PlaceCustomStack).
            const c = perSite ? (stacked ? perSite[idx] : perSite[0]) : count;
            if (c !== undefined) counts[site] = c;
            // Large piece (`(tile …)`) seeded on the board: lay its full
            // footprint so every covered cell reads as occupied (Java:
            // ActionAdd.applyLargePiece sets `setCount(loc, 1)` for every loc
            // and removes them from the empty set, leaving who/what == 0 on the
            // body cells — only the anchor carries owner/what/state, set above).
            // Body cells are therefore count-only; `isOccupiedSite` reads the
            // count so they stay out of `(sites Empty)`, while `(sites Occupied
            // by:…)` (registered-piece based) does not mistake them for pieces.
            // Only for on-board anchors — a tile placed in a hand (site ≥
            // numSites, e.g. Pentomino) has no board footprint.
            if (placeWalks && placeWalks.length > 0 && site < this.board.numSites) {
              const fp = largePieceFootprint(this.board, site, st ?? 0, placeWalks);
              if (fp) {
                for (const cell of fp) {
                  if (cell >= 0 && cell < placed.length) counts[cell] = 1;
                }
              }
            }
          }
          idx += 1;
        }
      }
      // Deduction puzzle givens: store the numeric value directly in the
      // flat what/who slot, matching ActionSet's runtime representation.
      for (const { site, value } of this.puzzleValuePlacements) {
        if (site >= 0 && site < placed.length) {
          placed[site] = value;
          whats[site] = value;
        }
      }
      // `(set Count n to:region)` seeds each hole; mark it occupied by the
      // seed sentinel and carry the per-site count separately. The count is an
      // IntFunction (Java SetCount) evaluated once per rule in the start ctx.
      for (const { count, region } of this.countPlacements) {
        const n = count.eval(evalCtx);
        for (const site of region.eval(evalCtx)) {
          if (site >= 0 && site < placed.length) {
            counts[site] = n;
            if (n > 0 && placed[site] === 0) placed[site] = this.seedOwner;
          }
        }
      }
      // `(set Cost n at:<site>|to:<region>)` seeds graph weights, read by
      // `(cost …)` (Java: SetCost start rule → topology element cost).
      for (const { cost, region } of this.costPlacements) {
        for (const site of region.eval(evalCtx)) {
          if (site >= 0 && site < costsArr.length) costsArr[site] = cost;
        }
      }
      // `(set RememberValue "name"? <region>)` seeds the named remembered set
      // with the region's site indices (Java: SetRememberValue start rule).
      const remembered = new Map<string, readonly number[]>();
      for (const { name, region } of this.rememberPlacements) {
        const cur = remembered.get(name) ?? [];
        remembered.set(name, [...cur, ...region.eval(evalCtx)]);
      }
      // `(set Hidden ... to:Pk)` start rules seed face-down information.
      for (const h of this.hiddenPlacements) {
        for (const site of h.region.eval(evalCtx)) {
          if (site < 0 || site >= placed.length) continue;
          for (const player of h.players) {
            const row = hiddenForPlayer[player];
            if (row) row[site] = h.hidden;
          }
        }
      }
      // Materialise the per-level stacks only when a `(place Stack items:{…})`
      // actually built one. Stacked sites carry their full owner/what columns;
      // every other site mirrors State.fillStacks' default (a flat single level
      // for an occupied cell, empty otherwise) so nothing else changes.
      let stacksOpt: number[][] | undefined;
      let whatStacksOpt: number[][] | undefined;
      if (anyItemStack) {
        stacksOpt = [];
        whatStacksOpt = [];
        for (let i = 0; i < placed.length; i += 1) {
          const so = stackOwners[i];
          if (so) {
            stacksOpt.push(so);
            whatStacksOpt.push(stackWhats[i] ?? []);
          } else {
            const c = placed[i] ?? 0;
            stacksOpt.push(c === 0 ? [] : [c]);
            whatStacksOpt.push([]);
          }
        }
      }
      state = new State(1, placed, this.componentLabels, {
        numPlayers: this.numPlayers,
        diceValues,
        countAt: counts,
        costAt: costsArr.some((v) => v !== 0) ? costsArr : undefined,
        whats,
        stacks: stacksOpt,
        whatStacks: whatStacksOpt,
        stateAt: states.some((v) => v !== 0) ? states : undefined,
        valueAt: values.some((v) => v !== 0) ? values : undefined,
        // @java Core/src/game/rules/start/set/sites/SetSite.java — Java's start
        // placement calls cs.setSite(…, rotation, …) which writes the per-site
        // rotation into ContainerState. Seed it here from `rotation:N` args.
        rotationAt: rotations.some((v) => v !== 0) ? rotations : undefined,
        hiddenForPlayer: hiddenForPlayer.some((row) => row.some(Boolean))
          ? hiddenForPlayer
          : undefined,
        phases,
        temps: [-1],
        remembered: remembered.size > 0 ? remembered : undefined,
        valuesPlayer,
      });
    }
    // Internal-loop track games (Pachisi/Ludo/Barjis …) need the per-state
    // `OnTrackIndices` structure so `(trackSite Move …)` can disambiguate a
    // repeated track site by the piece's real index (Java State.java:496 only
    // allocates this when `hasInternalLoopInTrack`). For every other game
    // `buildTrackLocToIndex` returns undefined and this is a no-op — the state's
    // `onTrackIndices` stays absent and the consult keeps its first-occurrence
    // scan. Build it last, off the fully-placed state, so the scan reads the
    // same what/count resolution the consult later uses.
    const trackLocToIndex = buildTrackLocToIndex(this.board.tracks);
    if (trackLocToIndex) {
      // `what` is the 1-based component index (Java components()[0] is the null
      // "no piece" slot, so the dense lane count is realComponents + 1) — TS
      // `componentLabels` drops that null slot, hence the `+ 1`.
      const onTrackIndices = buildInitialOnTrackIndices(
        this.board.tracks,
        trackLocToIndex,
        this.componentLabels.length + 1,
        (s) => state.whatAtSite(s),
        (s) => state.countAtSite(s),
        state.cells.length,
      );
      state = state.withTrackIndices(onTrackIndices, trackLocToIndex);
    }
    const trial = new Trial([], false, -1).saveState(state);
    return new Context(this, state, trial, rng);
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
    const generated = this.playFor(context.state).generate(evalCtx);
    if (generated.length > 0) return generated;
    // Java parity (Trial.setLegalMoves): an alternating-move game with no
    // legal move gets a single *forced* Pass so the turn can advance. Without
    // it, a player who has rolled but is blocked on every die (backgammon
    // family) — or whose board has filled (Tic-Tac-Toe) — would have nothing
    // to play and the trial would stall. The recorded Java trials include
    // these `forced=true` Pass moves, so emitting one keeps replay in step.
    return [this.forcedPassMove(context.state.mover)];
  }

  /**
   * The mover's raw legal moves — the play rules' output without the synthetic
   * forced Pass {@link moves} appends. Java parity: the `canMove` / phase-eval
   * path that `computeStalemated` and `(no Moves …)` use.
   */
  public legalMovesRaw(context: Context): readonly Move[] {
    if (context.over) return [];
    const evalCtx = new EvalContext(context, this.board);
    return this.playFor(context.state).generate(evalCtx);
  }

  /**
   * Build the forced Pass move for `mover` (Java `Game.createPassMove(player,
   * true)`): a single decision `ActionPass`, reported with from/to = -1.
   */
  private forcedPassMove(mover: number): Move {
    const pass = new ActionPass();
    pass.setDecision(true);
    return new Move({
      id: `pass:${mover}`,
      label: "Pass",
      siteIndices: [0],
      mover,
      placedOwner: mover,
      actions: [pass],
    });
  }

  /**
   * Java parity: `Context.allPass()`. True when each of the last `numPlayers`
   * recorded moves is a Pass — i.e. every player passed on their previous turn.
   * (The Java version walks per-turn; for the one-decision-per-turn games this
   * port handles, last-`numPlayers`-moves is equivalent.) Drives the implicit
   * all-pass draw terminator in {@link apply}.
   */
  private allPassed(trial: Trial, currentMover: number): boolean {
    const moves = trial.moves;
    const n = this.numPlayers;
    if (n <= 0 || moves.length === 0) return false;
    if (n === 1) return moves[moves.length - 1]?.isPass() ?? false;

    const lastMove = moves[moves.length - 1];
    if (!lastMove) return false;
    let lastMover = currentMover;
    let reverseIndex = moves.length - 2;
    let passMove = lastMove.isPass();
    let countMovesTurn = 1;

    // Walk backward across the previous turn of each OTHER player, seeding the
    // scan with the current move's own pass/non-pass status. A same-player
    // replay chain (>1 move before the mover changes) disqualifies the all-pass
    // draw even if its tail move was Pass.
    for (let i = 1; i < n; i += 1) {
      while (true) {
        if (reverseIndex < 0) {
          return false;
        }
        if (countMovesTurn > 1) return false;

        const move = moves[reverseIndex--];
        if (!move) return false;
        if (lastMover !== move.mover) {
          if (!passMove) return false;
          lastMover = move.mover;
          countMovesTurn = 1;
          passMove = move.isPass();
          break;
        }

        countMovesTurn += 1;
        passMove = move.isPass();
      }
    }

    return passMove;
  }

  /**
   * Java parity: `Game.requiresAllPass()` — true unless the game carries the
   * `NotAllPass` flag, which Java sets for hand-dice games (`hasHandDice`).
   * Only all-pass games end via the implicit all-pass draw terminator; dice
   * games run until an explicit end rule fires.
   */
  private requiresAllPass(): boolean {
    return this.numDice === 0 && !this.notAllPass;
  }

  /**
   * Java parity: the implicit all-pass draw lives inside `End.eval()`, and
   * `Game.applyInternal()` only calls `End.eval()` when the mover's phase has
   * an explicit `(end …)` or the game has a game-level `(end …)`. A refill
   * phase with only `(nextPhase (all Passed) …)` and no end rules must NOT
   * auto-draw just because every player passed while re-seeding mancala pits.
   */
  private hasEndEvalForPhase(phaseIdx: number): boolean {
    const phase = this.phaseList[phaseIdx];
    return (phase?.endRules.length ?? 0) > 0 || this.endRules.length > 0;
  }

  /**
   * Java parity: `Game.checkMaxTurns(context)`. Trials end in a draw when they
   * hit the global turn or move cap, using the same defaults as Java's
   * `Game.maxTurnLimit` / `Game.maxMovesLimit`.
   */
  private hitMaxTurnsOrMoves(evalTrial: Trial, state: State): boolean {
    return (
      state.numTurn >= this.maxTurnLimit * this.numPlayers ||
      evalTrial.numMoves - evalTrial.numInitialPlacementMoves >= this.maxMovesLimit
    );
  }

  private nextActivePlayer(state: State, start: number): number {
    if (this.numPlayers <= 0) return 0;
    let next = ((start - 1 + this.numPlayers) % this.numPlayers) + 1;
    for (let i = 0; i < this.numPlayers; i += 1) {
      if (state.activePlayer(next)) return next;
      next = (next % this.numPlayers) + 1;
    }
    return next;
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
    let placed = move.applyTo(base, context.rng);

    // Deferred sequence-capture flush (Java: Move.apply store-path —
    // `if (store && hasSequenceCapture() && !containsReplayAction(...))`).
    // A `(remove … at:EndOfTurn)` marks jumped pieces in `sitesToRemove`
    // instead of clearing them; they linger on the board so a flying king
    // cannot re-hop or land on them. Once the turn actually ends — i.e. the
    // move does NOT keep the same player moving (no `(moveAgain)`/same-player
    // `next` override) — the marked pieces are removed for real and the queue
    // cleared. This must run before the end rules, exactly as Java applies it
    // inside Move.apply ahead of applyInternal's end evaluation.
    if (placed.sitesToRemove.length > 0) {
      const samePlayerAgain =
        placed.next > 0 ? placed.next === placed.mover : move.moveAgain;
      if (!samePlayerAgain) {
        const seen = new Set<number>();
        for (const site of placed.sitesToRemove) {
          if (seen.has(site)) continue;
          seen.add(site);
          placed = new ActionRemove({ to: site }).apply(placed);
        }
        placed = placed.withClearedSitesToRemove();
      }
    }

    // Java parity: a `(then (moveAgain))` is realised by a SetNextPlayer action
    // that sets next = mover, applied as part of the move *before* the end rules
    // run. When the move carries the static `moveAgain` flag (no explicit `next`
    // override action), reflect it in `placed.next` here so end conditions that
    // read the `(next)` function see that the same player is still to move — and
    // a turn-boundary rule (L Game's `(and (not (is Mover (next))) (no Moves
    // Next))`) does not fire mid-turn while the opponent is momentarily blocked.
    // The rotation below consumes `next` identically (override > 0 ⇒ same
    // mover), so this only changes what the end rules observe.
    if (move.moveAgain && placed.next <= 0) {
      placed = placed.withNext(placed.mover);
    }

    // Evaluate the end rules against the state *after* this move, with the
    // move recorded in a throwaway trial so `(last To)` etc. resolve.
    const evalTrial = context.trial.withMove(move, false, -1);
    const evalContext = new Context(this, placed, evalTrial, context.rng);
    const evalCtx = new EvalContext(evalContext, this.board, {
      roleNextFromState: true,
    });

    // Java (Game.java:3063): the mover's current-phase `(end …)` is evaluated
    // first, then the game-level `(end …)`. `placed.mover` is still the player
    // who just moved (rotation happens below), so its phase is the right one.
    const outcome0 = this.evalEnd(evalCtx, placed.phase(placed.mover));
    if (outcome0?.state) placed = outcome0.state;
    const endRanking = outcome0?.ranking;
    let over = outcome0 ? outcome0.terminal !== false : false;
    let winner = outcome0?.winner ?? 0;

    // Java parity (End.eval, after the explicit end rules): a game that
    // requires all players to pass — i.e. not a dice/hand game — ends in a
    // draw once every player has passed on their previous turn. This is the
    // implicit terminator for games with no `(no Moves …)` rule (e.g. a filled
    // Tic-Tac-Toe board, where both players forced-pass in turn and the trial
    // closes with two `forced=true` passes followed by a Draw).
    if (
      !over &&
      this.hasEndEvalForPhase(placed.phase(placed.mover)) &&
      this.requiresAllPass() &&
      this.allPassed(evalTrial, placed.mover)
    ) {
      over = true;
      winner = 0;
    }

    // Java parity (`Game.applyInternal`): after explicit end evaluation, a
    // still-active game that has reached the global turn/move cap terminates
    // immediately as a draw (or preserves an already-written winner). This
    // check runs before phase switching and mover rotation.
    if (!over && this.hitMaxTurnsOrMoves(evalTrial, placed)) {
      over = true;
      winner = 0;
    }

    // Phase switching (Java Game.java: after the move resolves, iterate over
    // every player and check that player's own current-phase `(nextPhase …)`
    // rules). A rule's `who` selects whom it applies to: `"all"` (no player
    // argument → RoleType.Shared, i.e. numPlayers+1) matches every player,
    // otherwise it matches only the named player. The first satisfied rule per
    // player switches that player; the condition is evaluated in the mover's
    // context just as Java evaluates `cond.eval(context)`.
    let phased = placed;
    if (this.phaseList.length > 1) {
      const mover = placed.mover;
      const allSentinel = this.numPlayers + 1;
      for (let pid = 1; pid <= this.numPlayers; pid++) {
        const rules = this.phaseList[phased.phase(pid)]?.nextPhases ?? [];
        for (const r of rules) {
          const who =
            r.who === "all"
              ? allSentinel
              : r.who === "Next"
                ? (mover % this.numPlayers) + 1
                : r.who === "Mover"
                  ? mover
                  : r.who; // explicit P<k>
          if (who !== allSentinel && pid !== who) continue;
          if (!r.cond || r.cond.eval(evalCtx)) {
            // `"next"` = no explicit target name: advance to the next phase in
            // sequence (Java NextPhase.eval `(currentPhase + 1) % n`). The
            // reference phase is the mover's for a shared rule, else this
            // player's own.
            const refPid = who === allSentinel ? mover : pid;
            const target =
              r.target === "next"
                ? (phased.phase(refPid) + 1) % this.phaseList.length
                : r.target;
            phased = phased.withPhase(pid, target);
            break;
          }
        }
      }
    }

    let advanced = phased;
    if (!over) {
      // A `next` override set by a `(moveAgain)` effect (ActionSetNextPlayer)
      // takes precedence; a static `(then (moveAgain))` keeps the same mover;
      // otherwise rotate. The override is consumed once applied.
      const override = phased.next;
      const requestedNext =
        override > 0
          ? override
          : move.moveAgain
            ? phased.mover
            : (phased.mover % this.numPlayers) + 1;
      const nextMover = phased.activePlayer(requestedNext)
        ? requestedNext
        : this.nextActivePlayer(phased, requestedNext);
      advanced = phased.withMover(nextMover).withNext(0);
      // Java parity (Game.java:3200-3206): after `setMover(next)`, same-player
      // continuations increment `numTurnSamePlayer`; a real turn change (or
      // swap) resets it and bumps `numTurn` via `reinitNumTurnSamePlayer`.
      if (nextMover === phased.mover && !move.isSwap()) {
        advanced = advanced.withNumTurnSamePlayer(
          advanced.numTurnSamePlayer + 1,
        );
      } else {
        advanced = advanced.withNewTurn().withNumTurnSamePlayer(0);
      }
      // Java parity (Game.java:3180-3195, `if (requiresVisited())`): maintain
      // the per-turn visited-site set. When the turn passes to a different
      // player, clear it (`reInitVisited`); when the same player keeps moving
      // (a `(moveAgain)` capture continuation), record this move's from/to
      // (`visit(from); visit(to)`) so the continuation cannot land back on a
      // site it just used. Read by `(is Visited …)` (Fanorona/Vela).
      if (this.requiresVisited) {
        advanced =
          nextMover !== phased.mover
            ? advanced.withVisitedCleared()
            : advanced.withVisited(move.from(), move.to());
      }
      // Maintain the next player's stalemated flag (Java: `Game.moves` →
      // `state.setStalemated(mover, legalMoves.isEmpty())`, and
      // `computeStalemated`). A stalemated player does NOT end the game here:
      // their turn yields a single forced Pass (see `moves`) which the trial
      // records, the end rules re-run after it, and the implicit all-pass draw
      // (above) eventually fires for all-pass games. `(no Moves <player>)` end
      // rules read this cached flag, so it must reflect the player we just
      // rotated to. The next player may be in a different phase, so use their
      // phase's play.
      const nextCtx = new EvalContext(
        new Context(this, advanced, evalTrial, context.rng),
        this.board,
      );
      const nextHasMoves =
        this.playFor(advanced).generate(nextCtx).length > 0;
      advanced = advanced.withStalemated(nextMover, !nextHasMoves);
    }

    // Java parity (Game.java:3142): after the end rules have been evaluated
    // for this move, `state.incrCounter()` runs once per applied play move —
    // unconditionally, whether or not the game is over, and *after* any
    // `(set Counter …)` the move itself carried (set during move.apply, then
    // incremented here, so a reset to k saves as k+1). The guard
    // `trial.numMoves() > game.numStartingAction` skips setup; in TS all
    // setup placement happens in `start()`, never via `apply`, so every
    // `apply` is a counted play move. The end rules above observed the
    // pre-increment value (mirroring Java, where incr follows End.eval).
    // @java game.functions.ints.state.Counter — "automatically incremented at
    // each move done".
    advanced = advanced.withCounter(advanced.counter + 1);

    const finalWinner = over ? winner : -1;
    let trial = context.trial.withMove(move, over, finalWinner);
    if (endRanking) trial = trial.withRanking(endRanking);
    trial = trial.saveState(advanced);
    return new Context(this, advanced, trial, context.rng);
  }

  /**
   * Evaluate the end rules of phase `phaseIdx` first, then the game-level end
   * rules, returning the first firing outcome (Java Game.java:3063 — phase end
   * takes precedence over game end). Returns `undefined` if none fire.
   */
  private evalEnd(
    evalCtx: EvalContext,
    phaseIdx: number,
  ): EndOutcome | undefined {
    const n = this.numPlayers;
    const ranking =
      evalCtx.context.trial.ranking.length >= n + 1
        ? [...evalCtx.context.trial.ranking]
        : new Array<number>(n + 1).fill(0);
    const endState: EndEvalState = {
      active: Array.from({ length: n + 1 }, (_, p) =>
        p > 0 ? evalCtx.state.activePlayer(p) : false,
      ),
      ranking,
      numLossesDecided: 0,
      changed: false,
      terminal: false,
      winner: 0,
    };
    let ctx = evalCtx.withFrame({ endState });
    let lastOutcome: EndOutcome | undefined;
    const phase = this.phaseList[phaseIdx];
    if (phase) {
      for (const rule of phase.endRules) {
        const outcome = rule.eval(ctx);
        if (!outcome) continue;
        lastOutcome = outcome;
        if (outcome.state) {
          ctx = ctx.withContext(ctx.context.withState(outcome.state));
        }
        if (outcome.ranking) {
          ctx = ctx.withContext(ctx.context.withTrial(ctx.context.trial.withRanking(outcome.ranking)));
        }
        if (outcome.terminal !== false) return outcome;
      }
    }
    for (const rule of this.endRules) {
      const outcome = rule.eval(ctx);
      if (!outcome) continue;
      lastOutcome = outcome;
      if (outcome.state) {
        ctx = ctx.withContext(ctx.context.withState(outcome.state));
      }
      if (outcome.ranking) {
        ctx = ctx.withContext(ctx.context.withTrial(ctx.context.trial.withRanking(outcome.ranking)));
      }
      if (outcome.terminal !== false) return outcome;
    }
    return lastOutcome;
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
