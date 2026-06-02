// @java Core/src/other/BaseLudeme.java BaseLudeme
/**
 * Faithful 1:1 transliteration of other.BaseLudeme.
 *
 * Java parity: other/BaseLudeme.java
 *
 * BaseLudeme is the abstract base class for all ludemes. It implements the
 * Ludeme interface with default behaviour. Every concrete ludeme extends this.
 *
 * Deferrals:
 *  - BitSet (java.util.BitSet): replaced by a minimal TypeScript BitSet class
 *    that mirrors the surface used here (no-arg constructor returning an empty
 *    set). This keeps the file self-contained.
 *  - IGame: represented as a minimal opaque interface.
 *
 * @author cambolbro and Eric.Piette (Java)
 * TypeScript transliteration.
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces / stand-ins for absent subsystems
// ---------------------------------------------------------------------------

/**
 * Minimal surface of java.util.BitSet used within BaseLudeme.
 * A new BitSet() is always empty; OR/AND/GET are deferred.
 */
export class BitSet {
  private _bits: Set<number> = new Set();

  /** @java public boolean get(int bitIndex) */
  get(bitIndex: number): boolean { return this._bits.has(bitIndex); }

  /** @java public void set(int bitIndex) */
  set(bitIndex: number): void { this._bits.add(bitIndex); }

  /** @java public void or(BitSet set) */
  or(other: BitSet): void {
    for (const b of other._bits) this._bits.add(b);
  }

  /** @java public boolean isEmpty() */
  isEmpty(): boolean { return this._bits.size === 0; }

  /** @java public int cardinality() */
  cardinality(): number { return this._bits.size; }
}

/** Minimal surface of game.Game used in Ludeme / BaseLudeme methods. */
export interface IGame {
  // Surface intentionally minimal – only what Ludeme.toEnglish / concepts need.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Ludeme interface (Java parity: other/Ludeme.java)
// ---------------------------------------------------------------------------

/**
 * @java public interface Ludeme (other/Ludeme.java)
 *
 * Inlined here to keep BaseLudeme.ts self-contained; re-exported so that
 * callers can reference it via this module if desired.
 */
export interface Ludeme {
  /** @java public String toEnglish(final Game game) */
  toEnglish(game: IGame): string;

  /** @java public BitSet concepts(final Game game) */
  concepts(game: IGame): BitSet;

  /** @java public BitSet readsEvalContextRecursive() */
  readsEvalContextRecursive(): BitSet;

  /** @java public BitSet writesEvalContextRecursive() */
  writesEvalContextRecursive(): BitSet;

  /** @java public BitSet readsEvalContextFlat() */
  readsEvalContextFlat(): BitSet;

  /** @java public BitSet writesEvalContextFlat() */
  writesEvalContextFlat(): BitSet;

  /** @java public boolean missingRequirement(final Game game) */
  missingRequirement(game: IGame): boolean;

  /** @java public boolean willCrash(final Game game) */
  willCrash(game: IGame): boolean;
}

// ---------------------------------------------------------------------------
// BaseLudeme abstract class
// ---------------------------------------------------------------------------

/**
 * Abstract base for all ludemes. Provides default implementations of the
 * Ludeme interface methods that subclasses can override.
 *
 * @author cambolbro and Eric.Piette (Java)
 * TypeScript transliteration.
 */
export abstract class BaseLudeme implements Ludeme {

  /**
   * Default: English description not known – returns class name in angle brackets.
   * @java @Override public String toEnglish(final Game game)
   */
  toEnglish(_game: IGame): string {
    return `<${this.constructor.name}>`;
  }

  /**
   * Default: returns empty BitSet (no concepts declared).
   * @java @Override public BitSet concepts(final Game game)
   */
  concepts(_game: IGame): BitSet {
    return new BitSet();
  }

  /**
   * Default: returns empty BitSet.
   * @java @Override public BitSet readsEvalContextRecursive()
   */
  readsEvalContextRecursive(): BitSet {
    return new BitSet();
  }

  /**
   * Default: returns empty BitSet.
   * @java @Override public BitSet writesEvalContextRecursive()
   */
  writesEvalContextRecursive(): BitSet {
    return new BitSet();
  }

  /**
   * Default: returns empty BitSet.
   * @java @Override public BitSet readsEvalContextFlat()
   */
  readsEvalContextFlat(): BitSet {
    return new BitSet();
  }

  /**
   * Default: returns empty BitSet.
   * @java @Override public BitSet writesEvalContextFlat()
   */
  writesEvalContextFlat(): BitSet {
    return new BitSet();
  }

  /**
   * Default: no requirement missing — returns false.
   * @java @Override public boolean missingRequirement(final Game game)
   */
  missingRequirement(_game: IGame): boolean {
    return false;
  }

  /**
   * Default: will not crash — returns false.
   * @java @Override public boolean willCrash(final Game game)
   */
  willCrash(_game: IGame): boolean {
    return false;
  }
}
