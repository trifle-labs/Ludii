/**
 * SitesHidden1to1.ts
 *
 * 1:1 ports of the seven hidden-information site classes:
 *   SitesHidden, SitesHiddenCount, SitesHiddenRotation, SitesHiddenState,
 *   SitesHiddenValue, SitesHiddenWhat, SitesHiddenWho
 *
 * Java parity: all seven return sites where a specific piece of information
 * is hidden from a given player, using ContainerState.isHidden*(pid, site).
 *
 * A factory for `sites:hidden` dispatches to the appropriate class based
 * on the optional `hiddenData` second positional argument:
 *   (sites Hidden to:<player>)         → SitesHidden (all hidden info)
 *   (sites Hidden What to:<player>)    → SitesHiddenWhat
 *   (sites Hidden Who to:<player>)     → SitesHiddenWho
 *   (sites Hidden State to:<player>)   → SitesHiddenState
 *   (sites Hidden Count to:<player>)   → SitesHiddenCount
 *   (sites Hidden Rotation to:<player>)→ SitesHiddenRotation
 *   (sites Hidden Value to:<player>)   → SitesHiddenValue
 *
 * @java game/functions/region/sites/hidden/SitesHidden.java
 * @java game/functions/region/sites/hidden/SitesHiddenCount.java
 * @java game/functions/region/sites/hidden/SitesHiddenRotation.java
 * @java game/functions/region/sites/hidden/SitesHiddenState.java
 * @java game/functions/region/sites/hidden/SitesHiddenValue.java
 * @java game/functions/region/sites/hidden/SitesHiddenWhat.java
 * @java game/functions/region/sites/hidden/SitesHiddenWho.java
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isList } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1 } from "../../../../../../compiler1to1.js";

/**
 * Base class for all hidden-site queries.
 * Queries `ctx.state.isHidden(pid, site)` — the TS 1:1 State models per-site
 * hidden flags via `hiddenForPlayer` (see state.ts).
 *
 * `fixedPid` encodes the role at compile time:
 *   >= 1   → concrete player (P1, P2, …)
 *   -1     → resolve from ctx at eval time (Mover, Next, etc.)
 *
 * @java game/functions/region/sites/hidden/SitesHidden.java — eval(Context)
 */
class SitesHiddenBase implements RegionFunction {
  /** Pre-resolved player id (>= 1) or -1 for Mover/dynamic role. */
  protected readonly fixedPid: number;
  /** Lowercased role string used for dynamic resolution. */
  protected readonly roleStr: string;

  constructor(fixedPid: number, roleStr: string) {
    this.fixedPid = fixedPid;
    this.roleStr = roleStr;
  }

  /**
   * @java SitesHidden.eval(Context) — iterate board sites, collect hidden ones.
   * The TS 1:1 state collapses all hidden-info sub-types (What/Who/State/Count/…)
   * into a single per-player boolean per site, so every sub-class uses the same
   * `isHidden(pid, site)` query.
   */
  public eval(ctx: Context): number[] {
    const g = ctx.game as unknown as { equipment?: { board?: { numSites?: number } } };
    const boardN = g.equipment?.board?.numSites ?? ctx.state.cells.length;
    const pid = this.fixedPid >= 1 ? this.fixedPid
      : this.roleStr === "next" ? (ctx.state.mover % ctx.game.numPlayers) + 1
      : ctx.state.mover; // "mover" or fallback
    const result: number[] = [];
    for (let s = 0; s < boardN; s++) {
      if (ctx.state.isHidden(pid, s)) result.push(s);
    }
    return result;
  }
}

/** @java game/functions/region/sites/hidden/SitesHidden.java */
export class SitesHidden1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenWhat.java */
export class SitesHiddenWhat1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenWho.java */
export class SitesHiddenWho1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenState.java */
export class SitesHiddenState1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenCount.java */
export class SitesHiddenCount1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenRotation.java */
export class SitesHiddenRotation1to1 extends SitesHiddenBase {}

/** @java game/functions/region/sites/hidden/SitesHiddenValue.java */
export class SitesHiddenValue1to1 extends SitesHiddenBase {}

// ---------------------------------------------------------------------------
// Registration — single key "sites:hidden" dispatches on HiddenData arg
// ---------------------------------------------------------------------------
