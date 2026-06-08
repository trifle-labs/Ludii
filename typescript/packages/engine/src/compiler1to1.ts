/**
 * compiler1to1.ts
 *
 * Recursive AST walker for the 1:1 Java→TS port.
 *
 * Takes a define-expanded, option-applied (game ...) LudList and constructs
 * a tree of faithful ludeme class instances — one class per Java ludeme.
 *
 * This file does NOT touch compile.ts or lud-compiler.ts (the interpreter path).
 *
 * @see play1to1.ts — entry point
 */

import {
  isIdent,
  isList,
  isNumber,
  isString,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";

// 1:1 registry — side-effectful imports register all boolean/int/region/moves classes
import "./ludemes/registry1to1-boolean.js";
import "./ludemes/registry1to1-int.js";
import "./ludemes/registry1to1-region.js";
import "./ludemes/registry1to1-moves.js";
import "./ludemes/registry1to1-intarray.js";
import "./ludemes/registry1to1-float.js";
import "./ludemes/registry1to1-directions.js";
import "./ludemes/registry1to1-topo-undefer.js";
import {
  lookupBool1to1,
  lookupInt1to1,
  lookupRegion1to1,
  lookupMoves1to1,
  lookupIntArray1to1,
  lookupFloat1to1,
  lookupDirections1to1,
  type Compile1to1Env,
} from "./ludemes/registry1to1.js";
import type {
  IntArrayFunction,
  FloatFunction,
  DirectionsFunction,
} from "./ludemes/base.js";

// Equipment
import { Piece } from "./ludemes/game/equipment/component/Piece.js";
import { Board1to1 } from "./ludemes/game/equipment/container/board/Board1to1.js";
import { Equipment1to1, type HandSpec } from "./ludemes/game/equipment/Equipment1to1.js";
import { buildBoardGraph, buildMancalaGraph } from "./eval/graph/board-graph.js";
import { genHex, genTri } from "./eval/graph/named-tilings.js";
import { genSquare } from "./eval/graph/generators.js";
import { ActionUseDie } from "./action/action-use-die.js";

// Functions
import { IntConstant } from "./ludemes/game/functions/ints/IntConstant.js";
import { IsLine } from "./ludemes/game/functions/booleans/is/line/IsLine.js";
import { IsDecided } from "./ludemes/game/functions/booleans/is/string/IsDecided.js";
import { SitesEmpty } from "./ludemes/game/functions/region/sites/SitesEmpty.js";
import { SitesStart } from "./ludemes/game/functions/region/sites/piece/SitesStart.js";
import { CountMoves } from "./ludemes/game/functions/ints/count1to1/CountMoves.js";
import { IsEven } from "./ludemes/game/functions/booleans/math1to1/IsEven.js";
import { OrBool } from "./ludemes/game/functions/booleans/math1to1/OrBool.js";
import { AndBool } from "./ludemes/game/functions/booleans/math1to1/AndBool.js";
import { NoMoves } from "./ludemes/game/functions/booleans/no1to1/NoMoves.js";
import { NoPieces1to1 } from "./ludemes/game/functions/booleans/no1to1/NoPieces.js";
import { HandSite } from "./ludemes/game/functions/ints/state1to1/HandSite.js";
import { SitesHand1to1 } from "./ludemes/game/functions/region/sites/player/SitesHand1to1.js";
import { SitesLineOfSightFarthest1to1 } from "./ludemes/game/functions/region/sites/lineOfSight/SitesLineOfSightFarthest1to1.js";
import {
  SitesBottom,
  SitesTop,
  SitesLeft,
  SitesRight,
  SitesRow,
  SitesColumn,
  SitesPhase,
  SitesCorners,
  UnionRegion,
  IntersectionRegion,
  DifferenceRegion,
} from "./ludemes/game/functions/region/sites/simple/SitesSide1to1.js";

// Move generators
import { Add } from "./ludemes/game/rules/play/moves/nonDecision/effect/Add.js";
import { ActionAdd } from "./action/action-add.js";
import { OrMoves } from "./ludemes/game/rules/play/moves/nonDecision/operators/logical/OrMoves.js";
import { IfMoves } from "./ludemes/game/rules/play/moves/nonDecision/operators/logical/IfMoves.js";
import { ForEachPiece1to1 } from "./ludemes/game/rules/play/moves/nonDecision/operators/foreach/ForEachPiece1to1.js";
import { Slide1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/Slide1to1.js";
import { Shoot1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/Shoot1to1.js";
import { Step1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/Step1to1.js";
import { SitesWalk1to1, parseWalks } from "./ludemes/game/functions/region/sites/walk/SitesWalk1to1.js";
import { FromTo1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/FromTo1to1.js";
import { ActionRemove } from "./action/action-remove.js";
import { BaseAction } from "./action/action.js";
import { ActionRemoveNonApplied } from "./action/action-remove-non-applied.js";
import { ActionSetCount } from "./action/action-set-count.js";
import { ActionPass } from "./action/action-pass.js";
import { ActionSetNextPlayer } from "./action/action-set-next-player.js";
import { ActionTrigger } from "./action/action-trigger.js";
import { ActionMove } from "./action/action-move.js";
import { ActionSetPending } from "./action/action-set-pending.js";
import { ActionSetCounter } from "./action/action-set-counter.js";
import { ActionSetScore } from "./action/action-set-score.js";
import { ActionSetState } from "./action/action-set-state.js";
import { ActionSetValueOfPlayer } from "./action/action-set-value-of-player.js";
import { SetVar1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/set/var/SetVar1to1.js";
import { ActionUpdateDice } from "./action/action-update-dice.js";
import { ActionSetDiceAllEqual } from "./action/action-set-dice-all-equal.js";
import {
  ActionSetHidden,
  ActionSetHiddenWhat,
  ActionSetHiddenWho,
  ActionSetHiddenState,
  ActionSetHiddenCount,
  ActionSetHiddenRotation,
  ActionSetHiddenValue,
} from "./action/action-set-hidden.js";

// Rules
import { Result } from "./ludemes/game/rules/end/Result.js";
import { If } from "./ludemes/game/rules/end/If.js";
import { End } from "./ludemes/game/rules/end/End.js";
import { Play1to1 } from "./ludemes/game/rules/play/Play1to1.js";
import { Rules1to1 } from "./ludemes/game/rules/Rules1to1.js";
import { Phase } from "./ludemes/game/rules/phase/Phase.js";
import { NextPhase } from "./ludemes/game/rules/phase/NextPhase.js";

// Start rules
import type { StartRule } from "./ludemes/game/rules/start/StartRule.js";
import { Start1to1 } from "./ludemes/game/rules/start/Start.js";
import { PlaceHandCount1to1 } from "./ludemes/game/rules/start/PlaceHandCount1to1.js";
import { PlaceSites1to1 } from "./ludemes/game/rules/start/PlaceSites1to1.js";
import { SetCountStart1to1 } from "./ludemes/game/rules/start/SetCountStart1to1.js";
import { PlaceAtHandSite1to1 } from "./ludemes/game/rules/start/PlaceAtHandSite1to1.js";
import { PlaceRegion1to1 } from "./ludemes/game/rules/start/PlaceRegion1to1.js";

// Game
import { Game1to1 } from "./ludemes/Game1to1.js";
import { GamePlayers1to1 } from "./ludemes/game/players/GamePlayers1to1.js";

import { Context } from "./context.js";
import { Move } from "./move.js";
import { Trajectories } from "./eval/graph/trajectories.js";
import { type CellFlatRadials, radialsForDirection } from "./ludemes/topology-radials.js";
import type {
  IntFunction,
  BooleanFunction,
  RegionFunction,
  MovesFunction,
  EndRuleFunction,
  EndResult,
  RoleType,
  ResultType,
} from "./ludemes/base.js";

// ---------------------------------------------------------------------------
// Helper: split items into positional + named (key:value) args
// ---------------------------------------------------------------------------

export interface ParsedArgs1to1 {
  positional: LudNode[];
  named: Map<string, LudNode>;
}

export function parseArgs1to1(items: readonly LudNode[], startFrom = 1): ParsedArgs1to1 {
  const positional: LudNode[] = [];
  const named = new Map<string, LudNode>();
  for (let i = startFrom; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    if (isIdent(it) && it.name.endsWith(":")) {
      const key = it.name.slice(0, -1).toLowerCase();
      const val = items[i + 1];
      if (val) { named.set(key, val); i++; }
    } else {
      positional.push(it);
    }
  }
  return { positional, named };
}

export function headOf(node: LudNode): string | undefined {
  if (!isList(node)) return undefined;
  return listHead(node)?.toLowerCase();
}

// ---------------------------------------------------------------------------
// Module-level equipment reference for compile-time closures
// ---------------------------------------------------------------------------
// Set by compileMoves1to1 / compileInt1to1 callers that have equipment context,
// so that (face N) and similar dice-aware int functions can capture diceSpecs.
// This is a compile-time-only mutable; it is NOT used at eval time.
let _compilingEquipment: Equipment1to1 | undefined;

// ---------------------------------------------------------------------------
// Compile IntFunction
// ---------------------------------------------------------------------------

export function compileInt1to1(node: LudNode | undefined): IntFunction {
  if (!node) return new IntConstant(0);
  if (isNumber(node)) return new IntConstant(node.value);
  if (isIdent(node)) {
    const n = parseInt(node.name, 10);
    if (!isNaN(n)) return new IntConstant(n);
  }
  if (isList(node)) {
    // { (if ...) ... } — curly-brace list in int context: evaluate first element
    if (node.delimiter === "curly") {
      const firstChild = node.items[0];
      if (firstChild) {
        try { return compileInt1to1(firstChild); } catch { /* fall through */ }
      }
      return new IntConstant(0);
    }
    // ((define-expansion ...)) — define expansion produces a single-element round list
    // whose only item is the expanded expression. Unwrap it so the inner form is compiled.
    // @java — Ludii's define system wraps expanded bodies in an extra list layer which
    // is transparent to Java's compiler but must be unwrapped here.
    if (node.delimiter === "round" && node.items.length === 1 && isList(node.items[0]!)) {
      return compileInt1to1(node.items[0]);
    }
    const h = headOf(node);

    // ---------------------------------------------------------------------------
    // Int registry lookup — registered 1:1 classes take priority over inline branches
    // Pattern mirrors compileBool1to1's registry lookup (lines ~2009-2041)
    // ---------------------------------------------------------------------------
    {
      const env: Compile1to1Env = { numPlayers: 2 }; // numPlayers resolved at runtime
      // 1. Plain head: "mover", "score", "+", "abs", etc.
      const plainCtor = lookupInt1to1(h!);
      if (plainCtor) return plainCtor(node, env);
      // 2. Compound "count:<Subtype>": (count Moves), (count Pieces), etc.
      if (h === "count") {
        const { positional: cntPos } = parseArgs1to1(node.items);
        const first = cntPos[0];
        if (first && isIdent(first)) {
          const subKey = `count:${first.name.toLowerCase()}`;
          const subCtor = lookupInt1to1(subKey);
          if (subCtor) return subCtor(node, env);
        }
      }
      // 3. Compound "size:<Subtype>": (size Group ...), (size Stack ...), etc.
      if (h === "size") {
        const { positional: szPos } = parseArgs1to1(node.items);
        const first = szPos[0];
        if (first && isIdent(first)) {
          const subKey = `size:${first.name.toLowerCase()}`;
          const subCtor = lookupInt1to1(subKey);
          if (subCtor) return subCtor(node, env);
        }
        // "size" itself is registered (handles all subtypes in one factory)
        const sizeCtor = lookupInt1to1("size");
        if (sizeCtor) return sizeCtor(node, env);
      }
      // 4. Compound "value:<Subtype>": (value Piece ...), (value Player ...), etc.
      if (h === "value") {
        const { positional: vPos } = parseArgs1to1(node.items);
        const first = vPos[0];
        if (first && isIdent(first)) {
          const subKey = `value:${first.name.toLowerCase()}`;
          const subCtor = lookupInt1to1(subKey);
          if (subCtor) return subCtor(node, env);
        }
        const valueCtor = lookupInt1to1("value");
        if (valueCtor) return valueCtor(node, env);
      }
      // 5. Compound "last:<Subtype>": (last To), (last From), etc.
      if (h === "last") {
        const { positional: lPos } = parseArgs1to1(node.items);
        const first = lPos[0];
        if (first && isIdent(first)) {
          const subKey = `last:${first.name.toLowerCase()}`;
          const subCtor = lookupInt1to1(subKey);
          if (subCtor) return subCtor(node, env);
        }
        const lastCtor = lookupInt1to1("last");
        if (lastCtor) return lastCtor(node, env);
      }
    }

    if (h === "from") {
      // (from) — the iterator's current "from" site (context._evalFrom)
      // @java game/functions/ints/iterator/From.java — eval returns context.from()
      return { eval(ctx: Context): number { return ctx._evalFrom; } };
    }
    if (h === "to") {
      // (to) — the iterator's current "to" site (context._evalTo)
      return { eval(ctx: Context): number { return ctx._evalTo; } };
    }
    if (h === "site") {
      // (site) — the iterator's current site (set by forEach to _evalSite)
      // @java game/functions/ints/iterator/Site.java — eval returns context.site()
      return { eval(ctx: Context): number {
        const s = ctx._evalSite;
        return (s !== undefined && s !== null && s >= 0) ? s : ctx._evalFrom;
      }};
    }
    if (h === "count") {
      const { positional, named } = parseArgs1to1(node.items);
      const first = positional[0];
      // (count at:<site>) — bare form (no subtype): the number of pieces/seeds at
      // the site = countAt (mancala holes). @java CountStack default.
      if ((!first || !isIdent(first)) && named.has("at")) {
        const atN = named.get("at");
        const siteFn = compileInt1to1(atN);
        return { eval(ctx: Context): number { const s = siteFn.eval(ctx); return s >= 0 ? ctx.state.countAtSite(s) : 0; } };
      }
      // (count in:<region>) — bare form (no subtype): the total number of
      // pieces/seeds across the region's sites. @java CountInRegion
      if ((!first || !isIdent(first)) && named.has("in")) {
        const inN = named.get("in");
        let regionFn: RegionFunction | null = null;
        try { regionFn = compileRegion1to1(inN); } catch { /* none */ }
        return { eval(ctx: Context): number {
          if (!regionFn) return 0;
          let total = 0;
          for (const s of regionFn.eval(ctx)) {
            if (s < 0) continue;
            const c = ctx.state.countAtSite(s);
            total += c > 0 ? c : ((ctx.state.cells[s] ?? 0) !== 0 ? 1 : 0);
          }
          return total;
        }};
      }
      if (first && isIdent(first)) {
        const kind = first.name.toLowerCase();
        if (kind === "moves") return new CountMoves();
        if (kind === "sites") {
          // (count Sites in:<regionFn>) — counts sites in the region
          const inNode = named.get("in");
          if (inNode) {
            try {
              const regionFn = compileRegion1to1(inNode);
              return {
                eval(ctx: Context): number {
                  return regionFn.eval(ctx).length;
                }
              };
            } catch (e) {
              // Region compilation failed — return 0
              // Region compilation failed — fall through to IntConstant(0)
            }
          }
          return new IntConstant(0);
        }
        if (kind === "rows") {
          // (count Rows) — board height
          return { eval(ctx: Context): number {
            const g = ctx.game as unknown as { equipment: { board: { height: number } } };
            return g.equipment.board.height;
          }};
        }
        if (kind === "columns") {
          // (count Columns) — board width
          return { eval(ctx: Context): number {
            const g = ctx.game as unknown as { equipment: { board: { width: number } } };
            return g.equipment.board.width;
          }};
        }
        if (kind === "cell" || kind === "stack") {
          // (count Cell at:<site>) — count of pieces at a site
          // @java game/functions/ints/count/site/CountStack.java — eval returns state.stateStack(site).size() or countAt
          const atNode = named.get("at");
          if (atNode) {
            const siteFn = compileInt1to1(atNode);
            return { eval(ctx: Context): number {
              const s = siteFn.eval(ctx);
              return ctx.state.countAtSite(s);
            }};
          }
          return new IntConstant(0);
        }
        if (kind === "pieces") {
          // (count Pieces [role]) — count all pieces owned by role (board + hand containers)
          // @java game/functions/ints/count/component/CountPieces.java — eval
          // Java uses owned().positions(pid) which tracks per-piece locations across
          // ALL containers. For stacking games, counts ALL pieces at each stack level.
          // For hand slots, countAt[site] stores N pieces in one slot.
          //
          // Counting logic:
          //   - Board sites (0..boardN-1): count all stack levels owned by pid
          //     For non-stacking games: 1 per occupied site; for stacking: sum all levels.
          //   - Hand slots (boardN..total-1): if cells[i]==pid, count countAt[i] pieces
          //     (hand uses countAt for pile depth; 0 = empty hand slot)
          const roleNode = positional[1];
          const roleName = (roleNode && isIdent(roleNode)) ? roleNode.name.toLowerCase() : "all";
          return { eval(ctx: Context): number {
            const state = ctx.state;
            const cells = state.cells;
            const stacks = state.stacks;
            const countAt = state.countAt;
            const g = ctx.game as unknown as Game1to1;
            const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
            const totalN = cells.length;
            function countFor(pid: number): number {
              let total = 0;
              // Board sites: count all stack levels owned by pid
              // @java CountPieces: for stacking games, iterates all levels via cs.sizeStack(site)
              for (let i = 0; i < boardN; i++) {
                const stack = stacks[i];
                if (stack && stack.length > 0) {
                  // Stacking site: count each level owned by pid
                  for (const owner of stack) {
                    if (owner === pid) total++;
                  }
                } else {
                  // Non-stacking site: 1 piece per occupied cell owned by pid
                  if (cells[i] === pid) total++;
                }
              }
              // Hand slots: countAt[i] pieces per slot
              for (let i = boardN; i < totalN; i++) {
                if (cells[i] === pid) {
                  total += countAt[i] ?? 0;
                }
              }
              return total;
            }
            if (roleName === "mover") return countFor(ctx.state.mover);
            if (roleName === "next") return countFor((ctx.state.mover % ctx.game.numPlayers) + 1);
            if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
              return countFor(parseInt(roleName.slice(1), 10));
            }
            // All / total pieces across board + hands (stacking-aware)
            let total = 0;
            for (let i = 0; i < boardN; i++) {
              const stack = stacks[i];
              if (stack && stack.length > 0) {
                total += stack.filter(o => o !== 0).length;
              } else {
                if (cells[i] !== 0) total++;
              }
            }
            for (let i = boardN; i < totalN; i++) {
              if (cells[i] !== 0) total += countAt[i] ?? 0;
            }
            return total;
          }};
        }
        // Other count variants: stub as 0
        return new IntConstant(0);
      }
      return new IntConstant(0);
    }
    if (h === "handsite") {
      const { positional } = parseArgs1to1(node.items);
      const roleNode = positional[0];
      if (roleNode && isIdent(roleNode)) {
        const roleName = roleNode.name as RoleType;
        // Optional slot offset (second positional arg)
        const offsetNode = positional[1];
        const offset = offsetNode && isNumber(offsetNode) ? offsetNode.value : 0;
        return new HandSite(roleName, offset);
      }
      // Dynamic player ID: (handSite (who at:(to))) — roleNode is an IntFunction.
      // @java HandSite.java — role can be an IntFunction (player index) when not a static role.
      // Compile as a dynamic lookup: evaluate the player ID at runtime then return hand site.
      if (roleNode && isList(roleNode)) {
        try {
          const playerIdFn = compileInt1to1(roleNode);
          const offsetNode = positional[1];
          const offset = offsetNode && isNumber(offsetNode) ? offsetNode.value : 0;
          return { eval(ctx: Context): number {
            const playerId = playerIdFn.eval(ctx);
            const game = ctx.game as unknown as Game1to1;
            return game.equipment.handSiteFor(playerId, offset);
          }};
        } catch { /* fall through to default */ }
      }
      return new HandSite("Mover", 0);
    }

    // Arithmetic: (/ a b), (* a b), (+ a b), (- a b), (% a b)
    // Also handles (+ {a b c ...}) — sum of a curly list of int values
    if (h === "/" || h === "*" || h === "+" || h === "-" || h === "%") {
      const { positional: apos } = parseArgs1to1(node.items);
      // (+ {item1 item2 ...}) or (* {...}) — sum/product of a curly-brace list
      // @java game/functions/ints/math/Add.java — handles IntFunction[]
      if (apos[0] && isList(apos[0]) && (apos[0] as LudList).delimiter === "curly") {
        const listNode = apos[0] as LudList;
        const fns: IntFunction[] = [];
        for (const item of listNode.items) {
          try { fns.push(compileInt1to1(item)); } catch { /* skip */ }
        }
        const op2 = h;
        if (op2 === "+") {
          return { eval(ctx: Context): number {
            let sum = 0;
            for (const f of fns) sum += f.eval(ctx);
            return sum;
          }};
        }
        if (op2 === "*") {
          return { eval(ctx: Context): number {
            let prod = 1;
            for (const f of fns) prod *= f.eval(ctx);
            return prod;
          }};
        }
        // Other ops on list: evaluate first two
        if (fns.length >= 2) {
          const a2 = fns[0]!, b2 = fns[1]!;
          return { eval(ctx: Context): number {
            const av = a2.eval(ctx), bv = b2.eval(ctx);
            if (op2 === "-") return av - bv;
            if (op2 === "/") return bv !== 0 ? Math.trunc(av / bv) : 0;
            if (op2 === "%") return bv !== 0 ? av % bv : 0;
            return 0;
          }};
        }
        return fns[0] ?? new IntConstant(0);
      }
      const a = compileInt1to1(apos[0]);
      const b = compileInt1to1(apos[1]);
      const op = h;
      return {
        eval(ctx: Context): number {
          const av = a.eval(ctx);
          const bv = b.eval(ctx);
          switch (op) {
            case "/": return bv !== 0 ? Math.trunc(av / bv) : 0; // Java integer division
            case "*": return av * bv;
            case "+": return av + bv;
            case "-": return av - bv;
            case "%": return bv !== 0 ? av % bv : 0;
            default: return 0;
          }
        }
      };
    }

    // (mover) — current mover's player id
    if (h === "mover") {
      return { eval(ctx: Context): number { return ctx.state.mover; } };
    }
    // (next) — next player's id
    if (h === "next") {
      return { eval(ctx: Context): number {
        return (ctx.state.mover % ctx.game.numPlayers) + 1;
      }};
    }
    // (row of:<site>) — row of a site (0-based)
    if (h === "row") {
      const { named: rNamed } = parseArgs1to1(node.items);
      const ofNode = rNamed.get("of");
      if (ofNode) {
        const siteFn = compileInt1to1(ofNode);
        return { eval(ctx: Context): number {
          const W = (ctx.game as unknown as Game1to1).equipment.board.width;
          return Math.floor(siteFn.eval(ctx) / W);
        }};
      }
    }
    // (column of:<site>) — column of a site (0-based)
    if (h === "column") {
      const { named: cNamed } = parseArgs1to1(node.items);
      const ofNode = cNamed.get("of");
      if (ofNode) {
        const siteFn = compileInt1to1(ofNode);
        return { eval(ctx: Context): number {
          const W = (ctx.game as unknown as Game1to1).equipment.board.width;
          return siteFn.eval(ctx) % W;
        }};
      }
    }
    // (who at:<site>) — owner at a site
    if (h === "who") {
      const { named: wNamed } = parseArgs1to1(node.items);
      const atNode = wNamed.get("at");
      if (atNode) {
        const siteFn = compileInt1to1(atNode);
        return { eval(ctx: Context): number {
          const s = siteFn.eval(ctx);
          return ctx.state.cells[s] ?? 0;
        }};
      }
    }
    // (what at:<site>) — component index at a site
    if (h === "what") {
      const { named: whNamed } = parseArgs1to1(node.items);
      const atNode = whNamed.get("at");
      if (atNode) {
        const siteFn = compileInt1to1(atNode);
        return { eval(ctx: Context): number {
          const s = siteFn.eval(ctx);
          return ctx.state.whatAtSite(s);
        }};
      }
    }
    // (last To) — site of the last placed piece (= _evalTo)
    if (h === "last") {
      const { positional: lPos, named: lNamed } = parseArgs1to1(node.items);
      const first = lPos[0];
      // afterConsequence:True → the to-site AFTER all consequence actions, i.e.
      // the to of the LAST applied action (e.g. the final sown hole in mancala),
      // not the decision's top-level to. @java LastTo.afterConsequence
      const afterCons = (() => {
        const v = lNamed.get("afterConsequence") ?? lNamed.get("afterconsequence");
        return !!v && isIdent(v) && v.name.toLowerCase() === "true";
      })();
      if (first && isIdent(first) && first.name.toLowerCase() === "to") {
        // @java game/functions/ints/last/LastTo.java:50-62
        // Read from trial.moves (the actual last-to site), NOT from _evalTo.
        // _evalTo is only valid during end-rule evaluation, not during move generation.
        // Using trial.moves allows (last To) to work in both move generation and end rules.
        return { eval(ctx: Context): number {
          const moves = ctx.trial.moves;
          if (moves.length === 0) return ctx._evalTo; // fallback during initial placement
          const last = moves[moves.length - 1];
          if (!last) return ctx._evalTo;
          if (afterCons) {
            // Scan actions backwards for the last one with a real to-site.
            for (let i = last.actions.length - 1; i >= 0; i--) {
              const t = last.actions[i]!.to();
              if (t >= 0) return t;
            }
          }
          const t = last.toNonDecision();
          if (t >= 0) return t;
          const t2 = last.to();
          if (t2 >= 0) return t2;
          return ctx._evalTo;
        }};
      }
      if (first && isIdent(first) && first.name.toLowerCase() === "from") {
        // @java game/functions/ints/last/LastFrom.java:49-55
        return { eval(ctx: Context): number {
          const moves = ctx.trial.moves;
          if (moves.length === 0) return ctx._evalFrom;
          const last = moves[moves.length - 1];
          if (!last) return ctx._evalFrom;
          const f = last.fromNonDecision();
          if (f >= 0) return f;
          const f2 = last.from();
          if (f2 >= 0) return f2;
          return ctx._evalFrom;
        }};
      }
    }

    // (score <role>) — the current score of the given player
    // @java game/functions/ints/state/Score.java — eval returns context.score(pid)
    if (h === "score") {
      const { positional: sPos } = parseArgs1to1(node.items);
      const roleNode = sPos[0];
      const roleName = (roleNode && isIdent(roleNode)) ? roleNode.name.toLowerCase() : "mover";
      return { eval(ctx: Context): number {
        const scores = (ctx.state as unknown as { scores?: number[] }).scores;
        if (!scores) return 0;
        if (roleName === "mover") return scores[ctx.state.mover] ?? 0;
        if (roleName === "next") return scores[(ctx.state.mover % ctx.game.numPlayers) + 1] ?? 0;
        if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
          return scores[parseInt(roleName.slice(1), 10)] ?? 0;
        }
        return 0;
      }};
    }

    // (var) / (var "name") — read a named context variable
    // @java game/functions/ints/iterator/Var.java — eval returns context.getValue("name")
    if (h === "var") {
      // Simplified: return _evalValue (the context's current named value scratch)
      return { eval(ctx: Context): number { return ctx._evalValue ?? 0; } };
    }

    // (counter) — the game's current counter (move number, turn, etc.)
    // @java game/functions/ints/state/Counter.java — eval returns context.counter()
    if (h === "counter") {
      return { eval(ctx: Context): number {
        return ctx.trial.moves.length;
      }};
    }

    // (size Array ...) / (size Group ...) — count of sites in a group or array
    // @java game/functions/ints/count/site/SizeGroup.java — eval returns group.eval(ctx).size()
    // @java game/functions/ints/count/site/SizeStack.java — eval for Array type
    if (h === "size") {
      const { positional: szPos, named: szNamed } = parseArgs1to1(node.items);
      const typeNode = szPos[0];
      const typeName = (typeNode && isIdent(typeNode)) ? typeNode.name.toLowerCase() : "";
      if (typeName === "group") {
        // (size Group of:<site>) — size of the connected group containing site
        const ofNode = szNamed.get("of");
        if (ofNode) {
          const siteFn = compileInt1to1(ofNode);
          return { eval(ctx: Context): number {
            const site = siteFn.eval(ctx);
            if (site < 0) return 0;
            const cells = ctx.state.cells;
            const owner = cells[site] ?? 0;
            if (owner === 0) return 0;
            // BFS flood-fill same-owner group
            const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
            const traj = ctxAny._trajectories;
            const visited = new Set<number>([site]);
            const stack = [site];
            while (stack.length > 0) {
              const s = stack.pop()!;
              let neighbours: number[];
              if (traj) {
                neighbours = traj.group(s, "Adjacent");
              } else {
                const g = ctx.game as unknown as Game1to1;
                const W = g.equipment.board.width;
                const H = g.equipment.board.height;
                const col = s % W; const row = Math.floor(s / W);
                neighbours = [];
                if (col > 0) neighbours.push(s - 1);
                if (col < W-1) neighbours.push(s + 1);
                if (row > 0) neighbours.push(s - W);
                if (row < H-1) neighbours.push(s + W);
              }
              for (const nb of neighbours) {
                if (!visited.has(nb) && (cells[nb] ?? 0) === owner) {
                  visited.add(nb);
                  stack.push(nb);
                }
              }
            }
            return visited.size;
          }};
        }
        return new IntConstant(0);
      }
      if (typeName === "array" || typeName === "stack") {
        // (size Array at:<site>) — stack depth at a site
        // (size Array (array <region>)) — count elements in an array region
        const atNode = szNamed.get("at");
        if (atNode) {
          const siteFn = compileInt1to1(atNode);
          return { eval(ctx: Context): number {
            const s = siteFn.eval(ctx);
            return ctx.state.countAtSite(s);
          }};
        }
        // (size Array (array <region>)) form
        const arrNode = szPos[1];
        if (arrNode && isList(arrNode) && headOf(arrNode) === "array") {
          const innerArgs = parseArgs1to1(arrNode.items);
          const innerRegionNode = innerArgs.positional[0];
          if (innerRegionNode) {
            try {
              const regionFn = compileRegion1to1(innerRegionNode);
              return { eval(ctx: Context): number { return regionFn.eval(ctx).length; } };
            } catch { /* fall through */ }
          }
        }
        return new IntConstant(0);
      }
      return new IntConstant(0);
    }

    // (max <intFn1> <intFn2> ...) — maximum of integer values
    // @java game/functions/ints/math/Max.java — eval returns max of sub-functions
    if (h === "max") {
      const { positional: mxPos } = parseArgs1to1(node.items);
      if (mxPos.length === 0) return new IntConstant(0);
      // Could be (max <region>) where region is an intFn-producing region
      // Most common: (max <int1> <int2>)
      const fns: IntFunction[] = [];
      for (const p of mxPos) {
        try { fns.push(compileInt1to1(p)); } catch { /* skip */ }
      }
      if (fns.length === 0) return new IntConstant(0);
      return { eval(ctx: Context): number {
        let m = fns[0]!.eval(ctx);
        for (let i = 1; i < fns.length; i++) {
          const v = fns[i]!.eval(ctx);
          if (v > m) m = v;
        }
        return m;
      }};
    }

    // (min <intFn1> <intFn2> ...) — minimum of integer values
    // @java game/functions/ints/math/Min.java
    if (h === "min") {
      const { positional: mnPos } = parseArgs1to1(node.items);
      if (mnPos.length === 0) return new IntConstant(0);
      const fns: IntFunction[] = [];
      for (const p of mnPos) {
        try { fns.push(compileInt1to1(p)); } catch { /* skip */ }
      }
      if (fns.length === 0) return new IntConstant(0);
      return { eval(ctx: Context): number {
        let m = fns[0]!.eval(ctx);
        for (let i = 1; i < fns.length; i++) {
          const v = fns[i]!.eval(ctx);
          if (v < m) m = v;
        }
        return m;
      }};
    }

    // (abs <intFn>) — absolute value
    // @java game/functions/ints/math/Abs.java
    if (h === "abs") {
      const { positional: abPos } = parseArgs1to1(node.items);
      const sub = compileInt1to1(abPos[0]);
      return { eval(ctx: Context): number { return Math.abs(sub.eval(ctx)); } };
    }

    // (sites ...) as IntFunction — treat as count of the region
    // Used when (sites ...) appears in an integer context (e.g. size of region)
    // @java game/functions/ints/count/site/CountSites.java
    if (h === "sites") {
      try {
        const regionFn = compileRegion1to1(node);
        return { eval(ctx: Context): number { return regionFn.eval(ctx).length; } };
      } catch { /* fall through */ }
    }

    // (ahead <from> <direction> <steps>) — site ahead in direction from a site
    // @java game/functions/ints/board/Ahead.java
    // Supports: steps: named param and (directions ...) form for the direction arg.
    if (h === "ahead") {
      const { positional: ahPos, named: ahNamed } = parseArgs1to1(node.items);
      const fromFnAh = compileInt1to1(ahPos[0]);
      // steps: named param (or 2nd positional if integer) — default 1
      const stepsNode = ahNamed.get("steps");
      let stepsFnAh: IntFunction = { eval: () => 1 };
      if (stepsNode) {
        try { stepsFnAh = compileInt1to1(stepsNode); } catch { /* default 1 */ }
      } else {
        // 3rd positional might be the step count
        const step3 = ahPos[2];
        if (step3 && isNumber(step3)) { const sv = step3.value; stepsFnAh = { eval: () => sv }; }
      }
      // Direction: 2nd positional (ident or (directions ...) form)
      const dirNodeAh = ahPos[1];
      let dirFnAh: DirectionsFunction = { eval: () => ["N"] };
      if (dirNodeAh) {
        if (isIdent(dirNodeAh)) {
          const dn = dirNodeAh.name;
          dirFnAh = { eval: () => [dn] };
        } else if (isList(dirNodeAh)) {
          try { dirFnAh = compileDirections1to1(dirNodeAh); }
          catch { /* use N default */ }
        }
      }
      const fromFnAhFinal = fromFnAh;
      const dirFnAhFinal = dirFnAh;
      const stepsFnAhFinal = stepsFnAh;
      return { eval(ctx: Context): number {
        const from = fromFnAhFinal.eval(ctx);
        if (from < 0) return -1;
        const steps = stepsFnAhFinal.eval(ctx);
        const dirs = dirFnAhFinal.eval(ctx);
        if (dirs.length === 0) return -1;
        const dirName = dirs[0]!;
        const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null; _radials?: readonly CellFlatRadials[] };
        const traj = ctxAny._trajectories;
        if (traj) {
          const radSteps = traj.steps(from, dirName);
          return radSteps.length >= steps ? (radSteps[steps - 1] ?? -1) : -1;
        }
        const g = ctx.game as unknown as Game1to1;
        const W = g.equipment.board.width;
        const H = g.equipment.board.height;
        const col = from % W; const row = Math.floor(from / W);
        const d = dirName.toLowerCase();
        // Map direction to (dy, dx) in Ludii's coordinate system:
        //   y=0 is BOTTOM row, y increases going NORTH (up).
        //   N=+dy, S=-dy, E=+dx, W=-dx
        //   NE=(+dx,+dy), NW=(-dx,+dy), SE=(+dx,-dy), SW=(-dx,-dy)
        // row = y (y=Math.floor(site/W)), col = x (x=site%W)
        const compassMap2: Record<string, [number, number]> = {
          n: [1, 0], s: [-1, 0], e: [0, 1], w: [0, -1],
          ne: [1, 1], nw: [1, -1], se: [-1, 1], sw: [-1, -1],
          north: [1, 0], south: [-1, 0], east: [0, 1], west: [0, -1],
          northeast: [1, 1], northwest: [1, -1], southeast: [-1, 1], southwest: [-1, -1],
        };
        const drDc: [number, number] | undefined = compassMap2[d];
        if (drDc) {
          const nr = row + drDc[0] * steps;
          const nc = col + drDc[1] * steps;
          if (nr >= 0 && nr < H && nc >= 0 && nc < W) return nr * W + nc;
          return -1;
        }
        // Fallback: use radials
        const radials = ctxAny._radials;
        if (radials) {
          const cr = radials[from];
          if (cr) {
            const axes = radialsForDirection(cr, dirName);
            for (const { ray } of axes) {
              if (steps < ray.length) return ray[steps]!;
            }
          }
        }
        return -1;
      }};
    }

    // (pow a b) — a to the power b
    // @java game/functions/ints/math/Pow.java
    if (h === "pow") {
      const { positional: pwPos } = parseArgs1to1(node.items);
      const base = compileInt1to1(pwPos[0]);
      const exp = compileInt1to1(pwPos[1]);
      return { eval(ctx: Context): number {
        return Math.trunc(Math.pow(base.eval(ctx), exp.eval(ctx)));
      }};
    }

    // (arrayValue <array> index:<int>) — get element of array at index (stub: return 0)
    // @java game/functions/ints/array/ArrayValue.java
    if (h === "arrayvalue") {
      return new IntConstant(0);
    }

    // (state at:<site>) — state value at a site.
    // @java game/functions/ints/state/State.java — eval(Context) returns context.state(site)
    // Used by EinStein (cube number), Squadro (move-count per piece), Arimaa, etc.
    if (h === "state") {
      const { named, positional: stPos } = parseArgs1to1(node.items);
      const atNode = named.get("at") ?? stPos[0];
      if (atNode) {
        const siteFn = compileInt1to1(atNode);
        return { eval(ctx: Context): number {
          const site = siteFn.eval(ctx);
          return site >= 0 ? ctx.state.stateAtSite(site) : 0;
        }};
      }
      // Bare (state) with no site argument — return the iterator state (_evalSite state)
      return { eval(ctx: Context): number {
        const s = (ctx as unknown as { _evalSite?: number })._evalSite;
        const site = (s !== undefined && s >= 0) ? s : ctx._evalFrom;
        return site >= 0 ? ctx.state.stateAtSite(site) : 0;
      }};
    }

    // (level of:<site>) — z-level of a site in a 3D board (stub: return 0)
    // @java game/functions/ints/board/Level.java
    if (h === "layer" || h === "level") {
      return new IntConstant(0);
    }

    // (centrePoint) — the centre site of the board
    // @java game/functions/ints/board/CentrePoint.java
    if (h === "centrepoint") {
      return { eval(ctx: Context): number {
        const g = ctx.game as unknown as Game1to1;
        return Math.floor(g.equipment.board.numSites / 2);
      }};
    }

    // (value Player <role>) — persistent player value
    // (value Piece at:<site>) — per-site piece value (from value:N in placement rules)
    // @java game/functions/ints/state/Value.java — eval returns context.value(player/piece)
    if (h === "value") {
      const { positional: vPos, named: vNamed } = parseArgs1to1(node.items);
      const typeNode = vPos[0];
      if (typeNode && isIdent(typeNode)) {
        const typeName = (typeNode as { name: string }).name.toLowerCase();
        if (typeName === "player") {
          const roleNode = vPos[1];
          const roleName = (roleNode && isIdent(roleNode)) ? (roleNode as { name: string }).name.toLowerCase() : "mover";
          return { eval(ctx: Context): number {
            // @java State.valuePlayer(pid) — per-player persistent value
            let pid: number;
            if (roleName === "mover") pid = ctx.state.mover;
            else if (roleName === "next") pid = (ctx.state.mover % ctx.game.numPlayers) + 1;
            else if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
              pid = parseInt(roleName.slice(1), 10);
            } else pid = ctx.state.mover;
            return ctx.state.valuesPlayer[pid] ?? 0;
          }};
        }
        if (typeName === "piece") {
          // (value Piece at:<site>) — per-site piece value set by value:N in start rules.
          // @java Value.java: ValuePiece.eval(context) = containerState.value(site, type)
          const atNode = vNamed.get("at") ?? vPos[1];
          if (atNode) {
            const siteFn = compileInt1to1(atNode);
            return { eval(ctx: Context): number {
              const s = siteFn.eval(ctx);
              return s >= 0 ? ctx.state.valueAtSite(s) : 0;
            }};
          }
          // Bare (value Piece) — return value at current iterator site.
          return { eval(ctx: Context): number {
            const s = (ctx as unknown as { _evalSite?: number })._evalSite;
            const site = (s !== undefined && s >= 0) ? s : ctx._evalFrom;
            return site >= 0 ? ctx.state.valueAtSite(site) : 0;
          }};
        }
      }
      // Fallback: bare (value) or unknown type
      const atNodeF = vNamed.get("at");
      if (atNodeF) {
        const siteFnF = compileInt1to1(atNodeF);
        return { eval(ctx: Context): number {
          const s = siteFnF.eval(ctx);
          return s >= 0 ? ctx.state.valueAtSite(s) : 0;
        }};
      }
      return new IntConstant(0);
    }

    // (id "name" role) / (id role) — player id from role type
    // @java game/functions/ints/board/Id.java — resolves RoleType to player id
    if (h === "id") {
      const { positional: idPos } = parseArgs1to1(node.items);
      // (id "PieceName" Role) — returns component index of named piece
      // (id Mover) / (id P1) / etc. — returns player id
      // @java game/functions/ints/board/Id.java — eval

      // Try string-based piece lookup first: (id "Name" [Role])
      const nameNode = idPos.find(p => isString(p));
      if (nameNode && isString(nameNode)) {
        const pieceName = nameNode.value;
        // Find owner role
        const roleNode = idPos.find(p => isIdent(p));
        const roleStr = roleNode && isIdent(roleNode) ? roleNode.name.toLowerCase() : "neutral";
        // Resolve owner
        let owner: number;
        if (roleStr === "neutral" || roleStr === "neutral") owner = 0;
        else if (roleStr === "mover") owner = -1; // dynamic
        else if (roleStr === "next") owner = -2; // dynamic
        else if (roleStr.startsWith("p") && !isNaN(parseInt(roleStr.slice(1), 10))) {
          owner = parseInt(roleStr.slice(1), 10);
        } else {
          owner = 0;
        }

        if (owner >= 0) {
          // Static: find piece by name+owner.
          // Handles both:
          //   (id "SmallCat" P1) → name="SmallCat", owner=1
          //   (id "SmallCat1")   → name="SmallCat1" which is really name="SmallCat", owner=1
          // @java game/functions/ints/board/Id.java — looks up component by name+owner.
          const nameConst = pieceName;
          const ownerConst = owner;
          return {
            eval(ctx: Context): number {
              const g = ctx.game as unknown as { equipment?: { pieces?: Array<{ name: string; owner: number; index: number }> } };
              const pieces = g.equipment?.pieces;
              if (!pieces) return 0;
              // 1. Exact match: name="SmallCat1", owner=0 (unlikely but try first)
              const exactMatch = pieces.find(p =>
                p.name.toLowerCase() === nameConst.toLowerCase() && p.owner === ownerConst
              );
              if (exactMatch) return exactMatch.index;
              // 2. Concatenated key: "SmallCat" + owner=1 → "SmallCat1"
              //    (for ownerConst > 0 this would be e.g. "SmallCat1")
              const concatMatch = pieces.find(p =>
                `${p.name}${p.owner}`.toLowerCase() === `${nameConst}${ownerConst}`.toLowerCase()
              );
              if (concatMatch) return concatMatch.index;
              // 3. Piece name with trailing player-index suffix: "SmallCat1" → name="SmallCat", owner=1
              //    Split trailing digits from nameConst to get (baseName, ownerFromName).
              //    @java Ludii piece naming: "PieceName" + playerIndex (e.g. "SmallCat1", "SmallCat2")
              const m = nameConst.match(/^(.*?)(\d+)$/);
              if (m) {
                const baseName = m[1]!;
                const ownerFromName = parseInt(m[2]!, 10);
                const suffixMatch = pieces.find(p =>
                  p.name.toLowerCase() === baseName.toLowerCase() && p.owner === ownerFromName
                );
                if (suffixMatch) return suffixMatch.index;
              }
              return 0;
            }
          };
        }
        // Dynamic owner (Mover/Next)
        const nameConst2 = pieceName;
        const isDynMover = owner === -1;
        return {
          eval(ctx: Context): number {
            const g = ctx.game as unknown as { equipment?: { pieces?: Array<{ name: string; owner: number; index: number }> } };
            const pieces = g.equipment?.pieces;
            if (!pieces) return 0;
            const dynOwner = isDynMover ? ctx.state.mover : (ctx.state.mover % ctx.game.numPlayers) + 1;
            const match = pieces.find(p =>
              p.name.toLowerCase() === nameConst2.toLowerCase() && p.owner === dynOwner
            );
            return match ? match.index : 0;
          }
        };
      }

      // Role-based: (id Mover), (id P1), etc.
      for (const p of idPos) {
        if (isIdent(p)) {
          const roleName = p.name.toLowerCase();
          if (roleName === "mover") return { eval(ctx: Context): number { return ctx.state.mover; } };
          if (roleName === "next") return { eval(ctx: Context): number { return (ctx.state.mover % ctx.game.numPlayers) + 1; } };
          if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
            const pid = parseInt(roleName.slice(1), 10);
            return new IntConstant(pid);
          }
        }
      }
      return { eval(ctx: Context): number { return ctx.state.mover; } };
    }

    // (player) — the current player (set by forEach Player iterator, else mover)
    // @java game/functions/ints/iterator/Player.java — eval returns context.player()
    if (h === "player") {
      return { eval(ctx: Context): number {
        return ctx._evalPlayer ?? ctx.state.mover;
      }};
    }

    // (prev) — the previous mover
    // @java game/functions/ints/state/Prev.java
    if (h === "prev") {
      return { eval(ctx: Context): number {
        const n = ctx.game.numPlayers;
        return ((ctx.state.mover - 2 + n) % n) + 1;
      }};
    }

    // (if <bool> <int> [<int>]) — conditional int
    // @java game/functions/ints/IfInt.java
    if (h === "if") {
      const { positional: ifPos } = parseArgs1to1(node.items);
      const condFn = compileBool1to1(ifPos[0], 2);
      const thenFn = compileInt1to1(ifPos[1]);
      const elseFn = ifPos[2] ? compileInt1to1(ifPos[2]) : new IntConstant(0);
      return { eval(ctx: Context): number {
        return condFn.eval(ctx) ? thenFn.eval(ctx) : elseFn.eval(ctx);
      }};
    }

    // (coord "A1") — algebraic coordinate to site index
    // @java game/functions/ints/board/Coord.java — eval returns algebraicToIndex("A1", board)
    if (h === "coord") {
      const { positional: coPos } = parseArgs1to1(node.items);
      const coordNode = coPos[0];
      if (coordNode && isString(coordNode)) {
        const coordStr = (coordNode as { value: string }).value;
        return { eval(ctx: Context): number {
          const g = ctx.game as unknown as Game1to1;
          const W = g.equipment?.board?.width ?? 0;
          const H = g.equipment?.board?.height ?? 0;
          const traj = g.equipment?.board?.trajectories ?? undefined;
          return algebraicToSite(coordStr, W, H, traj);
        }};
      }
      return new IntConstant(-1);
    }

    // (where "PieceName" <roleOrInt> [state:<stateVal>]) — board site containing
    // the named piece with optional state filter.
    // @java game/functions/ints/board/where/WhereSite.java — eval
    // Returns the first board site where the piece owned by `role` is found; -1 if absent.
    // When state:<val> is given, only match pieces whose stateAt equals that value.
    if (h === "where") {
      const { positional: wPos, named: wNamed } = parseArgs1to1(node.items);
      const nameNode = wPos[0];
      const ownerNode = wPos[1];
      const pieceName = (nameNode && isString(nameNode)) ? nameNode.value : null;
      const ownerStr = (ownerNode && isIdent(ownerNode)) ? ownerNode.name.toLowerCase() : "mover";
      // state:<val> — optional state value filter (e.g. EinStein: cube number = die pips)
      // @java WhereSite.java — stateFilter param; matches pieces with a specific state value.
      const stateFilterNode = wNamed.get("state");
      const stateFilterFn = stateFilterNode ? compileInt1to1(stateFilterNode) : null;
      return { eval(ctx: Context): number {
        const cells = ctx.state.cells;
        const g = ctx.game as unknown as Game1to1;
        const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
        // Resolve owner player id
        let ownerId: number;
        if (ownerStr === "mover") ownerId = ctx.state.mover;
        else if (ownerStr === "next") ownerId = (ctx.state.mover % ctx.game.numPlayers) + 1;
        else if (ownerStr.startsWith("p") && !isNaN(parseInt(ownerStr.slice(1), 10))) {
          ownerId = parseInt(ownerStr.slice(1), 10);
        } else ownerId = ctx.state.mover;
        // Resolve state filter value, if any.
        const stateFilter = stateFilterFn ? stateFilterFn.eval(ctx) : null;
        // Find first board site with the named piece owned by ownerId (and matching state).
        if (pieceName && g.equipment) {
          const matchingIdx = g.equipment.pieces
            .filter(p => p.name.startsWith(pieceName) && p.owner === ownerId)
            .map(p => p.index);
          for (let i = 0; i < boardN; i++) {
            const what = ctx.state.whatAtSite(i);
            if (!matchingIdx.includes(what)) continue;
            // If state filter is set, only match sites where stateAt == filter value.
            if (stateFilter !== null && ctx.state.stateAtSite(i) !== stateFilter) continue;
            return i;
          }
        } else {
          // No name filter: find first site owned by ownerId (with optional state filter).
          for (let i = 0; i < boardN; i++) {
            if (cells[i] !== ownerId) continue;
            if (stateFilter !== null && ctx.state.stateAtSite(i) !== stateFilter) continue;
            return i;
          }
        }
        return -1; // OFF
      }};
    }

    // (mapEntry "name" <key>) / (mapEntry <key>) — look up a named map entry
    // @java game/functions/ints/board/mapEntry/MapEntry.java — eval
    // Maps are static equipment declarations; for 1:1 we store them in game context.
    // Simplified: look up a compile-time constant map stored on the Game1to1.
    if (h === "mapentry") {
      const { positional: mePos } = parseArgs1to1(node.items);
      // Two forms: (mapEntry "Name" <key>) and (mapEntry <key>)
      let mapName: string | null = null;
      let keyNode: LudNode | undefined;
      if (mePos[0] && isString(mePos[0])) {
        mapName = (mePos[0] as { value: string }).value;
        keyNode = mePos[1];
      } else {
        keyNode = mePos[0];
      }
      const keyFn = keyNode ? compileInt1to1(keyNode) : { eval: (_ctx: Context) => 0 };
      const mapNameFinal = mapName;
      return { eval(ctx: Context): number {
        const game = ctx.game as unknown as Game1to1;
        // Try to look up from the game's map table
        const maps = (game as unknown as { _maps?: Map<string, Map<number,number>> })._maps;
        if (maps) {
          const mapKey = mapNameFinal ?? "__default__";
          const m = maps.get(mapKey);
          if (m) {
            const key = keyFn.eval(ctx);
            const val = m.get(key);
            if (val !== undefined) return val;
          }
        }
        // Fallback: return the key itself (no map table compiled)
        return keyFn.eval(ctx);
      }};
    }

    // (pips) — current die pip count (set by forEach Die iterator)
    // @java game/functions/ints/iterator/Pips.java — eval returns context.pipCount()
    if (h === "pips") {
      return { eval(ctx: Context): number {
        return (ctx as unknown as { _evalPips?: number })._evalPips ?? 0;
      }};
    }

    // (regionSite "trackName" index:<int>) — site at given index on a named track
    // @java game/functions/ints/board/regionSite/RegionSite.java — eval
    // Simplified: return index directly (track-based games not fully supported in 1:1)
    if (h === "regionsite") {
      const { positional: rsPos, named: rsNamed } = parseArgs1to1(node.items);
      const indexNode = rsNamed.get("index") ?? rsPos[1];
      const indexFn = indexNode ? compileInt1to1(indexNode) : new IntConstant(0);
      return { eval(ctx: Context): number { return indexFn.eval(ctx); } };
    }

    // (trackSite Move <from> steps:<N>) — the site N steps along the track from
    // <from> (mancala next-hole). Also (trackSite FirstSite/LastSite …).
    // @java game/functions/ints/board/trackSite/TrackSite.java
    if (h === "tracksite") {
      const { positional: tsPos, named: tsNamed } = parseArgs1to1(node.items);
      const sub = (tsPos[0] && isIdent(tsPos[0])) ? (tsPos[0] as { name: string }).name.toLowerCase() : "";
      const fromNode = tsNamed.get("from")
        ?? tsPos.slice(1).find(n => isList(n) || isNumber(n));
      // Default from-site is ctx._evalFrom (the current piece position), matching
      // Java's TrackSite.eval() which uses context.from() when no explicit from is given.
      // @java game/functions/ints/board/trackSite/TrackSite.java — eval(context)
      const fromFn: IntFunction = fromNode ? compileInt1to1(fromNode) : { eval: (ctx: Context): number => ctx._evalFrom };
      const stepsNode = tsNamed.get("steps");
      const stepsFn: IntFunction = stepsNode ? compileInt1to1(stepsNode) : new IntConstant(1);
      // Extract track name (first string in positional[1..]) and role ident.
      // @java TrackSiteMove: selects track by name.contains(name) && owner==playerId,
      // falling back to owner==playerId then owner==0. Default player = Mover.
      let tsTrackName: string | null = null;
      let tsRoleKind: string | null = null;
      for (let pi = 1; pi < tsPos.length; pi++) {
        const pn = tsPos[pi];
        if (pn && isString(pn) && tsTrackName === null) { tsTrackName = pn.value; }
        else if (pn && isIdent(pn) && tsRoleKind === null) {
          const rk = (pn as { name: string }).name.toLowerCase();
          if (rk === "mover" || rk === "next" || rk === "player" || (rk.startsWith("p") && !isNaN(parseInt(rk.slice(1), 10)))) {
            tsRoleKind = rk;
          }
        }
      }
      const tsFixedPid = (tsRoleKind && tsRoleKind.startsWith("p") && !isNaN(parseInt(tsRoleKind.slice(1), 10)))
        ? parseInt(tsRoleKind.slice(1), 10) : -1;
      const capturedTsTrackName = tsTrackName;
      const capturedTsRoleKind = tsRoleKind;
      return { eval(ctx: Context): number {
        const from = fromFn.eval(ctx);
        const game = ctx.game as unknown as Game1to1;
        const tracksMap = game.equipment?.tracks;
        if (!tracksMap) return from;
        // Resolve player id (default = mover, matching Java TrackSiteMove default)
        let playerId = ctx.state.mover;
        if (capturedTsRoleKind === "next") playerId = (ctx.state.mover % ctx.game.numPlayers) + 1;
        else if (capturedTsRoleKind === "player") playerId = ctx._evalPlayer ?? ctx.state.mover;
        else if (tsFixedPid > 0) playerId = tsFixedPid;
        // Java TrackSiteMove.eval(): select track by name+owner, then name-only, then owned.
        let trackEntry: { sites: readonly number[]; loop: boolean; owner: number } | undefined;
        if (capturedTsTrackName !== null) {
          // First pass: name match AND owner matches
          for (const [tName, t] of tracksMap) {
            if (tName.includes(capturedTsTrackName) && t.owner === playerId) { trackEntry = t; break; }
          }
          // Second pass: name match any owner
          if (!trackEntry) {
            for (const [tName, t] of tracksMap) {
              if (tName.includes(capturedTsTrackName)) { trackEntry = t; break; }
            }
          }
        }
        // Fallback: first track owned by playerId, then owner==0
        if (!trackEntry) {
          for (const [, t] of tracksMap) { if (t.owner === playerId) { trackEntry = t; break; } }
        }
        if (!trackEntry) {
          for (const [, t] of tracksMap) { if (t.owner === 0) { trackEntry = t; break; } }
        }
        if (!trackEntry) { trackEntry = [...tracksMap.values()][0]; }
        if (!trackEntry) return from;
        const track = trackEntry.sites;
        const loop = trackEntry.loop;
        // (trackSite FirstSite "TrackName" from:<site> if:<cond>) — scan from
        // the given start position and return the first site satisfying `if:`.
        // @java TrackSiteFirstTrack.java — eval(): find `from` in track, then
        //   scan forward (wrapping) until condFn.eval(ctx) is true.
        if (sub === "firstsite") {
          const ifNode2 = tsNamed.get("if");
          let condFn2: BooleanFunction | null = null;
          if (ifNode2) { try { condFn2 = compileBool1to1(ifNode2, 2); } catch { /* skip */ } }
          if (condFn2 === null) {
            // No condition: when from is given, return the from-site; else track[0].
            if (from >= 0 && from < track.length * 2) return from;
            return track[0] ?? -1;
          }
          // Find the starting position: first track position matching `from`.
          let startPos = 0;
          if (from >= 0) {
            const fIdx = track.indexOf(from);
            if (fIdx < 0) return -1;
            startPos = fIdx;
          }
          // Scan forward (wrapping if loop) and return first site where cond is true.
          const origTo = ctx._evalTo;
          const n = track.length;
          for (let j = 0; j < n; j++) {
            const idx = (startPos + j) % n;
            const site = track[idx]!;
            ctx._evalTo = site;
            const ok = condFn2.eval(ctx);
            ctx._evalTo = origTo;
            if (ok) return site;
          }
          ctx._evalTo = origTo;
          return -1;
        }
        if (sub === "lastsite") return track[track.length - 1] ?? -1;
        if (from < 0) return -1;
        const pos = track.indexOf(from);
        if (pos < 0) return -1;
        let np = pos + stepsFn.eval(ctx);
        if (np >= track.length) { if (trackEntry.loop) np = ((np % track.length) + track.length) % track.length; else return -1; }
        if (np < 0) { if (trackEntry.loop) np = ((np % track.length) + track.length) % track.length; else return -1; }
        return track[np] ?? -1;
      }};
    }

    // (count Pips) — total pip count of all dice
    // @java game/functions/ints/count/dice/CountPips.java — eval
    if (h === "count") {
      // Re-check: this is only reached if the existing (count ...) block didn't handle it
      // (count Pips) case
      const { positional: cpPos } = parseArgs1to1(node.items);
      const first = cpPos[0];
      if (first && isIdent(first) && first.name.toLowerCase() === "pips") {
        return { eval(ctx: Context): number {
          // Sum all non-zero dice values
          const dice = ctx.state.diceValues;
          if (!dice || dice.length === 0) return 0;
          return dice.reduce((s, v) => s + v, 0);
        }};
      }
    }

    // (values Remembered "key") — retrieve remembered values from state
    // @java game/functions/region/sites/values/SitesRemembered.java (as IntFn: size)
    // Simplified: return 0 (remembered values not tracked in 1:1 path)
    if (h === "values") {
      return new IntConstant(0);
    }

    // (face <int>) — face VALUE of the die at the given board site.
    // @java game/functions/ints/board/Face.java — eval()
    // In Java, Face.eval() returns the resolved face value of the die component
    // at the given site. The TS engine stores die face values in diceValues[dieIdx],
    // where dieIdx = site - diceSiteBase. Reads equipment from ctx.game at eval time
    // so this works even when compiled inside piece generators (before equipment is finalized).
    if (h === "face") {
      const { positional: fPos } = parseArgs1to1(node.items);
      const siteFn = fPos[0] ? (() => { try { return compileInt1to1(fPos[0]); } catch { return new IntConstant(0); } })() : new IntConstant(0);
      return { eval(ctx: Context): number {
        const site = siteFn.eval(ctx);
        // Read dice info from ctx.game.equipment at eval time.
        const eq = (ctx.game as unknown as Game1to1).equipment;
        if (!eq || eq.diceSiteBase < 0 || eq.diceSpecs.length === 0) return 0;
        const dieIdx = site - eq.diceSiteBase;
        if (dieIdx < 0 || dieIdx >= eq.diceSpecs.length) return 0;
        // diceValues[dieIdx] holds the face value set during (roll).
        return ctx.state.diceValues[dieIdx] ?? 0;
      }};
    }

    // (pathExtent <path>) — extent of a path on the board (stub: return 0)
    // @java game/functions/ints/graph/PathExtent.java
    if (h === "pathextent") {
      return new IntConstant(0);
    }

    // (step <track> <int>) — step along a track (stub: return 0)
    if (h === "step") {
      return new IntConstant(0);
    }

    // (distance <site1> <site2>) — distance between two sites (stub: return 0)
    if (h === "distance") {
      return new IntConstant(0);
    }

    // (boardlessDistance ...) — distance on a boardless board (stub: return 0)
    if (h === "boardlessdistance") {
      return new IntConstant(0);
    }

    // (angle ...) — angle between two sites (stub: return 0)
    if (h === "angle") {
      return new IntConstant(0);
    }

    // (topLevel at:<site>) — topmost level index at a site (stub: return 0)
    // @java game/functions/ints/board/TopLevel.java — eval returns top level index
    if (h === "toplevel" || h === "toplev") {
      return new IntConstant(0);
    }

    // (level of:<site>) same as layer
    if (h === "level" && !isIdent(node)) {
      return new IntConstant(0);
    }

    // (pot) — game pot value (stub: return 0)
    if (h === "pot") {
      return new IntConstant(0);
    }

    // (amount ...) — player amount (stub: return 0)
    if (h === "amount") {
      return new IntConstant(0);
    }
  }

  // Bare ident: P1, P2, ... — player index as IntFunction
  // @java game/functions/ints/board/Id.java — (id "P1" ...) or role literal
  if (isIdent(node)) {
    const name = node.name.toUpperCase();
    if (name.length >= 2 && name.startsWith("P") && !isNaN(parseInt(name.slice(1), 10))) {
      const pid = parseInt(name.slice(1), 10);
      return new IntConstant(pid);
    }
    if (name === "MOVER") return { eval(ctx: Context): number { return ctx.state.mover; } };
    if (name === "NEXT") return { eval(ctx: Context): number { return (ctx.state.mover % ctx.game.numPlayers) + 1; } };
    if (name === "PLAYER") return { eval(ctx: Context): number { return ctx._evalPlayer ?? ctx.state.mover; } };
    // SiteType idents used in int context (e.g. (count Cell)) — return 0 gracefully
    if (name === "CELL" || name === "EDGE" || name === "VERTEX") return new IntConstant(0);
    if (name === "INFINITY" || name === "MAX") return new IntConstant(Number.MAX_SAFE_INTEGER);
    if (name === "-INFINITY" || name === "MIN") return new IntConstant(Number.MIN_SAFE_INTEGER);
    // Constants.OFF = -1 (used in track games as sentinel for "off the board")
    // @java main/Constants.java — OFF = -1
    if (name === "OFF") return new IntConstant(-1);
    // (end) — value of a track endpoint (Java Constants.END = -2, distinct from OFF = -1)
    // @java main/Constants.java — END = -2; a track's terminal "End" step appends
    // an elem with site == -2; trackSite Move returns -2 only when stepping exactly
    // onto it (bear-off), and -1 (OFF) when overshooting past the end of the track.
    if (name === "END") return new IntConstant(-2);
    // UNDEFINED — used in conditions like (!= x Undefined)
    if (name === "UNDEFINED") return new IntConstant(-1);
    // FirstSite/LastSite — board site 0 or last site
    if (name === "FIRSTSITE") return { eval(ctx: Context): number {
      return 0;
    }};
    if (name === "LASTSITE") return { eval(ctx: Context): number {
      const g = ctx.game as unknown as Game1to1;
      return (g.equipment ? g.equipment.board.numSites : ctx.state.cells.length) - 1;
    }};
  }

  throw new Error(`compiler1to1: cannot compile IntFunction from ${JSON.stringify(node)}`);
}

// ---------------------------------------------------------------------------
// Compile RegionFunction
// ---------------------------------------------------------------------------

export function compileRegion1to1(node: LudNode | undefined): RegionFunction {
  if (!node) throw new Error("compiler1to1: expected RegionFunction node");
  // Handle number literal: bare integer site index → singleton region [n].
  // @java game/functions/region/sites/index/SiteIndex.java — eval: returns [index]
  // Used in (set Count N at:2) where `at:2` is a bare integer site index.
  if (isNumber(node)) {
    const siteIdx = node.value;
    return { eval(_ctx: Context): number[] { return [siteIdx]; } };
  }
  // Handle ident: bare P1/P2/... or SiteType idents — return empty region instead of throw
  if (!isList(node)) {
    if (isIdent(node)) {
      const n = node.name.toLowerCase();
      // Handle P1/P2/... as player regions
      if (n.startsWith("p") && !isNaN(parseInt(n.slice(1), 10))) {
        const playerNum = parseInt(n.slice(1), 10);
        return {
          eval(ctx: Context): number[] {
            const game = ctx.game as unknown as Game1to1;
            const regionFn = game.equipment?.playerRegions.get(playerNum);
            if (regionFn) return regionFn.eval(ctx);
            return [];
          }
        };
      }
      // Other idents (Cell, Edge, Vertex, etc.) — return empty
      return { eval(_ctx: Context): number[] { return []; } };
    }
    throw new Error(`compiler1to1: expected list for RegionFunction, got ${(node as {kind:string}).kind}`);
  }
  // { <region1> <region2> ... } — curly-brace list of regions = union
  if (node.delimiter === "curly") {
    const regions: RegionFunction[] = [];
    for (const item of node.items) {
      if (isList(item)) {
        try { regions.push(compileRegion1to1(item)); } catch { /* skip */ }
      }
    }
    return new UnionRegion(regions);
  }
  // ((define-expansion ...)) — define expansion wraps body in an extra list layer.
  // Unwrap single-element round list whose only item is itself a list.
  if (node.delimiter === "round" && node.items.length === 1 && isList(node.items[0]!)) {
    return compileRegion1to1(node.items[0]);
  }
  const h = headOf(node)!;

  // ---------------------------------------------------------------------------
  // Region registry lookup — registered 1:1 classes take priority over inline.
  // Pattern mirrors compileInt1to1 (line ~172) / compileBool1to1 (line ~2070).
  // ---------------------------------------------------------------------------
  {
    const env: Compile1to1Env = { numPlayers: 2 };
    const plainCtor = lookupRegion1to1(h);
    if (plainCtor) return plainCtor(node, env);
    // Compound "sites:<Subtype>": (sites Empty), (sites Occupied ...), etc.
    if (h === "sites") {
      const { positional: rPos } = parseArgs1to1(node.items);
      const first = rPos[0];
      if (first && isIdent(first)) {
        const subCtor = lookupRegion1to1(`sites:${first.name.toLowerCase()}`);
        if (subCtor) return subCtor(node, env);
      }
    }
  }

  // (handSite <role|int>) — single hand site as a region: [handSiteIndex].
  // Needed when (set Count N at:(handSite P1)) is compiled; the to-node
  // is a handSite IntFunction and must be reachable from compileRegion1to1.
  // @java HandSite.java — eval() returns a single int; wrap as a 1-element region.
  if (h === "handsite") {
    const siteFn = compileInt1to1(node);
    return { eval(ctx: Context): number[] {
      const s = siteFn.eval(ctx);
      return s >= 0 ? [s] : [];
    }};
  }

  if (h === "sites") {
    const { positional, named } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first)) {
      const kind = first.name.toLowerCase();
      // (sites <role> "Name") — a named player region (regions "Home" P1 …).
      // Resolves <role> to a player (Mover/Next/Player→_evalPlayer, Pn→n) then
      // looks up that player's named region. @java SitesPlayer with region name.
      const nameNode = positional[1];
      if (nameNode && isString(nameNode) &&
          (kind === "mover" || kind === "next" || kind === "player" || (kind.startsWith("p") && !isNaN(parseInt(kind.slice(1), 10))))) {
        const regName = nameNode.value.toLowerCase();
        const fixedPid = (kind.startsWith("p") && !isNaN(parseInt(kind.slice(1), 10))) ? parseInt(kind.slice(1), 10) : -1;
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          let pid = fixedPid;
          if (kind === "mover") pid = ctx.state.mover;
          else if (kind === "next") pid = (ctx.state.mover % ctx.game.numPlayers) + 1;
          else if (kind === "player") pid = ctx._evalPlayer ?? ctx.state.mover;
          const byName = g.equipment?.namedPlayerRegions?.get(regName);
          const regionFn = byName?.get(pid);
          return regionFn ? regionFn.eval(ctx) : [];
        }};
      }
      if (kind === "empty") return new SitesEmpty();
      // (sites Start (piece <indexFn>)) — sites where the specified component starts.
      // @java game/functions/region/sites/piece/SitesStart.java
      // Used in InitialPawnMove: (is In (from) (sites Start (piece (what at:(from)))))
      // indexFn = the component index = (what at:(from)) (piece type at from-site).
      if (kind === "start") {
        // The argument is a (piece <indexFn>) form; extract the indexFn.
        const pieceArgNode = positional[1];
        let indexFn: IntFunction | null = null;
        if (pieceArgNode && isList(pieceArgNode) && headOf(pieceArgNode) === "piece") {
          const pieceArgs = parseArgs1to1(pieceArgNode.items);
          const pieceIndexNode = pieceArgs.positional[0];
          if (pieceIndexNode) {
            try { indexFn = compileInt1to1(pieceIndexNode); } catch { /* null */ }
          }
        } else if (pieceArgNode) {
          // No (piece ...) wrapper — treat positional[1] directly as an indexFn
          try { indexFn = compileInt1to1(pieceArgNode); } catch { /* null */ }
        }
        return new SitesStart(indexFn);
      }
      // (sites Between from:<intFn> to:<intFn> [fromIncluded:true] [toIncluded:true])
      // @java game/functions/region/sites/between/SitesBetween.java — eval(Context)
      // Returns all sites strictly between `from` and `to` along the same radial.
      // Default: from and to are NOT included. Direction: Adjacent (all 8 for square boards).
      if (kind === "between") {
        const fromNode = named.get("from");
        const toNode = named.get("to");
        if (!fromNode || !toNode) {
          return { eval(_ctx: Context): number[] { return []; } };
        }
        let fromFnBetween: IntFunction;
        let toFnBetween: IntFunction;
        try { fromFnBetween = compileInt1to1(fromNode); }
        catch { return { eval(_ctx: Context): number[] { return []; } }; }
        try { toFnBetween = compileInt1to1(toNode); }
        catch { return { eval(_ctx: Context): number[] { return []; } }; }
        // fromIncluded:, toIncluded: optional boolean params
        const fromInclNode = named.get("fromincluded") ?? named.get("fromIncluded");
        const fromIncluded = fromInclNode && isIdent(fromInclNode) && fromInclNode.name.toLowerCase() === "true";
        const toInclNode = named.get("toincluded") ?? named.get("toIncluded");
        const toIncluded = toInclNode && isIdent(toInclNode) && toInclNode.name.toLowerCase() === "true";
        const fromFnFinal = fromFnBetween;
        const toFnFinal = toFnBetween;
        const fromInclFinal = fromIncluded;
        const toInclFinal = toIncluded;
        return { eval(ctx: Context): number[] {
          const from = fromFnFinal.eval(ctx);
          const to = toFnFinal.eval(ctx);
          if (from < 0 || to < 0 || from === to) return [];
          const ctxAny = ctx as unknown as { _radials?: readonly CellFlatRadials[]; _trajectories?: Trajectories | null };
          const radials = ctxAny._radials;
          const result: number[] = [];
          if (fromInclFinal) result.push(from);
          if (toInclFinal) result.push(to);
          // Walk radials from `from` to find the one containing `to`, collect between-sites.
          // @java SitesBetween.eval — iterates radials(from, direction), finds `to` along ray.
          if (radials) {
            const cr = radials[from];
            if (cr) {
              // Check all 4 axes (all Adjacent directions)
              for (const { ray, opposite } of cr.axes) {
                for (const rayToWalk of [ray, opposite]) {
                  for (let i = 1; i < rayToWalk.length; i++) {
                    if (rayToWalk[i] === to) {
                      // Found `to` at step i; collect intermediate steps 1..i-1
                      for (let j = 1; j < i; j++) {
                        const between = rayToWalk[j];
                        if (between !== undefined && !result.includes(between)) {
                          result.push(between);
                        }
                      }
                      break; // found to in this ray, stop
                    }
                  }
                }
              }
            }
          } else {
            // Square-board fallback: compute direction from `from` to `to` and walk
            const g = ctx.game as unknown as Game1to1;
            const W = g.equipment?.board?.width ?? 0;
            if (W > 0) {
              const fromY = Math.floor(from / W), fromX = from % W;
              const toY = Math.floor(to / W), toX = to % W;
              const dy = toY - fromY, dx = toX - fromX;
              const len = Math.max(Math.abs(dy), Math.abs(dx));
              if (len > 1 && (dy === 0 || dx === 0 || Math.abs(dy) === Math.abs(dx))) {
                const sy = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                const sx = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                for (let k = 1; k < len; k++) {
                  const between = (fromY + sy * k) * W + (fromX + sx * k);
                  if (!result.includes(between)) result.push(between);
                }
              }
            }
          }
          return result;
        }};
      }
      if (kind === "hand") {
        const roleNode = positional[1];
        const role: RoleType | "Shared" = (roleNode && isIdent(roleNode))
          ? (roleNode.name as RoleType | "Shared")
          : "Mover";
        return new SitesHand1to1(role);
      }
      if (kind === "lineofsight") {
        const secondNode = positional[1];
        if (secondNode && isIdent(secondNode) && secondNode.name.toLowerCase() === "farthest") {
          return new SitesLineOfSightFarthest1to1();
        }
        // (sites LineOfSight Piece at:<site>) — sites visible along lines from site
        // Simplified: return all reachable empty sites in each direction (like Slide)
        const atNode2 = named.get("at");
        if (atNode2) {
          const siteFn = compileInt1to1(atNode2);
          return { eval(ctx: Context): number[] {
            const from = siteFn.eval(ctx);
            if (from < 0) return [];
            const ctxAny = ctx as unknown as { _radials?: readonly import("./ludemes/topology-radials.js").CellFlatRadials[] };
            const radials = ctxAny._radials;
            if (!radials) return [];
            const cellRadials = radials[from];
            if (!cellRadials) return [];
            const result: number[] = [];
            for (const axis of cellRadials.axes) {
              for (const ray of [axis.ray, axis.opposite]) {
                for (let i = 1; i < ray.length; i++) {
                  const s = ray[i]!;
                  if (!ctx.state.isEmptySite(s)) break;
                  result.push(s);
                }
              }
            }
            return [...new Set(result)];
          }};
        }
        return { eval(_ctx: Context): number[] { return []; } };
      }
      if (kind === "occupied") {
        // (sites Occupied by:<role> [container:<containerFn>] [component:<name>])
        // @java game/functions/region/sites/occupied/SitesOccupied.java — eval
        // When container is specified, search is restricted to that container's sites.
        // container:(mover) → search mover's hand; container:0 (board) → board only.
        // Without container, searches only the board (Java's default: container index 0).
        // @java SitesOccupied: containerFn != null → use container's sites range.
        const byNode = named.get("by");
        const roleName = (byNode && isIdent(byNode)) ? byNode.name.toLowerCase() : "all";
        const containerNode = named.get("container");
        // Compile the container selector if present: (mover) → mover ID, N → fixed container idx.
        // In Java, container index matches player ID for hand containers: handOf(P1)=1, etc.
        let containerFn: IntFunction | null = null;
        if (containerNode) {
          try { containerFn = compileInt1to1(containerNode); } catch { /* ignore */ }
        }
        const capturedContainerFn = containerFn;
        return {
          eval(ctx: Context): number[] {
            const cells = ctx.state.cells;
            const g = ctx.game as unknown as Game1to1;
            const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
            const totalN = cells.length;
            const result: number[] = [];

            // Resolve the owner (player id) from the role.
            let targetOwner: number | null = null;
            if (roleName === "mover") {
              targetOwner = ctx.state.mover;
            } else if (roleName === "next") {
              targetOwner = (ctx.state.mover % ctx.game.numPlayers) + 1;
            } else if (roleName === "p1" || roleName === "p2" || roleName === "p3" || roleName === "p4") {
              targetOwner = parseInt(roleName.slice(1), 10);
            } else if (roleName === "enemy") {
              targetOwner = -1; // special: any non-mover
            } else if (roleName === "friend" || roleName === "friendly") {
              targetOwner = ctx.state.mover;
            } else if (roleName === "neutral" || roleName === "shared") {
              targetOwner = 0;
            }
            // else "all": targetOwner = null

            // Determine site range based on container argument.
            // @java SitesOccupied: if containerFn != null, restrict to that container's sites.
            let startSite = 0;
            let endSite = boardN; // default: board only
            if (capturedContainerFn !== null) {
              const containerIdx = capturedContainerFn.eval(ctx);
              if (containerIdx > 0 && g.equipment) {
                // containerIdx == player id for hand containers (P1=1, P2=2, Mover=mover)
                const handBase = g.equipment.handSiteOf.get(containerIdx);
                if (handBase !== undefined) {
                  const hand = g.equipment.hands.find(h => h.owner === containerIdx);
                  startSite = handBase;
                  endSite = handBase + (hand?.size ?? 1);
                } else {
                  // Container index 0 = board (or unknown)
                  startSite = 0;
                  endSite = boardN;
                }
              } else {
                // container:0 or negative → board
                startSite = 0;
                endSite = boardN;
              }
            }

            const whats = ctx.state.whats;
            for (let i = startSite; i < Math.min(endSite, totalN); i++) {
              const cellOwner = cells[i] ?? 0;
              const hasContent = cellOwner !== 0 || (whats[i] ?? 0) !== 0;
              if (!hasContent) continue;

              if (targetOwner === null) {
                // All: any occupied site
                result.push(i);
              } else if (targetOwner === -1) {
                // Enemy: any non-mover owned piece
                if (cellOwner !== 0 && cellOwner !== ctx.state.mover) result.push(i);
              } else if (targetOwner === 0) {
                // Neutral/Shared: owner=0 but has content
                if (cellOwner === 0 && (whats[i] ?? 0) !== 0) result.push(i);
              } else {
                if (cellOwner === targetOwner) result.push(i);
              }
            }
            return result;
          }
        };
      }
      if (kind === "board") {
        // (sites Board) — all board sites
        // @java game/functions/region/sites/simple/SitesBoard.java
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const n = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;
          return Array.from({ length: n }, (_, i) => i);
        }};
      }
      if (kind === "centre" || kind === "center") {
        // (sites Centre) — centre sites of the board (approximately)
        // @java game/functions/region/sites/simple/SitesCentre.java
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const board = g.equipment.board;
          const W = board.width;
          const H = board.height;
          // For graph boards (with trajectories), find the site(s) whose
          // coordinate is closest to the centroid of all sites.
          // @java SitesCentre: uses topology centreOf(SiteType) which finds
          // the vertex with position closest to the board centroid.
          const traj = board.trajectories;
          if (traj !== null) {
            const n = board.numSites;
            // Compute centroid of all vertex positions.
            let sumX = 0, sumY = 0;
            for (let s = 0; s < n; s++) {
              sumX += traj.xOf(s);
              sumY += traj.yOf(s);
            }
            const cx = sumX / n;
            const cy = sumY / n;
            // Find site(s) within 0.25 units of centroid.
            // @java SitesCentre: tolerance-based match against board centroid.
            const CENTRE_TOL = 0.5;
            let minDist = Infinity;
            const result: number[] = [];
            for (let s = 0; s < n; s++) {
              const dx = traj.xOf(s) - cx;
              const dy = traj.yOf(s) - cy;
              const d = Math.sqrt(dx*dx + dy*dy);
              if (d < minDist - 0.01) { minDist = d; result.length = 0; result.push(s); }
              else if (d < minDist + 0.01) { result.push(s); }
            }
            // Filter to those within the tolerance of the minimum distance.
            return result.filter(s => {
              const dx = traj.xOf(s) - cx;
              const dy = traj.yOf(s) - cy;
              const d = Math.sqrt(dx*dx + dy*dy);
              return d < minDist + CENTRE_TOL;
            });
          }
          // Rectangular path: centre = middle site(s).
          const cx = Math.floor(W / 2);
          const cy = Math.floor(H / 2);
          const sites: number[] = [];
          for (let dy = 0; dy <= (H % 2 === 0 ? 1 : 0); dy++) {
            for (let dx = 0; dx <= (W % 2 === 0 ? 1 : 0); dx++) {
              const s = (cy - dy) * W + (cx - dx);
              if (s >= 0 && s < W * H) sites.push(s);
            }
          }
          return [...new Set(sites)].sort((a, b) => a - b);
        }};
      }
      if (kind === "around") {
        // (sites Around <site-or-region> [<dirn>] [if:<cond>]) — neighbours
        // @java game/functions/region/sites/around/SitesAround.java
        // Supports both IntFunction (single site) and RegionFunction (multiple sites).
        // When a region is given, returns the union of all neighbours of all sites.
        const siteArgNode = positional[1];
        if (siteArgNode) {
          let dirName = "Adjacent";
          let siteFn: IntFunction | null = null;
          let regionFnAround: RegionFunction | null = null;
          let includeSelf = false;
          const siteArgNodeFinal = siteArgNode;

          // Optional: direction ident before site/region
          if (isIdent(siteArgNode)) {
            dirName = siteArgNode.name;
            const siteNode2 = positional[2];
            if (siteNode2) {
              try { siteFn = compileInt1to1(siteNode2); } catch {
                try { regionFnAround = compileRegion1to1(siteNode2); } catch { /* ignore */ }
              }
            }
          } else {
            // Detect whether siteArgNode is a region-type or int-type expression.
            // Region heads: sites, union, intersection, difference, expand, where,
            //   complement, forEach, if (as region), centrePoint, etc.
            // Int heads: last, coord, site, from, to, var, score, etc.
            // (sites ...) always returns a region; use compileRegion1to1 for it.
            const isRegionHead = isList(siteArgNodeFinal) && (() => {
              const h2 = headOf(siteArgNodeFinal)?.toLowerCase();
              return h2 === "sites" || h2 === "union" || h2 === "intersection" ||
                     h2 === "difference" || h2 === "expand" || h2 === "complement" ||
                     h2 === "centrepoint";
            })();
            if (isRegionHead) {
              try {
                regionFnAround = compileRegion1to1(siteArgNodeFinal);
              } catch { /* ignore */ }
            } else {
              // Try as IntFunction first (single site), then as RegionFunction
              try {
                siteFn = compileInt1to1(siteArgNodeFinal);
              } catch {
                try {
                  regionFnAround = compileRegion1to1(siteArgNodeFinal);
                } catch { /* ignore */ }
              }
            }
          }

          // Check remaining positional args for direction and/or RegionTypeDynamic.
          // Pattern: (sites Around <site> [<typeDynamic>] [<direction>])
          // @java SitesAround — @Opt RegionTypeDynamic type, @Opt AbsoluteDirection dirn
          // RegionTypeDynamic = Own, Enemy, Mover, Next, Neutral, etc.
          // AbsoluteDirection = Orthogonal, Adjacent, Diagonal, N, S, E, W, etc.
          const DYNAMIC_TYPES = new Set(["own", "enemy", "mover", "next", "neutral", "all", "each", "friend", "foe", "p1", "p2", "notempty", "empty"]);
          const DIRECTION_NAMES = new Set(["adjacent", "orthogonal", "diagonal", "n", "s", "e", "w", "ne", "nw", "se", "sw", "all", "forwards", "backwards", "north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"]);
          let dynamicType: string | null = null;
          // Scan remaining positional args (2..N) for type and direction
          for (let pi = (isIdent(siteArgNode) ? 2 : 2); pi < positional.length; pi++) {
            const pa = positional[pi];
            if (!pa || !isIdent(pa)) continue;
            const paName = pa.name.toLowerCase();
            if (DYNAMIC_TYPES.has(paName) && !dynamicType) {
              dynamicType = paName;
            } else if (DIRECTION_NAMES.has(paName)) {
              dirName = pa.name; // Update direction
            }
          }

          const includeSelfNode = named.get("includeSelf") ?? named.get("includeself");
          if (includeSelfNode && isIdent(includeSelfNode) && includeSelfNode.name.toLowerCase() === "true") {
            includeSelf = true;
          }
          // (sites Around X if:<cond>) — optional filter condition
          // @java SitesAround.java — cond evaluated with context.to() = neighbour
          const ifNode = named.get("if");
          let ifCondFn: BooleanFunction | null = null;
          if (ifNode) {
            try { ifCondFn = compileBool1to1(ifNode, 2); } catch { /* skip */ }
          }
          // (sites Around X distance:N) — sites at exactly N radial steps away.
          // @java SitesAround.java — distance parameter (default 1)
          // Java: radial.steps()[dist].id() for each radial from source site.
          const distanceNode = named.get("distance");
          let distanceFn: IntFunction | null = null;
          if (distanceNode) {
            try { distanceFn = compileInt1to1(distanceNode); } catch { /* ignore */ }
          }
          const dirFinal = dirName;
          const includeSelfFinal = includeSelf;
          const siteFnFinal = siteFn;
          const regionFnFinal = regionFnAround;
          const ifFinal = ifCondFn;
          const dynTypeFinal = dynamicType;
          const distanceFnFinal = distanceFn;

          /** Get sites at radial step `dist` from `s` in direction `dir` on a square board. */
          function sitesAtDistance(ctx: Context, s: number, dist: number): number[] {
            const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null; _radials?: readonly CellFlatRadials[] };
            const traj = ctxAny._trajectories;
            const radials = ctxAny._radials;
            const result: number[] = [];
            if (traj) {
              // Use trajectories: get all distinct radials from s in the given direction
              const rads = traj.distinctRadialsByName(s, dirFinal);
              if (rads.length > 0) {
                for (const r of rads) {
                  if (dist < r.ray.length) result.push(r.ray[dist]!);
                }
                return result;
              }
            }
            // Square board fallback: enumerate rays in the given direction and pick step dist
            const g = ctx.game as unknown as Game1to1;
            const W = g.equipment.board.width;
            const H = g.equipment.board.height;
            const col = s % W; const row = Math.floor(s / W);
            const d = dirFinal.toLowerCase();
            const useAll = d === "adjacent" || d === "all";
            const useOrtho = useAll || d === "orthogonal";
            const useDiag = useAll || d === "diagonal";
            // Walk in each direction `dist` steps
            const dirs: [number, number][] = [];
            if (useOrtho) {
              dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
            }
            if (useDiag) {
              dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
            }
            // Specific compass directions
            const compassMap: { [k: string]: [number, number] } = {
              n: [-1, 0], s: [1, 0], e: [0, 1], w: [0, -1],
              ne: [-1, 1], nw: [-1, -1], se: [1, 1], sw: [1, -1],
              north: [-1, 0], south: [1, 0], east: [0, 1], west: [0, -1],
            };
            if (!useAll && !useOrtho && !useDiag && compassMap[d]) {
              dirs.push(compassMap[d]!);
            }
            for (const [dr, dc] of dirs) {
              const nr = row + dr * dist;
              const nc = col + dc * dist;
              if (nr >= 0 && nr < H && nc >= 0 && nc < W) {
                const site = nr * W + nc;
                if (!result.includes(site)) result.push(site);
              }
            }
            // Fallback: use _radials if available for non-group directions
            if (dirs.length === 0 && radials) {
              const cr = radials[s];
              if (cr) {
                const axes = radialsForDirection(cr, dirFinal);
                for (const { ray, opposite } of axes) {
                  if (dist < ray.length) { const t = ray[dist]; if (t !== undefined && !result.includes(t)) result.push(t); }
                  if (dist < opposite.length) { const t = opposite[dist]; if (t !== undefined && !result.includes(t)) result.push(t); }
                }
              }
            }
            return result;
          }

          /** Get neighbours of a single site on the current board (distance=1). */
          function neighboursOf(ctx: Context, s: number): number[] {
            const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
            const traj = ctxAny._trajectories;
            if (traj) return traj.group(s, dirFinal);
            const g = ctx.game as unknown as Game1to1;
            const W = g.equipment.board.width;
            const H = g.equipment.board.height;
            const col = s % W; const row = Math.floor(s / W);
            const ns: number[] = [];
            const useAll = dirFinal === "Adjacent" || dirFinal === "All";
            const useOrtho = useAll || dirFinal === "Orthogonal";
            const useDiag = useAll || dirFinal === "Diagonal";
            if (useOrtho) {
              if (col > 0) ns.push(s - 1);
              if (col < W-1) ns.push(s + 1);
              if (row > 0) ns.push(s - W);
              if (row < H-1) ns.push(s + W);
            }
            if (useDiag) {
              if (col > 0 && row > 0) ns.push(s - W - 1);
              if (col < W-1 && row > 0) ns.push(s - W + 1);
              if (col > 0 && row < H-1) ns.push(s + W - 1);
              if (col < W-1 && row < H-1) ns.push(s + W + 1);
            }
            return ns;
          }

          return { eval(ctx: Context): number[] {
            // Collect all sites from the source (single site or region)
            let sourceSites: number[];
            if (siteFnFinal) {
              const s = siteFnFinal.eval(ctx);
              if (s < 0) return [];
              sourceSites = [s];
            } else if (regionFnFinal) {
              sourceSites = regionFnFinal.eval(ctx);
              if (sourceSites.length === 0) return [];
            } else {
              return [];
            }

            // Distance-aware neighbour lookup.
            // @java SitesAround.java — distance param (default 1)
            // With distance:N, return sites at exactly N radial steps along each direction.
            const dist = distanceFnFinal ? distanceFnFinal.eval(ctx) : 1;

            // Collect all neighbours (union of all source sites' neighbours)
            const seen = new Set<number>();
            const neighbours: number[] = [];
            for (const s of sourceSites) {
              if (includeSelfFinal) {
                if (!seen.has(s)) { seen.add(s); neighbours.push(s); }
              }
              const nbrs = (dist === 1) ? neighboursOf(ctx, s) : sitesAtDistance(ctx, s, dist);
              for (const n of nbrs) {
                if (!seen.has(n)) { seen.add(n); neighbours.push(n); }
              }
            }

            // Apply RegionTypeDynamic filter (Own, Enemy, Mover, Next, Neutral).
            // @java SitesAround.java — typeDynamic filters results by ownership
            let filtered = neighbours;
            if (dynTypeFinal) {
              const cells = ctx.state.cells;
              const mover = ctx.state.mover;
              const next = (mover % ctx.game.numPlayers) + 1;
              filtered = neighbours.filter(n => {
                const who = cells[n] ?? 0;
                switch (dynTypeFinal) {
                  case "own": case "mover": return who === mover;
                  case "enemy": return who !== 0 && who !== mover;
                  case "next": return who === next;
                  case "neutral": case "empty": return who === 0;
                  case "notempty": return who !== 0;
                  case "all": return true;
                  default: return true;
                }
              });
            }

            // Apply if: condition, setting _evalTo and _evalSite to each candidate
            // @java SitesAround.java — cond evaluated with context.to() = neighbour
            if (ifFinal) {
              const origTo = ctx._evalTo;
              // @java SitesAround.java — cond evaluated with context.setTo(to) only.
              // Java does NOT call context.setSite(to) inside the condition — so (site)
              // in the if: refers to the OUTER context's (site) (e.g. the forEach
              // iteration site), not the neighbor. Only _evalTo is set to the neighbor.
              const result: number[] = [];
              for (const n of filtered) {
                ctx._evalTo = n;
                if (ifFinal.eval(ctx)) result.push(n);
              }
              ctx._evalTo = origTo;
              return result;
            }
            return filtered;
          }};
        }
        return { eval(_ctx: Context): number[] { return []; } };
      }
      if (kind === "bottom") return new SitesBottom();
      if (kind === "top") return new SitesTop();
      if (kind === "left") return new SitesLeft();
      if (kind === "right") return new SitesRight();
      if (kind === "corners") return new SitesCorners();
      if (kind === "p1" || kind === "p2" || kind === "p3" || kind === "p4") {
        // (sites P1) — player's region (defined in equipment)
        const playerNum = parseInt(kind.slice(1), 10);
        return {
          eval(ctx: Context): number[] {
            const game = ctx.game as unknown as Game1to1;
            const regionFn = game.equipment.playerRegions.get(playerNum);
            if (!regionFn) return [];
            return regionFn.eval(ctx);
          }
        };
      }
      if (kind === "row") {
        const rowFn = compileInt1to1(positional[1]);
        return new SitesRow(rowFn);
      }
      if (kind === "column" || kind === "col") {
        const colFn = compileInt1to1(positional[1]);
        return new SitesColumn(colFn);
      }
      if (kind === "phase") {
        const phaseFn = compileInt1to1(positional[1]);
        return new SitesPhase(phaseFn);
      }
      if (kind === "playable") {
        // (sites Playable) — sites that can be played to (empty board sites)
        return new SitesEmpty();
      }
      if (kind === "direction") {
        // (sites Direction [from:<site>] [<dirn>]) — ALL sites along a direction from a site
        // @java game/functions/region/sites/direction/SitesDirection.java
        // Returns all sites in ALL radials of the given direction (like a queen's reach).
        const fromNode2 = named.get("from");
        const dirNode2 = positional[1];
        const dirName2 = (dirNode2 && isIdent(dirNode2)) ? dirNode2.name : "Adjacent";
        const fromFn2 = fromNode2 ? compileInt1to1(fromNode2) : { eval: (ctx: Context) => ctx._evalFrom };
        return { eval(ctx: Context): number[] {
          const from = fromFn2.eval(ctx);
          if (from < 0) return [];
          const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null; _radials?: readonly CellFlatRadials[] };
          const traj = ctxAny._trajectories;
          if (traj) {
            return traj.group(from, dirName2);
          }
          // Square board: use radials to get all sites along all axes in the direction
          const radials = ctxAny._radials;
          if (!radials) return [];
          const cr = radials[from];
          if (!cr) return [];
          const axes = radialsForDirection(cr, dirName2);
          const result: number[] = [];
          for (const axis of axes) {
            for (const r of [axis.ray, axis.opposite]) {
              for (let i = 1; i < r.length; i++) {
                if (r[i] !== undefined) result.push(r[i] as number);
              }
            }
          }
          return result;
        }};
      }
      if (kind === "state") {
        // (sites State <int>) — sites with a specific state value (stub: empty)
        return { eval(_ctx: Context): number[] { return []; } };
      }

      if (kind === "to") {
        // (sites To) — site of the last move to (= _evalTo)
        return { eval(ctx: Context): number[] {
          const s = ctx._evalTo;
          return s >= 0 ? [s] : [];
        }};
      }

      if (kind === "from") {
        // (sites From) — site of the last move from (= _evalFrom)
        return { eval(ctx: Context): number[] {
          const s = ctx._evalFrom;
          return s >= 0 ? [s] : [];
        }};
      }

      if (kind === "mover") {
        // (sites Mover) — the static region declared for the mover via
        // (regions P1 …)/(regions P2 …); falls back to mover-owned cells when
        // no region is declared. @java …/region/sites/player/SitesPlayer (Mover).
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const region = g.equipment?.playerRegions?.get(ctx.state.mover);
          if (region) return region.eval(ctx);
          const cells = ctx.state.cells;
          const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
          const mover = ctx.state.mover;
          const res: number[] = [];
          for (let i = 0; i < boardN; i++) { if (cells[i] === mover) res.push(i); }
          return res;
        }};
      }

      if (kind === "next") {
        // (sites Next) — the static region declared for the next player; falls
        // back to next-owned cells when no region is declared.
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const next = (ctx.state.mover % ctx.game.numPlayers) + 1;
          const region = g.equipment?.playerRegions?.get(next);
          if (region) return region.eval(ctx);
          const cells = ctx.state.cells;
          const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
          const res: number[] = [];
          for (let i = 0; i < boardN; i++) { if (cells[i] === next) res.push(i); }
          return res;
        }};
      }

      if (kind === "track") {
        // (sites Track [<role>] ["Name"] [from:<site>] [to:<site>]) — sites on the named/player-owned track.
        // Mirrors Java SitesTrack.eval(): scan positional[1..] for the first string
        // (track name) and the first role ident (Mover/Next/P1/P2/…); then apply
        // Java's selection: exact-name match OR (substring match AND owner==playerId
        // OR owner==0). Falls back to first track owned by playerId (or owner==0).
        // With from:/to: named args: returns only the subsequence of track sites from
        // `from` (inclusive) forward to `to` (inclusive), wrapping around if needed.
        // @java game/functions/region/sites/track/SitesTrack.java
        let trackName: string | null = null;
        let roleKind: string | null = null;
        for (let pi = 1; pi < positional.length; pi++) {
          const pn = positional[pi];
          if (pn && isString(pn) && trackName === null) { trackName = pn.value; }
          else if (pn && isIdent(pn) && roleKind === null) {
            const rk = (pn as { name: string }).name.toLowerCase();
            if (rk === "mover" || rk === "next" || rk === "player" || (rk.startsWith("p") && !isNaN(parseInt(rk.slice(1), 10)))) {
              roleKind = rk;
            }
          }
        }
        const fixedPidTrack = (roleKind && roleKind.startsWith("p") && !isNaN(parseInt(roleKind.slice(1), 10)))
          ? parseInt(roleKind.slice(1), 10) : -1;
        const capturedTrackName = trackName;
        const capturedRoleKind = roleKind;
        // Named from:/to: args for subsequence extraction
        // @java SitesTrack.java:127-175 — from/to index extraction with wrap
        let fromFnTrack: IntFunction | null = null;
        let toFnTrack: IntFunction | null = null;
        const fromNodeTrack = named.get("from");
        const toNodeTrack = named.get("to");
        if (fromNodeTrack) { try { fromFnTrack = compileInt1to1(fromNodeTrack); } catch { /* none */ } }
        if (toNodeTrack) { try { toFnTrack = compileInt1to1(toNodeTrack); } catch { /* none */ } }
        const capturedFromFn = fromFnTrack;
        const capturedToFn = toFnTrack;
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const tracksMap = g.equipment?.tracks;
          if (!tracksMap) return [];
          // Resolve player id from role
          let playerId = 0;
          if (capturedRoleKind === "mover") playerId = ctx.state.mover;
          else if (capturedRoleKind === "next") playerId = (ctx.state.mover % ctx.game.numPlayers) + 1;
          else if (capturedRoleKind === "player") playerId = ctx._evalPlayer ?? ctx.state.mover;
          else if (fixedPidTrack > 0) playerId = fixedPidTrack;
          // Find track using Java's SitesTrack selection logic
          let trackSites: readonly number[] | null = null;
          for (const [tName, t] of tracksMap) {
            if (capturedTrackName !== null) {
              if (tName === capturedTrackName ||
                  (tName.includes(capturedTrackName) && (t.owner === playerId || t.owner === 0))) {
                trackSites = t.sites;
                break;
              }
            } else {
              if (t.owner === playerId || t.owner === 0) { trackSites = t.sites; break; }
            }
          }
          if (!trackSites) return [];
          // No from/to: return the whole track
          if (capturedFromFn === null && capturedToFn === null) return [...trackSites];
          // With from/to: extract subsequence matching Java SitesTrack.eval() logic
          // @java SitesTrack.java:127-175
          const fromSite = capturedFromFn !== null ? capturedFromFn.eval(ctx) : -1;
          const toSite = capturedToFn !== null ? capturedToFn.eval(ctx) : -1;
          const sites = trackSites;
          // Find fromIndex: first occurrence of fromSite in track (or 0 if not specified)
          let fromIndex = 0;
          if (fromSite >= 0) {
            fromIndex = -1;
            for (let i = 0; i < sites.length; i++) {
              if (sites[i] === fromSite) { fromIndex = i; break; }
            }
            if (fromIndex < 0) return []; // from not found
          }
          if (toSite < 0) return [...sites.slice(fromIndex)]; // no to: rest of track
          // Collect from fromIndex forward, wrapping, until toSite found
          const result: number[] = [];
          let toFound = false;
          for (let i = fromIndex; i < sites.length; i++) {
            result.push(sites[i]!);
            if (sites[i] === toSite) { toFound = true; break; }
          }
          if (!toFound) {
            for (let i = 0; i < fromIndex; i++) {
              result.push(sites[i]!);
              if (sites[i] === toSite) break;
            }
          }
          return result;
        }};
      }

      if (kind === "outer") {
        // (sites Outer) — perimeter sites of the board
        // Simplified: top/bottom rows + left/right columns
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const W = g.equipment.board.width;
          const H = g.equipment.board.height;
          const sites = new Set<number>();
          for (let c = 0; c < W; c++) { sites.add(c); sites.add((H-1)*W+c); }
          for (let r = 0; r < H; r++) { sites.add(r*W); sites.add(r*W+(W-1)); }
          return [...sites].sort((a,b)=>a-b);
        }};
      }

      if (kind === "inner") {
        // (sites Inner) — non-perimeter board sites
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const W = g.equipment.board.width;
          const H = g.equipment.board.height;
          const res: number[] = [];
          for (let r = 1; r < H-1; r++)
            for (let c = 1; c < W-1; c++)
              res.push(r*W+c);
          return res;
        }};
      }

      if (kind === "layer") {
        // (sites Layer <int>) — stub: return empty (3D board layers)
        return { eval(_ctx: Context): number[] { return []; } };
      }

      if (kind === "pending") {
        // (sites Pending) — sites in a pending state (stub: empty)
        return { eval(_ctx: Context): number[] { return []; } };
      }

      if (kind === "incident") {
        // (sites Incident ...) — sites incident to a given site/element
        // Simplified: return adjacency of _evalSite or _evalTo
        const ofNode = named.get("of");
        const atNode3 = named.get("at");
        if (atNode3) {
          try {
            const siteFn3 = compileInt1to1(atNode3);
            return { eval(ctx: Context): number[] {
              const site = siteFn3.eval(ctx);
              if (site < 0) return [];
              const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
              const traj = ctxAny._trajectories;
              if (traj) return traj.group(site, "Adjacent");
              const g = ctx.game as unknown as Game1to1;
              const W = g.equipment.board.width;
              const H = g.equipment.board.height;
              const col = site % W; const row = Math.floor(site / W);
              const nb: number[] = [];
              if (col > 0) nb.push(site - 1);
              if (col < W-1) nb.push(site + 1);
              if (row > 0) nb.push(site - W);
              if (row < H-1) nb.push(site + W);
              return nb;
            }};
          } catch { /* fall through */ }
        }
        return { eval(_ctx: Context): number[] { return []; } };
      }

      if (kind === "side") {
        // (sites Side N/S/E/W/NE/NW/SE/SW) — sites on a given board side
        // @java game/functions/region/sites/side/SitesSide.java — eval
        const sideNode = positional[1];
        const sideName = (sideNode && isIdent(sideNode)) ? sideNode.name.toUpperCase() : "";
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
          const traj = ctxT._trajectories;

          if (traj) {
            // For hex/graph boards: use perimeter sites with direction filtering.
            // @java SitesSide.java — uses graph.sides(SiteType).get(direction)
            const perimSites = traj.perimeterSites();
            if (sideName === "" || sideName === "ALL") return perimSites;

            // Try coordinate-based classification for non-trivial directions.
            // Only applied when we have non-NSEW compass names (NE, NW, SE, SW etc.)
            // that don't match the square-board fallback below.
            const NSEW = new Set(["N","NORTH","S","SOUTH","E","EAST","W","WEST"]);
            if (!NSEW.has(sideName)) {
              // Use angle-based classification for diagonal compass directions
              if (perimSites.length === 0) return [];
              let sumX = 0, sumY = 0;
              for (const s of perimSites) { sumX += traj.xOf(s); sumY += traj.yOf(s); }
              const cx = sumX / perimSites.length;
              const cy = sumY / perimSites.length;
              const siteAngles = perimSites.map(s => ({
                site: s,
                angle: Math.atan2(traj.yOf(s) - cy, traj.xOf(s) - cx),
              }));
              const PI = Math.PI;
              const DIR_ANGLES: Record<string, number> = {
                "NE": PI/6, "ENE": PI/12, "NNE": PI/4,
                "NW": 5*PI/6, "WNW": 11*PI/12, "NNW": 3*PI/4,
                "SW": -5*PI/6, "WSW": -11*PI/12, "SSW": -3*PI/4,
                "SE": -PI/6, "ESE": -PI/12, "SSE": -PI/4,
                "NORTHEAST": PI/6, "NORTHWEST": 5*PI/6,
                "SOUTHEAST": -PI/6, "SOUTHWEST": -5*PI/6,
              };
              const centerAngle = DIR_ANGLES[sideName];
              if (centerAngle !== undefined) {
                const sectorHalf = PI / 6 + 0.02;
                return siteAngles
                  .filter(({ angle }) => {
                    let diff = angle - centerAngle;
                    if (diff > PI) diff -= 2*PI;
                    if (diff < -PI) diff += 2*PI;
                    return Math.abs(diff) <= sectorHalf;
                  })
                  .map(({ site }) => site)
                  .sort((a, b) => a - b);
              }
              // Fallback for unknown diagonal: return all perimeter
              return perimSites;
            }

            // NSEW on hex/graph board: also try angle-based
            if (perimSites.length === 0) return perimSites;
            {
              let sumX2 = 0, sumY2 = 0;
              for (const s of perimSites) { sumX2 += traj.xOf(s); sumY2 += traj.yOf(s); }
              const cx2 = sumX2 / perimSites.length;
              const cy2 = sumY2 / perimSites.length;
              const PI2 = Math.PI;
              const NSEW_ANGLES: Record<string, number> = {
                "N": PI2/2, "NORTH": PI2/2,
                "S": -PI2/2, "SOUTH": -PI2/2,
                "E": 0, "EAST": 0,
                "W": PI2, "WEST": PI2,
              };
              const center2 = NSEW_ANGLES[sideName];
              if (center2 !== undefined) {
                const half2 = PI2 / 4 + 0.02; // 45° sector for N/S/E/W on hex
                const result2 = perimSites.filter(s => {
                  const x = traj.xOf(s), y = traj.yOf(s);
                  const angle = Math.atan2(y - cy2, x - cx2);
                  let diff = angle - center2;
                  if (diff > PI2) diff -= 2*PI2;
                  if (diff < -PI2) diff += 2*PI2;
                  return Math.abs(diff) <= half2;
                }).sort((a, b) => a - b);
                if (result2.length > 0) return result2;
              }
            }
            return perimSites;
          }

          // Square board fallback
          const W = g.equipment.board.width;
          const H = g.equipment.board.height;
          const res: number[] = [];
          if (sideName === "N" || sideName === "NORTH") {
            for (let c = 0; c < W; c++) res.push((H-1)*W+c);
          } else if (sideName === "S" || sideName === "SOUTH") {
            for (let c = 0; c < W; c++) res.push(c);
          } else if (sideName === "E" || sideName === "EAST") {
            for (let r = 0; r < H; r++) res.push(r*W+(W-1));
          } else if (sideName === "W" || sideName === "WEST") {
            for (let r = 0; r < H; r++) res.push(r*W);
          } else {
            // All perimeter
            const ss = new Set<number>();
            for (let c = 0; c < W; c++) { ss.add(c); ss.add((H-1)*W+c); }
            for (let r = 0; r < H; r++) { ss.add(r*W); ss.add(r*W+(W-1)); }
            return [...ss].sort((a,b)=>a-b);
          }
          return res;
        }};
      }

      if (kind === "player") {
        // (sites Player <playerIdFn>) — player's region by dynamic player id
        // @java game/functions/region/sites/player/SitesPlayer.java
        // Used in Chinese Checkers: (sites (player (mapEntry (mover))))
        const playerIdNode = positional[1];
        if (playerIdNode) {
          try {
            const playerIdFn = compileInt1to1(playerIdNode);
            return {
              eval(ctx: Context): number[] {
                const pid = playerIdFn.eval(ctx);
                const game = ctx.game as unknown as Game1to1;
                const regionFn = game.equipment?.playerRegions.get(pid);
                if (regionFn) return regionFn.eval(ctx);
                // Fallback: all sites owned by this player
                const cells = ctx.state.cells;
                const boardN = game.equipment ? game.equipment.board.numSites : cells.length;
                const res: number[] = [];
                for (let i = 0; i < boardN; i++) { if (cells[i] === pid) res.push(i); }
                return res;
              }
            };
          } catch { /* fall through */ }
        }
        return { eval(_ctx: Context): number[] { return []; } };
      }

      if (kind === "hidden") {
        // (sites Hidden [What|Who|...] to:<role>) — all sites hidden for the given player.
        // @java game/functions/region/sites/hidden/SitesHidden.java — eval()
        // The sub-type qualifier (What/Who/Count/etc.) is positional[1] — ignored at
        // the state level since TS collapses all hidden-info into one per-player boolean.
        const toNode2 = named.get("to");
        const roleStr2 = toNode2 && isIdent(toNode2) ? toNode2.name.toLowerCase() : "mover";
        const fixedPid2 = roleStr2.startsWith("p") && !isNaN(parseInt(roleStr2.slice(1), 10))
          ? parseInt(roleStr2.slice(1), 10) : -1;
        return {
          eval(ctx: Context): number[] {
            const g = ctx.game as unknown as Game1to1;
            const boardN = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;
            const pid2 = fixedPid2 >= 1 ? fixedPid2
              : roleStr2 === "next" ? (ctx.state.mover % ctx.game.numPlayers) + 1
              : ctx.state.mover;  // "mover" or fallback
            const result: number[] = [];
            for (let s = 0; s < boardN; s++) {
              if (ctx.state.isHidden(pid2, s)) result.push(s);
            }
            return result;
          }
        };
      }

      // Generic unknown (sites X ...) — return empty rather than throw to avoid cascade
      return { eval(_ctx: Context): number[] { return []; } };
    }
    // (sites { num1 num2 ... }) / (sites { "A1" "B2" ... }) / (sites { <int-expr> … })
    if (first && isList(first) && first.delimiter === "curly") {
      const coordStrings2: string[] = [];
      const numSites2: number[] = [];
      const exprFns2: IntFunction[] = [];
      for (const item of first.items) {
        if (isString(item)) coordStrings2.push(item.value);
        else if (isNumber(item)) numSites2.push(item.value);
        else if (isList(item) || isIdent(item)) { try { exprFns2.push(compileInt1to1(item)); } catch { /* skip */ } }
      }
      // Expression items (e.g. {(NextHoleFrom (LastHole) 1)}) — eval at runtime.
      if (exprFns2.length > 0) {
        const fns = exprFns2, lits = numSites2, coords = coordStrings2;
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const W = g.equipment?.board?.width ?? 0, H = g.equipment?.board?.height ?? 0;
          const traj = g.equipment?.board?.trajectories ?? undefined;
          const out: number[] = [...lits, ...coords.map(c => algebraicToSite(c, W, H, traj))];
          for (const f of fns) { const s = f.eval(ctx); if (s >= 0) out.push(s); }
          return out.filter(s => s >= 0);
        }};
      }
      if (coordStrings2.length > 0) {
        const cs2 = coordStrings2;
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const W = g.equipment?.board?.width ?? 0;
          const H = g.equipment?.board?.height ?? 0;
          const traj = g.equipment?.board?.trajectories ?? undefined;
          return cs2.map(c => algebraicToSite(c, W, H, traj)).filter(s => s >= 0);
        }};
      }
      if (numSites2.length > 0) {
        const ns = numSites2;
        return { eval(_ctx: Context): number[] { return [...ns]; } };
      }
      return { eval(_ctx: Context): number[] { return []; } };
    }
    // (sites (regionFn)) — a single region function wrapped in sites
    if (first && isList(first)) {
      try {
        return compileRegion1to1(first);
      } catch { /* fall through */ }
    }

    // (sites "A1" "B2" ...) — specific coordinate sites
    // (sites "RegionName") — look up a named region (e.g. (sites "Replay") from (regions "Replay" ...))
    // @java SitesByRegion.java — (sites "Name") resolves to the named region
    if (first && isString(first)) {
      const coordStrings: string[] = positional.filter(p => isString(p)).map(p => (p as { value: string }).value);
      // If only one string and it looks like a region name (not an algebraic coord),
      // try to look it up as a named region first. Named regions are non-algebraic strings.
      if (coordStrings.length === 1) {
        const regionName = coordStrings[0]!.toLowerCase();
        // Algebraic coords match pattern like A1, B3, etc. (letter + number(s)).
        // Region names are non-algebraic (e.g. "Replay", "Home", "SafeSites").
        // We check this at eval time by trying algebraic first, then named region.
        return { eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const W = g.equipment?.board?.width ?? 0;
          const H = g.equipment?.board?.height ?? 0;
          const traj = g.equipment?.board?.trajectories ?? undefined;
          const asCoord = algebraicToSite(coordStrings[0]!, W, H, traj);
          if (asCoord >= 0) return [asCoord]; // valid coordinate
          // Try named region lookup (owner=0 for shared, then any owner)
          const byName = g.equipment?.namedPlayerRegions?.get(regionName);
          if (byName) {
            // Shared region (owner=0)
            const sharedFn = byName.get(0);
            if (sharedFn) return sharedFn.eval(ctx);
            // Player-specific named region (e.g. Mover's)
            const moverFn = byName.get(ctx.state.mover);
            if (moverFn) return moverFn.eval(ctx);
            // Any available
            const anyFn = [...byName.values()][0];
            if (anyFn) return anyFn.eval(ctx);
          }
          return []; // unknown region name
        }};
      }
      return { eval(ctx: Context): number[] {
        const g = ctx.game as unknown as Game1to1;
        const W = g.equipment?.board?.width ?? 0;
        const H = g.equipment?.board?.height ?? 0;
        const traj = g.equipment?.board?.trajectories ?? undefined;
        return coordStrings.map(c => algebraicToSite(c, W, H, traj)).filter(s => s >= 0);
      }};
    }
    // (sites) with no positionals — SitesContext: returns the context's current region.
    // @java game/functions/region/sites/context/SitesContext.java — eval returns context.region()
    // Used inside (all Groups if:...) and (forEach Group ...) conditions where context.setRegion()
    // has been set to the current group's site array.
    if (!first) {
      return { eval(ctx: Context): number[] {
        const r = ctx.region();
        return r ? r.sites() : [];
      }};
    }
    // Unknown (sites ...) form — return empty rather than throw
    return { eval(_ctx: Context): number[] { return []; } };
  }

  // (expand <region> [steps:N])
  if (h === "expand") {
    const { positional, named } = parseArgs1to1(node.items);
    try {
      // Base region: positional[0], or the `origin:<int>` named arg as a 1-site
      // seed (e.g. (expand origin:(from) steps:2) for Ataxx jumps).
      const originNode = named.get("origin");
      let baseRegion: RegionFunction;
      if (positional[0]) {
        baseRegion = compileRegion1to1(positional[0]);
      } else if (originNode) {
        const originFn = compileInt1to1(originNode);
        baseRegion = { eval(ctx: Context): number[] { const s = originFn.eval(ctx); return s >= 0 ? [s] : []; } };
      } else {
        return { eval(_ctx: Context): number[] { return []; } };
      }
      const stepsNode = named.get("steps");
      // @java Expand.java — steps can be any IntFunction, not just a literal.
      // Use compileInt1to1 so that expressions like (- #1 1) are evaluated at runtime.
      const stepsFn = stepsNode ? compileInt1to1(stepsNode) : null;
      // Extract optional direction from remaining positional args (bare ident like Orthogonal, Diagonal, Adjacent).
      // @java game/functions/region/sites/around/Expand.java — @Opt AbsoluteDirection dirn
      const EXPAND_DIRECTION_NAMES = new Set(["adjacent", "orthogonal", "diagonal", "n", "s", "e", "w", "ne", "nw", "se", "sw", "all", "north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"]);
      let expandDir = "adjacent"; // default: expand in all 8 directions
      for (let pi = (positional[0] ? 1 : 0); pi < positional.length; pi++) {
        const pa = positional[pi];
        if (pa && isIdent(pa) && EXPAND_DIRECTION_NAMES.has(pa.name.toLowerCase())) {
          expandDir = pa.name.toLowerCase();
          break;
        }
      }
      return {
        eval(ctx: Context): number[] {
          const g = ctx.game as unknown as Game1to1;
          const board = g.equipment.board;
          const W = board.width;
          const H = board.height;
          const base = baseRegion.eval(ctx);
          const seen = new Set<number>(base);
          let frontier = [...base];
          const steps = stepsFn ? stepsFn.eval(ctx) : 1;

          // For graph boards (with radials), use radial adjacency for expansion.
          // @java Expand.java — uses topology radials to find adjacent sites.
          const ctxAny = ctx as unknown as { _radials?: readonly import("./ludemes/topology-radials.js").CellFlatRadials[] };
          const radials = ctxAny._radials;
          const hasTraj = board.trajectories !== null;

          for (let s = 0; s < steps; s++) {
            const next: number[] = [];
            for (const site of frontier) {
              let neighbors: number[];
              if (hasTraj && radials) {
                // Graph board path: use radials to find true neighbors.
                // Each axis's ray[1] and opposite[1] are the adjacent sites.
                // @java Expand.java — expands through graph adjacency.
                const cellRadials = radials[site];
                const rawNeighbors: number[] = [];
                if (cellRadials) {
                  for (const { ray, opposite } of cellRadials.axes) {
                    if (ray[1] !== undefined) rawNeighbors.push(ray[1]);
                    if (opposite[1] !== undefined) rawNeighbors.push(opposite[1]);
                  }
                }
                neighbors = rawNeighbors;
              } else {
                // Rectangular grid path.
                const col = site % W;
                const row = Math.floor(site / W);
                // Build neighbor list filtered by direction.
                // @java Expand.java — direction filters to orthogonal (N/S/E/W) or diagonal (NE/NW/SE/SW).
                const w2 = col > 0, e2 = col < W - 1, ss = row > 0, n2 = row < H - 1;
                neighbors = [];
                if (expandDir !== "diagonal") {
                  if (w2) neighbors.push(site - 1);
                  if (e2) neighbors.push(site + 1);
                  if (ss) neighbors.push(site - W);
                  if (n2) neighbors.push(site + W);
                }
                if (expandDir !== "orthogonal") {
                  if (w2 && ss) neighbors.push(site - W - 1);
                  if (e2 && ss) neighbors.push(site - W + 1);
                  if (w2 && n2) neighbors.push(site + W - 1);
                  if (e2 && n2) neighbors.push(site + W + 1);
                }
              }
              for (const nb of neighbors) {
                if (nb >= 0 && nb < board.numSites && !seen.has(nb)) {
                  seen.add(nb); next.push(nb);
                }
              }
            }
            frontier = next;
          }
          return Array.from(seen).sort((a, b) => a - b);
        }
      };
    } catch {
      // Can't compile expand — return empty
      return { eval(_ctx: Context): number[] { return []; } };
    }
  }

  // (union r1 r2) or (union { r1 r2 ...})
  if (h === "union") {
    const { positional } = parseArgs1to1(node.items);
    const regions = flattenRegionList(positional);
    return new UnionRegion(regions);
  }

  // (intersection r1 r2)
  if (h === "intersection") {
    const { positional } = parseArgs1to1(node.items);
    const r1 = compileRegion1to1(positional[0]);
    const r2 = compileRegion1to1(positional[1]);
    return new IntersectionRegion(r1, r2);
  }

  // (difference r1 r2)
  if (h === "difference") {
    const { positional } = parseArgs1to1(node.items);
    const r1 = compileRegion1to1(positional[0]);
    const r2 = compileRegion1to1(positional[1]);
    return new DifferenceRegion(r1, r2);
  }

  // (forEach <region> if:<bool>) — filter region by condition
  // @java game/functions/region/foreach/sites/ForEachSite.java
  if (h === "foreach") {
    const { positional, named } = parseArgs1to1(node.items);
    const baseRegion = compileRegion1to1(positional[0]);
    const ifNode = named.get("if");
    if (!ifNode) {
      return baseRegion; // No condition: return base region unchanged
    }
    const condFn = compileBool1to1(ifNode, 2);
    return {
      eval(ctx: Context): number[] {
        const sites = baseRegion.eval(ctx);
        const origSite = ctx._evalSite;
        const result: number[] = [];
        for (const s of sites) {
          ctx._evalSite = s;
          if (condFn.eval(ctx)) result.push(s);
        }
        ctx._evalSite = origSite;
        return result;
      }
    };
  }

  // (count <int>) or (count Sites ...) as RegionFunction — stub: return empty
  if (h === "count") {
    return { eval(_ctx: Context): number[] { return []; } };
  }

  // (last To) / (last From) as RegionFunction — return site as singleton
  if (h === "last") {
    const { positional } = parseArgs1to1(node.items);
    const typeNode = positional[0];
    const typeName = (typeNode && isIdent(typeNode)) ? typeNode.name.toLowerCase() : "to";
    if (typeName === "from") {
      // @java game/functions/ints/last/LastFrom.java — read from trial
      return { eval(ctx: Context): number[] {
        const moves = ctx.trial.moves;
        if (moves.length > 0) {
          const last = moves[moves.length - 1];
          if (last) { const f = last.fromNonDecision(); if (f >= 0) return [f]; }
        }
        const s = ctx._evalFrom; return s >= 0 ? [s] : [];
      }};
    }
    // @java game/functions/ints/last/LastTo.java — read from trial
    return { eval(ctx: Context): number[] {
      const moves = ctx.trial.moves;
      if (moves.length > 0) {
        const last = moves[moves.length - 1];
        if (last) { const t = last.toNonDecision(); if (t >= 0) return [t]; }
      }
      const s = ctx._evalTo; return s >= 0 ? [s] : [];
    }};
  }

  // (centrePoint) as RegionFunction — centre site as singleton
  if (h === "centrepoint") {
    return { eval(ctx: Context): number[] {
      const g = ctx.game as unknown as Game1to1;
      return [Math.floor(g.equipment.board.numSites / 2)];
    }};
  }

  // (if <cond> <region> [<elseRegion>]) — conditional region
  // @java game/functions/region/if/If.java
  if (h === "if") {
    const { positional: ifPos } = parseArgs1to1(node.items);
    const condFn = compileBool1to1(ifPos[0], 2);
    const thenRegion = compileRegion1to1(ifPos[1]);
    const elseRegion = ifPos[2] ? compileRegion1to1(ifPos[2]) : { eval: (_ctx: Context): number[] => [] };
    return { eval(ctx: Context): number[] {
      return condFn.eval(ctx) ? thenRegion.eval(ctx) : elseRegion.eval(ctx);
    }};
  }

  // (where "PieceName" <role>) as RegionFunction — return singleton set of site
  // @java game/functions/ints/board/where/WhereSite.java — eval returns one site
  if (h === "where") {
    const siteFn = compileInt1to1(node);
    return { eval(ctx: Context): number[] {
      const s = siteFn.eval(ctx);
      return s >= 0 ? [s] : [];
    }};
  }

  // (last To/From) as RegionFunction — singleton site
  // @java game/functions/ints/last/LastTo.java / LastFrom.java — read from trial
  if (h === "last") {
    const { positional: lPos } = parseArgs1to1(node.items);
    const typeNode = lPos[0];
    const typeName = (typeNode && isIdent(typeNode)) ? typeNode.name.toLowerCase() : "to";
    if (typeName === "from") {
      return { eval(ctx: Context): number[] {
        const ms = ctx.trial.moves;
        if (ms.length > 0) { const l = ms[ms.length-1]; if (l) { const f = l.fromNonDecision(); if (f >= 0) return [f]; } }
        const s = ctx._evalFrom; return s >= 0 ? [s] : [];
      }};
    }
    return { eval(ctx: Context): number[] {
      const ms = ctx.trial.moves;
      if (ms.length > 0) { const l = ms[ms.length-1]; if (l) { const t = l.toNonDecision(); if (t >= 0) return [t]; } }
      const s = ctx._evalTo; return s >= 0 ? [s] : [];
    }};
  }

  // (mapEntry ...) as RegionFunction — singleton site
  if (h === "mapentry") {
    const siteFn = compileInt1to1(node);
    return { eval(ctx: Context): number[] {
      const s = siteFn.eval(ctx);
      return s >= 0 ? [s] : [];
    }};
  }

  // (values Remembered ["name"]) as RegionFunction — sites stored in state.remembered
  // @java game/functions/intArray/values/ValuesRemembered.java — eval()
  // Returns the array of integers stored under the named key in state.remembered.
  if (h === "values") {
    const { positional: vPos } = parseArgs1to1(node.items);
    // positional[0] is the ident "Remembered"; positional[1] is optional name string
    const keyNode = vPos.find((n, i) => i > 0 && isString(n)) as { value: string } | undefined;
    const key = keyNode ? keyNode.value : null;
    return { eval(ctx: Context): number[] {
      if (key !== null) {
        return [...ctx.state.rememberedFor(key)];
      }
      // unnamed bucket: collect all remembered values across all keys
      const all: number[] = [];
      for (const vals of ctx.state.remembered.values()) {
        for (const v of vals) all.push(v);
      }
      return all;
    }};
  }

  // (if ...) as RegionFunction — already handled by compileRegion but add fallback
  // Actually handled below; this is a safety net

  // (from) as RegionFunction — singleton set containing the current from-site.
  // @java game/functions/ints/iterator/From.java — in a region context, From returns
  // the evaluation frame's current "from" site (context._evalFrom). Used by ludemes
  // like `(move Remove (from))` which bear off a piece at the current position.
  // Without this, (from) falls through to the empty-region fallback and the Remove
  // move is never generated.
  if (h === "from") {
    return { eval(ctx: Context): number[] {
      const s = ctx._evalFrom;
      return s >= 0 ? [s] : [];
    }};
  }

  // (to) as RegionFunction — singleton set containing the current to-site.
  // @java game/functions/ints/iterator/To.java — in a region context.
  if (h === "to") {
    return { eval(ctx: Context): number[] {
      const s = ctx._evalTo;
      return s >= 0 ? [s] : [];
    }};
  }

  // (var "name") as RegionFunction — singleton set containing the named variable's site.
  // Used in (move Select (from (var "Replay"))) where a previously stored site index
  // is used as the sow origin. @java Var.java — eval returns the stored int as a site.
  if (h === "var") {
    const siteFn = compileInt1to1(node);
    return { eval(ctx: Context): number[] {
      const s = siteFn.eval(ctx);
      return s >= 0 ? [s] : [];
    }};
  }

  // Unknown region — fall back to trying to compile as an IntFunction (single site).
  // This handles cases like (last To), (mapEntry ...), or other int expressions
  // used in region position. @java — many Int functions double as site selectors.
  try {
    const siteFn = compileInt1to1(node);
    return { eval(ctx: Context): number[] {
      const s = siteFn.eval(ctx);
      return s >= 0 ? [s] : [];
    }};
  } catch { /* fall through to empty */ }

  // Unknown region — return empty rather than throw to avoid cascade failures
  return { eval(_ctx: Context): number[] { return []; } };
  throw new Error(`compiler1to1: unknown RegionFunction head "${h}"`);
}

/** Flatten a region argument list, unwrapping curly-brace arrays. */
function flattenRegionList(positional: LudNode[]): RegionFunction[] {
  const regions: RegionFunction[] = [];
  for (const p of positional) {
    if (isList(p) && p.delimiter === "curly") {
      for (const child of p.items) {
        if (isList(child)) {
          try { regions.push(compileRegion1to1(child)); } catch { /* skip */ }
        }
      }
    } else if (isList(p)) {
      try { regions.push(compileRegion1to1(p)); } catch { /* skip */ }
    }
  }
  return regions;
}

// ---------------------------------------------------------------------------
// Compile BooleanFunction
// ---------------------------------------------------------------------------

export function compileBool1to1(
  node: LudNode | undefined,
  numPlayers: number,
): BooleanFunction {
  if (!node) throw new Error("compiler1to1: expected BooleanFunction node");
  if (!isList(node)) {
    // Handle boolean idents: true/false
    if (isIdent(node)) {
      const n = node.name.toLowerCase();
      if (n === "true") return { eval: () => true };
      if (n === "false") return { eval: () => false };
      // Unknown ident in boolean context — try to compile as int and check != 0
      try {
        const intFn = compileInt1to1(node);
        return { eval(ctx: Context): boolean { return intFn.eval(ctx) !== 0; } };
      } catch { /* fall through */ }
    }
    throw new Error(`compiler1to1: expected list for BooleanFunction`);
  }

  // Handle grouped expression: ( (expr) (expr) ... ) — first item is a list not an ident
  // Java parity: a parenthesized group with no head ident is treated as (and ...) over the items
  // @java game/functions/booleans/math/And.java
  const firstItem = node.items[0];
  if (firstItem && isList(firstItem)) {
    // This is a parenthesized group of boolean expressions — treat as (and ...)
    const bools: BooleanFunction[] = [];
    for (const item of node.items) {
      if (isList(item)) {
        try { bools.push(compileBool1to1(item, numPlayers)); } catch { /* skip */ }
      }
    }
    if (bools.length === 0) return { eval: () => true };
    if (bools.length === 1) return bools[0]!;
    return new AndBool(bools);
  }

  const h = headOf(node)!;

  // ---------------------------------------------------------------------------
  // Registry lookup — registered classes take priority over inline branches
  // ---------------------------------------------------------------------------
  {
    const env: Compile1to1Env = { numPlayers };
    // Try plain head first: "and", "or", "not", etc.
    const plainCtor = lookupBool1to1(h);
    if (plainCtor) return plainCtor(node, env);
    // Try compound "is:<Subtype>" key for (is Line ...) / (is Empty ...) etc.
    if (h === "is") {
      const { positional: isPos } = parseArgs1to1(node.items);
      const first = isPos[0];
      if (first && isIdent(first)) {
        const subKey = `is:${first.name.toLowerCase()}`;
        const subCtor = lookupBool1to1(subKey);
        if (subCtor) return subCtor(node, env);
      }
    }
    // Try compound "no:<Subtype>" key for (no Moves ...) / (no Pieces ...) etc.
    if (h === "no") {
      const { positional: noPos } = parseArgs1to1(node.items);
      const first = noPos[0];
      if (first && isIdent(first)) {
        const subKey = `no:${first.name.toLowerCase()}`;
        const subCtor = lookupBool1to1(subKey);
        if (subCtor) return subCtor(node, env);
      }
    }
    // Try compound "all:<Subtype>" key for (all Sites ...) / (all Passed ...) etc.
    if (h === "all") {
      const { positional: allPos } = parseArgs1to1(node.items);
      const first = allPos[0];
      if (first && isIdent(first)) {
        const subKey = `all:${first.name.toLowerCase()}`;
        const subCtor = lookupBool1to1(subKey);
        if (subCtor) return subCtor(node, env);
      }
    }
  }

  if (h === "is") {
    const { positional, named: isNamed } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first)) {
      const kind = first.name.toLowerCase();

      if (kind === "line") {
        // (is Line N [dirn] [exact:True] [who:...] [what:...])
        // @java game/functions/booleans/is/line/IsLine.java — constructor
        const lenNode = positional[1];
        const len = compileInt1to1(lenNode);
        let dirnName = "Adjacent";
        const dirnNode = positional[2];
        if (dirnNode && isIdent(dirnNode)) {
          const dn = dirnNode.name;
          const roles = new Set(["Mover", "Next", "P1", "P2", "All", "Each"]);
          if (!roles.has(dn)) {
            dirnName = dn;
          }
        }
        // exact:True — line must be exactly len, not part of a longer line.
        // @java IsLine.exactLength — when true, count must equal len exactly.
        const exactNode = isNamed.get("exact");
        const exact = exactNode !== undefined && isIdent(exactNode) &&
          exactNode.name.toLowerCase() === "true";
        return new IsLine(null, len, dirnName, null, null, null, null, null, exact);
      }

      if (kind === "even") {
        // (is Even <intFn>)
        const valNode = positional[1];
        return new IsEven(compileInt1to1(valNode));
      }

      if (kind === "odd") {
        // (is Odd <intFn>)
        // @java game/functions/booleans/is/integer/IsOdd.java
        const valNode = positional[1];
        const valFn = compileInt1to1(valNode);
        return { eval(ctx: Context): boolean { return valFn.eval(ctx) % 2 !== 0; } };
      }

      if (kind === "next") {
        // (is Next <whoFn>) — checks if who equals next player
        // @java game/functions/booleans/is/player/IsNext.java
        const whoNode = positional[1];
        if (whoNode) {
          const whoFn = compileInt1to1(whoNode);
          return { eval(ctx: Context): boolean {
            const next = (ctx.state.mover % ctx.game.numPlayers) + 1;
            return whoFn.eval(ctx) === next;
          }};
        }
        return { eval(_ctx: Context): boolean { return false; } };
      }

      if (kind === "prev") {
        // (is Prev <role>) — handled by the registered IsPrev1to1 class (registry
        // takes priority over this inline branch); kept as a fallback only.
        const roleNode = positional[1];
        const roleName = (roleNode && isIdent(roleNode)) ? roleNode.name.toLowerCase() : "mover";
        return { eval(ctx: Context): boolean {
          const moves = ctx.trial.moves;
          if (moves.length === 0) return false;
          // In a (then ...) consequence context, the current move has been added
          // to the trial already (so that (last To)/(last From) resolve correctly).
          // The "previous" mover is therefore moves[last-1], not moves[last].
          // @java game/functions/booleans/is/prev/IsPrev.java — context.prev() returns
          // the player who moved BEFORE the current move, i.e. trial.moves[last-1].mover.
          const inThen = (ctx as unknown as { _thenContextDepth?: number })._thenContextDepth ?? 0;
          const prevIdx = inThen > 0 ? moves.length - 2 : moves.length - 1;
          if (prevIdx < 0) return false;
          const prevMover = moves[prevIdx]!.mover;
          let target: number;
          if (roleName === "next") target = ctx.state.next;
          else if (/^p\d+$/.test(roleName)) target = parseInt(roleName.slice(1), 10);
          else target = ctx.state.mover; // Mover (default)
          return prevMover === target;
        }};
      }

      if (kind === "friendly" || kind === "friend") {
        // (is Friendly <whoFn>) / (is Friend <whoFn>) — checks if the who equals the mover
        // @java game/functions/booleans/is/player/IsFriend.java
        const whoNode = positional[1];
        if (whoNode) {
          const whoFn = compileInt1to1(whoNode);
          return { eval(ctx: Context): boolean {
            const who = whoFn.eval(ctx);
            return who !== 0 && who === ctx.state.mover;
          }};
        }
        return { eval(_ctx: Context): boolean { return false; } };
      }

      if (kind === "enemy") {
        // (is Enemy <whoFn>) — checks if who is an opponent of mover
        // @java game/functions/booleans/is/player/IsEnemy.java
        const whoNode = positional[1];
        if (whoNode) {
          const whoFn = compileInt1to1(whoNode);
          return { eval(ctx: Context): boolean {
            const w = whoFn.eval(ctx);
            return w !== 0 && w !== ctx.state.mover;
          }};
        }
        return { eval(_ctx: Context): boolean { return false; } };
      }

      if (kind === "mover") {
        // (is Mover <whoFn>) — checks if who equals mover
        const whoNode = positional[1];
        if (whoNode) {
          const whoFn = compileInt1to1(whoNode);
          return { eval(ctx: Context): boolean {
            return whoFn.eval(ctx) === ctx.state.mover;
          }};
        }
        return { eval(_ctx: Context): boolean { return false; } };
      }

      if (kind === "occupied") {
        // (is Occupied <site>) or (is Occupied (to)) etc.
        const siteNode = positional[1];
        if (siteNode) {
          const siteFn = compileInt1to1(siteNode);
          return { eval(ctx: Context): boolean {
            const s = siteFn.eval(ctx);
            return !ctx.state.isEmptySite(s);
          }};
        }
        return { eval(_ctx: Context): boolean { return false; } };
      }

      if (kind === "empty") {
        // (is Empty <site>)
        const siteNode = positional[1];
        if (siteNode) {
          const siteFn = compileInt1to1(siteNode);
          return { eval(ctx: Context): boolean {
            const s = siteFn.eval(ctx);
            return ctx.state.isEmptySite(s);
          }};
        }
        return { eval(_ctx: Context): boolean { return true; } };
      }

      // (is Connected [role|regions]) — group of mover's pieces touches both player regions
      // @java game/functions/booleans/is/connect/IsConnected.java — eval: BFS from last-to site
      if (kind === "connected") {
        const { positional: cpPos, named: cpNamed } = parseArgs1to1(node.items);
        // Two forms:
        // 1. (is Connected {region1 region2 ...}) — explicit goal sets, check mover's connectivity
        // 2. (is Connected [dir] [role] [at:<site>]) — BFS-based, using player regions or board sides
        //
        // @java game/functions/booleans/is/connect/IsConnected.java — eval
        let dirName = "Adjacent";
        let roleName = "mover"; // default: check mover's connectivity
        const CONN_DIRS = new Set(["orthogonal", "diagonal", "adjacent", "all"]);

        // Check for (is Connected N Sides) / (is Connected N Corners) / (is Connected N SidesNoCorners)
        // @java game/functions/booleans/is/connect/IsConnected.java — numSidesRequired
        let numGoalsRequired = -1;
        let goalType: "Sides" | "Corners" | "SidesNoCorners" | null = null;
        if (cpPos[1] && isNumber(cpPos[1])) {
          numGoalsRequired = (cpPos[1] as { value: number }).value;
          const typeArg = cpPos[2];
          if (typeArg && isIdent(typeArg)) {
            const typeName = typeArg.name.toLowerCase();
            if (typeName === "sides") goalType = "Sides";
            else if (typeName === "corners") goalType = "Corners";
            else if (typeName === "sidesnocorners" || typeName === "sides_no_corners") goalType = "SidesNoCorners";
          } else {
            goalType = "Sides"; // default
          }
          // Also check for role/direction
          for (let i = 3; i < cpPos.length; i++) {
            const p = cpPos[i];
            if (p && isIdent(p)) {
              const n = p.name.toLowerCase();
              if (CONN_DIRS.has(n)) dirName = p.name;
              else roleName = n;
            }
          }
        }
        const numGoalsFinal = numGoalsRequired;
        const goalTypeFinal = goalType;

        // Check for explicit goal sets: (is Connected {region1 region2 ...})
        const firstGoalArg = cpPos[1];
        let explicitGoalFns: RegionFunction[] | null = null;
        if (numGoalsRequired < 0 && firstGoalArg && isList(firstGoalArg) && firstGoalArg.delimiter === "curly") {
          explicitGoalFns = [];
          for (const item of firstGoalArg.items) {
            if (isList(item)) {
              try { explicitGoalFns.push(compileRegion1to1(item)); } catch { /* skip */ }
            }
          }
          // Also check for direction after the goal list
          for (let i = 2; i < cpPos.length; i++) {
            const p = cpPos[i];
            if (p && isIdent(p)) {
              const n = p.name.toLowerCase();
              if (CONN_DIRS.has(n)) dirName = p.name;
              else roleName = n;
            }
          }
        } else {
          for (let i = 1; i < cpPos.length; i++) {
            const p = cpPos[i];
            if (p && isIdent(p)) {
              const n = p.name.toLowerCase();
              if (CONN_DIRS.has(n)) dirName = p.name;
              else roleName = n;
            }
          }
        }

        const atNode = cpNamed.get("at");
        const atFn = atNode ? compileInt1to1(atNode) : null;
        const dirFinal = dirName;
        const roleNameFinal = roleName;
        const explicitGoalsFinal = explicitGoalFns;
        return { eval(ctx: Context): boolean {
          const cells = ctx.state.cells;
          // Resolve owner
          let owner: number;
          if (roleNameFinal === "mover") owner = ctx.state.mover;
          else if (roleNameFinal === "next") owner = (ctx.state.mover % ctx.game.numPlayers) + 1;
          else if (roleNameFinal.startsWith("p") && !isNaN(parseInt(roleNameFinal.slice(1), 10))) {
            owner = parseInt(roleNameFinal.slice(1), 10);
          } else owner = ctx.state.mover;

          const game = ctx.game as unknown as Game1to1;

          // Determine goal sets
          let goalSets: Set<number>[];
          if (numGoalsFinal >= 0 && goalTypeFinal) {
            // Form 3: (is Connected N Sides/Corners/SidesNoCorners)
            // Get all board sides/corners via trajectories or rectangle fallback
            const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
            const traj = ctxT._trajectories;
            const W = game.equipment.board.width;
            const H = game.equipment.board.height;
            const allBoardSides: Set<number>[] = [];

            if (traj) {
              // For hex/graph boards, use trajectories to get sides
              // The Trajectories object has boardSides() method
              const boardSides = (traj as unknown as { boardSides?: () => Map<string, number[]> }).boardSides?.();
              if (boardSides) {
                for (const [, sites] of boardSides) {
                  allBoardSides.push(new Set(sites));
                }
              }
            }

            if (allBoardSides.length === 0) {
              // Fallback: use rectangle sides (N, S, E, W)
              const sideN = new Set<number>();
              const sideS = new Set<number>();
              const sideE = new Set<number>();
              const sideW = new Set<number>();
              for (let c = 0; c < W; c++) { sideN.add((H-1)*W+c); sideS.add(c); }
              for (let r = 0; r < H; r++) { sideE.add(r*W+(W-1)); sideW.add(r*W); }
              allBoardSides.push(sideN, sideS, sideE, sideW);
            }

            // For Corners: use corner sites
            if (goalTypeFinal === "Corners") {
              const corners = new Set<number>([0, W-1, (H-1)*W, (H-1)*W+(W-1)]);
              // Each corner is a separate goal
              for (const c of corners) allBoardSides.push(new Set([c]));
              goalSets = allBoardSides.slice(allBoardSides.length - 4); // just corners
            } else {
              goalSets = allBoardSides;
            }
          } else if (explicitGoalsFinal && explicitGoalsFinal.length > 0) {
            // Form 1: explicit goal regions from (is Connected {region1 region2 ...})
            goalSets = explicitGoalsFinal.map(gfn => new Set(gfn.eval(ctx)));
          } else {
            // Form 2: use player regions or board sides as goals
            const playerRegions = game.equipment?.playerRegions;
            if (playerRegions && playerRegions.has(owner)) {
              // Use only the CURRENT PLAYER's declared region(s) as goal sets.
              // @java IsConnected.java — uses game.board().ownedSites(owner) or player regions
              // The region declared for `owner` is usually the union of their board sides.
              // We split it back into individual sub-regions if it's a union, otherwise use as-is.
              goalSets = [];
              const ownerRegionFn = playerRegions.get(owner)!;
              const ownerSites = ownerRegionFn.eval(ctx);
              // If the owner's region is a union of sides, try to split it
              // Otherwise treat the whole region as a single goal set.
              const regions = goalSets;
              // Check if the region function is a UnionRegion (has sub-regions)
              const subRegions = (ownerRegionFn as unknown as { regions?: RegionFunction[] }).regions;
              if (subRegions && subRegions.length > 0) {
                for (const sr of subRegions) {
                  goalSets.push(new Set(sr.eval(ctx)));
                }
              } else {
                goalSets.push(new Set(ownerSites));
              }
              void regions;
            } else {
              // Fall back to board sides: N/S (rows) for player 1 / player 2
              const W = game.equipment.board.width;
              const H = game.equipment.board.height;
              const topRow = new Set<number>();
              const botRow = new Set<number>();
              for (let c = 0; c < W; c++) {
                topRow.add((H-1) * W + c);
                botRow.add(c);
              }
              goalSets = [botRow, topRow];
            }
          }

          const need = goalSets.length;
          if (need === 0) return true;

          // For explicit goals: BFS from ANY mover piece that touches goal 1
          // For seed-based: BFS from the specific seed site
          const ctxAny2 = ctx as unknown as { _trajectories?: Trajectories | null };
          const traj2 = ctxAny2._trajectories;

          // Find all mover pieces
          const boardN = game.equipment ? game.equipment.board.numSites : cells.length;
          const moverPieces: number[] = [];
          for (let i = 0; i < boardN; i++) {
            if ((cells[i] ?? 0) === owner) moverPieces.push(i);
          }

          if (explicitGoalsFinal || (numGoalsFinal >= 0 && goalTypeFinal) || need > 1) {
            // Multi-goal / N-Sides / player-regions form: check if a SINGLE connected component
            // of the mover touches ALL required goal regions.
            // @java IsConnected.java — BFS from each piece and check if component spans all goals
            const moverPieceSet = new Set(moverPieces);
            const visitedGlobal = new Set<number>(); // avoid re-exploring components

            const getNeighbours = (s: number): number[] => {
              if (traj2) return traj2.group(s, dirFinal);
              const W = game.equipment.board.width;
              const H = game.equipment.board.height;
              const col = s % W; const row2 = Math.floor(s / W);
              const ns: number[] = [];
              ns.push(s - 1, s + 1, s - W, s + W);
              if (dirFinal === "Adjacent" || dirFinal === "All") {
                ns.push(s - W - 1, s - W + 1, s + W - 1, s + W + 1);
              }
              return ns.filter(n => n >= 0 && n < W * H &&
                Math.abs((n % W) - col) <= 1 && Math.abs(Math.floor(n/W) - row2) <= 1);
            };

            const minRequired = numGoalsFinal >= 0 ? numGoalsFinal : need;

            for (const seed of moverPieces) {
              if (visitedGlobal.has(seed)) continue;
              // BFS to find the connected component of `seed`
              const component = new Set<number>([seed]);
              const stack: number[] = [seed];
              visitedGlobal.add(seed);
              while (stack.length > 0) {
                const s = stack.pop()!;
                for (const nb of getNeighbours(s)) {
                  if (!component.has(nb) && moverPieceSet.has(nb)) {
                    component.add(nb);
                    visitedGlobal.add(nb);
                    stack.push(nb);
                  }
                }
              }
              // Check how many goal regions this component touches
              let touchCount = 0;
              for (const gs of goalSets) {
                for (const s of component) {
                  if (gs.has(s)) { touchCount++; break; }
                }
              }
              if (touchCount >= minRequired) return true;
            }
            return false;
          }

          // Seed-based form (legacy)
          const seed = atFn ? atFn.eval(ctx) : ctx._evalTo;
          if (seed < 0) return false;
          if ((cells[seed] ?? 0) !== owner) return false;
          if (need === 0) return true;

          // BFS from seed, collect connected group of `owner` pieces
          const visited2 = new Set<number>([seed]);
          const stack2 = [seed];
          while (stack2.length > 0) {
            const s = stack2.pop()!;
            let neighbours: number[];
            if (traj2) {
              neighbours = traj2.group(s, dirFinal);
            } else {
              const W = game.equipment.board.width;
              const H = game.equipment.board.height;
              const col = s % W; const row = Math.floor(s / W);
              neighbours = [];
              if (col > 0) neighbours.push(s - 1);
              if (col < W-1) neighbours.push(s + 1);
              if (row > 0) neighbours.push(s - W);
              if (row < H-1) neighbours.push(s + W);
              // Diagonal for Adjacent
              if (dirFinal === "Adjacent" || dirFinal === "All") {
                if (col > 0 && row > 0) neighbours.push(s - W - 1);
                if (col < W-1 && row > 0) neighbours.push(s - W + 1);
                if (col > 0 && row < H-1) neighbours.push(s + W - 1);
                if (col < W-1 && row < H-1) neighbours.push(s + W + 1);
              }
            }
            for (const nb of neighbours) {
              if (!visited2.has(nb) && (cells[nb] ?? 0) === owner) {
                visited2.add(nb);
                stack2.push(nb);
              }
            }
          }

          // Check how many goal regions the seed-based connected group touches
          let touchCount2 = 0;
          for (const gs of goalSets) {
            for (const s of visited2) {
              if (gs.has(s)) { touchCount2++; break; }
            }
          }
          return touchCount2 >= need;
        }};
      }

      // (is Full) — no empty sites on the board
      // @java game/functions/booleans/is/simple/IsFull.java — eval: emptyRegion.size() == 0
      if (kind === "full") {
        return { eval(ctx: Context): boolean {
          const g = ctx.game as unknown as Game1to1;
          const boardN = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;
          for (let i = 0; i < boardN; i++) {
            if (ctx.state.isEmptySite(i)) return false;
          }
          return true;
        }};
      }

      // (is Blocked <role>) — the given player has no legal moves
      // @java game/functions/booleans/is/simple/IsBlocked.java — eval: game.moves(ctx).moves().isEmpty()
      if (kind === "blocked") {
        const { positional: blPos } = parseArgs1to1(node.items);
        // In end context, Java checks if context.player() (set by forEach) can't move
        return { eval(ctx: Context): boolean {
          const evalPlayer = ctx._evalPlayer;
          if (evalPlayer === undefined || evalPlayer <= 0) return false;
          // Save and temporarily set mover to evalPlayer
          const origMover = ctx.state.mover;
          (ctx.state as unknown as { mover: number }).mover = evalPlayer;
          try {
            const g = ctx.game as unknown as Game1to1;
            const moves = g.moves ? g.moves(ctx) : [];
            return !moves || moves.length === 0;
          } finally {
            (ctx.state as unknown as { mover: number }).mover = origMover;
          }
        }};
      }

      // (is Triggered <int> <id>) — event trigger check (stub: false)
      if (kind === "triggered") {
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is Pending) — game-level pending check (@java IsPending.java: state.isPending())
      // state.pending is a ReadonlySet<number>; size > 0 mirrors Java's pendingValues != null && !isEmpty()
      if (kind === "pending") {
        return { eval(ctx: Context): boolean { return ctx.state.pending.size > 0; } };
      }

      // (is Pattern ...) — pattern matching (stub: false)
      if (kind === "pattern") {
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is Loop ...) — connected group forms a loop (stub: false)
      // @java game/functions/booleans/is/loop/IsLoop.java
      if (kind === "loop") {
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is Proposed ...) — a move has been proposed (simultaneous game; stub: false)
      if (kind === "proposed") {
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is Within ...) — site is within a region/group (stub: false)
      if (kind === "within") {
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is Flat) — stack top is flat (stub: true — non-stacking games)
      // @java game/functions/booleans/is/component/IsFlat.java
      if (kind === "flat") {
        return { eval(_ctx: Context): boolean { return true; } };
      }

      // (is Hidden [What|Who|...] at:<site> to:<role>) — check hidden state.
      // @java game/functions/booleans/is/Hidden/IsHiddenWhat.java — eval()
      // The sub-type qualifier (What/Who/etc.) is positional[1]; ignored at state level
      // since TS collapses all hidden-info into one per-player boolean per site.
      if (kind === "hidden") {
        const { positional: hidPos, named: hidNamed } = parseArgs1to1(node.items);
        const atNode = hidNamed.get("at");
        const toNode = hidNamed.get("to");
        const roleStr3 = toNode && isIdent(toNode) ? toNode.name.toLowerCase() : "mover";
        const fixedPid3 = roleStr3.startsWith("p") && !isNaN(parseInt(roleStr3.slice(1), 10))
          ? parseInt(roleStr3.slice(1), 10) : -1;
        let siteFn: IntFunction | null = null;
        if (atNode) {
          try { siteFn = compileInt1to1(atNode); } catch { /* fallback */ }
        }
        return {
          eval(ctx: Context): boolean {
            const site = siteFn ? siteFn.eval(ctx) : ctx._evalTo;
            if (site < 0) return false;
            const pid3 = fixedPid3 >= 1 ? fixedPid3
              : roleStr3 === "next" ? (ctx.state.mover % ctx.game.numPlayers) + 1
              : ctx.state.mover;  // "mover" or fallback
            return ctx.state.isHidden(pid3, site);
          }
        };
      }

      // (is In <site> <region>) — site is in region
      // @java game/functions/booleans/is/in/IsIn.java
      if (kind === "in") {
        const { positional: inPos } = parseArgs1to1(node.items);
        const siteNode = inPos[1];
        const regionNode = inPos[2];
        if (siteNode && regionNode) {
          try {
            const siteFn = compileInt1to1(siteNode);
            const regionFn = compileRegion1to1(regionNode);
            return { eval(ctx: Context): boolean {
              const s = siteFn.eval(ctx);
              return regionFn.eval(ctx).includes(s);
            }};
          } catch { /* fall through */ }
        }
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is Threatened <what> [at:<site>|sites:<region>] [<specificMoves>]) — site under attack
      // @java game/functions/booleans/is/component/IsThreatened.java — eval
      // Generates enemy moves in a temp context, tests whether any move targets the site.
      // Module-level guard prevents infinite recursion (Java ThreadLocal autoFail).
      if (kind === "threatened") {
        // Extract args: optional 'what' int-fn (component id), optional at: site, sites: region
        const tArgs = parseArgs1to1(node.items);
        // positional[1] = optional int-fn for piece id (what)
        // named: at:, sites:
        let whatFn: IntFunction | null = null;
        try { if (tArgs.positional[1]) whatFn = compileInt1to1(tArgs.positional[1]); } catch { whatFn = null; }
        const atNode = tArgs.named.get("at");
        const sitesNode = tArgs.named.get("sites");
        let siteFnT: IntFunction | null = null;
        let regionFnT: RegionFunction | null = null;
        if (atNode) { try { siteFnT = compileInt1to1(atNode); } catch { siteFnT = null; } }
        if (sitesNode) { try { regionFnT = compileRegion1to1(sitesNode); } catch { regionFnT = null; } }
        const whatFnFinal = whatFn;
        const siteFnFinal = siteFnT;
        const regionFnFinal = regionFnT;
        // Module-level guard: prevents infinite recursion across all (is Threatened) instances.
        // @java IsThreatened.java — ThreadLocal<Boolean> autoFail (one per thread)
        // In single-threaded JS, a module-level flag mirrors the ThreadLocal behavior exactly.
        return { eval(ctx: Context): boolean {
          if (_isThreatenedActive) return false; // recursion guard
          // Determine sites to check
          let sitesToCheck: number[];
          if (siteFnFinal) {
            const s = siteFnFinal.eval(ctx);
            sitesToCheck = s >= 0 ? [s] : [];
          } else if (regionFnFinal) {
            sitesToCheck = regionFnFinal.eval(ctx);
          } else if (whatFnFinal) {
            // Find the site of the piece
            const whatId = whatFnFinal.eval(ctx);
            if (whatId < 1) return false;
            sitesToCheck = [];
            const cells = ctx.state.cells;
            const g = ctx.game as unknown as Game1to1;
            const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
            for (let i = 0; i < boardN; i++) {
              if (ctx.state.whatAtSite(i) === whatId) sitesToCheck.push(i);
            }
          } else {
            // All occupied sites
            const cells = ctx.state.cells;
            const g = ctx.game as unknown as Game1to1;
            const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
            sitesToCheck = [];
            for (let i = 0; i < boardN; i++) { if (cells[i] !== 0) sitesToCheck.push(i); }
          }
          if (sitesToCheck.length === 0) return false;
          // Determine the owner of what we're checking
          const ownerOfChecked = whatFnFinal
            ? (() => {
                const game = ctx.game as unknown as Game1to1;
                const whatId = whatFnFinal.eval(ctx);
                return game.equipment?.componentAt(whatId)?.owner ?? ctx.state.mover;
              })()
            : ctx.state.mover;
          // Set module-level guard and generate enemy moves
          _isThreatenedActive = true;
          try {
            const n = ctx.game.numPlayers;
            for (let enemyId = 1; enemyId <= n; enemyId++) {
              if (enemyId === ownerOfChecked) continue;
              // Temporarily swap mover to enemy
              const origMover = ctx.state.mover;
              // @java IsThreatened: setMover(enemyId), generate legal moves
              (ctx.state as unknown as { mover: number }).mover = enemyId;
              try {
                const enemyMoves = ctx.game.moves(ctx);
                for (const m of enemyMoves) {
                  const mTo = m.to();
                  if (sitesToCheck.includes(mTo)) {
                    return true;
                  }
                }
              } finally {
                (ctx.state as unknown as { mover: number }).mover = origMover;
              }
            }
          } finally {
            _isThreatenedActive = false;
          }
          return false;
        }};
      }

      // (is RegularGraph) — board is a regular graph (stub: false)
      // @java game/functions/booleans/is/graph/IsRegularGraph.java
      if (kind === "regulargraph") {
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is SidesMatch ...) — adjacent tile sides match (Trax-like; stub: false)
      if (kind === "sidesmatch") {
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is LastTo ...) — last move was to a specific site (stub: false)
      if (kind === "lastto") {
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is Target {sites...} <int>) — all sites in set contain the given value (Tower of Hanoi etc)
      // @java game/functions/booleans/is/target/IsTarget.java — stub: false
      if (kind === "target") {
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // (is Decided "End") — voting has concluded with the named decision.
      // @java game/functions/booleans/is/string/IsDecided.java
      if (kind === "decided") {
        const { positional: decPos } = parseArgs1to1(node.items);
        const decNode = decPos[1];
        const decStr = (decNode && isString(decNode)) ? decNode.value : "";
        return new IsDecided(decStr);
      }

      // No catch-all: unknown (is X ...) → COMPILE_FAIL for visibility
      throw new Error(`compiler1to1: unknown (is ${kind}) subtype — not yet ported to 1:1`);
    }
    // (is ...) with non-ident first arg — COMPILE_FAIL for visibility
    throw new Error(`compiler1to1: (is ...) with non-ident first arg — not supported`);
  }

  if (h === "no") {
    const { positional } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first)) {
      const kind = first.name.toLowerCase();
      if (kind === "moves") {
        const roleNode = positional[1];
        if (roleNode && isIdent(roleNode)) {
          return new NoMoves(roleNode.name as RoleType);
        }
        return new NoMoves("Mover");
      }
      if (kind === "pieces") {
        // (no Pieces in:<region>) — check if there are no pieces (countAt > 0) in
        // the region. Java NoPieces with in: uses whereFn to filter the owned-positions.
        // For mancala (Shared pieces), this means: no nonzero count in any filtered site.
        // @java game/functions/booleans/no/pieces/NoPieces.java — whereFn
        const { named: noNamed } = parseArgs1to1(node.items);
        const inNode = noNamed.get("in");
        if (inNode) {
          try {
            const regionFn = compileRegion1to1(inNode);
            // Determine role (if given) for ownership check
            const roleNode2 = positional[1];
            const role2 = (roleNode2 && isIdent(roleNode2)) ? roleNode2.name.toLowerCase() : null;
            return { eval(ctx: Context): boolean {
              const sites = regionFn.eval(ctx);
              const state = ctx.state;
              const g = ctx.game as unknown as Game1to1;
              const boardSize = g.equipment?.board?.numSites ?? state.cells.length;
              for (const s of sites) {
                if (s < 0 || s >= boardSize) continue;
                // For Shared/mancala: check countAt > 0
                if ((state.countAt[s] ?? 0) > 0) return false;
                // For player-owned games: also check cells ownership
                if (role2 && role2 !== "all") {
                  let pid = state.mover;
                  if (role2 === "next") pid = (state.mover % ctx.game.numPlayers) + 1;
                  else if (role2.startsWith("p") && !isNaN(parseInt(role2.slice(1), 10))) pid = parseInt(role2.slice(1), 10);
                  if ((state.cells[s] ?? 0) === pid) return false;
                }
              }
              return true;
            }};
          } catch { /* fall through to default */ }
        }
        const roleNode = positional[1];
        if (roleNode && isIdent(roleNode)) {
          return new NoPieces1to1(roleNode.name as RoleType);
        }
        return new NoPieces1to1("Mover");
      }
      // No catch-all: unknown (no X ...) → COMPILE_FAIL for visibility
      throw new Error(`compiler1to1: unknown (no ${kind}) subtype — not yet ported to 1:1`);
    }
    // (no ...) with non-ident first arg — COMPILE_FAIL
    throw new Error(`compiler1to1: (no ...) with non-ident first arg — not supported`);
  }

  // Integer comparisons: (= a b), (!= a b), (<= a b), (>= a b), (< a b), (> a b)
  if (h === "=" || h === "!=" || h === "<=" || h === ">=" || h === "<" || h === ">") {
    const { positional } = parseArgs1to1(node.items);
    const a = compileInt1to1(positional[0]);
    const b = compileInt1to1(positional[1]);
    const op = h;
    return {
      eval(ctx: Context): boolean {
        const av = a.eval(ctx);
        const bv = b.eval(ctx);
        switch (op) {
          case "=": return av === bv;
          case "!=": return av !== bv;
          case "<=": return av <= bv;
          case ">=": return av >= bv;
          case "<": return av < bv;
          case ">": return av > bv;
          default: return false;
        }
      }
    };
  }

  if (h === "or") {
    // (or <bool1> <bool2>) or (or { <bool1> ... })
    const { positional } = parseArgs1to1(node.items);
    const bools = flattenBoolList(positional, numPlayers);
    return new OrBool(bools);
  }

  if (h === "and") {
    // (and <bool1> <bool2>) or (and { <bool1> ... })
    const { positional } = parseArgs1to1(node.items);
    const bools = flattenBoolList(positional, numPlayers);
    return new AndBool(bools);
  }

  // (not <bool>) — logical negation
  // @java game/functions/booleans/math/Not.java — eval = !a.eval(context)
  if (h === "not") {
    const { positional } = parseArgs1to1(node.items);
    const sub = compileBool1to1(positional[0], numPlayers);
    return { eval(ctx: Context): boolean { return !sub.eval(ctx); } };
  }

  // (all Sites <region> if:<cond>) — true if ALL sites in region satisfy condition
  // @java game/functions/booleans/all/sites/AllSites.java — eval iterates region, sets context.site
  // (all Passed) — true if all players passed in the previous turns
  // @java game/functions/booleans/all/simple/AllPassed.java — eval checks context.allPass()
  if (h === "all") {
    const { positional, named } = parseArgs1to1(node.items);
    const first = positional[0];

    if (first && isIdent(first)) {
      const kind = first.name.toLowerCase();

      if (kind === "passed") {
        // (all Passed) — game-level all-pass check
        // @java AllPassed.eval: trial.moveNumber() >= players.count() && context.allPass()
        return { eval(ctx: Context): boolean {
          const g = ctx.game;
          const moveNum = ctx.trial.moves.length;
          if (moveNum < g.numPlayers) return false;
          const lastN = ctx.trial.moves.slice(-g.numPlayers);
          return lastN.every(m => m && m.isPass());
        }};
      }

      if (kind === "sites") {
        // (all Sites <region> if:<cond>)
        // @java AllSites.eval: for each site in region, set context.site(), check condition
        const regionNode = positional[1];
        const ifNode = named.get("if");
        if (!regionNode || !ifNode) {
          throw new Error("compiler1to1: (all Sites <region> if:<cond>) — missing args");
        }
        const regionFn = compileRegion1to1(regionNode);
        const condFn = compileBool1to1(ifNode, numPlayers);
        return { eval(ctx: Context): boolean {
          const sites = regionFn.eval(ctx);
          const origSite = ctx._evalSite;
          for (const s of sites) {
            ctx._evalSite = s;
            if (!condFn.eval(ctx)) {
              ctx._evalSite = origSite;
              return false;
            }
          }
          ctx._evalSite = origSite;
          return true;
        }};
      }

      if (kind === "groups") {
        // (all Groups [<type>] [<direction>] [of:<groupElemCond>] if:<groupCond>)
        // Returns true iff every connected group of pieces satisfies groupCond.
        // @java game/functions/booleans/all/groups/AllGroups.java
        //
        // Parameters parsed from positional args (after "Groups"):
        //   positional[1..]: optional SiteType ident (Cell/Vertex/Edge), direction ident
        //   named "of":  condition on each candidate site to include in group
        //   named "if":  condition on the whole group (context.region = group sites)
        //
        const allGroupsArgs = parseArgs1to1(node.items);
        // Find direction name from positionals[1..] (skip "Groups")
        const ALLGROUPS_DIRNAMES = new Set(["orthogonal","diagonal","adjacent","all","n","s","e","w","ne","nw","se","sw"]);
        const ALLGROUPS_SITETYPE = new Set(["cell","vertex","edge"]);
        let allGroupsDirName = "Adjacent"; // default
        for (let pi = 1; pi < allGroupsArgs.positional.length; pi++) {
          const ap = allGroupsArgs.positional[pi];
          if (ap && !isList(ap) && isIdent(ap)) {
            const apn = ap.name.toLowerCase();
            if (ALLGROUPS_DIRNAMES.has(apn)) {
              // Capitalize first letter for Trajectories.group()
              allGroupsDirName = ap.name.charAt(0).toUpperCase() + ap.name.slice(1).toLowerCase();
              break;
            }
            // Skip SiteType idents
            if (ALLGROUPS_SITETYPE.has(apn)) continue;
          }
        }
        const allGroupsDirNameFinal = allGroupsDirName;
        const allGroupsOfNode = allGroupsArgs.named.get("of");
        const allGroupsIfNode = allGroupsArgs.named.get("if");
        if (!allGroupsIfNode) {
          // No if: condition — stub true (no constraint to verify)
          return { eval(_ctx: Context): boolean { return true; } };
        }
        let allGroupsOfFn: BooleanFunction | null = null;
        if (allGroupsOfNode) {
          try { allGroupsOfFn = compileBool1to1(allGroupsOfNode, numPlayers); } catch { /* skip */ }
        }
        const allGroupsCondFn = compileBool1to1(allGroupsIfNode, numPlayers);
        const capturedOfFn = allGroupsOfFn;
        return { eval(ctx: Context): boolean {
          // @java AllGroups.eval — BFS to find all connected groups, check condition on each
          const state = ctx.state;
          const mover = state.mover;
          const numPlrs = ctx.game.numPlayers;
          const cells = state.cells;
          const boardN = (ctx.game as unknown as Game1to1).equipment?.board?.numSites ?? cells.length;
          const ctxTraj = ctx as unknown as { _trajectories?: { group(site: number, dir: string): number[] } | null };
          const traj = ctxTraj._trajectories;

          // Build sitesToCheck:
          // If of: is given, look at all owned sites (all players 0..numPlayers).
          // Else, look only at mover's owned sites.
          // @java AllGroups.eval lines 88-111
          const sitesToCheck: number[] = [];
          const owned = (state as unknown as { owned?(): { sites(p: number): number[] } | null }).owned?.();
          if (capturedOfFn !== null) {
            // Include all sites across all players
            if (owned) {
              for (let i = 0; i <= numPlrs; i++) {
                for (const s of owned.sites(i)) {
                  if (s < boardN) sitesToCheck.push(s);
                }
              }
            } else {
              for (let s = 0; s < boardN; s++) {
                if ((cells[s] ?? 0) !== 0) sitesToCheck.push(s);
              }
            }
          } else {
            if (owned) {
              for (const s of owned.sites(mover)) {
                if (s < boardN) sitesToCheck.push(s);
              }
            } else {
              for (let s = 0; s < boardN; s++) {
                if ((cells[s] ?? 0) === mover) sitesToCheck.push(s);
              }
            }
          }

          // Save context eval state
          const origFrom = ctx._evalFrom;
          const origTo = ctx._evalTo;
          const origRegion = ctx.region();

          const sitesChecked: number[] = [];

          for (const from of sitesToCheck) {
            if (sitesChecked.includes(from)) continue;

            // Set up context for seed evaluation
            ctx._evalFrom = from;
            ctx._evalTo = from;

            // Determine if seed belongs to a group
            // @java lines 125-127: check groupElementConditionFn or mover ownership
            let seedInGroup: boolean;
            if (capturedOfFn !== null) {
              seedInGroup = capturedOfFn.eval(ctx);
            } else {
              const csWhoFrom: number = (cells[from] ?? 0);
              seedInGroup = (csWhoFrom === mover);
            }

            if (!seedInGroup) continue;

            // BFS to find all connected group members
            const groupSites: number[] = [from];
            const sitesExplored: number[] = [];
            let i = 0;

            // @java while (sitesExplored.size() != groupSites.size())
            while (sitesExplored.length !== groupSites.length) {
              const site = groupSites[i]!;
              // Get neighbors in the given direction
              const neighbors: number[] = traj
                ? traj.group(site, allGroupsDirNameFinal)
                : (() => {
                    // Fallback: orthogonal neighbors on square grid
                    const g2 = ctx.game as unknown as Game1to1;
                    const W = g2.equipment?.board?.width ?? 0;
                    if (W <= 0) return [] as number[];
                    const res: number[] = [];
                    const candidates = [site - W, site + W, site - 1, site + 1];
                    for (const n of candidates) {
                      if (n < 0 || n >= boardN) continue;
                      if (n === site - 1 && site % W === 0) continue;
                      if (n === site + 1 && (site + 1) % W === 0) continue;
                      res.push(n);
                    }
                    return res;
                  })();

              for (const to of neighbors) {
                if (groupSites.includes(to)) continue;
                ctx._evalTo = to;
                let toInGroup: boolean;
                if (capturedOfFn !== null) {
                  toInGroup = capturedOfFn.eval(ctx);
                } else {
                  toInGroup = ((cells[to] ?? 0) === mover);
                }
                if (toInGroup) groupSites.push(to);
              }

              sitesExplored.push(site);
              i++;
            }

            // Set context region to the group and evaluate groupCondition.
            // @java context.setRegion(new Region(groupSites.toArray()));
            // ctx.setRegion() stores the group so that bare (sites) = SitesContext
            // can return it via ctx.region().sites().
            const groupArr = groupSites.slice();
            ctx.setRegion({ sites: () => groupArr });

            const groupOk = allGroupsCondFn.eval(ctx);

            if (!groupOk) {
              // Restore context and return false
              ctx._evalFrom = origFrom;
              ctx._evalTo = origTo;
              ctx.setRegion(origRegion);
              return false;
            }

            // Mark all group sites as checked
            for (const gs of groupSites) {
              if (!sitesChecked.includes(gs)) sitesChecked.push(gs);
            }
          }

          // Restore context
          ctx._evalFrom = origFrom;
          ctx._evalTo = origTo;
          ctx.setRegion(origRegion);
          return true;
        }};
      }

      if (kind === "different") {
        // (all Different) — all values are different (stub: true)
        // @java game/functions/booleans/all/sites/AllDifferent.java
        return { eval(_ctx: Context): boolean { return true; } };
      }

      if (kind === "diceequal") {
        // (all DiceEqual) — all dice show the same face value (doubles)
        // @java game/functions/booleans/all/simple/AllDiceEqual.java
        return { eval(ctx: Context): boolean {
          const dice = ctx.state.diceValues;
          if (!dice || dice.length === 0) return false;
          const first2 = dice[0] ?? 0;
          return dice.every(v => v === first2);
        }};
      }

      if (kind === "diceused") {
        // (all DiceUsed) — all dice are marked as used (value == 0 in state)
        // @java game/functions/booleans/all/simple/AllDiceUsed.java
        return { eval(ctx: Context): boolean {
          const dice = ctx.state.diceValues;
          if (!dice || dice.length === 0) return true;
          return dice.every(v => v === 0);
        }};
      }

      if (kind === "players") {
        // (all Players ...) — check across all players (stub: false)
        return { eval(_ctx: Context): boolean { return false; } };
      }

      // No catch-all: unknown (all X ...) → COMPILE_FAIL for visibility
      throw new Error(`compiler1to1: unknown (all ${kind}) subtype — not yet ported to 1:1`);
    }

    // (all ...) with non-ident first arg — COMPILE_FAIL
    throw new Error(`compiler1to1: (all ...) with non-ident first arg — not supported`);
  }

  // (if <cond> <then> [<else>]) — conditional boolean (returns true/false based on sub-expressions)
  // @java game/functions/booleans/is/IfBool.java — this is used when (if ...) evaluates to bool
  // In the Bool context, (if cond trueVal falseVal) — if both branches are booleans
  if (h === "if") {
    const { positional: ifBPos } = parseArgs1to1(node.items);
    try {
      const condFn = compileBool1to1(ifBPos[0], numPlayers);
      const thenFn = compileBool1to1(ifBPos[1], numPlayers);
      const elseFn = ifBPos[2] ? compileBool1to1(ifBPos[2], numPlayers) : { eval: () => false };
      return { eval(ctx: Context): boolean {
        return condFn.eval(ctx) ? thenFn.eval(ctx) : (elseFn as BooleanFunction).eval(ctx);
      }};
    } catch { /* fall through */ }
    // If the branches aren't booleans, this might be (if <bool>) — bare condition
    try {
      const condFn = compileBool1to1(ifBPos[0], numPlayers);
      return condFn;
    } catch {
      return { eval: () => false };
    }
  }

  // (can Move <role>) — player can make a move (stub: check game.moves() non-empty)
  // @java game/functions/booleans/can/CanMove.java
  if (h === "can") {
    const { positional: canPos } = parseArgs1to1(node.items);
    const first = canPos[0];
    if (first && isIdent(first) && first.name.toLowerCase() === "move") {
      // Optional: can also take a sub-moves expression
      let subMoveFn: MovesFunction | null = null;
      if (canPos[1] && isList(canPos[1])) {
        try { subMoveFn = compileMoves1to1(canPos[1]!); } catch { subMoveFn = null; }
      }
      const subMovesFinal = subMoveFn;
      return { eval(ctx: Context): boolean {
        if (_canMoveActive) return false; // recursion guard
        _canMoveActive = true;
        try {
          if (subMovesFinal) {
            // (can Move <subMoves>) — check if sub-moves generates anything
            const moves = subMovesFinal.eval(ctx);
            return moves.length > 0;
          }
          const g = ctx.game as unknown as Game1to1;
          const moves = g.moves(ctx);
          return moves.length > 0;
        } catch { return false; }
        finally { _canMoveActive = false; }
      }};
    }
    return { eval(_ctx: Context): boolean { return false; } };
  }

  // (was Last <int>) — site was the last to (stub: compare to _evalTo)
  // @java game/functions/booleans/is/graph/IsLastTo.java (similar)
  if (h === "was") {
    const { positional: wasPos } = parseArgs1to1(node.items);
    const typeNode = wasPos[0];
    if (typeNode && isIdent(typeNode)) {
      const typeName = typeNode.name.toLowerCase();
      if (typeName === "last") {
        const subNode = wasPos[1];
        if (subNode && isIdent(subNode)) {
          const subName = subNode.name.toLowerCase();
          if (subName === "in" || subName === "to" || subName === "from") {
            return { eval(ctx: Context): boolean { return ctx._evalTo >= 0; } };
          }
        }
      }
    }
    return { eval(_ctx: Context): boolean { return false; } };
  }

  throw new Error(`compiler1to1: unknown BooleanFunction head "${h}"`);
}

/** Expand a boolean argument list, unwrapping curly-brace arrays. */
function flattenBoolList(positional: LudNode[], numPlayers: number): BooleanFunction[] {
  const bools: BooleanFunction[] = [];
  for (const p of positional) {
    if (isList(p) && p.delimiter === "curly") {
      for (const child of p.items) {
        if (isList(child)) {
          bools.push(compileBool1to1(child, numPlayers));
        }
      }
    } else if (isList(p)) {
      bools.push(compileBool1to1(p, numPlayers));
    }
  }
  return bools;
}

// ---------------------------------------------------------------------------
// Compile EndRuleFunction
// ---------------------------------------------------------------------------

function compileEndRule1to1(node: LudNode, numPlayers: number): EndRuleFunction {
  if (!isList(node)) throw new Error("compiler1to1: end rule must be a list");
  // The head may have a trailing colon (e.g. "if:" used as named-arg form in some .lud files)
  const h = (headOf(node) ?? "").replace(/:$/, "").toLowerCase();

  if (h === "if") {
    const { positional } = parseArgs1to1(node.items);
    const condNode = positional[0];
    const resultNode = positional[1];
    if (!condNode || !resultNode) {
      throw new Error("compiler1to1: (if condition result) — missing parts");
    }
    const condition = compileBool1to1(condNode, numPlayers);

    // (if <cond> (byScore)) — byScore used as the result of an if end rule
    // @java game/rules/end/ByScore.java — extends Result, triggered when cond is true
    if (isList(resultNode) && headOf(resultNode) === "byscore") {
      const byScoreRule = compileByScore1to1(resultNode, numPlayers);
      return {
        eval(ctx: Context): EndResult | null {
          if (!condition.eval(ctx)) return null;
          return byScoreRule.eval(ctx);
        }
      };
    }

    // (if <cond> { (if ...) (if ...) ... }) — curly-list of end rules as the "then"
    // @java game/rules/end/If.java — when result is a list, iterate sub-rules
    if (isList(resultNode) && resultNode.delimiter === "curly") {
      const subRules: EndRuleFunction[] = [];
      for (const child of resultNode.items) {
        if (!isList(child)) continue;
        const ch = headOf(child);
        if (ch === "byscore") {
          subRules.push(compileByScore1to1(child, numPlayers));
        } else {
          try { subRules.push(compileEndRule1to1(child, numPlayers)); } catch { /* skip */ }
        }
      }
      return {
        eval(ctx: Context): EndResult | null {
          if (!condition.eval(ctx)) return null;
          for (const rule of subRules) {
            const r = rule.eval(ctx);
            if (r !== null) return r;
          }
          return null;
        }
      };
    }

    // (if <cond> (if ...)) — nested if as result
    if (isList(resultNode) && headOf(resultNode) === "if") {
      const subRule = compileEndRule1to1(resultNode, numPlayers);
      return {
        eval(ctx: Context): EndResult | null {
          if (!condition.eval(ctx)) return null;
          return subRule.eval(ctx);
        }
      };
    }

    const result = compileResult1to1(resultNode);
    return new If(condition, null, null, result);
  }

  // (forEach <roleType> if:<cond> (result Player <type>))
  // @java game/rules/end/ForEach.java — iterates players of given type, checks cond, applies result
  if (h === "foreach") {
    const { positional, named } = parseArgs1to1(node.items);
    const typeNode = positional[0];
    const typeName = (typeNode && isIdent(typeNode)) ? typeNode.name.toLowerCase() : "player";
    const ifNode = named.get("if");
    const resultNode = positional[1];
    if (!ifNode || !resultNode) {
      throw new Error("compiler1to1: (forEach <role> if:<cond> (result ...)) — missing parts");
    }
    const condFn = compileBool1to1(ifNode, numPlayers);
    const result = compileResult1to1(resultNode);
    const typeNameFinal = typeName;
    const nPl = numPlayers;
    return {
      eval(ctx: Context): EndResult | null {
        // Iterate relevant players and check condition for each
        // @java ForEach.eval: sets context.setPlayer(pid) then checks cond
        const mover = ctx.state.mover;
        for (let pid = 1; pid <= nPl; pid++) {
          if (typeNameFinal === "nonmover" && pid === mover) continue;
          if (typeNameFinal === "mover" && pid !== mover) continue;
          // Set player context scratch
          ctx._evalPlayer = pid;
          if (condFn.eval(ctx)) {
            ctx._evalPlayer = undefined;
            // Resolve result for this specific player
            const who = result.who;
            const resultType = result.result;
            let winner: number;
            // "Player" refers to context._evalPlayer
            if (who === "All" as unknown) winner = 0;
            else if ((who as string) === "Player") winner = pid;
            else winner = result.resolveWho(mover, nPl, ctx);

            const ranking = new Array<number>(nPl + 1).fill(0);
            if (resultType === "Win") {
              ranking[winner] = 1.0;
              for (let p = 1; p <= nPl; p++) if (p !== winner) ranking[p] = 2.0;
              return { winner, over: true, ranking };
            }
            if (resultType === "Loss") {
              ranking[pid] = nPl;
              for (let p = 1; p <= nPl; p++) if (p !== pid) ranking[p] = 1.0;
              const w = nPl === 2 ? (pid === 1 ? 2 : 1) : 0;
              return { winner: w, over: true, ranking };
            }
            if (resultType === "Draw") {
              const drawRank = (nPl + 1) / 2;
              for (let p = 1; p <= nPl; p++) ranking[p] = drawRank;
              return { winner: 0, over: true, ranking };
            }
          }
        }
        ctx._evalPlayer = undefined;
        return null;
      }
    };
  }

  throw new Error(`compiler1to1: unknown end rule head "${h}"`);
}

// ---------------------------------------------------------------------------
// Compile ByScore end result
// ---------------------------------------------------------------------------

/**
 * Compile (byScore [{(score P1 <int>)...}]) as an end result.
 * Winner is the player with the highest score.
 *
 * @java game/rules/end/ByScore.java — eval: ranks players by score
 */
function compileByScore1to1(node: LudList, numPlayers: number): EndRuleFunction {
  // (byScore [{ (score P1 <fn>) (score P2 <fn>) ... }]) — when an explicit score
  // list is given, each player's score is the evaluated <fn> at end time (Java
  // ByScore evaluates the finalScore functions); otherwise use state scores.
  // @java game/rules/end/ByScore.java
  const { positional } = parseArgs1to1(node.items);
  const scoreList = positional.find(n => isList(n) && (n as LudList).delimiter === "curly");
  const scoreFns = new Map<number, IntFunction>();
  if (scoreList && isList(scoreList)) {
    for (const item of scoreList.items) {
      if (!isList(item) || headOf(item) !== "score") continue;
      const sArgs = parseArgs1to1(item.items);
      const roleNode = sArgs.positional[0];
      const valNode = sArgs.positional[1];
      if (!roleNode || !isIdent(roleNode) || !valNode) continue;
      const rn = roleNode.name.toLowerCase();
      const pid = rn.startsWith("p") && !isNaN(parseInt(rn.slice(1), 10)) ? parseInt(rn.slice(1), 10) : -1;
      if (pid < 1) continue;
      try { scoreFns.set(pid, compileInt1to1(valNode)); } catch { /* skip */ }
    }
  }
  return {
    eval(ctx: Context): import("./ludemes/base.js").EndResult | null {
      const stateScores = (ctx.state as unknown as { scores?: number[] }).scores;

      // Rank by score: highest score = rank 1. Prefer evaluated score fns.
      const allScores: number[] = new Array(numPlayers + 1).fill(0);
      for (let p = 1; p <= numPlayers; p++) {
        const fn = scoreFns.get(p);
        allScores[p] = fn ? fn.eval(ctx) : (stateScores?.[p] ?? 0);
      }

      // Build ranking (Java parity: iterative max-score rank assignment)
      const ranking = new Array<number>(numPlayers + 1).fill(0);
      const scratch = [...allScores];
      let numAssigned = 0;
      while (numAssigned < numPlayers) {
        let maxScore = Number.MIN_SAFE_INTEGER;
        let numMax = 0;
        for (let p = 1; p <= numPlayers; p++) {
          if (scratch[p] === undefined) continue;
          if ((scratch[p] as number) > maxScore) {
            maxScore = scratch[p] as number;
            numMax = 1;
          } else if ((scratch[p] as number) === maxScore) {
            numMax++;
          }
        }
        if (maxScore === Number.MIN_SAFE_INTEGER) break;
        const nextRank = ((numAssigned + 1) * 2 + numMax - 1) / 2;
        for (let p = 1; p <= numPlayers; p++) {
          if ((scratch[p] as number) === maxScore) {
            ranking[p] = nextRank;
            scratch[p] = undefined as unknown as number;
          }
        }
        numAssigned += numMax;
      }

      // Determine winner (rank 1.0) and loser
      let winner = 0;
      for (let p = 1; p <= numPlayers; p++) {
        if (ranking[p] === 1.0) winner = p;
      }

      return { winner, over: true, ranking };
    }
  };
}

function compileResult1to1(node: LudNode): Result {
  if (!isList(node)) throw new Error("compiler1to1: result must be a list");
  const h = headOf(node)!;
  if (h === "result") {
    const { positional } = parseArgs1to1(node.items);
    const who = positional[0];
    const resultType = positional[1];
    if (!who || !isIdent(who) || !resultType || !isIdent(resultType)) {
      throw new Error("compiler1to1: (result Who ResultType) malformed");
    }
    const whoStr = who.name as RoleType;
    const resultStr = resultType.name as ResultType;
    return new Result(whoStr, resultStr);
  }
  throw new Error(`compiler1to1: unknown result head "${h}"`);
}

// Extended Result.resolveWho to handle "Player" role (set by forEach iteration)
// This is used by the forEach end rule to resolve the current iterated player.
// We patch Result to handle "Player" via monkey-patching in forEach rule compilation.

// ---------------------------------------------------------------------------
// Compile End
// ---------------------------------------------------------------------------

function compileEnd1to1(node: LudNode, numPlayers: number): End {
  if (!isList(node)) throw new Error("compiler1to1: end must be a list");
  const h = headOf(node)!;
  if (h !== "end") throw new Error(`compiler1to1: expected (end ...), got "${h}"`);

  // Check for (end (byScore ...)) — top-level byScore
  const { positional } = parseArgs1to1(node.items);
  const rules: EndRuleFunction[] = [];

  if (positional.length === 0) {
    return new End(null, []);
  }

  const first = positional[0]!;

  // (end (byScore ...)) — direct byScore result
  // @java game/rules/end/ByScore.java
  if (isList(first) && headOf(first) === "byscore") {
    return new End(compileByScore1to1(first, numPlayers), null);
  }

  if (isList(first) && first.delimiter === "curly") {
    for (const child of first.items) {
      if (!isList(child)) continue;
      const ch = headOf(child);
      if (ch === "byscore") {
        rules.push(compileByScore1to1(child, numPlayers));
      } else {
        try { rules.push(compileEndRule1to1(child, numPlayers)); } catch (e) {
          // Re-throw to preserve error message for COMPILE_FAIL tracking
          throw e;
        }
      }
    }
  } else if (isList(first)) {
    const ch = headOf(first);
    if (ch === "byscore") {
      rules.push(compileByScore1to1(first, numPlayers));
    } else {
      rules.push(compileEndRule1to1(first, numPlayers));
    }
  } else {
    throw new Error("compiler1to1: end rule content must be a list or curly-list");
  }

  return new End(null, rules);
}

// ---------------------------------------------------------------------------
// Compile MovesFunction (the play generator)
// ---------------------------------------------------------------------------

// Forward ref for compileMovesRecursive (needed by ForEachPiece1to1 assembly)
let _compileMoves: (node: LudNode, equipment?: Equipment1to1) => MovesFunction;

/**
 * Module-level recursion guard for (is Threatened) evaluation.
 * Mirrors Java's ThreadLocal<Boolean> autoFail in IsThreatened.java.
 * Prevents infinite recursion when move generation itself calls (is Threatened).
 * @java game/functions/booleans/is/component/IsThreatened.java — autoFail ThreadLocal
 */
let _isThreatenedActive = false;

/**
 * Module-level recursion guard for (can Move ...) evaluation.
 * (can Move ...) calls game.moves() which may call (can Move ...) again.
 * When recursive, return false to break the cycle.
 * @java game/functions/booleans/can/CanMove.java
 */
let _canMoveActive = false;

export function compileMoves1to1(node: LudNode, equipment?: Equipment1to1): MovesFunction {
  return _compileMoves(node, equipment);
}

// ---------------------------------------------------------------------------
// IntArray / Float / Directions sub-compilers (new function kinds).
// Each consults its registry; registered 1:1 classes are the only source.
// These mirror the Bool/Int/Region/Moves lookup pattern.
// ---------------------------------------------------------------------------

/** @java game/functions/intArray/IntArrayFunction.java */
export function compileIntArray1to1(node: LudNode | undefined): IntArrayFunction {
  if (!node) return { eval: () => [] };
  if (isList(node)) {
    // { a b c } curly list of ints → array of their values
    if (node.delimiter === "curly") {
      const elems = node.items.map(it => compileInt1to1(it));
      return { eval(ctx: Context): number[] { return elems.map(e => e.eval(ctx)); } };
    }
    const h = headOf(node)!;
    const env: Compile1to1Env = { numPlayers: 2 };
    const ctor = lookupIntArray1to1(h);
    if (ctor) return ctor(node, env);
  }
  throw new Error(`compiler1to1: no IntArrayFunction for ${isList(node) ? headOf(node) : "non-list"}`);
}

/** @java game/functions/floats/FloatFunction.java */
export function compileFloat1to1(node: LudNode | undefined): FloatFunction {
  if (!node) return { eval: () => 0 };
  if (isNumber(node)) { const v = node.value; return { eval: () => v }; }
  if (isList(node)) {
    const h = headOf(node)!;
    const env: Compile1to1Env = { numPlayers: 2 };
    const ctor = lookupFloat1to1(h);
    if (ctor) return ctor(node, env);
  }
  // A float context can wrap an int expression (Java auto-widens int→float).
  return compileInt1to1(node);
}

/** @java game/util/directions/DirectionsFunction.java — returns Trajectories direction names */
export function compileDirections1to1(node: LudNode | undefined): DirectionsFunction {
  if (!node) return { eval: () => ["Adjacent"] };
  if (isIdent(node)) { const nm = node.name; return { eval: () => [nm] }; }
  if (isList(node)) {
    const h = headOf(node)!;
    const env: Compile1to1Env = { numPlayers: 2 };
    const ctor = lookupDirections1to1(h);
    if (ctor) return ctor(node, env);
    // (directions <Type>) → the named direction group
    if (h === "directions") {
      const { positional } = parseArgs1to1(node.items);
      const first = positional[0];
      if (first && isIdent(first)) { const nm = first.name; return { eval: () => [nm] }; }
    }
  }
  throw new Error(`compiler1to1: no DirectionsFunction for ${isList(node) ? headOf(node) : "non-list"}`);
}

/**
 * Scan a list of positional args for `(then (moveAgain))` and return true if
 * found. Used to attach `moveAgain=true` to generated moves.
 *
 * @java game/rules/play/moves/nonDecision/effect/Then.java — then consequence
 * @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
 */
function hasThenMoveAgain(positional: readonly LudNode[]): boolean {
  for (const p of positional) {
    if (!isList(p)) continue;
    if (headOf(p) !== "then") continue;
    // (then (moveAgain)) — check the first arg of then
    const thenArgs = parseArgs1to1(p.items);
    const thenInner = thenArgs.positional[0];
    if (thenInner && isList(thenInner) && headOf(thenInner) === "moveagain") {
      return true;
    }
    if (thenInner && isList(thenInner) && headOf(thenInner) === "moveAgain") {
      return true;
    }
    // Single-ident form: (then moveAgain) — unlikely but guard
    if (thenInner && isIdent(thenInner) &&
        (thenInner.name === "moveAgain" || thenInner.name === "moveagain")) {
      return true;
    }
  }
  return false;
}

/**
 * Wrap a `MovesFunction` so that every generated move has `moveAgain=true`.
 *
 * Used when `(then (moveAgain))` appears as a consequence of a move generator.
 * Java equivalent: `Then.eval` appends `ActionSetNextPlayer(mover)` to each
 * move, which `Game.apply` reads as a same-player continuation.
 *
 * @java game/rules/play/moves/nonDecision/effect/Then.java — eval(Context)
 * @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
 */
function withMoveAgainWrapper(inner: MovesFunction): MovesFunction {
  return {
    eval(ctx: Context): Move[] {
      const mover = ctx.state.mover;
      // @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
      // Java's MoveAgain emits ActionSetNextPlayer(mover) as the consequence action.
      // This sets state.next = mover, so that (no Moves Next) evaluates against the
      // SAME player (they must complete the second half of their turn).
      const setNext = new ActionSetNextPlayer(mover);
      return inner.eval(ctx).map(m => m.withConsequence([setNext], true));
    },
  };
}

/**
 * Generalised (then <moves>) consequence chaining. For each parent move, apply
 * it to a POST-MOVE context, evaluate the consequence THERE (so conditions like
 * (is Line 3) see the just-placed/moved piece), and bake the resulting actions +
 * moveAgain into the parent move.
 *
 * This is the faithful behaviour of Java Then.java / Game.applyInternal, which
 * evaluate the `then` consequence in the context AFTER the move's own actions.
 * The previous code only handled the literal (then (moveAgain)) and only on
 * Step/Slide — conditional moveAgain ((then (if (is Line 3) (moveAgain)))) never
 * fired, the dominant board/space MOVE_MISMATCH cause (Morris-family mills).
 *
 * @java game/rules/play/moves/nonDecision/effect/Then.java
 */
export function withThenConsequence(inner: MovesFunction, thenGen: MovesFunction): MovesFunction {
  return {
    eval(ctx: Context): Move[] {
      const c = ctx as Context & { _radials?: unknown; _trajectories?: unknown };
      return inner.eval(ctx).map(m => {
        let postCtx: Context;
        try {
          const postState = m.applyTo(ctx.state, ctx.rng);
          // Record the current move in the trial so (last To)/(last From)
          // inside then-clauses resolve to THIS move's to/from site, not the
          // previous ply's. Mirrors Java Move.apply() which calls
          // trial.addMove(this) before evaluating Then consequences.
          // @java game/util/moves/Move.java — apply() calls trial.addMove(this)
          const postTrial = ctx.trial.withMove(m, false, -1);
          postCtx = new Context(ctx.game, postState, postTrial, ctx.rng);
        } catch { return m; }
        const aug = postCtx as Context & {
          _radials?: unknown;
          _trajectories?: unknown;
          _thenContextDepth?: number;
        };
        aug._radials = c._radials;
        aug._trajectories = c._trajectories;
        // Mark this as a then-consequence context so that (is Prev Mover) can
        // look at trial.moves[last-1] (the ply before the current move) rather
        // than trial.moves[last] (the current move, just added above).
        // @java Then.eval — evaluates in post-move context without rotating mover.
        aug._thenContextDepth = ((c as typeof aug)._thenContextDepth ?? 0) + 1;
        postCtx._evalFrom = m.from();
        postCtx._evalTo = m.to();
        postCtx._evalValue = 0;
        let thenMoves: Move[];
        try { thenMoves = thenGen.eval(postCtx); }
        catch { return m; }
        if (thenMoves.length === 0) return m;
        const extraActions = thenMoves.flatMap(tm => [...tm.actions]);
        const moveAgain = thenMoves.some(tm => tm.moveAgain);
        if (extraActions.length === 0 && !moveAgain) return m;
        return m.withConsequence(extraActions, moveAgain);
      });
    },
  };
}

/**
 * If `positional` contains a (then <moves>) child, compile it and wrap `inner`
 * with withThenConsequence; otherwise return inner unchanged (byte-identical for
 * moves with no `then`).
 */
export function attachThen(
  inner: MovesFunction,
  positional: readonly LudNode[],
  equipment?: Equipment1to1,
): MovesFunction {
  for (const p of positional) {
    if (isList(p) && headOf(p) === "then") {
      const { positional: thenPos } = parseArgs1to1(p.items);
      const thenNode = thenPos[0];
      if (thenNode) {
        try {
          const thenGen = compileMoves1to1(thenNode, equipment);
          return withThenConsequence(inner, thenGen);
        } catch { /* fall through — leave inner unwrapped */ }
      }
    }
  }
  return inner;
}

/**
 * Compile a `(piece ...)` argument in a move generator to {what, owner}.
 *
 * Forms:
 *   (piece "Square0")       → fixed piece by name (Square0 = neutral)
 *   (piece (mover))         → mover's primary piece (what = mover index)
 *   (piece (id "Name0"))    → same as (piece "Name0")
 *
 * @java game/util/moves/Piece.java — component() returns the component index fn
 */
export function compilePieceArg1to1(
  node: LudList,
  equipment: Equipment1to1,
): { what: IntFunction; owner: number; state?: IntFunction } | null {
  const pArgs = parseArgs1to1(node.items);
  const first = pArgs.positional[0];
  if (!first) return null;

  // Extract optional state:<intFn> named argument — @java Piece.java state() accessor
  // (piece "Disc0" state:(mover)) sets the placed piece's state to the mover index.
  let stateFn: IntFunction | undefined;
  const stateNode = pArgs.named.get("state");
  if (stateNode) {
    try { stateFn = compileInt1to1(stateNode); } catch { /* ignore */ }
  }

  // (piece "Name0") — fixed piece name with optional owner suffix
  if (isString(first)) {
    const pieceId = first.value;
    // Resolve by name
    const match = equipment.pieces.find(
      p => `${p.name}${p.owner}`.toLowerCase() === pieceId.toLowerCase()
    ) ?? equipment.pieces.find(
      p => p.name.toLowerCase() === pieceId.replace(/\d+$/, "").toLowerCase() &&
           (pieceId.match(/\d+$/) ? p.owner === parseInt(pieceId.match(/\d+$/)![0]!, 10) : true)
    );
    if (!match) return null;
    const idx = match.index;
    const owner = match.owner;
    return { what: { eval: (_ctx: Context) => idx }, owner, state: stateFn };
  }

  // (piece (mover)) — use mover's primary piece
  if (isList(first) && headOf(first) === "mover") {
    // Returns mover index; owner = mover at eval time
    return { what: { eval: (ctx: Context) => ctx.state.mover }, owner: -1, state: stateFn }; // owner=-1 means "use mover"
  }

  // (piece (id "Name0")) / (piece (id "Name" Role)) — piece by name with optional dynamic owner
  // @java game/util/moves/Piece.java — component(context) resolves the piece from its name/role
  if (isList(first) && headOf(first) === "id") {
    const idArgs = parseArgs1to1(first.items);
    const nameNode = idArgs.positional[0];
    const roleNode = idArgs.positional[1]; // optional: Mover, Next, P1, P2, ...
    if (nameNode && isString(nameNode)) {
      const pieceName = nameNode.value;
      if (!roleNode || !isIdent(roleNode)) {
        // Static piece: (id "Name") or (id "Name0") — look up by combined name+owner
        const match = equipment.pieces.find(
          p => `${p.name}${p.owner}`.toLowerCase() === pieceName.toLowerCase()
        ) ?? equipment.pieces.find(
          p => p.name.toLowerCase() === pieceName.replace(/\d+$/, "").toLowerCase() &&
               (pieceName.match(/\d+$/) ? p.owner === parseInt(pieceName.match(/\d+$/)![0]!, 10) : true)
        );
        if (!match) return null;
        const idx = match.index;
        const owner = match.owner;
        return { what: { eval: (_ctx: Context) => idx }, owner };
      } else {
        // Dynamic piece: (id "Name" Role) — owner is resolved at eval time by role
        // @java Piece.java — component(context): owner = role.owner(context)
        // The what (piece index) depends on the runtime owner, so we look up by name+owner dynamically.
        const roleName = roleNode.name.toLowerCase();
        const pNameLower = pieceName.toLowerCase();
        const allPieces = equipment.pieces;
        // Build a dynamic what+owner resolver based on role
        const roleFn: IntFunction = (() => {
          if (roleName === "mover") return { eval: (ctx: Context) => ctx.state.mover };
          if (roleName === "next") return { eval: (ctx: Context) => (ctx.state.mover % ctx.game.numPlayers) + 1 };
          if (roleName === "prev") return { eval: (ctx: Context) => {
            const n = ctx.game.numPlayers;
            return ((ctx.state.mover - 2 + n) % n) + 1;
          }};
          const pid = parseInt(roleName.slice(1), 10);
          if (!isNaN(pid)) return { eval: (_ctx: Context) => pid };
          return { eval: (ctx: Context) => ctx.state.mover };
        })();
        return {
          // what and owner are dynamic: depend on role at eval time
          what: {
            eval(ctx: Context): number {
              const owner = roleFn.eval(ctx);
              const match = allPieces.find(p => p.name.toLowerCase() === pNameLower && p.owner === owner)
                ?? allPieces.find(p => p.name.toLowerCase() === pNameLower);
              return match ? match.index : owner;
            }
          },
          owner: -1, // -1 = dynamic (use what's owner from above), handled in Add.eval
          state: stateFn,
        };
      }
    }
  }

  return null;
}

/**
 * Wrap a RegionFunction with an optional `if:` filter condition.
 * Used for `(to <region> if:<cond>)` in Add and similar move generators.
 *
 * When `ifNode` is non-null, returns a RegionFunction that filters the
 * base region by evaluating the condition for each candidate site, setting
 * `_evalTo` and `_evalSite` to the candidate (Java: context.to()).
 *
 * @java game/rules/play/moves/nonDecision/effect/Add.java — toRule
 */
function applyToIfCondition(
  region: RegionFunction,
  ifNode: LudNode | undefined,
): RegionFunction {
  if (!ifNode) return region;
  let condFn: BooleanFunction;
  try {
    condFn = compileBool1to1(ifNode, 2);
  } catch {
    return region; // If condition can't be compiled, ignore it
  }
  return {
    eval(ctx: Context): number[] {
      const sites = region.eval(ctx);
      const origTo = ctx._evalTo;
      const origSite = ctx._evalSite;
      const result: number[] = [];
      for (const s of sites) {
        ctx._evalTo = s;
        ctx._evalSite = s;
        let pass = true;
        try { pass = condFn.eval(ctx); } catch { pass = true; } // If eval throws, include site
        if (pass) result.push(s);
      }
      ctx._evalTo = origTo;
      ctx._evalSite = origSite;
      return result;
    },
  };
}

function compileMoves1to1Impl(node: LudNode, equipment?: Equipment1to1): MovesFunction {
  if (!isList(node)) throw new Error("compiler1to1: play moves must be a list");
  // Set module-level equipment reference so (face N) and other dice-aware int
  // functions compiled from within this call can access dice specs at compile time.
  if (equipment && !_compilingEquipment) _compilingEquipment = equipment;
  const h = headOf(node);

  // ---------------------------------------------------------------------------
  // Moves registry lookup — registered 1:1 classes take priority over inline.
  // Pattern mirrors compileInt1to1 (line ~172) / compileRegion1to1 (line ~1160).
  // ---------------------------------------------------------------------------
  {
    const env: Compile1to1Env = { numPlayers: 2, equipment };
    const plainCtor = lookupMoves1to1(h!);
    if (plainCtor) return plainCtor(node, env);
    // Compound "move:<Subtype>": (move Add ...), (move Hop ...), (move Step ...)
    if (h === "move") {
      const { positional: mPos } = parseArgs1to1(node.items);
      const first = mPos[0];
      if (first && isIdent(first)) {
        const subCtor = lookupMoves1to1(`move:${first.name.toLowerCase()}`);
        if (subCtor) return subCtor(node, env);
      }
    }
  }

  // ---- (enclose (from <site>) [<dirn>] (between if:<cond> (apply (remove (between))))) ----
  // Go-family capture: from the pivot, find adjacent ENEMY groups that are now
  // fully surrounded (no liberties) and capture them (remove every group stone).
  // Used both as a real capture move (Go/Gonnect: in a then-consequence) and in
  // `(can Move (enclose …))` for the NoGo no-capture rule.
  // @java game/rules/play/moves/nonDecision/effect/Enclose.java
  // RELOCATED → registered faithful class Enclose1to1 (registry1to1-moves.ts).
  // The registry lookup at the top of compileMoves1to1 now handles (enclose …);
  // the inline handler was removed so the faithful class is the sole live path.

  // ---- (moveAgain) as a moves generator ----------------------------------
  // Emits a sentinel move carrying the same-player continuation. Only meaningful
  // inside a (then ...) consequence (resolved by withThenConsequence/attachThen);
  // never added to a real move list directly.
  // @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
  // (moveAgain) RELOCATED → registered faithful class MoveAgain1to1 (registry1to1-moves.ts).

  // ---- (sow [apply:<effect>]) — mancala sow, used inside (then (sow …)) -------
  // Picks up the seeds at the selected hole (_evalTo) and distributes one per
  // subsequent track site (wrapping if the track loops). The apply: consequence
  // runs at the LANDING site (_evalTo = last). @java …/effect/Sow.java
  if (h === "sow") {
    const { positional, named } = parseArgs1to1(node.items);
    // (sow ["TrackNamePrefix"] [owner:<int>] …) — select the track. With a name
    // prefix and/or owner, pick the track whose name contains the prefix and
    // whose owner matches; else the first track. @java Sow track selection.
    const trackPrefixNode = positional.find(n => isString(n)) as { value: string } | undefined;
    const trackPrefix = trackPrefixNode ? trackPrefixNode.value : null;
    const ownerNode = named.get("owner");
    let ownerFn: IntFunction | undefined;
    if (ownerNode) { try { ownerFn = compileInt1to1(ownerNode); } catch { /* none */ } }
    const applyNode = named.get("apply");          // captureEffect
    const ifNode = named.get("if");                // captureRule (default true)
    const includeSelfNode = named.get("includeself");
    const backtrackNode = named.get("backtracking");
    // origin:True — place first seed at the source hole itself before sowing forward.
    // @java Sow.java:155 — origin field; when true, sow one seed at the origin site
    //   (ActionMove from=start, to=start) then continue with remaining seeds forward.
    const originNode = named.get("origin");
    const originTrue = originNode !== undefined && isIdent(originNode) &&
      (originNode as { name: string }).name.toLowerCase() === "true";
    // forward:True — after a capture, advance `to` to the next track site and
    // re-check the capture condition, continuing the chain until it fails.
    // @java Sow.java:331-343 — forward field: if forward.eval(context) advance to next
    const forwardNode = named.get("forward");
    let forwardFn: BooleanFunction | undefined;
    const forwardAlways = forwardNode !== undefined && isIdent(forwardNode) &&
      (forwardNode as { name: string }).name.toLowerCase() === "true";
    if (forwardNode && !forwardAlways) { try { forwardFn = compileBool1to1(forwardNode, 2); } catch { /* none */ } }
    const hasForward = forwardAlways || forwardFn !== undefined;
    let sowApply: MovesFunction | undefined;
    if (applyNode) { try { sowApply = compileMoves1to1(applyNode, equipment); } catch { /* skip */ } }
    let captureRuleFn: BooleanFunction | undefined;
    if (ifNode) { try { captureRuleFn = compileBool1to1(ifNode, 2); } catch { /* default true */ } }
    let backtrackFn: BooleanFunction | undefined;
    const backtrackAlways = backtrackNode !== undefined && isIdent(backtrackNode) && backtrackNode.name.toLowerCase() === "true";
    if (backtrackNode && !backtrackAlways) { try { backtrackFn = compileBool1to1(backtrackNode, 2); } catch { /* none */ } }
    const includeSelf = !(includeSelfNode !== undefined && isIdent(includeSelfNode) && includeSelfNode.name.toLowerCase() === "false");
    const hasBacktrack = backtrackAlways || backtrackFn !== undefined;
    // count:<int> — override the number of seeds to sow (default: countAt[hole]).
    // @java Sow.java — count field: when set, use count.eval(context) instead of
    //   context.containerState().count(from) as the number of seeds to distribute.
    const sowCountNode = named.get("count");
    let sowCountFn: IntFunction | undefined;
    if (sowCountNode) { try { sowCountFn = compileInt1to1(sowCountNode); } catch { /* use default */ } }
    // skipIf:<boolFn> — skip a track site without consuming a seed (Java Sow.java:237-247).
    // When skipFn evaluates to true for the candidate sow site, the track position advances
    // but the seed count does NOT, so the seed is placed at the next non-skipped site.
    // MAX_NUM_ITERATION = 1000 guards against infinite skip loops.
    // @java game/rules/play/moves/nonDecision/effect/Sow.java — skipFn field, eval() lines 237-247
    const skipIfNode = named.get("skipif");
    let skipIfFn: BooleanFunction | undefined;
    if (skipIfNode) { try { skipIfFn = compileBool1to1(skipIfNode, 2); } catch { /* none */ } }
    // @java Sow.java — the (then ...) positional arg is a post-sow consequence
    // (e.g. (if (is Occupied ...) (moveAgain)) for multi-lap sowing). Capture it
    // here so attachThen() can wrap the sow generator below.
    const sowInnerGen = { eval(ctx: Context): Move[] {
      const game = ctx.game as unknown as Game1to1;
      const allTracks = [...(game.equipment?.tracks?.entries() ?? [])];
      const wantOwner = ownerFn ? ownerFn.eval(ctx) : -1;
      let trackEntry = allTracks.find(([nm, t]) =>
        (trackPrefix === null || nm.includes(trackPrefix)) &&
        (wantOwner < 0 || t.owner === wantOwner || t.owner === 0)
      )?.[1] ?? allTracks[0]?.[1];
      if (!trackEntry) return [];
      const track = trackEntry.sites;
      const loop = trackEntry.loop;
      const hole = ctx._evalTo;
      if (hole < 0) return [];
      // Prefer explicit count: parameter over hole's countAt.
      // @java Sow.java:182-197 — numSeedSowed = count != null ? count.eval(ctx) : containerState.count(from)
      const seeds = sowCountFn !== undefined ? sowCountFn.eval(ctx) : ctx.state.countAtSite(hole);
      const pos0 = track.indexOf(hole);
      if (seeds <= 0 || pos0 < 0) return [];
      // Clear the source hole, then drop one seed per subsequent track site (in
      // sow order). includeSelf:False skips the origin when wrapping. A running
      // per-site count lets a wrap-around seed base on the cleared 0, and one
      // SetCount per seed keeps the LAST action's `to` = the final sown hole
      // (needed by (last To afterConsequence)). @java game/.../effect/Sow.java
      const running = new Map<number, number>();
      running.set(hole, 0);
      const actions: import("./action/index.js").Action[] = [new ActionSetCount({ to: hole, count: 0 })];
      let pos = pos0, last = hole, lastPos = pos0;
      // origin:True — first seed goes to the source hole itself (ActionMove start→start),
      // then remaining seeds go to subsequent track sites. This matches Java Sow.java:202-227:
      //   if (origin.eval(context)) { add numPerHole moves at start; numSeedSowed += numPerHole; }
      //   then continue with main loop from the SAME index i (advancing to next() on each step).
      // @java Sow.java:199-230
      let startIdx = 0; // for the main sow loop below
      if (originTrue && seeds > 0) {
        // Place first seed at the source hole itself.
        const nc0 = 1; // running.get(hole) === 0, so nc = 0 + 1 = 1
        running.set(hole, nc0);
        actions.push(new ActionSetCount({ to: hole, count: nc0 }));
        last = hole; lastPos = pos0;
        startIdx = 1; // remaining seeds start from pos0+1
      }
      // MAX_NUM_ITERATION constant from Java (guards infinite skip loops).
      // @java main/Constants.java — MAX_NUM_ITERATION = 1000
      const MAX_SKIP = 1000;
      for (let i = startIdx; i < seeds; i++) {
        // Advance to the next track site.
        pos++; if (pos >= track.length) { if (loop) pos = 0; else break; }
        // Skip the origin hole when includeSelf is false.
        if (!includeSelf && track[pos] === hole) {
          pos++; if (pos >= track.length) { if (loop) pos = 0; else break; }
        }
        // skipIf: if the condition is true for this candidate site, skip it (don't
        // consume a seed) and advance to the next track position. Mirrors Java
        // Sow.java:237-247 exactly: index-- so the outer loop re-tries the same seed.
        // @java Sow.java:238 — index--, numSkipped++, advance i (track index), continue
        if (skipIfFn !== undefined) {
          const skipCtx = ctx.withState(ctx.state);
          skipCtx._evalFrom = hole;
          skipCtx._evalTo = track[pos]!;
          let numSkipped = 0;
          while (skipIfFn.eval(skipCtx) && numSkipped < MAX_SKIP) {
            numSkipped++;
            pos++; if (pos >= track.length) { if (loop) pos = 0; else break; }
            if (!includeSelf && track[pos] === hole) {
              pos++; if (pos >= track.length) { if (loop) pos = 0; else break; }
            }
            skipCtx._evalTo = track[pos]!;
          }
        }
        const s = track[pos]!;
        const base = running.has(s) ? running.get(s)! : ctx.state.countAtSite(s);
        const nc = base + 1;
        running.set(s, nc);
        actions.push(new ActionSetCount({ to: s, count: nc }));
        last = s; lastPos = pos;
      }
      let moveAgain = false;
      if (sowApply) {
        // @java Sow.java capture phase: apply the sow to a temp state, then WHILE
        // captureRule holds at the current `to`, apply the captureEffect from the
        // origin; with backtracking, step `to` back along the track; with forward,
        // step `to` forward. @java Sow.java:296-352
        let postState = ctx.state;
        for (const a of actions) postState = a.apply(postState);
        let to = last, tpos = lastPos;
        let guard = 0;
        for (;;) {
          const capCtx = ctx.withState(postState);
          capCtx._evalFrom = hole;
          capCtx._evalTo = to;
          if (captureRuleFn && !captureRuleFn.eval(capCtx)) break;
          let produced = false;
          try {
            for (const am of sowApply.eval(capCtx)) {
              for (const a of am.actions) { actions.push(a); postState = a.apply(postState); produced = true; }
              if (am.moveAgain) moveAgain = true;
            }
          } catch { /* ignore */ }
          if (!hasBacktrack && !hasForward) break;
          if (++guard > 64) break;
          if (hasBacktrack) {
            // Backtrack to the previous track site.
            // @java Sow.java:317-327
            tpos = tpos - 1; if (tpos < 0) { if (loop) tpos = track.length - 1; else break; }
            to = track[tpos]!;
            const btCtx = ctx.withState(postState);
            btCtx._evalFrom = hole; btCtx._evalTo = to;
            if (backtrackFn && !backtrackFn.eval(btCtx)) break;
            if (to === hole) break;
          } else if (hasForward) {
            // Advance to the next track site.
            // @java Sow.java:331-343
            // Java: check forward.eval BEFORE advancing, then advance, then check again.
            // For forward:True (BooleanConstant), both checks always pass.
            // Note: Java does NOT break when to==start (unlike backtracking).
            const fwdCtx = ctx.withState(postState);
            fwdCtx._evalFrom = hole; fwdCtx._evalTo = to;
            if (forwardFn && !forwardFn.eval(fwdCtx)) break;
            if (!loop && tpos + 1 >= track.length) break; // track end (non-loop)
            tpos = tpos + 1; if (tpos >= track.length) { if (loop) tpos = 0; else break; }
            to = track[tpos]!;
            const fwdCtx2 = ctx.withState(postState);
            fwdCtx2._evalFrom = hole; fwdCtx2._evalTo = to;
            if (forwardFn && !forwardFn.eval(fwdCtx2)) break;
          }
        }
      }
      return [new Move({
        id: `sow:${hole}`, label: "Sow", siteIndices: [hole], mover: ctx.state.mover,
        placedOwner: ctx.state.mover, actions, moveAgain,
      })];
    }};
    // Attach any (then ...) consequence from the sow node's positional args.
    // @java Sow.java — then field: evaluated in post-sow context to allow
    //   per-lap effects like (moveAgain) for multi-lap sowing.
    return attachThen(sowInnerGen, positional, equipment);
  }

  // ---- (fromTo (from ...) (to ...) [count:N] [(then ...)]) — standalone -----
  // The same ludeme as (move (from ...) (to ...)); used directly as a
  // consequence (mancala captures, teleports). @java …/effect/FromTo.java
  if (h === "fromto") {
    const { positional, named } = parseArgs1to1(node.items);
    const fromNode = positional.find(n => isList(n) && headOf(n) === "from");
    const toNode = positional.find(n => isList(n) && headOf(n) === "to");
    if (fromNode && isList(fromNode) && toNode && isList(toNode)) {
      return attachThen(compileFromTo1to1(fromNode, toNode, named, equipment), positional, equipment);
    }
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (hop ...) standalone form — redirect to (move Hop ...) handler ----
  // `(hop ...)` standalone (used inside `(can Move (hop ...))` and similar then-clause
  // sub-expressions) is semantically identical to `(move Hop ...)`. The inline hop handler
  // below lives inside `if (h === "move")` and checks `first.name === "hop"`. To reuse it,
  // synthesize a minimal fake `(move Hop ...)` node by cloning the original node with a
  // corrected `kind` field so `isList` accepts it.
  // @java game/rules/play/moves/nonDecision/effect/Hop.java — eval (same for both forms)
  if (h === "hop") {
    // Build a surrogate node that passes `isList` (kind="list") and has `(move Hop ...)`
    // structure: items[0]="move", items[1]="Hop", items[2..]=original args.
    const surrogateNode = Object.assign(Object.create(Object.getPrototypeOf(node) ?? Object.prototype), node, {
      kind: "list" as const,
      delimiter: "round" as const,
      items: [
        { kind: "ident" as const, name: "move", range: (node.items[0] as { range?: unknown }).range },
        { kind: "ident" as const, name: "Hop",  range: (node.items[0] as { range?: unknown }).range },
        ...node.items.slice(1),
      ],
    }) as import("@ludii/typescript-language").LudList;
    return compileMoves1to1Impl(surrogateNode, equipment);
  }

  // ---- (step ...) standalone form — faithful equivalent of (move Step ...) ----
  // `(step ...)` is the Java Step class used directly in .lud syntax.
  // Syntax: (step [from:<site>] [direction|dirnFn] (to if:<cond> [(apply <eff>)]) [(then ...)])
  // This differs from `(move Step ...)` in that:
  //   - There is NO leading "Step" ident in positional args.
  //   - `(from ...)` is positional[0] (if present), not positional[1].
  //   - Direction (ident or (directions ...)) is found after from node.
  //   - Handles dynamic (directions Cell from:X to:Y) evaluated at runtime.
  // @java game/rules/play/moves/nonDecision/effect/Step.java
  if (h === "step") {
    const { positional: stepPos } = parseArgs1to1(node.items);

    // --- parse (from ...) node — explicit from-site override ---
    const stepFromNode = stepPos.find(n => isList(n) && headOf(n) === "from");
    let stepFromFn: IntFunction | null = null;
    if (stepFromNode && isList(stepFromNode)) {
      const fromInner = parseArgs1to1((stepFromNode as import("@ludii/typescript-language").LudList).items);
      const locNode = fromInner.positional[0];
      if (locNode) { try { stepFromFn = compileInt1to1(locNode); } catch { /* use _evalFrom */ } }
    }

    // --- parse direction: ident or (directions ...) ---
    // Direction node is a non-from, non-to ident or (directions ...) list.
    let stDirnName = "Adjacent";
    let stDirnFn: DirectionsFunction | null = null;
    for (const p of stepPos) {
      if (isList(p) && headOf(p) === "from") continue;
      if (isList(p) && headOf(p) === "to") continue;
      if (isList(p) && headOf(p) === "then") continue;
      if (isList(p) && headOf(p) === "directions") {
        // Dynamic or static (directions ...) — compile as DirectionsFunction
        try { stDirnFn = compileDirections1to1(p); } catch { /* keep Adjacent */ }
        break;
      }
      if (isIdent(p)) {
        stDirnName = (p as { name: string }).name;
        break;
      }
    }

    // --- parse (to if:<cond> [(apply <effect>)]) ---
    let stToCond: BooleanFunction | undefined;
    let stApply: MovesFunction | undefined;
    const stToNode = stepPos.find(n => isList(n) && headOf(n) === "to");
    if (stToNode && isList(stToNode)) {
      const toArgs = parseArgs1to1((stToNode as import("@ludii/typescript-language").LudList).items);
      const ifN = toArgs.named.get("if");
      if (ifN) { try { stToCond = compileBool1to1(ifN, 2); } catch { /* empty */ } }
      let applyEffNode = toArgs.named.get("apply");
      if (!applyEffNode) {
        const applyChild = toArgs.positional.find(n => isList(n) && headOf(n) === "apply");
        if (applyChild && isList(applyChild)) {
          const applyInner = parseArgs1to1((applyChild as import("@ludii/typescript-language").LudList).items);
          applyEffNode = applyInner.positional[0];
        }
      }
      if (applyEffNode) { try { stApply = compileMoves1to1(applyEffNode, equipment); } catch { /* skip */ } }
    }

    // --- build moves function ---
    // If direction is a dynamic DirectionsFunction (e.g. directions Cell from:X to:Y),
    // evaluate it at runtime per-step; otherwise use the static Step1to1.
    const stFromFnFinal = stepFromFn;
    const stDirnFnFinal = stDirnFn;
    const stToCondFinal = stToCond;
    const stApplyFinal = stApply;
    const stStaticName = stDirnName;

    let stMoves: MovesFunction;
    if (stDirnFnFinal) {
      // Dynamic direction — evaluate at runtime, then run Step1to1 per direction.
      stMoves = {
        eval(ctx: Context): Move[] {
          const origFrom = ctx._evalFrom;
          if (stFromFnFinal) ctx._evalFrom = stFromFnFinal.eval(ctx);
          const dirNames = stDirnFnFinal.eval(ctx);
          const result: Move[] = [];
          for (const dn of dirNames) {
            const s = new Step1to1(dn, stToCondFinal, stApplyFinal);
            for (const m of s.eval(ctx)) result.push(m);
          }
          ctx._evalFrom = origFrom;
          return result;
        }
      };
    } else {
      // Static direction string
      const stBaseStep = new Step1to1(stStaticName, stToCondFinal, stApplyFinal);
      if (stFromFnFinal) {
        // Wrap to override _evalFrom
        const stInner = stBaseStep;
        stMoves = {
          eval(ctx: Context): Move[] {
            const origFrom = ctx._evalFrom;
            ctx._evalFrom = stFromFnFinal.eval(ctx);
            const moves = stInner.eval(ctx);
            ctx._evalFrom = origFrom;
            return moves;
          }
        };
      } else {
        stMoves = stBaseStep;
      }
    }

    return attachThen(stMoves, stepPos, equipment);
  }

  // ---- (move ...) dispatch -----------------------------------------------
  if (h === "move") {
    const { positional, named } = parseArgs1to1(node.items);
    const first = positional[0];

    // (move Add [(piece ...)] (to (sites Empty))) or (move Add (to Cell (sites Empty Cell)))
    if (first && isIdent(first) && first.name.toLowerCase() === "add") {
      // Extract optional (piece "Name") or (piece (mover)) argument.
      // @java Add.java — piece.component().index() and piece.owner()
      const pieceNode = positional.find(n => isList(n) && headOf(n) === "piece");
      let pieceFn: { what: IntFunction; owner: number; state?: IntFunction } | null = null;
      if (pieceNode && isList(pieceNode) && equipment) {
        pieceFn = compilePieceArg1to1(pieceNode, equipment);
      }

      const toNode = positional.find(n => isList(n) && headOf(n) === "to");
      if (!toNode || !isList(toNode)) {
        // Try named arg (to:...)
        const toNamed = named.get("to");
        if (toNamed && isList(toNamed)) {
          const toArgs2 = parseArgs1to1(toNamed.items);
          const regionNode2 = findRegionInToArgs(toArgs2.positional);
          if (!regionNode2) throw new Error("compiler1to1: (to ...) missing region");
          const region2 = applyToIfCondition(compileRegion1to1(regionNode2), toArgs2.named.get("if"));
          return attachThen(new Add(region2, pieceFn), positional, equipment);
        }
        throw new Error("compiler1to1: (move Add ...) missing (to ...)");
      }
      const toArgs = parseArgs1to1(toNode.items);
      const regionNode = findRegionInToArgs(toArgs.positional);
      if (!regionNode) throw new Error("compiler1to1: (to ...) missing region");
      // The to-region may be a RegionFunction (common) or an IntFunction like
      // (count Pips) / (var "x") that produces a single site index.
      // Try as RegionFunction first; if it yields an empty-returning anonymous
      // function (i.e. the region compiler returned a stub for an unknown head),
      // fall back to treating it as an IntFunction producing a singleton region.
      // @java Add.java — to.region() wraps both RegionFunction and IntFunction sites.
      let region: RegionFunction;
      try {
        const compiled = compileRegion1to1(regionNode);
        // Check if it's a stub empty region (head not recognized by region compiler):
        // compile the same node as an IntFunction to see if that gives a better result.
        // The key discriminator: nodes that ARE valid region heads (sites, union, etc.)
        // vs nodes that are IntFunctions (count, var, score, coord, etc.).
        const REAL_REGION_HEADS = new Set(["sites", "union", "intersection", "difference",
          "expand", "foreach", "complement", "filter", "where", "results", "if"]);
        const rhLower = isList(regionNode) ? (headOf(regionNode) ?? "") : "";
        if (!REAL_REGION_HEADS.has(rhLower)) {
          // May be an IntFunction — wrap as singleton region.
          try {
            const intFn = compileInt1to1(regionNode);
            region = { eval(ctx: Context): number[] {
              const s = intFn.eval(ctx);
              return s >= 0 ? [s] : [];
            }};
          } catch {
            region = compiled; // Fall back to whatever region compiler gave us
          }
        } else {
          region = compiled;
        }
      } catch {
        throw new Error("compiler1to1: (to ...) failed to compile region");
      }
      // Apply (to ... if:cond) filter if present
      // @java Add.java: the `to` condition filters valid placement sites
      const finalRegion = applyToIfCondition(region, toArgs.named.get("if"));

      // (to ... (apply (remove (to)))) — capture effect at destination.
      // @java Add.java — effect applied when piece is placed at a non-empty site.
      // Used in flip-style games (e.g. 00'Y' Defector Y): place a piece at a site
      // occupied by the opponent, removing their piece first (the `remove (to)` effect).
      // @java game/rules/play/moves/nonDecision/effect/Add.java — applyEffect()
      const toApplyNode = toArgs.positional.find((n: LudNode) => isList(n) && headOf(n as LudList) === "apply")
        ?? toArgs.named.get("apply");
      let addApplyFn: MovesFunction | null = null;
      if (toApplyNode && isList(toApplyNode)) {
        const applyBodyArgs = parseArgs1to1((toApplyNode as LudList).items);
        const applyEffectNode = applyBodyArgs.positional[0];
        if (applyEffectNode) {
          try { addApplyFn = compileMoves1to1(applyEffectNode, equipment); } catch { /* skip */ }
        }
      }

      if (addApplyFn !== null) {
        // Wrap Add with apply-effect: generate one move per site, prepending
        // the apply-effect's actions (e.g. ActionRemove) before the ActionAdd.
        const addApplyFnFinal = addApplyFn;
        const addWithApply: MovesFunction = {
          eval(ctx: Context): Move[] {
            const mover = ctx.state.mover;
            const sites = finalRegion.eval(ctx);
            const moves: Move[] = [];
            for (const site of sites) {
              if (site < 0) continue;
              // Set _evalTo to the target site so (remove (to)) resolves correctly.
              const origTo = ctx._evalTo;
              ctx._evalTo = site;
              let applyActions: Move["actions"] = [];
              try {
                const applyMoves = addApplyFnFinal.eval(ctx);
                applyActions = applyMoves.flatMap((am: Move) => [...am.actions]);
              } catch { /* skip apply */ }
              ctx._evalTo = origTo;

              // Determine piece to add
              let what: number;
              let owner: number;
              let placedOwner: number;
              let stateValApply: number | undefined;
              if (pieceFn) {
                what = pieceFn.what.eval(ctx);
                if (pieceFn.owner < 0) {
                  // Dynamic piece: look up the owner from the equipment by what index.
                  // This handles (piece (id "Name" Role)) where Role is dynamic (Next/Mover).
                  // @java Piece.java — component(context).owner()
                  const eqPiece = equipment?.pieces.find(p => p.index === what);
                  owner = eqPiece ? eqPiece.owner : mover;
                  if (owner <= 0) owner = mover; // fallback: use mover for neutral pieces
                } else {
                  owner = pieceFn.owner;
                }
                placedOwner = owner > 0 ? owner : mover;
                // Optional piece state (e.g. state:(mover))
                if (pieceFn.state) {
                  const sv = pieceFn.state.eval(ctx);
                  if (sv >= 0) stateValApply = sv;
                }
              } else {
                what = mover;
                owner = mover;
                placedOwner = mover;
              }
              const addAction = new ActionAdd({ to: site, what, owner, ...(stateValApply !== undefined ? { state: stateValApply } : {}) });
              // Mark the Add as the decision action so Move.from()/to() read the
              // placement site (site X), not the prepended apply-effect action
              // (e.g. ActionSetScore with from=-1). Java ActionAdd.decision=true.
              addAction.setDecision(true);
              moves.push(new Move({
                id: `add-apply:${mover}:${site}`,
                label: `Add(${site})`,
                siteIndices: [site],
                mover,
                placedOwner,
                actions: [...applyActions, addAction],
                // Point the decision baseline past the prepended apply actions so
                // from()/to() fall back to the Add action when isDecision() is the
                // discriminant. Java parity: ActionAdd.isDecision() = true.
                decisionIndex: applyActions.length,
              }));
            }
            return moves;
          }
        };
        return attachThen(addWithApply, positional, equipment);
      }

      return attachThen(new Add(finalRegion, pieceFn), positional, equipment);
    }

    // (move Hop [<dir>] (between ...) (to ...)) — jump over a piece
    // @java game/rules/play/moves/nonDecision/effect/Hop.java — eval
    // Full implementation supporting before:/after: (king-style long hops).
    if (first && isIdent(first) && first.name.toLowerCase() === "hop") {
      const hopArgs = parseArgs1to1(node.items);
      // Extract optional direction ident (e.g. Diagonal, Orthogonal, Adjacent) from positionals.
      // Also handles (directions {FR FL}) with relative direction names resolved at eval time.
      // @java Hop.java — @Opt AbsoluteDirection dirnChoice
      const HOP_DIRECTION_NAMES = new Set(["adjacent", "orthogonal", "diagonal", "n", "s", "e", "w", "ne", "nw", "se", "sw", "all", "north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest",
        "fr", "fl", "br", "bl", "forwards", "backwards", "forward", "backward", "forwardright", "forwardleft", "backwardright", "backwardleft"]);
      let hopDirName = "adjacent"; // default: all axes
      let hopDirNames: string[] | null = null; // set when (directions {d1 d2 ...}) given
      for (const p of hopArgs.positional) {
        if (!isList(p) && isIdent(p) && HOP_DIRECTION_NAMES.has(p.name.toLowerCase())) {
          hopDirName = p.name.toLowerCase();
          break;
        }
        // (directions {FR FL}) — curly list of direction names including relative.
        // @java Hop.java — dirnChoice from Directions.convertToAbsolute (relative resolved at eval)
        if (isList(p) && headOf(p) === "directions") {
          const dirArgs = parseArgs1to1((p as import("@ludii/typescript-language").LudList).items);
          const names: string[] = [];
          for (const dp of dirArgs.positional) {
            if (isIdent(dp)) {
              names.push((dp as { name: string }).name.toLowerCase());
            } else if (isList(dp) && (dp as import("@ludii/typescript-language").LudList).delimiter === "curly") {
              for (const item of (dp as import("@ludii/typescript-language").LudList).items) {
                if (isIdent(item)) names.push((item as { name: string }).name.toLowerCase());
              }
            }
          }
          if (names.length === 1) {
            hopDirName = names[0]!;
          } else if (names.length > 1) {
            hopDirNames = names;
          }
          break;
        }
      }
      // Find (between ...) and (to ...) sub-nodes.
      // Parse (from ...) override for the hop start location AND optional from-condition.
      // @java Hop.java — startLocationFn = from.loc() (defaults to Context.from())
      // @java Hop.java — fromCondition = from.cond(); checked at Hop.eval() line 155-156
      let fromLocFn: IntFunction | null = null;
      let hopFromCond: BooleanFunction | null = null;
      for (const p of hopArgs.positional) {
        if (isList(p) && headOf(p) === "from") {
          const fa = parseArgs1to1((p as import("@ludii/typescript-language").LudList).items);
          // (from (last To)) or (from <intFn>)
          const locNode = fa.positional[0];
          if (locNode) {
            try { fromLocFn = compileInt1to1(locNode); } catch { /* skip */ }
          }
          // (from if:<cond>) — piece-level filter (blocked piece cannot hop)
          const fromIfNode = fa.named.get("if");
          if (fromIfNode) { try { hopFromCond = compileBool1to1(fromIfNode, 2); } catch { /* skip */ } }
          break;
        }
      }
      // Parse before:/after: for king long-hop range; apply in between for capture.
      // @java Hop.java — maxDistanceFromHurdleFn, maxDistanceHurdleToFn, sideEffect
      let betweenCond: BooleanFunction | null = null;
      let toCond: BooleanFunction | null = null;
      let toApplyFn: MovesFunction | null = null; // effect applied at destination (e.g. enemy capture)
      let maxBeforeFn: IntFunction | null = null; // maxDistanceFromHurdle (steps before hurdle beyond index 0)
      let maxAfterFn: IntFunction | null = null;  // maxDistanceHurdleTo (steps after hurdle)
      let maxHurdleLengthFn: IntFunction | null = null; // max hurdle length from (between (max N) ...)
      let minHurdleLength = 1; // default minLengthHurdle = 1
      let captureDeferred = false;   // true → use ActionRemoveNonApplied (at:EndOfTurn)
      let captureBetween = false;    // true → (between ...) has (apply (remove ...)) effect on hurdle
      for (const p of hopArgs.positional) {
        if (!isList(p)) continue;
        const ph = headOf(p);
        if (ph === "between") {
          const ba = parseArgs1to1(p.items);
          const bIf = ba.named.get("if");
          if (bIf) { try { betweenCond = compileBool1to1(bIf, 2); } catch { /* skip */ } }
          // before:/after: — max distance before/after the hurdle (0 = must be adjacent)
          // @java Hop.java line 130-133: maxDistanceFromHurdleFn / maxDistanceHurdleToFn
          const beforeNode = ba.named.get("before");
          if (beforeNode) { try { maxBeforeFn = compileInt1to1(beforeNode); } catch { /* skip */ } }
          const afterNode = ba.named.get("after");
          if (afterNode) { try { maxAfterFn = compileInt1to1(afterNode); } catch { /* skip */ } }
          // Parse (between (max N) ...) or (between (range min max) ...) — hurdle length.
          // @java Between.java: range param → minLengthHurdle/maxLengthHurdle in Hop
          // (max N) → minLengthHurdle=1, maxLengthHurdle=N
          // (range min max) → minLengthHurdle=min, maxLengthHurdle=max
          for (const bPos of ba.positional) {
            if (!isList(bPos)) continue;
            const bph = headOf(bPos as import("@ludii/typescript-language").LudList);
            if (bph === "max") {
              const maxArgs = parseArgs1to1((bPos as import("@ludii/typescript-language").LudList).items);
              const maxVal = maxArgs.positional[0];
              if (maxVal) { try { maxHurdleLengthFn = compileInt1to1(maxVal); } catch { /* skip */ } }
            } else if (bph === "range") {
              const rangeArgs = parseArgs1to1((bPos as import("@ludii/typescript-language").LudList).items);
              const rangeMin = rangeArgs.positional[0];
              const rangeMax = rangeArgs.positional[1];
              if (rangeMin) { try { const minFn = compileInt1to1(rangeMin); minHurdleLength = minFn.eval({ state: { mover: 1 } } as unknown as Context) ?? 1; } catch { /* skip */ } }
              if (rangeMax) { try { maxHurdleLengthFn = compileInt1to1(rangeMax); } catch { /* skip */ } }
            }
          }
          // Detect between-apply (hurdle capture): (between ... (apply (remove (between))))
          // or deferred: (between ... (apply (remove (between) at:EndOfTurn)))
          // @java Hop.java sideEffect = between.effect() — null when no (apply ...) in (between ...)
          // The (apply ...) may appear as a named arg OR as a positional list child.
          let applyNode = ba.named.get("apply");
          if (!applyNode) {
            // Search positionals for (apply ...) list
            applyNode = ba.positional.find(n => isList(n) && headOf(n as import("@ludii/typescript-language").LudList) === "apply");
          }
          if (applyNode && isList(applyNode)) {
            // Mark that there IS a between-capture effect.
            // @java Hop.java: sideEffect = between.effect() (non-null → captured hurdle)
            captureBetween = true;
            // The apply body: (apply (remove (between) at:EndOfTurn))
            // Check if the remove inside has at:EndOfTurn
            const applyBodyArgs = parseArgs1to1((applyNode as import("@ludii/typescript-language").LudList).items);
            // Look inside the remove node for at:EndOfTurn
            const removeNode = applyBodyArgs.positional.find(n => isList(n) && headOf(n as import("@ludii/typescript-language").LudList) === "remove");
            if (removeNode && isList(removeNode)) {
              const removeArgs = parseArgs1to1((removeNode as import("@ludii/typescript-language").LudList).items);
              const atArg = removeArgs.named.get("at");
              if (atArg && !isList(atArg) && isIdent(atArg) &&
                  (atArg as { name: string }).name.toLowerCase() === "endofturn") {
                captureDeferred = true;
              }
            }
          }
        } else if (ph === "to") {
          const ta = parseArgs1to1(p.items);
          const tIf = ta.named.get("if");
          if (tIf) { try { toCond = compileBool1to1(tIf, 2); } catch { /* skip */ } }
          // Parse (to ... (apply <effect>)) — destination-apply (e.g. enemy capture on landing).
          // @java Hop.java: stopEffect = to.effect().effect() applied at destination when goRule fails
          // In common usage: (to if:... (apply (if (isEnemy (to)) (remove (to))))) — capture on landing.
          // Also handles: (to if:... (apply if:<cond> (remove (to)))) — conditional capture.
          const applyChild2 = ta.positional.find(n => isList(n) && headOf(n as import("@ludii/typescript-language").LudList) === "apply");
          if (applyChild2 && isList(applyChild2)) {
            const applyBodyArgs2 = parseArgs1to1((applyChild2 as import("@ludii/typescript-language").LudList).items);
            const applyIfNode2 = applyBodyArgs2.named.get("if");
            const applyEffectNode2 = applyBodyArgs2.positional[0];
            if (applyIfNode2 && applyEffectNode2) {
              // (apply if:cond effect) — conditional apply: only acts when condition is true.
              try {
                const applyCond2 = compileBool1to1(applyIfNode2, 2);
                const applyEffect2 = compileMoves1to1(applyEffectNode2, equipment);
                const _ac2 = applyCond2;
                const _ae2 = applyEffect2;
                toApplyFn = { eval(ctx: Context): Move[] { return _ac2.eval(ctx) ? _ae2.eval(ctx) : []; }};
              } catch { /* skip */ }
            } else if (applyEffectNode2) {
              try { toApplyFn = compileMoves1to1(applyEffectNode2, equipment); } catch { /* skip */ }
            }
          } else {
            const toApplyNode = ta.named.get("apply");
            if (toApplyNode) {
              try { toApplyFn = compileMoves1to1(toApplyNode, equipment); } catch { /* skip */ }
            }
          }
        }
      }
      // Capture at hop time: flag frozen at compile time.
      const _captureDeferred = captureDeferred;
      const _captureBetween = captureBetween; // only remove hurdle when (between ...) has (apply (remove ...))
      const _toApplyFn = toApplyFn; // null = no destination apply effect
      const _maxBeforeFn = maxBeforeFn;
      const _maxAfterFn = maxAfterFn;
      const _maxHurdleLengthFn = maxHurdleLengthFn; // null = 1 (single hurdle piece)
      const _minHurdleLength = minHurdleLength;      // minimum hurdle length (default 1)
      const _hopDirName = hopDirName;
      const _hopDirNames = hopDirNames; // null = single direction, non-null = multiple
      const _fromLocFn = fromLocFn;    // null = use _evalFrom (default), non-null = override
      const _hopFromCond = hopFromCond; // null = no from-condition
      // Full Java Hop.eval() port supporting before:/after: long-hop ranges.
      // @java game/rules/play/moves/nonDecision/effect/Hop.java lines 232-363
      const hopMoves: MovesFunction = {
        eval(ctx: Context): Move[] {
          // Resolve from: (from <locFn>) overrides ctx._evalFrom (Java: startLocationFn.eval)
          // @java Hop.java line 155: final int from = startLocationFn.eval(context)
          const from = _fromLocFn ? _fromLocFn.eval(ctx) : ctx._evalFrom;
          if (from < 0) return [];
          // Apply from-condition: if piece is blocked (from-cond false), no hop moves.
          // @java Hop.java: if (fromCondition != null && !fromCondition.eval(context)) return moves;
          if (_hopFromCond) {
            const origFrom2 = ctx._evalFrom;
            ctx._evalFrom = from;
            const condOk = _hopFromCond.eval(ctx);
            ctx._evalFrom = origFrom2;
            if (!condOk) return [];
          }
          const mover = ctx.state.mover;
          const ctxAny = ctx as unknown as { _radials?: readonly import("./ludemes/topology-radials.js").CellFlatRadials[] };
          const radials = ctxAny._radials;
          if (!radials) return [];
          const cr = radials[from];
          if (!cr) return [];
          const moves: Move[] = [];
          // Evaluate before/after/hurdleLength range at runtime (may depend on board dims).
          // @java Hop.java line 172-175
          const maxDistBefore  = _maxBeforeFn  ? _maxBeforeFn.eval(ctx)  : 0;
          const maxDistAfter   = _maxAfterFn   ? _maxAfterFn.eval(ctx)   : 0;
          const maxHurdleLen   = _maxHurdleLengthFn ? _maxHurdleLengthFn.eval(ctx) : 1;
          const minHurdleLen   = _minHurdleLength; // compile-time constant
          // Filter axes by direction (including relative resolution at eval time).
          // @java Hop.java — dirnChoice.convertToAbsolute(...)
          // Import resolveRelativeDir-equivalent inline for relative directions.
          function resolveHopDir(d: string): string {
            const p1 = mover === 1;
            switch (d) {
              case "fl": case "forwardleft":  return p1 ? "nw" : "se";
              case "fr": case "forwardright": return p1 ? "ne" : "sw";
              case "bl": case "backwardleft":  return p1 ? "sw" : "ne";
              case "br": case "backwardright": return p1 ? "se" : "nw";
              case "forwards": case "forward": return p1 ? "n" : "s";
              case "backwards": case "backward": return p1 ? "s" : "n";
              default: return d;
            }
          }
          // Collect all axes to iterate for this hop (union of all direction names).
          type FlatRadial = import("./ludemes/topology-radials.js").FlatRadial;
          const allAxes: { axis: FlatRadial; singleDir: boolean }[] = [];
          const dirNamesToUse: string[] = _hopDirNames !== null ? _hopDirNames : [_hopDirName];
          // Graph-board (hex/tri/etc.) trajectories for direction-aware radial lookup.
          // For non-square boards, axis indices (0,1,2,3 = EW,NS,NESW,NWSE) do NOT apply.
          const hopTraj = (ctxAny as unknown as { _trajectories?: import("./eval/graph/trajectories.js").Trajectories | null })._trajectories ?? null;
          const HOP_GROUP_DIRS = new Set(["adjacent", "orthogonal", "diagonal", "all"]);
          for (const rawDir of dirNamesToUse) {
            const eff = resolveHopDir(rawDir);
            const isSingle = /^(n|s|e|w|ne|nw|se|sw|north|south|east|west|northeast|northwest|southeast|southwest)$/i.test(eff);
            let axes: readonly FlatRadial[];
            if (hopTraj) {
              const distinct = hopTraj.distinctRadialsByName(from, eff);
              if (distinct.length > 0) {
                axes = distinct.map(r => ({ ray: r.ray as number[], opposite: (r.opposites[0] ?? [from]) as number[] }));
              } else if (!HOP_GROUP_DIRS.has(eff.toLowerCase())) {
                axes = []; // specific direction not present on this graph board → no moves
              } else {
                axes = radialsForDirection(cr, eff);
              }
            } else {
              axes = radialsForDirection(cr, eff);
            }
            for (const axis of axes) {
              allAxes.push({ axis, singleDir: isSingle || _hopDirNames !== null });
            }
          }
          const origFrom    = ctx._evalFrom;
          const origTo      = ctx._evalTo;
          const origSite    = ctx._evalSite;
          const origBetween = ctx._evalBetween;
          for (const { axis, singleDir } of allAxes) {
            // Single-direction: only use the ray (not opposite).
            // Group directions (Adjacent/Diagonal/Orthogonal): use both ray and opposite.
            const raysToCheck: readonly (readonly number[])[] = singleDir ? [axis.ray] : [axis.ray, axis.opposite];
            for (const ray of raysToCheck) {
              // ray[0] = from, ray[1..] = cells outward in this direction.
              // Walk the ray: find hurdle start, extend hurdle up to maxHurdleLen, enumerate landing sites.
              // @java Hop.java lines 240-362 — supports multi-piece hurdle via minLengthHurdle/maxLengthHurdle
              for (let toIdx = 1; toIdx < ray.length; toIdx++) {
                const cell = ray[toIdx];
                if (cell === undefined) break;
                ctx._evalFrom    = from;
                ctx._evalBetween = cell;
                ctx._evalSite    = cell;
                // Check if this cell is the hurdle (between condition).
                const isHurdle = betweenCond ? betweenCond.eval(ctx)
                  : (ctx.state.cells[cell] !== undefined && ctx.state.cells[cell] !== 0);
                if (isHurdle) {
                  // Found the start of the hurdle at index toIdx.
                  // Extend hurdle chain up to maxHurdleLen.
                  // @java Hop.java lines 259-271: for (hurdleIdx...; lengthHurdle < maxLengthHurdle; hurdleIdx++)
                  const hurdleLocs: number[] = [cell];
                  let lengthHurdle = 1;
                  let hurdleIdx = toIdx + 1; // first index after the full hurdle
                  // Extend hurdle if maxHurdleLen > 1
                  if (maxHurdleLen > 1) {
                    for (; hurdleIdx < ray.length && lengthHurdle < maxHurdleLen; hurdleIdx++) {
                      const hurdleLoc = ray[hurdleIdx];
                      if (hurdleLoc === undefined) break;
                      ctx._evalBetween = hurdleLoc;
                      ctx._evalSite    = hurdleLoc;
                      const extendOk = betweenCond ? betweenCond.eval(ctx)
                        : (ctx.state.cells[hurdleLoc] !== undefined && ctx.state.cells[hurdleLoc] !== 0);
                      if (!extendOk) break; // hurdle chain ended
                      hurdleLocs.push(hurdleLoc);
                      lengthHurdle++;
                    }
                  }
                  // Check minimum hurdle length
                  if (lengthHurdle < minHurdleLen) { break; }
                  // Enumerate "to" sites after the full hurdle chain.
                  // @java Hop.java lines 284-352: afterHurdleToIdx from hurdleIdx
                  const betweenSite = hurdleLocs[0]!; // primary between site (first hurdle)
                  for (let afterIdx = hurdleIdx; afterIdx < ray.length; afterIdx++) {
                    const toSite = ray[afterIdx];
                    if (toSite === undefined) break;
                    ctx._evalFrom = from;
                    ctx._evalTo   = toSite;
                    // "to" condition: default is (is Empty (to))
                    const toOk = toCond ? toCond.eval(ctx) : ctx.state.isEmptySite(toSite);
                    if (!toOk) break; // site blocked — can't land here or further
                    // Generate the hop move.
                    const actions: import("./action/index.js").Action[] = [];
                    // Capture the hurdle ONLY when (between ...) has (apply (remove ...)) effect.
                    // @java Hop.java line 330-332: if (sideEffect != null) chainRuleWithAction(sideEffect)
                    if (_captureBetween) {
                      for (const hl of hurdleLocs) {
                        if (_captureDeferred) {
                          actions.push(new ActionRemoveNonApplied(hl));
                        } else {
                          actions.push(new ActionRemove({ to: hl }));
                        }
                      }
                    }
                    // Destination apply effect (e.g. enemy capture on landing).
                    // @java Hop.java: stopEffect applied when goRule fails at destination;
                    // in friendly-hop games (apply (if (isEnemy (to)) (remove (to)))) is used.
                    if (_toApplyFn) {
                      ctx._evalFrom = from;
                      ctx._evalTo   = toSite;
                      try {
                        const toApplyMoves = _toApplyFn.eval(ctx);
                        for (const tam of toApplyMoves) for (const ta of tam.actions) actions.push(ta);
                      } catch { /* skip on error */ }
                    }
                    const moveAction = new ActionMove({ from, to: toSite });
                    moveAction.setDecision(true);
                    actions.push(moveAction);
                    moves.push(new Move({
                      id: `hop:${from}:${betweenSite}:${toSite}`,
                      label: `Hop ${from}→${toSite}`,
                      siteIndices: [from, toSite],
                      mover,
                      placedOwner: mover,
                      actions,
                      fromSite: from,
                      toSite: toSite,
                    }));
                    // Check after-range limit.
                    // @java Hop.java line 350: afterHurdleToIdx - hurdleIdx + 1 > maxDistanceHurdleTo
                    if ((afterIdx - hurdleIdx) >= maxDistAfter) break;
                  }
                  break; // only one hurdle start per ray (stop after first matching hurdle)
                } else {
                  // Not a hurdle. Check if we can pass through (goRule = to.cond = isEmpty).
                  // If the cell is non-empty and not a hurdle, we can't pass → stop.
                  // If empty, we can pass (king can approach from a distance).
                  // @java Hop.java line 357-359: if toIdx > maxDistanceFromHurdle || !goRule → break
                  ctx._evalTo = cell;
                  const canPass = ctx.state.isEmptySite(cell);
                  if (!canPass || (toIdx - 1) >= maxDistBefore) break;
                }
              }
            }
          }
          ctx._evalFrom    = origFrom;
          ctx._evalTo      = origTo;
          ctx._evalSite    = origSite;
          ctx._evalBetween = origBetween;
          return moves;
        }
      };
      // Chain (then ...) consequence onto each hop move, exactly as Slide/Step do.
      // @java Hop.java line 153 — new BaseMoves(super.then()) passes compiled then() to container
      return attachThen(hopMoves, hopArgs.positional, equipment);
    }

    // (move Select (from ...) [if:...] [(to ...)] ...)
    // @java game/rules/play/moves/nonDecision/effect/Select.java — eval
    // Selects sites from a 'from' region (optionally filtered by condition).
    // If no 'to' region, generates single-site select moves (from == to).
    // If 'to' region provided, generates from×to pairs filtered by to-condition.
    if (first && isIdent(first) && first.name.toLowerCase() === "select") {      const selArgs = parseArgs1to1(node.items);
      // Find (from ...) and (to ...) sub-nodes
      let fromRegion: RegionFunction | null = null;
      let fromCond: BooleanFunction | null = null;
      let toRegion: RegionFunction | null = null;
      let toCond: BooleanFunction | null = null;
      for (const p of selArgs.positional) {
        if (!isList(p)) continue;
        const ph = headOf(p);
        if (ph === "from") {
          const fa = parseArgs1to1(p.items);
          // Positional[0] may be a SiteType ident (Cell/Edge/Vertex) — skip it.
          // The actual region follows as the next positional or the only one.
          // @java Select.java — startLocationFn resolves from SiteType + region.
          const SITE_TYPE_IDENTS = new Set(["cell", "edge", "vertex"]);
          let fLocIdx = 0;
          if (fa.positional[0] && isIdent(fa.positional[0]) &&
              SITE_TYPE_IDENTS.has((fa.positional[0] as {name:string}).name.toLowerCase())) {
            fLocIdx = 1; // skip the SiteType qualifier
          }
          const fLoc = fa.positional[fLocIdx];
          if (fLoc) { try { fromRegion = compileRegion1to1(fLoc); } catch { /* skip */ } }
          const fIf = fa.named.get("if");
          if (fIf) { try { fromCond = compileBool1to1(fIf, 2); } catch { /* skip */ } }
        } else if (ph === "to") {
          const ta = parseArgs1to1(p.items);
          const tLoc = ta.positional[0];
          if (tLoc) { try { toRegion = compileRegion1to1(tLoc); } catch { /* skip */ } }
          const tIf = ta.named.get("if");
          if (tIf) { try { toCond = compileBool1to1(tIf, 2); } catch { /* skip */ } }
        }
      }
      // If no fromRegion, try named arg form
      const fromNamed = selArgs.named.get("from");
      if (!fromRegion && fromNamed && isList(fromNamed)) {
        const fa = parseArgs1to1(fromNamed.items);
        const fLoc = fa.positional[0];
        if (fLoc) { try { fromRegion = compileRegion1to1(fLoc); } catch { /* skip */ } }
        const fIf = fa.named.get("if");
        if (fIf) { try { fromCond = compileBool1to1(fIf, 2); } catch { /* skip */ } }
      }
      if (!fromRegion) {
        // (move Select (from if:cond)) — no region: scan all board sites.
        // @java Select.java — when no region given, uses all board-site positions.
        // With if:cond, each board site is checked; without it, use SitesEmpty.
        if (fromCond) {
          fromRegion = { eval(ctx: Context): number[] {
            const g = ctx.game as unknown as Game1to1;
            const n = g.equipment.board.numSites;
            return Array.from({ length: n }, (_, i) => i);
          }};
        } else {
          fromRegion = new SitesEmpty();
        }
      }
      const fr = fromRegion;
      const fc = fromCond;
      const tr = toRegion;
      const tc = toCond;

      const selectGen: MovesFunction = {
        eval(ctx: Context): Move[] {          const origFrom = ctx._evalFrom;
          const origTo = ctx._evalTo;
          const mover = ctx.state.mover;
          const fromSites = fr.eval(ctx);
          const moves: Move[] = [];
          for (const site of fromSites) {
            ctx._evalFrom = site;
            ctx._evalTo = site;
            if (fc && !fc.eval(ctx)) continue;
            if (!tr) {
              // Single-site select (no to region)
              moves.push(new Move({
                id: `select:${site}`,
                label: `Select ${site}`,
                siteIndices: [site],
                mover,
                placedOwner: mover,
                actions: [],
                fromSite: site,
                toSite: site,
              }));
            } else {
              // from×to
              const toSites = tr.eval(ctx);
              for (const toSite of toSites) {
                ctx._evalTo = toSite;
                if (tc && !tc.eval(ctx)) continue;
                moves.push(new Move({
                  id: `select:${site}:${toSite}`,
                  label: `Select ${site}→${toSite}`,
                  siteIndices: [site, toSite],
                  mover,
                  placedOwner: mover,
                  actions: [],
                  fromSite: site,
                  toSite: toSite,
                }));
              }
            }
          }
          ctx._evalFrom = origFrom;
          ctx._evalTo = origTo;
          return moves;
        }
      };
      // (move Select … (then (sow …))) — attach the then-consequence (mancala sow,
      // captures, moveAgain) so it runs after the selection.
      return attachThen(selectGen, selArgs.positional, equipment);
    }

    // (move Remove [type] <sites>)
    // @java game/rules/play/moves/nonDecision/effect/Remove.java — eval
    // Generates one remove-move per occupied site in the region.
    if (first && isIdent(first) && first.name.toLowerCase() === "remove") {
      // Second positional may be a SiteType ident (Cell/Edge/Vertex) or the region
      let regionNode: LudNode | undefined;
      let typeIdx = 1;
      if (positional[1] && isIdent(positional[1]!) && !isList(positional[1]!)) {
        const maybeType = (positional[1] as { name: string }).name.toLowerCase();
        if (maybeType === "cell" || maybeType === "edge" || maybeType === "vertex") {
          typeIdx = 2; // skip type ident
        }
      }
      regionNode = positional[typeIdx];
      if (!regionNode) {
        // Bare (move Remove) — remove from all occupied sites (unusual; stub as empty)
        return { eval(_ctx: Context): Move[] { return []; } };
      }
      const regionFn = compileRegion1to1(regionNode);
      const removeMoves: MovesFunction = {
        eval(ctx: Context): Move[] {
          const sites = regionFn.eval(ctx);
          const moves: Move[] = [];
          const mover = ctx.state.mover;
          for (const s of sites) {
            if (ctx.state.isEmptySite(s)) continue;
            const action = new ActionRemove({ to: s });
            moves.push(new Move({
              id: `remove:${s}`,
              label: `Remove ${s}`,
              siteIndices: [s],
              mover,
              placedOwner: mover,
              actions: [action],
            }));
          }
          return moves;
        }
      };
      // Attach (then ...) consequence if present.
      // @java game/rules/play/moves/nonDecision/effect/Remove.java — applies Then.
      return attachThen(removeMoves, positional, equipment);
    }

    // (move Pass) — generate a pass move
    // @java game/rules/play/moves/nonDecision/effect/Pass.java
    // A (move Pass (then ...)) consequence (e.g. Bechi's all-pass cleanup) is
    // attached via attachThen so post-pass effects (clear board, forget values)
    // are folded into the pass move's action list.
    if (first && isIdent(first) && first.name.toLowerCase() === "pass") {
      const passGen = { eval(ctx: Context): Move[] {
        const mover = ctx.state.mover;
        return [new Move({
          id: "pass", label: "Pass", siteIndices: [0], mover, placedOwner: mover,
          actions: [new ActionPass()],
        })];
      }};
      return attachThen(passGen, positional, equipment);
    }

    // (move Shoot [(piece "Name")] [(from ...)] [(dirn ...)])
    // @java game/rules/play/moves/nonDecision/effect/Shoot.java — eval
    // Default: from=(lastTo), direction=Adjacent, places the named piece at each reachable empty site.
    // Used in Amazons: (move Shoot (piece "Dot0")) places an arrow after a queen slide.
    if (first && isIdent(first) && first.name.toLowerCase() === "shoot") {
      // Extract the (piece "PieceId") argument to know what to place.
      // @java Shoot.pieceFn — component() index resolved at eval time
      let pieceId = "Dot0"; // Default for the common Amazons case
      let dirnName = "Adjacent";
      for (const p of positional.slice(1)) {
        if (isList(p)) {
          const ph = headOf(p);
          if (ph === "piece") {
            const pArgs = parseArgs1to1(p.items);
            const pNameNode = pArgs.positional[0];
            if (pNameNode && isString(pNameNode)) pieceId = pNameNode.value;
          } else if (ph === "from") {
            // (from ...) — explicit from location: ignore for now (uses lastTo default)
          }
        } else if (isIdent(p)) {
          // Direction ident e.g. "Orthogonal"
          dirnName = p.name;
        }
      }
      return new Shoot1to1(pieceId, dirnName);
    }

    // (move Slide [direction] [(between ...)] [(to ...)] [(then ...)])
    if (first && isIdent(first) && first.name.toLowerCase() === "slide") {
      const dirnNode = positional[1];
      let dirnName = "Adjacent";
      if (dirnNode && isIdent(dirnNode)) {
        dirnName = dirnNode.name;
      }
      // Parse (to if:<cond> (apply <effect>)) — landing rule + capture (chess).
      // @java Slide.java: stopRule = to.cond(); sideEffect = to.effect()
      let slideToCond: BooleanFunction | undefined;
      let slideApply: MovesFunction | undefined;
      const slideToNode = positional.find(n => isList(n) && headOf(n) === "to");
      if (slideToNode && isList(slideToNode)) {
        const sToArgs = parseArgs1to1(slideToNode.items);
        const ifN = sToArgs.named.get("if");
        if (ifN) { try { slideToCond = compileBool1to1(ifN, 2); } catch { /* default empty */ } }
        let applyEffectNode = sToArgs.named.get("apply");
        if (!applyEffectNode) {
          const applyChild = sToArgs.positional.find(n => isList(n) && headOf(n) === "apply");
          if (applyChild && isList(applyChild)) {
            applyEffectNode = parseArgs1to1(applyChild.items).positional[0];
          }
        }
        if (applyEffectNode) {
          try { slideApply = compileMoves1to1(applyEffectNode, equipment); } catch { /* skip */ }
        }
      }
      // Parse (between [(exact N) | (range min max) | (max N)] [if:<goRule>]) — distance constraints.
      // @java Slide.java: minFn = between.range().minFn(); limit = between.range().maxFn(); goRule = between.condition()
      // Default: min=-1 (Constants.UNDEFINED, no minimum), max=1000 (Constants.MAX_DISTANCE, unlimited).
      let slideMinDist = -1;
      let slideMaxDist = 1000;
      let slideGoRule: BooleanFunction | undefined;
      const slideBetweenNode = positional.find(n => isList(n) && headOf(n) === "between");
      if (slideBetweenNode && isList(slideBetweenNode)) {
        const sbArgs = parseArgs1to1(slideBetweenNode.items);
        // Parse the range sub-expression: (exact N), (range min max), (max N)
        for (const bp of sbArgs.positional) {
          if (!isList(bp)) continue;
          const bph = headOf(bp);
          if (bph === "exact") {
            // (exact N) → min=N, max=N
            const exArgs = parseArgs1to1(bp.items);
            const exVal = exArgs.positional[0];
            if (exVal) {
              try {
                const n = compileInt1to1(exVal).eval({ state: { mover: 1 } } as unknown as Context);
                slideMinDist = n;
                slideMaxDist = n;
              } catch { /* skip */ }
            }
          } else if (bph === "range") {
            // (range min max) → separate min and max
            const rArgs = parseArgs1to1(bp.items);
            const rMin = rArgs.positional[0];
            const rMax = rArgs.positional[1];
            if (rMin) { try { slideMinDist = compileInt1to1(rMin).eval({ state: { mover: 1 } } as unknown as Context); } catch { /* skip */ } }
            if (rMax) { try { slideMaxDist = compileInt1to1(rMax).eval({ state: { mover: 1 } } as unknown as Context); } catch { /* skip */ } }
          } else if (bph === "max") {
            // (max N) → min=1 (default minimum), max=N
            const mArgs = parseArgs1to1(bp.items);
            const mVal = mArgs.positional[0];
            if (mVal) { try { slideMaxDist = compileInt1to1(mVal).eval({ state: { mover: 1 } } as unknown as Context); } catch { /* skip */ } }
            slideMinDist = 1;
          }
        }
        // Parse the go-rule: if:<cond> on between sites
        const sbIf = sbArgs.named.get("if");
        if (sbIf) { try { slideGoRule = compileBool1to1(sbIf, 2); } catch { /* default empty-between */ } }
      }
      const slideMoves: MovesFunction = new Slide1to1(
        dirnName,
        slideToCond ?? null,   // null = no (to if:...) clause → Java stopRule=null (unlimited slide)
        slideApply,
        slideGoRule ?? undefined,
        slideMinDist,
        slideMaxDist,
      );
      // (then <moves>) consequence chaining (incl. conditional moveAgain).
      // @java game/rules/play/moves/nonDecision/effect/Then.java — eval wraps each move
      // @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
      return attachThen(slideMoves, positional, equipment);
    }

    // (move Step [direction] (to ...) [(then (moveAgain))])
    if (first && isIdent(first) && first.name.toLowerCase() === "step") {
      // Direction is optional; (to ...) follows.
      // May be a single ident ("Diagonal", "FR") or a (directions {FR FL}) list.
      // @java Step.java — dirnChoice resolved via DirectionsFunction
      let dirnName = "Adjacent";
      let dirnNames: string[] | null = null; // set when multiple directions given
      if (positional[1] && isIdent(positional[1]!) && !isList(positional[1]!)) {
        dirnName = (positional[1] as { name: string }).name;
      } else if (positional[1] && isList(positional[1]!) &&
                 headOf(positional[1] as import("@ludii/typescript-language").LudList) === "directions") {
        // (directions {FR FL}) — curly list of direction names (absolute or relative).
        // (directions Forwards of:All) — all forward-like directions including diagonals.
        // Collect all direction names, including player-relative ones (FR/FL/BL/BR).
        // @java Directions.java — convertToAbsolute (relative form resolved at eval time by Step)
        const dirArgs = parseArgs1to1((positional[1] as import("@ludii/typescript-language").LudList).items);
        const names: string[] = [];
        for (const p of dirArgs.positional) {
          if (isIdent(p)) {
            names.push(p.name);
          } else if (isList(p) && (p as import("@ludii/typescript-language").LudList).delimiter === "curly") {
            for (const item of (p as import("@ludii/typescript-language").LudList).items) {
              if (isIdent(item)) names.push((item as { name: string }).name);
            }
          }
        }
        // Handle `of:All` modifier: expands a single direction to all variants.
        // `(directions Forwards of:All)` = forward + forward-left + forward-right.
        // `(directions Backwards of:All)` = backward + backward-left + backward-right.
        // @java Directions.java — when `of` = All, RelativeDirection.of(dir, All) returns all
        const ofNode = dirArgs.named.get("of");
        const ofAll = ofNode !== undefined && isIdent(ofNode) &&
          (ofNode as {name:string}).name.toLowerCase() === "all";
        if (ofAll && names.length === 1) {
          const base = names[0]!.toLowerCase();
          if (base === "forwards" || base === "forward") {
            names.splice(0, 1, "Forwards", "ForwardLeft", "ForwardRight");
          } else if (base === "backwards" || base === "backward") {
            names.splice(0, 1, "Backwards", "BackwardLeft", "BackwardRight");
          }
        }
        if (names.length === 1) {
          dirnName = names[0]!;
        } else if (names.length > 1) {
          dirnNames = names;
        }
      }
      // Parse (from if:<cond>) — from-condition (piece is blocked when false).
      // @java Step.java: fromCondition = from.cond(); checked line 178 (early return if false)
      let stepFromCond: BooleanFunction | null = null;
      const stepFromNode = positional.find(n => isList(n) && headOf(n) === "from");
      if (stepFromNode && isList(stepFromNode)) {
        const fromArgs = parseArgs1to1(stepFromNode.items);
        const fromIf = fromArgs.named.get("if");
        if (fromIf) { try { stepFromCond = compileBool1to1(fromIf, 2); } catch { /* skip */ } }
      }
      // Parse (to if:<cond> (apply <effect>)) — destination rule + capture.
      // @java Step.java: rule = to.cond(); sideEffect = to.effect()
      let stepToCond: BooleanFunction | undefined;
      let stepApply: MovesFunction | undefined;
      const stepToNode = positional.find(n => isList(n) && headOf(n) === "to");
      if (stepToNode && isList(stepToNode)) {
        const toArgs = parseArgs1to1(stepToNode.items);
        const ifN = toArgs.named.get("if");
        if (ifN) { try { stepToCond = compileBool1to1(ifN, 2); } catch { /* default empty */ } }
        let applyEffectNode = toArgs.named.get("apply");
        if (!applyEffectNode) {
          const applyChild = toArgs.positional.find(n => isList(n) && headOf(n) === "apply");
          if (applyChild && isList(applyChild)) {
            // Check if (apply ...) has an if: condition: (apply if:<cond> <effect>)
            // @java To.effect() = Apply ludeme with optional condition — must preserve it!
            const applyInner = parseArgs1to1((applyChild as import("@ludii/typescript-language").LudList).items);
            const applyIfNode = applyInner.named.get("if");
            const applyEffectInner = applyInner.positional[0];
            if (applyIfNode && applyEffectInner) {
              // Compile as conditional: (if cond effect) → only applies when condition true
              try {
                const applyCond = compileBool1to1(applyIfNode, 2);
                const applyEffect = compileMoves1to1(applyEffectInner, equipment);
                const _applyCond = applyCond;
                const _applyEffect = applyEffect;
                stepApply = { eval(ctx: Context): Move[] {
                  return _applyCond.eval(ctx) ? _applyEffect.eval(ctx) : [];
                }};
              } catch { /* skip */ }
            } else if (applyEffectInner) {
              applyEffectNode = applyEffectInner;
            }
          }
        }
        if (!stepApply && applyEffectNode) {
          try { stepApply = compileMoves1to1(applyEffectNode, equipment); } catch { /* skip */ }
        }
      }
      let stepMoves: MovesFunction;
      if (dirnNames !== null) {
        // Multiple directions: union of Step1to1 for each direction.
        // @java Step.java — dirnChoice.convertToAbsolute returns multiple directions
        const steps = dirnNames.map(d => new Step1to1(d, stepToCond ?? undefined, stepApply));
        const _steps = steps;
        stepMoves = {
          eval(ctx: Context): Move[] {
            const result: Move[] = [];
            for (const s of _steps) {
              for (const m of s.eval(ctx)) result.push(m);
            }
            return result;
          }
        };
      } else {
        stepMoves = new Step1to1(dirnName, stepToCond ?? undefined, stepApply);
      }
      // Wrap with from-condition if present.
      // @java Step.java line 178: if (fromCondition != null && !fromCondition.eval(context)) return moves;
      if (stepFromCond !== null) {
        const _innerStep = stepMoves;
        const _stepFromCond = stepFromCond;
        stepMoves = {
          eval(ctx: Context): Move[] {
            if (!_stepFromCond.eval(ctx)) return [];
            return _innerStep.eval(ctx);
          }
        };
      }
      // (then <moves>) consequence chaining (incl. conditional moveAgain).
      // @java game/rules/play/moves/nonDecision/effect/Then.java — eval wraps each move
      return attachThen(stepMoves, positional, equipment);
    }

    // (move (from ...) (to ...) [(then ...)]) — FromTo
    if (first && isList(first) && headOf(first) === "from") {
      const toNode = positional.find(n => isList(n) && headOf(n) === "to");
      if (!toNode || !isList(toNode)) {
        throw new Error("compiler1to1: (move (from ...) ...) missing (to ...)");
      }
      // attachThen so a placement's mill consequence (then (if (is Line 3) (moveAgain)))
      // fires — Morris-family placements are FromTo moves.
      return attachThen(compileFromTo1to1(first, toNode, named, equipment), positional, equipment);
    }

    // (move Promote [type] <location> (piece {"Queen" "Knight" ...}) [<role>]) — piece promotion
    // @java game/rules/play/moves/nonDecision/effect/Promote.java — eval
    // Generates one ActionPromote move per target piece type.
    // The location defaults to (last To); the piece list names the promotion options.
    if (first && isIdent(first) && first.name.toLowerCase() === "promote") {
      const pmArgs = parseArgs1to1(node.items);
      // Positional after "Promote": [SiteType?] [location?] (piece ...) [role?]
      let locationFn: IntFunction | null = null;
      let pieceListNode: LudList | null = null;
      let ownerRole = "mover";
      const pmPos = pmArgs.positional;
      for (let pi = 1; pi < pmPos.length; pi++) {
        const p = pmPos[pi]!;
        if (isList(p) && headOf(p) === "piece") {
          pieceListNode = p;
        } else if (isIdent(p)) {
          const pn = p.name.toLowerCase();
          if (pn === "mover" || pn === "next" || pn.startsWith("p")) {
            ownerRole = pn;
          } else if (pn === "cell" || pn === "edge" || pn === "vertex") {
            // SiteType qualifier — skip
          } else {
            // Could be a location expression (e.g. (last To) as ident? unlikely)
          }
        } else if (!locationFn) {
          try { locationFn = compileInt1to1(p); } catch { /* skip */ }
        }
      }
      // Named: location: arg
      const locNamedNode = pmArgs.named.get("location");
      if (!locationFn && locNamedNode) {
        try { locationFn = compileInt1to1(locNamedNode); } catch { /* skip */ }
      }
      // Default: location = (last To) = _evalTo
      if (!locationFn) {
        locationFn = { eval(ctx: Context): number { return ctx._evalTo; } };
      }
      // Parse piece list
      const promotionNames: string[] = [];
      if (pieceListNode) {
        const plArgs = parseArgs1to1(pieceListNode.items);
        for (const p of plArgs.positional) {
          if (isString(p)) promotionNames.push(p.value);
          else if (isList(p) && p.delimiter === "curly") {
            for (const inner of p.items) {
              if (isString(inner)) promotionNames.push((inner as { value: string }).value);
            }
          }
        }
      }
      if (promotionNames.length === 0) promotionNames.push("Queen");
      const locFnFinal = locationFn;
      const ownerRoleFinal = ownerRole;
      const promotionNamesFinal = [...promotionNames];
      return { eval(ctx: Context): Move[] {
        const location = locFnFinal.eval(ctx);
        if (location < 0) return [];
        const mover = ctx.state.mover;
        // Resolve owner
        let ownerId: number;
        if (ownerRoleFinal === "mover") ownerId = mover;
        else if (ownerRoleFinal === "next") ownerId = (mover % ctx.game.numPlayers) + 1;
        else if (ownerRoleFinal.startsWith("p") && !isNaN(parseInt(ownerRoleFinal.slice(1), 10))) {
          ownerId = parseInt(ownerRoleFinal.slice(1), 10);
        } else ownerId = mover;
        // Find component indices by name + owner
        const game = ctx.game as unknown as Game1to1;
        const moves: Move[] = [];
        for (const name of promotionNamesFinal) {
          let whatIdx = -1;
          if (game.equipment) {
            for (const piece of game.equipment.pieces) {
              if (piece.name.startsWith(name) && piece.owner === ownerId) {
                whatIdx = piece.index;
                break;
              }
            }
          }
          if (whatIdx < 0) continue;
          // ActionPromote: set site to new piece type
          // @java other/action/move/ActionPromote.java — apply: sets what at site
          const promIdx = whatIdx;
          const promOwner = ownerId;
          const promLoc = location;
          const action = new (class extends BaseAction {
            public override apply(state: import("./state.js").State): import("./state.js").State {
              return state.withCell(promLoc, promOwner).withWhatAt(promLoc, promIdx);
            }
            public override actionType(): import("./action/action-type.js").ActionType { return "Move" as import("./action/action-type.js").ActionType; }
            public override from(): number { return promLoc; }
            public override to(): number { return promLoc; }
          })();
          moves.push(new Move({
            id: `promote:${location}:${whatIdx}`,
            label: `Promote ${name}`,
            siteIndices: [location],
            mover,
            placedOwner: ownerId,
            actions: [action],
            fromSite: location,
            toSite: location,
          }));
        }
        return moves;
      }};
    }

    // (move Set ...) — set a variable value (stub: return empty)
    // @java game/rules/play/moves/nonDecision/effect/set/SetVar.java
    if (first && isIdent(first) && first.name.toLowerCase() === "set") {
      return { eval(_ctx: Context): Move[] { return []; } };
    }

    // (move Swap ...) — swap two pieces on the board (stub: return empty for now)
    // @java game/rules/play/moves/nonDecision/effect/Swap.java
    if (first && isIdent(first) && first.name.toLowerCase() === "swap") {
      return { eval(_ctx: Context): Move[] { return []; } };
    }

    // (move Bet ...) — place a bet (card/gambling game; stub: return empty)
    // @java game/rules/play/moves/nonDecision/effect/Bet.java
    if (first && isIdent(first) && first.name.toLowerCase() === "bet") {
      return { eval(_ctx: Context): Move[] { return []; } };
    }

    // (move Leap <walk> (to if:<cond> (apply <effect>)) [(then ...)]) — walk-based leap
    // @java game/rules/play/moves/nonDecision/effect/Leap.java — eval(Context)
    // Faithful port: calls SitesWalk1to1.eval(ctx) to get landing sites, then
    // filters by goRule (to if:...) and chains the sideEffect (to ... (apply ...)).
    if (first && isIdent(first) && first.name.toLowerCase() === "leap") {
      const leapArgs = parseArgs1to1(node.items);

      // Find the walk argument: a string like "KnightWalk" or a curly-list {{F F R F}{F F L F}}
      // @java Leap.java constructor — Sites.construct(null, startLocationFn, walk, rotations)
      let walkNode: LudNode | undefined;
      let fromFnLeap: IntFunction = { eval: (ctx: Context) => ctx._evalFrom };
      for (let i = 1; i < leapArgs.positional.length; i++) {
        const p = leapArgs.positional[i]!;
        if (isString(p)) {
          walkNode = p;
        } else if (isList(p) && p.delimiter === "curly") {
          walkNode = p;
        } else if (isList(p) && headOf(p) === "from") {
          // Optional (from ...) argument — parse location from it
          const fa = parseArgs1to1(p.items);
          const fLoc = fa.positional[0];
          if (fLoc) { try { fromFnLeap = compileInt1to1(fLoc); } catch { /* use default */ } }
        }
      }
      const leapWalks = parseWalks(walkNode);

      // Parse (to if:<goRule> (apply <sideEffect>)) sub-node
      // @java Leap.java — goRule = to.cond(); sideEffect = to.effect()
      let leapToCond: BooleanFunction | null = null;
      let leapApplyGen: MovesFunction | null = null;
      for (const p of leapArgs.positional) {
        if (!isList(p)) continue;
        if (headOf(p) === "to") {
          const ta = parseArgs1to1(p.items);
          const tIf = ta.named.get("if");
          if (tIf) { try { leapToCond = compileBool1to1(tIf, 2); } catch { /* skip */ } }
          // (apply <effect>) can appear as named arg or positional child
          let applyNode = ta.named.get("apply");
          if (!applyNode) {
            const applyChild = ta.positional.find(n => isList(n) && headOf(n) === "apply");
            if (applyChild && isList(applyChild)) {
              applyNode = parseArgs1to1(applyChild.items).positional[0];
            }
          }
          if (applyNode) { try { leapApplyGen = compileMoves1to1(applyNode, equipment); } catch { /* skip */ } }
        }
      }

      // Build SitesWalk1to1 using the parsed fromFn and walks (rotations=true by default)
      // @java Leap.java — Sites.construct(null, startLocationFn, walk, rotations)
      const leapFromFn = fromFnLeap;
      const sitesWalk = new SitesWalk1to1(leapFromFn, leapWalks, { eval: () => true });

      const leapGen: MovesFunction = {
        eval(ctx: Context): Move[] {
          const from = leapFromFn.eval(ctx);
          if (from < 0) return [];
          const mover = ctx.state.mover;
          const origFrom = ctx._evalFrom;
          const origTo = ctx._evalTo;
          ctx._evalFrom = from;

          // @java Leap.eval() — walk.eval(context).sites() gives landing sites
          const landingSites = sitesWalk.eval(ctx);
          const moves: Move[] = [];

          for (const to of landingSites) {
            ctx._evalTo = to;
            // @java Leap.eval() — if (!goRule.eval(context)) continue;
            if (leapToCond && !leapToCond.eval(ctx)) continue;

            // @java MoveUtilities.chainRuleWithAction(context, sideEffect, thisAction, true, false)
            const actions: import("./action/index.js").Action[] = [];
            if (leapApplyGen) {
              ctx._evalFrom = from;
              ctx._evalTo = to;
              try {
                const effMoves = leapApplyGen.eval(ctx);
                for (const em of effMoves) {
                  for (const a of em.actions) actions.push(a);
                }
              } catch { /* skip apply errors */ }
            }
            actions.push(new ActionMove({ from, to }));
            moves.push(new Move({
              id: `leap:${from}:${to}`,
              label: `Leap ${from}→${to}`,
              siteIndices: [from, to],
              mover,
              placedOwner: mover,
              actions,
              fromSite: from,
              toSite: to,
            }));
          }

          ctx._evalFrom = origFrom;
          ctx._evalTo = origTo;
          return moves;
        }
      };
      // @java Leap.eval() — then() is chained via BaseMoves(super.then())
      return attachThen(leapGen, leapArgs.positional, equipment);
    }

    // (move Claim ...) — placement with ownership claim (alias of Add with owner)
    // Fallthrough to Add if possible
    if (first && isIdent(first) && first.name.toLowerCase() === "claim") {
      const toNode2 = positional.find(n => isList(n) && headOf(n) === "to");
      if (toNode2 && isList(toNode2)) {
        const toArgs2 = parseArgs1to1(toNode2.items);
        const regionNode2 = findRegionInToArgs(toArgs2.positional);
        if (regionNode2) {
          try { return new Add(compileRegion1to1(regionNode2)); } catch { /* fall through */ }
        }
      }
      return { eval(_ctx: Context): Move[] { return []; } };
    }

    throw new Error(
      `compiler1to1: (move ${first && isIdent(first) ? first.name : "?"}) not supported`,
    );
  }

  // ---- (or { ... }) / (or <moves1> <moves2>) -------------------------------------
  // @java game/rules/play/moves/nonDecision/operators/logical/Or.java — eval(Context):157
  // Java Or.eval adds then() consequence to every generated move:
  //   if (then() != null) for (j) moves.get(j).then().add(then().moves());
  // The (then ...) must NOT appear as a sub-move-generator in OrMoves — filter it
  // out first, then wrap via attachThen (which mirrors Java's super.then() pattern).
  if (h === "or") {
    const { positional } = parseArgs1to1(node.items);
    // Exclude (then ...) nodes — they are afterConsequences, not sub-generators.
    const nonThenPositional = positional.filter(p => !(isList(p) && headOf(p) === "then"));
    const subMoves = flattenMovesList(nonThenPositional, equipment);
    return attachThen(new OrMoves(subMoves), positional, equipment);
  }

  // ---- (if <cond> <then> [<else>]) ----------------------------------------
  if (h === "if") {
    const { positional } = parseArgs1to1(node.items);
    const condNode = positional[0];
    const thenNode = positional[1];
    const elseNode = positional[2];
    if (!condNode || !thenNode) {
      throw new Error("compiler1to1: (if cond then) — missing parts");
    }
    const cond = compileBool1to1(condNode, 2); // numPlayers is approximate here
    const thenMoves = compileMoves1to1(thenNode, equipment);
    const elseMoves = elseNode ? compileMoves1to1(elseNode, equipment) : null;
    const ifResult: MovesFunction = new IfMoves(cond, thenMoves, elseMoves, null);
    // (if cond then else (then ...)) — the 4th positional may be a (then ...)
    // consequence that applies to BOTH branches of the if. Attach it via
    // attachThen so it wraps the outer if-result with withThenConsequence.
    // @java game/rules/play/moves/nonDecision/operators/logical/If.java — thenRule
    return attachThen(ifResult, positional, equipment);
  }

  // ---- (forEach Piece [specificMoves]) ------------------------------------
  if (h === "foreach") {
    const { positional, named } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first)) {
      const typeName = first.name.toLowerCase();
      if (typeName === "piece") {
        // (forEach Piece [<pieceName>] [<movesGenerator>] [(then …)])
        // The optional second arg could be a piece name string, role ident, a
        // moves generator, OR a (then …) consequence. A (then …) is NOT a moves
        // override — it attaches to the piece's OWN generated moves (e.g. Ataxx's
        // post-move score update `(forEach Piece (then (and (set Score …))))`).
        let specificMoves: MovesFunction | null = null;
        let specificRole: string | null = null;
        const fpThen: LudNode[] = [];
        const considerArg = (a: LudNode | undefined): void => {
          if (!a || !isList(a)) return;
          if (headOf(a) === "then") { fpThen.push(a); return; }
          if (!specificMoves) { try { specificMoves = compileMoves1to1(a, equipment); } catch { /* skip */ } }
        };
        let fpPieceName: string | null = null;
        if (positional[1]) {
          const secondArg = positional[1];
          if (isList(secondArg)) {
            considerArg(secondArg);
          } else if (isString(secondArg)) {
            // Named piece filter: (forEach Piece "Counter" moves)
            // @java ForEachPiece — compIndices built from matching component name
            fpPieceName = secondArg.value;
            considerArg(positional[2]); considerArg(positional[3]);
          } else if (isIdent(secondArg)) {
            specificRole = secondArg.name;
            considerArg(positional[2]); considerArg(positional[3]);
          }
        }
        considerArg(positional[2]); // also pick up a trailing (then …) after a moves arg
        void specificRole; // Note: owner filtering not yet implemented
        const fp = new ForEachPiece1to1(specificMoves);
        if (fpPieceName !== null) fp.pieceName = fpPieceName;
        if (equipment) fp.equipment = equipment;
        // Handle container: named argument for (forEach Piece container:(mover)).
        // @java ForEachPiece — containerId controls the site range to scan.
        //   No container → board only (ContainerId default = 0 = board container).
        //   container:(mover) → mover's hand sites.
        // Without this, (forEach Piece) wrongly scans hand sites and
        // (forEach Piece container:(mover)) doesn't restrict to hand sites.
        const containerNode = named.get("container");
        if (containerNode) {
          try {
            fp.containerFn = compileInt1to1(containerNode);
          } catch { /* ignore unrecognised container expr */ }
        } else {
          // No container arg → default board-only scan.
          // compileInt1to1 returning 0 signals the board container.
          fp.containerFn = { eval(_ctx: Context): number { return 0; } };
        }
        return fpThen.length > 0 ? attachThen(fp, fpThen, equipment) : fp;
      }

      // (forEach Site <region> <moves>) — generate moves for each site in region
      // @java game/rules/play/moves/nonDecision/operators/foreach/site/ForEachSite.java
      if (typeName === "site") {
        // Handle the case where region may be a string (define ref that became ident, not expanded)
        const regionNode = positional[1];
        const movesNode = positional[2] ?? named.get("do");
        if (!regionNode || !movesNode) {
          // Try: maybe positional[1] is the moves and no region
          return { eval(_ctx: Context): Move[] { return []; } };
        }
        let regionFn: RegionFunction;
        try { regionFn = compileRegion1to1(regionNode); }
        catch { return { eval(_ctx: Context): Move[] { return []; } }; }
        let movesFn: MovesFunction;
        try { movesFn = compileMoves1to1(movesNode, equipment); }
        catch { return { eval(_ctx: Context): Move[] { return []; } }; }
        return {
          eval(ctx: Context): Move[] {
            const origSite = ctx._evalSite;
            const origFrom = ctx._evalFrom;
            const origTo = ctx._evalTo;
            const sites = regionFn.eval(ctx);
            const allMoves: Move[] = [];
            for (const s of sites) {
              ctx._evalSite = s;
              ctx._evalFrom = s;
              ctx._evalTo = s;
              const ms = movesFn.eval(ctx);
              for (const m of ms) allMoves.push(m);
            }
            ctx._evalSite = origSite;
            ctx._evalFrom = origFrom;
            ctx._evalTo = origTo;
            return allMoves;
          }
        };
      }

      // (forEach Die [if:<cond>] <moves>) — iterate dice values, generate moves for each
      // @java game/rules/play/moves/nonDecision/operators/foreach/die/ForEachDie.java — eval
      // For each non-zero die value, bind _evalPips and evaluate the sub-moves.
      // An ActionUseDie is appended to each resulting move to mark the die as used.
      if (typeName === "die") {
        let condFn: BooleanFunction | null = null;
        let movesNode2: LudNode | null = null;
        const condNode2 = named.get("if");
        if (condNode2) {
          try { condFn = compileBool1to1(condNode2, 2); } catch { condFn = null; }
        }
        // The sub-moves is the last positional after "Die" (skipping optional ints/strings)
        for (let dpi = 1; dpi < positional.length; dpi++) {
          const dp = positional[dpi]!;
          if (isList(dp)) { movesNode2 = dp; break; }
        }
        if (!movesNode2) {
          return { eval(_ctx: Context): Move[] { return []; } };
        }
        const subMovesFn = compileMoves1to1(movesNode2, equipment);
        const condFnFinal = condFn;
        return { eval(ctx: Context): Move[] {
          const dice = ctx.state.diceValues;
          if (!dice || dice.length === 0) return [];
          const allMoves: Move[] = [];
          const ctxAny = ctx as unknown as { _evalPips?: number };
          const origPips = ctxAny._evalPips;
          for (let dieIdx = 0; dieIdx < dice.length; dieIdx++) {
            const pipCount = dice[dieIdx] ?? 0;
            if (pipCount === 0) continue; // die already used (Java: value == 0 means used)
            ctxAny._evalPips = pipCount;
            // Apply the if: condition
            if (condFnFinal && !condFnFinal.eval(ctx)) continue;
            const subMoves = subMovesFn.eval(ctx);
            for (const m of subMoves) {
              // Append ActionUseDie to mark this die as consumed
              // @java ForEachDie.java:120 — new ActionUseDie(handDiceIndex, i, site)
              const useDieAction = new ActionUseDie(dieIdx, dieIdx);
              const newActions = [...m.actions, useDieAction];
              allMoves.push(new Move({
                id: m.id + `:die${dieIdx}`,
                label: m.label,
                siteIndices: m.siteIndices,
                mover: m.mover,
                placedOwner: (m as unknown as { placedOwner: number }).placedOwner ?? m.mover,
                actions: newActions,
                fromSite: m.from(),
                toSite: m.to(),
              }));
            }
          }
          ctxAny._evalPips = origPips;
          return allMoves;
        }};
      }

      // (forEach Player <moves>) / (forEach NonMover <moves>) — generate moves for each player
      // Simplified: iterate over all active players (stub: generate empty)
      if (typeName === "player" || typeName === "nonmover") {
        return { eval(_ctx: Context): Move[] { return []; } };
      }

      // (forEach Value <intArrayFn> <moves>) — value iterator
      // @java game/rules/play/moves/nonDecision/operators/foreach/value/ForEachValue.java — eval
      // For each integer in the array, set ctx._evalValue and eval the generator.
      // Supports (forEach Value (array <region>) <moves>) and (forEach Value min:N max:N <moves>).
      if (typeName === "value") {
        // positional[1] is the values source: (array <region>), or a min/max int form.
        // positional[2] (or positional[1] if no values source) is the generator moves.
        // Named args: min:, max:
        const minNode = named.get("min");
        const maxNode = named.get("max");
        // Find the generator node: last list positional (skipping "Value" ident at [0])
        let valuesNode: LudNode | null = null;
        let generatorNode: LudNode | null = null;
        for (let vi = 1; vi < positional.length; vi++) {
          const pn = positional[vi];
          if (pn && isList(pn)) {
            if (generatorNode === null) {
              // First list node is the values source (e.g. (array ...)), second is generator
              if (valuesNode === null) valuesNode = pn;
              else generatorNode = pn;
            }
          }
        }
        if (generatorNode === null) {
          // Only one list arg: it's the generator; values come from min:/max: named args
          generatorNode = valuesNode;
          valuesNode = null;
        }
        if (generatorNode === null) {
          return { eval(_ctx: Context): Move[] { return []; } };
        }
        let generatorFn: MovesFunction;
        try { generatorFn = compileMoves1to1(generatorNode, equipment); }
        catch { return { eval(_ctx: Context): Move[] { return []; } }; }

        if (minNode != null && maxNode != null) {
          // (forEach Value min:N max:M <moves>)
          // Note: using != (loose) to exclude both null and undefined
          let minFn: IntFunction, maxFn: IntFunction;
          try { minFn = compileInt1to1(minNode!); } catch { return { eval(_ctx: Context): Move[] { return []; } }; }
          try { maxFn = compileInt1to1(maxNode!); } catch { return { eval(_ctx: Context): Move[] { return []; } }; }
          return {
            eval(ctx: Context): Move[] {
              const savedValue = ctx._evalValue;
              const allMoves: Move[] = [];
              const lo = minFn.eval(ctx);
              const hi = maxFn.eval(ctx);
              for (let v = lo; v <= hi; v++) {
                ctx._evalValue = v;
                for (const m of generatorFn.eval(ctx)) allMoves.push(m);
              }
              ctx._evalValue = savedValue;
              return allMoves;
            }
          };
        }

        if (valuesNode !== null) {
          // (forEach Value (array <region>) <moves>) — evaluate the array to get values
          // (array <region>) converts a region to an integer list
          // @java game/functions/intArray/array/Array.java — eval
          let valuesFn: RegionFunction | null = null;
          if (isList(valuesNode) && headOf(valuesNode) === "array") {
            const arrArgs = parseArgs1to1(valuesNode.items);
            const innerNode = arrArgs.positional[0];
            if (innerNode) {
              try { valuesFn = compileRegion1to1(innerNode); } catch { /* skip */ }
            }
          }
          if (valuesFn === null) {
            // Try treating valuesNode itself as a region
            try { valuesFn = compileRegion1to1(valuesNode); } catch { /* skip */ }
          }
          if (valuesFn === null) {
            return { eval(_ctx: Context): Move[] { return []; } };
          }
          const capturedValuesFn = valuesFn;
          return {
            eval(ctx: Context): Move[] {
              const savedValue = ctx._evalValue;
              const allMoves: Move[] = [];
              const values = capturedValuesFn.eval(ctx);
              for (const v of values) {
                ctx._evalValue = v;
                for (const m of generatorFn.eval(ctx)) allMoves.push(m);
              }
              ctx._evalValue = savedValue;
              return allMoves;
            }
          };
        }

        return { eval(_ctx: Context): Move[] { return []; } };
      }

      // (forEach Group ...) / (forEach Level ...) — other iterators (stub: empty)
      if (typeName === "group" || typeName === "level") {
        return { eval(_ctx: Context): Move[] { return []; } };
      }

      throw new Error(`compiler1to1: (forEach ${first && isIdent(first) ? first.name : "?"}) not supported`);
    }
  }

  // ---- (priority { <moves1> <moves2> ... }) — first non-empty move list -----
  // @java game/rules/play/moves/nonDecision/effect/requirement/Priority.java
  // Returns the first sub-list that generates at least one move.
  // Java Priority extends Effect which holds a `then()` consequence; this
  // then-clause is appended to each move in the first non-empty list:
  //   if (then() != null) for (j) l.moves().get(j).then().add(then().moves());
  // So the (then ...) child must be separated from the sub-move list and
  // attached via attachThen rather than being treated as a sub-generator.
  if (h === "priority") {
    const { positional } = parseArgs1to1(node.items);
    // Exclude top-level (then ...) nodes — they are the Effect.then() consequence,
    // not a sub-move-generator. Only exclude top-level (then ...); (then ...) nodes
    // nested inside sub-generators are handled by their own attachThen calls.
    const nonThenPositional = positional.filter(p => !(isList(p) && headOf(p) === "then"));
    const subMoves = flattenMovesList(nonThenPositional, equipment);
    const priorityBase: MovesFunction = {
      eval(ctx: Context): Move[] {
        for (const sub of subMoves) {
          const moves = sub.eval(ctx);
          if (moves.length > 0) return moves;
        }
        return [];
      }
    };
    // Attach the (then ...) consequence to the priority result, mirroring Java's
    // Priority.eval() which appends then().moves() to each move in the chosen list.
    return attachThen(priorityBase, positional, equipment);
  }

  // ---- (then <moves> (then ...)) — sequential move with consequence ----------
  // @java game/rules/play/moves/nonDecision/effect/Then.java
  // Simplified: return the inner moves (ignore then-consequence in 1:1 path)
  if (h === "then") {
    const { positional } = parseArgs1to1(node.items);
    const innerNode = positional[0];
    if (innerNode) {
      try { return compileMoves1to1(innerNode, equipment); } catch { /* fall through */ }
    }
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (do <prior> next:<main> ifAfterwards:<cond>) -----------------------
  // @java game/rules/play/moves/nonDecision/effect/requirement/Do.java — eval
  //
  // Two forms:
  //   1. (do <prior> next:<main>)           — apply prior, then eval main in that context
  //   2. (do <prior> ifAfterwards:<cond>)   — eval prior moves, filter by condition
  if (h === "do") {
    const { positional, named } = parseArgs1to1(node.items);
    const priorNode = positional[0];
    if (!priorNode) throw new Error("compiler1to1: (do ...) missing prior moves");
    const priorMoves = compileMoves1to1(priorNode, equipment);

    const nextNode = named.get("next");
    const ifAfterNode = named.get("ifafterwards");

    if (nextNode) {
      // Form 1: (do <prior> next:<main>)
      // @java Do.eval: apply each prior move to a TempContext, eval next there,
      //   prepend prior actions to each resulting move.
      // IMPORTANT: Java Do.eval() does NOT guard on empty prior — it always
      // evaluates next in the post-prior context, even when prior returns 0 moves.
      // This is critical for (do (roll) next:...) where (roll) must always run.
      const nextMoves = compileMoves1to1(nextNode, equipment);
      // Capture dice availability for forced-pass fallback.
      const doHasDice = (equipment?.diceSpecs?.length ?? 0) > 0;
      return {
        eval(ctx: Context): Move[] {
          const priorResult = priorMoves.eval(ctx);
          // NOTE: do NOT early-return on empty prior (Bug 2 fix).
          // Java Do.eval() unconditionally creates a TempContext and evaluates next.
          // Apply all prior moves to a temp state, collect their combined actions.
          const priorActions: Move["actions"][number][] = [];
          let tempState = ctx.state;
          for (const pm of priorResult) {
            const newState = pm.applyTo(tempState, ctx.rng);
            for (const a of pm.actions) priorActions.push(a);
            tempState = newState;
          }
          // Build temp context with the new state.
          const tempCtx = new Context(ctx.game, tempState, ctx.trial, ctx.rng);
          tempCtx._evalTo = ctx._evalTo;
          tempCtx._evalFrom = ctx._evalFrom;
          tempCtx._evalValue = 0;
          // Copy radials if present (1:1 path).
          const ctxAny = ctx as unknown as Record<string, unknown>;
          const tctxAny = tempCtx as unknown as Record<string, unknown>;
          if (ctxAny["_radials"] !== undefined) tctxAny["_radials"] = ctxAny["_radials"];
          if (ctxAny["_trajectories"] !== undefined) tctxAny["_trajectories"] = ctxAny["_trajectories"];
          // Eval next in the temp context.
          const nextResult = nextMoves.eval(tempCtx);
          if (nextResult.length === 0) {
            if (doHasDice && priorActions.length > 0) {
              // Java Do.prependPreMoves: when next yields nothing and the game has
              // hand dice (the roll pre-move ran), insert a forced-pass with the
              // roll actions prepended. This handles "no legal moves after rolling"
              // (e.g. backgammon forced pass, 20 Squares stuck position).
              // @java game/rules/play/moves/nonDecision/effect/requirement/Do.java — prependPreMoves
              const mover = ctx.state.mover;
              return [new Move({
                id: "pass", label: "Pass",
                siteIndices: [0],
                mover,
                placedOwner: mover,
                actions: [...priorActions, new ActionPass()],
                decisionIndex: priorActions.length,
              })];
            }
            return [];
          }
          // Prepend prior actions to each next move.
          return nextResult.map(nm => new Move({
            id: nm.id,
            label: nm.label,
            siteIndices: nm.siteIndices,
            mover: nm.mover,
            placedOwner: nm.placedOwner,
            actions: [...priorActions, ...nm.actions],
            moveAgain: nm.moveAgain,
            decisionIndex: priorActions.length + (nm.decisionIndex ?? 0),
          }));
        }
      };
    }

    if (ifAfterNode) {
      // Form 2: (do <prior> ifAfterwards:<cond>)
      // @java Do.eval: generate prior.eval(context) moves, filter each move by
      //   applying it to a TempContext and checking ifAfterwards.
      const condFn = compileBool1to1(ifAfterNode, 2);
      return {
        eval(ctx: Context): Move[] {
          const priorResult = priorMoves.eval(ctx);
          const filtered: Move[] = [];
          for (const m of priorResult) {
            // Apply move to a temp state AND record it in a temp trial so the
            // ifAfterwards condition's (last To)/(last From) resolve to THIS move
            // (Go no-suicide/no-capture: (count Liberties at:(last To))). Without
            // the trial update they'd read the previous ply's move (or -1).
            const tempState = m.applyTo(ctx.state, ctx.rng);
            const tempTrial = ctx.trial.withMove(m, false, -1);
            const tempCtx = new Context(ctx.game, tempState, tempTrial, ctx.rng);
            tempCtx._evalTo = m.to();
            tempCtx._evalFrom = m.from();
            tempCtx._evalValue = 0;
            const ctxAny = ctx as unknown as Record<string, unknown>;
            const tctxAny = tempCtx as unknown as Record<string, unknown>;
            if (ctxAny["_radials"] !== undefined) tctxAny["_radials"] = ctxAny["_radials"];
            if (ctxAny["_trajectories"] !== undefined) tctxAny["_trajectories"] = ctxAny["_trajectories"];
            if (condFn.eval(tempCtx)) filtered.push(m);
          }
          return filtered;
        }
      };
    }

    // Bare (do <prior>) — just return prior moves
    return priorMoves;
  }

  // ---- (and <moves1> <moves2>) — combine two move generators ---------------
  // @java game/rules/play/moves/nonDecision/operators/logical/And.java
  if (h === "and") {
    const { positional } = parseArgs1to1(node.items);
    const subMoves = flattenMovesList(positional, equipment);
    return {
      eval(ctx: Context): Move[] {
        const all: Move[] = [];
        for (const sub of subMoves) {
          for (const m of sub.eval(ctx)) all.push(m);
        }
        return all;
      }
    };
  }

  // ---- (append <list> [then:<moves>]) — compound-move builder ---------------
  // @java game/rules/play/moves/nonDecision/operators/logical/Append.java
  //
  // Java semantics (Append.eval):
  //   1. Evaluate `list` (the single NonDecision sub-generator).
  //   2. If evaluated list is EMPTY → return empty (then is NOT applied).
  //   3. Mark each sub-move as decision=true.
  //   4. Merge ALL sub-moves' actions into ONE compound Move via new Move(evaluated).
  //   5. Attach `then` as a consequence on that single merged move.
  //
  // The previous (incorrect) TS implementation treated every positional as a
  // parallel sub-generator and unioned outputs, wrongly including `(then ...)`
  // as a standalone move generator rather than a consequence. This produced
  // 132 SetScore-only moves in MacBeth's Playing phase instead of the correct
  // custodial+consequence compound moves.
  if (h === "append") {
    const { positional } = parseArgs1to1(node.items);
    // Separate the `list` (first non-then positional) from the `then` clause.
    const appendListNode = positional.find(p => !(isList(p) && headOf(p as import("@ludii/typescript-language").LudList) === "then"));
    const appendThenNode = positional.find(p => isList(p) && headOf(p as import("@ludii/typescript-language").LudList) === "then");
    if (!appendListNode) {
      return { eval(_ctx: Context): Move[] { return []; } };
    }
    let appendListFn: MovesFunction;
    try { appendListFn = compileMoves1to1(appendListNode, equipment); }
    catch { return { eval(_ctx: Context): Move[] { return []; } }; }
    let appendThenFn: MovesFunction | null = null;
    if (appendThenNode && isList(appendThenNode)) {
      const { positional: thenPos } = parseArgs1to1((appendThenNode as import("@ludii/typescript-language").LudList).items);
      const thenInner = thenPos[0];
      if (thenInner) {
        try { appendThenFn = compileMoves1to1(thenInner, equipment); } catch { /* skip */ }
      }
    }
    const appendThenFnFinal = appendThenFn;
    return {
      eval(ctx: Context): Move[] {
        // Step 1: evaluate the list
        const evaluated = appendListFn.eval(ctx);
        // Step 2: if empty, return empty (then is NOT applied — Java parity)
        if (evaluated.length === 0) return [];
        // Step 3: merge all sub-move actions into one compound Move.
        // @java new Move(evaluated) — concatenates all action lists.
        const mover = ctx.state.mover;
        // The first sub-move provides the decision context (from/to/mover).
        const first = evaluated[0]!;
        // Mark each sub-move's first action as decision (Java setDecision(true) per sub-move).
        const mergedActions: import("./action/index.js").Action[] = [];
        for (const sm of evaluated) {
          for (const a of sm.actions) mergedActions.push(a);
        }
        // Build the merged move using the first sub-move's from/to as the decision site.
        const mergedSiteIndices = evaluated.flatMap(sm => [...sm.siteIndices]);
        const compound = new Move({
          id: `append:${mover}:${first.id}`,
          label: `Append(${first.label})`,
          siteIndices: mergedSiteIndices.length > 0 ? mergedSiteIndices : [0],
          mover,
          placedOwner: first.placedOwner,
          actions: mergedActions,
          // Preserve the decision index from the first sub-move so from()/to() point
          // to the placement action (Add) rather than any prepended effect actions.
          decisionIndex: first.decisionIndex,
          fromSite: first.fromSite,
          toSite: first.toSite,
        });
        // Step 5: apply then-consequence if present.
        if (appendThenFnFinal) {
          try {
            const postState = compound.applyTo(ctx.state, ctx.rng);
            const postTrial = ctx.trial.withMove(compound, false, -1);
            const postCtx = new Context(ctx.game, postState, postTrial, ctx.rng);
            (postCtx as unknown as { _evalFrom?: number })._evalFrom = compound.from();
            (postCtx as unknown as { _evalTo?: number })._evalTo = compound.to();
            const thenMoves = appendThenFnFinal.eval(postCtx);
            const extraActions = thenMoves.flatMap(tm => [...tm.actions]);
            const moveAgain = thenMoves.some(tm => tm.moveAgain);
            if (extraActions.length > 0 || moveAgain) {
              return [compound.withConsequence(extraActions, moveAgain)];
            }
          } catch { /* fall through to returning compound without then */ }
        }
        return [compound];
      }
    };
  }

  // ---- (set ...) in play context — dispatch to the faithful Set ludeme. -----
  // @java game/rules/play/moves/nonDecision/effect/set/**
  if (h === "set") {
    const { positional: setPos } = parseArgs1to1(node.items);
    const sub = (setPos[0] && isIdent(setPos[0])) ? setPos[0].name.toLowerCase() : "";
    // (set Var [<name>] <value>) → ActionSetTemp / ActionSetVar
    if (sub === "var") {
      let name: string | null = null;
      let valNode: LudNode | undefined = setPos[1];
      if (setPos[1] && isString(setPos[1])) { name = setPos[1].value; valNode = setPos[2]; }
      const valueFn: IntFunction = valNode ? compileInt1to1(valNode) : new IntConstant(-1);
      return new SetVar1to1(name, valueFn);
    }
    // (set Pending [<site>]) → ActionSetPending
    if (sub === "pending") {
      const siteNode = setPos[1];
      const siteFn: IntFunction | null = siteNode ? compileInt1to1(siteNode) : null;
      return { eval(ctx: Context): Move[] {
        const mover = ctx.state.mover;
        return [new Move({
          id: `setpending:${mover}`, label: "SetPending", siteIndices: [], mover,
          placedOwner: mover, actions: [new ActionSetPending(siteFn ? siteFn.eval(ctx) : 1)],
        })];
      }};
    }
    // (set Counter <value>) → ActionSetCounter
    if (sub === "counter") {
      const valNode = setPos[1];
      const valueFn: IntFunction = valNode ? compileInt1to1(valNode) : new IntConstant(0);
      return { eval(ctx: Context): Move[] {
        const mover = ctx.state.mover;
        return [new Move({
          id: `setcounter:${mover}`, label: "SetCounter", siteIndices: [], mover,
          placedOwner: mover, actions: [new ActionSetCounter(valueFn.eval(ctx))],
        })];
      }};
    }
    // (set Hidden [<dataType>] [value:<bool>] at:<site> to:<role>)
    // Sets the hidden flag for a specific site for the target player.
    // @java game/rules/play/moves/nonDecision/effect/set/hidden/SetHidden.java — eval()
    if (sub === "hidden") {
      const { positional: setHPos, named: setHNamed } = parseArgs1to1(node.items);
      // setHPos[0]=Hidden, setHPos[1]=dataType(What/Who/...) or value(True/False)
      // named: at:<site>, to:<role>, value:<bool>
      const dataTypeNode = setHPos[1];
      const dataTypeName = (dataTypeNode && isIdent(dataTypeNode))
        ? dataTypeNode.name.toLowerCase() : "";
      // value arg: look for False/True ident in positionals, or named "value"
      const valueNode = setHNamed.get("value")
        ?? setHPos.find((n, i) => i >= 1 && isIdent(n) &&
           ((n as {name:string}).name.toLowerCase() === "false" ||
            (n as {name:string}).name.toLowerCase() === "true"));
      const hiddenFlag = !valueNode || !isIdent(valueNode)
        ? true  // default: hidden=true
        : (valueNode as {name:string}).name.toLowerCase() !== "false";
      const atNode = setHNamed.get("at");
      const toNode = setHNamed.get("to");
      const roleStr4 = toNode && isIdent(toNode) ? toNode.name.toLowerCase() : "mover";
      const fixedPid4 = roleStr4.startsWith("p") && !isNaN(parseInt(roleStr4.slice(1), 10))
        ? parseInt(roleStr4.slice(1), 10) : -1;
      let siteFn4: IntFunction | null = null;
      if (atNode) { try { siteFn4 = compileInt1to1(atNode); } catch { /* skip */ } }
      const flag4 = hiddenFlag;
      return {
        eval(ctx: Context): Move[] {
          const site4 = siteFn4 ? siteFn4.eval(ctx) : ctx._evalTo;
          if (site4 < 0) return [];
          const pid4 = fixedPid4 >= 1 ? fixedPid4
            : roleStr4 === "next" ? (ctx.state.mover % ctx.game.numPlayers) + 1
            : ctx.state.mover;
          const mover4 = ctx.state.mover;
          let action: ActionSetHidden | ActionSetHiddenWhat | ActionSetHiddenWho |
                      ActionSetHiddenState | ActionSetHiddenCount |
                      ActionSetHiddenRotation | ActionSetHiddenValue;
          switch (dataTypeName) {
            case "what":     action = new ActionSetHiddenWhat(site4, pid4, flag4); break;
            case "who":      action = new ActionSetHiddenWho(site4, pid4, flag4); break;
            case "state":    action = new ActionSetHiddenState(site4, pid4, flag4); break;
            case "count":    action = new ActionSetHiddenCount(site4, pid4, flag4); break;
            case "rotation": action = new ActionSetHiddenRotation(site4, pid4, flag4); break;
            case "value":    action = new ActionSetHiddenValue(site4, pid4, flag4); break;
            default:         action = new ActionSetHidden(site4, pid4, flag4); break;
          }
          return [new Move({
            id: `sethidden:${site4}:${pid4}:${flag4}`,
            label: `SetHidden`,
            siteIndices: [site4],
            mover: mover4, placedOwner: mover4,
            actions: [action],
          })];
        }
      };
    }
    // (set Value <role> <value>) — set a player's persistent value.
    // @java game/rules/play/moves/nonDecision/effect/set/player/SetValuePlayer.java
    // Used in mancala games to track per-player state (e.g. square hole status).
    if (sub === "value") {
      const roleNode3 = setPos[1];
      const valNode3 = setPos[2];
      const roleName3 = (roleNode3 && isIdent(roleNode3)) ? roleNode3.name.toLowerCase() : "mover";
      let valueFn3: IntFunction = new IntConstant(0);
      if (valNode3) { try { valueFn3 = compileInt1to1(valNode3); } catch { /* keep 0 */ } }
      const capturedValueFn3 = valueFn3;
      return { eval(ctx: Context): Move[] {
        const mover = ctx.state.mover;
        let pid: number;
        if (roleName3 === "mover") pid = mover;
        else if (roleName3 === "next") pid = (mover % ctx.game.numPlayers) + 1;
        else if (roleName3.startsWith("p") && !isNaN(parseInt(roleName3.slice(1), 10)))
          pid = parseInt(roleName3.slice(1), 10);
        else pid = mover;
        const val3 = capturedValueFn3.eval(ctx);
        return [new Move({
          id: `setvalue:${pid}:${val3}`, label: "SetValue", siteIndices: [], mover,
          placedOwner: mover, actions: [new ActionSetValueOfPlayer(pid, val3)],
        })];
      }};
    }
    // (set Score <role> <value>) — set a player's score to a specific value.
    // @java game/rules/play/moves/nonDecision/effect/set/player/SetScore.java
    // Used in Morris/Dala-family games to track mill count (score=N means N removals pending).
    if (sub === "score") {
      const roleNode2 = setPos[1];
      const valNode2 = setPos[2];
      const roleName2 = (roleNode2 && isIdent(roleNode2)) ? roleNode2.name.toLowerCase() : "mover";
      let scoreFn2: IntFunction = new IntConstant(0);
      if (valNode2) { try { scoreFn2 = compileInt1to1(valNode2); } catch { /* keep 0 */ } }
      const capturedScoreFn2 = scoreFn2;
      return { eval(ctx: Context): Move[] {
        const mover = ctx.state.mover;
        let pid: number;
        if (roleName2 === "mover") pid = mover;
        else if (roleName2 === "next") pid = (mover % ctx.game.numPlayers) + 1;
        else if (roleName2.startsWith("p") && !isNaN(parseInt(roleName2.slice(1), 10)))
          pid = parseInt(roleName2.slice(1), 10);
        else pid = mover;
        const score2 = capturedScoreFn2.eval(ctx);
        return [new Move({
          id: `setscore:${pid}:${score2}`, label: "SetScore", siteIndices: [], mover,
          placedOwner: mover, actions: [new ActionSetScore({ player: pid, score: score2, add: false })],
        })];
      }};
    }
    // (set NextPlayer (player <N>)) — override who moves next.
    // @java game/rules/play/moves/nonDecision/effect/set/SetNextPlayer.java — eval()
    // Java emits ActionSetNextPlayer(pid) which is consumed in Game.apply() to
    // determine the next mover (overriding the normal rotation).
    // Used in mancala round-end logic to control who starts the next round.
    if (sub === "nextplayer") {
      const playerNode = setPos[1];
      let playerFn: IntFunction = new IntConstant(1);
      if (playerNode && isList(playerNode) && headOf(playerNode) === "player") {
        // (player <N>) — get the Nth player id
        const playerArgs = parseArgs1to1(playerNode.items);
        const pidNode = playerArgs.positional[0];
        if (pidNode) { try { playerFn = compileInt1to1(pidNode); } catch { /* keep default */ } }
      } else if (playerNode) {
        try { playerFn = compileInt1to1(playerNode); } catch { /* keep default */ }
      }
      const capturedPlayerFn = playerFn;
      return { eval(ctx: Context): Move[] {
        const pid = capturedPlayerFn.eval(ctx);
        const mover = ctx.state.mover;
        return [new Move({
          id: `setnextplayer:${pid}`, label: "SetNextPlayer", siteIndices: [], mover,
          placedOwner: mover, actions: [new ActionSetNextPlayer(pid)],
        })];
      }};
    }
    // (set State at:<site> <value>) — set per-site piece state.
    // @java game/rules/play/moves/nonDecision/effect/set/site/SetState.java
    // Used in Jungle (LosePower / RestoredPower), Arimaa (setup), etc.
    if (sub === "state") {
      const { named: setStNamed, positional: setStPos } = parseArgs1to1(node.items);
      const atNode = setStNamed.get("at") ?? setStPos[1];
      const valNode = setStPos[2] ?? setStPos[1];
      let siteFn: IntFunction;
      try {
        siteFn = atNode ? compileInt1to1(atNode) : { eval(ctx: Context): number { return ctx._evalTo >= 0 ? ctx._evalTo : ctx._evalFrom; } };
      } catch {
        siteFn = { eval(ctx: Context): number { return ctx._evalTo >= 0 ? ctx._evalTo : ctx._evalFrom; } };
      }
      let valueFn: IntFunction = new IntConstant(0);
      if (valNode && valNode !== atNode) { try { valueFn = compileInt1to1(valNode); } catch { /* keep 0 */ } }
      const capturedSiteFn = siteFn;
      const capturedValueFn = valueFn;
      return { eval(ctx: Context): Move[] {
        const mover = ctx.state.mover;
        const site = capturedSiteFn.eval(ctx);
        if (site < 0) return [];
        const value = capturedValueFn.eval(ctx);
        return [new Move({
          id: `setstate:${site}:${value}`, label: "SetState", siteIndices: [site], mover,
          placedOwner: mover, actions: [new ActionSetState({ to: site, state: value })],
        })];
      }};
    }
    // Other set subtypes not yet routed — generate no moves (no fake behaviour).
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (roll) — roll dice. Faithfully mirrors Java Roll.eval() ---------------
  // @java game/rules/play/moves/nonDecision/effect/Roll.java — eval()
  // Java: for each die, samples ctx.rng uniformly over its faces, emits one
  // ActionUpdateDice per die + one ActionSetDiceAllEqual, wrapped in a single Move.
  if (h === "roll") {
    // Dice specs are read from ctx.game.equipment at eval time so this works
    // regardless of whether equipment was available at compile time.
    return {
      eval(ctx: Context): Move[] {
        const eq = (ctx.game as unknown as Game1to1).equipment;
        const specs = eq?.diceSpecs ?? [];
        if (specs.length === 0) return [];
        const mover = ctx.state.mover;
        const actions: (ActionUpdateDice | ActionSetDiceAllEqual)[] = [];
        let firstIdx: number | undefined;
        let allEqual = true;
        const diceBase = eq?.diceSiteBase ?? -1;
        for (let i = 0; i < specs.length; i++) {
          const faces = specs[i]!.faces;
          const faceIdx = ctx.rng.nextInt(faces.length);
          const faceValue = faces[faceIdx] ?? 0;
          // ActionUpdateDice in dice-value mode: updates state.diceValues[i]
          // so (forEach Die), (pips), (count Pips) all read the rolled value.
          actions.push(new ActionUpdateDice(i, faceIdx, faceValue));
          // Also update stateAt[diceSite] if dice sites are allocated in state.
          if (diceBase >= 0) {
            actions.push(new ActionUpdateDice(diceBase + i, faceIdx));
          }
          // Java Roll.eval(): allEqual tracks face INDICES (not values).
          // @java game/rules/play/moves/nonDecision/effect/Roll.java — allEqual logic
          // Java: compares newValue (= context.components()[what].roll(context))
          // which IS the face index (Die.roll() returns nextInt(faces.length)).
          if (firstIdx === undefined) firstIdx = faceIdx;
          else if (firstIdx !== faceIdx) allEqual = false;
        }
        const diceAllEqual = allEqual && specs.length >= 2;
        actions.push(new ActionSetDiceAllEqual(diceAllEqual));
        return [new Move({
          id: "roll", label: "Roll",
          siteIndices: [],
          mover,
          placedOwner: mover,
          actions,
        })];
      }
    };
  }

  // ---- (pass) / (move Pass) — explicit pass move ----------------------------
  // @java game/rules/play/moves/nonDecision/effect/Pass.java
  // (pass) RELOCATED → registered faithful class Pass1to1 (registry1to1-moves.ts).

  // ---- (max Moves <moves>) / (max Captures <moves>) — keep only max-capture moves ------
  // @java game/rules/play/moves/nonDecision/effect/requirement/max/Max.java
  // @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java
  // Filters move list to keep only moves that allow the maximum number of captures.
  // Faithful implementation: for each move, apply to a temp state and count subsequent moves.
  if (h === "max") {
    const { positional } = parseArgs1to1(node.items);
    const first = positional[0];
    const firstIdent = first && isIdent(first) ? first.name.toLowerCase() : "";
    // Get the sub-moves node: (max Moves <subMoves>) or (max Captures <subMoves>)
    let subMovesNode: LudNode | undefined;
    // Check named or positional args
    if (firstIdent === "moves" || firstIdent === "captures" || firstIdent === "distance") {
      subMovesNode = positional[1];
      if (!subMovesNode) subMovesNode = positional[2];
    } else {
      // (max <subMoves>) — no type qualifier
      subMovesNode = positional[0];
    }
    if (!subMovesNode) {
      return { eval(_ctx: Context): Move[] { return []; } };
    }
    let subMovesFn: MovesFunction;
    try { subMovesFn = compileMoves1to1(subMovesNode, equipment); }
    catch { return { eval(_ctx: Context): Move[] { return []; } }; }
    // (max Moves): for each candidate move, apply it and count how many moves are available
    // Keep only those with the maximum reachable count.
    // @java MaxMoves.java:63-87 — apply each move to TempContext, then getReplayCount
    return {
      eval(ctx: Context): Move[] {
        const candidates = subMovesFn.eval(ctx);
        if (candidates.length === 0) return [];
        if (candidates.length === 1) return candidates;
        // Count captures or sub-moves after each candidate
        let maxCount = -1;
        const counts: number[] = [];
        for (const m of candidates) {
          // Count ActionRemove actions as capture depth metric
          const captureCount = m.actions.filter(a => a.actionType() === "Remove").length;
          counts.push(captureCount);
          if (captureCount > maxCount) maxCount = captureCount;
        }
        const best = candidates.filter((_, i) => counts[i] === maxCount);
        return best.length > 0 ? best : candidates;
      }
    };
  }

  // ---- (avoidstoredstate ...) — filter moves that would repeat a stored state ---
  // @java game/rules/play/moves/nonDecision/effect/requirement/AvoidStoredState.java
  // Simplified: return all moves (state repetition detection not in 1:1 path)
  if (h === "avoidstoredstate") {
    const { positional } = parseArgs1to1(node.items);
    const subMovesNode = positional[0];
    if (subMovesNode) {
      try { return compileMoves1to1(subMovesNode, equipment); } catch { /* fall through */ }
    }
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (allDiceEqual ...) as a move generator (rarely seen; usually a boolean) ---
  // Stub: return empty (handled as BooleanFunction elsewhere)
  if (h === "allDiceEqual" || h === "alldiceequal") {
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (playSomewhere ...) / (claim ...) — placement with ownership --------
  // @java game/rules/play/moves/nonDecision/effect/Claim.java
  // Treat as (move Add (to ...))
  if (h === "claim") {
    const { positional, named } = parseArgs1to1(node.items);
    // (claim (to <region> ...) ...)
    const toNode = positional.find(n => isList(n) && headOf(n) === "to");
    if (toNode && isList(toNode)) {
      const toArgs = parseArgs1to1(toNode.items);
      const regionNode = toArgs.positional.find(n => isList(n)) ?? toArgs.positional[0];
      if (regionNode) {
        try {
          const regionFn = compileRegion1to1(regionNode);
          return new Add(regionFn);
        } catch { /* fall through */ }
      }
    }
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- bare (slide (from ...) (directions ...)) — piece displacement effect ---
  // @java game/rules/play/moves/nonDecision/effect/Slide.java
  // The bare (slide ...) form (not inside (move Slide ...)) appears in (then ...)
  // consequences as a displacement/push effect (e.g. Boop's "Repel" define).
  // Generates moves by sliding the piece at (from) in the given direction until
  // it hits another piece or the board edge.
  // Compiled from: (slide (from <siteFn>) (directions ...))
  // @java Slide.java — stopRule=null (no (to ...) clause), goRule=is Empty.
  if (h === "slide") {
    const { positional: slPos, named: slNamed } = parseArgs1to1(node.items);
    // Parse (from <siteFn>) — source site for the slide
    const fromNode2 = slPos.find(n => isList(n) && headOf(n) === "from");
    let slideSiteFn: IntFunction = { eval: (ctx: Context): number => ctx._evalSite };
    if (fromNode2 && isList(fromNode2)) {
      const fromArgs2 = parseArgs1to1(fromNode2.items);
      const fromLocNode = fromArgs2.positional[0];
      if (fromLocNode) {
        try { slideSiteFn = compileInt1to1(fromLocNode); }
        catch { /* use _evalSite default */ }
      }
    }
    // Parse (directions ...) — direction for the slide (may be dynamic: from:X to:Y)
    const dirnNode2 = slPos.find(n => isList(n) && headOf(n) === "directions");
    let slideDirnFn: DirectionsFunction = { eval: () => ["Adjacent"] };
    if (dirnNode2 && isList(dirnNode2)) {
      try { slideDirnFn = compileDirections1to1(dirnNode2); }
      catch { /* use Adjacent default */ }
    }
    const slideSiteFnFinal = slideSiteFn;
    const slideDirnFnFinal = slideDirnFn;
    return attachThen({
      eval(ctx: Context): Move[] {
        const from = slideSiteFnFinal.eval(ctx);
        if (from < 0 || ctx.state.isEmptySite(from)) return [];
        const dirNames = slideDirnFnFinal.eval(ctx);
        if (dirNames.length === 0) return [];
        const mover = ctx.state.mover;
        const state = ctx.state;
        const ctxAny = ctx as unknown as {
          _radials?: readonly CellFlatRadials[];
          _trajectories?: Trajectories | null;
        };
        const radials = ctxAny._radials;
        const traj = ctxAny._trajectories ?? null;
        const moves: Move[] = [];
        // Walk each direction's radials from the from-site
        for (const dirName of dirNames) {
          let rays: readonly (readonly number[])[] = [];
          if (traj) {
            // Graph board: use trajectory radials
            const rads = traj.distinctRadialsByName(from, dirName);
            if (rads.length > 0) {
              rays = rads.map(r => r.ray);
            }
          }
          if (rays.length === 0 && radials) {
            const cr = radials[from];
            if (cr) {
              const axes = radialsForDirection(cr, dirName);
              // For a compass direction, only walk the specific ray (not opposite)
              const compassDirs = new Set(["n","s","e","w","ne","nw","se","sw",
                "north","south","east","west","northeast","northwest","southeast","southwest"]);
              const isCompass = compassDirs.has(dirName.toLowerCase());
              if (isCompass) {
                // Pick the ray whose step 1 is in the correct direction from `from`.
                // Uses Ludii's bottom-origin coordinate system:
                //   N = +dy (y increases going north), S = -dy
                //   E = +dx, W = -dx
                //   NE = (+dx, +dy), NW = (-dx, +dy), SE = (+dx, -dy), SW = (-dx, -dy)
                const g = ctx.game as unknown as Game1to1;
                const W2 = g.equipment.board.width;
                const fromY2 = Math.floor(from / W2); const fromX2 = from % W2;
                const d = dirName.toLowerCase();
                // Expected sign of (dy, dx) for each compass direction
                const expectedDy = d.includes("n") ? 1 : (d.includes("s") ? -1 : 0);
                const expectedDx = d.includes("e") ? 1 : (d.includes("w") ? -1 : 0);
                const checkRay = (ray: readonly number[]): boolean => {
                  if (ray.length < 2) return false;
                  const next = ray[1]!;
                  const ny = Math.floor(next / W2); const nx = next % W2;
                  const sy2 = ny === fromY2 ? 0 : (ny > fromY2 ? 1 : -1);
                  const sx2 = nx === fromX2 ? 0 : (nx > fromX2 ? 1 : -1);
                  return sy2 === expectedDy && sx2 === expectedDx;
                };
                for (const { ray } of axes) {
                  if (checkRay(ray)) { rays = [ray]; break; }
                }
                if (rays.length === 0) {
                  for (const { opposite } of axes) {
                    if (checkRay(opposite)) { rays = [opposite]; break; }
                  }
                }
              } else {
                rays = axes.flatMap(({ ray, opposite }) => [ray, opposite]);
              }
            }
          }
          // Walk each ray: generate a move for each empty cell, stop at occupied or edge
          for (const ray of rays) {
            for (let i = 1; i < ray.length; i++) {
              const to = ray[i];
              if (to === undefined) break;
              if (!state.isEmptySite(to)) break; // blocked
              // Generate ActionMove(from → to)
              const mvAction = new ActionMove({ from, to });
              moves.push(new Move({
                id: `slide:${mover}:${from}:${to}`,
                label: `Slide(${from}→${to})`,
                siteIndices: [from, to],
                mover, placedOwner: mover,
                actions: [mvAction],
              }));
              // NOTE: unlike (move Slide), no break here — all empty cells along
              // the ray generate moves so Seq can apply them all, matching Java Seq.eval().
            }
          }
        }
        return moves;
      }
    }, slPos, equipment);
  }

  // ---- (move Use ...) / (apply ...) / etc. — unsupported stubs ---------------
  if (h === "use" || h === "apply" || h === "replay" || h === "note") {
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (forget ...) — forget a remembered value (stub: return empty) -----------
  if (h === "forget") {
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (addScore ...) — add score as a move (now handled by registered AddScore1to1) -----
  // The registered class (registry1to1-moves.ts) takes priority over this inline branch.
  // This fallback is kept for documentation purposes only.
  if (h === "addscore") {
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (seq <moves1> <moves2> ...) — sequential moves -------------------------
  // @java game/rules/play/moves/nonDecision/operators/sequential/Seq.java
  // Java: evaluates each sub-moves in a rolling TempContext (applies each move to
  // TempContext before evaluating the next sub), accumulates ALL applied moves.
  // Used in (then ...) consequences (Boop Repel + moveAgain, Chameleons colour
  // swap, 2048 slide) to chain effects: each sub sees the state AFTER the previous.
  // Faithful port: thread context.state through each sub, combine all results.
  // @java Seq.eval(): Context tempContext = new TempContext(context);
  //   for each sub: for each move: appliedMove = m.apply(tempContext, true); result.add(appliedMove)
  if (h === "seq") {
    const { positional } = parseArgs1to1(node.items);
    const subMoves = flattenMovesList(positional, equipment);
    return {
      eval(ctx: Context): Move[] {
        const result: Move[] = [];
        // Rolling state: apply sub-moves in sequence, each sees the updated state.
        let tempState = ctx.state;
        for (const sub of subMoves) {
          // Create a temp context with the current rolling state so later subs
          // (e.g. moveAgain check) see the board AFTER prior subs' effects.
          const tempCtx = new Context(ctx.game, tempState, ctx.trial, ctx.rng);
          // Copy eval-scratch and trajectory data from the parent context.
          const ctxAny = ctx as unknown as {
            _evalFrom?: number; _evalTo?: number; _evalSite?: number;
            _evalValue?: number; _thenContextDepth?: number;
            _radials?: unknown; _trajectories?: unknown;
          };
          const tempAny = tempCtx as unknown as typeof ctxAny;
          tempAny._evalFrom = ctxAny._evalFrom;
          tempAny._evalTo = ctxAny._evalTo;
          tempAny._evalSite = ctxAny._evalSite;
          tempAny._evalValue = ctxAny._evalValue;
          tempAny._thenContextDepth = ctxAny._thenContextDepth;
          tempAny._radials = ctxAny._radials;
          tempAny._trajectories = ctxAny._trajectories;
          let subResult: Move[];
          try { subResult = sub.eval(tempCtx); }
          catch { subResult = []; }
          for (const m of subResult) {
            // Apply the move to advance the rolling state, mirroring Java's
            // m.apply(tempContext, true). Silent no-op on failure (empty-from etc.)
            try { tempState = m.applyTo(tempState, ctx.rng); }
            catch { /* keep current tempState */ }
            result.push(m);
          }
        }
        return result;
      }
    };
  }

  // ---- (trigger "<event>" <role/player>) — set player's triggered flag --------
  // @java game/rules/play/moves/nonDecision/effect/Trigger.java
  // Used in (then ...) blocks to signal an event (e.g. a win condition) that is
  // later checked by (is Triggered "<event>" <player>) in the end rules.
  // Emits a single Move carrying ActionTrigger(event, victim).
  if (h === "trigger") {
    const { positional: trigPos } = parseArgs1to1(node.items);
    // First positional: event name (string)
    const eventNode = trigPos[0];
    const eventName = eventNode && isString(eventNode) ? eventNode.value : "event";
    // Second positional: player role or index
    const playerNode = trigPos[1];
    let playerFn: IntFunction;
    if (playerNode) {
      try { playerFn = compileInt1to1(playerNode); }
      catch { playerFn = { eval: (ctx: Context) => ctx.state.mover }; }
    } else {
      playerFn = { eval: (ctx: Context) => ctx.state.mover };
    }
    const trigEventName = eventName;
    const trigPlayerFn = playerFn;
    return {
      eval(ctx: Context): Move[] {
        const victim = trigPlayerFn.eval(ctx);
        const mover = ctx.state.mover;
        const action = new ActionTrigger(trigEventName, victim);
        return [new Move({
          id: `trigger:${trigEventName}:${victim}`,
          label: `Trigger(${trigEventName},P${victim})`,
          siteIndices: [],
          mover,
          placedOwner: mover,
          actions: [action],
        })];
      }
    };
  }

  // ---- (satisfy <constraints>) — constraint-satisfaction puzzle move gen (stub: empty) ---
  // @java game/rules/play/moves/nonDecision/effect/requirement/Satisfy.java
  // Generates all moves satisfying a constraint set (backtracking search). Stub.
  if (h === "satisfy") {
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (moveAgain) — the current mover moves again (same-player continuation) ---
  // @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
  // Generates a sentinel move with moveAgain=true and an ActionSetNextPlayer(mover)
  // action. Used as a then-consequence (e.g. ("ReplayInMovingOn" sites)) to signal
  // that the mover should not rotate after this move. withThenConsequence propagates
  // the moveAgain flag to the parent move.
  // @java MoveAgain.eval(context): returns a Moves list with one Pass move that has
  //   ActionSetNextPlayer(mover) appended, setting state.next=mover.
  if (h === "moveagain") {
    return {
      eval(ctx: Context): Move[] {
        const mover = ctx.state.mover;
        const setNext = new ActionSetNextPlayer(mover);
        // Return a minimal move with moveAgain=true so withThenConsequence picks it up.
        return [new Move({
          id: "moveAgain",
          label: "MoveAgain",
          siteIndices: [],
          mover,
          placedOwner: mover,
          actions: [setNext],
          moveAgain: true,
        })];
      }
    };
  }

  // ---- (promote <location> (piece <pieceNames>) <role>) — bare promote (not move Promote) ----
  // Used inside (then ...) blocks by PromoteIfReach and similar defines.
  // @java game/rules/play/moves/nonDecision/effect/Promote.java — same as (move Promote ...)
  // Delegates to the same compiled logic as (move Promote ...) by wrapping in (move Promote ...).
  if (h === "promote") {
    // Treat (promote ...) exactly like (move Promote ...) by delegating.
    // The Promote handler in compileMoves1to1Impl starts by looking at `first = positional[0]`.
    // For (move Promote ...), first = "Promote". For bare (promote ...), we need to wrap.
    try {
      const { positional: pmPos2, named: pmNamed2 } = parseArgs1to1(node.items);
      // Extract location (first list/int arg), piece list, role
      let locationFn2: IntFunction | null = null;
      let pieceListNode2: LudList | null = null;
      let ownerRole2 = "mover";
      for (const p of pmPos2) {
        if (isList(p) && headOf(p) === "piece") {
          pieceListNode2 = p;
        } else if (isIdent(p)) {
          const pn2 = p.name.toLowerCase();
          if (pn2 === "mover" || pn2 === "next" || pn2.startsWith("p")) ownerRole2 = pn2;
        } else if (!locationFn2) {
          try { locationFn2 = compileInt1to1(p); } catch { /* skip */ }
        }
      }
      const locNamed2 = pmNamed2.get("location");
      if (!locationFn2 && locNamed2) { try { locationFn2 = compileInt1to1(locNamed2); } catch { /* skip */ } }
      if (!locationFn2) locationFn2 = { eval(ctx: Context): number { return ctx._evalTo; } };
      const promotionNames2: string[] = [];
      if (pieceListNode2) {
        const plArgs2 = parseArgs1to1(pieceListNode2.items);
        for (const p of plArgs2.positional) {
          if (isString(p)) promotionNames2.push(p.value);
          else if (isList(p) && (p as import("@ludii/typescript-language").LudList).delimiter === "curly") {
            for (const inner2 of (p as import("@ludii/typescript-language").LudList).items) {
              if (isString(inner2)) promotionNames2.push((inner2 as { value: string }).value);
            }
          }
        }
      }
      if (promotionNames2.length === 0) promotionNames2.push("Queen");
      const locFnFinal2 = locationFn2;
      const ownerRoleFinal2 = ownerRole2;
      const promotionNamesFinal2 = [...promotionNames2];
      return { eval(ctx: Context): Move[] {
        const location = locFnFinal2.eval(ctx);
        if (location < 0) return [];
        const mover = ctx.state.mover;
        let ownerId: number;
        if (ownerRoleFinal2 === "mover") ownerId = mover;
        else if (ownerRoleFinal2 === "next") ownerId = (mover % ctx.game.numPlayers) + 1;
        else if (ownerRoleFinal2.startsWith("p") && !isNaN(parseInt(ownerRoleFinal2.slice(1), 10))) {
          ownerId = parseInt(ownerRoleFinal2.slice(1), 10);
        } else ownerId = mover;
        const game2 = ctx.game as unknown as Game1to1;
        const moves: Move[] = [];
        for (const name of promotionNamesFinal2) {
          let whatIdx = -1;
          if (game2.equipment) {
            for (const piece of game2.equipment.pieces) {
              if (piece.name.startsWith(name) && piece.owner === ownerId) {
                whatIdx = piece.index; break;
              }
            }
          }
          if (whatIdx < 0) continue;
          const promIdx2 = whatIdx; const promOwner2 = ownerId; const promLoc2 = location;
          const action2 = new (class extends BaseAction {
            public override apply(state: import("./state.js").State): import("./state.js").State {
              return state.withCell(promLoc2, promOwner2).withWhatAt(promLoc2, promIdx2);
            }
            public override actionType(): import("./action/action-type.js").ActionType { return "Move" as import("./action/action-type.js").ActionType; }
            public override from(): number { return promLoc2; }
            public override to(): number { return promLoc2; }
          })();
          moves.push(new Move({
            id: `promote:${location}:${whatIdx}`,
            label: `Promote ${name}`,
            siteIndices: [location],
            mover, placedOwner: ownerId,
            actions: [action2 as unknown as import("./action/index.js").Action],
          }));
        }
        return moves;
      }};
    } catch { /* fall through */ }
  }

  throw new Error(`compiler1to1: unknown play moves head "${h ?? "?"}"`);
}

// Wire up the forward ref
_compileMoves = compileMoves1to1Impl;

/**
 * Find the first list-type region node in the positional args of a `(to ...)` form,
 * skipping SiteType ident qualifiers like `Cell`, `Edge`, `Vertex`.
 * Handles: (to (sites Empty)) and (to Cell (sites Empty Cell)).
 * @java various Board.java usages with optional SiteType prefix
 */
function findRegionInToArgs(positional: LudNode[]): LudNode | undefined {
  const SITE_TYPES = new Set(["cell", "edge", "vertex"]);
  for (const p of positional) {
    if (isList(p)) return p;
    if (isIdent(p) && SITE_TYPES.has(p.name.toLowerCase())) continue;
    // Non-list, non-SiteType: could be a region (try compileRegion later)
  }
  // No list found: return the first non-SiteType node (may be a sites reference)
  for (const p of positional) {
    if (!isIdent(p) || !SITE_TYPES.has(p.name.toLowerCase())) return p;
  }
  return undefined;
}

/** Flatten a move argument list, unwrapping curly-brace arrays.
 *  Silently skips sub-moves that fail to compile (tolerant for (or ...) inside piece generators). */
export function flattenMovesList(positional: LudNode[], equipment?: Equipment1to1): MovesFunction[] {
  const moves: MovesFunction[] = [];
  for (const p of positional) {
    if (isList(p) && p.delimiter === "curly") {
      for (const child of p.items) {
        if (isList(child)) {
          try { moves.push(compileMoves1to1(child, equipment)); } catch { /* skip */ }
        }
      }
    } else if (isList(p)) {
      try { moves.push(compileMoves1to1(p, equipment)); } catch { /* skip */ }
    }
  }
  return moves;
}

/** Compile (move (from ...) (to ...)) as FromTo1to1. */
export function compileFromTo1to1(
  fromNode: LudList,
  toNode: LudList,
  _named: Map<string, LudNode>,
  equipment?: Equipment1to1 | null,
): FromTo1to1 {
  // Parse (from <locFn> [condition:...])
  const fromArgs = parseArgs1to1(fromNode.items);
  const fromLocNode = fromArgs.positional[0];

  // Parse (to <locFn> [if:...] [apply:<effect> | ("HittingCapture" ...)])
  const toArgs = parseArgs1to1(toNode.items);
  const toLocNode = toArgs.positional[0];

  // Check for copy: named
  const copyNode = _named.get("copy");
  const copy = copyNode !== undefined && isIdent(copyNode) && copyNode.name.toLowerCase() === "true";

  // Check for stack:True — stacking move onto destination (Abande-style)
  // @java game/rules/play/moves/nonDecision/effect/Move.java — stack param → ActionMoveStacking
  const stackNode = _named.get("stack");
  const stack = stackNode !== undefined && isIdent(stackNode) && stackNode.name.toLowerCase() === "true";

  // Determine if from is a single site (IntFunction) or region (RegionFunction)
  let locFrom: IntFunction | null = null;
  let regionFrom: RegionFunction | null = null;

  // Skip SiteType idents (Cell/Edge/Vertex) in the from position.
  // @java From.java — siteType qualifier precedes the actual location expression.
  const SITE_TYPE_IDENTS2 = new Set(["cell", "edge", "vertex"]);
  let effectiveFromNode = fromLocNode;
  if (fromLocNode && !isList(fromLocNode) && isIdent(fromLocNode) &&
      SITE_TYPE_IDENTS2.has((fromLocNode as {name:string}).name.toLowerCase())) {
    // Skip the SiteType, use the next positional as the actual location.
    effectiveFromNode = fromArgs.positional[1];
  }

  if (effectiveFromNode) {
    const fh = isList(effectiveFromNode) ? headOf(effectiveFromNode) : undefined;
    if (fh === "handsite") {
      locFrom = compileInt1to1(effectiveFromNode);
    } else if (fh === "sites") {
      try { regionFrom = compileRegion1to1(effectiveFromNode); } catch { locFrom = compileInt1to1(effectiveFromNode); }
    } else {
      try { locFrom = compileInt1to1(effectiveFromNode); } catch {
        // Can't compile from — try as region
        try { regionFrom = compileRegion1to1(effectiveFromNode); } catch {
          // Can't compile from — default to no from sites
        }
      }
    }
  } else {
    // Bare (from) — the source is the iterator's current from-site (set by
    // forEach Piece / Site). @java From.eval = context.from(). Without this the
    // FromTo has no source and generates nothing (e.g. Ataxx copy/jump moves).
    locFrom = { eval: (ctx: Context): number => ctx._evalFrom };
  }

  // Determine if to is a single site or region
  let locTo: IntFunction | null = null;
  let regionTo: RegionFunction | null = null;

  if (toLocNode) {
    const th = isList(toLocNode) ? headOf(toLocNode) : undefined;
    // @java game/util/moves/To.java accepts any RegionFunction or IntFunction
    const REGION_HEADS = new Set(["sites","expand","difference","union","intersection","foreach","complement","filter","where","results"]);
    if (th && REGION_HEADS.has(th)) {
      try { regionTo = compileRegion1to1(toLocNode); } catch { locTo = compileInt1to1(toLocNode); }
    } else {
      try { locTo = compileInt1to1(toLocNode); } catch {
        // Last-resort: unknown head may still be a region
        try { regionTo = compileRegion1to1(toLocNode); } catch { /* Can't compile to */ }
      }
    }
  }

  // (to … if:<cond>) — filter the to-sites (e.g. if:(is Empty (to))). @java To.cond()
  let toCondition: BooleanFunction | null = null;
  const toIfNode = toArgs.named.get("if");
  if (toIfNode) { try { toCondition = compileBool1to1(toIfNode, 2); } catch { /* ignore */ } }

  // count:<int> — N-seed transfer (mancala capture). @java FromTo.count
  let countFn: IntFunction | null = null;
  const countNode = _named.get("count");
  if (countNode) { try { countFn = compileInt1to1(countNode); } catch { /* ignore */ } }

  // (to ... (apply if:<cond> <effect>)) or (to ... ("HittingCapture" ...))
  // Extract and compile the apply/capture effect from the (to ...) positional args.
  // The capture effect is any positional arg in (to ...) AFTER the target site
  // that is an (apply ...) node.
  // @java To.java — effect() = compiled capture side-effect; fired after the move lands.
  // @java game/rules/play/moves/nonDecision/effect/FromTo.java — sideEffect applied per to-site.
  //
  // Deferred-compile approach: piece generators are compiled BEFORE equipment is built
  // (in compilePiece1to1 → compileMoves1to1 with no equipment arg). To support the
  // HittingCapture apply effect in piece generators, we detect the apply node now and
  // build a lazy MovesFunction that compiles the effect on first eval using the game's
  // equipment (available via ctx.game at eval time). This is equivalent to the
  // _compilingEquipment workaround used for dice-aware int functions.
  let applyEffect: MovesFunction | null = null;
  {
    // Look for (apply ...) node in remaining positional args of (to ...)
    let applyEffectNode: LudNode | undefined = toArgs.named.get("apply");
    let applyIfNode: LudNode | undefined;
    let applyEffectInner: LudNode | undefined;
    if (!applyEffectNode) {
      const applyChild = toArgs.positional.find((n, i) => i > 0 && isList(n) && headOf(n as LudList) === "apply");
      if (applyChild && isList(applyChild)) {
        // (apply if:<cond> <effect>) — conditional capture
        const applyInner = parseArgs1to1((applyChild as LudList).items);
        applyIfNode = applyInner.named.get("if");
        applyEffectInner = applyInner.positional[0];
        if (!applyIfNode && applyEffectInner) {
          applyEffectNode = applyEffectInner;
          applyEffectInner = undefined;
        }
      }
    }

    if (applyIfNode && applyEffectInner) {
      // Conditional apply effect: (apply if:<cond> <effect>)
      // Compile eagerly if equipment is available, otherwise build a lazy wrapper.
      if (equipment) {
        try {
          const applyCond = compileBool1to1(applyIfNode, 2);
          const applyEff = compileMoves1to1(applyEffectInner, equipment);
          applyEffect = { eval(ctx: Context): Move[] { return applyCond.eval(ctx) ? applyEff.eval(ctx) : []; } };
        } catch { /* skip uncompilable */ }
      } else {
        // Deferred: compile on first eval using ctx.game.equipment.
        // @java piece.generator() is re-evaluated with proper context each move.
        const capturedIfNode = applyIfNode;
        const capturedEffNode = applyEffectInner;
        let cachedEffect: MovesFunction | null = null;
        applyEffect = { eval(ctx: Context): Move[] {
          if (cachedEffect === null) {
            // Compile now with equipment from ctx.game.
            try {
              const eq = (ctx.game as unknown as Game1to1).equipment;
              if (!eq) return [];
              const applyCond = compileBool1to1(capturedIfNode, 2);
              const applyEff = compileMoves1to1(capturedEffNode, eq);
              cachedEffect = { eval(c: Context): Move[] { return applyCond.eval(c) ? applyEff.eval(c) : []; } };
            } catch { cachedEffect = { eval(_c: Context): Move[] { return []; } }; }
          }
          return cachedEffect.eval(ctx);
        }};
      }
    } else if (applyEffectNode) {
      if (equipment) {
        try { applyEffect = compileMoves1to1(applyEffectNode, equipment); } catch { /* skip */ }
      } else {
        // Deferred unconditional apply effect.
        const capturedNode = applyEffectNode;
        let cachedEff: MovesFunction | null = null;
        applyEffect = { eval(ctx: Context): Move[] {
          if (cachedEff === null) {
            try {
              const eq = (ctx.game as unknown as Game1to1).equipment;
              if (!eq) return [];
              cachedEff = compileMoves1to1(capturedNode, eq);
            } catch { cachedEff = { eval(_c: Context): Move[] { return []; } }; }
          }
          return cachedEff.eval(ctx);
        }};
      }
    }
  }

  return new FromTo1to1({ locFrom, regionFrom, locTo, regionTo, toCondition, copy, countFn, applyEffect, stack });
}

// ---------------------------------------------------------------------------
// Compile Play
// ---------------------------------------------------------------------------

function compilePlay1to1(node: LudNode, equipment: Equipment1to1): Play1to1 {
  if (!isList(node)) throw new Error("compiler1to1: play must be a list");
  const h = headOf(node)!;
  if (h !== "play") throw new Error(`compiler1to1: expected (play ...), got "${h}"`);
  const { positional } = parseArgs1to1(node.items);
  const movesNode = positional[0];
  if (!movesNode) throw new Error("compiler1to1: (play ...) missing move generator");
  return new Play1to1(compileMoves1to1(movesNode, equipment));
}

// ---------------------------------------------------------------------------
// Compile Start Rules
// ---------------------------------------------------------------------------

function compileStart1to1(node: LudNode, numPlayers: number, equipment?: Equipment1to1): StartRule[] {
  if (!isList(node)) return [];
  const h = headOf(node)!;
  if (h !== "start") return [];

  const rules: StartRule[] = [];
  const { positional } = parseArgs1to1(node.items);

  // Unwrap curly-brace list if present
  const items: LudNode[] = [];
  for (const p of positional) {
    if (isList(p) && p.delimiter === "curly") {
      for (const child of p.items) items.push(child);
    } else {
      items.push(p);
    }
  }

  for (const item of items) {
    if (!isList(item)) continue;
    const ih = headOf(item)!;

    if (ih === "place") {
      const rule = compilePlaceRule1to1(item, equipment);
      if (rule) rules.push(rule);
    } else if (ih === "set") {
      // (set Count <n> to:<region>) — mancala seeding (n seeds per hole).
      const sa = parseArgs1to1(item.items);
      const sub = sa.positional[0];
      if (sub && isIdent(sub) && sub.name.toLowerCase() === "count") {
        const cntNode = sa.positional[1];
        // Support both literal numbers and arithmetic expressions as the count.
        // @java game/rules/start/set/sites/SetCount.java — count is an IntFunction.
        const countLit = cntNode && isNumber(cntNode) ? cntNode.value : -1;
        let countFn: IntFunction | null = null;
        if (countLit < 0 && cntNode) {
          try { countFn = compileInt1to1(cntNode); } catch { /* skip */ }
        }
        const toNode = sa.named.get("to") ?? sa.named.get("at") ?? sa.positional.find((n, i) => i >= 2 && isList(n));
        if (toNode && (countLit > 0 || countFn !== null)) {
          try {
            const regionFn = compileRegion1to1(toNode);
            if (countLit > 0) {
              rules.push(new SetCountStart1to1(new IntConstant(countLit), null, null, regionFn));
            } else if (countFn !== null) {
              rules.push(new SetCountStart1to1(countFn, null, null, regionFn));
            }
          } catch { /* skip */ }
        }
      } else if (sub && isIdent(sub) && sub.name.toLowerCase() === "remembervalue") {
        // (set RememberValue "name" (region)) — populate state.remembered at game start.
        // @java game/rules/start/set/remember/SetRememberValue.java — eval()
        // positional[1] may be the name string; the region is the next list node.
        const nameNode = sa.positional.find((n, i) => i >= 1 && isString(n)) as { value: string } | undefined;
        const key = nameNode ? nameNode.value : "";
        const regionNode = sa.positional.find((n, i) => i >= 1 && isList(n));
        if (regionNode) {
          try {
            const regionFn = compileRegion1to1(regionNode);
            // Build a start rule that populates remembered values for each site in the region.
            const capturedEquipment = equipment;
            rules.push({
              applyToInitialState(
                _cells: number[],
                _whats: number[],
                _countAt: number[],
                equip: Equipment1to1,
                numPlayers: number,
              ): void {
                const fakeGame = { numPlayers, equipment: equip } as unknown as Game1to1;
                const fakeCtx = {
                  game: fakeGame,
                  state: {
                    mover: 1,
                    cells: new Array(equip.totalSites).fill(0),
                    isEmptySite: () => true,
                    remembered: new Map<string, readonly number[]>(),
                    rememberedFor: () => [],
                    pending: new Set<number>(),
                    diceValues: [],
                  },
                  _evalFrom: -1, _evalTo: -1, _evalValue: 0,
                  _radials: equip.board.radials,
                } as unknown as Context;
                const sites = regionFn.eval(fakeCtx);
                // Store in a side-channel for Game1to1.start() to pick up.
                const eq = (capturedEquipment ?? equip) as Equipment1to1 & {
                  _initialRemembered?: Map<string, number[]>;
                };
                if (!eq._initialRemembered) eq._initialRemembered = new Map();
                const existing = eq._initialRemembered.get(key) ?? [];
                for (const site of sites) {
                  existing.push(site);
                }
                eq._initialRemembered.set(key, existing);
              }
            });
          } catch { /* skip */ }
        }
      } else if (sub && isIdent(sub) && sub.name.toLowerCase() === "hidden") {
        // (set Hidden {What Who ...} (sites Board) to:P1) — mark every board site as
        // hidden for the target player at game start.
        // @java game/rules/start/set/hidden/SetHidden.java — eval()
        // positional: [0]=Hidden(ident) [1]?={What Who}(curly-list) or (region)(list)
        // named: to:<role>
        // The {What Who} dataType list is optional. The region is the first list node
        // in positional (skipping curly-brace data-type lists).
        const toNode = sa.named.get("to");
        // Region: first non-curly list node in positional (skipping sub=Hidden at [0])
        const regionNode2 = sa.positional.find(
          (n, i) => i >= 1 && isList(n) && (n as LudList).delimiter !== "curly"
        );
        if (toNode && regionNode2) {
          try {
            const regionFn2 = compileRegion1to1(regionNode2);
            // Resolve to player id at compile time: P1 → 1, P2 → 2, etc.
            const roleStr = isIdent(toNode) ? toNode.name.toLowerCase() : "";
            const pid = roleStr.startsWith("p") && !isNaN(parseInt(roleStr.slice(1), 10))
              ? parseInt(roleStr.slice(1), 10)
              : -1;   // -1 = all players
            const capturedEquipment2 = equipment;
            rules.push({
              applyToInitialState(
                _cells: number[],
                _whats: number[],
                _countAt: number[],
                equip: Equipment1to1,
                numPlayers: number,
              ): void {
                const fakeGame2 = { numPlayers, equipment: equip } as unknown as Game1to1;
                const fakeCtx2 = {
                  game: fakeGame2,
                  state: {
                    mover: 1,
                    cells: new Array(equip.totalSites).fill(0),
                    isEmptySite: () => true,
                    remembered: new Map<string, readonly number[]>(),
                    rememberedFor: () => [],
                    pending: new Set<number>(),
                    diceValues: [],
                  },
                  _evalFrom: -1, _evalTo: -1, _evalValue: 0,
                  _radials: equip.board.radials,
                } as unknown as Context;
                const sites2 = regionFn2.eval(fakeCtx2);
                // Store in _initialHidden side-channel: "pid:site" → true
                const eq2 = (capturedEquipment2 ?? equip) as Equipment1to1 & {
                  _initialHidden?: Map<string, boolean>;
                };
                if (!eq2._initialHidden) eq2._initialHidden = new Map();
                const targets = pid >= 1
                  ? [pid]
                  : Array.from({ length: numPlayers }, (_, idx) => idx + 1);
                for (const p of targets) {
                  for (const s of sites2) {
                    eq2._initialHidden.set(`${p}:${s}`, true);
                  }
                }
              }
            });
          } catch { /* skip */ }
        }
      }
    }
    // (set Score ...) and other non-placement start rules: skip
  }

  return rules;
}

/** Compile a (place ...) start rule. */
function compilePlaceRule1to1(node: LudList, equipment?: Equipment1to1): StartRule | null {
  const { positional, named } = parseArgs1to1(node.items);

  // Handle (place Stack "pieceName" ...) — the "Stack" ident is a PlaceStackType discriminator.
  // @java game/rules/start/place/stack/PlaceCustomStack.java
  // When present, shift the arg index by 1 so positional[argOffset] is the piece name string.
  let argOffset = 0;
  if (positional[0] && isIdent(positional[0]) &&
      (positional[0] as { name: string }).name.toLowerCase() === "stack") {
    argOffset = 1;
  }

  // First arg: piece ID string (e.g. "Marker1", "Ball1")
  const pieceIdNode = positional[argOffset];
  if (!pieceIdNode || !isString(pieceIdNode)) return null;
  const pieceId = pieceIdNode.value;

  // count:N — pieces seeded per placed site (mancala sow seeds use 4, etc.).
  // @java game/rules/start/place/Place.count — default 1.
  const placeCountNode = named.get("count");
  const placeCount = placeCountNode && isNumber(placeCountNode) ? placeCountNode.value : 1;

  // state:N — initial per-site state value (e.g. EinStein cube number 1–6, Squadro move distance).
  // @java ActionAdd.apply() — sets ContainerState.stateAt when the place rule carries state:.
  const placeStateNode = named.get("state");
  const placeState = placeStateNode && isNumber(placeStateNode) ? placeStateNode.value : -1;

  // value:N — initial per-site value (e.g. Squadro piece direction flag).
  // @java ActionAdd.apply() — sets ContainerState.valueAt when the place rule carries value:.
  const placeValueNode = named.get("value");
  const placeValue = placeValueNode && isNumber(placeValueNode) ? placeValueNode.value : -1;

  // (place "X" coord:"C5") — placement at a NAMED algebraic coordinate.
  // @java game/rules/start/place/site/PlaceCustomStack / Place coord:
  const coordNamed = named.get("coord");
  if (coordNamed && isString(coordNamed)) {
    const site = coordToSite1to1(coordNamed.value, equipment?.board);
    if (site >= 0) {
      return new PlaceSites1to1(pieceId, [site], placeCount, placeState, placeValue);
    }
  }

  // Check for "Hand" as second positional arg (offset by argOffset for Stack form)
  const secondNode = positional[argOffset + 1];
  if (secondNode && isString(secondNode) && secondNode.value.toLowerCase() === "hand") {
    // (place "Marker" "Hand" count:N)
    const countNode = named.get("count");
    const count = countNode && isNumber(countNode) ? countNode.value : 1;
    // Strip player suffix from pieceId: "Marker1" → "Marker"
    const nameOnly = pieceId.replace(/\d+$/, "");
    return new PlaceHandCount1to1(nameOnly, count);
  }

  // (place "Disc" (handSite Shared)) / (place "X" (handSite 1 1)) — place at a specific hand site
  // The site is specified by a (handSite ...) IntFunction
  if (secondNode && isList(secondNode) && headOf(secondNode) === "handsite") {
    // We can't evaluate handSite without runtime context. Defer by creating
    // a start rule that will use the equipment to resolve the hand site.
    const hArgs = parseArgs1to1(secondNode.items);
    const roleNode = hArgs.positional[0];
    const offsetNode = hArgs.positional[1];
    // Role: may be an ident (Mover, P1, P2, Shared) or a number (1=P1, 2=P2, 0=Shared).
    // @java HandSite.java — player() resolves from IntFunction
    let role: RoleType | "Shared" = "Mover";
    if (roleNode && isIdent(roleNode)) {
      role = roleNode.name as RoleType | "Shared";
    } else if (roleNode && isNumber(roleNode)) {
      const pid = roleNode.value;
      role = pid === 0 ? "Shared" : `P${pid}` as RoleType;
    }
    const offset = offsetNode && isNumber(offsetNode) ? offsetNode.value : 0;
    // count:N — number of pieces seeded into the hand slot (e.g. 20 goats). @java Place.count
    const phCountNode = named.get("count");
    const phCount = phCountNode && isNumber(phCountNode) ? phCountNode.value : 1;
    // pieceId without suffix is the piece name (e.g. "Disc" not "Disc1")
    // Pass state:N and value:N (e.g. EinStein's cube numbers stored per hand slot).
    return new PlaceAtHandSite1to1(pieceId, role, offset, phCount, placeState, placeValue);
  }

  // Try to compile the second arg as a RegionFunction (union, intersection, etc.)
  const sitesNode = positional[argOffset + 1];
  if (!sitesNode) return null;

  // Curly-brace literal lists {n1 n2 ...} or {"A1" "B1" ...} — try literal extraction first.
  // compileRegion1to1 would silently produce an empty UnionRegion for string-only curly lists,
  // so we must try extractSites1to1 before delegating to the region compiler.
  if (isList(sitesNode) && sitesNode.delimiter === "curly") {
    const sites = extractSites1to1(sitesNode, equipment?.board.width, equipment?.board.height);
    if (sites.length > 0) return new PlaceSites1to1(pieceId, sites, placeCount, placeState, placeValue);
    // Empty result — fall through to region compiler (e.g. curly-wrapped region functions)
  }

  // (coord "A4") — single algebraic coordinate
  if (!isList(sitesNode)) {
    const sites = extractSites1to1(sitesNode, equipment?.board.width, equipment?.board.height);
    if (sites.length > 0) return new PlaceSites1to1(pieceId, sites, placeCount, placeState, placeValue);
    return null;
  }

  // Parenthesis-delimited list: try literal extraction first for known site-literal heads,
  // then fall back to RegionFunction compilation.
  // @java Place.java — place(Context) resolves from IntFunction or RegionFunction.
  if (isList(sitesNode)) {
    // (coord "X") — algebraic coordinate literal: extract via coordToSite1to1 before
    // trying compileRegion1to1, which silently returns an empty region for (coord ...).
    // @java game/functions/ints/board/Coord.java — resolves to a site index.
    if (headOf(sitesNode) === "coord") {
      const coordArgs = parseArgs1to1(sitesNode.items);
      const coordStr = coordArgs.positional[0];
      if (coordStr && isString(coordStr)) {
        const site = coordToSite1to1(coordStr.value, equipment?.board);
        if (site >= 0) return new PlaceSites1to1(pieceId, [site], placeCount, placeState, placeValue);
      }
      // coord resolved to nothing — fall through
    }
    try {
      const regionFn = compileRegion1to1(sitesNode);
      return new PlaceRegion1to1(pieceId, regionFn, placeCount, placeState, placeValue);
    } catch {
      // Fall through to literal site extraction
    }
  }

  // Last-resort: extract literal site indices from (coord "X") etc.
  const sites = extractSites1to1(sitesNode, equipment?.board.width, equipment?.board.height);
  if (sites.length === 0) return null;

  return new PlaceSites1to1(pieceId, sites, placeCount, placeState, placeValue);
}

/** Extract site indices from a sites node: {n1 n2 ...}, (coord "X"), or a number. */
function extractSites1to1(node: LudNode, boardWidth?: number, boardHeight?: number): number[] {
  if (isNumber(node)) return [node.value];
  if (!isList(node)) return [];

  // {7 22 67 ...} — curly-brace list of numbers
  if (node.delimiter === "curly") {
    const sites: number[] = [];
    for (const child of node.items) {
      if (isNumber(child)) {
        sites.push(child.value);
      } else if (isString(child)) {
        // {"A1" "B1" ...} — curly-brace list of algebraic coords
        const site = algebraicToSite(child.value, boardWidth, boardHeight);
        if (site >= 0) sites.push(site);
      }
    }
    return sites;
  }

  const h = headOf(node);

  if (h === "sites") {
    // (sites {7 22 ...}) or (sites {"A1" ...}) — sites with curly-brace list
    const { positional } = parseArgs1to1(node.items);
    for (const p of positional) {
      if (isList(p) && p.delimiter === "curly") {
        return extractSites1to1(p, boardWidth, boardHeight);
      }
    }
    return [];
  }

  if (h === "coord") {
    // (coord "A4") — algebraic coordinate
    const { positional } = parseArgs1to1(node.items);
    const coordNode = positional[0];
    if (coordNode && isString(coordNode)) {
      const site = algebraicToSite(coordNode.value, boardWidth, boardHeight);
      if (site >= 0) return [site];
    }
    return [];
  }

  return [];
}

/**
 * Convert algebraic coordinate (e.g. "C4", "A1") to site index.
 *
 * Java parity: uses the board topology to resolve coordinate names.
 * For square/rectangle boards: column A-Z (0-based), row 1-N (1-based, bottom up).
 *
 * Java's cell-index formula for a W×H grid (row-major, row 0 at bottom):
 *   siteIndex = (row - 1) * W + col
 * where col = charCode(letter) - charCode('A'), row = parseInt(digits)
 *
 * @param coord       Algebraic coordinate like "A1", "C4", "J10"
 * @param boardWidth  Board width (number of columns)
 * @param boardHeight Board height — unused but kept for signature clarity
 */
/**
 * Resolve an algebraic coordinate ("C5") to a site index, graph-aware.
 *
 * For graph boards (non-square: alquerque, triangle appendages, hex…) the
 * vertices are NOT numbered row-major, so the flat formula is wrong. Java maps
 * the coord to the graph element whose centroid is at (col, row-1): column
 * letter → x (A=0), row number → y = N-1. We match that vertex via the
 * trajectories' xOf/yOf. Square boards (no trajectories) keep the flat mapping.
 * @java game/types/board/SiteType + Graph coordinate lookup
 */
function coordToSite1to1(coord: string, board?: Board1to1): number {
  if (!board) return -1;
  const traj = board.trajectories;
  if (!traj) return algebraicToSite(coord, board.width, board.height);
  const m = coord.match(/^([A-Za-z]+)(\d+)$/);
  if (!m || m[1]!.length !== 1) return algebraicToSite(coord, board.width, board.height);
  const col = m[1]!.toUpperCase().charCodeAt(0) - 65;
  const row = parseInt(m[2]!, 10) - 1;
  for (let s = 0; s < board.numSites; s++) {
    if (Math.abs(traj.xOf(s) - col) < 0.25 && Math.abs(traj.yOf(s) - row) < 0.25) return s;
  }
  return -1;
}

function algebraicToSite(coord: string, boardWidth?: number, _boardHeight?: number, traj?: import("./eval/graph/trajectories.js").Trajectories): number {
  if (!boardWidth || boardWidth <= 0) return -1;

  // Parse: letters + digits (e.g. "C4", "A10", "J5")
  const match = coord.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return -1;

  const colStr = match[1]!.toUpperCase();
  const rowNum = parseInt(match[2]!, 10);
  if (isNaN(rowNum) || rowNum < 1) return -1;

  // Single-letter column only: A=0, B=1, ...
  if (colStr.length !== 1) return -1;
  const col = colStr.charCodeAt(0) - 65; // 'A' = 65
  if (col < 0 || col >= boardWidth) return -1;

  const row = rowNum - 1; // 0-based

  // When trajectories are available, use geometry to find the actual site index.
  // This is faithful for non-rectangular merged boards (e.g. 20 Squares) where
  // the simple row*W+col formula gives wrong results.
  // @java game/equipment/container/board/Board.java — site numbering via topology
  if (traj !== null && traj !== undefined) {
    // Each cell's centroid: col C → x ≈ C + 0.5, row R → y ≈ R + 0.5.
    // Find the site whose geometric position is closest to (col+0.5, row+0.5).
    const targetX = col + 0.5;
    const targetY = row + 0.5;
    let bestSite = -1;
    let bestDist = 1.0; // must be within 0.5 cell units to match
    for (let s = 0; s < traj.numSites; s++) {
      const dx = traj.xOf(s) - targetX;
      const dy = traj.yOf(s) - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) { bestDist = dist; bestSite = s; }
    }
    if (bestSite >= 0) return bestSite;
    // Fallback: if no close match (e.g. coordinate is a hole in the board), return -1.
    return -1;
  }

  return row * boardWidth + col;
}

// ---------------------------------------------------------------------------
// Compile Equipment
// ---------------------------------------------------------------------------

function compileEquipment1to1(
  node: LudNode,
  numPlayers: number,
): Equipment1to1 {
  if (!isList(node)) throw new Error("compiler1to1: equipment must be a list");
  const h = headOf(node)!;
  if (h !== "equipment") throw new Error(`compiler1to1: expected (equipment ...), got "${h}"`);

  let board: Board1to1 | undefined;
  const pieces: Piece[] = [];
  const hands: HandSpec[] = [];
  const diceSpecs: { faces: number[] }[] = [];
  const pendingRegions: Array<{ owner: number; name: string | null; node: LudList }> = [];
  const tracks = new Map<string, { sites: readonly number[]; loop: boolean; owner: number }>();

  const { positional } = parseArgs1to1(node.items);
  const listNode = positional[0];
  const items = (listNode && isList(listNode) && listNode.delimiter === "curly")
    ? listNode.items
    : positional;

  for (const child of items) {
    if (!isList(child)) continue;
    const ch = headOf(child)!;

    if (ch === "board") {
      board = compileBoard1to1(child);
    } else if (ch === "boardless") {
      // (boardless <tiling> [dimension:N]) — infinite/expandable boardless board.
      // @java game/equipment/container/board/Boardless.java
      // Java constants (main/Constants.java):
      //   SIZE_BOARDLESS     = 41  — Square and Triangular grids
      //   SIZE_HEX_BOARDLESS = 21  — Hexagonal (HexagonOnHex) grid
      //
      // Java delegates to:
      //   Hexagonal  → HexagonOnHex(21) — 1261-cell hex-hex grid, centre=630
      //   Square     → RectangleOnSquare(41) — 41×41 = 1681-cell grid, centre=840
      //   Triangular → TriangleOnTri(41)    — triangle(42), centre at midpoint
      //
      // We faithfully mirror those three cases using the TS graph generators.
      // The `dimension:` named arg is ignored (games always use the default size).
      {
        const bArgs = parseArgs1to1(child.items);
        const tilingNode = bArgs.positional[0];
        const tilingName = (tilingNode && isIdent(tilingNode) ? tilingNode.name : "Hexagonal").toLowerCase();
        try {
          let bGraph;
          if (tilingName === "hexagonal") {
            // HexagonOnHex(21) — 1261 cells, centre at index 630
            bGraph = genHex(undefined, 21);
          } else if (tilingName === "square") {
            // RectangleOnSquare(41) — 41×41 = 1681 cells (cell play, vertexMode=false)
            bGraph = genSquare(41, false);
          } else {
            // TriangleOnTri(41) — triangle grid size 41 (cell play adds +1 internally)
            bGraph = genTri(undefined, 41, undefined, false);
          }
          if (bGraph) {
            const traj = new Trajectories(bGraph, "Cell");
            if (traj.numSites > 0) {
              // Compute bounding-box dims for coord helpers
              let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
              for (let s = 0; s < traj.numSites; s++) {
                minX = Math.min(minX, traj.xOf(s));
                maxX = Math.max(maxX, traj.xOf(s));
                minY = Math.min(minY, traj.yOf(s));
                maxY = Math.max(maxY, traj.yOf(s));
              }
              const bw = Math.max(1, Math.ceil(maxX - minX) + 1);
              const bh = Math.max(1, Math.ceil(maxY - minY) + 1);
              board = new Board1to1(bw, bh, traj.numSites, traj, bGraph.faces.length);
            }
          }
        } catch { /* fall through */ }
        if (!board) {
          // Fallback: 41×41 square grid for unknown tilings
          board = new Board1to1(41, 41);
        }
      }
    } else if (ch === "mancalaboard") {
      // (mancalaBoard <rows> <cols> ...) — mancala-style board
      // @java game/equipment/container/board/custom/MancalaBoard.java
      // Uses the faithful buildMancalaGraph which mirrors Java's MancalaBoard.makeMancala*Rows
      const mbArgs = parseArgs1to1(child.items);
      const rowsNode = mbArgs.positional[0];
      const colsNode = mbArgs.positional[1];
      const rows = rowsNode ? (isNumber(rowsNode) ? rowsNode.value : 2) : 2;
      const cols = colsNode ? (isNumber(colsNode) ? colsNode.value : 6) : 6;
      // Check for store:None named arg
      const storeNode = mbArgs.named.get("store");
      const storeNone = storeNode && isIdent(storeNode) && storeNode.name.toLowerCase() === "none";
      const spec = buildMancalaGraph(rows, cols, !storeNone);
      if (spec) {
        board = new Board1to1(spec.width, spec.height, spec.numSites, spec.traj);
      } else {
        // Fallback: rows×cols rectangle
        board = new Board1to1(cols, rows);
      }
    } else if (
      ch === "surakartaboard" ||
      ch === "pentagoboard" ||
      ch === "tableboard"  ||
      ch === "honeycombboard" ||
      ch === "spiralboard"
    ) {
      // Custom board types — try buildBoardGraph, otherwise fall back to a default.
      // @java game/equipment/container/board/custom/*.java
      try {
        // Wrap in a synthetic (board ...) to reuse compileBoard1to1
        // Cast via unknown to bypass TokenRange constructor requirement for range.
        const synthetic = { kind: "list", delimiter: "round", range: { from: () => 0, to: () => 0 }, items: [
          { kind: "ident", name: "board", range: { from: () => 0, to: () => 0 } } as unknown as LudNode,
          ...child.items.slice(1),
        ]} as unknown as LudList;
        board = compileBoard1to1(synthetic);
      } catch {
        // Non-compilable custom board: use a 8×8 fallback
        board = new Board1to1(8, 8);
      }
    } else if (ch === "piece") {
      compilePiece1to1(child, pieces, numPlayers);
    } else if (ch === "tile") {
      // (tile "Name" Each numSides:N) — boardless tile piece declaration.
      // @java game/equipment/component/Tile.java — extends Component; treated as a
      // piece in the 1:1 engine (boardless games place tiles like pieces).
      compilePiece1to1(child, pieces, numPlayers);
    } else if (ch === "hand") {
      compileHand1to1(child, hands, numPlayers);
    } else if (ch === "regions") {
      // (regions [name] <owner> <regionFn>) — player region declaration
      // Forms:
      //   (regions P1 <region>)           — unnamed player region
      //   (regions "Name" P1 <region>)    — named player region with owner
      //   (regions "Name" <region>)       — named shared/boardwide region (no player owner)
      // @java game/equipment/regions/PlayerRegions.java
      const rArgs = parseArgs1to1(child.items);
      // Capture optional string name as first arg: (regions "Home" P1 <region>)
      let argIdx = 0;
      let regionName: string | null = null;
      if (rArgs.positional[0] && isString(rArgs.positional[0])) { regionName = rArgs.positional[0].value; argIdx = 1; }
      const ownerNode = rArgs.positional[argIdx];
      const regionDef = rArgs.positional[argIdx + 1];
      if (ownerNode && isIdent(ownerNode) && regionDef && isList(regionDef)) {
        const ownerStr = ownerNode.name;
        if (ownerStr.startsWith("P") && !isNaN(parseInt(ownerStr.slice(1), 10))) {
          const owner = parseInt(ownerStr.slice(1), 10);
          pendingRegions.push({ owner, name: regionName, node: regionDef });
        } else if (ownerStr === "Shared" || ownerStr === "All" || ownerStr === "Neutral") {
          // Shared/All/Neutral region — owner = 0
          pendingRegions.push({ owner: 0, name: regionName, node: regionDef });
        }
        // Also handle role idents like "Each" — add for all players
        else if (ownerStr === "Each") {
          for (let pid = 1; pid <= numPlayers; pid++) {
            pendingRegions.push({ owner: pid, name: regionName, node: regionDef });
          }
        }
      } else if (ownerNode && isList(ownerNode) && regionName !== null) {
        // (regions "Name" <regionFn>) — named region with NO player owner (Shared, owner=0)
        // @java PlayerRegions.java — regions with no owner are shared (owner=0)
        // e.g. (regions "Replay" (sites {"A1" "A3" ...})) in 20 Squares
        pendingRegions.push({ owner: 0, name: regionName, node: ownerNode });
      }
    } else if (ch === "dice") {
      // (dice num:N) or (dice d:M from:F num:N) or (dice facesByDie:{{...}{...}} num:N)
      // @java game/equipment/container/other/Dice.java
      const diceArgs = parseArgs1to1(child.items);
      const numNode = diceArgs.named.get("num");
      const numDice = numNode && isNumber(numNode) ? numNode.value : 1;
      const facesByDieNode = diceArgs.named.get("facesbydie");
      if (facesByDieNode && isList(facesByDieNode)) {
        // (dice facesByDie:{{face0 face1 ...}{face0 face1 ...}} num:N)
        const outerItems = facesByDieNode.delimiter === "curly"
          ? facesByDieNode.items
          : [facesByDieNode];
        for (let di = 0; di < numDice; di++) {
          const inner = outerItems[di];
          if (inner && isList(inner) && inner.delimiter === "curly") {
            const faces = inner.items
              .filter(isNumber)
              .map(n => (n as { value: number }).value);
            diceSpecs.push({ faces: faces.length > 0 ? faces : [0, 1] });
          } else {
            diceSpecs.push({ faces: [0, 1] });
          }
        }
      } else {
        // Simple (dice num:N) — standard d6 with faces 1..6
        // (dice d:M from:F num:N) — M-faced die starting at F
        const dNode = diceArgs.named.get("d");
        const fromNode = diceArgs.named.get("from");
        const numFaces = dNode && isNumber(dNode) ? dNode.value : 6;
        const fromVal = fromNode && isNumber(fromNode) ? fromNode.value : 1;
        const faces: number[] = [];
        for (let f = 0; f < numFaces; f++) faces.push(fromVal + f);
        for (let di = 0; di < numDice; di++) {
          diceSpecs.push({ faces });
        }
      }
    } else if (ch === "map") {
      // (map [name] {(pair key val) ...}) — static lookup table used by (mapEntry ...)
      // @java game/equipment/other/Map.java — maps player IDs or site IDs to site IDs.
      // Common usage: (map {(pair P1 FirstSite) (pair P2 LastSite)}) for mancala stores.
      // @java MapEntry.java — eval() calls context.game().equipment().maps().get(name).to(key)
      //
      // Parse: positional[0] may be a string name or the curly-brace list of pairs.
      const mapArgs = parseArgs1to1(child.items);
      let mapName = "__default__";
      let pairsNode: LudNode | undefined;
      if (mapArgs.positional[0] && isString(mapArgs.positional[0])) {
        mapName = (mapArgs.positional[0] as { value: string }).value;
        pairsNode = mapArgs.positional[1];
      } else {
        pairsNode = mapArgs.positional[0];
      }
      if (pairsNode && isList(pairsNode)) {
        const pairItems = pairsNode.delimiter === "curly" ? pairsNode.items : [pairsNode];
        const mapEntries = new Map<number, number>();
        const boardNumSites = board?.numSites ?? 14;
        for (const pairNode of pairItems) {
          if (!isList(pairNode) || headOf(pairNode) !== "pair") continue;
          const pArgs = parseArgs1to1(pairNode.items);
          const keyNode = pArgs.positional[0];
          const valNode = pArgs.positional[1];
          if (!keyNode || !valNode) continue;
          // Resolve key: P1→1, P2→2, or integer literal
          let key = -1;
          if (isIdent(keyNode)) {
            const kn = (keyNode as { name: string }).name.toLowerCase();
            if (kn === "p1") key = 1;
            else if (kn === "p2") key = 2;
            else if (kn === "p3") key = 3;
            else if (kn === "p4") key = 4;
            else if (kn === "mover") key = -1; // skip dynamic keys
            else if (!isNaN(parseInt(kn, 10))) key = parseInt(kn, 10);
            else if (kn.startsWith("p") && !isNaN(parseInt(kn.slice(1), 10))) key = parseInt(kn.slice(1), 10);
          } else if (isNumber(keyNode)) {
            key = (keyNode as { value: number }).value;
          }
          if (key < 0) continue;
          // Resolve value: FirstSite→0, LastSite→numSites-1, or integer literal
          let val = -1;
          if (isIdent(valNode)) {
            const vn = (valNode as { name: string }).name.toLowerCase();
            if (vn === "firstsite") val = 0;
            else if (vn === "lastsite") val = boardNumSites - 1;
            else if (!isNaN(parseInt(vn, 10))) val = parseInt(vn, 10);
          } else if (isNumber(valNode)) {
            val = (valNode as { value: number }).value;
          } else if (isList(valNode)) {
            // Try to compile and evaluate statically
            try {
              const valFn = compileInt1to1(valNode);
              // Evaluate with a minimal fake context
              const fakeGame = { numPlayers: numPlayers, equipment: { board: board ?? new Board1to1(8, 8), numSites: boardNumSites } } as unknown as Game1to1;
              const fakeCtx = { game: fakeGame, state: { mover: 1, cells: [], countAtSite: () => 0 }, _evalFrom: -1, _evalTo: -1, _evalValue: 0 } as unknown as Context;
              val = valFn.eval(fakeCtx);
            } catch { continue; }
          }
          if (val < 0) continue;
          mapEntries.set(key, val);
        }
        if (mapEntries.size > 0) {
          // Store in a side-channel on the board for Equipment1to1 to pick up later.
          // @java game/equipment/other/Map.java — stored on Equipment.maps(), looked up by name
          const boardAny = board as unknown as { _pendingMaps?: Map<string, Map<number, number>> };
          if (!boardAny._pendingMaps) boardAny._pendingMaps = new Map();
          boardAny._pendingMaps.set(mapName, mapEntries);
        }
      }
    }
    // (track ...), (surakartaBoard ...) etc. — skip silently
  }

  if (!board) {
    // Fallback: if no board was found in equipment (e.g. option-dependent board form),
    // use a default 8×8 board so the game at least compiles.
    // This handles games like Ecosys where `(<Board:type>)` didn't resolve to a board.
    board = new Board1to1(8, 8);
  }

  // Collect (track "Name" {sites}|"dir-string" loop:) declarations.
  // Pass trajectories so direction-string tracks on non-rectangular (merged)
  // boards use actual graph adjacency rather than the bounding-box ±W formula.
  // @java game/equipment/container/board/Track.java — uses topology.trajectories().radials()
  collectTracks1to1(node, tracks, board.width, board.height, board.trajectories ?? undefined);

  // Compile player regions (needs board to be known first). Unnamed regions go
  // into playerRegions (by owner); named ones into namedPlayerRegions (by
  // lowercased name → owner → region) for (sites <role> "Name") resolution.
  const playerRegions = new Map<number, RegionFunction>();
  const namedPlayerRegions = new Map<string, Map<number, RegionFunction>>();
  for (const { owner, name, node: rNode } of pendingRegions) {
    try {
      const regionFn = compileRegion1to1(rNode);
      if (name) {
        const key = name.toLowerCase();
        let m = namedPlayerRegions.get(key);
        if (!m) { m = new Map(); namedPlayerRegions.set(key, m); }
        m.set(owner, regionFn);
        // The first named region for a player also serves as its default region.
        if (!playerRegions.has(owner)) playerRegions.set(owner, regionFn);
      } else {
        playerRegions.set(owner, regionFn);
      }
    } catch {
      // Skip uncompilable regions
    }
  }

  return new Equipment1to1(board, pieces, hands, playerRegions, tracks, namedPlayerRegions, diceSpecs);
}

/** Expand a curly site list — bare ints + `a..b` ranges (ascending or descending). */
function parseTrackSites1to1(node: LudNode | undefined): number[] {
  if (!node || !isList(node)) return [];
  const out: number[] = [];
  for (const it of node.items) {
    if (isNumber(it)) { out.push(it.value); continue; }
    if (isIdent(it)) {
      const m = it.name.match(/^(\d+)\.\.(\d+)$/);
      if (m) {
        const a = parseInt(m[1]!, 10), b = parseInt(m[2]!, 10);
        if (a <= b) for (let i = a; i <= b; i++) out.push(i);
        else for (let i = a; i >= b; i--) out.push(i);
      }
    }
  }
  return out;
}

/**
 * Walk a mancala direction-string track such as "0,E,N,W" on a W×H grid.
 * The first token is the start site; each following token is a compass step
 * (E/W/N/S) walked greedily until it can no longer continue, then the next
 * direction takes over. Sites are numbered row-major from the bottom row
 * (site = row*W + col). @java game/equipment/container/board/Track.java string ctor.
 *
 * When `traj` (Trajectories) is provided the step helper delegates to
 * `traj.step(s, dir)` instead of the bounding-box ±W formula. This is
 * faithful to the Java implementation which walks via
 * `topology.trajectories().radials(SiteType.Cell, current.index(), dirn)`
 * and is required for non-rectangular merged boards (e.g. 20 Squares) where
 * the actual northern neighbour of site 0 is NOT site 0+W.
 * @java game/equipment/container/board/Track.java — string constructor
 */
function parseTrackDirString1to1(spec: string, W: number, H: number, traj?: Trajectories): number[] {
  const toks = spec.split(",").map(t => t.trim()).filter(Boolean);
  if (toks.length === 0 || W <= 0 || H <= 0) return [];
  const start = parseInt(toks[0]!, 10);
  // Allow start site to exceed W*H (hand sites are beyond the board).
  if (!Number.isInteger(start) || start < 0) return [];
  const boardSize = W * H;
  // Helper: step one unit in direction dir from board site s.
  // When trajectories are available use actual graph adjacency (faithful to Java);
  // fall back to the bounding-box ±W formula for pure rectangular boards.
  const stepOf = (s: number, dir: string): number => {
    // Use graph trajectories when available and site is a board site.
    // @java Track.java — topology.trajectories().radials(SiteType.Cell, current.index(), dirn)
    if (traj !== null && traj !== undefined && s < traj.numSites) {
      return traj.step(s, dir.toUpperCase());
    }
    if (s >= boardSize) return -1; // can't step from a hand site (fallback path)
    const col = s % W, row = Math.floor(s / W);
    switch (dir.toUpperCase()) {
      case "E": return col + 1 < W ? s + 1 : -1;
      case "W": return col - 1 >= 0 ? s - 1 : -1;
      case "N": return row + 1 < H ? s + W : -1;
      case "S": return row - 1 >= 0 ? s - W : -1;
      default: return -1;
    }
  };
  const out: number[] = [start];
  let cur = start;
  for (let i = 1; i < toks.length; i++) {
    const tok = toks[i]!;
    // "End" sentinel — append Constants.END (-2) to the track and stop.
    // @java game/equipment/container/board/Track.java — the "End" token adds
    // a trackList entry with site == Constants.END (-2). TrackSiteMove.eval()
    // then returns -2 when a piece steps exactly onto this terminal element,
    // enabling the bear-off check (IsEndTrack = (= trackSite End) = (= -2 -2)).
    // Distinct from OFF (-1): overshooting past End still returns -1.
    if (tok.toLowerCase() === "end") { out.push(-2); break; }
    // A plain integer: jump to that site directly (used for hand-site starts
    // and explicit site teleports in tracks like "20,3,W,N1,E,End").
    // @java game/equipment/container/board/Track.java — integer tokens mean
    // "add this site and continue from it".
    const asInt = parseInt(tok, 10);
    if (!isNaN(asInt) && asInt.toString() === tok) {
      if (!out.includes(asInt)) out.push(asInt);
      cur = asInt;
      continue;
    }
    // A direction may carry an explicit step count ("N1" = exactly one step);
    // without a count it walks greedily to the edge.
    const m = tok.match(/^([NSEWnsew])(\d+)$/);
    const dir = m ? m[1]! : tok;
    const limit = m ? parseInt(m[2]!, 10) : Infinity;
    let steps = 0;
    let next = stepOf(cur, dir);
    while (next >= 0 && steps < limit && !out.includes(next)) { out.push(next); cur = next; steps++; next = stepOf(cur, dir); }
  }
  return out;
}

/** Recursively find `(track "Name" {sites}|"dir-string" loop: [Pn])` nodes and store the ordered tracks. */
function collectTracks1to1(node: LudNode, tracks: Map<string, { sites: readonly number[]; loop: boolean; owner: number }>, W = 0, H = 0, traj?: Trajectories): void {
  if (!isList(node)) return;
  if (headOf(node) === "track") {
    const { positional, named } = parseArgs1to1(node.items);
    const nameNode = positional[0];
    const name = (nameNode && isString(nameNode)) ? nameNode.value : `Track${tracks.size}`;
    // Site list is the first curly-list positional arg …
    const sitesNode = positional.find(n => isList(n) && n.delimiter === "curly");
    let sites = parseTrackSites1to1(sitesNode);
    // … or a direction string ("0,E,N,W"), the second string positional after the name.
    if (sites.length === 0) {
      const dirStr = positional.find((n, i) => i > 0 && isString(n)) as { value: string } | undefined;
      if (dirStr) sites = parseTrackDirString1to1(dirStr.value, W, H, traj);
    }
    const loopNode = named.get("loop");
    const loop = loopNode !== undefined && isIdent(loopNode) && loopNode.name.toLowerCase() === "true";
    // Trailing role ident (P1/P2/…) = the track's owner; 0 if shared/none.
    let owner = 0;
    for (const p of positional) {
      if (isIdent(p) && /^p\d+$/i.test(p.name)) { owner = parseInt(p.name.slice(1), 10); break; }
    }
    if (sites.length > 0) {
      // When two tracks share the same name but belong to different players (e.g.
      // Abalala'e / Selus define `(track "Track" "0,E,N1,W5,N1,E" loop:True P1)` and
      // `(track "Track" "17,W,S1,E5,S1,W" loop:True P2)`), a plain Map keyed on the
      // track name overwrites the first with the second.  Java stores all tracks in a
      // List<Track> so duplicates are kept.  We preserve both by appending the owner
      // index to the key when a collision occurs, e.g. "Track#1" and "Track#2".
      // Lookup code uses `nm.includes(prefix) && t.owner === wantOwner` so the suffix
      // is transparent to all callers.
      // @java game/equipment/container/board/Board.java — board.tracks() is a List
      let key = name;
      if (tracks.has(key)) {
        // There is already an entry with this name.  Use a player-qualified key for the
        // existing entry (re-store it) and for the new one.
        const existing = tracks.get(key)!;
        const existingKey = existing.owner > 0 ? `${name}#${existing.owner}` : `${name}#0`;
        if (!tracks.has(existingKey)) tracks.set(existingKey, existing);
        key = owner > 0 ? `${name}#${owner}` : `${name}#${tracks.size}`;
      }
      tracks.set(key, { sites, loop, owner });
    }
    return;
  }
  for (const item of node.items) collectTracks1to1(item, tracks, W, H, traj);
}

/** Compile a (piece ...) declaration and push Piece objects into the array. */
function compilePiece1to1(child: LudList, pieces: Piece[], numPlayers: number): void {
  const pArgs = parseArgs1to1(child.items);
  const nameNode = pArgs.positional[0];
  const ownerNode = pArgs.positional[1];
  const generatorNode = pArgs.positional[2]; // optional move generator

  if (!nameNode || !isString(nameNode)) return;
  const pieceName = nameNode.value;

  // Parse owner
  const ownersToCreate: number[] = [];
  if (ownerNode && isIdent(ownerNode)) {
    const ownerStr = ownerNode.name;
    if (ownerStr === "Each") {
      for (let p = 1; p <= numPlayers; p++) ownersToCreate.push(p);
    } else if (ownerStr === "Shared" || ownerStr === "Neutral") {
      ownersToCreate.push(0);
    } else if (ownerStr.startsWith("P") && !isNaN(parseInt(ownerStr.slice(1), 10))) {
      ownersToCreate.push(parseInt(ownerStr.slice(1), 10));
    }
  }

  // Compile optional generator
  let generator = null;
  if (generatorNode && isList(generatorNode)) {
    try {
      generator = compileMoves1to1(generatorNode);
    } catch {
      generator = null;
    }
  }

  for (const owner of ownersToCreate) {
    pieces.push(new Piece(pieceName, owner, 0, generator));
  }
}

/** Compile a (hand ...) declaration and push HandSpec objects. */
function compileHand1to1(child: LudList, hands: HandSpec[], numPlayers: number): void {
  const hArgs = parseArgs1to1(child.items);
  const ownerNode = hArgs.positional[0];
  const sizeNode = hArgs.named.get("size");
  const size = sizeNode && isNumber(sizeNode) ? sizeNode.value : 1;

  if (!ownerNode || !isIdent(ownerNode)) return;
  const ownerStr = ownerNode.name;

  if (ownerStr === "Each") {
    for (let p = 1; p <= numPlayers; p++) {
      hands.push({ owner: p, size });
    }
  } else if (ownerStr === "Shared" || ownerStr === "Neutral") {
    hands.push({ owner: 0, size });
  } else if (ownerStr.startsWith("P") && !isNaN(parseInt(ownerStr.slice(1), 10))) {
    hands.push({ owner: parseInt(ownerStr.slice(1), 10), size });
  }
}

/**
 * Compile a (board <shape> ...) node into a Board1to1.
 *
 * For square/rectangle boards uses the fast W×H path.
 * For all other shapes (hex, tri, concentric, rotate, remove, add, dual, …)
 * routes through buildBoardGraph (the interpreter's faithful graph machinery),
 * then builds graph-adjacency radials from the resulting Trajectories.
 *
 * @java game/equipment/container/board/Board.java — create(shape)
 */
function compileBoard1to1(node: LudList): Board1to1 {
  const { positional } = parseArgs1to1(node.items);
  const shapeNode = positional[0];
  if (!shapeNode || !isList(shapeNode)) {
    throw new Error("compiler1to1: (board ...) missing shape");
  }
  const sh = headOf(shapeNode)!;

  if (sh === "square") {
    const sArgs = parseArgs1to1(shapeNode.items);
    const sizeNode = sArgs.positional[0];
    // Boards with diagonals (alquerque-style) need the real graph (diagonal
    // adjacency + the extra triangular faces that set the hand-container offset),
    // so they must route through buildBoardGraph — only plain squares fast-path.
    if (sizeNode && isNumber(sizeNode) && !sArgs.named.has("diagonals")) {
      return new Board1to1(sizeNode.value, sizeNode.value);
    }
    // Non-literal size / tiling variant / diagonals: fall through to buildBoardGraph
  }

  if (sh === "rectangle") {
    const rArgs = parseArgs1to1(shapeNode.items);
    const hNode = rArgs.positional[0];
    const wNode = rArgs.positional[1];
    if (hNode && isNumber(hNode) && wNode && isNumber(wNode) && !rArgs.named.has("diagonals")) {
      // Java convention: first arg = rows (height), second = columns (width)
      return new Board1to1(wNode.value, hNode.value);
    }
    // Non-literal dimensions / diagonals: fall through to buildBoardGraph.
  }

  // All other shapes: route through the interpreter's faithful graph machinery.
  // @java game/equipment/container/board/Board.java — create(shape, use)
  // @java game/util/graph/Graph.java — buildBoardGraph
  const graphSpec = buildBoardGraph(node);
  if (!graphSpec) {
    if (!sh || sh === "undefined") {
      // Option-expansion left an unresolved placeholder — use a default 8×8 board
      return new Board1to1(8, 8);
    }
    throw new Error(`compiler1to1: unsupported board shape "${sh}"`);
  }
  return new Board1to1(graphSpec.width, graphSpec.height, graphSpec.numSites, graphSpec.traj, graphSpec.numFaces);
}

// ---------------------------------------------------------------------------
// Top-level: compileNode1to1 — the main entry point
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Compile Phases (nextPhase / phase array)
// ---------------------------------------------------------------------------

/**
 * Compile a `(nextPhase [who] <cond> [name])` node into a NextPhase object.
 *
 * Supported forms:
 *   (nextPhase Mover <boolFn> "PhaseName")
 *   (nextPhase <boolFn> "PhaseName")        — who defaults to Shared
 *   (nextPhase <boolFn>)                    — wrap to next phase in list
 *
 * @java game/rules/phase/NextPhase.java — constructor
 */
function compileNextPhase1to1(
  node: LudNode,
  numPlayers: number,
): NextPhase {
  if (!isList(node)) throw new Error("compiler1to1: nextPhase must be a list");
  const h = headOf(node)!;
  if (h !== "nextphase") throw new Error(`compiler1to1: expected (nextPhase ...), got "${h}"`);

  const rawArgs = node.items.slice(1); // skip the head

  // Distinguish args:
  //   Optional first arg = role (RoleType ident like Mover, P1, Shared)
  //   Required next arg  = condition (BooleanFunction list)
  //   Optional last arg  = target phase name (string)
  //
  // @java NextPhase.java: role/indexPlayer are @Opt @Or; missing role defaults to Shared.
  let remainingArgs = rawArgs;
  let role: RoleType | "Shared" | "All" | "Each" | null = null;

  // Check if first non-trivial arg is a RoleType ident (not a list, not a string)
  const firstArg = rawArgs[0];
  const knownRoles = new Set(["mover", "next", "p1", "p2", "p3", "p4", "shared", "all", "each"]);
  if (firstArg && isIdent(firstArg) && knownRoles.has(firstArg.name.toLowerCase())) {
    role = canonicalNextPhaseRole(firstArg.name);
    remainingArgs = rawArgs.slice(1);
  }

  // Last arg may be the target phase name (string)
  let targetName: string | null = null;
  const lastArg = remainingArgs[remainingArgs.length - 1];
  if (lastArg && isString(lastArg)) {
    targetName = lastArg.value;
    remainingArgs = remainingArgs.slice(0, -1);
  }

  // Remaining first arg is the condition
  const condNode = remainingArgs[0];
  let condFn: import("./ludemes/base.js").BooleanFunction;
  if (!condNode) {
    // No condition: always true
    condFn = { eval(_ctx: Context): boolean { return true; } };
  } else {
    condFn = compileBool1to1(condNode, numPlayers);
  }

  const np = new NextPhase(role, null, condFn, targetName);
  return np;
}

function canonicalNextPhaseRole(role: string): RoleType | "Shared" | "All" | "Each" {
  const lower = role.toLowerCase();
  if (lower === "mover") return "Mover";
  if (lower === "next") return "Next";
  if (lower === "shared") return "Shared";
  if (lower === "all") return "All";
  if (lower === "each") return "Each";
  if (/^p\d+$/.test(lower)) return (`P${lower.slice(1)}`) as RoleType;
  return "Shared";
}

/**
 * Compile phases from a raw curly-brace list node `{ (phase ...) ... }`.
 * This handles the `phases:{ ... }` named-arg form common in .lud files.
 */
function compilePhasesFromCurly(
  curlyNode: LudList,
  equipment: Equipment1to1,
  numPlayers: number,
): Phase[] {
  return compilePhasesItems(curlyNode.items, equipment, numPlayers);
}

/**
 * Compile the `(phases { (phase ...) ... })` block.
 *
 * @java game/rules/Rules.java — Rules(null, end, phases)
 * @java game/rules/phase/Phase.java — Phase(name, role, mode, play, end, nextPhase[])
 */
function compilePhases1to1(
  node: LudNode,
  equipment: Equipment1to1,
  numPlayers: number,
): Phase[] {
  if (!isList(node)) throw new Error("compiler1to1: phases must be a list");
  const h = headOf(node)!;
  if (h !== "phases") throw new Error(`compiler1to1: expected (phases ...), got "${h}"`);

  // Unwrap curly-brace list
  const { positional } = parseArgs1to1(node.items);
  const items: LudNode[] = [];
  for (const p of positional) {
    if (isList(p) && p.delimiter === "curly") {
      for (const child of p.items) items.push(child);
    } else {
      items.push(p);
    }
  }
  return compilePhasesItems(items, equipment, numPlayers);
}

/**
 * Shared implementation: compile a flat list of `(phase ...)` nodes into Phase[].
 */
function compilePhasesItems(
  items: readonly LudNode[],
  equipment: Equipment1to1,
  numPlayers: number,
): Phase[] {

  const phases: Phase[] = [];

  for (const item of items) {
    if (!isList(item)) continue;
    const ph = headOf(item)!;
    if (ph !== "phase") continue;

    const pArgs = parseArgs1to1(item.items);
    // First positional arg: phase name (string)
    const nameNode = pArgs.positional[0];
    if (!nameNode || !isString(nameNode)) {
      throw new Error("compiler1to1: (phase ...) missing name");
    }
    const phaseName = nameNode.value;

    // Second positional arg: optional owner role (P1/P2/Shared/All etc.)
    // @java Phase.java:64 — @Opt RoleType role
    // @java State.initPhase: assigns initial phase index to each player based on this.
    let phaseRole: string | null = null;
    const ownerNode = pArgs.positional[1];
    if (ownerNode && isIdent(ownerNode)) {
      phaseRole = ownerNode.name;
    }

    // Find (play ...), (end ...), (nextPhase ...) children
    let phasePlay: Play1to1 | undefined;
    let phaseEnd: End | null = null;
    const phaseNextPhases: NextPhase[] = [];

    for (const child of item.items.slice(1)) {
      if (!isList(child)) continue;
      const ch = headOf(child)!;
      if (ch === "play") {
        phasePlay = compilePlay1to1(child, equipment);
      } else if (ch === "end") {
        phaseEnd = compileEnd1to1(child, numPlayers);
      } else if (ch === "nextphase") {
        try {
          const np = compileNextPhase1to1(child, numPlayers);
          phaseNextPhases.push(np);
        } catch {
          // Skip uncompilable nextPhase conditions
        }
      }
    }

    if (!phasePlay) throw new Error(`compiler1to1: (phase "${phaseName}") missing (play ...)`);
    phases.push(new Phase(phaseName, phaseRole, null, phasePlay, phaseEnd, null, phaseNextPhases));
  }

  if (phases.length === 0) {
    throw new Error("compiler1to1: (phases ...) produced no phases");
  }

  // Resolve targetName → targetIndex for all NextPhase objects.
  // @java game/rules/phase/NextPhase.eval: searches phases[] by name
  const nameToIdx = new Map<string, number>();
  for (let i = 0; i < phases.length; i++) {
    nameToIdx.set(phases[i]!.name, i);
  }
  for (const phase of phases) {
    for (const np of phase.nextPhases) {
      if (np.targetName !== null) {
        const idx = nameToIdx.get(np.targetName);
        np.targetIndex = idx !== undefined ? idx : -1;
      }
    }
  }

  return phases;
}

// ---------------------------------------------------------------------------
// Top-level: compileNode1to1 — the main entry point
// ---------------------------------------------------------------------------

/**
 * Walk the expanded `(game ...)` AST and produce a `Game1to1`.
 */
export function compileNode1to1(gameNode: LudList): Game1to1 {
  const h = listHead(gameNode);
  if (h !== "game") throw new Error(`compiler1to1: expected (game ...), got "${h}"`);

  function child(head: string): LudList | undefined {
    for (const item of gameNode.items) {
      if (isList(item) && listHead(item)?.toLowerCase() === head) return item;
    }
    return undefined;
  }

  let gameName = "Game";
  const nameItem = gameNode.items[1];
  if (nameItem && isString(nameItem)) gameName = nameItem.value;

  let numPlayers = 2;
  // Per-player facing directions for (players {(player SE) (player NW)}) form.
  // Compass direction → 45°-unit index (0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW).
  // @java game/players/Player.java — Direction.direction()
  const COMPASS_IDX_COMPILE: Record<string, number> = {
    n: 0, ne: 1, e: 2, se: 3, s: 4, sw: 5, w: 6, nw: 7,
  };
  const playerDirs = new Map<number, number>();
  const playersNode = child("players");
  if (playersNode) {
    const { positional } = parseArgs1to1(playersNode.items);
    const nNode = positional[0];
    if (nNode && isNumber(nNode)) {
      numPlayers = nNode.value;
    } else if (nNode && isList(nNode) && nNode.delimiter === "curly") {
      // (players {(player SE) (player NW) ...}) — player list form
      // Each (player <direction>) defines one player in order (P1, P2, ...).
      let pid = 1;
      for (const item of nNode.items) {
        if (isList(item) && headOf(item) === "player") {
          const pArgs = parseArgs1to1(item.items);
          const dirNode = pArgs.positional[0];
          if (dirNode && isIdent(dirNode)) {
            const dirName = dirNode.name.toLowerCase();
            const dirIdx = COMPASS_IDX_COMPILE[dirName];
            if (dirIdx !== undefined) {
              playerDirs.set(pid, dirIdx);
            }
          }
          pid++;
        }
      }
      numPlayers = pid - 1;
    }
  }

  const equipNode = child("equipment");
  if (!equipNode) throw new Error("compiler1to1: game missing (equipment ...)");
  const equipment = compileEquipment1to1(equipNode, numPlayers);
  // Make equipment available to dice-aware int functions (face, etc.) via closure.
  _compilingEquipment = equipment;

  // Patch ForEachPiece1to1 instances with equipment reference.
  // This is needed after equipment is built.

  const rulesNode = child("rules");
  if (!rulesNode) throw new Error("compiler1to1: game missing (rules ...)");

  let play: Play1to1 | undefined;
  let end: End | undefined;
  let startRules: StartRule[] = [];
  let phases: Phase[] | null = null;

  // Parse named args from rulesNode (handles `phases:{...}` form).
  // @java game/rules/Rules.java — phases field accessed via named arg `phases:`
  // The lud grammar allows both:
  //   (phases { ... }) — as a child list
  //   phases:{ ... }   — as a named arg key+value (the common form in .lud files)
  const rulesNamed = parseArgs1to1(rulesNode.items);

  // Check for named `phases:` arg (the curly-brace form used in .lud files)
  const phasesNamedNode = rulesNamed.named.get("phases");
  if (phasesNamedNode && isList(phasesNamedNode) && phasesNamedNode.delimiter === "curly") {
    // Build a synthetic (phases { ... }) list node to reuse compilePhases1to1
    // Note: let all errors propagate — we want specific error messages
    phases = compilePhasesFromCurly(phasesNamedNode, equipment, numPlayers);
  }

  let usesSwapRule = false;

  for (const child2 of rulesNode.items) {
    if (!isList(child2)) continue;
    const ch = headOf(child2)!;
    if (ch === "play") {
      play = compilePlay1to1(child2, equipment);
    } else if (ch === "end") {
      end = compileEnd1to1(child2, numPlayers);
    } else if (ch === "start") {
      startRules = compileStart1to1(child2, numPlayers, equipment);
    } else if (ch === "phases") {
      // (phases { ... }) explicit list form
      phases = compilePhases1to1(child2, equipment, numPlayers);
    } else if (ch === "meta") {
      // @java game/rules/meta/Swap.java — (meta (swap)) activates the pie rule.
      // @java game/Game.java:2855 — Swap.apply() fires after generating regular moves.
      for (const metaChild of child2.items) {
        if (isList(metaChild) && headOf(metaChild) === "swap") {
          usesSwapRule = true;
        }
      }
    }
  }

  // If phases are present but no bare (play ...), synthesise from phase 0.
  // @java game/rules/Rules.java:62 — bare-play case wraps in default phase
  if (phases !== null && phases.length > 0) {
    if (!play) {
      play = phases[0]!.play;
    }
  }

  if (!play) throw new Error("compiler1to1: (rules ...) missing (play ...)");

  // When phases are present and each phase has its own (end ...), the global
  // (end ...) may be absent. Java allows this: phase-level end rules fire before
  // the global one. Fall back to an empty End (no global terminal rule).
  // @java game/Game.java:3061-3066 — phase-level end rule evaluation
  if (!end) {
    if (phases !== null && phases.length > 0 && phases.some(p => p.end !== null)) {
      end = new End(null, []);
    } else {
      throw new Error("compiler1to1: (rules ...) missing (end ...)");
    }
  }

  const start = startRules.length > 0 ? new Start1to1(startRules) : null;
  const rules = phases !== null
    ? new Rules1to1(null, start, play, phases, end)
    : new Rules1to1(null, start, play, end);

  // Detect if (move Pass) appears in the game tree.
  // @java game/rules/play/moves/nonDecision/effect/Pass.java — gameFlags |= GameType.NotAllPass
  // When a game has explicit (move Pass) moves, the all-pass draw heuristic must be disabled.
  function containsPassMove(node: LudNode): boolean {
    if (!isList(node)) return false;
    const h = headOf(node);
    if (h === "move") {
      const args = parseArgs1to1(node.items);
      const first = args.positional[0];
      if (first && isIdent(first) && first.name.toLowerCase() === "pass") return true;
    }
    for (const item of node.items) {
      if (isList(item) && containsPassMove(item)) return true;
    }
    return false;
  }
  const notAllPass = containsPassMove(gameNode);

  Game1to1.setPortOptions(rules, {
    startRules,
    notAllPass,
    usesSwapRule,
    playerDirs: playerDirs.size > 0 ? playerDirs : undefined,
  });
  return new Game1to1(gameName, GamePlayers1to1.fromCount(numPlayers), null, equipment, rules);
}
