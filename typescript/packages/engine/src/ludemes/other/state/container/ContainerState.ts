// @java Core/src/other/state/container/ContainerState.java

import type { SymmetryValidator } from "../symmetry/SymmetryValidator.js";
import type { ChunkSetLike } from "../zhash/HashedChunkSet.js";

export type SiteType = "Cell" | "Edge" | "Vertex";

/** Minimal State hook used by ContainerState methods. */
export interface StateRef {
  updateStateHash(delta: number): void;
  numPlayers(): number;
}

/** Minimal Game reference. */
export interface GameRef {
  players(): { count(): number };
  board(): { topology(): { cells(): { size(): number } } };
  equipment(): { sitesFrom(): number[] };
  isBoardless(): boolean;
  gameFlags(): bigint;
}

/** Minimal Container reference. */
export interface ContainerRef {
  index(): number;
  name(): string;
  numSites(): number;
  isHand(): boolean;
  topology(): {
    cells(): Array<{ adjacent(): Array<{ index(): number }> }>;
    cellRotationSymmetries(): number[][] | null;
    cellReflectionSymmetries(): number[][];
    edgeRotationSymmetries(): number[][];
    edgeReflectionSymmetries(): number[][];
    vertexRotationSymmetries(): number[][];
    vertexReflectionSymmetries(): number[][];
  };
}

/** Minimal Region type. */
export interface RegionLike {
  sites(): number[];
  count(): number;
  contains(site: number): boolean;
  add(site: number): void;
  remove(site: number): void;
  set(numSites: number): void;
  bitSet(): ChunkSetLike;
  hashCode(): number;
  equals(other: RegionLike): boolean;
}

/**
 * Common ContainerState methods.
 * Faithful 1:1 port of ContainerState.java (interface).
 *
 * @author mrraow, cambolbro, Eric.Piette and Dennis Soemers (Java), ported to TS
 */
export interface ContainerState {
  /** Reset this state. Manages hashes if any. */
  reset(trialState: StateRef, game: GameRef): void;

  /** Removes the item(s) at site. Returns the index of the component removed, or 0 if none. */
  remove(state: StateRef, site: number, type: SiteType): number;
  /** Removes the item(s) at site and level. Returns the index of the component removed, or 0 if none. */
  remove(state: StateRef, site: number, level: number, type: SiteType): number;
  /** Remove by site + level (no SiteType). */
  remove(state: StateRef, site: number, level: number): number;

  /** Deep copy of self. */
  deepClone(): ContainerState;

  /** Returns canonical (lowest) hash value from allowed symmetries. */
  canonicalHash(validator: SymmetryValidator, state: StateRef, whoOnly: boolean): number;

  /** Collection of empty sites. */
  emptySites(): number[];

  /** Number of empty sites. */
  numEmpty(): number;

  isEmpty(site: number, type: SiteType): boolean;
  isEmptyCell(cell: number): boolean;
  isEmptyEdge(edge: number): boolean;
  isEmptyVertex(vertex: number): boolean;

  emptyRegion(type: SiteType): RegionLike;
  addToEmptyCell(site: number): void;
  addToEmpty(site: number, type: SiteType): void;
  removeFromEmpty(site: number, type: SiteType): void;
  removeFromEmptyCell(site: number): void;
  addToEmptyVertex(site: number): void;
  removeFromEmptyVertex(site: number): void;
  addToEmptyEdge(site: number): void;
  removeFromEmptyEdge(site: number): void;

  container(): ContainerRef;
  setContainer(cont: ContainerRef): void;
  nameFromFile(): string | null;
  setPlayable(trialState: StateRef, site: number, on: boolean): void;

  setSite(trialState: StateRef, site: number, who: number, what: number, count: number, state: number, rotation: number, value: number, type: SiteType): void;
  setSite(trialState: StateRef, site: number, level: number, whoVal: number, whatVal: number, countVal: number, stateVal: number, rotationVal: number, valueVal: number): void;

