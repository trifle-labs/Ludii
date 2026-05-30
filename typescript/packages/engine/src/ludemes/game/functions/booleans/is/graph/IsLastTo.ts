// @java Core/src/game/functions/booleans/is/graph/IsLastTo.java

import {
  isIdent,
  type LudList,
} from "@ludii/typescript-language";
import {
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import {
  type BoolFn,
  OFF,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsLastTo(node: LudList, _env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // (is LastTo [SiteType]) — the last move's destination is a site of the
  // given type. The TS port only models Cell play, so a Cell query is true
  // whenever a move with a real destination has been made; Vertex/Edge
  // queries are conservatively false.
  const typeNode = positional[0];
  const typeName = typeNode && isIdent(typeNode) ? typeNode.name : "Cell";
  if (typeName !== "Cell") return { eval: () => false };
  return {
    eval: (ctx) => (ctx.context.trial.lastMove()?.to() ?? OFF) >= 0,
  };
}

register("bool", "LastTo", compileIsLastTo as any);
