// @java Player/src/app/utils/GUIUtil.java

import { Point, Rectangle } from "../../../../awt/index.js";

/**
 * Minimal structural type for app.views.View (not yet ported in this batch).
 * @java app.views.View
 */
interface View {
  placement(): Rectangle;
}

// -------------------------------------------------------------------------

/**
 * Utility functions for the GUI.
 *
 * Faithful 1:1 port of app.utils.GUIUtil.
 *
 * @author Matthew Stephenson (Java original)
 * @java app.utils.GUIUtil
 */
export class GUIUtil {

  // -------------------------------------------------------------------------

  /**
   * Checks if point overlaps the rectangle.
   * @java GUIUtil#pointOverlapsRectangle(Point, Rectangle)
   */
  static pointOverlapsRectangle(p: Point, rectangle: Rectangle): boolean {
    return GUIUtil.pointOverlapsRectangles(p, [rectangle]);
  }

  /**
   * Checks if point overlaps any rectangle in the list.
   * @java GUIUtil#pointOverlapsRectangles(Point, Rectangle[])
   */
  static pointOverlapsRectangles(p: Point, rectangleList: (Rectangle | null)[]): boolean {
    const bufferDistance = 2;

    for (const r of rectangleList) {
      if (r !== null && r !== undefined) {
        if (
          p.x > r.x - bufferDistance &&
          p.x < r.x + r.width + bufferDistance &&
          p.y > r.y - bufferDistance &&
          p.y < r.y + r.height + bufferDistance
        ) {
          return true;
        }
      }
    }

    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * Returns the ViewPanel that the point is on.
   * @java GUIUtil#calculateClickedPanel(List, Point)
   */
  static calculateClickedPanel(panels: View[], pt: Point): View | null {
    let clickedPanel: View | null = null;

    for (const p of panels) {
      const placement = p.placement();
      if (
        pt.x >= placement.x &&
        pt.x < placement.x + placement.width &&
        pt.y >= placement.y &&
        pt.y < placement.y + placement.height
      ) {
        clickedPanel = p;
        break;
      }
    }

    return clickedPanel;
  }

  // -------------------------------------------------------------------------
}
