/**
 * Sets the name of a player.
 *
 * @java metadata/graphics/player/name/PlayerName.java
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";

/**
 * @java metadata/graphics/player/name/PlayerName.java — class PlayerName implements GraphicsItem
 */
export class PlayerName {
  /** RoleType condition. */
  readonly roleType: RoleTypeFull;

  /** Player name to apply. */
  readonly name: string;

  constructor(roleType: RoleTypeFull, name: string) {
    this.roleType = roleType;
    this.name = name;
  }

  /** @return RoleType condition to check. */
  getRoleType(): RoleTypeFull {
    return this.roleType;
  }

  /** @return String to apply onto player. */
  getName(): string {
    return this.name;
  }

  needRedraw(): boolean {
    return false;
  }
}
