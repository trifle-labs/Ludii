/**
 * Direction resolution for the ludeme interpreter.
 *
 * Java parity:
 * - Core/src/game/util/directions/* and
 *   game.functions.directions.Directions — absolute compass directions,
 *   the named relative family (Forward/Backward/Left/Right and the FR/FL/
 *   BR/BL diagonals), and the grouped sets (Orthogonal/Diagonal/Adjacent/
 *   All).
 *
 * Relative directions are resolved against the *facing* of the piece at the
 * site under consideration. Faithful to Java (`Directions.convertToAbsolute`):
 * the facing is the moving component's `getDirn()`, which `Game.create` copies
 * from the owning player's `(player <Dir>)` declaration; a component with no
 * declared facing defaults to `CompassDirection.N`. We therefore look up the
 * owner of the piece at `frame.from` and rotate the canonical North-facing
 * offset to that player's declared facing (North when none was declared).
 */

import { type Dir, type EvalContext, OFF } from "./eval-context.js";
import { type Tiling, SQUARE_TILING } from "./tilings.js";

/**
 * Rotate a canonical North-facing offset to the given absolute facing.
 * Square-board facings are the four orthogonals; the rotation is the angle
 * from North to the facing. Unknown / undefined facings keep North (identity),
 * matching Java's `CompassDirection.N` default for a piece whose owner has no
 * `(player <Dir>)` declaration.
 */
function rotateToFacing(dir: Dir, facing: string | undefined): Dir {
  switch (facing) {
    case "S":
      return { dx: -dir.dx, dy: -dir.dy }; // 180°
    case "E":
      return { dx: dir.dy, dy: -dir.dx }; // −90° (clockwise)
    case "W":
      return { dx: -dir.dy, dy: dir.dx }; // +90° (counter-clockwise)
    case "N":
    default:
      return dir;
  }
}

/**
 * The facing direction token to use for relative directions evaluated at
 * `site`. If `site` holds a piece, the facing is its owner's declared facing
 * (Java: the component's `getDirn()`); otherwise we fall back to the context's
 * acting player. Returns `undefined` when no facing was declared, which
 * `rotateToFacing` treats as North.
 *
 * @java Core/src/game/functions/directions/Directions.java:468-478
 * Java applies the piece's per-site rotation on top of the component/player
 * facing. Each rotation unit is one FR step (45° clockwise) in the compass.
 * On a 16-point compass this is +2 positions per rotation step.
 */
export function facingForSite(
  ctx: EvalContext,
  site: number | undefined,
): string | undefined {
  const facings = ctx.board.playerFacing;
  let baseFacing: string | undefined;
  if (site !== undefined && site >= 0) {
    // A piece's own declared facing (Java `Component.getDirn()`) takes
    // precedence over its owner's player facing — Toads & Frogs gives the Toad
    // facing E and the Frog facing W on a single neutral-player-less board, so
    // their `Forward` rotates oppositely even though both belong to ordinary
    // players with no `(player <Dir>)` declaration.
    const compFacing = ctx.board.componentFacing;
    if (compFacing) {
      const what = ctx.state.whatAtSite(site);
      const f = what > 0 ? compFacing[what] : undefined;
      if (f !== undefined) {
        baseFacing = f;
      }
    }
    if (baseFacing === undefined) {
      const w = ctx.state.who(site);
      baseFacing = facings && w > 0 ? facings[w] : undefined;
    }
    // @java Directions.java:472-478 — apply per-site rotation to the base
    // facing. Each rotation unit is one FR step (45° clockwise). In the
    // 16-point compass (N=0, NNE=1, NE=2, …, NW=14) one 45° step = +2.
    const rotation = ctx.state.rotationAtSite(site);
    if (rotation !== 0) {
      const baseIdx = facingIndex(baseFacing);
      const rotIdx = (baseIdx + rotation * 2) % 16;
      return COMPASS16[rotIdx];
    }
    // When the site has a component/owner facing, return it; otherwise fall
    // through to the acting player's facing below (preserves the pre-rotation
    // behaviour for empty/unowned sites — only rotation pieces change here).
    if (baseFacing !== undefined) return baseFacing;
  }
  const owner = ctx.player;
  return facings && owner >= 0 ? facings[owner] : undefined;
}

