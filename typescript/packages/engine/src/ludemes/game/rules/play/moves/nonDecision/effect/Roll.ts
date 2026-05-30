// @java Core/src/game/rules/play/moves/nonDecision/effect/Roll.java

import {
  isList,
  listHead,
  type LudList,
} from "@ludii/typescript-language";
import { ActionRollDice } from "../../../../../../../action/action-roll-dice.js";
import {
  compileThen,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../eval/compile.js";
import type { BoolFn, MovesFn } from "../../../../../../../eval/eval-context.js";
import { Move } from "../../../../../../../move.js";
import { register } from "../../../../../../registry.js";

export function compileRoll(
  node: LudList,
  env: CompileEnv,
): MovesFn {
  // Moved verbatim from src/eval/compile.ts:7460.
  const def = env.diceDef;
  if (!def || def.numDice === 0) {
    return { generate: () => [] };
  }
  const faces = def.faces;
  // A trailing `(then …)` is the roll move's consequence (Java stores it on the
  // Move and runs it after the roll action, on the post-roll position) — e.g.
  // Pasa's `(roll (then (addScore Mover (mapEntry (count Pips)))))`, which scores
  // the pips just rolled. Resolve it against `applyHypothetical(move)`: that
  // re-rolls on a *clone* of the RNG, drawing exactly the faces `game.apply`
  // will draw, so `(count Pips)` reads the same values and baking the
  // consequence at generate-time is exact. Compile fail-soft (mirror the do/move
  // then paths) so an unsupported consequence ludeme drops the consequence
  // rather than failing the whole game. Previously the node was ignored, so the
  // consequence was silently dropped (byScore-end dice games never scored).
  // @java game.functions.ints.state.Counter / other.move.Move.then
  const thenNode = node.items.find(
    (n): n is LudList => isList(n) && listHead(n) === "then",
  );
  let thenC:
    | { moveAgain: boolean; moveAgainCond?: BoolFn; effect?: EffectFn }
    | undefined;
  if (thenNode) {
    try {
      thenC = compileThen(thenNode, env, false, true);
    } catch {
      thenC = undefined;
    }
  }
  return {
    generate: (ctx) => {
      const move = new Move({
        id: "roll",
        label: "Roll",
        siteIndices: [0],
        mover: ctx.mover,
        placedOwner: ctx.mover,
        actions: [new ActionRollDice(faces)],
      });
      if (!thenC) return [move];
      const tc = thenC;
      const ectx = ctx.applyHypothetical(move);
      const extra = tc.effect ? tc.effect(ectx) : [];
      let again = tc.moveAgain;
      if (!again && tc.moveAgainCond) again = tc.moveAgainCond.eval(ectx);
      return [
        extra.length > 0 || again ? move.withConsequence(extra, again) : move,
      ];
    },
  };
}

register("moves", "roll", compileRoll as any);
