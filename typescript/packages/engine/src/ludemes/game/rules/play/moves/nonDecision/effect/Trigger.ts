// @java Core/src/game/rules/play/moves/nonDecision/effect/Trigger.java

import { isString, type LudList } from "@ludii/typescript-language";
import { ActionTrigger } from "../../../../../../../action/action-trigger.js";
import {
  EMPTY_MOVES,
  compileInt,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../eval/compile.js";
import type { EvalContext, IntFn, MovesFn } from "../../../../../../../eval/eval-context.js";
import { Move } from "../../../../../../../move.js";
import { register } from "../../../../../../registry.js";

export function compileTriggerMoves(
  node: LudList,
  env: CompileEnv,
): MovesFn {
  // Moved verbatim from src/eval/compile.ts:7131.
  // `(trigger "<event>" <player>)` in moves position. Java: Trigger.java —
  // generates a single move carrying ActionTrigger for the given player.
  // Trigger state is not modelled; the action is a no-op on apply, but the
  // form must compile so `(do prior next:(move …))` can proceed.
  const evtNode = node.items[1];
  const plrNode = node.items[2];
  if (!evtNode || !isString(evtNode)) return EMPTY_MOVES;
  const evtName = evtNode.value;
  let plrFn: IntFn = { eval: (ctx: EvalContext) => ctx.mover };
  if (plrNode) {
    try {
      plrFn = compileInt(plrNode, env);
    } catch {
      /* default to mover */
    }
  }
  return {
    generate: (ctx) => {
      const mover = ctx.mover;
      return [
        new Move({
          id: `trigger:${evtName}:${mover}`,
          label: `Trigger ${evtName}`,
          siteIndices: [0],
          mover,
          placedOwner: mover,
          actions: [new ActionTrigger(evtName, plrFn.eval(ctx))],
        }),
      ];
    },
  };
}

export function compileTriggerEffect(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12334.
  // `(trigger "<event>" <player>)` in effect position. Java: Trigger.java —
  // records a named event as fired for the given player via ActionTrigger.
  // Trigger state is not modelled here so ActionTrigger.apply() is a no-op,
  // but the action is carried through so the form compiles cleanly.
  const eventNode = node.items[1];
  const playerNode = node.items[2];
  if (!eventNode || !isString(eventNode)) return () => [];
  const event = eventNode.value;
  let playerFn: IntFn = { eval: (ctx: EvalContext) => ctx.mover };
  if (playerNode) {
    try {
      playerFn = compileInt(playerNode, env);
    } catch {
      /* default to mover */
    }
  }
  return (ctx) => [new ActionTrigger(event, playerFn.eval(ctx))];
}

register("moves", "trigger", compileTriggerMoves as any);
register("effect", "trigger", compileTriggerEffect as any);
