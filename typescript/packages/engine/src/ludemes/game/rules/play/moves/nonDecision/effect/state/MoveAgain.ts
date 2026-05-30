// @java Core/src/game/rules/play/moves/nonDecision/effect/state/MoveAgain.java

import { type LudList } from "@ludii/typescript-language";
import { ActionSetNextPlayer } from "../../../../../../../../action/action-set-next-player.js";
import {
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../eval/compile.js";
import type { MovesFn } from "../../../../../../../../eval/eval-context.js";
import { Move } from "../../../../../../../../move.js";
import { register } from "../../../../../../../registry.js";

export function compileMoveAgainMoves(
  _node: LudList,
  _env: CompileEnv,
): MovesFn {
  // Moved verbatim from src/eval/compile.ts:6536.
  // `(moveAgain)` in *moves* position — Java MoveAgain.eval returns a Moves
  // with a single `Move(new ActionSetNextPlayer(state.mover()))`, i.e. a
  // pass-like move that schedules the same player to play again. It shows up
  // as the conditional arm of `(if <cond> (moveAgain))`, most often the
  // `next:` arm of a `(do <prior> next:(if … (moveAgain)))` in a dice/race
  // game's `(then …)` (e.g. Tasholiwe's throw-of-10 bonus). Without this
  // case the arm threw `Unsupported moves ludeme`, so `compileDo`'s
  // fail-soft dropped the whole `next:` arm — the bonus turn never fired and
  // the prior's side effects survived unconditionally (un-Java: Java drops
  // the prior when `next` is empty). The ActionSetNextPlayer carries the
  // effect; the turn logic (ludeme-game apply) reads `placed.next` to keep
  // the mover, and the `(do …)`-in-effect handler folds it in unchanged.
  return {
    generate: (ctx) => [
      new Move({
        id: "moveAgain",
        label: "MoveAgain",
        siteIndices: [0],
        mover: ctx.mover,
        placedOwner: ctx.mover,
        actions: [new ActionSetNextPlayer(ctx.mover)],
      }),
    ],
  };
}

export function compileMoveAgainEffect(
  _node: LudList,
  _env: CompileEnv,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:11240.
  // As an effect (e.g. inside `(if … (moveAgain))`): schedule the current
  // mover to play again by overriding the next player. Java: MoveAgain emits
  // ActionSetNextPlayer(mover).
  return (ctx) => [new ActionSetNextPlayer(ctx.mover)];
}

register("moves", "moveAgain", compileMoveAgainMoves as any);
register("effect", "moveAgain", compileMoveAgainEffect as any);
