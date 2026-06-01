/**
 * Difference1to1.ts
 * @java game/functions/intArray/math/Difference.java
 *
 * (difference <source> <subtraction-array-or-int>) — elements in source not in subtraction.
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction, IntFunction } from "../../../../base.js";
import { isList } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { registerIntArray1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import {
  compileIntArray1to1,
  compileInt1to1,
  parseArgs1to1,
  headOf,
} from "../../../../../compiler1to1.js";

/** The set of heads that are IntArray-typed (not int-typed). */
const INT_ARRAY_HEADS = new Set([
  "array",
  "difference",
  "if",
  "intersection",
  "players",
  "results",
  "sizes",
  "union",
  "values",
]);

function isIntArrayNode(node: LudNode): boolean {
  if (!isList(node)) return false;
  if (node.delimiter === "curly") return true;
  const h = headOf(node);
  return h !== undefined && INT_ARRAY_HEADS.has(h);
}

export class Difference1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/math/Difference.java — eval(Context) */
  constructor(
    private readonly source: IntArrayFunction,
    private readonly subtraction: IntArrayFunction | null,
    private readonly intToRemove: IntFunction | null,
  ) {}

  public eval(ctx: Context): number[] {
    // @java Difference.java:72-91
    const srcArr = this.source.eval(ctx);
    const out = [...srcArr];
    if (this.subtraction !== null) {
      const subArr = this.subtraction.eval(ctx);
      const subSet = new Set(subArr);
      return out.filter(v => !subSet.has(v));
    } else {
      const intVal = this.intToRemove!.eval(ctx);
      const idx = out.indexOf(intVal);
      if (idx >= 0) out.splice(idx, 1);
      return out;
    }
  }
}

registerIntArray1to1("difference", (node: LudNode, _env: Compile1to1Env): IntArrayFunction => {
  const list = node as LudList;
  const { positional } = parseArgs1to1(list.items);
  const sourceNode = positional[0];
  const subNode = positional[1];
  if (!sourceNode) return { eval: (_ctx: Context) => [] };
  const sourceFn = compileIntArray1to1(sourceNode);
  if (!subNode) return new Difference1to1(sourceFn, null, { eval: (_ctx: Context) => 0 });
  if (isIntArrayNode(subNode)) {
    return new Difference1to1(sourceFn, compileIntArray1to1(subNode), null);
  } else {
    return new Difference1to1(sourceFn, null, compileInt1to1(subNode));
  }
});
