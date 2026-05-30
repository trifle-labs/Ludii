// @java Core/src/game/functions/booleans/no/pieces/NoPieces.java

import {
  isIdent,
  isString,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  type CompileEnv,
  parseArgs,
  resolveRole,
} from "../../../../../../eval/compile.js";
import type { BoolFn, EvalContext } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPES = new Set(["Cell", "Edge", "Vertex"]);

function argsAfterSubtype(node: LudList): readonly LudNode[] {
  const head = node.items[0];
  return node.items.slice(head !== undefined && isIdent(head) && head.name === "no" ? 2 : 1);
}

function idsForRole(role: string | undefined, ctx: EvalContext): number[] {
  const n = ctx.context.game.numPlayers;
  switch (role ?? "All") {
    case "All":
      return Array.from({ length: n + 1 }, (_, i) => i);
    case "Enemy":
    case "NonMover":
      return Array.from({ length: n }, (_, i) => i + 1).filter(
        (pid) => pid !== ctx.mover,
      );
    case "Friend":
    case "Mover":
      return [ctx.mover];
    case "Next":
      return [ctx.state.next > 0 ? ctx.state.next : (ctx.mover % n) + 1];
    case "Player":
      return [ctx.player];
    default:
      if (/^Team\d+$/.test(role ?? "")) return [Number(role!.slice(4))];
      return [resolveRole(role ?? "All", ctx)];
  }
}

function matchingComponentIds(name: string, env: CompileEnv): Set<number> {
  const ids = new Set<number>();
  for (const [label, id] of env.componentIdByLabel ?? []) {
    if (label.includes(name)) ids.add(id);
  }
  const baseNames = env.componentBaseNameById ?? [];
  for (let id = 1; id < baseNames.length; id += 1) {
    if ((baseNames[id] ?? "").includes(name)) ids.add(id);
  }
  return ids;
}

export function compileNoPieces(node: LudList, env: CompileEnv): BoolFn {
  const args = parseArgs(argsAfterSubtype(node));
  const ofNode = args.named.get("of");
  const inNode = args.named.get("in");
  const whoFn = ofNode ? compileInt(ofNode, env) : undefined;
  const whereFn = inNode ? compileRegion(inNode, env) : undefined;

  let role: string | undefined;
  let name: string | undefined;
  let siteType: string | undefined;
  for (const arg of args.positional) {
    if (isIdent(arg)) {
      if (SITE_TYPES.has(arg.name)) {
        siteType = arg.name;
      } else if (role === undefined) {
        role = arg.name;
      }
    } else if (isString(arg) && name === undefined) {
      name = arg.value;
    }
  }

  const componentIds =
    name === undefined ? undefined : matchingComponentIds(name, env);

  // Java derives role/who, optional region, optional component-name set, then
  // scans owned positions and returns false on the first matching piece
  // (NoPieces.java:60-74, 79-179). TS only models cell container state; explicit
  // Edge/Vertex queries therefore have no matching pieces here.
  return {
    eval: (ctx) => {
      if (siteType === "Edge" || siteType === "Vertex") return true;
      const idPlayers = new Set(
        whoFn ? [whoFn.eval(ctx)] : idsForRole(role, ctx),
      );
      const whereSites = whereFn
        ? new Set(whereFn.eval(ctx))
        : undefined;
      if (componentIds && componentIds.size === 0) return true;

      const sites = whereSites
        ? [...whereSites]
        : Array.from({ length: ctx.state.cells.length }, (_, i) => i);
      for (const site of sites) {
        if (site < 0 || site >= ctx.state.cells.length) continue;
        if (!ctx.state.isOccupiedSite(site)) continue;

        const stackSize = ctx.state.stackSize(site);
        if (stackSize > 1 || (ctx.state.stacks[site]?.length ?? 0) > 0) {
          for (let level = 0; level < stackSize; level += 1) {
            const who = ctx.state.whoAtSiteLevel(site, level);
            if (!idPlayers.has(who)) continue;
            if (
              componentIds &&
              !componentIds.has(ctx.state.whatAtSiteLevel(site, level))
            ) {
              continue;
            }
            return false;
          }
        } else {
          const who = ctx.state.cells[site] ?? 0;
          if (!idPlayers.has(who)) continue;
          if (componentIds && !componentIds.has(ctx.state.whatAtSite(site))) {
            continue;
          }
          return false;
        }
      }

      return true;
    },
  };
}

register("bool", "Pieces", compileNoPieces as any);
