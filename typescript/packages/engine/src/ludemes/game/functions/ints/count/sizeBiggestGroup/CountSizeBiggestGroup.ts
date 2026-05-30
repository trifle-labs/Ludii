// @java Core/src/game/functions/ints/count/sizeBiggestGroup/CountSizeBiggestGroup.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  aroundSites,
  compileBool,
  compileRegion,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  EvalContext,
  IntFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";
import { groups } from "../groups/CountGroups.js";

const SITE_TYPES = new Set(["Cell", "Vertex", "Edge"]);
const DIRECTIONS = new Set(["Adjacent", "All", "Orthogonal", "Diagonal", "OffDiagonal", "SameLayer"]);

export function compileCountSizeBiggestGroup(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  let index = 1;
  const typeNode = positional[index];
  if (typeNode && isIdent(typeNode) && SITE_TYPES.has(typeNode.name)) index += 1;
  const dirNode = positional[index];
  const hasDir = dirNode && isIdent(dirNode) && DIRECTIONS.has(dirNode.name);
  const dir = hasDir ? [dirNode.name] : ["Adjacent"];
  if (hasDir) index += 1;
  // Java constructor argument order is `(count SizeBiggestGroup [type]
  // [directions] [throughAny] If:... isVisible:...)`; Spuzzle uses the
  // positional region form `(count SizeBiggestGroup (sites Around (to)) if:...)`.
  // @java Core/src/game/functions/ints/count/sizeBiggestGroup/CountSizeBiggestGroup.java:55-73
  const throughAnyNode = named.get("throughAny") ?? positional[index];
  const throughAny = throughAnyNode ? compileRegion(throughAnyNode, env) : undefined;
  const ifNode = named.get("If") ?? named.get("if");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;
  const visibleNode = named.get("isVisible");
  const isVisible = visibleNode ? compileBool(visibleNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java CountSizeBiggestGroup.eval flood-fills condition-matching sites and
      // returns the largest group size. With `isVisible:True`, Shibumi-style
      // covered balls are skipped, and two neighbouring visible balls are not
      // connected when they share two occupied upward supports
      // (CountSizeBiggestGroup.java:142-153, 176-238).
      let max = 0;
      const candidates = throughAny ? throughAny.eval(ctx) : undefined;
      const found =
        isVisible?.eval(ctx) === true
          ? visibleGroups(ctx, dir, cond, candidates)
          : groups(ctx, dir, cond, candidates);
      for (const g of found) if (g.size > max) max = g.size;
      return max;
    },
  };
}

register("int", "count:SizeBiggestGroup", compileCountSizeBiggestGroup as any);

function visibleGroups(
  ctx: EvalContext,
  dir: readonly string[],
  cond: BoolFn | undefined,
  candidates?: readonly number[],
): Set<number>[] {
  const all = candidates ?? Array.from({ length: ctx.board.numSites }, (_, i) => i);
  const occupiedUpward = (site: number): Set<number> => {
    const out = new Set<number>();
    for (const up of ctx.board.traj?.steps(site, "Upward") ?? []) {
      if (ctx.state.whatAtSite(up) !== 0) out.add(up);
    }
    return out;
  };
  const covered = (site: number): boolean => {
    const x = ctx.board.xOf(site);
    const y = ctx.board.yOf(site);
    for (let other = 0; other < ctx.board.numSites; other += 1) {
      if (other <= site || ctx.state.whatAtSite(other) === 0) continue;
      if (
        Math.abs(ctx.board.xOf(other) - x) < 1e-9 &&
        Math.abs(ctx.board.yOf(other) - y) < 1e-9
      )
        return true;
    }
    return false;
  };
  const hiddenConnection = (from: number, to: number): boolean => {
    const fromUp = occupiedUpward(from);
    if (fromUp.size < 2) return false;
    let common = 0;
    for (const up of occupiedUpward(to)) {
      if (fromUp.has(up)) common += 1;
      if (common >= 2) return true;
    }
    return false;
  };
  const ok = (site: number) =>
    site >= 0 &&
    site < ctx.board.numSites &&
    !covered(site) &&
    (cond ? cond.eval(ctx.withFrame({ to: site, site })) : ctx.state.isOccupiedSite(site));
  const checked = new Set<number>();
  const out: Set<number>[] = [];
  for (const start of all) {
    if (checked.has(start) || !ok(start)) continue;
    const group = new Set<number>();
    const stack = [start];
    checked.add(start);
    while (stack.length > 0) {
      const site = stack.pop() as number;
      group.add(site);
      for (const nb of aroundSites(ctx, site, dir)) {
        if (checked.has(nb) || hiddenConnection(site, nb) || !ok(nb)) continue;
        checked.add(nb);
        stack.push(nb);
      }
    }
    if (group.size > 0) out.push(group);
  }
  return out;
}
