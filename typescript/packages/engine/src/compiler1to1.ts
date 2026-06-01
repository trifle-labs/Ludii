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

// Equipment
import { Piece } from "./ludemes/game/equipment/component/Piece.js";
import { Board1to1 } from "./ludemes/game/equipment/container/board/Board1to1.js";
import { Equipment1to1, type HandSpec } from "./ludemes/game/equipment/Equipment1to1.js";

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
import { Step1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/Step1to1.js";
import { FromTo1to1 } from "./ludemes/game/rules/play/moves/nonDecision/effect/FromTo1to1.js";

// Rules
import { Result } from "./ludemes/game/rules/end/Result.js";
import { If } from "./ludemes/game/rules/end/If.js";
import { End } from "./ludemes/game/rules/end/End.js";
import { Play1to1 } from "./ludemes/game/rules/play/Play1to1.js";
import { Rules1to1 } from "./ludemes/game/rules/Rules1to1.js";

// Start rules
import type { StartRule } from "./ludemes/game/rules/start/StartRule.js";
import { PlaceHandCount1to1 } from "./ludemes/game/rules/start/PlaceHandCount1to1.js";
import { PlaceSites1to1 } from "./ludemes/game/rules/start/PlaceSites1to1.js";
import { PlaceAtHandSite1to1 } from "./ludemes/game/rules/start/PlaceAtHandSite1to1.js";
import { PlaceRegion1to1 } from "./ludemes/game/rules/start/PlaceRegion1to1.js";

// Game
import { Game1to1 } from "./ludemes/Game1to1.js";

import { Context } from "./context.js";
import type {
  IntFunction,
  BooleanFunction,
  RegionFunction,
  MovesFunction,
  EndRuleFunction,
  RoleType,
  ResultType,
} from "./ludemes/base.js";

// ---------------------------------------------------------------------------
// Helper: split items into positional + named (key:value) args
// ---------------------------------------------------------------------------

interface ParsedArgs1to1 {
  positional: LudNode[];
  named: Map<string, LudNode>;
}

function parseArgs1to1(items: readonly LudNode[], startFrom = 1): ParsedArgs1to1 {
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

function headOf(node: LudNode): string | undefined {
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
    const h = headOf(node);
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
    if (h === "/" || h === "*" || h === "+" || h === "-" || h === "%") {
      const { positional: apos } = parseArgs1to1(node.items);
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
      const { positional: lPos } = parseArgs1to1(node.items);
      const first = lPos[0];
      if (first && isIdent(first) && first.name.toLowerCase() === "to") {
        return { eval(ctx: Context): number { return ctx._evalTo; } };
      }
      if (first && isIdent(first) && first.name.toLowerCase() === "from") {
        return { eval(ctx: Context): number { return ctx._evalFrom; } };
      }
    }
  }
  throw new Error(`compiler1to1: cannot compile IntFunction from ${JSON.stringify(node)}`);
}

// ---------------------------------------------------------------------------
// Compile RegionFunction
// ---------------------------------------------------------------------------

export function compileRegion1to1(node: LudNode | undefined): RegionFunction {
  if (!node) throw new Error("compiler1to1: expected RegionFunction node");
  if (!isList(node)) throw new Error(`compiler1to1: expected list for RegionFunction, got ${node.kind}`);
  const h = headOf(node)!;

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
    }
    throw new Error(`compiler1to1: (sites ${first ? (isIdent(first) ? first.name : first.kind) : "?"}) not supported`);
  }

  // (expand <region> [steps:N])
  if (h === "expand") {
    const { positional, named } = parseArgs1to1(node.items);
    try {
      const baseRegion = compileRegion1to1(positional[0]);
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
              // Expand orthogonally
              const neighbors = [
                col > 0 ? site - 1 : -1,
                col < W-1 ? site + 1 : -1,
                row > 0 ? site - W : -1,
                row < H-1 ? site + W : -1,
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
    try {
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
    } catch {
      throw new Error(`compiler1to1: unknown RegionFunction head "${h}"`);
    }
  }

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
  if (!isList(node)) throw new Error(`compiler1to1: expected list for BooleanFunction`);
  const h = headOf(node)!;

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

      if (kind === "prev") {
        // (is Prev Mover) — SameTurn check; simplified: return false
        return { eval(_ctx: Context): boolean { return false; } };
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

      throw new Error(`compiler1to1: (is ${first.name}) not supported`);
    }
    throw new Error(`compiler1to1: (is ?) not supported`);
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
    }
    throw new Error(`compiler1to1: (no ${first && isIdent(first) ? first.name : "?"}) not supported`);
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
  const h = headOf(node)!;

  if (h === "if") {
    const { positional } = parseArgs1to1(node.items);
    const condNode = positional[0];
    const resultNode = positional[1];
    if (!condNode || !resultNode) {
      throw new Error("compiler1to1: (if condition result) — missing parts");
    }
    const condition = compileBool1to1(condNode, numPlayers);
    const result = compileResult1to1(resultNode);
    return new If(condition, result, numPlayers);
  }

  throw new Error(`compiler1to1: unknown end rule head "${h}"`);
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

// ---------------------------------------------------------------------------
// Compile End
// ---------------------------------------------------------------------------

function compileEnd1to1(node: LudNode, numPlayers: number): End {
  if (!isList(node)) throw new Error("compiler1to1: end must be a list");
  const h = headOf(node)!;
  if (h !== "end") throw new Error(`compiler1to1: expected (end ...), got "${h}"`);

  const { positional } = parseArgs1to1(node.items);
  const rules: EndRuleFunction[] = [];

  if (positional.length === 0) {
    return new End([]);
  }

  const first = positional[0]!;
  if (isList(first) && first.delimiter === "curly") {
    for (const child of first.items) {
      if (isList(child)) {
        rules.push(compileEndRule1to1(child, numPlayers));
      }
    }
  } else if (isList(first)) {
    rules.push(compileEndRule1to1(first, numPlayers));
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

function compileMoves1to1(node: LudNode, equipment?: Equipment1to1): MovesFunction {
  return _compileMoves(node, equipment);
}

function compileMoves1to1Impl(node: LudNode, equipment?: Equipment1to1): MovesFunction {
  if (!isList(node)) throw new Error("compiler1to1: play moves must be a list");
  const h = headOf(node);

  // ---- (move ...) dispatch -----------------------------------------------
  if (h === "move") {
    const { positional, named } = parseArgs1to1(node.items);
    const first = positional[0];

    // (move Add (to (sites Empty)))
    if (first && isIdent(first) && first.name.toLowerCase() === "add") {
      const toNode = positional.find(n => isList(n) && headOf(n) === "to");
      if (!toNode || !isList(toNode)) {
        // Try named arg (to:...)
        const toNamed = named.get("to");
        if (toNamed && isList(toNamed)) {
          const toArgs = parseArgs1to1(toNamed.items);
          const regionNode = toArgs.positional[0];
          if (!regionNode) throw new Error("compiler1to1: (to ...) missing region");
          return new Add(compileRegion1to1(regionNode));
        }
        throw new Error("compiler1to1: (move Add ...) missing (to ...)");
      }
      const toArgs = parseArgs1to1(toNode.items);
      const regionNode = toArgs.positional[0];
      if (!regionNode) throw new Error("compiler1to1: (to ...) missing region");
      return new Add(compileRegion1to1(regionNode));
    }

    // (move Slide [direction])
    if (first && isIdent(first) && first.name.toLowerCase() === "slide") {
      const dirnNode = positional[1];
      let dirnName = "Adjacent";
      if (dirnNode && isIdent(dirnNode)) {
        dirnName = dirnNode.name;
      }
      return new Slide1to1(dirnName);
    }

    // (move Step [direction] (to ...))
    if (first && isIdent(first) && first.name.toLowerCase() === "step") {
      // Direction is optional; (to ...) follows
      let dirnName = "Adjacent";
      let toNodeIdx = 1;
      if (positional[1] && isIdent(positional[1]!) && !isList(positional[1]!)) {
        dirnName = (positional[1] as { name: string }).name;
        toNodeIdx = 2;
      }
      // (to if:(is Empty (to))) — for now default to empty condition
      return new Step1to1(dirnName);
    }

    // (move (from ...) (to ...)) — FromTo
    if (first && isList(first) && headOf(first) === "from") {
      const toNode = positional.find(n => isList(n) && headOf(n) === "to");
      if (!toNode || !isList(toNode)) {
        throw new Error("compiler1to1: (move (from ...) ...) missing (to ...)");
      }
      return compileFromTo1to1(first, toNode, named);
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
    const { positional } = parseArgs1to1(node.items);
    const first = positional[0];
    if (first && isIdent(first) && first.name.toLowerCase() === "piece") {
      const specificMovesNode = positional[1];
      const specificMoves = specificMovesNode
        ? compileMoves1to1(specificMovesNode, equipment)
        : null;
      const fp = new ForEachPiece1to1(specificMoves);
      if (equipment) fp.equipment = equipment;
      return fp;
    }
    throw new Error(`compiler1to1: (forEach ${first && isIdent(first) ? first.name : "?"}) not supported`);
  }

  throw new Error(`compiler1to1: unknown play moves head "${h ?? "?"}"`);
}

// Wire up the forward ref
_compileMoves = compileMoves1to1Impl;

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
  }

  // Determine if to is a single site or region
  let locTo: IntFunction | null = null;
  let regionTo: RegionFunction | null = null;

  if (toLocNode) {
    const th = isList(toLocNode) ? headOf(toLocNode) : undefined;
    if (th === "sites") {
      try { regionTo = compileRegion1to1(toLocNode); } catch { locTo = compileInt1to1(toLocNode); }
    } else {
      try { locTo = compileInt1to1(toLocNode); } catch {
        // Can't compile to
      }
    }
  }

  return new FromTo1to1({ locFrom, regionFrom, locTo, regionTo, copy });
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
    // pieceId without suffix is the piece name (e.g. "Disc" not "Disc1")
    return new PlaceAtHandSite1to1(pieceId, role, offset);
  }

  // Try to compile the second arg as a RegionFunction (union, intersection, etc.)
  const sitesNode = positional[1];
  if (!sitesNode) return null;

  // First try RegionFunction (handles union, intersection, sites Top/Bottom etc.)
  if (isList(sitesNode)) {
    try {
      const regionFn = compileRegion1to1(sitesNode);
      return new PlaceRegion1to1(pieceId, regionFn);
    } catch {
      // Fall through to literal site extraction
    }
  }

  // Fallback: extract literal site indices from {n1 n2 ...} or (coord "X")
  const sites = extractSites1to1(sitesNode, equipment?.board.width, equipment?.board.height);
  if (sites.length === 0) return null;

  return new PlaceSites1to1(pieceId, sites);
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
    } else if (ch === "piece") {
      compilePiece1to1(child, pieces, numPlayers);
    } else if (ch === "hand") {
      compileHand1to1(child, hands, numPlayers);
    } else if (ch === "regions") {
      // (regions P1 <regionFn>) — player region declaration
      const rArgs = parseArgs1to1(child.items);
      const ownerNode = rArgs.positional[0];
      const regionDef = rArgs.positional[1];
      if (ownerNode && isIdent(ownerNode) && regionDef && isList(regionDef)) {
        const ownerStr = ownerNode.name;
        if (ownerStr.startsWith("P") && !isNaN(parseInt(ownerStr.slice(1), 10))) {
          const owner = parseInt(ownerStr.slice(1), 10);
          pendingRegions.push({ owner, node: regionDef });
        }
      }
    }
    // (track ...), etc. — skip
  }

  if (!board) throw new Error("compiler1to1: (equipment ...) missing (board ...)");

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

  return new Equipment1to1(board, pieces, hands, playerRegions);
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
    if (!sizeNode || !isNumber(sizeNode)) {
      throw new Error("compiler1to1: (square N) — N must be a number");
    }
    return new Board1to1(sizeNode.value, sizeNode.value);
  }

  if (sh === "rectangle") {
    const rArgs = parseArgs1to1(shapeNode.items);
    const hNode = rArgs.positional[0];
    const wNode = rArgs.positional[1];
    if (!hNode || !isNumber(hNode) || !wNode || !isNumber(wNode)) {
      throw new Error("compiler1to1: (rectangle H W) — H, W must be numbers");
    }
    // Java convention: first arg = rows (height), second = columns (width)
    return new Board1to1(wNode.value, hNode.value);
  }

  throw new Error(`compiler1to1: unsupported board shape "${sh}"`);
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

  for (const child2 of rulesNode.items) {
    if (!isList(child2)) continue;
    const ch = headOf(child2)!;
    if (ch === "play") {
      play = compilePlay1to1(child2, equipment);
    } else if (ch === "end") {
      end = compileEnd1to1(child2, numPlayers);
    } else if (ch === "start") {
      startRules = compileStart1to1(child2, numPlayers, equipment);
    }
    // (phases ...) etc. — skip for now
  }

  if (!play) throw new Error("compiler1to1: (rules ...) missing (play ...)");
  if (!end) throw new Error("compiler1to1: (rules ...) missing (end ...)");

  const rules = new Rules1to1(play, end);
  return new Game1to1(gameName, numPlayers, equipment, rules, startRules);
}