  whoCell(site: number): number;
  whoCell(site: number, level: number): number;
  whatCell(site: number): number;
  whatCell(site: number, level: number): number;
  countCell(site: number): number;
  stateCell(site: number): number;
  stateCell(site: number, level: number): number;
  rotationCell(site: number): number;
  rotationCell(site: number, level: number): number;
  valueCell(site: number): number;
  valueCell(site: number, level: number): number;
  isPlayable(site: number): boolean;
  isOccupied(site: number): boolean;
  sizeStackCell(site: number): number;

  whoEdge(site: number): number;
  whoEdge(site: number, level: number): number;
  whatEdge(site: number): number;
  whatEdge(site: number, level: number): number;
  countEdge(site: number): number;
  stateEdge(site: number): number;
  stateEdge(site: number, level: number): number;
  rotationEdge(site: number): number;
  rotationEdge(site: number, level: number): number;
  valueEdge(site: number): number;
  valueEdge(site: number, level: number): number;
  sizeStackEdge(site: number): number;

  whoVertex(site: number): number;
  whoVertex(site: number, level: number): number;
  whatVertex(site: number): number;
  whatVertex(site: number, level: number): number;
  countVertex(site: number): number;
  stateVertex(site: number): number;
  stateVertex(site: number, level: number): number;
  rotationVertex(site: number): number;
  rotationVertex(site: number, level: number): number;
  valueVertex(site: number): number;
  valueVertex(site: number, level: number): number;
  sizeStackVertex(site: number): number;

  what(site: number, graphElementType: SiteType): number;
  who(site: number, graphElementType: SiteType): number;
  count(site: number, graphElementType: SiteType): number;
  sizeStack(site: number, graphElementType: SiteType): number;
  state(site: number, graphElementType: SiteType): number;
  rotation(site: number, graphElementType: SiteType): number;
  value(site: number, graphElementType: SiteType): number;

  what(site: number, level: number, graphElementType: SiteType): number;
  who(site: number, level: number, graphElementType: SiteType): number;
  state(site: number, level: number, graphElementType: SiteType): number;
  rotation(site: number, level: number, graphElementType: SiteType): number;
  value(site: number, level: number, graphElementType: SiteType): number;

  setValueCell(state: StateRef, site: number, value: number): void;

  addItemGeneric(trialState: StateRef, site: number, what: number, who: number, game: GameRef, graphElementType: SiteType): void;
  addItemGeneric(trialState: StateRef, site: number, what: number, who: number, stateVal: number, rotationVal: number, value: number, game: GameRef, graphElementType: SiteType): void;
  addItemGeneric(trialState: StateRef, site: number, what: number, who: number, game: GameRef, hidden: boolean[], masked: boolean, graphElementType: SiteType): void;
  removeStackGeneric(state: StateRef, site: number, graphElementType: SiteType): void;
  setCount(state: StateRef, site: number, count: number): void;

  addItem(trialState: StateRef, site: number, what: number, who: number, game: GameRef): void;
  addItem(trialState: StateRef, site: number, what: number, who: number, stateVal: number, rotationVal: number, value: number, game: GameRef): void;
  addItem(trialState: StateRef, site: number, what: number, who: number, game: GameRef, hidden: boolean[], masked: boolean): void;
  insert(trialState: StateRef, type: SiteType, site: number, level: number, what: number, who: number, state: number, rotation: number, value: number, game: GameRef): void;
  insertCell(trialState: StateRef, site: number, level: number, what: number, who: number, state: number, rotation: number, value: number, game: GameRef): void;
  removeStack(state: StateRef, site: number): void;

  addItemVertex(trialState: StateRef, site: number, what: number, who: number, game: GameRef): void;
  addItemVertex(trialState: StateRef, site: number, what: number, who: number, stateVal: number, rotationVal: number, value: number, game: GameRef): void;
  addItemVertex(trialState: StateRef, site: number, what: number, who: number, game: GameRef, hidden: boolean[], masked: boolean): void;
  insertVertex(trialState: StateRef, site: number, level: number, what: number, who: number, state: number, rotation: number, value: number, game: GameRef): void;
  removeStackVertex(state: StateRef, site: number): void;