/**
 * Resolve a single direction token to its step offset for the given `facing`
 * on the supplied tiling (square by default). Absolute compass tokens ignore
 * the facing; relative tokens are rotated to it.
 */
export function resolveDirection(
  name: string,
  facing: string | undefined,
  tiling: Tiling = SQUARE_TILING,
): Dir | undefined {
  const abs = tiling.absolute[name];
  if (abs) return abs;
  const rel = tiling.relative[name];
  if (rel) return rotateToFacing(rel, facing);
  return undefined;
}

/** Resolve a grouped direction-set keyword to its member offsets. */
export function resolveDirectionGroup(
  name: string,
  tiling: Tiling = SQUARE_TILING,
): Dir[] | undefined {
  const g = tiling.groups[name];
  return g ? [...g] : undefined;
}

/**
 * Unit step offsets to the neighbours of `site` in a named direction group on
 * a graph board (Java `topology.supportedDirections` / the trajectory engine).
 * The offset is the planar vector from `site` to each classified neighbour, so
 * a move ludeme can step it via `siteAt(x + dx·k, y + dy·k)` exactly as it does
 * lattice offsets. On the alquerque/morris family every drawn line is an
 * `Orthogonal` relation (the bounding-box diagonals included), which is why a
 * square-lattice offset table is wrong here — the topology, not the geometry,
 * decides what counts as Orthogonal/Diagonal/Adjacent.
 */
function graphGroupOffsets(
  ctx: EvalContext,
  site: number,
  group: string,
): Dir[] {
  const traj = ctx.board.traj;
  if (!traj || site < 0) return [];
  let neighbours: number[];
  if (group === "All" || group === "Adjacent") {
    neighbours = traj.group(site, "Adjacent");
  } else {
    neighbours = traj.group(site, group);
  }
  const ox = ctx.board.xOf(site);
  const oy = ctx.board.yOf(site);
  const out: Dir[] = [];
  for (const n of neighbours) {
    const dx = ctx.board.xOf(n) - ox;
    const dy = ctx.board.yOf(n) - oy;
    if (dx === 0 && dy === 0) continue;
    out.push({ dx, dy });
  }
  return out;
}

/** Unit step offset to a single named-compass neighbour on a graph board. */
function graphStepOffset(
  ctx: EvalContext,
  site: number,
  dir: string,
): Dir | undefined {
  const traj = ctx.board.traj;
  if (!traj || site < 0) return undefined;
  const n = traj.step(site, dir);
  if (n < 0) return undefined;
  const dx = ctx.board.xOf(n) - ctx.board.xOf(site);
  const dy = ctx.board.yOf(n) - ctx.board.yOf(site);
  if (dx === 0 && dy === 0) return undefined;
  return { dx, dy };
}

const GROUP_TOKENS = new Set(["Orthogonal", "Diagonal", "Adjacent", "All", "OffDiagonal"]);

// ---------------------------------------------------------------------------
// Player-relative directions on a graph board.
//
// Faithful port of game.util.directions.RelativeDirection.directions(baseDirn,
// supportedDirections) + CompassDirection's left/right/leftward/rightward/
// opposite cycle. A relative token (Forwards, Rightward, FL, …) names a SET of
// absolute compass directions, computed by walking the 16-point compass cycle
// from the piece's facing and keeping only the board's supported directions.
//
// Java resolves a relative token to absolute compass directions ONCE per board
// (via the topology's supported-direction set) and then queries each at the
// move's origin site. We mirror that: `boardSupportedCompass` derives the
// supported set from the topology, `expandRelative` walks the cycle exactly as
// Java does, and the caller resolves each compass name to a neighbour with
// `graphStepOffset`. This is why the dog in Komikan (facing N) moves to all
// three of its forward neighbours {NW, N, NE} rather than only straight N.
// ---------------------------------------------------------------------------

