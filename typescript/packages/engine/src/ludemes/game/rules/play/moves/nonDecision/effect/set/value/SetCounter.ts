// @java Core/src/game/rules/play/moves/nonDecision/effect/set/value/SetCounter.java

import { type LudList } from "@ludii/typescript-language";
import { ActionSetCounter } from "../../../../../../../../../action/action-set-counter.js";
import {
  compileInt,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileSetCounter(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12178.
  // (set Counter [<int>]) — no argument resets to -1, NOT the current
  // value. Java SetCounter defaults `newValue` to `new IntConstant(-1)`
  // (SetCounter.java:51): "the counter is incremented at each move, so to
  // reinitialise it to 0 at the next move, the counter has to be set at
  // -1." The per-move auto-increment in LudemeGame.apply then carries -1
  // up to 0 — this is how chess's `(then (set Counter))` on a pawn/capture
  // move resets the 50-move-rule clock that `(= (counter) 99)` reads.
  // @java game.rules.play.moves.nonDecision.effect.set.value.SetCounter
  const arg = node.items[2];
  const valFn = arg ? compileInt(arg, env) : undefined;
  return (ctx) => [
    new ActionSetCounter(valFn ? valFn.eval(ctx) : -1),
  ];
}

register("effect", "set:Counter", compileSetCounter as any);
