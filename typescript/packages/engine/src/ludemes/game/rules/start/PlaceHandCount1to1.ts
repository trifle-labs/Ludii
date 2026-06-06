/**
 * @java game/rules/start/place/StartPlacementStackType.java (simplified)
 *
 * (place "PieceName" "Hand" count:N) — fills each matching player's hand
 * with N pieces of the named type.
 *
 * This is the most common start rule for placement/alignment games:
 *   (start (place "Marker" "Hand" count:3))
 *   → P1's handSite gets countAt=3, cells=P1_owner, whats=markerIdx
 *   → P2's handSite gets countAt=3, cells=P2_owner, whats=markerIdx
 *
 * Java parity: (place) in start with container="Hand" resolves to
 * ActionAdd(handSite, what=componentIdx, count=N) for each player.
 *
 * @java game/rules/start/place/StartPlacementStackType.java
 */

import type { Equipment1to1 } from "../../equipment/Equipment1to1.js";
import type { StartRule } from "./StartRule.js";

export class PlaceHandCount1to1 implements StartRule {
  /**
   * Piece name WITHOUT player suffix (e.g. "Marker", "Stick", "Ball").
   * @java Place.component().name
   */
  private readonly pieceName: string;

  /**
   * Count of pieces to place in the hand.
   * @java Place.count
   */
  private readonly count: number;

  /**
   * @param pieceName Piece name without player suffix (e.g. "Marker")
   * @param count     Number of pieces in each hand
   */
  public constructor(pieceName: string, count: number) {
    this.pieceName = pieceName;
    this.count = count;
  }

  /**
   * For each player (1..numPlayers), find the matching piece component and
   * place count pieces in the player's hand site.
   *
   * @java Game.start() → ActionAdd(to=handSite, what=componentIdx, count=N)
   */
  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
  ): void {
    for (let p = 1; p <= numPlayers; p++) {
      // Find the component for this player matching the piece name.
      const piece = equipment.pieces.find(
        pi => pi.owner === p && pi.name.toLowerCase() === this.pieceName.toLowerCase(),
      );
      if (piece === undefined) continue;

      // Place count pieces in the first available hand slot.
      // Multiple (place "X" "Hand") rules may fill consecutive slots.
      // @java Game.start() → ActionAdd(to=handSite+offset, what=componentIdx)
      const hand = equipment.hands.find(h => h.owner === p);
      if (!hand) continue;
      const base = equipment.handSiteFor(p, 0);
      if (base < 0) continue;

      // Find the first empty slot in this player's hand.
      let slotFound = false;
      for (let offset = 0; offset < hand.size; offset++) {
        const slot = base + offset;
        if (slot >= cells.length) break;
        // Empty slot: cells[slot] === 0 AND whats[slot] === 0
        if ((cells[slot] ?? 0) === 0 && (whats[slot] ?? 0) === 0) {
          cells[slot] = p;
          whats[slot] = piece.index;
          countAt[slot] = this.count;
          slotFound = true;
          break;
        }
      }
      if (!slotFound) {
        // Fallback: use slot 0 (overwrite)
        const slot = base;
        if (slot < cells.length) {
          cells[slot] = p;
          whats[slot] = piece.index;
          countAt[slot] = this.count;
        }
      }
    }
  }
}
