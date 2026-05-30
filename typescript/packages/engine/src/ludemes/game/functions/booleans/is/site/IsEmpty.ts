// @java Core/src/game/functions/booleans/is/site/IsEmpty.java

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

export function compileIsEmpty(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const siteType = siteTypeArg(positional) ?? env.boardDefaultSiteType ?? "Cell";
  const explicitSiteType = siteTypeArg(positional) !== undefined;
  const siteNode = dropSiteType(positional)[0];
  if (!siteNode)
    throw new LudemeCompileError("(is Empty <site>) needs a site.");
  const site = compileInt(siteNode, env);
  return {
    eval: (ctx) => {
      const s = site.eval(ctx);
      if (!isAddressableSite(s, siteType, explicitSiteType, ctx, env))
        return false;
      // Java resolves the container id, bounds-checks board-container sites for
      // the resolved SiteType, then asks ContainerState.isEmpty(site, type).
      // TS has one flat container, so the default site type preserves the
      // existing what/count-aware state check; explicit non-default board-site
      // queries are rejected because that state space is not modelled.
      // @java IsEmpty.java:54-65, 112-116
      return ctx.state.isEmptySite(s);
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
  // Hand/store sites are appended after board play-sites and behave like Cell
  // containers in the TS state; keep explicit Cell checks working there.
  if (siteType === "Cell" && site >= env.board.numSites) return true;
  return false;
}

register("bool", "Empty", compileIsEmpty as any);
