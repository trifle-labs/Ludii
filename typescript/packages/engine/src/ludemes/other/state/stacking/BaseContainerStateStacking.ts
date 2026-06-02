// @java Core/src/other/state/stacking/BaseContainerStateStacking.java

import { BaseContainerState } from "../container/BaseContainerState.js";
import type { SiteType, StateRef, GameRef, ContainerRef } from "../container/ContainerState.js";

/**
 * Global State for a stacking container item — abstract base.
 * Faithful 1:1 port of BaseContainerStateStacking.java.
 *
 * @author Eric.Piette (Java), ported to TS
 */
export abstract class BaseContainerStateStacking extends BaseContainerState {
  constructor(game: GameRef, container: ContainerRef, numSites: number);
  constructor(other: BaseContainerStateStacking);
  constructor(
    gameOrOther: GameRef | BaseContainerStateStacking,
    container?: ContainerRef,
    numSites?: number,
  ) {
    if (gameOrOther instanceof BaseContainerStateStacking) {
      super(gameOrOther);
    } else {
      super(gameOrOther as GameRef, container!, numSites!);
    }
  }

  // BaseContainerStateStacking.what/who/etc delegate by type — same as BaseContainerState
  // Stacking-specific methods (addItem, removeStack, etc.) are provided by concrete subclasses
}
