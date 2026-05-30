// @java Core/src/game/functions/booleans/is/graph/IsLastFrom.java

import {
  isIdent,
  type LudList,
} from "@ludii/typescript-language";
import {
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import type { SiteType } from "../../../../../../action/site-type.js";
import { register } from "../../../../../registry.js";

export function compileIsLastFrom(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const typeNode = positional[0];
  const typeName = typeNode && isIdent(typeNode)
    ? typeNode.name
    : env.boardDefaultSiteType ?? "Cell";
  if (typeName !== "Cell" && typeName !== "Vertex" && typeName !== "Edge") {
    return { eval: () => false };
  }
  const type = typeName as SiteType;
  return {
    eval: (ctx) => {
      const last = ctx.context.trial.lastMove();
      // @java IsLastFrom.java:43-45
      return last !== undefined && last.fromType() === type;
    },
  };
}

register("bool", "LastFrom", compileIsLastFrom as any);
