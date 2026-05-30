// @java Core/src/game/functions/ints/board/where/Where.java

import {
  isIdent,
  isList,
  isString,
  type LudNode,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  LudemeCompileError,
  parseArgs,
  resolveRole,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import {
  OFF,
  type BoolFn,
  type EvalContext,
  type IntFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

type SiteTypeName = "Cell" | "Vertex" | "Edge";

const UNDEFINED = -1;
const NO_PIECE = 0;

function isSiteTypeNode(node: LudNode | undefined): node is LudNode {
  return (
    node !== undefined &&
    isIdent(node) &&
    (node.name === "Cell" || node.name === "Vertex" || node.name === "Edge")
  );
}

function splitSiteType(
  positional: readonly LudNode[],
  env: CompileEnv,
): { args: readonly LudNode[]; siteType: SiteTypeName } {
  const siteTypeNode = positional.find(isSiteTypeNode);
  return {
    args: positional.filter((node) => node !== siteTypeNode),
    // @java WhereSite.java:313-314 / WhereLevel.java:366: null SiteType is
    // preprocessed to the board default.
    siteType: (siteTypeNode && isIdent(siteTypeNode)
      ? siteTypeNode.name
      : (env.boardDefaultSiteType ?? "Cell")) as SiteTypeName,
  };
}

function isReadableSite(
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

function stackLevelState(ctx: EvalContext, site: number, _level: number): number {
  // The TS State currently stores a single local-state value per site, not a
  // per-stack-level local-state column. This is the closest available analogue
  // for Java cs.state(site, level, type). @java WhereSite.java:142-145,
  // WhereLevel.java:158-164
  return ctx.state.stateAtSite(site);
}

function matchesLocalState(
  ctx: EvalContext,
  site: number,
  level: number | undefined,
  localState: number,
): boolean {
  if (localState === UNDEFINED) return true;
  return level === undefined
    ? ctx.state.stateAtSite(site) === localState
    : stackLevelState(ctx, site, level) === localState;
}

function whatAtLevel(ctx: EvalContext, site: number, level: number): number {
  return level === -1
    ? ctx.state.whatAtSite(site)
    : ctx.state.whatAtSiteLevel(site, level);
}

function componentCandidates(
  env: CompileEnv,
  namePiece: string,
): { what: number; owner: number }[] {
  const out: { what: number; owner: number }[] = [];
  const seen = new Set<number>();
  // @java WhereSite.java:322-328 / WhereLevel.java:377-383: precompute every
  // component whose full name contains the requested piece name.
  for (const [label, what] of env.componentIdByLabel ?? []) {
    if (seen.has(what) || !label.includes(namePiece)) continue;
    seen.add(what);
    out.push({ what, owner: env.componentOwnerById?.[what] ?? -1 });
  }
  out.sort((a, b) => a.what - b.what);
  return out;
}

function roleOrIntFn(node: LudNode | undefined): IntFn {
  if (node && isIdent(node)) {
    if (node.name === "Neutral" || node.name === "Shared") {
      return { eval: (ctx) => ctx.context.game.numPlayers + 1 };
    }
    return { eval: (ctx) => resolveRole(node.name, ctx) };
  }
  throw new LudemeCompileError("(where \"Name\" ...) needs an owner role/int.");
}

function compileOwner(node: LudNode | undefined, env: CompileEnv): IntFn {
  if (node && isIdent(node)) return roleOrIntFn(node);
  if (node) return compileInt(node, env);
  return { eval: (ctx) => ctx.mover };
}

function targetWhatFromName(
  ctx: EvalContext,
  candidates: readonly { what: number; owner: number }[],
  playerFn: IntFn,
): number {
  const playerId = playerFn.eval(ctx);
  // @java WhereSite.java:159-167 / WhereLevel.java:176-184: select the first
  // matching component owned by the requested player, then search for its what.
  for (const c of candidates) if (c.owner === playerId) return c.what;
  return OFF;
}

function compileWhereSiteByWhat(
  whatFn: IntFn,
  siteType: SiteTypeName,
  boardType: SiteTypeName,
  stacking: boolean,
): IntFn {
  return {
    eval: (ctx) => {
      const what = whatFn.eval(ctx);
      // @java WhereSite.java:133-136: NO_PIECE or below means OFF.
      if (what <= NO_PIECE) return OFF;
      const numSite = ctx.board.numSites;
      for (let site = 0; site < numSite; site += 1) {
        if (!isReadableSite(ctx, site, siteType, boardType)) continue;
        if (stacking) {
          // @java WhereSite.java:138-146: scan every level of every board site.
          const stackSize = ctx.state.stackSize(site);
          for (let level = 0; level < stackSize; level += 1) {
            if (whatAtLevel(ctx, site, level) === what) return site;
          }
        } else if (ctx.state.whatAtSite(site) === what) {
          // @java WhereSite.java:149-154: flat ContainerState.what(site,type).
          return site;
        }
      }
      return OFF;
    },
  };
}

function compileWhereSiteByName(
  candidates: readonly { what: number; owner: number }[],
  playerFn: IntFn,
  localStateFn: IntFn | undefined,
  siteType: SiteTypeName,
  boardType: SiteTypeName,
  stacking: boolean,
): IntFn {
  return {
    eval: (ctx) => {
      const what = targetWhatFromName(ctx, candidates, playerFn);
      if (what <= OFF) return OFF;
      const localState = localStateFn ? localStateFn.eval(ctx) : UNDEFINED;
      const numSite = ctx.board.numSites;
      for (let site = 0; site < numSite; site += 1) {
        if (!isReadableSite(ctx, site, siteType, boardType)) continue;
        if (stacking) {
          // @java WhereSite.java:174-185: search owned candidate sites' levels;
          // TS has no owned index, so this scans board sites and checks `what`.
          const stackSize = ctx.state.stackSize(site);
          for (let level = 0; level < stackSize; level += 1) {
            if (
              whatAtLevel(ctx, site, level) === what &&
              matchesLocalState(ctx, site, level, localState)
            ) return site;
          }
        } else if (
          ctx.state.whatAtSite(site) === what &&
          matchesLocalState(ctx, site, undefined, localState)
        ) {
          // @java WhereSite.java:190-195: flat site must match what and state.
          return site;
        }
      }
      return OFF;
    },
  };
}

function compileWhereLevelByWhat(
  whatFn: IntFn,
  siteFn: IntFn,
  fromTopFn: BoolFn,
  siteType: SiteTypeName,
  boardType: SiteTypeName,
): IntFn {
  return {
    eval: (ctx) => {
      const site = siteFn.eval(ctx);
      // @java WhereLevel.java:141-146: only board sites are valid.
      if (
        site < 0 ||
        site >= ctx.board.numSites ||
        !isReadableSite(ctx, site, siteType, boardType)
      ) {
        return OFF;
      }
      const what = whatFn.eval(ctx);
      if (what <= NO_PIECE) return OFF; // @java WhereLevel.java:152-155
      const topLevel = ctx.state.stackSize(site) - 1;
      if (fromTopFn.eval(ctx)) {
        // @java WhereLevel.java:158-164: scan downward from top.
        for (let level = topLevel; level >= 0; level -= 1)
          if (whatAtLevel(ctx, site, level) === what) return level;
      } else {
        // @java WhereLevel.java:166-171: scan upward from bottom.
        for (let level = 0; level <= topLevel; level += 1)
          if (whatAtLevel(ctx, site, level) === what) return level;
      }
      return OFF;
    },
  };
}

function compileWhereLevelByName(
  candidates: readonly { what: number; owner: number }[],
  playerFn: IntFn,
  localStateFn: IntFn | undefined,
  siteFn: IntFn,
  fromTopFn: BoolFn,
  siteType: SiteTypeName,
  boardType: SiteTypeName,
): IntFn {
  return {
    eval: (ctx) => {
      const site = siteFn.eval(ctx);
      if (
        site < 0 ||
        site >= ctx.board.numSites ||
        !isReadableSite(ctx, site, siteType, boardType)
      ) {
        return OFF;
      }
      const what = targetWhatFromName(ctx, candidates, playerFn);
      if (what === OFF) return OFF; // @java WhereLevel.java:186-190
      const localState = localStateFn ? localStateFn.eval(ctx) : UNDEFINED;
      const topLevel = ctx.state.stackSize(site) - 1;
      if (fromTopFn.eval(ctx)) {
        // @java WhereLevel.java:194-200: scan downward and filter state.
        for (let level = topLevel; level >= 0; level -= 1) {
          if (
            whatAtLevel(ctx, site, level) === what &&
            matchesLocalState(ctx, site, level, localState)
          ) return level;
        }
      } else {
        // @java WhereLevel.java:202-207: scan upward and filter state.
        for (let level = 0; level <= topLevel; level += 1) {
          if (
            whatAtLevel(ctx, site, level) === what &&
            matchesLocalState(ctx, site, level, localState)
          ) return level;
        }
      }
      return OFF;
    },
  };
}

export function compileWhere(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const boardType = (env.boardDefaultSiteType ?? "Cell") as SiteTypeName;
  const stacking = env.isStacking ?? false;
  const levelMode = positional[0];
  if (levelMode && isIdent(levelMode) && levelMode.name === "Level") {
    // @java Where.java:92-104 and 118-126: `(where Level ...)` constructs a
    // WhereLevel that returns a stack level, not a site.
    const { args, siteType } = splitSiteType(positional.slice(1), env);
    const first = args[0];
    const atNode = named.get("at");
    if (!atNode) throw new LudemeCompileError("(where Level ...) needs at:<site>.");
    const siteFn = compileInt(atNode, env);
    const fromTopNode = named.get("fromTop");
    const fromTopFn = fromTopNode
      ? compileBool(fromTopNode, env)
      : { eval: () => true };
    if (first && isString(first)) {
      const playerFn = compileOwner(args[1], env);
      const localStateNode = named.get("state");
      const localStateFn = localStateNode
        ? compileInt(localStateNode, env)
        : undefined;
      return compileWhereLevelByName(
        componentCandidates(env, first.value),
        playerFn,
        localStateFn,
        siteFn,
        fromTopFn,
        siteType,
        boardType,
      );
    }
    if (!first) throw new LudemeCompileError("(where Level ...) needs a piece/what.");
    return compileWhereLevelByWhat(
      compileInt(first, env),
      siteFn,
      fromTopFn,
      siteType,
      boardType,
    );
  }

  const { args, siteType } = splitSiteType(positional, env);
  const first = args[0];
  if (first && isIdent(first) && first.name === "Level") {
    throw new LudemeCompileError("(where Level ...) malformed.");
  }
  if (first && isString(first)) {
    // @java Where.java:40-58: string + owner constructs WhereSite(name,...).
    const localStateNode = named.get("state");
    return compileWhereSiteByName(
      componentCandidates(env, first.value),
      compileOwner(args[1] ?? named.get("owner"), env),
      localStateNode ? compileInt(localStateNode, env) : undefined,
      siteType,
      boardType,
      stacking,
    );
  }
  // @java Where.java:69-75: non-string form constructs WhereSite(what,type).
  if (!first || !isList(first)) {
    // Keep the legacy single-component path viable: a bare role compiles as an
    // int `what`, which is equivalent to owner in simple games.
    if (!first) throw new LudemeCompileError("(where ...) needs a piece/what.");
  }
  return compileWhereSiteByWhat(
    compileInt(first, env),
    siteType,
    boardType,
    stacking,
  );
}

register("int", "where", compileWhere as any);
