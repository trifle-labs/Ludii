// @java Core/src/game/functions/ints/value/Value.java

/**
 * Returns the value of the specified property.
 *
 * @java game/functions/ints/value/Value.java
 * @author Eric Piette
 *
 * @remarks This is a static-factory-only dispatcher class. Its eval() should
 *          never be called directly — all real work is done by the concrete
 *          subclasses returned by the construct() overloads.
 */

import { BaseIntFunction } from "../BaseIntFunction.js";
import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { Range } from "../../range/Range.js";
import { RoleType } from "../../../util/end/RoleType.js";
import { ValueIterated } from "./iterated/ValueIterated.js";
import { ValuePiece } from "./piece/ValuePiece.js";
import { ValuePlayer } from "./player/ValuePlayer.js";
import { ValueRandom } from "./random/ValueRandom.js";
import { ValueMoveLimit } from "./simple/ValueMoveLimit.js";
import { ValuePending } from "./simple/ValuePending.js";
import { ValueTurnLimit } from "./simple/ValueTurnLimit.js";

/**
 * Root Value class — should never have eval() called on it directly.
 * Mirrors Java Value which throws UnsupportedOperationException from eval().
 *
 * @java game/functions/ints/value/Value.java
 */
export class Value extends BaseIntFunction {
  /** @java Value.construct(ValueRandomType, RangeFunction) */
  public static constructRandom(valueType: unknown, range: Range): BaseIntFunction {
    if (valueType === "Random") return new ValueRandom(range);
    throw new Error("Value(): A ValueRandomType is not implemented.");
  }

  /** @java Value.construct(ValueSimpleType) */
  public static constructSimple(valueType: unknown): BaseIntFunction {
    if (valueType === "Pending") return new ValuePending();
    if (valueType === "MoveLimit") return new ValueMoveLimit();
    if (valueType === "TurnLimit") return new ValueTurnLimit();
    throw new Error("Value(): A ValueSimpleType is not implemented.");
  }

  /** @java Value.construct(ValuePlayerType, IntFunction, RoleType) */
  public static constructPlayer(
    valueType: unknown,
    indexPlayer: IntFunction | null,
    role: unknown,
  ): BaseIntFunction {
    if (valueType === "Player")
      return new ValuePlayer(indexPlayer as never, role === null || role === undefined ? null : roleTypeFrom(role));
    throw new Error("Value(): A ValuePlayerType is not implemented.");
  }

  /** @java Value.construct(ValueComponentType, SiteType, IntFunction, IntFunction) */
  public static constructComponent(
    valueType: unknown,
    type: unknown,
    at: IntFunction,
    level: IntFunction | null,
  ): BaseIntFunction {
    if (valueType === "Piece") return new ValuePiece(siteTypeFrom(type), at as never, level as never);
    throw new Error("Value(): A ValueComponentType is not implemented.");
  }

  /** @java Value.construct() */
  public static construct(): BaseIntFunction {
    return new ValueIterated();
  }

  /**
   * Private constructor — Value is a static-factory-only class in Java.
   * @java Value() — private
   */
  private constructor() {
    super();
  }

  /**
   * @java Value.eval(Context) — throws UnsupportedOperationException
   * Should not be called; dispatch always goes to a concrete subtype.
   */
  public override eval(_context: Context): number {
    // Should not be called, should only be called on subclasses
    throw new Error("Value.eval(): Should never be called directly.");
  }

  /** @java Value.isStatic() — should never be reached */
  public isStatic(): boolean {
    // Should never be there
    return false;
  }
}

function roleTypeFrom(role: unknown): RoleType {
  if (typeof role === "number") return role as RoleType;
  const text = String(role);
  const direct = (RoleType as unknown as Record<string, RoleType>)[text];
  if (direct !== undefined) return direct;
  const player = /^P(\d+)$/i.exec(text);
  if (player) return Number(player[1]) as RoleType;
  const team = /^Team(\d+)$/i.exec(text);
  if (team) return (100 + Number(team[1])) as RoleType;
  return RoleType.Mover;
}

function siteTypeFrom(type: unknown): "Cell" | "Vertex" | "Edge" | null {
  return type === "Cell" || type === "Vertex" || type === "Edge" ? type : null;
}
