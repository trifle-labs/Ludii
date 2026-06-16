// @java Core/src/game/equipment/container/board/Boardless.java

/**
 * Defines a boardless container growing in function of the pieces played.
 *
 * @java game/equipment/container/board/Boardless.java
 * @author Eric.Piette
 *
 * @remarks The playable sites of the board will be all the sites adjacent to
 *          the places already played/placed. No pregeneration is computed on
 *          the graph except the centre.
 */

import { RectangleOnSquare } from "../../../functions/graph/generators/basis/square/RectangleOnSquare.js";
import { HexagonOnHex } from "../../../functions/graph/generators/basis/hex/HexagonOnHex.js";
import { TriangleOnTri } from "../../../functions/graph/generators/basis/tri/TriangleOnTri.js";
import { Board } from "./Board.js";
import type { TilingBoardlessType } from "../../../types/board/TilingBoardlessType.js";

/**
 * Java constants mirrored:
 * - Constants.SIZE_BOARDLESS = 41 (square boardless dimension)
 * - Constants.SIZE_HEX_BOARDLESS = 21 (hex boardless dimension)
 */
const SIZE_BOARDLESS = 41;
const SIZE_HEX_BOARDLESS = 21; // @java Constants.SIZE_HEX_BOARDLESS (was wrongly 9 -> 217 cells; Andantino move to=671 needs the full 1261-cell hex)

/**
 * A boardless board — starts empty and expands with each piece placed.
 *
 * @java game/equipment/container/board/Boardless.java — class Boardless extends Board
 */
export class Boardless extends Board {
  /**
   * @java game/equipment/container/board/Boardless.java constructor
   *
   * @param tiling    The tiling type of the boardless container.
   * @param dimension The "fake" size of the board used for boardless [SIZE_BOARDLESS].
   * @param largeStack True if the game can involve stacks higher than 32.
   */
  public constructor(
    tiling: TilingBoardlessType,
    dimension: number | null,
    largeStack: boolean | null,
  ) {
    // @java Boardless.java:49–65 — super(...) call picks graph function per tiling
    // In the TS port we pass a synthetic GraphFunction that records the tiling
    // parameters; the actual graph construction is handled by the 1:1 path.
    super(
      makeBoardlessGraphFn(tiling, dimension),
      null,
      null,
      null,
      null,
      "Cell",
      largeStack,
    );

    // @java Boardless.java:64
    this.style = "Boardless";
  }

  /** @java Boardless.isBoardless() */
  public override isBoardless(): boolean { return true; }

  /** @java Boardless.toEnglish(Game) */
  public toEnglish(_game: unknown): string { return "table"; }
}

/**
 * Creates a stub GraphFunction that encodes the boardless tiling parameters.
 * The actual graph evaluation is done by the 1:1 engine; this stub satisfies
 * the Board constructor's type requirement.
 *
 * @java Boardless.java:51–56 — inline GraphFunction selection
 */
function makeBoardlessGraphFn(tiling: TilingBoardlessType, dimension: number | null): import("./Board.js").GraphFunction {
  const dim = (dimension !== null) ? dimension
            : (tiling === "Hexagonal") ? SIZE_HEX_BOARDLESS
            : SIZE_BOARDLESS;

  // @java Boardless.java:49-55 — the hidden "fake" board IS a real graph:
  // RectangleOnSquare(41) / HexagonOnHex(21) / TriangleOnTri(41) per tiling.
  const inner: import("./Board.js").GraphFunction =
    tiling === "Square"
      ? (new RectangleOnSquare(dim, dim, null) as unknown as import("./Board.js").GraphFunction)
      : tiling === "Hexagonal"
        ? (new HexagonOnHex(dim) as unknown as import("./Board.js").GraphFunction)
        : (new TriangleOnTri(dim) as unknown as import("./Board.js").GraphFunction);
  // Expose tiling metadata for consumers alongside the real generator.
  (inner as unknown as { tiling?: TilingBoardlessType; dim?: number }).tiling = tiling;
  (inner as unknown as { tiling?: TilingBoardlessType; dim?: number }).dim = dim;
  return inner;
}
