// @java Core/src/game/functions/ints/size/largePiece/SizeLargePiece.java

import type { LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  dropSiteType,
  largePieceFootprint,
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { EvalContext, IntFn, RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSizeLargePiece(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const args = dropSiteType(positional.slice(1));
  const inNode = named.get("in");
  const atNode = named.get("at") ?? (inNode ? undefined : args[0]);
  if ((inNode ? 1 : 0) + (atNode ? 1 : 0) !== 1) {
    throw new LudemeCompileError(
      "(size LargePiece ...) needs exactly one in: region or at: site.",
    );
  }
  const region = inNode ? compileRegion(inNode, env) : undefined;
  const at = atNode ? compileInt(atNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java SizeLargePiece.eval selects sites through IntArrayFromRegion
      // (SizeLargePiece.java:45-54). For each occupied selected site, ordinary
      // pieces contribute 1 and large pieces contribute Component.locs(...).size
      // from the topology centre with state 0 (SizeLargePiece.java:58-85).
      let count = 0;
      for (const site of selectedSites(ctx, region, at)) {
        if (site < 0 || site >= ctx.state.cells.length) continue;
        const what = ctx.state.whatAtSite(site);
        if (what === 0) continue;
        const walks = env.componentWalkById?.[what];
        if (!walks || walks.length === 0) {
          count += 1;
          continue;
        }
        const centre = centreSite(ctx);
        if (centre < 0) continue;
        count += largePieceFootprint(ctx.board, centre, 0, walks)?.length ?? 0;
      }
      return count;
    },
  };
}

function selectedSites(
  ctx: EvalContext,
  region: RegionFn | undefined,
  at: IntFn | undefined,
): readonly number[] {
  if (region) return region.eval(ctx);
  return at ? [at.eval(ctx)] : [];
}

function centreSite(ctx: EvalContext): number {
  const xs =
    ctx.board.width % 2 === 1
      ? [(ctx.board.width - 1) / 2]
      : [ctx.board.width / 2 - 1, ctx.board.width / 2];
  const ys =
    ctx.board.height % 2 === 1
      ? [(ctx.board.height - 1) / 2]
      : [ctx.board.height / 2 - 1, ctx.board.height / 2];
  for (const y of ys) {
    for (const x of xs) {
      const site = ctx.board.siteAt(x, y);
      if (site >= 0) return site;
    }
  }
  return 0 < ctx.board.numSites ? 0 : -1;
}

register("int", "size:LargePiece", compileSizeLargePiece as any);
