// @java Core/src/game/functions/ints/iterator/Track.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../eval/compile.js";
import { OFF, type IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileTrack(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // @java Track.java:33-37: return context.track(); EvalContext.java:37-38
    // initialises it to Constants.OFF. The current TS context has no typed
    // track slot yet; accept a dynamic slot, with frame.value as the only
    // existing iterator scratch fallback.
    eval: (ctx) =>
      (ctx.frame as { track?: number }).track ?? ctx.frame.value ?? OFF,
  };
}

register("int", "track", compileTrack as any);
