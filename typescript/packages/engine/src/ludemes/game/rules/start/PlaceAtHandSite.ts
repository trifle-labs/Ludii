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

export class PlaceAtHandSite implements StartRule {
  /** Full piece name (possibly without player suffix, e.g. "Disc" or "Disc1"). */
  private readonly pieceId: string;
  /** Player role for the hand site. */
  private readonly role: RoleType | "Shared";
  /** Slot offset within the hand (0-based). */
  private readonly offset: number;
  /** Number of pieces to seed at the hand slot (the `count:` arg, default 1). */
  private readonly count: number;

  /** Per-site state value from `state:N` in the place rule (default -1 = unset). */
  private readonly stateValue: number;

  /** Per-site value from `value:N` in the place rule (default -1 = unset). */
  private readonly valueValue: number;

  public constructor(
    pieceId: string,
    role: RoleType | "Shared",
    offset = 0,
    count = 1,
    stateValue = -1,
    valueValue = -1,
  ) {
    this.pieceId = pieceId;
    this.role = role;
    this.offset = offset;
    this.count = count;
    this.stateValue = stateValue;
    this.valueValue = valueValue;
  }

  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
    stateAt?: number[],
    valueAt?: number[],
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
    // Ludii piece IDs are constructed as <BaseName><PlayerIdx>, e.g. "Disc11" = piece "Disc1" owned by P1.
    // We try progressively more lenient matches:
    // 1. Exact pieceId match (e.g. "Marker1" matches piece "Marker1")
    // 2. Strip last character (player suffix): "Disc11" → "Disc1"
    // 3. Strip all trailing digits: "Disc11" → "Disc"
    // 4. Fallback across all pieces (Neutral/Shared).
    // @java Component.java — name() returns the base name without player suffix.
    let piece = equipment.pieces.find(
      p => p.owner === owner && p.name.toLowerCase() === this.pieceId.toLowerCase(),
    );
    if (!piece) {
      // Strip last character to get base name (Ludii: pieceId = baseName + playerSuffix)
      const nameOne = this.pieceId.slice(0, -1);
      if (nameOne.length > 0) {
        piece = equipment.pieces.find(
          p => p.owner === owner && p.name.toLowerCase() === nameOne.toLowerCase(),
        );
      }
    }
    if (!piece) {
      // Strip all trailing digits (broader fallback)
      const nameOnly = this.pieceId.replace(/\d+$/, "");
      if (nameOnly.length > 0) {
        piece = equipment.pieces.find(
          p => p.owner === owner && p.name.toLowerCase() === nameOnly.toLowerCase(),
        );
      }
    }
    if (!piece) {
      // Fallback: match by name among all pieces (Neutral/Shared might own it)
      const nameOne = this.pieceId.slice(0, -1);
      const nameAll = this.pieceId.replace(/\d+$/, "");
      piece = equipment.pieces.find(
        p => p.name.toLowerCase() === nameOne.toLowerCase() ||
             p.name.toLowerCase() === nameAll.toLowerCase() ||
             p.name.toLowerCase() === this.pieceId.toLowerCase(),
      );
    }
    if (!piece) return;

    cells[handSite] = owner;
    whats[handSite] = piece.index;
    countAt[handSite] = this.count; // `count:N` pieces available at this hand slot
    // Apply state:N if specified (e.g. EinStein cube numbers 1–6).
    // @java ActionAdd.apply() — sets stateAt when the start rule carries state:.
    if (stateAt && this.stateValue >= 0) {
      stateAt[handSite] = this.stateValue;
    }
    if (valueAt && this.valueValue >= 0) {
      valueAt[handSite] = this.valueValue;
    }
  }
}