/** 16-point compass, clockwise from N — Java CompassDirection ordinal order. */
const COMPASS16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
] as const;
const COMPASS_INDEX: Readonly<Record<string, number>> = Object.fromEntries(
  COMPASS16.map((n, i) => [n, i]),
);
const cRight = (i: number): number => (i + 1) % 16;
const cLeft = (i: number): number => (i + 15) % 16;
const cRightward = (i: number): number => (i + 4) % 16; // 90° clockwise
const cLeftward = (i: number): number => (i + 12) % 16; // 90° counter-clockwise
const cOpposite = (i: number): number => (i + 8) % 16;

/** Relative-direction tokens recognised by {@link expandRelative}. */
const RELATIVE_TOKENS = new Set([
  "Forward", "Backward", "Rightward", "Leftward",
  "Forwards", "Backwards", "Rightwards", "Leftwards",
  "FL", "FR", "BL", "BR",
  "FLL", "FRR", "BLL", "BRR", "FLLL", "FRRR", "BLLL", "BRRR",
]);

/**
 * True when `token` is a player-relative direction (Forwards/FL/…). Java models
 * these as RelativeDirection, which has no edge tag of its own and must be
 * mapped onto a board-supported facing via Directions.convertToAbsolute. An
 * absolute direction (compass N/E/…, circular In/Out/CW/CCW) is NOT relative:
 * it is resolved directly from edge tags, so its absence is authoritative.
 */
export function isRelativeDirectionToken(token: string): boolean {
  return RELATIVE_TOKENS.has(token);
}

/**
 * The compass name of the unit step from `from` to `to` — Java
 * ForEachDirection's `newDirection` (lines 150-163): the facing whose
 * `trajectories().steps(from, absoluteDirection)` reaches `context.to()`. Used
 * as the relative-direction basis inside a nested `(forEach Direction (from
 * (to)) …)`. On a graph board we ask the trajectory engine directly, so hex
 * boards return the true 16-point intercardinal facing (NNE/ENE/…) rather than
 * collapsing six neighbours onto four sign-of-offset cardinals — the Xiang Hex
 * Horse leg needs that precision. Lattice boards with no trajectory engine keep
 * the 8-compass sign heuristic. Returns `undefined` when the sites coincide,
 * either is off-board, or `to` is not a single supported step from `from`.
 */
export function stepCompassName(
  ctx: EvalContext,
  from: number,
  to: number,
): string | undefined {
  if (from < 0 || to < 0 || from === to) return undefined;
  const traj = ctx.board.traj;
  if (traj) {
    // @java graph.supportedDirections + trajectories().steps: the facing whose
    // one-step neighbours include `to`. Unsupported names return [] and skip.
    for (const name of COMPASS16) {
      if (traj.steps(from, name).includes(to)) return name;
    }
    return undefined;
  }
  const board = ctx.board;
  const sx = Math.sign(board.xOf(to) - board.xOf(from));
  const sy = Math.sign(board.yOf(to) - board.yOf(from));
  if (sx === 0 && sy === 0) return undefined;
  const NAMES: Readonly<Record<string, string>> = {
    "0,1": "N", "1,1": "NE", "1,0": "E", "1,-1": "SE",
    "0,-1": "S", "-1,-1": "SW", "-1,0": "W", "-1,1": "NW",
  };
  return NAMES[`${sx},${sy}`];
}

/** Base compass index for a facing token; defaults to N (Java CompassDirection.N). */
function facingIndex(facing: string | undefined): number {
  return facing !== undefined && facing in COMPASS_INDEX
    ? (COMPASS_INDEX[facing] as number)
    : 0;
}

