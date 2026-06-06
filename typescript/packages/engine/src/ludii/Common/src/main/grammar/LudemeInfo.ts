// @java Common/src/main/grammar/LudemeInfo.java

import { Symbol } from "./Symbol.js";

// Call is in this batch — use forward declaration to avoid circular imports.
// The full Call class is defined in Call.ts.
interface CallRef {
  constant(): string | null;
  symbol(): Symbol;
}

/**
 * Convenience class containing ludeme info to store in database.
 *
 * @java main/grammar/LudemeInfo.java
 * @author cambolbro and Matthew.Stephenson
 */
export class LudemeInfo {
  /** @java LudemeInfo.id — ludeme's unique id in the database. 0 means unassigned. */
  private _id: number = 0;

  /** @java LudemeInfo.symbol */
  private readonly _symbol: Symbol;

  /** @java LudemeInfo.description */
  private _description: string = "";

  /** @java LudemeInfo.packagePath */
  private readonly _packagePath: string;

  // -------------------------------------------------------------------------

  /**
   * @java LudemeInfo(Symbol)
   */
  public constructor(symbol: Symbol) {
    this._symbol      = symbol;
    this._packagePath = symbol.cls() !== null ? String(symbol.cls()) : "";
  }

  // -------------------------------------------------------------------------

  /** @java LudemeInfo.id() */
  public id(): number {
    return this._id;
  }

  /** @java LudemeInfo.setId(int) */
  public setId(id: number): void {
    this._id = id;
  }

  /** @java LudemeInfo.symbol() */
  public symbol(): Symbol {
    return this._symbol;
  }

  /** @java LudemeInfo.description() */
  public description(): string {
    return this._description;
  }

  /** @java LudemeInfo.setDescription(String) */
  public setDescription(description: string): void {
    this._description = description;
  }

  // -------------------------------------------------------------------------

  /** @java LudemeInfo.getDBString() */
  public getDBString(): string {
    return (
      this._symbol.name() +
      "," +
      this._packagePath +
      "," +
      this._symbol.ludemeType() +
      "," +
      this._symbol.token() +
      "," +
      this._symbol.grammarLabel() +
      "," +
      (this._symbol.usedInGrammar() ? 1 : 0) +
      "," +
      (this._symbol.usedInMetadata() ? 1 : 0) +
      "," +
      (this._symbol.usedInDescription() ? 1 : 0) +
      ',\"' +
      this._description +
      '"'
    );
  }

  // -------------------------------------------------------------------------

  /**
   * @return First LudemeInfo in list that matches a Call object.
   *
   * @java LudemeInfo.findLudemeInfo(Call, List<LudemeInfo>)
   */
  public static findLudemeInfo(
    call: CallRef,
    ludemes: readonly LudemeInfo[]
  ): LudemeInfo | null {
    // Pass 1: Check for special constants
    if (call.constant() !== null) {
      for (const ludemeInfo of ludemes) {
        if (call.constant() === ludemeInfo.symbol().name()) {
          return ludemeInfo;
        }
      }
    }

    // Pass 2: Check for exact match
    const callSym = call.symbol();
    const atomicLudeme = callSym.atomicLudeme();
    if (atomicLudeme !== null) {
      for (const ludemeInfo of ludemes) {
        if (ludemeInfo.symbol().path() === atomicLudeme.path()) {
          return ludemeInfo;
        }
      }
    }

    return null;
  }

  // -------------------------------------------------------------------------
}
