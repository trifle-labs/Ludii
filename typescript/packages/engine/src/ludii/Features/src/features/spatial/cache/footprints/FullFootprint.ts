// @java Features/src/features/spatial/cache/footprints/FullFootprint.java

/**
 * Footprint implementation with support for a mix of cell/vertex/edge stuff.
 *
 * @java features.spatial.cache.footprints.FullFootprint
 * @author Dennis Soemers
 */

import { ChunkSet } from "../../../../../../Common/src/main/collections/ChunkSet.js";
import { BaseFootprint } from "./BaseFootprint.js";

//-----------------------------------------------------------------------------

/**
 * Footprint with cell/vertex/edge support.
 *
 * @java features.spatial.cache.footprints.FullFootprint
 */
export class FullFootprint extends BaseFootprint {

  //-------------------------------------------------------------------------

  /** Mask for all chunks that we run at least one "empty" cell test on */
  protected readonly _emptyCell: ChunkSet | null;
  /** Mask for all chunks that we run at least one "empty" vertex test on */
  protected readonly _emptyVertex: ChunkSet | null;
  /** Mask for all chunks that we run at least one "empty" edge test on */
  protected readonly _emptyEdge: ChunkSet | null;

  /** Mask for all chunks that we run at least one "who" cell test on */
  protected readonly _whoCell: ChunkSet | null;
  /** Mask for all chunks that we run at least one "who" vertex test on */
  protected readonly _whoVertex: ChunkSet | null;
  /** Mask for all chunks that we run at least one "who" edge test on */
  protected readonly _whoEdge: ChunkSet | null;

  /** Mask for all chunks that we run at least one "what" cell test on */
  protected readonly _whatCell: ChunkSet | null;
  /** Mask for all chunks that we run at least one "what" vertex test on */
  protected readonly _whatVertex: ChunkSet | null;
  /** Mask for all chunks that we run at least one "what" edge test on */
  protected readonly _whatEdge: ChunkSet | null;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param emptyCell
   * @param emptyVertex
   * @param emptyEdge
   * @param whoCell
   * @param whoVertex
   * @param whoEdge
   * @param whatCell
   * @param whatVertex
   * @param whatEdge
   * @java FullFootprint(ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet, ChunkSet)
   */
  constructor(
    emptyCell: ChunkSet | null,
    emptyVertex: ChunkSet | null,
    emptyEdge: ChunkSet | null,
    whoCell: ChunkSet | null,
    whoVertex: ChunkSet | null,
    whoEdge: ChunkSet | null,
    whatCell: ChunkSet | null,
    whatVertex: ChunkSet | null,
    whatEdge: ChunkSet | null
  ) {
    super();
    this._emptyCell = emptyCell;
    this._emptyVertex = emptyVertex;
    this._emptyEdge = emptyEdge;
    this._whoCell = whoCell;
    this._whoVertex = whoVertex;
    this._whoEdge = whoEdge;
    this._whatCell = whatCell;
    this._whatVertex = whatVertex;
    this._whatEdge = whatEdge;
  }

  //-------------------------------------------------------------------------

  /** @java FullFootprint.emptyCell() */
  public emptyCell(): ChunkSet | null {
    return this._emptyCell;
  }

  /** @java FullFootprint.emptyVertex() */
  public emptyVertex(): ChunkSet | null {
    return this._emptyVertex;
  }

  /** @java FullFootprint.emptyEdge() */
  public emptyEdge(): ChunkSet | null {
    return this._emptyEdge;
  }

  /** @java FullFootprint.whoCell() */
  public whoCell(): ChunkSet | null {
    return this._whoCell;
  }

  /** @java FullFootprint.whoVertex() */
  public whoVertex(): ChunkSet | null {
    return this._whoVertex;
  }

  /** @java FullFootprint.whoEdge() */
  public whoEdge(): ChunkSet | null {
    return this._whoEdge;
  }

  /** @java FullFootprint.whatCell() */
  public whatCell(): ChunkSet | null {
    return this._whatCell;
  }

  /** @java FullFootprint.whatVertex() */
  public whatVertex(): ChunkSet | null {
    return this._whatVertex;
  }

  /** @java FullFootprint.whatEdge() */
  public whatEdge(): ChunkSet | null {
    return this._whatEdge;
  }

  //-------------------------------------------------------------------------
}
