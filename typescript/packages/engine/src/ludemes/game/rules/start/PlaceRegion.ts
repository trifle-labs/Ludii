/**
 * @java game/rules/start/place/StartPlacementType.java (simplified)
 *
 * (place "PieceID1" <regionFn>) — places pieces at sites returned by a
 * RegionFunction evaluated against the initial game state.
 *
 * The RegionFunction is compiled at AST-compile time but evaluated lazily
 * during Game1to1.start() using a dummy context that knows the board shape.
 *
 * @java game/rules/start/place/StartPlacementType.java — start(Context)
 */

import type { Equipment1to1 } from "../../equipment/Equipment1to1.js";
import type { RegionFunction } from "../../../base.js";
import type { StartRule } from "./StartRule.js";
import type { Context } from "../../../../context.js";
import type { Game1to1 } from "../../../Game1to1.js";

export class PlaceRegion implements StartRule {
  /** Full piece id (e.g. "Ball1", "Marker1"). */
  private readonly pieceId: string;
  /** Region function to evaluate for target sites. */
  private readonly regionFn: RegionFunction;
  /** Pieces to place at each site (the `count:` arg, default 1). @java Place.count */
  private readonly count: number;
  /** Per-site state value from `state:N` (-1 = unset). */
  private readonly stateValue: number;
  /** Per-site value from `value:N` (-1 = unset). */
  private readonly valueValue: number;

  public constructor(
    pieceId: string,
    regionFn: RegionFunction,
    count = 1,
    stateValue = -1,
    valueValue = -1,
  ) {
    this.pieceId = pieceId;
    this.regionFn = regionFn;
    this.count = count;
    this.stateValue = stateValue;
    this.valueValue = valueValue;
  }

  /** @java game/rules/start/place/item/PlaceItem.java — eval(Context) (region overload) */
  public eval(ctx: Context): void {
    const arrays = (ctx as unknown as {
      _startArrays?: { cells: number[]; whats: number[]; countAt: number[]; stateAt: number[]; valueAt: number[] };
    })._startArrays;
    if (!arrays) return;
    const { cells, whats, countAt, stateAt, valueAt } = arrays;
    const equipment = (ctx.game as unknown as { equipment: Equipment1to1 }).equipment;

    // Parse player number from the piece id suffix.
    const match = this.pieceId.match(/^(.*?)(\d+)$/);
    if (!match) return;
    const pieceName = match[1]!;
    const owner = parseInt(match[2]!, 10);

    const piece = equipment.pieces.find(
      pi => pi.owner === owner && pi.name.toLowerCase() === pieceName.toLowerCase(),
    );
    if (piece === undefined) return;

    // Java evaluates the region on the REAL evolving start context.
    let sites: number[];
    try {
      sites = this.regionFn.eval(ctx);
    } catch {
      sites = [];
    }

    for (const site of sites) {
      if (site < 0 || site >= cells.length) continue;
      cells[site] = owner;
      whats[site] = piece.index;
      countAt[site] = this.count;
      if (this.stateValue >= 0) stateAt[site] = this.stateValue;
      if (this.valueValue >= 0) valueAt[site] = this.valueValue;
    }
  }
}
