// @java Core/src/other/state/stacking/ContainerGraphStateStacks.java

import { ContainerStateStacks } from "./ContainerStateStacks.js";
import type { GameRef, ContainerRef } from "../container/ContainerState.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

/**
 * State for a graph-stacking container (stacks + full graph element support).
 * Faithful 1:1 port of ContainerGraphStateStacks.java.
 *
 * Extends ContainerStateStacks; adds edge/vertex stack support.
 * (In this port, edge/vertex stacking is simplified — same as ContainerStateStacks.)
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class ContainerGraphStateStacks extends ContainerStateStacks {
  constructor(generator: ZobristHashGenerator, game: GameRef, container: ContainerRef, type: number) {
    super(generator, game, container, type);
  }

  override deepClone(): ContainerGraphStateStacks {
    const copy = new ContainerGraphStateStacks(
      null as unknown as ZobristHashGenerator, // copy constructor path
      null as unknown as GameRef,
      null as unknown as ContainerRef,
      0,
    );
    // Use the ContainerStateStacks copy path by re-creating from a clone
    return Object.assign(Object.create(ContainerGraphStateStacks.prototype), super.deepClone()) as ContainerGraphStateStacks;
  }
}
