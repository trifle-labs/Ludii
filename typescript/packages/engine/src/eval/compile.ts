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
import { ActionCopy } from "../action/action-copy.js";
import { ActionBet } from "../action/action-bet.js";
import { ActionPropose } from "../action/action-propose.js";
import { ActionSwap } from "../action/action-swap.js";
import { ActionVote } from "../action/action-vote.js";
import { ActionMove } from "../action/action-move.js";
import {
  ActionMoveLevelFrom,
  ActionMoveLevelFromLevelTo,
  ActionMoveLevelTo,
} from "../action/action-move-level.js";
import { ActionPass } from "../action/action-pass.js";
import { ActionPromote } from "../action/action-promote.js";
import { SplitMix64 } from "./split-mix64.js";
import {
  ActionForgetValue,
  ActionRememberValue,
} from "../action/action-remember.js";
import { ActionRemove } from "../action/action-remove.js";
import { ActionRemoveNonApplied } from "../action/action-remove-non-applied.js";
import { ActionRollDice } from "../action/action-roll-dice.js";
import { ActionStoreStateInContext } from "../action/action-store-state.js";
import { ActionSelect } from "../action/action-select.js";
import { ActionSetCost } from "../action/action-set-cost.js";
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
import { ActionSetTemp } from "../action/action-set-temp.js";
import { ActionUpdateDice } from "../action/action-update-dice.js";
import type { SiteType } from "../action/site-type.js";
import { Move } from "../move.js";
import type { Context } from "../context.js";
import {
  directionsBetween,
  facingForSite,
  graphNeighbourSites,
  isRelativeDirectionToken,
  resolveDirection,
  resolveDirectionTokens,
  stepCompassName,
} from "./directions.js";
import { directionByName } from "./graph/trajectory/absolute-direction.js";
import {
  type BoolFn,
  type Dir,
  type DirectionsFn,
  END,
  type EndRule,
  type EvalContext,
  type InterpBoard,
  type IntFn,
  type MancalaTrack,
  type MovesFn,
  OFF,
  type RegionFn,
} from "./eval-context.js";
import { lookupLudeme } from "../ludemes/registry.js";

export class LudemeCompileError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "LudemeCompileError";
  }
}

// Moves produced by a `(forEach Site … noMoveYet:<fallback>)` *fallback* arm are
// tagged here so an enclosing `(forEach Die …)` can match Java's `ForEachSite.eval`
// (Core/.../foreach/site/ForEachSite.java:86-91): on the no-move-yet path it
// `return`s the fallback moves BEFORE applying `then()`, so a hoisted
// `(then "ReplayNotAllDiceUsed")` (turn-retention) must NOT be stamped onto them
// — otherwise the player wrongly retains the turn after a forced bear-off
// (backgammon-family deep-ply MOVE_MISMATCH). The set holds the exact Move
// instances returned by the fallback; `forEach Die`'s emit() checks membership of
// the un-wrapped inner move before deciding which thens apply. WeakSet → no leak.
const foreachSiteNoMoveYetMoves = new WeakSet<Move>();
type CompiledThen = {
  moveAgain: boolean;
  moveAgainCond?: BoolFn;
  effect?: EffectFn;
};
// Trial-replay parity: a small set of games uses `(value Random (range ...))` in
// ordinary move consequents (not dice). The replay harness injects Java's pre-start
// SplitMix64 bytes into the Context RNG; surface the same generator here when
// available so those random draws can match Java exactly.
function rngNextInt(ctx: EvalContext, bound: number): number {
  if (bound <= 0) return 0;
  const live = (ctx.context.rng as { _sm64?: SplitMix64 })._sm64;
  if (live instanceof SplitMix64) return live.nextIntBound(bound);
  return ctx.context.rng.nextInt(bound);
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
   * Declared player regions kept as a *list* of the individual regions a
   * player owns (the curly `(regions <Role> {A B})` array is split rather than
   * unioned), keyed by player id. `(is Connected <Role>)` connects the group to
   * each owned region separately and counts how many are reached — Java's
   * IsConnected iterates `game.equipment().regions()` of the owner one by one —
   * so the union in `playerRegions` would collapse the count and is unusable
   * here.
   */
  readonly playerRegionList?: Map<number, RegionFn[]>;
  /**
   * Named regions from `(regions "Name" <region>)` (and the named-with-role
   * `(regions "Name" <Role> <region>)`), keyed by the string name. A string
   * `(sites "Name")` resolves through this map.
   */
  readonly namedRegions?: Map<string, RegionFn>;
  /**
   * Per-player named regions from `(regions "Name" <Role> <region>)`, keyed
   * by region name then by player id. A game may give each player a region of
   * the same name (e.g. "Home"/"Inner" in four-row mancala), so `(sites Mover
   * "Home")` must select the *mover's* "Home", not the last one declared.
   * Java's SitesEquipmentRegion matches on both name and owning role.
   */
  readonly namedPlayerRegions?: Map<string, Map<number, RegionFn>>;
  /**
   * Per-owner move generators compiled from each `(piece … <moves>)`
   * definition. `(forEach Piece)` dispatches through this map. Filled by
   * LudemeGame before compiling the play rule.
   */
  readonly pieceMovesByOwner?: Map<number, MovesFn>;
  /**
   * Per-component move generators compiled from each `(piece … <moves>)`
   * definition, keyed by the component's `what` id. `(forEach Piece)` dispatches
   * through this first (the right generator for whatever piece sits on a site),
   * falling back to {@link pieceMovesByOwner} when a site carries no component
   * id. Filled by LudemeGame before compiling the play rule.
   */
  readonly pieceMovesByWhat?: Map<number, MovesFn>;
  /**
   * Component `what` ids for pieces explicitly defined with NO move generator
   * (e.g. Chessence's `(piece "King" Each)` — "kings do not move"). Java's
   * `(forEach Piece)` calls each component's own generator, so such a piece
   * contributes nothing. The bare-dispatch arm of `(forEach Piece)` falls back
   * to {@link pieceMovesByOwner} when a site's `what` is absent from
   * {@link pieceMovesByWhat}; that fallback must NOT fire for these pieces, or
   * the King inherits a sibling pawn's slide rule. Filled by LudemeGame.
   */
  readonly componentsWithoutMoves?: Set<number>;
  /** Full piece-label → component `what` id (Java: Equipment component index). */
  readonly componentIdByLabel?: ReadonlyMap<string, number>;
  /** Component `what` id → owning player. */
  readonly componentOwnerById?: readonly number[];
  /** Component `what` id → base piece name (collision-free; used by `(forEach Piece "Name")`). */
  readonly componentBaseNameById?: readonly string[];
  /** Component `what` id → its `(flips a b)` state pair; read by the `(flip …)` effect. */
  readonly componentFlipsById?: readonly ([number, number] | undefined)[];
  /**
   * Component `what` id → its large-piece turtle walk(s) (Java: `Component.
   * walk()`). A non-undefined entry marks a `(tile …)` whose footprint spans
   * several cells; the `(move Add …)`/`(move (from)(to))` compilers expand the
   * anchor placement over `largePieceFootprint(...)` so the whole shape is
   * occupied (Cram, Domineering, Pentomino, L Game).
   */
  readonly componentWalkById?: readonly (string[][] | undefined)[];
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
   * Initial placement sites grouped by *component* (the per-site `what`), so
   * `(sites Start (piece <id>))` resolves the way Java's SitesStart does:
   * `context.trial().startingPos().get(index)` keys by the component index, not
   * the owner. Keyed by `what ?? owner` — exactly the value written to
   * `state.whats` at start — so `(what at:(from))` always agrees with the key.
   */
  readonly startSitesByComponent?: Map<number, readonly number[]>;
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
  /**
   * Equipment maps in declaration order. Java `MapEntry.eval` scans ALL maps
   * when no explicit name is supplied and returns the first real hit, so bare
   * `(mapEntry <key>)` may resolve through a named map (e.g. Mangala
   * (Bedouin)'s `"FourthHole"` opening restriction) rather than only the
   * player-store map.
   */
  readonly orderedMaps?: readonly Readonly<{
    name?: string;
    map: ReadonlyMap<number, number>;
  }>[];
  /** Board's default play-site type (`Cell` / `Vertex` / `Edge`). */
  readonly boardDefaultSiteType?: "Cell" | "Vertex" | "Edge";
  /**
   * Mutable game-global flag set true when `(is Visited …)` is compiled
   * anywhere in the game (Java: `Game.requiresVisited()`). `(can Move …)` reads
   * it to decide whether to apply CanMove.eval's temporary last-move visit, and
   * LudemeGame reads it after compilation to drive the per-turn visited
   * accumulation in `apply`. A box (not a plain bool) so the value set while
   * compiling a nested `(is Visited …)` is visible to the enclosing game.
   */
  readonly visitedFlag?: { required: boolean };
  /**
   * Java parity: `GameType.NotAllPass`. Certain ludemes — notably an explicit
   * `(move Pass)` — disable the implicit all-pass draw. Threaded as a mutable
   * box so the compiler can flip it while descending nested move trees and
   * LudemeGame can read the final game-global result after compilation.
   */
  readonly notAllPassFlag?: { required: boolean };
  /**
   * Runtime-only handoff used while compiling the body of `(forEach Die ...)`:
   * branch-local dice replay thens are tagged on the generated Move so the die
   * handler can evaluate them after appending ActionUseDie.
   */
  readonly deferredDiceThens?: WeakMap<Move, CompiledThen[]>;
  /**
   * Java `Game.isStacking()`. When `false` the game uses flat count-piles
   * (mancala pits, backgammon points), so `(remove)` clears the WHOLE site
   * (Java `ContainerFlatState.remove` → `setSite(…,0,0,0,0,0,0)`); when `true`
   * it pops one piece (`ContainerStateStacks.remove`). Threaded to
   * `ActionRemove({ clearAll })`. Computed by LudemeGame from the game tree.
   */
  readonly isStacking?: boolean;
}

/** A set of dice declared in equipment: N dice, each with a face-value set. */
export interface DiceDef {
  readonly numDice: number;
  /** `faces[i]` are the printable values of die `i`. */
  readonly faces: readonly (readonly number[])[];
}

// ---- named-argument parsing ----------------------------------------------

export interface ParsedArgs {
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
export function parseArgs(items: readonly LudNode[]): ParsedArgs {
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
export function resolveRole(name: string, ctx: EvalContext): number {
  switch (name) {
    case "Mover":
      return ctx.mover;
    case "Player":
      // Bound by `(forEach Player …)` via frame.player; falls back to mover.
      return ctx.player;
    case "Next":
      if (ctx.frame.roleNextFromState) {
        return ctx.state.next > 0
          ? ctx.state.next
          : (ctx.mover % ctx.context.game.numPlayers) + 1;
      }
      // NOTE: Java `Id.eval(Next)` is `state.next()`, which after a
      // `(moveAgain)` override equals the mover. But applying that override here
      // is UNFAITHFUL for `(sites Next)` evaluated inside a move's `(then …)`
      // consequent (e.g. Dama (Italy) `(then ("PromoteIfReach" (sites Next) …))`,
      // Taiji): Java's recorded trials show `Next` resolving to the opponent
      // there, so the override must NOT leak into then-context role resolution.
      // The cyclic successor matches Java in every non-override generation/then
      // context; the `(is Next …)` boolean (post-move nextPhase) handles the
      // override case separately. See PORT_PROGRESS 2026-05-23 10:24 CEST.
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
 * Extract the target piece name(s) (and optional player role) from a promote
 * piece spec. Handles a bare string ("Queen"), `(piece "Queen")`,
 * `(id "Queen" Role)`, the nested `(piece (id "Queen" Role))` form (Long
 * Assize), and the curly-set form `(piece {"Queen" "Knight" "Bishop" "Rook"})`
 * (Unachess) where Java's Promote emits one move per name. Returns an empty
 * list when unresolvable, so the caller can fall back to owner-only promotion.
 */
function extractPromotePieceSpec(spec: LudNode | undefined): {
  names: string[];
  role?: string;
} {
  if (!spec) return { names: [] };
  if (isString(spec)) return { names: [spec.value] };
  if (isList(spec)) {
    if (spec.delimiter === "curly") {
      const names: string[] = [];
      for (const it of spec.items) {
        if (isString(it)) names.push(it.value);
        else if (isList(it) && listHead(it) === "id") {
          const nm = it.items[1];
          if (nm && isString(nm)) names.push(nm.value);
        }
      }
      return { names };
    }
    const head = listHead(spec);
    if (head === "piece") return extractPromotePieceSpec(spec.items[1]);
    if (head === "id") {
      const nameNode = spec.items[1];
      const roleNode = spec.items[2];
      return {
        names: nameNode && isString(nameNode) ? [nameNode.value] : [],
        role: roleNode && isIdent(roleNode) ? roleNode.name : undefined,
      };
    }
  }
  return { names: [] };
}

/**
 * Resolve a role for hand-container addressing. Java `RoleType.Shared` and
 * `Neutral` both have owner() == 0 (Constants.NOBODY), and the engine parks a
 * shared/neutral hand at index 0; everything else follows the normal role
 * mapping. `(sites Hand …)` and `(handSite …)` go through here so that
 * `(sites Hand Shared)` / `(handSite Shared)` address that index-0 hand.
 */
function resolveHandRole(name: string, ctx: EvalContext): number {
  if (name === "Shared" || name === "Neutral") return 0;
  return resolveRole(name, ctx);
}

/**
 * Strip redundant grouping parentheses: source like `((is Prev Mover))`
 * parses to a single-item round list whose only child is itself a list.
 * The extra parens carry no meaning, so unwrap to the inner expression.
 * Only round (not curly) single-item wrappers are unwrapped, and only when
 * the inner item is itself a list — a singleton like `(pass)` or `(Mover)`
 * is a real ludeme call and is left intact.
 */
export function unwrapParens(node: LudNode): LudNode {
  let n = node;
  while (isList(n) && n.delimiter === "round" && n.items.length === 1) {
    const only = n.items[0];
    if (only && isList(only)) n = only;
    else break;
  }
  return n;
}

/** A move generator that never produces anything. */
export const EMPTY_MOVES: MovesFn = { generate: () => [] };

/** Java: main.Constants.MAX_NUM_ITERATION — the infinite-loop guard `(while …)`
 * uses to bound the temp-context iteration. */
const MAX_NUM_ITERATION = 10000;

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
    if (name === "End") return { eval: () => END };
    return { eval: (ctx) => resolveRole(name, ctx) };
  }
  if (!isList(node)) {
    throw new LudemeCompileError(`Cannot compile int from ${node.kind}.`);
  }
  const head = listHead(node);
  const _r = head ? lookupLudeme("int", head) : undefined;
  if (_r) return _r(node, env) as IntFn;
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
    case "value": {
      // (value Player <role>) → the player's stored integer value, set by
      // (set Value <player> <int>). Java: ints.value.player.ValuePlayer →
      // context.state().getValue(pid). Bare (value) is the frame-bound
      // iteration value used inside (forEach Value …) / (forEach Die …).
      const sub = positional[0];
      if (sub && isIdent(sub) && sub.name === "Player") {
        const roleNode = positional[1];
        const roleName = roleNode && isIdent(roleNode) ? roleNode.name : "Mover";
        const roleFn = roleNode && isList(roleNode) ? compileInt(roleNode, env) : undefined;
        return {
          eval: (ctx) =>
            ctx.state.valuePlayer(
              roleFn ? roleFn.eval(ctx) : resolveRole(roleName, ctx),
            ),
        };
      }
      if (sub && isIdent(sub) && sub.name === "Pending") {
        // (value Pending) → Java ValuePending: returns the single pending value
        // if there is exactly one, else 0 (ambiguous when 0 or >1 values).
        return {
          eval: (ctx) => {
            const set = ctx.state.pending;
            return set.size === 1 ? set.values().next().value ?? 0 : 0;
          },
        };
      }
      if (sub && isIdent(sub) && sub.name === "Piece") {
        // (value Piece at:<loc>) → the per-site stored piece value. Java:
        // ints.value.piece.ValuePiece.eval → containerState.value(loc); an OFF
        // location returns NOBODY (0). Quarto encodes a piece's 4th attribute
        // as this value and its end rule reads `(value Piece at:(to))`.
        const atNode = named.get("at") ?? positional[1];
        const atFn = atNode ? compileInt(atNode, env) : undefined;
        return {
          eval: (ctx) => {
            if (!atFn) return 0;
            const loc = atFn.eval(ctx);
            if (loc === OFF || loc < 0) return 0; // Constants.NOBODY
            return ctx.state.valueAtSite(loc);
          },
        };
      }
      return { eval: (ctx) => ctx.frame.value ?? OFF };
    }
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
      return {
        eval: (ctx) => {
          // Dice face sites are global indices appended after board + hands;
          // map back to the diceValues array via the board's dice-site base.
          const idx = siteFn.eval(ctx) - ctx.board.diceSiteStart;
          return ctx.state.diceValues[idx] ?? OFF;
        },
      };
    }
    case "mover":
      return { eval: (ctx) => ctx.mover };
    case "next":
      // Java parity: `(next)` is the *stored* next player — `context.state().
      // next()` — not the rotational successor. A `(moveAgain)` continuation
      // sets `state.next` back to the mover, so during a same-turn sub-move
      // `(is Mover (next))` reads true and a `(no Moves Next)` end rule does not
      // fire a sub-turn early (L Game: an L-move's `(then (moveAgain))` precedes
      // the optional neutral-piece move). Fall back to the rotational successor
      // only when no override is pending (`state.next == 0`).
      return {
        eval: (ctx) =>
          ctx.state.next > 0
            ? ctx.state.next
            : (ctx.mover % ctx.context.game.numPlayers) + 1,
      };
    case "mapEntry": {
      // (mapEntry "Name"? <key>?) — look up a key in a named map declared by
      // `(map "Name" {(pair k v) …})`, or in the default player→store map.
      // Mancala games map each player to their store hole; named maps cover
      // things like die-face → outcome lookups.
      // Java parity (MapEntry.eval): look the key up in the map; return the
      // stored value only when it is a real entry (not OFF and not the trove
      // no-entry value, which Ludii's runtime reports as -99 — see the comment
      // in MapEntry.java). Otherwise fall back to the KEY itself. e.g. a
      // `(map "Throw" {(pair 0 8)})` maps a 0-pip throw to the "grace" value 8
      // but leaves 1..N unmapped, so `(mapEntry "Throw" n)` returns n for those.
      //
      // Crucially the no-entry value is NOT 0: a player→store map such as
      // `(map {(pair P1 FirstSite) (pair P2 LastSite)})` legitimately maps P1 to
      // store *site 0*, and Wari/Kalah/etc. capture into it. A JS Map already
      // distinguishes a stored 0 (`get` returns 0) from an absent key (`get`
      // returns undefined), so we only fall back on `undefined`/`OFF`.
      const mapLookup = (m: ReadonlyMap<number, number> | undefined, key: number): number => {
        const v = m?.get(key);
        return v === undefined || v === OFF ? key : v;
      };
      const first = positional[0];
      if (first && isString(first)) {
        const named = env.namedMaps?.get(first.value);
        const keyNode = positional[1];
        const keyFn = keyNode
          ? compileInt(keyNode, env)
          : { eval: (c: EvalContext) => c.mover };
        // The named map may be registered after this ludeme compiles (piece
        // moves compile before `compileMap`), so resolve it lazily at eval
        // time rather than capturing whatever `namedMaps` held at compile.
        const mapName = first.value;
        return {
          eval: (ctx) =>
            mapLookup(env.namedMaps?.get(mapName), keyFn.eval(ctx)),
        };
      }
      const pid = first
        ? compileInt(first, env)
        : { eval: (c: EvalContext) => c.mover };
      return {
        eval: (ctx) => {
          const key = pid.eval(ctx);
          const ordered = env.orderedMaps;
          if (ordered && ordered.length > 0) {
            for (const entry of ordered) {
              const v = entry.map.get(key);
              if (v !== undefined && v !== OFF) return v;
            }
          }
          return mapLookup(env.playerStoreMap, key);
        },
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
      const afterConsequenceNode = named.get("afterConsequence");
      const afterConsequence =
        !!afterConsequenceNode &&
        isIdent(afterConsequenceNode) &&
        afterConsequenceNode.name === "True";
      return {
        eval: (ctx) => {
          const moves = ctx.context.trial.moves;
          const lastMove = moves[moves.length - 1];
          if (!lastMove) return OFF;
          // `afterConsequence:True` → Java `Move.toAfterSubsequents()` /
          // `fromAfterSubsequents()`: walk backward through the move's full
          // action list (including sow / capture consequences), skipping
          // actions whose to/from is OFF, and return the first valid one. This
          // is how `("LastHoleSowed")` = `(last To afterConsequence:True)`
          // resolves to the final sown hole for relay (moveAgain) sows.
          if (afterConsequence && lastMove.actions.length > 0) {
            const acts = lastMove.actions;
            for (let i = acts.length - 1; i >= 0; i -= 1) {
              const a = acts[i];
              if (!a) continue;
              const v = field === "From" ? a.from() : a.to();
              if (v !== OFF) return v;
            }
            return OFF;
          }
          return field === "From" ? lastMove.from() : lastMove.to();
        },
      };
    }
    case "who": {
      const at = named.get("at") ?? positional[0];
      if (!at) throw new LudemeCompileError("(who …) needs an at: site.");
      const site = compileInt(at, env);
      // `(who at:s level:L)` reads the owner at a specific stack level (Java:
      // ContainerStateStacks.who(site, level)); without `level:` it reports the
      // top owner (the cell). `stackAt` returns the per-level owner for a real
      // stack and the single owner at level 0 of a flat occupied site.
      const levelNode = named.get("level");
      const levelFn = levelNode ? compileInt(levelNode, env) : undefined;
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          if (s < 0 || s >= ctx.state.cells.length) return OFF;
          if (levelFn) return ctx.state.whoAtSiteLevel(s, levelFn.eval(ctx));
          return ctx.state.cells[s] ?? 0;
        },
      };
    }
    case "what": {
      const at = named.get("at") ?? positional[0];
      if (!at) throw new LudemeCompileError("(what …) needs an at: site.");
      const site = compileInt(at, env);
      // `(what at:s level:L)` reads the component at a specific stack level
      // (Java: ContainerStateStacks.what(site, level)); without `level:` it
      // reports the top component. `whatAtSiteLevel` falls back to the per-level
      // owner (and, for flat sites, to the single top `what`) so chess-style
      // heterogeneous pieces and real distinct-piece stacks both read correctly.
      const levelNode = named.get("level");
      const levelFn = levelNode ? compileInt(levelNode, env) : undefined;
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          if (s < 0 || s >= ctx.state.cells.length) return 0;
          // Java: ContainerState.what — the component index, which differs from
          // the owner for heterogeneous-piece games (chess) and equals it for
          // single-piece games.
          if (levelFn) return ctx.state.whatAtSiteLevel(s, levelFn.eval(ctx));
          return ctx.state.whatAtSite(s);
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
      // Subtype-dispatch: faithfully-ported `(count <Subtype> …)` registers under
      // `count:<Subtype>` (e.g. `count:Liberties`); fall through to legacy below.
      if (kind && isIdent(kind)) {
        const _rsub = lookupLudeme("int", "count:" + kind.name);
        if (_rsub) return _rsub(node, env) as IntFn;
      }
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
              // Java parity (PlayersIndices.getIdPlayers, RoleType.All loops
              // `pid = 0 .. players().size()` inclusive): "All" includes the
              // neutral player (id 0). Neutral pieces carry who == 0 but a
              // positive `what`, so an owner-only test (`c !== 0`) silently
              // misses them. Use what-based occupancy here so neutral pieces
              // (e.g. the four squares in Centrifugal/Centripetal Force) are
              // counted, matching `(sites Empty)`/`(is Occupied)`. Each
              // occupied site contributes its full stacked/seed count.
              if (everyone ? ctx.state.isOccupiedSite(s) : c === owner) {
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
        const requestedType =
          kind && isIdent(kind) && kind.name === "Cell"
            ? "Cell"
            : kind && isIdent(kind) && kind.name === "Site"
              ? "Site"
              : (env.boardDefaultSiteType ?? "Cell");
        return {
          eval: (ctx) => {
            const s = site.eval(ctx);
            if (s < 0 || s >= ctx.state.cells.length) return 0;
            // Java `ContainerState.count(site, type)`: a bare `(count at:s)`
            // reads in the board's default site space, so on a Vertex-played
            // board it returns 0 for hand/store Cell sites. Explicit
            // `(count Cell at:s)` keeps reading hands/stores. The TS state is a
            // flat global array, so mirror the container split here.
            if (requestedType !== "Site") {
              const isBoardSite = s < ctx.board.numSites;
              const boardType = env.boardDefaultSiteType ?? "Cell";
              if (requestedType === "Cell") {
                if (isBoardSite && boardType !== "Cell") return 0;
              } else if (!isBoardSite || boardType !== requestedType) {
                return 0;
              }
            }
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
            // Java parity: `CountTurns.eval` → `context.state().numTurn()`. The
            // counter starts at 1 and bumps once per *new* turn (player change /
            // swap), so during the move at 0-based ply `i` of a strictly
            // alternating game it reads `i + 1` — NOT `floor(moves/players)`.
            return { eval: (ctx) => ctx.state.numTurn };
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
        const countStacks =
          kind && isIdent(kind) && (kind.name === "Cell" || kind.name === "Stack");
        return {
          eval: (ctx) => {
            let n = 0;
            for (const s of region.eval(ctx)) {
              if (s < 0 || s >= ctx.state.cells.length) continue;
              if (countStacks) {
                n += ctx.state.stackSize(s);
                continue;
              }
              const c = ctx.state.countAtSite(s);
              n += c > 0 ? c : (ctx.state.cells[s] ?? 0) !== 0 ? 1 : 0;
            }
            return n;
          },
        };
      }
      if (kind && isIdent(kind)) {
        // (count Groups [dir] [if:] [min:]) / (count SizeBiggestGroup [dir] [if:])
        // Java CountGroups.java:63-76 stores direction/min/condition; eval
        // walks converted directions at :135-152 and counts only size >= min
        // at :163. CountSizeBiggestGroup uses the same condition-only flood.
        if (kind.name === "Groups" || kind.name === "SizeBiggestGroup") {
          let pi = 1;
          const typeNode = positional[pi];
          if (typeNode && isIdent(typeNode) && SITE_TYPE_IDENTS.has(typeNode.name))
            pi += 1;
          const dir = parseGroupDirectionArg(positional, pi);
          const ifNode = named.get("If") ?? named.get("if");
          const cond = ifNode ? compileBool(ifNode, env) : undefined;
          const visibleNode = named.get("isVisible");
          const isVisible = visibleNode ? compileBool(visibleNode, env) : undefined;
          const minNode = named.get("min");
          const minFn = minNode ? compileInt(minNode, env) : undefined;
          if (kind.name === "Groups") {
            return {
              eval: (ctx) => {
                const min = minFn ? minFn.eval(ctx) : 0;
                return javaStyleGroupFlood(ctx, {
                  dirTokens: dir.dirTokens,
                  condition: cond,
                  isVisible,
                  min,
                  mode: "conditionOnly",
                }).length;
              },
            };
          }
          return {
            eval: (ctx) => {
              let max = 0;
              for (const g of javaStyleGroupFlood(ctx, {
                dirTokens: dir.dirTokens,
                condition: cond,
                isVisible,
                mode: "conditionOnly",
              }))
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
        // (count Steps [type] [relation] <site1> <site2>) — shortest-path step
        // count under `relation` (Java CountSteps: precomputed distance matrix,
        // default RelationType.Adjacent → 8-connected on a square board).
        if (kind.name === "Steps") {
          // A leading RelationType ident (Orthogonal/Diagonal/Adjacent/All/
          // OffDiagonal) selects the neighbourhood; SiteType idents (Cell/Vertex
          // /Edge) are dropped. Default Adjacent, matching Java's constructor.
          let relation = "Adjacent";
          for (const n of positional.slice(1)) {
            if (isIdent(n) && SIZES_DIRECTION_NAMES.has(n.name)) {
              relation = n.name === "Orthogonals" ? "Orthogonal" : n.name;
              break;
            }
          }
          const ints = positional
            .slice(1)
            .filter((n) => !isIdent(n) || isList(n));
          const a = ints[ints.length - 2];
          const b = ints[ints.length - 1];
          if (a && b) {
            // Java CountSteps.eval: site1 is a single site, but the SECOND arg
            // is a RegionFunction — the result is the MINIMUM step distance from
            // site1 to any site in the region (e.g. Center's `(count Steps All
            // (to) (sites Perimeter))` = distance to the nearest perimeter site).
            // `compileRegion` auto-promotes a bare IntFunction to a 1-element
            // region, so the common two-site form `(count Steps (from) (to))`
            // stays exactly `stepDistance(site1, to)`. Empty region / negative
            // site1 → 0 (Java lines 96-104); non-empty but all-unreachable → OFF
            // (preserves the prior two-site unreachable return).
            const fromFn = compileInt(a, env);
            const toRegion = compileRegion(b, env);
            return {
              eval: (ctx) => {
                const s1 = fromFn.eval(ctx);
                if (s1 < 0) return 0;
                const sites = toRegion.eval(ctx).filter((s) => s >= 0);
                if (sites.length === 0) return 0;
                let min = OFF;
                for (const s of sites) {
                  const d = stepDistance(ctx, s1, s, relation);
                  if (d >= 0 && (min < 0 || d < min)) min = d;
                }
                return min;
              },
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
      // Single int-array argument (e.g. `(* (sizes Group P1))`): Java folds the
      // op over the array's elements via Add/Mul(IntArrayFunction). Only `+` and
      // `*` have that constructor arm; the others keep the scalar path.
      if (
        (head === "+" || head === "*") &&
        positional.length === 1 &&
        first &&
        isList(first) &&
        first.delimiter !== "curly" &&
        INT_ARRAY_HEADS.has(listHead(first) ?? "")
      ) {
        const arrFn = compileRegion(first, env);
        return { eval: (ctx) => foldArrayArith(head, arrFn.eval(ctx)) };
      }
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
    case "mod": {
      // (mod a b) — integer modulo synonym for (%).
      // Java: game.functions.ints.math.Mod is @Alias(alias = "%").
      const first = positional[0];
      const rawArgs =
        positional.length === 1 &&
        first &&
        isList(first) &&
        first.delimiter === "curly"
          ? first.items
          : positional;
      const args = rawArgs.map((n) => compileInt(n, env));
      return { eval: (ctx) => foldArith("%", args, ctx) };
    }
    case "array": {
      // (array <region>) wraps a region as an IntArray. Used as an int operand
      // (e.g. inside (+ (array …))), Java's Add sums the array — for a
      // one-element region this yields that single site index. Java:
      // game.functions.intArray.array.Array + Add's @Or IntArrayFunction arm.
      const inner = positional[0];
      if (!inner) return { eval: () => OFF };
      const region = compileRegion(inner, env);
      return {
        eval: (ctx) => {
          const sites = region.eval(ctx);
          if (sites.length === 0) return OFF;
          let sum = 0;
          for (const s of sites) sum += s;
          return sum;
        },
      };
    }
    case "mul": {
      // (mul a b) / (mul {a b c}) — product synonym for (*).
      // Java: game.functions.integerFunction.math.Mul.
      const first = positional[0];
      // Single int-array argument: product over the array's elements.
      if (
        positional.length === 1 &&
        first &&
        isList(first) &&
        first.delimiter !== "curly" &&
        INT_ARRAY_HEADS.has(listHead(first) ?? "")
      ) {
        const arrFn = compileRegion(first, env);
        return { eval: (ctx) => foldArrayArith("*", arrFn.eval(ctx)) };
      }
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
      // Java Id.eval: who != null && nameComponent == null → role→player id.
      const first = positional[0];
      if (first && isIdent(first)) {
        const roleName = first.name;
        return { eval: (ctx) => resolveRole(roleName, ctx) };
      }
      if (first && isString(first)) {
        // (id "Name" <role>) and bare (id "Name") return a COMPONENT `what`
        // index, not a player id — matching Java Id.eval. The TS engine carries
        // per-site component identity (`whatAtSite`), so `(= (what at:s) (id …))`
        // must compare against the component's `what`, not its owner.
        const nameComponent = first.value;
        const idByLabel = env.componentIdByLabel;
        const ownerById = env.componentOwnerById;
        const roleNode = positional[1];
        if (roleNode && isIdent(roleNode)) {
          // who != null && nameComponent != null → first component (lowest
          // `what`) whose label contains the name AND whose owner is the role's
          // player id. Java iterates components[1..] and returns the first hit.
          const roleName = roleNode.name;
          const candidates: { what: number; owner: number }[] = [];
          const seen = new Set<number>();
          if (idByLabel) {
            for (const [label, what] of idByLabel) {
              if (seen.has(what)) continue;
              if (label.includes(nameComponent)) {
                seen.add(what);
                candidates.push({ what, owner: ownerById?.[what] ?? -1 });
              }
            }
            candidates.sort((a, b) => a.what - b.what);
          }
          return {
            eval: (ctx) => {
              const pid =
                roleName === "Shared" || roleName === "Neutral"
                  ? env.numPlayers + 1
                  : resolveRole(roleName, ctx);
              for (const c of candidates) if (c.owner === pid) return c.what;
              return OFF;
            },
          };
        }
        // who == null && nameComponent != null → exact component-name match.
        const exact = idByLabel?.get(nameComponent);
        if (exact !== undefined) {
          return { eval: () => exact };
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
        ? { eval: (ctx: EvalContext) => resolveHandRole(playerNode.name, ctx) }
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
    case "rotation": {
      // (rotation [SiteType] at:<site> [level:<int>]) → the piece rotation
      // stored at that site. Java Rotation.java: returns 0 for an OFF site,
      // else cs.rotation(loc, type). SiteType/level are not yet modelled in
      // TS state; `at:` is the only argument we need.
      const at = named.get("at") ?? positional[0];
      if (at) {
        const site = compileInt(at, env);
        return {
          eval: (ctx) => {
            const s = site.eval(ctx);
            if (s < 0 || s >= ctx.state.cells.length) return 0;
            return ctx.state.rotationAtSite(s);
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
      // (where "Piece" <role>) → site of the component owned by the role's player
      // whose name contains "Piece". Java WhereSite.preprocess collects every
      // component whose `name().contains(namePiece)` (substring, against the FULL
      // label incl. the owner suffix, e.g. "Cow2"), then eval picks the first one
      // owned by the player and returns its site (OFF if it's off-board). A
      // captured/removed piece therefore returns OFF — this is what win
      // conditions like `("IsOffBoard" (where "Lion" Next))` depend on.
      // @java game.functions.ints.board.where.WhereSite
      if (first && isString(first)) {
        const namePiece = first.value;
        const idByLabel = env.componentIdByLabel;
        const ownerById = env.componentOwnerById;
        // Components (lowest `what` first) whose label contains the name.
        const candidates: { what: number; owner: number }[] = [];
        const seen = new Set<number>();
        if (idByLabel) {
          for (const [label, what] of idByLabel) {
            if (seen.has(what)) continue;
            if (label.includes(namePiece)) {
              seen.add(what);
              candidates.push({ what, owner: ownerById?.[what] ?? -1 });
            }
          }
          candidates.sort((a, b) => a.what - b.what);
        }
        // Shared/Neutral components are parked at owner `numPlayers + 1` (see
        // assignComponent / componentOwnerById), so `(where "Neutron" Shared)`
        // must resolve the role to that same neutral index — not 0 — for the
        // owner match below to find the component.
        const pidFn: IntFn =
          roleNode && isIdent(roleNode)
            ? roleNode.name === "Neutral" || roleNode.name === "Shared"
              ? { eval: (ctx) => ctx.context.game.numPlayers + 1 }
              : { eval: (ctx) => resolveRole(roleNode.name, ctx) }
            : { eval: (ctx) => ctx.mover };
        return {
          eval: (ctx) => {
            const pid = pidFn.eval(ctx);
            let targetWhat = OFF;
            for (const c of candidates)
              if (c.owner === pid) { targetWhat = c.what; break; }
            if (targetWhat <= OFF) return OFF;
            const state = ctx.state;
            const n = state.cells.length;
            for (let s = 0; s < n; s += 1)
              if (state.whatAtSite(s) === targetWhat) return s;
            return OFF;
          },
        };
      }
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
      // LargePiece is not yet modelled (best-effort 0).
      const sub = positional[0];
      const subName = sub && isIdent(sub) ? sub.name : "";
      // Subtype-dispatch: faithfully-ported `(size <Subtype> …)` registers under
      // `size:<Subtype>` (e.g. `size:Territory`); fall through to legacy below.
      if (subName) {
        const _rsub = lookupLudeme("int", "size:" + subName);
        if (_rsub) return _rsub(node, env) as IntFn;
      }
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
        // Java SizeGroup.java:60-69 accepts at:, optional direction, and if:;
        // eval starts from at (:77), then floods neighbours via converted
        // directions (:99-121), joining by same what when no condition exists.
        const atNode = named.get("at") ?? positional[1];
        const siteFn = atNode ? compileInt(atNode, env) : undefined;
        let pi = 1;
        const typeNode = positional[pi];
        if (typeNode && isIdent(typeNode) && SITE_TYPE_IDENTS.has(typeNode.name))
          pi += 1;
        if (atNode === positional[pi]) pi += 1;
        const dir = parseGroupDirectionArg(positional, pi);
        const ifNode = named.get("If") ?? named.get("if");
        const cond = ifNode ? compileBool(ifNode, env) : undefined;
        return {
          eval: (ctx) => {
            const seed = siteFn ? siteFn.eval(ctx) : lastToSite(ctx);
            const [group] = javaStyleGroupFlood(ctx, {
              dirTokens: dir.dirTokens,
              seeds: [seed],
              condition: cond,
              mode: "sameWhatWhenNoCondition",
            });
            return group?.size ?? 0;
          },
        };
      }
      return { eval: () => 0 };
    }
    case "topLevel": {
      // (topLevel at:<site>) — index of the top piece in the stack at a site
      // (height − 1). Faithful to Java TopLevel.eval (TopLevel.java:56-89):
      // an UNDEFINED site (loc == −1) → 0; a site index beyond the topology →
      // OFF; an EMPTY stack (sizeStack == 0) → 0 (NOT OFF); otherwise size − 1.
      // The empty→0 case is what makes `("IsEmptyOrSingletonStack" s)` =
      // `(= (topLevel at:s) 0)` hold for an empty destination — without it every
      // tables/backgammon move onto an empty point was wrongly rejected, so only
      // landings on an occupied singleton were generated. Default site = last To.
      const atNode = named.get("at") ?? positional[0];
      const siteFn = atNode ? compileInt(atNode, env) : undefined;
      return {
        eval: (ctx) => {
          const s = siteFn ? siteFn.eval(ctx) : lastToSite(ctx);
          if (s < 0) return 0; // Java: loc == UNDEFINED(−1) → 0
          if (s >= ctx.state.cells.length) return OFF; // beyond topology → OFF
          const h = ctx.state.stackSize(s);
          return h > 0 ? h - 1 : 0;
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
          // On a graph board the row/column is the rank among distinct y/x
          // clusters (Java Topology label), which diverges from the planar
          // coordinate on shifted/triangle-extended boards. On a plain lattice
          // the rank equals the coordinate, so `xOf`/`yOf` suffice there.
          if (ctx.board.traj) {
            return axis === "column"
              ? ctx.board.colRankOf(s)
              : ctx.board.rowRankOf(s);
          }
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
        return { eval: (ctx) => ctx.board.siteAtLabel(col, row) };
      }
      const rowNode = named.get("row");
      const colNode = named.get("column") ?? named.get("col");
      const rowFn = rowNode ? compileInt(rowNode, env) : undefined;
      const colFn = colNode ? compileInt(colNode, env) : undefined;
      return {
        eval: (ctx) => {
          const r = rowFn ? rowFn.eval(ctx) : 0;
          const c = colFn ? colFn.eval(ctx) : 0;
          return ctx.board.siteAtLabel(c, r);
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
      // Java game.functions.ints.math.Min/Max has two constructors:
      //   1. (min A B)               — the minimum of two int *values*
      //      (IntFunction, IntFunction); Java wraps them in an IntArrayConstant.
      //   2. (min <intArray|region>) — the extreme across a single list arg.
      // Keyword forms like (max Distance …)/(max Moves …) aren't modelled and
      // fall back to 0 so the surrounding game still compiles.
      const pick = head;
      const first = positional[0];
      // Two-value scalar form: ≥2 positional int args (and no leading keyword
      // ident, which marks the unmodelled aggregate forms). Compiling only the
      // first arg as a region — the prior behaviour — silently dropped the
      // second value, so `(min (face 26) (face 27))` (Tourne-Case's ThrowValue
      // and every two-dice race game's lower-die rule) returned just `(face 26)`.
      if (positional.length >= 2 && !(first && isIdent(first))) {
        const intFns: IntFn[] = [];
        let ok = true;
        for (const p of positional) {
          try {
            intFns.push(compileInt(p, env));
          } catch {
            ok = false;
            break;
          }
        }
        if (ok && intFns.length > 0) {
          const fns = intFns;
          return {
            eval: (ctx) => {
              let acc = fns[0]!.eval(ctx);
              for (let i = 1; i < fns.length; i += 1) {
                const v = fns[i]!.eval(ctx);
                acc = pick === "max" ? Math.max(acc, v) : Math.min(acc, v);
              }
              return acc;
            },
          };
        }
      }
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
      // (layer [of:<site>]) → the pyramidal layer of a site (Java: vertex
      // .layer()). On a Shibumi pyramid the layer is recovered from the site's
      // elevation z = layer/√2, so layer = round(z·√2). Planar boards have
      // z==0 everywhere → layer 0, matching the previous flat behaviour. The
      // site defaults to the just-moved `(to)`.
      const ofNode = named.get("of") ?? positional[0];
      const siteFn = ofNode ? compileInt(ofNode, env) : undefined;
      return {
        eval: (ctx) => {
          const s = siteFn ? siteFn.eval(ctx) : ctx.frame.to ?? lastToSite(ctx);
          if (s < 0 || s >= ctx.board.numSites) return 0;
          return Math.round(ctx.board.zOf(s) * Math.SQRT2);
        },
      };
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
      // (cost [<SiteType>] (at:<site> | in:<region>)) — sum of graph weights
      // over the resolved sites. @java game.functions.ints.board.Cost: the
      // optional leading SiteType is dropped (single graph-play type here); the
      // weights come from the `costAt` layer that `(set Cost …)` writes.
      const atNode = named.get("at");
      const inNode = named.get("in") ?? named.get("to");
      const atFn = atNode ? compileInt(atNode, env) : undefined;
      const inReg = inNode ? compileRegion(inNode, env) : undefined;
      if (!atFn && !inReg) return { eval: () => 0 };
      return {
        eval: (ctx) => {
          if (atFn) {
            const s = atFn.eval(ctx);
            return s >= 0 ? ctx.state.costAtSite(s) : 0;
          }
          let sum = 0;
          for (const s of inReg!.eval(ctx)) if (s >= 0) sum += ctx.state.costAtSite(s);
          return sum;
        },
      };
    }
    case "prev": {
      const type = positional[0];
      const moverLastTurn =
        type && isIdent(type) && type.name === "MoverLastTurn";
      // Java Prev.eval: default PrevType.Mover returns state.prev(); the
      // MoverLastTurn arm calls trial.lastTurnMover(state.mover()).
      return {
        eval: (ctx) => {
          if (moverLastTurn) return ctx.context.trial.lastTurnMover(ctx.mover);
          const last = ctx.context.trial.lastMove();
          if (last) return last.mover;
          const n = ctx.context.game.numPlayers;
          return ((ctx.mover + n - 2) % n) + 1;
        },
      };
    }
    case "Random": {
      // `(value Random (range a b))` / `(Random (range a b))` — Java's random
      // int draw used by between-round first-player selection in two-row mancala.
      // Uses the context RNG so the replay harness can reproduce Java's scripted
      // RNG state. Bare `(Random)` is unsupported; only the ranged form appears
      // in the parity corpus here.
      const rangeNode = positional[0];
      if (!rangeNode || !isList(rangeNode) || listHead(rangeNode) !== "range") {
        return { eval: () => OFF };
      }
      const loNode = rangeNode.items[1];
      const hiNode = rangeNode.items[2];
      if (!loNode || !hiNode) return { eval: () => OFF };
      const loFn = compileInt(loNode, env);
      const hiFn = compileInt(hiNode, env);
      return {
        eval: (ctx) => {
          const lo = loFn.eval(ctx);
          const hi = hiFn.eval(ctx);
          const min = Math.min(lo, hi);
          const max = Math.max(lo, hi);
          const span = max - min + 1;
          if (span <= 0) return min;
          return min + rngNextInt(ctx, span);
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

// Ludeme heads that produce an int *array* (not a scalar) and are stubbed in
// the scalar `compileInt` path. When one of these is the sole argument of an
// arithmetic op, Java folds the op over the array's elements via the
// `Add/Mul(IntArrayFunction)` constructor arm (e.g. Omega's
// `(* (sizes Group P1))` = product of P1's group sizes).
const INT_ARRAY_HEADS = new Set(["sizes", "results", "values"]);

// Fold an arithmetic op over the elements of an int array, matching Java's
// `IntArrayFunction` constructor arms: Add → sum (identity 0), Mul → product
// (identity 1). @java game.functions.ints.math.{Add,Mul}.
function foldArrayArith(op: string, vals: readonly number[]): number {
  if (op === "*" || op === "mul") {
    let p = 1;
    for (const v of vals) p *= v;
    return p;
  }
  // "+" and any other additive fold
  let s = 0;
  for (const v of vals) s += v;
  return s;
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
  const _r = head ? lookupLudeme("bool", head) : undefined;
  if (_r) return _r(node, env) as BoolFn;
  const rest = node.items.slice(1);
  switch (head) {
    case "and": {
      const args = flattenBoolList(rest).map((n) => compileBool(n, env));
      return { eval: (ctx) => args.every((a) => a.eval(ctx)) };
    }
    case "or": {
      const args = flattenBoolList(rest).map((n) => compileBool(n, env));
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
      let a = rest[0];
      let b = rest[1];
      // Java parity: a redundant-paren grouping like `(!= ((x) (y)))` — which
      // arises when a zero-arg define call sits as the first operand, e.g.
      // `(!= (("LeftMostEmpty") (to)))` (Ceelkoqyuqkoqiji / O An Quan) — wraps
      // both operands in an extra round list whose head is NOT a ludeme symbol
      // (its first item is itself a list). Ludii's reflective compiler treats a
      // non-symbol-headed group as a transparent grouping and binds its children
      // as the two operands. Splice it so the two operands surface instead of
      // throwing "needs two arguments" (which silently drops the expression).
      if (
        b === undefined &&
        a &&
        isList(a) &&
        a.delimiter === "round" &&
        a.items.length === 2 &&
        a.items[0] &&
        !isIdent(a.items[0])
      ) {
        b = a.items[1];
        a = a.items[0];
      }
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
        const visitedFlag = env.visitedFlag;
        return {
          eval: (ctx) => {
            if (canMoveProbing) return false;
            canMoveProbing = true;
            try {
              // Java parity (CanMove.eval, requiresVisited branch): before
              // probing the sub-moves, temporarily mark the last move's from/to
              // as visited so a continuation cannot re-use the site the moving
              // piece just left or arrived on (Fanorona/Vela: forbids capturing
              // back along the move just made). Restored implicitly — the patch
              // lives only on the child frame.
              let probeCtx = ctx;
              if (visitedFlag?.required) {
                const lf = lastFromSite(ctx);
                const lt = lastToSite(ctx);
                if (lf >= 0 || lt >= 0) {
                  const aug = new Set(ctx.state.visited);
                  if (lf >= 0) aug.add(lf);
                  if (lt >= 0) aug.add(lt);
                  probeCtx = ctx.withFrame({ visited: aug });
                }
              }
              const probed = gen.generate(probeCtx);
              return probed.length > 0;
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
  const _r = lookupLudeme("bool", kind);
  if (_r) return _r(node, env) as BoolFn;
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
      // Java IsLine positional order after the length: an optional direction
      // (AbsoluteDirection ident or a {…}/(directions …) set) then an optional
      // `who` RoleType. Tell them apart so a role such as `Mover` is not parsed
      // as a (non-existent) direction — otherwise the line check matches nothing.
      let dirArg: LudNode | undefined;
      let whoName: string | undefined;
      for (const n of positional.slice(1)) {
        if (isIdent(n) && isLineWhoRole(n.name)) {
          whoName ??= n.name;
          continue;
        }
        dirArg ??= n;
      }
      const dirTokens = collectDirectionTokens(dirArg);
      // For graph boards a straight line follows topology edges (radials), not
      // Cartesian steps. Resolve the explicit direction name(s); with none, Java
      // defaults to Adjacent (all edge directions).
      const radialDirNames = lineRadialDirNames(dirArg);
      // Java IsLine `through:X` constrains the line to pass through pivot X and,
      // with no explicit `who`, uses the piece type AT X as the line's owner.
      // Morris capture filters (`if:(not (is Line 3 … through:(site)))`) depend
      // on this — without it every enemy site looks "in a line" and no capture
      // is generated.
      // Java IsLine constructor: `through` defaults to LastTo (the last-placed
      // site) — the line must pass through it — and `throughAny` is an explicit
      // region of candidate pivots. With neither, every check pivots on the
      // just-moved site (NOT a scan over all owned cells). `exact:True` requires
      // the maximal contiguous run through the pivot to equal `len` exactly.
      const throughNode = named.get("through");
      const throughFn = throughNode ? compileInt(throughNode, env) : undefined;
      const throughAnyNode = named.get("throughAny");
      const throughAnyFn = throughAnyNode
        ? compileRegion(throughAnyNode, env)
        : undefined;
      const exactNode = named.get("exact");
      const exactFn = exactNode ? compileBool(exactNode, env) : undefined;
      // Java IsLine `byLevel:True` (stacking games, e.g. Connect Four / Score
      // Four / Complica): the line is read against the stack model — a vertical
      // run inside one stack, a same-level run across radial-adjacent stacks, or
      // a diagonal run that climbs/descends one level per step. Dispatches to
      // `evalStack`'s byLevel branch instead of the flat-cell line scan.
      const byLevelNode = named.get("byLevel");
      const byLevelFn = byLevelNode ? compileBool(byLevelNode, env) : undefined;
      // Java IsLine `whats:`/`what:` — the explicit set of component `what`
      // indices that compose the line (a cell counts if its what is IN the set,
      // so e.g. a Disc owned by either player qualifies in Quarto/Yavalath).
      // `whats:` is a curly set; `what:` is a single index. When present this
      // overrides the `who`/default owner matching.
      const whatsNode = named.get("whats");
      const whatNode = named.get("what");
      let whatsFns: IntFn[] | undefined;
      if (whatsNode && isList(whatsNode) && whatsNode.delimiter === "curly") {
        whatsFns = whatsNode.items.map((n) => compileInt(n, env));
      } else if (whatNode) {
        whatsFns = [compileInt(whatNode, env)];
      }
      // Java IsLine `throughHowMuch:` (default 1) — minimum number of *distinct*
      // component what-values the line must contain. `useOpposites:` (default
      // true) — whether to extend the run through the opposite radial.
      const throughHowMuchNode = named.get("throughHowMuch");
      const throughHowMuchFn = throughHowMuchNode
        ? compileInt(throughHowMuchNode, env)
        : undefined;
      const useOppositesNode = named.get("useOpposites");
      const useOppositesFn = useOppositesNode
        ? compileBool(useOppositesNode, env)
        : undefined;
      // Java IsLine `if:` (default True) — a per-site predicate checked at every
      // site on the candidate line (the pivot and each extension), evaluated
      // with `context.setTo(site)`. A site only extends the line when it both
      // holds a matching piece and satisfies this condition. Quarto's value/
      // state lines use `if:(= 0 (state at:(to)))` etc. so a run counts only
      // when *every* piece shares that attribute.
      const lineIfNode = named.get("if");
      const lineIfFn = lineIfNode ? compileBool(lineIfNode, env) : undefined;
      return {
        eval: (ctx) => {
          const len = lenFn.eval(ctx);
          if (!Number.isInteger(len) || len <= 0) return false;
          const exact = exactFn ? exactFn.eval(ctx) : false;
          const explicitOwner =
            whoName !== undefined ? resolveLineOwner(whoName, ctx) : undefined;
          const matchSet =
            whatsFns !== undefined
              ? new Set(whatsFns.map((f) => f.eval(ctx)))
              : undefined;
          const throughHowMuch = throughHowMuchFn
            ? throughHowMuchFn.eval(ctx)
            : 1;
          const useOpposites = useOppositesFn ? useOppositesFn.eval(ctx) : true;
          if (byLevelFn?.eval(ctx)) {
            if (throughAnyFn) {
              for (const pivot of throughAnyFn.eval(ctx)) {
                if (
                  hasLineThroughByLevel(
                    ctx, len, radialDirNames, dirTokens, pivot, explicitOwner, exact,
                  )
                )
                  return true;
              }
              return false;
            }
            const pivot = throughFn ? throughFn.eval(ctx) : lastToSite(ctx);
            return hasLineThroughByLevel(
              ctx, len, radialDirNames, dirTokens, pivot, explicitOwner, exact,
            );
          }
          if (throughAnyFn) {
            for (const pivot of throughAnyFn.eval(ctx)) {
              if (
                hasLineThrough(
                  ctx, len, dirTokens, radialDirNames, pivot, explicitOwner,
                  exact, matchSet, throughHowMuch, useOpposites, lineIfFn,
                )
              )
                return true;
            }
            return false;
          }
          const pivot = throughFn ? throughFn.eval(ctx) : lastToSite(ctx);
          return hasLineThrough(
            ctx, len, dirTokens, radialDirNames, pivot, explicitOwner,
            exact, matchSet, throughHowMuch, useOpposites, lineIfFn,
          );
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
    case "Visited": {
      // (is Visited <site>) — whether a site was already touched (both from and
      // to) by a move in the current same-player sequence. Faithful to Java
      // IsVisited.eval (`context.state().isVisited(site)`). The per-turn visited
      // set lives on State: cleared on turn change and accumulated when the
      // mover repeats (LudemeGame.apply), and temporarily augmented with the
      // last move's from/to during `(can Move …)` (CanMove.eval's requiresVisited
      // branch). An evaluation that carries `ctx.frame.visited` (the can-Move
      // augmentation) reads that; otherwise it reads `state.visited`.
      if (env.visitedFlag) env.visitedFlag.required = true;
      const visSiteNode = dropSiteType(positional)[0];
      const visSiteFn = visSiteNode
        ? compileInt(visSiteNode, env)
        : { eval: (ctx: EvalContext) => ctx.frame.to ?? lastToSite(ctx) };
      return {
        eval: (ctx) => {
          const s = visSiteFn.eval(ctx);
          if (s < 0) return false;
          return (ctx.frame.visited ?? ctx.state.visited).has(s);
        },
      };
    }
    case "Empty": {
      const siteNode = dropSiteType(positional)[0];
      if (!siteNode)
        throw new LudemeCompileError("(is Empty <site>) needs a site.");
      const site = compileInt(siteNode, env);
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          if (s < 0 || s >= ctx.state.cells.length) return false;
          // Java parity: emptiness is what-based, so a neutral piece
          // (who == 0, what > 0) reads as occupied, not empty.
          return ctx.state.isEmptySite(s);
        },
      };
    }
    case "Occupied": {
      const siteNode = dropSiteType(positional)[0];
      if (!siteNode)
        throw new LudemeCompileError("(is Occupied <site>) needs a site.");
      const site = compileInt(siteNode, env);
      return {
        eval: (ctx) => {
          const s = site.eval(ctx);
          if (s < 0 || s >= ctx.state.cells.length) return false;
          return ctx.state.isOccupiedSite(s);
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
      // `(is Next <role>)` — Java `IsNext.eval` is `who == state.next()`. Java's
      // `state.next()` is the player set to move next: after a `(moveAgain)`/
      // SetNextPlayer it is the same mover (the override), otherwise the
      // rotational successor. TS stores 0 as the "no override pending" sentinel
      // (the turn rotation resets `next` to 0), so read the override when set and
      // fall back to the cyclic successor — mirroring `(next)` above. This is what
      // lets `(nextPhase Mover (not (is Next Mover)) …)` keep the same phase
      // through a same-turn continuation (Mangola's Opening1 sow chain).
      const whoNode = positional[0];
      if (!whoNode) return { eval: () => true };
      const who = compileInt(whoNode, env);
      const target = (ctx: EvalContext): number =>
        ctx.state.next > 0
          ? ctx.state.next
          : (ctx.mover % ctx.context.game.numPlayers) + 1;
      return { eval: (ctx) => who.eval(ctx) === target(ctx) };
    }
    case "Prev": {
      // `(is Prev <role>)` — is the role the player who made the previous move?
      // The `"SameTurn"` idiom `(is Prev Mover)` relies on this being true when
      // a `(moveAgain)` keeps the same player moving, so the previous player
      // must come from the trial's last move, not a static cyclic predecessor
      // (which for two players is always the opponent and so never matches the
      // mover). Falls back to 0 ("nobody", Java's initial state.prev) before
      // any move is made, so it is false on the very first move of a trial.
      const whoNode = positional[0];
      if (!whoNode) return { eval: () => true };
      const who = compileInt(whoNode, env);
      const target = (ctx: EvalContext): number => {
        // `applyHypothetical` (used to fold `(then (if (NewTurn) (moveAgain)))`
        // at generation time) stashes the pre-apply previous mover here so this
        // matches Java's `state.prev()` — the predecessor ply's mover — rather
        // than the candidate move that was just recorded as the trial's last.
        if (ctx.frame.prevMover !== undefined) return ctx.frame.prevMover;
        const last = ctx.context.trial.lastMove();
        if (last) return last.mover;
        // Before any move Java's `state.prev` is its initial 0 ("nobody"), so
        // `(is Prev <role>)` is false at game start (IsPrev.eval == state.prev()).
        return 0;
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
      // Java IsThreatened: when a `what` (component) is given without an
      // explicit `at:` site, the threatened square is located via WhereSite —
      // i.e. wherever that component currently sits. The engine tracks per-site
      // component identity (`whatAtSite`), so `(is Threatened (id "King" Next))`
      // ("IsInCheck") can find the king's square and test whether any enemy can
      // capture it. Drop a leading SiteType so the `what` spec is positional[0].
      const pieceNode = atFn ? undefined : dropSiteType(positional)[0];
      const whatFn = pieceNode ? compileInt(pieceNode, env) : undefined;
      return {
        eval: (ctx) => {
          if (threatProbing) return false;
          const targets: number[] = [];
          if (atFn) {
            const s = atFn.eval(ctx);
            if (s >= 0) targets.push(s);
          } else if (whatFn) {
            // Locate the named component (Java: WhereSite(what)); a what < 1 is
            // "no such piece" → not threatened.
            const w = whatFn.eval(ctx);
            if (w < 1) return false;
            for (let s = 0; s < ctx.state.cells.length; s += 1) {
              if (ctx.state.whatAtSite(s) === w) targets.push(s);
            }
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
          // Java IsThreatened probes `players.get(owner).enemies()`, i.e. only
          // players NOT on the threatened piece's team. Teams are folded into the
          // per-player value array (ActionAddPlayerToTeam → withValuePlayer), so
          // a player whose non-zero team value matches a target owner's team is a
          // teammate and must be skipped — otherwise a 4-player/2-team variant
          // (e.g. Chatrang) sees an ally adjacent to the king as a "threat".
          // Team-less games leave every team value at 0, so this guard never
          // fires and every other player remains an enemy, as before.
          // Team ids assigned by `(set Team …)` are positive; "no team" reads as
          // the UNDEFINED default (-1) — or 0 in legacy seeds — so only a value
          // `> 0` denotes a real team. A team-less owner contributes no team and
          // every non-owner remains an enemy, exactly as in a team-less game.
          const targetTeams = new Set<number>();
          for (const owner of targetOwners) {
            const team = ctx.state.valuePlayer(owner);
            if (team > 0) targetTeams.add(team);
          }
          threatProbing = true;
          try {
            for (let p = 1; p <= n; p += 1) {
              if (targetOwners.has(p)) continue;
              const pTeam = ctx.state.valuePlayer(p);
              if (pTeam > 0 && targetTeams.has(pTeam)) continue;
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
    case "Flat": {
      // (is Flat [<site>]) — Shibumi pyramidal support test. Mirrors Java
      // IsFlat: a vertex on the base layer is always flat; otherwise it is flat
      // iff every vertex directly beneath it (one layer down, at x±0.5, y±0.5)
      // is occupied. The four supports are recovered geometrically from site
      // elevation (z) because the TS graph stores no cross-layer edges. On
      // planar boards every site has z==0 (layer 0), so this is always true —
      // identical to the previous unconditional behaviour, hence no regression.
      const siteNode = dropSiteType(positional)[0];
      const siteFn = siteNode ? compileInt(siteNode, env) : undefined;
      const DZ = 1 / Math.SQRT2;
      const TOL = 0.01;
      return {
        eval: (ctx) => {
          const site = siteFn
            ? siteFn.eval(ctx)
            : ctx.frame.to ?? lastToSite(ctx);
          if (site < 0 || site >= ctx.board.numSites) return true;
          const layer = Math.round(ctx.board.zOf(site) / DZ);
          if (layer <= 0) return true;
          const sx = ctx.board.xOf(site);
          const sy = ctx.board.yOf(site);
          const targetZ = (layer - 1) * DZ;
          for (let s = 0; s < ctx.board.numSites; s += 1) {
            if (Math.abs(ctx.board.zOf(s) - targetZ) > TOL) continue;
            const dx = Math.abs(ctx.board.xOf(s) - sx);
            const dy = Math.abs(ctx.board.yOf(s) - sy);
            if (Math.abs(dx - 0.5) > TOL || Math.abs(dy - 0.5) > TOL) continue;
            // A supporting vertex directly beneath the target; if empty the
            // piece would not rest flat.
            if (ctx.state.isEmptySite(s)) return false;
          }
          return true;
        },
      };
    }
    case "Triggered": {
      // (is Triggered "<event>" <player>) — a named trigger fired for a player.
      // Java IsTriggered → `state.isTriggered(event, who)`, which ignores the
      // event name and tests only the player's trigger bit (set by ActionTrigger
      // / `(trigger …)`). Resolve the player arg (role ident or int expr).
      const playerNode = positional[1];
      if (!playerNode) return { eval: () => false };
      const playerFn = isIdent(playerNode)
        ? { eval: (ctx: EvalContext) => resolveRole(playerNode.name, ctx) }
        : compileInt(playerNode, env);
      return { eval: (ctx) => ctx.state.isTriggered(playerFn.eval(ctx)) };
    }
    case "Proposed":
      // (is Proposed "<proposition>") — a vote proposition is active. No voting
      // subsystem is modelled; conservatively false.
      return { eval: () => false };
    case "Decided":
      // (is Decided "<proposition>") — companion of (is Proposed …). No voting
      // state; conservatively false.
      return { eval: () => false };
    case "Within": {
      // (is Within <pieceId> [type] <locn>|in:<region>) — the specific
      // component type currently occupies a site in the region (Java IsWithin).
      // `pieceId` is a component `what` (typically `(id "Name")`); the area to
      // test comes from `in:`, else a positional location/region, else defaults
      // to the last-to site. True iff some target site holds exactly that what.
      const pieceNode = positional[0];
      if (!pieceNode) return { eval: () => false };
      const pieceFn = compileInt(pieceNode, env);
      const inNode = named.get("in");
      const locNode = positional[1];
      let areaFn: RegionFn;
      if (inNode) {
        areaFn = compileRegion(inNode, env);
      } else if (locNode && isList(locNode)) {
        areaFn = compileRegion(locNode, env);
      } else if (locNode) {
        const siteFn = compileInt(locNode, env);
        areaFn = { eval: (ctx) => { const s = siteFn.eval(ctx); return s >= 0 ? [s] : []; } };
      } else {
        areaFn = { eval: (ctx) => { const s = lastToSite(ctx); return s >= 0 ? [s] : []; } };
      }
      return {
        eval: (ctx) => {
          const pid = pieceFn.eval(ctx);
          if (pid < 0) return false;
          return areaFn
            .eval(ctx)
            .some((s) => s >= 0 && ctx.state.whatAtSite(s) === pid);
        },
      };
    }
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
    case "Tree": {
      // (is Tree <role>) — Java IsTree: the subgraph of edges still coloured
      // with the role's component is acyclic (a forest). Union-find over the
      // graph vertices; a colour-matching edge whose endpoints already share a
      // root closes a cycle ⇒ false. @java game.functions.booleans.is.tree.IsTree
      const roleNode = positional[0];
      const roleName =
        roleNode && isIdent(roleNode) ? roleNode.name : "Neutral";
      return {
        eval: (ctx) => {
          const traj = ctx.board.traj;
          if (!traj) return false;
          const lastTo = ctx.context.trial.lastMove()?.to() ?? OFF;
          if (lastTo < 0) return false; // Java: LastTo == OFF ⇒ false
          let whoSiteId = resolveHandRole(roleName, ctx);
          if (whoSiteId === 0) {
            const w = ctx.state.whatAtSite(lastTo);
            whoSiteId = w === 0 ? 1 : w; // neutral default (Java IsTree:69-75)
          }
          const nV = traj.vertexCount;
          const parent = new Array<number>(nV);
          for (let i = 0; i < nV; i += 1) parent[i] = i;
          const find = (x: number): number => {
            let r = x;
            while (parent[r] !== r) r = parent[r] as number;
            return r;
          };
          // Java walks edges high→low; order is irrelevant for cycle detection.
          for (let k = traj.numSites - 1; k >= 0; k -= 1) {
            if (ctx.state.whatAtSite(k) !== whoSiteId) continue;
            const ep = traj.edgeEndpoints(k);
            if (!ep) continue;
            const ra = find(ep[0]);
            const rb = find(ep[1]);
            if (ra === rb) return false; // cycle present ⇒ not a tree/forest
            parent[ra] = rb;
          }
          return true;
        },
      };
    }
    case "RegularGraph": {
      // (is RegularGraph <role> [k:<int>] [odd:<bool>] [even:<bool>]) — Java
      // IsRegularGraph: every vertex has the same degree in the subgraph of
      // edges coloured with the role's component (k-regular when k: given). The
      // degree set per vertex matches Java's BitSet (distinct neighbours).
      // @java game.functions.booleans.is.regularGraph.IsRegularGraph
      const roleNode = positional[0];
      const roleName = roleNode && isIdent(roleNode) ? roleNode.name : "Mover";
      const kNode = named.get("k");
      const kFn = kNode ? compileInt(kNode, env) : undefined;
      const oddNode = named.get("odd");
      const evenNode = named.get("even");
      const oddFn = oddNode ? compileBool(oddNode, env) : undefined;
      const evenFn = evenNode ? compileBool(evenNode, env) : undefined;
      return {
        eval: (ctx) => {
          const traj = ctx.board.traj;
          if (!traj) return false;
          const lastTo = ctx.context.trial.lastMove()?.to() ?? OFF;
          if (lastTo < 0) return false;
          let whoSiteId = resolveHandRole(roleName, ctx);
          if (whoSiteId === 0) {
            const w = ctx.state.whatAtSite(lastTo);
            whoSiteId = w === 0 ? 1 : w;
          }
          const nV = traj.vertexCount;
          const neigh: Set<number>[] = [];
          for (let i = 0; i < nV; i += 1) neigh.push(new Set<number>());
          for (let k = 0; k < traj.numSites; k += 1) {
            if (ctx.state.whatAtSite(k) !== whoSiteId) continue;
            const ep = traj.edgeEndpoints(k);
            if (!ep) continue;
            neigh[ep[0]]?.add(ep[1]);
            neigh[ep[1]]?.add(ep[0]);
          }
          const kVal = kFn ? kFn.eval(ctx) : 0;
          let deg = kVal;
          if (kVal === 0) {
            for (let i = 0; i < nV; i += 1) {
              const card = neigh[i]?.size ?? 0;
              if (card !== 0) {
                deg = card;
                break;
              }
            }
          }
          for (let i = 0; i < nV; i += 1) {
            if (deg !== (neigh[i]?.size ?? 0)) return false;
          }
          if (oddFn?.eval(ctx)) return deg % 2 === 1;
          if (evenFn?.eval(ctx)) return deg % 2 === 0;
          return true;
        },
      };
    }
    case "Path":
    case "TreeCentre":
    case "SpanningTree":
    case "CaterpillarTree":
      // Remaining graph-theory win predicates (experimental graph_theory games).
      // Their property checks aren't modelled yet, so compile to constant false:
      // the game builds and the goal simply never triggers.
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
      // IsTarget.java:118 — state.what(site, type) === config[i] in site order.
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
                ctx.state.whatAtSite(s) === config[i],
            );
          },
        };
      }
      return {
        eval: (ctx) => {
          const config = configFns.map((fn) => fn.eval(ctx));
          if (ctx.state.cells.length < config.length) return false;
          return config.every(
            (expected, i) => ctx.state.whatAtSite(i) === expected,
          );
        },
      };
    }
    case "SidesMatch":
      // (is SidesMatch [to:<site>]) — Java IsSidesMatch.java checks that every
      // orthogonal neighbour of the just-placed tile has matching track colours
      // at the shared edge. This needs tile path/colour data (Component.paths /
      // .terminus / .numTerminus) which is not yet modelled in the TS engine.
      // Stub TRUE so the placement passes its `ifAfterwards` filter (stubbing
      // false would block every Trax move); the colour constraint is unenforced.
      return { eval: () => true };
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
    // (all Passed) — true when every player passed on their previous
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
function compileNo(node: LudList, env: CompileEnv): BoolFn {
  const kindNode = node.items[1];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "";
  const roleNode = node.items[2];
  if (kind === "Pieces") {
    // Java game.functions.booleans.no.pieces.NoPieces signature:
    //   (no Pieces [type] [<role>|of:<int>] ["Name"] [in:<region>])
    // It iterates the owner's pieces and returns false on the first one that
    // (a) is owned by a player in the role's id-set, (b) lies inside `in:` when
    // given, and (c) matches the component "Name" when given. We must honour the
    // `in:<region>` filter — without it `(no Pieces Mover in:R)` tested the whole
    // board, e.g. rejecting a legal Tourne-Case race move whose blocking-square
    // check looked only at the destination span.
    const args = parseArgs(node.items.slice(2));
    const ofNode = args.named.get("of");
    const inNode = args.named.get("in");
    const regionFn = inNode ? compileRegion(inNode, env) : undefined;
    let roleName: string | undefined;
    let nameStr: string | undefined;
    for (const p of args.positional) {
      if (isIdent(p)) {
        const n = p.name;
        // A leading SiteType (Cell/Vertex/Edge) selects the graph element; only
        // board cells are modelled, so it carries no extra filtering here.
        if (n === "Cell" || n === "Vertex" || n === "Edge") continue;
        if (roleName === undefined) roleName = n;
      } else if (isString(p) && nameStr === undefined) {
        nameStr = p.value;
      }
    }
    // Component-name identity is not modelled per-type in this engine, so a
    // `"Name"` filter conservatively assumes such pieces exist (eval false),
    // matching the prior behaviour of `(no Pieces "Name")`.
    if (nameStr !== undefined) return { eval: () => false };

    const everyone =
      roleName === undefined ? ofNode === undefined : roleName === "All";
    const pidFn = ofNode ? compileInt(ofNode, env) : undefined;
    const pred =
      !everyone && roleName !== undefined && roleName !== "All"
        ? ownerPredicate(roleName)
        : undefined;
    return {
      eval: (ctx) => {
        const cells = ctx.state.cells;
        const occupied = (s: number): boolean => {
          if (s < 0 || s >= cells.length) return false;
          const c = cells[s] ?? 0;
          if (everyone) return ctx.state.isOccupiedSite(s);
          if (pidFn) return c !== 0 && c === pidFn.eval(ctx);
          return c !== 0 && pred!(c, ctx);
        };
        if (regionFn) {
          for (const s of regionFn.eval(ctx)) if (occupied(s)) return false;
          return true;
        }
        for (let s = 0; s < cells.length; s += 1) if (occupied(s)) return false;
        return true;
      },
    };
  }
  if (kind === "Moves") {
    if (roleNode && isIdent(roleNode)) {
      const role = roleNode.name;
      // Java NoMoves.eval (game.functions.booleans.no.moves.NoMoves):
      //  - RoleType.Next is a special case that *freshly* recomputes the next
      //    player's stalemate status (switch mover, computeStalemated), because
      //    the cached flag is only correct after we switch to that player.
      //  - every other role reads the *cached* `state.isStalemated(playerId)`
      //    flag, which is maintained by the move loop / forced-pass handling.
      // We must NOT freshly recompute for non-Next roles: doing so would test a
      // player's moves in their *current* (often pre-phase-switch) phase at the
      // wrong time, firing end conditions a turn early (e.g. Bagh Bandi, where
      // `(no Moves P1)` would wrongly fire the instant P1 empties its hand).
      if (role === "Next") {
        return {
          eval: (ctx) => {
            if (noMovesProbing) return false;
            // Java NoMoves.eval(RoleType.Next) temporarily switches the context
            // to `state.next()` and computes stalemate there (NoMoves.java
            // 57-88). That differs from generic `Next` role resolution in our
            // then-contexts, which intentionally uses the cyclic successor to
            // avoid leaking `(moveAgain)` overrides into unrelated `(sites Next)`
            // lookups. For `(no Moves Next)` we must follow Java's special case
            // exactly: use the current next-player override when present, else
            // fall back to the rotational successor.
            const target =
              ctx.state.next > 0
                ? ctx.state.next
                : (ctx.mover % ctx.context.game.numPlayers) + 1;
            if (target <= 0) return false;
            const altContext = ctx.context.withState(
              ctx.state.withMover(target),
            );
            noMovesProbing = true;
            try {
              // Use the RAW play moves, not `game.moves()`: the latter appends
              // a forced Pass for a stalemated player (Java Trial.setLegalMoves),
              // which would mask the no-moves condition. Java's NoMoves.eval
              // mirrors this by going through `computeStalemated`/`canMove`.
              const g = ctx.context.game;
              const raw = g.legalMovesRaw
                ? g.legalMovesRaw(altContext)
                : g.moves(altContext);
              return raw.length === 0;
            } finally {
              noMovesProbing = false;
            }
          },
        };
      }
      return {
        eval: (ctx) => {
          const target = resolveRole(role, ctx);
          if (target <= 0 || target >= ctx.state.stalemated.length) return false;
          return ctx.state.stalemated[target] === true;
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

/**
 * Circular (rotational-basis) direction tokens. On a concentric/pivoted board
 * these curve along the topology and have no fixed Cartesian (dx,dy), so moves
 * using them must walk the graph radials rather than a straight-line offset.
 */
const CIRCULAR_TOKENS = new Set(["Rotational", "In", "Out", "CW", "CCW"]);

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
      // Java game.functions.directions.Directions: alongside the positional
      // absolute/relative direction(s), the relative-direction constructor
      // takes named args `of:<RelationType>` and `bySite:<Boolean>`. `of:` is
      // the *base relation* the relative cone expands over (default Adjacent —
      // Directions.java:173); it is NOT itself a direction. The lexer emits a
      // named arg as an ident ending in ':' followed by its value, so a naive
      // flatten of `(directions Forwards of:All)` yields ["Forwards","of:",
      // "All"] and then resolves "All" as an independent 8-way group unioned
      // with the Forwards cone — over-generating. Carry `of:` through as a
      // single `of:<Rel>` token (consumed by resolveDirectionTokens to pick the
      // base relation) and drop every other named arg with its value.
      const tokens: string[] = [];
      const items = node.items.slice(1);
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (!item) continue;
        if (isIdent(item)) {
          if (item.name === "~") continue;
          if (item.name.endsWith(":")) {
            const value = items[i + 1];
            const valueName = value && isIdent(value) ? value.name : undefined;
            if (item.name === "of:" && valueName !== undefined) {
              tokens.push(`of:${valueName}`);
            }
            i += 1; // consume the named-arg value
            continue;
          }
          tokens.push(item.name);
        } else if (isList(item)) {
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

/** RoleType names that may appear in the positional `who` slot of `(is Line …)`
 * (as opposed to a direction). Anything else positional is treated as a
 * direction. `All` is intentionally absent: in `(is Line N All)` it names the
 * all-directions category, not a role. */
function isLineWhoRole(name: string): boolean {
  return (
    name === "Mover" ||
    name === "Next" ||
    name === "Prev" ||
    name === "Enemy" ||
    name === "Friend" ||
    name === "Mine" ||
    name === "Neutral" ||
    /^P\d+$/.test(name) ||
    /^Team\d+$/.test(name)
  );
}

/** The absolute-direction name(s) named by an `(is Line …)` direction argument,
 * for the graph (radial) line search. A bare ident is one direction; a
 * `{…}`/`(directions …)` set lists several; with no argument Java defaults to
 * `Adjacent` (every edge direction). */
function lineRadialDirNames(dirArg: LudNode | undefined): readonly string[] {
  if (dirArg === undefined) return ["Adjacent"];
  if (isIdent(dirArg)) return [dirArg.name];
  const names = rawDirectionTokens(dirArg);
  return names.length > 0 ? names : ["Adjacent"];
}

/** Resolve the owning player whose pieces form the line. Mirrors Java
 * `RoleType.toIntFunction(who)`; with no `who` the owner is the mover (Java
 * default `whats = what(pivot)`, i.e. the just-moved piece, which the mover
 * owns). */
function resolveLineOwner(
  whoName: string | undefined,
  ctx: EvalContext,
): number {
  if (whoName === undefined || whoName === "Mover") return ctx.mover;
  if (whoName === "Next") {
    const n = ctx.context.game.numPlayers;
    return (ctx.mover % n) + 1;
  }
  const m = /^P(\d+)$/.exec(whoName);
  if (m) return Number(m[1]);
  return ctx.mover;
}


/**
 * True if a straight line of `len` pieces passes THROUGH `pivot`. Mirrors Java
 * `IsLine` with a `through:` pivot: the line owner is `explicitOwner` when a
 * `who` role was given, otherwise the owner of the piece sitting at the pivot
 * (Java `whats = what(pivot)`). An empty pivot can never anchor a line.
 */
function hasLineThrough(
  ctx: EvalContext,
  len: number,
  dirTokens: readonly string[],
  radialDirNames: readonly string[],
  pivot: number,
  explicitOwner: number | undefined,
  exact: boolean,
  matchSet?: ReadonlySet<number>,
  throughHowMuch = 1,
  useOpposites = true,
  condFn?: { eval: (ctx: EvalContext) => boolean },
): boolean {
  // Java IsLine.eval builds the set of "matching" pieces once per pivot:
  //   • `whats:`/`what:` given → an explicit set of component `what` indices;
  //                            a cell counts if its `what` is IN that set, so
  //                            pieces of *different* what (e.g. a Disc owned by
  //                            either player in Quarto/Yavalath) all qualify;
  //   • `who` given          → every component owned by `who` (i.e. the line
  //                            matches by OWNER — use the who-array `cells`);
  //   • neither who nor what  → exactly the component sitting on the pivot
  //                            (`whats = {what(pivot)}` — match by the per-site
  //                            COMPONENT `what`, NOT the owner).
  // The default-component case is what distinguishes games where one player owns
  // several components: Tic Tactics' player 1 plays both Disc (what=1) and Cross
  // (what=3), so an owner-based run of {Disc,Disc,Cross} is NOT a line, but a
  // run of three Discs is. For single-component-per-player games component and
  // owner coincide, so this is identical to the old who-array behaviour.
  //
  // `throughHowMuch` (Java default 1): the run must contain at least this many
  // *distinct* component `what` values (Spree's throughHowMuch:2). `useOpposites`
  // (Java default true): also extend the count through the opposite radial.
  const cells = ctx.state.cells;
  if (pivot < 0 || pivot >= cells.length) return false;
  const whats = ctx.state.whats ?? cells;
  // `matches(cell)` decides whether a cell extends the line; `whatOf(cell)`
  // gives the distinct-value key for the throughHowMuch tally.
  let matches: (cell: number) => boolean;
  const matchArr =
    explicitOwner !== undefined ? cells : whats;
  if (matchSet !== undefined) {
    // Explicit whats/what set: pivot must itself hold a piece in the set.
    if (!matchSet.has(whats[pivot] ?? 0)) return false;
    matches = (c) => matchSet.has(whats[c] ?? 0);
  } else {
    const owner = explicitOwner ?? matchArr[pivot] ?? 0;
    if (owner <= 0) return false;
    // Java `if (!whats.contains(whatLocn)) continue` — the pivot must itself
    // hold a matching piece for a line to run through it.
    if (matchArr[pivot] !== owner) return false;
    matches = (c) => matchArr[c] === owner;
  }
  // Java IsLine `if:` predicate, evaluated per-site with `context.setTo(site)`.
  // The pivot itself must satisfy it (Java line 247 returns false otherwise);
  // every extension site must too, so it folds into `matches`.
  if (condFn !== undefined) {
    if (!condFn.eval(ctx.withFrame({ to: pivot }))) return false;
    const baseMatches = matches;
    matches = (c) => baseMatches(c) && condFn.eval(ctx.withFrame({ to: c }));
  }
  // Distinct-value tally for throughHowMuch (only meaningful >1). We collect the
  // component `what` of every matched cell on the candidate run.
  const meetsThrough = (seen: Set<number>): boolean =>
    throughHowMuch <= 1 || seen.size >= throughHowMuch;
  const board = ctx.board;
  const traj = board.traj;
  if (traj !== undefined) {
    if (
      radialDirNames.includes("SameLayer") &&
      hasGeometricSameLayerLineThrough(
        ctx, len, pivot, matches, exact, whats, meetsThrough, useOpposites,
      )
    ) {
      return true;
    }
    // Pivot-centric bidirectional walk, mirroring Java IsLine: for each distinct
    // radial from the pivot, count the contiguous owned run outward, then extend
    // through each opposite radial. Non-exact succeeds as soon as the run
    // reaches `len`; exact requires the full contiguous run to equal `len`.
    for (const name of radialDirNames) {
      for (const { ray, opposites } of traj.distinctRadialsByName(pivot, name)) {
        let count = 1; // the pivot itself
        const seen = new Set<number>([whats[pivot] ?? 0]);
        for (let i = 1; i < ray.length; i += 1) {
          const c = ray[i] as number;
          if (!matches(c)) break; // contiguous
          count += 1;
          seen.add(whats[c] ?? 0);
        }
        if (!exact && count >= len && meetsThrough(seen)) return true;
        if (opposites.length === 0 || !useOpposites) {
          if (count === len && meetsThrough(seen)) return true;
          continue;
        }
        for (const opp of opposites) {
          let oppositeCount = count;
          const oppSeen = new Set<number>(seen);
          for (let i = 1; i < opp.length; i += 1) {
            const c = opp[i] as number;
            if (!matches(c)) break; // contiguous
            oppositeCount += 1;
            oppSeen.add(whats[c] ?? 0);
          }
          if (
            (exact ? oppositeCount === len : oppositeCount >= len) &&
            meetsThrough(oppSeen)
          )
            return true;
        }
      }
    }
    return false;
  }
  // Cartesian/lattice: walk both directions of each axis out from the pivot,
  // which inherently includes the pivot in the count — the full bidirectional
  // contiguous run is the line through the pivot on that axis. (useOpposites
  // false restricts the run to a single direction from the pivot.)
  const dirs = resolveDirectionTokens(dirTokens, ctx);
  const axes: Array<[number, number]> = [];
  for (const d of dirs) {
    if (useOpposites && axes.some(([ax, ay]) => ax === -d.dx && ay === -d.dy))
      continue;
    if (axes.some(([ax, ay]) => ax === d.dx && ay === d.dy)) continue;
    axes.push([d.dx, d.dy]);
  }
  const x = board.xOf(pivot);
  const y = board.yOf(pivot);
  for (const [dx, dy] of axes) {
    let count = 1;
    const seen = new Set<number>([whats[pivot] ?? 0]);
    let nx = x + dx;
    let ny = y + dy;
    while (true) {
      const site = board.siteAt(nx, ny);
      if (site === OFF || !matches(site)) break;
      count += 1;
      seen.add(whats[site] ?? 0);
      nx += dx;
      ny += dy;
    }
    if (useOpposites) {
      nx = x - dx;
      ny = y - dy;
      while (true) {
        const site = board.siteAt(nx, ny);
        if (site === OFF || !matches(site)) break;
        count += 1;
        seen.add(whats[site] ?? 0);
        nx -= dx;
        ny -= dy;
      }
    }
    if ((exact ? count === len : count >= len) && meetsThrough(seen)) return true;
  }
  return false;
}

function hasGeometricSameLayerLineThrough(
  ctx: EvalContext,
  len: number,
  pivot: number,
  matches: (cell: number) => boolean,
  exact: boolean,
  whats: readonly number[],
  meetsThrough: (seen: Set<number>) => boolean,
  useOpposites: boolean,
): boolean {
  const board = ctx.board;
  const pivotZ = board.zOf(pivot);
  if (Math.abs(pivotZ) < 1e-9) {
    let hasRaisedSite = false;
    for (let s = 0; s < board.numSites; s += 1) {
      if (Math.abs(board.zOf(s)) > 1e-9) {
        hasRaisedSite = true;
        break;
      }
    }
    if (!hasRaisedSite) return false;
  }

  const px = board.xOf(pivot);
  const py = board.yOf(pivot);
  const sameLayer: number[] = [];
  for (let s = 0; s < board.numSites; s += 1) {
    if (s === pivot) continue;
    if (Math.abs(board.zOf(s) - pivotZ) > 1e-6) continue;
    const dx = board.xOf(s) - px;
    const dy = board.yOf(s) - py;
    if (Math.hypot(dx, dy) <= 1e-9) continue;
    sameLayer.push(s);
  }
  if (sameLayer.length === 0) return false;

  const axes = new Map<string, { ux: number; uy: number }>();
  for (const s of sameLayer) {
    const dx = board.xOf(s) - px;
    const dy = board.yOf(s) - py;
    const mag = Math.hypot(dx, dy);
    let ux = dx / mag;
    let uy = dy / mag;
    if (ux < -1e-9 || (Math.abs(ux) <= 1e-9 && uy < -1e-9)) {
      ux = -ux;
      uy = -uy;
    }
    const key = `${Math.round(ux * 1e6)}:${Math.round(uy * 1e6)}`;
    axes.set(key, { ux, uy });
  }

  const walk = (axis: { ux: number; uy: number }, sign: 1 | -1): number[] => {
    const ray: { site: number; dist: number }[] = [];
    for (const s of sameLayer) {
      const dx = board.xOf(s) - px;
      const dy = board.yOf(s) - py;
      const projection = sign * (dx * axis.ux + dy * axis.uy);
      if (projection <= 1e-7) continue;
      const cross = Math.abs(dx * axis.uy - dy * axis.ux);
      if (cross > 1e-6) continue;
      ray.push({ site: s, dist: projection });
    }
    ray.sort((a, b) => a.dist - b.dist);
    const out: number[] = [];
    for (const { site } of ray) {
      if (!matches(site)) break;
      out.push(site);
    }
    return out;
  };

  for (const axis of axes.values()) {
    const seen = new Set<number>([whats[pivot] ?? 0]);
    let count = 1;
    for (const s of walk(axis, 1)) {
      count += 1;
      seen.add(whats[s] ?? 0);
    }
    if (!exact && count >= len && meetsThrough(seen)) return true;
    if (!useOpposites) {
      if (count === len && meetsThrough(seen)) return true;
      continue;
    }
    const oppSeen = new Set<number>(seen);
    let oppositeCount = count;
    for (const s of walk(axis, -1)) {
      oppositeCount += 1;
      oppSeen.add(whats[s] ?? 0);
    }
    if (
      (exact ? oppositeCount === len : oppositeCount >= len) &&
      meetsThrough(oppSeen)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Faithful port of Java `IsLine.evalStack` byLevel branch (stacking games such
 * as Connect Four, Score Four, Complica, Agilidade). The line is evaluated
 * against the stack model rather than flat top-of-cell ownership:
 *
 *   1. a vertical run of `len` within the pivot's own stack;
 *   2. a same-level run across radial-adjacent stacks at `levelOrigin`;
 *   3. a diagonal run that descends one level per step (level −1/+1);
 *   4. a diagonal run that ascends one level per step (level +1/−1).
 *
 * `whats` (the owners that count toward the line) is the explicit `who` role
 * when given, otherwise the owner of the top piece sitting at the pivot. The
 * per-radial walks, opposite-radial extensions, and the (deliberately faithful)
 * Java quirks — primary loop from step 0, opposites from step 1, the `count`
 * vs `oppositeCount` check on the descending branch, and the shared `diffLevel`
 * across opposite radials — are reproduced exactly so upstream Java edits map
 * straight onto this code.
 */
function hasLineThroughByLevel(
  ctx: EvalContext,
  len: number,
  radialDirNames: readonly string[],
  dirTokens: readonly string[],
  pivot: number,
  explicitOwner: number | undefined,
  exact: boolean,
): boolean {
  const state = ctx.state;
  if (pivot < 0) return false;
  const sizeStack = state.stackSize(pivot);
  const topOwner = sizeStack > 0 ? state.stackAt(pivot, sizeStack - 1) : 0;
  const owner = explicitOwner ?? topOwner;
  if (owner <= 0) return false;
  // Java `whats.contains(state.what(index, level))`; here owners stand in for
  // component indices (one piece type per player in every byLevel game).
  const matches = (s: number, level: number): boolean =>
    level >= 0 && state.stackAt(s, level) === owner;

  // 1) Vertical line within the pivot's own stack (Java lines 766-791).
  if (sizeStack >= len) {
    const level = sizeStack - 2;
    let count = 1;
    for (let i = 0; i < len - 1; i += 1) {
      if (!matches(pivot, level - i)) break;
      count += 1;
      if (!exact && count === len) return true;
    }
    if (count === len) return true;
  }

  const levelOrigin = sizeStack - 1;
  if (levelOrigin < 0) return false;

  // Distinct straight radials from the pivot. Graph boards use the precomputed
  // trajectories; boards without them (e.g. Connect Four's 1×7 stacking board)
  // fall back to Cartesian axes built from the direction tokens, mirroring the
  // flat `hasLineThrough` fallback. Each radial's `ray[0]` is the pivot and each
  // opposite likewise starts at the pivot (so opposite loops begin at step 1).
  const radials: Array<{ ray: number[]; opposites: number[][] }> = [];
  const traj = ctx.board.traj;
  if (traj !== undefined) {
    for (const name of radialDirNames) {
      radials.push(...traj.distinctRadialsByName(pivot, name));
    }
  } else {
    const board = ctx.board;
    const px = board.xOf(pivot);
    const py = board.yOf(pivot);
    const dirs = resolveDirectionTokens(dirTokens, ctx);
    const axes: Array<[number, number]> = [];
    for (const d of dirs) {
      if (axes.some(([ax, ay]) => ax === -d.dx && ay === -d.dy)) continue;
      if (axes.some(([ax, ay]) => ax === d.dx && ay === d.dy)) continue;
      axes.push([d.dx, d.dy]);
    }
    const buildRay = (dx: number, dy: number): number[] => {
      const ray = [pivot];
      let nx = px + dx;
      let ny = py + dy;
      while (true) {
        const s = board.siteAt(nx, ny);
        if (s === OFF) break;
        ray.push(s);
        nx += dx;
        ny += dy;
      }
      return ray;
    };
    for (const [dx, dy] of axes) {
      radials.push({ ray: buildRay(dx, dy), opposites: [buildRay(-dx, -dy)] });
    }
  }

  for (const { ray, opposites } of radials) {
      // ---- Same level (Java lines 804-851) ----
      let count = 0;
      for (let ip = 0; ip < ray.length; ip += 1) {
        const index = ray[ip] as number;
        if (state.stackSize(index) <= levelOrigin) break;
        if (matches(index, levelOrigin)) {
          count += 1;
          if (!exact && count === len) return true;
        } else break;
      }
      if (opposites.length > 0) {
        for (const opp of opposites) {
          let oppositeCount = count;
          for (let ip = 1; ip < opp.length; ip += 1) {
            const index = opp[ip] as number;
            if (state.stackSize(index) <= levelOrigin) break;
            if (matches(index, levelOrigin)) {
              oppositeCount += 1;
              if (!exact && oppositeCount === len) return true;
            } else break;
          }
          if (oppositeCount === len) return true;
        }
      } else if (count === len) return true;

      // ---- level −1 / level +1 (Java lines 853-908) ----
      count = 0;
      let diffLevel = 0;
      for (let ip = 0; ip < ray.length; ip += 1) {
        if (levelOrigin - diffLevel === -1) continue;
        const index = ray[ip] as number;
        if (state.stackSize(index) <= levelOrigin - diffLevel) break;
        if (matches(index, levelOrigin - diffLevel)) {
          count += 1;
          diffLevel += 1;
          if (!exact && count === len) return true;
        } else break;
      }
      if (opposites.length > 0) {
        diffLevel = 1;
        for (const opp of opposites) {
          let oppositeCount = count;
          for (let ip = 1; ip < opp.length; ip += 1) {
            const index = opp[ip] as number;
            if (state.stackSize(index) <= levelOrigin + diffLevel) break;
            if (matches(index, levelOrigin + diffLevel)) {
              oppositeCount += 1;
              diffLevel += 1;
              if (!exact && oppositeCount === len) return true;
            } else break;
          }
          // Faithful: Java checks `count` (not `oppositeCount`) here.
          if (count === len) return true;
        }
      } else if (count === len) return true;

      // ---- level +1 / level −1 (Java lines 910-965) ----
      count = 0;
      diffLevel = 0;
      for (let ip = 0; ip < ray.length; ip += 1) {
        const index = ray[ip] as number;
        if (state.stackSize(index) <= levelOrigin + diffLevel) break;
        if (matches(index, levelOrigin + diffLevel)) {
          count += 1;
          diffLevel += 1;
          if (!exact && count === len) return true;
        } else break;
      }
      if (opposites.length > 0) {
        diffLevel = 1;
        for (const opp of opposites) {
          let oppositeCount = count;
          for (let ip = 1; ip < opp.length; ip += 1) {
            if (levelOrigin - diffLevel === -1) continue;
            const index = opp[ip] as number;
            if (state.stackSize(index) <= levelOrigin - diffLevel) break;
            if (matches(index, levelOrigin - diffLevel)) {
              oppositeCount += 1;
              diffLevel += 1;
              if (!exact && oppositeCount === len) return true;
            } else break;
          }
          if (oppositeCount === len) return true;
        }
      } else if (count === len) return true;
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
export function dropSiteType(positional: readonly LudNode[]): readonly LudNode[] {
  return isSiteTypeIdent(positional[0]) ? positional.slice(1) : positional;
}

/**
 * Resolve the target sites of an `(add …)` ludeme. Tries, in order: a named
 * `to:` region, a `(to [SiteType] <region|site>)` sub-list, a named `site:`
 * arg, and finally the first positional region. Returns `undefined` when no
 * placement target can be found.
 */
/**
 * Resolve an `(add (piece "Label" …))` label to its component `what` id and
 * owner, using the same label/suffix scheme as a `(place …)` start placement:
 * a direct hit wins; otherwise the trailing digits are the owner index and the
 * base name is the component (`"Ball0"` → owner 0, component "Ball"). Neutral
 * and Shared pieces (owner 0) therefore keep `who == 0` with a positive `what`,
 * matching Java's ContainerState. Returns undefined when the label is not a
 * known component, so the caller falls back to the dynamic `what`.
 */
export function resolveAddedPiece(
  label: string,
  env: CompileEnv,
): { what: number; owner: number } | undefined {
  const idByLabel = env.componentIdByLabel;
  if (!idByLabel) return undefined;
  let what = idByLabel.get(label);
  let owner = env.pieceOwner.get(label);
  const m = /^(.*?)(\d+)$/.exec(label);
  if (m?.[1] !== undefined && m[2] !== undefined) {
    if (what === undefined) what = idByLabel.get(m[1]);
    if (owner === undefined && env.pieceOwner.has(m[1])) owner = Number(m[2]);
  }
  if (what === undefined || what < 1) return undefined;
  if (owner === undefined) owner = env.componentOwnerById?.[what] ?? 0;
  return { what, owner };
}

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
    const { positional: toPos, named: toNamed } = parseArgs(toSub.items.slice(1));
    const regionArg = dropSiteType(toPos)[0];
    if (regionArg) {
      const r = tryRegion(regionArg);
      if (r) {
        // `(to <region> if:<cond>)` filters candidate destinations: Java Add
        // does `context.setTo(toSite); if (test == null || test.eval(context))`
        // for each site, so the condition reads the candidate as `(to)`.
        const toIfNode = toNamed.get("if") ?? toNamed.get("If");
        let toCond: BoolFn | undefined;
        if (toIfNode) {
          try {
            toCond = compileBool(toIfNode, env);
          } catch {
            toCond = undefined;
          }
        }
        if (toCond) {
          const cond = toCond;
          return {
            eval: (ctx) =>
              r
                .eval(ctx)
                .filter((s) => s >= 0 && cond.eval(ctx.withFrame({ to: s }))),
          };
        }
        return r;
      }
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
export function isRegionNode(node: LudNode): boolean {
  if (!isList(node)) return false;
  if (node.delimiter === "curly") return true;
  return REGION_HEADS.has(listHead(node) ?? "");
}

/**
 * Resolve a node that may be either a single site (an IntFunction) or a whole
 * region into a set of sites. Several ludemes (e.g. `(sites Around …)`) accept
 * both forms in Ludii.
 */
export function compileSiteOrRegion(node: LudNode, env: CompileEnv): RegionFn {
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
    return compileSiteList(node.items, env);
  }
  const head = listHead(node);
  const _r = head ? lookupLudeme("region", head) : undefined;
  if (_r) return _r(node, env) as RegionFn;
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
    case "mod":
    // `(value Player <role>)` is an IntFunction (a stored site index); promoted
    // to a one-element region where a region is expected, e.g. `(from (value …))`.
    case "value":
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
        return compileSiteList(inner.items, env);
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
    case "sizes": {
      // (sizes Group [type] [directions] [role | of:<int> | If:<bool>]
      //   [min:<int>] [isVisible:<bool>]) → an int array of the sizes of all
      // connected groups (Java: game.functions.intArray.sizes.SizesGroup). The
      // only SizesGroupType Java implements is `Group`; we return the sizes as
      // a numeric array so the usual consumer `(size Array (sizes …))` reads
      // the group *count*, and arithmetic over it reads the sizes. The flood
      // honours the chosen direction set (Allemande's "NoCrosscuts" compares
      // the mover's Orthogonal group count with its 8-connected All count).
      const disc = rest[0];
      if (!disc || !isIdent(disc) || disc.name !== "Group") {
        throw new LudemeCompileError(
          `Unsupported (sizes …) form: expected Group discriminator.`,
        );
      }
      const { positional, named } = parseArgs(rest.slice(1));
      let pi = 0;
      // Skip a leading SiteType ident (Cell/Vertex/Edge): one site space here.
      const t0 = positional[pi];
      if (t0 && isIdent(t0) && SITE_TYPE_IDENTS.has(t0.name)) pi += 1;
      // Optional direction: an ident naming a direction group, or a
      // {…}/(directions …) list. Java's slot order puts directions before the
      // role, so a direction-named leading ident is consumed here.
      let dirTokens: string[] = ["Adjacent"];
      const dnode = positional[pi];
      if (
        dnode &&
        ((isIdent(dnode) && SIZES_DIRECTION_NAMES.has(dnode.name)) ||
          isList(dnode))
      ) {
        const toks = rawDirectionTokens(dnode).filter((s) => !s.startsWith("#"));
        if (toks.length > 0) dirTokens = toks;
        pi += 1;
      }
      // Optional role ident, or named of:/If:.
      const roleNode = positional[pi];
      const roleName =
        roleNode && isIdent(roleNode) ? roleNode.name : undefined;
      const ofNode = named.get("of");
      const ofFn = ofNode ? compileInt(ofNode, env) : undefined;
      const ifNode = named.get("If") ?? named.get("if");
      const ifFn = ifNode ? compileBool(ifNode, env) : undefined;
      const minNode = named.get("min");
      const minFn = minNode ? compileInt(minNode, env) : undefined;
      // Java `allPieces`: no role/of/If, or role All/Shared → group every
      // occupied site regardless of owner.
      const allPieces =
        (!roleName && !ofFn && !ifFn) ||
        roleName === "All" ||
        roleName === "Shared";
      return {
        eval: (ctx): readonly number[] => {
          const min = minFn ? minFn.eval(ctx) : 0;
          const who = ofFn
            ? ofFn.eval(ctx)
            : roleName
              ? resolveRole(roleName, ctx)
              : OFF;
          const member = (site: number): boolean => {
            if (ifFn) return ifFn.eval(ctx.withFrame({ from: site, to: site }));
            if (allPieces) return (ctx.state.cells[site] ?? 0) !== 0;
            return (ctx.state.cells[site] ?? 0) === who;
          };
          const groups = groupComponentsWith(ctx, member, (s) =>
            aroundSites(ctx, s, dirTokens),
          );
          return groups
            .map((g) => g.size)
            .filter((sz) => sz >= min);
        },
      };
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
      // (expand origin:<intOrRegion> steps:<int>? <dirn>?) or legacy
      // (expand <region> steps:<int>? <dirn>?).
      // @java game.functions.region.math.Expand: with no direction, each layer
      // unions every site's full topology `adjacent()` set; with an absolute
      // direction it follows that direction's trajectory steps per layer.
      const { positional: expPos, named: expNamed } = parseArgs(rest);
      const originNode = expNamed.get("origin") ?? expPos[0];
      if (!originNode)
        throw new LudemeCompileError("(expand …) needs a region or origin.");
      const stepsNode = expNamed.get("steps");
      const stepsFn: IntFn = stepsNode
        ? compileInt(stepsNode, env)
        : { eval: () => 1 };
      // A trailing positional ident may name either an AbsoluteDirection
      // (N/S/E/W/NE/…), restricting expansion to that single direction's
      // trajectory, or a relation GROUP (Orthogonal/Diagonal/Adjacent/All),
      // restricting each layer's neighbour union to that group. Skip the
      // positional origin node and any ident that is neither (e.g. a SiteType).
      let dirName: string | undefined;
      let groupName: "Adjacent" | "Orthogonal" | "Diagonal" | "All" = "Adjacent";
      for (const p of expPos) {
        if (p === originNode || !isIdent(p)) continue;
        if (p.name === "Orthogonal" || p.name === "Orthogonals") {
          groupName = "Orthogonal";
          break;
        }
        if (p.name === "Diagonal" || p.name === "Diagonals") {
          groupName = "Diagonal";
          break;
        }
        if (p.name === "Adjacent") {
          groupName = "Adjacent";
          break;
        }
        if (p.name === "All") {
          groupName = "All";
          break;
        }
        if (directionByName(p.name) !== undefined) {
          dirName = p.name;
          break;
        }
      }
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
          if (dirName !== undefined && ctx.board.traj) {
            const traj = ctx.board.traj;
            const acc = new Set<number>(cur.filter((s) => s >= 0));
            let frontier = [...acc];
            for (let k = 0; k < steps; k += 1) {
              const next: number[] = [];
              for (const s of frontier) {
                for (const n of traj.steps(s, dirName)) {
                  if (!acc.has(n)) {
                    acc.add(n);
                    next.push(n);
                  }
                }
              }
              if (next.length === 0) break;
              frontier = next;
            }
            return [...acc];
          }
          for (let k = 0; k < steps; k += 1) cur = expandRegion(cur, ctx, groupName);
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
      // Java's region-filter ForEachSite calls only `context.setSite(site)`; it
      // leaves `(to)` untouched, so a predicate like `(!= (to) (site))` can
      // compare each candidate against an outer-bound `to` (e.g. the source
      // hole of an enclosing move-operator forEach Site). Binding `to` here too
      // would collapse that to `(!= s s)` and filter everything out.
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
              if (cond && !cond.eval(ctx.withFrame({ site: s }))) continue;
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
    case "players": {
      // (players …) as a region → a list of player indices. Java:
      // game.functions.region.sites.player (RoleType arg).
      //   • `(players TeamN)` → only the players assigned to team N via
      //     `(set Team N {…})`, read from per-player team ids (state.valuePlayer,
      //     seeded at start). Setichch's `(is In (mover) (players Team1))` needs
      //     this to route each team onto its own track — without it the arg was
      //     ignored, every mover read as "in Team1", and both teams ran CW.
      //   • any other arg (or none) → all players 1..numPlayers (prior behaviour).
      const teamArg = node.items[1];
      const teamMatch =
        teamArg && isIdent(teamArg) ? /^Team(\d+)$/.exec(teamArg.name) : null;
      if (teamMatch?.[1]) {
        const teamId = Number(teamMatch[1]);
        return {
          eval: (ctx) => {
            const out: number[] = [];
            const n = ctx.context.game.numPlayers;
            for (let p = 1; p <= n; p += 1) {
              if (ctx.state.valuePlayer(p) === teamId) out.push(p);
            }
            return out;
          },
        };
      }
      return {
        eval: (ctx) =>
          Array.from(
            { length: ctx.context.game.numPlayers },
            (_, i) => i + 1,
          ),
      };
    }
    default: {
      // A region slot fed an IntFunction (Java auto-promotes an IntFunction to a
      // one-element RegionFunction). The explicit cases above name the common int
      // heads, but any int-valued head reaches here — e.g. `(to (count Pips))`
      // in the dice-placement family (Tic-Tac-Die, Center, …) where `(count Pips)`
      // names the single destination cell. Try compileInt and promote on success;
      // compileInt itself throws on a genuinely unknown head (no permissive
      // fallback), so an un-portable region still surfaces as a compile error
      // rather than being silently mis-promoted.
      let intFn: IntFn;
      try {
        intFn = compileInt(node, env);
      } catch {
        throw new LudemeCompileError(`Unsupported region ludeme: (${head} …).`);
      }
      return {
        eval: (ctx) => {
          const s = intFn.eval(ctx);
          return s >= 0 ? [s] : [];
        },
      };
    }
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
  // `(sites)` with no argument is Java's SitesContext: the context's current
  // region, bound by `(forEach Group …)` (and similar) to the iteration's site
  // set. Falls back to empty when no region is bound.
  if (arg === undefined) {
    return { eval: (ctx) => ctx.frame.region ?? [] };
  }
  // `(sites {C3 D1 …})` / `(sites {0 1 2})` — an explicit list of sites,
  // possibly mixed with dynamic members like `(mapEntry …)` / `(var …)`.
  if (arg && isList(arg) && arg.delimiter === "curly") {
    return compileSiteList(arg.items, env);
  }
  // `(sites (values Remembered <name>?))` — a remembered-values region.
  if (arg && isList(arg) && listHead(arg) === "values") {
    return compileValuesRegion(arg);
  }
  // `(sites "Name")` — a named region declared by `(regions "Name" …)`.
  // A named region takes priority, but a string that is actually a board
  // coordinate (e.g. "J10") with no matching region is a single-site region
  // (Java Sites.construct: StringRoutines.isCoordinate → SitesCoords).
  if (arg && isString(arg)) {
    const name = arg.value;
    const coord = parseCoord(name);
    if (coord) {
      const { col, row } = coord;
      return {
        eval: (ctx) => {
          const named = env.namedRegions?.get(name);
          if (named) return named.eval(ctx);
          const s = ctx.board.siteAt(col, row);
          return s >= 0 ? [s] : [];
        },
      };
    }
    return {
      eval: (ctx) => env.namedRegions?.get(name)?.eval(ctx) ?? [],
    };
  }
  if (arg && isIdent(arg)) {
    const name = arg.name;
    const { positional, named } = parseArgs(node.items.slice(2));
    // Subtype-dispatch: a faithfully-transliterated `(sites <Subtype> …)` ludeme
    // registers under the compound key `sites:<Subtype>` (e.g. `sites:Around`).
    // Look it up first; fall through to the legacy switch when none is live.
    const _rsub = lookupLudeme("region", "sites:" + name);
    if (_rsub) return _rsub(node, env) as RegionFn;
    switch (name) {
      case "Empty":
        // Java parity: what-based emptiness — neutral pieces (who 0, what>0)
        // are *not* empty.
        return { eval: (ctx) => indicesWhereSite(ctx, (s) => ctx.state.isEmptySite(s)) };
      case "Occupied": {
        // (sites Occupied by:<role> [container:<name>]) scopes to one owner;
        // bare = all pieces. A `container:"Hand"` arg restricts the scan to
        // that role's hand cells instead of the whole board — without it the
        // hand query degenerates to every board piece, which is both wrong and
        // pathologically slow for drop games (shogi/chess pockets).
        //
        // Occupancy is what-based (Java): a site counts only if a piece sits on
        // it. The `by:` owner filter then narrows to that role's `who`; neutral
        // pieces carry who == 0, so `by:Neutral` matches occupied sites whose
        // owner is 0.
        const byNode = named.get("by");
        const ownerPred =
          byNode && isIdent(byNode) ? ownerPredicate(byNode.name) : undefined;
        // Java SitesOccupied builds its base set from `owned()` — registered
        // pieces (anchors) keyed by owner — never from raw per-cell occupancy.
        // So an owner-filtered query must test a *registered piece*
        // (`whatAtSite > 0`), not mere count occupancy: a large piece's body
        // cells carry only a count (who/what == 0) and must NOT be returned by
        // `by:Mover`/`by:Neutral` (they are reached, when needed, via the
        // anchor's footprint). A bare `(sites Occupied)` keeps count-aware
        // occupancy so seeded holes and tile bodies still register.
        const baseOccPred = ownerPred
          ? (s: number, ctx: EvalContext) =>
              ctx.state.whatAtSite(s) > 0 &&
              ownerPred(ctx.state.cells[s] ?? 0, ctx)
          : (s: number, ctx: EvalContext) => ctx.state.isOccupiedSite(s);
        // `component:<int>` — Java filters the occupied set to a *specific*
        // component index, so a site counts only when the piece sitting on it
        // is exactly that component (`whatAtSite == componentId`). Without this
        // the filter was silently dropped, so `(sites Occupied by:All
        // component:1)` returned every occupied site of every component — e.g.
        // Spuzzle's placement guard `(< (count Sites in:(intersection (sites
        // Around (to)) (sites Occupied by:All component:1))) 2)` over-counted
        // neighbours of the wrong colour and wrongly rejected legal drops.
        //
        // NAME-BASED `component:"<name>"`/`Component:"<name>"` is intentionally
        // NOT filtered here yet. A naive `baseNameById[whatAtSite]==name`
        // matches fine on the board (Spuzzle uses numeric, Parsi reads
        // board-only), but it regresses shogi: dropping a captured piece from
        // hand generates *no* drops at some plies (e.g. Shogi RandomTrial_0
        // ply 75, mover 2 drops from hand site 88) — a hand/captured-piece
        // `what` representation subtlety. Leaving the name form unfiltered
        // keeps the long-standing status quo (no regression) until the hand
        // representation is verified. Numeric is the only confirmed-safe form.
        const compNode = named.get("component");
        let componentPred:
          | ((s: number, ctx: EvalContext) => boolean)
          | undefined;
        if (compNode && !isString(compNode) && !isIdent(compNode)) {
          const cfn = compileInt(compNode, env);
          componentPred = (s, ctx) => ctx.state.whatAtSite(s) === cfn.eval(ctx);
        }
        const occPred = componentPred
          ? (s: number, ctx: EvalContext) =>
              componentPred(s, ctx) && baseOccPred(s, ctx)
          : baseOccPred;
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
                .handSites(resolveHandRole(roleName, ctx))
                .filter((s) => occPred(s, ctx)),
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
                  .filter((s) => occPred(s, ctx));
              }
              return indicesWhereSite(ctx, (s) => occPred(s, ctx));
            },
          };
        }
        return { eval: (ctx) => indicesWhereSite(ctx, (s) => occPred(s, ctx)) };
      }
      case "Board":
        return { eval: (ctx) => allSites(ctx) };
      case "Top":
        return { eval: (ctx) => sideRowSites(ctx, "y", true) };
      case "Bottom":
        return { eval: (ctx) => sideRowSites(ctx, "y", false) };
      case "Left":
        return { eval: (ctx) => sideRowSites(ctx, "x", false) };
      case "Right":
        return { eval: (ctx) => sideRowSites(ctx, "x", true) };
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
        // (sites LineOfSight [Piece|Empty|Farthest] [Cell|Vertex|Edge]
        // at:<site> [<dirs>]) → along each ray from <at>: the first piece seen
        // (default `Piece`, matching Java SitesLineOfSight's `typeLoS` default),
        // every empty site up to the first blocker (`Empty`), or the farthest
        // empty site (`Farthest`). The LoS-type and SiteType keywords are TYPED
        // grammar slots in Java, so a bare direction ident (`N`, `Diagonal`, …)
        // is NOT a type — only Piece/Empty/Farthest is. Directions default to
        // Adjacent (Java `Directions(Adjacent)`), and a direction passed as a
        // bare ident (not a `{…}` list) must still be honoured.
        const typeNode = positional.find(
          (p) => isIdent(p) && LOS_TYPE_IDENTS.has(p.name),
        );
        const losType = typeNode && isIdent(typeNode) ? typeNode.name : "Piece";
        const atNode = named.get("at");
        const atFn = atNode ? siteIntOf(atNode, env) : undefined;
        const dirNode = positional.find(
          (p) =>
            !(
              isIdent(p) &&
              (LOS_TYPE_IDENTS.has(p.name) || SITE_TYPE_IDENTS.has(p.name))
            ),
        );
        const tokens = dirNode ? collectDirectionTokens(dirNode) : ["Adjacent"];
        return {
          eval: (ctx) => {
            const at = atFn ? atFn.eval(ctx) : lastToSite(ctx);
            if (at < 0) return [];
            return lineOfSightSites(ctx, at, tokens, losType);
          },
        };
      }
      case "Hand": {
        // (sites Hand <role>?) → every cell index in that player's hand.
        // A missing role defaults to the mover (Chessence: `(sites Hand)`).
        const roleNode = positional[0];
        const roleName = roleNode && isIdent(roleNode) ? roleNode.name : "Mover";
        return {
          eval: (ctx) => ctx.board.handSites(resolveHandRole(roleName, ctx)),
        };
      }
      case "Start": {
        // `(sites Start (piece <indexExpr>))` → the initial placement sites of
        // the *component* `<indexExpr>` names. Java SitesStart.eval reads
        // `context.trial().startingPos().get(index)` where `index =
        // piece.component().eval()` — a component (`what`) index, NOT an owner.
        // The inner expr is always a component index: `(what at:(from))`,
        // `(id "Marker" Next)`, `(id "King" Mover)`. We resolve it through the
        // component-keyed start map (keyed by `what ?? owner`, matching what
        // `(what at:…)` returns). Bare `(sites Start)` unions every start site.
        const byComp = env.startSitesByComponent;
        const byOwner = env.startSitesByOwner;
        if (!byComp && !byOwner) return { eval: () => [] };
        const spec = positional[0];
        let indexFn: IntFn | undefined;
        if (spec && isList(spec)) {
          if (listHead(spec) === "piece") {
            const inner = spec.items[1];
            if (inner) indexFn = compileInt(inner, env);
          } else {
            indexFn = compileInt(spec, env);
          }
        }
        if (!indexFn) {
          // Bare `(sites Start)` — every start site of every component.
          const src = byComp ?? byOwner!;
          return {
            eval: () => {
              const all: number[] = [];
              for (const s of src.values()) all.push(...s);
              return all;
            },
          };
        }
        const idf = indexFn;
        return {
          eval: (ctx) => {
            const idx = idf.eval(ctx);
            // Component-keyed is the faithful lookup; fall back to the
            // owner-keyed map only when no component bucket exists (legacy
            // single-piece-per-player games where `what` was left undefined and
            // the index coincides with the owner id).
            const c = byComp?.get(idx);
            if (c !== undefined) return c;
            return byOwner?.get(idx) ?? [];
          },
        };
      }
      case "Track": {
        // (sites Track [Role/pid] [name] [from:] [to:]) — Java SitesTrack.
        // A string positional names a specific track; an ident positional is a
        // role whose owner selects the track. With a name, Java picks the FIRST
        // track whose name *equals* it (owner-agnostic), else the first whose
        // name *contains* it AND is owned by the player (or shared). Without a
        // name: every distinct site across the player's (or shared) tracks.
        let roleName: string | undefined;
        let trackName: string | undefined;
        for (const p of positional) {
          if (roleName === undefined && isIdent(p)) roleName = p.name;
          else if (trackName === undefined && isString(p)) trackName = p.value;
        }
        // `from:`/`to:` carve a contiguous slice out of the resolved track in
        // track order, wrapping past the end for loop tracks (Java SitesTrack:
        // walk forward from the `from:` site's index, adding sites through the
        // `to:` site inclusive; if `to` lies before `from` on the track, keep
        // walking from index 0). Circuit-completion tests rely on this — e.g.
        // Tasholiwe's `(is In (mapEntry "Start" Mover) (sites Track "TrackCCW"
        // from:("NextSite" (last From)) to:(last To)))` is only true when the
        // move actually traversed the player's start site. Without this the
        // handler returned the WHOLE track, so the `(is In …)` was always true.
        const fromNode = named.get("from");
        const toNode = named.get("to");
        let fromFn: IntFn | undefined;
        let toFn: IntFn | undefined;
        if (fromNode) {
          try {
            fromFn = compileInt(fromNode, env);
          } catch {
            fromFn = undefined;
          }
        }
        if (toNode) {
          try {
            toFn = compileInt(toNode, env);
          } catch {
            toFn = undefined;
          }
        }
        return {
          eval: (ctx) => {
            const tracks = ctx.board.tracks;
            if (tracks.length === 0) return [];
            const playerId =
              roleName !== undefined ? resolveRole(roleName, ctx) : 0;
            const pickTrack = (): MancalaTrack | undefined => {
              if (trackName !== undefined) {
                return (
                  tracks.find((tr) => tr.name === trackName) ??
                  tracks.find(
                    (tr) =>
                      tr.name.includes(trackName as string) &&
                      (tr.owner === playerId || tr.owner === 0),
                  )
                );
              }
              return tracks.find(
                (tr) => tr.owner === playerId || tr.owner === 0,
              );
            };
            if (fromFn || toFn) {
              const track = pickTrack();
              if (!track) return [];
              const elems = track.sites;
              const from = fromFn ? fromFn.eval(ctx) : -1;
              const to = toFn ? toFn.eval(ctx) : -1;
              const out: number[] = [];
              let fromIndex = 0;
              if (from >= 0) {
                fromIndex = elems.indexOf(from);
                if (fromIndex < 0) return out; // `from` not on this track → empty
              }
              let toFound = false;
              for (let i = fromIndex; i < elems.length; i += 1) {
                const s = elems[i];
                if (s === undefined) continue;
                out.push(s);
                if (s === to) {
                  toFound = true;
                  break;
                }
              }
              if (!toFound) {
                for (let i = 0; i < fromIndex; i += 1) {
                  const s = elems[i];
                  if (s === undefined) continue;
                  out.push(s);
                  if (s === to) break;
                }
              }
              return out;
            }
            if (trackName !== undefined) {
              const t = pickTrack();
              return t ? [...t.sites] : [];
            }
            const seen = new Set<number>();
            const out: number[] = [];
            const want = roleName !== undefined ? playerId : undefined;
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
        // Positional args after the anchor are an optional RegionTypeDynamic
        // filter (Empty/NotEmpty/Own/Enemy/NotEnemy/NotOwn) and/or direction
        // tokens. Java (SitesAround) keeps a neighbour only if `what(to)` is in
        // the region-type's what-set — a what-based post-filter — and treats
        // everything else as a direction; the two are order-independent.
        let typeFilter:
          | ((s: number, ctx: EvalContext) => boolean)
          | undefined;
        const dirTokens: string[] = [];
        for (let i = 1; i < positional.length; i += 1) {
          const pn = positional[i];
          if (pn && isIdent(pn) && REGION_TYPE_DYNAMIC.has(pn.name)) {
            typeFilter = regionTypeDynamicFilter(pn.name, env);
            continue;
          }
          for (const t of rawDirectionTokens(pn).filter(
            (t) => !t.startsWith("#"),
          )) {
            dirTokens.push(t);
          }
        }
        // includeSelf:True keeps origin sites; Java default (false) removes
        // them from the result.
        const includeSelf = isTrueIdent(named.get("includeSelf"));
        // Optional `if:` filter, evaluated per candidate neighbour. Java
        // SitesAround.eval binds `context.setFrom(origin); context.setTo(to)`
        // before testing `cond.eval(context)`, so the condition reads the
        // origin as `(from)` and the neighbour as `(to)`. It is NOT applied to
        // origin sites kept via includeSelf (originIncluded is a separate flag).
        const aroundIfNode = named.get("if");
        let aroundCond: BoolFn | undefined;
        if (aroundIfNode) {
          try {
            aroundCond = compileBool(aroundIfNode, env);
          } catch {
            aroundCond = undefined;
          }
        }
        return {
          eval: (ctx) => {
            const originArr = region.eval(ctx);
            // Java SitesAround.eval: an empty region, or a first origin site of
            // UNDEFINED (-1), yields an empty Region — *before* includeSelf adds
            // anything. Without this, `(sites Around (var "X") … includeSelf:True)`
            // for an unset var (which now reads -1, per State.getValue) would
            // wrongly return [-1]. (SitesAround.java:140-144)
            if (originArr.length === 0 || originArr[0] === -1) return [];
            const origins = new Set(originArr);
            const seen = new Set<number>();
            const out: number[] = [];
            for (const s of origins) {
              for (const a of aroundSites(ctx, s, dirTokens)) {
                if (a < 0 || seen.has(a)) continue;
                if (!includeSelf && origins.has(a)) continue;
                if (typeFilter && !typeFilter(a, ctx)) continue;
                if (
                  aroundCond &&
                  !aroundCond.eval(ctx.withFrame({ from: s, to: a }))
                )
                  continue;
                seen.add(a);
                out.push(a);
              }
            }
            if (includeSelf) {
              for (const s of origins) {
                if (!seen.has(s) && (!typeFilter || typeFilter(s, ctx))) {
                  seen.add(s);
                  out.push(s);
                }
              }
            }
            return out;
          },
        };
      }
      // Role tokens (Mover/Next/P1…) name the player's declared region
      // from `(regions <Role> …)`; resolve through the env at eval time. A
      // trailing string — `(sites Mover "Home")` — selects that role's region
      // of that name from the per-player named table.
      case "Mover":
      case "Next":
      case "Prev": {
        const nameArg = positional[0];
        if (nameArg && isString(nameArg)) {
          return namedPlayerRegionLookup(
            (ctx) => resolveRole(name, ctx),
            nameArg.value,
            env,
          );
        }
        return playerRegionLookup((ctx) => resolveRole(name, ctx), env);
      }
      case "Player": {
        // (sites Player) → the iterated player's declared region;
        // (sites Player "Name") → THAT player's named region. Java
        // SitesEquipmentRegion.eval (Core …/region/sites/player/
        // SitesEquipmentRegion.java:85) resolves `who = index.eval(context)`
        // (here the `(forEach NonMover/Player …)`-bound player) and returns only
        // `regionsPerPlayer[who]` — that one player's owner-matched regions, not
        // a flat union over all players. Use the per-player table exactly like
        // the Mover/Next/Prev+name cases above; the old `namedRegions` union
        // made e.g. `(all Sites (sites Player "Home") if:(= 0 (count …)))` test
        // every player's holes at once, so Tsoro/Katrayo's `(forEach NonMover
        // if:"NoPiece" (result Player Loss))` never fired.
        const nameArg = positional[0];
        if (nameArg && isString(nameArg)) {
          return namedPlayerRegionLookup(
            (ctx) => resolveRole("Player", ctx),
            nameArg.value,
            env,
          );
        }
        return playerRegionLookup((ctx) => resolveRole("Player", ctx), env);
      }
      case "Pending":
        // (sites Pending) → sites flagged by (set Pending <site>).
        return { eval: (ctx) => [...ctx.state.pending] };
      case "ToClear":
        // (sites ToClear) → pieces queued for deferred removal during an
        // in-progress capture sequence (Java: SitesToClear → state
        // .regionToRemove()). Populated by `(remove … at:EndOfTurn)` and read
        // by the flying-king between-guard `(not (is In (between)
        // (sites ToClear)))` so a piece already hopped this turn isn't hopped
        // again.
        return { eval: (ctx) => [...ctx.state.sitesToRemove] };
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
        // no precomputed playability layer, so this is the empty on-board sites
        // (what-based emptiness, so neutral pieces block placement).
        return { eval: (ctx) => indicesWhereSite(ctx, (s) => ctx.state.isEmptySite(s)) };
      case "To": {
        // `(sites To <moves>)` (Java SitesTo) → the distinct destination sites
        // of a generated set of moves. Bare `(sites To)` falls back to the
        // current/last move's destination.
        const toMovesNode = positional.find((p) => isList(p));
        if (toMovesNode) {
          const mv = compileMoves(toMovesNode, env);
          return {
            eval: (ctx) => {
              const out = new Set<number>();
              for (const m of mv.generate(ctx)) {
                // Java SitesTo collects Move.toNonDecision(), not the decision
                // endpoint. @java Core/src/game/functions/region/sites/moves/SitesTo.java:48
                const s = m.toNonDecision();
                if (s >= 0) out.add(s);
              }
              return [...out];
            },
          };
        }
        return {
          eval: (ctx) => {
            const s = ctx.frame.to ?? lastToSite(ctx);
            return s >= 0 ? [s] : [];
          },
        };
      }
      case "From": {
        // `(sites From <moves>)` (Java SitesFrom) → the distinct origin sites of
        // a generated set of moves. Bare `(sites From)` falls back to the
        // current/last move's origin.
        const fromMovesNode = positional.find((p) => isList(p));
        if (fromMovesNode) {
          const mv = compileMoves(fromMovesNode, env);
          return {
            eval: (ctx) => {
              const out = new Set<number>();
              for (const m of mv.generate(ctx)) {
                // Java SitesFrom collects Move.fromNonDecision(), not the decision
                // endpoint. @java Core/src/game/functions/region/sites/moves/SitesFrom.java:48
                const s = m.fromNonDecision();
                if (s >= 0) out.add(s);
              }
              return [...out];
            },
          };
        }
        return {
          eval: (ctx) => {
            const s = ctx.frame.from ?? OFF;
            return s >= 0 ? [s] : [];
          },
        };
      }
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
        // connected same-owner component containing the seed site, via the
        // topology's Adjacent relation (orthoNeighbours).
        //
        // NOTE (deferred faithful rewrite): Java SitesGroup
        // (game.functions.region.sites.group.SitesGroup) is richer — it seeds
        // from `at:<int>` OR `from:<region>` (many seeds, unioned); joins a
        // neighbour iff `what==cs.what(to)` (same COMPONENT, no-condition) or the
        // `if:` condition holds; and walks the *specified* direction. A faithful
        // port was attempted and REVERTED: (a) it gave 0 bucket improvements —
        // the only games using `from:`/`if:`/`isVisible:` (Bug, Spargo, Bipod,
        // Chains of Thought) are blocked by an unrelated place-then-remove turn
        // structure, not by the group region; and (b) it regressed 10 trials
        // (Omny/Gyre/Span/Sponnect/Compart/OffShore) because honouring the
        // direction token via `aroundSites` diverges from `orthoNeighbours` on
        // graph boards (`traj.group("Orthogonal")` ≠ `traj.neighbours`), and the
        // default direction (DEFAULT_DIRECTIONS = Orthogonal+Diagonal, 8-way) is
        // not Java's `Adjacent`. The membership change (what- vs owner-based) is
        // bucket-neutral here: every Group game uses `Each` pieces, so `what`
        // partitions identically to owner. Re-attempt only after the turn
        // structure is fixed (so there is upside) AND the direction-token
        // resolution is verified to match Java on graph boards. See
        // /tmp/group-fix-plan.md.
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
      case "Crossing": {
        // (sites Crossing at:<edge> (<who>|<role>)) → every board edge that
        // geometrically crosses the at-edge AND matches the ownership filter.
        // @java game.functions.region.sites.crossing.SitesCrossing.
        //   • role/who resolves to whoSiteId; `All` → numPlayers+1.
        //   • whoSiteId == numPlayers+1: keep edges with what(k) != 0 (any piece).
        //   • else (a player id): keep edges with who(k) == whoSiteId.
        //   • whoSiteId == 0 on a non-graph game returns empty (Java: null).
        const atNode = named.get("at");
        const atFn = atNode ? siteIntOf(atNode, env) : undefined;
        const roleNode = positional[0];
        const roleName =
          roleNode && isIdent(roleNode) ? roleNode.name : "All";
        // @java Common MathRoutines.isCrossing — segment-intersection with a
        // 0.01 endpoint margin (shared endpoints / T-junctions do NOT count).
        const EPSILON = 0.0000001;
        const MARGIN = 0.01;
        const isCrossing = (
          a0x: number, a0y: number, a1x: number, a1y: number,
          b0x: number, b0y: number, b1x: number, b1y: number,
        ): boolean => {
          const xlk = a1x - a0x;
          const ylk = a1y - a0y;
          const xnm = b1x - b0x;
          const ynm = b1y - b0y;
          const xmk = b0x - a0x;
          const ymk = b0y - a0y;
          const det = xnm * ylk - ynm * xlk;
          if (Math.abs(det) < EPSILON) return false; // parallel
          const detinv = 1.0 / det;
          const s = (xnm * ymk - ynm * xmk) * detinv;
          const t = (xlk * ymk - ylk * xmk) * detinv;
          return s > MARGIN && s < 1 - MARGIN && t > MARGIN && t < 1 - MARGIN;
        };
        return {
          eval: (ctx) => {
            const traj = ctx.board.traj;
            if (!traj) return [];
            const from = atFn ? atFn.eval(ctx) : lastToSite(ctx);
            if (from < 0) return [];
            const numPlayers = ctx.context.game.numPlayers;
            const whoSiteId =
              roleName === "All" || roleName === "Shared" || roleName === "Each"
                ? numPlayers + 1
                : resolveHandRole(roleName, ctx);
            if (whoSiteId === 0) return []; // Java: non-graph game ⇒ null
            const aPts = traj.edgeEndpointPts(from);
            if (!aPts) return [];
            const [a0x, a0y, a1x, a1y] = aPts;
            const out: number[] = [];
            for (let k = 0; k < traj.numSites; k += 1) {
              if (k === from) continue;
              const owned =
                whoSiteId === numPlayers + 1
                  ? ctx.state.whatAtSite(k) !== 0
                  : (ctx.state.cellAt(k).owner ?? 0) === whoSiteId;
              if (!owned) continue;
              const bPts = traj.edgeEndpointPts(k);
              if (!bPts) continue;
              const [b0x, b0y, b1x, b1y] = bPts;
              if (isCrossing(a0x, a0y, a1x, a1y, b0x, b0y, b1x, b1y)) {
                out.push(k);
              }
            }
            return out;
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
          : { eval: (ctx: EvalContext) => indicesWhereSite(ctx, (s) => ctx.state.isEmptySite(s)) };
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
              const s = ctx.board.siteAtLabel(coord.col, coord.row);
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
      case "LastTo": {
        // (sites LastTo) — the singleton region of the last move's `to` site
        // (Java SitesLastTo). Used as `(is Line … throughAny:(sites LastTo))`.
        return {
          eval: (ctx) => {
            const s = lastToSite(ctx);
            return s >= 0 ? [s] : [];
          },
        };
      }
      case "LastFrom": {
        // (sites LastFrom) — the singleton region of the last move's `from`.
        return {
          eval: (ctx) => {
            const moves = ctx.context.trial.moves;
            const last = moves[moves.length - 1];
            const s = last ? last.from() : OFF;
            return s >= 0 ? [s] : [];
          },
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
          const nameArg = positional[0];
          if (nameArg && isString(nameArg)) {
            return namedPlayerRegionLookup(() => pid, nameArg.value, env);
          }
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
  losType: string,
): number[] {
  // Faithful to Java game.functions.region.sites.lineOfSight.SitesLineOfSight:
  // walk each direction's radial from `at` (skipping `at` itself) and, per
  // `typeLoS`, collect the empty sites (`Empty`), the farthest empty site
  // (`Farthest`), or the first occupied site (`Piece`, the default). On a
  // square Cell board the radial is the straight (dx,dy) ray.
  const board = ctx.board;
  const dirs = resolveDirectionTokens(
    tokens.length > 0 ? tokens : ["Adjacent"],
    ctx,
  );
  const empty = losType === "Empty";
  const farthest = losType === "Farthest";
  const out = new Set<number>();
  for (const d of dirs) {
    let x = board.xOf(at);
    let y = board.yOf(at);
    let prevTo = -1; // last empty site seen along this ray
    for (;;) {
      x += d.dx;
      y += d.dy;
      const s = board.siteAt(x, y);
      if (s < 0) {
        // Ray ran off the board: Java's Farthest stores the radial's final
        // empty step (here the last in-board empty site).
        if (farthest && prevTo !== -1) out.add(prevTo);
        break;
      }
      const occupied = (ctx.state.cells[s] ?? 0) !== 0;
      if (empty) {
        if (!occupied) out.add(s);
      } else if (farthest) {
        if (occupied && prevTo !== -1) out.add(prevTo);
      } else if (occupied) {
        // Piece (default): the first occupied site in each direction.
        out.add(s);
      }
      if (occupied) break;
      prevTo = s;
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** Predicate matching a cell owner against a role name (Mover/Enemy/Pn…). */
/** Java RegionTypeDynamic tokens (game/types/board/RegionTypeDynamic.java) that
 * select a what-based subset of sites: Empty / NotEmpty / Own / NotOwn / Enemy
 * / NotEnemy. Used by `(sites Around …)` as a neighbour post-filter. */
const REGION_TYPE_DYNAMIC = new Set<string>([
  "Empty",
  "NotEmpty",
  "Own",
  "NotOwn",
  "Enemy",
  "NotEnemy",
]);

/**
 * Build a what-based site predicate for a Java RegionTypeDynamic token,
 * mirroring SitesAround.convertRegion + the `typeRegionTo.contains(state.what(to))`
 * test. Ownership is read from each site's component (`what`), not its `who`,
 * so neutral pieces (owner 0) are classed by their component owner. The shared
 * player index is `numPlayers + 1` (Java `game.players().size()`).
 */
function regionTypeDynamicFilter(
  token: string,
  env: CompileEnv,
): ((site: number, ctx: EvalContext) => boolean) | undefined {
  const ownerById = env.componentOwnerById;
  const sharedIdx = env.numPlayers + 1;
  // Owner of the component occupying `site`, or -1 if the site is empty.
  const ownerAt = (site: number, ctx: EvalContext): number => {
    const what = ctx.state.whatAtSite(site);
    if (what <= 0) return -1;
    return ownerById?.[what] ?? 0;
  };
  switch (token) {
    case "Empty":
      return (s, ctx) => ctx.state.isEmptySite(s);
    case "NotEmpty":
      return (s, ctx) => ctx.state.isOccupiedSite(s);
    case "Own":
      return (s, ctx) => {
        const o = ownerAt(s, ctx);
        return o >= 0 && (o === ctx.mover || o === sharedIdx);
      };
    case "NotEnemy":
      // Mover-owned or shared (the complement of Enemy among occupied sites).
      return (s, ctx) => {
        const o = ownerAt(s, ctx);
        return o >= 0 && (o === ctx.mover || o === sharedIdx);
      };
    case "Enemy":
      return (s, ctx) => {
        const o = ownerAt(s, ctx);
        return o > 0 && o !== ctx.mover && o < sharedIdx;
      };
    case "NotOwn":
      return (s, ctx) => {
        const o = ownerAt(s, ctx);
        return o >= 0 && o !== ctx.mover && o !== sharedIdx;
      };
    default:
      return undefined;
  }
}

function ownerPredicate(
  role: string,
): (cell: number, ctx: EvalContext) => boolean {
  switch (role) {
    case "All":
      // Java PlayersIndices.getIdPlayers(RoleType.All) loops pid 0..numPlayers
      // inclusive — every player AND neutral (id 0). So a `by:All` query is
      // "any owner at all"; paired with the caller's what-based occupancy guard
      // it returns every registered piece regardless of owner. Without this
      // case the role fell through to `() => false`, so `(sites Occupied
      // by:All)` was permanently empty — forcing a Pass at ply 1 in the
      // board/space placement cluster (Abande etc., whose Add condition tests
      // `(count Sites in:(intersection … (sites Occupied by:All)))`).
      return () => true;
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
    case "TeamMover":
    case "TeamNonMover": {
      // Java RoleType.TeamMover / TeamNonMover resolve via
      // PlayersIndices.getIdPlayers to every player on the mover's team. When no
      // teams are declared (`(set Team …)` never runs, so every player's team id
      // reads 0) each player is their own team, so TeamMover == Mover. Without
      // this the predicate fell through to `() => false`, making
      // `(no Pieces TeamMover)` permanently true — the `("EscapeTeamWin")` race
      // games (Nyout/Pachisi/Chaupar/…) then "ended" at ply 1 with the wrong
      // winner (the mover, rather than whoever actually escaped first).
      const want = role === "TeamMover";
      return (c, ctx) => {
        if (c < 1) return false;
        const moverTeam = ctx.state.valuePlayer(ctx.mover);
        const sameTeam =
          moverTeam > 0
            ? ctx.state.valuePlayer(c) === moverTeam
            : c === ctx.mover;
        return want ? sameTeam : !sameTeam;
      };
    }
    case "Neutral":
    case "Shared":
      // Java maps RoleType.Neutral/Shared to Constants.NOBODY (player 0), but
      // the TS engine registers neutral/shared components — and seeds their
      // sites' `who` — under the neutral owner id `numPlayers + 1` (see
      // assignComponent and `seedOwner`). Match both: 0 (Java-style) and
      // numPlayers+1 (the TS convention used by every seed/sow placement), so
      // `(sites Occupied by:Neutral)` / `by:Shared` finds the seeded markers
      // (Nim, mancala seeds, neutral blockers). Paired with a what-based
      // occupancy test, so empty sites (also who==0) are excluded.
      return (c, ctx) => c === 0 || c === ctx.context.game.numPlayers + 1;
    default: {
      // `by:TeamN` — a cell counts when its owner is a player assigned to team
      // N (`(set Team N {…})`, read from state.valuePlayer). Setichch's
      // `(from (sites Occupied by:Team1))` picks every teammate's piece; without
      // this the predicate fell through to `() => false` and the from-set was
      // empty, forcing a Pass at ply 0.
      const teamMatch = /^Team(\d+)$/.exec(role);
      if (teamMatch?.[1]) {
        const teamId = Number(teamMatch[1]);
        return (c, ctx) => c >= 1 && ctx.state.valuePlayer(c) === teamId;
      }
      const pid = resolveStaticRole(role);
      if (pid !== undefined) return (c) => c === pid;
      return () => false;
    }
  }
}

/** The board's centre cell(s): exact centre on odd dims, 2x2 on even. */
function centreSites(ctx: EvalContext): number[] {
  // Graph boards (star / merged / wedge / circle …) are not a rectangular
  // lattice, so the bounding-box midpoint is meaningless. Use Java's
  // MeasureGraph.measureGeometricCentre: the site minimising the sum of squared
  // distances to the perimeter (the most-central point of the boundary).
  const perim = ctx.board.perimeterSites();
  if (perim && perim.length > 0) return graphCentreSites(ctx, perim);
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

/**
 * Geometric centre of a graph board — Java MeasureGraph.measureGeometricCentre:
 * the site(s) whose summed squared distance to every perimeter site is minimal
 * (within tolerance 0.0001). Java additionally folds in corner sites; on the
 * symmetric boards this matters for, the corners are a subset of the perimeter
 * and do not shift the arg-min, so the perimeter alone reproduces Java's centre.
 */
function graphCentreSites(ctx: EvalContext, perim: readonly number[]): number[] {
  const board = ctx.board;
  const n = board.numSites;
  const px = perim.map((s) => board.xOf(s));
  const py = perim.map((s) => board.yOf(s));
  let minAcc = Number.POSITIVE_INFINITY;
  const acc = new Array<number>(n).fill(0);
  for (let s = 0; s < n; s += 1) {
    const x = board.xOf(s);
    const y = board.yOf(s);
    let sum = 0;
    for (let k = 0; k < px.length; k += 1) {
      const dx = x - (px[k] as number);
      const dy = y - (py[k] as number);
      sum += dx * dx + dy * dy;
    }
    acc[s] = sum;
    if (sum < minAcc) minAcc = sum;
  }
  const out: number[] = [];
  for (let s = 0; s < n; s += 1)
    if (Math.abs((acc[s] as number) - minAcc) < 0.0001) out.push(s);
  return out;
}

/** The four corner cells of a rectangular board. */
export function cornerSites(ctx: EvalContext): number[] {
  // Graph boards (hex / triangle / custom poly such as ConHex) are not a
  // rectangular lattice, so the bounding-box corners below are meaningless.
  // Java `(sites Corners)` reads the measured CORNER property; use the graph's
  // corner sites when available (undefined → fall through to the lattice path).
  const graphCorners = ctx.board.cornerSites?.();
  if (graphCorners && graphCorners.length > 0) return graphCorners;
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
export function outerSites(ctx: EvalContext): number[] {
  // Graph boards: Java `measureInnerOuter` sets OUTER == PERIMETER for vertices
  // (and marks a face OUTER when it touches a perimeter vertex). `perimeterSites`
  // already reproduces both, so use it; the bounding-box ring below is only
  // correct for plain rectangular lattices (where perimeterSites is undefined).
  const perim = ctx.board.perimeterSites?.();
  if (perim && perim.length > 0) return [...perim].sort((a, b) => a - b);
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
export function sideSites(ctx: EvalContext, dir: string): number[] {
  // Faithful path: graph boards carry per-side play-site lists computed from the
  // real perimeter (Java Topology.sides). On a slanted board (rhombus Hex,
  // triangle Y, …) the four sides are diagonal edges, so the bounding-box
  // row/column heuristic below picks the wrong cells. Prefer the measured sides
  // whenever the requested compass name was found; fall back to rows/columns
  // for lattice boards (no sideRegions) and for any name the board lacks.
  const measured = ctx.board.sideRegions?.[dir];
  if (measured) return [...measured];
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
export function lastToSite(ctx: EvalContext): number {
  const moves = ctx.context.trial.moves;
  const last = moves[moves.length - 1];
  return last ? last.to() : OFF;
}

export function lastFromSite(ctx: EvalContext): number {
  const moves = ctx.context.trial.moves;
  const last = moves[moves.length - 1];
  return last ? last.from() : OFF;
}

/** Orthogonally (edge-) adjacent on-board sites of `site`. */
export function orthoNeighbours(ctx: EvalContext, site: number): number[] {
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

/**
 * Java `game.functions.region.sites.LineOfSightType` enum members. Used to tell
 * the optional LoS-type keyword of `(sites LineOfSight …)` apart from a bare
 * direction ident (which is a typed `Direction` slot in Java, not a type).
 */
const LOS_TYPE_IDENTS = new Set(["Piece", "Empty", "Farthest"]);

/** Direction-group idents that may fill the optional `directions` slot of
 * `(sizes Group …)` (before the role). Used to disambiguate a leading
 * positional ident as a direction vs a role. */
const SIZES_DIRECTION_NAMES = new Set([
  "Orthogonal",
  "Orthogonals",
  "Diagonal",
  "Diagonals",
  "Adjacent",
  "All",
  "OffDiagonal",
]);

function isGroupDirectionNode(node: LudNode): boolean {
  if (isIdent(node)) return directionByName(node.name) !== undefined;
  if (!isList(node)) return false;
  const head = listHead(node);
  if (head === "directions") return true;
  if (node.delimiter === "curly") {
    return node.items.every(
      (item) => isIdent(item) && directionByName(item.name) !== undefined,
    );
  }
  return false;
}

function parseGroupDirectionArg(
  positional: readonly LudNode[],
  index: number,
): { readonly dirTokens?: readonly string[]; readonly nextIndex: number } {
  const node = positional[index];
  if (!node || !isGroupDirectionNode(node)) return { nextIndex: index };
  const tokens = rawDirectionTokens(node).filter((t) => !t.startsWith("#"));
  return {
    dirTokens: tokens.length > 0 ? tokens : ["Adjacent"],
    nextIndex: index + 1,
  };
}

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

type JavaStyleGroupFloodMode = "sameWhatWhenNoCondition" | "conditionOnly";

interface JavaStyleGroupFloodOptions {
  readonly dirTokens?: readonly string[];
  readonly seeds?: readonly number[];
  readonly condition?: BoolFn;
  readonly isVisible?: BoolFn;
  readonly min?: number;
  readonly mode: JavaStyleGroupFloodMode;
}

function javaStyleGroupNeighbours(
  ctx: EvalContext,
  site: number,
  dirTokens: readonly string[] | undefined,
): readonly number[] {
  // Java defaults these ludemes to AbsoluteDirection.Adjacent
  // (CountGroups.java:72-75, SizeGroup.java:67-69, SitesGroup.java:79-80).
  // The TS port historically used orthogonal topology neighbours when no
  // direction argument was supplied; keep that common case stable, and use the
  // direction-aware topology only for explicit direction arguments.
  return dirTokens ? aroundSites(ctx, site, dirTokens) : orthoNeighbours(ctx, site);
}

/**
 * Shared Java-style group flood for CountGroups, CountSizeBiggestGroup,
 * SizeGroup, and SitesGroup. It evaluates `if:` with `to`/`site` bound to each
 * candidate, and with `from` bound to the seed for seeded floods.
 */
function javaStyleGroupFlood(
  ctx: EvalContext,
  opts: JavaStyleGroupFloodOptions,
): Set<number>[] {
  const n = ctx.state.cells.length;
  const visible = opts.isVisible?.eval(ctx) === true;
  const occupiedUpward = (site: number): Set<number> => {
    const out = new Set<number>();
    for (const up of ctx.board.traj?.steps(site, "Upward") ?? []) {
      if (ctx.state.whatAtSite(up) !== 0) out.add(up);
    }
    return out;
  };
  const covered = (site: number): boolean => {
    if (!visible) return false;
    const x = ctx.board.xOf(site);
    const y = ctx.board.yOf(site);
    for (let other = 0; other < n; other += 1) {
      if (other <= site || ctx.state.whatAtSite(other) === 0) continue;
      if (
        Math.abs(ctx.board.xOf(other) - x) < 1e-9 &&
        Math.abs(ctx.board.yOf(other) - y) < 1e-9
      ) {
        return true;
      }
    }
    return false;
  };
  const hiddenConnection = (from: number, to: number): boolean => {
    if (!visible) return false;
    const fromUp = occupiedUpward(from);
    if (fromUp.size < 2) return false;
    let common = 0;
    for (const up of occupiedUpward(to)) {
      if (fromUp.has(up)) common += 1;
      if (common >= 2) return true;
    }
    return false;
  };
  const evalCondition = (site: number, seed?: number): boolean => {
    if (site < 0 || site >= n) return false;
    if (covered(site)) return false;
    if (!opts.condition) return ctx.state.isOccupiedSite(site);
    const frame =
      seed === undefined
        ? { to: site, site }
        : { from: seed, to: site, site };
    return opts.condition.eval(ctx.withFrame(frame));
  };
  const accepts = (
    site: number,
    seedWhat: number | undefined,
    seed?: number,
  ): boolean => {
    if (site < 0 || site >= n) return false;
    if (covered(site)) return false;
    if (opts.condition || opts.mode === "conditionOnly") {
      return evalCondition(site, seed);
    }
    return seedWhat !== undefined
      ? ctx.state.whatAtSite(site) === seedWhat
      : ctx.state.isOccupiedSite(site);
  };
  const floodOne = (start: number, sharedSeen?: Set<number>): Set<number> => {
    if (start < 0 || start >= n) return new Set();
    const seedWhat =
      opts.condition || opts.mode === "conditionOnly"
        ? undefined
        : ctx.state.whatAtSite(start);
    if (!accepts(start, seedWhat, start)) return new Set();
    const comp = new Set<number>([start]);
    sharedSeen?.add(start);
    const stack = [start];
    while (stack.length > 0) {
      const s = stack.pop() as number;
      for (const nb of javaStyleGroupNeighbours(ctx, s, opts.dirTokens)) {
        if (comp.has(nb) || sharedSeen?.has(nb)) continue;
        if (hiddenConnection(s, nb)) continue;
        if (!accepts(nb, seedWhat, start)) continue;
        comp.add(nb);
        sharedSeen?.add(nb);
        stack.push(nb);
      }
    }
    return comp;
  };

  const groups: Set<number>[] = [];
  if (opts.seeds) {
    for (const seed of opts.seeds) {
      const comp = floodOne(seed);
      if (comp.size >= (opts.min ?? 0)) groups.push(comp);
    }
    return groups;
  }

  const seen = new Set<number>();
  for (let start = 0; start < n; start += 1) {
    if (seen.has(start) || !accepts(start, undefined)) continue;
    const comp = floodOne(start, seen);
    if (comp.size >= (opts.min ?? 0)) groups.push(comp);
  }
  return groups;
}

/**
 * Connected components over the on-board sites satisfying `member`, using an
 * explicit direction-aware neighbour function (Java: SizesGroup / CountGroups
 * with a chosen `Direction`). `groupComponents` is the orthogonal-only special
 * case; this variant lets `(sizes Group All …)` flood across diagonals too.
 */
export function groupComponentsWith(
  ctx: EvalContext,
  member: (site: number) => boolean,
  neighbours: (site: number) => readonly number[],
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
      for (const nb of neighbours(s)) {
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
/**
 * Neighbours of `site` under a Java `RelationType` (Adjacent/Orthogonal/
 * Diagonal/All/OffDiagonal). Mirrors `Topology.preGenerateDistanceToEachElement…`
 * which BFS-expands `element.<relation>()`. On a square lattice `Adjacent` is the
 * 8 edge- AND corner-sharing cells (Java `Face.stepsTo`, encoded as the tiling's
 * `Adjacent` group = SQUARE_ALL); `Orthogonal` is the 4 edge-sharing ones.
 */
function relationNeighbours(
  ctx: EvalContext,
  site: number,
  relation: string,
): number[] {
  const board = ctx.board;
  // Graph boards expose only the drawn adjacency; use it for the
  // connectivity-class relations (Adjacent/All) and fall back to it otherwise.
  if (board.traj) return board.traj.neighbours(site);
  const groups = board.tiling.groups;
  const group =
    groups[relation] ?? groups.Adjacent ?? groups.All ?? groups.Orthogonal ?? [];
  const x = board.xOf(site);
  const y = board.yOf(site);
  const out: number[] = [];
  for (const d of group) {
    const n = board.siteAt(x + d.dx, y + d.dy);
    if (n >= 0) out.push(n);
  }
  return out;
}

/**
 * Java `(count Steps [relation] a b)` with no explicit step move: the precomputed
 * `Topology.distancesToOtherSite` matrix, a BFS over the `relation` neighbourhood
 * (default `Adjacent`). On a square board `Adjacent` is 8-connected, so two
 * diagonally-touching cells are 1 step apart — the rule Seesaw Draughts'
 * `(= 1 (count Steps (to) ("HoppedPiece")))` capture filter relies on.
 */
function stepDistance(
  ctx: EvalContext,
  from: number,
  to: number,
  relation = "Adjacent",
): number {
  if (from === to) return 0;
  if (from < 0 || to < 0) return OFF;
  const seen = new Set<number>([from]);
  let frontier = [from];
  let dist = 0;
  while (frontier.length > 0) {
    dist += 1;
    const next: number[] = [];
    for (const s of frontier) {
      for (const nb of relationNeighbours(ctx, s, relation)) {
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

/** Java CountMovesThisTurn.eval returns state.numTurnSamePlayer(). */
function movesThisTurn(ctx: EvalContext): number {
  return ctx.state.numTurnSamePlayer;
}

export function aroundSites(
  ctx: EvalContext,
  site: number,
  dirTokens: readonly string[],
): number[] {
  if (site < 0) return [];
  const board = ctx.board;
  // Graph boards take their neighbourhood straight from the topology, anchored
  // at `site` (Java `Topology.neighbours`). This is both faithful — the drawn
  // lines, not a square lattice, decide adjacency — and fast, avoiding an
  // O(numSites) `siteAt` scan per neighbour for the region ludemes that probe
  // `(sites Around …)` heavily (e.g. the Onyx midpoint-square rule).
  if (board.traj) {
    return graphNeighbourSites(ctx, site, dirTokens).sort((a, b) => a - b);
  }
  const x = board.xOf(site);
  const y = board.yOf(site);
  const dirs = resolveDirectionTokens(
    dirTokens.length > 0 ? dirTokens : ["Adjacent"],
    ctx,
    site,
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
function compileSiteList(
  items: readonly LudNode[],
  env?: CompileEnv,
): RegionFn {
  const coords: Array<{ col: number; row: number } | number> = [];
  // Dynamic members — `(mapEntry …)`, `(var …)`, `(trackSite …)`, `(handSite
  // …)`, nested `(sites …)` — are compiled to region functions and unioned in
  // at eval time. Java treats `(sites { … })` members as IntFunctions /
  // RegionFunctions, so a curly list of dynamic site expressions is common in
  // mancala from-regions; dropping them silently yields an empty region.
  const dynamic: RegionFn[] = [];
  const pushRange = (a: number, b: number): void => {
    const step = b >= a ? 1 : -1;
    for (let v = a; step > 0 ? v <= b : v >= b; v += step) coords.push(v);
  };
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item) continue;
    if (isNumber(item)) {
      // `a..b` may survive option substitution as `num:a` + `id:".b"` (the
      // lexer splits `0..7` into a number and an ident `.7`; the parser
      // expands literal ranges, but option value-blocks bypass that). Pair
      // them up here, matching parseTrackSiteList. Otherwise a bare number.
      const next = items[i + 1];
      if (next && isIdent(next) && /^\.\d+$/.test(next.name)) {
        pushRange(item.value, Number(next.name.slice(1)));
        i += 1;
      } else {
        coords.push(item.value);
      }
    } else if (isIdent(item)) {
      // `(sites {<Board:rangeP1>})` substitutes the option value block as a
      // single ident like "0..7" (raw text never re-lexed). Expand the
      // inclusive range so the placement region isn't silently empty.
      const m = /^(-?\d+)\.\.(-?\d+)$/.exec(item.name);
      if (m) pushRange(Number(m[1]), Number(m[2]));
    } else if (isString(item)) {
      const c = parseCoord(item.value);
      if (c) coords.push(c);
    } else if (env && isList(item)) {
      try {
        dynamic.push(compileSiteOrRegion(item, env));
      } catch {
        /* unsupported dynamic member — skip it, keep the rest of the list */
      }
    }
  }
  return {
    eval: (ctx) => {
      const out: number[] = [];
      for (const c of coords) {
        const site =
          typeof c === "number" ? c : ctx.board.siteAtLabel(c.col, c.row);
        if (site >= 0) out.push(site);
      }
      for (const fn of dynamic) {
        for (const s of fn.eval(ctx)) if (s >= 0) out.push(s);
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

/**
 * A `(sites <Role> "Name")` lookup: the named region owned by the resolved
 * player (`(regions "Name" <Role> …)`). Falls back to the name-only region
 * (`namedRegions`) when no per-player entry exists.
 */
function namedPlayerRegionLookup(
  pidOf: (ctx: EvalContext) => number,
  name: string,
  env: CompileEnv,
): RegionFn {
  return {
    eval: (ctx) => {
      const pid = pidOf(ctx);
      // Java SitesEquipmentRegion.preprocess (index branch, Core
      // SitesEquipmentRegion.java:243-252): collect every equipment region
      // whose *full* name CONTAINS the query string and whose owner == the
      // resolved player, then union their sites. Some games bake the owner
      // suffix into the region name — Um el-Bagara declares "Left1"/"Left2",
      // "Right1"/"Right2" and looks them up via `(sites Mover "Left")`. An
      // exact-name match on the base "Left" misses those, so `includes` is the
      // faithful test (`region.name().contains(name)`), with the per-player
      // table keyed by the declared owner role.
      const out = new Set<number>();
      let matched = false;
      if (env.namedPlayerRegions) {
        for (const [fullName, perPlayer] of env.namedPlayerRegions) {
          if (!fullName.includes(name)) continue;
          const r = perPlayer.get(pid);
          if (r) {
            for (const s of r.eval(ctx)) out.add(s);
            matched = true;
          }
        }
      }
      // Java's index branch returns empty when no owner-region matches — an
      // unowned named region lives in regionsPerPlayer[0] and is unreachable
      // for a real player. So no name-only fallback here; matching Java keeps
      // `(sites Mover "X")` against an unowned "X" empty rather than leaking
      // the shared region's sites to every player.
      return matched ? [...out] : [];
    },
  };
}

function resolveStaticRole(name: string): number | undefined {
  const m = /^P(\d+)$/.exec(name);
  if (m?.[1]) return Number(m[1]);
  return undefined;
}

export function allSites(ctx: EvalContext): number[] {
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

/**
 * Like {@link indicesWhere} but the predicate receives the site index, so it
 * can consult what-based occupancy (`state.isOccupiedSite`) rather than only
 * the `who` value — required for neutral pieces (who 0, what>0).
 */
function indicesWhereSite(
  ctx: EvalContext,
  pred: (site: number) => boolean,
): number[] {
  const out: number[] = [];
  const board = ctx.board;
  const n = board.numSites;
  for (let i = 0; i < n; i += 1) {
    if (!board.isOnBoard(i)) continue;
    if (pred(i)) out.push(i);
  }
  return out;
}

function rowSites(ctx: EvalContext, y: number): number[] {
  // Graph boards (merged/shifted/triangle-extended) number rows by the rank of
  // their distinct y-clusters, so `(sites Row n)` is the n-th row from the
  // bottom — not the y=n line, which a board hanging below y=0 never reaches.
  // Java `Topology` row labels work this way; the integer scan below only holds
  // on a plain lattice (no traj), where rank == planar y.
  if (ctx.board.traj) return ctx.board.sitesInRow(y);
  const out: number[] = [];
  for (let x = 0; x < ctx.board.width; x += 1) {
    const s = ctx.board.siteAt(x, y);
    if (s !== OFF) out.push(s);
  }
  return out;
}

/**
 * Vertices sitting at the extreme of one axis (the highest / lowest x or y),
 * within half a unit of the extreme. Used as the graph-board fallback for
 * `(sites Top/Bottom/Left/Right)` on irregular boards (e.g. triangular wedge
 * hunt boards) whose perimeter sites have fractional coordinates the integer
 * row/column scan misses. On a regular grid this coincides with the matching
 * edge row/column, so it only ever kicks in when the integer scan is empty.
 */
function extremeSites(ctx: EvalContext, axis: "x" | "y", wantMax: boolean): number[] {
  const n = ctx.board.numSites;
  const coord = (s: number): number =>
    axis === "x" ? ctx.board.xOf(s) : ctx.board.yOf(s);
  let best = wantMax ? -Infinity : Infinity;
  for (let s = 0; s < n; s += 1) {
    const v = coord(s);
    if (wantMax ? v > best : v < best) best = v;
  }
  if (!Number.isFinite(best)) return [];
  // Adaptive band: include the extreme row only, not the next row in. Graph
  // boards can have rows 0.5 units apart (e.g. wedge/triangle hunt boards), so
  // a fixed 0.5 tolerance would bleed the adjacent row into the side. Tighten
  // the band to half the gap to the nearest distinct coordinate on the interior
  // side, capped at 0.5 (the regular-lattice spacing).
  let gap = Infinity;
  for (let s = 0; s < n; s += 1) {
    const v = coord(s);
    const d = wantMax ? best - v : v - best;
    if (d > 1e-6 && d < gap) gap = d;
  }
  const tol = Number.isFinite(gap) ? Math.min(0.5, gap / 2) : 0.5;
  const out: number[] = [];
  for (let s = 0; s < n; s += 1) {
    if (Math.abs(coord(s) - best) <= tol) out.push(s);
  }
  return out;
}

/** `(sites Top/Bottom/Left/Right)`: the board's extreme row/column. On a graph
 * board (merged / shifted / fractional-coordinate outlines such as the wedge
 * hunt boards) the side is the perimeter run at the extreme coordinate, which
 * Java derives from the perimeter; we approximate it with the extreme-coordinate
 * band (a strict improvement over an integer scan anchored at y=0, which on a
 * shifted board lands on an interior row). On a plain lattice the integer edge
 * scan already coincides with the extreme row, so it is kept there. */
function sideRowSites(ctx: EvalContext, axis: "x" | "y", wantMax: boolean): number[] {
  if (ctx.board.traj) return extremeSites(ctx, axis, wantMax);
  const scan =
    axis === "y"
      ? rowSites(ctx, wantMax ? ctx.board.height - 1 : 0)
      : colSites(ctx, wantMax ? ctx.board.width - 1 : 0);
  if (scan.length > 0) return scan;
  return extremeSites(ctx, axis, wantMax);
}

function colSites(ctx: EvalContext, x: number): number[] {
  // See rowSites: graph boards number columns by distinct x-cluster rank.
  if (ctx.board.traj) return ctx.board.sitesInColumn(x);
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

/**
 * One layer of `Region.expand`, unioning each site's neighbours in the named
 * relation `group`.
 *
 * @java game.functions.region.math.Expand: with no direction the expansion uses
 * each element's full topology `adjacent()` set; on a square lattice that is the
 * vertex-sharing neighbourhood — all 8 surrounding cells (the `Adjacent`
 * group), NOT just the 4 edge-sharing orthogonal ones. Tafl `(difference
 * (expand (sites Centre)) (sites Centre))` placements relied on the diagonal
 * ring being present, so the default group is `Adjacent`. When the ludeme names
 * a relation group explicitly — e.g. `(expand … Orthogonal)` (Bajr/Zonesh) —
 * expansion is restricted to that group instead.
 */
function expandRegion(
  sites: readonly number[],
  ctx: EvalContext,
  group: "Adjacent" | "Orthogonal" | "Diagonal" | "All" = "Adjacent",
): number[] {
  const board = ctx.board;
  const out = new Set<number>(sites);
  // On a graph board the trajectory engine knows the drawn relation groups
  // (e.g. an alquerque vertex's diagonals), which the square-lattice offset
  // table below would miss.
  const traj = board.traj;
  if (traj) {
    for (const s of sites) {
      if (s < 0) continue;
      for (const n of traj.group(s, group)) out.add(n);
    }
    return [...out];
  }
  const grp =
    board.tiling.groups[group] ??
    board.tiling.groups.Adjacent ??
    board.tiling.groups.All ??
    board.tiling.groups.Orthogonal ??
    [];
  for (const s of sites) {
    const x = board.xOf(s);
    const y = board.yOf(s);
    for (const d of grp) {
      const n = board.siteAt(x + d.dx, y + d.dy);
      if (n >= 0) out.add(n);
    }
  }
  return [...out];
}

// ---- direction functions ---------------------------------------------------

export function compileDirections(
  node: LudNode,
  env?: CompileEnv,
): DirectionsFn {
  if (isList(node) && listHead(node) === "directions") {
    const { positional, named } = parseArgs(node.items.slice(1));
    const fromNode = named.get("from");
    const toNode = named.get("to");
    if (env && fromNode && toNode && positional.some(isSiteTypeIdent)) {
      const fromFn = compileInt(fromNode, env);
      const toFn = compileInt(toNode, env);
      return {
        // @java Core/src/game/functions/directions/Directions.java between-sites constructor: resolve the
        // AbsoluteDirection whose radial from `from` reaches `to`.
        eval: (ctx) => directionsBetween(ctx, fromFn.eval(ctx), toFn.eval(ctx)),
      };
    }
  }
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
  const _r = head ? lookupLudeme("moves", head) : undefined;
  if (_r) return _r(node, env) as MovesFn;
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
    case "select":
      // Bare `(select (from …) [(to …)] …)` form (e.g. inside `(sites To
      // (forEach Site … (select …)))`); the `(move Select …)` wrapper routes
      // through compileMoveLudeme instead. Both build Java's Select effect.
      return compileSelect(node, env);
    case "leap":
      // Bare `(leap …)` form (e.g. inside `(sites To (leap …))`); the
      // `(move Leap …)` wrapper routes through compileMoveLudeme instead.
      return compileLeap(node, env);
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
      return compileRoll(node, env);
    case "moveAgain":
      // `(moveAgain)` in *moves* position — Java MoveAgain.eval returns a Moves
      // with a single `Move(new ActionSetNextPlayer(state.mover()))`, i.e. a
      // pass-like move that schedules the same player to play again. It shows up
      // as the conditional arm of `(if <cond> (moveAgain))`, most often the
      // `next:` arm of a `(do <prior> next:(if … (moveAgain)))` in a dice/race
      // game's `(then …)` (e.g. Tasholiwe's throw-of-10 bonus). Without this
      // case the arm threw `Unsupported moves ludeme`, so `compileDo`'s
      // fail-soft dropped the whole `next:` arm — the bonus turn never fired and
      // the prior's side effects survived unconditionally (un-Java: Java drops
      // the prior when `next` is empty). The ActionSetNextPlayer carries the
      // effect; the turn logic (ludeme-game apply) reads `placed.next` to keep
      // the mover, and the `(do …)`-in-effect handler folds it in unchanged.
      return {
        generate: (ctx) => [
          new Move({
            id: "moveAgain",
            label: "MoveAgain",
            siteIndices: [0],
            mover: ctx.mover,
            placedOwner: ctx.mover,
            actions: [new ActionSetNextPlayer(ctx.mover)],
          }),
        ],
      };
    case "max": {
      // (max Moves|Captures|Distance [withValue:…] <generator> [then]) — Java
      // `Max.construct` dispatches on the leading MaxMovesType/MaxDistanceType.
      const { positional } = parseArgs(rest);
      const typeNode = positional[0];
      const maxType = typeNode && isIdent(typeNode) ? typeNode.name : "";
      const innerNode = positional[positional.length - 1];
      if (!innerNode || isIdent(innerNode)) return EMPTY_MOVES;
      const inner = compileMoves(innerNode, env);
      if (maxType === "Moves") {
        // Java MaxMoves.eval: keep only the candidate first-moves that allow the
        // maximum number of same-player moves in the turn (the longest capture
        // chain in International/Frisian/Canadian draughts).
        return maxMovesFilter(inner);
      }
      if (maxType === "Captures") {
        // Java MaxCaptures.eval: keep the candidates that remove the most pieces
        // (counting ActionType.Remove over the move and its consequents).
        return {
          generate: (ctx) => {
            const candidates = inner.generate(ctx);
            if (candidates.length <= 1) return candidates;
            let max = 0;
            const counts = candidates.map((m) => {
              const c = countRemoveActions(m);
              if (c > max) max = c;
              return c;
            });
            return candidates.filter((_, i) => counts[i] === max);
          },
        };
      }
      // (max Distance …) — track-distance optimiser not yet ported; lenient.
      return inner;
    }
    case "min": {
      // (min Moves|Captures|Distance [opts] <generator>) — unused in the corpus
      // (0 games). Lenient: return the inner generator's moves unchanged.
      const { positional } = parseArgs(rest);
      const innerNode = positional[positional.length - 1];
      if (!innerNode || isIdent(innerNode)) return EMPTY_MOVES;
      return compileMoves(innerNode, env);
    }
    case "satisfy":
      // (satisfy <constraint> | { <constraints…> }) — deduction-puzzle CSP;
      // all move generation is handled by a runtime solver. Compile to empty.
      return EMPTY_MOVES;
    case "avoidStoredState": {
      // (avoidStoredState <moves> [then]) — generate the inner moves, then
      // reject any whose resulting position reproduces the stored state (set by
      // (remember State)/(storeState)). Java: AvoidStoredState.eval filters via
      // a TempContext, keeping moves where newState.stateHash() != storedState.
      const innerNode = rest.find(
        (n): n is LudList => isList(n) && listHead(n) !== "then",
      );
      if (!innerNode) return EMPTY_MOVES;
      const inner = compileMoves(innerNode, env);
      return {
        generate: (ctx) => {
          const stored = ctx.state.storedState;
          return inner
            .generate(ctx)
            .filter((m) => ctx.applyHypothetical(m).state.hash() !== stored);
        },
      };
    }
    case "while": {
      // (while <cond> <moves> [then]) — apply <moves> repeatedly against a
      // cumulative temp context until <cond> is false (Java: While.eval over a
      // TempContext, bounded by MAX_NUM_ITERATION). Each iteration evaluates the
      // body against the running context, applies each generated move (advancing
      // the temp state), and accumulates it. We additionally break when an
      // iteration produces no moves — Java would spin until it threw the
      // "infinite while" error; stopping avoids hanging the playout.
      const condNode = rest[0];
      const movesNode = rest[1];
      if (!condNode || !movesNode || !isList(movesNode)) return EMPTY_MOVES;
      const cond = compileBool(condNode, env);
      const body = compileMoves(movesNode, env);
      return {
        generate: (ctx) => {
          let temp = ctx;
          const out: Move[] = [];
          let iter = 0;
          while (cond.eval(temp)) {
            const gen = body.generate(temp);
            if (gen.length === 0) break;
            for (const m of gen) {
              temp = temp.applyHypothetical(m);
              out.push(m);
            }
            iter += 1;
            if (iter > MAX_NUM_ITERATION) break;
          }
          return out;
        },
      };
    }
    case "seq": {
      // (seq { <moves>… } [then]) — apply a sequence of move-generators one by
      // one, each evaluated against the cumulative (temporary) state produced
      // by applying the previous generator's moves. All the applied moves are
      // accumulated into a single flat result list. Faithful to
      // Core/.../moves/nonDecision/operators/logical/Seq.java (Seq.eval over a
      // TempContext): the temp context is our chained `applyHypothetical`.
      const listNode = rest.find(
        (n): n is LudList => isList(n) && n.delimiter === "curly",
      );
      const subNodes = listNode
        ? listNode.items
        : rest.filter(
            (n): n is LudList => isList(n) && listHead(n) !== "then",
          );
      const subs = subNodes
        .filter((n): n is LudList => isList(n))
        .map((n) => compileMoves(n, env));
      if (subs.length === 0) return EMPTY_MOVES;
      return {
        generate: (ctx) => {
          let temp = ctx;
          const out: Move[] = [];
          for (const sub of subs) {
            for (const m of sub.generate(temp)) {
              temp = temp.applyHypothetical(m);
              out.push(m);
            }
          }
          return out;
        },
      };
    }
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
          const owner = env.componentOwnerById?.[effectiveWhat] ?? mover;
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
                new ActionAdd({
                  to: site,
                  what: effectiveWhat,
                  owner,
                  count,
                  onStack,
                }),
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
    case "sow": {
      // A bare `(sow …)` in a moves slot — Java `Sow` extends `Effect` which is
      // a `Moves`, so it can appear directly as a generator (notably as the
      // `next:` arm of a `(do …)`, e.g. Lamosh/Selus/Rab'e). `Sow.eval` returns
      // a single move from `context.from()` carrying the distribution actions.
      const effect = compileSow(node, env);
      return {
        generate: (ctx) => {
          const from = ctx.frame.from;
          if (from === undefined || from < 0) return [];
          const actions = effect(ctx);
          if (actions.length === 0) return [];
          return [
            new Move({
              id: `sow:${from}:${ctx.mover}`,
              label: `Sow ${from}`,
              siteIndices: [from],
              mover: ctx.mover,
              placedOwner: ctx.mover,
              actions,
              // The sow's actions are all site-only ActionAddCounts, so report
              // the origin hole explicitly as from/to. This lets a do's `(then
              // …)` capture — applied by `applyThen` on `applyHypothetical(m)`,
              // which records this move — resolve `(last From)`/`(last To)` to
              // the sow origin (Java restores `origFrom/origTo`). Without it
              // `from()` is OFF, so `(sites Track from:(last From) …)` falls back
              // to the WHOLE ring and over-captures (Pallankuli ply 19).
              fromSite: from,
              toSite: from,
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
      // A trailing `(then …)` may sit at rest[2] (no else) or rest[3]
      // (`(if c thenMoves elseMoves (then …))`, e.g. Backgammon's multi-die
      // turn-retention). Find it anywhere past the then-moves arm; the first
      // non-`then` positional before it (if any) is the else generator.
      const thenSibling = rest
        .slice(2)
        .find((n): n is LudList => isList(n) && listHead(n) === "then");
      const deferredThen = compileDeferredDiceThen(thenSibling, env);
      const postDiceThen =
        thenSibling && !deferredThen && isDiceReplayThen(thenSibling)
          ? compileThen(thenSibling, env, false, true)
          : undefined;
      const elseNode = rest[2];
      const elseIsThen =
        elseNode !== undefined &&
        isList(elseNode) &&
        listHead(elseNode) === "then";
      const elseMoves =
        elseNode && !elseIsThen ? compileMoves(elseNode, env) : undefined;
      // `inThen:true` — guards inside this `(then …)` consequent read the
      // post-move state (Java parity). Scoped to the if-moves fold site, where
      // El Perro's `(set Value)` direction-flip guard and Backgammon's nested
      // `(if (all DiceUsed) …)` both live; other fold sites keep their existing
      // guard timing to avoid disturbing unrelated then-clauses.
      const thenEffect = thenSibling
        ? deferredThen
          ? undefined
          : postDiceThen
            ? undefined
            : compileThen(thenSibling, env, true)
        : undefined;
      return {
        generate: (ctx) => {
          let moves = cond.eval(ctx)
            ? thenMoves.generate(ctx)
            : elseMoves
              ? elseMoves.generate(ctx)
              : [];
          if (deferredThen && moves.length > 0) {
            moves = moves.map((m) => {
              deferDiceThen(env, m, deferredThen);
              return m;
            });
          }
          if (postDiceThen && moves.length > 0) {
            moves = moves.map((m) => {
              const post = ctx
                .applyHypothetical(m)
                .withFrame({ from: m.from(), to: m.to() });
              const extra = postDiceThen.effect ? postDiceThen.effect(post) : [];
              let again = postDiceThen.moveAgain;
              if (!again && postDiceThen.moveAgainCond) {
                again = postDiceThen.moveAgainCond.eval(post);
              }
              return extra.length > 0 || again
                ? m.withConsequence(extra, again)
                : m;
            });
          }
          if (thenEffect && moves.length > 0) {
            const { moveAgain, moveAgainCond, effect } = thenEffect;
            if (effect || moveAgain || moveAgainCond) {
              moves = moves.map((m) => {
                // Effect ludemes follow the same convention as every other
                // `(then …)` fold site (compileMoveLudeme/append/remove): the
                // move is recorded as the trial's last entry but the *state
                // stays pre-move*, so an effect that needs the post-move
                // position re-applies the move itself (`postMoveContext`),
                // applying it exactly once. Passing `applyHypothetical(m)`
                // here instead would double-apply the move inside such effects
                // — e.g. backgammon's nested `(if (can Move …) (moveAgain))`
                // popping a bar 2-stack twice (2→1→0), spuriously emptying the
                // bar and retaining the turn.
                const effEctx = ctx
                  .withContext(
                    ctx.context.withTrial(
                      ctx.context.trial.withMove(m, false, -1),
                    ),
                  )
                  .withFrame({ from: m.from(), to: m.to() });
                const extra = effect ? effect(effEctx) : [];
                let again = moveAgain;
                // The simple `(if <cond> (moveAgain))` predicate reads the
                // post-move position directly (no internal re-apply), so it
                // evaluates on the hypothetically-applied state.
                if (!again && moveAgainCond) {
                  again = moveAgainCond.eval(
                    ctx
                      .applyHypothetical(m)
                      .withFrame({ from: m.from(), to: m.to() }),
                  );
                }
                return extra.length > 0 || again
                  ? m.withConsequence(extra, again)
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
    case "hop":
      // Bare (hop <from?> <dir?> (between …) (to …)) — like (move Hop …)
      // without the prefix (used inside `(can Move (hop …))` probes and the
      // hop-again capture sequence). Args start at index 1.
      return compileHop(node as LudList, env, 1);
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
    case "addScore":
    case "remember":
    case "forget": {
      // Bare effect ludeme used in moves position (e.g. inside (forEach Site …)):
      // wrap the effect into a single move carrying its actions. Java's `Effect`
      // is-a `Moves`, so a score/remember/forget effect can stand as a move
      // generator — notably as the *prior* arm of a `(do prior next:…)`, where
      // its actions are prepended to the follow-up moves as a prologue. Tokkadille
      // / Grand Trictrac's `(do (if ("NewTurn") ("UpdateScore")) next:…)` updates
      // the score before the real slide; routing `(forEach Site … (addScore …))`
      // here lets the inner `do` compile instead of throwing (which silently
      // collapsed the whole turn to a bare roll via the outer `do`'s next: catch).
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
          const { moveAgain, moveAgainCond, effect } = appendThen;
          if (!effect && !moveAgain && !moveAgainCond) return moves;
          return moves.map((m) => {
            const ectx = ctx
              .withContext(
                ctx.context.withTrial(ctx.context.trial.withMove(m, false, -1)),
              )
              .withFrame({ from: m.from(), to: m.to() });
            const extra = effect ? effect(ectx) : [];
            let again = moveAgain;
            if (!again && moveAgainCond) {
              again = moveAgainCond.eval(ctx.applyHypothetical(m));
            }
            return extra.length > 0 || again
              ? m.withConsequence(extra, again)
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
      // effect to each between-site, emitting ONE move from the anchor that
      // carries every flanked run's actions. (The companion effect form lives
      // in compileEffectAction for `(then (custodial …))` captures.)
      // Java: Core/src/game/rules/play/moves/nonDecision/effect/Custodial.java
      const custSpec = parseCustodialSpec(node, env);
      const custThenNode = node.items.find(
        (n) => isList(n) && listHead(n) === "then",
      ) as LudList | undefined;
      const custThen = custThenNode ? compileThen(custThenNode, env) : undefined;
      const custMoveAgain = custThen?.moveAgain ?? false;
      const custMoveAgainCond = custThen?.moveAgainCond;
      const custThenEffect = custThen?.effect;
      return {
        generate: (ctx) => {
          const from = custSpec.fromFn.eval(ctx);
          if (from < 0 || from >= ctx.board.numSites) return [];
          const allBetween = scanCustodialBetween(custSpec, ctx, from);
          if (allBetween.length === 0) return [];
          const actions = custodialActions(
            custSpec, ctx, from, allBetween, ctx.mover,
          );
          let m = new Move({
            id: `custodial:${from}:${ctx.mover}`,
            label: `Custodial ${from}`,
            siteIndices: [from, from],
            mover: ctx.mover,
            placedOwner: ctx.mover,
            actions,
          });
          if (custMoveAgain || custMoveAgainCond || custThenEffect) {
            const ectx = ctx.withFrame({ from, to: from });
            const extra = custThenEffect ? custThenEffect(ectx) : [];
            let again = custMoveAgain;
            if (!again && custMoveAgainCond) {
              again = custMoveAgainCond.eval(ctx.applyHypothetical(m));
            }
            if (extra.length > 0 || again) {
              m = m.withConsequence(extra, again);
            }
          }
          return [m];
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
      // Java `Remove.countFn` (default 1): `(remove <region> count:N)` removes N
      // pieces from each site. See the effect-position handler below for why this
      // matters (count-based mancala holes).
      const { named: removeNamed } = parseArgs(node.items.slice(1));
      const countNode = removeNamed.get("count");
      const countFn = countNode ? compileInt(countNode, env) : undefined;
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
          const count = countFn ? countFn.eval(ctx) : 1;
          for (const site of reg.eval(ctx)) {
            if (site < 0) continue;
            const m = new Move({
              id: `remove:${site}:${mover}`,
              label: `Remove at ${site}`,
              siteIndices: [site],
              mover,
              placedOwner: mover,
              actions: [
                new ActionRemove({
                  to: site,
                  count: count > 0 ? count : 1,
                  clearAll: env.isStacking === false,
                }),
              ],
            });
            if (thenEffect) {
              const { moveAgain, moveAgainCond, effect } = thenEffect;
              const ectx = ctx
                .withContext(
                  ctx.context.withTrial(ctx.context.trial.withMove(m, false, -1)),
                )
                .withFrame({ from: m.from(), to: m.to() });
              const extra = effect ? effect(ectx) : [];
              let again = moveAgain;
              if (!again && moveAgainCond) {
                again = moveAgainCond.eval(ctx.applyHypothetical(m));
              }
              out.push(
                extra.length > 0 || again ? m.withConsequence(extra, again) : m,
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
      const trackName = first && isString(first) ? first.value : undefined;
      return {
        generate: (ctx) => {
          const owner = ownerFn ? ownerFn.eval(ctx) : ctx.mover;
          // Java walks the named track in order, binding `(site)` to each track
          // site and returning the first that yields a non-empty move list. The
          // track's order matters (e.g. backgammon bears off the piece furthest
          // from home first), so prefer the actual track over a board-index scan.
          const track = trackForPlayer(ctx, owner, trackName);
          if (track) {
            for (const s of track.sites) {
              if (s < 0) continue; // skip Off/End sentinels
              const sub = ctx.withFrame({ site: s, from: s });
              const moves = gen.generate(sub);
              if (moves.length > 0) return moves;
            }
            return [];
          }
          // No track data: fall back to a board-index scan (compile-clean stand-in).
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
  const cond = ifAfterNode ? compileBool(ifAfterNode, env) : undefined;
  // A trailing `(then …)` sibling decorates the produced moves (Java: the Do
  // ludeme's own `then`). Compile it fail-soft: an unsupported ludeme inside
  // the consequence should drop the consequence, not fail the whole game (it
  // previously compiled because the arm was never visited).
  const thenNode = positional
    .slice(1)
    .find((n): n is LudList => isList(n) && listHead(n) === "then");
  let thenC:
    | { moveAgain: boolean; moveAgainCond?: BoolFn; effect?: EffectFn }
    | undefined;
  if (thenNode) {
    try {
      // `allowForEachSite:true` — the do's own `(then …)` is applied by
      // `applyThen` on `ctx.applyHypothetical(m)`, i.e. the *post-move* state
      // (the `next:` sow already distributed). So a `(forEach Site …)` capture
      // reads the right board: the relay-sow reach-N capture in two-row mancala
      // — `(then (and (forEach Site (sites Track from:(last From) to:(trackSite
      // Move … steps:(var "NumSowed"))) (if (= 4 (count at:(site))) (fromTo …)))
      // (set Var "NumSowed" 0)))` (Pallankuli/Kiuthi/Bechi/…). The move-then
      // fold sites keep state pre-move, which is why `forEach Site` stays gated
      // there (Damspel's promote-on-pass); the do-then path does not, so enable
      // it here.
      thenC = compileThen(thenNode, env, false, true);
    } catch {
      thenC = undefined;
    }
  }
  const applyThen = (ctx: EvalContext, moves: readonly Move[]): Move[] => {
    if (!thenC) return [...moves];
    const tc = thenC;
    return moves.map((m) => {
      // Resolve the `(then …)` against the post-move position so `(last …)`
      // and `(values Remembered …)` see the move's effects (incl. any
      // prepended prologue actions).
      const ectx = ctx
        .applyHypothetical(m)
        .withFrame({ from: m.from(), to: m.to() });
      const extra = tc.effect ? tc.effect(ectx) : [];
      // A conditional `(then (if <cond> (moveAgain)))` — e.g. the Pachisi
      // family's `(if ("Grace") (moveAgain))` after `("RollMove" …)` — keeps
      // the turn only when the predicate holds on the post-move position
      // (here `(count Pips)` of the move's rolled dice, reproduced by
      // `applyHypothetical`'s cloned-RNG re-roll).
      let again = tc.moveAgain;
      if (!again && tc.moveAgainCond) again = tc.moveAgainCond.eval(ectx);
      return extra.length > 0 || again ? m.withConsequence(extra, again) : m;
    });
  };

  const nextNode = named.get("next");
  // Compile the `next:` arm fail-soft. If it contains an unsupported ludeme,
  // fall back to the prior-only behaviour (which is how these games compiled
  // before the `next:` arm was implemented) rather than failing the game.
  let nextGen: MovesFn | undefined;
  if (nextNode) {
    try {
      nextGen = compileMoves(nextNode, env);
    } catch {
      nextGen = undefined;
    }
  }
  if (nextNode && nextGen) {
    const isRollNextDo =
      isList(movesNode) &&
      (listHead(movesNode) === "roll" ||
        (listHead(movesNode) === "if" &&
          movesNode.items.some((n) => isList(n) && listHead(n) === "roll")));
    // `(do prior next:next …)` — Java `Do.eval`: generate the prior moves,
    // apply them to a temp context, generate the `next:` moves there, then
    // prepend the prior moves' actions to each follow-up move so it re-runs
    // the prologue side effects when applied.
    const nextGenF = nextGen;
    return {
      generate: (ctx) => {
        const priorMoves = inner.generate(ctx);
        let tempCtx = ctx;
        const preActions: Action[] = [];
        for (const pm of priorMoves) {
          tempCtx = tempCtx.applyHypothetical(pm);
          preActions.push(...pm.actions);
        }
        let result = nextGenF
          .generate(tempCtx)
          .map((m) => m.withPrependedActions(preActions));
        if (
          result.length === 0 &&
          env.diceDef &&
          isRollNextDo &&
          !noMovesProbing
        ) {
          const pass = new ActionPass();
          pass.setDecision(true);
          // Java parity: Do.prependPreMoves inserts a forced pass when the
          // `next:` arm is empty in a hand-dice `RollMove` (`do (roll)
          // next:...`) game; Game.legalMoves then propagates the Do's `then`
          // to that pass. Do not synthesize it inside the `(no Moves …)`
          // stalemate probe: that path is asking whether real play moves exist,
          // before forced-pass legal-list repair.
          // (Core/src/game/rules/play/moves/nonDecision/effect/requirement/Do.java:170-175,
          // Core/src/game/functions/booleans/no/moves/NoMoves.java:57-88,
          // Core/src/game/Game.java:2922-2927).
          result = [
            new Move({
              id: `pass:${ctx.mover}`,
              label: "Pass",
              siteIndices: [0],
              mover: ctx.mover,
              placedOwner: ctx.mover,
              actions: [...preActions, pass],
              decisionIndex: preActions.length,
            }),
          ];
        }
        if (cond) {
          result = result.filter((m) => cond.eval(ctx.applyHypothetical(m)));
        }
        return applyThen(ctx, result);
      },
    };
  }

  if (!cond) {
    return thenC ? { generate: (ctx) => applyThen(ctx, inner.generate(ctx)) } : inner;
  }
  return {
    generate: (ctx) => {
      // While probing for threats (king-safety `(is Threatened …)`), the nested
      // threat check auto-fails (returns false) exactly as Java's IsThreatened
      // autoFail, so an `ifAfterwards:(not (is Threatened …))` filter is
      // trivially satisfied for every move. Skip the per-move `applyHypothetical`
      // clone and return the inner (pseudo-legal) moves directly — pseudo-legal
      // enemy moves are the correct, and far cheaper, basis for "can any enemy
      // capture this square". This is the dominant cost of checkmate detection.
      if (threatProbing) return inner.generate(ctx);
      return applyThen(
        ctx,
        inner.generate(ctx).filter((m) => cond.eval(ctx.applyHypothetical(m))),
      );
    },
  };
}

/**
 * `(roll)` — a single move that re-rolls every declared die. The values are
 * drawn at apply-time from the trial RNG (see ActionRollDice) so move
 * enumeration stays pure.
 */
function compileRoll(node: LudList, env: CompileEnv): MovesFn {
  const def = env.diceDef;
  if (!def || def.numDice === 0) {
    return { generate: () => [] };
  }
  const faces = def.faces;
  // A trailing `(then …)` is the roll move's consequence (Java stores it on the
  // Move and runs it after the roll action, on the post-roll position) — e.g.
  // Pasa's `(roll (then (addScore Mover (mapEntry (count Pips)))))`, which scores
  // the pips just rolled. Resolve it against `applyHypothetical(move)`: that
  // re-rolls on a *clone* of the RNG, drawing exactly the faces `game.apply`
  // will draw, so `(count Pips)` reads the same values and baking the
  // consequence at generate-time is exact. Compile fail-soft (mirror the do/move
  // then paths) so an unsupported consequence ludeme drops the consequence
  // rather than failing the whole game. Previously the node was ignored, so the
  // consequence was silently dropped (byScore-end dice games never scored).
  // @java game.functions.ints.state.Counter / other.move.Move.then
  const thenNode = node.items.find(
    (n): n is LudList => isList(n) && listHead(n) === "then",
  );
  let thenC:
    | { moveAgain: boolean; moveAgainCond?: BoolFn; effect?: EffectFn }
    | undefined;
  if (thenNode) {
    try {
      thenC = compileThen(thenNode, env, false, true);
    } catch {
      thenC = undefined;
    }
  }
  return {
    generate: (ctx) => {
      const move = new Move({
        id: "roll",
        label: "Roll",
        siteIndices: [0],
        mover: ctx.mover,
        placedOwner: ctx.mover,
        actions: [new ActionRollDice(faces)],
      });
      if (!thenC) return [move];
      const tc = thenC;
      const ectx = ctx.applyHypothetical(move);
      const extra = tc.effect ? tc.effect(ectx) : [];
      let again = tc.moveAgain;
      if (!again && tc.moveAgainCond) again = tc.moveAgainCond.eval(ectx);
      return [
        extra.length > 0 || again ? move.withConsequence(extra, again) : move,
      ];
    },
  };
}

/**
 * `(or { … })` wraps its alternatives in a curly group; `(or a b)` lists
 * them directly. Flatten a single curly group so both spellings compile.
 */
function flattenMoveList(items: readonly LudNode[]): readonly LudNode[] {
  if (items.length === 1) {
    const only = items[0];
    // The explicit curly array `{ A B }`, and — like the bool `(or …)`/`(and …)`
    // path (see flattenBoolList) — the redundant-parens grouping idiom
    // `(or ( A B ))`, where the inner ≥2-item headless paren-shell IS the
    // generator list (Java collapses `(or ( A B ))` to the binary `Or(A, B)`).
    // Without the paren arm, `(or ( (move …) (move …) ))` reaches compileMoves
    // as a single head-less list and throws "Unsupported moves ludeme".
    if (
      only &&
      isList(only) &&
      (only.delimiter === "curly" ||
        (!listHead(only) && only.items.length >= 2))
    ) {
      return only.items;
    }
  }
  return items;
}

// Operand flattening for `(and …)` / `(or …)`. Beyond the explicit curly array
// form `{ A B }`, Ludii's parser also accepts the redundant-parens grouping
// idiom `(or ( A B ))`, where the inner headless paren-shell `( A B )` *is* the
// operand list (parser collapses it to the binary `Or(A, B)`). Without this,
// the shell falls through to compileBool's default headless-paren handling,
// which is implicit conjunction — silently turning `(or ( A B ))` into
// `A AND B` (e.g. Centrifugal/Centripetal Force's drop predicate, which is a
// union of edge-drop and adjacency conditions, collapsed to their
// intersection). A genuine multi-operand `(and A B)` / `(or A B)` arrives as
// length-2 `items` and is returned unchanged.
function flattenBoolList(items: readonly LudNode[]): readonly LudNode[] {
  if (items.length === 1) {
    const only = items[0];
    if (
      only &&
      isList(only) &&
      (only.delimiter === "curly" || !listHead(only)) &&
      only.items.length >= 2
    ) {
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
  const thens: {
    moveAgain: boolean;
    moveAgainCond?: BoolFn;
    effect?: EffectFn;
  }[] = [];
  const deferredThens: CompiledThen[] = [];
  for (const child of flattenMoveList(children)) {
    if (isString(child)) continue; // skip define-name leftovers
    if (isList(child) && listHead(child) === "then") {
      const deferred = compileDeferredDiceThen(child, env);
      if (deferred) {
        deferredThens.push(deferred);
        continue;
      }
      // A moves-list sibling `(then …)` is folded against the *post-move* state
      // (`applyHypothetical` below), so a `(forEach Site …)` consequent reads the
      // correct board — enable it here. Java's `Then` always runs the consequent;
      // two-row mancala's BetweenRounds seed-sweep `(or {…} (then (if
      // ("OneRowIsEmpty") (and {(forEach Site (sites P1) (fromTo … (handSite P1)))
      // …}))))` was silently dropped, leaving each hand empty so every player only
      // Passed and `(nextPhase (all Passed))` fired prematurely. Damspel's
      // promote-on-pass `(forEach Site …)` is a MOVE'S-OWN `(then …)` (a different
      // call site, still gated), so it is unaffected by enabling this here.
      thens.push(compileThen(child, env, false, true));
      continue;
    }
    gens.push(compileMoves(child, env));
  }
  const base = combine(gens);
  const withDeferred =
    deferredThens.length === 0
      ? base
      : {
          generate: (ctx: EvalContext) =>
            base.generate(ctx).map((m) => {
              deferDiceThens(env, m, deferredThens);
              return m;
            }),
        };
  if (thens.length === 0) return withDeferred;
  const moveAgainStatic = thens.some((t) => t.moveAgain);
  const moveAgainConds = thens
    .map((t) => t.moveAgainCond)
    .filter((c): c is BoolFn => c !== undefined);
  const effects = thens
    .map((t) => t.effect)
    .filter((e): e is EffectFn => e !== undefined);
  return {
    generate: (ctx) =>
      withDeferred.generate(ctx).map((m) => {
        // Resolve the `(then …)` consequents against the *post-move* position
        // (Java evaluates a move's `then` after its own actions apply), binding
        // the move's from/to and recording it as the last move so `(last To)` /
        // `(last From)` resolve to it. `applyHypothetical` does both: it applies
        // the move's actions to a temp state and records it in the trial. This
        // matters whenever an effect reads a site the move just changed — e.g.
        // Long Assize's "RememberPieceHasMoved" testing `(= (state at:(last To))
        // 1)` after the piece (carrying its state via ActionMove) has landed:
        // against the pre-move (empty) destination the test always failed, so a
        // King/Queen never lost its first-move-leap state. Mirrors the do-level
        // applyThen, which already uses applyHypothetical here.
        const post = ctx
          .applyHypothetical(m)
          .withFrame({ from: m.from(), to: m.to() });
        const extra = effects.flatMap((e) => e(post));
        let moveAgain = moveAgainStatic;
        if (moveAgainConds.length > 0) {
          // Conditional turn-retention — e.g. Tawula's `(or {…} (then
          // "ReplayNotAllDiceUsed"))` whose body is `(if (not (all DiceUsed))
          // (moveAgain))` — observes the same applied state (the die just
          // spent), so the predicate sees post-move dice/board.
          for (const c of moveAgainConds) if (c.eval(post)) moveAgain = true;
        }
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
 * Safety valve for `(max Moves …)` chain counting. Java's MaxMoves.getReplayCount
 * has no recursion bound — it relies on capture chains terminating (each hop
 * removes a piece, so the board strictly shrinks). The cap only guards against a
 * pathological non-progressing `(moveAgain)` cycle; real chains are far shorter.
 */
const MAX_MOVES_CHAIN_DEPTH = 64;

/**
 * Total `game.apply` expansions allowed per `(max Moves …)` evaluation. Beyond
 * this the lookahead bails out (the caller falls back to the unfiltered inner
 * candidates) — a guard not present in Java, which runs the same algorithm at
 * native speed; our immutable-state engine cannot afford an unbounded chain
 * explosion. Bailing to "all candidates" is safe for the replay harness because
 * a recorded (already-played) move is always among the inner candidates.
 */
const MAX_MOVES_NODE_BUDGET = 20000;

/** Sentinel thrown when a `(max Moves …)` lookahead exceeds its node budget. */
class MaxMovesBudgetExceeded extends Error {}

/**
 * Re-entrancy flag. While a `(max Moves …)` lookahead is running, the nested
 * `game.moves` calls it makes re-enter the play rule — which for games like
 * International Draughts is itself wrapped in `(max Moves …)`. Re-filtering at
 * every level is what makes the Java algorithm doubly recursive (and unaffordable
 * here). We skip it: a re-entrant `(max Moves …)` returns its raw inner
 * candidates unfiltered. This is result-identical to Java because the longest
 * chain length is invariant to intermediate filtering — both compute
 * `1 + max(child chain lengths)` — so the top-level filter selects the same
 * candidates, while the lookahead avoids the nested re-evaluation.
 */
let maxMovesInLookahead = false;

/**
 * Java parity: `MaxMoves.getReplayCount`. Returns the length of the longest
 * same-player move chain reachable from `ctx` — the context produced by applying
 * a move. Java tests `state.prev() != state.mover() || trial.over()` to decide
 * the chain has ended; we don't store `prev`, so we pass the mover that produced
 * `ctx` (`prevMover`) and compare it against the mover now to move. A different
 * mover (the turn passed) or a finished trial ends the chain and returns the
 * running `count`. Otherwise we re-generate the legal moves, apply each, and
 * recurse with `count + 1`.
 */
function maxMovesReplayCount(
  ctx: Context,
  prevMover: number,
  count: number,
  depth: number,
  budget: { n: number },
): number {
  if (ctx.state.mover !== prevMover || ctx.trial.over || depth <= 0) return count;
  // Raw play moves only: a forced Pass (appended by `game.moves` for a
  // stalemated player) is not part of a same-player capture chain and would
  // otherwise inflate the measured chain length by one.
  const legal = ctx.game.legalMovesRaw
    ? ctx.game.legalMovesRaw(ctx)
    : ctx.game.moves(ctx);
  // Java initialises max to 0 and returns max(child counts); an empty legal-move
  // set (unreachable in practice — game.apply forces `over` when the same mover
  // is stalemated) would therefore yield 0, matching Java exactly.
  let max = 0;
  for (const nm of legal) {
    if (--budget.n <= 0) throw new MaxMovesBudgetExceeded();
    const nc = ctx.game.apply(ctx, nm);
    const c = maxMovesReplayCount(nc, ctx.state.mover, count + 1, depth - 1, budget);
    if (c > max) max = c;
  }
  return max;
}

/**
 * Java parity: `MaxMoves.eval`. Keep only the inner candidates whose same-player
 * move chain is longest (the maximal-capture rule). Each candidate is applied via
 * `game.apply`, then `maxMovesReplayCount` measures its chain length. On budget
 * exhaustion or re-entrant evaluation, returns the inner candidates unfiltered.
 */
function maxMovesFilter(inner: MovesFn): MovesFn {
  // Diagnostic bypass: MAXMOVES=0 disables the filter (returns inner candidates
  // unchanged) so the replay harness can A/B the faithful filter vs the lenient
  // no-op without a rebuild. Off in normal builds.
  const bypass = process.env.MAXMOVES === "0";
  return {
    generate: (ctx) => {
      const candidates = inner.generate(ctx);
      if (bypass || candidates.length <= 1 || maxMovesInLookahead) return candidates;
      const base = ctx.context;
      const baseMover = base.state.mover;
      const budget = { n: MAX_MOVES_NODE_BUDGET };
      maxMovesInLookahead = true;
      try {
        let max = 0;
        const counts = candidates.map((m) => {
          if (--budget.n <= 0) throw new MaxMovesBudgetExceeded();
          const next = base.game.apply(base, m);
          const c = maxMovesReplayCount(
            next,
            baseMover,
            1,
            MAX_MOVES_CHAIN_DEPTH,
            budget,
          );
          if (c > max) max = c;
          return c;
        });
        return candidates.filter((_, i) => counts[i] === max);
      } catch (e) {
        if (e instanceof MaxMovesBudgetExceeded) return candidates;
        throw e;
      } finally {
        maxMovesInLookahead = false;
      }
    },
  };
}

/**
 * Java parity: count the `ActionType.Remove` actions a move performs, including
 * the actions of its `(then …)` consequents — the captured-piece count used by
 * `(max Captures …)`. Mirrors counting `Remove` over `getActionsWithConsequences`.
 */
function countRemoveActions(m: Move): number {
  let n = 0;
  for (const a of m.actions) if (a.actionType() === "Remove") n += 1;
  for (const sub of m.then) n += countRemoveActions(sub);
  return n;
}

/** RoleType idents that may follow the moves clause of `(forEach Piece … <role>)`. */
const FOREACH_PIECE_ROLE_NAMES = new Set([
  "Mover", "Next", "Prev", "Player", "Enemy", "NonMover", "All", "Each",
  "Shared", "Neutral",
]);
function isForEachPieceRole(name: string): boolean {
  return FOREACH_PIECE_ROLE_NAMES.has(name) || /^P\d+$/.test(name);
}

/**
 * Java ForEachPiece sets the state mover to the iterated player only when it is
 * a real opponent — the mover itself, Shared (`> numPlayers`) and Neutral (`0`)
 * compute their moves directly with the current mover left intact
 * (ForEachPiece.java:278-298). Mirror that here so Shared/Neutral piece rules
 * are generated as the actual mover.
 */
function foreachPieceSetsMover(
  owner: number,
  mover: number,
  numPlayers: number,
): boolean {
  return owner !== mover && owner >= 1 && owner <= numPlayers;
}

/**
 * The player ids `(forEach Piece … <role>)` iterates over (Java ForEachPiece:
 * `specificPlayer = player.eval(context)`, default Mover). `All`/`Each` cover
 * every player; `Enemy`/`NonMover` every player but the mover; a specific role
 * (P1/P2/Next/…) just that one. An unrecognised role falls back to the mover so
 * behaviour is unchanged from the no-role default.
 */
function playersForRole(name: string | undefined, ctx: EvalContext): number[] {
  if (name === undefined) return [ctx.mover];
  const n = ctx.context.game.numPlayers;
  if (name === "All" || name === "Each") {
    return Array.from({ length: n }, (_, i) => i + 1);
  }
  if (name === "Enemy" || name === "NonMover") {
    return Array.from({ length: n }, (_, i) => i + 1).filter((p) => p !== ctx.mover);
  }
  if (name === "Shared" || name === "Neutral") {
    // Shared/Neutral pieces are owned by the neutral player `numPlayers + 1`
    // (matching `collectPiece`/`compilePieceMoves`).
    return [n + 1];
  }
  const p = resolveRole(name, ctx);
  return p >= 1 ? [p] : [ctx.mover];
}

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
    // generated move. A leading piece-type name restricts iteration to sites
    // carrying that component (the `allowedWhat` filter below) — Java's
    // `(forEach Piece "Name" …)` runs only for that piece. Without a clause,
    // dispatch to each piece's equipment-defined move generator.
    // Separate keyword args (`container:`, `top:`, `if:`) from positionals so a
    // `container:(mover)` value list is not mistaken for the move clause.
    const { positional: feArgs, named: feNamed } = parseArgs(node.items.slice(2));
    const movesNode = feArgs.find((n) => isList(n) && listHead(n) !== "then");
    // Java `ForEachPiece` bounds its scan to ONE container — the default is
    // container 0 (the board); hand pieces are reached ONLY via an explicit
    // `container:` arg (`ContainerId` defaults to `IntConstant(0)` and the
    // iterator keeps a position iff `minIndex <= site < maxIndex`, the bounds
    // of that container). So a bare `(forEach Piece)` must NOT iterate pieces
    // sitting in a hand: the race/tables family pairs `(forEach Piece)` (board
    // moves) with `(forEach Piece container:(mover))` (hand-entry moves), and
    // without the bound the board arm spuriously generated a hand pawn's move
    // (e.g. Barjis P2 ply-1 emitting `98→98` instead of the forced pass).
    // `container:(mover)` evaluates to the player id, which is the index of
    // that player's hand container (Java orders containers [board, hand 1..N]).
    const containerNode = feNamed.get("container");
    let containerFn: IntFn | undefined;
    if (containerNode) {
      try {
        containerFn = compileInt(containerNode, env);
      } catch {
        containerFn = undefined;
      }
    }
    // Candidate global site indices for the configured container, evaluated on
    // the base context (Java computes `cont` once from the passed context).
    const pieceSites = (ctx: EvalContext): number[] => {
      const board = ctx.board;
      const cont = containerFn ? containerFn.eval(ctx) : 0;
      if (cont <= 0) {
        const out: number[] = [];
        for (let s = 0; s < board.numSites; s += 1) out.push(s);
        return out;
      }
      return board.handSites(cont);
    };
    // A leading string names a piece type to restrict iteration to (Java:
    // `(forEach Piece "Name" …)` runs the rule only for components of that
    // name). The engine tracks per-site component identity (`whatAtSite`), so
    // resolve the name to its component `what` id(s) and skip sites carrying a
    // different piece — without this, a king-only rule like
    // `(forEach Piece "DoubleCounter" (move Slide))` wrongly fired on the
    // owner's men too (all the mover's pieces share the owner id).
    let pieceName: string | undefined;
    for (const n of feArgs) {
      if (isString(n)) {
        pieceName = n.value;
        break;
      }
    }
    // A trailing RoleType ident (Java ForEachPiece's `player`/`role` arg)
    // restricts iteration to that player's pieces, not the mover's — e.g. El
    // Perro's `(can Move (forEach Piece ("StepToEmpty" …) P2))` run on the dog's
    // turn must check the GOATS' forward mobility. Default (no role) = Mover.
    let roleName: string | undefined;
    for (const n of feArgs) {
      if (isIdent(n) && isForEachPieceRole(n.name)) {
        roleName = n.name;
        break;
      }
    }
    if (movesNode) {
      const inner = compileMoves(movesNode, env);
      const thens: CompiledThen[] = [];
      const deferredThens: CompiledThen[] = [];
      for (const n of feArgs) {
        if (!isList(n) || listHead(n) !== "then") continue;
        const deferred = compileDeferredDiceThen(n, env);
        if (deferred) deferredThens.push(deferred);
        else thens.push(compileThen(n, env));
      }
      const moveAgain = thens.some((t) => t.moveAgain);
      // Conditional turn-retention — `(then (if (can Move …) (moveAgain)))` —
      // on the forEach itself (Fanorona/Vela's multi-capture: after a capturing
      // step, replay only if a further capture is available from the landing
      // site). Like the dispatch branch below, the predicate must see the
      // move's *applied* position, so it is evaluated on applyHypothetical(m).
      const moveAgainConds = thens
        .map((t) => t.moveAgainCond)
        .filter((c): c is BoolFn => c !== undefined);
      const effects = thens
        .map((t) => t.effect)
        .filter((e): e is EffectFn => e !== undefined);
      // Match the named piece by base name (collision-free). Resolving the name
      // to component `what` ids via idByLabel fails for `Each` pieces because
      // role-specific `(piece "X" Pk)` registrations collide on the bare label;
      // baseNameById records the base name per `what` id without that collision.
      const baseNameById = env.componentBaseNameById;
      return {
        generate: (ctx) => {
          const out: Move[] = [];
          // `pieceName` undefined ⇒ no name given ⇒ iterate all owned pieces.
          const restrictByName = pieceName !== undefined && baseNameById !== undefined;
          // Java ForEachPiece runs the inner moves AS `specificPlayer`
          // (state.setMover) so Mover-relative sub-evaluations and the generated
          // moves' mover match. When the role equals the mover we keep `ctx`
          // untouched (identical to the historical default behaviour).
          const numPlayers = ctx.context.game.numPlayers;
          const sites = pieceSites(ctx);
          for (const tp of playersForRole(roleName, ctx)) {
            const pctx = foreachPieceSetsMover(tp, ctx.mover, numPlayers)
              ? ctx.withContext(ctx.context.withState(ctx.state.withMover(tp)))
              : ctx;
            const cells = pctx.state.cells;
            const state = pctx.state;
            for (const s of sites) {
              if (cells[s] !== tp) continue;
              if (restrictByName && baseNameById![state.whatAtSite(s)] !== pieceName)
                continue;
              const sub = pctx.withFrame({ from: s, piece: tp });
              for (const m of inner.generate(sub)) {
                if (deferredThens.length > 0) deferDiceThens(env, m, deferredThens);
                if (effects.length === 0 && !moveAgain && moveAgainConds.length === 0) {
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
                let again = moveAgain;
                if (moveAgainConds.length > 0) {
                  const post = sub.applyHypothetical(m);
                  for (const c of moveAgainConds) if (c.eval(post)) again = true;
                }
                out.push(
                  extra.length > 0 || again
                    ? m.withConsequence(extra, again)
                    : m,
                );
              }
            }
          }
          return out;
        },
      };
    }
    // A sibling `(then …)` with no explicit moves clause (e.g. backgammon's
    // `(forEach Piece top:True (then "ReplayNotAllDiceUsed"))`) must still be
    // folded into every dispatched move — otherwise the turn-retention
    // consequence (`(if (not (all DiceUsed)) (moveAgain))`) is silently dropped
    // and the engine passes the turn after one die. Mirror the moves-clause
    // branch's per-move folding.
    const dispatchThens: CompiledThen[] = [];
    const dispatchDeferredThens: CompiledThen[] = [];
    for (const n of feArgs) {
      if (!isList(n) || listHead(n) !== "then") continue;
      const deferred = compileDeferredDiceThen(n, env);
      if (deferred) dispatchDeferredThens.push(deferred);
      else dispatchThens.push(compileThen(n, env));
    }
    const dispatchMoveAgain = dispatchThens.some((t) => t.moveAgain);
    // Conditional turn-retention — `(then "ReplayNotAllDiceUsed")` i.e.
    // `(if (not (all DiceUsed)) (moveAgain))` — on the dispatch (e.g. Plakoto's
    // opening `(max Distance … (forEach Piece top:True (then …)))`, where the
    // die is spent inside the dispatched piece rule, not a sibling forEach Die).
    // The predicate must be evaluated on the post-move position so it sees the
    // die just consumed; a static `moveAgain` flag cannot express it.
    const dispatchMoveAgainConds = dispatchThens
      .map((t) => t.moveAgainCond)
      .filter((c): c is BoolFn => c !== undefined);
    const dispatchEffects = dispatchThens
      .map((t) => t.effect)
      .filter((e): e is EffectFn => e !== undefined);
    const hasDispatchThen =
      dispatchEffects.length > 0 ||
      dispatchMoveAgain ||
      dispatchMoveAgainConds.length > 0;
    return {
      generate: (ctx) => {
        const byOwner = env.pieceMovesByOwner;
        const byWhat = env.pieceMovesByWhat;
        if (!byOwner) return [];
        const numPlayers = ctx.context.game.numPlayers;
        const out: Move[] = [];
        const sites = pieceSites(ctx);
        const emitForPiece = (gen: MovesFn, sub: EvalContext): void => {
          for (const m of gen.generate(sub)) {
            if (dispatchDeferredThens.length > 0)
              deferDiceThens(env, m, dispatchDeferredThens);
            if (!hasDispatchThen) {
              out.push(m);
              continue;
            }
            // Resolve the consequence on the *post-move* position: record `m`
            // as the trial's last move so `postMoveContext` re-applies it (the
            // `(all DiceUsed)` predicate then sees the die just consumed).
            const ectx = sub
              .withContext(
                sub.context.withTrial(
                  sub.context.trial.withMove(m, false, -1),
                ),
              )
              .withFrame({ from: m.from(), to: m.to() });
            const extra = dispatchEffects.flatMap((e) => e(ectx));
            let moveAgain = dispatchMoveAgain;
            // The conditional turn-retention predicate must see the move's
            // *applied* state (the die zeroed by its ActionUseDie). `ectx`
            // only records the move in the trial without mutating state, so
            // dice would still read unspent there — use applyHypothetical,
            // which actually applies the move, as the forEach Die path does.
            if (dispatchMoveAgainConds.length > 0) {
              const post = sub.applyHypothetical(m);
              for (const c of dispatchMoveAgainConds)
                if (c.eval(post)) moveAgain = true;
            }
            out.push(
              extra.length > 0 || moveAgain
                ? m.withConsequence(extra, moveAgain)
                : m,
            );
          }
        };
        // Default (no role) iterates the mover's pieces; a trailing role (P2,
        // Shared, …) iterates that player's. Java ForEachPiece runs the rule AS
        // the target player unless it is the mover or a Shared/Neutral owner —
        // those compute directly with the mover intact (so `(forEach Piece
        // Shared)`'s Snail moves still belong to the actual mover).
        for (const owner of playersForRole(roleName, ctx)) {
          const pctx = foreachPieceSetsMover(owner, ctx.mover, numPlayers)
            ? ctx.withContext(ctx.context.withState(ctx.state.withMover(owner)))
            : ctx;
          const ownerGen = byOwner.get(owner);
          const cells = pctx.state.cells;
          const state = pctx.state;
          for (const s of sites) {
            if (cells[s] !== owner) continue;
            // Dispatch the generator for the *component* on this site (Java: each
            // Component has its own move rule). If per-component ids are missing,
            // fall back to the per-owner generator, which is identical to the old
            // behaviour.
            const what = state.whatAtSite(s);
            // A piece defined with no move generator (Chessence's King) must
            // produce nothing — never inherit the per-owner fallback (its
            // sibling pawn's slide rule). Java: an empty Component generator.
            if (env.componentsWithoutMoves?.has(what)) continue;
            const gen = byWhat?.get(what) ?? ownerGen;
            if (!gen) continue;
            const sub = pctx.withFrame({ from: s, piece: what });
            emitForPiece(gen, sub);
          }
        }
        return out;
      },
    };
  }
  if (kind === "Site") {
    // (forEach Site <region> <moves> [noMoveYet:<moves>] [(then …)]) — bind
    // frame.site (and to) to each member of the region and run the inner move
    // generator there. Java ForEachSite.eval: if the loop yields no move and a
    // `noMoveYet:` fallback is given, return that fallback's moves directly
    // (bypassing this forEach's own `then`); otherwise fold the `(then …)`
    // consequence onto every generated move. Backgammon's bear-off relies on the
    // `noMoveYet:(firstMoveOnTrack …)` arm to escape the furthest home piece when
    // every per-site step overshoots the track.
    const regionNode = node.items[2];
    const movesNode = node.items[3];
    if (!regionNode || !movesNode)
      throw new LudemeCompileError(
        "(forEach Site …) needs a region and a moves clause.",
      );
    const region = compileRegion(regionNode, env);
    const inner = compileMoves(movesNode, env);
    const { named: siteNamed } = parseArgs(node.items.slice(4));
    const noMoveYetNode = siteNamed.get("noMoveYet");
    let elseMoves: MovesFn | undefined;
    if (noMoveYetNode && isList(noMoveYetNode)) {
      try {
        elseMoves = compileMoves(noMoveYetNode, env);
      } catch {
        elseMoves = undefined;
      }
    }
    const siteThenNode = node.items
      .slice(4)
      .find((n): n is LudList => isList(n) && listHead(n) === "then");
    const deferredSiteThen = compileDeferredDiceThen(siteThenNode, env);
    const siteThen =
      siteThenNode && !deferredSiteThen ? compileThen(siteThenNode, env) : undefined;
    return {
      generate: (ctx) => {
        let out: Move[] = [];
        for (const s of region.eval(ctx)) {
          if (s < 0) continue;
          out.push(...inner.generate(ctx.withFrame({ site: s, to: s })));
        }
        if (out.length === 0 && elseMoves) {
          // Java ForEachSite.eval returns the noMoveYet fallback BEFORE applying
          // `then()`; tag these so an enclosing `forEach Die` skips any hoisted
          // turn-retention then (see foreachSiteNoMoveYetMoves above).
          const fallback = elseMoves.generate(ctx);
          for (const m of fallback) foreachSiteNoMoveYetMoves.add(m);
          return fallback;
        }
        if (siteThen) {
          const { moveAgain, moveAgainCond, effect } = siteThen;
          if (effect || moveAgain || moveAgainCond) {
            out = out.map((m) => {
              const effEctx = ctx
                .withContext(
                  ctx.context.withTrial(
                    ctx.context.trial.withMove(m, false, -1),
                  ),
                )
                .withFrame({ from: m.from(), to: m.to() });
              const extra = effect ? effect(effEctx) : [];
              let again = moveAgain;
              if (!again && moveAgainCond) {
                again = moveAgainCond.eval(
                  ctx
                    .applyHypothetical(m)
                    .withFrame({ from: m.from(), to: m.to() }),
                );
              }
              return extra.length > 0 || again
                ? m.withConsequence(extra, again)
                : m;
            });
          }
        }
        if (deferredSiteThen) {
          for (const m of out) deferDiceThen(env, m, deferredSiteThen);
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
    // (forEach Die [combined:<bool>] [replayDouble:<bool>] [if:<bool>] <moves>)
    // — Java ForEachDie.eval. For each die with a non-zero face, bind the pip
    // count (frame.value, read by `(pips)`), test the `if:` rule, generate the
    // inner moves, and tag each with ActionUseDie so the die is spent. With
    // `combined:True`, also emit moves that consume MULTIPLE dice at once for
    // the summed pip count (a single piece moved the total distance) — Java
    // handles the 2-dice sum and, for 3 dice, the triple sum plus each pair.
    const { positional, named } = parseArgs(node.items.slice(2));
    const ifNode = named.get("if");
    const cond: BoolFn = ifNode
      ? compileBool(ifNode, env)
      : { eval: () => true };
    const combinedNode = named.get("combined");
    const combined: BoolFn =
      combinedNode && isList(combinedNode)
        ? compileBool(combinedNode, env)
        : {
            eval: () =>
              !!combinedNode && isIdent(combinedNode) && combinedNode.name === "True",
          };
    // `replayDouble:<bool>` (backgammon family): when the dice read a double the
    // turn is replayed (four moves for two dice). Java's ForEachDie tracks this
    // with a single `temp` value (UNDEFINED ⇒ no doubles in progress): the first
    // pass records the doubled pip in `temp`, then once both dice are spent and
    // they no longer read all-equal it re-arms them via ActionUpdateDice for a
    // second pass, finally clearing `temp`. pip values are always ≥1, so the TS
    // per-player `temp` default of 0 serves as UNDEFINED.
    //
    // `replayDouble` is a *runtime* BooleanFunction (Java `replayDoubleFn.eval`),
    // not just the literal `True`: Daldos/Daldosa use
    // `replayDouble:(and (= (face 36) 1) (= (face 37) 1))` so only a [1,1] roll
    // earns the replay. Java evaluates it then additionally requires every die
    // equal, so the effective per-turn flag is `replayDoubleFn.eval && allEqual`.
    const replayDoubleNode = named.get("replayDouble");
    const replayDoubleConfigured = replayDoubleNode !== undefined;
    const replayDoubleFn: BoolFn =
      replayDoubleNode && isList(replayDoubleNode)
        ? compileBool(replayDoubleNode, env)
        : {
            eval: () =>
              !!replayDoubleNode &&
              isIdent(replayDoubleNode) &&
              replayDoubleNode.name === "True",
          };
    const movesNode = positional[0];
    if (!movesNode)
      throw new LudemeCompileError("(forEach Die …) needs a moves clause.");
    // The `(then "ReplayNotAllDiceUsed")` turn-retention consequence — body
    // `(if (not (all DiceUsed)) (moveAgain))`, or the buried double-nested
    // Daldos form `(if (not (all DiceUsed)) (if (can Move …) (moveAgain)))`
    // which compiles to an ActionSetNextPlayer *effect* — must be evaluated
    // *after* the die is spent, which only this handler knows about (it appends
    // the ActionUseDie). Its placement varies across the backgammon family:
    //   • a direct sibling of `(forEach Die …)`  (Nard), or
    //   • nested on the inner move clause          (Plakoto/Fevga/Tawula:
    //     `(forEach Site … (then …))`, `(move … (then …))`; Daldos:
    //     `(forEach Piece (then …))`).
    // For sibling thens the inner generator never sees them. For nested thens
    // we compile the inner from a then-stripped clause so it does NOT fold them
    // pre-spend; this handler then re-applies *all* collected thens (both their
    // effect actions and turn-retention) on the post-die-spend position below,
    // matching Java where a Move's then runs after every action incl. UseDie.
    const deferredDiceThens = new WeakMap<Move, CompiledThen[]>();
    const innerEnv: CompileEnv = { ...env, deferredDiceThens };
    const siblingThens = node.items
      .slice(2)
      .filter((n): n is LudList => isList(n) && listHead(n) === "then")
      .map((n) => compileThen(n, env));
    const nestedThenNodes: LudList[] = [];
    const collectNestedThens = (n: LudNode): void => {
      if (!isList(n)) return;
      if (listHead(n) === "then") {
        nestedThenNodes.push(n);
        return;
      }
      // A `(then …)` inside a *multi-branch* `(if cond X Y)` or an `(or …)`
      // belongs only to the moves of its own branch/alternative — moves can come
      // from either side, so hoisting it would wrongly stamp it onto every
      // die's moves (Ad elta stelpur's die-6 branch carries
      // `(then (and ("UseADie6") (moveAgain)))` while the die-1 branch carries
      // none). Leave those for `compileMoves` to bake per-branch, matching Java.
      // A *single-branch* `(if cond X)` produces moves only from `X`, so a
      // turn-retention then inside it (Doblet's `(move … (then
      // "ReplayNotAllDiceUsed"))`) applies uniformly and must still be hoisted +
      // resolved post-die-spend so `(all DiceUsed)` sees the die consumed.
      const head = listHead(n);
      if (head === "or") return;
      if (head === "if" && n.items.length >= 4) return; // (if cond then else)
      for (const child of n.items) collectNestedThens(child);
    };
    collectNestedThens(movesNode);
    const nestedThens = nestedThenNodes.map((n) => compileThen(n, env));
    const innerNode =
      nestedThens.length > 0 ? stripThens(movesNode) : movesNode;
    const inner = compileMoves(innerNode, innerEnv);
    const allThens = [...siblingThens, ...nestedThens];
    // Generate the inner moves for a given summed pip count, tagging each with
    // the supplied consequence actions. Mirrors the per-branch body of
    // ForEachDie.eval (setPipCount → rule.eval → moves.eval → add UseDie).
    const emit = (
      ctx: EvalContext,
      pips: number,
      useDice: readonly Action[],
      out: Move[],
    ): void => {
      const sub = ctx.withFrame({ value: pips });
      if (!cond.eval(sub)) return;
      for (const m of inner.generate(sub)) {
        const withDice = m.withConsequence([...useDice], false);
        // A move produced by a `(forEach Site … noMoveYet:…)` *fallback* arm gets
        // the SIBLING thens (direct on this `forEach Die`) but NOT the nested
        // hoisted ones (the `forEach Site`'s own `then`), because Java's
        // ForEachSite.eval returns the fallback before applying its `then()`.
        // All other (main-body) moves get every then. (Backgammon bear-off fix.)
        const hoistedThens = foreachSiteNoMoveYetMoves.has(m)
          ? siblingThens
          : allThens;
        const deferredThens = deferredDiceThens.get(m) ?? [];
        const applicableThens =
          deferredThens.length > 0
            ? [...deferredThens, ...hoistedThens]
            : hoistedThens;
        if (applicableThens.length === 0) {
          out.push(withDice);
          continue;
        }
        // Resolve every `(then …)` on the post-move position (the die just
        // spent), matching Java Move.apply lines 504-520, where consequents run
        // after the move's own actions, and ForEachDie.java lines 117-120, where
        // ActionUseDie is appended before those consequents are stored. `(if
        // (not (all DiceUsed))
        // …)` then sees the remaining dice and retains the turn (via moveAgain
        // or an ActionSetNextPlayer effect) only while at least one die is
        // unused. The pip count is rebound so a then reading `(pips)` resolves.
        const post = ctx.applyHypothetical(withDice).withFrame({ value: pips });
        let moveAgain = false;
        const eff: Action[] = [];
        for (const dt of applicableThens) {
          const condAgain = dt.moveAgainCond?.eval(post) ?? false;
          if (dt.moveAgain || condAgain)
            moveAgain = true;
          if (dt.effect) eff.push(...dt.effect(post));
        }
        out.push(
          eff.length > 0 || moveAgain
            ? withDice.withConsequence(eff, moveAgain)
            : withDice,
        );
      }
    };
    return {
      generate: (ctx) => {
        const dice = ctx.state.diceValues;
        const out: Move[] = [];
        // Runtime doubles flag: config requested AND every die reads the same
        // (non-`(0)` zeros count, matching Java's all-equal test on the live
        // values — so a half-spent pair [0,5] is *not* a double).
        // Java's `temp` (State.tempValue) is a single GLOBAL int, not
        // per-player, and it is NOT reset at turn boundaries — a doubles roll
        // can leave it set so the *next* player's first move still re-arms
        // (see Quinze Tablas trial: P1 doubles → P2's first move re-arms). The
        // compiled-game path stores this in slot 0 (matching `(set Temp)` /
        // `(value Temp)`), so read/write slot 0 here too.
        const temp = ctx.state.temp(0);
        let isDouble = replayDoubleFn.eval(ctx);
        if (isDouble) {
          const first = dice[0] ?? 0;
          for (const d of dice) {
            if ((d ?? 0) !== first) {
              isDouble = false;
              break;
            }
          }
        }
        // Build the doubles bookkeeping appended after a die's ActionUseDie.
        const doubleActions = (pips: number): Action[] => {
          // Java's three-way branch (ForEachDie.eval lines 122-149):
          //   A. replayDouble && temp==UNDEFINED → SetTemp(pipCount)
          //   B. replayDouble                    → SetTemp(UNDEFINED)
          //   C. temp != UNDEFINED               → re-arm every die
          // `isDouble` already folds in `replayDoubleFn.eval` (false when
          // unconfigured), so A/B are correctly gated by it. Branch C must fire
          // INDEPENDENT of replayDouble — a forEach Die with no replayDouble
          // (e.g. Quinze Tablas' normal "Disc" move) still re-arms while a
          // prior doubles roll left temp set. The unset sentinel is Java's
          // `Constants.UNDEFINED` = -1 (State.temp initialises to -1, NOT 0);
          // pip counts are ≥ 1 so -1 is unambiguous. (Was wrongly 0, which made
          // Branch C fire on every game's first non-double move since temp
          // starts at -1 ≠ 0 — corrupting the dice.)
          if (isDouble && temp === -1) return [new ActionSetTemp(0, pips)];
          if (isDouble) return [new ActionSetTemp(0, -1)];
          if (temp !== -1) {
            // Re-arm every die to the stored doubled value for the second pass
            // (Java sets each die's value to faces[temp-1] = temp here).
            const out: Action[] = [];
            for (let loc = 0; loc < dice.length; loc += 1) {
              out.push(new ActionUpdateDice(loc, temp - 1, temp));
            }
            return out;
          }
          return [];
        };
        for (let i = 0; i < dice.length; i += 1) {
          const pips = dice[i] ?? 0;
          if (pips === 0) continue;
          emit(ctx, pips, [new ActionUseDie(i, 0), ...doubleActions(pips)], out);
        }
        if (combined.eval(ctx)) {
          if (dice.length === 2) {
            const d1 = dice[0] ?? 0;
            const d2 = dice[1] ?? 0;
            if (d1 !== 0 && d2 !== 0) {
              emit(ctx, d1 + d2, [new ActionUseDie(0, 0), new ActionUseDie(1, 0)], out);
            }
          } else if (dice.length === 3) {
            const d1 = dice[0] ?? 0;
            const d2 = dice[1] ?? 0;
            const d3 = dice[2] ?? 0;
            if (d1 !== 0 && d2 !== 0 && d3 !== 0) {
              emit(
                ctx,
                d1 + d2 + d3,
                [new ActionUseDie(0, 0), new ActionUseDie(1, 0), new ActionUseDie(2, 0)],
                out,
              );
            }
            // Each pair of the three dice.
            for (let i = 0; i < 2; i += 1) {
              for (let j = i + 1; j < 3; j += 1) {
                const a = dice[i] ?? 0;
                const b = dice[j] ?? 0;
                if (a !== 0 && b !== 0) {
                  emit(ctx, a + b, [new ActionUseDie(i, 0), new ActionUseDie(j, 0)], out);
                }
              }
            }
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
    // Java ForEachDirection: an optional `(between [range] if:<rule>)` makes the
    // directional leg walk multiple steps. `between.range()` gives min/max path
    // length (default 1/1 ⇒ a single step), and `between.condition()` is checked
    // on the intermediate cells (toIdx < minPath) — a failure ends the radial.
    // The body only fires once toIdx >= minPath. Janggi/Qi Guo elephants step 2-3
    // diagonal cells (intermediate empty); Dai Seireigi/Shatranj slide (min,∞).
    const fedBetweenNode = rest.find(
      (n) => isList(n) && listHead(n) === "between",
    ) as LudList | undefined;
    let fedBetweenRule: BoolFn | undefined;
    let fedMinPathFn: IntFn = { eval: () => 1 };
    let fedMaxPathFn: IntFn = { eval: () => 1 };
    if (fedBetweenNode) {
      const { positional: bPos, named: bNamed } = parseArgs(
        fedBetweenNode.items.slice(1),
      );
      const bIf = bNamed.get("if");
      if (bIf) fedBetweenRule = compileBool(bIf, env);
      const INFINITY = 1000000000;
      const rangeNode = bPos.find(
        (n) =>
          isList(n) &&
          (listHead(n) === "range" ||
            listHead(n) === "exact" ||
            listHead(n) === "min" ||
            listHead(n) === "max"),
      ) as LudList | undefined;
      if (rangeNode) {
        const head = listHead(rangeNode);
        const a = rangeNode.items[1];
        const b = rangeNode.items[2];
        if (head === "exact") {
          if (a) {
            fedMinPathFn = compileInt(a, env);
            fedMaxPathFn = fedMinPathFn;
          }
        } else if (head === "min") {
          if (a) fedMinPathFn = compileInt(a, env);
          fedMaxPathFn = { eval: () => INFINITY };
        } else if (head === "max") {
          fedMinPathFn = { eval: () => 1 }; // Java Max.minFn ⇒ emit from toIdx 1
          if (a) fedMaxPathFn = compileInt(a, env);
        } else {
          if (a) fedMinPathFn = compileInt(a, env);
          fedMaxPathFn = b ? compileInt(b, env) : fedMinPathFn;
        }
      }
    }
    // Java ForEachDirection: `to` and `moves` are @Or alternatives. With a
    // `(to if:<cond> (apply <moves>))` body: rule = to.cond() (the `if:`,
    // checked on each reached site) and movesToApply = to.effect().effect()
    // (Apply.effect() returns the wrapped moves *raw*, bypassing the apply's
    // own if:). A direct `(move …)`/`(if …)`/… body is movesToApply with no
    // rule. Shogi-family knights (Keima) use the `(to … (apply …))` form.
    let rule: BoolFn | undefined;
    let inner: MovesFn | undefined;
    const toBodyNode = rest.find(
      (n) => isList(n) && listHead(n) === "to",
    ) as LudList | undefined;
    if (toBodyNode) {
      const { positional, named } = parseArgs(toBodyNode.items.slice(1));
      const ifNode = named.get("if");
      if (ifNode) rule = compileBool(ifNode, env);
      const applyNode = positional.find(
        (n) => isList(n) && listHead(n) === "apply",
      ) as LudList | undefined;
      if (applyNode) {
        const movesArg = parseArgs(applyNode.items.slice(1)).positional.find(
          (n) => isList(n),
        );
        if (movesArg) {
          try {
            inner = compileMoves(movesArg, env);
          } catch {
            inner = undefined;
          }
        }
      }
    } else {
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
      if (bodyNode) {
        try {
          inner = compileMoves(bodyNode, env);
        } catch {
          inner = undefined;
        }
      }
    }
    if (!inner) return EMPTY_MOVES;
    const gen = inner;
    const ruleFn = rule;
    return {
      generate: (ctx) => {
        // The radial *origin* — Java ForEachDirection.startLocationFn (the
        // `(from …)` arg), defaulting to the current to/from site. Used only to
        // anchor the directional steps (Java's `fromV`).
        const iterFrom =
          fromFn?.eval(ctx) ??
          ctx.frame.to ??
          ctx.frame.from ??
          lastToSite(ctx);
        if (iterFrom === undefined || iterFrom < 0) return [];
        // Java never reassigns context.from() while iterating — only context.to
        // (and between) change. So the body's `(from)` keeps reading the
        // original move origin (the moving piece), not the radial origin. e.g.
        // xiangqi's horse: the inner `(from (to))` only re-anchors the radial
        // walk; the emitted move still starts at the horse's own square.
        const baseFrom = ctx.frame.from ?? iterFrom;
        const board = ctx.board;
        const x = board.xOf(iterFrom);
        const y = board.yOf(iterFrom);
        // Java's `newDirection`: when a `to` is already set (we are a nested
        // forEach), relative directions turn about the leg just travelled
        // (context.from()→context.to()), not the piece's own facing.
        const newDir =
          ctx.frame.to !== undefined && ctx.frame.to >= 0
            ? stepCompassName(ctx, baseFrom, ctx.frame.to)
            : undefined;
        const dirs = resolveDirectionTokens(tokens, ctx, iterFrom, newDir);
        const minPath = fedMinPathFn.eval(ctx);
        const maxPath = fedMaxPathFn.eval(ctx);
        const out: Move[] = [];
        const seen = new Set<number>();
        for (const d of dirs) {
          // Walk up to maxPath steps along this radial (Java toIdx loop). For the
          // single-step default (min=max=1) this is one cell, matching the simple
          // knight/king leg; longer legs (elephant, directional slide) continue
          // along the same (dx,dy) on the square/rectangle radial.
          for (let k = 1; k <= maxPath; k += 1) {
            const cell = board.siteAt(x + k * d.dx, y + k * d.dy);
            if (cell < 0) break;
            const stepCtx = ctx.withFrame({ from: baseFrom, to: cell, between: cell });
            // Intermediate cells (toIdx < minPath) must satisfy the between rule;
            // a failure ends the radial (Java `break`).
            if (fedBetweenRule && minPath > 1 && k < minPath) {
              if (!fedBetweenRule.eval(stepCtx)) break;
            }
            // The `to if:` rule is checked at every step; failing it ends the
            // radial (Java `break`), not just this cell.
            if (ruleFn && !ruleFn.eval(stepCtx)) break;
            if (k >= minPath && !seen.has(cell)) {
              seen.add(cell);
              out.push(...gen.generate(stepCtx));
            }
          }
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
    // Java ForEachGroup: (forEach Group [@Opt SiteType] [@Opt Direction] [if:]
    // moves [then]). The optional SiteType / direction idents (Cell, Orthogonal,
    // Adjacent, …) precede the moves body positionally — skip leading idents so
    // gMovesNode is the actual moves list (Sprout-R-Out uses `Orthogonal`).
    const gMovesNode = gPos.find((n) => isList(n));
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
          // Bind the group's sites as the context region so a no-arg `(sites)`
          // inside the body resolves to this group (Java: ForEachGroup sets
          // context.setRegion(group)).
          const sub = ctx.withFrame({ to: rep, from: rep, site: rep, region: sites });
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
 * A direction-token selector for `(move Step …)`. Normally the tokens are fixed
 * at compile time, but a conditional `(if cond <dirs> <dirs>)` direction clause
 * (Java game.functions.directions.If) must be resolved per context — Seesaw
 * Draughts steps forward when its stack height is odd and backward when even.
 * Returns a function of the context yielding the active token list; the
 * condition reads `(from)`, so callers evaluate it with `frame.from` bound to
 * the stepping piece.
 */
function compileStepDirTokens(
  node: LudNode | undefined,
  env: CompileEnv,
): (ctx: EvalContext) => string[] {
  if (
    node &&
    isList(node) &&
    listHead(node) === "if" &&
    node.items.length >= 4 &&
    isDirectionArg(node.items[2] as LudNode) &&
    isDirectionArg(node.items[3] as LudNode)
  ) {
    const cond = compileBool(node.items[1] as LudNode, env);
    const okSel = compileStepDirTokens(node.items[2], env);
    const notSel = compileStepDirTokens(node.items[3], env);
    return (ctx) => (cond.eval(ctx) ? okSel(ctx) : notSel(ctx));
  }
  const tokens = stepDirectionTokens(node);
  return () => tokens;
}

/**
 * On a graph board, the adjacent topology neighbour of `from` whose planar
 * offset best aligns with the facing vector `d`. Mirrors Java's
 * `Directions.convertToAbsolute`, which maps a player-relative facing onto the
 * closest absolute direction the board actually supports: hex / triangular
 * boards have non-integer cell coordinates, so a relative step (Forwards, FL,
 * …) cannot be recovered with integer `siteAt(x±dx, y±dy)` — instead we take
 * the edge-neighbour with the highest cosine similarity to `d`, provided it is
 * within ~60° (cosine > 0.5). Returns -1 when nothing aligns.
 */
function nearestNeighbourInDirection(
  ctx: EvalContext,
  from: number,
  d: Dir,
): number {
  const board = ctx.board;
  const traj = board.traj;
  if (!traj) return -1;
  const mag = Math.hypot(d.dx, d.dy);
  if (mag === 0) return -1;
  const fx = board.xOf(from);
  const fy = board.yOf(from);
  let best = -1;
  let bestCos = 0.5; // ~60° gate; only accept a clearly-aligned neighbour.
  for (const n of traj.neighbours(from)) {
    const vx = board.xOf(n) - fx;
    const vy = board.yOf(n) - fy;
    const vmag = Math.hypot(vx, vy);
    if (vmag === 0) continue;
    const cos = (vx * d.dx + vy * d.dy) / (vmag * mag);
    if (cos > bestCos) {
      bestCos = cos;
      best = n;
    }
  }
  return best;
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
    // On a hex / triangular board the catch-all groups must include the genuine
    // Diagonal relation (Java `AbsoluteDirection.All` = Orthogonal + Diagonal):
    // a hex king/queen step reaches all 12 surrounding cells, not just the 6
    // edge neighbours. On square graph boards (morris / alquerque / concentric,
    // 4 orthogonals) the historical edge-only resolution is preserved, since
    // there the only genuine connections are the drawn graph edges.
    const nonSquare = !traj.isCartesianSliceable();
    const out = new Set<number>();
    for (const token of tokens) {
      if (token === "Orthogonal") {
        for (const n of traj.neighbours(from)) out.add(n);
      } else if (token === "Adjacent" || token === "All") {
        const ns = nonSquare ? traj.group(from, token) : traj.neighbours(from);
        for (const n of ns) out.add(n);
      } else if (token === "Diagonal") {
        for (const n of traj.group(from, "Diagonal")) out.add(n);
      } else {
        // A specific absolute direction (compass N/E/…, or circular
        // In/Out/CW/CCW/Rotational). Java `Step.eval` iterates ALL steps tagged
        // with the direction — not just the nearest — so `Step Rotational`
        // reaches each of In/Out/CW/CCW. Use `steps` (full set) rather than
        // `step` (single nearest), which previously dropped 3 of the 4 on
        // concentric boards.
        const ns = traj.steps(from, token);
        if (ns.length > 0) {
          for (const n of ns) out.add(n);
        } else if (isRelativeDirectionToken(token)) {
          // A player-relative token (Forwards, FL, Rightward, …) is not an
          // AbsoluteDirection, so traj.steps cannot resolve it. Resolve it to a
          // planar facing vector, then pick the adjacent topology neighbour
          // whose own direction best matches it (Java
          // Directions.convertToAbsolute finds the closest supported facing).
          // An exact lattice hit wins; otherwise the most-aligned neighbour
          // within ~60° is taken.
          const x = board.xOf(from);
          const y = board.yOf(from);
          for (const d of resolveDirectionTokens([token], ctx, from)) {
            const exact = board.siteAt(x + d.dx, y + d.dy);
            if (exact !== OFF) {
              out.add(exact);
              continue;
            }
            const best = nearestNeighbourInDirection(ctx, from, d);
            if (best >= 0) out.add(best);
          }
        }
        // Otherwise the token is an AbsoluteDirection (compass N/E/…, circular
        // In/Out/CW/CCW): an empty `traj.steps` means the board genuinely has
        // no edge in that direction (e.g. alquerque's alternating diagonals),
        // so no neighbour is contributed — synthesising a lattice cell here
        // would fabricate an off-graph step.
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
export type EffectFn = (ctx: EvalContext) => Action[];

/**
 * Parsed `(custodial …)` ludeme: the anchor, direction tokens, the bounded
 * `between` predicate + `(apply …)` effect, and the `to` (friendly-bracket)
 * predicate. Shared by the moves form (`(custodial …)` as a move) and the
 * effect form (`(then (custodial …))` / capture written as a consequence),
 * which differ only in how the flanked sites are packaged (a Move vs the raw
 * capture actions). Java: Core/.../nonDecision/effect/Custodial.java.
 */
interface CustodialSpec {
  fromFn: IntFn;
  dirTokens: string[];
  maxFn: IntFn;
  targetFn: BoolFn;
  friendFn: BoolFn;
  applyFn?: EffectFn;
}

function parseCustodialSpec(node: LudList, env: CompileEnv): CustodialSpec {
  const custArgs = parseArgs(node.items.slice(1));
  const custFromNode =
    custArgs.named.get("from") ??
    custArgs.positional.find((n) => isList(n) && listHead(n) === "from");
  let fromFn: IntFn = {
    eval: (ctx) => ctx.frame.site ?? ctx.frame.from ?? OFF,
  };
  if (custFromNode && isList(custFromNode)) {
    const inner = custFromNode.items[1];
    if (inner) {
      try {
        fromFn = compileInt(inner, env);
      } catch {
        /* use frame.site default */
      }
    }
  }
  const dirTokens: string[] = [];
  for (const n of node.items.slice(1)) {
    if (
      isIdent(n) &&
      !n.name.endsWith(":") &&
      [
        "Adjacent", "Orthogonal", "Diagonal", "All",
        "N", "S", "E", "W", "NE", "NW", "SE", "SW",
      ].includes(n.name)
    ) {
      dirTokens.push(n.name);
    }
  }
  const custBetweenNode =
    custArgs.named.get("between") ??
    custArgs.positional.find((n) => isList(n) && listHead(n) === "between");
  let maxFn: IntFn = { eval: () => 64 };
  let targetFn: BoolFn = { eval: () => false };
  let applyFn: EffectFn | undefined;
  if (custBetweenNode && isList(custBetweenNode)) {
    const bArgs = parseArgs(custBetweenNode.items.slice(1));
    const maxNode =
      bArgs.named.get("max") ??
      bArgs.positional.find((n) => isList(n) && listHead(n) === "max");
    if (maxNode) {
      try {
        if (isList(maxNode)) {
          const mi = maxNode.items[1];
          if (mi) maxFn = compileInt(mi, env);
        } else {
          maxFn = compileInt(maxNode, env);
        }
      } catch {
        /* leave as 64 */
      }
    }
    const ifNode = bArgs.named.get("if");
    if (ifNode) {
      try {
        targetFn = compileBool(ifNode, env);
      } catch {
        /* always false */
      }
    }
    const applyNode =
      bArgs.positional.find((n) => isList(n) && listHead(n) === "apply") ??
      bArgs.named.get("apply");
    if (applyNode && isList(applyNode)) {
      try {
        // `(apply <effect>)` — unwrap via compileApply so the inner effect
        // (e.g. `(allCombinations (add …) (flip …))`) is compiled, not the
        // `apply` head itself (which compileEffect does not handle).
        applyFn = compileApply(applyNode as LudList, env);
      } catch {
        /* lenient: no-op */
      }
    }
  }
  const custToNode =
    custArgs.named.get("to") ??
    custArgs.positional.find((n) => isList(n) && listHead(n) === "to");
  let friendFn: BoolFn = { eval: () => false };
  if (custToNode && isList(custToNode)) {
    const toArgs = parseArgs(custToNode.items.slice(1));
    const toIf = toArgs.named.get("if");
    if (toIf) {
      try {
        friendFn = compileBool(toIf, env);
      } catch {
        /* always false */
      }
    }
  }
  return { fromFn, dirTokens, maxFn, targetFn, friendFn, applyFn };
}

/**
 * The flanked sites captured by a custodial scan from `from`: in each
 * direction, walk a contiguous run of `between`-satisfying pieces (at most
 * `max` long) and, if the site immediately past the run satisfies the `to`
 * (friendly bracket) predicate, the whole run is captured. The bracket is
 * checked at the site *after* the bounded run — so a `(max 1)` capture still
 * looks one step beyond its single between-piece for the friend, faithful to
 * Java Custodial (a too-long run simply finds no bracket).
 */
function scanCustodialBetween(
  spec: CustodialSpec,
  ctx: EvalContext,
  from: number,
): number[] {
  const dirs = resolveDirectionTokens(
    spec.dirTokens.length > 0 ? spec.dirTokens : ["Adjacent"],
    ctx,
    // Anchor direction offsets at the landing site `from`, not ctx.frame.from
    // (the pre-move source). On graph boards the per-site offsets differ, so
    // anchoring at the source missed real capture directions. Java Custodial
    // resolves directions from the piece's current location.
    from,
  );
  const maxDist = spec.maxFn.eval(ctx);
  const board = ctx.board;
  const allBetween: number[] = [];
  for (const d of dirs) {
    let betweenSites: number[] = [];
    let x = board.xOf(from);
    let y = board.yOf(from);
    let foundFriend = false;
    for (let guard = 0; guard <= board.numSites; guard += 1) {
      x += d.dx;
      y += d.dy;
      const s = board.siteAt(x, y);
      if (s < 0) break;
      if (spec.targetFn.eval(ctx.withFrame({ between: s, site: s }))) {
        if (betweenSites.length >= maxDist) {
          // Run longer than `max` — no valid bracket in this direction.
          betweenSites = [];
          break;
        }
        betweenSites.push(s);
      } else {
        foundFriend = spec.friendFn.eval(ctx.withFrame({ to: s, site: s }));
        break;
      }
    }
    if (!foundFriend || betweenSites.length === 0) continue;
    allBetween.push(...betweenSites);
  }
  return allBetween;
}

/**
 * Aggregate the per-between `(apply …)` actions over every flanked site into
 * one deduplicated action stream. `site` stays bound to the anchor so a
 * `(add … (to (site)))` apply places at the anchor, not the between site;
 * distinct flips/removes are all kept. With no `(apply …)`, the default is a
 * state-set to the mover (custodial flip games).
 */
function custodialActions(
  spec: CustodialSpec,
  ctx: EvalContext,
  from: number,
  allBetween: readonly number[],
  mover: number,
): Action[] {
  const actions: Action[] = [];
  const seen = new Set<string>();
  for (const bs of allBetween) {
    const bctx = ctx.withFrame({ between: bs, from, to: bs });
    let acts: Action[] = [];
    if (spec.applyFn) {
      try {
        acts = spec.applyFn(bctx);
      } catch {
        acts = [];
      }
    }
    if (acts.length === 0) {
      acts = [new ActionSetState({ to: bs, state: mover })];
    }
    for (const a of acts) {
      const anyA = a as unknown as {
        from?: () => number;
        to?: () => number;
        what?: number;
        state?: number;
      };
      const key = `${a.constructor.name}:${anyA.from?.() ?? ""}:${anyA.to?.() ?? ""}:${anyA.what ?? ""}:${anyA.state ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      actions.push(a);
    }
  }
  return actions;
}

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
export function compileEffect(node: LudList, env: CompileEnv): EffectFn {
  const head = listHead(node);
  const _r = head ? lookupLudeme("effect", head) : undefined;
  if (_r) {
    const compiled = _r(node, env) as EffectFn | undefined;
    if (compiled) return compiled;
  }
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
      return (ctx) =>
        inner.generate(ctx).flatMap((m) => {
          // `withConsequence`/`withPrependedActions` fold the prologue, the
          // `next:` arm and the do's own `(then …)` into `m.actions`. The do's
          // then-level `(moveAgain)` is a separate flag (not an action), so
          // re-encode it here as the ActionSetNextPlayer it stands for, keeping
          // the same player on the move when this effect runs in a consequent.
          const acts = [...m.actions];
          if (m.moveAgain) acts.push(new ActionSetNextPlayer(m.mover));
          return acts;
        });
    } catch {
      return () => [];
    }
  }
  if (head === "allCombinations") {
    // `(allCombinations <movesA> <movesB> …)` — Java AllCombinations builds the
    // cartesian product of the sub-moves. As a custodial `(apply …)` body each
    // sub-effect contributes a single deterministic action stream (place a disc
    // at the anchor AND flip/recolour the flanked run), so the product collapses
    // to one combined move: concatenate every sub-effect's actions.
    // Java: Core/src/game/rules/play/moves/nonDecision/operators/foreach/AllCombinations.java
    const parts = node.items
      .slice(1)
      .filter((n): n is LudList => isList(n))
      .map((n) => compileEffectLenient(n, env));
    return (ctx) => parts.flatMap((p) => p(ctx));
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
export function compileEffectLenient(node: LudList, env: CompileEnv): EffectFn {
  try {
    return compileEffect(node, env);
  } catch {
    return () => [];
  }
}

/** An effect node that may be a leaf or control-flow; empty if not a list. */
export function effectOf(node: LudNode, env: CompileEnv): EffectFn {
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
    const siteThenNode = node.items
      .slice(4)
      .find((n): n is LudList => isList(n) && listHead(n) === "then");
    const siteThen = siteThenNode
      ? compileThen(siteThenNode, env, false, true)
      : undefined;
    return (ctx) => {
      const out: Action[] = [];
      let postState = ctx.context.state;
      for (const s of region.eval(ctx)) {
        if (s < 0) continue;
        const siteCtx = ctx
          .withContext(ctx.context.withState(postState))
          .withFrame({ site: s, to: s });
        const body = eff(siteCtx);
        out.push(...body);
        for (const a of body) postState = a.apply(postState);
        // Java consequence semantics attach a `(then ...)` to the moves/effects
        // actually generated for this site. If the body yielded no actions
        // (e.g. `(if (> (count at:(site)) 0) (fromTo ...))` on an empty pit),
        // skip the site-level then entirely instead of running it as an
        // unconditional per-site epilogue. Whyo's round-close sweep depends on
        // this: only the occupied pits that transfer seeds to the store should
        // trigger the follow-up score/update block.
        if (siteThen && body.length > 0) {
          const thenCtx = ctx
            .withContext(ctx.context.withState(postState))
            .withFrame({ site: s, to: s });
          const extra = siteThen.effect ? siteThen.effect(thenCtx) : [];
          out.push(...extra);
          for (const a of extra) postState = a.apply(postState);
          let again = siteThen.moveAgain;
          if (!again && siteThen.moveAgainCond) {
            again = siteThen.moveAgainCond.eval(thenCtx);
          }
          if (again) out.push(new ActionSetNextPlayer(ctx.mover));
        }
      }
      return out;
    };
  }
  if (kind === "Level") {
    // `(forEach Level <site> [FromBottom|FromTop] <effect>)` as a then-consequent
    // effect — iterate every stack level at the site (top→bottom by default) and
    // run the sub-effect with `frame.level` bound to each index, flattening the
    // actions. Java `ForEachLevel.eval` reads `stackSize` ONCE then iterates fixed
    // level indices, collecting each level's actions against the same pre-move
    // state; FromTop is used for captures so removing top-down keeps lower-level
    // indices valid as the stack shrinks on apply. Used by quan-capture mancala
    // (O An Quan / Bay Khom) to lift each seed of a captured stack into the hand:
    // `(forEach Level <hole> FromTop (if … (fromTo (from <hole> level:(level)) …)))`.
    // Java: Core/.../operators/foreach/level/ForEachLevel.java.
    const { positional: lvlPos } = parseArgs(node.items.slice(2));
    const lvlSiteNode = lvlPos[0];
    if (!lvlSiteNode) return () => [];
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
    const effectNode = lvlPos[lvlBodyIdx];
    if (!effectNode) return () => [];
    const eff = effectOf(effectNode, env);
    return (ctx) => {
      const site = lvlSiteFn.eval(ctx);
      if (site < 0) return [];
      const stackSize = ctx.state.stackSize(site);
      const levels: number[] = fromBottom
        ? Array.from({ length: stackSize }, (_, i) => i)
        : Array.from({ length: stackSize }, (_, i) => stackSize - 1 - i);
      const out: Action[] = [];
      for (const level of levels) {
        out.push(...eff(ctx.withFrame({ level, site, to: site })));
      }
      return out;
    };
  }
  if (kind === "Player") {
    // `(forEach Player <effect>)` — bind `frame.player` to each player id
    // 1..numPlayers and run the sub-effect, so `(set Score Player …)` and
    // `(player)`/`Player`-role references inside resolve per player.
    // Java: Core/.../operators/foreach/player/ForEachPlayer.java.
    const effectNode = node.items[2];
    if (!effectNode) return () => [];
    const eff = effectOf(effectNode, env);
    return (ctx) => {
      const out: Action[] = [];
      const n = ctx.context.game.numPlayers;
      for (let p = 1; p <= n; p += 1) {
        out.push(...eff(ctx.withFrame({ player: p })));
      }
      return out;
    };
  }
  if (kind === "Value") {
    // `(forEach Value <list> <effect>)` / `(forEach Value min:<a> max:<b>
    // <effect>)` — bind `frame.value` to each value and run the sub-effect.
    // Java: Core/.../operators/foreach/value/ForEachValue.java. Used in two-row
    // mancala consequents (Adi/Gabata/Qelat …) to release the opponent's
    // re-sow restriction on each hole the seeds passed through:
    // `(forEach Value (array (sites Track …)) (if (is In (value) (values
    // Remembered "P2SowFrom")) (forget Value "P2SowFrom" (value))))`.
    const { positional, named } = parseArgs(node.items.slice(2));
    const minNode = named.get("min");
    const maxNode = named.get("max");
    if (!minNode && !maxNode) {
      const listNode = positional[0];
      const effectNode = positional[1];
      if (!listNode || !effectNode) return () => [];
      const listFn = compileRegion(listNode, env);
      const eff = effectOf(effectNode, env);
      return (ctx) => {
        const out: Action[] = [];
        for (const v of listFn.eval(ctx)) {
          out.push(...eff(ctx.withFrame({ value: v })));
        }
        return out;
      };
    }
    const effectNode = positional[0];
    if (!minNode || !maxNode || !effectNode) return () => [];
    const minFn = compileInt(minNode, env);
    const maxFn = compileInt(maxNode, env);
    const eff = effectOf(effectNode, env);
    return (ctx) => {
      const lo = minFn.eval(ctx);
      const hi = maxFn.eval(ctx);
      const out: Action[] = [];
      for (let v = lo; v <= hi; v += 1) {
        const sub = ctx.withFrame({ value: v });
        const produced = eff(sub);
        out.push(...produced);
      }
      return out;
    };
  }
  if (kind === "Group") {
    // `(forEach Group [SiteType] [Direction] [if:<cond>] <effect>)` — iterate
    // every maximal same-owner connected group, bind `(sites)` to the group's
    // sites and `(to)`/`(from)`/`(site)` to its representative (max) site,
    // apply the optional `if:` filter, then run the sub-effect. Mirrors the
    // moves-path ForEachGroup (see compileForEach). Used by group-scoring games
    // (Elea/Manifold/Brood/…) inside `(then …)` to recompute scores per group
    // via `(set Score …)`/`(addScore …)`.
    // @java game.rules.play.moves.nonDecision.operators.foreach.group.ForEachGroup
    const { positional: gPos, named: gNamed } = parseArgs(node.items.slice(2));
    const gIfNode = gNamed.get("if");
    const gCond: BoolFn = gIfNode
      ? compileBool(gIfNode, env)
      : { eval: () => true };
    // Leading SiteType / Direction idents precede the effect body positionally.
    let dirTokens: string[] = ["Orthogonal"];
    let bodyNode: LudNode | undefined;
    for (const n of gPos) {
      if (isIdent(n)) {
        if (SITE_TYPE_IDENTS.has(n.name)) continue;
        dirTokens = [n.name];
        continue;
      }
      if (isList(n)) {
        // A `(directions …)`/`{…}` direction set, else the effect body.
        if (!bodyNode && SIZES_DIRECTION_NAMES.has(listHead(n) ?? "__")) {
          const toks = rawDirectionTokens(n).filter((s) => !s.startsWith("#"));
          if (toks.length > 0) dirTokens = toks;
          continue;
        }
        bodyNode = n;
        break;
      }
    }
    if (!bodyNode) return () => [];
    // Fail-soft: a group-effect body using a form we can't compile yet
    // (e.g. `(priority …)`/`(pass …)` in Bug/Lifeline) degrades the whole
    // iteration to a no-op rather than failing the game's compile — matching
    // the prior silent-skip of unsupported `forEach Group` consequents.
    let eff: EffectFn;
    try {
      eff = effectOf(bodyNode, env);
    } catch {
      return () => [];
    }
    return (ctx) => {
      const cells = ctx.state.cells;
      const nSites = cells.length;
      const seen = new Set<number>();
      const out: Action[] = [];
      for (let start = 0; start < nSites; start += 1) {
        const owner = cells[start] ?? 0;
        if (owner === 0 || seen.has(start)) continue;
        const comp: number[] = [start];
        seen.add(start);
        const stack = [start];
        while (stack.length > 0) {
          const s = stack.pop() as number;
          for (const nb of aroundSites(ctx, s, dirTokens)) {
            if (!seen.has(nb) && (cells[nb] ?? 0) === owner) {
              seen.add(nb);
              comp.push(nb);
              stack.push(nb);
            }
          }
        }
        const rep = Math.max(...comp);
        const sub = ctx.withFrame({ to: rep, from: rep, site: rep, region: comp });
        if (!gCond.eval(sub)) continue;
        out.push(...eff(sub));
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
  // The direction is an ident or a `(directions …)`/set node — never the
  // `(to …)`, `(from …)`, or `(then …)` sub-lists. Matching by `isDirectionArg`
  // (as compileSlide/compileHop do) avoids mistaking `(then …)`/`(from …)` for
  // a direction, which would resolve to no neighbours and yield zero moves.
  const dirNode = after.find(
    (n) => n !== toNode && isDirectionArg(n),
  );
  const dirTokensFn = compileStepDirTokens(dirNode, env);

  // An explicit `(from <site> [if:<cond>])` clause overrides the bound
  // `frame.from` (e.g. the Capture-phase continuation `(move Step (from
  // (last To)) Orthogonal …)` in Khamousiyya/Seega variants, which steps the
  // just-moved piece again). Without it Step read an unset frame.from and
  // generated nothing. Mirrors compileLeap/compileHop. Java: Step.eval reads
  // the move's own `from` location function before iterating directions.
  const fromNode = after.find((n) => isList(n) && listHead(n) === "from") as
    | LudList
    | undefined;
  let fromFn: IntFn | undefined;
  let fromCond: BoolFn | undefined;
  if (fromNode) {
    const { positional, named } = parseArgs(fromNode.items.slice(1));
    const locArg = dropSiteType(positional)[0];
    if (locArg) fromFn = compileInt(locArg, env);
    const ifNode = named.get("if");
    if (ifNode) fromCond = compileBool(ifNode, env);
  }

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
      const from = fromFn ? fromFn.eval(ctx) : ctx.frame.from;
      if (from === undefined || from < 0) return [];
      if (fromCond && !fromCond.eval(ctx.withFrame({ from }))) return [];
      const mover = ctx.mover;
      const out: Move[] = [];
      // Resolve the direction tokens for this step from the bound piece — a
      // conditional `(if …)` clause may select a different set per context.
      const tokens = dirTokensFn(ctx);
      // Java Step.alreadyCompute: a (from,to) pair is emitted once even when
      // overlapping direction tokens reach the same neighbour.
      const seen = new Set<number>();
      for (const to of stepNeighbours(ctx, from, tokens)) {
        if (to === OFF || seen.has(to)) continue;
        seen.add(to);
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
            // @java Core/src/game/rules/play/moves/nonDecision/effect/Step.java:233
            fromNonDecisionSite: from,
            toNonDecisionSite: to,
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
 * Square-board orthogonal directions in the order Java's
 * `Topology.supportedOrthogonalDirections(Cell)` reports them (corner-first
 * scan, AbsoluteDirection ordinal N<E<S<W) — `state % 4` indexes this list to
 * pick a large piece's start heading. Distinct from {@link ORTHO_HEADINGS},
 * which a leap walk runs from every heading (order irrelevant there).
 */
const LARGE_PIECE_DIRS: readonly { name: string; dx: number; dy: number }[] = [
  { name: "N", dx: 0, dy: 1 },
  { name: "E", dx: 1, dy: 0 },
  { name: "S", dx: 0, dy: -1 },
  { name: "W", dx: -1, dy: 0 },
];
/** Clockwise compass order for `right()`/`left()` rotation between headings. */
const COMPASS_CW = ["N", "E", "S", "W"] as const;

/**
 * Faithful port of `Component.locs` for square (numSides:4) boards: walk a
 * large piece's turtle path from `anchor` and return every cell it covers
 * (anchor first), or `null` if any forward step leaves the board (Java returns
 * an empty list ⇒ an illegal placement). `state` encodes both the start
 * heading (`state % 4` into {@link LARGE_PIECE_DIRS}) and which walk variant
 * to use (`state / 4` into `walks`). `F` advances one cell along the heading;
 * `R`/`L` rotate it clockwise/counter-clockwise through the compass (skipping
 * nothing on a 4-way board, so N→E→S→W). Duplicate cells are dropped.
 */
export function largePieceFootprint(
  board: { xOf: (s: number) => number; yOf: (s: number) => number; siteAt: (x: number, y: number) => number },
  anchor: number,
  state: number,
  walks: readonly string[][],
): number[] | null {
  const realState = state >= 0 ? state : 0;
  const size = LARGE_PIECE_DIRS.length;
  let dirName = LARGE_PIECE_DIRS[realState % size]?.name ?? "N";
  const indexWalk = Math.floor(realState / size);
  const cells = [anchor];
  if (indexWalk >= walks.length) return cells;
  const steps = walks[indexWalk] ?? [];
  let cur = anchor;
  for (const step of steps) {
    if (step === "F") {
      const dir = LARGE_PIECE_DIRS.find((d) => d.name === dirName);
      if (!dir) return null;
      const to = board.siteAt(board.xOf(cur) + dir.dx, board.yOf(cur) + dir.dy);
      if (to === OFF || to < 0) return null;
      if (!cells.includes(to)) cells.push(to);
      cur = to;
    } else if (step === "R") {
      const i = COMPASS_CW.indexOf(dirName as (typeof COMPASS_CW)[number]);
      dirName = COMPASS_CW[(i + 1) % 4] ?? dirName;
    } else if (step === "L") {
      const i = COMPASS_CW.indexOf(dirName as (typeof COMPASS_CW)[number]);
      dirName = COMPASS_CW[(i + 3) % 4] ?? dirName;
    }
  }
  return cells;
}

/**
 * `(move Leap <walk> (to if:<land> (apply <effect>)?))` and the bare
 * `(leap [(from <loc>)] <walk> (to …))` form. From the leap origin, jump to
 * each walk-derived offset whose `to:` guard holds. Like Step, the relocation
 * overwrites its destination, so an `(apply (remove (to)))` capturing the
 * landing cell is subsumed and dropped.
 *
 * The origin is `(from <loc>)` when given (Java Leap's `from.loc()`), else the
 * current `frame.from`. A `(from … if:<cond>)` guard is checked with the
 * origin bound to `frame.from`, matching Java's `setFrom`-then-`fromCondition`.
 */
function compileLeap(node: LudList, env: CompileEnv): MovesFn {
  // (move Leap …) skips [move, Leap]; bare (leap …) skips just [leap].
  const after = node.items.slice(listHead(node) === "leap" ? 1 : 2);
  const { positional, named } = parseArgs(after);
  const toNode = positional.find((n) => isList(n) && listHead(n) === "to") as
    | LudList
    | undefined;
  const fromNode = positional.find((n) => isList(n) && listHead(n) === "from") as
    | LudList
    | undefined;
  const walkNode = positional.find((n) => n !== toNode && n !== fromNode);
  const walks = parseWalks(walkNode);
  const offsets = walkOffsets(walks);
  // Java SitesWalk's `rotations` defaults to True (run the walk from every
  // supported orthogonal heading). Only graph boards consult `walks`; the
  // Cartesian fallback below already covers all rotations implicitly.
  const rotNode = named.get("rotations");
  const rotationsFn: BoolFn = rotNode
    ? compileBool(rotNode, env)
    : { eval: () => true };

  let fromFn: IntFn | undefined;
  let fromCond: BoolFn | undefined;
  if (fromNode) {
    const { positional, named } = parseArgs(fromNode.items.slice(1));
    const locArg = dropSiteType(positional)[0];
    if (locArg) fromFn = compileInt(locArg, env);
    const ifNode = named.get("if");
    if (ifNode) fromCond = compileBool(ifNode, env);
  }

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
      const from = fromFn ? fromFn.eval(ctx) : ctx.frame.from;
      if (from === undefined || from < 0) return [];
      if (fromCond && !fromCond.eval(ctx.withFrame({ from }))) return [];
      const board = ctx.board;
      const mover = ctx.mover;
      const out: Move[] = [];
      // Non-square graph boards (hex / triangular) resolve the turtle walk
      // through the real topology — the Cartesian dx/dy offsets are only valid
      // on a square lattice. Square boards (plain or graph) keep the proven
      // Cartesian path. @java SitesWalk.eval.
      let tos: number[];
      if (board.traj && !board.traj.isCartesianSliceable()) {
        tos = board.traj.walkSites(from, walks, rotationsFn.eval(ctx));
      } else {
        const x = board.xOf(from);
        const y = board.yOf(from);
        tos = [];
        for (const d of offsets) {
          const t = board.siteAt(x + d.dx, y + d.dy);
          if (t !== OFF) tos.push(t);
        }
      }
      for (const to of tos) {
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

/**
 * Default `goRule` for a slide with no explicit `(between if:…)` — Java:
 * `IsIn(Between, SitesEmpty)`, i.e. the slide passes through (and may stop on)
 * an empty cell only. Evaluated against `frame.between`, which the slide loop
 * sets to the candidate cell.
 */
const SLIDE_DEFAULT_GO: BoolFn = {
  eval: (ctx) => {
    const s = ctx.frame.between ?? OFF;
    return s >= 0 && s < ctx.state.cells.length && (ctx.state.cells[s] ?? 0) === 0;
  },
};

/** Java Constants.UNDEFINED — a `min` of -1 makes `min <= toIdx` always hold. */
const SLIDE_MIN_UNDEFINED = -1;
/** Java Constants.MAX_DISTANCE — the unbounded slide reach. */
const SLIDE_MAX_DISTANCE = 1000;

/**
 * Extract the `(between …)` distance bounds: `(exact N)` → min=max=N,
 * `(range A B)` → min=A,max=B. Returns IntFns (evaluated per context, as Java
 * does) or the unbounded defaults when no range ludeme is present.
 */
function slideRange(
  betweenNode: LudList | undefined,
  env: CompileEnv,
): { minFn: IntFn; maxFn: IntFn } {
  const def = {
    minFn: { eval: () => SLIDE_MIN_UNDEFINED } as IntFn,
    maxFn: { eval: () => SLIDE_MAX_DISTANCE } as IntFn,
  };
  if (!betweenNode) return def;
  const { positional } = parseArgs(betweenNode.items.slice(1));
  const rangeNode = positional.find(
    (n) =>
      isList(n) &&
      (listHead(n) === "exact" ||
        listHead(n) === "range" ||
        listHead(n) === "min" ||
        listHead(n) === "max"),
  ) as LudList | undefined;
  if (!rangeNode) return def;
  const head = listHead(rangeNode);
  if (head === "exact") {
    const n = rangeNode.items[1];
    if (!n) return def;
    const fn = compileInt(n, env);
    return { minFn: fn, maxFn: fn };
  }
  if (head === "range") {
    const a = rangeNode.items[1];
    const b = rangeNode.items[2];
    if (!a) return def;
    const minFn = compileInt(a, env);
    return { minFn, maxFn: b ? compileInt(b, env) : minFn };
  }
  if (head === "max") {
    // (max N) — upper bound only; min stays UNDEFINED (always passes). Java
    // Max parses to range(minFn=UNDEFINED, maxFn=N), and Slide uses minFn as
    // the lower guard (-1 ≤ toIdx is always true) and maxFn as the ray limit.
    const a = rangeNode.items[1];
    return a ? { minFn: def.minFn, maxFn: compileInt(a, env) } : def;
  }
  // (min N) — lower bound only, unbounded above.
  const a = rangeNode.items[1];
  return a
    ? { minFn: compileInt(a, env), maxFn: def.maxFn }
    : def;
}

/**
 * Direction tokens for a `(move Slide …)` / `(move Hop …)` / `(move Shoot …)`.
 * With none given, Java defaults the dirnChoice to `AbsoluteDirection.Adjacent`
 * (Slide.java:166-167, Hop.java:137-138, Shoot.java:107-108) — NOT every compass
 * direction. The distinction only matters off a square *cell* board, where the
 * `Adjacent` relation already tags all 8 king-neighbours (so a bare `(move
 * Slide)` is the Amazons chess-queen slide). On a square *vertex* board (Go-style
 * intersections) `Adjacent` is the four orthogonal grid edges, so the default
 * must be `Adjacent`, not `All`, for the slide to run orthogonally as Java does
 * (Lewthwaite's Game, Orthokon, Xiangqi chariots, …). Explicit `(directions …)`
 * or a bare group keyword still override it.
 */
function slideDirectionTokens(node: LudNode | undefined): string[] {
  const tokens = rawDirectionTokens(node).filter((t) => !t.startsWith("#"));
  return tokens.length > 0 ? tokens : ["Adjacent"];
}

/** A `(difference …)` / `(union …)` / `(intersection …)` direction-set node. */
function isDirSetCombinator(node: LudNode): boolean {
  if (!isList(node)) return false;
  const head = listHead(node);
  return (
    head === "difference" || head === "union" || head === "intersection"
  );
}

/** True for any node that supplies a direction set to a move ludeme: a bare
 * group keyword, a `(directions {…})` list, a set combinator, or a conditional
 * `(if cond <dirs> <dirs>)` whose branches are themselves direction args
 * (Java game.functions.directions.If, e.g. `(if (is Mover P1) Orthogonal
 * Diagonal)`). */
function isDirectionArg(node: LudNode): boolean {
  if (isIdent(node)) {
    // A named-argument flag (`stack:True`, `top:True`, `count:2` …) lexes as a
    // bare key ident ending in ':' followed by its value ident. Java parses
    // these as named args, never as a direction — but our move compilers find
    // the direction set with `.find(isDirectionArg)` over the raw arg list, so
    // an unfiltered "stack:" / "True" would bind the direction set to a token
    // that resolves to no offsets, yielding zero moves (e.g. Murus Gallicus'
    // `(move Hop … stack:True)`). Exclude the key and boolean-literal value.
    const n = node.name;
    if (n.endsWith(":") || n === "True" || n === "False") return false;
    return true;
  }
  if (!isList(node)) return false;
  const head = listHead(node);
  if (head === "directions" || isDirSetCombinator(node)) return true;
  if (head === "if" && node.items.length >= 4) {
    return (
      isDirectionArg(node.items[2] as LudNode) &&
      isDirectionArg(node.items[3] as LudNode)
    );
  }
  return false;
}

/** Stable key for de-duping / set-arithmetic on direction offsets. */
function dirKey(d: Dir): string {
  return `${d.dx},${d.dy}`;
}

/**
 * Compile a direction-set node into an eval-time resolver of concrete offsets.
 *
 * Handles the set-combinator ludemes (Java game.functions.directions):
 *   - `(difference A B…)` — A with every direction in B… removed (Difference.java)
 *   - `(union A B…)` — every direction in any operand (Union.java)
 *   - `(intersection A B…)` — directions present in all operands (Intersection.java)
 * Operands recurse, so combinators nest. Everything else falls through to the
 * token path (`slideDirectionTokens` + `resolveDirectionTokens`), which also
 * resolves the move-relative `SameDirection` / `OppositeDirection` tokens.
 * Set operations key directions by their (dx,dy) offset.
 */
function compileDirsResolver(
  node: LudNode | undefined,
  env: CompileEnv,
): (ctx: EvalContext, fromSite?: number) => Dir[] {
  if (node && isDirSetCombinator(node as LudNode)) {
    const list = node as LudList;
    const head = listHead(list);
    const parts = list.items.slice(1).map((n) => compileDirsResolver(n, env));
    if (head === "difference") {
      const first = parts[0];
      const rest = parts.slice(1);
      if (!first) return () => [];
      return (ctx, fromSite) => {
        const removed = new Set<string>();
        for (const p of rest) {
          for (const d of p(ctx, fromSite)) removed.add(dirKey(d));
        }
        return first(ctx, fromSite).filter((d) => !removed.has(dirKey(d)));
      };
    }
    if (head === "intersection") {
      const first = parts[0];
      if (!first) return () => [];
      return (ctx, fromSite) => {
        const sets = parts.map((p) => new Set(p(ctx, fromSite).map(dirKey)));
        const out: Dir[] = [];
        const seen = new Set<string>();
        for (const d of first(ctx, fromSite)) {
          const k = dirKey(d);
          if (seen.has(k)) continue;
          if (sets.every((s) => s.has(k))) {
            out.push(d);
            seen.add(k);
          }
        }
        return out;
      };
    }
    // union
    return (ctx, fromSite) => {
      const out: Dir[] = [];
      const seen = new Set<string>();
      for (const p of parts) {
        for (const d of p(ctx, fromSite)) {
          const k = dirKey(d);
          if (!seen.has(k)) {
            seen.add(k);
            out.push(d);
          }
        }
      }
      return out;
    };
  }
  // Conditional direction set — Java game.functions.directions.If: evaluate the
  // condition in context and resolve whichever branch's directions hold. Used
  // by Seesaw Draughts' `(if (is Odd (size Stack at:(from))) (directions {FL FR})
  // (directions {BL BR}))` (odd stacks step forward, even stacks backward). The
  // condition reads `(from)` so it is evaluated against `fromSite` when given.
  if (
    node &&
    isList(node) &&
    listHead(node) === "if" &&
    node.items.length >= 4 &&
    isDirectionArg(node.items[2] as LudNode) &&
    isDirectionArg(node.items[3] as LudNode)
  ) {
    const list = node as LudList;
    const cond = compileBool(list.items[1] as LudNode, env);
    const okResolver = compileDirsResolver(list.items[2], env);
    const notResolver = compileDirsResolver(list.items[3], env);
    return (ctx, fromSite) => {
      const cctx =
        fromSite !== undefined && fromSite >= 0
          ? ctx.withFrame({ ...ctx.frame, from: fromSite })
          : ctx;
      return cond.eval(cctx)
        ? okResolver(cctx, fromSite)
        : notResolver(cctx, fromSite);
    };
  }
  const tokens = slideDirectionTokens(node);
  return (ctx, fromSite) => resolveDirectionTokens(tokens, ctx, fromSite);
}

/**
 * Resolve a slide direction-set node to AbsoluteDirection NAMES for the topology
 * (radial) slide path used on non-square graph boards. Returns `null` whenever
 * the set cannot be expressed faithfully as absolute-direction names — a
 * player-relative cone (Forwards/Leftward/…), an `of:` base relation, or a set
 * difference/intersection. The caller then falls back to the Cartesian offset
 * path. Group keywords (All/Orthogonal/Diagonal/Adjacent) and explicit compass
 * directions pass straight through to `traj.radialsByName`, which is all the
 * hex/triangular sliders in the corpus need.
 */
function compileSlideDirNames(
  node: LudNode | undefined,
  env: CompileEnv,
): (ctx: EvalContext, fromSite?: number) => string[] | null {
  if (node && isDirSetCombinator(node)) {
    const list = node as LudList;
    if (listHead(list) !== "union") return () => null; // difference/intersection
    const parts = list.items.slice(1).map((n) => compileSlideDirNames(n, env));
    return (ctx, fromSite) => {
      const out: string[] = [];
      const seen = new Set<string>();
      for (const p of parts) {
        const names = p(ctx, fromSite);
        if (names === null) return null;
        for (const nm of names) {
          if (!seen.has(nm)) {
            seen.add(nm);
            out.push(nm);
          }
        }
      }
      return out;
    };
  }
  if (
    node &&
    isList(node) &&
    listHead(node) === "if" &&
    node.items.length >= 4 &&
    isDirectionArg(node.items[2] as LudNode) &&
    isDirectionArg(node.items[3] as LudNode)
  ) {
    const list = node as LudList;
    const cond = compileBool(list.items[1] as LudNode, env);
    const okResolver = compileSlideDirNames(list.items[2], env);
    const notResolver = compileSlideDirNames(list.items[3], env);
    return (ctx, fromSite) => {
      const cctx =
        fromSite !== undefined && fromSite >= 0
          ? ctx.withFrame({ ...ctx.frame, from: fromSite })
          : ctx;
      return cond.eval(cctx)
        ? okResolver(cctx, fromSite)
        : notResolver(cctx, fromSite);
    };
  }
  const tokens = slideDirectionTokens(node);
  // Every token must be a known absolute direction (group or compass); a
  // relative token (Forwards, of:…, SameDirection, …) is undefined here and
  // forces the Cartesian fallback.
  const resolvable =
    tokens.length > 0 && tokens.every((t) => directionByName(t) !== undefined);
  const result: string[] | null = resolvable ? tokens : null;
  return () => result;
}

/**
 * `(move Slide <dir?> (between (range)? if:<go>)? (to if:<stop> (apply <eff>))?)`.
 *
 * Faithful port of Java `Slide.eval` (Slide.java). Per direction the radial is
 * walked cell-by-cell (`toIdx` = 1,2,…):
 *
 *   - `stopRule` = the `to if:` condition. When it holds, a move to this cell
 *     is emitted (only if `min <= toIdx`) and the ray then breaks — BUT the
 *     break itself is gated on `min <= toIdx`, so a not-yet-reached minimum
 *     keeps the ray going (this is what makes `(between (exact 2))` skip the
 *     distance-1 cell yet still stop at distance 2).
 *   - `goRule` = the `between if:` condition (default: the cell is empty).
 *     When it fails the ray breaks; when it holds a move is emitted (if
 *     `min <= toIdx`) and the walk continues.
 *   - `min`/`max` come from the `(between (exact N))` / `(range A B)` ludeme,
 *     defaulting to UNDEFINED (-1, always passes) / MAX_DISTANCE.
 *
 * The `(apply …)` side effect (typically `(remove (to))`) is chained onto every
 * emitted move; a relocation already overwrites its destination, so a remove of
 * the landing cell is dropped (it captures via the move itself). A bare
 * `(move Slide)` has no stopRule and the default empty goRule, giving the usual
 * slide-through-empty-only (no capture) shape.
 */
function compileSlide(node: LudList, env: CompileEnv, startIndex = 2): MovesFn {
  const after = node.items.slice(startIndex);
  const toNode = after.find((n) => isList(n) && listHead(n) === "to") as
    | LudList
    | undefined;
  const betweenNode = after.find(
    (n) => isList(n) && listHead(n) === "between",
  ) as LudList | undefined;
  // A leading string positional names the track(s) to slide along (Java
  // Slide's `track` arg → slideByTrack). e.g. Daldos `(move Slide "Track1" …)`.
  const trackNameNode = after.find((n) => isString(n));
  const trackName =
    trackNameNode && isString(trackNameNode) ? trackNameNode.value : undefined;
  const dirNode = after.find(
    (n) => n !== toNode && n !== betweenNode && isDirectionArg(n),
  );
  const resolveDirs = compileDirsResolver(dirNode, env);
  const resolveDirNames = compileSlideDirNames(dirNode, env);

  // stopRule = `to.cond()` (the `to if:`); null when there is no `to` clause.
  let stopRule: BoolFn | undefined;
  let effect: EffectFn | undefined;
  // toRule = `to.effect().condition()` — the `if:` *inside* the `(apply …)`.
  // Java gates the whole move emission on it (you may not land where it is
  // false, e.g. Daldos's `(apply if:(not ("IsFriendAt" (to))) …)` forbids
  // landing on your own piece). The geometric path leaves this to the
  // conditional effect; the track path applies it as Java does.
  let toRule: BoolFn | undefined;
  if (toNode) {
    const { positional, named } = parseArgs(toNode.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) stopRule = compileBool(ifNode, env);
    const applyNode = positional.find(
      (n) => isList(n) && listHead(n) === "apply",
    ) as LudList | undefined;
    if (applyNode) {
      effect = compileApply(applyNode, env);
      const { named: applyNamed } = parseArgs(applyNode.items.slice(1));
      const applyIf = applyNamed.get("if");
      if (applyIf) toRule = compileBool(applyIf, env);
    }
  }

  // goRule = `between.condition()`; default = the cell is empty.
  let goRule: BoolFn = SLIDE_DEFAULT_GO;
  if (betweenNode) {
    const { named } = parseArgs(betweenNode.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) goRule = compileBool(ifNode, env);
  }

  const { minFn, maxFn } = slideRange(betweenNode, env);

  // Track-based slide (Java Slide.slideByTrack): a named track restricts the
  // piece to the predefined track sequence rather than geometric directions
  // (Daldos/Daldosa/Sahkku dice race-capture, Cylinder Chess wrap-around).
  // "AllTracks" (Surakarta's go-round-a-loop capture) additionally needs the
  // per-step `bump` gate, which the runtime track model does not carry yet, so
  // it is left on the geometric path; only named tracks are diverted here.
  if (trackName !== undefined && trackName !== "AllTracks") {
    return {
      generate: (ctx) => {
        const from = ctx.frame.from;
        if (from === undefined || from < 0) return [];
        const tracks = ctx.board.tracks.filter((t) => t.name === trackName);
        if (tracks.length === 0) return [];
        const mover = ctx.mover;
        const min = minFn.eval(ctx);
        const maxPathLength = maxFn.eval(ctx);
        const out: Move[] = [];
        const emit = (to: number, sub: EvalContext): void => {
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
              // @java Core/src/game/rules/play/moves/nonDecision/effect/Slide.java:292
              fromNonDecisionSite: from,
              toNonDecisionSite: to,
            }),
          );
        };
        for (const track of tracks) {
          const elems = track.sites;
          const n = elems.length;
          // Java iterates every track element whose site == from (a site may
          // appear more than once on a looping/merged track).
          for (let i = 0; i < n; i += 1) {
            if (elems[i] !== from) continue;
            let index = i;
            let nbElem = 1;
            // Java: while (elems[index].next != OFF && nbElem < elems.length
            //              && nbElem <= maxPathLength)
            while (nbElem < n && nbElem <= maxPathLength) {
              const nextIndex =
                index + 1 < n ? index + 1 : track.loop ? 0 : -1;
              if (nextIndex < 0) break; // end of a non-looping track
              const to = elems[nextIndex]!;
              const sub = ctx.withFrame({ from, to, between: to });
              if (stopRule && stopRule.eval(sub)) {
                if (min <= nbElem) {
                  emit(to, sub);
                  break;
                }
              } else if (min <= nbElem) {
                if (!toRule || toRule.eval(sub)) emit(to, sub);
              }
              nbElem += 1;
              // goRule reads `(between)` = the just-considered cell.
              if (!goRule.eval(sub)) break;
              index = nextIndex;
            }
          }
        }
        return out;
      },
    };
  }

  return {
    generate: (ctx) => {
      const from = ctx.frame.from;
      if (from === undefined || from < 0) return [];
      const board = ctx.board;
      const mover = ctx.mover;
      const min = minFn.eval(ctx);
      const max = maxFn.eval(ctx);
      const out: Move[] = [];
      const emit = (to: number, sub: EvalContext): void => {
        // @java Core/src/game/rules/play/moves/nonDecision/effect/Slide.java:364 gates whole-move emission on the
        // to/apply condition; `toRule` is the `(apply if:...)` condition.
        if (toRule && !toRule.eval(sub)) return;
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
            // @java Core/src/game/rules/play/moves/nonDecision/effect/Slide.java:368
            fromNonDecisionSite: from,
            toNonDecisionSite: to,
          }),
        );
      };
      // Walk one cell of the ray: apply stopRule (emit+break past min), then
      // goRule (break when blocked, else emit past min). Shared by both paths.
      const walkCell = (to: number, toIdx: number): "break" | "go" => {
        const sub = ctx.withFrame({ from, to, between: to });
        if (stopRule && stopRule.eval(sub)) {
          if (min <= toIdx) {
            emit(to, sub);
            return "break";
          }
        }
        if (!goRule.eval(sub)) return "break";
        if (min <= toIdx) emit(to, sub);
        return "go";
      };

      const traj = board.traj;
      // Non-square graph boards (hex / triangular) follow the real topology
      // radials; the Cartesian offset ray is only valid on a square lattice.
      // @java Slide.eval (topology.trajectories().radials per direction).
      const dirNames =
        traj && !traj.isCartesianSliceable() ? resolveDirNames(ctx, from) : null;
      if (traj && dirNames !== null) {
        for (const name of dirNames) {
          for (const ray of traj.radialsByName(from, name)) {
            for (let toIdx = 1; toIdx < ray.length && toIdx <= max; toIdx += 1) {
              if (walkCell(ray[toIdx] as number, toIdx) === "break") break;
            }
          }
        }
        return out;
      }

      const x0 = board.xOf(from);
      const y0 = board.yOf(from);
      const dirs = resolveDirs(ctx, from);
      for (const d of dirs) {
        for (let toIdx = 1; toIdx <= max; toIdx += 1) {
          const to = board.siteAt(x0 + d.dx * toIdx, y0 + d.dy * toIdx);
          if (to === OFF) break;
          if (walkCell(to, toIdx) === "break") break;
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
  const dirNode = after.find((n) => n !== pieceNode && isDirectionArg(n));
  const resolveDirs = compileDirsResolver(dirNode, env);
  return {
    generate: (ctx) => {
      const moves = ctx.context.trial.moves;
      const last = moves[moves.length - 1];
      const from = last ? last.to() : (ctx.frame.from ?? OFF);
      if (from < 0) return [];
      const board = ctx.board;
      const x0 = board.xOf(from);
      const y0 = board.yOf(from);
      const dirs = resolveDirs(ctx, from);
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

/** Default `(to)` landing rule for a hop: land on an empty cell. */
const HOP_DEFAULT_TO: BoolFn = {
  eval: (ctx) => {
    const s = ctx.frame.to ?? OFF;
    return s >= 0 && s < ctx.state.cells.length && (ctx.state.cells[s] ?? 0) === 0;
  },
};

/** Default `(between)` rule for a hop: jump over an occupied cell. */
const HOP_DEFAULT_BETWEEN: BoolFn = {
  eval: (ctx) => {
    const s = ctx.frame.between ?? OFF;
    return s >= 0 && s < ctx.state.cells.length && (ctx.state.cells[s] ?? 0) !== 0;
  },
};

/**
 * The site continuing the straight line `from → between` one more step, using
 * the board's topology rather than raw geometry. On a graph board the drawn
 * lines are not the lattice grid (an alquerque "Orthogonal" line runs along a
 * bounding-box diagonal, and triangle-appendage sites sit a unit away but are
 * *not* a straight continuation), so a hop's landing must follow the actual
 * radial: it is the neighbour of `between` (other than `from`) whose direction
 * stays within Ludii's 0.25-rad straightness bend (Trajectories.followRadial).
 * Returns OFF when no near-collinear continuation exists.
 */
function radialNext(
  board: InterpBoard,
  from: number,
  between: number,
  dx: number,
  dy: number,
): number {
  const traj = board.traj;
  if (!traj) return OFF;
  const bx = board.xOf(between);
  const by = board.yOf(between);
  const inLen = Math.hypot(dx, dy) || 1;
  const minCos = Math.cos(0.25);
  let best = OFF;
  let bestCos = -2;
  for (const t of traj.group(between, "Adjacent")) {
    if (t === from) continue;
    const tx = board.xOf(t) - bx;
    const ty = board.yOf(t) - by;
    const tl = Math.hypot(tx, ty) || 1;
    const cos = (tx * dx + ty * dy) / (tl * inLen);
    if (cos > bestCos) {
      bestCos = cos;
      best = t;
    }
  }
  return bestCos >= minCos ? best : OFF;
}

/**
 * The ordered ray of sites continuing the straight line out of `from` along
 * direction `(dx0,dy0)`, *excluding* `from` itself: `[step1, step2, …]` up to
 * the board edge. Mirrors Java `graph.trajectories().radials(type, from, dir)`
 * laid out as a step list — the per-direction line a `Hop` walks to find a
 * hurdle and its landing squares. On a lattice it is plain multiples of the
 * offset; on a graph board each subsequent step follows the topology's radial
 * (via `radialNext`), recomputing the running edge direction so the line tracks
 * a curving tiling rather than drifting off the original Cartesian heading.
 */
function hopRay(
  board: InterpBoard,
  from: number,
  dx0: number,
  dy0: number,
): number[] {
  const x0 = board.xOf(from);
  const y0 = board.yOf(from);
  const first = board.siteAt(x0 + dx0, y0 + dy0);
  if (first === OFF) return [];
  if (!board.traj) {
    const ray: number[] = [];
    let k = 1;
    let s = first;
    while (s !== OFF) {
      ray.push(s);
      k += 1;
      s = board.siteAt(x0 + dx0 * k, y0 + dy0 * k);
    }
    return ray;
  }
  // On a graph board the hurdle ray must follow real edges. The lattice cell
  // `first` is only the right first step when an edge actually connects `from`
  // to it in this direction — on an alternating-diagonal graph (alquerque and
  // its hunt relatives) a diagonal `siteAt` hit may have no such edge, so a hop
  // there would jump off the graph. Reject when `first` is not a genuine
  // adjacency neighbour (faithful to Java AbsoluteDirection: no edge ⇒ no hop).
  if (!board.traj.group(from, "Adjacent").includes(first)) return [];
  const ray: number[] = [first];
  let prev = from;
  let cur = first;
  for (;;) {
    const ex = board.xOf(cur) - board.xOf(prev);
    const ey = board.yOf(cur) - board.yOf(prev);
    const next = radialNext(board, prev, cur, ex, ey);
    if (next === OFF) break;
    // Guard against a degenerate cycle on irregular boards.
    if (ray.includes(next)) break;
    ray.push(next);
    prev = cur;
    cur = next;
  }
  return ray;
}

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
function compileHop(node: LudList, env: CompileEnv, startIndex = 2): MovesFn {
  const after = node.items.slice(startIndex);
  const toNode = after.find((n) => isList(n) && listHead(n) === "to") as
    | LudList
    | undefined;
  const betweenNode = after.find(
    (n) => isList(n) && listHead(n) === "between",
  ) as LudList | undefined;
  // An explicit `(from <int>)` clause (e.g. `(from (last To))` in the
  // hop-again sequence) seeds the start site; otherwise the move iterates from
  // `ctx.frame.from` (set by an enclosing `(forEach Piece …)`).
  const fromNode = after.find(
    (n) => isList(n) && listHead(n) === "from",
  ) as LudList | undefined;
  let fromFn: IntFn | undefined;
  let fromCond: BoolFn | undefined;
  if (fromNode) {
    const { positional, named } = parseArgs(fromNode.items.slice(1));
    const locArg = dropSiteType(positional)[0];
    if (locArg) fromFn = compileInt(locArg, env);
    const ifNode = named.get("if");
    if (ifNode) fromCond = compileBool(ifNode, env);
  }
  const dirNode = after.find(
    (n) =>
      n !== toNode &&
      n !== betweenNode &&
      n !== fromNode &&
      isDirectionArg(n),
  );
  const resolveDirs = compileDirsResolver(dirNode, env);
  // Circular directions (In/Out/CW/CCW/Rotational) on a concentric board curve
  // along the topology and cannot be represented by a single Cartesian (dx,dy)
  // vector; for those we walk the graph radials directly (see `rayForHop`).
  const dirTokens = rawDirectionTokens(dirNode).filter((t) => !t.startsWith("#"));
  const hasCircular = dirTokens.some((t) => CIRCULAR_TOKENS.has(t));

  // Java Hop: goRule = to.cond() (the `to if:`); stopRule = to.effect().
  // condition() (the `if:` *inside* the `(apply …)`); stopEffect = to.effect().
  // effect() (the apply's effect). When a stopRule is present the Hop only
  // emits a move where the landing FAILS goRule but satisfies stopRule — a
  // capture-on-stop (Xiangqi Pao: hop a screen, land on the enemy and remove
  // it). It never lands on an empty square (that is the companion Slide's job).
  let toCond: BoolFn = HOP_DEFAULT_TO;
  let stopRule: BoolFn | undefined;
  let stopEffect: EffectFn | undefined;
  if (toNode) {
    const { positional, named } = parseArgs(toNode.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) toCond = compileBool(ifNode, env);
    const applyNode = positional.find(
      (n) => isList(n) && listHead(n) === "apply",
    ) as LudList | undefined;
    if (applyNode) {
      stopEffect = compileApply(applyNode, env);
      const applyIf = parseArgs(applyNode.items.slice(1)).named.get("if");
      if (applyIf) stopRule = compileBool(applyIf, env);
    }
  }

  let betweenCond: BoolFn = HOP_DEFAULT_BETWEEN;
  let betweenEffect: EffectFn | undefined;
  // Distance parameters mirror Java `Between`: `before:` (max empty steps from
  // `from` up to the hurdle, default 0 ⇒ hurdle adjacent), `after:` (max extra
  // landing steps past the hurdle, default 0 ⇒ land immediately after), and the
  // positional `(range min max)` giving the min/max hurdle length (default 1/1
  // ⇒ a single jumped piece). Flying kings (international/Russian draughts) set
  // before/after to the board span, which is why a fixed one-step hop was wrong.
  let beforeFn: IntFn = { eval: () => 0 };
  let afterFn: IntFn = { eval: () => 0 };
  let minLenFn: IntFn = { eval: () => 1 };
  let maxLenFn: IntFn = { eval: () => 1 };
  if (betweenNode) {
    const { positional, named } = parseArgs(betweenNode.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) betweenCond = compileBool(ifNode, env);
    const applyNode = positional.find(
      (n) => isList(n) && listHead(n) === "apply",
    ) as LudList | undefined;
    if (applyNode) betweenEffect = compileApply(applyNode, env);
    const beforeNode = named.get("before");
    if (beforeNode) beforeFn = compileInt(beforeNode, env);
    const afterNode = named.get("after");
    if (afterNode) afterFn = compileInt(afterNode, env);
    // Hurdle-length RangeFunction (Java `between.range()` → minLengthHurdle /
    // maxLengthHurdle). Four spellings, each producing a [min,max] pair:
    //   (range a b)  → [a, b]  (b defaults to a)
    //   (exact n)    → [n, n]   (game.functions.range.math.Exact)
    //   (min n)      → [n, INFINITY]  (game.functions.range.math.Min)
    //   (max n)      → [UNDEFINED, n] (game.functions.range.math.Max)
    const INFINITY = 1000000000;
    const rangeNode = positional.find(
      (n) =>
        isList(n) &&
        (listHead(n) === "range" ||
          listHead(n) === "exact" ||
          listHead(n) === "min" ||
          listHead(n) === "max"),
    ) as LudList | undefined;
    if (rangeNode) {
      const head = listHead(rangeNode);
      const a = rangeNode.items[1];
      const b = rangeNode.items[2];
      if (head === "exact") {
        if (a) {
          minLenFn = compileInt(a, env);
          maxLenFn = minLenFn;
        }
      } else if (head === "min") {
        if (a) minLenFn = compileInt(a, env);
        maxLenFn = { eval: () => INFINITY };
      } else if (head === "max") {
        minLenFn = { eval: () => -1 }; // Java Constants.UNDEFINED
        if (a) maxLenFn = compileInt(a, env);
      } else {
        // (range a b)
        if (a) minLenFn = compileInt(a, env);
        maxLenFn = b ? compileInt(b, env) : minLenFn;
      }
    }
  }

  return {
    generate: (ctx) => {
      const from = fromFn ? fromFn.eval(ctx) : ctx.frame.from;
      if (from === undefined || from < 0) return [];
      if (fromCond && !fromCond.eval(ctx.withFrame({ from }))) return [];
      const board = ctx.board;
      const traj = board.traj;
      // The rays to walk out of `from`, each a list of sites (excluding `from`).
      // Circular directions follow the topology radials; everything else uses
      // the Cartesian dx/dy walk (`hopRay`, with radial continuation).
      const rays: number[][] = [];
      if (traj && hasCircular) {
        for (const token of dirTokens) {
          for (const r of traj.radialsByName(from, token)) {
            if (r.length > 1) rays.push(r.slice(1));
          }
        }
      } else {
        for (const d of resolveDirs(ctx, from)) {
          rays.push(hopRay(board, from, d.dx, d.dy));
        }
      }
      const mover = ctx.mover;
      const before = beforeFn.eval(ctx);
      const after = afterFn.eval(ctx);
      const minLen = minLenFn.eval(ctx);
      const maxLen = Math.max(maxLenFn.eval(ctx), 1);
      const out: Move[] = [];
      const seen = new Set<number>();
      // Faithful port of Java Hop.eval (maxLengthHurdle>0 branch). Walk the
      // radial out of `from`; step over up to `before` empty cells to find the
      // first hurdle run (length minLen..maxLen of cells satisfying the between
      // rule), then emit a landing on each cell satisfying the `to` rule, from
      // just past the hurdle out to `after` extra steps.
      for (const ray of rays) {
        let hurdleAt = -1; // ray index where the hurdle run starts
        for (let j = 0; j < ray.length; j += 1) {
          const cell = ray[j]!;
          const sub = ctx.withFrame({ from, between: cell, to: cell });
          if (betweenCond.eval(sub)) {
            hurdleAt = j;
            break;
          }
          // Not a hurdle: an empty cell we step across only within `before`.
          if (j >= before || !toCond.eval(sub)) break;
        }
        if (hurdleAt < 0) continue;
        // Measure the hurdle run length (cells satisfying the between rule).
        const hurdleLocs: number[] = [ray[hurdleAt]!];
        let k = hurdleAt + 1;
        for (; k < ray.length && hurdleLocs.length < maxLen; k += 1) {
          const cell = ray[k]!;
          if (!betweenCond.eval(ctx.withFrame({ from, between: cell }))) break;
          hurdleLocs.push(cell);
        }
        if (hurdleLocs.length < minLen) continue;
        const hurdleEnd = hurdleAt + hurdleLocs.length; // ray index of first landing
        const emitHop = (to: number, actions: Action[], decisionIndex: number) => {
          out.push(
            new Move({
              id: `hop:${from}:${to}:${mover}`,
              label: `Hop ${from}→${to}`,
              siteIndices: [to],
              mover,
              placedOwner: mover,
              actions,
              decisionIndex,
              // @java Core/src/game/rules/play/moves/nonDecision/effect/Hop.java:306
              fromNonDecisionSite: from,
              toNonDecisionSite: to,
            }),
          );
        };
        for (
          let li = hurdleEnd;
          li < ray.length && li - hurdleEnd <= after;
          li += 1
        ) {
          const to = ray[li]!;
          const sub = ctx.withFrame({ from, between: hurdleLocs[0]!, to });
          if (!toCond.eval(sub)) {
            // Java Hop: landing fails goRule. With a stopRule (a `to`-apply
            // condition) emit a capture-on-stop move carrying the stopEffect
            // when the stopRule holds; then stop scanning this ray either way.
            if (stopRule && stopRule.eval(sub) && !seen.has(to)) {
              seen.add(to);
              // Java MoveUtilities.chainRuleWithAction(prepend=true): the stop
              // effect (e.g. a `(remove (to))`) is placed BEFORE the ActionMove,
              // so the capture clears the target cell *before* the piece lands —
              // otherwise ActionRemove(to), which clears at apply time, would
              // wipe the just-moved piece. The ActionMove stays the decision.
              const actions: Action[] = [];
              if (stopEffect) actions.push(...stopEffect(sub));
              const decisionIndex = actions.length;
              actions.push(new ActionMove({ from, to }));
              emitHop(to, actions, decisionIndex);
            }
            break;
          }
          // Landing satisfies goRule. Java only emits a plain move here when
          // there is NO stopRule (a cannon never lands on an empty square via
          // Hop). The stopEffect, when present without a stopRule, still fires.
          if (!stopRule && !seen.has(to)) {
            seen.add(to);
            // chainRuleWithAction(prepend=true): between/stop effects (removes)
            // run BEFORE the landing ActionMove, so a `(to (apply (remove (to))))`
            // that clears the landing cell does not self-destruct the moved piece.
            const actions: Action[] = [];
            if (betweenEffect) {
              for (const h of hurdleLocs) {
                actions.push(...betweenEffect(ctx.withFrame({ from, between: h, to })));
              }
            }
            if (stopEffect) actions.push(...stopEffect(sub));
            const decisionIndex = actions.length;
            actions.push(new ActionMove({ from, to }));
            emitHop(to, actions, decisionIndex);
          }
        }
      }
      return out;
    },
  };
}

export function compileMoveLudeme(node: LudList, env: CompileEnv): MovesFn {
  const inner = compileMoveLudemeInner(node, env);
  // A `(move … (then <effect>))` block runs side effects after the move and
  // may keep the turn (`moveAgain`). Compile it and fold it into each move.
  const thenNode = node.items.find(
    (n) => isList(n) && listHead(n) === "then",
  ) as LudList | undefined;
  if (!thenNode) return inner;
  const deferredThen = compileDeferredDiceThen(thenNode, env);
  if (deferredThen) {
    return {
      generate: (ctx) =>
        inner.generate(ctx).map((m) => {
          deferDiceThen(env, m, deferredThen);
          return m;
        }),
    };
  }
  // Java applies a move's base actions first, then evaluates each attached
  // consequent on the mutated context (Move.apply → consequent.eval(context)).
  // For a real board-changing move that means the then-guard may need the
  // post-move state (Onek Rong's `(size Group at:(last To))`, Ecosys score
  // recompute, etc.), so `inThen=true` lets leaf handlers opt into
  // `postMoveContext()`.
  //
  // `move Select` is the important exception: its base action is only
  // `ActionSelect`, and the actual sow/capture body lives inside the `then`.
  // Those guards must therefore still read the pre-sow board. The O An Quan /
  // Ceelkoqyuqkoqiji family uses `(size Stack at:(last From))` in the `then` to
  // compute the relay landing hole; evaluating that on a synthetic post-move
  // board collapses the source stack to 0 and drops the `(moveAgain)` replay.
  const second = node.items[1];
  const selectOwnedThen =
    second !== undefined && isIdent(second) && second.name === "Select";
  const { moveAgain, moveAgainCond, effect } = compileThen(
    thenNode,
    env,
    !selectOwnedThen,
  );
  return {
    generate: (ctx) =>
      inner.generate(ctx).map((m) => {
        // Bind the move's own from/to so a `(then …)` effect (notably `(sow)`)
        // reads the just-selected site through `(from)` / `(to)`, and record the
        // move in a throwaway trial so `(last To)` / `(last From)` resolve to it
        // (Java runs the consequence after the move, when it is the last move).
        // The state stays pre-move so pickup-driven effects like sow are intact.
        // Stash the *pre-move* previous mover so `(is Prev Mover)` ("SameTurn")
        // reads Java's `state.prev()` (the predecessor ply's mover) rather than
        // the candidate move `m` we just recorded as the trial's last entry —
        // otherwise a single-move turn's then sees its own mover as "prev" and
        // `"SameTurn"` is spuriously true (e.g. Pereauni's
        // `count:(if ("SameTurn") (var "Count") (count at:(last From)))` then
        // reads the uninitialised `(var "Count")` = −1 and the sow produces no
        // actions, so the relay `(moveAgain)` never fires and the turn wrongly
        // passes). Mirrors `applyHypothetical`, which stashes the same value.
        //
        // Honour an already-stashed `frame.prevMover` when present: a
        // `(do (roll) next:(move … (then (if ("SameTurn") …))))` prologue
        // (the Maya stick-dice family — A K'aak'il / Aj Sakakil / …) generates
        // the `next:` arm on `applyHypothetical(roll)`, whose trial `lastMove`
        // is now the intra-move `(roll)` (the mover itself), which would make
        // `(is Prev Mover)` spuriously true on the turn's *first* throw and set
        // Pending one ply early. `applyHypothetical` already captured the true
        // pre-prologue `state.prev()` there, so prefer it; fall back to the
        // trial's last mover only for top-level generation (no prologue).
        const prevMover =
          ctx.frame.prevMover ?? (ctx.context.trial.lastMove()?.mover ?? 0);
        const ectx = ctx
          .withContext(ctx.context.withTrial(ctx.context.trial.withMove(m, false, -1)))
          .withFrame({ from: m.from(), to: m.to(), prevMover });
        const extra = effect ? effect(ectx) : [];
        // A conditional `(then (if <cond> (moveAgain)))` — e.g. 20 Squares'
        // `("ReplayInMovingOn" (sites "Replay"))` = `(if (is In (last To) …)
        // (moveAgain))` — keeps the turn only when the predicate holds on the
        // *post-move* position. `applyHypothetical` applies the move's actions
        // and records it as the last move, so `(last To)` resolves to the
        // destination just landed on. (compileFromTo defers its `then` to here.)
        let again = moveAgain;
        if (!again && moveAgainCond) {
          again = moveAgainCond.eval(ctx.applyHypothetical(m));
        }
        return extra.length > 0 || again
          ? m.withConsequence(extra, again)
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
/** True for a bare `moveAgain` ident or a `(moveAgain)` list. */
function isMoveAgainNode(node: LudNode | undefined): boolean {
  if (!node) return false;
  if (isIdent(node)) return node.name === "moveAgain";
  return isList(node) && listHead(node) === "moveAgain";
}

/**
 * The evaluation context *after* the move currently being folded as a `(then …)`
 * consequence. The generation sites record that move as the trial's last entry,
 * so re-applying it to the current state yields the post-move position — what
 * Java sees when it evaluates `then` consequents (which run after the move's own
 * actions). Falls back to `ctx` unchanged when no move is recorded.
 */
export function postMoveContext(ctx: EvalContext): EvalContext {
  const last = ctx.context.trial.lastMove();
  if (!last) return ctx;
  // Re-apply on a *clone* of the RNG so a recorded move that carries a
  // `(roll)` prologue (e.g. `(do (roll) next:… (then (if Grace (moveAgain))))`)
  // re-rolls to the *same* faces it was generated with, rather than ActionRollDice's
  // rng-less fallback (face index 0 → every die 0 → `(count Pips)` 0). The clone
  // starts from the same RNG position the generating roll used, so the dice — and
  // thus the `then` predicate (Grace) — match. A no-op for non-dice moves.
  return ctx.withContext(
    ctx.context.withState(last.applyTo(ctx.context.state, ctx.context.rng.clone())),
  );
}

/**
 * Return a deep copy of `node` with every `(then …)` list child removed at all
 * depths. Used by `(forEach Die …)` to compile its inner move generator
 * *without* folding the turn-retention/consequence then: Java stores a Move's
 * then and resolves it at apply-time, after every action — including the
 * `ActionUseDie` the forEach Die handler appends. The handler re-applies the
 * collected thens itself on the post-die-spend position, so a `(if (not (all
 * DiceUsed)) …)` predicate sees the die consumed. Without this the inner clause
 * folds the consequence pre-spend (e.g. Daldos baking an ActionSetNextPlayer
 * turn-retention before the last die is used → the mover never advances).
 */
function stripThens(node: LudNode): LudNode {
  if (!isList(node)) return node;
  // Mirror `collectNestedThens`: a then inside a multi-branch `(if cond X Y)` or
  // an `(or …)` was deliberately *not* collected for post-spend re-resolution,
  // so leave it attached for `compileMoves` to bake per-branch. Stripping it
  // here would drop a branch's consequence entirely. A single-branch
  // `(if cond X)` is descended into (its then was collected), so strip there.
  const head = listHead(node);
  if (head === "or") return node;
  if (head === "if" && node.items.length >= 4) return node;
  const items = node.items
    .filter((n) => !(isList(n) && listHead(n) === "then"))
    .map((n) => stripThens(n));
  return {
    kind: "list",
    range: node.range,
    delimiter: node.delimiter,
    items,
  };
}

function nodeContainsAllDiceUsed(node: LudNode | undefined): boolean {
  if (!node || !isList(node)) return false;
  if (
    listHead(node) === "all" &&
    node.items[1] !== undefined &&
    isIdent(node.items[1]) &&
    node.items[1].name === "DiceUsed"
  ) {
    return true;
  }
  return node.items.some(nodeContainsAllDiceUsed);
}

function nodeContainsMoveAgain(node: LudNode | undefined): boolean {
  if (!node) return false;
  if (isIdent(node) && node.name === "moveAgain") return true;
  if (!isList(node)) return false;
  if (listHead(node) === "moveAgain") return true;
  return node.items.some(nodeContainsMoveAgain);
}

function isDiceReplayThen(node: LudList): boolean {
  return (
    listHead(node) === "then" &&
    nodeContainsAllDiceUsed(node) &&
    nodeContainsMoveAgain(node)
  );
}

function compileDeferredDiceThen(
  node: LudList | undefined,
  env: CompileEnv,
): CompiledThen | undefined {
  if (!node || !env.deferredDiceThens || !isDiceReplayThen(node)) return undefined;
  // The outer `(forEach Die ...)` handler supplies the already-applied
  // post-move/post-ActionUseDie context, so compile guards/effects to read that
  // context directly rather than re-applying the move inside postMoveContext().
  return compileThen(node, env, false, true);
}

function deferDiceThen(env: CompileEnv, move: Move, thenC: CompiledThen): void {
  const map = env.deferredDiceThens;
  if (!map) return;
  const existing = map.get(move);
  if (existing) existing.push(thenC);
  else map.set(move, [thenC]);
}

function deferDiceThens(
  env: CompileEnv,
  move: Move,
  thens: readonly CompiledThen[],
): void {
  for (const thenC of thens) deferDiceThen(env, move, thenC);
}

export function compileThen(
  node: LudList,
  env: CompileEnv,
  inThen = false,
  allowForEachSite = false,
): { moveAgain: boolean; moveAgainCond?: BoolFn; effect?: EffectFn } {
  let moveAgain = false;
  const moveAgainConds: BoolFn[] = [];
  const effects: EffectFn[] = [];
  // `(moveAgain)` as the sole then-branch of an `(if <cond> (moveAgain))` —
  // e.g. backgammon's `ReplayNotAllDiceUsed` = `(if (not (all DiceUsed))
  // (moveAgain))`. Java evaluates the consequence post-move, so the same
  // player keeps the turn only while the condition holds. Represent it as a
  // predicate evaluated on the post-move position rather than dropping it.
  const branchIsMoveAgain = (n: LudNode | undefined): boolean =>
    !!n &&
    ((isIdent(n) && n.name === "moveAgain") ||
      (isList(n) && listHead(n) === "moveAgain"));
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
    if (
      head === "if" &&
      item.items[2] !== undefined &&
      item.items[3] === undefined &&
      branchIsMoveAgain(item.items[2]) &&
      item.items[1] !== undefined
    ) {
      // `(if <cond> (moveAgain))` with no else — conditional turn retention.
      moveAgainConds.push(compileBool(item.items[1]!, env));
      return;
    }
    const forEachKindNode = head === "forEach" ? item.items[1] : undefined;
    const forEachKind =
      forEachKindNode && isIdent(forEachKindNode) ? forEachKindNode.name : "";
    if (forEachKind === "Player") {
      // `(then (forEach Player (set Score …)))` — the leaf `compileEffectAction`
      // has no forEach case, so route the per-player consequent (the byScore
      // territory/score recompute in Reversi/Rolit/Manalath/etc.) through the
      // forEach-effect compiler. Restricted to the `Player` iterator: the `Site`
      // iterator newly running here would re-introduce divergences in
      // promote-on-pass draughts then-clauses (see Damspel). Lenient: drop to a
      // no-op if a sub-effect uses a form we can't compile yet, rather than
      // failing the whole game's compile (prior silent-skip parity).
      try {
        effects.push(compileForEachEffect(item, env));
      } catch {
        /* unsupported forEach Player consequent — skip */
      }
      return;
    }
    if (forEachKind === "Site") {
      // A DIRECT `(then (forEach Site …))`. This includes two-row mancala's
      // hole-closing / round-sweep consequents on concrete moves and passes:
      // Bosh's `(move Pass (then (forEach Site ("OwnedHoles") (if (is Empty
      // (site)) ("ForgetValue" (site))))))`, Bechi's all-passed seed sweep,
      // and Adi's BetweenRounds redistribution. Leaving these dropped strands
      // remembered-hole updates and makes later sow paths/`can Move` checks
      // see stale open holes, collapsing legal moves to Pass. Route them through
      // the normal effect compiler in `inThen` mode so they read the POST-move
      // state. Gabata (Wuqro)'s opening gather is the critical case: the direct
      // `(then (forEach Site (sites Mover) (fromTo ...)))` must see site `0`
      // already emptied by the move's own `0 -> 11` transfer, otherwise the
      // gather scoops site `0` a second time and leaves `var "Replay"` at `11`
      // instead of Java's final landing hole `3`.
      try {
        const fn = compileEffectAction(item, env, true, false);
        if (fn) effects.push(fn);
      } catch {
        /* unsupported forEach Site consequent — skip */
      }
      return;
    }
    if (head === "do") {
      // `(then (do <prior> next:<main> …))` — the relay-sow consequent in
      // mancala (Obridje/Andada/…): a `(set Var …)` prologue, a `(sow apply:(if
      // … (moveAgain) (set Var "Replay" …)))` main arm, and the do's own
      // `(then …)` capture. `compileEffectAction` has no `do` case, so the whole
      // chain was silently dropped — the seeds never moved and the same-player
      // `(moveAgain)` never fired, desyncing the mover from ply 1. Route it
      // through `compileEffect`, whose `do` handler flattens the generated
      // move's actions (which `withConsequence`/`withPrependedActions` fold the
      // prologue, sow and capture into, plus the inline `(moveAgain)`'s
      // ActionSetNextPlayer). Fail-soft: an unsupported inner ludeme drops the
      // consequent rather than failing the whole game's compile.
      try {
        effects.push(compileEffect(item, env));
      } catch {
        /* unsupported (do …) consequent — skip */
      }
      return;
    }
    const fn = compileEffectAction(item, env, inThen, allowForEachSite);
    if (fn) effects.push(fn);
  };
  for (const item of node.items.slice(1)) visit(item);
  const moveAgainCond: BoolFn | undefined =
    moveAgainConds.length === 0
      ? undefined
      : { eval: (ctx) => moveAgainConds.some((c) => c.eval(ctx)) };
  if (effects.length === 0) return { moveAgain, moveAgainCond };
  return {
    moveAgain,
    moveAgainCond,
    effect: (ctx) => effects.flatMap((fn) => fn(ctx)),
  };
}

/** Compile a single post-move effect ludeme into an action producer.
 *
 * `inThen` marks a `(then …)` consequent (vs an `(apply …)` effect). In a
 * `then` the move has already happened, so a guard `(if <cond> …)` must read
 * the *post-move* state; the fold sites record the move as the trial's last
 * entry and `postMoveContext` re-applies it once. In an `apply` effect there is
 * no such recorded move, so the guard reads the in-progress ctx directly. */
export function compileEffectAction(
  node: LudList,
  env: CompileEnv,
  inThen = false,
  allowForEachSite = false,
): EffectFn | undefined {
  const head = listHead(node);
  const _r = head ? lookupLudeme("effect", head) : undefined;
  if (_r) {
    const compiled = _r(node, env, inThen, allowForEachSite) as
      | EffectFn
      | undefined;
    if (compiled) return compiled;
  }
  // Subtype-dispatch for (set <Subtype> …): relocated 1:1 files register under
  // the compound key `set:<Subtype>` (e.g. `set:Score`). Falls through to the
  // legacy `set` handling below when none is live.
  if (head === "set") {
    const sub = node.items[1];
    if (sub && isIdent(sub)) {
      const _rs = lookupLudeme("effect", "set:" + sub.name);
      if (_rs) {
        const compiled = _rs(node, env, inThen, allowForEachSite) as
          | EffectFn
          | undefined;
        if (compiled) return compiled;
      }
    }
  }
  if (head === "moveAgain") {
    // As an effect (e.g. inside `(if … (moveAgain))`): schedule the current
    // mover to play again by overriding the next player. Java: MoveAgain emits
    // ActionSetNextPlayer(mover).
    return (ctx) => [new ActionSetNextPlayer(ctx.mover)];
  }
  if (head === "do") {
    // `(do <prior> next:<main> …)` reached via this LEAF compiler — i.e. nested
    // *inside* an effect chain, not as a top-level `(then …)` consequent. The
    // relay-sow mancala idiom `(then (and (do (set Var "NumSowed" …)
    // next:(sow apply:(… (moveAgain) (set Var "Replay" …)))) (if …)))` (Gabata
    // (Ghinda)/Adi/Qelat) wraps the `do` in an `(and …)`, whose handler folds
    // children through `compileEffectAction` — which had no `do` case, so the
    // whole sow+moveAgain was silently dropped, leaving the seeds unsown and the
    // same-player relay never firing (mover desynced from ply 1). `compileThen`'s
    // `visit` already special-cases a *direct* `(then (do …))`; this mirrors it
    // for the wrapped case. Route through `compileEffect`, whose `do` handler
    // flattens the prologue/`next:`/`then` actions plus the inline `(moveAgain)`'s
    // ActionSetNextPlayer. Fail-soft: an unsupported inner ludeme drops it.
    try {
      return compileEffect(node, env);
    } catch {
      return undefined;
    }
  }
  if (head === "forEach") {
    // `(forEach Value …)` as a then-consequent effect — iterate a value list
    // and fold each iteration's actions in. Restricted to the `Value` iterator:
    // routing `Site` here too would re-introduce the documented promote-on-pass
    // draughts divergence (see `compileThen`'s visit() comment). Used by two-row
    // mancala re-sow-restriction release (Adi/Gabata/Qelat: `(forEach Value
    // (array (sites Track …)) (if … (forget Value "PxSowFrom" (value))))`).
    const k = node.items[1];
    if (k && isIdent(k) && k.name === "Value") return compileForEachEffect(node, env);
    // `(forEach Level <site> …)` — stack-by-level iteration in a consequent (quan
    // capture lifting each seed to hand). Java ForEachLevel always evaluates, so
    // unlike Site this needs no gate.
    if (k && isIdent(k) && k.name === "Level") return compileForEachEffect(node, env);
    // `(forEach Site …)` nested inside an `(and/or/if …)` within a `(then …)` —
    // the two-row mancala seed-consolidation idiom: `(then (and { (forEach Site
    // (sites Mover) (fromTo … (to 11))) (moveAgain) … }))` (Gabata (Wuqro)/Lam
    // Waladach opening gather). Java evaluates the consequent post-move; the gate
    // dropped it, so only the move's own from/to seed-pile reached the gather
    // hole — the opening sow was then too short, landed in an empty hole, never
    // triggered `(moveAgain)`, and the turn passed to the opponent a ply early
    // (mover desync from ply 1). Run on `postMoveContext` when `inThen` so the
    // move's own action is already applied (the source hole is empty → no
    // double-count), mirroring the `forEach Group` case above. `allowForEachSite`
    // (a do's own then) means the state is already advanced, so run as-is. A
    // DIRECT `(then (forEach Site …))` stays gated in `compileThen` (Damspel);
    // an `apply:`-context forEach Site (inThen=false) stays dropped as before.
    if (k && isIdent(k) && k.name === "Site") {
      if (allowForEachSite) return compileForEachEffect(node, env);
      if (inThen) {
        const inner = compileForEachEffect(node, env);
        return (ctx) => inner(postMoveContext(ctx));
      }
      return undefined;
    }
    if (k && isIdent(k) && k.name === "Group") {
      // `(then (… (forEach Group …)))` — per-group score recompute used by
      // group-scoring games (Elea/Manifold/Brood: `(set Score Mover 0)` then
      // `(forEach Group … (addScore Mover …))`). Java applies the consequent
      // *after* the move, so wrap the iteration in `postMoveContext` (when
      // `inThen`) to grain the just-placed stone into its group. The body's
      // nested `(if …)` guards/effects are then read on that advanced ctx.
      const inner = compileForEachEffect(node, env);
      return inThen ? (ctx) => inner(postMoveContext(ctx)) : inner;
    }
    return undefined;
  }
  if (head === "and" || head === "or") {
    // `(and <eff>…)` / `(and { <eff>… })` — run several effects in sequence.
    // `(or { <eff>… })` in a `(then …)` consequent likewise applies *every*
    // branch's actions: Java's consequence is a `Moves` object whose actions
    // are all folded into the current move, and `or` concatenates its
    // alternatives (Tafl `(then (or { ("CustodialCapturePieceType" …)
    // (surround …) }))` — the thrall-flank capture and the king-surround
    // capture both contribute; only the matching one yields actions at a given
    // ply). Curly-list arguments are flattened; an unsupported member is dropped
    // (matching the prior silent-skip of unknown then-effects) rather than
    // failing the whole compile.
    const subs = effectChildren(node.items.slice(1))
      .map((n) => {
        try {
          return compileEffectAction(n, env, inThen, allowForEachSite);
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
    if (!condNode || !thenNode) return undefined;
    // A conditional `(moveAgain)` (e.g. `(if ("HandOccupied" Mover)
    // (moveAgain))`) must be decided on the *post-move* state: Java applies
    // `then` consequents after the move's own actions, so a placement that
    // empties the hand stops repeating. The generation sites record the move
    // as the trial's last entry, so re-apply it to obtain that state before
    // testing the guard.
    if (isMoveAgainNode(thenNode) && !elseNode) {
      let cond: BoolFn;
      try {
        cond = compileBool(condNode, env);
      } catch {
        return undefined;
      }
      // `inThen` advances to the post-move state; a *nested* if (compiled with
      // `inThen=false` below) is already handed the post-move ctx, so re-applying
      // would double it. Honour `inThen` here for the same reason as the general
      // branch.
      return (ctx) => {
        const guardCtx = inThen ? postMoveContext(ctx) : ctx;
        return cond.eval(guardCtx) ? [new ActionSetNextPlayer(guardCtx.mover)] : [];
      };
    }
    if (!isList(thenNode)) return undefined;
    try {
      const cond = compileBool(condNode, env);
      // Java runs the *whole* then-consequent — guard AND the chosen branch's
      // effect (including its argument sub-functions like `(count … (forEach …
      // if:(IsFriendAt (site))))`) — on the post-move state. So when `inThen`,
      // the branch must also see the post-move position, not just the guard:
      // Diagonals' `(addScore Mover (count …))` must count the just-placed stone.
      // `postMoveContext` re-applies the recorded move exactly once; the nested
      // branches are therefore compiled with `inThen=false` and handed that
      // already-advanced ctx, so they read it directly rather than re-applying
      // (which would double the move). In an `(apply …)` effect (`inThen=false`)
      // there is no recorded move, so guard and branches read ctx unchanged.
      const nestedInThen = false;
      const nestedAllowForEachSite = allowForEachSite || inThen;
      const thenEff = compileEffectAction(
        thenNode,
        env,
        nestedInThen,
        nestedAllowForEachSite,
      );
      const elseEff =
        elseNode && isList(elseNode)
          ? compileEffectAction(
              elseNode,
              env,
              nestedInThen,
              nestedAllowForEachSite,
            )
          : undefined;
      if (!thenEff && !elseEff) return undefined;
      return (ctx) => {
        const guardCtx = inThen ? postMoveContext(ctx) : ctx;
        if (cond.eval(guardCtx)) return thenEff ? thenEff(guardCtx) : [];
        return elseEff ? elseEff(guardCtx) : [];
      };
    } catch {
      return undefined;
    }
  }
  if (head === "sow") {
    const sowEffect = compileSow(node, env);
    // The sow may carry its OWN nested `(then …)` — the relay-sow continuation
    // in two-row mancala (Andada's Opening phase: `(then (sow (then (if (is
    // Occupied ("NextHole" ("PlayFromLastHole"))) (moveAgain)))))`). Java runs
    // that consequence after the sow distributes, on the *post-sow board*, and
    // appends `ActionSetNextPlayer(mover)` (the `(moveAgain)` action) when the
    // guard holds. `compileSow` ignores its `(then …)`, so the nested
    // `(moveAgain)` never fired and the same-player relay desynced the mover
    // from ply 1.
    //
    // Crucially the inner then's `(last To afterConsequence:True)` resolves to
    // the *enclosing* move (the `Select`, whose `to` is the origin hole), NOT to
    // the sow itself: the sow's distribution is folded into the current move and
    // not yet committed as a separate trial entry when Java evaluates the sow's
    // own consequence (Move.toAfterSubsequents reads the last committed move).
    // So we keep `ctx`'s recorded move (the `Select`) and only swap in the
    // post-sow *state*. Andada's guard `(is Occupied ("NextHole" (last To …)))`
    // then reads `NextHole(origin)` on the post-sow board (occupied → relay
    // continues); the *next* ply re-reads `(last To …)` off the now-committed
    // sow move (the landing hole) for its pickup, so the relay ends with a
    // forced pass when that pickup hole is empty — matching Java exactly.
    const sowThenNode = node.items.find(
      (n) => isList(n) && listHead(n) === "then",
    ) as LudList | undefined;
    if (!sowThenNode) return sowEffect;
    const sowThen = compileThen(sowThenNode, env, false, true);
    return (ctx) => {
      const actions = sowEffect(ctx);
      if (actions.length === 0) return actions;
      let postState = ctx.state;
      for (const a of actions) postState = a.apply(postState);
      const postCtx = ctx.withContext(ctx.context.withState(postState));
      const extra = sowThen.effect ? sowThen.effect(postCtx) : [];
      let again = sowThen.moveAgain;
      if (!again && sowThen.moveAgainCond) {
        again = sowThen.moveAgainCond.eval(postCtx);
      }
      const out = [...actions, ...extra];
      if (again) out.push(new ActionSetNextPlayer(postCtx.mover));
      return out;
    };
  }
  if (head === "custodial") {
    // `(then (custodial …))` — a flanking capture written as a move
    // consequence (Seega/Tafl: `("StepToEmpty" … (then ("CustodialCapture"
    // …)))`). Java runs the consequence after the move's actions, so the scan
    // sees the *post-move* board (the mover's piece now at `(last To)`); we
    // re-apply the recorded move via `postMoveContext`. Returns the raw capture
    // actions to append to the move rather than packaging a separate Move.
    const spec = parseCustodialSpec(node, env);
    // The custodial may carry its OWN nested `(then …)` — a capture-again chain
    // (`("CustodialCapture" … (then (if ("CanCaptureAgain") (moveAgain))))`) in
    // Khamousiyya/Seega variants. Java runs that consequence after the capture's
    // own actions, so the predicate sees the *post-capture* board. We re-create
    // that here: apply the capture actions onto the post-move state, then test
    // the nested then's `moveAgain`/`moveAgainCond` on that board. When it holds,
    // append `ActionSetNextPlayer(mover)` (the action encoding of `(moveAgain)`)
    // so the same player keeps the turn — matching the move-position custodial.
    const custThenNode = node.items.find(
      (n) => isList(n) && listHead(n) === "then",
    ) as LudList | undefined;
    const custThen = custThenNode ? compileThen(custThenNode, env) : undefined;
    return (ctx) => {
      const pmctx = postMoveContext(ctx);
      const from = spec.fromFn.eval(pmctx);
      if (from < 0 || from >= pmctx.board.numSites) return [];
      const allBetween = scanCustodialBetween(spec, pmctx, from);
      if (allBetween.length === 0) return [];
      const actions = custodialActions(spec, pmctx, from, allBetween, pmctx.mover);
      if (!custThen) return actions;
      // Post-capture board: outer move (pmctx) + this capture's actions.
      let postState = pmctx.context.state;
      for (const a of actions) {
        postState = a.apply(postState, pmctx.context.rng.clone());
      }
      const postCtx = pmctx
        .withContext(pmctx.context.withState(postState))
        .withFrame({ from, to: from });
      const extra = custThen.effect ? custThen.effect(postCtx) : [];
      let again = custThen.moveAgain;
      if (!again && custThen.moveAgainCond) {
        again = custThen.moveAgainCond.eval(postCtx);
      }
      const out = [...actions, ...extra];
      if (again) out.push(new ActionSetNextPlayer(pmctx.mover));
      return out;
    };
  }
  if (head === "enclose") {
    // Java Enclose defaults `from` to `(last To)`, directions to Adjacent,
    // target to enemy-at-`between`, effect to `(remove (between))`, and
    // numException to 0 (Enclose.java:93-105). Its eval scans neighbours of the
    // post-move `from`, flood-fills each target group, and applies the effect to
    // every no-liberties group member with `(between)` rebound (Enclose.java:
    // 142-164, 166-304).
    const eArgs = parseArgs(node.items.slice(1));
    const fromNode =
      eArgs.named.get("from") ??
      eArgs.positional.find((n) => isList(n) && listHead(n) === "from");
    let fromFn: IntFn = { eval: lastToSite };
    if (fromNode) {
      try {
        if (isList(fromNode) && listHead(fromNode) === "from") {
          const inner = dropSiteType(fromNode.items.slice(1))[0];
          if (inner) fromFn = compileInt(inner, env);
        } else {
          fromFn = compileInt(fromNode, env);
        }
      } catch {
        fromFn = { eval: lastToSite };
      }
    }

    const betweenNode =
      eArgs.named.get("between") ??
      eArgs.positional.find((n) => isList(n) && listHead(n) === "between");
    let targetFn: BoolFn = {
      eval: (ctx) => {
        const s = ctx.frame.between ?? OFF;
        const owner = s >= 0 ? (ctx.state.cells[s] ?? 0) : 0;
        return owner !== 0 && owner !== ctx.mover && ctx.state.whatAtSite(s) > 0;
      },
    };
    let applyFn: EffectFn | undefined;
    if (betweenNode && isList(betweenNode)) {
      const bArgs = parseArgs(betweenNode.items.slice(1));
      const ifNode = bArgs.named.get("if");
      if (ifNode) {
        try {
          targetFn = compileBool(ifNode, env);
        } catch {
          /* keep the Java default target */
        }
      }
      const applyNode =
        bArgs.positional.find((n) => isList(n) && listHead(n) === "apply") ??
        bArgs.named.get("apply");
      if (applyNode && isList(applyNode)) {
        try {
          applyFn = compileApply(applyNode as LudList, env);
        } catch {
          applyFn = undefined;
        }
      }
    }
    const directApplyNode =
      eArgs.positional.find((n) => isList(n) && listHead(n) === "apply") ??
      eArgs.named.get("apply");
    if (!applyFn && directApplyNode && isList(directApplyNode)) {
      try {
        applyFn = compileApply(directApplyNode as LudList, env);
      } catch {
        applyFn = undefined;
      }
    }

    const dirNode = eArgs.positional.find((n) => {
      if (n === fromNode || n === betweenNode || n === directApplyNode) return false;
      if (isList(n) && ["from", "between", "apply", "then"].includes(listHead(n) ?? ""))
        return false;
      return isDirectionArg(n);
    });
    const dirTokensRaw = rawDirectionTokens(dirNode).filter((t) => !t.startsWith("#"));
    const dirTokens = dirTokensRaw.length > 0 ? dirTokensRaw : ["Adjacent"];
    const numExceptionNode = eArgs.named.get("numException");
    const numExceptionFn = numExceptionNode
      ? compileInt(numExceptionNode, env)
      : { eval: () => 0 };

    return (ctx) => {
      const pmctx = postMoveContext(ctx);
      const from = fromFn.eval(pmctx);
      if (from < 0 || from >= pmctx.board.numSites) return [];
      if (pmctx.state.whatAtSite(from) <= 0) return [];
      const maxLiberties = numExceptionFn.eval(pmctx);
      const out: Action[] = [];
      const checked = new Set<number>();

      const isTarget = (site: number): boolean =>
        site >= 0 &&
        site < pmctx.board.numSites &&
        targetFn.eval(pmctx.withFrame({ between: site, site, to: site }));

      const groupFrom = (start: number): number[] => {
        const owner = pmctx.state.cells[start] ?? 0;
        if (owner === 0 || pmctx.state.whatAtSite(start) <= 0) return [];
        const group = new Set<number>([start]);
        const stack = [start];
        while (stack.length > 0) {
          const s = stack.pop() as number;
          for (const nb of aroundSites(pmctx, s, dirTokens)) {
            if (group.has(nb)) continue;
            if ((pmctx.state.cells[nb] ?? 0) !== owner) continue;
            if (pmctx.state.whatAtSite(nb) <= 0 || !isTarget(nb)) continue;
            group.add(nb);
            stack.push(nb);
          }
        }
        return [...group].sort((a, b) => a - b);
      };

      for (const target of aroundSites(pmctx, from, dirTokens)) {
        if (checked.has(target) || !isTarget(target)) continue;
        const group = groupFrom(target);
        if (group.length === 0) continue;
        for (const s of group) checked.add(s);

        const liberties = new Set<number>();
        for (const s of group) {
          for (const nb of aroundSites(pmctx, s, dirTokens)) {
            if (pmctx.state.whatAtSite(nb) === 0) liberties.add(nb);
          }
        }
        if (liberties.size > maxLiberties) continue;

        for (const s of group) {
          const bctx = pmctx.withFrame({ between: s, from, to: s, site: s });
          if (applyFn) {
            try {
              out.push(...applyFn(bctx));
            } catch {
              /* lenient: skip a malformed per-site effect */
            }
          } else {
            out.push(new ActionRemove({ to: s, clearAll: env.isStacking === false }));
          }
        }
      }
      return out;
    };
  }
  if (head === "surround") {
    // `(then (surround …))` — capture-by-surrounding written as a move
    // consequence (Tafl king-surround: `(surround (from (last To)) Orthogonal
    // (between if:… <effect>) (to if:…))`). Java Surround.eval: from the moved
    // piece, each immediate neighbour in the relation is a candidate "threat"
    // site; if it satisfies the between-if, examine ALL of *its* neighbours —
    // each must be the from-site, a board edge, or satisfy the to-if (friend),
    // counting `except` violations. When `except <= nbExcept` (and the optional
    // `with` piece is present), the between-effect fires (default: remove the
    // threatened piece; Tafl uses `(apply (trigger …))`). The scan runs on the
    // post-move board, so re-apply the recorded move via `postMoveContext`.
    const spec = parseCustodialSpec(node, env);
    const sArgs = parseArgs(node.items.slice(1));
    const exceptNode = sArgs.named.get("except");
    const exceptFn = exceptNode ? compileInt(exceptNode, env) : { eval: () => 0 };
    const withNode = sArgs.named.get("with");
    // `with:<piece>` is a component name → its `what` id (Java Piece.component()).
    let withFn: IntFn | undefined;
    if (withNode) {
      try {
        withFn = compileInt(withNode, env);
      } catch {
        withFn = undefined;
      }
    }
    // Relation group for immediate-neighbour adjacency (default Adjacent).
    const groupName: "Adjacent" | "Orthogonal" | "Diagonal" | "All" =
      spec.dirTokens.includes("Orthogonal")
        ? "Orthogonal"
        : spec.dirTokens.includes("Diagonal")
          ? "Diagonal"
          : spec.dirTokens.includes("All")
            ? "All"
            : "Adjacent";
    const neighborsOf = (ctx: EvalContext, site: number): number[] =>
      expandRegion([site], ctx, groupName).filter((s) => s !== site);
    return (ctx) => {
      const pmctx = postMoveContext(ctx);
      const from = spec.fromFn.eval(pmctx);
      if (from < 0 || from >= pmctx.board.numSites) return [];
      const nbExcept = exceptFn.eval(pmctx);
      const withWhat = withFn ? withFn.eval(pmctx) : undefined;
      const out: Action[] = [];
      const seen = new Set<number>();
      for (const threat of neighborsOf(pmctx, from)) {
        if (seen.has(threat)) continue;
        // isTarget: bind (between) to the threatened site.
        if (!spec.targetFn.eval(pmctx.withFrame({ between: threat, site: threat })))
          continue;
        let except = 0;
        let withPieceOk = false;
        for (const fp of neighborsOf(pmctx, threat)) {
          // edge directions yield no neighbour (already excluded) → "isThreat"
          // in Java, contributing no exception. An on-board neighbour is a
          // threat (surrounds the target) iff it is the from-site or a friend.
          const isThreat =
            fp === from || spec.friendFn.eval(pmctx.withFrame({ to: fp, site: fp }));
          if (!isThreat) except += 1;
          const whatFriend = pmctx.context.state.whatAtSite(fp);
          if (withWhat === undefined || withWhat === whatFriend) withPieceOk = true;
          if (except > nbExcept) break;
        }
        if (except <= nbExcept && withPieceOk) {
          seen.add(threat);
          const bctx = pmctx.withFrame({ between: threat, from, to: threat, site: threat });
          if (spec.applyFn) {
            try {
              out.push(...spec.applyFn(bctx));
            } catch {
              /* lenient */
            }
          } else {
            out.push(
              new ActionRemove({ to: threat, clearAll: env.isStacking === false }),
            );
          }
        }
      }
      return out;
    };
  }
  if (head === "intervene") {
    // `(intervene (from (last To)) <dir> (to if:<target> (apply <eff>)))` — the
    // moved piece, by interposing between two enemies, captures BOTH flanking
    // pieces (Maak Yek's `("InterveneCapture" Orthogonal)` — the reverse of a
    // custodial). Java Intervene.shortSandwich (the InterveneCapture default
    // min=1/max=1): for each radial from `from`, if the immediate neighbour is
    // a target AND the opposite direction's immediate neighbour is also a
    // target, apply the effect to both flanking sites. Runs on the post-move
    // board (re-apply the recorded move via `postMoveContext`).
    const spec = parseCustodialSpec(node, env);
    // Intervene's target predicate and effect live in its `(to …)` clause, not
    // `between`: parseCustodialSpec already put the `to if:` into `friendFn`;
    // pull the `to`'s `(apply …)` effect out here (default: remove the site).
    const iArgs = parseArgs(node.items.slice(1));
    const toNode =
      iArgs.named.get("to") ??
      iArgs.positional.find((n) => isList(n) && listHead(n) === "to");
    let effFn: EffectFn | undefined;
    if (toNode && isList(toNode)) {
      const applyNode = parseArgs(toNode.items.slice(1)).positional.find(
        (n) => isList(n) && listHead(n) === "apply",
      ) as LudList | undefined;
      if (applyNode) {
        try {
          effFn = compileApply(applyNode, env);
        } catch {
          /* lenient: fall back to remove */
        }
      }
    }
    const tokens = spec.dirTokens.length > 0 ? spec.dirTokens : ["Adjacent"];
    return (ctx) => {
      const pmctx = postMoveContext(ctx);
      const from = spec.fromFn.eval(pmctx);
      if (from < 0 || from >= pmctx.board.numSites) return [];
      const board = pmctx.board;
      // Direction offsets anchored at the landing site (Java resolves radials
      // from the moved piece's location); the opposite direction is its negate.
      const dirs = resolveDirectionTokens(tokens, pmctx, from);
      const isTarget = (s: number): boolean =>
        s >= 0 && spec.friendFn.eval(pmctx.withFrame({ to: s, site: s }));
      const fx = board.xOf(from);
      const fy = board.yOf(from);
      const out: Action[] = [];
      const seen = new Set<number>();
      for (const d of dirs) {
        const near = board.siteAt(fx + d.dx, fy + d.dy);
        const opp = board.siteAt(fx - d.dx, fy - d.dy);
        // Sandwich: my piece sits between two enemies — capture both of them.
        if (!isTarget(near) || !isTarget(opp)) continue;
        for (const s of [near, opp]) {
          if (seen.has(s)) continue;
          seen.add(s);
          const bctx = pmctx.withFrame({ to: s, from, site: s, between: s });
          if (effFn) {
            try {
              out.push(...effFn(bctx));
            } catch {
              /* lenient */
            }
          } else {
            out.push(new ActionRemove({ to: s, clearAll: env.isStacking === false }));
          }
        }
      }
      return out;
    };
  }
  if (head === "move") {
    // `(move (from <site>) (to <site> [(apply <eff>)]))` as a *then/apply
    // effect* — a follow-on relocation folded into the outer move. Two corpus
    // uses: 58 Holes' teleportation `(move (from (last To)) (to (mapEntry
    // (last To))))`, and capture-applies written as `(move (from (to)) (to
    // (handSite (who at:(to)))))` (the Hounds-and-Jackals crossover variants).
    // Java compiles the nested move and applies its decision ActionMove (plus
    // any `(apply …)` consequents) after the outer move's actions. Extract the
    // from/to sites; emit an ActionMove when a piece sits at the source,
    // prepending any capture actions (a `(remove (to))` of the landing cell is
    // subsumed by the relocation's overwrite, so it is dropped).
    const fromClause = node.items.find(
      (n) => isList(n) && listHead(n) === "from",
    ) as LudList | undefined;
    const toClause = node.items.find(
      (n) => isList(n) && listHead(n) === "to",
    ) as LudList | undefined;
    if (!fromClause || !toClause) return undefined;
    const fromInner = dropSiteType(fromClause.items.slice(1))[0];
    const toPositional = dropSiteType(toClause.items.slice(1));
    const applyNode = toPositional.find(
      (n) => isList(n) && listHead(n) === "apply",
    ) as LudList | undefined;
    const toInner = toPositional.find((n) => n !== applyNode);
    if (!fromInner || !toInner) return undefined;
    let fromFn: IntFn;
    let toFn: IntFn;
    try {
      fromFn = compileInt(fromInner, env);
      toFn = compileInt(toInner, env);
    } catch {
      return undefined;
    }
    let applyFn: EffectFn | undefined;
    if (applyNode) {
      try {
        applyFn = compileApply(applyNode, env);
      } catch {
        applyFn = undefined;
      }
    }
    return (ctx) => {
      const src = fromFn.eval(ctx);
      const dst = toFn.eval(ctx);
      if (src < 0 || dst < 0) return [];
      if ((ctx.state.cells[src] ?? 0) === 0) return [];
      const sub = ctx.withFrame({ from: src, to: dst });
      const captureActions: Action[] = [];
      if (applyFn) {
        for (const a of applyFn(sub)) {
          if (a.actionType() === "Remove" && a.to() === dst) continue;
          captureActions.push(a);
        }
      }
      if (src === dst) return captureActions;
      return [...captureActions, new ActionMove({ from: src, to: dst })];
    };
  }
  if (head === "directional") {
    return compileDirectionalEffect(node, env);
  }
  if (head === "fromTo") {
    return compileFromToEffect(node, env);
  }
  if (head === "push") {
    return compilePushEffect(node, env);
  }
  if (head === "remove") {
    const { positional, named } = parseArgs(node.items.slice(1));
    const siteNode = positional[0];
    if (!siteNode) return undefined;
    const site = compileInt(siteNode, env);
    // `at:EndOfTurn` → deferred capture (Java: ActionRemove.construct
    // applied=false → ActionRemoveNonApplied). The piece is marked in the
    // state's deferred-capture queue and stays on the board until the turn
    // ends; the move-apply store-path flushes it. Anything else (the default
    // `at:Immediately`) removes the piece now.
    const atNode = named.get("at");
    const deferred = atNode !== undefined && isIdent(atNode) && atNode.name === "EndOfTurn";
    // Java `Remove.countFn` (default IntConstant(1)): a `(remove <site> count:N)`
    // emits N single-piece ActionRemoves. For the count-based holes that pervade
    // mancala (`(remove (site) count:(count at:(site)))` empties a hole) this is
    // equivalent to one ActionRemove that decrements the pile by N — without it
    // TS removes a single seed and the board drifts a ply or two later (the
    // systemic root behind the `board/sow/**` MOVE_MISMATCH cluster). Defaults to
    // 1, so single-piece removals are unchanged.
    const countNode = named.get("count");
    const countFn = countNode ? compileInt(countNode, env) : undefined;
    if (deferred) {
      return (ctx) => {
        const s = site.eval(ctx);
        return s >= 0 ? [new ActionRemoveNonApplied(s)] : [];
      };
    }
    return (ctx) => {
      const s = site.eval(ctx);
      if (s < 0) return [];
      const count = countFn ? countFn.eval(ctx) : 1;
      if (count <= 0) return [];
      return [
        new ActionRemove({ to: s, count, clearAll: env.isStacking === false }),
      ];
    };
  }
  if (head === "flip") {
    // `(flip <site>)` — toggle the piece's local state between the two faces
    // declared by its `(flips a b)` attribute (Reversi/Othello discs, Ludus
    // Latrunculorum's Vagi). Java: Flip.eval reads the component's getFlips()
    // pair and emits ActionSetState with the opposite face.
    // Java: Core/src/game/rules/play/moves/nonDecision/effect/Flip.java
    const siteNode = node.items[1];
    if (!siteNode) return undefined;
    let siteFn: IntFn;
    try {
      siteFn = compileInt(siteNode, env);
    } catch {
      return undefined;
    }
    const flipsById = env.componentFlipsById;
    // A single flippable component is the common case; precompute the lone
    // declared flip-pair as a fallback when the site's `what` can't resolve one
    // (neutral discs are stored with who==0, so whatAtSite reads 0).
    const soleFlips = (() => {
      let found: [number, number] | undefined;
      let count = 0;
      for (const f of flipsById ?? []) {
        if (f) {
          found = f;
          count += 1;
        }
      }
      return count === 1 ? found : undefined;
    })();
    return (ctx) => {
      const s = siteFn.eval(ctx);
      if (s < 0 || s >= ctx.board.numSites) return [];
      const what = ctx.state.whats[s] ?? 0;
      const flips = (what > 0 ? flipsById?.[what] : undefined) ?? soleFlips;
      if (!flips) return [];
      const cur = ctx.state.stateAtSite(s);
      const next = cur === flips[0] ? flips[1] : flips[0];
      return [new ActionSetState({ to: s, state: next })];
    };
  }
  if (head === "promote") {
    // `(promote <site> <piece-spec> [player])` — replace the piece's type at
    // <site> (Java: Promote ludeme → ActionPromote). The piece spec is a
    // `(piece "Name")`/`(id "Name" …)`/bare-string naming the target type; the
    // optional player role (default Mover) selects which player's component.
    // We resolve the named component's `what` id so `(forEach Piece "Name")`
    // dispatch recognises the promoted piece (e.g. a draughts man → flying
    // king). When the name can't be resolved we fall back to owner-only.
    const { positional } = parseArgs(node.items.slice(1));
    const siteNode = positional[0];
    if (!siteNode) return undefined;
    const site = compileInt(siteNode, env);
    const pieceSpec = positional[1];
    const specInfo = extractPromotePieceSpec(pieceSpec);
    const pieceName = specInfo.names[0];
    const playerNode = positional[2];
    const playerRole =
      (playerNode && isIdent(playerNode) ? playerNode.name : undefined) ??
      specInfo.role ??
      "Mover";
    const idByLabel = env.componentIdByLabel;
    const ownerById = env.componentOwnerById;
    return (ctx) => {
      const s = site.eval(ctx);
      if (s < 0) return [];
      // The new owner/type comes from the named component, NOT the current
      // cell. Promote runs as a post-move consequence (after the move's own
      // ActionMove places the piece), but our consequence eval context is the
      // pre-move state, so `cells[s]` may read empty here — we must not gate on
      // it. Java ActionPromote derives `who` from `components()[newWhat].owner()`.
      if (pieceName !== undefined && idByLabel !== undefined) {
        const pid = resolveRole(playerRole, ctx);
        // Each-pieces register as "Name<pid>"; player-specific pieces as "Name".
        const newWhat =
          (pid > 0 ? idByLabel.get(`${pieceName}${pid}`) : undefined) ??
          idByLabel.get(pieceName);
        if (newWhat !== undefined && newWhat > 0) {
          const who = ownerById?.[newWhat];
          const owner = who && who > 0 ? who : pid > 0 ? pid : ctx.mover;
          return [new ActionPromote(s, owner, newWhat)];
        }
      }
      // Owner-only fallback (e.g. unresolved name, `(move Promote)`): keep the
      // piece's owner; the pre-move cell may read empty, so default to mover.
      const owner = (ctx.state.cells[s] ?? 0) || ctx.mover;
      return owner > 0 ? [new ActionPromote(s, owner)] : [];
    };
  }
  if (head === "addScore") {
    const who = node.items[1];
    const value = node.items[2];
    if (!who || !value) return undefined;
    // Paired-list form: `(addScore {P1 P2 …} {v1 v2 …})` adds v_i to player_i
    // (Java AddScore with RoleType[]/IntFunction[]). OddEvenTree scores both
    // players in one step: `(addScore {P1 P2} {(cost …) (- 0 (cost …))})`.
    if (
      isList(who) &&
      who.delimiter === "curly" &&
      isList(value) &&
      value.delimiter === "curly"
    ) {
      const pidFns = who.items.map((p) => compileInt(p, env));
      const valFns = value.items.map((v) => compileInt(v, env));
      return (ctx) => {
        const actions = [];
        for (let i = 0; i < pidFns.length; i += 1) {
          const player = pidFns[i]?.eval(ctx) ?? 0;
          if (player < 1) continue;
          const vf = valFns[i] ?? valFns[valFns.length - 1];
          actions.push(
            new ActionSetScore({
              player,
              score: vf ? vf.eval(ctx) : 0,
              add: true,
            }),
          );
        }
        return actions;
      };
    }
    const amount = compileInt(value, env);
    const roleName = isIdent(who) ? who.name : "";
    if (roleName === "All" || roleName === "Each") {
      // Java parity: SetScore with RoleType.All/Each applies to every player
      // (pids 1..numPlayers), so emit one ActionSetScore each.
      return (ctx) => {
        const n = ctx.context.game.numPlayers;
        const delta = amount.eval(ctx);
        const actions = [];
        for (let pid = 1; pid <= n; pid += 1) {
          actions.push(new ActionSetScore({ player: pid, score: delta, add: true }));
        }
        return actions;
      };
    }
    const pid = compileInt(who, env);
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
    // `(remember State)` records the current state's hash in the stored-state
    // slot (Java: RememberState → ActionStoreStateInContext). Read later by
    // `(avoidStoredState …)`. There is no `(forget State)`.
    if (head === "remember" && sub && isIdent(sub) && sub.name === "State") {
      return () => [new ActionStoreStateInContext()];
    }
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
    // `(forget Value [name?] All)` -> ForgetValueAll: clears the named list, or
    // (when no name) the unnamed list plus every named list. Java: ForgetValueAll.
    if (head === "forget" && isIdent(valNode) && valNode.name === "All") {
      if (name) {
        return (ctx) =>
          ctx.state
            .rememberedFor(name)
            .map((v) => new ActionForgetValue(name, v));
      }
      return (ctx) => {
        const out: ActionForgetValue[] = [];
        for (const [key, vals] of ctx.state.remembered) {
          for (const v of vals) out.push(new ActionForgetValue(key, v));
        }
        return out;
      };
    }
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
      const amount = compileInt(value, env);
      const roleName = isIdent(who) ? who.name : "";
      if (roleName === "All" || roleName === "Each") {
        // Java parity: `(set Score All v)` / `(set Score Each v)` sets every
        // player's score (pids 1..numPlayers). In a move `(then …)` the score
        // expression is evaluated on the post-move board: Ecosys recalculates
        // `(size Array (sizes Group ... Mover))` after the just-placed stone.
        return (ctx) => {
          const scoreCtx = inThen ? postMoveContext(ctx) : ctx;
          const n = ctx.context.game.numPlayers;
          const score = amount.eval(scoreCtx);
          const actions = [];
          for (let pid = 1; pid <= n; pid += 1) {
            actions.push(new ActionSetScore({ player: pid, score }));
          }
          return actions;
        };
      }
      const pid = compileInt(who, env);
      return (ctx) => {
        const scoreCtx = inThen ? postMoveContext(ctx) : ctx;
        return [
          new ActionSetScore({
            player: pid.eval(scoreCtx),
            score: amount.eval(scoreCtx),
          }),
        ];
      };
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
      // Java SetVar.eval: with NO name it emits ActionSetTemp (writes the
      // global `tempValue`), and bare `(var)` reads that same `state.temp()`.
      // TS stores the global temp at slot 0, so the unnamed set must write
      // temp(0) — not vars[""], which `(var)` never reads (the prior code left
      // every sow game's `(set Var (to))` / `(sites {(var)})` disconnected).
      if (!varName) {
        return (ctx) => [new ActionSetTemp(0, amount.eval(ctx))];
      }
      return (ctx) => [new ActionSetVar(varName, amount.eval(ctx))];
    }
    if (subName === "Pending") {
      // `(set Pending)` marks the state pending (sentinel 1) so the next turn's
      // `(is Pending)` is true; `(set Pending <site>)` marks a specific site.
      const arg = node.items[2];
      if (arg && isRegionNode(arg)) {
        const regionFn = compileRegion(arg, env);
        return (ctx) =>
          regionFn
            .eval(ctx)
            .filter((site) => site >= 0)
            // @java Core/src/game/rules/play/moves/nonDecision/effect/set/pending/SetPending.java:80
            .map((site) => new ActionSetPending(site));
      }
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
      // (set Counter [<int>]) — no argument resets to -1, NOT the current
      // value. Java SetCounter defaults `newValue` to `new IntConstant(-1)`
      // (SetCounter.java:51): "the counter is incremented at each move, so to
      // reinitialise it to 0 at the next move, the counter has to be set at
      // -1." The per-move auto-increment in LudemeGame.apply then carries -1
      // up to 0 — this is how chess's `(then (set Counter))` on a pawn/capture
      // move resets the 50-move-rule clock that `(= (counter) 99)` reads.
      // @java game.rules.play.moves.nonDecision.effect.set.value.SetCounter
      const arg = node.items[2];
      const valFn = arg ? compileInt(arg, env) : undefined;
      return (ctx) => [
        new ActionSetCounter(valFn ? valFn.eval(ctx) : -1),
      ];
    }
    if (subName === "Cost") {
      // (set Cost <cost> [<SiteType>] (at:<site> | to:<region>)) — graph weight.
      // @java game.rules.start.set.sites.SetCost: one ActionSetCost per resolved
      // site. The optional SiteType ident (Vertex/Cell/Edge) is positional after
      // the cost; the TS port has a single graph-play type so it is dropped.
      const { positional, named } = parseArgs(node.items.slice(2));
      const stripped = dropSiteType(positional);
      const costNode = stripped[0];
      const costFn = costNode ? compileInt(costNode, env) : undefined;
      const atNode = named.get("at");
      const toNode = named.get("to") ?? named.get("in");
      const atFn = atNode ? compileInt(atNode, env) : undefined;
      const toReg = toNode ? compileRegion(toNode, env) : undefined;
      return (ctx) => {
        const c = costFn ? costFn.eval(ctx) : 0;
        if (atFn) {
          const s = atFn.eval(ctx);
          return s >= 0 ? [new ActionSetCost(s, c)] : [];
        }
        if (toReg) {
          return toReg
            .eval(ctx)
            .filter((s) => s >= 0)
            .map((s) => new ActionSetCost(s, c));
        }
        return [];
      };
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
          const valueCtx = inThen ? postMoveContext(ctx) : ctx;
          const s = atFn.eval(valueCtx);
          return s >= 0
            ? [
                new ActionSetValue({
                  to: s,
                  value: valFn ? valFn.eval(valueCtx) : 0,
                }),
              ]
            : [];
        };
      }
      const pidFn = positional[0] ? compileInt(positional[0], env) : undefined;
      const valFn = positional[1] ? compileInt(positional[1], env) : undefined;
      return (ctx) => {
        const valueCtx = inThen ? postMoveContext(ctx) : ctx;
        return [
          new ActionSetValueOfPlayer(
            pidFn ? pidFn.eval(valueCtx) : valueCtx.mover,
            valFn ? valFn.eval(valueCtx) : 0,
          ),
        ];
      };
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
    // Resolve the placed piece. A string label ("Disc0", "Ball0", "Pawn1") is
    // resolved the *same* way as a `(place …)` start placement: the trailing
    // digit is the owner index, the base name is the component. This matters
    // for Neutral/Shared pieces ("Ball0" → owner 0, component "Ball"): Java
    // records who == 0 with a positive `what`, so the piece reads as a neutral
    // occupant rather than a mover-owned one. A non-string label (`(piece N)`)
    // falls back to the dynamic int.
    let whatFn: IntFn = { eval: (ctx) => ctx.mover };
    let staticPiece: { what: number; owner: number } | undefined;
    const labelNode = pieceNode?.items[1];
    if (labelNode && isString(labelNode)) {
      staticPiece = resolveAddedPiece(labelNode.value, env);
    }
    if (!staticPiece && labelNode) {
      try {
        whatFn = compileInt(labelNode, env);
      } catch {
        /* mover */
      }
    }
    // Java parity: `(piece … state:N)` records the site state on the placed
    // piece (ActionAdd.java setSite writes state). Read the `state:` named arg
    // from the piece spec (it may live there or on the (add …) node itself).
    const stateSpec =
      (pieceNode ? parseArgs(pieceNode.items.slice(2)).named.get("state") : undefined) ??
      named.get("state");
    let stateFn: IntFn | undefined;
    if (stateSpec) {
      try {
        stateFn = compileInt(stateSpec, env);
      } catch {
        stateFn = undefined;
      }
    }
    const region = resolveAddRegion(node, positional, named, pieceNode, env);
    if (!region) return () => [];
    const stackNode = named.get("stack");
    const onStack =
      stackNode !== undefined && isIdent(stackNode) && stackNode.name === "True";
    const countNode = named.get("count");
    const countFn = countNode ? compileInt(countNode, env) : undefined;
    return (ctx) => {
      const site = region.eval(ctx)[0] ?? OFF;
      if (site < 0) return [];
      const count = countFn ? countFn.eval(ctx) : 1;
      if (count <= 0) return [];
      // Count games (mancala families) represent seeds through the per-site
      // count layer, not as ordinary occupying pieces. `(add (piece "Seed" …)
      // … count:4)` in Whyo's round reset must therefore lay four seeds into
      // `countAt`, not place one mover-owned piece with a count metadata field.
      if (!onStack && countFn && env.sowSeedOwner !== undefined) {
        return [new ActionAddCount(site, count, env.sowSeedOwner)];
      }
      const state = stateFn ? stateFn.eval(ctx) : undefined;
      if (staticPiece) {
        return [
          new ActionAdd({
            to: site,
            what: staticPiece.what,
            owner: staticPiece.owner,
            count,
            onStack,
            ...(state !== undefined ? { state } : {}),
          }),
        ];
      }
      const what = whatFn.eval(ctx);
      const whatId = what > 0 ? what : ctx.mover;
      // Java parity (ActionAdd records the placed component's owner as `who`):
      // derive the owner from the component table rather than letting ActionAdd
      // default ownerIndex to `what`. A captured piece keeps its component id,
      // but its owner is the component's declared owner (e.g. a P1 piece added
      // to P1's hand stays owned by P1, not by owner==what).
      const owner = env.componentOwnerById?.[whatId];
      return [
        new ActionAdd({
          to: site,
          what: whatId,
          ...(owner !== undefined ? { owner } : {}),
          count,
          onStack,
          ...(state !== undefined ? { state } : {}),
        }),
      ];
    };
  }
  return undefined;
}

function compileMoveLudemeInner(node: LudList, env: CompileEnv): MovesFn {
  const second = node.items[1];
  if (second && isIdent(second)) {
    const _r = lookupLudeme("moves", second.name.toLowerCase());
    if (_r) return _r(node, env) as MovesFn;
  }
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
    if (env.notAllPassFlag) env.notAllPassFlag.required = true;
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
    const { positional, named } = parseArgs(node.items.slice(2));
    const siteType = isSiteTypeIdent(positional[0])
      ? ((positional[0] as LudIdent).name as SiteType)
      : undefined;
    const regionNode = dropSiteType(positional)[0];
    if (!regionNode)
      throw new LudemeCompileError("(move Remove …) needs a region.");
    const region = compileRegion(regionNode, env);
    const levelNode = named.get("level");
    const levelFn = levelNode ? compileInt(levelNode, env) : undefined;
    return {
      generate: (ctx) => {
        const out: Move[] = [];
        const mover = ctx.mover;
        for (const site of region.eval(ctx)) {
          if (site < 0) continue;
          // Java Remove.eval (Remove.java:102): skip empty targets before
          // constructing an ActionRemove (`cs.what(loc, realType) <= 0`).
          if (ctx.state.whatAtSite(site) <= 0) continue;
          const level = levelFn ? Math.max(0, levelFn.eval(ctx)) : undefined;
          out.push(
            new Move({
              id: `remove:${site}:${mover}`,
              label: `Remove at ${site}`,
              siteIndices: [site],
              mover,
              placedOwner: mover,
              actions: [
                new ActionRemove({
                  to: site,
                  level,
                  type: siteType,
                  clearAll: env.isStacking === false,
                }),
              ],
            }),
          );
        }
        return out;
      },
    };
  }
  // (move Claim [(piece …)] (to [<type>] <region>|<site> [if:<cond>]) [(then …)])
  // @java game.rules.play.moves.nonDecision.effect.Claim — "claims a site by
  // adding a piece of the specified colour there" (graph-colouring games like
  // Onek Rong). Java emits, per site in the `(to …)` region (or the single
  // `to.loc()` site that passes `if:`), a Move wrapping `ActionAdd(type, site,
  // component, count=1, state)` with `from == to == site`. The component
  // defaults to `Mover`. This is mechanically Add with from=to=site — which the
  // TS `ActionAdd` already reports (its `from()` returns `to`) — but kept as its
  // own branch to mirror Java's ludeme one-to-one for parity tracking. The
  // trailing `(then …)` (e.g. Onek Rong's `(addScore …)`) is applied by the
  // outer move pipeline, as for Add.
  if (second && isIdent(second) && second.name === "Claim") {
    const toNode = node.items.find((n) => isList(n) && listHead(n) === "to") as
      | LudList
      | undefined;
    if (!toNode)
      throw new LudemeCompileError("(move Claim …) needs a (to …) clause.");
    const { positional: toPos, named: toNamed } = parseArgs(
      toNode.items.slice(1),
    );
    const regionArg = dropSiteType(toPos)[0];
    if (!regionArg)
      throw new LudemeCompileError("(move Claim …) (to …) needs a target.");
    const baseRegion = compileRegion(regionArg, env);
    // `(to … if:<cond>)` reads each candidate as `(to)`, matching Java's
    // `context.setTo(site); if (test == null || test.eval(context))`.
    const toIfNode = toNamed.get("if") ?? toNamed.get("If");
    let region: RegionFn = baseRegion;
    if (toIfNode) {
      try {
        const cond = compileBool(toIfNode, env);
        region = {
          eval: (ctx) =>
            baseRegion
              .eval(ctx)
              .filter((s) => s >= 0 && cond.eval(ctx.withFrame({ to: s }))),
        };
      } catch {
        region = baseRegion;
      }
    }
    // Optional `(piece "Label")` — its owner digit must be honoured so a
    // neutral marker keeps who == 0; otherwise the component defaults to Mover.
    const pieceNode = node.items.find(
      (n) => isList(n) && listHead(n) === "piece",
    ) as LudList | undefined;
    let whatFn: IntFn = { eval: (ctx) => ctx.mover };
    let staticPiece: { what: number; owner: number } | undefined;
    const labelNode = pieceNode?.items[1];
    if (labelNode && isString(labelNode)) {
      staticPiece = resolveAddedPiece(labelNode.value, env);
    } else if (labelNode) {
      try {
        whatFn = compileInt(labelNode, env);
      } catch {
        /* leave as mover */
      }
    }
    const stateSpec = pieceNode
      ? parseArgs(pieceNode.items.slice(2)).named.get("state")
      : undefined;
    let stateFn: IntFn | undefined;
    if (stateSpec) {
      try {
        stateFn = compileInt(stateSpec, env);
      } catch {
        stateFn = undefined;
      }
    }
    return {
      generate: (ctx) => {
        const out: Move[] = [];
        const mover = ctx.mover;
        const what = staticPiece ? staticPiece.what : whatFn.eval(ctx);
        const effectiveWhat = what > 0 ? what : mover;
        const owner = staticPiece ? staticPiece.owner : mover;
        const state = stateFn ? stateFn.eval(ctx) : undefined;
        for (const site of region.eval(ctx)) {
          if (site < 0) continue;
          out.push(
            new Move({
              id: `claim:${site}:${mover}`,
              label: `Claim at ${site}`,
              siteIndices: [site],
              mover,
              placedOwner: mover,
              actions: [
                new ActionAdd({
                  to: site,
                  what: effectiveWhat,
                  owner,
                  count: 1,
                  onStack: false,
                  ...(state !== undefined ? { state } : {}),
                }),
              ],
            }),
          );
        }
        return out;
      },
    };
  }
  // (move Add (to <region>) [(piece …)] [count:n] [stack:True] [(then …)])
  if (second && isIdent(second) && second.name === "Add") {
    const { named } = parseArgs(node.items.slice(2));
    let toRegion: RegionFn | undefined;
    const toNode = node.items.find((n) => isList(n) && listHead(n) === "to") as
      | LudList
      | undefined;
    if (toNode) {
      const { positional: toPos, named: toNamed } = parseArgs(
        toNode.items.slice(1),
      );
      const regionArg = dropSiteType(toPos)[0];
      if (regionArg) {
        const baseRegion = compileRegion(regionArg, env);
        // `(to <region> if:<cond>)` filters candidate destinations per Java Add:
        // `context.setTo(toSite); if (test == null || test.eval(context))`, so
        // the condition reads each candidate as `(to)`. Without this every
        // destination is accepted — over-generating placements and breaking
        // `(no Moves …)` end conditions in blocking games (Spots, Roots, …).
        // If the condition uses a ludeme not yet ported it cannot be compiled;
        // rather than fail the whole game we fall back to the unfiltered region
        // (the prior behaviour), so an un-portable filter never regresses a game
        // from MOVE_MISMATCH to COMPILE_FAIL.
        const toIfNode = toNamed.get("if") ?? toNamed.get("If");
        let toCond: BoolFn | undefined;
        if (toIfNode) {
          try {
            toCond = compileBool(toIfNode, env);
          } catch {
            toCond = undefined;
          }
        }
        if (toCond) {
          const cond = toCond;
          toRegion = {
            eval: (ctx) =>
              baseRegion
                .eval(ctx)
                .filter((s) => s >= 0 && cond.eval(ctx.withFrame({ to: s }))),
          };
        } else {
          toRegion = baseRegion;
        }
      }
    }
    if (named.has("to")) {
      toRegion = compileRegion(named.get("to") as LudNode, env);
    }
    if (!toRegion) {
      throw new LudemeCompileError("(move Add …) needs a (to …) region.");
    }
    const region = toRegion;
    // Match the bare `(add …)` form: honour the piece type, count, stacking,
    // and a trailing `(then …)` consequence (e.g. Connect Four `stack:True` and
    // the 2D `(then "Drop")`). Without `stack:True` parsing here, stacking line
    // games degrade to single-cell replacement and never form a line.
    const pieceNode = node.items.find(
      (n) => isList(n) && listHead(n) === "piece",
    ) as LudList | undefined;
    // Resolve the placed piece exactly like the `(add …)` effect form: a string
    // label ("Ball0"/"Disc0") carries an owner digit (0 → Neutral, who == 0 with
    // a positive `what`), so the Add fallback must not default the owner to the
    // mover. A non-string label (`(piece N)`) falls back to the dynamic int.
    let whatFn: IntFn = { eval: (ctx) => ctx.mover };
    let staticPiece: { what: number; owner: number } | undefined;
    const labelNode = pieceNode?.items[1];
    if (labelNode && isString(labelNode)) {
      staticPiece = resolveAddedPiece(labelNode.value, env);
    } else if (
      labelNode &&
      isList(labelNode) &&
      listHead(labelNode) === "id" &&
      labelNode.items[1] &&
      isString(labelNode.items[1])
    ) {
      // `(piece (id "Marker0"))` — the `(id "…")` wrapper resolves to the
      // component `what`, but the owner digit on the label ("Marker0" → 0 /
      // Neutral) must still be honoured so the placed piece carries who == 0.
      // Without this the marker is placed as the mover's, so neutral-scoped
      // queries like `(sites Occupied by:Neutral)` miss it (Snowpaque et al.).
      staticPiece = resolveAddedPiece(labelNode.items[1].value, env);
    }
    if (!staticPiece && labelNode) {
      try {
        whatFn = compileInt(labelNode, env);
      } catch {
        /* leave as mover */
      }
    }
    // `(piece … state:N)` records the placed piece's site state (Java
    // ActionAdd.setSite). The `state:` arg may sit on the piece spec or the
    // (move Add …) node itself.
    const addStateSpec =
      (pieceNode
        ? parseArgs(pieceNode.items.slice(2)).named.get("state")
        : undefined) ?? named.get("state");
    let addStateFn: IntFn | undefined;
    if (addStateSpec) {
      try {
        addStateFn = compileInt(addStateSpec, env);
      } catch {
        addStateFn = undefined;
      }
    }
    const countNode = named.get("count");
    let countFn: IntFn = { eval: () => 1 };
    if (countNode) {
      try {
        countFn = compileInt(countNode, env);
      } catch {
        /* leave as 1 */
      }
    }
    const stackNode = named.get("stack");
    const onStack =
      stackNode !== undefined && isIdent(stackNode) && stackNode.name === "True";
    const walkById = env.componentWalkById;
    // NB: a trailing `(then …)` is applied by the outer move pipeline, not here
    // (handling it locally would double-apply the consequence).
    return {
      generate: (ctx) => {
        const out: Move[] = [];
        const mover = ctx.mover;
        const count = countFn.eval(ctx);
        const state = addStateFn ? addStateFn.eval(ctx) : undefined;
        const what = staticPiece ? staticPiece.what : whatFn.eval(ctx);
        const effectiveWhat = what > 0 ? what : mover;
        // Neutral/Shared placements keep who == 0; only default the owner to the
        // mover when the component table cannot identify the dynamic piece.
        const owner = staticPiece
          ? staticPiece.owner
          : (env.componentOwnerById?.[effectiveWhat] ?? mover);
        // Large piece (`(tile …)` with a turtle walk): its placement covers the
        // whole footprint, so only an anchor where every covered cell is on the
        // board and empty is legal — Java's `Component.locs` returns [] (illegal)
        // when a step leaves the board, and the placement test rejects an anchor
        // whose locs overlap an occupied cell.
        const walks = walkById?.[effectiveWhat];
        for (const site of region.eval(ctx)) {
          if (site < 0) continue;
          let footprint: number[] | undefined;
          if (walks && walks.length > 0) {
            const cells = largePieceFootprint(ctx.board, site, state ?? 0, walks);
            if (!cells) continue; // walk left the board ⇒ illegal anchor
            if (cells.some((c) => c !== site && !ctx.state.isEmptySite(c))) continue;
            if (cells.length > 1) footprint = cells;
          }
          out.push(
            new Move({
              id: `add:${site}:${mover}`,
              label: `Add at ${site}`,
              siteIndices: [site],
              mover,
              // The mover makes the move (placedOwner is 1-based); the placed
              // piece's owner may still be 0 (Neutral) — that lives on the action.
              placedOwner: mover,
              actions: [
                new ActionAdd({
                  to: site,
                  what: effectiveWhat,
                  owner,
                  count,
                  onStack,
                  ...(state !== undefined ? { state } : {}),
                  ...(footprint ? { footprint } : {}),
                }),
              ],
            }),
          );
        }
        return out;
      },
    };
  }
  // (move Promote <site> <piece-spec> [player]) — replace the piece at <site>
  // with another type. We resolve the named component's `what` id (mirroring
  // the `(promote …)` consequence at head==="promote") so the promoted piece
  // reads as the chosen type; without this the site would default to the
  // owner's primary piece (component == owner id), which for chess-family games
  // is the King — producing a phantom second king (see Rumi Shatranj).
  if (second && isIdent(second) && second.name === "Promote") {
    const siteNode = node.items[2];
    if (!siteNode) {
      throw new LudemeCompileError("(move Promote …) needs a site.");
    }
    const siteFn = compileInt(siteNode, env);
    const specInfo = extractPromotePieceSpec(node.items[3]);
    const pieceNames = specInfo.names;
    const playerNode = node.items[4];
    const playerRole =
      (playerNode && isIdent(playerNode) ? playerNode.name : undefined) ??
      specInfo.role ??
      "Mover";
    const idByLabel = env.componentIdByLabel;
    const ownerById = env.componentOwnerById;
    return {
      generate: (ctx) => {
        const s = siteFn.eval(ctx);
        if (s < 0) return [];
        const cellOwner = ctx.state.cells[s] ?? ctx.mover;
        if (cellOwner <= 0) return [];
        const mkMove = (action: ActionPromote, name: string) =>
          new Move({
            id: `promote:${s}:${cellOwner}:${name}`,
            label: `Promote at ${s}${name ? ` to ${name}` : ""}`,
            siteIndices: [s],
            mover: ctx.mover,
            placedOwner: ctx.mover,
            actions: [action],
          });
        // Java Promote emits one move per named piece (a promotion choice).
        if (pieceNames.length > 0 && idByLabel !== undefined) {
          const pid = resolveRole(playerRole, ctx);
          const out: Move[] = [];
          for (const name of pieceNames) {
            const newWhat =
              (pid > 0 ? idByLabel.get(`${name}${pid}`) : undefined) ??
              idByLabel.get(name);
            if (newWhat !== undefined && newWhat > 0) {
              const who = ownerById?.[newWhat];
              const owner = who && who > 0 ? who : pid > 0 ? pid : cellOwner;
              out.push(mkMove(new ActionPromote(s, owner, newWhat), name));
            }
          }
          if (out.length > 0) return out;
        }
        // Owner-only fallback (unresolved name / bare `(move Promote site)`).
        return [mkMove(new ActionPromote(s, cellOwner), "")];
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
  let fromLevelFn: IntFn | undefined;
  if (fromNode) {
    const { positional, named } = parseArgs(fromNode.items.slice(1));
    const regionArg = dropSiteType(positional)[0];
    if (regionArg) fromRegion = compileRegion(regionArg, env);
    const ifNode = named.get("if");
    if (ifNode) fromCond = compileBool(ifNode, env);
    const levelNode = named.get("level");
    if (levelNode) fromLevelFn = compileInt(levelNode, env);
  }
  // `(move Select (from …) (to <region> if:<cond>?))` — Java Select with an
  // explicit destination (Fanorona/Vela capture selection). One Select move is
  // emitted per (from, to) pair passing the to-condition; the board mutation
  // comes from the `(then …)` chain — `(fromTo (from (last From)) (to (last
  // To)))` plus the directional capture — folded by the outer
  // `compileMoveLudeme`. Absent a `(to …)` child this is the from-only mancala
  // form (sow), left byte-for-byte unchanged.
  const toNode = node.items.find(
    (n) => isList(n) && listHead(n) === "to",
  ) as LudList | undefined;
  let toRegion: RegionFn | undefined;
  let toCond: BoolFn | undefined;
  if (toNode) {
    const { positional, named } = parseArgs(toNode.items.slice(1));
    const regionArg = dropSiteType(positional)[0];
    if (regionArg) toRegion = compileRegion(regionArg, env);
    const ifNode = named.get("if");
    if (ifNode) toCond = compileBool(ifNode, env);
  }
  return {
    generate: (ctx) => {
      const mover = ctx.mover;
      let fromSites: number[];
      if (fromRegion) {
        fromSites = [...fromRegion.eval(ctx)];
      } else if (ctx.frame.from !== undefined && ctx.frame.from >= 0) {
        // A bare `(from)` inside `(forEach Piece …)` selects the bound piece
        // (Java's `(from)` reads the current iteration site), not every mover
        // piece — without this the inner Select re-iterates all pieces on each
        // forEach step (Fanorona generated 22× too many moves).
        fromSites = [ctx.frame.from];
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
        // Java Select.eval sets BOTH from and to to the candidate site before
        // testing the from-condition (Select.java: setFrom(site)/setTo(site)),
        // so a condition referencing `(to)` — e.g. `if:(< 1 (count at:(to)))`
        // — sees the selected site rather than an undefined `to` (= OFF).
        const fctx = ctx.withFrame({ from, to: from });
        if (fromCond && !fromCond.eval(fctx)) continue;
        if (toRegion) {
          for (const to of toRegion.eval(fctx)) {
            if (to < 0) continue;
            const sub = fctx.withFrame({ from, to });
            if (toCond && !toCond.eval(sub)) continue;
            out.push(
              new Move({
                id: `select:${from}:${to}:${mover}`,
                label: `Select ${from}→${to}`,
                siteIndices: [to],
                mover,
                placedOwner: mover,
                actions: [new ActionSelect(from, to)],
              }),
            );
          }
          continue;
        }
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

/**
 * Faithful port of Java `Sow.eval` track selection (Sow.java 179-188): walk
 * tracks in declaration order and return the first that matches the named
 * lookup. With `owner` unset (Java `Constants.OFF` = -1) the name must match
 * exactly; with `owner` set the track owner must equal it and the name must
 * *contain* the requested name (so `"TrackCW"` matches `"TrackCW1"` but not
 * `"TrackCCW1"`). Unlike `pickTrack`, this does NOT prefer a track that
 * contains the origin — Java picks purely by name/owner.
 */
function pickNamedTrack(
  ctx: EvalContext,
  trackName: string,
  owner: number,
): MancalaTrack | undefined {
  return ctx.board.tracks.find((t) =>
    owner < 0
      ? t.name === trackName
      : t.owner === owner && t.name.includes(trackName),
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
 * Returns the input site when the radial is missing, too short, or the
 * direction is unknown. Java parity: game.functions.ints.board.Ahead.
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
  const dirFn =
    dirNode && isList(dirNode) && listHead(dirNode) === "directions"
      ? compileDirections(dirNode, env)
      : undefined;
  // `SameDirection` / `OppositeDirection` are resolved specially by Java's Ahead
  // (Ahead.java:96-137): NOT through Directions.convertToAbsolute (which reads
  // the trial's last move), but inline from the *current* move geometry —
  // `context.from()`/`context.to()`, falling back to the last move only when
  // those are undefined. This is what lets Fanorona's very first move capture:
  // `(ahead (to) SameDirection)` reads from = the moving piece (frame.from) and
  // to = the candidate destination (frame.to), takes that direction, and steps
  // one further to find the enemy. Resolving these via the tiling tables (which
  // lack them) returns Off and silently kills the whole capture rule.
  const relativeToMove =
    dirName === "SameDirection" || dirName === "OppositeDirection";
  return {
    eval: (ctx) => {
      const start = siteFn.eval(ctx);
      if (start < 0) return OFF;
      const board = ctx.board;
      // On a graph board the planar lattice is not unit-spaced (scaled / merged
      // / wedge tilings — e.g. `(scale 2 (square 5))`), so a unit (dx,dy) hop
      // lands between sites and yields Off. For an absolute direction follow
      // the board's real edges instead (Java Ahead walks the topology radial).
      // Relative SameDirection/OppositeDirection and player-relative tokens stay
      // on the move-geometry vector path below.
      if (
        board.traj &&
        !relativeToMove &&
        !isRelativeDirectionToken(dirName)
      ) {
        const steps = stepsFn ? stepsFn.eval(ctx) : 1;
        let site = start;
        for (let i = 0; i < steps; i += 1) {
          const ns = board.traj.steps(site, dirName);
          if (ns.length === 0) return start;
          site = ns[0] as number;
        }
        return site;
      }
      let dir: Dir | undefined;
      if (dirFn) {
        dir = dirFn.eval(ctx)[0];
        if (!dir) return start;
      } else if (relativeToMove) {
        const ff = ctx.frame.from;
        const tt = ctx.frame.to;
        const moveFrom = ff !== undefined && ff >= 0 ? ff : lastFromSite(ctx);
        const moveTo = tt !== undefined && tt >= 0 ? tt : lastToSite(ctx);
        const dirs =
          dirName === "SameDirection"
            ? directionsBetween(ctx, moveFrom, moveTo)
            : directionsBetween(ctx, moveTo, moveFrom);
        dir = dirs[0];
      } else {
        dir = resolveDirection(
          dirName,
          facingForSite(ctx, start),
          ctx.board.tiling,
        );
      }
      if (!dir) return start;
      const steps = stepsFn ? stepsFn.eval(ctx) : 1;
      let x = board.xOf(start);
      let y = board.yOf(start);
      let site = start;
      for (let i = 0; i < steps; i += 1) {
        x += dir.dx;
        y += dir.dy;
        site = board.siteAt(x, y);
        if (site < 0) return start;
      }
      return site;
    },
  };
}

function compileTrackSite(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const kindNode = positional[0];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "FirstSite";
  // The track name is a *positional* String in every Java `TrackSite.construct`
  // overload (`@Opt @Or final String name`) — e.g. `(trackSite Move (to)
  // "TrackCCW" steps:1)` from the stdlib `NextSiteOnTrack` define. Reading it
  // only as `name:` (named) silently dropped it, so a dual-track mancala
  // (Bay Khom / O An Quan / Adi …) resolved the next hole on the mover's *first*
  // track instead of the named one, mis-firing the sow's relay/capture branch.
  const nameNode = named.get("name");
  const positionalNameNode = positional.slice(1).find((n) => isString(n));
  const trackName =
    nameNode && isString(nameNode)
      ? nameNode.value
      : positionalNameNode && isString(positionalNameNode)
        ? positionalNameNode.value
        : undefined;
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
        const steps = stepsFn ? stepsFn.eval(ctx) : 0;
        // Java TrackSiteMove.eval (lines 141-188): on a NON-looped track in a
        // game that has an internal-loop track, a site that repeats along the
        // ring can no longer be located by first occurrence — the piece's true
        // ring index is read from the maintained `OnTrackIndices`. `onTrackIndices
        // != null` is exactly Java's `hasInternalLoopInTrack()` (it is allocated
        // iff that flag is set). When the structure has no record of the piece at
        // `from` (Java leaves `i = elems.length`), the move runs off the end and
        // returns OFF, matching Java's fall-through — no first-occurrence fallback.
        const oti = ctx.state.onTrackIndices;
        if (
          oti !== undefined &&
          !track.loop &&
          from >= 0 &&
          track.trackIdx !== undefined &&
          track.locToIndex !== undefined
        ) {
          const what = ctx.state.whatAtSite(from);
          let i = ring.length; // not-found sentinel (Java initial i = elems.length)
          if (what !== 0) {
            const lane = oti[track.trackIdx]?.[what];
            const locs = track.locToIndex.get(from);
            if (lane && locs) {
              for (const index of locs) {
                if ((lane[index] ?? 0) > 0) {
                  i = index;
                  break;
                }
              }
            }
          } else {
            // No piece: first occurrence of the site (Java lines 184-187).
            const found = ring.indexOf(from);
            if (found >= 0) i = found;
          }
          i += steps > 0 ? steps : 0;
          if (i < ring.length) return ring[i] as number;
          return OFF;
        }
        const idx = ring.indexOf(from);
        // Java TrackSiteMove (184-205): an off-track `from` — the standard
        // hand→track entry `from=(handSite Mover)` — leaves the search index
        // at elems.length and advances numSteps from there, so a LOOP track
        // wraps into its steps-th site (ring[steps]) and a non-loop track runs
        // off the end → OFF. Use ring.length as the not-found base instead of
        // bailing to OFF; the wrap/length guards below then match Java.
        const baseIdx = idx < 0 ? ring.length : idx;
        let i = baseIdx + (steps > 0 ? steps : 0);
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
  const { positional, named } = parseArgs(node.items.slice(1));
  // Java `Sow(trackName, owner:…)`: the leading positional string names the
  // track and `owner:` is the track owner (Sow.java 177-188). Track selection
  // walks tracks in declaration order and picks the first where the name+owner
  // match — NOT the first track that merely contains the origin (which is what
  // a multi-track-per-player board like Chisolo/Bao would wrongly resolve to).
  const trackNameNode = positional.find((p) => isString(p));
  const sowTrackName =
    trackNameNode && isString(trackNameNode) ? trackNameNode.value : undefined;
  // Java `Sow`: the leading (non-type, non-track-name) positional is `start` —
  // the origin of the sowing (Sow.java param `start`, default `(lastTo)`). Most
  // sows omit it and start from the move's selected hole. It bites relay sows
  // inside a capture `apply:` block, e.g. Deka's
  // `(sow ("NextHoleFrom" (to) 1) count:3 …)`, which re-sows the just-scooped
  // seeds from a hole *other* than the original `from`. Without honouring it,
  // TS sows from `ctx.frame.from` (the now-empty origin) and drops nothing,
  // leaving the relayed seeds stranded — the state drifts and the mover flips a
  // ply or two later.
  const siteTypeIdents = new Set(["Cell", "Vertex", "Edge"]);
  const startNode = positional.find(
    (p) =>
      !isString(p) &&
      !(isIdent(p) && siteTypeIdents.has(p.name)) &&
      // `(then …)` is the trailing positional Then clause (Sow.java `then`),
      // not an IntFunction start — never treat it as the sow origin.
      !(isList(p) && listHead(p) === "then"),
  );
  const startFn = startNode ? compileInt(startNode, env) : undefined;
  const ownerNode = named.get("owner");
  const ownerFn = ownerNode ? compileInt(ownerNode, env) : undefined;
  const ifNode = named.get("if");
  const applyNode = named.get("apply");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;
  const apply =
    applyNode && isList(applyNode) ? compileEffect(applyNode, env) : undefined;
  // NOTE: Java `Sow.sowEffect` (Sow.java 266-272) — an effect run at each hole
  // before the drop (the 4-row mancala "convert the opponent's hole mid-sow"
  // rule, e.g. Ngulungu/Quendo/Mwendo/Buqruru/Ga) — is intentionally NOT ported
  // here yet. A direct port (compile `sowEffect:` and append its actions before
  // each drop) was tried and REGRESSED Ngulungu OUTCOME_OK→WINNER_MISMATCH and
  // Quendo WINNER→MOVE: the conversion's `(remove (to) count:N)` +
  // `(add (piece (id "Seed" Mover)) … count:N)` uses the generic stack-based
  // add/remove actions, which do not conserve seed COUNT when composed with the
  // mancala count-model (`ActionAddCount`), so per-player totals drift and the
  // `(no Pieces Player)` end test flips the winner. Faithful support needs
  // count-mode add/remove (seed-count-preserving) first. The owner-fix above
  // already keeps `(who at:)` correct, which is what these games' `"LeftMost"`
  // selector reads, so most corpus trials replay correctly without it.
  const btNode = named.get("backtracking");
  // Java `Sow.backtracking` is a full BooleanFunction, not just a literal
  // flag (Sow.java ctor takes `BooleanFunction backtracking`). Games like
  // Baqura gate the backward capture relay with a dynamic expression:
  // `backtracking:(and {(is In (to) (sites Mover)) (> (count at:(to)) 1)
  // (is Even (count at:(to)))})`. Treating this as only `True` collapsed the
  // relay to a single landing-site capture, leaving seeds behind and making the
  // later recorded Pass illegal in TS.
  const backtracking = btNode ? compileBool(btNode, env) : undefined;
  // Java `Sow.forward` is likewise a BooleanFunction, evaluated on the current
  // and then advanced `to` site each step (Sow.java 331-345).
  const fwNode = named.get("forward");
  const forward = fwNode ? compileBool(fwNode, env) : undefined;
  // Java `Sow`: a hole where `skipIf:` evaluates true is passed over without
  // dropping a seed (the seed is carried to the next non-skipped hole). See
  // Sow.java lines 232-244: `index--; numSkipped++; i = nextIndex; continue;`.
  const skipIfNode = named.get("skipIf");
  const skipIf = skipIfNode ? compileBool(skipIfNode, env) : undefined;
  // Java `Sow`: `includeSelf` defaults true; when explicitly False the origin
  // hole is passed over during sowing (Sow.java lines 250-254: a seed is never
  // dropped back into `start`). This only bites when a hole holds enough seeds
  // to wrap the ring (e.g. Awari mid-game), but the off-by-one it prevents
  // accumulates across plies and eventually changes the legal-move set.
  const includeSelfNode = named.get("includeSelf");
  const includeSelf = !(
    includeSelfNode && isIdent(includeSelfNode) && includeSelfNode.name === "False"
  );
  // Java `Sow.origin` (default false): when true, the first numPerHole seeds are
  // dropped back into the origin hole before forward sowing begins (Sow.java
  // 199-222 — "sowing first into the hole from which the counters came"). Can be
  // a dynamic BooleanFunction (e.g. origin:("NewTurn")), so compile it.
  const originNode = named.get("origin");
  const origin = originNode ? compileBool(originNode, env) : undefined;
  // Java `Sow.numPerHole` (default 1): seeds dropped per hole. Usually constant
  // but can be dynamic (numPerHole:(if …)).
  const numPerHoleNode = named.get("numPerHole");
  const numPerHole = numPerHoleNode ? compileInt(numPerHoleNode, env) : undefined;
  // Java `Sow.countFn` (default `(count (lastTo))` — all seeds at the start
  // hole): the number of seeds to pick up and sow. An explicit `count:` sows
  // exactly that many and leaves the rest (e.g. Intotoi `(sow count:2)`).
  const countNode = named.get("count");
  const countFn = countNode ? compileInt(countNode, env) : undefined;
  const fallbackOwner = env.sowSeedOwner ?? env.numPlayers + 1;
  return (ctx) => {
    const from = startFn ? startFn.eval(ctx) : ctx.frame.from;
    if (from === undefined || from < 0) return [];
    // Java `Sow.eval` (Sow.java) has NO "start hole non-empty" guard — it
    // evaluates `count = countFn.eval(context)` and emits that many seed moves
    // regardless of the seeds currently at the start hole. A nested capture-relay
    // sow (e.g. Mweso/Isolo `(sow (lastFrom) count:(+ cap1 cap2) ...)` inside an
    // `apply:`/`(and {…})` block) has its start hole filled by SIBLING `(fromTo …)`
    // capture actions that have not yet been applied at generation time, so a
    // generation-time emptiness check wrongly drops the whole inner sow. Only the
    // computed `startCount` may gate (an explicit `count:` keeps its value; a
    // default sow falls back to the seeds currently in hand, identical to before).
    const startCount = countFn
      ? countFn.eval(ctx.withFrame({ from, to: from }))
      : ctx.state.countAtSite(from);
    if (startCount <= 0) return [];
    // Java `Sow.eval` (Sow.java 180-186): when no `track:` name is given, the
    // selection loop short-circuits on `trackName == null` and picks
    // `preComputedTracks[0]` = `game.board().tracks()[0]` — the FIRST board track,
    // for EVERY mover (the javadoc: "The first track if it exists"; owner is
    // ignored on the unnamed path). The TS port previously chose the mover's OWN
    // track, so in a 2-track mancala (Chonka: Track1 P1 / Track2 P2) P2 sowed
    // along a different ring than Java → board drift → MOVE_MISMATCH. Mirror Java:
    // unnamed sow ⇒ first board track. Single-track games are unaffected (the one
    // track is also tracks[0]); only multi-track sows shift, toward Java.
    const track =
      sowTrackName !== undefined
        ? pickNamedTrack(ctx, sowTrackName, ownerFn ? ownerFn.eval(ctx) : -1)
        : (ctx.board.tracks[0] ?? pickTrack(ctx, from));
    if (!track) return [];
    const ring = track.sites;
    const startPos = ring.indexOf(from);
    if (startPos < 0) return [];

    // Java `Sow.eval` (Sow.java 277-280) sows via `ActionMove.construct(start →
    // to)`: it MOVES the seed component out of the origin hole, so every
    // destination inherits the *moved piece's owner* — i.e. the origin hole's
    // current owner. For `(piece "Seed" Shared)` games that owner is the neutral
    // `numPlayers+1` (matching the old hard-coded value); but for `(piece "Seed"
    // Each)` games (Ngulungu, Chiana wa Kunja, Quendo) the mover sows their OWN
    // Seed1/Seed2, so the sown holes must stay owned by the mover — not the
    // neutral owner. Hard-coding `numPlayers+1` corrupted `(who at:(to))`, which
    // those games' `"LeftMost"` selector reads to find the mover's seed holes.
    // Reading the live source owner unifies both cases faithfully.
    const srcOwner = ctx.state.cells[from] ?? 0;
    const seedOwner = srcOwner > 0 ? srcOwner : fallbackOwner;

    const actions: Action[] = [new ActionAddCount(from, -startCount, seedOwner)];
    let pos = startPos;
    let landing = from;
    let placed = 0;
    // Drop up to numPerHole seeds (default 1) at `site`, capped by the seeds
    // still in hand. Returns true if at least one seed landed (so `landing`
    // tracks the last hole that actually received a seed).
    const dropAt = (site: number): boolean => {
      const per = numPerHole ? numPerHole.eval(ctx.withFrame({ from, to: site })) : 1;
      let dropped = 0;
      while (dropped < per && placed < startCount) {
        actions.push(new ActionAddCount(site, +1, seedOwner));
        placed += 1;
        dropped += 1;
      }
      if (dropped > 0) landing = site;
      return dropped > 0;
    };
    // origin:True — seed the origin hole first (consuming from the hand).
    if (origin && origin.eval(ctx.withFrame({ from, to: from }))) dropAt(from);
    // Java caps consecutive skips at Constants.MAX_NUM_ITERATION (10000); past
    // that the skip stops applying so distribution always terminates.
    let numSkipped = 0;
    const MAX_SKIP = 10000;
    while (placed < startCount) {
      pos += 1;
      if (pos >= ring.length) {
        if (!track.loop) break;
        pos = 0;
      }
      const site = ring[pos] as number;
      if (skipIf && numSkipped < MAX_SKIP) {
        const skipCtx = ctx.withFrame({ from, to: site });
        if (skipIf.eval(skipCtx)) {
          numSkipped += 1;
          continue;
        }
      }
      // includeSelf:False — never drop a seed back into the origin hole.
      if (!includeSelf && site === from) continue;
      numSkipped = 0;
      dropAt(site);
    }

    let postState = ctx.state;
    for (const a of actions) postState = a.apply(postState);

    // Java `Sow`: `captureRule = (If == null) ? BooleanConstant(true) : If`,
    // so a missing `if:` defaults to *true* — the `apply:` effect still runs at
    // the landing hole (this is how no-`if:` sows trigger relay (moveAgain) and
    // unconditional captures). Run `apply` whenever it is present, using `cond`
    // (when given) as the gate.
    if (apply) {
      let capPos = ring.indexOf(landing);
      for (let guard = 0; guard < ring.length && capPos >= 0; guard += 1) {
        const capSite = ring[capPos] as number;
        const subCtx = ctx
          .withContext(ctx.context.withState(postState))
          .withFrame({ from, to: capSite });
        if (cond && !cond.eval(subCtx)) break;
        for (const a of apply(subCtx)) {
          actions.push(a);
          postState = a.apply(postState);
        }
        if (!backtracking && !forward) break;
        if (forward) {
          if (!forward.eval(subCtx)) break;
          capPos += 1;
          if (capPos >= ring.length) {
            if (!track.loop) break;
            capPos = 0;
          }
          const nextSite = ring[capPos] as number;
          const nextCtx = ctx
            .withContext(ctx.context.withState(postState))
            .withFrame({ from, to: nextSite });
          if (!forward.eval(nextCtx)) break;
          // NOTE: no "stop at origin" guard here. Java's forward capture branch
          // (Sow.java 331-345) has none — it terminates only on the `if:`
          // capture rule failing or after a full lap (numCapture >= track len,
          // matched by this loop's `guard < ring.length` bound). Adjiboto's
          // multi-capture sweep walks *through* the origin hole (e.g. capturing
          // 5→0→1→2→3 after sowing from hole 0), so breaking at `from` here
          // would truncate the sweep.
        } else if (backtracking) {
          if (!backtracking.eval(subCtx)) break;
          capPos -= 1;
          if (capPos < 0) {
            if (!track.loop) break;
            capPos = ring.length - 1;
          }
          const nextSite = ring[capPos] as number;
          const nextCtx = ctx
            .withContext(ctx.context.withState(postState))
            .withFrame({ from, to: nextSite });
          if (!backtracking.eval(nextCtx)) break;
          // Java Sow.java line 327: only the *backtracking* branch stops when
          // the walk reaches the origin hole.
          if (nextSite === from) break;
        } else {
          break;
        }
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
/**
 * Faithful port of Java `Push.eval`
 * (Core/src/game/rules/play/moves/nonDecision/effect/Push.java). Pushes the
 * whole line of pieces starting at `from` one step along a single absolute
 * direction: the piece at `from` is carried into the next site, displacing its
 * occupant, which is carried onward, and so on until an empty site absorbs the
 * carried piece (or the radial ends). Used by Quixo, Tara and Pushing Me XO.
 *
 * Java reads every `cs.what(site)` against the *pre-move* container state (the
 * remove/add actions are queued, not applied mid-eval), so this evaluator reads
 * `ctx.state` throughout and never the intermediate result. The carried piece's
 * owner is taken from the source cell's `who` (so a neutral Quixo Square keeps
 * who==0 while a player's piece keeps its owner), matching ActionAdd deriving
 * `who` from the component's owner.
 */
function compilePushEffect(node: LudList, env: CompileEnv): EffectFn {
  const fromClause = node.items.find(
    (n) => isList(n) && listHead(n) === "from",
  ) as LudList | undefined;
  const fromInner = fromClause
    ? dropSiteType(fromClause.items.slice(1))[0]
    : undefined;
  // Java: `from == null → new LastTo(null)`. A bare `(from)` or a missing
  // clause both default to the move's `to` site (the just-selected push entry).
  const fromSiteFn: IntFn =
    fromInner !== undefined
      ? compileInt(fromInner, env)
      : { eval: (ctx) => ctx.frame.to ?? OFF };
  // The push direction is the first non-clause argument: a bare compass ident
  // (Quixo's `E`/`W`/`N`/`S`) or a `(directions …)` wrapper. Java takes only the
  // first resolved absolute direction (`directions.get(0)`).
  let dirToken: string | undefined;
  for (const it of node.items.slice(1)) {
    if (isIdent(it)) {
      dirToken = it.name;
      break;
    }
    if (isList(it) && listHead(it) === "directions") {
      const t = it.items.slice(1).find((n) => isIdent(n));
      if (t && isIdent(t)) {
        dirToken = t.name;
        break;
      }
    }
  }
  if (dirToken === undefined) return () => [];
  const token = dirToken;
  return (ctx) => {
    const from = fromSiteFn.eval(ctx);
    if (from < 0) return [];
    const board = ctx.board;
    // Graph boards follow topology radials; lattice boards (Quixo's square)
    // walk the Cartesian dx/dy ray. Either way `ray[0]` is `from` itself.
    let ray: number[] | undefined;
    if (board.traj !== undefined) {
      ray = board.traj.radialsByName(from, token)[0];
    }
    if (ray === undefined) {
      const d = resolveDirectionTokens([token], ctx, from)[0];
      if (d === undefined) return [];
      ray = [from, ...hopRay(board, from, d.dx, d.dy)];
    }
    if (ray.length === 0) return [];
    const st = ctx.state;
    const actions: Action[] = [];
    let currentWhat = st.whatAtSite(ray[0]!);
    let currentWho = st.cells[ray[0]!] ?? 0;
    // Java: `ActionRemove.construct(from)` — clear the pushed-from site first.
    actions.push(new ActionRemove({ to: from, clearAll: env.isStacking === false }));
    for (let toIdx = 1; toIdx < ray.length; toIdx += 1) {
      const to = ray[toIdx]!;
      const what = st.whatAtSite(to);
      if (what !== 0) {
        actions.push(new ActionRemove({ to, clearAll: env.isStacking === false }));
        if (currentWhat > 0)
          actions.push(new ActionAdd({ to, what: currentWhat, owner: currentWho }));
        currentWhat = what;
        currentWho = st.cells[to] ?? 0;
      } else {
        // Empty site absorbs the carried piece; the push stops here.
        if (currentWhat > 0)
          actions.push(new ActionAdd({ to, what: currentWhat, owner: currentWho }));
        break;
      }
    }
    return actions;
  };
}

function compileFromToEffect(node: LudList, env: CompileEnv): EffectFn {
  const fromClause = node.items.find(
    (n) => isList(n) && listHead(n) === "from",
  ) as LudList | undefined;
  const toClause = node.items.find(
    (n) => isList(n) && listHead(n) === "to",
  ) as LudList | undefined;
  const { named } = parseArgs(node.items.slice(1));
  // A `(from …)`/`(to …)` clause's site is its first non-SiteType child. When
  // the clause is bare — `(from)` / `(to)` — Java's From/To default to the
  // move's own from/to site (frame). Murus Gallicus' tower-split
  // `(apply (fromTo (from) (to (between))))` relies on this: `(from)` is the
  // hopping tower's origin and `(to (between))` the row-1 landing. The old
  // `isList(items[1])` guard dropped the bare `(from)` (and any SiteType- or
  // number-argument form), so the whole effect produced no action and the
  // second piece never split off.
  const fromInner = fromClause
    ? dropSiteType(fromClause.items.slice(1))[0]
    : undefined;
  const fromNamed = fromClause ? parseArgs(fromClause.items.slice(1)).named : undefined;
  const fromSiteFn: IntFn | undefined = fromClause
    ? fromInner
      ? compileInt(fromInner, env)
      : { eval: (ctx) => ctx.frame.from ?? -1 }
    : undefined;
  const fromLevelNode = fromNamed?.get("level");
  const fromLevelFn = fromLevelNode ? compileInt(fromLevelNode, env) : undefined;
  const toInner = toClause
    ? dropSiteType(toClause.items.slice(1))[0]
    : undefined;
  const toNamed = toClause ? parseArgs(toClause.items.slice(1)).named : undefined;
  const toSiteFn: IntFn | undefined = toClause
    ? toInner
      ? compileInt(toInner, env)
      : { eval: (ctx) => ctx.frame.to ?? -1 }
    : undefined;
  const toLevelNode = toNamed?.get("level");
  const toLevelFn = toLevelNode ? compileInt(toLevelNode, env) : undefined;
  const countNode = named.get("count");
  const countFn = countNode ? compileInt(countNode, env) : undefined;
  const seedOwner = env.sowSeedOwner ?? env.numPlayers + 1;
  // A `(fromTo … (then <effect>))` carries a consequence run AFTER the transfer,
  // on the post-transfer board — the mancala multi-hole capture chain
  // (Bechi/Bay Khom: `(fromTo (from (to)) (to (handSite Mover)) count:…
  // (then (if (is Even (count at:("NextHole" (last From) 1))) (and (fromTo …)
  // (if …)))))`). Java runs it via `Move.getActionsWithConsequences`, which
  // makes THIS fromTo the trial's last move, so the chain's `(last From)`/
  // `(last To)` resolve to this fromTo's from/to (the just-captured hole), and
  // `("NextHole" (last From) k)` walks the next-k holes off it. Mirror the
  // sow-then handling (inThen=false + a pre-advanced post-transfer state) and
  // record a synthetic last move so `(last From)`/`(last To)` see src/dst.
  const thenNode = node.items.find(
    (n) => isList(n) && listHead(n) === "then",
  ) as LudList | undefined;
  const thenC = thenNode ? compileThen(thenNode, env) : undefined;
  return (ctx) => {
    if (!fromSiteFn || !toSiteFn) return [];
    const src = fromSiteFn.eval(ctx);
    const dst = toSiteFn.eval(ctx);
    if (src < 0 || dst < 0 || src === dst) return [];
    // Java `FromTo`: when no `count:` (and no level) is given the action is a
    // plain piece relocation — `ActionMove.construct(from, to)` — not a seed
    // transfer. This is the backgammon "hit": `(fromTo (from (to)) (to #1))`
    // inside `HittingCapture` moves the lone enemy piece from the landing
    // point to its bar. Only the explicit-`count:` form (mancala sow capture,
    // `(fromTo … count:(count at:(to))))`) moves a quantity of seeds.
    let baseActions: Action[];
    // The fromTo's own from/to, reported faithfully so a recorded synthetic
    // last move resolves `(last From)`/`(last To)` for the `(then …)` chain.
    let decisionMove: ActionMove;
    if (fromLevelFn || toLevelFn) {
      // Java FromTo with `level:` picks a specific stack level rather than the
      // generic top piece. Quan-style mancala consequents build a full sow out of
      // `(forEach Value ... (fromTo (from <src> level:<expr>) (to <dst>) ...))`;
      // without preserving the per-level move action, the whole body collapses
      // to a no-op and only the surrounding bookkeeping survives.
      if (ctx.state.whatAtSite(src) <= 0) return [];
      const fromLevel = fromLevelFn?.eval(ctx);
      const toLevel = toLevelFn?.eval(ctx);
      if (fromLevel !== undefined && toLevel !== undefined) {
        baseActions = [
          new ActionMoveLevelFromLevelTo(src, fromLevel, dst, toLevel),
        ];
      } else if (fromLevel !== undefined) {
        baseActions = [new ActionMoveLevelFrom(src, fromLevel, dst)];
      } else {
        baseActions = [new ActionMoveLevelTo(src, dst, toLevel!)];
      }
      decisionMove = new ActionMove({ from: src, to: dst });
    } else if (!countFn) {
      // Java FromTo.eval (FromTo.java:184-186): `int what = cs.what(from); if
      // (what <= 0) continue;` — the guard tests the source component `what`,
      // NOT the owner. A neutral piece (Quixo's Square0: what=3, who=0) IS a
      // piece and must relocate, so checking `cells[src]` (owner) here wrongly
      // dropped the move-to-hand and left the hand empty.
      if (ctx.state.whatAtSite(src) <= 0) return [];
      decisionMove = new ActionMove({ from: src, to: dst });
      baseActions = [decisionMove];
    } else {
      const n = countFn.eval(ctx);
      if (n <= 0) return [];
      baseActions = [
        new ActionAddCount(src, -n, seedOwner),
        new ActionAddCount(dst, +n, seedOwner),
      ];
      // A single transfer-count ActionMove applies the identical −n/+n count
      // shift but keeps from()/to()/count() reporting intact — used only to
      // resolve `(last From)`/`(last To)` for the consequence.
      decisionMove = new ActionMove({
        from: src,
        to: dst,
        count: n,
        transferCount: true,
        seedOwner,
      });
    }
    if (!thenC) return baseActions;
    let postState = ctx.state;
    for (const a of baseActions) postState = a.apply(postState);
    const synth = new Move({
      id: `fromToThen:${src}:${dst}`,
      label: `FromTo ${src}->${dst}`,
      siteIndices: [src, dst],
      mover: ctx.mover,
      placedOwner: ctx.mover,
      actions: [decisionMove],
    });
    const ectx = ctx
      .withContext(
        ctx.context
          .withTrial(ctx.context.trial.withMove(synth, false, -1))
          .withState(postState),
      )
      .withFrame({ from: src, to: dst });
    const extra = thenC.effect ? thenC.effect(ectx) : [];
    let again = thenC.moveAgain;
    if (!again && thenC.moveAgainCond) again = thenC.moveAgainCond.eval(ectx);
    const out = [...baseActions, ...extra];
    if (again) out.push(new ActionSetNextPlayer(ectx.mover));
    return out;
  };
}

/**
 * `(directional (from <site>)? <directions>? (to if:<cond> (apply <effect>)?))`
 * as a post-move effect. Faithful port of Java
 * `Core/src/game/rules/play/moves/nonDecision/effect/Directional.java`: starting
 * at the `from` site (default `(last To)`), it walks each resolved absolute
 * direction's radial outward and, at each successive site, sets `(to)` to that
 * site and applies the `(to …)` effect — STOPPING along a ray at the first site
 * whose `if:` condition fails (`break`, not skip). The capture direction is a
 * `(directions <type> from:A to:B)` between-sites form (Fanorona/Vela approach
 * `("LastDirection" …)` and withdrawal lines) or a bare relative/compass token;
 * with no directions argument Java infers it from the last move (lastFrom →
 * lastTo). This is the line-capture removal folded into Fanorona's Select-move
 * `(then …)`; without it the captured enemies are never removed and the board
 * diverges from Java at the next ply.
 */
function compileDirectionalEffect(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // from: the radial origin. Java default `(last To)`.
  const fromClause = node.items.find(
    (n) => isList(n) && listHead(n) === "from",
  ) as LudList | undefined;
  let fromFn: IntFn;
  if (fromClause) {
    const inner = dropSiteType(fromClause.items.slice(1))[0];
    fromFn = inner ? compileInt(inner, env) : { eval: lastToSite };
  } else {
    fromFn = { eval: lastToSite };
  }
  // directions: a `(directions <type> from:A to:B)` between-sites clause, a bare
  // direction token, or — when absent — the last move's direction.
  const dirsClause = node.items.find(
    (n) => isList(n) && listHead(n) === "directions",
  ) as LudList | undefined;
  let dirResolver: (ctx: EvalContext, anchor: number) => Dir[];
  if (dirsClause) {
    const { named } = parseArgs(dirsClause.items.slice(1));
    const fromArg = named.get("from");
    const toArg = named.get("to");
    if (fromArg && toArg) {
      const a = compileInt(fromArg, env);
      const b = compileInt(toArg, env);
      dirResolver = (ctx) => directionsBetween(ctx, a.eval(ctx), b.eval(ctx));
    } else {
      const tokens = rawDirectionTokens(dirsClause);
      dirResolver = (ctx, anchor) => resolveDirectionTokens(tokens, ctx, anchor);
    }
  } else {
    const bare = node.items
      .slice(1)
      .find((n) => isIdent(n) && n.name !== "~") as
      | { name: string }
      | undefined;
    if (bare) {
      const tokens = [bare.name];
      dirResolver = (ctx, anchor) => resolveDirectionTokens(tokens, ctx, anchor);
    } else {
      // Java default: infer the direction from the last move (lastFrom→lastTo).
      dirResolver = (ctx) =>
        directionsBetween(ctx, lastFromSite(ctx), lastToSite(ctx));
    }
  }
  // to: per-site guard `if:` and the `(apply <effect>)` to run at each match.
  const toClause = node.items.find(
    (n) => isList(n) && listHead(n) === "to",
  ) as LudList | undefined;
  let cond: BoolFn | undefined;
  let applyFn: EffectFn | undefined;
  if (toClause) {
    const { positional, named } = parseArgs(toClause.items.slice(1));
    const ifNode = named.get("if");
    if (ifNode) {
      try {
        cond = compileBool(ifNode, env);
      } catch {
        /* leave guard open */
      }
    }
    const applyNode = positional.find(
      (n) => isList(n) && listHead(n) === "apply",
    ) as LudList | undefined;
    if (applyNode) {
      try {
        applyFn = compileApply(applyNode, env);
      } catch {
        /* no effect */
      }
    }
  }
  // Java defaults when the clause is omitted: target enemy pieces and remove
  // them. Fanorona/Vela always supply the explicit clause, so this is a safety
  // fallback only.
  if (!cond) {
    cond = {
      eval: (ctx) => {
        const s = ctx.frame.to ?? OFF;
        if (s < 0) return false;
        const w = ctx.state.cells[s] ?? 0;
        return w > 0 && w !== ctx.mover;
      },
    };
  }
  const effect: EffectFn =
    applyFn ??
    ((ctx) => {
      const s = ctx.frame.to ?? OFF;
      return s >= 0
        ? [new ActionRemove({ to: s, clearAll: env.isStacking === false })]
        : [];
    });
  return (ctx) => {
    const origin = fromFn.eval(ctx);
    if (origin < 0) return [];
    const dirs = dirResolver(ctx, origin);
    if (dirs.length === 0) return [];
    const board = ctx.board;
    const ox = board.xOf(origin);
    const oy = board.yOf(origin);
    const cap = board.numSites + 1;
    const keepFrom = ctx.frame.from;
    const out: Action[] = [];
    for (const d of dirs) {
      for (let k = 1; k <= cap; k += 1) {
        const s = board.siteAt(ox + d.dx * k, oy + d.dy * k);
        if (process.env.DIR_DEBUG)
          console.error(`  step k=${k} s=${s} cell=${ctx.state.cells[s] ?? "-"}`);
        if (s === OFF) break;
        const sub = ctx.withFrame({ from: keepFrom, to: s });
        if (!cond!.eval(sub)) break; // Java: break at first non-target site.
        out.push(...effect(sub));
      }
    }
    return out;
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
  // Java To.java: when the `(to …)` clause names no region/site, the
  // destination defaults to the context `to` site — the destination set by an
  // enclosing iterator (e.g. (forEach Direction …)/(hop …)). Xiangqi's horse
  //   (move (from) (to (apply if:("IsEnemyAt" (to)) (remove (to)))))
  // sits inside (forEach Direction … (directions {FR FL} of:All) …); each
  // reached site is the implied destination. Without this fallback the inner
  // move fails to compile and the whole forEach silently collapses to no moves.
  const toRegion: RegionFn = toRegionArg
    ? compileRegion(toRegionArg, env)
    : {
        eval: (ctx) => {
          const t = ctx.frame.to;
          return t !== undefined && t >= 0 ? [t] : [];
        },
      };
  const ifNode = toNamed.get("if");
  const toCond: BoolFn | undefined = ifNode ? compileBool(ifNode, env) : undefined;
  const effect = applyNode ? compileApply(applyNode, env) : undefined;

  // `copy:True` (Java `Move … copy:`) — the source piece stays put and a copy
  // of it is placed at `to`. Used by place-from-hand games (Order and Chaos,
  // Chameleon, …) where both players draw from a shared hand without depleting
  // it. Emit an `ActionAdd` of the source's component at `to` instead of a
  // relocating `ActionMove`.
  const { named: moveNamed } = parseArgs(after);
  const copyNode = moveNamed.get("copy");
  const isCopy = !!(copyNode && isIdent(copyNode) && copyNode.name === "True");
  // `count:N` (Java FromTo.count): in a non-stacking *count* game (mancala) the
  // move is an `ActionMoveN` — it transfers N counters from the source hole to
  // the destination, not a single relocating `ActionMove` (FromTo.java 344-350).
  // Iyogh/Azigo/Chisolo/… open by emptying a hole into another via
  // `(move (from …) (to …) count:(count at:(from)))`; without honouring count,
  // only one seed moves and the board diverges from Java at ply 0. Gated on
  // `sowSeedOwner` (set iff the game has seeds) so piece games — where `count:`
  // on a stack means something else (ActionSubStackMove) — keep the plain move.
  const moveCountNode = moveNamed.get("count");
  const moveCountFn =
    moveCountNode && env.sowSeedOwner !== undefined
      ? compileInt(moveCountNode, env)
      : undefined;
  const moveSeedOwner = env.sowSeedOwner ?? env.numPlayers + 1;
  const walkById = env.componentWalkById;

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
      for (const from of fromSites) {
        if (from < 0) continue;
        // A piece must exist at the source to be moved. An explicit `(from
        // <region>)` (e.g. `(handSite Mover)`) can name an empty site once a
        // hand is exhausted — skip it rather than letting ActionMove throw.
        // Use what-based occupancy (not the owner array) so a Shared/Neutral
        // hand — `(from (handSite Shared))`, whose pieces keep who==0 but what>0
        // (Shibumi neutral balls) — still counts as a valid, non-empty source.
        if (ctx.state.isEmptySite(from)) continue;
        const fctx = ctx.withFrame({ from, piece: mover });
        if (fromCond && !fromCond.eval(fctx)) continue;
        // Large piece (Cram/Domineering/Pentomino/L Game): the moved tile covers
        // a multi-cell footprint described by its turtle walk. Enumerate its
        // rotation states (Java FromTo.evalLargePiece: walk.length × 4) at every
        // destination in the to-region. Two sources are handled here:
        //  - from a hand/off-board site (Pentomino): every covered cell must be a
        //    legal (empty) destination.
        //  - from a board cell (L Game): the piece *relocates*, so its currently
        //    covered cells are vacated and may be re-covered. Java builds
        //    `newSitesTo = sitesTo ∪ currentLocs[1..]` and accepts a placement iff
        //    every covered cell is in it (or == from). We mirror that with a
        //    set of the to-region plus the piece's own current footprint.
        const movedWhat = ctx.state.whatAtSite(from);
        const walks = walkById?.[movedWhat];
        const lpBoard = ctx.board;
        if (walks && walks.length > 0) {
          const nbStates = walks.length * 4;
          const fromOnBoard = from < lpBoard.numSites;
          // The piece's currently covered cells (anchor first). Off-board sources
          // (a hand) have no footprint to vacate — just the single source cell.
          const oldState = fromOnBoard ? ctx.state.stateAtSite(from) : 0;
          const oldCells = fromOnBoard
            ? largePieceFootprint(lpBoard, from, oldState, walks) ?? [from]
            : [from];
          const toCandidates = [...toRegion.eval(fctx)];
          const allowed = new Set<number>(toCandidates);
          for (const c of oldCells) allowed.add(c);
          // Java evalLargePiece: newSitesTo = sitesTo ∪ currentLocs[1..]. The
          // relocating piece may re-anchor on any cell it currently covers, not
          // only the to-region — so iterate the full allowed set (to-region plus
          // the piece's own footprint), accepting a rotation iff every cell it
          // covers lands inside `allowed`.
          for (const to of allowed) {
            if (to < 0) continue;
            const sub = fctx.withFrame({ from, to, piece: mover });
            if (toCond && !toCond.eval(sub)) continue;
            for (let st = 0; st < nbStates; st += 1) {
              const cells = largePieceFootprint(lpBoard, to, st, walks);
              if (!cells) continue; // a step left the board ⇒ illegal here
              if (cells.some((c) => !allowed.has(c))) continue;
              // Skip the degenerate no-op: same anchor *and* same rotation.
              if (fromOnBoard && to === from && st === oldState) continue;
              out.push(
                new Move({
                  id: `move:${from}:${to}:${st}:${mover}`,
                  label: `Move ${from}→${to}`,
                  siteIndices: [to],
                  mover,
                  placedOwner: mover,
                  actions: [
                    new ActionMove({
                      from,
                      to,
                      state: st,
                      ...(cells.length > 1 ? { footprint: cells } : {}),
                      ...(fromOnBoard && oldCells.length > 1
                        ? { clearFootprint: oldCells }
                        : {}),
                    }),
                  ],
                  // @java Core/src/game/rules/play/moves/nonDecision/effect/FromTo.java:370
                  fromNonDecisionSite: from,
                  toNonDecisionSite: to,
                }),
              );
            }
          }
          continue;
        }
        for (const to of toRegion.eval(fctx)) {
          if (to < 0) continue;
          const sub = fctx.withFrame({ from, to, piece: mover });
          if (toCond && !toCond.eval(sub)) continue;
          // The `(apply …)` effect is evaluated against the *pre-move* state
          // (`sub`, where `to` still holds whatever it captures). A relocating
          // capture — backgammon's `HittingCapture`, `(fromTo (from (to)) (to
          // (mapEntry "Bar" Next)))` — must run *before* our piece lands on
          // `to`, else the main move overwrites the enemy and the prepended
          // relocation would carry our own piece off to the bar. Java emits
          // the hit as a separate Move action ahead of the decision move, so
          // prepend the effect's actions. A `(remove (to))` capturing the very
          // landing cell is subsumed by the move's overwrite and dropped.
          const captureActions: Action[] = [];
          if (effect && !isCopy) {
            for (const a of effect(sub)) {
              if (a.actionType() === "Remove" && a.to() === to) continue;
              captureActions.push(a);
            }
          }
          let relocation: Action[];
          if (isCopy) {
            relocation = [new ActionCopy(from, to)];
          } else if (moveCountFn) {
            // Count-game seed transfer (Java ActionMoveN, FromTo.java 348): move
            // N counters from→to as a *single* decision action so from()/to()/
            // count() report correctly (a pair of ActionAddCounts would leave
            // from()=ACTION_OFF and break move matching).
            const n = moveCountFn.eval(sub);
            relocation =
              n > 0
                ? [
                    new ActionMove({
                      from,
                      to,
                      count: n,
                      transferCount: true,
                      seedOwner: moveSeedOwner,
                  }),
                ]
              : [];
          } else {
            relocation = [new ActionMove({ from, to })];
          }
          const actions: Action[] = [...captureActions, ...relocation];
          out.push(
            new Move({
              id: `move:${from}:${to}:${mover}`,
              label: `Move ${from}→${to}`,
              siteIndices: [to],
              mover,
              placedOwner: mover,
              actions,
              // The relocating capture(s) are prepended, so the decision
              // action (our piece's move) sits after them — keep from()/to()
              // reading off it, matching Java's prologue-shift convention.
              decisionIndex: isCopy ? 0 : captureActions.length,
              // @java Core/src/game/rules/play/moves/nonDecision/effect/FromTo.java:508
              fromNonDecisionSite: from,
              toNonDecisionSite: to,
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
  // Java `game.rules.end.If.eval`: the end-rule `(if <test> <sub|result>
  // [<defaultResult>])` is NOT a ternary if/then/else. When <test> is FALSE it
  // returns null → the game CONTINUES (no result). When <test> is TRUE it
  // evaluates the 2nd arg: if that is itself a sub-`(if …)` it may yield no
  // result (its own test failed), in which case the rule falls through to the
  // 3rd-arg *default result*. The 3rd arg is therefore a default-when-the-test-
  // passes, never an else-when-the-test-fails. (e.g. Odd: `(if (is Full) (if
  // (is Odd …) (result P1 Win)) (result P2 Win))` = not-full → continue;
  // full+odd → P1; full+even → P2.)
  return {
    eval: (ctx) => {
      if (!cond.eval(ctx)) return undefined;
      const r = result(ctx);
      if (r) return r;
      return elseResult ? elseResult(ctx) : undefined;
    },
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
        if (!cond || cond.eval(sub)) {
          return result(sub);
        }
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
    // Java `game.rules.end.If.eval` (see compileIfResult): a nested end-`(if …)`
    // sub-condition returns null when its <test> is false (caller continues to
    // the next sub / default), and falls through to its own 3rd-arg default
    // result when the test passes but its 2nd-arg sub yields nothing — it is not
    // a ternary that fires the 3rd arg when the test is false.
    return (ctx) => {
      if (!cond.eval(ctx)) return undefined;
      const r = thenR(ctx);
      if (r) return r;
      return elseR ? elseR(ctx) : undefined;
    };
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

import "../ludemes/index.js";
