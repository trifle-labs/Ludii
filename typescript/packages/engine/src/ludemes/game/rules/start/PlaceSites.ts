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

import type { Equipment1to1 } from "../../equipment/Equipment1to1.js";
import type { StartRule } from "./StartRule.js";
import type { Context } from "../../../../context.js";

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
    this.stateValue = stateValue;
    this.valueValue = valueValue;
  }

  /**
   * @java Game.start() → ActionAdd(to=site, what=componentIdx, owner=player)
   * @java game/rules/start/place/item/PlaceItem.java — eval(Context)
   */
  public eval(ctx: Context): void {
    const arrays = (ctx as unknown as {
      _startArrays?: { cells: number[]; whats: number[]; countAt: number[]; stateAt: number[]; valueAt: number[] };
    })._startArrays;
    if (!arrays) return;
    const { cells, whats, countAt, stateAt, valueAt } = arrays;
    const equipment = (ctx.game as unknown as { equipment: Equipment1to1 }).equipment;

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
      if (site < 0 || site >= cells.length) continue;
      cells[site] = owner;
      whats[site] = piece.index;
      countAt[site] = this.count;
      // @java ActionAdd.apply() — sets stateAt and valueAt alongside cells/whats.
      if (this.stateValue >= 0) stateAt[site] = this.stateValue;
      if (this.valueValue >= 0) valueAt[site] = this.valueValue;
    }
  }
}
