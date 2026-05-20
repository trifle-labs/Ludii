/**
 * Ludeme compiler: turns a (define-expanded, option-applied) `.lud` AST
 * into the evaluable functions the interpreter runs.
 *
 * Java parity:
 * - This is the moral equivalent of the Java grammar compiler in
 *   `Language/` that instantiates ludeme classes from the parse tree.
 *   Here each AST head dispatches to a builder that returns a `BoolFn` /
 *   `IntFn` / `RegionFn` / `MovesFn` / `EndRule`.
 *
 * Coverage grows by corpus frequency. Heads not yet implemented throw a
 * `LudemeCompileError` so the caller can fall back to the template games.
 */

import {
  isIdent,
  isList,
  isNumber,
  isString,
  type LudIdent,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";
import { ActionAdd } from "../action/action-add.js";
import { Move } from "../move.js";
import { resolveDirectionTokens } from "./directions.js";
import {
  type BoolFn,
  type DirectionsFn,
  type EndRule,
  type EvalContext,
  type InterpBoard,
  type IntFn,
  type MovesFn,
  OFF,
  type RegionFn,
} from "./eval-context.js";

export class LudemeCompileError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "LudemeCompileError";
  }
}

/** Game-wide facts the compiler needs while building evaluables. */
export interface CompileEnv {
  readonly board: InterpBoard;
  readonly numPlayers: number;
  /** Component (piece) label → owning player, e.g. "Disc" → 1. */
  readonly pieceOwner: ReadonlyMap<string, number>;
}

// ---- named-argument parsing ----------------------------------------------

interface ParsedArgs {
  /** Positional (non-keyword) child nodes. */
  readonly positional: readonly LudNode[];
  /** Keyword args: `if:(…)` etc. The trailing `:` is stripped from keys. */
  readonly named: ReadonlyMap<string, LudNode>;
}

/**
 * Split a list's items (after the head) into positional + keyword args.
 * The lexer emits `if:` as a bare ident immediately preceding its value
 * node, so a token whose name ends in `:` consumes the following node.
 */
function parseArgs(items: readonly LudNode[]): ParsedArgs {
  const positional: LudNode[] = [];
  const named = new Map<string, LudNode>();
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item) continue;
    if (isIdent(item) && item.name.endsWith(":")) {
      const key = item.name.slice(0, -1);
      const value = items[i + 1];
      if (value) {
        named.set(key, value);
        i += 1;
      }
      continue;
    }
    positional.push(item);
  }
  return { positional, named };
}

/** Resolve a role/player token (Mover, Next, P1…, All, Each) to a player id. */
function resolveRole(name: string, ctx: EvalContext): number {
  switch (name) {
    case "Mover":
      return ctx.mover;
    case "Next":
      return (ctx.mover % ctx.context.game.numPlayers) + 1;
    case "Prev": {
      const n = ctx.context.game.numPlayers;
      return ((ctx.mover - 2 + n) % n) + 1;
    }
    case "P1":
      return 1;
    case "P2":
      return 2;
    case "P3":
      return 3;
    case "P4":
      return 4;
    default: {
      const m = /^P(\d+)$/.exec(name);
      if (m?.[1]) return Number(m[1]);
      return OFF;
    }
  }
}

// ---- integer functions ----------------------------------------------------

