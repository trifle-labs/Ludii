// @java Core/src/game/functions/booleans/no/No.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  type CompileEnv,
  LudemeCompileError,
} from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";
import { compileNoMoves } from "./moves/NoMoves.js";
import { compileNoPieces } from "./pieces/NoPieces.js";

export function compileNo(node: LudList, env: CompileEnv): BoolFn {
  const kindNode = node.items[1];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "";

  // Java No.construct dispatches Piece and Move subtype enums to the concrete
  // classes (No.java:43-63, 75-91).
  switch (kind) {
    case "Pieces":
      return compileNoPieces(node, env);
    case "Moves":
      return compileNoMoves(node, env);
    default:
      throw new LudemeCompileError(`Unsupported (no ${kind} ...).`);
  }
}

register("bool", "no", compileNo as any);
