// @java Core/src/game/functions/ints/state/Who.java

import { isIdent, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  compileInt,
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import { type EvalContext, type IntFn } from "../../../../../eval/eval-context.js";
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
    // @java Who.java:178-181 / Who.java:276-280: null SiteType preprocesses
    // to the board default before eval.
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

export function compileWho(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const { args, siteType, boardType } = splitSiteType(positional, env);
  const at = named.get("at") ?? args[0];
  if (!at) throw new LudemeCompileError("(who ...) needs an at: site.");
  const site = compileInt(at, env);
  // @java Who.java:85-106: with an explicit level, stacking games read
  // state.who(site, level, type), except level -1 reads top.
  // @java Who.java:236-245: without a level, read ContainerState.who(site,type).
  const levelNode = named.get("level");
  const levelFn = levelNode ? compileInt(levelNode, env) : undefined;
  const stacking = env.isStacking ?? false;
  return {
    eval: (ctx) => {
      const s = site.eval(ctx);
      if (!canReadSite(ctx, s, siteType, boardType)) return 0;
      if (levelFn && stacking) {
        const level = levelFn.eval(ctx);
        return level === -1
          ? (ctx.state.cells[s] ?? 0)
          : ctx.state.whoAtSiteLevel(s, level);
      }
      return ctx.state.cells[s] ?? 0;
    },
  };
}

register("int", "who", compileWho as any);
