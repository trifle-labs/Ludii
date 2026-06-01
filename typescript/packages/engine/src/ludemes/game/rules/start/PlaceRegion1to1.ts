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

export class PlaceRegion1to1 implements StartRule {
  /** Full piece id (e.g. "Ball1", "Marker1"). */
  private readonly pieceId: string;
  /** Region function to evaluate for target sites. */
  private readonly regionFn: RegionFunction;

  public constructor(pieceId: string, regionFn: RegionFunction) {
    this.pieceId = pieceId;
    this.regionFn = regionFn;
  }

  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
  ): void {
    // Parse player number from the piece id suffix.
    const match = this.pieceId.match(/^(.*?)(\d+)$/);
    if (!match) return;
    const pieceName = match[1]!;
    const owner = parseInt(match[2]!, 10);

    const piece = equipment.pieces.find(
      pi => pi.owner === owner && pi.name.toLowerCase() === pieceName.toLowerCase(),
    );
    if (piece === undefined) return;

    // Evaluate the region function using a minimal dummy context.
    // The dummy context must have game._radials and the board shape accessible.
    // We use a lightweight wrapper that only exposes board info.
    const sites = this.evalRegion(equipment, numPlayers);

    for (const site of sites) {
      if (site < 0 || site >= cells.length) continue;
      cells[site] = owner;
      whats[site] = piece.index;
      countAt[site] = 1;
    }
  }

  /**
   * Evaluate the region function using a minimal fake context.
   * We create a minimal context that has the board shape but no game state.
   */
  private evalRegion(equipment: Equipment1to1, numPlayers: number): number[] {
    // Create a minimal fake context that the RegionFunction can use.
    // Most site regions (Top, Bottom, Phase, etc.) only need board dimensions,
    // which they get via ctx.game.equipment.board.width/height.
    // We pass a fake game object with those properties.
    const fakeGame = {
      numPlayers,
      equipment,
    } as unknown as Game1to1;

    const fakeCtx = {
      game: fakeGame,
      state: {
        mover: 1,
        cells: new Array(equipment.totalSites).fill(0),
        isEmptySite: (_i: number) => true,
      },
      _evalFrom: -1,
      _evalTo: -1,
      _evalValue: 0,
      _radials: equipment.board.radials,
    } as unknown as Context;

    try {
      return this.regionFn.eval(fakeCtx);
    } catch {
      return [];
    }
  }
}
