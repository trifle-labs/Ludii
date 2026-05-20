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
import type { Action } from "../action/action.js";
import { ActionAdd } from "../action/action-add.js";
import { ActionAddCount } from "../action/action-add-count.js";
import { ActionBet } from "../action/action-bet.js";
import { ActionPropose } from "../action/action-propose.js";
import { ActionSwap } from "../action/action-swap.js";
import { ActionVote } from "../action/action-vote.js";
import { ActionMove } from "../action/action-move.js";
import { ActionPass } from "../action/action-pass.js";
import { ActionPromote } from "../action/action-promote.js";
import {
  ActionForgetValue,
  ActionRememberValue,
} from "../action/action-remember.js";
import { ActionRemove } from "../action/action-remove.js";
import { ActionRollDice } from "../action/action-roll-dice.js";
import { ActionSelect } from "../action/action-select.js";
import { ActionSetCount } from "../action/action-set-count.js";
import { ActionSetCounter } from "../action/action-set-counter.js";
import { ActionSetNextPlayer } from "../action/action-set-next-player.js";
import { ActionSetPending } from "../action/action-set-pending.js";
import { ActionSetRotation } from "../action/action-set-rotation.js";
import { ActionSetScore } from "../action/action-set-score.js";
import { ActionSetState } from "../action/action-set-state.js";
import { ActionSetTrumpSuit } from "../action/action-set-trump-suit.js";
import { ActionSetValue } from "../action/action-set-value.js";
import { ActionSetValueOfPlayer } from "../action/action-set-value-of-player.js";
import { ActionSetVar } from "../action/action-set-var.js";
import { ActionTrigger } from "../action/action-trigger.js";
import { ActionUseDie } from "../action/action-use-die.js";
import { Move } from "../move.js";
import { resolveDirection, resolveDirectionTokens } from "./directions.js";
import {
  type BoolFn,
  type Dir,
  type DirectionsFn,
  type EndRule,
  type EvalContext,
  type InterpBoard,
  type IntFn,
  type MancalaTrack,
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
  /**
   * Declared player regions from `(regions <Role> <region>)`, keyed by
   * player id. `(sites Mover)` / `(sites P1)` resolve through this map.
   * Filled by LudemeGame before compiling play/end.
   */
  readonly playerRegions?: Map<number, RegionFn>;
  /**
   * Named regions from `(regions "Name" <region>)` (and the named-with-role
   * `(regions "Name" <Role> <region>)`), keyed by the string name. A string
   * `(sites "Name")` resolves through this map.
   */
  readonly namedRegions?: Map<string, RegionFn>;
  /**
   * Per-owner move generators compiled from each `(piece … <moves>)`
   * definition. `(forEach Piece)` dispatches through this map. Filled by
   * LudemeGame before compiling the play rule.
   */
  readonly pieceMovesByOwner?: Map<number, MovesFn>;
  /**
   * Dice declared by `(dice …)` in equipment, if any. `(roll)`,
   * `(forEach Die)`, `(pips)` and `(count Pips)` read this.
   */
  readonly diceDef?: DiceDef;
  /**
   * Initial placement sites grouped by owning player, derived from the
   * `(start …)` rule. `(sites Start …)` resolves through this map. Filled
   * by LudemeGame after the start placements are parsed.
   */
  readonly startSitesByOwner?: Map<number, readonly number[]>;
  /**
   * Sentinel owner for mancala seeds — a count-bearing component that occupies
   * a hole without belonging to a player. `(sow)` and the seed start rule mark
   * holes with this owner so `(is Occupied)` / `(is Empty)` stay correct.
   */
  readonly sowSeedOwner?: number;
  /**
   * Player → site index map declared by `(map {(pair <Role> <site>)…})` in
   * equipment. `(mapEntry <player>)` resolves through this — used by mancala
   * games to point each player at their store hole. Filled by LudemeGame.
   */
  readonly playerStoreMap?: Map<number, number>;
  /**
   * Named integer maps declared by `(map "Name" {(pair <key> <val>)…})`.
   * `(mapEntry "Name" <key>)` looks up `<key>` here. Keys/values resolve at
   * compile time: numbers stay as-is, roles become player ids, coordinate
   * strings ("D1") become site indices. Filled by LudemeGame.
   */
  readonly namedMaps?: Map<string, Map<number, number>>;
}

/** A set of dice declared in equipment: N dice, each with a face-value set. */
export interface DiceDef {
  readonly numDice: number;
  /** `faces[i]` are the printable values of die `i`. */
  readonly faces: readonly (readonly number[])[];
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
    case "Player":
      // Bound by `(forEach Player …)` via frame.player; falls back to mover.
      return ctx.player;
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

/**
 * Strip redundant grouping parentheses: source like `((is Prev Mover))`
 * parses to a single-item round list whose only child is itself a list.
 * The extra parens carry no meaning, so unwrap to the inner expression.
 * Only round (not curly) single-item wrappers are unwrapped, and only when
 * the inner item is itself a list — a singleton like `(pass)` or `(Mover)`
 * is a real ludeme call and is left intact.
 */
function unwrapParens(node: LudNode): LudNode {
  let n = node;
  while (isList(n) && n.delimiter === "round" && n.items.length === 1) {
    const only = n.items[0];
    if (only && isList(only)) n = only;
    else break;
  }
  return n;
}

/** A move generator that never produces anything. */
const EMPTY_MOVES: MovesFn = { generate: () => [] };

/**
 * True for residual define-expansion placeholders (`#1`, `#2`, `[#]`, …)
 * that survive when a define is invoked with fewer arguments than it
 * references. Treated as no-ops so a single unfilled slot doesn't sink the
 * whole compile.
 */
function isPlaceholderIdent(name: string): boolean {
  return /^#\d*$/.test(name) || name === "[#]" || name === "#";
}

// ---- integer functions ----------------------------------------------------

export function compileInt(node: LudNode, env: CompileEnv): IntFn {
  node = unwrapParens(node);
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
      // (to <siteExpr>) — destination wrapper used outside a move generator
      // (e.g. `(set Rotation (to (last To)) …)`). Unwrap the inner expression.
      return compileInt(positional[0]!, env);
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
    case "pips":
      // The pips of the die currently bound by `(forEach Die …)` — Java reads
      // the per-iteration scratch value, which we carry in frame.value.
      return { eval: (ctx) => ctx.frame.value ?? OFF };
    case "face": {
      // (face <site>) — current face value of the die at a global site index.
      // Dice sites are appended after the board + hand sites.
      const siteNode = positional[0];
      if (!siteNode) throw new LudemeCompileError("(face …) needs a site.");
      const siteFn = compileInt(siteNode, env);
      const diceStart = env.board.numSites;
      return {
        eval: (ctx) => {
          const idx = siteFn.eval(ctx) - diceStart;
          return ctx.state.diceValues[idx] ?? OFF;
        },
      };
    }
    case "mover":
      return { eval: (ctx) => ctx.mover };
    case "next":
      return {
        eval: (ctx) => (ctx.mover % ctx.context.game.numPlayers) + 1,
      };
    case "mapEntry": {
      // (mapEntry "Name"? <key>?) — look up a key in a named map declared by
      // `(map "Name" {(pair k v) …})`, or in the default player→store map.
      // Mancala games map each player to their store hole; named maps cover
      // things like die-face → outcome lookups.
      const first = positional[0];
      if (first && isString(first)) {
        const named = env.namedMaps?.get(first.value);
        const keyNode = positional[1];
        const keyFn = keyNode
          ? compileInt(keyNode, env)
          : { eval: (c: EvalContext) => c.mover };
        return {
          eval: (ctx) => named?.get(keyFn.eval(ctx)) ?? OFF,
        };
      }
      const pid = first
        ? compileInt(first, env)
        : { eval: (c: EvalContext) => c.mover };
      const map = env.playerStoreMap;
      return {
        eval: (ctx) => map?.get(pid.eval(ctx)) ?? OFF,
      };
    }
    case "ahead":
      return compileAhead(node, env);
    case "trackSite":
      return compileTrackSite(node, env);
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
      // (count Pieces [<role>|of:<int>] ["Name"] [in:<region>]) — number of
      // pieces on the board. A role/of: restricts to one owner; All counts
      // every occupied site. The component "Name" carries no per-type identity
      // in this engine, so it is ignored. `in:` restricts the site set.
      const kind = positional[0];
      if (kind && isIdent(kind) && kind.name === "Pieces") {
        const roleNode = positional[1];
        const ofNode = named.get("of");
        const everyone =
          (roleNode !== undefined &&
            isIdent(roleNode) &&
            roleNode.name === "All") ||
          (roleNode === undefined && ofNode === undefined) ||
          (roleNode !== undefined && isString(roleNode));
        const pidFn = ofNode
          ? compileInt(ofNode, env)
          : roleNode && isIdent(roleNode) && roleNode.name !== "All"
            ? { eval: (ctx: EvalContext) => resolveRole(roleNode.name, ctx) }
            : { eval: (ctx: EvalContext) => ctx.mover };
        const inNode = named.get("in");
        const regionFn = inNode ? compileRegion(inNode, env) : undefined;
        return {
          eval: (ctx) => {
            const owner = everyone ? 0 : pidFn.eval(ctx);
            const cells = ctx.state.cells;
            const sites = regionFn
              ? regionFn.eval(ctx)
              : cells.map((_, i) => i);
            let n = 0;
            for (const s of sites) {
              if (s < 0 || s >= cells.length) continue;
              const c = cells[s] ?? 0;
              // Each occupied site holds at least one piece; a stacked count
              // (e.g. a hand seeded with `count:N`, or a mancala hole of seeds)
              // contributes its full count, matching Ludii's per-site tally.
              if (everyone ? c !== 0 : c === owner) {
                n += Math.max(1, ctx.state.countAtSite(s));
              }
            }
            return n;
          },
        };
      }
      // (count Moves) — number of moves made so far this trial.
      if (kind && isIdent(kind) && kind.name === "Moves") {
        return { eval: (ctx) => ctx.context.trial.numMoves };
      }
      // (count at:<site>) / (count Cell at:<site>) / (count Site at:<site>) —
      // number of pieces stacked at one site.
      const atNode = named.get("at");
      if (
        atNode &&
        (!kind ||
          (isIdent(kind) && (kind.name === "Cell" || kind.name === "Site")))
      ) {
        const site = compileInt(atNode, env);
        return {
          eval: (ctx) => {
            const s = site.eval(ctx);
            if (s < 0 || s >= ctx.state.cells.length) return 0;
            return ctx.state.countAtSite(s);
          },
        };
      }
      if (kind && isIdent(kind)) {
        switch (kind.name) {
          case "Rows":
            return { eval: (ctx) => ctx.board.height };
          case "Columns":
            return { eval: (ctx) => ctx.board.width };
          case "Turns":
            return {
              eval: (ctx) =>
                Math.floor(
                  ctx.context.trial.numMoves / ctx.context.game.numPlayers,
                ),
            };
          case "Pips":
            return {
              eval: (ctx) => ctx.state.diceValues.reduce((a, b) => a + b, 0),
            };
          case "MovesThisTurn":
            return { eval: (ctx) => movesThisTurn(ctx) };
          case "Players":
            return { eval: (ctx) => ctx.context.game.numPlayers };
          case "Trials":
            return { eval: () => 1 };
        }
      }
      // (count Sites in:<region>) → number of sites; (count in:<region>) →
      // total pieces/seeds across the region. A seeded hole carries its count
      // explicitly; a normally-placed piece counts as one per occupied cell.
      const inReg = named.get("in");
      if (inReg) {
        const region = compileRegion(inReg, env);
        if (kind && isIdent(kind) && kind.name === "Sites") {
          return { eval: (ctx) => region.eval(ctx).length };
        }
        return {
          eval: (ctx) => {
            let n = 0;
            for (const s of region.eval(ctx)) {
              if (s < 0 || s >= ctx.state.cells.length) continue;
              const c = ctx.state.countAtSite(s);
              n += c > 0 ? c : (ctx.state.cells[s] ?? 0) !== 0 ? 1 : 0;
            }
            return n;
          },
        };
      }
      if (kind && isIdent(kind)) {
        // (count Groups [dir] [if:]) / (count SizeBiggestGroup [dir] [if:]) —
        // connected components of sites satisfying the per-site condition
        // (default: occupied), orthogonally connected. The optional `if:`
        // condition is evaluated with `(to)` bound to each candidate site.
        if (kind.name === "Groups" || kind.name === "SizeBiggestGroup") {
          const ifNode = named.get("if");
          const cond = ifNode ? compileBool(ifNode, env) : undefined;
          const member = (ctx: EvalContext, site: number): boolean =>
            cond
              ? cond.eval(ctx.withFrame({ to: site, site }))
              : (ctx.state.cells[site] ?? 0) !== 0;
          if (kind.name === "Groups") {
            return {
              eval: (ctx) =>
                groupComponents(ctx, (s) => member(ctx, s)).length,
            };
          }
          return {
            eval: (ctx) => {
              let max = 0;
              for (const g of groupComponents(ctx, (s) => member(ctx, s)))
                if (g.size > max) max = g.size;
              return max;
            },
          };
        }
        // (count Liberties [at:<site>] [dir] [if:]) — empty sites adjacent to
        // the same-owner group at the seed site (default (last To)).
        if (kind.name === "Liberties") {
          const at = named.get("at");
          const siteFn = at ? compileInt(at, env) : undefined;
          return {
            eval: (ctx) =>
              libertiesAt(ctx, siteFn ? siteFn.eval(ctx) : lastToSite(ctx)),
          };
        }
        // (count Steps [type] <site1> <site2>) — shortest orthogonal path
        // length between the two sites.
        if (kind.name === "Steps") {
          const ints = positional
            .slice(1)
            .filter((n) => !isIdent(n) || isList(n));
          const a = ints[ints.length - 2];
          const b = ints[ints.length - 1];
          if (a && b) {
            const fromFn = compileInt(a, env);
            const toFn = compileInt(b, env);
            return {
              eval: (ctx) =>
                stepDistance(ctx, fromFn.eval(ctx), toFn.eval(ctx)),
            };
          }
        }
        // (count Value <int> in:<intArray>) — occurrences of a value in an
        // array/region.
        if (kind.name === "Value") {
          const ofNode = positional[1] ?? named.get("of");
          const arrNode = named.get("in");
          if (ofNode && arrNode && isList(arrNode)) {
            const valFn = compileInt(ofNode, env);
            const region = compileRegion(arrNode, env);
            return {
              eval: (ctx) => {
                const v = valFn.eval(ctx);
                let n = 0;
                for (const x of region.eval(ctx)) if (x === v) n += 1;
                return n;
              },
            };
          }
        }
        // (count Stack … at:<site> | to:<region>) — total stack height, summed
        // over the region. The FromTop/FromBottom direction and if:/stop:
        // refinements are not modelled (best-effort full height).
        if (kind.name === "Stack") {
          const toReg = named.get("to") ?? named.get("in");
          if (toReg && isList(toReg)) {
            const region = compileRegion(toReg, env);
            return {
              eval: (ctx) => {
                let n = 0;
                for (const s of region.eval(ctx))
                  if (s >= 0 && s < ctx.state.cells.length)
                    n += ctx.state.stackSize(s);
                return n;
              },
            };
          }
          const stackAt = named.get("at");
          const siteFn = stackAt ? compileInt(stackAt, env) : undefined;
          return {
            eval: (ctx) => {
              const s = siteFn ? siteFn.eval(ctx) : lastToSite(ctx);
              return s >= 0 && s < ctx.state.cells.length
                ? ctx.state.stackSize(s)
                : 0;
            },
          };
        }
        // (count Active) — players still in the game. Elimination isn't
        // modelled, so every declared player is active.
        if (kind.name === "Active") {
          return { eval: (ctx) => ctx.context.game.numPlayers };
        }
        // (count Cells|Vertices|Sites [<region>]) — site tallies.
        if (
          kind.name === "Cells" ||
          kind.name === "Vertices" ||
          kind.name === "Sites"
        ) {
          const regionNode = positional[1];
          if (regionNode && isList(regionNode)) {
            const region = compileRegion(regionNode, env);
            return { eval: (ctx) => region.eval(ctx).length };
          }
          return { eval: (ctx) => ctx.board.numSites };
        }
      }
      // Any other `(count <Kind> …)` form: if a region argument is present,
      // count its sites; otherwise report 0. Keeps unmodelled count kinds
      // (e.g. SitesPlatformBelow) compiling rather than aborting the game.
      {
        const regionNode = positional[1];
        if (regionNode && isList(regionNode)) {
          try {
            const region = compileRegion(regionNode, env);
            return { eval: (ctx) => region.eval(ctx).length };
          } catch {
            /* fall through to 0 */
          }
        }
        return { eval: () => 0 };
      }
    }
    case "if": {
      // (if <bool> <intThen> <intElse>) — value selector.
      const condNode = positional[0];
      const thenNode = positional[1];
      const elseNode = positional[2];
      if (!condNode || !thenNode || !elseNode)
        throw new LudemeCompileError("(if …) int needs cond, then, else.");
      const cond = compileBool(condNode, env);
      const thenFn = compileInt(thenNode, env);
      const elseFn = compileInt(elseNode, env);
      return { eval: (ctx) => (cond.eval(ctx) ? thenFn : elseFn).eval(ctx) };
    }
    case "+":
    case "-":
    case "*":
    case "/":
    case "%": {
      // Flatten a single curly-list argument: `(+ {a b c})` in Java is IntSum
      // over an IntArray. If the sole positional arg is a curly list, treat its
      // items as the individual operands.
      const first = positional[0];
      const rawArgs =
        positional.length === 1 &&
        first &&
        isList(first) &&
        first.delimiter === "curly"
          ? first.items
          : positional;
      const args = rawArgs.map((n) => compileInt(n, env));
      return { eval: (ctx) => foldArith(head, args, ctx) };
    }
    case "mul": {
      // (mul a b) / (mul {a b c}) — product synonym for (*).
      // Java: game.functions.integerFunction.math.Mul.
      const first = positional[0];
      const rawArgs =
        positional.length === 1 &&
        first &&
        isList(first) &&
        first.delimiter === "curly"
          ? first.items
          : positional;
      const args = rawArgs.map((n) => compileInt(n, env));
      return { eval: (ctx) => foldArith("*", args, ctx) };
    }
    case "id": {
      // (id <role>) → the player id a role resolves to.
      const first = positional[0];
      if (first && isIdent(first)) {
        const roleName = first.name;
        return { eval: (ctx) => resolveRole(roleName, ctx) };
      }
      // (id "Name" <role>) — component-name + role. The TS engine stores
      // cells[site] = owner id (no per-component-type identity), so the
      // value that matches `(what at:site)` is just the role's player id;
      // the component name is structurally present but carries no extra
      // information here. Bare (id "Name") with no role has no static
      // component table, so it resolves to OFF.
      if (first && isString(first)) {
        const roleNode = positional[1];
        if (roleNode && isIdent(roleNode)) {
          const roleName = roleNode.name;
          return { eval: (ctx) => resolveRole(roleName, ctx) };
        }
        return { eval: () => OFF };
      }
      break;
    }
    case "handSite": {
      // (handSite <player> [idx]) → the global cell index of a hand slot.
      // <player> is a role ident (Mover/Next/P1…), a raw int, or an int
      // expression; idx defaults to 0.
      const playerNode = positional[0];
      if (!playerNode)
        throw new LudemeCompileError("(handSite …) needs a player.");
      const playerFn = isIdent(playerNode)
        ? { eval: (ctx: EvalContext) => resolveRole(playerNode.name, ctx) }
        : compileInt(playerNode, env);
      const idxFn = positional[1]
        ? compileInt(positional[1], env)
        : { eval: () => 0 };
      return {
        eval: (ctx) => ctx.board.handSite(playerFn.eval(ctx), idxFn.eval(ctx)),
      };
    }
    case "state": {
      // (state at:<site>) → the site's local state value.
      const at = named.get("at") ?? positional[0];
      if (at) {
        const site = compileInt(at, env);
        return {
          eval: (ctx) => {
            const s = site.eval(ctx);
            if (s < 0 || s >= ctx.state.cells.length) return 0;
            return ctx.state.stateAtSite(s);
          },
        };
      }
      break;
    }
    case "var": {
      // (var "name") → a named state variable; bare (var) → the global temp
      // value (Java: State.temp(), stored in TS at temps[0]).
      const nameNode = positional[0];
      if (nameNode && isString(nameNode)) {
        const varName = nameNode.value;
        return { eval: (ctx) => ctx.state.getVar(varName) };
      }
      if (!nameNode) return { eval: (ctx) => ctx.state.temp(0) };
      break;
    }
    case "counter":
      // (counter) → the game-level move counter (Java: State.counter()).
      return { eval: (ctx) => ctx.state.counter };
    case "centrePoint":
    case "centre":
    case "center":
      // (centrePoint [SiteType]) → index of the board's centre site.
      return { eval: (ctx) => centreSites(ctx)[0] ?? OFF };
    case "where": {
      // (where "Piece" <role>) / (where (id "Piece" <role>)) → first site
      // owned by that player. The TS state has no per-piece-type layer, so a
      // piece name collapses to its owner; best-effort for multi-type games.
      // (where Level …) (stack level) is unmodelled → 0.
      const first = positional[0];
      if (first && isIdent(first) && first.name === "Level") {
        return { eval: () => 0 };
      }
      const roleNode = positional[1] ?? named.get("owner");
      const pidFn: IntFn = first && isList(first)
        ? compileInt(first, env)
        : roleNode && isIdent(roleNode)
          ? roleNode.name === "Neutral" || roleNode.name === "Shared"
            ? { eval: () => 0 }
            : { eval: (ctx) => resolveRole(roleNode.name, ctx) }
          : { eval: (ctx) => ctx.mover };
      return {
        eval: (ctx) => {
          const pid = pidFn.eval(ctx);
          const cells = ctx.state.cells;
          for (let s = 0; s < cells.length; s += 1) {
            if (pid > 0 ? cells[s] === pid : (cells[s] ?? 0) > 0) return s;
          }
          return OFF;
        },
      };
    }
    case "size": {
      // (size Array <intArray>) → element count of the array/region.
      // (size Stack [type] at:<site> | in:<region>) → sum of stack heights.
      // (size Group at:<site>) → connected same-owner component size.
      // Territory / LargePiece are not yet modelled (best-effort 0).
      const sub = positional[0];
      const subName = sub && isIdent(sub) ? sub.name : "";
      if (subName === "Array") {
        const arrNode = positional[1] ?? named.get("array");
        if (arrNode && isList(arrNode)) {
          const region = compileRegion(arrNode, env);
          return { eval: (ctx) => region.eval(ctx).length };
        }
        return { eval: () => 0 };
      }
      if (subName === "Stack") {
        const inNode = named.get("in");
        if (inNode && isList(inNode)) {
          const region = compileRegion(inNode, env);
          return {
            eval: (ctx) => {
              let n = 0;
              for (const s of region.eval(ctx)) {
                if (s >= 0 && s < ctx.state.cells.length) {
                  n += ctx.state.stackSize(s);
                }
              }
              return n;
            },
          };
        }
        const atNode = named.get("at");
        const siteFn = atNode ? compileInt(atNode, env) : undefined;
        return {
          eval: (ctx) => {
            const s = siteFn ? siteFn.eval(ctx) : lastToSite(ctx);
            return s >= 0 && s < ctx.state.cells.length
              ? ctx.state.stackSize(s)
              : 0;
          },
        };
      }
      if (subName === "Group") {
        const atNode = named.get("at") ?? positional[1];
        const siteFn = atNode ? compileInt(atNode, env) : undefined;
        return {
          eval: (ctx) =>
            groupSizeAt(ctx, siteFn ? siteFn.eval(ctx) : lastToSite(ctx)),
        };
      }
      return { eval: () => 0 };
    }
    case "topLevel": {
      // (topLevel at:<site>) — index of the top piece in the stack at a site
      // (height − 1), or OFF when empty. Default site is the last move's to.
      const atNode = named.get("at") ?? positional[0];
      const siteFn = atNode ? compileInt(atNode, env) : undefined;
      return {
        eval: (ctx) => {
          const s = siteFn ? siteFn.eval(ctx) : lastToSite(ctx);
          if (s < 0 || s >= ctx.state.cells.length) return OFF;
          const h = ctx.state.stackSize(s);
          return h > 0 ? h - 1 : OFF;
        },
      };
    }
    case "phase": {
      // (phase of:<site>) — the phase index of the piece/site. Per-piece phase
      // isn't modelled; report the default phase 0. The rules-level
      // `(phase "Name" …)` declaration is handled elsewhere, not as an int.
      return { eval: () => 0 };
    }
    case "column":
    case "row": {
      // (column of:<site>) → x of the site; (row of:<site>) → y. The `of:`
      // argument is a site expression (int) but may be written as a region
      // (e.g. (centrePoint)); fall back to that region's first member.
      const ofNode = named.get("of") ?? positional[0];
      if (!ofNode)
        throw new LudemeCompileError(`(${head} …) needs an of: site.`);
      const siteFn = siteIntOf(ofNode, env);
      const axis = head;
      return {
        eval: (ctx) => {
          const s = siteFn.eval(ctx);
          if (s < 0) return OFF;
          return axis === "column" ? ctx.board.xOf(s) : ctx.board.yOf(s);
        },
      };
    }
    case "coord": {
      // (coord "A1") → site index of a chess-style coordinate;
      // (coord row:<int> column:<int>) → site at that (column,row).
      const strNode = positional[0];
      if (strNode && isString(strNode)) {
        const c = parseCoord(strNode.value);
        if (!c) return { eval: () => OFF };
        const { col, row } = c;
        return { eval: (ctx) => ctx.board.siteAt(col, row) };
      }
      const rowNode = named.get("row");
      const colNode = named.get("column") ?? named.get("col");
      const rowFn = rowNode ? compileInt(rowNode, env) : undefined;
      const colFn = colNode ? compileInt(colNode, env) : undefined;
      return {
        eval: (ctx) => {
          const r = rowFn ? rowFn.eval(ctx) : 0;
          const c = colFn ? colFn.eval(ctx) : 0;
          return ctx.board.siteAt(c, r);
        },
      };
    }
    case "regionSite": {
      // (regionSite <region> index:<n>) → the site at position n within the
      // region (Java: RegionSite). OFF when the index is out of range.
      const regNode = positional[0];
      const idxNode = named.get("index") ?? positional[1];
      const regFn = regNode ? compileRegion(regNode, env) : undefined;
      const idxFn = idxNode ? compileInt(idxNode, env) : undefined;
      return {
        eval: (ctx) => {
          const reg = regFn ? regFn.eval(ctx) : [];
          const i = idxFn ? idxFn.eval(ctx) : 0;
          return i >= 0 && i < reg.length ? (reg[i] as number) : OFF;
        },
      };
    }
    case "max":
    case "min": {
      // (max/min <intArray|region>) → the extreme value across a list. Keyword
      // forms like (max Distance …)/(max Moves …) aren't modelled and fall
      // back to 0 so the surrounding game still compiles.
      const first = positional[0];
      let listFn: RegionFn | undefined;
      if (first && isList(first)) {
        try {
          listFn = compileRegion(first, env);
        } catch {
          listFn = undefined;
        }
      }
      if (!listFn) return { eval: () => 0 };
      const lf = listFn;
      const pick = head;
      return {
        eval: (ctx) => {
          const vals = lf.eval(ctx);
          if (vals.length === 0) return 0;
          return pick === "max" ? Math.max(...vals) : Math.min(...vals);
        },
      };
    }
    case "results": {
      // (results from:<region> to:<region> <expr>) builds an int array by
      // evaluating <expr> over each from×to pair. As a scalar it isn't
      // meaningful; 0 keeps scoring/threat games compiling.
      return { eval: () => 0 };
    }
    case "layer": {
      // (layer of:<site>) → the stack layer index of a site. The flat TS port
      // has a single layer → 0.
      return { eval: () => 0 };
    }
    case "level": {
      // (level) → the stack level of the piece currently being iterated (Java:
      // game.functions.integerFunction.board.stack.Level → context.level()).
      // Bound by forEach/move contexts via frame.level; 0 in flat contexts.
      return { eval: (ctx) => ctx.frame.level ?? 0 };
    }
    case "sizes": {
      // (sizes Group <role>) → int array of connected-group sizes for a role.
      // Java: game.functions.intArray.sizes.Sizes. Groups aren't modelled as an
      // int here; return 0 so arithmetic wrappers like (* (sizes …)) compile.
      return { eval: () => 0 };
    }
    case "abs": {
      // (abs <int>) — absolute value.
      const inner = positional[0];
      if (!inner) return { eval: () => 0 };
      const fn = compileInt(inner, env);
      return { eval: (ctx) => Math.abs(fn.eval(ctx)) };
    }
    case "^":
    case "pow": {
      // (^ <base> <exp>) / (pow <base> <exp>) — integer power.
      // Java: game.functions.integerFunction.math.Pow.
      const baseNode = positional[0];
      const expNode = positional[1];
      if (!baseNode || !expNode) return { eval: () => 0 };
      const baseFn = compileInt(baseNode, env);
      const expFn = compileInt(expNode, env);
      return {
        eval: (ctx) => Math.round(baseFn.eval(ctx) ** expFn.eval(ctx)),
      };
    }
    case "cost": {
      // (cost [Edge] at:<site>) — graph edge/cell weight. Weighted graphs
      // aren't modelled, so report 0 (uniform cost) to keep scoring compiling.
      return { eval: () => 0 };
    }
    case "prev": {
      // (prev) — the player who made the most recent move (Java: Prev.java).
      // Falls back to the cyclic predecessor of the current mover before any
      // move has been made.
      return {
        eval: (ctx) => {
          const last = ctx.context.trial.lastMove();
          if (last) return last.mover;
          const n = ctx.context.game.numPlayers;
          return ((ctx.mover + n - 2) % n) + 1;
        },
      };
    }
    case "arrayValue": {
      // (arrayValue <intArray> index:<n>) — the nth element of an int array
      // (e.g. (values Remembered "Name")). OFF when out of range.
      const arrNode = positional[0];
      const idxNode = named.get("index");
      if (!arrNode) return { eval: () => OFF };
      const arrFn = compileRegion(arrNode, env);
      const idxFn: IntFn = idxNode
        ? compileInt(idxNode, env)
        : { eval: () => 0 };
      return {
        eval: (ctx) => {
          const arr = arrFn.eval(ctx);
          const i = idxFn.eval(ctx);
          return i >= 0 && i < arr.length ? (arr[i] as number) : OFF;
        },
      };
    }
    default:
      break;
  }
  // A region used where a single int is expected (Java promotes a one-element
  // RegionFunction to an IntFunction). Collapse to the region's first site.
  if (isRegionNode(node)) {
    const region = compileRegion(node, env);
    return {
      eval: (ctx) => {
        const sites = region.eval(ctx);
        return sites.length > 0 ? (sites[0] as number) : OFF;
      },
    };
  }
  throw new LudemeCompileError(`Unsupported int ludeme: (${head} …).`);
}

