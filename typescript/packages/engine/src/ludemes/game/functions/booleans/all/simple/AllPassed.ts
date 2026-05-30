// @java Core/src/game/functions/booleans/all/simple/AllPassed.java

import { type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileAllPassed(_node: LudList, _env: CompileEnv): BoolFn {
  // Java first requires at least one move per player, then delegates to
  // Context.allPass() (AllPassed.java:43-50). The TS Context does not expose
  // allPass(), so mirror LudemeGame's Java-parity allPassed scan.
  return {
    eval: (ctx) => {
      const n = ctx.context.game.numPlayers;
      const moves = ctx.context.trial.moves;
      if (moves.length < n || n <= 0) return false;
      if (n === 1) return moves[moves.length - 1]?.isPass() ?? false;

      const lastMove = moves[moves.length - 1];
      if (!lastMove) return false;
      let lastMover = ctx.mover;
      let reverseIndex = moves.length - 2;
      let passMove = lastMove.isPass();
      let countMovesTurn = 1;

      for (let i = 1; i < n; i += 1) {
        while (true) {
          if (reverseIndex < 0 || countMovesTurn > 1) return false;
          const move = moves[reverseIndex--];
          if (!move) return false;
          if (lastMover !== move.mover) {
            if (!passMove) return false;
            lastMover = move.mover;
            countMovesTurn = 1;
            passMove = move.isPass();
            break;
          }
          countMovesTurn += 1;
          passMove = move.isPass();
        }
      }

      return passMove;
    },
  };
}

register("bool", "Passed", compileAllPassed as any);
