// @java Core/src/game/functions/region/sites/moves/SitesTo.java

import {
  isList,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileMoves,
  lastToSite,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesTo(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(2));
  const toMovesNode = positional.find((p) => isList(p));
  if (toMovesNode) {
    const mv = compileMoves(toMovesNode, env);
    return {
      eval: (ctx) => {
        const out = new Set<number>();
        for (const m of mv.generate(ctx)) {
          const s = m.toNonDecision();
          if (s >= 0) out.add(s);
        }
        return [...out];
      },
    };
  }
  return {
    eval: (ctx) => {
      const s = ctx.frame.to ?? lastToSite(ctx);
      return s >= 0 ? [s] : [];
    },
  };
}

register("region", "To", compileSitesTo as any);
