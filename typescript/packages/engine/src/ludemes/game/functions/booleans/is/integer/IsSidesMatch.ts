// @java Core/src/game/functions/booleans/is/integer/IsSidesMatch.java

import { type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsSidesMatch(_node: LudList, _env: CompileEnv): BoolFn {
  // (is SidesMatch [to:<site>]) — Java IsSidesMatch.java checks that every
  // orthogonal neighbour of the just-placed tile has matching track colours
  // at the shared edge. This needs tile path/colour data (Component.paths /
  // .terminus / .numTerminus) which is not yet modelled in the TS engine.
  // Stub TRUE so the placement passes its `ifAfterwards` filter (stubbing
  // false would block every Trax move); the colour constraint is unenforced.
  return { eval: () => true };
}

register("bool", "SidesMatch", compileIsSidesMatch as any);
