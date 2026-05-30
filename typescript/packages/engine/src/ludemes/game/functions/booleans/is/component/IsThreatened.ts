// @java Core/src/game/functions/booleans/is/component/IsThreatened.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  dropSiteType,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

let threatProbing = false;

export function compileIsThreatened(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  // (is Threatened [<piece>] [at:<site>]) — true when an enemy could
  // capture the target square. With `at:` the test runs on that square. A
  // square is threatened when some other player has a pseudo-legal move
  // onto it.
  //
  // A positional `<piece>` spec such as `(id "King" Mover)` names a piece
  // *type* whose square is the target (e.g. `("IsInCheck" "King" Mover)` →
  // `(is Threatened (id "King" Mover))`). This engine tracks owner, not
  // per-site component identity, so the named piece's square can't be
  // located; in that case (no `at:`) report "not threatened" so the common
  // king-safety filter `(do … ifAfterwards:(not (is Threatened (id …))))`
  // does not reject every move. Bare `(is Threatened)` falls back to a
  // best-effort "any mover piece attackable" test.
  const atNode = named.get("at");
  const atFn = atNode ? compileInt(atNode, env) : undefined;
  // Java IsThreatened: when a `what` (component) is given without an
  // explicit `at:` site, the threatened square is located via WhereSite —
  // i.e. wherever that component currently sits. The engine tracks per-site
  // component identity (`whatAtSite`), so `(is Threatened (id "King" Next))`
  // ("IsInCheck") can find the king's square and test whether any enemy can
  // capture it. Drop a leading SiteType so the `what` spec is positional[0].
  const pieceNode = atFn ? undefined : dropSiteType(positional)[0];
  const whatFn = pieceNode ? compileInt(pieceNode, env) : undefined;
  return {
    eval: (ctx) => {
      if (threatProbing) return false;
      const targets: number[] = [];
      if (atFn) {
        const s = atFn.eval(ctx);
        if (s >= 0) targets.push(s);
      } else if (whatFn) {
        // Locate the named component (Java: WhereSite(what)); a what < 1 is
        // "no such piece" → not threatened.
        const w = whatFn.eval(ctx);
        if (w < 1) return false;
        for (let s = 0; s < ctx.state.cells.length; s += 1) {
          if (ctx.state.whatAtSite(s) === w) targets.push(s);
        }
      } else {
        for (let s = 0; s < ctx.state.cells.length; s += 1) {
          if ((ctx.state.cells[s] ?? 0) === ctx.mover) targets.push(s);
        }
      }
      if (targets.length === 0) return false;
      const n = ctx.context.game.numPlayers;
      // Probe each opponent's move generation at most once and test all
      // target squares against it, rather than re-generating moves per
      // target (which is O(targets × players) and pathological for chess).
      const targetSet = new Set(targets);
      const targetOwners = new Set(
        targets.map((s) => ctx.state.cells[s] ?? ctx.mover),
      );
      // Java IsThreatened probes `players.get(owner).enemies()`, i.e. only
      // players NOT on the threatened piece's team. Teams are folded into the
      // per-player value array (ActionAddPlayerToTeam → withValuePlayer), so
      // a player whose non-zero team value matches a target owner's team is a
      // teammate and must be skipped — otherwise a 4-player/2-team variant
      // (e.g. Chatrang) sees an ally adjacent to the king as a "threat".
      // Team ids assigned by `(set Team …)` are positive; "no team" reads as
      // the UNDEFINED default (-1) — or 0 in legacy seeds — so only a value
      // `> 0` denotes a real team. A team-less owner contributes no team and
      // every non-owner remains an enemy, exactly as in a team-less game.
      const targetTeams = new Set<number>();
      for (const owner of targetOwners) {
        const team = ctx.state.valuePlayer(owner);
        if (team > 0) targetTeams.add(team);
      }
      threatProbing = true;
      try {
        for (let p = 1; p <= n; p += 1) {
          if (targetOwners.has(p)) continue;
          const pTeam = ctx.state.valuePlayer(p);
          if (pTeam > 0 && targetTeams.has(pTeam)) continue;
          const probe = ctx.context.withState(ctx.state.withMover(p));
          if (ctx.context.game.moves(probe).some((m) => targetSet.has(m.to()))) {
            return true;
          }
        }
        return false;
      } finally {
        threatProbing = false;
      }
    },
  };
}

register("bool", "Threatened", compileIsThreatened as any);