export function compileInt(node: LudNode, env: CompileEnv): IntFn {
  if (isNumber(node)) {
    const v = node.value;
    return { eval: () => v };
  }
  if (isIdent(node)) {
    const name = node.name;
    if (name === "Off") return { eval: () => OFF };
    if (name === "End") return { eval: () => OFF };
    return { eval: (ctx) => resolveRole(name, ctx) };
  }
  if (!isList(node)) {
    throw new LudemeCompileError(`Cannot compile int from ${node.kind}.`);
  }
  const head = listHead(node);
  const { positional, named } = parseArgs(node.items.slice(1));
  switch (head) {
    case "to":
      if (positional.length === 0)
        return { eval: (ctx) => ctx.frame.to ?? OFF };
      break;
    case "from":
      if (positional.length === 0)
        return { eval: (ctx) => ctx.frame.from ?? OFF };
      break;
    case "between":
      return { eval: (ctx) => ctx.frame.between ?? OFF };
    case "site":
      return { eval: (ctx) => ctx.frame.site ?? OFF };
    case "value":
      return { eval: (ctx) => ctx.frame.value ?? OFF };
    case "mover":
      return { eval: (ctx) => ctx.mover };
    case "next":
      return {
        eval: (ctx) => (ctx.mover % ctx.context.game.numPlayers) + 1,
      };
    case "player": {
      if (positional[0]) {
        const arg = compileInt(positional[0], env);
        return { eval: (ctx) => arg.eval(ctx) };
      }
      return { eval: (ctx) => ctx.player };
    }
    case "last": {
      const which = positional[0];
      const field = which && isIdent(which) ? which.name : "To";
      return {
        eval: (ctx) => {
          const moves = ctx.context.trial.moves;
          const lastMove = moves[moves.length - 1];
          if (!lastMove) return OFF;
          return field === "From" ? lastMove.from() : lastMove.to();
        },
      };
    }
    case "who": {
      const at = named.get("at") ?? positional[0];
      if (!at) throw new LudemeCompileError("(who …) needs an at: site.");
      const site = compileInt(at, env);
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          if (s < 0 || s >= ctx.state.cells.length) return OFF;
          return ctx.state.cells[s] ?? 0;
        },
      };
    }
    case "what": {
      const at = named.get("at") ?? positional[0];
      if (!at) throw new LudemeCompileError("(what …) needs an at: site.");
      const site = compileInt(at, env);
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          if (s < 0 || s >= ctx.state.cells.length) return 0;
          return ctx.state.cells[s] ?? 0;
        },
      };
    }
    case "score": {
      const who = positional[0];
      const pid = who
        ? compileInt(who, env)
        : { eval: (c: EvalContext) => c.mover };
      return { eval: (ctx) => ctx.state.score(pid.eval(ctx)) };
    }
    case "count": {
      // (count Pieces <role>) — number of pieces owned by a player.
      const kind = positional[0];
      if (kind && isIdent(kind) && kind.name === "Pieces") {
        const who = positional[1];
        const pid = who
          ? compileInt(who, env)
          : { eval: (c: EvalContext) => c.mover };
        return {
          eval: (ctx) => {
            const owner = pid.eval(ctx);
            let n = 0;
            for (const c of ctx.state.cells) if (c === owner) n += 1;
            return n;
          },
        };
      }
      // (count Sites in:<region>)
      const inReg = named.get("in");
      if (inReg) {
        const region = compileRegion(inReg, env);
        return { eval: (ctx) => region.eval(ctx).length };
      }
      break;
    }
    case "+":
    case "-":
    case "*":
    case "/":
    case "%": {
      const args = positional.map((n) => compileInt(n, env));
      return { eval: (ctx) => foldArith(head, args, ctx) };
    }
    default:
      break;
  }
  throw new LudemeCompileError(`Unsupported int ludeme: (${head} …).`);
}

function foldArith(
  op: string,
  args: readonly IntFn[],
  ctx: EvalContext,
): number {
  const vals = args.map((a) => a.eval(ctx));
  if (vals.length === 0) return 0;
  let acc = vals[0] ?? 0;
  if (vals.length === 1 && op === "-") return -acc;
  for (let i = 1; i < vals.length; i += 1) {
    const v = vals[i] ?? 0;
    switch (op) {
      case "+":
        acc += v;
        break;
      case "-":
        acc -= v;
        break;
      case "*":
        acc *= v;
        break;
      case "/":
        acc = v === 0 ? 0 : Math.trunc(acc / v);
        break;
      case "%":
        acc = v === 0 ? 0 : acc % v;
        break;
    }
  }
  return acc;
}

// ---- boolean functions -----------------------------------------------------

