// @java Core/src/game/functions/booleans/is/integer/IsFlat.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  dropSiteType,
  lastToSite,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsFlat(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // (is Flat [<site>]) — Shibumi pyramidal support test. Mirrors Java
  // IsFlat: a vertex on the base layer is always flat; otherwise it is flat
  // iff every vertex directly beneath it (one layer down, at x±0.5, y±0.5)
  // is occupied. The four supports are recovered geometrically from site
  // elevation (z) because the TS graph stores no cross-layer edges. On
  // planar boards every site has z==0 (layer 0), so this is always true —
  // identical to the previous unconditional behaviour, hence no regression.
  const siteNode = dropSiteType(positional)[0];
  const siteFn = siteNode ? compileInt(siteNode, env) : undefined;
  const DZ = 1 / Math.SQRT2;
  const TOL = 0.01;
  return {
    eval: (ctx) => {
      const site = siteFn
        ? siteFn.eval(ctx)
        : ctx.frame.to ?? lastToSite(ctx);
      if (site < 0 || site >= ctx.board.numSites) return true;
      const layer = Math.round(ctx.board.zOf(site) / DZ);
      if (layer <= 0) return true;
      const sx = ctx.board.xOf(site);
      const sy = ctx.board.yOf(site);
      const targetZ = (layer - 1) * DZ;
      for (let s = 0; s < ctx.board.numSites; s += 1) {
        if (Math.abs(ctx.board.zOf(s) - targetZ) > TOL) continue;
        const dx = Math.abs(ctx.board.xOf(s) - sx);
        const dy = Math.abs(ctx.board.yOf(s) - sy);
        if (Math.abs(dx - 0.5) > TOL || Math.abs(dy - 0.5) > TOL) continue;
        // A supporting vertex directly beneath the target; if empty the
        // piece would not rest flat.
        if (ctx.state.isEmptySite(s)) return false;
      }
      return true;
    },
  };
}

register("bool", "Flat", compileIsFlat as any);
