/**
 * IsLoop1to1.ts
 * @java game/functions/booleans/is/loop/IsLoop.java
 *
 * Detects a loop: the last-placed piece is enclosed by (or part of) a ring
 * of same-coloured pieces that does not touch the board perimeter.
 *
 * Java eval (lines 163-406) — non-tile-path variant only (tile-path requires
 * component.paths() tile metadata not available in the 1:1 port):
 *   1. from = startFn.eval(ctx) [default: LastTo]
 *   2. colourLoop = mover (default)
 *   3. Get outerIndices = perimeter sites
 *   4. Collect aroundSites = non-outer adjacent neighbours of "from" with
 *      different what (possible interior seeds).
 *   5. For each seed in aroundSites: BFS expanding through non-loop-owner cells
 *      without touching outer sites. If BFS completes without hitting outer,
 *      we found an enclosed region → check that the bounding loop is owned by
 *      colourLoop and forms a connected cycle.
 *
 * TS: uses Trajectories.steps/group/neighbours/perimeterSites.
 * The tile-path variant (IsLoop.evalTilePath) is deferred — it requires
 * component tile-path metadata (Component.paths()) which is not in the 1:1 port.
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, RegionFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../../compiler1to1.js";
import { isIdent } from "@ludii/typescript-language";

type SiteTypeName = "Cell" | "Edge" | "Vertex";
type RoleTypeName = string;
type DirectionArg = string | DirectionsFunction;

function makeColourFn(arg: import("@ludii/typescript-language").LudNode | undefined): IntFunction {
  if (arg && isIdent(arg)) {
    const roleName = arg.name.toLowerCase();
    return {
      eval: (c: Context & EvalScratch): number => {
        if (roleName === "mover") return c.state.mover;
        if (roleName === "next") return (c.state.mover % c.game.numPlayers) + 1;
        if (roleName === "neutral") return 0;
        const m = roleName.match(/^p(\d+)$/);
        if (m) return parseInt(m[1] as string, 10);
        return c.state.mover;
      },
    };
  }
  if (arg) {
    try { return compileInt1to1(arg); }
    catch { /* fall through */ }
  }
  // default = Mover
  return { eval: (c: Context & EvalScratch) => c.state.mover };
}

function defaultLastToFn(): IntFunction {
  return { eval: (c: Context & EvalScratch) => c._evalTo };
}

function defaultMoverFn(): IntFunction {
  return { eval: (c: Context & EvalScratch) => c.state.mover };
}

export class IsLoop1to1 implements BooleanFunction {
  private readonly startFn: IntFunction;
  private readonly colourFn: IntFunction;
  private readonly dirnChoice: DirectionArg | null;

  /**
   * @java IsLoop(@Opt SiteType type,
   *              @Opt @Or @Name RoleType surround,
   *              @Opt @Or RoleType[] surroundList,
   *              @Opt Direction directions,
   *              @Opt IntFunction colour,
   *              @Opt @Or2 IntFunction start,
   *              @Opt @Or2 RegionFunction regionStart,
   *              @Opt @Name Boolean path)
   */
  public constructor(
    type?: SiteTypeName | null,
    surround?: RoleTypeName | null,
    surroundList?: readonly RoleTypeName[] | null,
    directions?: DirectionArg | null,
    colour?: IntFunction | null,
    start?: IntFunction | null,
    regionStart?: RegionFunction | null,
    path?: boolean | null,
  ) {
    void type;
    void path;
    if (surround != null && surroundList != null) {
      throw new Error("Zero or one Or parameter can be non-null.");
    }
    if (start != null && regionStart != null) {
      throw new Error("Zero or one Or2 parameter can be non-null.");
    }

    this.startFn = start ?? defaultLastToFn();
    this.colourFn = colour ?? defaultMoverFn();
    this.dirnChoice = directions ?? null;
  }

