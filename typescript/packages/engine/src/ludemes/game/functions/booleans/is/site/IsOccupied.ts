// @java Core/src/game/functions/booleans/is/site/IsOccupied.java

import {
  isIdent,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import type { SiteType } from "../../../../../../action/site-type.js";
import {
  compileInt,
  type CompileEnv,
  dropSiteType,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsOccupied(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const siteType = siteTypeArg(positional) ?? env.boardDefaultSiteType ?? "Cell";
  const explicitSiteType = siteTypeArg(positional) !== undefined;
  const siteNode = dropSiteType(positional)[0];
  if (!siteNode)
    throw new LudemeCompileError("(is Occupied <site>) needs a site.");
  const site = compileInt(siteNode, env);
  return {
    eval: (ctx) => {
      const s = site.eval(ctx);
      if (!isAddressableSite(s, siteType, explicitSiteType, ctx, env))
        return false;
      // Java checks the resolved container and tests ContainerState.what(site,
      // type) != 0. TS preserves the current what/count-aware default-cell
      // behavior while rejecting explicit non-default board-site spaces the flat
      // state does not represent. @java IsOccupied.java:53-59, 106-109
      return ctx.state.isOccupiedSite(s);
    },
  };
}

function siteTypeArg(positional: readonly LudNode[]): SiteType | undefined {
  const node = positional[0];
  return node !== undefined && isIdent(node) &&
    (node.name === "Cell" || node.name === "Vertex" || node.name === "Edge")
    ? node.name
    : undefined;
}

function isAddressableSite(
  site: number,
  siteType: SiteType,
  explicitSiteType: boolean,
  ctx: Parameters<BoolFn["eval"]>[0],
  env: CompileEnv,
): boolean {
  if (site < 0 || site >= ctx.state.cells.length) return false;
  if (site < env.board.numSites && !ctx.board.isOnBoard(site)) return false;
  const boardType = env.boardDefaultSiteType ?? "Cell";
  if (!explicitSiteType || siteType === boardType) return true;
  if (siteType === "Cell" && site >= env.board.numSites) return true;
  return false;
}

register("bool", "Occupied", compileIsOccupied as any);
