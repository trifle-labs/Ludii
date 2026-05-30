// @java Core/src/game/functions/ints/count/stepsOnTrack/CountStepsOnTrack.java

import { isIdent, isString, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  resolveRole,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import { OFF, type IntFn, type MancalaTrack } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountStepsOnTrack(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  const nameNode = positional.find(isString);
  const name = nameNode?.value;
  const roleNode = positional.find((p, i) => i > 0 && isIdent(p) && !["StepsOnTrack"].includes(p.name));
  const roleName = roleNode && isIdent(roleNode) ? roleNode.name : undefined;
  const siteNodes = positional.slice(1).filter((p): p is LudNode => p !== nameNode && p !== roleNode);
  const site1: IntFn = siteNodes[0] ? compileInt(siteNodes[0], env) : { eval: () => OFF };
  const site2: IntFn = siteNodes[1] ? compileInt(siteNodes[1], env) : { eval: () => OFF };
  const player: IntFn = roleName
    ? { eval: (ctx) => resolveRole(roleName, ctx) }
    : { eval: (ctx) => ctx.mover };

  return {
    eval: (ctx) => {
      // Java CountStepsOnTrack.eval selects a named/owned/default track and
      // counts forward from site1 to site2, wrapping only on looped tracks
      // (Core/src/game/functions/ints/count/stepsOnTrack/CountStepsOnTrack.java:74-195).
      const pid = player.eval(ctx);
      const track = selectTrack(ctx.board.tracks, pid, name);
      if (!track) return OFF;
      return stepsOnTrack(track, site1.eval(ctx), site2.eval(ctx));
    },
  };
}

function selectTrack(
  tracks: readonly MancalaTrack[],
  pid: number,
  name: string | undefined,
): MancalaTrack | undefined {
  if (name) return tracks.find((t) => t.name.includes(name) && t.owner === pid);
  return tracks.find((t) => t.owner === pid) ?? tracks.find((t) => t.owner === 0);
}

function stepsOnTrack(track: MancalaTrack, from: number, to: number): number {
  const sites = track.sites;
  const start = sites.indexOf(from);
  if (start < 0) return OFF;
  let count = 0;
  for (let i = start; i < sites.length; i += 1) {
    if (sites[i] === to) return count;
    count += 1;
  }
  if (track.loop) {
    for (let i = 0; i < start; i += 1) {
      if (sites[i] === to) return count;
      count += 1;
    }
  }
  return OFF;
}

register("int", "count:StepsOnTrack", compileCountStepsOnTrack as any);