export function compileBool(node: LudNode, env: CompileEnv): BoolFn {
  if (isIdent(node)) {
    if (node.name === "True") return { eval: () => true };
    if (node.name === "False") return { eval: () => false };
    throw new LudemeCompileError(`Unsupported bool ident: ${node.name}.`);
  }
  if (!isList(node)) {
    throw new LudemeCompileError(`Cannot compile bool from ${node.kind}.`);
  }
  const head = listHead(node);
  const rest = node.items.slice(1);
  switch (head) {
    case "and": {
      const args = rest.map((n) => compileBool(n, env));
      return { eval: (ctx) => args.every((a) => a.eval(ctx)) };
    }
    case "or": {
      const args = rest.map((n) => compileBool(n, env));
      return { eval: (ctx) => args.some((a) => a.eval(ctx)) };
    }
    case "not": {
      const arg = rest[0];
      if (!arg) throw new LudemeCompileError("(not …) needs an argument.");
      const inner = compileBool(arg, env);
      return { eval: (ctx) => !inner.eval(ctx) };
    }
    case "=":
    case "!=":
    case "<":
    case ">":
    case "<=":
    case ">=": {
      const a = rest[0];
      const b = rest[1];
      if (!a || !b)
        throw new LudemeCompileError(`(${head} …) needs two arguments.`);
      const left = compileInt(a, env);
      const right = compileInt(b, env);
      return {
        eval: (ctx) => compareInts(head, left.eval(ctx), right.eval(ctx)),
      };
    }
    case "is":
      return compileIs(node, env);
    default:
      throw new LudemeCompileError(`Unsupported bool ludeme: (${head} …).`);
  }
}

function compareInts(op: string, a: number, b: number): boolean {
  switch (op) {
    case "=":
      return a === b;
    case "!=":
      return a !== b;
    case "<":
      return a < b;
    case ">":
      return a > b;
    case "<=":
      return a <= b;
    case ">=":
      return a >= b;
    default:
      return false;
  }
}

function compileIs(node: LudList, env: CompileEnv): BoolFn {
  const kindNode = node.items[1];
  if (!kindNode || !isIdent(kindNode)) {
    throw new LudemeCompileError("(is …) needs a kind keyword.");
  }
  const kind = kindNode.name;
  const rest = node.items.slice(2);
  const { positional } = parseArgs(rest);
  switch (kind) {
    case "Line": {
      const lenNode = positional[0];
      const len = lenNode && isNumber(lenNode) ? lenNode.value : Number.NaN;
      if (!Number.isInteger(len)) {
        throw new LudemeCompileError("(is Line …) needs an integer length.");
      }
      const dirTokens = collectDirectionTokens(positional[1]);
      return { eval: (ctx) => hasLineFor(ctx, len, dirTokens) };
    }
    case "In": {
      const siteNode = positional[0];
      const regionNode = positional[1];
      if (!siteNode || !regionNode)
        throw new LudemeCompileError("(is In <site> <region>) needs both.");
      const site = compileInt(siteNode, env);
      const region = compileRegion(regionNode, env);
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          return region.eval(ctx).includes(s);
        },
      };
    }
    case "Empty": {
      const siteNode = positional[0];
      if (!siteNode)
        throw new LudemeCompileError("(is Empty <site>) needs a site.");
      const site = compileInt(siteNode, env);
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          if (s < 0 || s >= ctx.state.cells.length) return false;
          return (ctx.state.cells[s] ?? 0) === 0;
        },
      };
    }
    case "Occupied": {
      const siteNode = positional[0];
      if (!siteNode)
        throw new LudemeCompileError("(is Occupied <site>) needs a site.");
      const site = compileInt(siteNode, env);
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          if (s < 0 || s >= ctx.state.cells.length) return false;
          return (ctx.state.cells[s] ?? 0) !== 0;
        },
      };
    }
    case "Enemy":
    case "Friend": {
      const whoNode = positional[0];
      if (!whoNode)
        throw new LudemeCompileError(`(is ${kind} <who>) needs a who.`);
      const who = compileInt(whoNode, env);
      return {
        eval: (ctx) => {
          const owner = who.eval(ctx);
          if (owner <= 0) return false;
          const friendly = owner === ctx.mover;
          return kind === "Friend" ? friendly : !friendly;
        },
      };
    }
    case "Mover": {
      const whoNode = positional[0];
      if (!whoNode) return { eval: () => true };
      const who = compileInt(whoNode, env);
      return { eval: (ctx) => who.eval(ctx) === ctx.mover };
    }
    default:
      throw new LudemeCompileError(`Unsupported (is ${kind} …).`);
  }
}

