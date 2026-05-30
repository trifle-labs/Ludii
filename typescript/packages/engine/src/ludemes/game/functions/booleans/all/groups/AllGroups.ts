// @java Core/src/game/functions/booleans/all/groups/AllGroups.java

import {
  isIdent,
  isList,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";
import {
  aroundSites,
  compileBool,
  type CompileEnv,
  LudemeCompileError,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPES = new Set(["Cell", "Edge", "Vertex"]);

function argsAfterSubtype(node: LudList): readonly LudNode[] {
  const head = node.items[0];
  return node.items.slice(head !== undefined && isIdent(head) && head.name === "all" ? 2 : 1);
}

function rawDirectionTokens(node: LudNode | undefined): string[] {
  if (!node) return [];
  if (isIdent(node)) return node.name === "~" ? [] : [node.name];
  if (!isList(node)) return [];
  if (node.delimiter === "curly") return node.items.flatMap(rawDirectionTokens);
  const head = listHead(node);
  const items = head === "directions" ? node.items.slice(1) : node.items;
  const tokens: string[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item) continue;
    if (isIdent(item) && item.name.endsWith(":")) {
      i += 1;
      continue;
    }
    tokens.push(...rawDirectionTokens(item));
  }
  return tokens;
}

export function compileAllGroups(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(argsAfterSubtype(node));
  let index = 0;
  const maybeType = positional[index];
  if (maybeType && isIdent(maybeType) && SITE_TYPES.has(maybeType.name)) {
    index += 1;
  }
  const dirNode = positional[index];
  const dirTokens =
    dirNode && (isIdent(dirNode) || isList(dirNode))
      ? rawDirectionTokens(dirNode)
      : [];
  const ofNode = named.get("of");
  const ifNode = named.get("if") ?? named.get("If");
  if (!ifNode) throw new LudemeCompileError("(all Groups ...) needs if:.");
  const groupElementConditionFn = ofNode ? compileBool(ofNode, env) : undefined;
  const groupCondition = compileBool(ifNode, env);

  // Java seeds groups from owned sites, floods through the chosen directions
  // while rebinding from/to, binds context.region to each maximal group, then
  // requires the group condition (AllGroups.java:76-177).
  return {
    eval: (ctx) => {
      const maxIndexElement = ctx.board.numSites;
      const who = ctx.state.mover;
      const sitesToCheck: number[] = [];
      for (let site = 0; site < maxIndexElement; site += 1) {
        if (groupElementConditionFn) {
          if (ctx.state.isOccupiedSite(site)) sitesToCheck.push(site);
        } else if ((ctx.state.cells[site] ?? 0) === who) {
          sitesToCheck.push(site);
        }
      }

      const sitesChecked = new Set<number>();
      for (const seed of sitesToCheck) {
        if (sitesChecked.has(seed)) continue;

        const member = (site: number): boolean => {
          if (site < 0 || site >= maxIndexElement) return false;
          if (!groupElementConditionFn)
            return (ctx.state.cells[site] ?? 0) === who;
          return groupElementConditionFn.eval(
            ctx.withFrame({ from: seed, to: site }),
          );
        };

        if (!member(seed)) continue;
        const groupSites: number[] = [seed];
        const groupSet = new Set<number>([seed]);
        let explored = 0;
        let lastTo = seed;

        while (explored !== groupSites.length) {
          const site = groupSites[explored] as number;
          for (const to of aroundSites(
            ctx,
            site,
            dirTokens.length > 0 ? dirTokens : ["Adjacent"],
          )) {
            lastTo = to;
            if (groupSet.has(to)) continue;
            if (member(to)) {
              groupSet.add(to);
              groupSites.push(to);
            }
          }
          explored += 1;
        }

        if (
          !groupCondition.eval(
            ctx.withFrame({ from: seed, to: lastTo, region: groupSites }),
          )
        ) {
          return false;
        }
        for (const site of groupSites) sitesChecked.add(site);
      }

      return true;
    },
  };
}

register("bool", "Groups", compileAllGroups as any);
