/**
 * @java game/rules/start/place/StartPlacementType.java (simplified)
 *
 * (place "PieceName" (handSite <role> [offset])) — places a piece at a
 * specific hand site for the given role.
 *
 * Used by games like Order and Chaos where each hand slot holds a different
 * piece type: (place "Disc" (handSite Shared)) (place "Cross" (handSite Shared 1)).
 *
 * @java game/rules/start/place/StartPlacementType.java — start(Context)
 */

import type { Equipment1to1 } from "../../equipment/Equipment1to1.js";
import type { StartRule } from "./StartRule.js";
import type { RoleType } from "../../../base.js";

export class PlaceAtHandSite1to1 implements StartRule {
  /** Full piece name (possibly without player suffix, e.g. "Disc" or "Disc1"). */
  private readonly pieceId: string;
  /** Player role for the hand site. */
  private readonly role: RoleType | "Shared";
  /** Slot offset within the hand (0-based). */
  private readonly offset: number;
  /** Number of pieces to seed at the hand slot (the `count:` arg, default 1). */
  private readonly count: number;

  public constructor(pieceId: string, role: RoleType | "Shared", offset = 0, count = 1) {
    this.pieceId = pieceId;
    this.role = role;
    this.offset = offset;
    this.count = count;
  }

  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
  ): void {
    // Resolve owner from role.
    let owner: number;
    switch (this.role) {
      case "Shared":
        owner = 0;
        break;
      case "Mover":
        owner = 1; // First mover is P1
        break;
      case "Next":
        owner = 2;
        break;
      default: {
        const n = parseInt((this.role as string).slice(1), 10);
        owner = isNaN(n) ? 1 : n;
        break;
      }
    }

    const handSite = equipment.handSiteFor(owner, this.offset);
    if (handSite < 0 || handSite >= cells.length) return;

    // Find the piece component by name (try with owner suffix, then without).
    let piece = equipment.pieces.find(
      p => p.owner === owner && p.name.toLowerCase() === this.pieceId.toLowerCase(),
    );
    if (!piece) {
      // Try stripping trailing digit and matching by name
      const nameOnly = this.pieceId.replace(/\d+$/, "");
      piece = equipment.pieces.find(
        p => p.owner === owner && p.name.toLowerCase() === nameOnly.toLowerCase(),
      );
    }
    if (!piece) {
      // Fallback: match by name among all pieces (Neutral/Shared might own it)
      const nameOnly = this.pieceId.replace(/\d+$/, "");
      piece = equipment.pieces.find(
        p => p.name.toLowerCase() === nameOnly.toLowerCase(),
      );
    }
    if (!piece) return;

    cells[handSite] = owner;
    whats[handSite] = piece.index;
    countAt[handSite] = this.count; // `count:N` pieces available at this hand slot
  }
}
