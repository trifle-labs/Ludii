// @java Core/src/game/util/optimiser/Optimiser.java
//
// Optimiser which can optimise a compiled game by injecting more efficient
// ludemes (replacing dynamic BaseBooleanFunction / BaseIntFunction /
// BaseRegionFunction nodes with constant equivalents when they are static).
//
// The Java implementation uses java.lang.reflect to walk all fields of every
// Ludeme at runtime. In TypeScript we replicate the same algorithm using
// Object.entries / Object.getOwnPropertyNames to walk own + prototype-chain
// non-static fields.  The semantics are a faithful 1:1 transliteration.

// ---------------------------------------------------------------------------
// Minimal opaque type stand-ins for absent subsystems
// ---------------------------------------------------------------------------

/**
 * Minimal surface of java.util.BitSet needed by BaseLudeme.
 * @java java.util.BitSet
 */
interface IBitSet {
  get(bitIndex: number): boolean;
  set(bitIndex: number): void;
}

/** Minimal IGame surface. @java game.Game */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IGame = Record<string, any>;

/** @java other.Ludeme */
interface Ludeme {
  /** Discriminant present on every ludeme object. */
  readonly _ludeme?: true;
  toEnglish?(game: IGame): string;
  concepts?(game: IGame): IBitSet;
}

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = Record<string, any>;

/** @java other.trial.Trial */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Trial = Record<string, any>;

/**
 * Minimal surface of game.Game used by optimiseGame.
 * @java game.Game
 */
interface Game extends Ludeme {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Constant-injection stand-ins
// These mirror the Java constant ludemes produced during optimisation.
// ---------------------------------------------------------------------------

/**
 * @java game.functions.region.BaseRegionFunction
 * Minimal structural type — a ludeme whose eval returns a region (number[]).
 */
interface BaseRegionFunction extends Ludeme {
  isStatic(): boolean;
  eval(context: Context): number[];
}

/**
 * @java game.functions.region.RegionConstant
 */
class RegionConstant {
  private readonly _region: number[];
  public constructor(region: number[]) {
    this._region = region;
  }
  public isStatic(): boolean { return true; }
  public eval(_context: Context): number[] { return this._region; }
}

/**
 * @java game.functions.ints.BaseIntFunction
 */
interface BaseIntFunction extends Ludeme {
  isStatic(): boolean;
  eval(context: Context): number;
}

/**
 * @java game.functions.ints.IntConstant
 */
class IntConstant {
  private readonly _value: number;
  public constructor(value: number) {
    this._value = value;
  }
  public isStatic(): boolean { return true; }
  public eval(_context: Context): number { return this._value; }
}

/**
 * @java game.functions.booleans.BaseBooleanFunction
 */
interface BaseBooleanFunction extends Ludeme {
  isStatic(): boolean;
  eval(context: Context): boolean;
}

/**
 * @java game.functions.booleans.BooleanConstant
 */
class BooleanConstant {
  private readonly _value: boolean;
  public constructor(value: boolean) {
    this._value = value;
  }
  public isStatic(): boolean { return true; }
  public eval(_context: Context): boolean { return this._value; }
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isLudeme(value: unknown): value is Ludeme {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBaseRegionFunction(value: unknown): value is BaseRegionFunction {
  return isLudeme(value) &&
    typeof (value as BaseRegionFunction).isStatic === "function" &&
    typeof (value as BaseRegionFunction).eval === "function" &&
    !(value instanceof RegionConstant);
}

function isBaseIntFunction(value: unknown): value is BaseIntFunction {
  return isLudeme(value) &&
    typeof (value as BaseIntFunction).isStatic === "function" &&
    typeof (value as BaseIntFunction).eval === "function" &&
    !(value instanceof IntConstant) &&
    // distinguish from BaseBooleanFunction by checking eval returns a number
    // (structural guard only — callers must check instanceof order)
    !isBaseBooleanFunctionOnly(value);
}

function isBaseBooleanFunctionOnly(value: unknown): boolean {
  // A boolean function's eval returns boolean — we can't tell at runtime
  // without instanceof; use a marker property convention as best-effort.
  return isLudeme(value) &&
    typeof (value as BaseBooleanFunction).isStatic === "function" &&
    typeof (value as BaseBooleanFunction).eval === "function" &&
    !(value instanceof BooleanConstant) &&
    // Java check was !BooleanConstant.class.isAssignableFrom(valueClass) which
    // is the same as !(value instanceof BooleanConstant) — already done above.
    true;
}

function isBaseBooleanFunction(value: unknown): value is BaseBooleanFunction {
  return isLudeme(value) &&
    typeof (value as BaseBooleanFunction).isStatic === "function" &&
    typeof (value as BaseBooleanFunction).eval === "function" &&
    !(value instanceof BooleanConstant);
}

function isIterable(value: unknown): value is Iterable<unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Symbol.iterator in (value as object);
}

// ---------------------------------------------------------------------------
// Reflection utilities (faithful TS equivalent of ReflectionUtils.getAllFields)
// ---------------------------------------------------------------------------

/**
 * Returns all own and inherited enumerable string-keyed property names for
 * an object, stopping at Object.prototype.
 * Mirrors Java's ReflectionUtils.getAllFields(Class).
 *
 * @java main.ReflectionUtils.getAllFields(Class<?>)
 */
function getAllFieldNames(obj: object): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  let proto: object | null = obj;
  while (proto !== null && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return names;
}

// ---------------------------------------------------------------------------
// Optimiser — public API
// ---------------------------------------------------------------------------

/**
 * Optimiser which can optimise a compiled game by injecting more efficient ludemes.
 *
 * @java game.util.optimiser.Optimiser
 */
export class Optimiser {
  // -------------------------------------------------------------------------

