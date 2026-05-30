// @java Core/src/game/functions/intArray/math/Difference.java

import { isList, listHead, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

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
  return INT_ARRAY_HEADS.has(listHead(node) ?? "");
}

export function compileDifference(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(1));
  const sourceNode = positional[0];
  const subtractionNode = positional[1];
  if (!sourceNode || !subtractionNode) return { eval: () => [] };

  const source = compileRegion(sourceNode, env);
  let subtraction: RegionFn | undefined;
  let intToRemove: ReturnType<typeof compileInt> | undefined;
  if (isIntArrayNode(subtractionNode)) {
    subtraction = compileRegion(subtractionNode, env);
  } else {
    intToRemove = compileInt(subtractionNode, env);
  }

  return {
    eval: (ctx) => {
      // Java Difference.eval removes every value contained in the subtraction
      // array, or removes one matching integer value for the IntFunction arm
      // (Difference.java:77-91, 213-231).
      const out = [...source.eval(ctx)];
      if (subtraction) {
        const remove = subtraction.eval(ctx);
        return out.filter((value) => !remove.includes(value));
      }
      const value = intToRemove ? intToRemove.eval(ctx) : -1;
      const idx = out.indexOf(value);
      if (idx >= 0) out.splice(idx, 1);
      return out;
    },
  };
}

register("region", "difference", compileDifference as any);
