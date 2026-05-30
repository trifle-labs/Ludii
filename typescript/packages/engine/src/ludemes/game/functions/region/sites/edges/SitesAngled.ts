// @java Core/src/game/functions/region/sites/edges/SitesAngled.java

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

export function compileSitesAngled(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return {
    eval: (ctx) => {
      // SitesAngled.eval returns graph.angled(SiteType.Edge)
      // (SitesAngled.java:40-48). MeasureGraph marks every non-axial edge as
      // ANGLED (MeasureGraph.java:1129-1140).
      const traj = ctx.board.traj;
      if (!traj) return [];
      const out: number[] = [];
      for (let s = 0; s < ctx.board.numSites; s += 1) {
        const pts = traj.edgeEndpointPts(s);
        if (!pts) continue;
        const [ax, ay, bx, by] = pts;
        const dir = discreteDirection(Math.atan2(by - ay, bx - ax), 16);
        if (dir !== 0 && dir !== 4 && dir !== 8 && dir !== 12) out.push(s);
      }
      return out;
    },
  };
}

register("region", "sites:Angled", compileSitesAngled as any);
