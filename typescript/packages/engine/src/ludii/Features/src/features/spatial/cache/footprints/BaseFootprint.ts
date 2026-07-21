// @java Features/src/features/spatial/cache/footprints/BaseFootprint.java

/**
 * Wrapper class for masks that represent the key-specific (specific to
 * player index / from-pos / to-pos) footprint of a complete Feature Set.
 *
 * @java features.spatial.cache.footprints.BaseFootprint
 * @author Dennis Soemers
 */

import { ChunkSet } from "../../../../../../Common/src/main/collections/ChunkSet.js";

//-----------------------------------------------------------------------------

/**
 * Abstract base class for footprints.
 *
 * @java features.spatial.cache.footprints.BaseFootprint
 */
export abstract class BaseFootprint {

  //-------------------------------------------------------------------------

  /**
   * @return Footprint on "empty" ChunkSet for cells
   * @java BaseFootprint.emptyCell()
   */
  public abstract emptyCell(): ChunkSet | null;

  /**
   * @return Footprint on "empty" ChunkSet for vertices
   * @java BaseFootprint.emptyVertex()
   */
  public abstract emptyVertex(): ChunkSet | null;

  /**
   * @return Footprint on "empty" ChunkSet for edges
   * @java BaseFootprint.emptyEdge()
   */
  public abstract emptyEdge(): ChunkSet | null;

  /**
   * @return Footprint on "who" ChunkSet for cells
   * @java BaseFootprint.whoCell()
   */
  public abstract whoCell(): ChunkSet | null;

  /**
   * @return Footprint on "who" ChunkSet for vertices
   * @java BaseFootprint.whoVertex()
   */
  public abstract whoVertex(): ChunkSet | null;

  /**
   * @return Footprint on "who" ChunkSet for edges
   * @java BaseFootprint.whoEdge()
   */
  public abstract whoEdge(): ChunkSet | null;

  /**
   * @return Footprint on "what" ChunkSet for cells
   * @java BaseFootprint.whatCell()
   */
  public abstract whatCell(): ChunkSet | null;

  /**
   * @return Footprint on "what" ChunkSet for vertices
   * @java BaseFootprint.whatVertex()
   */
  public abstract whatVertex(): ChunkSet | null;

  /**
   * @return Footprint on "what" ChunkSet for edges
   * @java BaseFootprint.whatEdge()
   */
  public abstract whatEdge(): ChunkSet | null;

  //-------------------------------------------------------------------------

  /**
   * Adds the given other footprint to this one
   * @param other
   * @java BaseFootprint.union(BaseFootprint)
   */
  public union(other: BaseFootprint): void {
    if (other.emptyCell() !== null)
      this.emptyCell()!.or(other.emptyCell()!);
    if (other.emptyVertex() !== null)
      this.emptyVertex()!.or(other.emptyVertex()!);
    if (other.emptyEdge() !== null)
      this.emptyEdge()!.or(other.emptyEdge()!);

    if (other.whoCell() !== null)
      this.whoCell()!.or(other.whoCell()!);
    if (other.whoVertex() !== null)
      this.whoVertex()!.or(other.whoVertex()!);
    if (other.whoEdge() !== null)
      this.whoEdge()!.or(other.whoEdge()!);

    if (other.whatCell() !== null)
      this.whatCell()!.or(other.whatCell()!);
    if (other.whatVertex() !== null)
      this.whatVertex()!.or(other.whatVertex()!);
    if (other.whatEdge() !== null)
      this.whatEdge()!.or(other.whatEdge()!);
  }

  //-------------------------------------------------------------------------
}
