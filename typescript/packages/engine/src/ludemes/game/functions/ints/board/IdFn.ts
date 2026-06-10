// @java Core/src/game/functions/ints/board/Id.java

/**
 * Returns the index of a player role, or of a component (optionally by owner).
 *
 * @java game/functions/ints/board/Id.java
 * @author cambolbro and Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

const OFF = -1;

/** Engine piece-table entry — the substrate the engine's what-indices key off.
 * (Until item-3 State convergence, Java's components()[i] array maps to
 * equipment.pieces[].index here — same convention the registry factory used.) */
interface PieceEntry { name: string; owner: number; index: number }

function piecesOf(ctx: Context): readonly PieceEntry[] {
  const eq = (ctx.game as unknown as { equipment?: { pieces?: readonly PieceEntry[] } }).equipment;
  return eq?.pieces ?? [];
}

interface ComponentLike { name?: () => string; owner?: () => number }

function containersOf(ctx: Context): ComponentLike[] {
  const eq = (ctx.game as unknown as { equipment?: { containers?: () => ComponentLike[] } }).equipment;
  return eq?.containers?.() ?? [];
}

/** @java Id.eval — the role switch for the name==null form. */
function roleIndex(who: string, ctx: Context): number {
  if (who === "Neutral") return 0;
  const pm = who.match(/^P(\d+)$/) ?? who.match(/^Team(\d+)$/);
  if (pm) return Number(pm[1]);
  switch (who) {
    case "TeamMover": {
      const st = ctx.state as unknown as { getTeam?: (p: number) => number; valuePlayer?: (p: number) => number };
      return st.getTeam?.(ctx.state.mover) ?? st.valuePlayer?.(ctx.state.mover) ?? OFF;
    }
    case "Shared": case "All": case "Each": return ctx.game.numPlayers + 1;
    case "Mover": return ctx.state.mover;
    case "Next": return (ctx.state as unknown as { next?: number }).next ?? (ctx.state.mover % ctx.game.numPlayers) + 1;
    case "Prev": return (ctx.state as unknown as { prev?: number }).prev ?? ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
    default: return OFF;
  }
}

export class Id extends BaseIntFunction {
  /** @java Id.nameComponent */
  private readonly nameComponent: string | null;
  /** @java Id.who */
  private readonly who: string;

  /** @java Id(@Opt String name, RoleType who) */
  public constructor(name: string | null, who: string) {
    super();
    this.nameComponent = name;
    this.who = who;
  }

  /** @java Id.construct(String name) → IndexOfComponent */
  public static construct(name: string): IndexOfComponent {
    return new IndexOfComponent(name);
  }

  /** @java Id.eval(Context) */
  public override eval(context: Context): number {
    // @java if (who == RoleType.Player) return context.player();
    if (this.who === "Player") {
      return (context as Context & { _evalPlayer?: number })._evalPlayer ?? context.state.mover;
    }
    if (this.nameComponent === null) {
      return roleIndex(this.who, context);
    }
    // Name + role: find the component whose name CONTAINS nameComponent owned by the role's player.
    // @java Id.java:178-183 — component.name().contains(nameComponent) && component.owner() == playerId
    const playerId = roleIndex(this.who, context);
    if (playerId === OFF) return OFF;
    for (const p of piecesOf(context)) {
      if (p.name.includes(this.nameComponent) && p.owner === playerId) return p.index;
    }
    return -1;
  }

  /** @java Id.isStatic() — static for fixed roles; conservatively false here. */
  public isStatic(): boolean { return false; }
}

/**
 * @java Id.IndexOfComponent — index of the container or component with this exact name.
 */
export class IndexOfComponent extends BaseIntFunction {
  /** @java IndexOfComponent.nameComponent */
  private readonly nameComponent: string;

  public constructor(name: string) {
    super();
    this.nameComponent = name;
  }

  /** @java IndexOfComponent.eval — containers by exact name first, then components. */
  public override eval(context: Context): number {
    const containers = containersOf(context);
    for (let i = 0; i < containers.length; i++) {
      if ((containers[i]!.name?.() ?? "") === this.nameComponent) return i;
    }
    for (const p of piecesOf(context)) {
      if (p.name === this.nameComponent) return p.index;
    }
    // @java component name may carry the owner suffix ("Pawn1") — match name+owner too.
    for (const p of piecesOf(context)) {
      if (`${p.name}${p.owner}` === this.nameComponent) return p.index;
    }
    return -1;
  }

  /** @java IndexOfComponent.isStatic() */
  public isStatic(): boolean { return true; }
}