/**
 * Expand a relative-direction token into the ordered list of absolute compass
 * names it denotes, given the facing `b` (compass index) and a `supported`
 * predicate. Faithful to Java RelativeDirection.directions(). Returns `null`
 * when the token is not a relative direction.
 */
function expandRelative(
  token: string,
  b: number,
  supported: (name: string) => boolean,
): string[] | null {
  const ok = (i: number): string | undefined =>
    supported(COMPASS16[i] as string) ? (COMPASS16[i] as string) : undefined;
  // Walk an arc from `start` (inclusive) to `end` (exclusive), keeping supported.
  const arc = (
    start: number,
    end: number,
    stepFn: (i: number) => number,
  ): string[] => {
    const out: string[] = [];
    let i = start;
    for (let guard = 0; i !== end && guard < 16; guard += 1) {
      const name = ok(i);
      if (name) out.push(name);
      i = stepFn(i);
    }
    return out;
  };
  // First supported direction reached by stepping; mirrors the FL/FR/BL/BR
  // `while (!supported) step` loops. Bounded to one full turn.
  const nearest = (start: number, stepFn: (i: number) => number): string[] => {
    let i = start;
    for (let guard = 0; guard < 16; guard += 1) {
      const name = ok(i);
      if (name) return [name];
      i = stepFn(i);
    }
    return [];
  };
  const single = (i: number): string[] => {
    const name = ok(i);
    return name ? [name] : [];
  };
  switch (token) {
    case "Forward":
      return single(b);
    case "Backward":
      return single(cOpposite(b));
    case "Rightward":
      return single(cRightward(b));
    case "Leftward":
      return single(cLeftward(b));
    case "Forwards":
      return arc(cRight(cLeftward(b)), cRightward(b), cRight);
    case "Backwards": {
      const o = cOpposite(b);
      return arc(cRight(cLeftward(o)), cRightward(o), cRight);
    }
    case "Rightwards":
      return arc(cRight(b), cOpposite(b), cRight);
    case "Leftwards":
      return arc(cLeft(b), cOpposite(b), cLeft);
    case "FL":
      return nearest(cLeft(b), cLeft);
    case "FLL":
      return nearest(cLeft(cLeft(b)), cLeft);
    case "FLLL":
      return nearest(cLeft(cLeft(cLeft(b))), cLeft);
    case "FR":
      return nearest(cRight(b), cRight);
    case "FRR":
      return nearest(cRight(cRight(b)), cRight);
    case "FRRR":
      return nearest(cRight(cRight(cRight(b))), cRight);
    case "BL":
      return nearest(cLeft(cOpposite(b)), cLeft);
    case "BLL":
      return nearest(cLeft(cLeft(cOpposite(b))), cLeft);
    case "BLLL":
      return nearest(cLeft(cLeft(cLeft(cOpposite(b)))), cLeft);
    case "BR":
      return nearest(cRight(cOpposite(b)), cRight);
    case "BRR":
      return nearest(cRight(cRight(cOpposite(b))), cRight);
    case "BRRR":
      return nearest(cRight(cRight(cRight(cOpposite(b)))), cRight);
    default:
      return null;
  }
}

/**
 * The board's supported compass directions, derived from the topology — the
 * set of compass names for which any play-site has a neighbour (Java
 * `Topology.supportedDirections`). Cached per board: the graph is immutable, so
 * this is a pure function of the board. Used to filter relative-direction
 * expansion exactly as Java does.
 */
const supportedCompassCache = new WeakMap<object, Set<string>>();
function boardSupportedCompass(ctx: EvalContext): Set<string> {
  const board = ctx.board as unknown as object;
  const cached = supportedCompassCache.get(board);
  if (cached) return cached;
  const traj = ctx.board.traj;
  const set = new Set<string>();
  if (traj) {
    const n = ctx.board.numSites;
    for (const name of COMPASS16) {
      for (let s = 0; s < n; s += 1) {
        if (traj.step(s, name) >= 0) {
          set.add(name);
          break;
        }
      }
    }
  }
  supportedCompassCache.set(board, set);
  return set;
}

