/**
 * @java metadata/recon/concept/Concept.java Concept
 *
 * Specifies what concept values are required for reconstruction metadata.
 * Supports two constructor forms:
 *   - exact value: (concept "Num Players" 6) or (concept "Num Players" true)
 *   - range:       (concept "Num Players" minValue:2 maxValue:4)
 *
 * Java parity: the `concept` field holds a reference to other.concept.Concept
 * via valueOf(conceptName). In TS we store the name string; callers can
 * resolve it against the ConceptName union from concept.ts if needed.
 *
 * @author Matthew.Stephenson and Eric.Piette
 *
 * @example (concept "Num Players" 6)
 * @example (concept "Num Players" minValue:2 maxValue:4)
 */

import type { ReconItem } from "../ReconItem.js";

export class Concept implements ReconItem {
  /** @java metadata/recon/concept/Concept.java — conceptName field */
  private readonly _conceptName: string;

  /** @java metadata/recon/concept/Concept.java — minValue field */
  private readonly _minValue: number;

  /** @java metadata/recon/concept/Concept.java — maxValue field */
  private readonly _maxValue: number;

  // -------------------------------------------------------------------------

  /**
   * Constructor for a concept with an exact value (float or boolean).
   *
   * @java metadata/recon/concept/Concept.java — constructor(String, Float, Boolean)
   *
   * Java @Or: exactly one of valueDouble or valueBoolean is non-null.
   *
   * @param conceptName  The name of the concept.
   * @param valueDouble  The exact float value (use this OR valueBoolean).
   * @param valueBoolean The exact boolean value (use this OR valueDouble).
   */
  public static withValue(
    conceptName: string,
    valueDouble?: number | null,
    valueBoolean?: boolean | null,
  ): Concept {
    let v: number;
    if (valueDouble != null) {
      v = valueDouble;
    } else if (valueBoolean != null) {
      v = valueBoolean ? 1.0 : 0.0;
    } else {
      throw new Error("Concept.withValue: one of valueDouble or valueBoolean must be provided");
    }
    return new Concept(conceptName, v, v);
  }

  /**
   * Constructor for a concept with a min/max range.
   *
   * @java metadata/recon/concept/Concept.java — constructor(String, @Name Float, @Name Float)
   *
   * @param conceptName The name of the concept.
   * @param minValue    The minimum value.
   * @param maxValue    The maximum value.
   */
  public static withRange(
    conceptName: string,
    minValue: number,
    maxValue: number,
  ): Concept {
    return new Concept(conceptName, minValue, maxValue);
  }

  // -------------------------------------------------------------------------

  /**
   * @java metadata/recon/concept/Concept.java — constructor (shared implementation)
   */
  private constructor(conceptName: string, minValue: number, maxValue: number) {
    this._conceptName = conceptName;
    this._minValue = minValue;
    this._maxValue = maxValue;
  }

  // -------------------------------------------------------------------------

  /**
   * @java metadata/recon/concept/Concept.java — conceptName()
   * @returns The name of the concept.
   */
  public conceptName(): string {
    return this._conceptName;
  }

  /**
   * @java metadata/recon/concept/Concept.java — minValue()
   * @returns The minimum value of the concept.
   */
  public minValue(): number {
    return this._minValue;
  }

  /**
   * @java metadata/recon/concept/Concept.java — maxValue()
   * @returns The maximum value of the concept.
   */
  public maxValue(): number {
    return this._maxValue;
  }

  // -------------------------------------------------------------------------

  /** @java metadata/recon/concept/Concept.java — toString() */
  public toString(): string {
    if (this._minValue === this._maxValue) {
      return `${this._conceptName} value = ${this._minValue}\n`;
    }
    return `${this._conceptName} min value = ${this._minValue}  max value = ${this._maxValue}\n`;
  }
}
