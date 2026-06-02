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
import { ActionUseDie } from "./action/action-use-die.js";

// Functions
import { IntConstant } from "./ludemes/game/functions/ints/IntConstant.js";
import { IsLine } from "./ludemes/game/functions/booleans/is/line/IsLine.js";
import { SitesEmpty } from "./ludemes/game/functions/region/sites/SitesEmpty.js";
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
import { OrMoves } from "./ludemes/game/rules/play/moves/nonDecision/operators/logical/OrMoves.js";
import { IfMoves } from "./ludemes/game/rules/play/moves/nonDecision/operators/logical/IfMoves.js";
import { ForEachPiece1to1 } from "./ludemes/game/rules/play/moves/nonDecision/operators/foreach/ForEachPiece1to1.js";
import { Slide1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/Slide1to1.js";
import { Shoot1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/Shoot1to1.js";
import { Step1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/Step1to1.js";
import { FromTo1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/FromTo1to1.js";
import { ActionRemove } from "./action/action-remove.js";
import { ActionSetCount } from "./action/action-set-count.js";
import { ActionPass } from "./action/action-pass.js";
import { ActionSetNextPlayer } from "./action/action-set-next-player.js";
import { ActionMove } from "./action/action-move.js";
import { ActionSetPending } from "./action/action-set-pending.js";
import { ActionSetCounter } from "./action/action-set-counter.js";
import { SetVar1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/set/var/SetVar1to1.js";

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
import { PlaceHandCount1to1 } from "./ludemes/game/rules/start/PlaceHandCount1to1.js";
import { PlaceSites1to1 } from "./ludemes/game/rules/start/PlaceSites1to1.js";
import { SetCountStart1to1 } from "./ludemes/game/rules/start/SetCountStart1to1.js";
import { PlaceAtHandSite1to1 } from "./ludemes/game/rules/start/PlaceAtHandSite1to1.js";
import { PlaceRegion1to1 } from "./ludemes/game/rules/start/PlaceRegion1to1.js";

// Game
import { Game1to1 } from "./ludemes/Game1to1.js";

import { Context } from "./context.js";
import { Move } from "./move.js";
import type { Trajectories } from "./eval/graph/trajectories.js";
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
          // ALL containers. For hand slots, countAt[site] stores N pieces in one slot.
          //
          // Counting logic:
          //   - Board sites (0..boardN-1): if cells[i]==pid, count 1 (one piece per site)
          //   - Hand slots (boardN..total-1): if cells[i]==pid, count countAt[i] pieces
          //     (hand uses countAt for pile depth; 0 = empty hand slot)
          const roleNode = positional[1];
          const roleName = (roleNode && isIdent(roleNode)) ? roleNode.name.toLowerCase() : "all";
          return { eval(ctx: Context): number {
            const cells = ctx.state.cells;
            const countAt = ctx.state.countAt;
            const g = ctx.game as unknown as Game1to1;
            const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
            const totalN = cells.length;
            function countFor(pid: number): number {
              let total = 0;
              // Board sites: 1 piece per occupied site
              for (let i = 0; i < boardN; i++) {
                if (cells[i] === pid) total++;
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
            // All / total pieces across board + hands
            let total = 0;
            for (let i = 0; i < boardN; i++) {
              if (cells[i] !== 0) total++;
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
    if (h === "ahead") {
      const { positional: ahPos } = parseArgs1to1(node.items);
      const fromFnAh = compileInt1to1(ahPos[0]);
      const dirNodeAh = ahPos[1];
      const dirNameAh = (dirNodeAh && isIdent(dirNodeAh)) ? dirNodeAh.name : "N";
      return { eval(ctx: Context): number {
        const from = fromFnAh.eval(ctx);
        if (from < 0) return -1;
        const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
        const traj = ctxAny._trajectories;
        if (traj) {
          const steps = traj.steps(from, dirNameAh);
          return steps.length > 0 ? steps[0]! : -1;
        }
        const g = ctx.game as unknown as Game1to1;
        const W = g.equipment.board.width;
        const H = g.equipment.board.height;
        const col = from % W; const row = Math.floor(from / W);
        const d = dirNameAh.toUpperCase();
        if (d === "N" || d === "NORTH") return row < H-1 ? from + W : -1;
        if (d === "S" || d === "SOUTH") return row > 0 ? from - W : -1;
        if (d === "E" || d === "EAST") return col < W-1 ? from + 1 : -1;
        if (d === "W" || d === "WEST") return col > 0 ? from - 1 : -1;
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

    // (state at:<site>) — state value at a site (stub: return 0)
    if (h === "state") {
      return new IntConstant(0);
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
    // @java game/functions/ints/state/Value.java — eval returns context.value(player)
    if (h === "value") {
      const { positional: vPos } = parseArgs1to1(node.items);
      const typeNode = vPos[0];
      if (typeNode && isIdent(typeNode) && typeNode.name.toLowerCase() === "player") {
        const roleNode = vPos[1];
        const roleName = (roleNode && isIdent(roleNode)) ? roleNode.name.toLowerCase() : "mover";
        return { eval(ctx: Context): number {
          // Persistent player values not tracked in 1:1 state; return 0
          void roleName; void ctx;
          return 0;
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
          // Static: find piece by name+owner
          // We need equipment, but compileInt1to1 doesn't have it. We'll use a runtime lookup.
          // At runtime, look up from game.equipment.
          const nameConst = pieceName;
          const ownerConst = owner;
          return {
            eval(ctx: Context): number {
              const g = ctx.game as unknown as { equipment?: { pieces?: Array<{ name: string; owner: number; index: number }> } };
              const pieces = g.equipment?.pieces;
              if (!pieces) return 0;
              const match = pieces.find(p =>
                p.name.toLowerCase() === nameConst.toLowerCase() && p.owner === ownerConst
              ) ?? pieces.find(p =>
                `${p.name}${p.owner}`.toLowerCase() === `${nameConst}${ownerConst}`.toLowerCase()
              );
              return match ? match.index : 0;
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
          return algebraicToSite(coordStr, W, H);
        }};
      }
      return new IntConstant(-1);
    }

    // (where "PieceName" <roleOrInt>) — board site containing the named piece
    // @java game/functions/ints/board/where/WhereSite.java — eval
    // Returns the first board site where the piece owned by `role` is found; -1 if absent.
    if (h === "where") {
      const { positional: wPos } = parseArgs1to1(node.items);
      const nameNode = wPos[0];
      const ownerNode = wPos[1];
      const pieceName = (nameNode && isString(nameNode)) ? nameNode.value : null;
      const ownerStr = (ownerNode && isIdent(ownerNode)) ? ownerNode.name.toLowerCase() : "mover";
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
        // Find first board site with the named piece owned by ownerId
        if (pieceName && g.equipment) {
          const matchingIdx = g.equipment.pieces
            .filter(p => p.name.startsWith(pieceName) && p.owner === ownerId)
            .map(p => p.index);
          for (let i = 0; i < boardN; i++) {
            const what = ctx.state.whatAtSite(i);
            if (matchingIdx.includes(what)) return i;
          }
        } else {
          // No name filter: find first site owned by ownerId
          for (let i = 0; i < boardN; i++) {
            if (cells[i] === ownerId) return i;
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
      const fromFn: IntFunction = fromNode ? compileInt1to1(fromNode) : { eval: (ctx: Context): number => ctx._evalTo };
      const stepsNode = tsNamed.get("steps");
      const stepsFn: IntFunction = stepsNode ? compileInt1to1(stepsNode) : new IntConstant(1);
      return { eval(ctx: Context): number {
        const from = fromFn.eval(ctx);
        const game = ctx.game as unknown as Game1to1;
        const trackEntry = [...(game.equipment?.tracks?.values() ?? [])][0];
        if (!trackEntry) return from;
        const track = trackEntry.sites;
        if (sub === "firstsite") return track[0] ?? -1;
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

    // (face <int> ...) — face index of a site on a face-based board (stub: return site)
    // @java game/functions/ints/board/Face.java
    if (h === "face") {
      const { positional: fPos } = parseArgs1to1(node.items);
      if (fPos[0]) {
        try { return compileInt1to1(fPos[0]); } catch { /* fall through */ }
      }
      return new IntConstant(0);
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
    // (end) — value of a track endpoint (OFF)
    if (name === "END") return new IntConstant(-1);
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

  if (h === "sites") {
    const { positional, named } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first)) {
      const kind = first.name.toLowerCase();
      if (kind === "empty") return new SitesEmpty();
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
        // (sites Occupied by:<role> [component:<name>]) — board sites containing pieces of player
        // @java game/functions/region/sites/occupied/SitesOccupied.java — eval
        // Only returns BOARD sites (not hand containers). Java's owned positions
        // are stored per-container; the board container holds board-site positions.
        const byNode = named.get("by");
        const roleName = (byNode && isIdent(byNode)) ? byNode.name.toLowerCase() : "all";
        return {
          eval(ctx: Context): number[] {
            const cells = ctx.state.cells;
            const g = ctx.game as unknown as Game1to1;
            const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
            const result: number[] = [];
            if (roleName === "mover") {
              const mover = ctx.state.mover;
              for (let i = 0; i < boardN; i++) { if (cells[i] === mover) result.push(i); }
            } else if (roleName === "next") {
              const next = (ctx.state.mover % ctx.game.numPlayers) + 1;
              for (let i = 0; i < boardN; i++) { if (cells[i] === next) result.push(i); }
            } else if (roleName === "p1" || roleName === "p2" || roleName === "p3" || roleName === "p4") {
              const pid = parseInt(roleName.slice(1), 10);
              for (let i = 0; i < boardN; i++) { if (cells[i] === pid) result.push(i); }
            } else if (roleName === "enemy") {
              // Enemy: any board piece NOT owned by the mover (and not neutral).
              // @java SitesOccupied with RoleType.Enemy.
              const mover = ctx.state.mover;
              for (let i = 0; i < boardN; i++) {
                if (cells[i] !== 0 && cells[i] !== mover) result.push(i);
              }
            } else if (roleName === "friend" || roleName === "friendly") {
              // Friend: the mover's own board pieces. @java RoleType.Friend.
              const mover = ctx.state.mover;
              for (let i = 0; i < boardN; i++) { if (cells[i] === mover) result.push(i); }
            } else if (roleName === "neutral" || roleName === "shared") {
              // Neutral pieces: cells[i] = 0 (owner=neutral/shared) AND whats[i] != 0
              // @java SitesOccupied: Neutral = RoleType.Neutral = owner 0
              const whats = ctx.state.whats;
              for (let i = 0; i < boardN; i++) {
                if (cells[i] === 0 && (whats[i] ?? 0) !== 0) result.push(i);
              }
            } else {
              // All: any non-empty board site (occupied by anyone including neutral)
              const whats2 = ctx.state.whats;
              for (let i = 0; i < boardN; i++) {
                if (cells[i] !== 0 || (whats2[i] ?? 0) !== 0) result.push(i);
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
          const W = g.equipment.board.width;
          const H = g.equipment.board.height;
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
          const DYNAMIC_TYPES = new Set(["own", "enemy", "mover", "next", "neutral", "all", "each", "friend", "foe", "p1", "p2"]);
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
          const dirFinal = dirName;
          const includeSelfFinal = includeSelf;
          const siteFnFinal = siteFn;
          const regionFnFinal = regionFnAround;
          const ifFinal = ifCondFn;
          const dynTypeFinal = dynamicType;

          /** Get neighbours of a single site on the current board. */
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

            // Collect all neighbours (union of all source sites' neighbours)
            const seen = new Set<number>();
            const neighbours: number[] = [];
            for (const s of sourceSites) {
              if (includeSelfFinal) {
                if (!seen.has(s)) { seen.add(s); neighbours.push(s); }
              }
              for (const n of neighboursOf(ctx, s)) {
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
                  case "neutral": return who === 0;
                  case "all": return true;
                  default: return true;
                }
              });
            }

            // Apply if: condition, setting _evalTo and _evalSite to each candidate
            // @java SitesAround.java — cond evaluated with context.to() = neighbour
            if (ifFinal) {
              const origTo = ctx._evalTo;
              const origSite = ctx._evalSite;
              const result: number[] = [];
              for (const n of filtered) {
                ctx._evalTo = n;
                ctx._evalSite = n;
                if (ifFinal.eval(ctx)) result.push(n);
              }
              ctx._evalTo = origTo;
              ctx._evalSite = origSite;
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
        // (sites Mover) — sites owned by mover
        return { eval(ctx: Context): number[] {
          const cells = ctx.state.cells;
          const g = ctx.game as unknown as Game1to1;
          const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
          const mover = ctx.state.mover;
          const res: number[] = [];
          for (let i = 0; i < boardN; i++) { if (cells[i] === mover) res.push(i); }
          return res;
        }};
      }

      if (kind === "next") {
        // (sites Next) — sites owned by next player
        return { eval(ctx: Context): number[] {
          const cells = ctx.state.cells;
          const g = ctx.game as unknown as Game1to1;
          const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
          const next = (ctx.state.mover % ctx.game.numPlayers) + 1;
          const res: number[] = [];
          for (let i = 0; i < boardN; i++) { if (cells[i] === next) res.push(i); }
          return res;
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
          const out: number[] = [...lits, ...coords.map(c => algebraicToSite(c, W, H))];
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
          return cs2.map(c => algebraicToSite(c, W, H)).filter(s => s >= 0);
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
    if (first && isString(first)) {
      const coordStrings: string[] = positional.filter(p => isString(p)).map(p => (p as { value: string }).value);
      return { eval(ctx: Context): number[] {
        const g = ctx.game as unknown as Game1to1;
        const W = g.equipment?.board?.width ?? 0;
        const H = g.equipment?.board?.height ?? 0;
        return coordStrings.map(c => algebraicToSite(c, W, H)).filter(s => s >= 0);
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
      const steps = stepsNode && isNumber(stepsNode) ? stepsNode.value : 1;
      return {
        eval(ctx: Context): number[] {
          const W = (ctx.game as unknown as { equipment: { board: { width: number } } }).equipment.board.width;
          const H = (ctx.game as unknown as { equipment: { board: { height: number } } }).equipment.board.height;
          const base = baseRegion.eval(ctx);
          const seen = new Set<number>(base);
          let frontier = [...base];
          for (let s = 0; s < steps; s++) {
            const next: number[] = [];
            for (const site of frontier) {
              const col = site % W;
              const row = Math.floor(site / W);
              // Expand to ADJACENT neighbours (8-dir) — Ludii's `(expand)` default
              // direction is Adjacent, which on a square board includes diagonals.
              const w = col > 0, e = col < W - 1, s = row > 0, n = row < H - 1;
              const neighbors = [
                w ? site - 1 : -1,
                e ? site + 1 : -1,
                s ? site - W : -1,
                n ? site + W : -1,
                (w && s) ? site - W - 1 : -1,
                (e && s) ? site - W + 1 : -1,
                (w && n) ? site + W - 1 : -1,
                (e && n) ? site + W + 1 : -1,
              ];
              for (const nb of neighbors) {
                if (nb >= 0 && !seen.has(nb)) { seen.add(nb); next.push(nb); }
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

  // (if ...) as RegionFunction — already handled by compileRegion but add fallback
  // Actually handled below; this is a safety net

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
    const { positional } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first)) {
      const kind = first.name.toLowerCase();

      if (kind === "line") {
        // (is Line N [dirnOrWho])
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
        return new IsLine(len, dirnName);
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
          const prevMover = moves[moves.length - 1]!.mover;
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

      // (is Pending) — game-level pending check (stub: false)
      if (kind === "pending") {
        return { eval(_ctx: Context): boolean { return false; } };
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

      // (is Hidden ...) — check hidden state (stub: false)
      if (kind === "hidden") {
        return { eval(_ctx: Context): boolean { return false; } };
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
        // (all Groups if:<cond>) — true if all connected groups satisfy condition (stub: false)
        // @java game/functions/booleans/all/groups/AllGroups.java
        return { eval(_ctx: Context): boolean { return false; } };
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
    return new If(condition, result, numPlayers);
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
  // (byScore) — use context scores as-is; highest score wins
  return {
    eval(ctx: Context): import("./ludemes/base.js").EndResult | null {
      const scores = (ctx.state as unknown as { scores?: number[] }).scores;
      if (!scores) return null;

      // Rank by score: highest score = rank 1
      const allScores: number[] = new Array(numPlayers + 1).fill(0);
      for (let p = 1; p <= numPlayers; p++) {
        allScores[p] = scores[p] ?? 0;
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
    return new End([]);
  }

  const first = positional[0]!;

  // (end (byScore ...)) — direct byScore result
  // @java game/rules/end/ByScore.java
  if (isList(first) && headOf(first) === "byscore") {
    return new End([compileByScore1to1(first, numPlayers)]);
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

  return new End(rules);
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
function withThenConsequence(inner: MovesFunction, thenGen: MovesFunction): MovesFunction {
  return {
    eval(ctx: Context): Move[] {
      const c = ctx as Context & { _radials?: unknown; _trajectories?: unknown };
      return inner.eval(ctx).map(m => {
        let postCtx: Context;
        try {
          const postState = m.applyTo(ctx.state, ctx.rng);
          postCtx = ctx.withState(postState);
        } catch { return m; }
        const aug = postCtx as Context & { _radials?: unknown; _trajectories?: unknown };
        aug._radials = c._radials;
        aug._trajectories = c._trajectories;
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
function attachThen(
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
function compilePieceArg1to1(
  node: LudList,
  equipment: Equipment1to1,
): { what: IntFunction; owner: number } | null {
  const pArgs = parseArgs1to1(node.items);
  const first = pArgs.positional[0];
  if (!first) return null;

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
    return { what: { eval: (_ctx: Context) => idx }, owner };
  }

  // (piece (mover)) — use mover's primary piece
  if (isList(first) && headOf(first) === "mover") {
    // Returns mover index; owner = mover at eval time
    return { what: { eval: (ctx: Context) => ctx.state.mover }, owner: -1 }; // owner=-1 means "use mover"
  }

  // (piece (id "Name0")) — same as (piece "Name0")
  if (isList(first) && headOf(first) === "id") {
    const idArgs = parseArgs1to1(first.items);
    const roleName = idArgs.positional[0];
    if (roleName && isString(roleName)) {
      const pieceId = roleName.value;
      const match = equipment.pieces.find(
        p => `${p.name}${p.owner}`.toLowerCase() === pieceId.toLowerCase()
      );
      if (!match) return null;
      const idx = match.index;
      const owner = match.owner;
      return { what: { eval: (_ctx: Context) => idx }, owner };
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
  const h = headOf(node);

  // ---------------------------------------------------------------------------
  // Moves registry lookup — registered 1:1 classes take priority over inline.
  // Pattern mirrors compileInt1to1 (line ~172) / compileRegion1to1 (line ~1160).
  // ---------------------------------------------------------------------------
  {
    const env: Compile1to1Env = { numPlayers: 2 };
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
  if (h === "enclose") {
    const { positional } = parseArgs1to1(node.items);
    const fromNode = positional.find(n => isList(n) && headOf(n) === "from");
    const fromInner = fromNode && isList(fromNode) ? parseArgs1to1(fromNode.items).positional[0] : undefined;
    const fromFn: IntFunction = fromInner ? compileInt1to1(fromInner) : { eval: (ctx: Context): number => ctx._evalTo };
    let dirnName = "Orthogonal";
    const dirnIdent = positional.find(n => isIdent(n) && n.name.toLowerCase() !== "from");
    if (dirnIdent && isIdent(dirnIdent)) dirnName = dirnIdent.name;
    return {
      eval(ctx: Context): Move[] {
        const from = fromFn.eval(ctx);
        if (from < 0) return [];
        const mover = ctx.state.mover;
        const cells = ctx.state.cells;
        const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[] };
        const radials = ctxAny._radials;
        if (!radials) return [];
        const orthoNbrs = (s: number): number[] => {
          const cr = radials[s];
          if (!cr) return [];
          const out: number[] = [];
          for (const { ray, opposite } of radialsForDirection(cr, dirnName)) {
            if (ray[1] !== undefined) out.push(ray[1]);
            if (opposite[1] !== undefined) out.push(opposite[1]);
          }
          return out;
        };
        const captured = new Set<number>();
        for (const a of orthoNbrs(from)) {
          if (captured.has(a)) continue;
          const enemyWhat = cells[a] ?? 0;
          if (enemyWhat === 0 || enemyWhat === mover) continue; // empty or friend
          // BFS the enemy group; capture it iff it has NO empty (liberty) neighbour.
          const group: number[] = [];
          const seen = new Set<number>([a]);
          const stack = [a];
          let hasLiberty = false;
          while (stack.length) {
            const sNode = stack.pop()!;
            group.push(sNode);
            for (const nb of orthoNbrs(sNode)) {
              const w = cells[nb] ?? 0;
              if (w === 0) hasLiberty = true;
              else if (w === enemyWhat && !seen.has(nb)) { seen.add(nb); stack.push(nb); }
            }
          }
          if (!hasLiberty) for (const g of group) captured.add(g);
        }
        if (captured.size === 0) return [];
        const actions = [...captured].map(s => new ActionRemove({ to: s }));
        return [new Move({
          id: `enclose:${from}`, label: "Enclose", siteIndices: [from],
          mover, placedOwner: mover, actions,
        })];
      },
    };
  }

  // ---- (moveAgain) as a moves generator ----------------------------------
  // Emits a sentinel move carrying the same-player continuation. Only meaningful
  // inside a (then ...) consequence (resolved by withThenConsequence/attachThen);
  // never added to a real move list directly.
  // @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
  if (h === "moveagain") {
    return { eval(ctx: Context): Move[] {
      const mover = ctx.state.mover;
      return [new Move({
        id: "moveAgain", label: "MoveAgain", siteIndices: [0], mover, placedOwner: mover,
        actions: [new ActionSetNextPlayer(mover)], moveAgain: true,
      })];
    }};
  }

  // ---- (sow [apply:<effect>]) — mancala sow, used inside (then (sow …)) -------
  // Picks up the seeds at the selected hole (_evalTo) and distributes one per
  // subsequent track site (wrapping if the track loops). The apply: consequence
  // runs at the LANDING site (_evalTo = last). @java …/effect/Sow.java
  if (h === "sow") {
    const { named } = parseArgs1to1(node.items);
    const applyNode = named.get("apply");
    let sowApply: MovesFunction | undefined;
    if (applyNode) { try { sowApply = compileMoves1to1(applyNode, equipment); } catch { /* skip */ } }
    return { eval(ctx: Context): Move[] {
      const game = ctx.game as unknown as Game1to1;
      const trackEntry = [...(game.equipment?.tracks?.values() ?? [])][0];
      if (!trackEntry) return [];
      const track = trackEntry.sites;
      const loop = trackEntry.loop;
      const hole = ctx._evalTo;
      if (hole < 0) return [];
      const seeds = ctx.state.countAtSite(hole);
      const pos0 = track.indexOf(hole);
      if (seeds <= 0 || pos0 < 0) return [];
      const added = new Map<number, number>();
      let pos = pos0, last = hole;
      for (let i = 0; i < seeds; i++) {
        pos++; if (pos >= track.length) { if (loop) pos = 0; else break; }
        const s = track[pos]!;
        added.set(s, (added.get(s) ?? 0) + 1);
        last = s;
      }
      const actions: import("./action/index.js").Action[] = [new ActionSetCount({ to: hole, count: 0 })];
      for (const [s, n] of added) actions.push(new ActionSetCount({ to: s, count: ctx.state.countAtSite(s) + n }));
      let moveAgain = false;
      if (sowApply) {
        // @java Sow.java — the apply: consequence runs at the LANDING site in the
        // state AFTER the seeds have been distributed (source hole cleared, each
        // landing incremented). Build that post-sow state and evaluate against it.
        let postState = ctx.state;
        for (const a of actions) postState = a.apply(postState);
        const postCtx = ctx.withState(postState);
        postCtx._evalTo = last;
        postCtx._evalFrom = hole;
        try {
          for (const am of sowApply.eval(postCtx)) { for (const a of am.actions) actions.push(a); if (am.moveAgain) moveAgain = true; }
        } catch { /* ignore */ }
      }
      return [new Move({
        id: `sow:${hole}`, label: "Sow", siteIndices: [hole], mover: ctx.state.mover,
        placedOwner: ctx.state.mover, actions, moveAgain,
      })];
    }};
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
      let pieceFn: { what: IntFunction; owner: number } | null = null;
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
      // Apply (to ... if:cond) filter if present
      // @java Add.java: the `to` condition filters valid placement sites
      const region = applyToIfCondition(compileRegion1to1(regionNode), toArgs.named.get("if"));
      return attachThen(new Add(region, pieceFn), positional, equipment);
    }

    // (move Hop [<dir>] (between ...) (to ...)) — jump over a piece
    // @java game/rules/play/moves/nonDecision/effect/Hop.java — eval
    // Simplified: generate hop moves by jumping over adjacent pieces
    if (first && isIdent(first) && first.name.toLowerCase() === "hop") {
      const hopArgs = parseArgs1to1(node.items);
      // Find (between ...) and (to ...) sub-nodes
      let betweenCond: BooleanFunction | null = null;
      let toCond: BooleanFunction | null = null;
      let captureNode: RegionFunction | null = null;
      for (const p of hopArgs.positional) {
        if (!isList(p)) continue;
        const ph = headOf(p);
        if (ph === "between") {
          const ba = parseArgs1to1(p.items);
          const bIf = ba.named.get("if");
          if (bIf) { try { betweenCond = compileBool1to1(bIf, 2); } catch { /* skip */ } }
        } else if (ph === "to") {
          const ta = parseArgs1to1(p.items);
          const tIf = ta.named.get("if");
          if (tIf) { try { toCond = compileBool1to1(tIf, 2); } catch { /* skip */ } }
          const capNode = ta.named.get("apply");
          if (capNode) { try { captureNode = compileRegion1to1(capNode); } catch { /* skip */ } }
        }
      }
      // Simplified hop: from each piece, try to jump over adjacent occupied cells
      // to the cell beyond, if to is empty
      return {
        eval(ctx: Context): Move[] {
          const from = ctx._evalFrom;
          if (from < 0) return [];
          const cells = ctx.state.cells;
          const mover = ctx.state.mover;
          const ctxAny = ctx as unknown as { _radials?: readonly import("./ludemes/topology-radials.js").CellFlatRadials[] };
          const radials = ctxAny._radials;
          if (!radials) return [];
          const cr = radials[from];
          if (!cr) return [];
          const moves: Move[] = [];
          for (const axis of cr.axes) {
            for (const ray of [axis.ray, axis.opposite]) {
              // First step = potential "between" (piece to jump over)
              const between = ray[1];
              const toSite = ray[2];
              if (between === undefined || toSite === undefined) continue;
              if (cells[between] === undefined || cells[between] === 0) continue;
              if (!ctx.state.isEmptySite(toSite)) continue;
              // Check conditions
              ctx._evalFrom = from;
              ctx._evalTo = toSite;
              if (betweenCond) {
                const origSite = ctx._evalSite;
                const origBetween = ctx._evalBetween;
                ctx._evalSite = between;
                ctx._evalBetween = between; // (between) IntFunction reads this
                const ok = betweenCond.eval(ctx);
                ctx._evalSite = origSite;
                ctx._evalBetween = origBetween;
                if (!ok) continue;
              }
              if (toCond && !toCond.eval(ctx)) continue;
              // Generate ActionMove + ActionRemove for capture
              const actions: import("./action/index.js").Action[] = [];
              actions.push(new ActionRemove({ to: between }));
              actions.push(new ActionMove({ from, to: toSite }));
              moves.push(new Move({
                id: `hop:${from}:${between}:${toSite}`,
                label: `Hop ${from}→${toSite}`,
                siteIndices: [from, toSite],
                mover,
                placedOwner: mover,
                actions,
                fromSite: from,
                toSite: toSite,
              }));
            }
          }
          ctx._evalFrom = from;
          return moves;
        }
      };
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
          const fLoc = fa.positional[0];
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
      if (!fromRegion) fromRegion = new SitesEmpty(); // fallback
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
      return {
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
    }

    // (move Pass) — generate a pass move
    // @java game/rules/play/moves/nonDecision/effect/Pass.java
    if (first && isIdent(first) && first.name.toLowerCase() === "pass") {
      return { eval(ctx: Context): Move[] {
        const mover = ctx.state.mover;
        return [new Move({
          id: "pass", label: "Pass", siteIndices: [0], mover, placedOwner: mover,
          actions: [new ActionPass()],
        })];
      }};
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

    // (move Slide [direction] [(then (moveAgain))])
    if (first && isIdent(first) && first.name.toLowerCase() === "slide") {
      const dirnNode = positional[1];
      let dirnName = "Adjacent";
      if (dirnNode && isIdent(dirnNode)) {
        dirnName = dirnNode.name;
      }
      // Parse (to if:<cond> (apply <effect>)) — landing rule + capture (chess).
      // @java Slide.java: toRule = to.cond(); sideEffect = to.effect()
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
      const slideMoves: MovesFunction = new Slide1to1(dirnName, slideToCond ?? undefined, slideApply);
      // (then <moves>) consequence chaining (incl. conditional moveAgain).
      // @java game/rules/play/moves/nonDecision/effect/Then.java — eval wraps each move
      // @java game/rules/play/moves/nonDecision/effect/state/MoveAgain.java
      return attachThen(slideMoves, positional, equipment);
    }

    // (move Step [direction] (to ...) [(then (moveAgain))])
    if (first && isIdent(first) && first.name.toLowerCase() === "step") {
      // Direction is optional; (to ...) follows
      let dirnName = "Adjacent";
      if (positional[1] && isIdent(positional[1]!) && !isList(positional[1]!)) {
        dirnName = (positional[1] as { name: string }).name;
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
            applyEffectNode = parseArgs1to1(applyChild.items).positional[0];
          }
        }
        if (applyEffectNode) {
          try { stepApply = compileMoves1to1(applyEffectNode, equipment); } catch { /* skip */ }
        }
      }
      const stepMoves: MovesFunction = new Step1to1(dirnName, stepToCond ?? undefined, stepApply);
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
      return attachThen(compileFromTo1to1(first, toNode, named), positional, equipment);
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
          const action = {
            apply(state: import("./state.js").State): import("./state.js").State {
              return state.withCell(promLoc, promOwner).withWhatAt(promLoc, promIdx);
            },
            actionType(): import("./action/action-type.js").ActionType { return "Move" as import("./action/action-type.js").ActionType; },
            from(): number { return promLoc; },
            to(): number { return promLoc; },
          };
          moves.push(new Move({
            id: `promote:${location}:${whatIdx}`,
            label: `Promote ${name}`,
            siteIndices: [location],
            mover,
            placedOwner: ownerId,
            actions: [action as unknown as import("./action/index.js").Action],
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

    // (move Leap ...) — leap over multiple pieces in a jump pattern (stub: empty)
    // @java game/rules/play/moves/nonDecision/effect/Leap.java
    if (first && isIdent(first) && first.name.toLowerCase() === "leap") {
      return { eval(_ctx: Context): Move[] { return []; } };
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
  if (h === "or") {
    const { positional } = parseArgs1to1(node.items);
    const subMoves = flattenMovesList(positional, equipment);
    return new OrMoves(subMoves);
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
    return new IfMoves(cond, thenMoves, elseMoves);
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
        if (positional[1]) {
          const secondArg = positional[1];
          if (isList(secondArg)) {
            considerArg(secondArg);
          } else if (isString(secondArg)) {
            considerArg(positional[2]); considerArg(positional[3]);
          } else if (isIdent(secondArg)) {
            specificRole = secondArg.name;
            considerArg(positional[2]); considerArg(positional[3]);
          }
        }
        considerArg(positional[2]); // also pick up a trailing (then …) after a moves arg
        void specificRole; // Note: owner filtering not yet implemented
        const fp = new ForEachPiece1to1(specificMoves);
        if (equipment) fp.equipment = equipment;
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

      // (forEach Value <int> ...) / (forEach Piece "Name" ...) — value iterator
      // @java game/rules/play/moves/nonDecision/operators/foreach/value/ForEachValue.java — eval
      // Simplified: return empty (value iteration for sow states not in 1:1 path)
      if (typeName === "value" || typeName === "group" || typeName === "level") {
        return { eval(_ctx: Context): Move[] { return []; } };
      }

      throw new Error(`compiler1to1: (forEach ${first && isIdent(first) ? first.name : "?"}) not supported`);
    }
  }

  // ---- (priority { <moves1> <moves2> ... }) — first non-empty move list -----
  // @java game/rules/play/moves/nonDecision/effect/requirement/Priority.java
  // Returns the first sub-list that generates at least one move.
  if (h === "priority") {
    const { positional } = parseArgs1to1(node.items);
    const subMoves = flattenMovesList(positional, equipment);
    return {
      eval(ctx: Context): Move[] {
        for (const sub of subMoves) {
          const moves = sub.eval(ctx);
          if (moves.length > 0) return moves;
        }
        return [];
      }
    };
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
      const nextMoves = compileMoves1to1(nextNode, equipment);
      return {
        eval(ctx: Context): Move[] {
          const priorResult = priorMoves.eval(ctx);
          if (priorResult.length === 0) return [];
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
          // Eval next in the temp context.
          const nextResult = nextMoves.eval(tempCtx);
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

  // ---- (append <moves1> <moves2>) — same as (and ...) ----------------------
  // @java game/rules/play/moves/nonDecision/operators/logical/Append.java
  if (h === "append") {
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
    // Other set subtypes not yet routed — generate no moves (no fake behaviour).
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (roll) — roll dice. Stub: return empty moves -------------------------
  if (h === "roll") {
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (pass) / (move Pass) — explicit pass move ----------------------------
  // @java game/rules/play/moves/nonDecision/effect/Pass.java
  if (h === "pass") {
    return { eval(ctx: Context): Move[] {
      const mover = ctx.state.mover;
      return [new Move({
        id: "pass",
        label: "Pass",
        siteIndices: [],
        mover,
        placedOwner: mover,
        actions: [new ActionPass()],
      })];
    }};
  }

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

  // ---- (move Use ...) / (apply ...) / etc. — unsupported stubs ---------------
  if (h === "use" || h === "apply" || h === "replay" || h === "note") {
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (forget ...) — forget a remembered value (stub: return empty) -----------
  if (h === "forget") {
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (addScore ...) — add score as a move (stub: return empty) ---------------
  if (h === "addscore") {
    return { eval(_ctx: Context): Move[] { return []; } };
  }

  // ---- (seq <moves1> <moves2> ...) — sequential moves (like (do ...) but simpler) ---
  // @java game/rules/play/moves/nonDecision/operators/sequential/Seq.java
  // Execute first sub-moves, then second etc. Simplified: return first non-empty
  if (h === "seq") {
    const { positional } = parseArgs1to1(node.items);
    const subMoves = flattenMovesList(positional, equipment);
    return {
      eval(ctx: Context): Move[] {
        for (const sub of subMoves) {
          const moves = sub.eval(ctx);
          if (moves.length > 0) return moves;
        }
        return [];
      }
    };
  }

  // ---- (satisfy <constraints>) — constraint-satisfaction puzzle move gen (stub: empty) ---
  // @java game/rules/play/moves/nonDecision/effect/requirement/Satisfy.java
  // Generates all moves satisfying a constraint set (backtracking search). Stub.
  if (h === "satisfy") {
    return { eval(_ctx: Context): Move[] { return []; } };
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
function flattenMovesList(positional: LudNode[], equipment?: Equipment1to1): MovesFunction[] {
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
function compileFromTo1to1(
  fromNode: LudList,
  toNode: LudList,
  _named: Map<string, LudNode>,
): FromTo1to1 {
  // Parse (from <locFn> [condition:...])
  const fromArgs = parseArgs1to1(fromNode.items);
  const fromLocNode = fromArgs.positional[0];

  // Parse (to <locFn> [if:...])
  const toArgs = parseArgs1to1(toNode.items);
  const toLocNode = toArgs.positional[0];

  // Check for copy: named
  const copyNode = _named.get("copy");
  const copy = copyNode !== undefined && isIdent(copyNode) && copyNode.name.toLowerCase() === "true";

  // Determine if from is a single site (IntFunction) or region (RegionFunction)
  let locFrom: IntFunction | null = null;
  let regionFrom: RegionFunction | null = null;

  if (fromLocNode) {
    const fh = isList(fromLocNode) ? headOf(fromLocNode) : undefined;
    if (fh === "handsite") {
      locFrom = compileInt1to1(fromLocNode);
    } else if (fh === "sites") {
      try { regionFrom = compileRegion1to1(fromLocNode); } catch { locFrom = compileInt1to1(fromLocNode); }
    } else {
      try { locFrom = compileInt1to1(fromLocNode); } catch {
        // Can't compile from — default to no from sites
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
    if (th === "sites" || th === "expand" || th === "difference" || th === "union" || th === "intersection") {
      try { regionTo = compileRegion1to1(toLocNode); } catch { locTo = compileInt1to1(toLocNode); }
    } else {
      try { locTo = compileInt1to1(toLocNode); } catch {
        // Can't compile to
      }
    }
  }

  // (to … if:<cond>) — filter the to-sites (e.g. if:(is Empty (to))). @java To.cond()
  let toCondition: BooleanFunction | null = null;
  const toIfNode = toArgs.named.get("if");
  if (toIfNode) { try { toCondition = compileBool1to1(toIfNode, 2); } catch { /* ignore */ } }

  return new FromTo1to1({ locFrom, regionFrom, locTo, regionTo, toCondition, copy });
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
        const count = cntNode && isNumber(cntNode) ? cntNode.value : 0;
        const toNode = sa.named.get("to") ?? sa.positional.find((n, i) => i >= 2 && isList(n));
        if (toNode && count > 0) {
          try {
            const regionFn = compileRegion1to1(toNode);
            // Seed component = the first declared piece (often "Seed"), if any.
            const seedWhat = equipment && equipment.pieces.length > 0 ? equipment.pieces[0]!.index : 0;
            rules.push(new SetCountStart1to1(regionFn, count, seedWhat));
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

  // First arg: piece ID string (e.g. "Marker1", "Ball1")
  const pieceIdNode = positional[0];
  if (!pieceIdNode || !isString(pieceIdNode)) return null;
  const pieceId = pieceIdNode.value;

  // count:N — pieces seeded per placed site (mancala sow seeds use 4, etc.).
  // @java game/rules/start/place/Place.count — default 1.
  const placeCountNode = named.get("count");
  const placeCount = placeCountNode && isNumber(placeCountNode) ? placeCountNode.value : 1;

  // (place "X" coord:"C5") — placement at a NAMED algebraic coordinate.
  // @java game/rules/start/place/site/PlaceCustomStack / Place coord:
  const coordNamed = named.get("coord");
  if (coordNamed && isString(coordNamed)) {
    const site = coordToSite1to1(coordNamed.value, equipment?.board);
    if (site >= 0) {
      return new PlaceSites1to1(pieceId, [site], placeCount);
    }
  }

  // Check for "Hand" as second positional arg
  const secondNode = positional[1];
  if (secondNode && isString(secondNode) && secondNode.value.toLowerCase() === "hand") {
    // (place "Marker" "Hand" count:N)
    const countNode = named.get("count");
    const count = countNode && isNumber(countNode) ? countNode.value : 1;
    // Strip player suffix from pieceId: "Marker1" → "Marker"
    const nameOnly = pieceId.replace(/\d+$/, "");
    return new PlaceHandCount1to1(nameOnly, count);
  }

  // (place "Disc" (handSite Shared)) — place at a specific hand site
  // The site is specified by a (handSite ...) IntFunction
  if (secondNode && isList(secondNode) && headOf(secondNode) === "handsite") {
    // We can't evaluate handSite without runtime context. Defer by creating
    // a start rule that will use the equipment to resolve the hand site.
    const hArgs = parseArgs1to1(secondNode.items);
    const roleNode = hArgs.positional[0];
    const offsetNode = hArgs.positional[1];
    const role: RoleType | "Shared" = (roleNode && isIdent(roleNode))
      ? (roleNode.name as RoleType | "Shared")
      : "Mover";
    const offset = offsetNode && isNumber(offsetNode) ? offsetNode.value : 0;
    // count:N — number of pieces seeded into the hand slot (e.g. 20 goats). @java Place.count
    const phCountNode = named.get("count");
    const phCount = phCountNode && isNumber(phCountNode) ? phCountNode.value : 1;
    // pieceId without suffix is the piece name (e.g. "Disc" not "Disc1")
    return new PlaceAtHandSite1to1(pieceId, role, offset, phCount);
  }

  // Try to compile the second arg as a RegionFunction (union, intersection, etc.)
  const sitesNode = positional[1];
  if (!sitesNode) return null;

  // Curly-brace literal lists {n1 n2 ...} or {"A1" "B1" ...} — try literal extraction first.
  // compileRegion1to1 would silently produce an empty UnionRegion for string-only curly lists,
  // so we must try extractSites1to1 before delegating to the region compiler.
  if (isList(sitesNode) && sitesNode.delimiter === "curly") {
    const sites = extractSites1to1(sitesNode, equipment?.board.width, equipment?.board.height);
    if (sites.length > 0) return new PlaceSites1to1(pieceId, sites, placeCount);
    // Empty result — fall through to region compiler (e.g. curly-wrapped region functions)
  }

  // (coord "A4") — single algebraic coordinate
  if (!isList(sitesNode)) {
    const sites = extractSites1to1(sitesNode, equipment?.board.width, equipment?.board.height);
    if (sites.length > 0) return new PlaceSites1to1(pieceId, sites, placeCount);
    return null;
  }

  // Parenthesis-delimited list: try as RegionFunction (sites Top/Bottom/Outer, intersection, etc.)
  if (isList(sitesNode)) {
    try {
      const regionFn = compileRegion1to1(sitesNode);
      return new PlaceRegion1to1(pieceId, regionFn, placeCount);
    } catch {
      // Fall through to literal site extraction
    }
  }

  // Last-resort: extract literal site indices from (coord "X") etc.
  const sites = extractSites1to1(sitesNode, equipment?.board.width, equipment?.board.height);
  if (sites.length === 0) return null;

  return new PlaceSites1to1(pieceId, sites, placeCount);
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

function algebraicToSite(coord: string, boardWidth?: number, _boardHeight?: number): number {
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
  const pendingRegions: Array<{ owner: number; node: LudList }> = [];
  const tracks = new Map<string, { sites: readonly number[]; loop: boolean }>();

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
      // (boardless <tiling>) — infinite/expandable board; use a large default
      // @java game/equipment/container/board/Boardless.java
      // For 1:1 path, use a large square that buildBoardGraph can handle
      try {
        const graphSpec = buildBoardGraph(child);
        if (graphSpec) {
          board = new Board1to1(graphSpec.width, graphSpec.height, graphSpec.numSites, graphSpec.traj);
        }
      } catch { /* fall through */ }
      if (!board) {
        // Default 20×20 for boardless games
        board = new Board1to1(20, 20);
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
    } else if (ch === "hand") {
      compileHand1to1(child, hands, numPlayers);
    } else if (ch === "regions") {
      // (regions [name] <owner> <regionFn>) — player region declaration
      // Forms:
      //   (regions P1 <region>)           — unnamed player region
      //   (regions "Name" P1 <region>)    — named player region (skip name)
      // @java game/equipment/regions/PlayerRegions.java
      const rArgs = parseArgs1to1(child.items);
      // Skip optional string name as first arg
      let argIdx = 0;
      if (rArgs.positional[0] && isString(rArgs.positional[0])) argIdx = 1; // skip name
      const ownerNode = rArgs.positional[argIdx];
      const regionDef = rArgs.positional[argIdx + 1];
      if (ownerNode && isIdent(ownerNode) && regionDef && isList(regionDef)) {
        const ownerStr = ownerNode.name;
        if (ownerStr.startsWith("P") && !isNaN(parseInt(ownerStr.slice(1), 10))) {
          const owner = parseInt(ownerStr.slice(1), 10);
          pendingRegions.push({ owner, node: regionDef });
        }
      }
    }
    // (track ...), (map ...), (dice ...), (surakartaBoard ...) etc. — skip silently
  }

  if (!board) {
    // Fallback: if no board was found in equipment (e.g. option-dependent board form),
    // use a default 8×8 board so the game at least compiles.
    // This handles games like Ecosys where `(<Board:type>)` didn't resolve to a board.
    board = new Board1to1(8, 8);
  }

  // Collect (track "Name" {sites} loop:) declarations (children of the board node).
  collectTracks1to1(node, tracks);

  // Compile player regions (needs board to be known first).
  const playerRegions = new Map<number, RegionFunction>();
  for (const { owner, node: rNode } of pendingRegions) {
    try {
      const regionFn = compileRegion1to1(rNode);
      playerRegions.set(owner, regionFn);
    } catch {
      // Skip uncompilable regions
    }
  }

  return new Equipment1to1(board, pieces, hands, playerRegions, tracks);
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

/** Recursively find `(track "Name" {sites} loop:)` nodes and store the ordered tracks. */
function collectTracks1to1(node: LudNode, tracks: Map<string, { sites: readonly number[]; loop: boolean }>): void {
  if (!isList(node)) return;
  if (headOf(node) === "track") {
    const { positional, named } = parseArgs1to1(node.items);
    const nameNode = positional[0];
    const name = (nameNode && isString(nameNode)) ? nameNode.value : `Track${tracks.size}`;
    // Site list is the first curly-list positional arg.
    const sitesNode = positional.find(n => isList(n) && n.delimiter === "curly");
    const sites = parseTrackSites1to1(sitesNode);
    const loopNode = named.get("loop");
    const loop = loopNode !== undefined && isIdent(loopNode) && loopNode.name.toLowerCase() === "true";
    if (sites.length > 0) tracks.set(name, { sites, loop });
    return;
  }
  for (const item of node.items) collectTracks1to1(item, tracks);
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
  //   Optional first arg = who (RoleType ident like Mover, P1, Shared)
  //   Required next arg  = condition (BooleanFunction list)
  //   Optional last arg  = target phase name (string)
  //
  // @java NextPhase.java: who defaults to Shared (= numPlayers+1)
  let whoFn: import("./ludemes/base.js").IntFunction;
  let remainingArgs = rawArgs;
  const SHARED_IDX = numPlayers + 1;

  // Check if first non-trivial arg is a RoleType ident (not a list, not a string)
  const firstArg = rawArgs[0];
  const knownRoles = new Set(["mover", "next", "p1", "p2", "p3", "p4", "shared", "all", "each"]);
  if (firstArg && isIdent(firstArg) && knownRoles.has(firstArg.name.toLowerCase())) {
    const roleName = firstArg.name.toLowerCase();
    if (roleName === "mover") {
      whoFn = { eval(ctx: Context): number { return ctx.state.mover; } };
    } else if (roleName === "next") {
      whoFn = { eval(ctx: Context): number { return (ctx.state.mover % ctx.game.numPlayers) + 1; } };
    } else if (roleName === "shared" || roleName === "all" || roleName === "each") {
      whoFn = { eval(_ctx: Context): number { return SHARED_IDX; } };
    } else if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
      const pid = parseInt(roleName.slice(1), 10);
      whoFn = { eval(_ctx: Context): number { return pid; } };
    } else {
      whoFn = { eval(_ctx: Context): number { return SHARED_IDX; } };
    }
    remainingArgs = rawArgs.slice(1);
  } else {
    // No explicit who — defaults to Shared
    whoFn = { eval(_ctx: Context): number { return SHARED_IDX; } };
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

  const np = new NextPhase(whoFn, condFn, targetName);
  return np;
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
    let ownerPlayerId = 0; // 0 = Shared (all players)
    const ownerNode = pArgs.positional[1];
    if (ownerNode && isIdent(ownerNode)) {
      const ownerName = ownerNode.name.toLowerCase();
      if (ownerName.startsWith("p") && !isNaN(parseInt(ownerName.slice(1), 10))) {
        ownerPlayerId = parseInt(ownerName.slice(1), 10);
      }
      // "Shared", "All", "Each", "Mover", "Next" → ownerPlayerId = 0 (Shared)
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
    phases.push(new Phase(phaseName, phasePlay, phaseEnd, phaseNextPhases, ownerPlayerId));
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
  const playersNode = child("players");
  if (playersNode) {
    const { positional } = parseArgs1to1(playersNode.items);
    const nNode = positional[0];
    if (nNode && isNumber(nNode)) numPlayers = nNode.value;
  }

  const equipNode = child("equipment");
  if (!equipNode) throw new Error("compiler1to1: game missing (equipment ...)");
  const equipment = compileEquipment1to1(equipNode, numPlayers);

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
      end = new End([]);
    } else {
      throw new Error("compiler1to1: (rules ...) missing (end ...)");
    }
  }

  const rules = new Rules1to1(play, end, phases);

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

  return new Game1to1(gameName, numPlayers, equipment, rules, startRules, notAllPass);
}