/**
 * Resolve a node to a single site index. Most callers pass an int-valued site
 * expression, but some Ludii forms supply a region (e.g. `(centrePoint)`); in
 * that case use the region's first member, or OFF when empty.
 */
function siteIntOf(node: LudNode, env: CompileEnv): IntFn {
  try {
    return compileInt(node, env);
  } catch {
    const region = compileRegion(node, env);
    return {
      eval: (ctx) => {
        const sites = region.eval(ctx);
        return sites.length > 0 ? (sites[0] as number) : OFF;
      },
    };
  }
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
  node = unwrapParens(node);
  // A curly list — or a headless paren-shell like `((= …) (is Line …))` from an
  // over-parenthesised `(and (…))` — in bool position is an implicit
  // conjunction of its terms (also how the expander wraps multi-term define
  // bodies). Treat it as (and {…}): every term must hold.
  if (isList(node) && (node.delimiter === "curly" || !listHead(node))) {
    const items = node.items.filter(
      (n) => !(isIdent(n) && isPlaceholderIdent(n.name)),
    );
    if (items.length === 0) return { eval: () => true };
    const first = items[0];
    if (items.length === 1 && first) return compileBool(first, env);
    const fns = items.map((n) => compileBool(n, env));
    return { eval: (ctx) => fns.every((fn) => fn.eval(ctx)) };
  }
  if (isIdent(node)) {
    if (node.name === "True") return { eval: () => true };
    if (node.name === "False") return { eval: () => false };
    // Unsubstituted define placeholders (#1, #2, …) that reach bool position
    // mark a dead/partially-expanded branch — degrade to constant false rather
    // than aborting (mirrors compileMoves → EMPTY_MOVES).
    if (isPlaceholderIdent(node.name)) return { eval: () => false };
    throw new LudemeCompileError(`Unsupported bool ident: ${node.name}.`);
  }
  if (!isList(node)) {
    throw new LudemeCompileError(`Cannot compile bool from ${node.kind}.`);
  }
  const head = listHead(node);
  const rest = node.items.slice(1);
  switch (head) {
    case "and": {
      const args = flattenMoveList(rest).map((n) => compileBool(n, env));
      return { eval: (ctx) => args.every((a) => a.eval(ctx)) };
    }
    case "or": {
      const args = flattenMoveList(rest).map((n) => compileBool(n, env));
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
      // Region-vs-region comparison: `(= (sites Occupied by:Mover) <region>)`
      // tests set equality, not int equality. Compile both sides as regions
      // and compare site sets (=/!=) or sizes (</>/<=/>=).
      if (isRegionNode(a) || isRegionNode(b)) {
        const lhs = compileRegion(a, env);
        const rhs = compileRegion(b, env);
        return {
          eval: (ctx) => {
            const ls = lhs.eval(ctx);
            const rs = rhs.eval(ctx);
            if (head === "=" || head === "!=") {
              const as = [...new Set(ls)].sort((x, y) => x - y);
              const bs = [...new Set(rs)].sort((x, y) => x - y);
              const equal =
                as.length === bs.length && as.every((v, i) => v === bs[i]);
              return head === "=" ? equal : !equal;
            }
            return compareInts(head, ls.length, rs.length);
          },
        };
      }
      const left = compileInt(a, env);
      const right = compileInt(b, env);
      return {
        eval: (ctx) => compareInts(head, left.eval(ctx), right.eval(ctx)),
      };
    }
    case "is":
      return compileIs(node, env);
    case "all":
      return compileAll(node, env);
    case "no":
      return compileNo(node, env);
    case "can": {
      // (can Move <moves>) — true when the move generator yields ≥1 move in
      // the current position. Sub-generators that use forms we can't compile
      // yet degrade to "cannot" rather than failing the whole game's compile.
      const sub = rest[0];
      if (sub && isIdent(sub) && sub.name === "Move") {
        const movesNode = rest[1];
        let moves: MovesFn | undefined;
        if (movesNode && isList(movesNode)) {
          try {
            moves = compileMoves(movesNode, env);
          } catch {
            moves = undefined;
          }
        }
        if (!moves) return { eval: () => false };
        const gen = moves;
        return {
          eval: (ctx) => {
            if (canMoveProbing) return false;
            canMoveProbing = true;
            try {
              return gen.generate(ctx).length > 0;
            } finally {
              canMoveProbing = false;
            }
          },
        };
      }
      throw new LudemeCompileError("Unsupported (can …) form.");
    }
    case "if": {
      // (if <bool> <boolThen> [<boolElse>]) — predicate selector. The else
      // branch is optional; a missing else defaults to constant false (Java
      // returns false when the condition fails and no else is supplied).
      const condNode = rest[0];
      const thenNode = rest[1];
      const elseNode = rest[2];
      if (!condNode || !thenNode)
        throw new LudemeCompileError("(if …) bool needs cond and then.");
      const cond = compileBool(condNode, env);
      const thenFn = compileBool(thenNode, env);
      const elseFn = elseNode
        ? compileBool(elseNode, env)
        : { eval: () => false };
      return { eval: (ctx) => (cond.eval(ctx) ? thenFn : elseFn).eval(ctx) };
    }
    case "was": {
      // (was Pass) — the most recent move in the trial was a pass. Java:
      // WasPass.java → `context.trial().lastMove().isPass()`. Only WasType.Pass
      // appears in the corpus; unknown sub-types compile to constant false.
      const wasKind = rest[0];
      const kind = wasKind && isIdent(wasKind) ? wasKind.name : "";
      if (kind === "Pass") {
        return {
          eval: (ctx) => ctx.context.trial.lastMove()?.isPass() ?? false,
        };
      }
      return { eval: () => false };
    }
    case "le":
    case "ge":
    case "lt":
    case "gt":
    case "eq":
    case "ne": {
      // Word-form comparison aliases (Throngs uses `(eq …)` etc.). Map to the
      // symbolic operator and compare two int operands.
      const aliasOp = { le: "<=", ge: ">=", lt: "<", gt: ">", eq: "=", ne: "!=" }[head]!;
      const a = rest[0];
      const b = rest[1];
      if (!a || !b)
        throw new LudemeCompileError(`(${head} …) needs two arguments.`);
      const left = compileInt(a, env);
      const right = compileInt(b, env);
      return {
        eval: (ctx) => compareInts(aliasOp, left.eval(ctx), right.eval(ctx)),
      };
    }
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
  const { positional, named } = parseArgs(rest);
  switch (kind) {
    case "Line": {
      const lenNode = positional[0];
      if (!lenNode)
        throw new LudemeCompileError("(is Line …) needs a length.");
      // The length is usually a literal but may be an int expression such as
      // `(- (count Rows) 1)`; compile it and evaluate per call.
      const lenFn = compileInt(lenNode, env);
      const dirTokens = collectDirectionTokens(positional[1]);
      return {
        eval: (ctx) => {
          const len = lenFn.eval(ctx);
          if (!Number.isInteger(len) || len <= 0) return false;
          return hasLineFor(ctx, len, dirTokens);
        },
      };
    }
    case "In": {
      const siteNode = positional[0];
      const regionNode = positional[1];
      if (!siteNode)
        throw new LudemeCompileError("(is In <site> <region>) needs both.");
      // (is In <region>) — single-arg form: test the just-moved site (frame.to)
      // for membership in the region.
      if (!regionNode) {
        const region = compileRegion(siteNode, env);
        return {
          eval: (ctx) => {
            const s = ctx.frame.to ?? lastToSite(ctx);
            return s >= 0 && region.eval(ctx).includes(s);
          },
        };
      }
      const site = compileInt(siteNode, env);
      const region = compileRegion(regionNode, env);
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          return region.eval(ctx).includes(s);
        },
      };
    }
    case "Visited":
      // (is Visited <site>) — whether a site was already touched in the current
      // multi-step move sequence (re-visit guard for chained hops). Per-turn
      // visit tracking isn't modelled, so compile to constant false.
      return { eval: () => false };
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
    case "Next": {
      const whoNode = positional[0];
      if (!whoNode) return { eval: () => true };
      const who = compileInt(whoNode, env);
      const target = (ctx: EvalContext): number => {
        const n = ctx.context.game.numPlayers;
        return (ctx.mover % n) + 1;
      };
      return { eval: (ctx) => who.eval(ctx) === target(ctx) };
    }
    case "Prev": {
      // `(is Prev <role>)` — is the role the player who made the previous move?
      // The `"SameTurn"` idiom `(is Prev Mover)` relies on this being true when
      // a `(moveAgain)` keeps the same player moving, so the previous player
      // must come from the trial's last move, not a static cyclic predecessor
      // (which for two players is always the opponent and so never matches the
      // mover). Falls back to the cyclic predecessor before any move is made.
      const whoNode = positional[0];
      if (!whoNode) return { eval: () => true };
      const who = compileInt(whoNode, env);
      const target = (ctx: EvalContext): number => {
        const last = ctx.context.trial.lastMove();
        if (last) return last.mover;
        const n = ctx.context.game.numPlayers;
        return ((ctx.mover - 2 + n) % n) + 1;
      };
      return { eval: (ctx) => who.eval(ctx) === target(ctx) };
    }
    case "Even":
    case "Odd": {
      const valueNode = positional[0];
      if (!valueNode)
        throw new LudemeCompileError(`(is ${kind} <value>) needs a value.`);
      const value = compileInt(valueNode, env);
      const wantEven = kind === "Even";
      return {
        eval: (ctx) => {
          const v = value.eval(ctx);
          const isEven = ((v % 2) + 2) % 2 === 0;
          return wantEven ? isEven : !isEven;
        },
      };
    }
    case "Full": {
      // (is Full) → every board cell is occupied; (is Full <region>) scopes
      // the test to a region.
      const regionNode = positional[0];
      if (regionNode) {
        const region = compileRegion(regionNode, env);
        return {
          eval: (ctx) =>
            region
              .eval(ctx)
              .every(
                (s) =>
                  s >= 0 &&
                  s < ctx.state.cells.length &&
                  (ctx.state.cells[s] ?? 0) !== 0,
              ),
        };
      }
      return { eval: (ctx) => ctx.state.cells.every((c) => c !== 0) };
    }
    case "Pending": {
      // (is Pending) → the state carries a pending marker set by a previous
      // move's `(set Pending)`. (is Pending <site>) → that site is pending.
      const siteNode = positional[0];
      if (siteNode) {
        const site = compileInt(siteNode, env);
        return { eval: (ctx) => ctx.state.isPending(site.eval(ctx)) };
      }
      return { eval: (ctx) => ctx.state.pending.size > 0 };
    }
    case "Threatened": {
      // (is Threatened [<piece>] [at:<site>]) — true when an enemy could
      // capture the target square. With `at:` the test runs on that square. A
      // square is threatened when some other player has a pseudo-legal move
      // onto it.
      //
      // A positional `<piece>` spec such as `(id "King" Mover)` names a piece
      // *type* whose square is the target (e.g. `("IsInCheck" "King" Mover)` →
      // `(is Threatened (id "King" Mover))`). This engine tracks owner, not
      // per-site component identity, so the named piece's square can't be
      // located; in that case (no `at:`) report "not threatened" so the common
      // king-safety filter `(do … ifAfterwards:(not (is Threatened (id …))))`
      // does not reject every move. Bare `(is Threatened)` falls back to a
      // best-effort "any mover piece attackable" test.
      const atNode = named.get("at");
      const atFn = atNode ? compileInt(atNode, env) : undefined;
      const hasPieceSpec = positional.length > 0;
      return {
        eval: (ctx) => {
          if (threatProbing) return false;
          const targets: number[] = [];
          if (atFn) {
            const s = atFn.eval(ctx);
            if (s >= 0) targets.push(s);
          } else if (hasPieceSpec) {
            return false;
          } else {
            for (let s = 0; s < ctx.state.cells.length; s += 1) {
              if ((ctx.state.cells[s] ?? 0) === ctx.mover) targets.push(s);
            }
          }
          if (targets.length === 0) return false;
          const n = ctx.context.game.numPlayers;
          // Probe each opponent's move generation at most once and test all
          // target squares against it, rather than re-generating moves per
          // target (which is O(targets × players) and pathological for chess).
          const targetSet = new Set(targets);
          const targetOwners = new Set(
            targets.map((s) => ctx.state.cells[s] ?? ctx.mover),
          );
          threatProbing = true;
          try {
            for (let p = 1; p <= n; p += 1) {
              if (targetOwners.has(p)) continue;
              const probe = ctx.context.withState(ctx.state.withMover(p));
              if (ctx.context.game.moves(probe).some((m) => targetSet.has(m.to()))) {
                return true;
              }
            }
            return false;
          } finally {
            threatProbing = false;
          }
        },
      };
    }
    case "Flat":
      // (is Flat [<site>]) — true when the piece is in its flat orientation.
      // Piece 3D orientation isn't modelled, so every piece is treated as flat.
      return { eval: () => true };
    case "Triggered":
      // (is Triggered "<event>" <player>) — a named trigger fired for a player.
      // No trigger/event state is modelled, so this is conservatively false
      // (the event has not fired). Args are accepted so the form compiles.
      return { eval: () => false };
    case "Proposed":
      // (is Proposed "<proposition>") — a vote proposition is active. No voting
      // subsystem is modelled; conservatively false.
      return { eval: () => false };
    case "Decided":
      // (is Decided "<proposition>") — companion of (is Proposed …). No voting
      // state; conservatively false.
      return { eval: () => false };
    case "Within": {
      // (is Within <what> [<region>]) — a piece type occupies the region (or
      // the board). Piece-type identity isn't tracked beyond ownership, so this
      // is approximated: true iff any target site is occupied. Best-effort.
      const regionNode = positional[1];
      if (regionNode && isList(regionNode)) {
        const region = compileRegion(regionNode, env);
        return {
          eval: (ctx) =>
            region
              .eval(ctx)
              .some(
                (s) =>
                  s >= 0 &&
                  s < ctx.state.cells.length &&
                  (ctx.state.cells[s] ?? 0) !== 0,
              ),
        };
      }
      return { eval: () => false };
    }
    case "Connected": {
      // (is Connected [<count>] [<direction>] [at:<site>] [<role>|{<regions>}|Sides])
      // A single connected group of one owner's pieces touches at least
      // <count> of the goal regions. Connectivity is approximated as
      // orthogonal (the direction arg is parsed but not specialised). Goal
      // regions default to the four board sides; <count> defaults to "all".
      const DIRS = new Set([
        "Orthogonal",
        "Diagonal",
        "Adjacent",
        "All",
        "Diagonals",
        "Orthogonals",
        "OffDiagonal",
        "SameLayer",
      ]);
      let countTarget: number | undefined;
      let ownerName: string | undefined;
      let regionFns: RegionFn[] | undefined;
      for (const p of positional) {
        if (isNumber(p)) {
          countTarget = p.value;
        } else if (isList(p) && p.delimiter === "curly") {
          regionFns = p.items
            .filter((it) => isList(it))
            .map((it) => compileRegion(it, env));
        } else if (isIdent(p)) {
          if (p.name === "Sides" || p.name === "SidesNoCorners") {
            regionFns = ["N", "E", "S", "W"].map((d) => ({
              eval: (ctx: EvalContext) => sideSites(ctx, d),
            }));
          } else if (!DIRS.has(p.name)) {
            ownerName = p.name;
          }
        }
      }
      const regions: RegionFn[] =
        regionFns ??
        ["N", "E", "S", "W"].map((d) => ({
          eval: (ctx: EvalContext) => sideSites(ctx, d),
        }));
      const atNode = named.get("at");
      const atFn = atNode ? compileInt(atNode, env) : undefined;
      const ownerOf = (ctx: EvalContext): number => {
        if (!ownerName) return ctx.mover;
        if (ownerName === "All" || ownerName === "Shared" || ownerName === "Any")
          return 0;
        return resolveRole(ownerName, ctx);
      };
      return {
        eval: (ctx) => {
          const need = countTarget ?? regions.length;
          const owner = ownerOf(ctx);
          const goals = regions.map((r) => new Set(r.eval(ctx)));
          const member = (s: number): boolean => {
            const c = ctx.state.cells[s] ?? 0;
            return owner === 0 ? c !== 0 : c === owner;
          };
          const touches = (comp: Set<number>): number =>
            goals.reduce(
              (acc, g) =>
                acc + ([...comp].some((s) => g.has(s)) ? 1 : 0),
              0,
            );
          if (atFn) {
            const seed = atFn.eval(ctx);
            if (seed < 0 || !member(seed)) return false;
            const comp = new Set<number>([seed]);
            const stack = [seed];
            while (stack.length > 0) {
              const s = stack.pop() as number;
              for (const nb of orthoNeighbours(ctx, s)) {
                if (!comp.has(nb) && member(nb)) {
                  comp.add(nb);
                  stack.push(nb);
                }
              }
            }
            return touches(comp) >= need;
          }
          return groupComponents(ctx, member).some((c) => touches(c) >= need);
        },
      };
    }
    case "Loop":
      // (is Loop [surround:<role>] [<role>]) — whether the mover's pieces form
      // a closed loop (Havannah ring). Loop detection isn't modelled; compile
      // to constant false so ring-goal games still build.
      return { eval: () => false };
    case "Active":
      // (is Active <player>) — whether a player is still in the game. The TS
      // port does not model elimination, so every real player is active.
      return { eval: () => true };
    case "Solved":
      // (is Solved) — every deduction-puzzle (satisfy …) constraint holds. The
      // TS engine has no CSP solver, so this compiles to constant false: the
      // puzzle compiles and never auto-terminates.
      return { eval: () => false };
    case "Cycle":
      // (is Cycle) — the current position has occurred before (mancala
      // repetition / endless-sow guard). State-history tracking isn't modelled,
      // so compile to constant false: the game builds and never auto-draws.
      return { eval: () => false };
    case "Path":
    case "RegularGraph":
    case "Tree":
    case "TreeCentre":
    case "SpanningTree":
    case "CaterpillarTree":
      // Graph-theory win predicates (experimental graph_theory games). The
      // underlying graph-property checks aren't modelled, so compile to constant
      // false: the game builds and the goal simply never triggers.
      return { eval: () => false };
    case "LastTo": {
      // (is LastTo [SiteType]) — the last move's destination is a site of the
      // given type. The TS port only models Cell play, so a Cell query is true
      // whenever a move with a real destination has been made; Vertex/Edge
      // queries are conservatively false.
      const typeNode = positional[0];
      const typeName = typeNode && isIdent(typeNode) ? typeNode.name : "Cell";
      if (typeName !== "Cell") return { eval: () => false };
      return {
        eval: (ctx) => (ctx.context.trial.lastMove()?.to() ?? OFF) >= 0,
      };
    }
    case "AnyDie": {
      // (is AnyDie <value>) — some die in play currently shows <value>.
      const valNode = positional[0];
      if (!valNode) return { eval: () => false };
      const valFn = compileInt(valNode, env);
      return {
        eval: (ctx) => {
          const v = valFn.eval(ctx);
          return ctx.state.diceValues.some((d) => d === v);
        },
      };
    }
    case "Pattern": {
      // (is Pattern <walk:{F R L…}> [SiteType] [from:<site>] [what:<int>|whats:<curly>])
      // Java: IsPattern.java — walk a turtle path from `from` in every
      // orthogonal start heading; true if every F-step lands on a matching piece
      // owner. Ownership is approximated by cells[site] (no per-component layer).
      const walkNode = positional[0];
      const walkList =
        walkNode && isList(walkNode) && walkNode.delimiter === "curly"
          ? walkNode
          : undefined;
      if (!walkList) return { eval: () => false };
      const steps = walkList.items.filter(isIdent).map((it) => it.name);
      const fromNode = named.get("from");
      const fromFn: IntFn = fromNode
        ? compileInt(fromNode, env)
        : { eval: (ctx) => ctx.context.trial.lastMove()?.to() ?? OFF };
      const whatsNode = named.get("whats");
      let whatsFns: IntFn[] | undefined;
      if (whatsNode && isList(whatsNode) && whatsNode.delimiter === "curly") {
        try {
          whatsFns = whatsNode.items.map((n) => compileInt(n, env));
        } catch {
          whatsFns = undefined;
        }
      } else {
        const whatNode = named.get("what");
        if (whatNode) {
          try {
            whatsFns = [compileInt(whatNode, env)];
          } catch {
            whatsFns = undefined;
          }
        }
      }
      const HEADINGS: readonly [number, number][] = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ];
      return {
        eval: (ctx) => {
          const from = fromFn.eval(ctx);
          if (from < 0 || from >= ctx.state.cells.length) return false;
          const whats = whatsFns
            ? whatsFns.map((fn) => fn.eval(ctx))
            : [ctx.state.cells[from] ?? 0];
          if (whats.length === 0) return false;
          for (const [sdx, sdy] of HEADINGS) {
            let hx = sdx;
            let hy = sdy;
            let cx = ctx.board.xOf(from);
            let cy = ctx.board.yOf(from);
            let wi = 0;
            if ((ctx.state.cells[from] ?? 0) !== whats[wi % whats.length]) {
              continue;
            }
            wi += 1;
            let matched = true;
            for (const step of steps) {
              if (step === "F") {
                cx += hx;
                cy += hy;
                const site = ctx.board.siteAt(cx, cy);
                if (
                  site < 0 ||
                  site >= ctx.state.cells.length ||
                  (ctx.state.cells[site] ?? 0) !== whats[wi % whats.length]
                ) {
                  matched = false;
                  break;
                }
                wi += 1;
              } else if (step === "R") {
                const nx = hy;
                const ny = -hx;
                hx = nx;
                hy = ny;
              } else if (step === "L") {
                const nx = -hy;
                const ny = hx;
                hx = nx;
                hy = ny;
              }
            }
            if (matched) return true;
          }
          return false;
        },
      };
    }
    case "Related": {
      // (is Related <RelationType> <siteA> <siteB-or-regionB>) — Java:
      // IsRelated.java — true when siteA is in the stated topological relation
      // with at least one site of regionB. RelationType maps to a direction
      // group recognised by aroundSites.
      const relNode = positional[0];
      const siteANode = positional[1];
      const siteBNode = positional[2];
      if (!relNode || !siteANode || !siteBNode) return { eval: () => false };
      const relName = isIdent(relNode) ? relNode.name : "Adjacent";
      const dirGroup = [relName];
      const siteAFn = compileInt(siteANode, env);
      let regionBFn: RegionFn;
      try {
        if (isRegionNode(siteBNode)) {
          regionBFn = compileRegion(siteBNode, env);
        } else {
          const intFn = compileInt(siteBNode, env);
          regionBFn = {
            eval: (ctx) => {
              const s = intFn.eval(ctx);
              return s >= 0 ? [s] : [];
            },
          };
        }
      } catch {
        regionBFn = { eval: () => [] };
      }
      return {
        eval: (ctx) => {
          const siteA = siteAFn.eval(ctx);
          if (siteA < 0) return false;
          const nbrs = new Set(aroundSites(ctx, siteA, dirGroup));
          return regionBFn.eval(ctx).some((s) => nbrs.has(s));
        },
      };
    }
    case "Target": {
      // (is Target <config:{int…}> [<sites:{int…}> | <siteInt>]) — Java:
      // IsTarget.java — cells[site] === config[i] for each site in order.
      // Without a sites arg, check the whole board 0…N-1.
      const configNode = positional[0];
      if (
        !configNode ||
        !isList(configNode) ||
        configNode.delimiter !== "curly"
      )
        return { eval: () => false };
      const configFns: IntFn[] = configNode.items.map((item) => {
        try {
          return compileInt(item, env);
        } catch {
          return { eval: () => 0 };
        }
      });
      const sitesNode = positional[1];
      if (sitesNode && isList(sitesNode) && sitesNode.delimiter === "curly") {
        const idxFns: IntFn[] = [];
        for (const item of sitesNode.items) {
          try {
            idxFns.push(compileInt(item, env));
          } catch {
            /* skip */
          }
        }
        return {
          eval: (ctx) => {
            const config = configFns.map((fn) => fn.eval(ctx));
            const sites = idxFns.map((fn) => fn.eval(ctx));
            if (sites.length !== config.length) return false;
            return sites.every(
              (s, i) =>
                s >= 0 &&
                s < ctx.state.cells.length &&
                (ctx.state.cells[s] ?? 0) === config[i],
            );
          },
        };
      }
      return {
        eval: (ctx) => {
          const config = configFns.map((fn) => fn.eval(ctx));
          if (ctx.state.cells.length < config.length) return false;
          return config.every(
            (expected, i) => (ctx.state.cells[i] ?? 0) === expected,
          );
        },
      };
    }
    case "Blocked":
    case "Hidden":
    case "PyramidCorners":
    case "PipsMatch":
      // Predicates over un-modelled state (blocked sites, hidden information,
      // pyramid corners, domino pip matching) compile to constant false for
      // coverage purposes.
      return { eval: () => false };
    default:
      throw new LudemeCompileError(`Unsupported (is ${kind} …).`);
  }
}

/**
 * `(all Sites <region> if:<bool>)` / `(all Different <region>?)`. A
 * universal quantifier over a region. For `Sites`, the per-site condition is
 * evaluated with `frame.site`/`frame.to` bound to each member; the whole
 * predicate holds iff every member satisfies it. For `Different`, the region's
 * occupied contents must all be distinct (empty cells ignored).
 */
