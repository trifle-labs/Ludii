// @java Core/src/game/functions/booleans/all/sites/AllSites.java

import { isIdent, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  compileBool,
  compileRegion,
  type CompileEnv,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

function argsAfterSubtype(node: LudList): readonly LudNode[] {
  const head = node.items[0];
  return node.items.slice(head !== undefined && isIdent(head) && head.name === "all" ? 2 : 1);
}

export function compileAllSites(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(argsAfterSubtype(node));
  const regionNode = positional[0];
  if (!regionNode)
    throw new LudemeCompileError("(all Sites ...) needs a region.");
  const region = compileRegion(regionNode, env);
  const ifNode = named.get("if") ?? named.get("If");
  if (!ifNode) throw new LudemeCompileError("(all Sites ...) needs if:.");
  const condition = compileBool(ifNode, env);

  // Java saves context.site(), evaluates the condition with site rebound for
  // each region member, restores site, and returns false on the first failure
  // (AllSites.java:49-67). EvalContext frames are immutable, so restoration is
  // implicit after each child frame.
  return {
    eval: (ctx) => {
      for (const site of region.eval(ctx)) {
        if (!condition.eval(ctx.withFrame({ site }))) return false;
      }
      return true;
    },
  };
}

register("bool", "Sites", compileAllSites as any);
