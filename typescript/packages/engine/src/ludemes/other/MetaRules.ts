// @java Core/src/other/MetaRules.java
/**
 * Faithful 1:1 transliteration of other.MetaRules.
 *
 * Stores which meta rules are activated or not for a given game instance.
 *
 * Deferrals:
 *  - GravityType / PinType / RepetitionType / NoStackOnType are imported from
 *    their existing TS translations under game/types/play/.  Their union-string
 *    types are used directly, matching the Java enum values.
 *
 * Java parity: other/MetaRules.java
 *
 * @author Eric.Piette (Java), ported to TS
 */

import type { GravityType } from "../game/types/play/GravityType.js";
import type { PinType } from "../game/types/play/PinType.js";
import type { RepetitionType } from "../game/types/play/RepetitionType.js";
import type { NoStackOnType } from "../game/types/play/NoStackOnType.js";

// ---------------------------------------------------------------------------

/**
 * Stores which meta rule is activated or not.
 *
 * @java other/MetaRules.java — class MetaRules
 */
export class MetaRules {
  /** To know if the metarule automove is activated for that game. */
  private automove_ = false;

  /** To know the gravityType to apply. */
  private gravityType_: GravityType | null = null;

  /** To know the pinType to apply. */
  private pinType_: PinType | null = null;

  /** To know if the metarule swap is activated for that game. */
  private usesSwapRule_ = false;

  /** To know if a metarule about repetition is activated. */
  private repetitionType_: RepetitionType | null = null;

  /** To know if the metarule no suicide is on. */
  private usesNoSuicide_ = false;

  /** To know if the metarule NoStackOnFallen is activated for that game. */
  private noStackOnType_: NoStackOnType | null = null;

  // -------------------------------------------------------------------------

  /**
   * @return True if the game uses automove.
   * @java other/MetaRules.java — automove()
   */
  automove(): boolean {
    return this.automove_;
  }

  /**
   * To set the automove value.
   *
   * @param automove The value to set.
   * @java other/MetaRules.java — setAutomove(boolean)
   */
  setAutomove(automove: boolean): void {
    this.automove_ = automove;
  }

  // -------------------------------------------------------------------------

  /**
   * @return True if the game uses the swap rule.
   * @java other/MetaRules.java — usesSwapRule()
   */
  usesSwapRule(): boolean {
    return this.usesSwapRule_;
  }

  /**
   * To set the flag indicating whether or not this game uses swap rule.
   *
   * @param swap The value to set.
   * @java other/MetaRules.java — setUsesSwapRule(boolean)
   */
  setUsesSwapRule(swap: boolean): void {
    this.usesSwapRule_ = swap;
  }

  // -------------------------------------------------------------------------

  /**
   * To set the pin meta rule.
   *
   * @param type The NoStackOn type.
   * @java other/MetaRules.java — setNoStackOnType(NoStackOnType)
   */
  setNoStackOnType(type: NoStackOnType): void {
    this.noStackOnType_ = type;
  }

  /**
   * @return The type of the no-stack-on rule (or null if not set).
   * @java other/MetaRules.java — noStackOnType()
   */
  noStackOnType(): NoStackOnType | null {
    return this.noStackOnType_;
  }

  // -------------------------------------------------------------------------

  /**
   * To set the repetition meta rule.
   *
   * @param type The repetition type.
   * @java other/MetaRules.java — setRepetitionType(RepetitionType)
   */
  setRepetitionType(type: RepetitionType): void {
    this.repetitionType_ = type;
  }

  /**
   * @return The type of the repetition (or null if not set).
   * @java other/MetaRules.java — repetitionType()
   */
  repetitionType(): RepetitionType | null {
    return this.repetitionType_;
  }

  // -------------------------------------------------------------------------

  /**
   * To set the gravity meta rule.
   *
   * @param type The gravity type.
   * @java other/MetaRules.java — setGravityType(GravityType)
   */
  setGravityType(type: GravityType): void {
    this.gravityType_ = type;
  }

  /**
   * @return The type of the gravity (or null if not set).
   * @java other/MetaRules.java — gravityType()
   */
  gravityType(): GravityType | null {
    return this.gravityType_;
  }

  // -------------------------------------------------------------------------

  /**
   * To set the pin meta rule.
   *
   * @param type The pin type.
   * @java other/MetaRules.java — setPinType(PinType)
   */
  setPinType(type: PinType): void {
    this.pinType_ = type;
  }

  /**
   * @return The type of the pin (or null if not set).
   * @java other/MetaRules.java — pinType()
   */
  pinType(): PinType | null {
    return this.pinType_;
  }

  // -------------------------------------------------------------------------

  /**
   * To set the no suicide meta rule.
   *
   * @param value The no suicide value.
   * @java other/MetaRules.java — setNoSuicide(boolean)
   */
  setNoSuicide(value: boolean): void {
    this.usesNoSuicide_ = value;
  }

  /**
   * @return The value of the no suicide meta rule.
   * @java other/MetaRules.java — usesNoSuicide()
   */
  usesNoSuicide(): boolean {
    return this.usesNoSuicide_;
  }
}
