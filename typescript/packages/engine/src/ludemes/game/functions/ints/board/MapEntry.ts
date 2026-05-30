// @java Core/src/game/functions/ints/board/MapEntry.java

import { isString, type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import { OFF, type EvalContext, type IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileMapEntry(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  // (mapEntry "Name"? <key>?) — look up a key in a named map declared by
  // `(map "Name" {(pair k v) …})`, or in the default player→store map.
  // Mancala games map each player to their store hole; named maps cover
  // things like die-face → outcome lookups.
  // Java parity (MapEntry.eval): look the key up in the map; return the
  // stored value only when it is a real entry (not OFF and not the trove
  // no-entry value, which Ludii's runtime reports as -99 — see the comment
  // in MapEntry.java). Otherwise fall back to the KEY itself. e.g. a
  // `(map "Throw" {(pair 0 8)})` maps a 0-pip throw to the "grace" value 8
  // but leaves 1..N unmapped, so `(mapEntry "Throw" n)` returns n for those.
  //
  // Crucially the no-entry value is NOT 0: a player→store map such as
  // `(map {(pair P1 FirstSite) (pair P2 LastSite)})` legitimately maps P1 to
  // store *site 0*, and Wari/Kalah/etc. capture into it. A JS Map already
  // distinguishes a stored 0 (`get` returns 0) from an absent key (`get`
  // returns undefined), so we only fall back on `undefined`/`OFF`.
  const mapLookup = (m: ReadonlyMap<number, number> | undefined, key: number): number => {
    const v = m?.get(key);
    return v === undefined || v === OFF ? key : v;
  };
  const first = positional[0];
  if (first && isString(first)) {
    const keyNode = positional[1];
    const keyFn = keyNode
      ? compileInt(keyNode, env)
      : { eval: (c: EvalContext) => c.mover };
    // The named map may be registered after this ludeme compiles (piece
    // moves compile before `compileMap`), so resolve it lazily at eval
    // time rather than capturing whatever `namedMaps` held at compile.
    const mapName = first.value;
    return {
      eval: (ctx) =>
        mapLookup(env.namedMaps?.get(mapName), keyFn.eval(ctx)),
    };
  }
  const pid = first
    ? compileInt(first, env)
    : { eval: (c: EvalContext) => c.mover };
  return {
    eval: (ctx) => {
      const key = pid.eval(ctx);
      const ordered = env.orderedMaps;
      if (ordered && ordered.length > 0) {
        for (const entry of ordered) {
          const v = entry.map.get(key);
          if (v !== undefined && v !== OFF) return v;
        }
      }
      return mapLookup(env.playerStoreMap, key);
    },
  };
}

register("int", "mapEntry", compileMapEntry as any);
