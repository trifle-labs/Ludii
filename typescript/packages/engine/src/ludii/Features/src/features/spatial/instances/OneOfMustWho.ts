// @java Features/src/features/spatial/instances/OneOfMustWho.java

import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";
import type { BitwiseTest, SiteType, State } from "./BitwiseTest.js";

/**
 * Simultaneously tests multiple chunks of the "who" ChunkSet.
 *
 * TODO could make special cases of this class for cells, vertices, and edges
 *
 * @java features/spatial/instances/OneOfMustWho.java
 * @author Dennis Soemers
 */

/** @java other.state.container.ContainerState (extended for violatesNot overloads) */
interface ContainerStateExtended {
  violatesNotWhoCell(mask: ChunkSet, pattern: ChunkSet, firstUsedWord: number): boolean;
  violatesNotWhoVertex(mask: ChunkSet, pattern: ChunkSet, firstUsedWord: number): boolean;
  violatesNotWhoEdge(mask: ChunkSet, pattern: ChunkSet, firstUsedWord: number): boolean;
}

export class OneOfMustWho implements BitwiseTest {

  //-------------------------------------------------------------------------

  /**
   * Set of chunks of which at least one must match game state's Who
   * ChunkSet for test to succeed.
   */
  protected readonly mustWhos: ChunkSet;

  /** Mask for must-who tests */
  protected readonly mustWhosMask: ChunkSet;

  /** The first non-zero word in the mustWhosMask ChunkSet */
  protected readonly firstUsedWord: number;

  /** Graph element type we want to test on */
  protected readonly _graphElementType: SiteType;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param mustWhos
   * @param mustWhosMask
   * @param graphElementType
   * @java OneOfMustWho(ChunkSet, ChunkSet, SiteType)
   */
  public constructor(mustWhos: ChunkSet, mustWhosMask: ChunkSet, graphElementType: SiteType) {
    this.mustWhos = mustWhos;
    this.mustWhosMask = mustWhosMask;
    this._graphElementType = graphElementType;
    // Java: Long.SIZE = 64
    this.firstUsedWord = Math.trunc(mustWhosMask.nextSetBit(0) / 64);
  }

  //-------------------------------------------------------------------------

  /** @java OneOfMustWho.matches(State) */
  public matches(state: State): boolean {
    const container = state.containerStates()[0] as unknown as ContainerStateExtended;
    switch (this._graphElementType) {
      case "Cell":
        return (container.violatesNotWhoCell(this.mustWhosMask, this.mustWhos, this.firstUsedWord));
      case "Vertex":
        return (container.violatesNotWhoVertex(this.mustWhosMask, this.mustWhos, this.firstUsedWord));
      case "Edge":
        return (container.violatesNotWhoEdge(this.mustWhosMask, this.mustWhos, this.firstUsedWord));
      default:
        break;
    }

    return false;
  }

  //-------------------------------------------------------------------------

  /** @java OneOfMustWho.hasNoTests() */
  public hasNoTests(): boolean {
    return false;
  }

  /** @java OneOfMustWho.onlyRequiresSingleMustEmpty() */
  public onlyRequiresSingleMustEmpty(): boolean {
    return false;
  }

  /** @java OneOfMustWho.onlyRequiresSingleMustWho() */
  public onlyRequiresSingleMustWho(): boolean {
    return true;
  }

  /** @java OneOfMustWho.onlyRequiresSingleMustWhat() */
  public onlyRequiresSingleMustWhat(): boolean {
    return false;
  }

  /** @java OneOfMustWho.graphElementType() */
  public graphElementType(): SiteType {
    return this._graphElementType;
  }

  //-------------------------------------------------------------------------

  /**
   * @return mustWhos ChunkSet
   * @java OneOfMustWho.mustWhos()
   */
  public mustWhosChunkSet(): ChunkSet {
    return this.mustWhos;
  }

  /**
   * @return mustWhosMask ChunkSet
   * @java OneOfMustWho.mustWhosMask()
   */
  public mustWhosMaskChunkSet(): ChunkSet {
    return this.mustWhosMask;
  }

  //-------------------------------------------------------------------------

  /** @java OneOfMustWho.toString() */
  public toString(): string {
    let requirementsStr = "";

    for (let i = 0; i < this.mustWhos.numChunks(); ++i) {
      if (this.mustWhosMask.getChunk(i) !== 0) {
        requirementsStr +=
          i + " must belong to " + this.mustWhos.getChunk(i) + ", ";
      }
    }

    return `One of these who-conditions must hold: [${requirementsStr}]`;
  }

  //-------------------------------------------------------------------------
}
