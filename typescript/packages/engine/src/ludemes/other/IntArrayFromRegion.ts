// @java Core/src/other/IntArrayFromRegion.java
/**
 * Faithful 1:1 transliteration of other.IntArrayFromRegion.
 *
 * Optimised class to get an integer array of non-negative values from an
 * IntFunction or a RegionFunction.
 *
 * Deferrals:
 *  - IntFunction / RegionFunction / Game / Context: represented by minimal
 *    local interfaces that expose only the surface called in this class.
 *  - preprocess() creates a Context stub (new Context(game, null)) — we call
 *    eval() directly with a null-context-stub approach; callers must supply a
 *    real context object at runtime.
 *
 * Java parity: other/IntArrayFromRegion.java
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for types that live in other engine modules.
// ---------------------------------------------------------------------------

/** Minimal surface of game.Game used here. */
interface IGame {
  /** placeholder */
  [key: string]: unknown;
}

/** Minimal surface of other.context.Context used here. */
interface IContext {
  game(): IGame;
  trial(): unknown;
}

/** Minimal surface of game.functions.ints.IntFunction */
interface IntFunction {
  eval(context: IContext): number;
  isStatic(): boolean;
  gameFlags(game: IGame): number;
  concepts(game: IGame): ReadonlySet<number>;
  writesEvalContextRecursive(): ReadonlySet<number>;
  readsEvalContextRecursive(): ReadonlySet<number>;
  missingRequirement(game: IGame): boolean;
  willCrash(game: IGame): boolean;
  preprocess(game: IGame): void;
  toEnglish(game: IGame): string;
}

/** Minimal surface of game.functions.region.RegionFunction */
interface RegionFunction {
  eval(context: IContext): { sites(): number[] };
  isStatic(): boolean;
  gameFlags(game: IGame): number;
  concepts(game: IGame): ReadonlySet<number>;
  writesEvalContextRecursive(): ReadonlySet<number>;
  readsEvalContextRecursive(): ReadonlySet<number>;
  missingRequirement(game: IGame): boolean;
  willCrash(game: IGame): boolean;
  preprocess(game: IGame): void;
  toEnglish(game: IGame): string;
}

// ---------------------------------------------------------------------------

