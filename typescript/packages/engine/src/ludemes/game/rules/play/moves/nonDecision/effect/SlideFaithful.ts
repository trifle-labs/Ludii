// @java Core/src/game/rules/play/moves/nonDecision/effect/Slide.java

import type { Then } from "./Then.js";
import type { From } from "../../../../../util/moves/From.js";
import type { To } from "../../../../../util/moves/To.js";
import type { Between } from "../../../../../util/moves/Between.js";
import { Slide } from "./Slide.js";
import {
  betweenCond,
  betweenEffect,
  betweenRange,
  directionName,
  fromCond,
  fromLevel,
  fromLoc,
  intConst,
  toApplyCondition,
  toApplyEffect,
  toCond,
} from "./EffectCtorAdapters.js";
import type { DirectionArg } from "./EffectCtorAdapters.js";

export class SlideFaithful extends Slide {
  public constructor(
    from: From | null = null,
    track: string | null = null,
    directions: DirectionArg = null,
    between: Between | null = null,
    to: To | null = null,
    stack: boolean | null = null,
    then: Then | null = null
  ) {
    const range = betweenRange(between);
    super({
      startLocationFn: fromLoc(from),
      levelFromFn: fromLevel(from),
      fromCondition: fromCond(from),
      limit: range?.maxFn ?? intConst(1000),
      minFn: range?.minFn ?? intConst(-2),
      goRule: betweenCond(between, { eval: (ctx) => ctx.state.isEmptySite(ctx._evalBetween) }),
      stopRule: to?.condFn() ?? null,
      // @java Slide.java:173 — toRule = (to == null || to.effect() == null)
      //   ? null : to.effect().condition();
      // It is the APPLY's if:, NOT the to-condition. Mapping to.cond here too
      // gated every empty-square slide on "IsEnemyAt" and rooks/bishops
      // generated only captures (Chaturanga rook produced zero moves).
      toRule: toApplyCondition(to),
      letFn: between?.trailFn() ?? null,
      betweenEffect: betweenEffect(between),
      sideEffect: toApplyEffect(to),
      dirnName: directionName(typeof directions === "string" ? directions : null),
      // @java a dynamic DirectionsFunction ((directions Cell from:X to:Y)) is
      // resolved per-from at eval time rather than collapsed to a static name
      // (Boop's repel slide depends on the runtime from→to direction).
      dirnFn: (directions !== null && typeof directions !== "string"
        && typeof (directions as { eval?: unknown }).eval === "function")
        ? (directions as { eval(ctx: unknown): string[] })
        : null,
      trackName: track,
      stack: stack ?? false,
      then,
    });
  }
}
