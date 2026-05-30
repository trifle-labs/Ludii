// @java Core/src/game/functions/booleans/is/player/IsPrev.java

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

export function compileIsPrev(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // `(is Prev <role>)` — is the role the player who made the previous move?
  // The `"SameTurn"` idiom `(is Prev Mover)` relies on this being true when
  // a `(moveAgain)` keeps the same player moving, so the previous player
  // must come from the trial's last move, not a static cyclic predecessor
  // (which for two players is always the opponent and so never matches the
  // mover). Falls back to 0 ("nobody", Java's initial state.prev) before
  // any move is made, so it is false on the very first move of a trial.
  const whoNode = positional[0];
  if (!whoNode) return { eval: () => true };
  const who = compileInt(whoNode, env);
  const target = (ctx: EvalContext): number => {
    // `applyHypothetical` (used to fold `(then (if (NewTurn) (moveAgain)))`
    // at generation time) stashes the pre-apply previous mover here so this
    // matches Java's `state.prev()` — the predecessor ply's mover — rather
    // than the candidate move that was just recorded as the trial's last.
    if (ctx.frame.prevMover !== undefined) return ctx.frame.prevMover;
    const last = ctx.context.trial.lastMove();
    if (last) return last.mover;
    // Before any move Java's `state.prev` is its initial 0 ("nobody"), so
    // `(is Prev <role>)` is false at game start (IsPrev.eval == state.prev()).
    return 0;
  };
  return { eval: (ctx) => who.eval(ctx) === target(ctx) };
}

register("bool", "Prev", compileIsPrev as any);
