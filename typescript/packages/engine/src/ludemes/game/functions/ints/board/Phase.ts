// @java Core/src/game/functions/ints/board/Phase.java

import { type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compilePhase(_node: LudList, _env: CompileEnv): IntFn {
  // (phase of:<site>) — the phase index of the piece/site. Per-piece phase
  // isn't modelled; report the default phase 0. The rules-level
  // `(phase "Name" …)` declaration is handled elsewhere, not as an int.
  return { eval: () => 0 };
}

register("int", "phase", compilePhase as any);
