// @java Core/src/game/util/moves/Flips.java

import { type LudList } from "@ludii/typescript-language";
import {
  EMPTY_MOVES,
  type CompileEnv,
  type EffectFn,
} from "../../../../eval/compile.js";
import type { MovesFn } from "../../../../eval/eval-context.js";
import { register } from "../../../registry.js";

export function compileFlipsMoves(
  _node: LudList,
  _env: CompileEnv,
): MovesFn {
  // (flips a b) is a piece-attribute specifying flip-state values, not a
  // move generator. compilePieceMoves skips it when finding the moves node;
  // this is a defensive no-op for any stray top-level occurrence.
  // Java: Core/src/game/util/moves/Flips.java
  return EMPTY_MOVES;
}

export function compileFlipsEffect(
  _node: LudList,
  _env: CompileEnv,
): EffectFn {
  return () => [];
}

register("moves", "flips", compileFlipsMoves as any);
register("effect", "flips", compileFlipsEffect as any);
