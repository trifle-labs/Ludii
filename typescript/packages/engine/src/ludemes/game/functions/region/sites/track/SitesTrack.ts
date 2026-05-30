// @java Core/src/game/functions/region/sites/track/SitesTrack.java

import {
  isIdent,
  isNumber,
  isString,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  resolveRole,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type {
  IntFn,
  MancalaTrack,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesTrack(node: LudList, env: CompileEnv): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  let roleName: string | undefined;
  let playerIdLiteral: number | undefined;
  let trackName: string | undefined;
  for (const p of positional) {
    if (roleName === undefined && isIdent(p)) roleName = p.name;
    else if (playerIdLiteral === undefined && isNumber(p)) {
      playerIdLiteral = p.value;
    } else if (trackName === undefined && isString(p)) trackName = p.value;
  }
  const fromNode = named.get("from");
  const toNode = named.get("to");
  let fromFn: IntFn | undefined;
  let toFn: IntFn | undefined;
  if (fromNode) {
    try {
      fromFn = compileInt(fromNode, env);
    } catch {
      fromFn = undefined;
    }
  }
  if (toNode) {
    try {
      toFn = compileInt(toNode, env);
    } catch {
      toFn = undefined;
    }
  }
  return {
    eval: (ctx) => {
      const tracks = ctx.board.tracks;
      if (tracks.length === 0) return [];
      const playerId =
        roleName !== undefined
          ? resolveRole(roleName, ctx)
          : playerIdLiteral ?? 0;
      const pickTrack = (): MancalaTrack | undefined => {
        // Java SitesTrack.eval selects the first matching track and breaks; it
        // never unions all matches (Core/src/.../SitesTrack.java:90-110).
        const name = trackName ?? "";
        for (const tr of tracks) {
          if (
            tr.name === name ||
            (tr.name.includes(name) && (tr.owner === playerId || tr.owner === 0))
          ) {
            return tr;
          }
        }
        if (
          trackName === undefined &&
          roleName === undefined &&
          playerIdLiteral === undefined
        ) {
          return tracks[0];
        }
        return undefined;
      };

      const track = pickTrack();
      if (!track) return [];
      const elems = track.sites;
      const out: number[] = [];

      if (!fromFn && !toFn) {
        // Java copies only the selected track's elems into the region
        // (Core/src/.../SitesTrack.java:120-123).
        return [...elems];
      }

      const from = fromFn ? fromFn.eval(ctx) : -1;
      const to = toFn ? toFn.eval(ctx) : -1;
      let fromIndex = 0;
      if (from >= 0) {
        fromIndex = elems.indexOf(from);
        if (fromIndex < 0) return out;
      }

      // Java walks from the from index to the end, then wraps once to the prefix
      // if the to site was not found (Core/src/.../SitesTrack.java:127-175).
      let toFound = false;
      for (let i = fromIndex; i < elems.length; i += 1) {
        const s = elems[i];
        if (s === undefined) continue;
        out.push(s);
        if (s === to) {
          toFound = true;
          break;
        }
      }
      if (!toFound) {
        for (let i = 0; i < fromIndex; i += 1) {
          const s = elems[i];
          if (s === undefined) continue;
          out.push(s);
          if (s === to) break;
        }
      }
      return out;
    },
  };
}

register("region", "Track", compileSitesTrack as any);
