// @java Core/src/game/functions/ints/size/connection/SizeTerritory.java

import {
  isIdent,
  isList,
  type LudList,
} from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  resolveRole,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { EvalContext, IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPES = new Set(["Cell", "Vertex", "Edge"]);
const DIRECTIONS = new Set([
  "Adjacent",
  "All",
  "Orthogonal",
  "Diagonal",
  "OffDiagonal",
  "SameLayer",
]);

export function compileSizeTerritory(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  let index = 1; // skip Territory discriminator
  const typeNode = positional[index];
  if (typeNode && isIdent(typeNode) && SITE_TYPES.has(typeNode.name)) index += 1;

  const ownerNode = positional[index];
  let roleName: string | undefined;
  let playerFn: IntFn | undefined;
  if (ownerNode && isIdent(ownerNode) && !DIRECTIONS.has(ownerNode.name)) {
    roleName = ownerNode.name;
    index += 1;
  } else if (ownerNode && (isList(ownerNode) || !isIdent(ownerNode))) {
    playerFn = compileInt(ownerNode, env);
    index += 1;
  }

  const dirNode = positional[index];
  const dirTokens =
    dirNode && isIdent(dirNode) && DIRECTIONS.has(dirNode.name)
      ? [dirNode.name]
      : ["Adjacent"];

  return {
    eval: (ctx) => {
      // Java SizeTerritory.eval flood-fills every empty component, then adds its
      // size iff every bordering non-empty site belongs to the requested player
      // set (lines 83-134; checkTerritory lines 147-199).
      const players = territoryPlayers(ctx, env, roleName, playerFn);
      let size = 0;
      const explored = new Set<number>();
      for (let site = 0; site < ctx.board.numSites; site += 1) {
        if (
          explored.has(site) ||
          !ctx.board.isOnBoard(site) ||
          !ctx.state.isEmptySite(site)
        ) {
          continue;
        }
        const group = emptyGroup(ctx, site, dirTokens);
        for (const s of group) explored.add(s);
        if (checkTerritory(ctx, group, dirTokens, players)) size += group.size;
      }
      return size;
    },
  };
}

function territoryPlayers(
  ctx: EvalContext,
  env: CompileEnv,
  roleName: string | undefined,
  playerFn: IntFn | undefined,
): Set<number> {
  const who = playerFn
    ? playerFn.eval(ctx)
    : roleName
      ? resolveRole(roleName, ctx)
      : ctx.mover;

  if (roleName === "All" || roleName === "Each") {
    return new Set(Array.from({ length: env.numPlayers + 1 }, (_, i) => i));
  }
  if (roleName === "Enemy") {
    const out = new Set<number>();
    for (let p = 1; p <= env.numPlayers; p += 1) {
      if (p !== ctx.mover) out.add(p);
    }
    return out;
  }
  if (roleName === "Neutral" || roleName === "Shared") {
    return new Set([0, env.numPlayers + 1]);
  }
  return new Set([who]);
}

function emptyGroup(
  ctx: EvalContext,
  start: number,
  dirTokens: readonly string[],
): Set<number> {
  const group = new Set<number>([start]);
  const stack = [start];
  while (stack.length > 0) {
    const site = stack.pop() as number;
    for (const to of aroundSites(ctx, site, dirTokens)) {
      if (
        group.has(to) ||
        to < 0 ||
        to >= ctx.board.numSites ||
        !ctx.board.isOnBoard(to) ||
        !ctx.state.isEmptySite(to)
      ) {
        continue;
      }
      group.add(to);
      stack.push(to);
    }
  }
  return group;
}

function checkTerritory(
  ctx: EvalContext,
  sites: ReadonlySet<number>,
  dirTokens: readonly string[],
  players: ReadonlySet<number>,
): boolean {
  for (const site of sites) {
    for (const to of aroundSites(ctx, site, dirTokens)) {
      if (sites.has(to)) continue;
      const who = ctx.state.cells[to] ?? 0;
      if (!players.has(who)) return false;
    }
  }
  return true;
}

register("int", "Territory", compileSizeTerritory as any);
