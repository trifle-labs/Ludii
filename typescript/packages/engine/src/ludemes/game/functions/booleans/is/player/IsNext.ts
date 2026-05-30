// @java Core/src/game/functions/booleans/is/player/IsNext.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  EvalContext,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsNext(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // `(is Next <role>)` — Java `IsNext.eval` is `who == state.next()`. Java's
  // `state.next()` is the player set to move next: after a `(moveAgain)`/
  // SetNextPlayer it is the same mover (the override), otherwise the
  // rotational successor. TS stores 0 as the "no override pending" sentinel
  // (the turn rotation resets `next` to 0), so read the override when set and
  // fall back to the cyclic successor — mirroring `(next)` above. This is what
  // lets `(nextPhase Mover (not (is Next Mover)) …)` keep the same phase
  // through a same-turn continuation (Mangola's Opening1 sow chain).
  const whoNode = positional[0];
  if (!whoNode) return { eval: () => true };
  const who = compileInt(whoNode, env);
  const target = (ctx: EvalContext): number => {
    if (ctx.state.next > 0 && ctx.state.activePlayer(ctx.state.next)) {
      return ctx.state.next;
    }
    const n = ctx.context.game.numPlayers;
    let p = (ctx.mover % n) + 1;
    for (let i = 0; i < n; i += 1) {
      if (ctx.state.activePlayer(p)) return p;
      p = (p % n) + 1;
    }
    return (ctx.mover % n) + 1;
  };
  return { eval: (ctx) => who.eval(ctx) === target(ctx) };
}

register("bool", "Next", compileIsNext as any);
