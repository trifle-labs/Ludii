// @java Core/src/game/functions/ints/math/Mul.java

import { isList, listHead, type LudList } from "@ludii/typescript-language";
import { compileInt, compileRegion, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import type { EvalContext, IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

function foldArith(
  op: string,
  args: readonly IntFn[],
  ctx: EvalContext,
): number {
  const vals = args.map((a) => a.eval(ctx));
  if (vals.length === 0) return 0;
  let acc = vals[0] ?? 0;
  if (vals.length === 1 && op === "-") return -acc;
  for (let i = 1; i < vals.length; i += 1) {
    const v = vals[i] ?? 0;
    switch (op) {
      case "+":
        acc += v;
        break;
      case "-":
        acc -= v;
        break;
      case "*":
        acc *= v;
        break;
      case "/":
        acc = v === 0 ? 0 : Math.trunc(acc / v);
        break;
      case "%":
        acc = v === 0 ? 0 : acc % v;
        break;
    }
  }
  return acc;
}

const INT_ARRAY_HEADS = new Set(["sizes", "results", "values"]);

function foldArrayArith(op: string, vals: readonly number[]): number {
  if (op === "*" || op === "mul") {
    let p = 1;
    for (const v of vals) p *= v;
    return p;
  }
  let s = 0;
  for (const v of vals) s += v;
  return s;
}

export function compileMul(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  const first = positional[0];
  if (
    positional.length === 1 &&
    first &&
    isList(first) &&
    first.delimiter !== "curly" &&
    INT_ARRAY_HEADS.has(listHead(first) ?? "")
  ) {
    const arrFn = compileRegion(first, env);
    return { eval: (ctx) => foldArrayArith("*", arrFn.eval(ctx)) };
  }

  const rawArgs =
    positional.length === 1 &&
    first &&
    isList(first) &&
    first.delimiter === "curly"
      ? first.items
      : positional;
  const args = rawArgs.map((n) => compileInt(n, env));
  return { eval: (ctx) => foldArith("*", args, ctx) };
}

register("int", "*", compileMul as any);
register("int", "mul", compileMul as any);