/**
 * The compass names supported under a given *base relation* of a lattice board
 * — the lattice analogue of Java `Topology.supportedDirections(relationType,
 * type)`. A relative direction (`Forwards`/…) is expanded only over this set
 * (Java `Directions`: the cone is computed against the supported directions of
 * `relativeDirectionType`, default `Adjacent`). It is the names in the tiling's
 * absolute table whose offset belongs to `tiling.groups[relation]`. This is
 * what makes a square *vertex* board's bare `(directions Forwards)` expand over
 * the 4 orthogonal Adjacent neighbours (no diagonal cone) while `of:All` lets
 * it expand over the full 8-point compass — matching Java exactly. On a square
 * *cell* board (Adjacent = All = 8) and on hex/tri (every group = the full
 * neighbour set) this returns the same set for any relation, so it is a no-op
 * there. Cached per (tiling, relation).
 */
const tilingRelationCache = new WeakMap<object, Map<string, Set<string>>>();
function tilingRelationCompass(tiling: Tiling, relation: string): Set<string> {
  let byRel = tilingRelationCache.get(tiling);
  if (!byRel) {
    byRel = new Map<string, Set<string>>();
    tilingRelationCache.set(tiling, byRel);
  }
  const cached = byRel.get(relation);
  if (cached) return cached;
  const group = tiling.groups[relation] ?? tiling.groups["Adjacent"] ?? [];
  const set = new Set<string>();
  for (const name of Object.keys(tiling.absolute)) {
    const dir = tiling.absolute[name];
    if (dir && group.some((g) => g.dx === dir.dx && g.dy === dir.dy)) {
      set.add(name);
    }
  }
  byRel.set(relation, set);
  return set;
}

/**
 * The neighbour *sites* of `site` in the given direction tokens on a graph
 * board, taken straight from the topology (Java `Topology.neighbours` /
 * `trajectories`). This is the faithful and fast path for `(sites Around …)`
 * and adjacency tests: it returns the topology's own neighbour ids rather than
 * converting to a planar offset and recovering the site with an O(numSites)
 * `siteAt` scan. Defaults to the full `Adjacent` neighbourhood when no tokens
 * are given. Move-relative tokens are not meaningful for a neighbourhood query
 * and are skipped. Returns `[]` for non-graph boards or off-board sites.
 */
export function graphNeighbourSites(
  ctx: EvalContext,
  site: number,
  dirTokens: readonly string[],
): number[] {
  const traj = ctx.board.traj;
  if (!traj || site < 0) return [];
  const tokens = dirTokens.length > 0 ? dirTokens : ["Adjacent"];
  const out = new Set<number>();
  for (const token of tokens) {
    if (token === "SameDirection" || token === "OppositeDirection") continue;
    if (token === "All" || token === "Adjacent") {
      for (const n of traj.group(site, "Adjacent")) out.add(n);
      continue;
    }
    if (GROUP_TOKENS.has(token)) {
      for (const n of traj.group(site, token)) out.add(n);
      continue;
    }
    const n = traj.step(site, token);
    if (n >= 0) out.add(n);
  }
  return [...out];
}

/**
 * Resolve a list of direction tokens (a `(directions {…})` body or a bare
 * group keyword) into concrete step offsets.
 *
 * On a **graph board** the offsets are derived from the board's topology: a
 * group keyword expands to its classified neighbours of `fromSite`, and a
 * compass keyword to that single neighbour (Java resolves directions through
 * the trajectory engine, never a Cartesian table). On a **lattice board** the
 * tiling's static offset tables are used, rotated to the piece's facing for
 * relative tokens. The move-relative tokens `SameDirection` /
 * `OppositeDirection` resolve against the last move on either board.
 *
 * `fromSite` is the site the offsets are anchored at (defaults to the frame's
 * `from`); move ludemes pass their actual origin so a `(from (last To))` hop
 * resolves its directions at the landing site, not the iterated piece.
 */