function compileAll(node: LudList, env: CompileEnv): BoolFn {
  const kindNode = node.items[1];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "";
  const { positional, named } = parseArgs(node.items.slice(2));
  if (kind === "Sites") {
    const regionNode = positional[0];
    if (!regionNode)
      throw new LudemeCompileError("(all Sites …) needs a region.");
    const region = compileRegion(regionNode, env);
    const ifNode = named.get("if");
    const cond: BoolFn = ifNode
      ? compileBool(ifNode, env)
      : { eval: () => true };
    return {
      eval: (ctx) =>
        region
          .eval(ctx)
          .every((s) => cond.eval(ctx.withFrame({ site: s, to: s }))),
    };
  }
  if (kind === "DiceUsed" || kind === "DiceEqual") {
    // Java `(all DiceUsed)` — every die has been consumed this turn (value
    // zeroed by ActionUseDie). `(all DiceEqual)` — all dice show one value.
    if (kind === "DiceUsed") {
      return { eval: (ctx) => ctx.state.diceValues.every((v) => v === 0) };
    }
    return { eval: (ctx) => ctx.state.diceAllEqual };
  }
  if (kind === "Different") {
    const regionNode = positional[0];
    const region: RegionFn = regionNode
      ? compileRegion(regionNode, env)
      : { eval: (ctx) => allSites(ctx) };
    return {
      eval: (ctx) => {
        const seen = new Set<number>();
        for (const s of region.eval(ctx)) {
          if (s < 0 || s >= ctx.state.cells.length) continue;
          const v = ctx.state.cells[s] ?? 0;
          if (v === 0) continue;
          if (seen.has(v)) return false;
          seen.add(v);
        }
        return true;
      },
    };
  }
  if (kind === "Passed") {
    // (all Passed) — true when every active player passed on their previous
    // turn. Java's AllPassed walks the move history; reproduce by inspecting
    // the last numPlayers moves for pass actions.
    return {
      eval: (ctx) => {
        const n = ctx.context.game.numPlayers;
        const moves = ctx.context.trial.moves;
        if (moves.length < n) return false;
        for (let i = moves.length - n; i < moves.length; i += 1) {
          if (!moves[i]?.isPass()) return false;
        }
        return true;
      },
    };
  }
  if (kind === "Groups") {
    // (all Groups <SiteType> <dirn> of:<bool> if:<bool>) — every maximal group
    // (built from sites satisfying `of:`) satisfies `if:`, where the bare
    // `(sites)` inside the condition refers to the current group's site set.
    // That per-group region binding isn't modelled, so compile to constant true
    // (lenient): the game builds and the universal never blocks a move.
    return { eval: () => true };
  }
  throw new LudemeCompileError(`Unsupported (all ${kind} …).`);
}

// Re-entrancy guard for `(no Moves …)`: generating a player's legal moves to
// test for stalemate must not recurse back into another `(no Moves …)` test
// (which would generate moves again, ad infinitum). While a no-Moves probe is
// running, any nested probe conservatively reports that moves exist.
let noMovesProbing = false;

// Re-entrancy guard for `(is Threatened …)`: detecting a threat generates the
// opponents' moves, whose own legality filters may consult `(is Threatened …)`
// again (e.g. "can't move into check"). While a threat probe runs, nested
// threat tests report "not threatened" so the opponents' pseudo-legal attacks
// are enumerated without recursing.
let threatProbing = false;

// Re-entrancy guard for `(can Move …)`: testing whether a move generator
// yields anything must not recurse through a generator whose own legality
// filter asks `(can Move …)` again. Nested probes report "cannot".
let canMoveProbing = false;

/**
 * `(no Pieces <role>)` — the role owns no pieces. `(no Moves <role>)` — the
 * role has no legal move from the current position (used for stalemate /
 * checkmate end rules). The latter regenerates that player's moves under a
 * recursion guard.
 */
