// @java Core/src/game/functions/booleans/is/connect/IsBlocked.java

import {
  isIdent,
  isList,
  isNumber,
  type LudList,
} from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  compileRegion,
  type CompileEnv,
  cornerSites,
  orthoNeighbours,
  parseArgs,
  resolveRole,
  sideSites,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  IntFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsBlocked(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // Java IsBlocked.eval gathers the role's regions, then returns false as
  // soon as one start in the first region can flood through empty or same-role
  // sites to the required number of goal regions (Core/src/game/functions/
  // booleans/is/connect/IsBlocked.java:119-185, 186-268).
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
  let countFn: IntFn | undefined;
  let roleName: string | undefined;
  let regionFns: RegionFn[] | undefined;
  const dirTokens: string[] = [];
  for (const p of positional) {
    if (isNumber(p)) {
      countFn = compileInt(p, env);
    } else if (isList(p) && p.delimiter === "curly") {
      regionFns = p.items
        .filter((it) => isList(it))
        .map((it) => compileRegion(it, env));
    } else if (isList(p)) {
      if (!regionFns) regionFns = [compileRegion(p, env)];
    } else if (isIdent(p)) {
      if (p.name === "Cell" || p.name === "Vertex" || p.name === "Edge") {
        continue;
      }
      if (DIRS.has(p.name)) {
        dirTokens.push(p.name);
        continue;
      }
      if (p.name === "Sides" || p.name === "SidesNoCorners") {
        const noCorners = p.name === "SidesNoCorners";
        regionFns = [
          { eval: (ctx) => sideSites(ctx, "N").filter((s) => !noCorners || !cornerSites(ctx).includes(s)) },
          { eval: (ctx) => sideSites(ctx, "E").filter((s) => !noCorners || !cornerSites(ctx).includes(s)) },
          { eval: (ctx) => sideSites(ctx, "S").filter((s) => !noCorners || !cornerSites(ctx).includes(s)) },
          { eval: (ctx) => sideSites(ctx, "W").filter((s) => !noCorners || !cornerSites(ctx).includes(s)) },
        ];
        continue;
      }
      roleName = p.name;
    }
  }
  return {
    eval: (ctx) => {
      const who = roleName ? resolveRole(roleName, ctx) : ctx.mover;
      const regions =
        regionFns ??
        (who > 0 ? env.playerRegionList?.get(who) : undefined) ??
        [];
      if (regions.length === 0) return false;
      const goalRegions = regions
        .map((r) => [...new Set(r.eval(ctx).filter((s) => s >= 0))])
        .filter((r) => r.length > 0);
      if (goalRegions.length === 0) return false;
      const need = countFn ? countFn.eval(ctx) : goalRegions.length;
      if (need <= 1) return false;
      const neighbours = (s: number): number[] =>
        dirTokens.length > 0 ? aroundSites(ctx, s, dirTokens) : orthoNeighbours(ctx, s);
      const passable = (s: number): boolean =>
        s >= 0 &&
        s < ctx.state.cells.length &&
        ((ctx.state.cells[s] ?? 0) === who || ctx.state.whatAtSite(s) === 0);
      const first = goalRegions[0] as number[];
      for (const from of first) {
        if (!passable(from)) continue;
        const remaining = goalRegions.slice(1).map((r) => new Set(r));
        let connected = 1;
        const seen = new Set<number>([from]);
        const stack = [from];
        while (stack.length > 0) {
          const s = stack.pop() as number;
          for (const nb of neighbours(s)) {
            if (seen.has(nb) || !passable(nb)) continue;
            seen.add(nb);
            stack.push(nb);
            for (let i = remaining.length - 1; i >= 0; i -= 1) {
              if ((remaining[i] as Set<number>).has(nb)) {
                connected += 1;
                remaining.splice(i, 1);
              }
            }
            if (connected >= need) return false;
          }
        }
      }
      return true;
    },
  };
}

register("bool", "Blocked", compileIsBlocked as any);
