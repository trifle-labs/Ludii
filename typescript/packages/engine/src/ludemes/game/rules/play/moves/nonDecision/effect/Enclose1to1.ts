// @java game/rules/play/moves/nonDecision/effect/Enclose.java
//
// Live faithful class for the (enclose ...) Go-family capture move. The compile
// logic was relocated VERBATIM from the inline compiler1to1 `(enclose)` handler
// into this registered class so the faithful per-ludeme class is the live engine
// (the registry lookup in compileMoves1to1 shadows the inline branch).

import type { Context } from "../../../../../../../context.js";
import type { IntFunction, MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";
import { Move } from "../../../../../../../move.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, headOf } from "../../../../../../../compiler1to1.js";
import { isList, isIdent, type LudNode, type LudList } from "@ludii/typescript-language";

/**
 * (enclose (from <site>) [<dirn>] …) — Go-family capture: from the pivot, find
 * adjacent ENEMY groups now fully surrounded (no liberties) and remove them.
 * @java game/rules/play/moves/nonDecision/effect/Enclose.java
 */
export class Enclose1to1 implements MovesFunction {
  private readonly fromFn: IntFunction;
  private readonly dirnName: string;

  public constructor(fromFn: IntFunction, dirnName: string) {
    this.fromFn = fromFn;
    this.dirnName = dirnName;
  }

  public eval(ctx: Context): Move[] {
    const from = this.fromFn.eval(ctx);
    if (from < 0) return [];
    const mover = ctx.state.mover;
    const cells = ctx.state.cells;
    const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[] };
    const radials = ctxAny._radials;
    if (!radials) return [];
    const dirnName = this.dirnName;
    const orthoNbrs = (s: number): number[] => {
      const cr = radials[s];
      if (!cr) return [];
      const out: number[] = [];
      for (const { ray, opposite } of radialsForDirection(cr, dirnName)) {
        if (ray[1] !== undefined) out.push(ray[1]);
        if (opposite[1] !== undefined) out.push(opposite[1]);
      }
      return out;
    };
    const captured = new Set<number>();
    for (const a of orthoNbrs(from)) {
      if (captured.has(a)) continue;
      const enemyWhat = cells[a] ?? 0;
      if (enemyWhat === 0 || enemyWhat === mover) continue; // empty or friend
      // BFS the enemy group; capture it iff it has NO empty (liberty) neighbour.
      const group: number[] = [];
      const seen = new Set<number>([a]);
      const stack = [a];
      let hasLiberty = false;
      while (stack.length) {
        const sNode = stack.pop()!;
        group.push(sNode);
        for (const nb of orthoNbrs(sNode)) {
          const w = cells[nb] ?? 0;
          if (w === 0) hasLiberty = true;
          else if (w === enemyWhat && !seen.has(nb)) { seen.add(nb); stack.push(nb); }
        }
      }
      if (!hasLiberty) for (const g of group) captured.add(g);
    }
    if (captured.size === 0) return [];
    const actions = [...captured].map(s => new ActionRemove({ to: s }));
    return [new Move({
      id: `enclose:${from}`, label: "Enclose", siteIndices: [from],
      mover, placedOwner: mover, actions,
    })];
  }
}

// @java Enclose.java — compile factory: parse (enclose (from <site>) [<dirn>]).
