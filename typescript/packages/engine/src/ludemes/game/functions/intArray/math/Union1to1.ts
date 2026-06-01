/**
 * Union1to1.ts
 * @java game/functions/intArray/math/Union.java
 *
 * (union <a1> <a2>) or (union {<a1> <a2> ...}) — merge arrays (no duplicate values).
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction } from "../../../../base.js";
import { isList } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { registerIntArray1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { compileIntArray1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";

export class Union1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/math/Union.java — eval(Context) */
  constructor(private readonly arrays: IntArrayFunction[]) {}

  public eval(ctx: Context): number[] {
    // @java Union.java:74-109
    if (this.arrays.length === 0) return [];
    const out = [...this.arrays[0]!.eval(ctx)];
    for (let i = 1; i < this.arrays.length; i++) {
      for (const v of this.arrays[i]!.eval(ctx)) {
        if (!out.includes(v)) out.push(v);
      }
    }
    return out;
  }
}

registerIntArray1to1("union", (node: LudNode, _env: Compile1to1Env): IntArrayFunction => {
  const list = node as LudList;
  const { positional } = parseArgs1to1(list.items);
  // (union {a b ...}) or (union a b)
  let arrayNodes: readonly LudNode[];
  if (
    positional.length === 1 &&
    positional[0] &&
    isList(positional[0]) &&
    positional[0].delimiter === "curly"
  ) {
    arrayNodes = positional[0].items;
  } else {
    arrayNodes = positional;
  }
  const arrays = arrayNodes.map(n => compileIntArray1to1(n));
  return new Union1to1(arrays);
});
