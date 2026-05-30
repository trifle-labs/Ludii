// @java Core/src/game/functions/booleans/is/loop/IsLoop.java

import {
  isIdent,
  isList,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  type CompileEnv,
  lastToSite,
  orthoNeighbours,
  outerSites,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  IntFn,
} from "../../../../../../eval/eval-context.js";
import { OFF } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsLoop(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  // Java IsLoop.eval starts from LastTo, rejects off-board/empty seeds, then
  // tests whether the mover/colour pieces enclose a non-outer region
  // (Core/src/game/functions/booleans/is/loop/IsLoop.java:165-183,
  // 189-220, 231-405). Tile-path loops (IsLoop.java:414-510) still require
  // tile path metadata that this port does not model.
  const pathNode = named.get("path");
  if (pathNode && isIdent(pathNode) && pathNode.name === "True")
    return { eval: () => false };
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
  const dirTokens: string[] = [];
  let colourNode: LudNode | undefined;
  for (const p of positional) {
    if (isIdent(p)) {
      if (p.name === "Cell" || p.name === "Vertex" || p.name === "Edge")
        continue;
      if (DIRS.has(p.name)) {
        dirTokens.push(p.name);
        continue;
      }
    }
    if (!colourNode) colourNode = p;
  }
  const colourFn = colourNode ? compileInt(colourNode, env) : undefined;
  const surroundNode = named.get("surround");
  const surroundFns: IntFn[] = [];
  if (surroundNode) {
    if (isList(surroundNode) && surroundNode.delimiter === "curly") {
      for (const item of surroundNode.items) surroundFns.push(compileInt(item, env));
    } else {
      surroundFns.push(compileInt(surroundNode, env));
    }
  }
  return {
    eval: (ctx) => {
      const start = lastToSite(ctx);
      if (start < 0 || start >= ctx.state.cells.length) return false;
      const owner = colourFn ? colourFn.eval(ctx) : ctx.mover;
      if (owner <= 0 || (ctx.state.cells[start] ?? 0) !== owner) {
        return false;
      }
      const surroundOwners =
        surroundFns.length > 0
          ? new Set(surroundFns.map((fn) => fn.eval(ctx)))
          : undefined;
      const outer = new Set(outerSites(ctx));
      const ringNeighbours = (s: number): number[] =>
        dirTokens.length > 0 ? aroundSites(ctx, s, dirTokens) : orthoNeighbours(ctx, s);
      const hasCycle = (): boolean => {
        const comp = new Set<number>([start]);
        const stack = [start];
        while (stack.length > 0) {
          const s = stack.pop() as number;
          for (const nb of ringNeighbours(s)) {
            if (!comp.has(nb) && (ctx.state.cells[nb] ?? 0) === owner) {
              comp.add(nb);
              stack.push(nb);
            }
          }
        }
        const parent = new Map<number, number>([[start, OFF]]);
        const dfs = [start];
        while (dfs.length > 0) {
          const s = dfs.pop() as number;
          for (const nb of ringNeighbours(s)) {
            if (!comp.has(nb)) continue;
            if (!parent.has(nb)) {
              parent.set(nb, s);
              dfs.push(nb);
            } else if (parent.get(s) !== nb) {
              return true;
            }
          }
        }
        return false;
      };
      if (!hasCycle()) return false;
      const canBeInside = (s: number): boolean => {
        const cellOwner = ctx.state.cells[s] ?? 0;
        if (cellOwner === owner) return false;
        return !surroundOwners || surroundOwners.has(cellOwner);
      };
      const starts = orthoNeighbours(ctx, start).filter(
        (s) => s >= 0 && !outer.has(s) && canBeInside(s),
      );
      for (const origin of starts) {
        const inside = new Set<number>([origin]);
        const stack = [origin];
        let touchesOuter = false;
        while (stack.length > 0) {
          const s = stack.pop() as number;
          for (const nb of orthoNeighbours(ctx, s)) {
            if (inside.has(nb)) continue;
            if (outer.has(nb) && canBeInside(nb)) {
              touchesOuter = true;
              break;
            }
            if (canBeInside(nb)) {
              inside.add(nb);
              stack.push(nb);
            }
          }
          if (touchesOuter) break;
        }
        if (touchesOuter) continue;
        const border = new Set<number>();
        for (const s of inside) {
          for (const nb of orthoNeighbours(ctx, s)) {
            if (!inside.has(nb)) border.add(nb);
          }
        }
        if (border.size === 0) continue;
        let allOwned = true;
        for (const s of border) {
          if ((ctx.state.cells[s] ?? 0) !== owner) {
            allOwned = false;
            break;
          }
        }
        if (!allOwned) continue;
        const seen = new Set<number>([start]);
        const todo = [start];
        while (todo.length > 0) {
          const s = todo.pop() as number;
          for (const nb of ringNeighbours(s)) {
            if (border.has(nb) && !seen.has(nb)) {
              seen.add(nb);
              todo.push(nb);
            }
          }
        }
        if ([...border].every((s) => seen.has(s))) return true;
      }
      return false;
    },
  };
}

register("bool", "Loop", compileIsLoop as any);
