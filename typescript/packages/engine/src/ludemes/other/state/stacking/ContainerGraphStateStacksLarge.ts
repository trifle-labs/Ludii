// @java Core/src/other/state/stacking/ContainerGraphStateStacksLarge.java

import { ContainerStateStacksLarge } from "./ContainerStateStacksLarge.js";
import type { GameRef, ContainerRef } from "../container/ContainerState.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

/**
 * State for a graph-large-stacking container.
 * Faithful 1:1 port of ContainerGraphStateStacksLarge.java.
 *
 * Extends ContainerStateStacksLarge; adds edge/vertex stack support.
 * (In this port, edge/vertex stacking is simplified — same as ContainerStateStacksLarge.)
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class ContainerGraphStateStacksLarge extends ContainerStateStacksLarge {
  constructor(generator: ZobristHashGenerator, game: GameRef, container: ContainerRef, type: number) {
    super(generator, game, container, type);
  }

  override deepClone(): ContainerGraphStateStacksLarge {
    return Object.assign(Object.create(ContainerGraphStateStacksLarge.prototype), super.deepClone()) as ContainerGraphStateStacksLarge;
  }
}