/**
 * Optimised class to get an integer array of non-negative values from an
 * IntFunction or a RegionFunction.
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class IntArrayFromRegion {
  /** The IntegerFunction. */
  private readonly intFunction: IntFunction | null;

  /** The RegionFunction. */
  private readonly regionFunction: RegionFunction | null;

  /** Precomputed int[]. */
  private precomputedArray: number[] | null = null;

  /**
   * @param intFunction    The IntFunction.
   * @param regionFunction The RegionFunction.
   */
  constructor(
    intFunction: IntFunction | null,
    regionFunction: RegionFunction | null,
  ) {
    this.intFunction = intFunction;
    this.regionFunction = regionFunction;
  }

  // -------------------------------------------------------------------------

  /**
   * @param context The context.
   * @return The result of the evaluation of the functions.
   */
  eval(context: IContext): number[] {
    if (this.precomputedArray !== null) {
      return this.precomputedArray;
    }

    if (this.intFunction !== null) {
      const value = this.intFunction.eval(context);
      if (value >= 0) {
        return [value];
      }
    } else if (this.regionFunction !== null) {
      // Our RegionFunction.eval returns a number[] directly; Java's returns a
      // Region (with .sites()). Handle both (SetHidden over a region —
      // Geister/Sneakthrough start rules threw `.sites is not a function`).
      const r = (this.regionFunction as unknown as { eval(c: unknown): number[] | { sites(): number[] } }).eval(context);
      return Array.isArray(r) ? r : r.sites();
    }

    return [];
  }

  // -------------------------------------------------------------------------

  /**
   * @return True if static.
   */
  isStatic(): boolean {
    if (this.intFunction !== null && !this.intFunction.isStatic()) {
      return false;
    }

    if (this.regionFunction !== null && !this.regionFunction.isStatic()) {
      return false;
    }

    return true;
  }

  // -------------------------------------------------------------------------

  /**
   * @param game The game.
   * @return The game flags.
   */
  gameFlags(game: IGame): number {
    let gameFlags = 0;

    if (this.intFunction !== null) {
      gameFlags |= this.intFunction.gameFlags(game);
    }

    if (this.regionFunction !== null) {
      gameFlags |= this.regionFunction.gameFlags(game);
    }

    return gameFlags;
  }

  // -------------------------------------------------------------------------

  /**
   * @param game The game.
   * @return The concepts as a Set of bit indices.
   */
  concepts(game: IGame): Set<number> {
    const concepts = new Set<number>();
    if (this.intFunction !== null) {
      for (const bit of this.intFunction.concepts(game)) {
        concepts.add(bit);
      }
    }
    if (this.regionFunction !== null) {
      for (const bit of this.regionFunction.concepts(game)) {
        concepts.add(bit);
      }
    }
    return concepts;
  }

  // -------------------------------------------------------------------------

  /**
   * @return The bitset about writing EvalContext variables.
   */
  writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    if (this.intFunction !== null) {
      for (const bit of this.intFunction.writesEvalContextRecursive()) {
        writeEvalContext.add(bit);
      }
    }
    if (this.regionFunction !== null) {
      for (const bit of this.regionFunction.writesEvalContextRecursive()) {
        writeEvalContext.add(bit);
      }
    }
    return writeEvalContext;
  }

  // -------------------------------------------------------------------------

  /**
   * @return The bitset about reading EvalContext variables.
   */
  readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    if (this.intFunction !== null) {
      for (const bit of this.intFunction.readsEvalContextRecursive()) {
        readEvalContext.add(bit);
      }
    }
    if (this.regionFunction !== null) {
      for (const bit of this.regionFunction.readsEvalContextRecursive()) {
        readEvalContext.add(bit);
      }
    }
    return readEvalContext;
  }

  // -------------------------------------------------------------------------

  /**
   * @param game The game.
   * @return The missing requirements.
   */
  missingRequirement(game: IGame): boolean {
    let missingRequirement = false;
    if (this.intFunction !== null) {
      missingRequirement = missingRequirement || this.intFunction.missingRequirement(game);
    }
    if (this.regionFunction !== null) {
      missingRequirement = missingRequirement || this.regionFunction.missingRequirement(game);
    }
    return missingRequirement;
  }

  // -------------------------------------------------------------------------

  /**
   * @param game The game.
   * @return The will crash information.
   */
  willCrash(game: IGame): boolean {
    let willCrash = false;
    if (this.intFunction !== null) {
      willCrash = willCrash || this.intFunction.willCrash(game);
    }
    if (this.regionFunction !== null) {
      willCrash = willCrash || this.regionFunction.willCrash(game);
    }
    return willCrash;
  }

  // -------------------------------------------------------------------------

  /**
   * Preprocess method.
   *
   * @param game      The game.
   * @param makeContext Factory that creates a Context(game, null) — callers
   *                    must supply this because Context is in another module.
   */
  preprocess(game: IGame, makeContext?: (game: IGame) => IContext): void {
    if (this.intFunction !== null) {
      this.intFunction.preprocess(game);
    }
    if (this.regionFunction !== null) {
      this.regionFunction.preprocess(game);
    }

    if (this.isStatic() && makeContext !== undefined) {
      this.precomputedArray = this.eval(makeContext(game));
    }
  }

  // -------------------------------------------------------------------------

  toString(): string {
    if (this.intFunction !== null) {
      return `[IntArrayFromRegion: ${this.intFunction}]`;
    } else if (this.regionFunction !== null) {
      return `[IntArrayFromRegion: ${this.regionFunction}]`;
    } else {
      return "[Empty IntArrayFromRegion]";
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @param game The game.
   * @return English description of this region.
   */
  toEnglish(game: IGame): string {
    if (this.intFunction !== null) {
      return this.intFunction.toEnglish(game);
    } else if (this.regionFunction !== null) {
      return this.regionFunction.toEnglish(game);
    } else {
      return "unknown region";
    }
  }
}
