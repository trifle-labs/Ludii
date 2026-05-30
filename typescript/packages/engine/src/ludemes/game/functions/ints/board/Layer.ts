// @java Core/src/game/functions/ints/board/Layer.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  lastToSite,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileLayer(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  // (layer [of:<site>]) → the pyramidal layer of a site (Java: vertex
  // .layer()). On a Shibumi pyramid the layer is recovered from the site's
  // elevation z = layer/√2, so layer = round(z·√2). Planar boards have
  // z==0 everywhere → layer 0, matching the previous flat behaviour. The
  // site defaults to the just-moved `(to)`.
  const ofNode = named.get("of") ?? positional[0];
  const siteFn = ofNode ? compileInt(ofNode, env) : undefined;
  return {
    eval: (ctx) => {
      const s = siteFn ? siteFn.eval(ctx) : ctx.frame.to ?? lastToSite(ctx);
      if (s < 0 || s >= ctx.board.numSites) return 0;
      return Math.round(ctx.board.zOf(s) * Math.SQRT2);
    },
  };
}

register("int", "layer", compileLayer as any);
