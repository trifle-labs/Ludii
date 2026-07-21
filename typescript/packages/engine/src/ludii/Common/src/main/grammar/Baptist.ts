// @java Common/src/main/grammar/Baptist.java

/**
 * Creates random but plausible names using a tri-gram character model.
 *
 * @java main/grammar/Baptist.java
 * @author cambolbro
 */
export class Baptist {
  /** @java Baptist.names */
  private readonly _names: string[] = [];

  /** @java Baptist.chars */
  readonly chars: number[] = [
    "a".charCodeAt(0), "b".charCodeAt(0), "c".charCodeAt(0), "d".charCodeAt(0),
    "e".charCodeAt(0), "f".charCodeAt(0), "g".charCodeAt(0), "h".charCodeAt(0),
    "i".charCodeAt(0), "j".charCodeAt(0), "k".charCodeAt(0), "l".charCodeAt(0),
    "m".charCodeAt(0), "n".charCodeAt(0), "o".charCodeAt(0), "p".charCodeAt(0),
    "q".charCodeAt(0), "r".charCodeAt(0), "s".charCodeAt(0), "t".charCodeAt(0),
    "u".charCodeAt(0), "v".charCodeAt(0), "w".charCodeAt(0), "x".charCodeAt(0),
    "y".charCodeAt(0), "z".charCodeAt(0), ".".charCodeAt(0),
  ];

  /** @java Baptist.DOT */
  private readonly DOT: number = this.chars.length - 1;

  /** @java Baptist.counts — 3D array [chars.length][chars.length][chars.length] */
  private readonly _counts: number[][][] = Array.from({ length: this.chars.length }, () =>
    Array.from({ length: this.chars.length }, () =>
      new Array<number>(this.chars.length).fill(0)
    )
  );

  /** @java Baptist.totals — 2D array [chars.length][chars.length] */
  private readonly _totals: number[][] = Array.from({ length: this.chars.length }, () =>
    new Array<number>(this.chars.length).fill(0)
  );

  // -------------------------------------------------------------------------

  /** @java Baptist.singleton */
  private static _singleton: Baptist | null = null;

  // -------------------------------------------------------------------------

  private constructor() {
    this.loadNames("/npp-names-2.txt");
    this.processNames();
  }

  // -------------------------------------------------------------------------

  /** @java Baptist.baptist() — singleton accessor */
  public static baptist(): Baptist {
    if (Baptist._singleton === null) {
      Baptist._singleton = new Baptist();
    }
    return Baptist._singleton;
  }

  // -------------------------------------------------------------------------

  /**
   * Load names from resource path.
   * In TypeScript/Node environment, resource loading from jar is not available.
   * Falls back to an empty names list (no-op).
   *
   * @java Baptist.loadNames(String)
   */
  public loadNames(filePath: string): void {
    // In TS, we cannot load from a JAR resource. The names list remains empty.
    // In a Node environment, callers can populate _names externally if needed.
    void filePath;
    this._names.length = 0;
  }

  // -------------------------------------------------------------------------

  /** @java Baptist.processNames() */
  public processNames(): void {
    for (const name of this._names) {
      this.processName(name);
    }
  }

  /** @java Baptist.processName(String) */
  public processName(name: string): void {
    const str = ".." + name.toLowerCase() + "..";
    for (let c = 0; c < str.length - 3; c++) {
      let ch0 = str.charCodeAt(c) - "a".charCodeAt(0);
      let ch1 = str.charCodeAt(c + 1) - "a".charCodeAt(0);
      let ch2 = str.charCodeAt(c + 2) - "a".charCodeAt(0);

      if (ch0 < 0 || ch0 >= 26) ch0 = this.DOT;
      if (ch1 < 0 || ch1 >= 26) ch1 = this.DOT;
      if (ch2 < 0 || ch2 >= 26) ch2 = this.DOT;

      this._counts[ch0]![ch1]![ch2]!++;
      this._totals[ch0]![ch1]!++;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return Generate a name from the given seed, of minimum length.
   *
   * @java Baptist.name(long, int)
   */
  public name(seed: number, minLength: number): string {
    let result = "";

    const rng = new SeededRandom(seed);
    rng.nextInt(); // Burn the first value

    do {
      if (result !== "") {
        result += " ";
      }
      result += this.nameFromRng(rng);
    } while (result.length < minLength);

    return result;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Generate a name using the given RNG.
   *
   * @java Baptist.name(Random)
   */
  public nameFromRng(rng: SeededRandom): string {
    const token: [number, number, number] = [this.DOT, this.DOT, this.DOT];

    let str = "";
    while (true) {
      if (token[2] !== this.DOT) {
        const ch = String.fromCharCode(this.chars[token[2]]!);
        if (str === "") {
          str += ch.toUpperCase();
        } else {
          str += ch;
        }
      }

      token[0] = token[1];
      token[1] = token[2];

      const total = this._totals[token[0]]![token[1]]!;
      if (total === 0) {
        break;
      }

      const target = (rng.nextInt() % total) + 1;
      let tally = 0;
      for (let n = 0; n < this.chars.length; n++) {
        if (this._counts[token[0]]![token[1]]![n] === 0) {
          continue;
        }
        tally += this._counts[token[0]]![token[1]]![n]!;
        if (tally >= target) {
          token[2] = n;
          break;
        }
      }
    }
    return str;
  }

  // -------------------------------------------------------------------------

  /** @java Baptist.main(String[]) — entry point for testing */
  public static main(_args: string[]): void {
    const b = Baptist.baptist();
    for (let n = 0; n < 20; n++) {
      console.log(b.name(n, 5));
    }
    console.log();

    let str = "Yavalath";
    console.log("'" + str + "' is called: " + b.name(hashCode(str), 5));
    str = "Cameron";
    console.log("'" + str + "' is called: " + b.name(hashCode(str), 5));
    console.log();
    console.log("Done.");
  }

  // -------------------------------------------------------------------------
}

// -------------------------------------------------------------------------

/**
 * Minimal seeded PRNG that approximates Java's java.util.Random (LCG).
 */
export class SeededRandom {
  /** @java java.util.Random.seed */
  private _seed: bigint;

  private static readonly MULTIPLIER = BigInt("0x5DEECE66D");
  private static readonly ADDEND     = BigInt(0xB);
  private static readonly MASK       = (BigInt(1) << BigInt(48)) - BigInt(1);

  public constructor(seed: number) {
    // Java: seed ^ multiplier & mask
    this._seed = (BigInt(seed) ^ SeededRandom.MULTIPLIER) & SeededRandom.MASK;
  }

  /** @java Random.nextInt() */
  public nextInt(): number {
    this._seed = (this._seed * SeededRandom.MULTIPLIER + SeededRandom.ADDEND) & SeededRandom.MASK;
    return Number(this._seed >> BigInt(17)) | 0;
  }
}

// -------------------------------------------------------------------------

/**
 * Compute a Java-compatible string hashCode.
 *
 * @java String.hashCode()
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}