const DEFAULT_DIRECTIONS = ["Orthogonal", "Diagonal"];

/**
 * Read direction tokens from a `(directions {…})` / bare-group node.
 * Unfilled define placeholders (`#1` etc.) are ignored, and an empty
 * result falls back to the Adjacent+Diagonal default Ludii uses.
 */
function collectDirectionTokens(node: LudNode | undefined): string[] {
  const tokens = rawDirectionTokens(node).filter((t) => !t.startsWith("#"));
  return tokens.length > 0 ? tokens : [...DEFAULT_DIRECTIONS];
}

function rawDirectionTokens(node: LudNode | undefined): string[] {
  if (!node) return [];
  if (isIdent(node)) return [node.name];
  if (isList(node)) {
    const head = listHead(node);
    if (head === "directions") {
      const tokens: string[] = [];
      for (const item of node.items.slice(1)) {
        if (isIdent(item)) tokens.push(item.name);
        if (isList(item)) {
          for (const inner of item.items) {
            if (isIdent(inner)) tokens.push(inner.name);
          }
        }
      }
      return tokens;
    }
    // Bare `{N S E W}` group.
    const tokens: string[] = [];
    for (const item of node.items) {
      if (isIdent(item)) tokens.push(item.name);
    }
    return tokens;
  }
  return [];
}

/**
 * True if the mover owns a straight line of `len` pieces along any of the
 * given direction axes. Lines are checked symmetrically so a token only
 * needs to appear once per axis.
 */
function hasLineFor(
  ctx: EvalContext,
  len: number,
  dirTokens: readonly string[],
): boolean {
  const owner = ctx.mover;
  if (owner <= 0) return false;
  const board = ctx.board;
  const cells = ctx.state.cells;
  const dirs = resolveDirectionTokens(dirTokens, ctx);
  // Reduce to unique axes (a direction and its opposite are one axis).
  const axes: Array<[number, number]> = [];
  for (const d of dirs) {
    if (axes.some(([ax, ay]) => ax === -d.dx && ay === -d.dy)) continue;
    if (axes.some(([ax, ay]) => ax === d.dx && ay === d.dy)) continue;
    axes.push([d.dx, d.dy]);
  }
  for (let s = 0; s < cells.length; s += 1) {
    if (cells[s] !== owner) continue;
    const x = board.xOf(s);
    const y = board.yOf(s);
    for (const [dx, dy] of axes) {
      let count = 1;
      let nx = x + dx;
      let ny = y + dy;
      while (true) {
        const site = board.siteAt(nx, ny);
        if (site === OFF || cells[site] !== owner) break;
        count += 1;
        nx += dx;
        ny += dy;
      }
      nx = x - dx;
      ny = y - dy;
      while (true) {
        const site = board.siteAt(nx, ny);
        if (site === OFF || cells[site] !== owner) break;
        count += 1;
        nx -= dx;
        ny -= dy;
      }
      if (count >= len) return true;
    }
  }
  return false;
}

// ---- region functions ------------------------------------------------------

export function compileRegion(node: LudNode, env: CompileEnv): RegionFn {
  if (!isList(node)) {
    throw new LudemeCompileError(`Cannot compile region from ${node.kind}.`);
  }
  const head = listHead(node);
  const rest = node.items.slice(1);
  switch (head) {
    case "sites":
      return compileSites(node);
    case "union":
    case "intersection":
    case "difference": {
      const parts = rest.map((n) => compileRegion(n, env));
      return { eval: (ctx) => combineRegions(head, parts, ctx) };
    }
    case "expand": {
      const inner = rest[0];
      if (!inner) throw new LudemeCompileError("(expand …) needs a region.");
      const region = compileRegion(inner, env);
      return { eval: (ctx) => expandRegion(region.eval(ctx), ctx) };
    }
    default:
      throw new LudemeCompileError(`Unsupported region ludeme: (${head} …).`);
  }
}

