// @java Core/src/metadata/graphics/board/Board.java Board
/**
 * Java parity:
 * - Core/src/metadata/graphics/board/Board.java — faithful factory-class port.
 *   Static factory that creates the correct board graphics item from a type discriminant.
 *   In Java this is a class with several overloaded `construct()` static methods;
 *   here each overload is a separate named factory function for type safety.
 */

import type { ContainerStyleType } from "../util/ContainerStyleType.js";
import type { BoardGraphicsType } from "../util/BoardGraphicsType.js";
import type { Colour } from "../util/colour/Colour.js";
import type { PieceGroundType } from "../piece/PieceGroundType.js";
import { BoardStyle } from "./style/BoardStyle.js";
import { BoardStyleThickness } from "./styleThickness/BoardStyleThickness.js";
import { BoardCheckered } from "./Boolean/BoardCheckered.js";
import { BoardBackground } from "./ground/BoardBackground.js";
import { BoardForeground } from "./ground/BoardForeground.js";
import { BoardColour } from "./colour/BoardColour.js";
import { BoardPlacement } from "./placement/BoardPlacement.js";
import { BoardCurvature } from "./curvature/BoardCurvature.js";

// Re-export sub-types for convenience
export type BoardGraphicsItem =
  | BoardStyle
  | BoardStyleThickness
  | BoardCheckered
  | BoardBackground
  | BoardForeground
  | BoardColour
  | BoardPlacement
  | BoardCurvature;

/**
 * Factory: (board Style <containerStyleType> [replaceComponentsWithFilledCells:<bool>])
 */
export function constructBoardStyle(
  containerStyleType: ContainerStyleType,
  replaceComponentsWithFilledCells?: boolean | null,
): BoardStyle {
  return new BoardStyle(containerStyleType, replaceComponentsWithFilledCells);
}

/**
 * Factory: (board StyleThickness <boardGraphicsType> <thickness>)
 */
export function constructBoardStyleThickness(
  boardGraphicsType: BoardGraphicsType,
  thickness: number,
): BoardStyleThickness {
  return new BoardStyleThickness(boardGraphicsType, thickness);
}

/**
 * Factory: (board Checkered [<value>])
 */
export function constructBoardCheckered(
  value?: boolean | null,
): BoardCheckered {
  return new BoardCheckered(value);
}

/**
 * Factory: (board Background|Foreground image:<str> fillColour:<colour> ...)
 */
export function constructBoardGround(
  groundType: PieceGroundType,
  image: string | null,
  fillColour: Colour | null,
  edgeColour: Colour | null,
  scale: number | null,
  scaleX: number | null,
  scaleY: number | null,
  rotation: number | null,
  offsetX: number | null,
  offsetY: number | null,
): BoardBackground | BoardForeground {
  if (groundType === "Background") {
    return new BoardBackground(image, fillColour, edgeColour, scale, scaleX, scaleY, rotation, offsetX, offsetY);
  }
  if (groundType === "Foreground") {
    return new BoardForeground(image, fillColour, edgeColour, scale, scaleX, scaleY, rotation, offsetX, offsetY);
  }
  throw new Error(`Board.constructBoardGround: unexpected PieceGroundType "${groundType}"`);
}

/**
 * Factory: (board Colour <boardGraphicsType> <colour>)
 */
export function constructBoardColour(
  boardGraphicsType: BoardGraphicsType,
  colour: Colour,
): BoardColour {
  return new BoardColour(boardGraphicsType, colour);
}

/**
 * Factory: (board Placement [scale:<float>] [offsetX:<float>] [offsetY:<float>])
 */
export function constructBoardPlacement(
  scale: number | null,
  offsetX: number | null,
  offsetY: number | null,
): BoardPlacement {
  return new BoardPlacement(scale, offsetX, offsetY);
}

/**
 * Factory: (board Curvature <curveOffset>)
 */
export function constructBoardCurvature(curveOffset: number): BoardCurvature {
  return new BoardCurvature(curveOffset);
}
