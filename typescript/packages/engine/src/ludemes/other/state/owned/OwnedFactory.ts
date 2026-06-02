// @java Core/src/other/state/owned/OwnedFactory.java

import type { Owned } from "./Owned.js";
import type { GameLikeForMapper } from "../OwnedIndexMapper.js";
import { CellOnlyOwned } from "./CellOnlyOwned.js";
import { FlatCellOnlyOwned } from "./FlatCellOnlyOwned.js";
import { FlatVertexOnlyOwned } from "./FlatVertexOnlyOwned.js";
import { FlatVertexOnlyOwnedSingleComp } from "./FlatVertexOnlyOwnedSingleComp.js";
import { FullOwned } from "./FullOwned.js";

/**
 * Minimal game-flag constants mirroring Java's game.types.state.GameType.
 */
export const GameTypeFlags = {
  Cell: 0x1n,
  Edge: 0x2n,
  Vertex: 0x4n,
} as const;

/** Game interface required by OwnedFactory. */
export interface GameLikeForOwnedFactory extends GameLikeForMapper {
  gameFlags(): bigint;
  isStacking(): boolean;
  equipment(): {
    components(): Array<{ owner(): number } | null>;
  };
}

/**
 * Factory to instantiate appropriate "Owned" containers for a given game.
 * Faithful 1:1 port of OwnedFactory.java.
 *
 * @author Dennis Soemers (Java), ported to TS
 */
export class OwnedFactory {
  /** Private constructor — not to be instantiated. */
  private constructor() {}

  /**
   * @param game The game.
   * @returns Owned object created for given game.
   * Java: public static Owned createOwned(final Game game)
   */
  static createOwned(game: GameLikeForOwnedFactory): Owned {
    const flags = game.gameFlags();
    const cellFlag = GameTypeFlags.Cell;
    const edgeFlag = GameTypeFlags.Edge;
    const vertexFlag = GameTypeFlags.Vertex;

    if (
      (flags & cellFlag) !== 0n &&
      (flags & edgeFlag) === 0n &&
      (flags & vertexFlag) === 0n
    ) {
      // Only Cells
      if (game.isStacking()) return new CellOnlyOwned(game);
      return new FlatCellOnlyOwned(game);
    }

    if (
      (flags & cellFlag) === 0n &&
      (flags & edgeFlag) === 0n &&
      (flags & vertexFlag) !== 0n
    ) {
      // Only Vertices
      if (!game.isStacking()) {
        let maxOneCompPerPlayer = true;
        const components = game.equipment().components();

        for (let p = 0; p < game.players().count() + 2; ++p) {
          let numComps = 0;
          for (const comp of components) {
            if (comp !== null && comp !== undefined && comp.owner() === p)
              numComps++;
          }
          if (numComps > 1) {
            maxOneCompPerPlayer = false;
            break;
          }
        }

        if (maxOneCompPerPlayer) return new FlatVertexOnlyOwnedSingleComp(game);
        return new FlatVertexOnlyOwned(game);
      }
    }

    // Default: full data
    return new FullOwned(game);
  }
}
