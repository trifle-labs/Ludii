// @java Core/src/game/functions/region/sites/index/SitesState.java

import {
  isIdent,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPE_IDENTS = new Set(["Cell", "Vertex", "Edge"]);

export function compileSitesState(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(2));
  const valNode = positional.find(
    (p) => !(isIdent(p) && SITE_TYPE_IDENTS.has(p.name)),
  );
  if (!valNode) return { eval: () => [] };
  const valFn = compileInt(valNode, env);
  return {
    eval: (ctx) => {
      const want = valFn.eval(ctx);
      const out: number[] = [];
      const n = ctx.board.numSites;
      for (let s = 0; s < n; s += 1) {
        if (ctx.board.isOnBoard(s) && ctx.state.stateAtSite(s) === want) {
          out.push(s);
        }
      }
      return out;
    },
  };
}

register("region", "State", compileSitesState as any);