export function resolveDirectionTokens(
  tokens: readonly string[],
  ctx: EvalContext,
  fromSite?: number,
  facingOverride?: string,
): Dir[] {
  const tiling = ctx.board.tiling;
  const ref = fromSite ?? ctx.frame.from ?? OFF;
  // Java ForEachDirection.eval computes `newDirection` — the facing whose step
  // from context.from() reaches context.to() — and resolves *relative*
  // directions about it rather than the piece's own facing. A nested
  // `(forEach Direction (from (to)) (directions {FR FL} …))` (xiangqi/shogi
  // horse/knight) therefore turns its FL/FR diagonals relative to the leg just
  // travelled, not the player's forward. `facingOverride` carries that.
  const facing = facingOverride ?? facingForSite(ctx, ref);
  const graph = ctx.board.traj !== undefined && ref >= 0;
  // `of:<RelationType>` (Java Directions `of` arg) names the base relation the
  // relative cones expand over; default Adjacent (Directions.java:173). It is
  // not a direction, so pull it out before iterating — leaving it in would
  // resolve the relation name (e.g. "All") as an independent direction group.
  let baseRelation = "Adjacent";
  let dirTokens = tokens;
  for (const token of tokens) {
    if (token.startsWith("of:")) {
      baseRelation = token.slice(3) || "Adjacent";
      dirTokens = tokens.filter((t) => !t.startsWith("of:"));
      // Java's relative-direction constructor defaults the relative direction
      // to Forward when none is given (Directions.java:170-172), so a bare
      // `(directions of:<Rel>)` is Forward expanded over that relation.
      if (dirTokens.length === 0) dirTokens = ["Forward"];
      break;
    }
  }
  const out: Dir[] = [];
  for (const token of dirTokens) {
    if (token === "SameDirection" || token === "OppositeDirection") {
      out.push(...resolveLastMoveRelative(token, ctx));
      continue;
    }
    if (graph && GROUP_TOKENS.has(token)) {
      out.push(...graphGroupOffsets(ctx, ref, token));
      continue;
    }
    if (graph && RELATIVE_TOKENS.has(token)) {
      // A player-relative direction (Forwards/Rightward/FL/…). Expand to the
      // board's supported compass directions about the piece's facing, then
      // resolve each at the origin — faithful to Java's
      // Directions.convertToAbsolute on a topology-driven board.
      const supported = boardSupportedCompass(ctx);
      const names = expandRelative(token, facingIndex(facing), (n) =>
        supported.has(n),
      );
      if (names) {
        for (const name of names) {
          const off = graphStepOffset(ctx, ref, name);
          if (off) out.push(off);
        }
        continue;
      }
    }
    if (graph) {
      // A compass / named single direction on a graph board.
      const single = graphStepOffset(ctx, ref, token);
      if (single) {
        out.push(single);
        continue;
      }
      // Fall through to the tiling for relative facing tokens (rare here).
    }
    if (!graph && RELATIVE_TOKENS.has(token)) {
      // A player-relative direction on a lattice board. The plural tokens
      // (Forwards/Backwards/Rightwards/Leftwards) and the FL/FR/… cones name a
      // SET of compass directions about the facing, not one — e.g. a North-
      // facing draughtsman's `(directions Forwards)` is {NW, N, NE}. Expand via
      // the same Java RelativeDirection.directions walk used on graph boards,
      // filtered by the lattice's supported compass set, then resolve each
      // resulting absolute compass name on the tiling (facing already baked in).
      // The supported set is the base relation's compass names (default
      // Adjacent, overridden by `of:<Rel>`): on a square vertex board Adjacent
      // is the 4 orthogonals, so a bare `(directions Forwards)` is a 1-way
      // step while `of:All` opens the full forward cone — faithful to Java.
      const supported = tilingRelationCompass(tiling, baseRelation);
      const names = expandRelative(token, facingIndex(facing), (n) =>
        supported.has(n),
      );
      if (names) {
        for (const name of names) {
          const off = resolveDirection(name, undefined, tiling);
          if (off) out.push(off);
        }
        continue;
      }
    }
    const grouped = resolveDirectionGroup(token, tiling);
    if (grouped) {
      out.push(...grouped);
      continue;
    }
    const single = resolveDirection(token, facing, tiling);
    if (single) out.push(single);
  }
  return out;
}

