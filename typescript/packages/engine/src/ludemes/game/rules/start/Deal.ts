/**
 * Deals cards or dominoes to players at the start of the game.
 *
 * @java game/rules/start/Deal.java — eval(Context)
 *
 * DEFERRED: Java Deal.eval depends on:
 *   - context.game().handDeck() — the Deck container list
 *   - context.containers()     — all game containers
 *   - context.sitesFrom()      — per-container start site offsets
 *   - context.containerState() — per-container state (sizeStackCell)
 *   - ActionMove.construct()   — card/domino move action
 *   - context.rng()            — random number generator for dominoes
 *
 * None of these are accessible via the applyToInitialState interface.
 * The compile1to1 path currently does not compile (deal …) start rules.
 * Full implementation requires the card/deck subsystem to be ported.
 */

import type { EquipmentSurface } from "../../equipment/EquipmentSurface.js";
import type { Context } from "../../../../context.js";
import type { StartRule } from "./StartRule.js";

/**
 * Enumeration of what can be dealt.
 * @java game/types/component/DealableType.java
 */
export type DealableType = "Cards" | "Dominoes";

/**
 * @java game/rules/start/Deal.java
 *
 * Deals `count` items of the given `type` (Cards or Dominoes) to each player.
 * applyToInitialState is a no-op because the card/deck subsystem is not ported.
 */
export class Deal implements StartRule {
  /** Type of deal (Cards or Dominoes). @java type field. */
  private readonly dealType: DealableType;

  /** Number of items to deal to each player. @java count field (default 1). */
  private readonly count: number;

  /**
   * @param type   Cards or Dominoes
   * @param count  optional number of items per player (default 1)
   * @java game/rules/start/Deal.java — constructor(DealableType type, @Opt Integer count)
   */
  public constructor(type: DealableType, count: number | null = null) {
    this.dealType = type;
    this.count = count ?? 1;
  }

  /**
   * @java game/rules/start/Deal.java — eval(Context)
   *
   * Java:
   *   - Cards: evalCards() — moves `count` cards from the deck to each player's hand
   *     via ActionMove(SiteType.Cell, indexSiteDeck, topLevel, SiteType.Cell, handSite, ...)
   *   - Dominoes: evalDominoes() — randomly picks components and calls Start.placePieces()
   *     for each player's hand slot
   *
   * TS-deferred: context.game().handDeck(), context.containers(),
   *   context.sitesFrom(), context.containerState(), context.rng() are all
   *   unavailable via applyToInitialState.
   */
  public eval(_ctx: Context): void {
    // Deferred until the card/deck subsystem is ported: Java Deal.eval(Context)
    // deals component sets from the deck container through actions.
    void this.dealType;
  }
}
