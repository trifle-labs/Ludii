/**
 * Splits a deck of cards equally among the players' hands.
 *
 * @java game/rules/start/split/Split.java — eval(Context)
 *
 * DEFERRED: Java Split.eval depends on:
 *   - context.game().handDeck() — the Deck container list
 *   - context.containers()     — all game containers
 *   - context.sitesFrom()      — per-container start site offsets
 *   - context.containerState() (cast to BaseContainerStateStacking) — sizeStackCell
 *   - ActionMove.construct()   — card move action
 *
 * None of these are accessible via the applyToInitialState interface.
 * The compile1to1 path currently does not compile (split Deck) start rules.
 * Full implementation requires the card/deck subsystem to be ported.
 */

import type { Equipment1to1 } from "../../../equipment/Equipment1to1.js";
import type { StartRule } from "../StartRule.js";
import type { SplitType } from "./SplitType.js";

/**
 * @java game/rules/start/split/Split.java
 *
 * Splits the deck by dealing one card at a time round-robin to each player's hand.
 * applyToInitialState is a no-op because the card/deck subsystem is not ported.
 */
export class Split implements StartRule {
  /** The type of object to split. Currently only Deck is defined. */
  private readonly splitType: SplitType;

  /**
   * @param splitType  what to split (currently only Deck)
   * @java game/rules/start/split/Split.java — constructor(SplitType type)
   */
  public constructor(splitType: SplitType) {
    this.splitType = splitType;
  }

  /**
   * @java game/rules/start/split/Split.java — eval(Context)
   *
   * Java: iterates all cards in the deck (cs.sizeStackCell(indexSiteDeck) times)
   *   and ActionMove.construct(Cell, indexSiteDeck, 0, Cell, handIndex[hand], ...) each.
   *   Cards are distributed round-robin across player hands.
   *
   * TS-deferred: context.game().handDeck(), context.containers(),
   *   context.sitesFrom(), BaseContainerStateStacking.sizeStackCell() are all
   *   unavailable via applyToInitialState.
   */
  public applyToInitialState(
    _cells: number[],
    _whats: number[],
    _countAt: number[],
    _equipment: Equipment1to1,
    _numPlayers: number,
  ): void {
    // Deferred: card/deck subsystem not accessible via applyToInitialState.
    // Java: ActionMove(Cell, indexSiteDeck, 0, Cell, handIndex[hand], ...) for each card.
    void this.splitType;
  }
}
