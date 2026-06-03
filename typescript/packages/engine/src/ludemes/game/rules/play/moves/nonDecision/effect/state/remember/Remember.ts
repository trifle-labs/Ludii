// @java Core/src/game/rules/play/moves/nonDecision/effect/state/remember/Remember.java
/**
 * Remember information about the state to be used in future state.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/state/remember/Remember.java
 *
 * @remarks This is a factory class — instantiation is done via static construct()
 *          methods. The eval() on the Remember class itself should never be called
 *          directly (Java throws UnsupportedOperationException).
 */

import type { Context } from "../../../../../../../../../context.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../../../base.js";
import type { Move } from "../../../../../../../../../move.js";
import type { Then } from "../../Then.js";
import { RememberState } from "./state/RememberState.js";
import { ActionRememberValue } from "../../../../../../../../../action/action-remember.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

/** @java RememberValueType enum */
export type RememberValueType = "Value";

/** @java RememberStateType enum */
export type RememberStateType = "State";

/**
 * Inline RememberValue implementation.
 * @java game/rules/play/moves/nonDecision/effect/state/remember/value/RememberValue.java
 */
class RememberValueImpl implements MovesFunction {
  private readonly name: string | null;
  private readonly value: IntFunction;
  private readonly unique: BooleanFunction | null;
  private readonly thenClause: Then | null;

  public constructor(
    name: string | null,
    value: IntFunction,
    unique: BooleanFunction | null,
    thenClause: Then | null,
  ) {
    this.name = name;
    this.value = value;
    this.unique = unique;
    this.thenClause = thenClause;
  }

  public eval(ctx: Context): Move[] {
    const v = this.value.eval(ctx);
    const mover = ctx.state.mover;

    // Check uniqueness if required
    if (this.unique != null && this.unique.eval(ctx)) {
      const stateAny = ctx.state as unknown as {
        rememberingValues?: number[];
        mapRememberingValues?: Map<string, number[]>;
      };
      const existing = this.name != null
        ? stateAny.mapRememberingValues?.get(this.name) ?? []
        : stateAny.rememberingValues ?? [];
      if (existing.includes(v)) return [];
    }

    const action = new ActionRememberValue(this.name ?? "", v);
    const move = new LudiiMove({
      id: `rememberValue:${mover}:${this.name ?? ""}:${v}`,
      label: `RememberValue(${this.name ?? ""}=${v})`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
    });

    if (this.thenClause != null) {
      const thenMoves = this.thenClause.eval(ctx);
      return [move.withConsequence(
        thenMoves.flatMap((tm: Move) => [...tm.actions]),
        false,
      )];
    }

    return [move];
  }
}

export class Remember implements MovesFunction {
  private constructor() {
    // @java Remember.java:87-89 — private constructor, never instantiated directly
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/remember/Remember.java — construct(RememberValueType, ...)
   *
   * For remembering a value.
   *
   * @param rememberType The type of property to remember.
   * @param name         The name of the remembering values [null].
   * @param value        The value to remember.
   * @param unique       True if each remembered value has to be unique [False].
   * @param then         The moves applied after that move is applied.
   */
  public static constructValue(
    rememberType: RememberValueType,
    name: string | null,
    value: IntFunction,
    unique: BooleanFunction | null,
    then: Then | null,
  ): MovesFunction {
    switch (rememberType) {
      case "Value":
        return new RememberValueImpl(name, value, unique, then);
      default:
        throw new Error(`Remember(): A RememberValueType is not implemented: ${String(rememberType)}`);
    }
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/remember/Remember.java — construct(RememberStateType, ...)
   *
   * For remembering the current state.
   *
   * @param rememberType The type of property to remember.
   * @param then         The moves applied after that move is applied.
   */
  public static constructState(
    rememberType: RememberStateType,
    then: Then | null,
  ): MovesFunction {
    switch (rememberType) {
      case "State":
        // RememberState takes MovesFunction | null; Then wraps a MovesFunction
        return new RememberState(then != null ? then.moves() : null);
      default:
        throw new Error(`Remember(): A RememberStateType is not implemented: ${String(rememberType)}`);
    }
  }

  /**
   * @java Remember.java:96 — eval() should never be called on Remember directly
   */
  public eval(_ctx: Context): Move[] {
    throw new Error("Remember.eval(): Should never be called directly.");
  }
}
