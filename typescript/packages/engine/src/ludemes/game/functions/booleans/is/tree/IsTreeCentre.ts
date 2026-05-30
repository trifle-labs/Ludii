// @java Core/src/game/functions/booleans/is/tree/IsTreeCentre.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsTreeCentre(_node: LudList, _env: CompileEnv): BoolFn {
  // Remaining graph-theory win predicates (experimental graph_theory games).
  // Their property checks aren't modelled yet, so compile to constant false:
  // the game builds and the goal simply never triggers.
  return { eval: () => false };
}

register("bool", "TreeCentre", compileIsTreeCentre as any);
