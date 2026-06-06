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

import { Board } from "./Board.js";
import type { TilingBoardlessType } from "../../../types/board/TilingBoardlessType.js";

/**
 * Java constants mirrored:
 * - Constants.SIZE_BOARDLESS = 41 (square boardless dimension)
 * - Constants.SIZE_HEX_BOARDLESS = 9 (hex boardless dimension)
 */
const SIZE_BOARDLESS = 41;
const SIZE_HEX_BOARDLESS = 9;

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

  return {
    eval(_context: unknown, _siteType: unknown): unknown {
      // Deferred: actual boardless graph construction handled by Board1to1 / named-tilings.
      return null;
    },
    gameFlags(_game: unknown): bigint { return 0n; },
    preprocess(_game: unknown): void { /* no-op */ },
    // Expose tiling metadata for consumers.
    tiling,
    dim,
  } as unknown as import("./Board.js").GraphFunction;
}
