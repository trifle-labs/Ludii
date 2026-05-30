// @java Core/src/game/functions/ints/count/groups/CountGroups.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  aroundSites,
  compileBool,
  compileInt,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { BoolFn, EvalContext, IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPES = new Set(["Cell", "Vertex", "Edge"]);
const DIRECTIONS = new Set(["Adjacent", "All", "Orthogonal", "Diagonal", "OffDiagonal", "SameLayer"]);

export function compileCountGroups(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  let index = 1;
  const typeNode = positional[index];
  if (typeNode && isIdent(typeNode) && SITE_TYPES.has(typeNode.name)) index += 1;
  const dirNode = positional[index];
  const dir = dirNode && isIdent(dirNode) && DIRECTIONS.has(dirNode.name)
    ? [dirNode.name]
    : ["Adjacent"];
  const ifNode = named.get("If") ?? named.get("if");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;
  const minNode = named.get("min");
  const minFn = minNode ? compileInt(minNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java CountGroups.eval builds candidate sites by evaluating condition
      // with context.to set, flood-fills through the selected directions, and
      // counts groups whose size >= min (CountGroups.java:80-172).
      const min = minFn ? minFn.eval(ctx) : 0;
      return groups(ctx, dir, cond).filter((g) => g.size >= min).length;
    },
  };
}

export function groups(
  ctx: EvalContext,
  dir: readonly string[],
  cond: BoolFn | undefined,
  candidates?: readonly number[],
): Set<number>[] {
  const all = candidates ?? Array.from({ length: ctx.board.numSites }, (_, i) => i);
  const ok = (s: number) =>
    s >= 0 &&
    s < ctx.board.numSites &&
    ctx.board.isOnBoard(s) &&
    (cond ? cond.eval(ctx.withFrame({ to: s })) : ctx.state.isOccupiedSite(s));
  const todo = all.filter(ok);
  const checked = new Set<number>();
  const out: Set<number>[] = [];
  for (const start of todo) {
    if (checked.has(start)) continue;
    const group = new Set<number>();
    const stack = [start];
    while (stack.length > 0) {
      const site = stack.pop() as number;
      if (group.has(site) || !ok(site)) continue;
      group.add(site);
      checked.add(site);
      for (const n of aroundSites(ctx, site, dir)) {
        if (!group.has(n) && !checked.has(n) && ok(n)) stack.push(n);
      }
    }
    if (group.size > 0) out.push(group);
  }
  return out;
}

register("int", "count:Groups", compileCountGroups as any);
