/**
 * @java game/equipment/Equipment.java Equipment
 *
 * 1:1-port equipment container.
 *
 * Holds the board and pieces for a game, and assigns 1-based component indices
 * to pieces (mirroring Java's Equipment.create() which populates component[]).
 *
 * @java game/equipment/Equipment.java — create()/components()/board()
 */

import type { Board1to1 } from "./container/board/Board1to1.js";
import type { Piece } from "./component/Piece.js";

export class Equipment1to1 {
  /**
   * The board. @java Equipment.board()
   */
  public readonly board: Board1to1;

  /**
   * All pieces, indexed 0-based. Each piece's `index` field will be set to
   * its 1-based component index by this constructor.
   * @java Equipment.components() — 1-based array (index 0 unused)
   */
  public readonly pieces: readonly Piece[];

  /**
   * @java game/equipment/Equipment.java — create()
   *
   * Assigns 1-based component indices to pieces, matching Java's Equipment.
   * Java assigns indices starting at 1 in declaration order.
   */
  public constructor(board: Board1to1, pieces: Piece[]) {
    this.board = board;
    // Assign 1-based component indices.
    // @java Equipment.java — for each Component, component.setIndex(i)
    for (let i = 0; i < pieces.length; i++) {
      pieces[i]!.index = i + 1;
    }
    this.pieces = Object.freeze([...pieces]);
  }

  /**
   * Get piece by 1-based component index.
   * @java Equipment.components()[i]
   */
  public componentAt(index: number): Piece | undefined {
    return this.pieces[index - 1];
  }

  /**
   * Get all pieces owned by a given player.
   * @java game.components() filtered by owner
   */
  public piecesOwnedBy(owner: number): Piece[] {
    return this.pieces.filter(p => p.owner === owner) as Piece[];
  }
}
