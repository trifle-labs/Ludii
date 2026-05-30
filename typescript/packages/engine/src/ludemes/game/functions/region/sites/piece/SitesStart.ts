// @java Core/src/game/functions/region/sites/piece/SitesStart.java

import {
  isList,
  listHead,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type {
  IntFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesStart(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(2));
  const byComp = env.startSitesByComponent;
  const byOwner = env.startSitesByOwner;
  if (!byComp && !byOwner) return { eval: () => [] };
  const spec = positional[0];
  let indexFn: IntFn | undefined;
  if (spec && isList(spec)) {
    if (listHead(spec) === "piece") {
      const inner = spec.items[1];
      if (inner) indexFn = compileInt(inner, env);
    } else {
      indexFn = compileInt(spec, env);
    }
  }
  if (!indexFn) {
    const src = byComp ?? byOwner!;
    return {
      eval: () => {
        const all: number[] = [];
        for (const s of src.values()) all.push(...s);
        return all;
      },
    };
  }
  const idf = indexFn;
  return {
    eval: (ctx) => {
      const idx = idf.eval(ctx);
      const c = byComp?.get(idx);
      if (c !== undefined) return c;
      return byOwner?.get(idx) ?? [];
    },
  };
}

register("region", "Start", compileSitesStart as any);
