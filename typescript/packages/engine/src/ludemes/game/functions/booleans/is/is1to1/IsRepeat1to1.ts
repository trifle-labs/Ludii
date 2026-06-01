// @java Core/src/game/functions/booleans/is/repeat/IsRepeat.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * Repetition type enum (mirrors Java StateType).
 * @java game/types/state/StateType.java
 */
type RepeatType = "PositionalInTurn" | "SituationalInTurn" | "Positional" | "Situational";

/**
 * (is Repeat [<StateType>])
 * Returns true if the current state (hash) has been seen before.
 * PositionalInTurn / SituationalInTurn check within the current turn;
 * Positional / Situational check across the whole game.
 * @java game/functions/booleans/is/repeat/IsRepeat.java
 */
export class IsRepeat1to1 implements BooleanFunction {
  /** @java IsRepeat.type */
  private readonly type: RepeatType;

  public constructor(type: RepeatType = "Positional") {
    this.type = type;
  }

  /**
   * @java IsRepeat.eval(Context) — switch(type)
   *   PositionalInTurn:  stateHash in trial.previousStateWithinATurn
   *   SituationalInTurn: fullHash  in trial.previousStateWithinATurn
   *   Positional:        stateHash in trial.previousState
   *   Situational:       fullHash  in trial.previousState
   *
   * TS parity: both hash variants use state.hash() (the TS fullHash equivalent).
   * previousStatesWithinATurn mirrors Java's previousStateWithinATurn.
   */
  public eval(ctx: Context): boolean {
    const hash = ctx.state.hash();
    switch (this.type) {
      case "PositionalInTurn":
      case "SituationalInTurn":
        return ctx.trial.previousStatesWithinATurn.includes(hash);
      case "Positional":
      case "Situational":
        return ctx.trial.previousStates.includes(hash);
    }
  }
}

registerBool1to1("is:repeat", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  // (is Repeat [Positional | Situational | PositionalInTurn | SituationalInTurn])
  const { positional } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Repeat", positional[1] = optional StateType ident
  const typeNode = positional[1];
  let repeatType: RepeatType = "Positional";
  if (typeNode && isIdent(typeNode)) {
    const name = typeNode.name;
    if (name === "Positional" || name === "Situational" ||
        name === "PositionalInTurn" || name === "SituationalInTurn") {
      repeatType = name as RepeatType;
    }
  }
  return new IsRepeat1to1(repeatType);
});
