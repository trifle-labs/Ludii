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

import { BooleanConstant } from "../../../../functions/booleans/BooleanConstant.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../base.js";
import type { StartRule } from "../../StartRule.js";
import type { Context } from "../../../../../../context.js";

/**
 * @java game/rules/start/set/remember/SetRememberValue.java
 *
 * Stores a list of integer values (optionally under a named key) in the
 * game's remembered-values map at start. Supports a `unique` flag that
 * prevents duplicates.
 * applyToInitialState is a no-op because State.remembered is not accessible.
 */
export class SetRememberValue implements StartRule {
  /**
   * Optional name for the remembered-value bucket.
   * Java: name field (null → default anonymous bucket).
   */
  private readonly name: string | null;

  /** Single value to remember. Java constructor: @Or IntFunction value. */
  private readonly value: IntFunction | null;

  /** Region of values to remember. Java constructor: @Or RegionFunction regionValue. */
  private readonly regionValue: RegionFunction | null;

  /**
   * If true, only remember a value if it is not already in the bucket.
   * Java: uniqueFn evaluated at start.
   */
  private readonly uniqueFn: BooleanFunction;

  /**
   * @java SetRememberValue(@Opt String, @Or IntFunction, @Or RegionFunction, @Opt @Name BooleanFunction)
   *
   * @param name        bucket name, or null for the default bucket
   * @param value       single integer value to remember
   * @param regionValue region-valued source of values to remember
   * @param unique      only add values not already present
   */
  public constructor(
    name: string | null | undefined,
    value: IntFunction | null | undefined,
    regionValue: RegionFunction | null | undefined,
    unique?: BooleanFunction | null,
  ) {
    this.name = name ?? null;
    this.value = value ?? null;
    this.regionValue = regionValue ?? null;
    this.uniqueFn = unique ?? new BooleanConstant(false);
  }

  /**
   * @java game/rules/start/set/remember/SetRememberValue.java — eval(Context)
   *
   * Java: for each value: ActionRememberValue(name, value).apply(context)
   *   (skipped if unique && value already in State.rememberingValues / mapRememberingValues)
   * TS-deferred: State.remembered map not accessible via applyToInitialState.
   */
  /**
   * @java game/rules/start/set/remember/SetRememberValue.java — eval(Context)
   * Writes through the bridge ContainerState facade; Game1to1.start() threads the
   * collected values into the initial State via withRemember.
   */
  public eval(ctx: Context): void {
    const cs = (ctx as unknown as {
      _startState?: { rememberValue(name: string | null, value: number, unique: boolean): void };
    })._startState;
    if (!cs) return;
    const values: number[] = [];
    if (this.value !== null) {
      values.push(this.value.eval(ctx));
    } else if (this.regionValue !== null) {
      values.push(...this.regionValue.eval(ctx));
    }
    if (values.length === 0) return;
    // @java ActionRememberValue(name, value, unique).apply(context) per value.
    const unique = this.uniqueFn.eval(ctx);
    for (const value of values) cs.rememberValue(this.name, value, unique);
  }
}
