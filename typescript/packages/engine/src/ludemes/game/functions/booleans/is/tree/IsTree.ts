// @java Core/src/game/functions/booleans/is/tree/IsTree.java

import {
  isIdent,
  type LudList,
} from "@ludii/typescript-language";
import {
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

export function compileIsTree(node: LudList, _env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const roleNode = positional[0];
  const roleName = roleNode && isIdent(roleNode) ? roleNode.name : "Neutral";
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

      const parent = new Array<number>(traj.vertexCount);
      for (let i = 0; i < parent.length; i += 1) parent[i] = i;
      const find = (position: number): number => {
        let root = position;
        while (parent[root] !== root) root = parent[root] as number;
        return root;
      };

      // Java initialises one union-find parent per graph vertex, then walks
      // coloured edges high-to-low; an edge connecting an existing component
      // root means the induced graph has a cycle, so it is not a tree.
      // @java IsTree.java:53-93, 105-112
      for (let edge = traj.numSites - 1; edge >= 0; edge -= 1) {
        if (ctx.state.whatAtSite(edge) !== whoSiteId) continue;
        const endpoints = traj.edgeEndpoints(edge);
        if (!endpoints) continue;
        const aRoot = find(endpoints[0]);
        const bRoot = find(endpoints[1]);
        if (aRoot === bRoot) return false;
        parent[aRoot] = bRoot;
      }
      return true;
    },
  };
}

function resolveGraphRole(name: string, ctx: EvalContext): number {
  if (name === "Shared" || name === "Neutral") return 0;
  return resolveRole(name, ctx);
}

register("bool", "Tree", compileIsTree as any);
