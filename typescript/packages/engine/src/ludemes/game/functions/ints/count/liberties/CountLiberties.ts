// @java Core/src/game/functions/ints/count/liberties/CountLiberties.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  aroundSites,
  compileBool,
  compileInt,
  lastToSite,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { BoolFn, EvalContext, IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPES = new Set(["Cell", "Vertex", "Edge"]);
const DIRECTIONS = new Set(["Adjacent", "All", "Orthogonal", "Diagonal", "OffDiagonal", "SameLayer"]);

export function compileCountLiberties(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  let index = 1;
  const typeNode = positional[index];
  if (typeNode && isIdent(typeNode) && SITE_TYPES.has(typeNode.name)) index += 1;
  const dirNode = positional[index];
  const dir = dirNode && isIdent(dirNode) && DIRECTIONS.has(dirNode.name)
    ? [dirNode.name]
    : ["Adjacent"];
  const atNode = named.get("at");
  const at = atNode ? compileInt(atNode, env) : undefined;
  const ifNode = named.get("If") ?? named.get("if");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java CountLiberties.eval starts at at:(...) or LastTo, flood-fills sites
      // with the same what (gated by If), then counts distinct empty adjacent
      // sites around that group (CountLiberties.java:74-164).
      const start = at ? at.eval(ctx) : lastToSite(ctx);
      return liberties(ctx, start, dir, cond);
    },
  };
}

function liberties(
  ctx: EvalContext,
  start: number,
  dir: readonly string[],
  cond: BoolFn | undefined,
): number {
  if (start < 0 || start >= ctx.board.numSites) return 0;
  const what = ctx.state.whatAtSite(start);
  const ok = (s: number) =>
    s >= 0 &&
    s < ctx.board.numSites &&
    ctx.board.isOnBoard(s) &&
    ctx.state.whatAtSite(s) === what &&
    (cond ? cond.eval(ctx.withFrame({ from: start, to: s })) : true);
  if (!ok(start)) return 0;
  const group = new Set<number>();
  const stack = [start];
  while (stack.length > 0) {
    const site = stack.pop() as number;
    if (group.has(site) || !ok(site)) continue;
    group.add(site);
    for (const n of aroundSites(ctx, site, dir)) if (!group.has(n)) stack.push(n);
  }
  const libs = new Set<number>();
  for (const s of group) {
    for (const n of aroundSites(ctx, s, dir)) {
      if (!group.has(n) && ctx.state.whatAtSite(n) === 0) libs.add(n);
    }
  }
  return libs.size;
}

register("int", "count:Liberties", compileCountLiberties as any);
