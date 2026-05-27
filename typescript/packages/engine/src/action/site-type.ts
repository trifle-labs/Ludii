// @java Core/src/game/types/board/SiteType.java SiteType
/**
 * Java parity:
 * - Core/src/game/types/board/SiteType.java — the enum-shape port.
 *   The `gameFlags(...)` and `concepts(...)` static methods are
 *   deferred because they touch `GameType` flag constants and the
 *   `Concept` enum that have not been ported yet.
 *
 * Defines the element types that make up each graph in a Ludii game.
 */

export const SITE_TYPES = ["Vertex", "Edge", "Cell"] as const;

/** Graph vertex, edge, or cell/face. */
export type SiteType = (typeof SITE_TYPES)[number];

/** True iff the given string is a valid `SiteType` value. */
export function isSiteType(value: string): value is SiteType {
  return (SITE_TYPES as readonly string[]).includes(value);
}