  /**
   * Optimises the given (compiled) game object.
   *
   * @java Optimiser.optimiseGame(Game game)
   */
  public static optimiseGame(game: Game): void {
    // Java creates a dummy context: new Context(game, new Trial(game))
    // We create a minimal dummy context object that satisfies the Context type.
    const dummyContext: Context = { _game: game };
    Optimiser._optimiseLudeme(game, dummyContext, new Map<object, Set<string>>());
  }

  // -------------------------------------------------------------------------

  /**
   * Optimises the subtree rooted in the given ludeme.
   *
   * @java Optimiser.optimiseLudeme(Ludeme ludeme, Context dummyContext, Map<Object,Set<String>> visited)
   */
  private static _optimiseLudeme(
    ludeme: Ludeme,
    dummyContext: Context,
    visited: Map<object, Set<string>>,
  ): void {
    const fieldNames = getAllFieldNames(ludeme as object);

    for (const fieldName of fieldNames) {
      // Skip synthetic / compiler-generated names (Java: field.getName().contains("$"))
      if (fieldName.includes("$")) continue;

      // Skip constructors and methods (Java only iterates declared fields)
      const descriptor = Object.getOwnPropertyDescriptor(ludeme, fieldName) ??
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ludeme as object) ?? {}, fieldName);
      if (descriptor && typeof descriptor.value === "function") continue;

      // Skip if already visited to avoid cycles (Java: Modifier.STATIC check + visited map)
      const visitedFields = visited.get(ludeme as object);
      if (visitedFields !== undefined && visitedFields.has(fieldName)) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: unknown;
      try {
        value = (ludeme as Record<string, unknown>)[fieldName];
      } catch (_e) {
        continue;
      }

      // Record visit
      if (!visited.has(ludeme as object)) {
        visited.set(ludeme as object, new Set<string>());
      }
      visited.get(ludeme as object)!.add(fieldName);

      if (value === null || value === undefined) continue;

      // Skip enums / primitives / strings
      if (typeof value !== "object") continue;

