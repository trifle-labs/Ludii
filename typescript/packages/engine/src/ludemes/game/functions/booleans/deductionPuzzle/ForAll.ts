// @java Core/src/game/functions/booleans/deductionPuzzle/ForAll.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  type CompileEnv,
  LudemeCompileError,
} from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileDeductionForAll(node: LudList, env: CompileEnv): BoolFn {
  const typeNode = node.items[1];
  const constraintNode = node.items[2];
  if (!typeNode || !isIdent(typeNode) || !constraintNode) {
    throw new LudemeCompileError("(forAll ...) needs a type and constraint.");
  }
  const constraint = compileBool(constraintNode, env);
  const kind = typeNode.name;
  return {
    eval: (ctx) => {
      if (kind === "Hint") {
        for (const h of env.deductionHints ?? []) {
          const from = h.sites[0] ?? -1;
          const to = h.sites[1] ?? -1;
          const sub = ctx.withFrame({
            from,
            to,
            hint: h.hint ?? -1,
            hintRegion: h.sites,
          });
          if (!constraint.eval(sub)) return false;
        }
        return true;
      }
      const n =
        kind === "Vertex" || kind === "Cell" || kind === "Site"
          ? ctx.board.numSites
          : 0;
      for (let i = 0; i < n; i += 1) {
        if (!constraint.eval(ctx.withFrame({ from: i, site: i }))) return false;
      }
      return true;
    },
  };
}

register("bool", "forAll", compileDeductionForAll as any);