/** Candidate unit offsets to step from `site` when searching for a move-
 * relative direction: the topology's adjacency on a graph board, else the
 * tiling's Orthogonal ∪ Diagonal compass steps. */
function neighbourOffsets(ctx: EvalContext, site: number): Dir[] {
  if (ctx.board.traj && site >= 0) {
    return graphGroupOffsets(ctx, site, "Adjacent");
  }
  const tiling = ctx.board.tiling;
  return [
    ...(resolveDirectionGroup("Orthogonal", tiling) ?? []),
    ...(resolveDirectionGroup("Diagonal", tiling) ?? []),
  ];
}

/**
 * Resolve `SameDirection` / `OppositeDirection` relative to the last move.
 *
 * Faithful to Java `Directions.convertToAbsolute` (Directions.java:498-553):
 * - `SameDirection` = the direction whose radial from `lastFrom` reaches
 *   `lastTo` (the direction the last move travelled).
 * - `OppositeDirection` = the direction whose radial from `lastTo` reaches
 *   `lastFrom` (points back the way the last move came).
 *
 * Java iterates the supported direction-facings and returns the first whose
 * radial passes through the target site. We mirror that with the offset/siteAt
 * machinery the rest of the move compiler uses: the candidate set is the unit
 * steps to `origin`'s neighbours (topology on a graph board, tiling otherwise),
 * so the returned `Dir` is one of those same unit offsets and set-difference by
 * (dx,dy) key composes cleanly with `(difference …)`. Returns `[]` when there
 * is no last move.
 */
export function resolveLastMoveRelative(
  name: "SameDirection" | "OppositeDirection",
  ctx: EvalContext,
): Dir[] {
  const moves = ctx.context.trial.moves;
  const last = moves[moves.length - 1];
  if (!last) return [];
  const lastFrom = last.from();
  const lastTo = last.to();
  if (lastFrom < 0 || lastTo < 0) return [];
  const origin = name === "OppositeDirection" ? lastTo : lastFrom;
  const target = name === "OppositeDirection" ? lastFrom : lastTo;
  return directionsBetween(ctx, origin, target);
}

/**
 * The absolute direction(s) whose radial from `origin` passes through `target`
 * — Java `Directions.convertToAbsolute` for the `(directions <type> from:A
 * to:B)` between-sites form. Iterates `origin`'s neighbour offsets (topology on
 * a graph board, tiling otherwise) and walks each ray until it reaches `target`
 * (returning that offset) or leaves the board. Returns `[]` when `origin` /
 * `target` are off-board, equal, or no straight ray connects them — matching
 * Java's empty list when the two sites are not collinear along a supported
 * direction. This underlies both `SameDirection`/`OppositeDirection` and the
 * `(directional …)` capture direction (Fanorona approach/withdrawal lines).
 */
export function directionsBetween(
  ctx: EvalContext,
  origin: number,
  target: number,
): Dir[] {
  if (origin < 0 || target < 0 || origin === target) return [];
  const board = ctx.board;
  const ox = board.xOf(origin);
  const oy = board.yOf(origin);
  const candidates = neighbourOffsets(ctx, origin);
  const cap = board.numSites + 1;
  for (const d of candidates) {
    for (let k = 1; k <= cap; k += 1) {
      const s = board.siteAt(ox + d.dx * k, oy + d.dy * k);
      if (s === OFF) break;
      if (s === target) return [d];
    }
  }
  return [];
}
