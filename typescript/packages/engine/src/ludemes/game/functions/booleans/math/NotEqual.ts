// @java Core/src/game/functions/booleans/math/NotEqual.java

import {
  isIdent,
  isList,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  type CompileEnv,
  LudemeCompileError,
} from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

const REGION_HEADS = new Set([
  "sites",
  "union",
  "intersection",
  "difference",
  "expand",
  "forEach",
  "values",
]);

function isRegionNode(node: LudNode): boolean {
  if (!isList(node)) return false;
  if (node.delimiter === "curly") return true;
  return REGION_HEADS.has(listHead(node) ?? "");
}

function unwrapBinaryOperands(rest: readonly LudNode[]): [LudNode?, LudNode?] {
  let a = rest[0];
  let b = rest[1];
  if (
    b === undefined &&
    a &&
    isList(a) &&
    a.delimiter === "round" &&
    a.items.length === 2 &&
    a.items[0] &&
    !isIdent(a.items[0])
  ) {
    b = a.items[1];
    a = a.items[0];
  }
  return [a, b];
}

function equalSets(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const bs = new Set(b);
  for (const site of a) if (!bs.has(site)) return false;
  return true;
}

export function compileNotEqual(node: LudList, env: CompileEnv): BoolFn {
  const [aNode, bNode] = unwrapBinaryOperands(node.items.slice(1));
  if (!aNode || !bNode)
    throw new LudemeCompileError("(!= ...) needs two arguments.");

  if (isRegionNode(aNode) || isRegionNode(bNode)) {
    const regionA = compileRegion(aNode, env);
    const regionB = compileRegion(bNode, env);
    // Java's region constructor is the negation of Equals' set comparison
    // (NotEqual.java:86-96, 101-128).
    return { eval: (ctx) => !equalSets(regionA.eval(ctx), regionB.eval(ctx)) };
  }

  const valueA = compileInt(aNode, env);
  const valueB = compileInt(bNode, env);
  // Java compares the two IntFunction evals (NotEqual.java:56-74, 101-109).
  return { eval: (ctx) => valueA.eval(ctx) !== valueB.eval(ctx) };
}

register("bool", "!=", compileNotEqual as any);
