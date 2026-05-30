// @java Core/src/game/functions/region/sites/index/SitesPhase.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesPhase(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(2));
  const phNode = positional[0];
  if (!phNode) return { eval: () => [] };
  const phFn = compileInt(phNode, env);
  return {
    eval: (ctx) => {
      if (ctx.board.traj) return [];
      const ph = phFn.eval(ctx);
      const out: number[] = [];
      const n = ctx.board.numSites;
      for (let s = 0; s < n; s += 1) {
        if (
          ctx.board.isOnBoard(s) &&
          (ctx.board.xOf(s) + ctx.board.yOf(s)) % 2 === ph
        ) {
          out.push(s);
        }
      }
      return out;
    },
  };
}

register("region", "Phase", compileSitesPhase as any);
