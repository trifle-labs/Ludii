// @java Core/src/game/functions/ints/count/site/CountNumber.java


import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import { compileFlags } from "../../../../../../ludii/compiler/compile-flags.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Game } from "../../../../../Game.js";
import type { Rules } from "../../../../rules/Rules.js";

export class CountNumber implements IntFunction {
  /** @java CountNumber.region */
  private readonly regionFn: RegionFunction;
  /** @java CountNumber.type — the SiteType this count is scoped to. */
  private readonly type: string | null;

  public constructor(regionFn: RegionFunction, type: string | null = null) {
    // @java CountNumber.java:126 — gameFlags() = GameType.Count | … (unconditional).
    compileFlags.usesCount = true;
    this.regionFn = regionFn;
    this.type = type;
  }

  /**
   * @java game/functions/ints/count/site/CountNumber.java — eval(Context)
   * For each site in region: sum state.countAtSite(site) (stack-depth / count field).
   * In non-stacking games: returns sum of count[site] values; in stacking: size of stack.
   */
  public eval(ctx: Context): number {
    const sites = this.regionFn.eval(ctx);
    // @java preprocess(): type = (type != null) ? type : game.board().defaultSite().
    const resolvedType = this.type ?? ctx.board().defaultSite();
    // @java ContainerFlatVertexState.countVertex(s) returns 0 for s beyond the
    // board's vertex/edge ChunkSet (i.e. hand/off-board container sites). On a
    // non-Cell board, (count at:<handSite>) therefore reads 0 — a sow capture
    // to hand (J'erin's (last To afterConsequence:True)) must not be re-counted
    // as a board pile. Cell boards keep the prior behaviour: Morris/Tapatan
    // legitimately count their hand via a bare (count at:<handSite>).
    const boardNumSites = ctx.board().numSites();
    let count = 0;
    // @java CountNumber.java eval() — `if (context.game().isStacking())` the
    // count of a site is its STACK SIZE (cs.sizeStack), not the count field:
    // Laomuzhu's ("NoPieceOnBoard") `(all Sites (sites Board) if:(= 0 (count
    // at:(site))))` read countAt 0 for genuinely stacked board sites and ended
    // round 1 as a false win. Non-stacking games keep the count-field sum.
    const stacking = ctx.state.stackingGame;
    // @java per-type ContainerStates — an explicit `Cell` count on a
    // Vertex-play BOARD reads the board's CELL (face) channel, not the vertex
    // seeds. Adidada's ("PiecesOwnedBy" = (+ (count Cell at:(mapEntry #1))
    // (count in:(sites #1)))) scores stores via `count Cell at:0/13` on a
    // Vertex mancala board: Java reads the empty face channel (0); the TS
    // flat read returned the store's VERTEX pile (17/29) and flipped the
    // byScore winner. Hand sites (>= boardNumSites) are genuine Cells in
    // both engines and keep the flat read (Bechi's hand-count end).
    const playType = ctx.board().defaultSite();
    const typedCell = (ctx.state as unknown as {
      typedSites?: ReadonlyMap<string, { count?: readonly number[] }>;
    }).typedSites?.get("Cell");
    for (const s of sites) {
      if (s < 0) continue;
      if (resolvedType !== "Cell" && s >= boardNumSites) continue;
      if (resolvedType === "Cell" && playType !== "Cell" && s < boardNumSites) {
        count += typedCell?.count?.[s] ?? 0;
        continue;
      }
      count += stacking ? ctx.state.stackSize(s) : ctx.state.count(s);
    }
    return count;
  }
}
