// @java Core/src/game/functions/booleans/is/regularGraph/IsRegularGraph.java

import {
  isIdent,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  type CompileEnv,
  lastToSite,
  parseArgs,
  resolveRole,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  EvalContext,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsRegularGraph(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  const roleNode = positional[0];
  const roleName = roleNode && isIdent(roleNode) ? roleNode.name : "Mover";
  const kNode = named.get("k");
  const kFn = kNode ? compileInt(kNode, env) : undefined;
  const oddNode = named.get("odd");
  const evenNode = named.get("even");
  const oddFn = oddNode ? compileBool(oddNode, env) : undefined;
  const evenFn = evenNode ? compileBool(evenNode, env) : undefined;
  return {
    eval: (ctx) => {
      const traj = ctx.board.traj;
      if (!traj) return false;
      const siteId = lastToSite(ctx);
      if (siteId < 0) return false;
      let whoSiteId = resolveGraphRole(roleName, ctx);
      if (whoSiteId === 0) {
        const what = ctx.state.whatAtSite(siteId);
        whoSiteId = what === 0 ? 1 : what;
      }

      const degreeInfo: Set<number>[] = [];
      for (let i = 0; i < traj.vertexCount; i += 1) {
        degreeInfo.push(new Set<number>());
      }
      // Java builds a BitSet of distinct neighbours for every graph vertex
      // using only edges whose `what` matches the chosen owner/component.
      // @java IsRegularGraph.java:81-122
      for (let edge = 0; edge < traj.numSites; edge += 1) {
        if (ctx.state.whatAtSite(edge) !== whoSiteId) continue;
        const endpoints = traj.edgeEndpoints(edge);
        if (!endpoints) continue;
        degreeInfo[endpoints[0]]?.add(endpoints[1]);
        degreeInfo[endpoints[1]]?.add(endpoints[0]);
      }

      const kValue = kFn ? kFn.eval(ctx) : 0;
      let degree = kValue;
      if (kValue === 0) {
        for (const info of degreeInfo) {
          if (info.size !== 0) {
            degree = info.size;
            break;
          }
        }
      }
      for (const info of degreeInfo) {
        if (degree !== info.size) return false;
      }
      if (oddFn?.eval(ctx)) return degree % 2 === 1;
      if (evenFn?.eval(ctx)) return degree % 2 === 0;
      // @java IsRegularGraph.java:123-151
      return true;
    },
  };
}

function resolveGraphRole(name: string, ctx: EvalContext): number {
  if (name === "Shared" || name === "Neutral") return 0;
  return resolveRole(name, ctx);
}

register("bool", "RegularGraph", compileIsRegularGraph as any);
