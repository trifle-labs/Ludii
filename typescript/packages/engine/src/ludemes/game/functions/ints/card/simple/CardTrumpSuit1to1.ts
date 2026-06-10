/**
 * CardTrumpSuit1to1.ts
 * @java game/functions/ints/card/simple/CardTrumpSuit.java
 *
 * (card TrumpSuit) — returns the current trump suit index from game state.
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent } from "@ludii/typescript-language";


/**
 * Returns the current trump suit.
 * @java game/functions/ints/card/simple/CardTrumpSuit.java — eval(Context)
 */
export class CardTrumpSuit1to1 implements IntFunction {
  /** @java game/functions/ints/card/simple/CardTrumpSuit.java — eval: context.state().trumpSuit() */
  public eval(ctx: Context): number {
    return ctx.state.trumpSuit;
  }
}

/**
 * Registry factory for (card ...) ludeme.
 *
 * Dispatches on the first positional ident:
 *   TrumpSuit → CardTrumpSuit1to1
 *
 * All other card subtypes (Rank, Suit, TrumpRank, TrumpValue) require
 * card component APIs that are not available in the TS engine; they are
 * deferred (not registered here).
 */
