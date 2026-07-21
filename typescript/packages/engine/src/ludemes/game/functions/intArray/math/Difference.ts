/**
 * Difference.ts
 * @java game/functions/intArray/math/Difference.java
 *
 * (difference <source> <subtraction-array-or-int>) — elements in source not in subtraction.
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction, IntFunction } from "../../../../base.js";
import { isList } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { listHead } from "@ludii/typescript-language";

/** Lower-cased head of a list node (inlined from the deleted bespoke shim). */
function headOf(node: import("@ludii/typescript-language").LudNode): string | undefined {
  if (!isList(node)) return undefined;
  return listHead(node)?.toLowerCase();
}

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

export class Difference implements IntArrayFunction {
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

