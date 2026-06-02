// @java Core/src/game/util/graph/Properties.java
//
// Record of graph element properties as a 64-bit long bitmask.
// JS does not natively support 64-bit integers; we use BigInt so the high bits
// (e.g. SIDE_NW = 1n << 47n) are representable without loss.
// All constants match the Java definitions exactly.

/**
 * Record of graph element properties.
 * Bit-flag constants are BigInt so high bits (>= 32) are representable.
 *
 * @java game.util.graph.Properties
 */
export class Properties {
  // ---------------------------------------------------------------------------
  // Flag constants (faithfully matching Java long values)
  // ---------------------------------------------------------------------------

  /** @java Properties.INNER = 0x1L << 0 */
  public static readonly INNER       = 1n << 0n;
  /** @java Properties.OUTER = 0x1L << 1 */
  public static readonly OUTER       = 1n << 1n;
  /** @java Properties.PERIMETER = 0x1L << 2 */
  public static readonly PERIMETER   = 1n << 2n;
  /** @java Properties.CENTRE = 0x1L << 3 */
  public static readonly CENTRE      = 1n << 3n;
  /** @java Properties.MAJOR = 0x1L << 4 */
  public static readonly MAJOR       = 1n << 4n;
  /** @java Properties.MINOR = 0x1L << 5 */
  public static readonly MINOR       = 1n << 5n;
  /** @java Properties.PIVOT = 0x1L << 6 */
  public static readonly PIVOT       = 1n << 6n;
  /** @java Properties.INTERLAYER = 0x1L << 7 */
  public static readonly INTERLAYER  = 1n << 7n;
  /** @java Properties.NULL_NBOR = 0x1L << 8 */
  public static readonly NULL_NBOR   = 1n << 8n;
  /** @java Properties.CORNER = 0x1L << 10 */
  public static readonly CORNER      = 1n << 10n;
  /** @java Properties.CORNER_CONVEX = 0x1L << 11 */
  public static readonly CORNER_CONVEX  = 1n << 11n;
  /** @java Properties.CORNER_CONCAVE = 0x1L << 12 */
  public static readonly CORNER_CONCAVE = 1n << 12n;
  /** @java Properties.PHASE_0 = 0x1L << 13 */
  public static readonly PHASE_0     = 1n << 13n;
  /** @java Properties.PHASE_1 = 0x1L << 14 */
  public static readonly PHASE_1     = 1n << 14n;
  /** @java Properties.PHASE_2 = 0x1L << 15 */
  public static readonly PHASE_2     = 1n << 15n;
  /** @java Properties.PHASE_3 = 0x1L << 16 */
  public static readonly PHASE_3     = 1n << 16n;
  /** @java Properties.PHASE_4 = 0x1L << 17 */
  public static readonly PHASE_4     = 1n << 17n;
  /** @java Properties.PHASE_5 = 0x1L << 18 */
  public static readonly PHASE_5     = 1n << 18n;
  /** @java Properties.LEFT = 0x1L << 25 */
  public static readonly LEFT        = 1n << 25n;
  /** @java Properties.RIGHT = 0x1L << 26 */
  public static readonly RIGHT       = 1n << 26n;
  /** @java Properties.TOP = 0x1L << 27 */
  public static readonly TOP         = 1n << 27n;
  /** @java Properties.BOTTOM = 0x1L << 28 */
  public static readonly BOTTOM      = 1n << 28n;
  /** @java Properties.AXIAL = 0x1L << 30 */
  public static readonly AXIAL       = 1n << 30n;
  /** @java Properties.HORIZONTAL = 0x1L << 31 */
  public static readonly HORIZONTAL  = 1n << 31n;
  /** @java Properties.VERTICAL = 0x1L << 32 */
  public static readonly VERTICAL    = 1n << 32n;
  /** @java Properties.ANGLED = 0x1L << 33 */
  public static readonly ANGLED      = 1n << 33n;
  /** @java Properties.SLASH = 0x1L << 34 */
  public static readonly SLASH       = 1n << 34n;
  /** @java Properties.SLOSH = 0x1L << 35 */
  public static readonly SLOSH       = 1n << 35n;
  /** @java Properties.SIDE_N = 0x1L << 40 */
  public static readonly SIDE_N      = 1n << 40n;
  /** @java Properties.SIDE_E = 0x1L << 41 */
  public static readonly SIDE_E      = 1n << 41n;
  /** @java Properties.SIDE_S = 0x1L << 42 */
  public static readonly SIDE_S      = 1n << 42n;
  /** @java Properties.SIDE_W = 0x1L << 43 */
  public static readonly SIDE_W      = 1n << 43n;
  /** @java Properties.SIDE_NE = 0x1L << 44 */
  public static readonly SIDE_NE     = 1n << 44n;
  /** @java Properties.SIDE_SE = 0x1L << 45 */
  public static readonly SIDE_SE     = 1n << 45n;
  /** @java Properties.SIDE_SW = 0x1L << 46 */
  public static readonly SIDE_SW     = 1n << 46n;
  /** @java Properties.SIDE_NW = 0x1L << 47 */
  public static readonly SIDE_NW     = 1n << 47n;

  /** Backing bitmask. @java Properties.properties (long) */
  private _properties: bigint = 0n;

