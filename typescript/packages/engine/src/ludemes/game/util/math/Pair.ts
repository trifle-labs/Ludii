// @java Core/src/game/util/math/Pair.java
//
// Defines a pair of two integers, two strings, or a mix of integer/string/RoleType/LandmarkType.
// Used for the map ludeme. Faithfully mirrors all Java constructors.

import type { IntFunction } from "../../../base.js";
import { IntConstant } from "../../functions/ints/IntConstant.js";
import { RoleType, roleTypeOwner } from "../end/RoleType.js";
import { LandmarkType } from "./LandmarkType.js";

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

type PairArg = IntFunction | number | RoleType | LandmarkType | string;

interface PairFields {
  readonly intKey: IntFunction | null;
  readonly stringKey: string | null;
  readonly intValue: IntFunction | null;
  readonly stringValue: string | null;
  readonly landmark: LandmarkType | null;
  readonly roleTypeKey: RoleType | null;
  readonly roleTypeValue: RoleType | null;
}

function isIntFunction(value: unknown): value is IntFunction {
  return typeof (value as IntFunction | null)?.eval === "function";
}

function asIntFunction(value: IntFunction | number): IntFunction {
  return typeof value === "number" ? new IntConstant(value) : value;
}

function isIntArg(value: unknown): value is IntFunction | number {
  return typeof value === "number" || isIntFunction(value);
}

function roleFromName(value: string): RoleType | null {
  const role = (RoleType as unknown as Record<string, RoleType>)[value];
  return typeof role === "number" ? role : null;
}

function landmarkFromName(value: string): LandmarkType | null {
  const landmark = (LandmarkType as unknown as Record<string, LandmarkType>)[value];
  return typeof landmark === "number" ? landmark : null;
}

function dispatchPair(key: PairArg, value: PairArg): PairFields {
  const keyRole = typeof key === "string" ? roleFromName(key) : null;
  if (keyRole !== null) {
    const valueRole = typeof value === "string" ? roleFromName(value) : null;
    if (valueRole !== null) {
      return fields(roleToIntFn(keyRole), null, roleToIntFn(valueRole), null, null, keyRole, valueRole);
    }

    const valueLandmark = typeof value === "string" ? landmarkFromName(value) : null;
    if (valueLandmark !== null) {
      return fields(roleToIntFn(keyRole), null, null, null, valueLandmark, keyRole, null);
    }

    if (isIntArg(value)) {
      return fields(roleToIntFn(keyRole), null, asIntFunction(value), null, null, keyRole, null);
    }

    if (typeof value === "string") {
      return fields(roleToIntFn(keyRole), null, null, value, null, keyRole, null);
    }
  }

  if (typeof key === "string") {
    const valueRole = typeof value === "string" ? roleFromName(value) : null;
    if (valueRole !== null) {
      return fields(null, key, roleToIntFn(valueRole), null, null, null, valueRole);
    }

    if (typeof value === "string") {
      return fields(null, key, null, value, null, null, null);
    }
  }

  if (isIntArg(key)) {
    if (isIntArg(value)) {
      return fields(asIntFunction(key), null, asIntFunction(value), null, null, null, null);
    }

    if (typeof value === "string") {
      return fields(asIntFunction(key), null, null, value, null, null, null);
    }
  }

  throw new TypeError("Pair constructor arguments do not match a Java Pair overload.");
}

function fields(
  intKey: IntFunction | null,
  stringKey: string | null,
  intValue: IntFunction | null,
  stringValue: string | null,
  landmark: LandmarkType | null,
  roleTypeKey: RoleType | null,
  roleTypeValue: RoleType | null,
): PairFields {
  return { intKey, stringKey, intValue, stringValue, landmark, roleTypeKey, roleTypeValue };
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

  /**
   * Public Java-parity constructor covering all Pair overloads.
   *
   * RoleType and LandmarkType values passed by the faithful compiler arrive as
   * their enum names; numeric values are treated as IntFunction constants.
   */
  public constructor(key: PairArg, value: PairArg) {
    const pairFields = dispatchPair(key, value);
    this.intKey = pairFields.intKey;
    this.stringKey = pairFields.stringKey;
    this.intValue = pairFields.intValue;
    this.stringValue = pairFields.stringValue;
    this.landmark = pairFields.landmark;
    this.roleTypeKey = pairFields.roleTypeKey;
    this.roleTypeValue = pairFields.roleTypeValue;
  }

  // ---------------------------------------------------------------------------
  // Static factories mirroring Java constructors
  // ---------------------------------------------------------------------------

  /** @java Pair(IntFunction key, IntFunction value) */
  public static fromIntInt(key: IntFunction, value: IntFunction): Pair {
    return Pair.fromFields(fields(key, null, value, null, null, null, null));
  }

  /** @java Pair(RoleType key, IntFunction value) */
  public static fromRoleInt(key: RoleType, value: IntFunction): Pair {
    return Pair.fromFields(fields(roleToIntFn(key), null, value, null, null, key, null));
  }

  /** @java Pair(RoleType key, RoleType value) */
  public static fromRoleRole(key: RoleType, value: RoleType): Pair {
    return Pair.fromFields(fields(roleToIntFn(key), null, roleToIntFn(value), null, null, key, value));
  }

  /** @java Pair(String key, String value) */
  public static fromStringString(key: string, value: string): Pair {
    return Pair.fromFields(fields(null, key, null, value, null, null, null));
  }

  /** @java Pair(IntFunction key, String value) */
  public static fromIntString(key: IntFunction, value: string): Pair {
    return Pair.fromFields(fields(key, null, null, value, null, null, null));
  }

  /** @java Pair(RoleType key, String value) */
  public static fromRoleString(key: RoleType, value: string): Pair {
    return Pair.fromFields(fields(roleToIntFn(key), null, null, value, null, key, null));
  }

  /** @java Pair(RoleType key, LandmarkType landmark) */
  public static fromRoleLandmark(key: RoleType, landmark: LandmarkType): Pair {
    return Pair.fromFields(fields(roleToIntFn(key), null, null, null, landmark, key, null));
  }

  /** @java Pair(String key, RoleType value) */
  public static fromStringRole(key: string, value: RoleType): Pair {
    return Pair.fromFields(fields(null, key, roleToIntFn(value), null, null, null, value));
  }

  private static fromFields(pairFields: PairFields): Pair {
    const pair = Object.create(Pair.prototype) as Pair;
    const mutablePair = pair as {
      intKey: IntFunction | null;
      stringKey: string | null;
      intValue: IntFunction | null;
      stringValue: string | null;
      landmark: LandmarkType | null;
      roleTypeKey: RoleType | null;
      roleTypeValue: RoleType | null;
    };
    mutablePair.intKey = pairFields.intKey;
    mutablePair.stringKey = pairFields.stringKey;
    mutablePair.intValue = pairFields.intValue;
    mutablePair.stringValue = pairFields.stringValue;
    mutablePair.landmark = pairFields.landmark;
    mutablePair.roleTypeKey = pairFields.roleTypeKey;
    mutablePair.roleTypeValue = pairFields.roleTypeValue;
    return pair;
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
