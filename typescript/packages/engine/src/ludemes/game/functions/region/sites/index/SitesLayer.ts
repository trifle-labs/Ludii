// @java Core/src/game/functions/region/sites/index/SitesLayer.java

import type { LudList } from "@ludii/typescript-language";
import {
  allSites,
  compileInt,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesLayer(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(2));
  const layerNode = positional[0];
  const layerFn = layerNode ? compileInt(layerNode, env) : undefined;
  return {
    eval: (ctx) =>
      (layerFn ? layerFn.eval(ctx) : 0) === 0 ? allSites(ctx) : [],
  };
}

register("region", "Layer", compileSitesLayer as any);
