/**
 * ShowSitesAsHoles.ts
 *
 * @java metadata/graphics/show/sites/ShowSitesAsHoles.java
 *
 * Indicates whether the sites of the board should be represented as holes.
 */

import type { HoleType } from "../../util/HoleType.js";

/**
 * @java metadata.graphics.show.sites.ShowSitesAsHoles
 */
export class ShowSitesAsHoles {
  /** Hole type. */
  readonly type: HoleType;

  /** The site indices of the special holes. */
  readonly indices: number[];

  /**
   * @param indices The indices of the special holes.
   * @param type    The shape of the holes.
   * @java ShowSitesAsHoles(Integer[], HoleType)
   */
  constructor(indices: number[], type: HoleType) {
    this.indices = indices.slice();
    this.type = type;
  }

  /** @java GraphicsItem.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}
