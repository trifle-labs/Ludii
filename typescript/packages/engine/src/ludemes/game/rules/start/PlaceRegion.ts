/**
 * @java game/rules/start/place/StartPlacementType.java (simplified)
 *
 * (place "PieceID1" <regionFn>) — places pieces at sites returned by a
 * RegionFunction evaluated against the initial game state.
 *
 * The RegionFunction is compiled at AST-compile time but evaluated lazily
 * during Game.start() using a dummy context that knows the board shape.
 *
 * @java game/rules/start/place/StartPlacementType.java — start(Context)
 */

import type { EquipmentSurface } from "../../equipment/EquipmentSurface.js";
import type { RegionFunction } from "../../../base.js";
import type { StartRule } from "./StartRule.js";
import type { Context } from "../../../../context.js";
import type { Game } from "../../../Game.js";

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
    const cs = (ctx as unknown as { _startState?: { setSite(site: number, who: number, what: number, count: number, stateVal: number, value: number): void; setScore(pid: number, score: number): void; setAmount(pid: number, amount: number): void } })._startState;
    if (!cs) return;
    const equipment = (ctx.game as unknown as { equipment: EquipmentSurface }).equipment;

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
      // @java ActionAdd.apply() -> ContainerState.setSite(...)
      cs.setSite(site, owner, piece.index, this.count, this.stateValue >= 0 ? this.stateValue : -1, this.valueValue >= 0 ? this.valueValue : -1);
    }
  }
}
