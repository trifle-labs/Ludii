/**
 * Sets the colour of a player.
 *
 * @java metadata/graphics/player/colour/PlayerColour.java
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";
import type { Colour } from "../../util/colour/Colour.js";

/**
 * @java metadata/graphics/player/colour/PlayerColour.java — class PlayerColour implements GraphicsItem
 */
export class PlayerColour {
  /** RoleType condition. */
  readonly roleType: RoleTypeFull;

  /** Player colour to apply. */
  readonly colour: Colour;

  constructor(roleType: RoleTypeFull, colour: Colour) {
    this.roleType = roleType;
    this.colour = colour;
  }

  /** @return RoleType condition to check. */
  getRoleType(): RoleTypeFull {
    return this.roleType;
  }

  /** @return Colour to apply onto player. */
  getColour(): Colour {
    return this.colour;
  }

  needRedraw(): boolean {
    return false;
  }
}
