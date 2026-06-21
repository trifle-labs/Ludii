/**
 * Deals cards or dominoes to players at the start of the game.
 *
 * @java game/rules/start/Deal.java — eval(Context)
 *
 * Cards path (evalCards): DEFERRED — Java Deal.evalCards depends on:
 *   - context.game().handDeck() — the Deck container list
 *   - context.containerState() (cast to BaseContainerStateStacking) — sizeStackCell
 *   - ActionMove.construct() — card move action
 *
 * Dominoes path (evalDominoes): PORTED — uses context.containers(),
 *   context.sitesFrom(), context.components(), context.rng, and ctx.placePieces.
 */

import type { Context } from "../../../../context.js";
import type { StartRule } from "./StartRule.js";

/**
 * Enumeration of what can be dealt.
 * @java game/types/component/DealableType.java
 */
export type DealableType = "Cards" | "Dominoes";

/** Java Constants.OFF = -1 */
const OFF = -1;

/**
 * @java game/rules/start/Deal.java
 *
 * Deals `count` items of the given `type` (Cards or Dominoes) to each player.
 * evalDominoes is ported; evalCards is deferred (requires card/stacking subsystem).
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
   */
  public eval(ctx: Context): void {
    if (this.dealType === "Dominoes") {
      this.evalDominoes(ctx);
    }
    // evalCards: deferred until the card/stacking subsystem is ported.
    // Requires context.game().handDeck(), context.containerState().sizeStackCell(),
    // and ActionMove.construct() — none are available in the TS start-rule bridge.
  }

  /**
   * @java game/rules/start/Deal.java — evalDominoes(Context)
   *
   * Java logic:
   *   1. Collect handIndex[] = base site for each hand container (isHand && !isDeck && !isDice).
   *   2. Bail if player count != hand count.
   *   3. Build toDeal = [1 .. components.length-1] (all component indices).
   *   4. Loop dealed in [0 .. count*2):
   *      - pick random index from toDeal
   *      - currentPlayer = dealed % nbPlayers
   *      - place at handIndex[currentPlayer] + floor(dealed / nbPlayers)
   *      - remove from toDeal
   *
   * TS port: available APIs are ctx.containers(), ctx.sitesFrom(), ctx.components(),
   *   ctx.rng.nextInt(), and ctx.placePieces (set by Game.applyStartRule).
   * Note: TS containers() has no isDeck(); domino games have no Deck containers so
   *   filtering by !isDice() is equivalent.
   */
  private evalDominoes(ctx: Context): void {
    // @java Deal.java:127-132 — collect hand container base sites
    const handIndex: number[] = [];
    const sitesFrom = ctx.sitesFrom();
    for (const c of ctx.containers()) {
      // @java: c.isHand() && !c.isDeck() && !c.isDice()
      // TS: no isDeck() — domino games have no Deck, so !isDice() suffices
      if (c.isHand() && !c.isDice()) {
        handIndex.push(sitesFrom[c.index()] ?? -1);
      }
    }

    // @java Deal.java:134-135 — bail if hands don't match players
    const numPlayers = ctx.game.numPlayers;
    if (handIndex.length !== numPlayers) return;

    // @java Deal.java:137 — get full component array (1-based)
    const components = ctx.components();

    // @java Deal.java:139-140 — bail if not enough components
    // Java throws; TS silently returns
    if (components.length < this.count * handIndex.length + 1) return;

    // @java Deal.java:142-144 — toDeal = indices [1 .. components.length-1]
    const toDeal: number[] = [];
    for (let i = 1; i < components.length; i++) {
      if (components[i] !== undefined && components[i] !== null) toDeal.push(i);
    }

    // @java Deal.java:146-172 — masked array is built but never used (dead code in Java)

    // @java Deal.java:160-172 — main deal loop
    const nbPlayers = numPlayers;
    let dealed = 0;
    const totalDeal = this.count * 2;
    while (dealed < totalDeal) {
      // @java: int index = context.rng().nextInt(toDeal.size())
      const idx = ctx.rng.nextInt(toDeal.length);
      // @java: int indexComponent = toDeal.getQuick(index)
      const indexComponent = toDeal[idx]!;
      // @java: component.index() — equals indexComponent since setIndex(i) in Equipment
      // @java: int currentPlayer = dealed % nbPlayers
      const currentPlayer = dealed % nbPlayers;
      // @java: Start.placePieces(context, handIndex[currentPlayer] + (dealed/nbPlayers), component.index(), 1, OFF, OFF, UNDEFINED, false, Cell)
      const site = handIndex[currentPlayer]! + Math.floor(dealed / nbPlayers);
      (ctx as unknown as {
        placePieces?(
          site: number, what: number, count: number,
          state: number, rotation: number, value: number,
          onStack: boolean, type: string | null,
        ): void;
      }).placePieces?.(site, indexComponent, 1, OFF, OFF, OFF, false, null);
      // @java: toDeal.removeAt(index)
      toDeal.splice(idx, 1);
      dealed++;
    }
  }
}
