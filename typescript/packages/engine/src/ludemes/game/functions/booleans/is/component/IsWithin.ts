// @java Core/src/game/functions/booleans/is/component/IsWithin.java

import {
  isList,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  compileRegion,
  lastToSite,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsWithin(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  // (is Within <pieceId> [type] <locn>|in:<region>) — the specific
  // component type currently occupies a site in the region (Java IsWithin).
  // `pieceId` is a component `what` (typically `(id "Name")`); the area to
  // test comes from `in:`, else a positional location/region, else defaults
  // to the last-to site. True iff some target site holds exactly that what.
  const pieceNode = positional[0];
  if (!pieceNode) return { eval: () => false };
  const pieceFn = compileInt(pieceNode, env);
  const inNode = named.get("in");
  const locNode = positional[1];
  let areaFn: RegionFn;
  if (inNode) {
    areaFn = compileRegion(inNode, env);
  } else if (locNode && isList(locNode)) {
    areaFn = compileRegion(locNode, env);
  } else if (locNode) {
    const siteFn = compileInt(locNode, env);
    areaFn = { eval: (ctx) => { const s = siteFn.eval(ctx); return s >= 0 ? [s] : []; } };
  } else {
    areaFn = { eval: (ctx) => { const s = lastToSite(ctx); return s >= 0 ? [s] : []; } };
  }
  return {
    eval: (ctx) => {
      const pid = pieceFn.eval(ctx);
      if (pid < 0) return false;
      return areaFn
        .eval(ctx)
        .some((s) => s >= 0 && ctx.state.whatAtSite(s) === pid);
    },
  };
}

register("bool", "Within", compileIsWithin as any);
