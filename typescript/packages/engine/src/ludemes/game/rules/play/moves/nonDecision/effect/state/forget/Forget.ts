// @java Core/src/game/rules/play/moves/nonDecision/effect/state/forget/Forget.java

/**
 * Static factory for the (forget Value …) effects.
 *
 * @java game/rules/play/moves/nonDecision/effect/state/forget/Forget.java
 * @author Eric.Piette
 */

import type { Then } from "../../Then.js";
import { ForgetValue } from "./value/ForgetValue.js";
import { ForgetValueAll } from "./value/ForgetValueAll.js";

export class Forget {
  private constructor() { /* static-factory-only, like Java */ }

  /** @java Forget.construct(ForgetValueType, @Opt String name, ForgetValueAllType, @Opt Then) */
  public static constructAll(_rememberType: string, name: string | null, valueType: unknown, then: Then | null = null): ForgetValueAll | null {
    // @java the overload discriminates on the ForgetValueAllType literal
    // `All`. The compiler tries construct* overloads in property order and
    // keeps the first non-null result, so the IntFunction of
    // (forget Value "name" (value)) must REJECT here — accepting it wiped
    // the WHOLE remembered key instead of one value (Adi's P2SowFrom
    // emptied every move; the PossibleSowFrom mancala over-forgot).
    if (valueType !== "All") return null;
    return new ForgetValueAll(name, then);
  }

  /** @java Forget.construct(ForgetValueType, @Opt String name, IntFunction value, @Opt Then) */
  public static constructValue(_rememberType: string, name: string | null, value: unknown, then: Then | null = null): ForgetValue | null {
    // @java IntFunction value — reject the `All` enum so overload trial
    // order can never cross-match.
    if (value === "All" || value === null || value === undefined) return null;
    return new ForgetValue(name as never, value as never, then as never);
  }
}
