// @java Core/src/game/rules/play/moves/nonDecision/effect/Satisfy.java

import { isList, type LudList } from "@ludii/typescript-language";
import { ActionSet } from "../../../../../../../action/action-set-value-puzzle.js";
import { Move } from "../../../../../../../move.js";
import {
  compileBool,
  EMPTY_MOVES,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../eval/compile.js";
import type { MovesFn } from "../../../../../../../eval/eval-context.js";
import { register } from "../../../../../../registry.js";

export function compileSatisfyMoves(
  node: LudList,
  env: CompileEnv,
): MovesFn {
  // (satisfy <constraint> | { <constraints…> }) — deduction-puzzle CSP.
  // @java Satisfy stores the constraints for IsSolved and generates ActionSet
  // choices over the puzzle's value domain.
  const target = env.deductionConstraints;
  const marker = env.deductionConstraintDepth;
  const body = node.items[1];
  const constraints =
    body && isList(body) && body.delimiter === "curly" ? body.items : body ? [body] : [];
  if (target && marker) {
    marker.depth += 1;
    try {
      for (const constraint of constraints) target.push(compileBool(constraint, env));
    } finally {
      marker.depth -= 1;
    }
  }
  const range = env.puzzleValueRange;
  if (!range) return EMPTY_MOVES;
  return {
    generate: (ctx) => {
      const out: Move[] = [];
      for (let site = 0; site < ctx.board.numSites; site += 1) {
        if (ctx.state.whatAtSite(site) !== 0) continue;
        for (let value = range.min; value <= range.max; value += 1) {
          out.push(
            new Move({
              id: `set:${site}:${value}`,
              label: "Set",
              siteIndices: [site],
              mover: ctx.mover,
              placedOwner: Math.max(1, value),
              actions: [new ActionSet(site, value)],
            }),
          );
        }
      }
      return out;
    },
  };
}

export function compileSatisfyEffect(
  _node: LudList,
  _env: CompileEnv,
): EffectFn {
  return () => [];
}

register("moves", "satisfy", compileSatisfyMoves as any);
register("effect", "satisfy", compileSatisfyEffect as any);
