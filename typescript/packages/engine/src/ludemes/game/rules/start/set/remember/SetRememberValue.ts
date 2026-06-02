/**
 * Remembers one or more values in the game state (named or default bucket).
 *
 * @java game/rules/start/set/remember/SetRememberValue.java — eval(Context)
 *
 * DEFERRED: Java ActionRememberValue writes to State.rememberingValues (or
 * State.mapRememberingValues for named buckets) via Context.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * Remembered-value initialisation cannot be applied until Game1to1.start()
 * exposes the remembered-values map or the StartRule interface is extended.
 * The compile1to1 path currently skips (set RememberValue …) start rules.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/remember/SetRememberValue.java
 *
 * Stores a list of integer values (optionally under a named key) in the
 * game's remembered-values map at start. Supports a `unique` flag that
 * prevents duplicates.
 * applyToInitialState is a no-op because State.remembered is not accessible.
 */
export class SetRememberValue1to1 implements StartRule {
  /**
   * Optional name for the remembered-value bucket.
   * Java: name field (null → default anonymous bucket).
   */
  private readonly name: string | null;

  /** Pre-evaluated values to remember. Java: values (IntArrayFromRegion). */
  private readonly values: readonly number[];

  /**
   * If true, only remember a value if it is not already in the bucket.
   * Java: uniqueFn evaluated at start.
   */
  private readonly unique: boolean;

  /**
   * @param name    bucket name, or null for the default bucket
   * @param values  integer values to remember
   * @param unique  only add values not already present
   */
  public constructor(name: string | null, values: readonly number[], unique: boolean) {
    this.name = name;
    this.values = values;
    this.unique = unique;
  }

  /**
   * @java game/rules/start/set/remember/SetRememberValue.java — eval(Context)
   *
   * Java: for each value: ActionRememberValue(name, value).apply(context)
   *   (skipped if unique && value already in State.rememberingValues / mapRememberingValues)
   * TS-deferred: State.remembered map not accessible via applyToInitialState.
   */
  public applyToInitialState(
    _cells: number[],
    _whats: number[],
    _countAt: number[],
    _equipment: Equipment1to1,
    _numPlayers: number,
  ): void {
    // Deferred: State.remembered map not accessible via applyToInitialState interface.
    // Java: ActionRememberValue(name, valueToRemember).apply(context) for each value.
    void this.name;
    void this.values;
    void this.unique;
  }
}
