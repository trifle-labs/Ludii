// @java Core/src/game/functions/region/sites/simple/SitesMinor.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

interface FaceLike {
  readonly id: number;
  readonly vertices: readonly unknown[];
}

function faceElements(ctx: Parameters<RegionFn["eval"]>[0]): readonly FaceLike[] {
  const traj = ctx.board.traj as
    | { kind?: string; core?: { topo?: { faceEls?: readonly FaceLike[] } } }
    | undefined;
  if (!traj || traj.kind !== "Cell") return [];
  return traj.core?.topo?.faceEls ?? [];
}

export function compileSitesMinor(
  _node: LudList,
  _env: CompileEnv,
): RegionFn {
  return {
    eval: (ctx) => {
      // SitesMinor.eval delegates to graph.minor(realType)
      // (SitesMinor.java:44-55). MeasureGraph marks faces with fewer than the
      // maximum vertex count as MINOR (MeasureGraph.java:379-393).
      if (!ctx.board.traj) return [];
      const faces = faceElements(ctx);
      let maxSides = 0;
      for (const face of faces) {
        if (face.vertices.length > maxSides) maxSides = face.vertices.length;
      }
      return faces
        .filter((face) => face.vertices.length < maxSides)
        .map((face) => face.id);
    },
  };
}

register("region", "sites:Minor", compileSitesMinor as any);
