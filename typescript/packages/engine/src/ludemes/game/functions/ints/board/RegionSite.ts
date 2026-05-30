// @java Core/src/game/functions/ints/board/RegionSite.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  compileRegion,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import { OFF, type IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileRegionSite(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  // (regionSite <region> index:<n>) → the site at position n within the
  // region (Java: RegionSite). OFF when the index is out of range.
  const regNode = positional[0];
  const idxNode = named.get("index") ?? positional[1];
  const regFn = regNode ? compileRegion(regNode, env) : undefined;
  const idxFn = idxNode ? compileInt(idxNode, env) : undefined;
  return {
    eval: (ctx) => {
      const reg = regFn ? regFn.eval(ctx) : [];
      const i = idxFn ? idxFn.eval(ctx) : 0;
      return i >= 0 && i < reg.length ? (reg[i] as number) : OFF;
    },
  };
}

register("int", "regionSite", compileRegionSite as any);
