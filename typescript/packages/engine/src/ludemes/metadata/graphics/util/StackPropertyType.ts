/**
 * StackPropertyType.ts
 *
 * @java metadata/graphics/util/StackPropertyType.java
 *
 * Defines different aspects of a stack.
 */

/** @java metadata.graphics.util.StackPropertyType */
export interface StackPropertyTypeEntry {
  readonly name: string;
  readonly number: number;
}

/** All StackPropertyType entries. */
export const STACK_PROPERTY_TYPE_ENTRIES: readonly StackPropertyTypeEntry[] = [
  /** Stack scale. */
  { name: "Scale", number: 1 },

  /** Stack maximum number of pieces (used by some stack types). */
  { name: "Limit", number: 2 },

  /** Stack design. */
  { name: "Type", number: 3 },
] as const;

/** @java metadata.graphics.util.StackPropertyType */
export type StackPropertyType = "Scale" | "Limit" | "Type";

/** True iff the given string is a valid StackPropertyType name. */
export function isStackPropertyType(value: string): value is StackPropertyType {
  return STACK_PROPERTY_TYPE_ENTRIES.some((e) => e.name === value);
}

/**
 * Returns the numeric value for a given StackPropertyType name.
 * @java StackPropertyType.number()
 */
export function stackPropertyTypeNumber(type: StackPropertyType): number {
  return STACK_PROPERTY_TYPE_ENTRIES.find((e) => e.name === type)!.number;
}
