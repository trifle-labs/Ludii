// @java Core/src/game/equipment/container/Container.java

/**
 * Defines a container (board, hand, dice, etc.).
 *
 * @java game/equipment/container/Container.java
 * @author cambolbro and Eric.Piette
 */

import { Item, type RoleType } from "../Item.js";
import type { ContainerStyleType } from "../../../metadata/graphics/util/ContainerStyleType.js";
import type { SiteType } from "../../../other/action/SiteType.js";

/** Minimal Track interface used by Container. */
export interface TrackLike {
  name(): string;
  owner(): number;
  islooped(): boolean;
}

/**
 * Abstract base class for all containers (Board, Hand, Dice, etc.).
 *
 * @java game/equipment/container/Container.java — abstract Container
 */
export abstract class Container extends Item {
  /** @java Container.numSites */
  protected numSites: number = 0;

  /** @java Container.tracks */
  protected tracks: TrackLike[] = [];

  /** @java Container.ownedTracks */
  protected ownedTracks: TrackLike[][] = [];

  /** @java Container.style */
  protected style: ContainerStyleType | null = null;

  /** @java Container.defaultSite */
  protected defaultSite: SiteType = "Cell";

  /**
   * @java game/equipment/container/Container.java constructor(String, int, RoleType)
   */
  protected constructor(label: string | null, index: number, role: RoleType) {
    super(label, index, role);
    this.setType("Container");
  }

  /**
   * @java Container.createTopology(int, int) — abstract
   */
  public abstract createTopology(beginIndex: number, numEdges: number): void;

  /** @java Container.defaultSite() */
  public getDefaultSite(): SiteType { return this.defaultSite; }

  /** @java Container.numSites() */
  public getNumSites(): number {
    return this.numSites;
  }

  /** @java Container.setNumSites(int) */
  public setNumSites(n: number): void { this.numSites = n; }

  /** @java Container.isHand() */
  public isHand(): boolean { return false; }

  /** @java Container.isDice() */
  public isDice(): boolean { return false; }

  /** @java Container.isDeck() */
  public isDeck(): boolean { return false; }

  /** @java Container.isBoardless() */
  public isBoardless(): boolean { return false; }

  /** @java Container.tracks() */
  public getTracks(): readonly TrackLike[] { return this.tracks; }

  /** @java Container.style() */
  public getStyle(): ContainerStyleType | null { return this.style; }

  /** @java Container.setStyle(ContainerStyleType) */
  public setStyle(st: ContainerStyleType): void { this.style = st; }

  /** @java Container.ownedTracks(int) */
  public getOwnedTracks(owner: number): readonly TrackLike[] {
    if (owner < this.ownedTracks.length) return this.ownedTracks[owner]!;
    return [];
  }

  /** @java Container.setOwnedTrack(Track[][]) */
  public setOwnedTrack(ownedTracks: TrackLike[][]): void {
    this.ownedTracks = ownedTracks;
  }
}
