/**
 * IsPattern.ts
 * @java game/functions/booleans/is/pattern/IsPattern.java
 *
 * Detects a specific pattern from a site by walking in all supported orthogonal
 * starting directions and checking that the pieces at each step match the
 * expected "whats" sequence.
 *
 * Java eval (lines 81-176):
 *   1. from = fromFn.eval(ctx) [default: LastTo]
 *   2. whats[] from whatsFn[] or from piece at 'from'
 *   3. walkDirection = supportedOrthogonalDirections(realType)
 *   4. For each startDirection:
 *      - Traverse the walk steps: F=forward, R=right, L=left
 *      - At each F step, check that the site's piece matches whats[whatIndex]
 *      - If all steps match, return true
 *
 * TS: uses Trajectories.walkSites with allRotations=true, one walk at a time.
 * The walk is run per-rotation (each supported orthogonal direction as start).
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, EvalScratch } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { isIdent, isList, isNumber } from "@ludii/typescript-language";
import { LastTo1to1 } from "../../../ints1to1/board/Board1to1.js";

// StepType: F, R, L (mirrors Java StepType enum)
type StepType = "F" | "R" | "L";

function parseWalk(walkNode: LudNode): StepType[] {
  const result: StepType[] = [];
  if (!isList(walkNode)) return result;
  for (const item of walkNode.items.slice(1)) {
    if (isIdent(item)) {
      const n = item.name.toUpperCase();
      if (n === "F" || n === "R" || n === "L") result.push(n as StepType);
    }
  }
  return result;
}

export class IsPattern implements BooleanFunction {
  private readonly walk: readonly StepType[];
  private readonly type: SiteType | null;
  private readonly fromFn: IntFunction;
  private readonly whatsFn: readonly IntFunction[] | null;

  public constructor(
    walk: readonly StepType[],
    type: SiteType | null = null,
    from: IntFunction | null = null,
    what: IntFunction | null = null,
    whats: readonly IntFunction[] | null = null,
  ) {
    this.walk = walk;
    this.type = type;
    this.fromFn = from ?? new LastTo1to1();
    this.whatsFn = whats ?? (what !== null ? [what] : null);
  }

  /**
   * @java game/functions/booleans/is/pattern/IsPattern.java — eval(Context)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    const from = this.fromFn.eval(ctx);
    if (from < 0) return false;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    if (from >= traj.numSites) return false;

    // @java IsPattern.java:95-108: resolve whats array
    let whats: number[];
    if (this.whatsFn !== null) {
      whats = this.whatsFn.map(fn => fn.eval(ctx));
    } else {
      const what = ctx.state.whatAtSite(from);
      if (what === 0) return false;
      whats = [what];
    }

    // @java IsPattern.java:110-113: walkDirections = supportedOrthogonalDirections
    const orthoDirs = traj.supportedOrthogonalDirNames();
    if (orthoDirs.length === 0) return false;

    // @java IsPattern.java:115-173: for each starting direction, walk the pattern
    for (const startDir of orthoDirs) {
      let currentLoc = from;
      let currentDir = startDir;
      let whatIndex = 0;

      // @java IsPattern.java:120-126: check what at 'from' == whats[0]
      if (ctx.state.whatAtSite(from) !== whats[whatIndex]!) return false;
      whatIndex++;
      if (whatIndex === whats.length) whatIndex = 0;

      let found = true;
      for (const step of this.walk) {
        if (step === "F") {
          // @java IsPattern.java:132-153: step forward in current direction
          const to = traj.step(currentLoc, currentDir);
          currentLoc = to;

          if (to < 0 || to === -1 || ctx.state.whatAtSite(to) !== whats[whatIndex]!) {
            found = false;
            break;
          }
          whatIndex++;
          if (whatIndex === whats.length) whatIndex = 0;
        } else if (step === "R") {
          // @java IsPattern.java:155-159: rotate right to next supported orthogonal
          currentDir = rotateToNext(orthoDirs, currentDir, +1);
        } else if (step === "L") {
          // @java IsPattern.java:161-164: rotate left
          currentDir = rotateToNext(orthoDirs, currentDir, -1);
        }
      }

      if (found) return true;
    }

    return false;
  }
}

/** Rotate direction within supported orthogonal dirs by delta (+1 CW, -1 CCW). */
function rotateToNext(dirs: readonly string[], current: string, delta: number): string {
  const idx = dirs.indexOf(current);
  if (idx < 0) return current;
  const next = ((idx + delta) + dirs.length) % dirs.length;
  return dirs[next] as string;
}

