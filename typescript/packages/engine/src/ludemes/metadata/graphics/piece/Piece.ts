/**
 * Sets a graphic data to the pieces.
 *
 * @java metadata/graphics/piece/Piece.java
 */

import type { RoleTypeFull } from "../../../game/types/play/RoleType.js";
import type { ComponentStyleType } from "../util/ComponentStyleType.js";
import type { Colour } from "../util/colour/Colour.js";
import { PieceStyle } from "./style/PieceStyle.js";
import { PieceRotate } from "./rotate/PieceRotate.js";
import { PieceScale } from "./scale/PieceScale.js";
import { PieceRename } from "./name/PieceRename.js";

/**
 * Union of all concrete piece-graphics-item types.
 * This mirrors the Java GraphicsItem return value of the static construct() methods.
 *
 * @java metadata/graphics/piece/Piece.java — class Piece implements GraphicsItem
 */
export type PieceGraphicsItem = PieceStyle | PieceRotate | PieceScale | PieceRename;

/**
 * Factory: constructs a PieceStyle.
 *
 * @java metadata/graphics/piece/Piece.java — construct(PieceStyleType, RoleType, String, ComponentStyleType)
 */
export function constructPieceStyle(
  roleType: RoleTypeFull | null,
  pieceName: string | null,
  componentStyleType: ComponentStyleType,
): PieceStyle {
  return new PieceStyle(roleType, pieceName, componentStyleType);
}

/**
 * Factory: constructs a PieceRotate.
 *
 * @java metadata/graphics/piece/Piece.java — construct(PieceRotateType, RoleType, String, Integer, Integer, Integer, Integer)
 */
export function constructPieceRotate(
  roleType: RoleTypeFull | null,
  pieceName: string | null,
  container: number | null,
  state: number | null,
  value: number | null,
  degrees: number,
): PieceRotate {
  return new PieceRotate(roleType, pieceName, container, state, value, degrees);
}

/**
 * Factory: constructs a PieceScale.
 *
 * @java metadata/graphics/piece/Piece.java — construct(PieceScaleType, RoleType, String, Integer, Integer, Integer, Float, Float, Float)
 */
export function constructPieceScale(
  roleType: RoleTypeFull | null,
  pieceName: string | null,
  container: number | null,
  state: number | null,
  value: number | null,
  scale: number | null,
  scaleX: number | null,
  scaleY: number | null,
): PieceScale {
  return new PieceScale(roleType, pieceName, container, state, value, scale, scaleX, scaleY);
}

/**
 * Factory: constructs a PieceRename.
 *
 * @java metadata/graphics/piece/Piece.java — construct(PieceNameType, RoleType, String, Integer, Integer, Integer, String)
 */
export function constructPieceRename(
  roleType: RoleTypeFull | null,
  piece: string | null,
  container: number | null,
  state: number | null,
  value: number | null,
  name: string,
): PieceRename {
  return new PieceRename(roleType, piece, container, state, value, name);
}