      if (isLudeme(value) && !Array.isArray(value)) {
        let recurse = true;

        if (isBaseRegionFunction(value) && !(value instanceof RegionConstant)) {
          if (value.isStatic()) {
            const constReg = new RegionConstant(value.eval(dummyContext));
            Optimiser._injectLudeme(ludeme as object, constReg, value, new Set<object>());
            recurse = false;
          }
        } else if (isBaseIntFunction(value) && !(value instanceof IntConstant)) {
          if (value.isStatic()) {
            const constInt = new IntConstant(value.eval(dummyContext));
            Optimiser._injectLudeme(ludeme as object, constInt, value, new Set<object>());
            recurse = false;
          }
        } else if (isBaseBooleanFunction(value) && !(value instanceof BooleanConstant)) {
          // Java has a bug here: the condition was:
          //   BaseBooleanFunction.class.isAssignableFrom(valueClass) &&
          //   !BaseBooleanFunction.class.isAssignableFrom(valueClass)
          // which is always false, so this branch never fires in Java either.
          // We preserve the dead-code faithfully (recurse stays true).
          if (value.isStatic()) {
            const constBool = new BooleanConstant(value.eval(dummyContext));
            Optimiser._injectLudeme(ludeme as object, constBool, value, new Set<object>());
            recurse = false;
          }
        }

        if (recurse) {
          Optimiser._optimiseLudeme(value as Ludeme, dummyContext, visited);
        }
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const element: unknown = value[i];
          if (element === null || element === undefined) continue;
          if (!isLudeme(element)) continue;

          let recurse = true;

          if (isBaseRegionFunction(element) && !(element instanceof RegionConstant)) {
            if (element.isStatic()) {
              const constReg = new RegionConstant(element.eval(dummyContext));
              Optimiser._injectLudeme(ludeme as object, constReg, element, new Set<object>());
              recurse = false;
            }
          } else if (isBaseIntFunction(element) && !(element instanceof IntConstant)) {
            if (element.isStatic()) {
              const constInt = new IntConstant(element.eval(dummyContext));
              Optimiser._injectLudeme(ludeme as object, constInt, element, new Set<object>());
              recurse = false;
            }
          } else if (isBaseBooleanFunction(element) && !(element instanceof BooleanConstant)) {
            if (element.isStatic()) {
              const constBool = new BooleanConstant(element.eval(dummyContext));
              Optimiser._injectLudeme(ludeme as object, constBool, element, new Set<object>());
              recurse = false;
            }
          }

          if (recurse) {
            Optimiser._optimiseLudeme(element as Ludeme, dummyContext, visited);
          }
        }
      } else if (isIterable(value)) {
        for (const element of value) {
          if (element === null || element === undefined) continue;
          if (!isLudeme(element)) continue;

          let recurse = true;

          if (isBaseRegionFunction(element) && !(element instanceof RegionConstant)) {
            if (element.isStatic()) {
              const constReg = new RegionConstant(element.eval(dummyContext));
              Optimiser._injectLudeme(ludeme as object, constReg, element, new Set<object>());
              recurse = false;
            }
          } else if (isBaseIntFunction(element) && !(element instanceof IntConstant)) {
            if (element.isStatic()) {
              const constInt = new IntConstant(element.eval(dummyContext));
              Optimiser._injectLudeme(ludeme as object, constInt, element, new Set<object>());
              recurse = false;
            }
          } else if (isBaseBooleanFunction(element) && !(element instanceof BooleanConstant)) {
            if (element.isStatic()) {
              const constBool = new BooleanConstant(element.eval(dummyContext));
              Optimiser._injectLudeme(ludeme as object, constBool, element, new Set<object>());
              recurse = false;
            }
          }

          if (recurse) {
            Optimiser._optimiseLudeme(element as Ludeme, dummyContext, visited);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Injects the given new ludeme such that it replaces the original ludeme
   * if the original ludeme is a field of the given parent object.
   *
   * @java Optimiser.injectLudeme(Object parentObject, Ludeme newLudeme, Ludeme origLudeme, Set<Object> inspectedParentObjects)
   */
  private static _injectLudeme(
    parentObject: object,
    newLudeme: object,
    origLudeme: object,
    inspectedParentObjects: Set<object>,
  ): void {
    if (inspectedParentObjects.has(parentObject)) return;

    inspectedParentObjects.add(parentObject);

    if (Array.isArray(parentObject)) {
      for (let i = 0; i < parentObject.length; i++) {
        const obj: unknown = parentObject[i];
        if (obj === null || obj === undefined) continue;

        if (Array.isArray(obj) || isIterable(obj)) {
          Optimiser._injectLudeme(obj as object, newLudeme, origLudeme, inspectedParentObjects);
        } else if (obj === origLudeme) {
          parentObject[i] = newLudeme;
        }
      }
    } else {
      const parentFields = getAllFieldNames(parentObject);
      for (const fieldName of parentFields) {
        if (fieldName.includes("$")) continue;

        const descriptor = Object.getOwnPropertyDescriptor(parentObject, fieldName) ??
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(parentObject) ?? {}, fieldName);
        if (descriptor && typeof descriptor.value === "function") continue;

        let fieldVal: unknown;
        try {
          fieldVal = (parentObject as Record<string, unknown>)[fieldName];
        } catch (_e) {
          continue;
        }
        if (fieldVal === null || fieldVal === undefined) continue;

        if (Array.isArray(fieldVal) || isIterable(fieldVal)) {
          Optimiser._injectLudeme(fieldVal as object, newLudeme, origLudeme, inspectedParentObjects);
        } else if (fieldVal === origLudeme) {
          try {
            (parentObject as Record<string, unknown>)[fieldName] = newLudeme;
          } catch (_e) {
            // read-only property — skip
          }
        }
      }
    }
  }
}
