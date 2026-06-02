// @java Core/src/game/util/math/Pair.java
//
// Defines a pair of two integers, two strings, or a mix of integer/string/RoleType/LandmarkType.
// Used for the map ludeme. Faithfully mirrors all Java constructors.

import type { IntFunction } from "../../../base.js";
import { IntConstant } from "../../functions/ints/IntConstant.js";
import { type RoleType, roleTypeOwner } from "../end/RoleType.js";
import { type LandmarkType } from "./LandmarkType.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Wraps a RoleType as an IntFunction returning its owner index (1-based player, or -1).
 * @java RoleType.toIntFunction(RoleType) — proxied here to avoid circular deps.
 */
function roleToIntFn(role: RoleType): IntFunction {
  const val = roleTypeOwner(role);
  return new IntConstant(val);
}

/**
 * Defines a pair of two integers, two strings or one integer and a string.
 * Used for the map ludeme.
 *
 * @java game.util.math.Pair
 */
export class Pair {
  /** The integer key. @java Pair.intKey */
  public readonly intKey: IntFunction | null;

  /** The string key. @java Pair.stringKey */
  public readonly stringKey: string | null;

  /** The integer value. @java Pair.intValue */
  public readonly intValue: IntFunction | null;

  /** The string value. @java Pair.stringValue */
  public readonly stringValue: string | null;

  /** The landmark value. @java Pair.landmark */
  public readonly landmark: LandmarkType | null;

  /** The key RoleType (for validation). @java Pair.roleTypeKey */
  public readonly roleTypeKey: RoleType | null;

  /** The value RoleType (for validation). @java Pair.roleTypeValue */
  public readonly roleTypeValue: RoleType | null;

  // ---------------------------------------------------------------------------
  // Private constructor — use static factory methods below.
  // ---------------------------------------------------------------------------

  private constructor(
    intKey: IntFunction | null,
    stringKey: string | null,
    intValue: IntFunction | null,
    stringValue: string | null,
    landmark: LandmarkType | null,
    roleTypeKey: RoleType | null,
    roleTypeValue: RoleType | null,
  ) {
    this.intKey = intKey;
    this.stringKey = stringKey;
    this.intValue = intValue;
    this.stringValue = stringValue;
    this.landmark = landmark;
    this.roleTypeKey = roleTypeKey;
    this.roleTypeValue = roleTypeValue;
  }

  // ---------------------------------------------------------------------------
  // Static factories mirroring Java constructors
  // ---------------------------------------------------------------------------

  /** @java Pair(IntFunction key, IntFunction value) */
  public static fromIntInt(key: IntFunction, value: IntFunction): Pair {
    return new Pair(key, null, value, null, null, null, null);
  }

  /** @java Pair(RoleType key, IntFunction value) */
  public static fromRoleInt(key: RoleType, value: IntFunction): Pair {
    return new Pair(roleToIntFn(key), null, value, null, null, key, null);
  }

  /** @java Pair(RoleType key, RoleType value) */
  public static fromRoleRole(key: RoleType, value: RoleType): Pair {
    return new Pair(roleToIntFn(key), null, roleToIntFn(value), null, null, key, value);
  }

  /** @java Pair(String key, String value) */
  public static fromStringString(key: string, value: string): Pair {
    return new Pair(null, key, null, value, null, null, null);
  }

  /** @java Pair(IntFunction key, String value) */
  public static fromIntString(key: IntFunction, value: string): Pair {
    return new Pair(key, null, null, value, null, null, null);
  }

  /** @java Pair(RoleType key, String value) */
  public static fromRoleString(key: RoleType, value: string): Pair {
    return new Pair(roleToIntFn(key), null, null, value, null, key, null);
  }

  /** @java Pair(RoleType key, LandmarkType landmark) */
  public static fromRoleLandmark(key: RoleType, landmark: LandmarkType): Pair {
    return new Pair(roleToIntFn(key), null, null, null, landmark, key, null);
  }

  /** @java Pair(String key, RoleType value) */
  public static fromStringRole(key: string, value: RoleType): Pair {
    return new Pair(null, key, roleToIntFn(value), null, null, null, value);
  }

  // ---------------------------------------------------------------------------
  // Accessors (mirroring Java, with UNDEFINED fallback)
  // ---------------------------------------------------------------------------

  /**
   * @java Pair.intValue() — returns intValue or IntConstant(UNDEFINED)
   */
  public getIntValue(): IntFunction {
    return this.intValue ?? new IntConstant(UNDEFINED);
  }

  /**
   * @java Pair.intKey() — returns intKey or IntConstant(UNDEFINED)
   */
  public getIntKey(): IntFunction {
    return this.intKey ?? new IntConstant(UNDEFINED);
  }
}
