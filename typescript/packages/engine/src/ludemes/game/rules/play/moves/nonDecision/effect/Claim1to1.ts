// @java game/rules/play/moves/nonDecision/effect/Claim.java
//
// Live faithful class for the (claim ...) placement move. The compile logic was
// relocated VERBATIM from the inline compiler1to1 `(claim)` handler into this
// registered class so the faithful per-ludeme class is the live engine (the
// registry lookup in compileMoves1to1 shadows the inline branch).
//
// Java parity: Claim places a piece with ownership at the target sites.
// In the 1:1 path it is simplified as (move Add (to ...)).

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { MovesFunction, RegionFunction } from "../../../../../../base.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../registry1to1.js";
import { parseArgs1to1, headOf, compileRegion1to1 } from "../../../../../../../compiler1to1.js";
import { isList, type LudNode, type LudList } from "@ludii/typescript-language";
import { Add } from "./Add.js";

/**
 * (claim (to <region>) ...) — place a piece with ownership (simplified as Add).
 * @java game/rules/play/moves/nonDecision/effect/Claim.java
 */
export class Claim1to1 implements MovesFunction {
  private readonly inner: MovesFunction;

  public constructor(inner: MovesFunction) {
    this.inner = inner;
  }

  public eval(ctx: Context): Move[] { return this.inner.eval(ctx); }
}

/** Fallback stub when no region can be compiled. */
const emptyMoves: MovesFunction = { eval(_ctx: Context): Move[] { return []; } };

// @java Claim.java — compile factory: (claim (to <region> ...) ...)
registerMoves1to1("claim", (node: LudNode, _env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // (claim (to <region> ...) ...)
  const toNode = positional.find((n: LudNode) => isList(n) && headOf(n) === "to");
  if (toNode && isList(toNode)) {
    const toArgs = parseArgs1to1((toNode as LudList).items);
    const regionNode: LudNode | undefined = toArgs.positional.find((n: LudNode) => isList(n)) ?? toArgs.positional[0];
    if (regionNode) {
      try {
        const regionFn: RegionFunction = compileRegion1to1(regionNode);
        return new Claim1to1(new Add(regionFn));
      } catch { /* fall through */ }
    }
  }
  return emptyMoves;
});
