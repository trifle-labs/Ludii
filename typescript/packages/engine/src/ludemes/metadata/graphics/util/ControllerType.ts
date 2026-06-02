/**
 * ControllerType.ts
 *
 * @java metadata/graphics/util/ControllerType.java
 *
 * Defines supported controller types for handling user interactions for
 * particular topologies.
 */

/** @java metadata.graphics.util.ControllerType */
export const CONTROLLER_TYPES = [
  /** Basic user interaction controller. */
  "BasicController",

  /** User interaction controller for games played on pyramidal topologies. */
  "PyramidalController",
] as const;

/** @java metadata.graphics.util.ControllerType */
export type ControllerType = (typeof CONTROLLER_TYPES)[number];

/** True iff the given string is a valid ControllerType value. */
export function isControllerType(value: string): value is ControllerType {
  return (CONTROLLER_TYPES as readonly string[]).includes(value);
}

/**
 * Returns the ControllerType for a name, defaulting to "BasicController".
 * @java ControllerType.fromName(String)
 */
export function controllerTypeFromName(name: string): ControllerType {
  return isControllerType(name) ? name : "BasicController";
}
