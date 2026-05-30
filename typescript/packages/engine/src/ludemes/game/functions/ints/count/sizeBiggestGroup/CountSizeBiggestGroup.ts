// @java Core/src/game/functions/ints/count/sizeBiggestGroup/CountSizeBiggestGroup.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  compileRegion,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
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
  const dir = dirNode && isIdent(dirNode) && DIRECTIONS.has(dirNode.name)
    ? [dirNode.name]
    : ["Adjacent"];
  const throughAnyNode = named.get("throughAny");
  const throughAny = throughAnyNode ? compileRegion(throughAnyNode, env) : undefined;
  const ifNode = named.get("If") ?? named.get("if");
  const cond = ifNode ? compileBool(ifNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java CountSizeBiggestGroup.eval flood-fills condition-matching sites and
      // returns the largest group size (CountSizeBiggestGroup.java:87-257).
      let max = 0;
      const candidates = throughAny ? throughAny.eval(ctx) : undefined;
      for (const g of groups(ctx, dir, cond, candidates)) if (g.size > max) max = g.size;
      return max;
    },
  };
}

register("int", "count:SizeBiggestGroup", compileCountSizeBiggestGroup as any);
