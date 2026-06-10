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
  public static constructAll(_rememberType: string, name: string | null, _valueType: string, then: Then | null = null): ForgetValueAll {
    return new ForgetValueAll(name, then);
  }

  /** @java Forget.construct(ForgetValueType, @Opt String name, IntFunction value, @Opt Then) */
  public static constructValue(_rememberType: string, name: string | null, value: unknown, then: Then | null = null): ForgetValue {
    return new ForgetValue(name as never, value as never, then as never);
  }
}
