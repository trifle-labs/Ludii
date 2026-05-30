// @java Core/src/game/functions/region/sites/side/SitesSide.java

import {
  isIdent,
  type LudNode,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  outerSites,
  parseArgs,
  resolveRole,
  sideSites,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type {
  IntFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPES = new Set(["Cell", "Vertex", "Edge"]);
const COMPASS_DIRECTIONS = new Set([
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
]);

function playerIndexFn(node: LudNode | undefined, env: CompileEnv): IntFn | undefined {
  if (!node) return undefined;
  if (isIdent(node)) {
    const role = node.name;
    return { eval: (ctx) => resolveRole(role, ctx) };
  }
  try {
    return compileInt(node, env);
  } catch {
    return undefined;
  }
}

export function compileSitesSide(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(2));
  let direction: string | undefined;
  let playerNode: LudNode | undefined;
  let shared = false;

  for (const p of positional) {
    if (!isIdent(p)) {
      if (!playerNode) playerNode = p;
      continue;
    }
    const name = p.name;
    if (SITE_TYPES.has(name)) {
      continue;
    }
    if (name === "Shared") {
      shared = true;
      continue;
    }
    if (COMPASS_DIRECTIONS.has(name)) {
      direction = name;
      continue;
    }
    if (!playerNode) playerNode = p;
  }

  const index = playerIndexFn(playerNode, env);
  return {
    eval: (ctx) => {
      // Java returns the outer region for Shared before resolving a direction
      // (Core/src/.../SitesSide.java:81-87). TS has one play-site layer, so
      // Cell/Vertex selection is represented by the same site ids.
      if (shared) return outerSites(ctx);

      let dir = direction;
      if (dir === undefined && index) {
        const pid = index.eval(ctx);
        if (pid < 1 || pid > ctx.context.game.numPlayers) return [];
        // Java takes the possibly dynamic player's facing direction
        // (Core/src/.../SitesSide.java:89-101). Undefined means Ludii's default
        // North-facing player.
        dir = ctx.board.playerFacing[pid] ?? "N";
      }
      if (dir === undefined) return [];

      // Java reads Topology.sides(realType).get(dirn), which sideSites mirrors
      // through measured graph sides or lattice rows/columns
      // (Core/src/.../SitesSide.java:106-119).
      return sideSites(ctx, dir);
    },
  };
}

register("region", "Side", compileSitesSide as any);
