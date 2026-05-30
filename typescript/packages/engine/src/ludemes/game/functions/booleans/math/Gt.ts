// @java Core/src/game/functions/booleans/math/Gt.java

import {
  isIdent,
  isList,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  LudemeCompileError,
} from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

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

export function compileGt(node: LudList, env: CompileEnv): BoolFn {
  const [aNode, bNode] = unwrapBinaryOperands(node.items.slice(1));
  if (!aNode || !bNode)
    throw new LudemeCompileError("(> ...) needs two arguments.");
  const valueA = compileInt(aNode, env);
  const valueB = compileInt(bNode, env);
  // Non-puzzle Java branch delegates to IntFunction.exceeds(), equivalent for
  // this TS IntFn surface to eval(a) > eval(b) (Gt.java:56-64).
  // TODO: deduction puzzles need ContainerDeductionPuzzleState (Gt.java:66-75).
  return { eval: (ctx) => valueA.eval(ctx) > valueB.eval(ctx) };
}

register("bool", ">", compileGt as any);