  /**
   * @java game/functions/booleans/is/loop/IsLoop.java — eval(Context) (non-tile-path variant)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    const from = this.startFn.eval(ctx);
    if (from < 0) return false;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    if (from >= traj.numSites) return false;

    const what = ctx.state.whatAtSite(from);
    if (what <= 0) return false;

    const colourLoop = this.colourFn.eval(ctx);

    // @java IsLoop.java:preprocess — outerIndices = outer elements of board
    const outerSet = new Set(traj.perimeterSites());

    // @java IsLoop.java:197-219: collect aroundSites = adjacent neighbours of
    // "from" that are not on the outer ring and not the same what
    const aroundSites: number[] = [];
    const adjNeighbours = traj.group(from, "Adjacent");
    for (const to of adjNeighbours) {
      if (outerSet.has(to)) continue;
      if (ctx.state.whatAtSite(to) !== what) {
        aroundSites.push(to);
      }
    }

    // @java IsLoop.java:222-405: for each seed, BFS to find enclosed region
    for (let idx = aroundSites.length - 1; idx >= 0; idx--) {
      const origin = aroundSites[idx]!;
      const groupSites: number[] = [origin];
      let continueSearch = true;

      const sitesExplored = new Set<number>();
      let i = 0;

      while (sitesExplored.size !== groupSites.length) {
        const site = groupSites[i]!;

        // @java IsLoop.java:241-289: expand via Orthogonal radials
        const orthoNeighbours = traj.group(site, "Orthogonal");
        for (const to of orthoNeighbours) {
          if (groupSites.includes(to)) continue;

          if (ctx.state.whatAtSite(to) !== what) {
            // Not the loop border: add to interior
            groupSites.push(to);

            // If it's an outer site, no loop possible
            if (outerSet.has(to)) {
              continueSearch = false;
              break;
            }
          }
          // else: same what → this is the loop border, stop radial
        }

        if (!continueSearch) break;
        sitesExplored.add(site);
        i++;
      }

      if (!continueSearch) continue;

      // @java IsLoop.java:302-335: found enclosed region; gather loop boundary
      const groupSet = new Set(groupSites);
      const loop: number[] = [];

      for (const siteGroup of groupSites) {
        const neighbours = traj.group(siteGroup, "Orthogonal");
        for (const to of neighbours) {
          if (!groupSet.has(to) && !loop.includes(to)) {
            loop.push(to);
          }
        }
      }

      // @java IsLoop.java:337-337: check all loop pieces are owned by colourLoop
      let ownedPiecesLooping = true;
      for (const siteLoop of loop) {
        if ((ctx.state.cells[siteLoop] ?? 0) !== colourLoop) {
          ownedPiecesLooping = false;
          break;
        }
      }
      if (!ownedPiecesLooping) continue;

      // @java IsLoop.java:340-402: verify the loop pieces form a connected cycle
      // using the chosen direction (dirnName)
      const loopCopy = [...loop];
      let loopFound = false;
      let previousIdx = 0;
      let siteLoopIdx = 0;
      const exploredLoop: number[] = [];

      while (!loopFound) {
        if (loopCopy.length === 0) break;

        const siteLoop = loopCopy[siteLoopIdx]!;
        const whatElement = ctx.state.whatAtSite(siteLoop);
        if (whatElement !== what) {
          loopCopy.splice(loopCopy.indexOf(siteLoop), 1);
          siteLoopIdx = previousIdx;
          continue;
        }

        // Find next site in the loop from siteLoop using dirnName
        const candidates = traj.group(siteLoop, this.dirnName(ctx));
        let newSite = -1;
        for (const to of candidates) {
          const whatTo = ctx.state.whatAtSite(to);
          if (loopCopy.includes(to) && whatTo === what) {
            newSite = to;
            break;
          }
        }

        if (newSite === -1) {
          loopCopy.splice(loopCopy.indexOf(siteLoop), 1);
          const exploredIdx = exploredLoop.indexOf(siteLoop);
          if (exploredIdx >= 0) exploredLoop.splice(exploredIdx, 1);
          siteLoopIdx = previousIdx;
          continue;
        } else {
          exploredLoop.push(siteLoop);
          if (exploredLoop.length === loopCopy.length) {
            loopFound = true;
            break;
          }
          previousIdx = siteLoopIdx;
          siteLoopIdx = loopCopy.indexOf(newSite);
        }
      }

      if (loopFound) return true;
    }

    return false;
  }

  private dirnName(ctx: Context & EvalScratch): string {
    if (typeof this.dirnChoice === "string") return this.dirnChoice;
    return this.dirnChoice?.eval(ctx)[0] ?? "Adjacent";
  }
}

