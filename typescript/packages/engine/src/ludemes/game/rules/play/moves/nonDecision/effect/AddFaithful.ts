// @java Core/src/game/rules/play/moves/nonDecision/effect/Add.java

import type { IntFunction, RegionFunction } from "../../../../../../base.js";
import type { Piece } from "../../../../../util/moves/Piece.js";
import type { To } from "../../../../../util/moves/To.js";
import type { Then } from "./Then.js";
import { Add } from "./Add.js";
import { pieceComponent, toRegion } from "./EffectCtorAdapters.js";

function ownerSuffix(name: string): number | null {
  const match = name.match(/\d+$/);
  return match ? Number(match[0]) : null;
}

function piecePlacement(piece: Piece | null): { what: IntFunction; owner: number; state?: IntFunction } | null {
  if (piece === null) return null;

  const component = piece.component();
  if (component !== null) {
    return { what: component, owner: -1, ...(piece.state() ? { state: piece.state()! } : {}) };
  }

  const name = piece.nameComponent();
  if (name === null || piece.components() !== null || piece.nameComponents() !== null) {
    return { what: pieceComponent(piece), owner: -1, ...(piece.state() ? { state: piece.state()! } : {}) };
  }

  const owner = ownerSuffix(name);
  const baseName = name.replace(/\d+$/, "").toLowerCase();
  return {
    what: {
      eval: (ctx) => {
        const pieces = (ctx.game as unknown as { equipment?: { pieces?: Array<{ name: string; owner: number; index: number }> } })
          .equipment?.pieces ?? [];
        // @java game/util/moves/Piece.java:69-71 + game/functions/ints/board/
        // Id.java:200-203 — a bare (piece "Name") always compiles to
        // Id(name, null), an EXACT full-name match with NO owner-suffix
        // decomposition (the suffix path is Id.java:170-190's separate
        // two-arg overload). Without this, a piece whose name legitimately
        // ends in digits that are NOT an owner (2048's "Square2".."Square2048"
        // tile values) resolved to the raw numeral: "Square2" -> index 2
        // (really Square4), desyncing the board from the first tile spawn.
        const literal = pieces.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (literal) return literal.index;
        const exact = pieces.find((p) => `${p.name}${p.owner}`.toLowerCase() === name.toLowerCase());
        const byBase = pieces.find((p) => p.name.toLowerCase() === baseName && (owner === null || p.owner === owner));
        return exact?.index ?? byBase?.index ?? (owner ?? ctx.state.mover);
      },
    },
    owner: owner ?? -1,
    ...(piece.state() ? { state: piece.state()! } : {}),
  };
}

export class AddFaithful extends Add {
  // Java order: Add(@Opt Piece what, To to, @Opt@Name IntFunction count,
  // @Opt@Name Boolean stack, @Opt Then then). Defaults on the optional tail keep
  // Function.length at 2 so the ArgCompiler arity gate accepts forms without them.
  public constructor(
    what: Piece | null = null,
    to: To | null = null,
    count: IntFunction | null = null,
    stack: boolean | null = null,
    then: Then | null = null
  ) {
    const region: RegionFunction = toRegion(to);
    super(region, piecePlacement(what), {
      count,
      stack: stack ?? false,
      then,
      condition: to?.condFn() ?? null,
      applyEffect: to?.effectFn()?.effectMoves() ?? null,
      // @java To.type() — a non-default graph-element target (Edge/Vertex)
      // routes the placement to that element's occupancy layer.
      siteType: to?.siteType() ?? null,
    });
  }
}