function compileSites(node: LudList): RegionFn {
  const arg = node.items[1];
  if (arg && isIdent(arg)) {
    const name = arg.name;
    switch (name) {
      case "Empty":
        return {
          eval: (ctx) => indicesWhere(ctx, (c) => c === 0),
        };
      case "Occupied":
        return { eval: (ctx) => indicesWhere(ctx, (c) => c !== 0) };
      case "Board":
        return { eval: (ctx) => allSites(ctx) };
      case "Mover":
        return {
          eval: (ctx) => indicesWhere(ctx, (c) => c === ctx.mover),
        };
      case "Top":
        return { eval: (ctx) => rowSites(ctx, ctx.board.height - 1) };
      case "Bottom":
        return { eval: (ctx) => rowSites(ctx, 0) };
      case "Left":
        return { eval: (ctx) => colSites(ctx, 0) };
      case "Right":
        return { eval: (ctx) => colSites(ctx, ctx.board.width - 1) };
      default: {
        const pid = resolveStaticRole(name);
        if (pid !== undefined) {
          return { eval: (ctx) => indicesWhere(ctx, (c) => c === pid) };
        }
        throw new LudemeCompileError(`Unsupported (sites ${name}).`);
      }
    }
  }
  throw new LudemeCompileError("Unsupported (sites …) form.");
}

function resolveStaticRole(name: string): number | undefined {
  const m = /^P(\d+)$/.exec(name);
  if (m?.[1]) return Number(m[1]);
  return undefined;
}

function allSites(ctx: EvalContext): number[] {
  const n = ctx.state.cells.length;
  const out = new Array<number>(n);
  for (let i = 0; i < n; i += 1) out[i] = i;
  return out;
}

function indicesWhere(
  ctx: EvalContext,
  pred: (cell: number) => boolean,
): number[] {
  const out: number[] = [];
  const cells = ctx.state.cells;
  for (let i = 0; i < cells.length; i += 1) {
    if (pred(cells[i] ?? 0)) out.push(i);
  }
  return out;
}

function rowSites(ctx: EvalContext, y: number): number[] {
  const out: number[] = [];
  for (let x = 0; x < ctx.board.width; x += 1) {
    out.push(ctx.board.siteAt(x, y));
  }
  return out;
}

function colSites(ctx: EvalContext, x: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < ctx.board.height; y += 1) {
    out.push(ctx.board.siteAt(x, y));
  }
  return out;
}

function combineRegions(
  op: string,
  parts: readonly RegionFn[],
  ctx: EvalContext,
): number[] {
  if (parts.length === 0) return [];
  const sets = parts.map((p) => new Set(p.eval(ctx)));
  const first = sets[0] ?? new Set<number>();
  if (op === "union") {
    const out = new Set<number>();
    for (const s of sets) for (const v of s) out.add(v);
    return [...out];
  }
  if (op === "intersection") {
    return [...first].filter((v) => sets.every((s) => s.has(v)));
  }
  // difference
  return [...first].filter((v) => sets.slice(1).every((s) => !s.has(v)));
}

function expandRegion(sites: readonly number[], ctx: EvalContext): number[] {
  const out = new Set<number>(sites);
  for (const s of sites) {
    for (const n of ctx.board.topo.orthogonalNeighbours(s)) out.add(n);
  }
  return [...out];
}

// ---- direction functions ---------------------------------------------------

export function compileDirections(node: LudNode): DirectionsFn {
  const tokens = collectDirectionTokens(node);
  return { eval: (ctx) => resolveDirectionTokens(tokens, ctx) };
}

// ---- move generators -------------------------------------------------------

