// @java Core/src/game/functions/ints/board/ArrayValue.java

/**
 * Returns one value of an array.
 *
 * @java game/functions/ints/board/ArrayValue.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Minimal interface for IntArrayFunction used here.
 * @java game.functions.intArray.IntArrayFunction
 */
interface JavaIntArrayFunction {
  eval(ctx: Context): number[];
  isStatic(): boolean;
  concepts(game: unknown): ReadonlySet<number>;
  writesEvalContextRecursive(): ReadonlySet<number>;
  readsEvalContextRecursive(): ReadonlySet<number>;
  missingRequirement(game: unknown): boolean;
  willCrash(game: unknown): boolean;
  preprocess(game: unknown): void;
  toEnglish(game: unknown): string;
}

/**
 * Returns one value of an array.
 *
 * @java game/functions/ints/board/ArrayValue.java
 */
export class ArrayValue extends BaseIntFunction {
  /** Which array. @java ArrayValue.array */
  private readonly array: JavaIntArrayFunction;

  /** Which index. @java ArrayValue.indexFn */
  private readonly indexFn: JavaIntFunction;

  /** Precomputed value if possible. @java ArrayValue.precomputedValue */
  private precomputedValue: number = OFF;

  /**
   * @param array  The array.
   * @param index  The index of the site in the region.
   * @java ArrayValue(IntArrayFunction, IntFunction)
   */
  public constructor(array: JavaIntArrayFunction, index: JavaIntFunction) {
    super();
    this.array = array;
    this.indexFn = index;
  }

  /**
   * @java ArrayValue.eval(Context)
   *
   * Returns the value at the given index of the array.
   */
  public override eval(context: Context): number {
    if (this.precomputedValue !== OFF)
      return this.precomputedValue;

    const sites = this.array.eval(context);
    const index = this.indexFn.eval(context);

    if (index < 0) {
      // Java: System.out.println("** Negative index in (regionSite ...).");
      console.log("** Negative index in (regionSite ...).");
      return OFF;
    } else if (index < sites.length) {
      return sites[index]!;
    }

    return OFF;
  }

  /** @java ArrayValue.isStatic() */
  public isStatic(): boolean {
    return (this.array as unknown as { isStatic?(): boolean }).isStatic?.() ?? false
      && (this.indexFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
  }

  /** @java ArrayValue.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    for (const bit of this.array.concepts(game)) concepts.add(bit);
    for (const bit of this.indexFn.concepts(game)) concepts.add(bit);
    return concepts;
  }

  /** @java ArrayValue.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    for (const bit of this.array.writesEvalContextRecursive()) writeEvalContext.add(bit);
    for (const bit of this.indexFn.writesEvalContextRecursive()) writeEvalContext.add(bit);
    return writeEvalContext;
  }

  /** @java ArrayValue.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    for (const bit of this.array.readsEvalContextRecursive()) readEvalContext.add(bit);
    for (const bit of this.indexFn.readsEvalContextRecursive()) readEvalContext.add(bit);
    return readEvalContext;
  }

  /** @java ArrayValue.preprocess(Game) */
  public preprocess(game: unknown): void {
    this.array.preprocess(game);
    (this.indexFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    // Java: if (isStatic()) precomputedValue = eval(new Context(game, null));
    // Skip actual precomputation — we cannot create a real Context here.
  }

  /** @java ArrayValue.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    missingRequirement = missingRequirement || this.array.missingRequirement(game);
    missingRequirement = missingRequirement || this.indexFn.missingRequirement(game);
    return missingRequirement;
  }

  /** @java ArrayValue.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.array.willCrash(game);
    willCrash = willCrash || this.indexFn.willCrash(game);
    return willCrash;
  }

  /** @java ArrayValue.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    return "site " + this.indexFn.toEnglish(game) + " of array " + this.array.toEnglish(game);
  }
}