  // ---------------------------------------------------------------------------
  // Constructors
  // ---------------------------------------------------------------------------

  /** @java Properties() */
  public constructor(propertiesOrOther?: bigint | Properties) {
    if (propertiesOrOther === undefined) {
      this._properties = 0n;
    } else if (propertiesOrOther instanceof Properties) {
      this._properties = propertiesOrOther._properties;
    } else {
      this._properties = propertiesOrOther;
    }
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** @java Properties.clear() */
  public clear(): void { this._properties = 0n; }

  /** @java Properties.get() — raw bitmask. */
  public get(): bigint { return this._properties; }

  /** @java Properties.get(long property) — test a specific flag. */
  public getFlag(property: bigint): boolean {
    return (this._properties & property) !== 0n;
  }

  /** @java Properties.set(long property) — set a flag. */
  public set(property: bigint): void { this._properties |= property; }

  /** @java Properties.set(long property, boolean on) */
  public setOn(property: bigint, on: boolean): void {
    if (on) this._properties |= property;
    else    this._properties &= ~property;
  }

  /** @java Properties.add(long other) — OR in additional flags. */
  public add(other: bigint): void { this._properties |= other; }

  // ---------------------------------------------------------------------------
  // Phase helpers
  // ---------------------------------------------------------------------------

  /**
   * @java Properties.phase() — returns 0-5 or -1 (UNDEFINED) if no phase set.
   */
  public phase(): number {
    if (this.getFlag(Properties.PHASE_0)) return 0;
    if (this.getFlag(Properties.PHASE_1)) return 1;
    if (this.getFlag(Properties.PHASE_2)) return 2;
    if (this.getFlag(Properties.PHASE_3)) return 3;
    if (this.getFlag(Properties.PHASE_4)) return 4;
    if (this.getFlag(Properties.PHASE_5)) return 5;
    return -1; // Constants.UNDEFINED
  }

  /** @java Properties.clearPhase() */
  public clearPhase(): void {
    this._properties &= ~Properties.PHASE_0;
    this._properties &= ~Properties.PHASE_1;
    this._properties &= ~Properties.PHASE_2;
    this._properties &= ~Properties.PHASE_3;
    this._properties &= ~Properties.PHASE_4;
    this._properties &= ~Properties.PHASE_5;
  }

  /** @java Properties.setPhase(int phase) */
  public setPhase(phase: number): void {
    this.clearPhase();
    switch (phase) {
      case 0: this._properties |= Properties.PHASE_0; break;
      case 1: this._properties |= Properties.PHASE_1; break;
      case 2: this._properties |= Properties.PHASE_2; break;
      case 3: this._properties |= Properties.PHASE_3; break;
      case 4: this._properties |= Properties.PHASE_4; break;
      case 5: this._properties |= Properties.PHASE_5; break;
      default: break;
    }
  }

  // ---------------------------------------------------------------------------
  // toString
  // ---------------------------------------------------------------------------

  /** @java Properties.toString() */
  public toString(): string {
    const parts: string[] = [];
    if (this.getFlag(Properties.INNER))       parts.push("I");
    if (this.getFlag(Properties.OUTER))       parts.push("O");
    if (this.getFlag(Properties.PIVOT))       parts.push("PVT");
    if (this.getFlag(Properties.PERIMETER))   parts.push("PRM");
    if (this.getFlag(Properties.INTERLAYER))  parts.push("IL");
    if (this.getFlag(Properties.CORNER))      parts.push("CNR");
    if (this.getFlag(Properties.CORNER_CONVEX))  parts.push("(X)");
    if (this.getFlag(Properties.CORNER_CONCAVE)) parts.push("(V)");
    if (this.getFlag(Properties.CENTRE))      parts.push("CTR");
    if (this.getFlag(Properties.AXIAL))       parts.push("AXL");
    if (this.getFlag(Properties.ANGLED))      parts.push("AGL");
    if (this.getFlag(Properties.PHASE_0))     parts.push("PH_0");
    if (this.getFlag(Properties.PHASE_1))     parts.push("PH_1");
    if (this.getFlag(Properties.PHASE_2))     parts.push("PH_2");
    if (this.getFlag(Properties.PHASE_3))     parts.push("PH_3");
    if (this.getFlag(Properties.PHASE_4))     parts.push("PH_4");
    if (this.getFlag(Properties.PHASE_5))     parts.push("PH_5");
    const sideParts: string[] = [];
    if (this.getFlag(Properties.SIDE_N))  sideParts.push("N");
    if (this.getFlag(Properties.SIDE_E))  sideParts.push("E");
    if (this.getFlag(Properties.SIDE_S))  sideParts.push("S");
    if (this.getFlag(Properties.SIDE_W))  sideParts.push("W");
    if (this.getFlag(Properties.SIDE_NE)) sideParts.push("NE");
    if (this.getFlag(Properties.SIDE_SE)) sideParts.push("SE");
    if (this.getFlag(Properties.SIDE_SW)) sideParts.push("SW");
    if (this.getFlag(Properties.SIDE_NW)) sideParts.push("NW");
    if (sideParts.length > 0) parts.push("SD_" + sideParts.join("/"));
    return "<" + parts.join(" ") + ">";
  }
}
