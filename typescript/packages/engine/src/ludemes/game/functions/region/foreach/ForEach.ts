// @java Core/src/game/functions/region/foreach/ForEach.java

import { isIdent, isList, listHead, type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  compileRegion,
  LudemeCompileError,
  type CompileEnv,
  parseArgs,
} from "../../../../../eval/compile.js";
import type { BoolFn, RegionFn } from "../../../../../eval/eval-context.js";

function addUnique(out: number[], seen: Set<number>, sites: readonly number[]): void {
  for (const site of sites) {
    if (!seen.has(site)) {
      seen.add(site);
      out.push(site);
    }
  }
}

export function compileRegionForEach(node: LudList, env: CompileEnv): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(1));

  const ofNode = named.get("of");
  if (ofNode) {
    const ofRegion = compileRegion(ofNode, env);
    const bodyNode = positional[0];
    if (!bodyNode) return { eval: () => [] };
    const body = compileRegion(bodyNode, env);
    return {
      eval: (ctx) => {
        // ForEachSiteInRegion.eval binds context.site to each site in ofRegion
        // and unions the body region without duplicates (ForEachSiteInRegion.java:54-75).
        const out: number[] = [];
        const seen = new Set<number>();
        for (const site of ofRegion.eval(ctx)) {
          addUnique(out, seen, body.eval(ctx.withFrame({ site })));
        }
        return out;
      },
    };
  }

  const kindNode = positional[0];
  if (kindNode && isIdent(kindNode) && kindNode.name === "Level") {
    const atNode = named.get("at");
    if (!atNode) return { eval: () => [] };
    const at = compileInt(atNode, env);
    const condNode = named.get("if") ?? named.get("If");
    const cond: BoolFn | undefined = condNode ? compileBool(condNode, env) : undefined;
    const startAtNode = named.get("startAt");
    const startAt = startAtNode ? compileInt(startAtNode, env) : { eval: () => -1 };
    const fromBottom = positional.some((p) => isIdent(p) && p.name === "FromBottom");
    return {
      eval: (ctx) => {
        // ForEachLevel.eval iterates stack levels from top by default or bottom
        // when requested, binding context.level and filtering by If
        // (ForEachLevel.java:74-113).
        const site = at.eval(ctx);
        if (site < 0) return [];
        const stackSize = ctx.state.stackSize(site);
        const out: number[] = [];
        let start = startAt.eval(ctx);
        if (fromBottom) {
          if (start < 0) start = 0;
          for (let level = start; level < stackSize; level += 1) {
            const sub = ctx.withFrame({ level });
            if (!cond || cond.eval(sub)) out.push(level);
          }
        } else {
          if (start < 0) start = stackSize - 1;
          if (start >= stackSize) start = stackSize - 1;
          for (let level = start; level >= 0; level -= 1) {
            const sub = ctx.withFrame({ level });
            if (!cond || cond.eval(sub)) out.push(level);
          }
        }
        return out;
      },
    };
  }

  if (kindNode && isIdent(kindNode) && kindNode.name === "Team") {
    // ForEachTeam.eval sets context.team to the full player array for each
    // non-empty team (ForEachTeam.java:43-68). EvalFrame has no team slot yet,
    // so the outer forEach constructor cannot be registered faithfully.
    throw new LudemeCompileError("(forEach Team ...) needs EvalFrame.team support.");
  }

  if (kindNode && isList(kindNode) && listHead(kindNode) === "players") {
    const playersRegion = compileRegion(kindNode, env);
    const bodyNode = positional[1];
    if (!bodyNode) return { eval: () => [] };
    const body = compileRegion(bodyNode, env);
    return {
      eval: (ctx) => {
        // ForEachPlayer.eval binds context.player to each requested player and
        // unions body sites without duplicates (ForEachPlayer.java:53-90).
        const out: number[] = [];
        const seen = new Set<number>();
        for (const player of playersRegion.eval(ctx)) {
          if (player < 0 || player > ctx.context.game.numPlayers) continue;
          addUnique(out, seen, body.eval(ctx.withFrame({ player })));
        }
        return out;
      },
    };
  }

  const siteKeyword = kindNode && isIdent(kindNode) && kindNode.name === "Site";
  const regionNode = siteKeyword ? positional[1] : kindNode;
  if (regionNode && isList(regionNode)) {
    const region = compileRegion(regionNode, env);
    const ifNode = named.get("if") ?? named.get("If");
    if (ifNode) {
      const cond = compileBool(ifNode, env);
      return {
        eval: (ctx) => {
          // ForEachSite.eval binds context.site for each original site and keeps
          // sites whose condition is true (ForEachSite.java:55-72).
          const out: number[] = [];
          for (const site of region.eval(ctx)) {
            if (cond.eval(ctx.withFrame({ site }))) out.push(site);
          }
          return out;
        },
      };
    }
    return { eval: (ctx) => region.eval(ctx) };
  }

  return { eval: () => [] };
}
