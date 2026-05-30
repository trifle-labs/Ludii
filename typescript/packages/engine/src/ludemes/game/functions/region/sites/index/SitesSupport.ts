// @java Core/src/game/functions/region/sites/index/SitesSupport.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileInt,
  dropSiteType,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { IntFn, RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SUPPORT_DIRS: readonly string[] = ["UNW", "USW", "UNE", "USE"];

export function compileSitesSupport(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(2));
  const whatNode = dropSiteType(positional)[0];
  const whatFn: IntFn | undefined = whatNode
    ? compileInt(whatNode, env)
    : undefined;

  return {
    eval: (ctx) => {
      // Java evaluates the optional piece type once, defaulting to -1
      // (SitesSupport.java:55-62), then keeps a site if one of UNW/USW/UNE/USE
      // reaches a matching occupied support (SitesSupport.java:64-108).
      const traj = ctx.board.traj;
      if (!traj) return [];
      const value = whatFn ? whatFn.eval(ctx) : -1;
      const out: number[] = [];
      for (let site = 0; site < ctx.board.numSites; site += 1) {
        let hasValidDirection = false;
        for (const dir of SUPPORT_DIRS) {
          const steps = traj.steps(site, dir);
          if (steps.length === 0) continue;
          const to = steps[0] as number;
          const what = ctx.state.whatAtSite(to);
          if (value === -1 ? what !== 0 : value >= 0 && what === value) {
            hasValidDirection = true;
            break;
          }
        }
        if (hasValidDirection) out.push(site);
      }
      return out;
    },
  };
}

register("region", "sites:Support", compileSitesSupport as any);
