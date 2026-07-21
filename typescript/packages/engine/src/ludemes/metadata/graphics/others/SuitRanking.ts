// @java Core/src/metadata/graphics/others/SuitRanking.java SuitRanking
/**
 * Java parity:
 * - Core/src/metadata/graphics/others/SuitRanking.java — faithful data-class port.
 *   Indicates the ranking for card suits (lowest to highest).
 *   Should be used only for card games.
 */

import type { SuitTypeName } from "../../../game/types/component/SuitType.js";

export class SuitRanking {
  private readonly _suitRanking: SuitTypeName[];

  /**
   * @param suitRanking Ranking for card suits (lowest to highest).
   */
  constructor(suitRanking: SuitTypeName[]) {
    this._suitRanking = suitRanking;
  }

  /** @return Ranking for the card suits. */
  public suitRanking(): SuitTypeName[] {
    return this._suitRanking;
  }

  public needRedraw(): boolean {
    return false;
  }
}
