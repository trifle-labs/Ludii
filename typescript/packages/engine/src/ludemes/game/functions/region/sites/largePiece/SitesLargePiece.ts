// @java Core/src/game/functions/region/sites/largePiece/SitesLargePiece.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileInt,
  dropSiteType,
  largePieceFootprint,
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesLargePiece(
  node: LudList,
  env: CompileEnv,
): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  const atNode = named.get("at") ?? dropSiteType(positional)[0];
  if (!atNode) {
    throw new LudemeCompileError("(sites LargePiece ...) needs at:<site>.");
  }
  const atFn = compileInt(atNode, env);

  return {
    eval: (ctx) => {
      // SitesLargePiece.eval returns empty for off-board anchors, empty anchors,
      // and then either the singleton anchor for ordinary pieces or the
      // Component.locs footprint for large pieces (SitesLargePiece.java:49-82).
      const site = atFn.eval(ctx);
      const sitesOccupied: number[] = [];
      if (site >= ctx.board.numSites) return sitesOccupied;
      const what = ctx.state.whatAtSite(site);
      if (what === 0) return sitesOccupied;
      const walks = env.componentWalkById?.[what];
      if (!walks || walks.length === 0) return [site];
      const localState = ctx.state.stateAtSite(site);
      const locs = largePieceFootprint(ctx.board, site, localState, walks);
      if (!locs) return sitesOccupied;
      for (const loc of locs) {
        if (!sitesOccupied.includes(loc)) sitesOccupied.push(loc);
      }
      return sitesOccupied;
    },
  };
}

register("region", "sites:LargePiece", compileSitesLargePiece as any);