export function compileMoves(node: LudNode, env: CompileEnv): MovesFn {
  if (!isList(node)) {
    throw new LudemeCompileError(`Cannot compile moves from ${node.kind}.`);
  }
  const head = listHead(node);
  const rest = node.items.slice(1);
  switch (head) {
    case "move":
      return compileMoveLudeme(node, env);
    case "or": {
      const parts: MovesFn[] = [];
      for (const child of rest) {
        if (isString(child)) continue; // skip define-name leftovers
        parts.push(compileMoves(child, env));
      }
      return {
        generate: (ctx) => parts.flatMap((p) => p.generate(ctx)),
      };
    }
    default:
      throw new LudemeCompileError(`Unsupported moves ludeme: (${head} …).`);
  }
}

function compileMoveLudeme(node: LudList, env: CompileEnv): MovesFn {
  const second = node.items[1];
  // (move Add (to <region>))
  if (second && isIdent(second) && second.name === "Add") {
    const { named } = parseArgs(node.items.slice(2));
    let toRegion: RegionFn | undefined;
    const toNode = node.items.find((n) => isList(n) && listHead(n) === "to") as
      | LudList
      | undefined;
    if (toNode) {
      const inner = toNode.items[1];
      if (inner) toRegion = compileRegion(inner, env);
    }
    if (named.has("to")) {
      toRegion = compileRegion(named.get("to") as LudNode, env);
    }
    if (!toRegion) {
      throw new LudemeCompileError("(move Add …) needs a (to …) region.");
    }
    const region = toRegion;
    return {
      generate: (ctx) => {
        const out: Move[] = [];
        const mover = ctx.mover;
        for (const site of region.eval(ctx)) {
          if (site < 0) continue;
          out.push(
            new Move({
              id: `add:${site}:${mover}`,
              label: `Add at ${site}`,
              siteIndices: [site],
              mover,
              placedOwner: mover,
              actions: [new ActionAdd({ to: site, what: mover })],
            }),
          );
        }
        return out;
      },
    };
  }
  throw new LudemeCompileError("Unsupported (move …) form.");
}

// ---- end rules -------------------------------------------------------------

export function compileEnd(node: LudNode, env: CompileEnv): EndRule[] {
  // (end <ifClause>) or (end { <ifClause>* })
  if (!isList(node)) {
    throw new LudemeCompileError(`Cannot compile end from ${node.kind}.`);
  }
  const body = node.items.slice(1);
  const rules: EndRule[] = [];
  for (const child of body) {
    if (!isList(child)) continue;
    if (child.delimiter === "curly") {
      for (const inner of child.items) {
        rules.push(compileIfResult(inner, env));
      }
    } else {
      rules.push(compileIfResult(child, env));
    }
  }
  return rules;
}

function compileIfResult(node: LudNode, env: CompileEnv): EndRule {
  if (!isList(node) || listHead(node) !== "if") {
    throw new LudemeCompileError("end clause must be (if <cond> (result …)).");
  }
  const condNode = node.items[1];
  const resultNode = node.items[2];
  if (!condNode || !resultNode) {
    throw new LudemeCompileError("(if …) end clause needs cond + result.");
  }
  const cond = compileBool(condNode, env);
  const result = compileResult(resultNode);
  return {
    eval: (ctx) => (cond.eval(ctx) ? result(ctx) : undefined),
  };
}

function compileResult(
  node: LudNode,
): (ctx: EvalContext) => { winner: number } {
  if (!isList(node) || listHead(node) !== "result") {
    throw new LudemeCompileError("end clause result must be (result …).");
  }
  const roleNode = node.items[1] as LudIdent | undefined;
  const typeNode = node.items[2] as LudIdent | undefined;
  const role = roleNode && isIdent(roleNode) ? roleNode.name : "Mover";
  const type = typeNode && isIdent(typeNode) ? typeNode.name : "Win";
  return (ctx) => {
    const numPlayers = ctx.context.game.numPlayers;
    const player =
      role === "Next"
        ? (ctx.mover % numPlayers) + 1
        : role.startsWith("P") && /^P\d+$/.test(role)
          ? Number(role.slice(1))
          : ctx.mover;
    if (type === "Draw") return { winner: 0 };
    if (type === "Loss") {
      // 2-player: the other player wins; otherwise mark a draw.
      if (numPlayers === 2) return { winner: player === 1 ? 2 : 1 };
      return { winner: 0 };
    }
    // Win
    return { winner: player };
  };
}
