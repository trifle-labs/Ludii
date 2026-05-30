// @java Core/src/game/functions/region/sites/edges/SitesSlash.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

function discreteDirection(angleIn: number, numDirections: number): number {
  const arc = (2 * Math.PI) / numDirections;
  const off = arc / 2;
  let angle = angleIn;
  while (angle < 0) angle += 2 * Math.PI;
  while (angle > 2 * Math.PI) angle -= 2 * Math.PI;
  return (Math.trunc((angle + off) / arc) + numDirections) % numDirections;
}

function isSlash(dir: number): boolean {
  return (dir > 0 && dir < 4) || (dir > 8 && dir < 12);
}

export function compileSitesSlash(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return {
    eval: (ctx) => {
      // SitesSlash.eval returns graph.slash(SiteType.Edge)
      // (SitesSlash.java:40-48). MeasureGraph marks angled dirs in (0,4) or
      // (8,12) as SLASH (MeasureGraph.java:1129-1135).
      const traj = ctx.board.traj;
      if (!traj) return [];
      const out: number[] = [];
      for (let s = 0; s < ctx.board.numSites; s += 1) {
        const pts = traj.edgeEndpointPts(s);
        if (!pts) continue;
        const [ax, ay, bx, by] = pts;
        const dir = discreteDirection(Math.atan2(by - ay, bx - ax), 16);
        if (isSlash(dir)) out.push(s);
      }
      return out;
    },
  };
}

register("region", "sites:Slash", compileSitesSlash as any);
