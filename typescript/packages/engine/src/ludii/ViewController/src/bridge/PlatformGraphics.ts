// @java ViewController/src/bridge/PlatformGraphics.java

import type { Graphics2D } from "../../../awt/index.js";
import type { SVGGraphics2D } from "../../../awt/index.js";
import type { Point } from "../../../awt/index.js";
import type { Rectangle2D } from "../../../awt/index.js";
import type { Context } from "../../../../context.js";
import type { Location } from "../../../../ludemes/other/location/Location.js";
import type { ImageInfo } from "../util/ImageInfo.js";

/**
 * Interface for linking with the Graphics of different platforms
 * (e.g. PlayerDesktop/DesktopGraphics).
 *
 * Faithful 1:1 port of bridge.PlatformGraphics.
 *
 * @author Matthew.Stephenson (Java original)
 */
export interface PlatformGraphics {

  /**
   * Returns the Full location of the component associated with the image clicked on.
   * @java PlatformGraphics#locationOfClickedImage(Point)
   */
  locationOfClickedImage(pt: Point): Location;

  /**
   * Draws a component based on the specified ImageInfo.
   * @java PlatformGraphics#drawComponent(Graphics2D, Context, ImageInfo)
   */
  drawComponent(g2d: Graphics2D, context: Context, imageInfo: ImageInfo): void;

  /**
   * Draws the game board.
   * @java PlatformGraphics#drawBoard(Context, Graphics2D, Rectangle2D)
   */
  drawBoard(context: Context, g2d: Graphics2D, boardDimensions: Rectangle2D): void;

  /**
   * Draws the game board's graph.
   * @java PlatformGraphics#drawGraph(Context, Graphics2D, Rectangle2D)
   */
  drawGraph(context: Context, g2d: Graphics2D, boardDimensions: Rectangle2D): void;

  /**
   * Draws the game board's connections.
   * @java PlatformGraphics#drawConnections(Context, Graphics2D, Rectangle2D)
   */
  drawConnections(context: Context, g2d: Graphics2D, boardDimensions: Rectangle2D): void;

  /**
   * Draws a single specified image.
   * @java PlatformGraphics#drawSVG(Context, Graphics2D, SVGGraphics2D, ImageInfo)
   */
  drawSVG(context: Context, g2d: Graphics2D, svg: SVGGraphics2D, imageInfo: ImageInfo): void;
}
