// @java Core/src/game/functions/ints/card/Card.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  LudemeCompileError,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";
import { compileCardTrumpSuit } from "./simple/CardTrumpSuit.js";

export function compileCard(node: LudList, env: CompileEnv): IntFn {
  const subtype = node.items[1];
  if (subtype && isIdent(subtype) && subtype.name === "TrumpSuit") {
    // Java Card.construct(CardSimpleType.TrumpSuit) returns CardTrumpSuit
    // (Core/src/game/functions/ints/card/Card.java:34-48).
    return compileCardTrumpSuit(node, env);
  }
  // Java Card.construct(CardSiteType, at, level) dispatches Rank/Suit/
  // TrumpRank/TrumpValue to card component metadata (Card.java:65-87).
  // TODO: needs Card component equipment metadata (rank/suit/trumpRank/trumpValue)
  // in the TS component table before this root can faithfully route site cards.
  throw new LudemeCompileError("(card Rank/Suit/TrumpRank/TrumpValue) needs card component metadata.");
}

register("int", "card", compileCard as any);
