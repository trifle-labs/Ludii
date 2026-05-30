// @java Core/src/game/functions/booleans/no/moves/NoMoves.java

import {
  isIdent,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  type CompileEnv,
  LudemeCompileError,
  resolveRole,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

let noMovesProbing = false;

function argsAfterSubtype(node: LudList): readonly LudNode[] {
  const head = node.items[0];
  return node.items.slice(head !== undefined && isIdent(head) && head.name === "no" ? 2 : 1);
}

export function compileNoMoves(node: LudList, _env: CompileEnv): BoolFn {
  const roleNode = argsAfterSubtype(node)[0];
  if (!roleNode || !isIdent(roleNode))
    throw new LudemeCompileError("(no Moves ...) needs a role.");
  const role = roleNode.name;

  if (role === "Next") {
    return {
      eval: (ctx) => {
        if (noMovesProbing) return false;
        // Java temporarily switches to state.next(), recomputes stalemate with
        // a thread-local recursion guard, then restores state (NoMoves.java:57-93).
        const target =
          ctx.state.next > 0
            ? ctx.state.next
            : (ctx.mover % ctx.context.game.numPlayers) + 1;
        if (target <= 0) return false;
        const altContext = ctx.context.withState(ctx.state.withMover(target));
        noMovesProbing = true;
        try {
          const game = ctx.context.game;
          const raw = game.legalMovesRaw
            ? game.legalMovesRaw(altContext)
            : game.moves(altContext);
          return raw.length === 0;
        } finally {
          noMovesProbing = false;
        }
      },
    };
  }

  // For non-Next roles Java simply reads State.isStalemated(Id(role).eval())
  // (NoMoves.java:92-94); the move loop owns that cached flag.
  return {
    eval: (ctx) => {
      const target = resolveRole(role, ctx);
      if (target <= 0 || target >= ctx.state.stalemated.length) return false;
      return ctx.state.stalemated[target] === true;
    },
  };
}

register("bool", "Moves", compileNoMoves as any);
