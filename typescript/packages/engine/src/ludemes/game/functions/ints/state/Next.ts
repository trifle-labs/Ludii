// @java Core/src/game/functions/ints/state/Next.java

import { type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileNext(_node: LudList, _env: CompileEnv): IntFn {
  // Java parity: `(next)` is the *stored* next player — `context.state().
  // next()` — not the rotational successor. A `(moveAgain)` continuation
  // sets `state.next` back to the mover, so during a same-turn sub-move
  // `(is Mover (next))` reads true and a `(no Moves Next)` end rule does not
  // fire a sub-turn early (L Game: an L-move's `(then (moveAgain))` precedes
  // the optional neutral-piece move). Fall back to the rotational successor
  // only when no override is pending (`state.next == 0`).
  return {
    eval: (ctx) => {
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
    },
  };
}

register("int", "next", compileNext as any);
