/**
 * Sets a graphic element to a player.
 *
 * @java metadata/graphics/player/Player.java
 */

import type { RoleTypeFull } from "../../../game/types/play/RoleType.js";
import { PlayerColour } from "./colour/PlayerColour.js";
import { PlayerName } from "./name/PlayerName.js";
import type { Colour } from "../util/colour/Colour.js";

/** @java metadata/graphics/player/PlayerColourType.java */
export type PlayerColourType = "Colour";

/** @java metadata/graphics/player/PlayerNameType.java */
export type PlayerNameType = "Name";

/**
 * Union of all concrete player-graphics-item types.
 *
 * @java metadata/graphics/player/Player.java — class Player implements GraphicsItem
 */
export type PlayerGraphicsItem = PlayerColour | PlayerName;

/**
 * Factory: constructs a PlayerColour for a given player.
 *
 * @java metadata/graphics/player/Player.java — construct(PlayerColourType, RoleType, Colour)
 */
export function constructPlayerColour(
  playerType: PlayerColourType,
  roleType: RoleTypeFull,
  colour: Colour,
): PlayerColour {
  switch (playerType) {
    case "Colour":
      return new PlayerColour(roleType, colour);
  }
}

/**
 * Factory: constructs a PlayerName for a given player.
 *
 * @java metadata/graphics/player/Player.java — construct(PlayerNameType, RoleType, String)
 */
export function constructPlayerName(
  playerType: PlayerNameType,
  roleType: RoleTypeFull,
  name: string,
): PlayerName {
  switch (playerType) {
    case "Name":
      return new PlayerName(roleType, name);
  }
}