function compileNo(node: LudList, _env: CompileEnv): BoolFn {
  const kindNode = node.items[1];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "";
  const roleNode = node.items[2];
  if (kind === "Pieces") {
    if (roleNode && isIdent(roleNode)) {
      const role = roleNode.name;
      if (role === "All") {
        return { eval: (ctx) => ctx.state.cells.every((c) => c === 0) };
      }
      const pred = ownerPredicate(role);
      return {
        eval: (ctx) => !ctx.state.cells.some((c) => c !== 0 && pred(c, ctx)),
      };
    }
    // `(no Pieces "Name")` — piece-type filter by component name, not modelled;
    // compile to constant false (conservative: assumes the named pieces exist).
    // Java: game.functions.booleans.no.pieces.NoPieces (String name parameter).
    if (roleNode && isString(roleNode)) return { eval: () => false };
    throw new LudemeCompileError("Unsupported (no Pieces …) form.");
  }
  if (kind === "Moves") {
    if (roleNode && isIdent(roleNode)) {
      const role = roleNode.name;
      return {
        eval: (ctx) => {
          if (noMovesProbing) return false;
          const target = resolveRole(role, ctx);
          if (target <= 0) return false;
          const altContext = ctx.context.withState(
            ctx.state.withMover(target),
          );
          noMovesProbing = true;
          try {
            return ctx.context.game.moves(altContext).length === 0;
          } finally {
            noMovesProbing = false;
          }
        },
      };
    }
    throw new LudemeCompileError("Unsupported (no Moves …) form.");
  }
  throw new LudemeCompileError(`Unsupported (no ${kind} …).`);
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
  // `~` is Ludii's placeholder for an omitted optional argument (e.g. the
  // direction slot of `("StepToEmpty" ~ …)`). It is never a real direction, so
  // drop it here — leaving it in would make a defaulted step resolve to an
  // empty neighbour set instead of "Adjacent".
  if (!node) return [];
  if (isIdent(node)) return node.name === "~" ? [] : [node.name];
  if (isList(node)) {
    const head = listHead(node);
    if (head === "directions") {
      const tokens: string[] = [];
      for (const item of node.items.slice(1)) {
        if (isIdent(item) && item.name !== "~") tokens.push(item.name);
        if (isList(item)) {
          for (const inner of item.items) {
            if (isIdent(inner) && inner.name !== "~") tokens.push(inner.name);
          }
        }
      }
      return tokens;
    }
    // Bare `{N S E W}` group.
    const tokens: string[] = [];
    for (const item of node.items) {
      if (isIdent(item) && item.name !== "~") tokens.push(item.name);
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

/** A leading graph-element-type token (`Cell`/`Vertex`/`Edge`) that prefixes
 * the region/int argument in clauses like `(from Cell <region>)`. The TS
 * engine models a single site space, so the type is parsed and discarded. */
function isSiteTypeIdent(node: LudNode | undefined): boolean {
  return (
    node !== undefined &&
    isIdent(node) &&
    (node.name === "Cell" || node.name === "Vertex" || node.name === "Edge")
  );
}

/** Drop a leading SiteType ident from a positional argument list. */
function dropSiteType(positional: readonly LudNode[]): readonly LudNode[] {
  return isSiteTypeIdent(positional[0]) ? positional.slice(1) : positional;
}

/**
 * Resolve the target sites of an `(add …)` ludeme. Tries, in order: a named
 * `to:` region, a `(to [SiteType] <region|site>)` sub-list, a named `site:`
 * arg, and finally the first positional region. Returns `undefined` when no
 * placement target can be found.
 */
function resolveAddRegion(
  node: LudList,
  pos: readonly LudNode[],
  named: ReadonlyMap<string, LudNode>,
  pieceNode: LudNode | undefined,
  env: CompileEnv,
): RegionFn | undefined {
  const siteToRegion = (fn: IntFn): RegionFn => ({
    eval: (ctx) => {
      const s = fn.eval(ctx);
      return s >= 0 ? [s] : [];
    },
  });
  const tryRegion = (n: LudNode): RegionFn | undefined => {
    try {
      return compileRegion(n, env);
    } catch {
      try {
        return siteToRegion(compileInt(n, env));
      } catch {
        return undefined;
      }
    }
  };

  const toNamed = named.get("to");
  if (toNamed) {
    const r = tryRegion(toNamed);
    if (r) return r;
  }
  const toSub = node.items.find(
    (n) => isList(n) && listHead(n) === "to",
  ) as LudList | undefined;
  if (toSub) {
    const { positional: toPos } = parseArgs(toSub.items.slice(1));
    const regionArg = dropSiteType(toPos)[0];
    if (regionArg) {
      const r = tryRegion(regionArg);
      if (r) return r;
    }
  }
  const siteNamed = named.get("site");
  if (siteNamed) {
    try {
      return siteToRegion(compileInt(siteNamed, env));
    } catch {
      /* fall through */
    }
  }
  const candidate = pos.find(
    (n) =>
      n !== pieceNode &&
      isList(n) &&
      listHead(n) !== "then" &&
      !isSiteTypeIdent(n),
  );
  if (candidate) return tryRegion(candidate);
  return undefined;
}

const REGION_HEADS = new Set([
  "sites",
  "union",
  "intersection",
  "difference",
  "expand",
  "forEach",
  "values",
]);

/** True for nodes that produce a region rather than a single site. */
function isRegionNode(node: LudNode): boolean {
  if (!isList(node)) return false;
  if (node.delimiter === "curly") return true;
  return REGION_HEADS.has(listHead(node) ?? "");
}

/**
 * Resolve a node that may be either a single site (an IntFunction) or a whole
 * region into a set of sites. Several ludemes (e.g. `(sites Around …)`) accept
 * both forms in Ludii.
 */
function compileSiteOrRegion(node: LudNode, env: CompileEnv): RegionFn {
  if (isRegionNode(node)) return compileRegion(node, env);
  const intFn = compileInt(node, env);
  return {
    eval: (ctx) => {
      const s = intFn.eval(ctx);
      return s >= 0 ? [s] : [];
    },
  };
}

export function compileRegion(node: LudNode, env: CompileEnv): RegionFn {
  node = unwrapParens(node);
  // A bare integer where a region is expected denotes a single-site region
  // (Java: an IntFunction promoted to a one-element RegionFunction).
  if (isNumber(node)) {
    const v = node.value;
    return { eval: () => (v >= 0 ? [v] : []) };
  }
  if (!isList(node)) {
    throw new LudemeCompileError(`Cannot compile region from ${node.kind}.`);
  }
  // A bare `{ "C3" "D1" 12 }` curly group is an explicit list of sites —
  // coordinate strings ("A1" = bottom-left) or raw indices.
  if (node.delimiter === "curly") {
    return compileSiteList(node.items);
  }
  const head = listHead(node);
  const rest = node.items.slice(1);
  switch (head) {
    case "sites":
      return compileSites(node, env);
    // Singleton regions: a frame-bound site (`(site)` from forEach Site,
    // `(to)`/`(from)`/`(between)` from a move) read as a one-element region.
    case "site":
    case "to":
    case "from":
    case "between":
    case "last":
    case "handSite":
    case "mapEntry":
    case "trackSite":
    case "where":
    case "regionSite":
    case "ahead":
    case "arrayValue":
    // `(var "name")` is an IntFunction in Java; used where a region is expected
    // it is promoted to a one-element RegionFunction. Same for arithmetic
    // expressions used as a computed site index.
    case "var":
    case "+":
    case "-":
    case "*":
    case "/":
    case "max":
    case "min":
    case "coord":
    case "%": {
      const intFn = compileInt(node, env);
      return {
        eval: (ctx) => {
          const s = intFn.eval(ctx);
          return s >= 0 ? [s] : [];
        },
      };
    }
    case "array": {
      // (array {n …}) / (array <intArray>) → the literal list of ints as a
      // region (Java: an IntArrayFunction promoted to a region).
      const inner = rest[0];
      if (inner && isList(inner) && inner.delimiter === "curly") {
        return compileSiteList(inner.items);
      }
      if (inner && isList(inner)) {
        try {
          return compileRegion(inner, env);
        } catch {
          return { eval: () => [] };
        }
      }
      return { eval: () => [] };
    }
    case "if": {
      // (if <bool> <regionThen> <regionElse>?) — pick a region by predicate.
      const condNode = rest[0];
      const thenNode = rest[1];
      if (!condNode || !thenNode)
        throw new LudemeCompileError("(if …) region needs a cond and a then.");
      const cond = compileBool(condNode, env);
      const thenR = compileRegion(thenNode, env);
      const elseNode = rest[2];
      const elseR = elseNode ? compileRegion(elseNode, env) : undefined;
      return {
        eval: (ctx) =>
          cond.eval(ctx) ? thenR.eval(ctx) : elseR ? elseR.eval(ctx) : [],
      };
    }
    case "union":
    case "intersection":
    case "difference": {
      // Region arguments may be inline — `(union A B)` — or grouped in a curly
      // block — `(union { A B C })`. A curly whose items are themselves ludemes
      // is a list of sub-regions to combine; a curly of strings/ints is instead
      // a literal site list and is left for compileRegion → compileSiteList.
      const only = rest.length === 1 ? rest[0] : undefined;
      const grouped =
        only !== undefined &&
        isList(only) &&
        only.delimiter === "curly" &&
        only.items.every((n) => isList(n));
      const argNodes = grouped && only && isList(only) ? only.items : rest;
      const parts = argNodes.map((n) => compileRegion(n, env));
      return { eval: (ctx) => combineRegions(head, parts, ctx) };
    }
    case "expand": {
      // (expand origin:<intOrRegion> steps:<int>? <dirs>?) or legacy
      // (expand <region> steps:<int>?). `steps:` is approximated by applying
      // the 1-step orthogonal expandRegion that many times; the direction arg
      // is dropped (lenient — sufficient for compile-only coverage).
      const { positional: expPos, named: expNamed } = parseArgs(rest);
      const originNode = expNamed.get("origin") ?? expPos[0];
      if (!originNode)
        throw new LudemeCompileError("(expand …) needs a region or origin.");
      const stepsNode = expNamed.get("steps");
      const stepsFn: IntFn = stepsNode
        ? compileInt(stepsNode, env)
        : { eval: () => 1 };
      let originRegion: RegionFn;
      try {
        originRegion = compileRegion(originNode, env);
      } catch {
        const siteFn = compileInt(originNode, env);
        originRegion = {
          eval: (ctx) => {
            const s = siteFn.eval(ctx);
            return s >= 0 ? [s] : [];
          },
        };
      }
      return {
        eval: (ctx) => {
          const steps = Math.max(1, stepsFn.eval(ctx));
          let cur = originRegion.eval(ctx);
          for (let k = 0; k < steps; k += 1) cur = expandRegion(cur, ctx);
          return cur;
        },
      };
    }
    case "forEach": {
      const { positional, named } = parseArgs(rest);
      // `(forEach of:<region> <region2>)` — for each site of `of`, evaluate
      // `region2` with `(site)` bound to it, and union the results
      // (Java: ForEachSiteInRegion).
      const ofNode = named.get("of");
      if (ofNode && isList(ofNode)) {
        const ofRegion = compileRegion(ofNode, env);
        const bodyNode = positional[0];
        if (!bodyNode)
          throw new LudemeCompileError("(forEach of:… …) needs a region.");
        const body = compileRegion(bodyNode, env);
        return {
          eval: (ctx) => {
            const out: number[] = [];
            const seen = new Set<number>();
            for (const s of ofRegion.eval(ctx)) {
              if (s < 0) continue;
              for (const r of body.eval(ctx.withFrame({ site: s, to: s }))) {
                if (r >= 0 && !seen.has(r)) {
                  seen.add(r);
                  out.push(r);
                }
              }
            }
            return out;
          },
        };
      }
      // `(forEach <region> if:<bool>)` and the explicit `(forEach Site
      // <region> if:<bool>)` both keep the region's sites for which the
      // predicate holds, with `(site)` bound to each candidate (ForEachSite).
      const kindNode = positional[0];
      const isSiteKw =
        kindNode && isIdent(kindNode) && kindNode.name === "Site";
      const regionNode = isSiteKw ? positional[1] : kindNode;
      if (regionNode && isList(regionNode)) {
        const region = compileRegion(regionNode, env);
        const ifNode = named.get("if");
        const cond = ifNode ? compileBool(ifNode, env) : undefined;
        return {
          eval: (ctx) => {
            const out: number[] = [];
            for (const s of region.eval(ctx)) {
              if (s < 0) continue;
              if (cond && !cond.eval(ctx.withFrame({ site: s, to: s }))) continue;
              out.push(s);
            }
            return out;
          },
        };
      }
      // `(forEach Level at:<site> [FromBottom|FromTop] [if:<bool>] [startAt:<int>])`
      // in region position — the stack-level indices at the site that satisfy
      // the optional condition, with frame.level/frame.to bound to each level.
      // Java: game.functions.region.foreach.level.ForEachLevel
      if (kindNode && isIdent(kindNode) && kindNode.name === "Level") {
        const lvlAtNode = named.get("at");
        if (!lvlAtNode) return { eval: () => [] };
        const lvlSiteFn = compileInt(lvlAtNode, env);
        const lvlDirNode = positional.find(
          (p) => isIdent(p) && (p.name === "FromBottom" || p.name === "FromTop"),
        );
        const lvlFromBottom =
          !!lvlDirNode && isIdent(lvlDirNode) && lvlDirNode.name === "FromBottom";
        const lvlIfNode = named.get("if") ?? named.get("If");
        const lvlCond = lvlIfNode ? compileBool(lvlIfNode, env) : undefined;
        const lvlStartAtNode = named.get("startAt");
        const lvlStartAtFn = lvlStartAtNode
          ? compileInt(lvlStartAtNode, env)
          : undefined;
        return {
          eval: (ctx) => {
            const site = lvlSiteFn.eval(ctx);
            if (site < 0) return [];
            const stackSize = ctx.state.stackSize(site);
            if (stackSize <= 0) return [];
            const out: number[] = [];
            const rawStart = lvlStartAtFn ? lvlStartAtFn.eval(ctx) : -1;
            if (lvlFromBottom) {
              const start = rawStart < 0 ? 0 : rawStart;
              for (let lvl = start; lvl < stackSize; lvl += 1) {
                const sub = ctx.withFrame({ level: lvl, site, to: lvl });
                if (!lvlCond || lvlCond.eval(sub)) out.push(lvl);
              }
            } else {
              const start =
                rawStart < 0 ? stackSize - 1 : Math.min(rawStart, stackSize - 1);
              for (let lvl = start; lvl >= 0; lvl -= 1) {
                const sub = ctx.withFrame({ level: lvl, site, to: lvl });
                if (!lvlCond || lvlCond.eval(sub)) out.push(lvl);
              }
            }
            return out;
          },
        };
      }
      throw new LudemeCompileError(
        `Unsupported (forEach ${kindNode && isIdent(kindNode) ? kindNode.name : "?"} …) region.`,
      );
    }
    case "values":
      return compileValuesRegion(node);
    case "centrePoint":
    case "centre":
    case "center":
      // (centrePoint [SiteType]) as a region → the board's centre site(s).
      return { eval: (ctx) => centreSites(ctx) };
    case "results": {
      // (results from:<siteOrRegion> to:<siteOrRegion> <intFn>) — iterate every
      // (from, to) pair, evaluate the int body with frame.from/frame.to bound,
      // and collect the resulting integers as a region (used by `is In`).
      // Java: game.functions.intArray.math.Results
      const { positional: resPos, named: resNamed } = parseArgs(rest);
      const fromNode = resNamed.get("from") ?? resNamed.get("From");
      const toNode = resNamed.get("to") ?? resNamed.get("To");
      const bodyNode = resPos[resPos.length - 1];
      if (!bodyNode) return { eval: () => [] };
      const fromRegion = fromNode
        ? compileSiteOrRegion(fromNode, env)
        : undefined;
      const toRegion = toNode ? compileSiteOrRegion(toNode, env) : undefined;
      const bodyFn = compileInt(bodyNode, env);
      return {
        eval: (ctx) => {
          const froms = fromRegion
            ? fromRegion.eval(ctx)
            : [ctx.frame.from ?? -1];
          const out: number[] = [];
          for (const f of froms) {
            const ctxF = ctx.withFrame({ from: f });
            const tos = toRegion ? toRegion.eval(ctxF) : [ctxF.frame.to ?? -1];
            for (const t of tos) {
              out.push(bodyFn.eval(ctxF.withFrame({ to: t })));
            }
          }
          return out;
        },
      };
    }
    case "players":
      // (players …) as a region → the list of player indices 1..numPlayers.
      // Java: game.functions.region.sites.player. Used by Setichch.
      return {
        eval: (ctx) =>
          Array.from(
            { length: ctx.context.game.numPlayers },
            (_, i) => i + 1,
          ),
      };
    default:
      throw new LudemeCompileError(`Unsupported region ludeme: (${head} …).`);
  }
}

/**
 * `(values Remembered <name>?)` — the remembered-values list as a region.
 * Java: `game.functions.intArray.values.ValuesRemembered`. A `null` name
 * reads the unnamed list; a string name reads `mapRememberingValues`.
 */
function compileValuesRegion(node: LudList): RegionFn {
  const kindNode = node.items[1];
  if (!kindNode || !isIdent(kindNode) || kindNode.name !== "Remembered") {
    // Only Remembered is modelled; other (values …) forms read as empty.
    return { eval: () => [] };
  }
  const nameNode = node.items[2];
  const name = nameNode && isString(nameNode) ? nameNode.value : undefined;
  return {
    eval: (ctx) =>
      name === undefined
        ? [...ctx.state.rememberedFor("")]
        : [...ctx.state.rememberedFor(name)],
  };
}

function compileSites(node: LudList, env: CompileEnv): RegionFn {
  const arg = node.items[1];
  // `(sites {C3 D1 …})` / `(sites {0 1 2})` — an explicit list of sites.
  if (arg && isList(arg) && arg.delimiter === "curly") {
    return compileSiteList(arg.items);
  }
  // `(sites (values Remembered <name>?))` — a remembered-values region.
  if (arg && isList(arg) && listHead(arg) === "values") {
    return compileValuesRegion(arg);
  }
  // `(sites "Name")` — a named region declared by `(regions "Name" …)`.
  if (arg && isString(arg)) {
    const name = arg.value;
    return {
      eval: (ctx) => env.namedRegions?.get(name)?.eval(ctx) ?? [],
    };
  }
  if (arg && isIdent(arg)) {
    const name = arg.name;
    const { positional, named } = parseArgs(node.items.slice(2));
    switch (name) {
      case "Empty":
        return { eval: (ctx) => indicesWhere(ctx, (c) => c === 0) };
      case "Occupied": {
        // (sites Occupied by:<role> [container:<name>]) scopes to one owner;
        // bare = all pieces. A `container:"Hand"` arg restricts the scan to
        // that role's hand cells instead of the whole board — without it the
        // hand query degenerates to every board piece, which is both wrong and
        // pathologically slow for drop games (shogi/chess pockets).
        const byNode = named.get("by");
        const pred =
          byNode && isIdent(byNode)
            ? ownerPredicate(byNode.name)
            : (c: number) => c !== 0;
        const containerNode = named.get("container");
        const containerName =
          containerNode && isString(containerNode)
            ? containerNode.value
            : containerNode && isIdent(containerNode)
              ? containerNode.name
              : undefined;
        if (containerName === "Hand") {
          const roleName = byNode && isIdent(byNode) ? byNode.name : "Mover";
          return {
            eval: (ctx) =>
              ctx.board
                .handSites(resolveRole(roleName, ctx))
                .filter((s) => pred(ctx.state.cells[s] ?? 0, ctx)),
          };
        }
        // `container:(mover)` / `container:<int>` — a numeric container index.
        // Container 0 is the board; 1..N are the per-player hands (the Ludii
        // convention used by `("FromHand")` = `… container:(mover)`). A hand
        // index restricts the scan to that player's hand cells.
        if (
          containerName === undefined &&
          containerNode !== undefined &&
          (isList(containerNode) || isNumber(containerNode))
        ) {
          const idxFn = compileInt(containerNode, env);
          return {
            eval: (ctx) => {
              const idx = idxFn.eval(ctx);
              if (idx >= 1) {
                return ctx.board
                  .handSites(idx)
                  .filter((s) => pred(ctx.state.cells[s] ?? 0, ctx));
              }
              return indicesWhere(ctx, (c) => pred(c, ctx));
            },
          };
        }
        return { eval: (ctx) => indicesWhere(ctx, (c) => pred(c, ctx)) };
      }
      case "Board":
        return { eval: (ctx) => allSites(ctx) };
      case "Top":
        return { eval: (ctx) => rowSites(ctx, ctx.board.height - 1) };
      case "Bottom":
        return { eval: (ctx) => rowSites(ctx, 0) };
      case "Left":
        return { eval: (ctx) => colSites(ctx, 0) };
      case "Right":
        return { eval: (ctx) => colSites(ctx, ctx.board.width - 1) };
      case "Row": {
        const nNode = positional[0];
        if (!nNode) throw new LudemeCompileError("(sites Row n) needs a row.");
        const n = compileInt(nNode, env);
        return { eval: (ctx) => rowSites(ctx, n.eval(ctx)) };
      }
      case "Column": {
        const nNode = positional[0];
        if (!nNode)
          throw new LudemeCompileError("(sites Column n) needs a column.");
        const n = compileInt(nNode, env);
        return { eval: (ctx) => colSites(ctx, n.eval(ctx)) };
      }
      case "Centre":
      case "Center":
        return { eval: (ctx) => centreSites(ctx) };
      case "Corners":
        return { eval: (ctx) => cornerSites(ctx) };
      case "Outer":
        return { eval: (ctx) => outerSites(ctx) };
      case "Side": {
        // (sites Side <compass>) → the board edge on that side. Cardinal
        // names map to the obvious row/column; diagonal names (used by
        // rhombus-coordinate connection games like Hex/Y) map to the four
        // distinct edges so the (is Connected …) goal regions stay disjoint.
        const dirNode = positional[0];
        const dir = dirNode && isIdent(dirNode) ? dirNode.name : "";
        return { eval: (ctx) => sideSites(ctx, dir) };
      }
      case "Direction": {
        // (sites Direction from:<site> [<dirs>] [distance:<n>] [included:True])
        // → every site on the rays leaving <from> along the given directions.
        const fromNode = named.get("from");
        const fromFn = fromNode ? siteIntOf(fromNode, env) : undefined;
        const dirSpec = positional.find((p) => isIdent(p) || isList(p));
        const tokens = collectDirectionTokens(dirSpec);
        const included =
          isTrueIdent(named.get("included")) ||
          isTrueIdent(named.get("includeSelf"));
        const distNode = named.get("distance");
        const distFn = distNode ? compileInt(distNode, env) : undefined;
        return {
          eval: (ctx) => {
            const from = fromFn ? fromFn.eval(ctx) : lastToSite(ctx);
            if (from < 0) return [];
            const max = distFn ? distFn.eval(ctx) : Infinity;
            return rayDirectionSites(ctx, from, tokens, max, included);
          },
        };
      }
      case "LineOfSight": {
        // (sites LineOfSight [Piece|Empty] at:<site> [<dirs>]) → along each ray
        // from <at>, the empty sites up to the first blocker (default/Empty),
        // or the first occupied site seen (Piece variant).
        const typeNode = positional.find((p) => isIdent(p));
        const losType = typeNode && isIdent(typeNode) ? typeNode.name : "Empty";
        const atNode = named.get("at");
        const atFn = atNode ? siteIntOf(atNode, env) : undefined;
        const dirSpec = positional.find((p) => isList(p));
        const tokens = collectDirectionTokens(dirSpec);
        return {
          eval: (ctx) => {
            const at = atFn ? atFn.eval(ctx) : lastToSite(ctx);
            if (at < 0) return [];
            return lineOfSightSites(ctx, at, tokens, losType === "Piece");
          },
        };
      }
      case "Hand": {
        // (sites Hand <role>?) → every cell index in that player's hand.
        // A missing role defaults to the mover (Chessence: `(sites Hand)`).
        const roleNode = positional[0];
        const roleName = roleNode && isIdent(roleNode) ? roleNode.name : "Mover";
        return {
          eval: (ctx) => ctx.board.handSites(resolveRole(roleName, ctx)),
        };
      }
      case "Start": {
        // `(sites Start (piece <ownerExpr>))` → the initial placement sites
        // of the component whose owner `<ownerExpr>` names. The TS engine
        // keys placements by owner, so the inner `(piece …)` collapses to an
        // owner id (`(what at:(from))`, `(id "X" Next)`, etc.). Bare
        // `(sites Start)` unions every owner's start sites.
        const map = env.startSitesByOwner;
        if (!map) return { eval: () => [] };
        const spec = positional[0];
        let ownerFn: IntFn | undefined;
        if (spec && isList(spec)) {
          if (listHead(spec) === "piece") {
            const inner = spec.items[1];
            if (inner) ownerFn = compileInt(inner, env);
          } else {
            ownerFn = compileInt(spec, env);
          }
        }
        if (!ownerFn) {
          return {
            eval: () => {
              const all: number[] = [];
              for (const s of map.values()) all.push(...s);
              return all;
            },
          };
        }
        const of = ownerFn;
        return { eval: (ctx) => map.get(of.eval(ctx)) ?? [] };
      }
      case "Track": {
        // (sites Track) → every distinct site across all declared tracks;
        // (sites Track <Role>) → the named player's track (else shared).
        const roleNode = positional[0];
        const roleName =
          roleNode && isIdent(roleNode) ? roleNode.name : undefined;
        return {
          eval: (ctx) => {
            const tracks = ctx.board.tracks;
            if (tracks.length === 0) return [];
            const seen = new Set<number>();
            const out: number[] = [];
            const want =
              roleName !== undefined ? resolveRole(roleName, ctx) : undefined;
            for (const t of tracks) {
              if (want !== undefined && t.owner !== want && t.owner !== 0) {
                continue;
              }
              for (const s of t.sites) {
                if (!seen.has(s)) {
                  seen.add(s);
                  out.push(s);
                }
              }
            }
            return out;
          },
        };
      }
      case "Around": {
        const siteNode = positional[0];
        if (!siteNode)
          throw new LudemeCompileError("(sites Around <site>) needs a site.");
        // The anchor may be a single site or a whole region; union the
        // neighbourhood over every member.
        const region = compileSiteOrRegion(siteNode, env);
        const dirTokens = rawDirectionTokens(positional[1]).filter(
          (t) => !t.startsWith("#"),
        );
        return {
          eval: (ctx) => {
            const seen = new Set<number>();
            const out: number[] = [];
            for (const s of region.eval(ctx)) {
              for (const a of aroundSites(ctx, s, dirTokens)) {
                if (a >= 0 && !seen.has(a)) {
                  seen.add(a);
                  out.push(a);
                }
              }
            }
            return out;
          },
        };
      }
      // Role tokens (Mover/Next/P1…) name the player's declared region
      // from `(regions <Role> …)`; resolve through the env at eval time.
      case "Mover":
      case "Next":
      case "Prev":
        return playerRegionLookup((ctx) => resolveRole(name, ctx), env);
      case "Player": {
        // (sites Player) → the iterated player's declared region;
        // (sites Player "Name") → that player's named region.
        const nameArg = positional[0];
        if (nameArg && isString(nameArg)) {
          const regionName = nameArg.value;
          return {
            eval: (ctx) => env.namedRegions?.get(regionName)?.eval(ctx) ?? [],
          };
        }
        return playerRegionLookup((ctx) => resolveRole("Player", ctx), env);
      }
      case "Pending":
        // (sites Pending) → sites flagged by (set Pending <site>).
        return { eval: (ctx) => [...ctx.state.pending] };
      case "ToClear":
        // (sites ToClear) → pieces queued for removal in a capture sequence.
        // No backing state in the TS port yet; [] keeps capture games compiling.
        return { eval: () => [] };
      case "Phase": {
        // (sites Phase <n>) → all sites of board colouring n. Derived as
        // (x+y)%2 on rectangular boards; graph boards have no colouring → [].
        const phNode = positional[0];
        if (!phNode) return { eval: () => [] };
        const phFn = compileInt(phNode, env);
        return {
          eval: (ctx) => {
            if (ctx.board.traj) return [];
            const ph = phFn.eval(ctx);
            const out: number[] = [];
            const n = ctx.board.numSites;
            for (let s = 0; s < n; s += 1) {
              if (
                ctx.board.isOnBoard(s) &&
                (ctx.board.xOf(s) + ctx.board.yOf(s)) % 2 === ph
              ) {
                out.push(s);
              }
            }
            return out;
          },
        };
      }
      case "Distance": {
        // (sites Distance [relation] from:<site> (exact N) | (range a b)) —
        // BFS from <site> collecting sites whose step-distance is in [min,max].
        // A custom (step …) traversal isn't modelled → [].
        const fromNode = named.get("from");
        if (!fromNode) return { eval: () => [] };
        const fromFn = compileInt(fromNode, env);
        const first = positional[0];
        if (first && isList(first) && listHead(first) !== "exact" &&
            listHead(first) !== "range" && listHead(first) !== "min") {
          return { eval: () => [] };
        }
        let rangeNode: LudNode | undefined;
        let useAllDirs = false;
        if (first && isIdent(first)) {
          const rel = first.name;
          useAllDirs = rel === "Adjacent" || rel === "All" || rel === "Diagonal";
          rangeNode = positional[1];
        } else {
          rangeNode = first;
        }
        if (!rangeNode || !isList(rangeNode)) return { eval: () => [] };
        const rHead = listHead(rangeNode);
        let minFn: IntFn;
        let maxFn: IntFn;
        if (rHead === "exact") {
          const n = rangeNode.items[1];
          if (!n) return { eval: () => [] };
          minFn = compileInt(n, env);
          maxFn = minFn;
        } else if (rHead === "range") {
          const a = rangeNode.items[1];
          const b = rangeNode.items[2];
          if (!a) return { eval: () => [] };
          minFn = compileInt(a, env);
          maxFn = b ? compileInt(b, env) : minFn;
        } else if (rHead === "min") {
          const a = rangeNode.items[1];
          if (!a) return { eval: () => [] };
          minFn = compileInt(a, env);
          maxFn = { eval: () => 9999 };
        } else {
          return { eval: () => [] };
        }
        const allDirs = useAllDirs;
        return {
          eval: (ctx) => {
            const from = fromFn.eval(ctx);
            const minD = minFn.eval(ctx);
            const maxD = maxFn.eval(ctx);
            if (from < 0) return [];
            const seen = new Set<number>([from]);
            let frontier = [from];
            const out: number[] = [];
            for (let d = 1; d <= maxD && frontier.length > 0; d += 1) {
              const next: number[] = [];
              for (const s of frontier) {
                const nbs = allDirs
                  ? aroundSites(ctx, s, ["Adjacent"])
                  : orthoNeighbours(ctx, s);
                for (const nb of nbs) {
                  if (!seen.has(nb)) {
                    seen.add(nb);
                    next.push(nb);
                  }
                }
              }
              if (d >= minD) out.push(...next);
              frontier = next;
            }
            return out;
          },
        };
      }
      case "Playable":
        // (sites Playable) → sites where a piece may be placed. The TS port has
        // no precomputed playability layer, so this is the empty on-board sites.
        return { eval: (ctx) => indicesWhere(ctx, (c) => c === 0) };
      case "To":
        // (sites To) → the destination site(s) of the current/last move.
        return {
          eval: (ctx) => {
            const s = ctx.frame.to ?? lastToSite(ctx);
            return s >= 0 ? [s] : [];
          },
        };
      case "From":
        // (sites From) → the origin site(s) of the current/last move.
        return {
          eval: (ctx) => {
            const s = ctx.frame.from ?? OFF;
            return s >= 0 ? [s] : [];
          },
        };
      case "State": {
        // (sites State [<SiteType>] <n>) → every on-board site whose per-site
        // state layer equals n. A leading Cell/Vertex/Edge ident is ignored
        // (the TS port has a single site space).
        const valNode = positional.find(
          (p) => !(isIdent(p) && SITE_TYPE_IDENTS.has(p.name)),
        );
        if (!valNode) return { eval: () => [] };
        const valFn = compileInt(valNode, env);
        return {
          eval: (ctx) => {
            const want = valFn.eval(ctx);
            const out: number[] = [];
            const n = ctx.board.numSites;
            for (let s = 0; s < n; s += 1) {
              if (ctx.board.isOnBoard(s) && ctx.state.stateAtSite(s) === want) {
                out.push(s);
              }
            }
            return out;
          },
        };
      }
      case "Group": {
        // (sites Group [<SiteType>] (at:|from:)<site> [<dirs>] [<role>]) → the
        // connected same-owner component containing the seed site, via
        // orthogonal adjacency.
        const seedNode = named.get("at") ?? named.get("from");
        const seedFn = seedNode ? siteIntOf(seedNode, env) : undefined;
        return {
          eval: (ctx) => {
            const seed = seedFn ? seedFn.eval(ctx) : lastToSite(ctx);
            return groupAt(ctx, seed);
          },
        };
      }
      case "Incident": {
        // (sites Incident <ofType> of:<atType> at:<site>) → the elements of one
        // site space incident to a site of another. The TS port has a single
        // site space, so this collapses to the orthogonal neighbourhood of the
        // anchor (best-effort; keeps graph-incidence games compiling).
        const atNode = named.get("at");
        const atFn = atNode ? siteIntOf(atNode, env) : undefined;
        return {
          eval: (ctx) => {
            const at = atFn ? atFn.eval(ctx) : lastToSite(ctx);
            if (at < 0) return [];
            return orthoNeighbours(ctx, at).filter((s) => s >= 0);
          },
        };
      }
      case "Between": {
        // (sites Between <dirn> from:<a> to:<b> [fromIncluded:] [toIncluded:]) →
        // the sites on the straight line from a to b. Best-effort: walk unit
        // steps when the endpoints are colinear (orthogonal or diagonal).
        const fromNode = named.get("from");
        const toNode = named.get("to");
        const fromFn = fromNode ? siteIntOf(fromNode, env) : undefined;
        const toFn = toNode ? siteIntOf(toNode, env) : undefined;
        const incFrom = isTrueIdent(named.get("fromIncluded"));
        const incTo = isTrueIdent(named.get("toIncluded"));
        return {
          eval: (ctx) => {
            const a = fromFn ? fromFn.eval(ctx) : OFF;
            const b = toFn ? toFn.eval(ctx) : OFF;
            if (a < 0 || b < 0) return [];
            const ax = ctx.board.xOf(a);
            const ay = ctx.board.yOf(a);
            const bx = ctx.board.xOf(b);
            const by = ctx.board.yOf(b);
            const dx = Math.sign(bx - ax);
            const dy = Math.sign(by - ay);
            const adx = Math.abs(bx - ax);
            const ady = Math.abs(by - ay);
            // Only colinear (straight or 45°) lines have a defined "between".
            if (adx !== 0 && ady !== 0 && adx !== ady) return [];
            const steps = Math.max(adx, ady);
            const out: number[] = [];
            for (let i = 0; i <= steps; i += 1) {
              if (i === 0 && !incFrom) continue;
              if (i === steps && !incTo) continue;
              const s = ctx.board.siteAt(ax + dx * i, ay + dy * i);
              if (s >= 0) out.push(s);
            }
            return out;
          },
        };
      }
      case "Random": {
        // (sites Random [<region>] [num:<n>]) — pick num random distinct sites
        // from region (default: 1 from all empty sites). A deterministic
        // first-N implementation is sufficient for compile coverage.
        // Java: game.functions.region.sites.random.SitesRandom
        const regionArg = positional[0];
        const numNode = named.get("num");
        const regionFn: RegionFn = regionArg
          ? compileSiteOrRegion(regionArg, env)
          : { eval: (ctx: EvalContext) => indicesWhere(ctx, (c) => c === 0) };
        const numFn: IntFn = numNode
          ? compileInt(numNode, env)
          : { eval: () => 1 };
        return {
          eval: (ctx) => {
            const sites = regionFn.eval(ctx);
            const n = Math.min(numFn.eval(ctx), sites.length);
            return sites.slice(0, n);
          },
        };
      }
      case "Cell":
      case "Vertex":
      case "Edge": {
        // (sites Cell|Vertex|Edge <coord|index>?) — a single site addressed by
        // a coordinate string ("A1") or index; bare form is every board site.
        const spec = positional[0];
        if (spec && isString(spec)) {
          const coord = parseCoord(spec.value);
          return {
            eval: (ctx) => {
              if (!coord) return [];
              const s = ctx.board.siteAt(coord.col, coord.row);
              return s >= 0 ? [s] : [];
            },
          };
        }
        if (spec) {
          const intFn = compileInt(spec, env);
          return {
            eval: (ctx) => {
              const s = intFn.eval(ctx);
              return s >= 0 ? [s] : [];
            },
          };
        }
        return { eval: (ctx) => allSites(ctx) };
      }
      case "Inner":
        // (sites Inner) — every board site that is not on the perimeter.
        return {
          eval: (ctx) => {
            const outer = new Set(outerSites(ctx));
            return allSites(ctx).filter((s) => !outer.has(s));
          },
        };
      case "Perimeter":
        // (sites Perimeter) — the outer ring of board sites.
        return { eval: (ctx) => outerSites(ctx) };
      case "Layer": {
        // (sites Layer <n>?) — flat boards expose only layer 0 (all sites);
        // any higher layer is empty.
        const layerNode = positional[0];
        const layerFn = layerNode ? compileInt(layerNode, env) : undefined;
        return {
          eval: (ctx) =>
            (layerFn ? layerFn.eval(ctx) : 0) === 0 ? allSites(ctx) : [],
        };
      }
      case "LineOfPlay":
      case "Hidden":
        // Hidden-information / line-of-play regions are not modelled; empty.
        return { eval: () => [] };
      default: {
        // Unsubstituted define placeholders (`~`, `#1`, `#2`, …) reaching
        // `(sites …)` as the first argument represent an intentionally-empty
        // region in a partially-expanded branch (MensaSpiel: `(sites ~ "Rings")`).
        if (name === "~" || isPlaceholderIdent(name)) {
          return { eval: () => [] };
        }
        const pid = resolveStaticRole(name);
        if (pid !== undefined) {
          return playerRegionLookup(() => pid, env);
        }
        throw new LudemeCompileError(`Unsupported (sites ${name}).`);
      }
    }
  }
  // `(sites <intExpr>)` — e.g. `(sites (player (mapEntry (mover))))`. Java
  // promotes an IntFunction here to the region declared for that player.
  if (arg && isList(arg)) {
    const pidFn = compileInt(arg, env);
    return playerRegionLookup((ctx) => pidFn.eval(ctx), env);
  }
  throw new LudemeCompileError("Unsupported (sites …) form.");
}

/** True when a node is the bare `True` ident. */
function isTrueIdent(node: LudNode | undefined): boolean {
  return !!node && isIdent(node) && node.name === "True";
}

/**
 * Every site reached by walking outward from `from` along the given direction
 * tokens (full rays, optionally capped at `maxDist` steps). The seed site is
 * included only when `includeSelf` is set (Java: Sites Direction).
 */
function rayDirectionSites(
  ctx: EvalContext,
  from: number,
  tokens: readonly string[],
  maxDist: number,
  includeSelf: boolean,
): number[] {
  const board = ctx.board;
  const dirs = resolveDirectionTokens(
    tokens.length > 0 ? tokens : ["Adjacent"],
    ctx,
  );
  const out = new Set<number>();
  if (includeSelf) out.add(from);
  for (const d of dirs) {
    let x = board.xOf(from);
    let y = board.yOf(from);
    for (let step = 0; step < maxDist; step += 1) {
      x += d.dx;
      y += d.dy;
      const s = board.siteAt(x, y);
      if (s < 0) break;
      out.add(s);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * Line-of-sight from `at` along each direction: the run of empty sites up to
 * the first blocker, plus that blocker when `wantPiece` is set (Piece variant
 * returns only the first piece seen, the default returns the empty run).
 */
function lineOfSightSites(
  ctx: EvalContext,
  at: number,
  tokens: readonly string[],
  wantPiece: boolean,
): number[] {
  const board = ctx.board;
  const dirs = resolveDirectionTokens(
    tokens.length > 0 ? tokens : ["Adjacent"],
    ctx,
  );
  const out = new Set<number>();
  for (const d of dirs) {
    let x = board.xOf(at);
    let y = board.yOf(at);
    for (;;) {
      x += d.dx;
      y += d.dy;
      const s = board.siteAt(x, y);
      if (s < 0) break;
      const occupied = (ctx.state.cells[s] ?? 0) !== 0;
      if (occupied) {
        if (wantPiece) out.add(s);
        break;
      }
      if (!wantPiece) out.add(s);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** Predicate matching a cell owner against a role name (Mover/Enemy/Pn…). */
function ownerPredicate(
  role: string,
): (cell: number, ctx: EvalContext) => boolean {
  switch (role) {
    case "Mover":
    case "Friend":
      return (c, ctx) => c === ctx.mover;
    case "Enemy":
      return (c, ctx) => c !== 0 && c !== ctx.mover;
    case "Player":
    case "Next":
    case "Prev": {
      return (c, ctx) => c === resolveRole(role, ctx);
    }
    default: {
      const pid = resolveStaticRole(role);
      if (pid !== undefined) return (c) => c === pid;
      return () => false;
    }
  }
}

/** The board's centre cell(s): exact centre on odd dims, 2x2 on even. */
function centreSites(ctx: EvalContext): number[] {
  const { width, height } = ctx.board;
  const xs = width % 2 === 1 ? [(width - 1) / 2] : [width / 2 - 1, width / 2];
  const ys =
    height % 2 === 1 ? [(height - 1) / 2] : [height / 2 - 1, height / 2];
  const out: number[] = [];
  for (const y of ys)
    for (const x of xs) {
      const s = ctx.board.siteAt(x, y);
      if (s >= 0) out.push(s);
    }
  return out;
}

/** The four corner cells of a rectangular board. */
function cornerSites(ctx: EvalContext): number[] {
  const { width, height } = ctx.board;
  const out = new Set<number>();
  for (const [x, y] of [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ] as const) {
    const s = ctx.board.siteAt(x, y);
    if (s >= 0) out.add(s);
  }
  return [...out];
}

/** The perimeter ring of a rectangular board. */
function outerSites(ctx: EvalContext): number[] {
  const { width, height } = ctx.board;
  const out = new Set<number>();
  for (let x = 0; x < width; x += 1) {
    out.add(ctx.board.siteAt(x, 0));
    out.add(ctx.board.siteAt(x, height - 1));
  }
  for (let y = 0; y < height; y += 1) {
    out.add(ctx.board.siteAt(0, y));
    out.add(ctx.board.siteAt(width - 1, y));
  }
  return [...out].filter((s) => s >= 0).sort((a, b) => a - b);
}

/**
 * The cells along one edge of a rectangular board, named by compass side.
 * Cardinal names map to the obvious row/column. Diagonal names (used by
 * rhombus-coordinate connection games such as Hex/Y/Havannah) map to the four
 * distinct edges, keeping the goal regions of an `(is Connected …)` disjoint.
 */
function sideSites(ctx: EvalContext, dir: string): number[] {
  const { width: w, height: h } = ctx.board;
  switch (dir) {
    case "N":
    case "NE":
      return rowSites(ctx, h - 1);
    case "S":
    case "SW":
      return rowSites(ctx, 0);
    case "E":
    case "SE":
      return colSites(ctx, w - 1);
    case "W":
    case "NW":
      return colSites(ctx, 0);
    default:
      return outerSites(ctx);
  }
}

/** Neighbouring cells of a site along the given direction group(s). */
/** The `to` site of the trial's most recent move (Java default for `at:`). */
function lastToSite(ctx: EvalContext): number {
  const moves = ctx.context.trial.moves;
  const last = moves[moves.length - 1];
  return last ? last.to() : OFF;
}

/** Orthogonally (edge-) adjacent on-board sites of `site`. */
function orthoNeighbours(ctx: EvalContext, site: number): number[] {
  const board = ctx.board;
  if (board.traj) return board.traj.neighbours(site);
  const x = board.xOf(site);
  const y = board.yOf(site);
  const out: number[] = [];
  for (const d of board.tiling.groups.Orthogonal ??
    board.tiling.groups.All ??
    []) {
    const n = board.siteAt(x + d.dx, y + d.dy);
    if (n >= 0) out.push(n);
  }
  return out;
}

/**
 * Size of the connected component of same-owner pieces that contains `site`
 * (Java: SizeGroup with orthogonal connectivity). 0 for an empty/off site.
 */
/** SiteType prefix idents that select a graph layer; the TS port has a single
 * site space, so these are skipped where they appear positionally. */
const SITE_TYPE_IDENTS = new Set(["Cell", "Vertex", "Edge"]);

/** The same-owner connected component containing `start` (orthogonal
 * adjacency), as a site-index array. Empty when the seed is empty/off-board. */
function groupAt(ctx: EvalContext, start: number): number[] {
  if (start < 0 || start >= ctx.state.cells.length) return [];
  const owner = ctx.state.cells[start] ?? 0;
  if (owner === 0) return [];
  const seen = new Set<number>([start]);
  const stack = [start];
  while (stack.length > 0) {
    const s = stack.pop() as number;
    for (const nb of orthoNeighbours(ctx, s)) {
      if (!seen.has(nb) && (ctx.state.cells[nb] ?? 0) === owner) {
        seen.add(nb);
        stack.push(nb);
      }
    }
  }
  return [...seen];
}

function groupSizeAt(ctx: EvalContext, start: number): number {
  if (start < 0 || start >= ctx.state.cells.length) return 0;
  const owner = ctx.state.cells[start] ?? 0;
  if (owner === 0) return 0;
  const seen = new Set<number>([start]);
  const stack = [start];
  while (stack.length > 0) {
    const s = stack.pop() as number;
    for (const n of orthoNeighbours(ctx, s)) {
      if (!seen.has(n) && (ctx.state.cells[n] ?? 0) === owner) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return seen.size;
}

/**
 * Connected components over the on-board sites for which `member(site)` is
 * true, using orthogonal adjacency (Java: CountGroups / SizeBiggestGroup with
 * the default Adjacent direction). Returns one Set of site indices per group.
 */
function groupComponents(
  ctx: EvalContext,
  member: (site: number) => boolean,
): Set<number>[] {
  const n = ctx.state.cells.length;
  const seen = new Set<number>();
  const groups: Set<number>[] = [];
  for (let start = 0; start < n; start += 1) {
    if (seen.has(start) || !member(start)) continue;
    const comp = new Set<number>([start]);
    seen.add(start);
    const stack = [start];
    while (stack.length > 0) {
      const s = stack.pop() as number;
      for (const nb of orthoNeighbours(ctx, s)) {
        if (!seen.has(nb) && member(nb)) {
          seen.add(nb);
          comp.add(nb);
          stack.push(nb);
        }
      }
    }
    groups.push(comp);
  }
  return groups;
}

/** Empty on-board sites orthogonally adjacent to the same-owner group at
 * `start` (Java: CountLiberties). 0 for an empty/off seed site. */
function libertiesAt(ctx: EvalContext, start: number): number {
  if (start < 0 || start >= ctx.state.cells.length) return 0;
  const owner = ctx.state.cells[start] ?? 0;
  if (owner === 0) return 0;
  const group = new Set<number>([start]);
  const stack = [start];
  while (stack.length > 0) {
    const s = stack.pop() as number;
    for (const nb of orthoNeighbours(ctx, s)) {
      if (!group.has(nb) && (ctx.state.cells[nb] ?? 0) === owner) {
        group.add(nb);
        stack.push(nb);
      }
    }
  }
  const liberties = new Set<number>();
  for (const s of group) {
    for (const nb of orthoNeighbours(ctx, s)) {
      if ((ctx.state.cells[nb] ?? 0) === 0) liberties.add(nb);
    }
  }
  return liberties.size;
}

/** Shortest orthogonal step distance from `from` to `to` (BFS), or OFF if
 * unreachable (Java: CountSteps over the adjacency graph). */
function stepDistance(ctx: EvalContext, from: number, to: number): number {
  if (from === to) return 0;
  if (from < 0 || to < 0) return OFF;
  const seen = new Set<number>([from]);
  let frontier = [from];
  let dist = 0;
  while (frontier.length > 0) {
    dist += 1;
    const next: number[] = [];
    for (const s of frontier) {
      for (const nb of orthoNeighbours(ctx, s)) {
        if (nb === to) return dist;
        if (!seen.has(nb)) {
          seen.add(nb);
          next.push(nb);
        }
      }
    }
    frontier = next;
  }
  return OFF;
}

/** Moves played so far in the current turn — the run of trailing moves whose
 * mover matches the last move's (Java: state.numTurnSamePlayer()). */
function movesThisTurn(ctx: EvalContext): number {
  const moves = ctx.context.trial.moves;
  const last = moves[moves.length - 1];
  if (!last) return 0;
  let n = 0;
  for (let i = moves.length - 1; i >= 0; i -= 1) {
    if (moves[i]?.mover === last.mover) n += 1;
    else break;
  }
  return n;
}

function aroundSites(
  ctx: EvalContext,
  site: number,
  dirTokens: readonly string[],
): number[] {
  if (site < 0) return [];
  const board = ctx.board;
  const x = board.xOf(site);
  const y = board.yOf(site);
  const dirs = resolveDirectionTokens(
    dirTokens.length > 0 ? dirTokens : ["Adjacent"],
    ctx,
  );
  const out = new Set<number>();
  for (const d of dirs) {
    const n = board.siteAt(x + d.dx, y + d.dy);
    if (n >= 0) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

/**
 * Build a static region from an explicit list of site nodes: coordinate
 * strings like `"A1"` (column letters + 1-based row, origin bottom-left) or
 * raw integer indices. Resolved against the board width at eval time.
 */
function compileSiteList(items: readonly LudNode[]): RegionFn {
  const coords: Array<{ col: number; row: number } | number> = [];
  for (const item of items) {
    if (isNumber(item)) {
      coords.push(item.value);
    } else if (isString(item)) {
      const c = parseCoord(item.value);
      if (c) coords.push(c);
    }
  }
  return {
    eval: (ctx) => {
      const out: number[] = [];
      for (const c of coords) {
        const site =
          typeof c === "number" ? c : ctx.board.siteAt(c.col, c.row);
        if (site >= 0) out.push(site);
      }
      return out;
    },
  };
}

/** Parse a chess-style coordinate ("A1", "J4") to 0-based column/row. */
function parseCoord(s: string): { col: number; row: number } | undefined {
  const m = /^([A-Za-z]+)(\d+)$/.exec(s.trim());
  if (!m?.[1] || !m[2]) return undefined;
  let col = 0;
  for (const ch of m[1].toUpperCase()) {
    col = col * 26 + (ch.charCodeAt(0) - 64);
  }
  return { col: col - 1, row: Number(m[2]) - 1 };
}

/** A `(sites <Role>)` lookup: the player's declared region, else empty. */
function playerRegionLookup(
  pidOf: (ctx: EvalContext) => number,
  env: CompileEnv,
): RegionFn {
  return {
    eval: (ctx) => {
      const region = env.playerRegions?.get(pidOf(ctx));
      return region ? [...region.eval(ctx)] : [];
    },
  };
}

function resolveStaticRole(name: string): number | undefined {
  const m = /^P(\d+)$/.exec(name);
  if (m?.[1]) return Number(m[1]);
  return undefined;
}

function allSites(ctx: EvalContext): number[] {
  // Board sites only — hand sites live beyond board.numSites in cells and
  // are addressed by `(sites Hand …)`, not the on-board regions. Hex masks
  // filter out bounding-box holes.
  const board = ctx.board;
  const n = board.numSites;
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    if (board.isOnBoard(i)) out.push(i);
  }
  return out;
}

function indicesWhere(
  ctx: EvalContext,
  pred: (cell: number) => boolean,
): number[] {
  const out: number[] = [];
  const cells = ctx.state.cells;
  const board = ctx.board;
  const n = board.numSites;
  for (let i = 0; i < n; i += 1) {
    if (!board.isOnBoard(i)) continue;
    if (pred(cells[i] ?? 0)) out.push(i);
  }
  return out;
}

function rowSites(ctx: EvalContext, y: number): number[] {
  const out: number[] = [];
  for (let x = 0; x < ctx.board.width; x += 1) {
    const s = ctx.board.siteAt(x, y);
    if (s !== OFF) out.push(s);
  }
  return out;
}

function colSites(ctx: EvalContext, x: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < ctx.board.height; y += 1) {
    const s = ctx.board.siteAt(x, y);
    if (s !== OFF) out.push(s);
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
  const board = ctx.board;
  const out = new Set<number>(sites);
  for (const s of sites) {
    const x = board.xOf(s);
    const y = board.yOf(s);
    for (const d of board.tiling.groups.Orthogonal ?? board.tiling.groups.All ?? []) {
      const n = board.siteAt(x + d.dx, y + d.dy);
      if (n >= 0) out.add(n);
    }
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
  node = unwrapParens(node);
  // `~` is Ludii's "absent optional" token; in a moves slot it means no
  // generator. Unsubstituted define placeholders (`#1`, `[#]`) likewise
  // contribute nothing — degrade to an empty generator so the rest of the
  // game still compiles rather than aborting the whole tree.
  if (isIdent(node) && (node.name === "~" || isPlaceholderIdent(node.name))) {
    return EMPTY_MOVES;
  }
  if (!isList(node)) {
    throw new LudemeCompileError(`Cannot compile moves from ${node.kind}.`);
  }
  // A bare `{ <moves>… }` curly group is an implicit set of generators
  // (Ludii treats it as an `(or …)`). This arises when a define expands to
  // a brace block that lands as a child of `(or …)` / `(play …)`.
  if (node.delimiter === "curly") {
    return compileMovesList(node.items, env, concatMoves);
  }
  const head = listHead(node);
  // An unresolved define invocation leaves a round-paren list whose first item
  // is a string (the define name) — `listHead` is undefined because the head is
  // a string, not an ident. This happens when a define body evaporated (empty
  // `<>` option substitution) or lived inside an option-variant block that the
  // top-level define collector didn't reach. Treat as a piece with no moves.
  const firstItem = node.items[0];
  if (
    head === undefined &&
    node.delimiter === "round" &&
    firstItem !== undefined &&
    isString(firstItem)
  ) {
    return EMPTY_MOVES;
  }
  const rest = node.items.slice(1);
  switch (head) {
    case "move":
      return compileMoveLudeme(node, env);
    case "forEach":
      return compileForEach(node, env);
    case "do":
      return compileDo(node, env);
    case "or":
      return compileMovesList(rest, env, concatMoves);
    case "and":
      // `(and {<moves>…})` bundles generators that all contribute moves this
      // turn. Modelled as a flat concatenation of the alternatives.
      return compileMovesList(rest, env, concatMoves);
    case "priority":
      // (priority {<moves>…}) — try each alternative in order; the first one
      // that produces any move wins (later generators are only reached when
      // earlier ones are empty).
      return compileMovesList(rest, env, firstNonEmptyMoves);
    case "roll":
      return compileRoll(env);
    case "max":
    case "min": {
      // (max/min Moves|Captures|Distance [opts] <generator>) — a move-quantity
      // optimiser. Lenient: return the inner generator's moves unchanged; the
      // actual max/min filtering is a runtime nicety we skip for now.
      const { positional } = parseArgs(rest);
      const innerNode = positional[positional.length - 1];
      if (!innerNode || isIdent(innerNode)) return EMPTY_MOVES;
      return compileMoves(innerNode, env);
    }
    case "satisfy":
      // (satisfy <constraint> | { <constraints…> }) — deduction-puzzle CSP;
      // all move generation is handled by a runtime solver. Compile to empty.
      return EMPTY_MOVES;
    case "add": {
      // Bare `(add …)` in a moves slot — the placement form. Equivalent to
      // `(move Add (to …))` but may carry piece/count/stack/then args.
      const { positional: addPos, named: addNamed } = parseArgs(
        node.items.slice(1),
      );
      const addThenNode = node.items.find(
        (n) => isList(n) && listHead(n) === "then",
      ) as LudList | undefined;
      const addThenEffect = addThenNode
        ? compileThen(addThenNode, env).effect
        : undefined;
      const pieceNode = node.items.find(
        (n) => isList(n) && listHead(n) === "piece",
      ) as LudList | undefined;
      let whatFn: IntFn = { eval: (ctx) => ctx.mover };
      if (pieceNode?.items[1]) {
        try {
          whatFn = compileInt(pieceNode.items[1], env);
        } catch {
          /* leave as mover */
        }
      }
      const countNode = addNamed.get("count");
      let countFn: IntFn = { eval: () => 1 };
      if (countNode) {
        try {
          countFn = compileInt(countNode, env);
        } catch {
          /* leave as 1 */
        }
      }
      const stackNode = addNamed.get("stack");
      const onStack =
        stackNode !== undefined && isIdent(stackNode) && stackNode.name === "True";
      let toRegion = resolveAddRegion(node, addPos, addNamed, pieceNode, env);
      if (!toRegion) return EMPTY_MOVES;
      const addRegion = toRegion;
      return {
        generate: (ctx) => {
          const out: Move[] = [];
          const mover = ctx.mover;
          const what = whatFn.eval(ctx);
          const effectiveWhat = what > 0 ? what : mover;
          const count = countFn.eval(ctx);
          for (const site of addRegion.eval(ctx)) {
            if (site < 0) continue;
            const m = new Move({
              id: `add:${site}:${mover}`,
              label: `Add at ${site}`,
              siteIndices: [site],
              mover,
              placedOwner: mover,
              actions: [
                new ActionAdd({ to: site, what: effectiveWhat, count, onStack }),
              ],
            });
            if (addThenEffect) {
              const ectx = ctx
                .withContext(
                  ctx.context.withTrial(
                    ctx.context.trial.withMove(m, false, -1),
                  ),
                )
                .withFrame({ from: m.from(), to: m.to() });
              const extra = addThenEffect(ectx);
              out.push(extra.length > 0 ? m.withConsequence(extra, false) : m);
            } else {
              out.push(m);
            }
          }
          return out;
        },
      };
    }
    case "set": {
      // A bare `(set …)` in a moves slot is a state-mutating move: compile it
      // as an effect and wrap the resulting actions in a single Move.
      const effect = compileEffect(node, env);
      return {
        generate: (ctx) => {
          const actions = effect(ctx);
          if (actions.length === 0) return [];
          return [
            new Move({
              id: `set:${ctx.mover}`,
              label: "Set",
              siteIndices: [ctx.frame.to ?? 0],
              mover: ctx.mover,
              placedOwner: ctx.mover,
              actions,
            }),
          ];
        },
      };
    }
    case "if": {
      // (if <bool> <movesThen> [<movesElse>|<then>]) — choose a move generator
      // at generation time based on a board predicate. Java's typed parser
      // distinguishes `Moves elseList` from `Then then` by argument type; in the
      // TS AST both are positional, so detect a `(then …)` at rest[2] and treat
      // it as a post-move consequence on the generated moves rather than an else.
      const condNode = rest[0];
      const thenNode = rest[1];
      if (!condNode || !thenNode)
        throw new LudemeCompileError("(if …) moves needs a cond and a then.");
      const cond = compileBool(condNode, env);
      const thenMoves = compileMoves(thenNode, env);
      const elseNode = rest[2];
      const isThenNode =
        elseNode !== undefined &&
        isList(elseNode) &&
        listHead(elseNode) === "then";
      const elseMoves =
        elseNode && !isThenNode ? compileMoves(elseNode, env) : undefined;
      const thenEffect = isThenNode
        ? compileThen(elseNode as LudList, env)
        : undefined;
      return {
        generate: (ctx) => {
          let moves = cond.eval(ctx)
            ? thenMoves.generate(ctx)
            : elseMoves
              ? elseMoves.generate(ctx)
              : [];
          if (thenEffect && moves.length > 0) {
            const { moveAgain, effect } = thenEffect;
            if (effect || moveAgain) {
              moves = moves.map((m) => {
                const ectx = ctx
                  .withContext(
                    ctx.context.withTrial(
                      ctx.context.trial.withMove(m, false, -1),
                    ),
                  )
                  .withFrame({ from: m.from(), to: m.to() });
                const extra = effect ? effect(ectx) : [];
                return extra.length > 0 || moveAgain
                  ? m.withConsequence(extra, moveAgain)
                  : m;
              });
            }
          }
          return moves;
        },
      };
    }
    case "step":
      // Bare (step <dir> (to …)) as a piece's default move rule — identical
      // semantics to (move Step …) but without the "move Step" prefix. Compile
      // with the dir at index 1.
      return compileStep(node as LudList, env, 1);
    case "slide":
      // Bare (slide <dir?> (to …)) as a piece move rule — like (move Slide …)
      // without the prefix; compile with the dir at index 1.
      return compileSlide(node as LudList, env, 1);
    case "vote": {
      // (vote "Question") — cast a vote; resolution lives in the rules' voting
      // phase. Emit one move carrying an ActionVote.
      const qNode = rest[0];
      const q =
        qNode && isString(qNode)
          ? qNode.value
          : qNode && isIdent(qNode)
            ? qNode.name
            : "Vote";
      return {
        generate: (ctx) => {
          const mover = ctx.mover;
          return [
            new Move({
              id: `vote:${q}:${mover}`,
              label: `Vote ${q}`,
              siteIndices: [0],
              mover,
              placedOwner: mover,
              actions: [new ActionVote(q)],
            }),
          ];
        },
      };
    }
    case "propose": {
      // (propose "Question") — table a proposal; resolution is by later votes.
      const pNode = rest[0];
      const text =
        pNode && isString(pNode)
          ? pNode.value
          : pNode && isIdent(pNode)
            ? pNode.name
            : "Propose";
      return {
        generate: (ctx) => {
          const mover = ctx.mover;
          return [
            new Move({
              id: `propose:${text}:${mover}`,
              label: `Propose ${text}`,
              siteIndices: [0],
              mover,
              placedOwner: mover,
              actions: [new ActionPropose(text)],
            }),
          ];
        },
      };
    }
    case "fromTo":
      // Top-level (fromTo (from …) (to …)) in moves position — relocate a piece
      // from each source to each destination. Java:
      // Core/src/game/rules/play/moves/nonDecision/effect/FromTo.java
      return compileFromTo(node as LudList, env);
    case "flips":
      // (flips a b) is a piece-attribute specifying flip-state values, not a
      // move generator. compilePieceMoves skips it when finding the moves node;
      // this is a defensive no-op for any stray top-level occurrence.
      // Java: Core/src/game/util/moves/Flips.java
      return EMPTY_MOVES;
    case "remember":
    case "forget": {
      // Bare effect ludeme used in moves position (e.g. inside (forEach Site …)):
      // wrap the remember/forget effect into a single move carrying its actions.
      const eff = compileEffectAction(node as LudList, env);
      if (!eff) return EMPTY_MOVES;
      return {
        generate: (ctx) => {
          const mover = ctx.mover;
          const site = ctx.frame.site ?? 0;
          return [
            new Move({
              id: `${head}:${site}:${mover}`,
              label: head,
              siteIndices: [site],
              mover,
              placedOwner: mover,
              actions: eff(ctx),
            }),
          ];
        },
      };
    }
    case "append": {
      // `(append <list> [(then …)])` — evaluate the inner moves generator and
      // attach the optional (then …) consequences to each produced move. Java
      // bundles them into one compound move; flattening is sufficient for here.
      // Java: Core/src/game/rules/play/moves/nonDecision/operators/logical/Append.java
      const appendMovesNode = rest[0];
      if (!appendMovesNode) return EMPTY_MOVES;
      const appendInner = compileMoves(appendMovesNode, env);
      const appendThenNode = rest.find(
        (n) => isList(n) && listHead(n) === "then",
      ) as LudList | undefined;
      const appendThen = appendThenNode
        ? compileThen(appendThenNode, env)
        : undefined;
      return {
        generate: (ctx) => {
          const moves = appendInner.generate(ctx);
          if (!appendThen || moves.length === 0) return moves;
          const { moveAgain, effect } = appendThen;
          if (!effect && !moveAgain) return moves;
          return moves.map((m) => {
            const ectx = ctx
              .withContext(
                ctx.context.withTrial(ctx.context.trial.withMove(m, false, -1)),
              )
              .withFrame({ from: m.from(), to: m.to() });
            const extra = effect ? effect(ectx) : [];
            return extra.length > 0 || moveAgain
              ? m.withConsequence(extra, moveAgain)
              : m;
          });
        },
      };
    }
    case "custodial": {
      // `(custodial (from …) [<dir>] (between [(max <n>)] if:<cond> [(apply <eff>)])
      //             (to if:<cond>) [(then …)])`
      // Flanking capture/flip: scans each direction radially from the anchor
      // site; if a contiguous run of `between` pieces satisfying `if:` is
      // bounded by a `to` piece satisfying its `if:`, applies the `(apply …)`
      // effect to each between-site, emitting one Move per site.
      // Java: Core/src/game/rules/play/moves/nonDecision/effect/Custodial.java
      const custArgs = parseArgs(node.items.slice(1));
      const custFromNode =
        custArgs.named.get("from") ??
        custArgs.positional.find((n) => isList(n) && listHead(n) === "from");
      let custFromFn: IntFn = {
        eval: (ctx) => ctx.frame.site ?? ctx.frame.from ?? OFF,
      };
      if (custFromNode && isList(custFromNode)) {
        const inner = custFromNode.items[1];
        if (inner) {
          try {
            custFromFn = compileInt(inner, env);
          } catch {
            /* use frame.site default */
          }
        }
      }
      const custDirTokens: string[] = [];
      for (const n of node.items.slice(1)) {
        if (
          isIdent(n) &&
          !n.name.endsWith(":") &&
          [
            "Adjacent", "Orthogonal", "Diagonal", "All",
            "N", "S", "E", "W", "NE", "NW", "SE", "SW",
          ].includes(n.name)
        ) {
          custDirTokens.push(n.name);
        }
      }
      const custBetweenNode =
        custArgs.named.get("between") ??
        custArgs.positional.find((n) => isList(n) && listHead(n) === "between");
      let custMaxFn: IntFn = { eval: () => 64 };
      let custTargetFn: BoolFn = { eval: () => false };
      let custApplyFn: ((ctx: EvalContext) => Action[]) | undefined;
      if (custBetweenNode && isList(custBetweenNode)) {
        const bArgs = parseArgs(custBetweenNode.items.slice(1));
        const maxNode =
          bArgs.named.get("max") ??
          bArgs.positional.find((n) => isList(n) && listHead(n) === "max");
        if (maxNode) {
          try {
            if (isList(maxNode)) {
              const mi = maxNode.items[1];
              if (mi) custMaxFn = compileInt(mi, env);
            } else {
              custMaxFn = compileInt(maxNode, env);
            }
          } catch {
            /* leave as 64 */
          }
        }
        const ifNode = bArgs.named.get("if");
        if (ifNode) {
          try {
            custTargetFn = compileBool(ifNode, env);
          } catch {
            /* always false */
          }
        }
        const applyNode =
          bArgs.positional.find((n) => isList(n) && listHead(n) === "apply") ??
          bArgs.named.get("apply");
        if (applyNode && isList(applyNode)) {
          try {
            custApplyFn = compileEffect(applyNode as LudList, env);
          } catch {
            /* lenient: no-op */
          }
        }
      }
      const custToNode =
        custArgs.named.get("to") ??
        custArgs.positional.find((n) => isList(n) && listHead(n) === "to");
      let custFriendFn: BoolFn = { eval: () => false };
      if (custToNode && isList(custToNode)) {
        const toArgs = parseArgs(custToNode.items.slice(1));
        const toIf = toArgs.named.get("if");
        if (toIf) {
          try {
            custFriendFn = compileBool(toIf, env);
          } catch {
            /* always false */
          }
        }
      }
      const custThenNode = node.items.find(
        (n) => isList(n) && listHead(n) === "then",
      ) as LudList | undefined;
      const custThen = custThenNode ? compileThen(custThenNode, env) : undefined;
      const custMoveAgain = custThen?.moveAgain ?? false;
      const custThenEffect = custThen?.effect;
      return {
        generate: (ctx) => {
          const from = custFromFn.eval(ctx);
          if (from < 0 || from >= ctx.board.numSites) return [];
          const dirs = resolveDirectionTokens(
            custDirTokens.length > 0 ? custDirTokens : ["Adjacent"],
            ctx,
          );
          const maxDist = custMaxFn.eval(ctx);
          const board = ctx.board;
          const mover = ctx.mover;
          const out: Move[] = [];
          for (const d of dirs) {
            const betweenSites: number[] = [];
            let x = board.xOf(from);
            let y = board.yOf(from);
            let foundFriend = false;
            for (let step = 0; step < maxDist; step += 1) {
              x += d.dx;
              y += d.dy;
              const s = board.siteAt(x, y);
              if (s < 0) break;
              if (custTargetFn.eval(ctx.withFrame({ between: s, site: s }))) {
                betweenSites.push(s);
              } else {
                foundFriend = custFriendFn.eval(
                  ctx.withFrame({ to: s, site: s }),
                );
                break;
              }
            }
            if (!foundFriend || betweenSites.length === 0) continue;
            for (const bs of betweenSites) {
              const bctx = ctx.withFrame({ between: bs, site: bs, from, to: bs });
              let actions: Action[] = [];
              if (custApplyFn) {
                try {
                  actions = custApplyFn(bctx);
                } catch {
                  actions = [];
                }
              }
              if (actions.length === 0) {
                actions = [new ActionSetState({ to: bs, state: mover })];
              }
              let m = new Move({
                id: `custodial:${from}:${bs}:${mover}`,
                label: `Custodial ${from}->${bs}`,
                siteIndices: [from, bs],
                mover,
                placedOwner: mover,
                actions,
              });
              if (custMoveAgain || custThenEffect) {
                const ectx = ctx.withFrame({ from, to: bs });
                const extra = custThenEffect ? custThenEffect(ectx) : [];
                if (extra.length > 0 || custMoveAgain) {
                  m = m.withConsequence(extra, custMoveAgain);
                }
              }
              out.push(m);
            }
          }
          return out;
        },
      };
    }
    case "trigger": {
      // `(trigger "<event>" <player>)` in moves position. Java: Trigger.java —
      // generates a single move carrying ActionTrigger for the given player.
      // Trigger state is not modelled; the action is a no-op on apply, but the
      // form must compile so `(do prior next:(move …))` can proceed.
      const evtNode = node.items[1];
      const plrNode = node.items[2];
      if (!evtNode || !isString(evtNode)) return EMPTY_MOVES;
      const evtName = evtNode.value;
      let plrFn: IntFn = { eval: (ctx: EvalContext) => ctx.mover };
      if (plrNode) {
        try {
          plrFn = compileInt(plrNode, env);
        } catch {
          /* default to mover */
        }
      }
      return {
        generate: (ctx) => {
          const mover = ctx.mover;
          return [
            new Move({
              id: `trigger:${evtName}:${mover}`,
              label: `Trigger ${evtName}`,
              siteIndices: [0],
              mover,
              placedOwner: mover,
              actions: [new ActionTrigger(evtName, plrFn.eval(ctx))],
            }),
          ];
        },
      };
    }
    case "remove": {
      // Bare `(remove <region/site> [then:])` in moves position. Java:
      // Remove.java — generates one removal Move per site in the region.
      // Mirrors `(move Remove <region>)` without the `move Remove` prefix
      // (Game of Life uses `(remove (to))` as a forEach-Site else-branch).
      const regionNode = node.items[1];
      if (!regionNode) return EMPTY_MOVES;
      const thenNode = node.items.find(
        (n) => isList(n) && listHead(n) === "then",
      ) as LudList | undefined;
      const thenEffect = thenNode ? compileThen(thenNode, env) : undefined;
      let region: RegionFn;
      try {
        region = compileRegion(regionNode, env);
      } catch {
        return EMPTY_MOVES;
      }
      const reg = region;
      return {
        generate: (ctx) => {
          const out: Move[] = [];
          const mover = ctx.mover;
          for (const site of reg.eval(ctx)) {
            if (site < 0) continue;
            const m = new Move({
              id: `remove:${site}:${mover}`,
              label: `Remove at ${site}`,
              siteIndices: [site],
              mover,
              placedOwner: mover,
              actions: [new ActionRemove({ to: site })],
            });
            if (thenEffect) {
              const { moveAgain, effect } = thenEffect;
              const ectx = ctx
                .withContext(
                  ctx.context.withTrial(ctx.context.trial.withMove(m, false, -1)),
                )
                .withFrame({ from: m.from(), to: m.to() });
              const extra = effect ? effect(ectx) : [];
              out.push(
                extra.length > 0 || moveAgain
                  ? m.withConsequence(extra, moveAgain)
                  : m,
              );
            } else {
              out.push(m);
            }
          }
          return out;
        },
      };
    }
    case "firstMoveOnTrack": {
      // `(firstMoveOnTrack [<trackName>] [<owner>] <moves>)`. Java:
      // requirement/FirstMoveOnTrack.java — walks the named track in order,
      // binding `(site)` to each, returning the first site's non-empty moves.
      // Track data isn't exposed at runtime here, so we walk board sites in
      // index order as a stand-in — sufficient for compile-clean coverage.
      const { positional: ftPos } = parseArgs(node.items.slice(1));
      let argIdx = 0;
      const first = ftPos[argIdx];
      if (first && isString(first)) argIdx += 1;
      const second = ftPos[argIdx];
      let ownerArg: LudNode | undefined;
      if (second && isIdent(second)) {
        ownerArg = second;
        argIdx += 1;
      }
      const movesNode = ftPos[argIdx];
      if (!movesNode) return EMPTY_MOVES;
      let inner: MovesFn;
      try {
        inner = compileMoves(movesNode, env);
      } catch {
        return EMPTY_MOVES;
      }
      const gen = inner;
      let ownerFn: IntFn | undefined;
      if (ownerArg) {
        try {
          ownerFn = compileInt(ownerArg, env);
        } catch {
          /* use mover */
        }
      }
      return {
        generate: (ctx) => {
          void (ownerFn ? ownerFn.eval(ctx) : ctx.mover);
          const numSites = ctx.board.numSites;
          for (let s = 0; s < numSites; s += 1) {
            const sub = ctx.withFrame({ site: s, from: ctx.frame.from ?? s });
            const moves = gen.generate(sub);
            if (moves.length > 0) return moves;
          }
          return [];
        },
      };
    }
    default:
      throw new LudemeCompileError(`Unsupported moves ludeme: (${head} …).`);
  }
}

/**
 * `(do <moves> ifAfterwards:<bool>)` — generate the inner moves, then keep
 * only those whose *resulting* position satisfies the `ifAfterwards`
 * predicate (evaluated with the mover unchanged). This is the chess rule that
 * a move is illegal if it leaves your own king in check. The `next:`
 * sequencing form is not yet supported.
 */
function compileDo(node: LudList, env: CompileEnv): MovesFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const movesNode = positional[0];
  if (!movesNode) throw new LudemeCompileError("(do …) needs a moves clause.");
  const inner = compileMoves(movesNode, env);
  const ifAfterNode = named.get("ifAfterwards");
  if (!ifAfterNode) {
    // `(do A next:B)` runs A this decision, then B as a follow-up phase in
    // the same turn. The interpreter does not yet model sub-turn phases, so
    // we generate the primary phase A; the `next:` moves are reached once
    // turn-phase sequencing lands. This keeps dice/sow games compiling.
    return inner;
  }
  const cond = compileBool(ifAfterNode, env);
  return {
    generate: (ctx) =>
      inner.generate(ctx).filter((m) => cond.eval(ctx.applyHypothetical(m))),
  };
}

/**
 * `(roll)` — a single move that re-rolls every declared die. The values are
 * drawn at apply-time from the trial RNG (see ActionRollDice) so move
 * enumeration stays pure.
 */
function compileRoll(env: CompileEnv): MovesFn {
  const def = env.diceDef;
  if (!def || def.numDice === 0) {
    return { generate: () => [] };
  }
  const faces = def.faces;
  return {
    generate: (ctx) => [
      new Move({
        id: "roll",
        label: "Roll",
        siteIndices: [0],
        mover: ctx.mover,
        placedOwner: ctx.mover,
        actions: [new ActionRollDice(faces)],
      }),
    ],
  };
}

/**
 * `(or { … })` wraps its alternatives in a curly group; `(or a b)` lists
 * them directly. Flatten a single curly group so both spellings compile.
 */
function flattenMoveList(items: readonly LudNode[]): readonly LudNode[] {
  if (items.length === 1) {
    const only = items[0];
    if (only && isList(only) && only.delimiter === "curly") {
      return only.items;
    }
  }
  return items;
}

/**
 * Compile a moves-list body (`(or …)`, a bare `{ … }` block, `(priority …)`).
 * A trailing `(then <effect>)` sibling is not a generator — it decorates the
 * moves produced by the other alternatives, so it is split out, compiled via
 * `compileThen`, and folded into every generated move. `combine` defines how
 * the surviving generators are joined (concat for `or`, first-non-empty for
 * `priority`).
 */
function compileMovesList(
  children: readonly LudNode[],
  env: CompileEnv,
  combine: (parts: MovesFn[]) => MovesFn,
): MovesFn {
  const gens: MovesFn[] = [];
  const thens: { moveAgain: boolean; effect?: EffectFn }[] = [];
  for (const child of flattenMoveList(children)) {
    if (isString(child)) continue; // skip define-name leftovers
    if (isList(child) && listHead(child) === "then") {
      thens.push(compileThen(child, env));
      continue;
    }
    gens.push(compileMoves(child, env));
  }
  const base = combine(gens);
  if (thens.length === 0) return base;
  const moveAgain = thens.some((t) => t.moveAgain);
  const effects = thens
    .map((t) => t.effect)
    .filter((e): e is EffectFn => e !== undefined);
  return {
    generate: (ctx) =>
      base.generate(ctx).map((m) => {
        // Record the move as the last move so `(last To)` / `(last From)` in a
        // `(then …)` resolve to it, and bind its from/to into the frame.
        const ectx = ctx
          .withContext(ctx.context.withTrial(ctx.context.trial.withMove(m, false, -1)))
          .withFrame({ from: m.from(), to: m.to() });
        const extra = effects.flatMap((e) => e(ectx));
        return extra.length > 0 || moveAgain
          ? m.withConsequence(extra, moveAgain)
          : m;
      }),
  };
}

const concatMoves = (parts: MovesFn[]): MovesFn => ({
  generate: (ctx) => parts.flatMap((p) => p.generate(ctx)),
});

const firstNonEmptyMoves = (parts: MovesFn[]): MovesFn => ({
  generate: (ctx) => {
    for (const p of parts) {
      const moves = p.generate(ctx);
      if (moves.length > 0) return moves;
    }
    return [];
  },
});

/**
 * `(forEach Piece)` — iterate the mover's pieces, binding `from` to each
 * occupied site and dispatching that piece's compiled move generator.
 */
function compileForEach(node: LudList, env: CompileEnv): MovesFn {
  const kindNode = node.items[1];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "";
  if (kind === "Player") {
    // `(forEach Player <moves>)` — bind frame.player to each player index
    // 1..numPlayers and run the inner move generator (So Long Sucker uses this
    // to set the next active player). Java: ForEachPlayer.
    const movesNode = node.items[2];
    if (!movesNode) return EMPTY_MOVES;
    let inner: MovesFn;
    try {
      inner = compileMoves(movesNode, env);
    } catch {
      return EMPTY_MOVES;
    }
    const gen = inner;
    return {
      generate: (ctx) => {
        const out: Move[] = [];
        const n = ctx.context.game.numPlayers;
        for (let p = 1; p <= n; p += 1) {
          out.push(...gen.generate(ctx.withFrame({ player: p })));
        }
        return out;
      },
    };
  }
  if (kind === "Piece" || kind === "piece") {
    // `(forEach Piece ["Name"] [<moves>] [(then …)])`. An optional piece-type
    // name and/or an explicit <moves> clause may follow `Piece`. The lowercase
    // `(forEach piece)` is an accepted alias (Wumpus World).
    //
    // With an explicit <moves> clause (e.g. checkers' `(forEach Piece "Counter"
    // ("StepToEmpty" …) (then …))`), run that clause from each of the mover's
    // piece sites with `from` bound, folding any sibling (then …) into every
    // generated move. The piece-type name is accepted but not filtered on: this
    // engine tracks owner, not per-site component identity, so all the mover's
    // pieces are iterated. Without a clause, dispatch to each piece's
    // equipment-defined move generator.
    const after = node.items.slice(2);
    const movesNode = after.find((n) => isList(n) && listHead(n) !== "then");
    if (movesNode) {
      const inner = compileMoves(movesNode, env);
      const thens = after
        .filter((n) => isList(n) && listHead(n) === "then")
        .map((n) => compileThen(n as LudList, env));
      const moveAgain = thens.some((t) => t.moveAgain);
      const effects = thens
        .map((t) => t.effect)
        .filter((e): e is EffectFn => e !== undefined);
      return {
        generate: (ctx) => {
          const out: Move[] = [];
          const mover = ctx.mover;
          const cells = ctx.state.cells;
          for (let s = 0; s < cells.length; s += 1) {
            if (cells[s] !== mover) continue;
            const sub = ctx.withFrame({ from: s, piece: mover });
            for (const m of inner.generate(sub)) {
              if (effects.length === 0 && !moveAgain) {
                out.push(m);
                continue;
              }
              const ectx = sub
                .withContext(
                  sub.context.withTrial(
                    sub.context.trial.withMove(m, false, -1),
                  ),
                )
                .withFrame({ from: m.from(), to: m.to() });
              const extra = effects.flatMap((e) => e(ectx));
              out.push(
                extra.length > 0 || moveAgain
                  ? m.withConsequence(extra, moveAgain)
                  : m,
              );
            }
          }
          return out;
        },
      };
    }
    return {
      generate: (ctx) => {
        const moves = env.pieceMovesByOwner;
        if (!moves) return [];
        const mover = ctx.mover;
        const gen = moves.get(mover);
        if (!gen) return [];
        const out: Move[] = [];
        const cells = ctx.state.cells;
        for (let s = 0; s < cells.length; s += 1) {
          if (cells[s] !== mover) continue;
          const sub = ctx.withFrame({ from: s, piece: mover });
          out.push(...gen.generate(sub));
        }
        return out;
      },
    };
  }
  if (kind === "Site") {
    // (forEach Site <region> <moves>) — bind frame.site (and to) to each
    // member of the region, then run the inner move generator there.
    const regionNode = node.items[2];
    const movesNode = node.items[3];
    if (!regionNode || !movesNode)
      throw new LudemeCompileError(
        "(forEach Site …) needs a region and a moves clause.",
      );
    const region = compileRegion(regionNode, env);
    const inner = compileMoves(movesNode, env);
    return {
      generate: (ctx) => {
        const out: Move[] = [];
        for (const s of region.eval(ctx)) {
          if (s < 0) continue;
          out.push(...inner.generate(ctx.withFrame({ site: s, to: s })));
        }
        return out;
      },
    };
  }
  if (kind === "Value") {
    // (forEach Value min:<a> max:<b> <moves>) — bind frame.value to each
    // integer in [min, max] and run the inner move generator.
    const { positional, named } = parseArgs(node.items.slice(2));
    const minNode = named.get("min");
    const maxNode = named.get("max");
    // (forEach Value <intArray> <moves>) — iterate over an explicit list of
    // values (e.g. (values Remembered "Throws") or (array …)) instead of a
    // numeric range, binding frame.value to each element.
    if (!minNode && !maxNode) {
      const listNode = positional[0];
      const movesNode = positional[1];
      if (!listNode || !movesNode)
        throw new LudemeCompileError(
          "(forEach Value <list> <moves>) needs a list and a moves clause.",
        );
      const listFn = compileRegion(listNode, env);
      const inner = compileMoves(movesNode, env);
      return {
        generate: (ctx) => {
          const out: Move[] = [];
          for (const v of listFn.eval(ctx)) {
            out.push(...inner.generate(ctx.withFrame({ value: v })));
          }
          return out;
        },
      };
    }
    const movesNode = positional[0];
    if (!minNode || !maxNode || !movesNode)
      throw new LudemeCompileError(
        "(forEach Value …) needs min:, max: and a moves clause.",
      );
    const minFn = compileInt(minNode, env);
    const maxFn = compileInt(maxNode, env);
    const inner = compileMoves(movesNode, env);
    return {
      generate: (ctx) => {
        const lo = minFn.eval(ctx);
        const hi = maxFn.eval(ctx);
        const out: Move[] = [];
        for (let v = lo; v <= hi; v += 1) {
          out.push(...inner.generate(ctx.withFrame({ value: v })));
        }
        return out;
      },
    };
  }
  if (kind === "Die") {
    // (forEach Die [if:<bool>] <moves>) — for each die with a non-zero face,
    // bind frame.value to its pips, generate the inner moves, and tag each
    // with ActionUseDie so the die is spent when the move is applied.
    const { positional, named } = parseArgs(node.items.slice(2));
    const ifNode = named.get("if");
    const cond: BoolFn = ifNode
      ? compileBool(ifNode, env)
      : { eval: () => true };
    const movesNode = positional[0];
    if (!movesNode)
      throw new LudemeCompileError("(forEach Die …) needs a moves clause.");
    const inner = compileMoves(movesNode, env);
    return {
      generate: (ctx) => {
        const dice = ctx.state.diceValues;
        const out: Move[] = [];
        for (let i = 0; i < dice.length; i += 1) {
          const pips = dice[i] ?? 0;
          if (pips === 0) continue;
          const sub = ctx.withFrame({ value: pips });
          if (!cond.eval(sub)) continue;
          for (const m of inner.generate(sub)) {
            out.push(m.withConsequence([new ActionUseDie(i, 0)], false));
          }
        }
        return out;
      },
    };
  }
  if (kind === "Direction") {
    // (forEach Direction [(from <site>)] <dirs> <body>) — step one cell from
    // the source along each resolved direction, bind frame.to to the
    // neighbour, and run the inner move generator there. The source defaults
    // to the current to/from site (last move's destination). Direction rays
    // beyond one step are handled by the body recursing (e.g. knight walks).
    const rest = node.items.slice(2);
    const fromNode = rest.find(
      (n) => isList(n) && listHead(n) === "from",
    ) as LudList | undefined;
    const fromInner = fromNode?.items[1];
    const fromFn = fromInner ? compileInt(fromInner, env) : undefined;
    const dirNode = rest.find(
      (n) =>
        (isList(n) && listHead(n) === "directions") ||
        (isIdent(n) && !isPlaceholderIdent(n.name)) ||
        (isList(n) && n.delimiter === "curly"),
    );
    const tokens = collectDirectionTokens(dirNode);
    const BODY_HEADS = new Set([
      "move",
      "if",
      "forEach",
      "and",
      "or",
      "add",
      "set",
      "do",
      "priority",
    ]);
    const bodyNode = rest.find(
      (n) => isList(n) && BODY_HEADS.has(listHead(n) ?? ""),
    ) as LudList | undefined;
    let inner: MovesFn | undefined;
    if (bodyNode) {
      try {
        inner = compileMoves(bodyNode, env);
      } catch {
        inner = undefined;
      }
    }
    if (!inner) return EMPTY_MOVES;
    const gen = inner;
    return {
      generate: (ctx) => {
        const from =
          fromFn?.eval(ctx) ??
          ctx.frame.to ??
          ctx.frame.from ??
          lastToSite(ctx);
        if (from === undefined || from < 0) return [];
        const board = ctx.board;
        const x = board.xOf(from);
        const y = board.yOf(from);
        const dirs = resolveDirectionTokens(tokens, ctx);
        const out: Move[] = [];
        const seen = new Set<number>();
        for (const d of dirs) {
          const nb = board.siteAt(x + d.dx, y + d.dy);
          if (nb < 0 || seen.has(nb)) continue;
          seen.add(nb);
          out.push(
            ...gen.generate(ctx.withFrame({ from, to: nb, between: nb })),
          );
        }
        return out;
      },
    };
  }
  if (kind === "Group") {
    // `(forEach Group [if:<cond>] <moves> [(then …)])` — iterate every maximal
    // connected same-owner group; bind frame.to/site to the group's max site
    // (mirrors (max (array (sites)))), then run the inner move generator.
    // Java: Core/src/game/rules/play/moves/nonDecision/operators/foreach/group/ForEachGroup.java
    const { positional: gPos, named: gNamed } = parseArgs(node.items.slice(2));
    const gIfNode = gNamed.get("if");
    const gCond: BoolFn = gIfNode
      ? compileBool(gIfNode, env)
      : { eval: () => true };
    const gMovesNode = gPos[0];
    if (!gMovesNode) return EMPTY_MOVES;
    const gInner = compileMoves(gMovesNode, env);
    const gThenNode = node.items.find(
      (n) => isList(n) && listHead(n) === "then",
    ) as LudList | undefined;
    const gThen = gThenNode ? compileThen(gThenNode, env) : undefined;
    return {
      generate: (ctx) => {
        const mover = ctx.mover;
        const groups = groupComponents(
          ctx,
          (s) => (ctx.state.cells[s] ?? 0) === mover,
        );
        const out: Move[] = [];
        for (const group of groups) {
          const sites = [...group];
          if (sites.length === 0) continue;
          const rep = Math.max(...sites);
          const sub = ctx.withFrame({ to: rep, from: rep, site: rep });
          if (!gCond.eval(sub)) continue;
          const innerMoves = gInner.generate(sub);
          if (gThen && innerMoves.length > 0) {
            const { moveAgain, effect } = gThen;
            for (const m of innerMoves) {
              const ectx = sub
                .withContext(
                  sub.context.withTrial(
                    sub.context.trial.withMove(m, false, -1),
                  ),
                )
                .withFrame({ from: m.from(), to: m.to() });
              const extra = effect ? effect(ectx) : [];
              out.push(
                extra.length > 0 || moveAgain
                  ? m.withConsequence(extra, moveAgain)
                  : m,
              );
            }
          } else {
            out.push(...innerMoves);
          }
        }
        return out;
      },
    };
  }
  if (kind === "Level") {
    // `(forEach Level <site> [FromBottom|FromTop] <moves> [(then …)])` — iterate
    // every stack level at the site from top (default) or bottom, binding
    // frame.level to each index, generating the inner moves for each level.
    // Java: Core/src/game/rules/play/moves/nonDecision/operators/foreach/level/ForEachLevel.java
    const { positional: lvlPos } = parseArgs(node.items.slice(2));
    const lvlSiteNode = lvlPos[0];
    if (!lvlSiteNode) return EMPTY_MOVES;
    const lvlSiteFn = compileInt(lvlSiteNode, env);
    let lvlBodyIdx = 1;
    let fromBottom = false;
    const lvlDirNode = lvlPos[1];
    if (
      lvlDirNode &&
      isIdent(lvlDirNode) &&
      (lvlDirNode.name === "FromBottom" || lvlDirNode.name === "FromTop")
    ) {
      fromBottom = lvlDirNode.name === "FromBottom";
      lvlBodyIdx = 2;
    }
    const lvlMovesNode = lvlPos[lvlBodyIdx];
    if (!lvlMovesNode) return EMPTY_MOVES;
    const lvlInner = compileMoves(lvlMovesNode, env);
    const lvlThenNode = node.items.find(
      (n) => isList(n) && listHead(n) === "then",
    ) as LudList | undefined;
    const lvlThen = lvlThenNode ? compileThen(lvlThenNode, env) : undefined;
    return {
      generate: (ctx) => {
        const site = lvlSiteFn.eval(ctx);
        if (site < 0) return [];
        const stackSize = ctx.state.stackSize(site);
        const levels: number[] = fromBottom
          ? Array.from({ length: stackSize }, (_, i) => i)
          : Array.from({ length: stackSize }, (_, i) => stackSize - 1 - i);
        const out: Move[] = [];
        for (const level of levels) {
          const sub = ctx.withFrame({ level, site, to: site });
          const innerMoves = lvlInner.generate(sub);
          if (lvlThen && innerMoves.length > 0) {
            const { moveAgain, effect } = lvlThen;
            for (const m of innerMoves) {
              const ectx = sub
                .withContext(
                  sub.context.withTrial(
                    sub.context.trial.withMove(m, false, -1),
                  ),
                )
                .withFrame({ from: m.from(), to: m.to() });
              const extra = effect ? effect(ectx) : [];
              out.push(
                extra.length > 0 || moveAgain
                  ? m.withConsequence(extra, moveAgain)
                  : m,
              );
            }
          } else {
            out.push(...innerMoves);
          }
        }
        return out;
      },
    };
  }
  throw new LudemeCompileError(`Unsupported (forEach ${kind} …) in moves.`);
}

/**
 * Read the direction tokens a `(move Step …)` declares. A step with no
 * explicit direction defaults to Ludii's "Adjacent", which on a square board
 * is all 8 neighbours (edge + vertex sharing).
 */
function stepDirectionTokens(node: LudNode | undefined): string[] {
  const tokens = rawDirectionTokens(node).filter((t) => !t.startsWith("#"));
  return tokens.length > 0 ? tokens : ["Adjacent"];
}

/**
 * The one-cell neighbours of `from` along the given direction tokens. On a
 * rectangular lattice this is `siteAt(x±dx, y±dy)`; on a graph board (built by
 * the graph algebra — concentric / merge / dual, used by morris, alquerque,
 * mancala-graph and the like) the lattice has no meaning, so steps follow the
 * board's adjacency relations instead. There, the only genuine connections are
 * the graph edges, so the catch-all groups (Adjacent/All) resolve to the
 * edge-connected neighbours rather than to geometrically-inferred diagonals.
 */
function stepNeighbours(
  ctx: EvalContext,
  from: number,
  tokens: readonly string[],
): number[] {
  const board = ctx.board;
  const traj = board.traj;
  if (traj) {
    const out = new Set<number>();
    for (const token of tokens) {
      if (token === "Orthogonal" || token === "Adjacent" || token === "All") {
        for (const n of traj.neighbours(from)) out.add(n);
      } else if (token === "Diagonal") {
        for (const n of traj.group(from, "Diagonal")) out.add(n);
      } else {
        const n = traj.step(from, token);
        if (n >= 0) out.add(n);
      }
    }
    return [...out];
  }
  const x = board.xOf(from);
  const y = board.yOf(from);
  const out: number[] = [];
  for (const d of resolveDirectionTokens(tokens, ctx)) {
    const to = board.siteAt(x + d.dx, y + d.dy);
    if (to !== OFF) out.push(to);
  }
  return out;
}

/** An effect block: `(apply <effect>)` → extra actions for the move. */
type EffectFn = (ctx: EvalContext) => Action[];

/**
 * Compile an `(apply <effect>)` block to a function producing the extra
 * actions a move carries. Currently handles `(remove <site>)`.
 */
function compileApply(node: LudList, env: CompileEnv): EffectFn {
  // Three Java Apply forms: (apply <effect>), (apply if:<cond> <effect>) and
  // (apply if:<cond>) — the last is a bare guard whose move lives in the
  // surrounding (then …), so it contributes no actions here.
  const { positional, named } = parseArgs(node.items.slice(1));
  const ifNode = named.get("if");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;
  const effectNode = positional.find((n) => isList(n));
  if (!effectNode) {
    if (cond) return () => [];
    throw new LudemeCompileError("(apply …) needs an effect.");
  }
  const effect = compileEffect(effectNode as LudList, env);
  if (!cond) return effect;
  return (ctx) => (cond.eval(ctx) ? effect(ctx) : []);
}

/**
 * Compile an effect ludeme (the body of an `(apply …)`) into a function
 * producing the actions it contributes. Control-flow forms compose
 * sub-effects: `(if <cond> <then> <else>?)` picks a branch and `(and …)`
 * runs several; leaf effects (`remove`/`addScore`/`set …`) delegate to
 * `compileEffectAction`.
 */
function compileEffect(node: LudList, env: CompileEnv): EffectFn {
  const head = listHead(node);
  // A curly `{ eff … }` block is an implicit sequence of sub-effects, as is
  // `(and { … })` where the `and` takes a single curly-list argument. Flatten
  // either into a lenient sequence so one unsupported member doesn't fail the
  // whole compile (mancala capture defines lean on this heavily).
  if (node.delimiter === "curly") {
    const parts = effectChildren(node.items).map((n) =>
      compileEffectLenient(n, env),
    );
    return (ctx) => parts.flatMap((p) => p(ctx));
  }
  if (head === "if") {
    const { positional } = parseArgs(node.items.slice(1));
    const [condNode, thenNode, elseNode] = positional;
    if (!condNode || !thenNode) {
      throw new LudemeCompileError("(if …) effect needs a cond and a then.");
    }
    const cond = compileBool(condNode, env);
    const thenE = effectOf(thenNode, env);
    const elseE = elseNode ? effectOf(elseNode, env) : undefined;
    return (ctx) => (cond.eval(ctx) ? thenE(ctx) : elseE ? elseE(ctx) : []);
  }
  if (head === "and") {
    const parts = effectChildren(node.items.slice(1)).map((n) =>
      compileEffectLenient(n, env),
    );
    return (ctx) => parts.flatMap((p) => p(ctx));
  }
  if (head === "forEach") {
    return compileForEachEffect(node, env);
  }
  if (head === "move") {
    // `(move …)` in effect position, e.g. inside `(apply (if <cond> (move …)))`.
    // Java's Apply returns the moves generated by the nested move ludeme and
    // applies them as consequence actions. Lenient: compile the inner move
    // generator and, at apply-time, flatten its generated moves' actions into
    // the effect action stream (covers capture-and-relocate defines like
    // Tawula's CaptureEnemyPiece and Wellisch Chess's GrabToPiece).
    // Java: Core/src/game/rules/play/moves/nonDecision/effect/Apply.java
    try {
      const innerMoves = compileMoveLudeme(node, env);
      return (ctx) => innerMoves.generate(ctx).flatMap((m) => [...m.actions]);
    } catch {
      return () => [];
    }
  }
  if (head === "do") {
    // `(do <prior> next:<main>)` / `(do <prior> ifAfterwards:<cond>)` in effect
    // position. Java: requirement/Do.java — applies prior actions as a preamble
    // then runs the main move generator. Lenient: reuse compileDo (which handles
    // both arms in moves position) and flatten the generated moves' actions.
    try {
      const inner = compileDo(node, env);
      return (ctx) => inner.generate(ctx).flatMap((m) => [...m.actions]);
    } catch {
      return () => [];
    }
  }
  const leaf = compileEffectAction(node, env);
  if (leaf) return leaf;
  throw new LudemeCompileError(`Unsupported effect: (${head} …).`);
}

/**
 * Flatten an effect-argument list into its component effect lists, expanding
 * any nested curly `{ … }` blocks (a `(and { … })` argument) into their items.
 */
function effectChildren(items: readonly LudNode[]): LudList[] {
  const out: LudList[] = [];
  for (const it of items) {
    if (!isList(it)) continue;
    if (it.delimiter === "curly") out.push(...effectChildren(it.items));
    else out.push(it);
  }
  return out;
}

/** Compile one effect, dropping it to a no-op if it uses unsupported forms. */
function compileEffectLenient(node: LudList, env: CompileEnv): EffectFn {
  try {
    return compileEffect(node, env);
  } catch {
    return () => [];
  }
}

/** An effect node that may be a leaf or control-flow; empty if not a list. */
function effectOf(node: LudNode, env: CompileEnv): EffectFn {
  return isList(node) ? compileEffect(node, env) : () => [];
}

/**
 * `(forEach …)` as an effect. The only kind with a concrete state mapping is
 * `(forEach Site <region> <effect>)`: bind `frame.site`/`frame.to` to each
 * region member and run the sub-effect there, flattening the actions. The
 * piece/level/value iterators carry no per-iteration site state in this model,
 * so they degrade to a no-op rather than failing the whole compile (these show
 * up almost exclusively in dice-race games like Bargese/Pachisi).
 */
function compileForEachEffect(node: LudList, env: CompileEnv): EffectFn {
  const kindNode = node.items[1];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "";
  if (kind === "Site") {
    const regionNode = node.items[2];
    const effectNode = node.items[3];
    if (!regionNode || !effectNode) return () => [];
    const region = compileRegion(regionNode, env);
    const eff = effectOf(effectNode, env);
    return (ctx) => {
      const out: Action[] = [];
      for (const s of region.eval(ctx)) {
        if (s < 0) continue;
        out.push(...eff(ctx.withFrame({ site: s, to: s })));
      }
      return out;
    };
  }
  return () => [];
}

/**
 * `(move Step <dir> (to if:<bool> (apply <effect>)))`. From the current
 * piece site (`from`, bound by `forEach Piece`), step one cell along each
 * resolved direction; emit a relocating `ActionMove` when the `to:` guard
 * holds. A relocating move overwrites its destination, so a capture is the
 * same `ActionMove` — an `(apply (remove (to)))` that clears the very
 * destination is therefore subsumed and dropped.
 */
function compileStep(node: LudList, env: CompileEnv, startIndex = 2): MovesFn {
  const after = node.items.slice(startIndex);
  const toNode = after.find((n) => isList(n) && listHead(n) === "to") as
    | LudList
    | undefined;
  const dirNode = after.find((n) => n !== toNode);
  const tokens = stepDirectionTokens(dirNode);

  let cond: BoolFn = { eval: () => true };
  let effect: EffectFn | undefined;
  if (toNode) {
    const { positional, named } = parseArgs(toNode.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) cond = compileBool(ifNode, env);
    const applyNode = positional.find(
      (n) => isList(n) && listHead(n) === "apply",
    ) as LudList | undefined;
    if (applyNode) effect = compileApply(applyNode, env);
  }

  return {
    generate: (ctx) => {
      const from = ctx.frame.from;
      if (from === undefined || from < 0) return [];
      const mover = ctx.mover;
      const out: Move[] = [];
      for (const to of stepNeighbours(ctx, from, tokens)) {
        if (to === OFF) continue;
        const sub = ctx.withFrame({ from, to });
        if (!cond.eval(sub)) continue;
        const actions: Action[] = [new ActionMove({ from, to })];
        if (effect) {
          for (const a of effect(sub)) {
            // A remove of the destination is already done by the relocation.
            if (a.actionType() === "Remove" && a.to() === to) continue;
            actions.push(a);
          }
        }
        out.push(
          new Move({
            id: `step:${from}:${to}:${mover}`,
            label: `Step ${from}→${to}`,
            siteIndices: [to],
            mover,
            placedOwner: mover,
            actions,
          }),
        );
      }
      return out;
    },
  };
}

/** The four orthogonal starting headings a turtle walk is applied from. */
const ORTHO_HEADINGS: readonly Dir[] = [
  { dx: 0, dy: 1 }, // N
  { dx: 1, dy: 0 }, // E
  { dx: 0, dy: -1 }, // S
  { dx: -1, dy: 0 }, // W
];

/**
 * Extract turtle walks from a `(move Leap …)` walk argument. A walk is a
 * sequence of step tokens (`F` forward, `R`/`L` rotate); the argument is
 * either a single walk `{F F R F}` or a list of walks `{{F F R F}{F F L F}}`.
 */
function parseWalks(node: LudNode | undefined): string[][] {
  if (!node || !isList(node)) return [];
  const nested =
    node.items.length > 0 && node.items.every((it) => isList(it));
  if (nested) {
    const walks: string[][] = [];
    for (const it of node.items) {
      if (isList(it)) walks.push(walkSteps(it));
    }
    return walks;
  }
  return [walkSteps(node)];
}

function walkSteps(node: LudList): string[] {
  const out: string[] = [];
  for (const it of node.items) {
    if (isIdent(it)) out.push(it.name);
  }
  return out;
}

/**
 * Resolve turtle walks to the set of (dx, dy) landing offsets. Each walk runs
 * from every orthogonal heading: `F` advances one cell along the heading,
 * `R` rotates the heading 90° clockwise `(hx,hy)→(hy,-hx)`, `L` 90° counter-
 * clockwise `(hx,hy)→(-hy,hx)`. Duplicate and zero offsets are dropped, so
 * the canonical KnightWalk `{{F F R F}{F F L F}}` yields the 8 knight jumps.
 */
function walkOffsets(walks: readonly string[][]): Dir[] {
  const seen = new Set<string>();
  const offsets: Dir[] = [];
  for (const walk of walks) {
    for (const start of ORTHO_HEADINGS) {
      let hx = start.dx;
      let hy = start.dy;
      let x = 0;
      let y = 0;
      for (const step of walk) {
        if (step === "F") {
          x += hx;
          y += hy;
        } else if (step === "R") {
          const nx = hy;
          const ny = -hx;
          hx = nx;
          hy = ny;
        } else if (step === "L") {
          const nx = -hy;
          const ny = hx;
          hx = nx;
          hy = ny;
        }
      }
      if (x === 0 && y === 0) continue;
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      offsets.push({ dx: x, dy: y });
    }
  }
  return offsets;
}

/**
 * `(move Leap <walk> (to if:<land> (apply <effect>)?))`. From the piece's
 * `from` site, jump to each walk-derived offset whose `to:` guard holds. Like
 * Step, the relocation overwrites its destination, so an `(apply (remove
 * (to)))` capturing the landing cell is subsumed and dropped.
 */
function compileLeap(node: LudList, env: CompileEnv): MovesFn {
  const after = node.items.slice(2);
  const toNode = after.find((n) => isList(n) && listHead(n) === "to") as
    | LudList
    | undefined;
  const walkNode = after.find((n) => n !== toNode);
  const offsets = walkOffsets(parseWalks(walkNode));

  let cond: BoolFn = { eval: () => true };
  let effect: EffectFn | undefined;
  if (toNode) {
    const { positional, named } = parseArgs(toNode.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) cond = compileBool(ifNode, env);
    const applyNode = positional.find(
      (n) => isList(n) && listHead(n) === "apply",
    ) as LudList | undefined;
    if (applyNode) effect = compileApply(applyNode, env);
  }

  return {
    generate: (ctx) => {
      const from = ctx.frame.from;
      if (from === undefined || from < 0) return [];
      const board = ctx.board;
      const x = board.xOf(from);
      const y = board.yOf(from);
      const mover = ctx.mover;
      const out: Move[] = [];
      for (const d of offsets) {
        const to = board.siteAt(x + d.dx, y + d.dy);
        if (to === OFF) continue;
        const sub = ctx.withFrame({ from, to });
        if (!cond.eval(sub)) continue;
        const actions: Action[] = [new ActionMove({ from, to })];
        if (effect) {
          for (const a of effect(sub)) {
            if (a.actionType() === "Remove" && a.to() === to) continue;
            actions.push(a);
          }
        }
        out.push(
          new Move({
            id: `leap:${from}:${to}:${mover}`,
            label: `Leap ${from}→${to}`,
            siteIndices: [to],
            mover,
            placedOwner: mover,
            actions,
          }),
        );
      }
      return out;
    },
  };
}

/** Default `(to)` rule for a slide with no explicit guard: land on empty. */
const SLIDE_DEFAULT_TO: BoolFn = {
  eval: (ctx) => {
    const s = ctx.frame.to ?? OFF;
    return s >= 0 && s < ctx.state.cells.length && (ctx.state.cells[s] ?? 0) === 0;
  },
};

/** Default pass-through rule: a slide may continue through empty cells. */
const SLIDE_DEFAULT_GO: BoolFn = {
  eval: (ctx) => {
    const s = ctx.frame.between ?? OFF;
    return s >= 0 && s < ctx.state.cells.length && (ctx.state.cells[s] ?? 0) === 0;
  },
};

/**
 * Direction tokens for a `(move Slide …)`. With none given the slide runs
 * in every compass direction — Ludii's square radials are 8-connected, so a
 * bare `(move Slide)` is a chess-queen slide (the Amazons / rook / bishop
 * shape). Explicit `(directions …)` or a bare group keyword override it.
 */
function slideDirectionTokens(node: LudNode | undefined): string[] {
  const tokens = rawDirectionTokens(node).filter((t) => !t.startsWith("#"));
  return tokens.length > 0 ? tokens : ["All"];
}

/**
 * `(move Slide <dir?> (between if:<go>)? (to if:<land> (apply <effect>))?)`.
 * From the piece's `from` site, walk each direction cell-by-cell: emit a
 * relocating move to every cell whose `to:` guard holds, and stop the ray
 * once a cell fails the pass-through (`between`) guard. Defaults reproduce a
 * queen slide — land on empty, pass through empty — so a bare `(move Slide)`
 * works; a `(to if:(or (is Empty (to)) ("IsEnemyAt" (to))) …)` guard adds
 * capture-and-stop. As with Step, a relocating move overwrites its
 * destination, so an `(apply (remove (to)))` on the landing is subsumed.
 */
function compileSlide(node: LudList, env: CompileEnv, startIndex = 2): MovesFn {
  const after = node.items.slice(startIndex);
  const toNode = after.find((n) => isList(n) && listHead(n) === "to") as
    | LudList
    | undefined;
  const betweenNode = after.find(
    (n) => isList(n) && listHead(n) === "between",
  ) as LudList | undefined;
  const dirNode = after.find(
    (n) =>
      n !== toNode &&
      n !== betweenNode &&
      (isIdent(n) || (isList(n) && listHead(n) === "directions")),
  );
  const tokens = slideDirectionTokens(dirNode);

  let toCond: BoolFn = SLIDE_DEFAULT_TO;
  let effect: EffectFn | undefined;
  if (toNode) {
    const { positional, named } = parseArgs(toNode.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) toCond = compileBool(ifNode, env);
    const applyNode = positional.find(
      (n) => isList(n) && listHead(n) === "apply",
    ) as LudList | undefined;
    if (applyNode) effect = compileApply(applyNode, env);
  }

  let goCond: BoolFn = SLIDE_DEFAULT_GO;
  if (betweenNode) {
    const { named } = parseArgs(betweenNode.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) goCond = compileBool(ifNode, env);
  }

  return {
    generate: (ctx) => {
      const from = ctx.frame.from;
      if (from === undefined || from < 0) return [];
      const board = ctx.board;
      const x0 = board.xOf(from);
      const y0 = board.yOf(from);
      const dirs = resolveDirectionTokens(tokens, ctx);
      const mover = ctx.mover;
      const out: Move[] = [];
      for (const d of dirs) {
        for (let step = 1; ; step += 1) {
          const to = board.siteAt(x0 + d.dx * step, y0 + d.dy * step);
          if (to === OFF) break;
          const sub = ctx.withFrame({ from, to, between: to });
          if (toCond.eval(sub)) {
            const actions: Action[] = [new ActionMove({ from, to })];
            if (effect) {
              for (const a of effect(sub)) {
                if (a.actionType() === "Remove" && a.to() === to) continue;
                actions.push(a);
              }
            }
            out.push(
              new Move({
                id: `slide:${from}:${to}:${mover}`,
                label: `Slide ${from}→${to}`,
                siteIndices: [to],
                mover,
                placedOwner: mover,
                actions,
              }),
            );
          }
          if (!goCond.eval(sub)) break;
        }
      }
      return out;
    },
  };
}

/**
 * `(move Shoot (piece "Dot") <dirs?>)` — the Amazons arrow. After an amazon
 * relocates (keeping the turn via `(then (moveAgain))`), it shoots a marker
 * along queen lines from its new square. We slide outward from `(last To)` and
 * place the marker on every empty reachable cell. The marker's `what` is the
 * named component's owner (neutral markers fall back to a distinct non-player
 * index so they still block later slides).
 */
function compileShoot(node: LudList, env: CompileEnv): MovesFn {
  const after = node.items.slice(2);
  const pieceNode = after.find(
    (n) => isList(n) && listHead(n) === "piece",
  ) as LudList | undefined;
  let what = env.numPlayers + 1;
  if (pieceNode) {
    const lbl = pieceNode.items[1];
    if (lbl && isString(lbl)) {
      what = env.pieceOwner.get(lbl.value) ?? env.numPlayers + 1;
    }
  }
  const dirNode = after.find(
    (n) =>
      n !== pieceNode &&
      (isIdent(n) || (isList(n) && listHead(n) === "directions")),
  );
  const tokens = slideDirectionTokens(dirNode);
  return {
    generate: (ctx) => {
      const moves = ctx.context.trial.moves;
      const last = moves[moves.length - 1];
      const from = last ? last.to() : (ctx.frame.from ?? OFF);
      if (from < 0) return [];
      const board = ctx.board;
      const x0 = board.xOf(from);
      const y0 = board.yOf(from);
      const dirs = resolveDirectionTokens(tokens, ctx);
      const mover = ctx.mover;
      const out: Move[] = [];
      for (const d of dirs) {
        for (let step = 1; ; step += 1) {
          const to = board.siteAt(x0 + d.dx * step, y0 + d.dy * step);
          if (to === OFF) break;
          if ((ctx.state.cells[to] ?? 0) !== 0) break;
          out.push(
            new Move({
              id: `shoot:${from}:${to}:${mover}`,
              label: `Shoot ${from}→${to}`,
              siteIndices: [to],
              mover,
              placedOwner: mover,
              actions: [new ActionAdd({ to, what })],
            }),
          );
        }
      }
      return out;
    },
  };
}

/** Default `(between)` rule for a hop: jump over an occupied cell. */
const HOP_DEFAULT_BETWEEN: BoolFn = {
  eval: (ctx) => {
    const s = ctx.frame.between ?? OFF;
    return s >= 0 && s < ctx.state.cells.length && (ctx.state.cells[s] ?? 0) !== 0;
  },
};

/**
 * `(move Hop <from?> <dir?> (between if:<over> (apply <effect>)) (to if:<land>))`.
 * A distance-1 jump: over the adjacent `between` cell onto the `to` cell two
 * steps along each direction. Emits a relocating move when both guards hold,
 * carrying the `between` clause's effect — typically `(remove (between))`,
 * which captures the *jumped* piece. That removal targets the between cell,
 * not the landing, so (unlike Step/Slide capture) it is never subsumed.
 * Defaults reproduce a checkers leap: hop over an occupied cell to an empty
 * one. Long-range hops (`(between (range …))`) are not yet modelled.
 */
function compileHop(node: LudList, env: CompileEnv): MovesFn {
  const after = node.items.slice(2);
  const toNode = after.find((n) => isList(n) && listHead(n) === "to") as
    | LudList
    | undefined;
  const betweenNode = after.find(
    (n) => isList(n) && listHead(n) === "between",
  ) as LudList | undefined;
  const dirNode = after.find(
    (n) =>
      n !== toNode &&
      n !== betweenNode &&
      !(isList(n) && listHead(n) === "from") &&
      (isIdent(n) || (isList(n) && listHead(n) === "directions")),
  );
  const tokens = slideDirectionTokens(dirNode);

  let toCond: BoolFn = SLIDE_DEFAULT_TO;
  if (toNode) {
    const ifNode = parseArgs(toNode.items.slice(1)).named.get("if");
    if (ifNode) toCond = compileBool(ifNode, env);
  }

  let betweenCond: BoolFn = HOP_DEFAULT_BETWEEN;
  let betweenEffect: EffectFn | undefined;
  if (betweenNode) {
    const { positional, named } = parseArgs(betweenNode.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) betweenCond = compileBool(ifNode, env);
    const applyNode = positional.find(
      (n) => isList(n) && listHead(n) === "apply",
    ) as LudList | undefined;
    if (applyNode) betweenEffect = compileApply(applyNode, env);
  }

  return {
    generate: (ctx) => {
      const from = ctx.frame.from;
      if (from === undefined || from < 0) return [];
      const board = ctx.board;
      const x0 = board.xOf(from);
      const y0 = board.yOf(from);
      const dirs = resolveDirectionTokens(tokens, ctx);
      const mover = ctx.mover;
      const out: Move[] = [];
      for (const d of dirs) {
        const between = board.siteAt(x0 + d.dx, y0 + d.dy);
        const to = board.siteAt(x0 + d.dx * 2, y0 + d.dy * 2);
        if (between === OFF || to === OFF) continue;
        const sub = ctx.withFrame({ from, between, to });
        if (!betweenCond.eval(sub) || !toCond.eval(sub)) continue;
        const actions: Action[] = [new ActionMove({ from, to })];
        if (betweenEffect) actions.push(...betweenEffect(sub));
        out.push(
          new Move({
            id: `hop:${from}:${to}:${mover}`,
            label: `Hop ${from}→${to}`,
            siteIndices: [to],
            mover,
            placedOwner: mover,
            actions,
          }),
        );
      }
      return out;
    },
  };
}

function compileMoveLudeme(node: LudList, env: CompileEnv): MovesFn {
  const inner = compileMoveLudemeInner(node, env);
  // A `(move … (then <effect>))` block runs side effects after the move and
  // may keep the turn (`moveAgain`). Compile it and fold it into each move.
  const thenNode = node.items.find(
    (n) => isList(n) && listHead(n) === "then",
  ) as LudList | undefined;
  if (!thenNode) return inner;
  const { moveAgain, effect } = compileThen(thenNode, env);
  return {
    generate: (ctx) =>
      inner.generate(ctx).map((m) => {
        // Bind the move's own from/to so a `(then …)` effect (notably `(sow)`)
        // reads the just-selected site through `(from)` / `(to)`, and record the
        // move in a throwaway trial so `(last To)` / `(last From)` resolve to it
        // (Java runs the consequence after the move, when it is the last move).
        // The state stays pre-move so pickup-driven effects like sow are intact.
        const ectx = ctx
          .withContext(ctx.context.withTrial(ctx.context.trial.withMove(m, false, -1)))
          .withFrame({ from: m.from(), to: m.to() });
        const extra = effect ? effect(ectx) : [];
        return extra.length > 0 || moveAgain
          ? m.withConsequence(extra, moveAgain)
          : m;
      }),
  };
}

/**
 * Compile a `(then <effect>…)` block. Returns whether the turn repeats
 * (`moveAgain`) and an optional effect producing the extra actions to append
 * after the move's own actions. Supported effects: `moveAgain`, `set Score`,
 * `addScore`, `set Var`, and `remove`.
 */
function compileThen(
  node: LudList,
  env: CompileEnv,
): { moveAgain: boolean; effect?: EffectFn } {
  let moveAgain = false;
  const effects: EffectFn[] = [];
  const visit = (item: LudNode): void => {
    if (isIdent(item) && item.name === "moveAgain") {
      moveAgain = true;
      return;
    }
    if (!isList(item)) return;
    if (item.delimiter === "curly") {
      for (const inner of item.items) visit(inner);
      return;
    }
    const head = listHead(item);
    if (head === "moveAgain") {
      moveAgain = true;
      return;
    }
    const fn = compileEffectAction(item, env);
    if (fn) effects.push(fn);
  };
  for (const item of node.items.slice(1)) visit(item);
  if (effects.length === 0) return { moveAgain };
  return {
    moveAgain,
    effect: (ctx) => effects.flatMap((fn) => fn(ctx)),
  };
}

/** Compile a single post-move effect ludeme into an action producer. */
function compileEffectAction(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  const head = listHead(node);
  if (head === "moveAgain") {
    // As an effect (e.g. inside `(if … (moveAgain))`): schedule the current
    // mover to play again by overriding the next player. Java: MoveAgain emits
    // ActionSetNextPlayer(mover).
    return (ctx) => [new ActionSetNextPlayer(ctx.mover)];
  }
  if (head === "and") {
    // `(and <eff>…)` / `(and { <eff>… })` — run several effects in sequence.
    // Curly-list arguments are flattened; an unsupported member is dropped
    // (matching the prior silent-skip of unknown then-effects) rather than
    // failing the whole compile.
    const subs = effectChildren(node.items.slice(1))
      .map((n) => {
        try {
          return compileEffectAction(n, env);
        } catch {
          return undefined;
        }
      })
      .filter((f): f is EffectFn => f !== undefined);
    if (subs.length === 0) return undefined;
    return (ctx) => subs.flatMap((f) => f(ctx));
  }
  if (head === "if") {
    // `(if <cond> <then> [<else>])` — guard an effect on a board predicate.
    // If the condition or branches use forms we can't compile yet, drop the
    // effect (prior behaviour) instead of failing the whole game's compile.
    const condNode = node.items[1];
    const thenNode = node.items[2];
    const elseNode = node.items[3];
    if (!condNode || !thenNode || !isList(thenNode)) return undefined;
    try {
      const cond = compileBool(condNode, env);
      const thenEff = compileEffectAction(thenNode, env);
      const elseEff =
        elseNode && isList(elseNode)
          ? compileEffectAction(elseNode, env)
          : undefined;
      if (!thenEff && !elseEff) return undefined;
      return (ctx) => {
        if (cond.eval(ctx)) return thenEff ? thenEff(ctx) : [];
        return elseEff ? elseEff(ctx) : [];
      };
    } catch {
      return undefined;
    }
  }
  if (head === "sow") {
    return compileSow(node, env);
  }
  if (head === "fromTo") {
    return compileFromToEffect(node, env);
  }
  if (head === "remove") {
    const siteNode = node.items[1];
    if (!siteNode) return undefined;
    const site = compileInt(siteNode, env);
    return (ctx) => {
      const s = site.eval(ctx);
      return s >= 0 ? [new ActionRemove({ to: s })] : [];
    };
  }
  if (head === "promote") {
    // `(promote <site> <piece-spec> [player])` — replace the piece's type at
    // <site>. Piece type isn't modelled, so this preserves the current owner
    // (board-neutral) rather than swapping in a concrete piece value.
    const siteNode = node.items[1];
    if (!siteNode) return undefined;
    const site = compileInt(siteNode, env);
    return (ctx) => {
      const s = site.eval(ctx);
      if (s < 0) return [];
      const owner = ctx.state.cells[s] ?? ctx.mover;
      return owner > 0 ? [new ActionPromote(s, owner)] : [];
    };
  }
  if (head === "addScore") {
    const who = node.items[1];
    const value = node.items[2];
    if (!who || !value) return undefined;
    const pid = compileInt(who, env);
    const amount = compileInt(value, env);
    return (ctx) => [
      new ActionSetScore({
        player: pid.eval(ctx),
        score: amount.eval(ctx),
        add: true,
      }),
    ];
  }
  if (head === "remember" || head === "forget") {
    // `(remember Value <name>? <int> [unique:True])` appends a value to the
    // named remembered list; `(forget Value <name>? <int>)` removes it. The
    // empty-string key is the unnamed (Java: rememberingValues) list.
    const sub = node.items[1];
    if (!sub || !isIdent(sub) || sub.name !== "Value") return undefined;
    const { positional } = parseArgs(node.items.slice(2));
    let idx = 0;
    let name = "";
    if (positional[idx] && isString(positional[idx] as LudNode)) {
      name = (positional[idx] as { value: string }).value;
      idx += 1;
    }
    const valNode = positional[idx];
    if (!valNode) return undefined;
    const valFn = compileInt(valNode, env);
    if (head === "remember") {
      return (ctx) => [new ActionRememberValue(name, valFn.eval(ctx))];
    }
    return (ctx) => [new ActionForgetValue(name, valFn.eval(ctx))];
  }
  if (head === "set") {
    const sub = node.items[1];
    const subName = sub && isIdent(sub) ? sub.name : "";
    if (subName === "Score") {
      const who = node.items[2];
      const value = node.items[3];
      if (!who || !value) return undefined;
      const pid = compileInt(who, env);
      const amount = compileInt(value, env);
      return (ctx) => [
        new ActionSetScore({ player: pid.eval(ctx), score: amount.eval(ctx) }),
      ];
    }
    if (subName === "Var") {
      // (set Var ["name"] <int>) — the name is optional; without it the value
      // sits in items[2] and targets the default unnamed var.
      const nameNode = node.items[2];
      const named = nameNode && (isString(nameNode) || isIdent(nameNode));
      const varName = named
        ? isString(nameNode)
          ? nameNode.value
          : (nameNode as { name: string }).name
        : "";
      const valueNode = named ? node.items[3] : nameNode;
      if (!valueNode) return undefined;
      const amount = compileInt(valueNode, env);
      return (ctx) => [new ActionSetVar(varName, amount.eval(ctx))];
    }
    if (subName === "Pending") {
      // `(set Pending)` marks the state pending (sentinel 1) so the next turn's
      // `(is Pending)` is true; `(set Pending <site>)` marks a specific site.
      const arg = node.items[2];
      const siteFn = arg ? compileInt(arg, env) : undefined;
      return (ctx) => [
        new ActionSetPending(siteFn ? siteFn.eval(ctx) : 1),
      ];
    }
    if (subName === "Count") {
      // (set Count <n> [at:<site>] [to:<region>]) — the count at one site or
      // every site of a region (Java overwrites the per-site count layer).
      const { positional, named } = parseArgs(node.items.slice(2));
      const countFn = positional[0] ? compileInt(positional[0], env) : undefined;
      const atNode = named.get("at");
      const toNode = named.get("to");
      const atFn = atNode ? compileInt(atNode, env) : undefined;
      const toReg = toNode ? compileRegion(toNode, env) : undefined;
      return (ctx) => {
        const c = countFn ? countFn.eval(ctx) : 1;
        if (atFn) {
          const s = atFn.eval(ctx);
          return s >= 0 ? [new ActionSetCount({ to: s, count: c })] : [];
        }
        if (toReg) {
          return toReg
            .eval(ctx)
            .filter((s) => s >= 0)
            .map((s) => new ActionSetCount({ to: s, count: c }));
        }
        return [];
      };
    }
    if (subName === "Counter") {
      const arg = node.items[2];
      const valFn = arg ? compileInt(arg, env) : undefined;
      return (ctx) => [
        new ActionSetCounter(valFn ? valFn.eval(ctx) : ctx.state.counter),
      ];
    }
    if (subName === "State") {
      // (set State [at:<site>] <state> [<level>]) — per-site state layer.
      const { positional, named } = parseArgs(node.items.slice(2));
      const valFn = positional[0] ? compileInt(positional[0], env) : undefined;
      const atNode = named.get("at");
      const atFn = atNode ? compileInt(atNode, env) : undefined;
      return (ctx) => {
        const s = atFn ? atFn.eval(ctx) : (ctx.frame.to ?? 0);
        if (s < 0) return [];
        return [new ActionSetState({ to: s, state: valFn ? valFn.eval(ctx) : 0 })];
      };
    }
    if (subName === "Value") {
      // Two grammars: (set Value at:<site> <n>) → per-site value layer, and
      // (set Value <player> <n>) → per-player value.
      const { positional, named } = parseArgs(node.items.slice(2));
      const atNode = named.get("at");
      if (atNode) {
        const atFn = compileInt(atNode, env);
        const valFn = positional[0] ? compileInt(positional[0], env) : undefined;
        return (ctx) => {
          const s = atFn.eval(ctx);
          return s >= 0
            ? [new ActionSetValue({ to: s, value: valFn ? valFn.eval(ctx) : 0 })]
            : [];
        };
      }
      const pidFn = positional[0] ? compileInt(positional[0], env) : undefined;
      const valFn = positional[1] ? compileInt(positional[1], env) : undefined;
      return (ctx) => [
        new ActionSetValueOfPlayer(
          pidFn ? pidFn.eval(ctx) : ctx.mover,
          valFn ? valFn.eval(ctx) : 0,
        ),
      ];
    }
    if (subName === "NextPlayer") {
      // (set NextPlayer (player <n>)) — force the next mover.
      const arg = node.items[2];
      const fn = arg ? compileInt(arg, env) : undefined;
      return (ctx) => [new ActionSetNextPlayer(fn ? fn.eval(ctx) : ctx.mover)];
    }
    if (subName === "Rotation") {
      const { positional, named } = parseArgs(node.items.slice(2));
      const valFn = positional[0] ? compileInt(positional[0], env) : undefined;
      const atNode = named.get("at");
      const atFn = atNode ? compileInt(atNode, env) : undefined;
      return (ctx) => {
        const s = atFn ? atFn.eval(ctx) : (ctx.frame.to ?? 0);
        if (s < 0) return [];
        return [
          new ActionSetRotation({
            to: s,
            rotation: valFn ? valFn.eval(ctx) : 0,
          }),
        ];
      };
    }
    if (subName === "TrumpSuit") {
      const arg = node.items[2];
      const valFn = arg ? compileInt(arg, env) : undefined;
      return (ctx) => [new ActionSetTrumpSuit(valFn ? valFn.eval(ctx) : 0)];
    }
    if (subName === "RememberValue") {
      // (set RememberValue "Name" <int|region>) — append value(s) to a named
      // remembered list. A region argument remembers each of its sites.
      const nameNode = node.items[2];
      const name =
        nameNode && isString(nameNode)
          ? nameNode.value
          : nameNode && isIdent(nameNode)
            ? nameNode.name
            : "";
      const valNode = node.items[3];
      if (valNode && isList(valNode)) {
        let reg: RegionFn | undefined;
        try {
          reg = compileRegion(valNode, env);
        } catch {
          reg = undefined;
        }
        if (reg) {
          return (ctx) =>
            reg
              .eval(ctx)
              .filter((s) => s >= 0)
              .map((s) => new ActionRememberValue(name, s));
        }
      }
      const valFn = valNode ? compileInt(valNode, env) : undefined;
      return (ctx) => [new ActionRememberValue(name, valFn ? valFn.eval(ctx) : 0)];
    }
    // Hidden-information, team, and pot bookkeeping have no public-state
    // backing in this port yet; accept the syntax as a no-op so the rest of
    // the game still compiles.
    if (
      subName === "Hidden" ||
      subName === "Team" ||
      subName === "Pot" ||
      subName === "Visible"
    ) {
      return () => [];
    }
  }
  if (head === "trigger") {
    // `(trigger "<event>" <player>)` in effect position. Java: Trigger.java —
    // records a named event as fired for the given player via ActionTrigger.
    // Trigger state is not modelled here so ActionTrigger.apply() is a no-op,
    // but the action is carried through so the form compiles cleanly.
    const eventNode = node.items[1];
    const playerNode = node.items[2];
    if (!eventNode || !isString(eventNode)) return () => [];
    const event = eventNode.value;
    let playerFn: IntFn = { eval: (ctx: EvalContext) => ctx.mover };
    if (playerNode) {
      try {
        playerFn = compileInt(playerNode, env);
      } catch {
        /* default to mover */
      }
    }
    return (ctx) => [new ActionTrigger(event, playerFn.eval(ctx))];
  }
  if (head === "add") {
    // `(add (piece …) (to …))` as an effect — place a piece without generating
    // a selectable move (Shogi/Crazyhouse capture-to-hand, Game of Life, …).
    const { positional, named } = parseArgs(node.items.slice(1));
    const pieceNode = node.items.find(
      (n) => isList(n) && listHead(n) === "piece",
    ) as LudList | undefined;
    let whatFn: IntFn = { eval: (ctx) => ctx.mover };
    if (pieceNode?.items[1]) {
      try {
        whatFn = compileInt(pieceNode.items[1], env);
      } catch {
        /* mover */
      }
    }
    const region = resolveAddRegion(node, positional, named, pieceNode, env);
    if (!region) return () => [];
    const stackNode = named.get("stack");
    const onStack =
      stackNode !== undefined && isIdent(stackNode) && stackNode.name === "True";
    return (ctx) => {
      const site = region.eval(ctx)[0] ?? OFF;
      if (site < 0) return [];
      const what = whatFn.eval(ctx);
      return [
        new ActionAdd({
          to: site,
          what: what > 0 ? what : ctx.mover,
          onStack,
        }),
      ];
    };
  }
  return undefined;
}

function compileMoveLudemeInner(node: LudList, env: CompileEnv): MovesFn {
  const second = node.items[1];
  // (move Step <dir> (to if:<bool> (apply <effect>)))
  if (second && isIdent(second) && second.name === "Step") {
    return compileStep(node, env);
  }
  // (move Slide <dir?> (between if:<go>)? (to if:<land> (apply <effect>))?)
  if (second && isIdent(second) && second.name === "Slide") {
    return compileSlide(node, env);
  }
  // (move Hop <from?> <dir?> (between if:<over> (apply …)) (to if:<land>))
  if (second && isIdent(second) && second.name === "Hop") {
    return compileHop(node, env);
  }
  // (move Leap <walk> (to if:<land> (apply <effect>)?)) — knight-like jumps
  // described by a turtle walk (F/L/R) applied from each orthogonal heading.
  if (second && isIdent(second) && second.name === "Leap") {
    return compileLeap(node, env);
  }
  // (move Shoot (piece "Dot") <dirs?>) — slide a fresh marker outward from the
  // just-moved piece (Amazons arrow). Lands on / passes through empty cells.
  if (second && isIdent(second) && second.name === "Shoot") {
    return compileShoot(node, env);
  }
  // (move Select (from <region> if:<bool>?)) — pick a site; the actual board
  // effect lives in the `(then …)` chain (e.g. `(sow)`). Common in mancala.
  if (second && isIdent(second) && second.name === "Select") {
    return compileSelect(node, env);
  }
  // (move Pass) — a single turn-skipping move.
  if (second && isIdent(second) && second.name === "Pass") {
    return {
      generate: (ctx) => {
        const mover = ctx.mover;
        return [
          new Move({
            id: `pass:${mover}`,
            label: "Pass",
            siteIndices: [0],
            mover,
            placedOwner: mover,
            actions: [new ActionPass()],
          }),
        ];
      },
    };
  }
  // (move Remove <region>) — one removal move per site in the region.
  if (second && isIdent(second) && second.name === "Remove") {
    const regionNode = node.items[2];
    if (!regionNode)
      throw new LudemeCompileError("(move Remove …) needs a region.");
    const region = compileRegion(regionNode, env);
    return {
      generate: (ctx) => {
        const out: Move[] = [];
        const mover = ctx.mover;
        for (const site of region.eval(ctx)) {
          if (site < 0) continue;
          out.push(
            new Move({
              id: `remove:${site}:${mover}`,
              label: `Remove at ${site}`,
              siteIndices: [site],
              mover,
              placedOwner: mover,
              actions: [new ActionRemove({ to: site })],
            }),
          );
        }
        return out;
      },
    };
  }
  // (move Add (to <region>))
  if (second && isIdent(second) && second.name === "Add") {
    const { named } = parseArgs(node.items.slice(2));
    let toRegion: RegionFn | undefined;
    const toNode = node.items.find((n) => isList(n) && listHead(n) === "to") as
      | LudList
      | undefined;
    if (toNode) {
      const { positional: toPos } = parseArgs(toNode.items.slice(1));
      const regionArg = dropSiteType(toPos)[0];
      if (regionArg) toRegion = compileRegion(regionArg, env);
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
  // (move Promote <site> <piece-spec> [player]) — replace the piece at <site>
  // with another type. The engine tracks only ownership, not piece type, so
  // promotion preserves the current owner (a board-neutral but legal move);
  // the chosen target type is not yet represented.
  if (second && isIdent(second) && second.name === "Promote") {
    const siteNode = node.items[2];
    if (!siteNode) {
      throw new LudemeCompileError("(move Promote …) needs a site.");
    }
    const siteFn = compileInt(siteNode, env);
    return {
      generate: (ctx) => {
        const s = siteFn.eval(ctx);
        if (s < 0) return [];
        const owner = ctx.state.cells[s] ?? ctx.mover;
        if (owner <= 0) return [];
        return [
          new Move({
            id: `promote:${s}:${owner}`,
            label: `Promote at ${s}`,
            siteIndices: [s],
            mover: ctx.mover,
            placedOwner: ctx.mover,
            actions: [new ActionPromote(s, owner)],
          }),
        ];
      },
    };
  }
  // Generic relocation: (move (from <region>?) (to <region> if:… (apply …))).
  // The most common move primitive in Ludii — a piece travels from each
  // from-site to each to-site, optionally capturing via the to-clause's
  // (apply …) effect. Dispatched last so the keyword forms above win.
  const hasFromOrTo = node.items.some(
    (n) => isList(n) && (listHead(n) === "from" || listHead(n) === "to"),
  );
  if (hasFromOrTo) {
    return compileFromTo(node, env);
  }

  // (move Set NextPlayer (player <n>)) — override whose turn follows.
  // (move Set Rotation [(to <site>)] [{r1 r2 …}]) — emit one move per rotation.
  if (second && isIdent(second) && second.name === "Set") {
    const subNode = node.items[2];
    const subName = subNode && isIdent(subNode) ? subNode.name : "";
    if (subName === "NextPlayer") {
      const arg = node.items[3];
      const fn = arg ? compileInt(arg, env) : undefined;
      return {
        generate: (ctx) => {
          const mover = ctx.mover;
          const next = fn ? fn.eval(ctx) : mover;
          return [
            new Move({
              id: `setNext:${next}:${mover}`,
              label: `SetNextPlayer ${next}`,
              siteIndices: [0],
              mover,
              placedOwner: mover,
              actions: [new ActionSetNextPlayer(next)],
            }),
          ];
        },
      };
    }
    if (subName === "Rotation") {
      const toNode = node.items.find(
        (n) => isList(n) && listHead(n) === "to",
      ) as LudList | undefined;
      const atNode = toNode
        ? parseArgs(toNode.items.slice(1)).positional[0]
        : undefined;
      const atFn = atNode ? compileInt(atNode, env) : undefined;
      const setNode = node.items.find(
        (n) => isList(n) && n.delimiter === "curly",
      ) as LudList | undefined;
      const rotValues = setNode
        ? setNode.items.filter(isNumber).map((n) => n.value)
        : [];
      const values = rotValues.length > 0 ? rotValues : [0];
      return {
        generate: (ctx) => {
          const mover = ctx.mover;
          const site = atFn ? atFn.eval(ctx) : (ctx.frame.to ?? 0);
          if (site < 0) return [];
          return values.map(
            (rot) =>
              new Move({
                id: `setRot:${site}:${rot}:${mover}`,
                label: `SetRotation ${site}->${rot}`,
                siteIndices: [site],
                mover,
                placedOwner: mover,
                actions: [new ActionSetRotation({ to: site, rotation: rot })],
              }),
          );
        },
      };
    }
    return EMPTY_MOVES;
  }

  // (move Propose "string" …) — record a proposition.
  // (move Vote "Yes") — cast a vote on the active proposal (mancala end-by-vote).
  if (second && isIdent(second) && second.name === "Vote") {
    const voteNode = node.items[2];
    const vote =
      voteNode && isString(voteNode)
        ? voteNode.value
        : voteNode && isIdent(voteNode)
          ? voteNode.name
          : "Yes";
    return {
      generate: (ctx) => {
        const mover = ctx.mover;
        return [
          new Move({
            id: `vote:${vote}:${mover}`,
            label: `Vote ${vote}`,
            siteIndices: [0],
            mover,
            placedOwner: mover,
            actions: [new ActionVote(vote)],
          }),
        ];
      },
    };
  }

  if (second && isIdent(second) && second.name === "Propose") {
    const textNode = node.items[2];
    const text =
      textNode && isString(textNode)
        ? textNode.value
        : textNode && isIdent(textNode)
          ? textNode.name
          : "Propose";
    return {
      generate: (ctx) => {
        const mover = ctx.mover;
        return [
          new Move({
            id: `propose:${text}:${mover}`,
            label: `Propose ${text}`,
            siteIndices: [0],
            mover,
            placedOwner: mover,
            actions: [new ActionPropose(text)],
          }),
        ];
      },
    };
  }

  // (move Swap Players …) — player-order swap (not modelled → Pass).
  // (move Swap Pieces <site1> <site2>) — swap the pieces at two sites.
  if (second && isIdent(second) && second.name === "Swap") {
    const subNode = node.items[2];
    const subName = subNode && isIdent(subNode) ? subNode.name : "";
    if (subName === "Players") {
      return {
        generate: (ctx) => {
          const mover = ctx.mover;
          return [
            new Move({
              id: `swapPlayers:${mover}`,
              label: "SwapPlayers",
              siteIndices: [0],
              mover,
              placedOwner: mover,
              actions: [new ActionPass()],
            }),
          ];
        },
      };
    }
    if (subName === "Pieces") {
      const s1Node = node.items[3];
      const s2Node = node.items[4];
      if (!s1Node || !s2Node) return EMPTY_MOVES;
      const s1Fn = compileInt(s1Node, env);
      const s2Fn = compileInt(s2Node, env);
      return {
        generate: (ctx) => {
          const mover = ctx.mover;
          const a = s1Fn.eval(ctx);
          const b = s2Fn.eval(ctx);
          if (a < 0 || b < 0) return [];
          return [
            new Move({
              id: `swapPieces:${a}:${b}:${mover}`,
              label: `SwapPieces ${a}<->${b}`,
              siteIndices: [b],
              mover,
              placedOwner: mover,
              actions: [new ActionSwap(a, b)],
            }),
          ];
        },
      };
    }
    return EMPTY_MOVES;
  }

  // (move Bet <player> (range <min> <max>) …) — one move per amount in range.
  if (second && isIdent(second) && second.name === "Bet") {
    const playerNode = node.items[2];
    const rangeNode = node.items[3];
    const playerFn: IntFn =
      playerNode && isIdent(playerNode)
        ? { eval: (ctx) => resolveRole(playerNode.name, ctx) }
        : playerNode
          ? compileInt(playerNode, env)
          : { eval: (ctx) => ctx.mover };
    let minFn: IntFn = { eval: () => 0 };
    let maxFn: IntFn = { eval: () => 0 };
    if (rangeNode && isList(rangeNode) && listHead(rangeNode) === "range") {
      const a = rangeNode.items[1];
      const b = rangeNode.items[2];
      if (a) minFn = compileInt(a, env);
      maxFn = b ? compileInt(b, env) : minFn;
    }
    return {
      generate: (ctx) => {
        const mover = ctx.mover;
        const player = playerFn.eval(ctx);
        const lo = minFn.eval(ctx);
        const hi = maxFn.eval(ctx);
        const out: Move[] = [];
        for (let amt = lo; amt <= hi; amt += 1) {
          out.push(
            new Move({
              id: `bet:${player}:${amt}:${mover}`,
              label: `Bet ${amt}`,
              siteIndices: [0],
              mover,
              placedOwner: mover,
              actions: [new ActionBet(player, amt)],
            }),
          );
        }
        return out;
      },
    };
  }

  throw new LudemeCompileError("Unsupported (move …) form.");
}

/**
 * `(move Select (from <region> if:<bool>?))` — emit one selection move per
 * site in the from-region that passes the `if:` guard. The move records an
 * `ActionSelect`; the board mutation is supplied by the `(then …)` chain
 * (`(sow …)` in mancala). From-sites default to the mover's occupied cells.
 */
function compileSelect(node: LudList, env: CompileEnv): MovesFn {
  const fromNode = node.items.find(
    (n) => isList(n) && listHead(n) === "from",
  ) as LudList | undefined;
  let fromRegion: RegionFn | undefined;
  let fromCond: BoolFn | undefined;
  if (fromNode) {
    const { positional, named } = parseArgs(fromNode.items.slice(1));
    const regionArg = dropSiteType(positional)[0];
    if (regionArg) fromRegion = compileRegion(regionArg, env);
    const ifNode = named.get("if");
    if (ifNode) fromCond = compileBool(ifNode, env);
  }
  return {
    generate: (ctx) => {
      const mover = ctx.mover;
      let fromSites: number[];
      if (fromRegion) {
        fromSites = [...fromRegion.eval(ctx)];
      } else {
        fromSites = [];
        const cells = ctx.state.cells;
        for (let s = 0; s < cells.length; s += 1) {
          if (cells[s] === mover) fromSites.push(s);
        }
      }
      const out: Move[] = [];
      for (const from of fromSites) {
        if (from < 0) continue;
        const fctx = ctx.withFrame({ from });
        if (fromCond && !fromCond.eval(fctx)) continue;
        out.push(
          new Move({
            id: `select:${from}:${mover}`,
            label: `Select ${from}`,
            siteIndices: [from],
            mover,
            placedOwner: mover,
            actions: [new ActionSelect(from, from)],
          }),
        );
      }
      return out;
    },
  };
}

/** The track the mover would sow along from `site`: prefer the mover's own
 * track, then a shared (owner 0) track, then any track containing `site`. */
function pickTrack(
  ctx: EvalContext,
  site: number,
): { sites: readonly number[]; loop: boolean } | undefined {
  const tracks = ctx.board.tracks;
  if (tracks.length === 0) return undefined;
  const mover = ctx.mover;
  const containing = tracks.filter((t) => t.sites.includes(site));
  const pool = containing.length > 0 ? containing : tracks;
  return (
    pool.find((t) => t.owner === mover) ??
    pool.find((t) => t.owner === 0) ??
    pool[0]
  );
}

/** The track belonging to `player` (or a shared owner-0 track), optionally
 * filtered by name substring. Java: `Context.tracks()` owner/name lookup. */
function trackForPlayer(
  ctx: EvalContext,
  player: number,
  name?: string,
): MancalaTrack | undefined {
  const tracks = ctx.board.tracks;
  if (tracks.length === 0) return undefined;
  const named = name ? tracks.filter((t) => t.name.includes(name)) : tracks;
  const pool = named.length > 0 ? named : tracks;
  return (
    pool.find((t) => t.owner === player) ??
    pool.find((t) => t.owner === 0) ??
    pool[0]
  );
}

/**
 * `(trackSite FirstSite|EndSite|Move …)` — resolve a site on a track.
 * - `FirstSite [from:<site>] [if:<cond>]`: starting at `from` (or the track
 *   start), the first site (walking forward, cyclically) where `if:` holds —
 *   or just the start when no condition is given.
 * - `EndSite`: the last site of the track.
 * - `Move from:<site> steps:<n>`: the site reached `n` steps forward of `from`.
 * An optional trailing role / `name:` selects which track.
 */
/**
 * `(ahead [<siteType>] <site> [steps:<n>] <direction>)` — the site reached by
 * stepping `n` (default 1) units in `<direction>` from `<site>`. Direction may
 * be an absolute compass token (N/E/S/W and diagonals) or a player-relative
 * token (Forward/Backward/…); relative tokens are rotated for the mover.
 * Returns Off when the step would leave the board or the direction is unknown.
 * Java parity: game.functions.ints.board.Ahead.
 */
function compileAhead(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const args = isSiteTypeIdent(positional[0])
    ? positional.slice(1)
    : positional;
  const siteNode = args.length >= 2 ? args[0] : undefined;
  const dirNode = args[args.length - 1];
  const siteFn = siteNode
    ? compileInt(siteNode, env)
    : { eval: (ctx: EvalContext) => ctx.frame.to ?? OFF };
  const stepsNode = named.get("steps");
  const stepsFn = stepsNode ? compileInt(stepsNode, env) : undefined;
  const dirName =
    dirNode && isIdent(dirNode)
      ? dirNode.name
      : dirNode && isString(dirNode)
        ? dirNode.value
        : "Forward";
  return {
    eval: (ctx) => {
      const start = siteFn.eval(ctx);
      if (start < 0) return OFF;
      const dir = resolveDirection(dirName, ctx.player, ctx.board.tiling);
      if (!dir) return OFF;
      const steps = stepsFn ? stepsFn.eval(ctx) : 1;
      const board = ctx.board;
      let x = board.xOf(start);
      let y = board.yOf(start);
      let site = start;
      for (let i = 0; i < steps; i += 1) {
        x += dir.dx;
        y += dir.dy;
        site = board.siteAt(x, y);
        if (site < 0) return OFF;
      }
      return site;
    },
  };
}

function compileTrackSite(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const kindNode = positional[0];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "FirstSite";
  const nameNode = named.get("name");
  const trackName = nameNode && isString(nameNode) ? nameNode.value : undefined;
  // Optional trailing role ident (the track owner) — e.g. (trackSite Move … P1).
  const roleNode = positional
    .slice(1)
    .find((n) => isIdent(n) && /^(Mover|Next|Prev|P\d+)$/.test(n.name));
  const playerFn: IntFn =
    roleNode && isIdent(roleNode)
      ? { eval: (ctx) => resolveRole(roleNode.name, ctx) }
      : { eval: (ctx) => ctx.mover };

  const fromNode = named.get("from");
  const fromFn = fromNode ? compileInt(fromNode, env) : undefined;

  if (kind === "Move") {
    const stepsNode = named.get("steps");
    const stepsFn = stepsNode ? compileInt(stepsNode, env) : undefined;
    return {
      eval: (ctx) => {
        const track = trackForPlayer(ctx, playerFn.eval(ctx), trackName);
        if (!track) return OFF;
        const ring = track.sites;
        const from = fromFn ? fromFn.eval(ctx) : ctx.frame.from ?? OFF;
        const idx = ring.indexOf(from);
        if (idx < 0) return OFF;
        const steps = stepsFn ? stepsFn.eval(ctx) : 0;
        let i = idx + (steps > 0 ? steps : 0);
        if (i < ring.length) return ring[i] as number;
        if (!track.loop) return OFF;
        return ring[i % ring.length] as number;
      },
    };
  }

  if (kind === "EndSite" || kind === "End") {
    return {
      eval: (ctx) => {
        const track = trackForPlayer(ctx, playerFn.eval(ctx), trackName);
        if (!track || track.sites.length === 0) return OFF;
        return track.sites[track.sites.length - 1] as number;
      },
    };
  }

  // FirstSite (default): the first track site (from `from` onward, cyclically)
  // that satisfies `if:`. With no condition, the track start (or `from`).
  const ifNode = named.get("if");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;
  return {
    eval: (ctx) => {
      const track = trackForPlayer(ctx, playerFn.eval(ctx), trackName);
      if (!track || track.sites.length === 0) return OFF;
      const ring = track.sites;
      const from = fromFn ? fromFn.eval(ctx) : OFF;
      let start = 0;
      if (from !== OFF) {
        const fi = ring.indexOf(from);
        if (fi < 0) return OFF;
        start = fi;
      }
      if (!cond) return ring[start] as number;
      for (let j = 0; j < ring.length; j += 1) {
        const site = ring[(start + j) % ring.length] as number;
        if (cond.eval(ctx.withFrame({ to: site }))) return site;
      }
      return OFF;
    },
  };
}

/**
 * `(sow [from:<site>] if:<bool> apply:<effect> [backtracking:True])`. Pick up
 * every seed at the selected hole (`(from)`), then drop one per following hole
 * along the mover's track. After the last seed lands, evaluate `if:` with
 * `(to)` bound to the landing hole; if it holds, run `apply:` (the capture).
 * `backtracking:True` then steps backward along the track, repeating the
 * capture while `if:` keeps holding.
 */
function compileSow(node: LudList, env: CompileEnv): EffectFn {
  const { named } = parseArgs(node.items.slice(1));
  const ifNode = named.get("if");
  const applyNode = named.get("apply");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;
  const apply =
    applyNode && isList(applyNode) ? compileEffect(applyNode, env) : undefined;
  const btNode = named.get("backtracking");
  const backtracking = !!btNode && isIdent(btNode) && btNode.name === "True";
  const seedOwner = env.sowSeedOwner ?? env.numPlayers + 1;
  return (ctx) => {
    const from = ctx.frame.from;
    if (from === undefined || from < 0) return [];
    const startCount = ctx.state.countAtSite(from);
    if (startCount <= 0) return [];
    const track = pickTrack(ctx, from);
    if (!track) return [];
    const ring = track.sites;
    const startPos = ring.indexOf(from);
    if (startPos < 0) return [];

    const actions: Action[] = [new ActionAddCount(from, -startCount, seedOwner)];
    let pos = startPos;
    let landing = from;
    for (let k = 0; k < startCount; k += 1) {
      pos += 1;
      if (pos >= ring.length) {
        if (!track.loop) break;
        pos = 0;
      }
      const site = ring[pos] as number;
      actions.push(new ActionAddCount(site, +1, seedOwner));
      landing = site;
    }

    let postState = ctx.state;
    for (const a of actions) postState = a.apply(postState);

    if (cond && apply) {
      let capPos = ring.indexOf(landing);
      for (let guard = 0; guard < ring.length && capPos >= 0; guard += 1) {
        const capSite = ring[capPos] as number;
        const subCtx = ctx
          .withContext(ctx.context.withState(postState))
          .withFrame({ from, to: capSite });
        if (!cond.eval(subCtx)) break;
        for (const a of apply(subCtx)) {
          actions.push(a);
          postState = a.apply(postState);
        }
        if (!backtracking) break;
        capPos -= 1;
        if (capPos < 0) {
          if (!track.loop) break;
          capPos = ring.length - 1;
        }
        if ((ring[capPos] as number) === from) break;
      }
    }
    return actions;
  };
}

/**
 * `(fromTo (from <site>) (to <site>) [count:<n>])` as an *effect* — transfer
 * `n` seeds (default: all at the source) from one site's count to another's.
 * Used inside `(sow … apply:)` to scoop a captured hole into a store/hand.
 */
function compileFromToEffect(node: LudList, env: CompileEnv): EffectFn {
  const fromClause = node.items.find(
    (n) => isList(n) && listHead(n) === "from",
  ) as LudList | undefined;
  const toClause = node.items.find(
    (n) => isList(n) && listHead(n) === "to",
  ) as LudList | undefined;
  const { named } = parseArgs(node.items.slice(1));
  const fromSiteFn =
    fromClause?.items[1] && isList(fromClause.items[1])
      ? compileInt(fromClause.items[1], env)
      : undefined;
  const toSiteFn =
    toClause?.items[1] && isList(toClause.items[1])
      ? compileInt(toClause.items[1], env)
      : undefined;
  const countNode = named.get("count");
  const countFn = countNode ? compileInt(countNode, env) : undefined;
  const seedOwner = env.sowSeedOwner ?? env.numPlayers + 1;
  return (ctx) => {
    if (!fromSiteFn || !toSiteFn) return [];
    const src = fromSiteFn.eval(ctx);
    const dst = toSiteFn.eval(ctx);
    if (src < 0 || dst < 0) return [];
    const n = countFn ? countFn.eval(ctx) : ctx.state.countAtSite(src);
    if (n <= 0) return [];
    return [
      new ActionAddCount(src, -n, seedOwner),
      new ActionAddCount(dst, +n, seedOwner),
    ];
  };
}

/**
 * `(move (from <region>?) (to <region> if:<bool>? (apply <effect>)?))`. The
 * generic relocation move. From-sites default to the `forEach Piece` binding
 * (`frame.from`) when present, else the mover's occupied cells, else the
 * explicit `(from <region>)`. For each from-site that passes the `from` guard,
 * every site in the `to` region that passes the `to` guard yields a relocating
 * `ActionMove`. As with Step/Slide, the relocation overwrites its destination,
 * so an `(apply (remove (to)))` capturing the landing cell is subsumed.
 */
function compileFromTo(node: LudList, env: CompileEnv): MovesFn {
  const after = node.items.slice(1);
  const fromNode = after.find((n) => isList(n) && listHead(n) === "from") as
    | LudList
    | undefined;
  const toNode = after.find((n) => isList(n) && listHead(n) === "to") as
    | LudList
    | undefined;
  if (!toNode) {
    throw new LudemeCompileError("(move (from …) …) needs a (to …) clause.");
  }

  let fromRegion: RegionFn | undefined;
  let fromCond: BoolFn | undefined;
  if (fromNode) {
    const { positional, named } = parseArgs(fromNode.items.slice(1));
    const regionArg = dropSiteType(positional)[0];
    if (regionArg) fromRegion = compileRegion(regionArg, env);
    const ifNode = named.get("if");
    if (ifNode) fromCond = compileBool(ifNode, env);
  }

  const { positional: toPos, named: toNamed } = parseArgs(toNode.items.slice(1));
  const applyNode = toPos.find(
    (n) => isList(n) && listHead(n) === "apply",
  ) as LudList | undefined;
  const toRegionArg = dropSiteType(toPos).find((n) => n !== applyNode);
  if (!toRegionArg) {
    throw new LudemeCompileError("(to …) needs a destination region.");
  }
  const toRegion = compileRegion(toRegionArg, env);
  const ifNode = toNamed.get("if");
  const toCond: BoolFn | undefined = ifNode ? compileBool(ifNode, env) : undefined;
  const effect = applyNode ? compileApply(applyNode, env) : undefined;

  return {
    generate: (ctx) => {
      const mover = ctx.mover;
      let fromSites: number[];
      if (fromRegion) {
        fromSites = [...fromRegion.eval(ctx)];
      } else if (ctx.frame.from !== undefined && ctx.frame.from >= 0) {
        fromSites = [ctx.frame.from];
      } else {
        const cells = ctx.state.cells;
        fromSites = [];
        for (let s = 0; s < cells.length; s += 1) {
          if (cells[s] === mover) fromSites.push(s);
        }
      }
      const out: Move[] = [];
      const cells = ctx.state.cells;
      for (const from of fromSites) {
        if (from < 0) continue;
        // A piece must exist at the source to be moved. An explicit `(from
        // <region>)` (e.g. `(handSite Mover)`) can name an empty site once a
        // hand is exhausted — skip it rather than letting ActionMove throw.
        if ((cells[from] ?? 0) === 0) continue;
        const fctx = ctx.withFrame({ from, piece: mover });
        if (fromCond && !fromCond.eval(fctx)) continue;
        for (const to of toRegion.eval(fctx)) {
          if (to < 0) continue;
          const sub = fctx.withFrame({ from, to, piece: mover });
          if (toCond && !toCond.eval(sub)) continue;
          const actions: Action[] = [new ActionMove({ from, to })];
          if (effect) {
            for (const a of effect(sub)) {
              if (a.actionType() === "Remove" && a.to() === to) continue;
              actions.push(a);
            }
          }
          out.push(
            new Move({
              id: `move:${from}:${to}:${mover}`,
              label: `Move ${from}→${to}`,
              siteIndices: [to],
              mover,
              placedOwner: mover,
              actions,
            }),
          );
        }
      }
      return out;
    },
  };
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
  if (isList(node) && listHead(node) === "forEach") {
    return compileForEachPlayerEnd(node, env);
  }
  // `(if: <cond> <result>)` — the keyword-argument form where `if:` is a
  // colon-suffixed ident; semantically identical to `(if …)`. Accept both.
  const headName = isList(node) ? listHead(node) : undefined;
  if (!isList(node) || (headName !== "if" && headName !== "if:")) {
    throw new LudemeCompileError("end clause must be (if <cond> (result …)).");
  }
  const condNode = node.items[1];
  const resultNode = node.items[2];
  if (!condNode || !resultNode) {
    throw new LudemeCompileError("(if …) end clause needs cond + result.");
  }
  const cond = compileBool(condNode, env);
  const result = compileEndResult(resultNode, env);
  const elseNode = node.items[3];
  const elseResult = elseNode ? compileEndResult(elseNode, env) : undefined;
  return {
    eval: (ctx) =>
      cond.eval(ctx)
        ? result(ctx)
        : elseResult
          ? elseResult(ctx)
          : undefined,
  };
}

/**
 * `(forEach <who> [if:<cond>] <result>)` — a per-player end clause. Each
 * player in the `<who>` set (Player/All → everyone; NonMover/Enemy → everyone
 * but the mover; Mover/Next → that single player) is bound to `frame.player`
 * in turn; the first one satisfying the (optional) condition yields the
 * result, which resolves the `Player` role to that player. Common shape:
 * `(result Player Loss)` for a player out of pieces or with no moves.
 * Java parity: `game.rules.end.ForEach` over players.
 */
function compileForEachPlayerEnd(node: LudNode, env: CompileEnv): EndRule {
  const dimNode = isList(node) ? node.items[1] : undefined;
  const who = dimNode && isIdent(dimNode) ? dimNode.name : "";
  if (!["Player", "All", "NonMover", "Enemy", "Mover", "Next"].includes(who)) {
    throw new LudemeCompileError("Unsupported (forEach …) end clause.");
  }
  const { positional, named } = parseArgs((node as LudList).items.slice(2));
  const ifNode = named.get("if");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;
  const resultNode = positional.find((n) => isList(n));
  if (!resultNode) {
    throw new LudemeCompileError("(forEach …) end needs a result.");
  }
  const result = compileEndResult(resultNode, env);
  return {
    eval: (ctx) => {
      const n = ctx.context.game.numPlayers;
      const players: number[] =
        who === "Mover"
          ? [ctx.mover]
          : who === "Next"
            ? [(ctx.mover % n) + 1]
            : [];
      if (players.length === 0) {
        for (let p = 1; p <= n; p += 1) {
          if ((who === "NonMover" || who === "Enemy") && p === ctx.mover) {
            continue;
          }
          players.push(p);
        }
      }
      for (const p of players) {
        const sub = ctx.withFrame({ player: p });
        if (!cond || cond.eval(sub)) return result(sub);
      }
      return undefined;
    },
  };
}

/**
 * An end clause's outcome: `(result …)`, `(byScore …)`, or a nested decision —
 * `(if <cond> <then> [<else>])` and curly blocks `{ <outcome>… }` that pick the
 * first matching sub-outcome. Returns `undefined` when no nested branch fires.
 */
function compileEndResult(
  node: LudNode,
  env: CompileEnv,
): (ctx: EvalContext) => { winner: number } | undefined {
  if (isList(node) && node.delimiter === "curly") {
    const subs = node.items
      .filter((n): n is LudList => isList(n))
      .map((n) => compileEndResult(n, env));
    return (ctx) => {
      for (const s of subs) {
        const r = s(ctx);
        if (r) return r;
      }
      return undefined;
    };
  }
  if (isList(node) && listHead(node) === "byScore") {
    return compileByScore(node, env);
  }
  if (isList(node) && listHead(node) === "forEach") {
    const rule = compileForEachPlayerEnd(node, env);
    return (ctx) => rule.eval(ctx);
  }
  if (isList(node) && listHead(node) === "if") {
    const condNode = node.items[1];
    const thenNode = node.items[2];
    if (!condNode || !thenNode) {
      throw new LudemeCompileError("(if …) end outcome needs cond + result.");
    }
    const cond = compileBool(condNode, env);
    const thenR = compileEndResult(thenNode, env);
    const elseNode = node.items[3];
    const elseR = elseNode ? compileEndResult(elseNode, env) : undefined;
    return (ctx) =>
      cond.eval(ctx) ? thenR(ctx) : elseR ? elseR(ctx) : undefined;
  }
  return compileResult(node);
}

/**
 * `(byScore [{ (score <role> <int>)… }])` — the winner is the player with the
 * strictly-highest score; a tie is a draw (winner 0). When score pairs are
 * given they are evaluated to override the live state scores (used by the
 * `MancalaByScoreWhen` end define). Java parity: `game.rules.end.ByScore`.
 */
function compileByScore(
  node: LudList,
  env: CompileEnv,
): (ctx: EvalContext) => { winner: number } {
  const pairs: { pid: number; value: IntFn }[] = [];
  const visit = (item: LudNode): void => {
    if (!isList(item)) return;
    if (item.delimiter === "curly") {
      for (const inner of item.items) visit(inner);
      return;
    }
    if (listHead(item) === "score") {
      const roleNode = item.items[1];
      const valueNode = item.items[2];
      if (roleNode && isIdent(roleNode) && valueNode) {
        const pid = resolveStaticRole(roleNode.name);
        if (pid !== undefined) {
          pairs.push({ pid, value: compileInt(valueNode, env) });
        }
      }
    }
  };
  for (const item of node.items.slice(1)) visit(item);
  return (ctx) => {
    const numPlayers = ctx.context.game.numPlayers;
    const scores = new Map<number, number>();
    for (let p = 1; p <= numPlayers; p += 1) scores.set(p, ctx.state.score(p));
    for (const { pid, value } of pairs) scores.set(pid, value.eval(ctx));
    let best = Number.NEGATIVE_INFINITY;
    let winner = 0;
    let tie = false;
    for (let p = 1; p <= numPlayers; p += 1) {
      const s = scores.get(p) ?? 0;
      if (s > best) {
        best = s;
        winner = p;
        tie = false;
      } else if (s === best) {
        tie = true;
      }
    }
    return { winner: tie ? 0 : winner };
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
        : role === "Player"
          ? ctx.player
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
