// @java Core/src/game/types/board/SiteType.java SiteType
/**
 * Defines the element types that make up each graph in a Ludii game.
 *
 * Faithful 1:1 transliteration of game.types.board.SiteType (Java enum).
 */

export const SITE_TYPE_VALUES = ["Vertex", "Edge", "Cell"] as const;
export type SiteType = (typeof SITE_TYPE_VALUES)[number];