  addItemEdge(trialState: StateRef, site: number, what: number, who: number, game: GameRef): void;
  addItemEdge(trialState: StateRef, site: number, what: number, who: number, stateVal: number, rotationVal: number, value: number, game: GameRef): void;
  addItemEdge(trialState: StateRef, site: number, what: number, who: number, game: GameRef, hidden: boolean[], masked: boolean): void;
  insertEdge(trialState: StateRef, site: number, level: number, what: number, who: number, state: number, rotation: number, value: number, game: GameRef): void;
  removeStackEdge(state: StateRef, site: number): void;

  // Hidden info
  isHidden(who: number, site: number, level: number, type: SiteType): boolean;
  isHiddenWhat(who: number, site: number, level: number, type: SiteType): boolean;
  isHiddenWho(who: number, site: number, level: number, type: SiteType): boolean;
  isHiddenState(who: number, site: number, level: number, type: SiteType): boolean;
  isHiddenValue(who: number, site: number, level: number, type: SiteType): boolean;
  isHiddenRotation(who: number, site: number, level: number, type: SiteType): boolean;
  isHiddenCount(who: number, site: number, level: number, type: SiteType): boolean;
  setHidden(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  setHiddenWhat(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  setHiddenWho(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  setHiddenState(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  setHiddenValue(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  setHiddenRotation(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  setHiddenCount(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;

  // Deduction puzzle
  bit(varSite: number, value: number, type: SiteType): boolean;
  isResolved(varSite: number, type: SiteType): boolean;
  isResolvedEdges(varSite: number): boolean;
  isResolvedCell(varSite: number): boolean;
  isResolvedVerts(varSite: number): boolean;
  set(varSite: number, value: number, type: SiteType): void;
  values(type: SiteType, varSite: number): Set<number>;

  emptyChunkSetVertex(): ChunkSetLike | null;
  emptyChunkSetCell(): ChunkSetLike | null;
  emptyChunkSetEdge(): ChunkSetLike | null;

  numChunksWhoVertex(): number;
  numChunksWhoCell(): number;
  numChunksWhoEdge(): number;
  chunkSizeWhoVertex(): number;
  chunkSizeWhoCell(): number;
  chunkSizeWhoEdge(): number;
  numChunksWhatVertex(): number;
  numChunksWhatCell(): number;
  numChunksWhatEdge(): number;
  chunkSizeWhatVertex(): number;
  chunkSizeWhatCell(): number;
  chunkSizeWhatEdge(): number;

  matchesWhoVertex(mask: ChunkSetLike, pattern: ChunkSetLike): boolean;
  matchesWhoCell(mask: ChunkSetLike, pattern: ChunkSetLike): boolean;
  matchesWhoEdge(mask: ChunkSetLike, pattern: ChunkSetLike): boolean;
  matchesWhatVertex(mask: ChunkSetLike, pattern: ChunkSetLike): boolean;
  matchesWhatCell(mask: ChunkSetLike, pattern: ChunkSetLike): boolean;
  matchesWhatEdge(mask: ChunkSetLike, pattern: ChunkSetLike): boolean;

  matchesWhoVertex(wordIdx: number, mask: number, matchingWord: number): boolean;
  matchesWhoCell(wordIdx: number, mask: number, matchingWord: number): boolean;
  matchesWhoEdge(wordIdx: number, mask: number, matchingWord: number): boolean;
  matchesWhatVertex(wordIdx: number, mask: number, matchingWord: number): boolean;
  matchesWhatCell(wordIdx: number, mask: number, matchingWord: number): boolean;
  matchesWhatEdge(wordIdx: number, mask: number, matchingWord: number): boolean;

  violatesNotWhoVertex(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  violatesNotWhoCell(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  violatesNotWhoEdge(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  violatesNotWhatVertex(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  violatesNotWhatCell(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  violatesNotWhatEdge(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;

  cloneWhoVertex(): ChunkSetLike | null;
  cloneWhoCell(): ChunkSetLike | null;
  cloneWhoEdge(): ChunkSetLike | null;
  cloneWhatVertex(): ChunkSetLike | null;
  cloneWhatCell(): ChunkSetLike | null;
  cloneWhatEdge(): ChunkSetLike | null;
}
