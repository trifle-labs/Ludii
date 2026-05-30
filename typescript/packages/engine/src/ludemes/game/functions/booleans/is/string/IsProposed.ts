// @java Core/src/game/functions/booleans/is/string/IsProposed.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsProposed(_node: LudList, _env: CompileEnv): BoolFn {
  // (is Proposed "<proposition>") — a vote proposition is active. No voting
  // subsystem is modelled; conservatively false.
  return { eval: () => false };
}

register("bool", "Proposed", compileIsProposed as any);
