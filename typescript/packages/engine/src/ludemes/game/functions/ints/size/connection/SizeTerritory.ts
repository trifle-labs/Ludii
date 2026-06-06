// @java Core/src/game/functions/ints/size/connection/SizeTerritory.java

/**
 * Returns the total number of sites enclosed by a specific Player.
 *
 * @java game/functions/ints/size/connection/SizeTerritory.java
 * @author eric.piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import type { RoleTypeFull } from "../../../../../game/types/play/RoleType.js";

/** Java parity: AbsoluteDirection — only Adjacent is used as default here. */
type AbsoluteDirection = string;

/**
 * Minimal ContainerState surface needed by this class.
 * @java other/state/container/ContainerState.java
 */
interface IContainerState {
  emptyRegion(type: string): { sites(): number[] };
  isEmpty(site: number, type: string): boolean;
  who(site: number, type: string): number;
}

/**
 * Minimal Topology surface needed by this class.
 * @java other/topology/Topology.java
 */
interface ITopologyElement {
  index(): number;
  siteType(): string;
  id(): number;
}

interface IStep {
  from(): ITopologyElement;
  to(): ITopologyElement;
}

interface IEdge {
  index(): number;
  adjacent(): IEdge[];
}

interface ITrajectories {
  steps(type: string, siteIndex: number, toType: string, direction: string): IStep[];
  steps(type: string, siteIndex: number, direction: string): IStep[];
}

interface ITopology {
  getGraphElements(type: string): ITopologyElement[];
  trajectories(): ITrajectories;
  edges(): IEdge[];
}

/**
 * Returns the total number of sites enclosed by a specific Player.
 *
 * @java game/functions/ints/size/connection/SizeTerritory.java
 */
export class SizeTerritory extends BaseIntFunction {
  /** The index of player. @java SizeTerritory.who */
  private readonly who: JavaIntFunction;

  /** The roleType. @java SizeTerritory.role */
  private readonly role: RoleTypeFull | null;

  /** Direction of the connection. @java SizeTerritory.dirnChoice */
  private readonly dirnChoice: AbsoluteDirection;

  /** Cell/Edge/Vertex. @java SizeTerritory.type */
  private type: SiteType | null;

  /**
   * @param type      The graph element type [default SiteType of the board].
   * @param role      The roleType of the player owning the territory.
   * @param who       The index function of the player owning the territory.
   * @param direction The type of directions [Adjacent].
   * @java SizeTerritory(SiteType, RoleType, Player, AbsoluteDirection)
   */
  public constructor(
    type: SiteType | null,
    role: RoleTypeFull | null,
    who: JavaIntFunction,
    direction: AbsoluteDirection | null = null,
  ) {
    super();
    this.type = type;
    this.role = role;
    this.who = who;
    this.dirnChoice = direction ?? "Adjacent";
  }

  /**
   * @java SizeTerritory.eval(Context)
   *
   * Returns the total number of sites enclosed by the player's territory.
   */
  public override eval(context: Context): number {
    let sizeTerritory = 0;

    // Java: final Topology topology = context.topology();
    const topology = (context as unknown as { topology?: () => ITopology }).topology?.();
    if (topology === undefined) return 0;

    // Java: final ContainerState cs = context.state().containerStates()[0];
    const cs = (context.state as unknown as {
      containerStates?: () => IContainerState[];
    }).containerStates?.()?.[0];
    if (cs === undefined) return 0;

    const realType: SiteType = this.type ?? "Cell";

    // Java: final TIntArrayList emptySites = new TIntArrayList(cs.emptyRegion(type).sites());
    const emptySites: number[] = [...cs.emptyRegion(realType).sites()];

    // Java: final int whoId = who.eval(context);
    const whoId = this.who.eval(context);

    // Java: final TIntArrayList idPlayers = PlayersIndices.getIdPlayers(context, role, whoId);
    const idPlayers = this.getIdPlayers(context, this.role, whoId);

    // Java: final TIntArrayList sitesExplored = new TIntArrayList();
    const sitesExplored: number[] = [];

    for (let i = 0; i < emptySites.length; i++) {
      const site = emptySites[i]!;

      if (sitesExplored.includes(site))
        continue;

      // Get group of empty sites from that site.
      const groupSites: number[] = [site];
      const groupSitesExplored: number[] = [];
      let indexGroup = 0;

      while (groupSitesExplored.length !== groupSites.length) {
        const siteGroup = groupSites[indexGroup]!;
        // Java: final TopologyElement siteElement = topology.getGraphElements(type).get(siteGroup);
        const elements = topology.getGraphElements(realType);
        // siteElement is used for its index in the step query
        const steps = (topology.trajectories() as unknown as {
          steps(type: string, siteIndex: number, toType: string, direction: string): IStep[];
        }).steps(realType, siteGroup, realType, this.dirnChoice);

        for (const step of steps) {
          const to = step.to().id !== undefined ? step.to().id() : (step.to() as unknown as { index(): number }).index();

          if (groupSites.includes(to))
            continue;

          // Java: context.setTo(to);
          context.setEvalTo(to);
          if (cs.isEmpty(to, realType))
            groupSites.push(to);
        }

        groupSitesExplored.push(siteGroup);
        indexGroup++;
      }

      for (const s of groupSites) {
        if (!sitesExplored.includes(s)) sitesExplored.push(s);
      }

      // Check if that group is owned by the right players.
      if (SizeTerritory.checkTerritory(groupSites, topology, this.dirnChoice, realType, cs, idPlayers)) {
        sizeTerritory += groupSites.length;
      }
    }

    return sizeTerritory;
  }

