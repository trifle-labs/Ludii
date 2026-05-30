// @java Core/src/game/functions/region/sites/moves/SitesFrom.java

import {
  isList,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileMoves,
  lastFromSite,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesFrom(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(2));
  const fromMovesNode = positional.find((p) => isList(p));
  if (fromMovesNode) {
    const mv = compileMoves(fromMovesNode, env);
    return {
      eval: (ctx) => {
        const out = new Set<number>();
        for (const m of mv.generate(ctx)) {
          const s = m.fromNonDecision();
          if (s >= 0) out.add(s);
        }
        return [...out];
      },
    };
  }
  return {
    eval: (ctx) => {
      const s = ctx.frame.from ?? -1;
      return s >= 0 ? [s] : [];
    },
  };
}

register("region", "From", compileSitesFrom as any);
