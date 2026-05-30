// @java Core/src/game/functions/ints/size/connection/SizeGroup.java

import {
  isIdent,
  isList,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";
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
export function compileSizeGroup(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  let index = 1; // skip Group discriminator
  const typeNode = positional[index];
  if (typeNode && isIdent(typeNode) && SITE_TYPES.has(typeNode.name)) index += 1;

  const atNode = named.get("at") ?? positional[index];
  if (atNode === positional[index]) index += 1;
  const at = atNode ? compileInt(atNode, env) : undefined;
  const dirNode = positional[index];
  const dir = directionTokens(dirNode);
  const ifNode = named.get("If") ?? named.get("if");
  const condition = ifNode ? compileBool(ifNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java SizeGroup.eval seeds at `at`, evaluates the optional condition with
      // context.to set to the seed, records the seed's `what`, then flood-fills
      // along the chosen directions, matching either the condition or the same
      // `what` when no condition exists (SizeGroup.java:73-137).
      const start = at ? at.eval(ctx) : -1;
      return sizeGroup(ctx, start, dir, condition);
    },
  };
}

function sizeGroup(
  ctx: EvalContext,
  start: number,
  dir: readonly string[],
  condition: BoolFn | undefined,
): number {
  if (start < 0 || start >= ctx.state.cells.length) return 0;
  const group = new Set<number>();
  if (!condition || condition.eval(ctx.withFrame({ to: start, site: start }))) {
    group.add(start);
  }
  const what = ctx.state.whatAtSite(start);
  if (group.size === 0) return 0;

  const explored = new Set<number>();
  const queue = [start];
  for (let i = 0; i < queue.length; i += 1) {
    const site = queue[i] as number;
    for (const to of aroundSites(ctx, site, dir)) {
      if (group.has(to)) continue;
      const accepts = condition
        ? condition.eval(ctx.withFrame({ from: start, to, site: to }))
        : ctx.state.whatAtSite(to) === what;
      if (accepts) {
        group.add(to);
        queue.push(to);
      }
    }
    explored.add(site);
    if (explored.size === group.size) break;
  }
  return group.size;
}

function directionTokens(node: LudNode | undefined): readonly string[] {
  if (!node) return ["Adjacent"];
  if (isIdent(node)) {
    if (node.name === "~" || node.name.startsWith("#")) return ["Adjacent"];
    return [normaliseDirection(node.name)];
  }
  if (isList(node) && listHead(node) === "directions") {
    const tokens = node.items.slice(1).flatMap(directionTokens);
    return tokens.length > 0 ? tokens : ["Adjacent"];
  }
  if (isList(node) && node.delimiter === "curly") {
    const tokens = node.items.flatMap(directionTokens);
    return tokens.length > 0 ? tokens : ["Adjacent"];
  }
  return ["Adjacent"];
}

function normaliseDirection(name: string): string {
  if (name === "Orthogonals") return "Orthogonal";
  if (name === "Diagonals") return "Diagonal";
  return name;
}

register("int", "size:Group", compileSizeGroup as any);
