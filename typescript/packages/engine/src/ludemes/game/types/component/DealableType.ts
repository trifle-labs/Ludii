/**
 * Specifies which types of components can be dealt.
 *
 * @java game/types/component/DealableType.java
 */
export const DEALABLE_TYPES = [
  /** Domino component. */
  "Dominoes",
  /** Card component. */
  "Cards",
] as const;

/** @java game/types/component/DealableType.java — enum DealableType */
export type DealableType = (typeof DEALABLE_TYPES)[number];

/** True iff the given string is a valid DealableType value. */
export function isDealableType(value: string): value is DealableType {
  return (DEALABLE_TYPES as readonly string[]).includes(value);
}
