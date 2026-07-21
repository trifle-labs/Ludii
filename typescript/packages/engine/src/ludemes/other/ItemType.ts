// @java Core/src/other/ItemType.java
/**
 * Faithful 1:1 transliteration of other.ItemType.
 *
 * The item type of the equipment, ordered to be sorted in the list of Item in
 * Equipment.java.
 *
 * Note: This is not a ludeme, just used internally.
 *
 * Java parity: other/ItemType.java
 *
 * @author Eric.Piette (Java), ported to TS
 */

// ---------------------------------------------------------------------------
// Enum — mirrors the Java enum declaration and ordinal order exactly.
// ---------------------------------------------------------------------------

/** @java other/ItemType.java — enum ItemType */
export enum ItemType {
  /** A container. */
  Container = 0,
  /** A hand container. */
  Hand = 1,
  /** A fan container. */
  Fan = 2,
  /** A dice container. */
  Dice = 3,
  /** The hints. */
  Hints = 4,
  /** The regions. */
  Regions = 5,
  /** A map. */
  Map = 6,
  /** The dominoes. */
  Dominoes = 7,
  /** A component. */
  Component = 8,
}

// ---------------------------------------------------------------------------
// Static helper methods — mirror Java static methods on the enum.
// ---------------------------------------------------------------------------

/**
 * @param itemType
 * @return True if and only if the given item type is a type of container.
 * @java other/ItemType.java — isContainer(ItemType)
 */
export function isContainer(itemType: ItemType): boolean {
  return itemType <= ItemType.Dice;
}

/**
 * @param itemType
 * @return True if and only if the given item type is a type of component
 *         (Component or Dominoes).
 * @java other/ItemType.java — isComponent(ItemType)
 */
export function isComponent(itemType: ItemType): boolean {
  return itemType >= ItemType.Dominoes;
}

/**
 * @param itemType
 * @return True if and only if the given item type is a Regions type.
 * @java other/ItemType.java — isRegion(ItemType)
 */
export function isRegion(itemType: ItemType): boolean {
  return itemType === ItemType.Regions;
}

/**
 * @param itemType
 * @return True if and only if the given item type is a Map type.
 * @java other/ItemType.java — isMap(ItemType)
 */
export function isMap(itemType: ItemType): boolean {
  return itemType === ItemType.Map;
}

/**
 * @param itemType
 * @return True if and only if the given item type is a Hints type.
 * @java other/ItemType.java — isHints(ItemType)
 */
export function isHints(itemType: ItemType): boolean {
  return itemType === ItemType.Hints;
}
