// @java Core/src/game/functions/ints/state/What.java

import { isIdent, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  compileInt,
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { EvalContext, IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

type SiteTypeName = "Cell" | "Vertex" | "Edge";

function isSiteTypeNode(node: LudNode | undefined): boolean {
  return (
    node !== undefined &&
    isIdent(node) &&
    (node.name === "Cell" || node.name === "Vertex" || node.name === "Edge")
  );
}

function splitSiteType(
  positional: readonly LudNode[],
  env: CompileEnv,
): { args: readonly LudNode[]; siteType: SiteTypeName; boardType: SiteTypeName } {
  const siteTypeNode = positional.find(isSiteTypeNode);
  const boardType = (env.boardDefaultSiteType ?? "Cell") as SiteTypeName;
  return {
    args: positional.filter((node) => node !== siteTypeNode),
    // @java What.java:144-148: null SiteType is replaced by the board default
    // during preprocess.
    siteType: (siteTypeNode && isIdent(siteTypeNode)
      ? siteTypeNode.name
      : boardType) as SiteTypeName,
    boardType,
  };
}

function canReadSite(
  ctx: EvalContext,
  site: number,
  siteType: SiteTypeName,
  boardType: SiteTypeName,
): boolean {
  if (site < 0 || site >= ctx.state.cells.length) return false;
  const isBoardSite = site < ctx.board.numSites;
  if (siteType === "Cell") return !isBoardSite || boardType === "Cell";
  return isBoardSite && boardType === siteType;
}

export function compileWhat(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const { args, siteType, boardType } = splitSiteType(positional, env);
  const at = named.get("at") ?? args[0];
  if (!at) throw new LudemeCompileError("(what ...) needs an at: site.");
  const site = compileInt(at, env);
  // @java What.java:61-83: resolve the container/default SiteType, then in
  // stacking games read `what(site, level, type)`, with level -1 meaning top.
  // The Java constructor defaults a missing level to 0 (What.java:42-51).
  const levelNode = named.get("level");
  const levelFn = levelNode ? compileInt(levelNode, env) : { eval: () => 0 };
  const stacking = env.isStacking ?? false;
  return {
    eval: (ctx) => {
      const s = site.eval(ctx);
      if (!canReadSite(ctx, s, siteType, boardType)) return 0;
      if (stacking) {
        const level = levelFn.eval(ctx);
        return level === -1
          ? ctx.state.whatAtSite(s)
          : ctx.state.whatAtSiteLevel(s, level);
      }
      return ctx.state.whatAtSite(s);
    },
  };
}

register("int", "what", compileWhat as any);
