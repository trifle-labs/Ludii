// @java Core/src/game/rules/play/moves/nonDecision/effect/Satisfy.java

import { type LudList } from "@ludii/typescript-language";
import {
  EMPTY_MOVES,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../eval/compile.js";
import type { MovesFn } from "../../../../../../../eval/eval-context.js";
import { register } from "../../../../../../registry.js";

export function compileSatisfyMoves(
  _node: LudList,
  _env: CompileEnv,
): MovesFn {
  // (satisfy <constraint> | { <constraints…> }) — deduction-puzzle CSP;
  // all move generation is handled by a runtime solver. Compile to empty.
  return EMPTY_MOVES;
}

export function compileSatisfyEffect(
  _node: LudList,
  _env: CompileEnv,
): EffectFn {
  return () => [];
}

register("moves", "satisfy", compileSatisfyMoves as any);
register("effect", "satisfy", compileSatisfyEffect as any);
