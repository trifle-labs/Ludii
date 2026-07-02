/**
 * @java game/rules/start/place/StartPlacementType.java (simplified)
 *
 * (place "PieceName1" {sites...}) — places player 1's pieces at given sites.
 * (place "PieceName2" {sites...}) — places player 2's pieces at given sites.
 * (place "PieceName1" (coord "A4")) — places at a specific coordinate.
 *
 * Piece names include the player suffix: "Ball1" = P1's Ball, "Ball2" = P2's Ball.
 * The player number is extracted from the suffix.
 *
 * @java game/rules/start/place/StartPlacementType.java — start(Context)
 */

import type { EquipmentSurface } from "../../equipment/EquipmentSurface.js";
import type { StartRule } from "./StartRule.js";
import type { Context } from "../../../../context.js";
import { compileFlags } from "../../../../ludii/compiler/compile-flags.js";

export class PlaceSites implements StartRule {
  /**
   * Full piece name with player suffix (e.g. "Ball1", "Queen1").
   * @java Place.component().name + owner
   */
  private readonly pieceId: string;

  /**
   * Site indices where the piece should be placed.
   * @java Place.region
   */
  private readonly sites: readonly number[];

  /** Pieces to place at each site (the `count:` arg, default 1). @java Place.count */
  private readonly count: number;

  /** Per-site state value from `state:N` in the place rule (default -1 = unset). */
  private readonly stateValue: number;

  /** Per-site value from `value:N` in the place rule (default -1 = unset). */
  private readonly valueValue: number;

  /**
   * @param pieceId    Full piece identifier (e.g. "Ball1")
   * @param sites      Site indices for placement
   * @param count      Pieces per site (default 1; mancala sow seeds use 4, etc.)
   * @param stateValue Per-site state (from `state:N`), or -1 if not specified
   * @param valueValue Per-site value (from `value:N`), or -1 if not specified
   */
  public constructor(
    pieceId: string,
    sites: readonly number[],
    count = 1,
    stateValue = -1,
    valueValue = -1,
  ) {
    this.pieceId = pieceId;
    this.sites = sites;
    this.count = count;
    // @java PlaceItem.java:494-495 — gameFlags() |= GameType.Count when count > 1.
    if (count > 1) compileFlags.usesCount = true;
    this.stateValue = stateValue;
    this.valueValue = valueValue;
  }

  /**
   * @java Game.start() → ActionAdd(to=site, what=componentIdx, owner=player)
   * @java game/rules/start/place/item/PlaceItem.java — eval(Context)
   */
  public eval(ctx: Context): void {
    const cs = (ctx as unknown as { _startState?: { setSite(site: number, who: number, what: number, count: number, stateVal: number, value: number): void; setScore(pid: number, score: number): void; setAmount(pid: number, amount: number): void } })._startState;
    if (!cs) return;
    const equipment = (ctx.game as unknown as { equipment: EquipmentSurface }).equipment;

    // Parse player number from the piece id suffix.
    // "Ball1" → name="Ball", owner=1
    const match = this.pieceId.match(/^(.*?)(\d+)$/);
    if (!match) return;
    const pieceName = match[1]!;
    const owner = parseInt(match[2]!, 10);

    const piece = equipment.pieces.find(
      pi => pi.owner === owner && pi.name.toLowerCase() === pieceName.toLowerCase(),
    );
    if (piece === undefined) return;

    for (const site of this.sites) {
      // @java ActionAdd.apply() -> ContainerState.setSite(...); UNDEFINED leaves slots.
      cs.setSite(site, owner, piece.index, this.count, this.stateValue >= 0 ? this.stateValue : -1, this.valueValue >= 0 ? this.valueValue : -1);
    }
  }
}
