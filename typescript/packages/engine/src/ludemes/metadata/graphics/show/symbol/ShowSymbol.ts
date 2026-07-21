/**
 * ShowSymbol.ts
 *
 * @java metadata/graphics/show/symbol/ShowSymbol.java
 *
 * Draws a specified image on the board.
 */

import type { BoardGraphicsType } from "../../util/BoardGraphicsType.js";
import type { Colour } from "../../util/colour/Colour.js";

/**
 * @java metadata.graphics.show.symbol.ShowSymbol
 */
export class ShowSymbol {
  /** Image to draw. */
  readonly imageName: string | null;

  /** Text to draw. */
  readonly text: string | null;

  /** Region name to add the image onto. */
  readonly region: string | null;

  /** GraphElementType for the specified location(s) (string mirror of SiteType). */
  readonly graphElementType: string | null;

  /** Set of locations to add the image onto. */
  readonly sites: number[] | null;

  /**
   * RegionFunction to draw image on.
   * Java type: RegionFunction — stored as opaque reference; null if absent.
   */
  readonly regionFunction: unknown | null;

  /** RoleType condition (string mirror of Java RoleType). */
  readonly roleType: string | null;

  /** Scale of drawn image. */
  readonly scale: number;

  /** Scale of drawn image along x-axis. */
  readonly scaleX: number;

  /** Scale of drawn image along y-axis. */
  readonly scaleY: number;

  /** Fill colour of drawn image. */
  readonly fillColour: Colour | null;

  /** Edge colour of drawn image. */
  readonly edgeColour: Colour | null;

  /** BoardGraphicsType condition. */
  readonly boardGraphicsType: BoardGraphicsType | null;

  /** Rotation of the drawn image. */
  readonly rotation: number;

  /** Offset right for drawn image. */
  readonly offsetX: number;

  /** Offset down for drawn image. */
  readonly offsetY: number;

  /**
   * @java ShowSymbol(String, String, String, RoleType, SiteType, Integer[], Integer,
   *                  RegionFunction, BoardGraphicsType, Colour, Colour, Float, Float,
   *                  Float, Integer, Float, Float)
   */
  constructor(
    imageName: string | null,
    text: string | null,
    region: string | null,
    roleType: string | null,
    graphElementType: string | null,
    sites: number[] | null,
    site: number | null,
    regionFunction: unknown | null,
    boardGraphicsType: BoardGraphicsType | null,
    fillColour: Colour | null,
    edgeColour: Colour | null,
    scale: number | null,
    scaleX: number | null,
    scaleY: number | null,
    rotation: number | null,
    offsetX: number | null,
    offsetY: number | null,
  ) {
    this.imageName = imageName;
    this.text = text;
    this.region = region;
    this.graphElementType = graphElementType;
    // Mirror Java: sites takes precedence over single site
    this.sites = sites !== null ? sites : (site !== null ? [site] : null);
    this.regionFunction = regionFunction;
    this.boardGraphicsType = boardGraphicsType;
    this.fillColour = fillColour;
    this.edgeColour = edgeColour;
    this.scale = scale ?? 1.0;
    this.scaleX = scaleX ?? 1.0;
    this.scaleY = scaleY ?? 1.0;
    this.rotation = rotation ?? 0;
    this.roleType = roleType;
    this.offsetX = offsetX ?? 0.0;
    this.offsetY = offsetY ?? 0.0;
  }

  /** @java GraphicsItem.needRedraw() */
  needRedraw(): boolean {
    // mirrors Java: return !regionFunction.isStatic() if present
    return false;
  }
}
