// @java Core/src/game/functions/booleans/is/triggered/IsTriggered.java

import {
  isIdent,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  parseArgs,
  resolveRole,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  EvalContext,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsTriggered(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // (is Triggered "<event>" <player>) — a named trigger fired for a player.
  // Java IsTriggered → `state.isTriggered(event, who)`, which ignores the
  // event name and tests only the player's trigger bit (set by ActionTrigger
  // / `(trigger …)`). Resolve the player arg (role ident or int expr).
  const playerNode = positional[1];
  if (!playerNode) return { eval: () => false };
  const playerFn = isIdent(playerNode)
    ? { eval: (ctx: EvalContext) => resolveRole(playerNode.name, ctx) }
    : compileInt(playerNode, env);
  return { eval: (ctx) => ctx.state.isTriggered(playerFn.eval(ctx)) };
}

register("bool", "Triggered", compileIsTriggered as any);
