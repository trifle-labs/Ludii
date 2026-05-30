// @java Core/src/game/functions/ints/state/State.java

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
    // @java State.java:150-154: SiteType.use(type, game) supplies the board
    // default when no explicit graph element type is present.
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

function stateAtLevel(ctx: EvalContext, site: number, _level: number): number {
  // The TS State model exposes `stateAtSite()` only; it has no per-stack-level
  // local-state column corresponding to Java `state(loc, level, type)`.
  // @java State.java:73-82
  return ctx.state.stateAtSite(site);
}

export function compileState(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const { args, siteType, boardType } = splitSiteType(positional, env);
  // @java State.java:65-86: resolve loc/container/SiteType, then read the
  // local state; in stacking board-container games an explicit level selects
  // `state(loc, level, type)`.
  const at = named.get("at") ?? args[0];
  if (at) {
    const site = compileInt(at, env);
    const levelNode = named.get("level");
    const levelFn = levelNode ? compileInt(levelNode, env) : undefined;
    const stacking = env.isStacking ?? false;
    return {
      eval: (ctx) => {
        const s = site.eval(ctx);
        if (!canReadSite(ctx, s, siteType, boardType)) return 0;
        if (levelFn && stacking && s < ctx.board.numSites) {
          return stateAtLevel(ctx, s, levelFn.eval(ctx));
        }
        return ctx.state.stateAtSite(s);
      },
    };
  }
  throw new LudemeCompileError('Unknown integer ludeme "state".');
}

register("int", "state", compileState as any);
