// @java Features/src/features/spatial/instances/AtomicProposition.java

import type { BitwiseTest, SiteType, State } from "./BitwiseTest.js";
import type { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";

/**
 * An atomic proposition is a test that checks for only a single specific
 * value (either absent or present) in a single specific chunk of a single
 * data vector.
 *
 * @java features/spatial/instances/AtomicProposition.java
 * @author Dennis Soemers
 */

/** @java game.Game */
export interface Game {
  equipment(): {
    components(): Array<Component | null>;
  };
}

/** @java game.equipment.component.Component */
export interface Component {
  owner(): number;
}

//-----------------------------------------------------------------------------

/**
 * Types of state vectors that atomic propositions can apply to
 *
 * @java features.spatial.instances.AtomicProposition.StateVectorTypes
 */
export enum StateVectorTypes {
  /** For propositions that check the Empty chunkset */
  Empty = "Empty",
  /** For propositions that check the Who chunkset */
  Who = "Who",
  /** For propositions that check the What chunkset */
  What = "What",
}

//-----------------------------------------------------------------------------

/**
 * Abstract base class for atomic propositions.
 *
 * @java features.spatial.instances.AtomicProposition
 */
export abstract class AtomicProposition implements BitwiseTest {

  //-------------------------------------------------------------------------

  public hasNoTests(): boolean {
    return false;
  }

  /**
   * Add mask for bits checked by this proposition to given chunkset
   * @param chunkSet
   * @java AtomicProposition.addMaskTo(ChunkSet)
   */
  public abstract addMaskTo(chunkSet: ChunkSet): void;

  /**
   * @return State vector type this atomic proposition applies to.
   * @java AtomicProposition.stateVectorType()
   */
  public abstract stateVectorType(): StateVectorTypes;

  /**
   * @return Which site does this proposition look at?
   * @java AtomicProposition.testedSite()
   */
  public abstract testedSite(): number;

  /**
   * @return What value do we expect to (not) see?
   * @java AtomicProposition.value()
   */
  public abstract value(): number;

  /**
   * @return Do we expect to NOT see the value returned by value()?
   * @java AtomicProposition.negated()
   */
  public abstract negated(): boolean;

  //-------------------------------------------------------------------------

  public abstract matches(state: State): boolean;
  public abstract onlyRequiresSingleMustEmpty(): boolean;
  public abstract onlyRequiresSingleMustWho(): boolean;
  public abstract onlyRequiresSingleMustWhat(): boolean;
  public abstract graphElementType(): SiteType;

  //-------------------------------------------------------------------------

  /**
   * @param other
   * @param game
   * @return Does this proposition being true also prove the given other prop?
   * @java AtomicProposition.provesIfTrue(AtomicProposition, Game)
   */
  public abstract provesIfTrue(other: AtomicProposition, game: Game): boolean;

  /**
   * @param other
   * @param game
   * @return Does this proposition being true disprove the given other prop?
   * @java AtomicProposition.disprovesIfTrue(AtomicProposition, Game)
   */
  public abstract disprovesIfTrue(other: AtomicProposition, game: Game): boolean;

  /**
   * @param other
   * @param game
   * @return Does this proposition being false prove the given other prop?
   * @java AtomicProposition.provesIfFalse(AtomicProposition, Game)
   */
  public abstract provesIfFalse(other: AtomicProposition, game: Game): boolean;

  /**
   * @param other
   * @param game
   * @return Does this proposition being false disprove the given other prop?
   * @java AtomicProposition.disprovesIfFalse(AtomicProposition, Game)
   */
  public abstract disprovesIfFalse(other: AtomicProposition, game: Game): boolean;

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @param player
   * @return List of component IDs owned by given player
   * @java AtomicProposition.ownedComponentIDs(Game, int)
   */
  public static ownedComponentIDs(game: Game, player: number): number[] {
    const owned: number[] = [];
    const components = game.equipment().components();

    for (let i = 0; i < components.length; ++i) {
      const comp = components[i];
      if (comp === null || comp === undefined)
        continue;

      if (comp.owner() === player)
        owned.push(i);
    }

    return owned;
  }

  /**
   * @param game
   * @param compID
   * @return True if and only if, in the given game, the owner of given comp ID doesn't own any other components
   * @java AtomicProposition.ownerOnlyOwns(Game, int)
   */
  public static ownerOnlyOwns(game: Game, compID: number): boolean {
    const components = game.equipment().components();
    const comp = components[compID];
    if (comp === null || comp === undefined) return true;
    const owner = comp.owner();

    for (let i = 0; i < components.length; ++i) {
      if (i === compID)
        continue;

      const c = components[i];
      if (c === null || c === undefined)
        continue;

      if (c.owner() === owner)
        return false;
    }

    return true;
  }

  /**
   * @param game
   * @param player
   * @param compID
   * @return True if and only if, in the given game, given player only owns the given component ID and no other components
   * @java AtomicProposition.playerOnlyOwns(Game, int, int)
   */
  public static playerOnlyOwns(game: Game, player: number, compID: number): boolean {
    const components = game.equipment().components();
    const targetComp = components[compID];
    if (targetComp === null || targetComp === undefined) return false;
    if (targetComp.owner() !== player) return false;

    for (let i = 0; i < components.length; ++i) {
      if (i === compID)
        continue;

      const c = components[i];
      if (c === null || c === undefined)
        continue;

      if (c.owner() === player)
        return false;
    }

    return true;
  }

  //-------------------------------------------------------------------------
}
