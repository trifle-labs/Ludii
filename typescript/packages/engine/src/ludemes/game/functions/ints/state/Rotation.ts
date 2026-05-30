// @java Core/src/game/functions/ints/state/Rotation.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileRotation(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  // (rotation [SiteType] at:<site> [level:<int>]) → the piece rotation
  // stored at that site. Java Rotation.java: returns 0 for an OFF site,
  // else cs.rotation(loc, type). SiteType/level are not yet modelled in
  // TS state; `at:` is the only argument we need.
  const at = named.get("at") ?? positional[0];
  if (at) {
    const site = compileInt(at, env);
    return {
      eval: (ctx) => {
        const s = site.eval(ctx);
        if (s < 0 || s >= ctx.state.cells.length) return 0;
        return ctx.state.rotationAtSite(s);
      },
    };
  }
  throw new LudemeCompileError('Unknown integer ludeme "rotation".');
}

register("int", "rotation", compileRotation as any);
