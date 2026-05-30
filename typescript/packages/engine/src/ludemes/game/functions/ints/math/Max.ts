// @java Core/src/game/functions/ints/math/Max.java

import { isIdent, isList, type LudList } from "@ludii/typescript-language";
import { compileInt, compileRegion, parseArgs, type CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn, RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileMax(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  const pick = "max";
  const first = positional[0];
  if (positional.length >= 2 && !(first && isIdent(first))) {
    const intFns: IntFn[] = [];
    let ok = true;
    for (const p of positional) {
      try {
        intFns.push(compileInt(p, env));
      } catch {
        ok = false;
        break;
      }
    }
    if (ok && intFns.length > 0) {
      const fns = intFns;
      return {
        eval: (ctx) => {
          let acc = fns[0]!.eval(ctx);
          for (let i = 1; i < fns.length; i += 1) {
            const v = fns[i]!.eval(ctx);
            acc = pick === "max" ? Math.max(acc, v) : Math.min(acc, v);
          }
          return acc;
        },
      };
    }
  }
  let listFn: RegionFn | undefined;
  if (first && isList(first)) {
    try {
      listFn = compileRegion(first, env);
    } catch {
      listFn = undefined;
    }
  }
  if (!listFn) return { eval: () => 0 };
  const lf = listFn;
  return {
    eval: (ctx) => {
      const vals = lf.eval(ctx);
      if (vals.length === 0) return 0;
      return pick === "max" ? Math.max(...vals) : Math.min(...vals);
    },
  };
}

register("int", "max", compileMax as any);
