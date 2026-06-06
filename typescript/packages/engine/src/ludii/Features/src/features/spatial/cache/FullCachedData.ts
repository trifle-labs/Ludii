// @java Features/src/features/spatial/cache/FullCachedData.java

/**
 * A full version of cached data with support for any mix of cell/edge/vertex
 *
 * @java features/spatial/cache/FullCachedData.java
 * @author Dennis Soemers
 */

import { BaseCachedData, ContainerState } from "./BaseCachedData.js";
import { BaseFootprint } from "./footprints/BaseFootprint.js";
import { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";

//-----------------------------------------------------------------------------

/**
 * @java features.spatial.cache.FullCachedData
 */
export class FullCachedData extends BaseCachedData {

  //-------------------------------------------------------------------------

  /**
   * masked "empty" ChunkSet in the game state for which we last cached active
   * features (for cells)
   */
  protected readonly emptyStateCells: ChunkSet;

  /**
   * masked "empty" ChunkSet in the game state for which we last cached active
   * features (for vertices)
   */
  protected readonly emptyStateVertices: ChunkSet;

  /**
   * masked "empty" ChunkSet in the game state for which we last cached active
   * features (for edges)
   */
  protected readonly emptyStateEdges: ChunkSet;

  /**
   * masked "who" ChunkSet in the game state for which we last cached active
   * features (for cells)
   */
  protected readonly whoStateCells: ChunkSet;

  /**
   * masked "who" ChunkSet in the game state for which we last cached active
   * features (for vertices)
   */
  protected readonly whoStateVertices: ChunkSet;

  /**
   * masked "who" ChunkSet in the game state for which we last cached active
   * features (for edges)
   */
  protected readonly whoStateEdges: ChunkSet;

  /**
   * masked "what" ChunkSet in the game state for which we last cached active
   * features (for cells)
   */
  protected readonly whatStateCells: ChunkSet;

  /**
   * masked "what" ChunkSet in the game state for which we last cached active
   * features (for vertices)
   */
  protected readonly whatStateVertices: ChunkSet;

  /**
   * masked "what" ChunkSet in the game state for which we last cached active
   * features (for edges)
   */
  protected readonly whatStateEdges: ChunkSet;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   *
   * @param activeFeatureIndices
   * @param emptyStateCells
   * @param emptyStateVertices
   * @param emptyStateEdges
   * @param whoStateCells
   * @param whoStateVertices
   * @param whoStateEdges
   * @param whatStateCells
   * @param whatStateVertices
   * @param whatStateEdges
   * @java FullCachedData(int[], ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet)
   */
  constructor(
    activeFeatureIndices: number[],
    emptyStateCells: ChunkSet,
    emptyStateVertices: ChunkSet,
    emptyStateEdges: ChunkSet,
    whoStateCells: ChunkSet,
    whoStateVertices: ChunkSet,
    whoStateEdges: ChunkSet,
    whatStateCells: ChunkSet,
    whatStateVertices: ChunkSet,
    whatStateEdges: ChunkSet,
  ) {
    super(activeFeatureIndices);
    this.emptyStateCells = emptyStateCells;
    this.emptyStateVertices = emptyStateVertices;
    this.emptyStateEdges = emptyStateEdges;
    this.whoStateCells = whoStateCells;
    this.whoStateVertices = whoStateVertices;
    this.whoStateEdges = whoStateEdges;
    this.whatStateCells = whatStateCells;
    this.whatStateVertices = whatStateVertices;
    this.whatStateEdges = whatStateEdges;
  }

  //-------------------------------------------------------------------------

  public override isDataValid(containerState: ContainerState, footprint: BaseFootprint): boolean {
    if (
      footprint.emptyCell() !== null &&
      !containerState.emptyChunkSetCell()!.matches(footprint.emptyCell(), this.emptyStateCells)
    ) {
      // part of "empty" state for Cells covered by footprint no longer matches, data invalid
      return false;
    } else if (
      footprint.emptyVertex() !== null &&
      !containerState.emptyChunkSetVertex()!.matches(footprint.emptyVertex(), this.emptyStateVertices)
    ) {
      // part of "empty" state for Vertices covered by footprint no longer matches, data invalid
      return false;
    } else if (
      footprint.emptyEdge() !== null &&
      !containerState.emptyChunkSetEdge()!.matches(footprint.emptyEdge(), this.emptyStateEdges)
    ) {
      // part of "empty" state for Edges covered by footprint no longer matches, data invalid
      return false;
    } else if (
      footprint.whoCell() !== null &&
      !containerState.matchesWhoCell(footprint.whoCell(), this.whoStateCells)
    ) {
      // part of "who" state for Cells covered by footprint no longer matches, data invalid
      return false;
    } else if (
      footprint.whoVertex() !== null &&
      !containerState.matchesWhoVertex(footprint.whoVertex(), this.whoStateVertices)
    ) {
      // part of "who" state for Vertices covered by footprint no longer matches, data invalid
      return false;
    } else if (
      footprint.whoEdge() !== null &&
      !containerState.matchesWhoEdge(footprint.whoEdge(), this.whoStateEdges)
    ) {
      // part of "who" state for Edges covered by footprint no longer matches, data invalid
      return false;
    } else if (
      footprint.whatCell() !== null &&
      !containerState.matchesWhatCell(footprint.whatCell(), this.whatStateCells)
    ) {
      // part of "what" state for Cells covered by footprint no longer matches, data invalid
      return false;
    } else if (
      footprint.whatVertex() !== null &&
      !containerState.matchesWhatVertex(footprint.whatVertex(), this.whatStateVertices)
    ) {
      // part of "what" state for Vertices covered by footprint no longer matches, data invalid
      return false;
    } else if (
      footprint.whatEdge() !== null &&
      !containerState.matchesWhatEdge(footprint.whatEdge(), this.whatStateEdges)
    ) {
      // part of "what" state for Edges covered by footprint no longer matches, data invalid
      return false;
    }

    return true;
  }

  //-------------------------------------------------------------------------
}