  /**
   * @java SizeTerritory.checkTerritory(...)
   *
   * Returns true if the sites are surrounded only by the expected players.
   */
  private static checkTerritory(
    sites: number[],
    graph: ITopology,
    dirnChoice: AbsoluteDirection,
    type: SiteType,
    cs: IContainerState,
    playerTerritory: number[],
  ): boolean {
    if (type === "Edge") {
      for (let i = 0; i < sites.length; i++) {
        const site = sites[i]!;
        const edge = graph.edges()[site];
        if (edge === undefined) continue;
        for (const edgeAdj of edge.adjacent()) {
          const territorySite = edgeAdj.index();
          if (!sites.includes(territorySite)) {
            const who = cs.who(territorySite, type);
            if (!playerTerritory.includes(who))
              return false;
          }
        }
      }
    } else {
      for (let i = 0; i < sites.length; i++) {
        const site = sites[i]!;
        const steps = (graph.trajectories() as unknown as {
          steps(type: string, siteIndex: number, direction: string): IStep[];
        }).steps(type, site, dirnChoice);

        for (const step of steps) {
          if (step.from().siteType() !== step.to().siteType())
            continue;

          const to = step.to().id !== undefined ? step.to().id() : (step.to() as unknown as { index(): number }).index();

          if (!sites.includes(to)) {
            const who = cs.who(to, type);
            if (!playerTerritory.includes(who))
              return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Mirrors Java's PlayersIndices.getIdPlayers(Context, RoleType, int).
   * Simplified inline version since we can't import PlayersIndices easily here.
   * @java other/PlayersIndices.java — getIdPlayers
   */
  private getIdPlayers(context: Context, role: RoleTypeFull | null, whoId: number): number[] {
    if (role === null) return [whoId];

    const ctx = context as unknown as {
      game?: { players?: { size?(): number }; requiresTeams?(): boolean };
      state?: {
        mover?: number;
        next?(): number;
        prev?(): number;
        getTeam?(pid: number): number;
        playerInTeam?(pid: number, team: number): boolean;
      };
    };

    const numPlayers = ctx.game?.players?.size?.() ?? 2;
    const mover = ctx.state?.mover ?? context.state.mover;

    switch (role) {
      case "All": {
        const arr: number[] = [];
        for (let pid = 0; pid <= numPlayers; ++pid) arr.push(pid);
        return arr;
      }
      case "Mover":
        return [mover];
      case "Next": {
        const nxt = ctx.state?.next?.() ?? ((mover % (numPlayers)) + 1);
        return [nxt];
      }
      case "Prev": {
        const prv = ctx.state?.prev?.() ?? mover;
        return [prv];
      }
      case "NonMover": {
        const arr: number[] = [];
        for (let pid = 0; pid < numPlayers; ++pid) {
          if (pid !== mover) arr.push(pid);
        }
        return arr;
      }
      case "Enemy": {
        const arr: number[] = [];
        for (let pid = 1; pid < numPlayers; ++pid) {
          if (pid !== mover) arr.push(pid);
        }
        return arr;
      }
      case "Friend":
        return [mover];
      default:
        return [whoId];
    }
  }

  /** @java SizeTerritory.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java SizeTerritory.gameFlags(Game) */
  public gameFlags(game: unknown): number {
    let flags = (this.who as unknown as { gameFlags?(g: unknown): number }).gameFlags?.(game) ?? 0;
    // Java: flags |= SiteType.gameFlags(type) — deferred
    return flags;
  }

  /** @java SizeTerritory.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    for (const bit of this.who.concepts(game)) {
      concepts.add(bit);
    }
    // Java: concepts.or(SiteType.concepts(type)) — deferred
    // Java: concepts.set(Concept.Territory.id(), true) — deferred
    return concepts;
  }

  /** @java SizeTerritory.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    for (const bit of this.who.writesEvalContextRecursive()) {
      writeEvalContext.add(bit);
    }
    return writeEvalContext;
  }

  /** @java SizeTerritory.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    for (const bit of this.who.readsEvalContextRecursive()) {
      readEvalContext.add(bit);
    }
    return readEvalContext;
  }

  /** @java SizeTerritory.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    missingRequirement = missingRequirement || this.who.missingRequirement(game);
    return missingRequirement;
  }

  /** @java SizeTerritory.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    willCrash = willCrash || this.who.willCrash(game);
    return willCrash;
  }

  /** @java SizeTerritory.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.who as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    // Java: type = SiteType.use(type, game);
    if (this.type === null) {
      this.type = (game as unknown as { board?: { defaultSite?: () => SiteType } })
        .board?.defaultSite?.() ?? "Cell";
    }
  }
}
