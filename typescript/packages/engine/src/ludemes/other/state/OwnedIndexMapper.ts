// @java Core/src/other/state/OwnedIndexMapper.java

/** Minimal component interface for OwnedIndexMapper. */
export interface ComponentLike {
  owner(): number;
}

/** Minimal game interface for OwnedIndexMapper. */
export interface GameLikeForMapper {
  players(): { count(): number; size(): number };
  equipment(): { components(): Array<ComponentLike | null> };
}

/** Java: main.Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Maps player+component indices into compact player+array indices.
 * Faithful 1:1 port of OwnedIndexMapper.java.
 *
 * @author Dennis Soemers (Java), ported to TS
 */
export class OwnedIndexMapper {
  /** Java: private final int[][] mappedIndices */
  private readonly mappedIndices: number[][];

  /** Java: private final int[][] reverseMap */
  private readonly reverseMap: number[][];

  /**
   * Constructor.
   * @param game The game.
   */
  constructor(game: GameLikeForMapper) {
    const components = game.equipment().components();
    const fullPlayersDim = game.players().count() + 2;
    const fullCompsDim = components.length;

    this.mappedIndices = Array.from({ length: fullPlayersDim }, () => new Array(fullCompsDim).fill(UNDEFINED));
    this.reverseMap = new Array(fullPlayersDim);

    for (let p = 0; p < fullPlayersDim; ++p) {
      let nextIndex = 0;
      for (let e = 0; e < fullCompsDim; ++e) {
        const comp = components[e];
        if (comp !== null && comp !== undefined && comp.owner() === p)
          this.mappedIndices[p]![e] = nextIndex++;
      }
      this.reverseMap[p] = new Array(nextIndex);
      for (let i = 0; i < this.mappedIndices[p]!.length; ++i) {
        const mapped = this.mappedIndices[p]![i]!;
        if (mapped >= 0) this.reverseMap[p]![mapped] = i;
      }
    }
  }

  /**
   * Java: public final int compIndex(final int playerIdx, final int origCompIdx)
   */
  compIndex(playerIdx: number, origCompIdx: number): number {
    return this.mappedIndices[playerIdx]![origCompIdx]!;
  }

  /**
   * Java: public final int[] playerCompIndices(final int playerIdx)
   */
  playerCompIndices(playerIdx: number): number[] {
    return this.mappedIndices[playerIdx]!;
  }

  /**
   * Java: public final int numValidIndices(final int playerIdx)
   */
  numValidIndices(playerIdx: number): number {
    return this.reverseMap[playerIdx]!.length;
  }

  /**
   * Java: public final int reverseMap(final int playerIdx, final int mappedIndex)
   */
  reverseMap_(playerIdx: number, mappedIndex: number): number {
    return this.reverseMap[playerIdx]![mappedIndex]!;
  }
}
