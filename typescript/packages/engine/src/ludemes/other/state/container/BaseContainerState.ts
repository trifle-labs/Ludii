// @java Core/src/other/state/container/BaseContainerState.java

import type { ContainerState, SiteType, StateRef, GameRef, ContainerRef, RegionLike } from "./ContainerState.js";
import type { SymmetryValidator } from "../symmetry/SymmetryValidator.js";
import type { ChunkSetLike } from "../zhash/HashedChunkSet.js";
import { SymmetryUtils } from "../symmetry/SymmetryUtils.js";

// Java: Constants.UNDEFINED = -1
const UNDEFINED = -1;

/**
 * Minimal Region implementation for JS (replaces game.util.equipment.Region).
 */
export class Region implements RegionLike {
  private sites_: Set<number>;
  private numSites: number;

  constructor(numSitesOrOther: number | RegionLike) {
    if (typeof numSitesOrOther === "number") {
      this.numSites = numSitesOrOther;
      this.sites_ = new Set();
      for (let i = 0; i < numSitesOrOther; i++) this.sites_.add(i);
    } else {
      const other = numSitesOrOther;
      this.numSites = other.count();
      this.sites_ = new Set(other.sites());
    }
  }

  sites(): number[] { return [...this.sites_]; }
  count(): number { return this.sites_.size; }
  contains(site: number): boolean { return this.sites_.has(site); }
  add(site: number): void { this.sites_.add(site); }
  remove(site: number): void { this.sites_.delete(site); }

  set(numSites: number): void {
    this.numSites = numSites;
    this.sites_ = new Set();
    for (let i = 0; i < numSites; i++) this.sites_.add(i);
  }

  bitSet(): ChunkSetLike {
    // Simplified stub — returns a pseudo ChunkSetLike that answers queries about the region
    const self = this;
    return {
      data: [...this.sites_].reduce((arr: number[], s) => { arr[s] = 1; return arr; }, []),
      chunkSz: 1,
      numCh: this.numSites,
      getChunk: (site: number) => (self.contains(site) ? 1 : 0),
      getAndSetChunk: (site: number, val: number) => {
        const old = self.contains(site) ? 1 : 0;
        if (val) self.add(site); else self.remove(site);
        return old;
      },
      setChunk: (site: number, val: number) => { if (val) self.add(site); else self.remove(site); },
      getBit: (site: number, _loc: number) => (self.contains(site) ? 1 : 0),
      setBit: (site: number, _bit: number, value: boolean) => { if (value) self.add(site); else self.remove(site); },
      numChunks: () => self.numSites,
      chunkSize: () => 1,
      clear: () => { self.sites_.clear(); },
      or: (_src: ChunkSetLike) => {},
      clone: () => self.bitSet(),
      matches: (_m: ChunkSetLike, _p: ChunkSetLike) => false,
      matchesWord: (_wi: number, _m: number, _w: number) => false,
      violatesNot: (_m: ChunkSetLike, _p: ChunkSetLike, _s?: number) => false,
    } as ChunkSetLike;
  }

  hashCode(): number {
    let h = 0;
    for (const s of this.sites_) h = (h * 31 + s) | 0;
    return h;
  }

  equals(other: RegionLike): boolean {
    const a = this.sites();
    const b = other.sites();
    if (a.length !== b.length) return false;
    const bSet = new Set(b);
    return a.every((s) => bSet.has(s));
  }
}

/**
 * Global State for a container item — abstract base class.
 * Faithful 1:1 port of BaseContainerState.java.
 *
 * @author cambolbro, mrraow and tahmina(UF) (Java), ported to TS
 */
export abstract class BaseContainerState implements ContainerState {
  /** Java: private transient Container container */
  private container_: ContainerRef;

  /** Java: private transient String nameFromFile = null */
  private nameFromFile_: string | null = null;

  /** Java: private final Map<Long, Long> canonicalHashLookup */
  private readonly canonicalHashLookup = new Map<number, number>();

  /** Java: protected final Region empty */
  protected readonly empty: Region;

  /** Java: protected final int offset */
  protected readonly offset: number;

  constructor(game: GameRef, container: ContainerRef, numSites: number);
  constructor(other: BaseContainerState);
  constructor(gameOrOther: GameRef | BaseContainerState, container?: ContainerRef, numSites?: number) {
    if (gameOrOther instanceof BaseContainerState) {
      const other = gameOrOther;
      this.container_ = other.container_;
      this.empty = new Region(other.empty);
      this.offset = other.offset;
      // Java: this.canonicalHashLookup = other.canonicalHashLookup (shared ref)
      // We also share (shallow copy) — in Java this map is shared, not deep-copied
      for (const [k, v] of other.canonicalHashLookup) this.canonicalHashLookup.set(k, v);
    } else {
      const game = gameOrOther as GameRef;
      this.container_ = container!;
      const realNumSites = container!.index() === 0
        ? game.board().topology().cells().size()
        : numSites!;
      this.empty = new Region(realNumSites);
      this.offset = game.equipment().sitesFrom()[container!.index()]!;
    }
  }

  /**
   * Java: public void deepCopy(final State trialState, final BaseContainerState other)
   */
  deepCopy(_trialState: StateRef, other: BaseContainerState): void {
    this.container_ = other.container_;
    this.empty.set(other.empty.count());
    for (const s of other.empty.sites()) this.empty.add(s);
  }

  // ---------------------------------------------------------------------------
  // ContainerState interface implementations

  reset(trialState: StateRef, game: GameRef): void {
    const numSites = this.container_.numSites();
    const realNumSites = this.container_.index() === 0
      ? game.board().topology().cells().size()
      : numSites;
    this.empty.set(realNumSites);
  }

  nameFromFile(): string | null { return this.nameFromFile_; }
  container(): ContainerRef { return this.container_; }
  setContainer(cont: ContainerRef): void { this.container_ = cont; }

  emptySites(): number[] { return this.empty.sites(); }
  numEmpty(): number { return this.empty.count(); }

  isEmpty(site: number, type: SiteType): boolean {
    if (type === "Cell" || this.container_.index() !== 0) return this.isEmptyCell(site);
    if (type === "Edge") return this.isEmptyEdge(site);
    return this.isEmptyVertex(site);
  }

  isEmptyVertex(_vertex: number): boolean { return true; }
  isEmptyEdge(_edge: number): boolean { return true; }

  isEmptyCell(site: number): boolean {
    return this.empty.contains(site - this.offset);
  }

  emptyRegion(_type: SiteType): RegionLike { return this.empty; }

  addToEmptyCell(site: number): void { this.empty.add(site - this.offset); }
  removeFromEmptyCell(site: number): void { this.empty.remove(site - this.offset); }
  addToEmptyVertex(_site: number): void {}
  removeFromEmptyVertex(_site: number): void {}
  addToEmptyEdge(_site: number): void {}
  removeFromEmptyEdge(_site: number): void {}

  addToEmpty(site: number, graphType: SiteType): void {
    if (graphType === "Cell" || this.container_.index() !== 0) this.addToEmptyCell(site);
    else if (graphType === "Edge") this.addToEmptyEdge(site);
    else this.addToEmptyVertex(site);
  }

  removeFromEmpty(site: number, graphType: SiteType): void {
    if (graphType === "Cell" || this.container_.index() !== 0) this.removeFromEmptyCell(site);
    else if (graphType === "Edge") this.removeFromEmptyEdge(site);
    else this.removeFromEmptyVertex(site);
  }

  setPlayable(_trialState: StateRef, _site: number, _on: boolean): void {}

  // ---------------------------------------------------------------------------
  // Dispatch methods by SiteType

  what(site: number, graphElementType: SiteType): number;
  what(site: number, level: number, graphElementType: SiteType): number;
  what(site: number, levelOrType: number | SiteType, graphElementType?: SiteType): number {
    if (typeof levelOrType === "string") {
      const t = levelOrType;
      if (t === "Cell" || this.container_.index() !== 0) return this.whatCell(site);
      if (t === "Edge") return this.whatEdge(site);
      return this.whatVertex(site);
    }
    const t = graphElementType!;
    if (t === "Cell" || this.container_.index() !== 0) return this.whatCell(site, levelOrType);
    if (t === "Edge") return this.whatEdge(site, levelOrType);
    return this.whatVertex(site, levelOrType);
  }

  who(site: number, graphElementType: SiteType): number;
  who(site: number, level: number, graphElementType: SiteType): number;
  who(site: number, levelOrType: number | SiteType, graphElementType?: SiteType): number {
    if (typeof levelOrType === "string") {
      const t = levelOrType;
      if (t === "Cell" || this.container_.index() !== 0) return this.whoCell(site);
      if (t === "Edge") return this.whoEdge(site);
      return this.whoVertex(site);
    }
    const t = graphElementType!;
    if (t === "Cell" || this.container_.index() !== 0) return this.whoCell(site, levelOrType);
    if (t === "Edge") return this.whoEdge(site, levelOrType);
    return this.whoVertex(site, levelOrType);
  }

  count(site: number, graphElementType: SiteType): number {
    if (graphElementType === "Cell" || this.container_.index() !== 0) return this.countCell(site);
    if (graphElementType === "Edge") return this.countEdge(site);
    return this.countVertex(site);
  }

  sizeStack(site: number, graphElementType: SiteType): number {
    if (graphElementType === "Cell" || this.container_.index() !== 0) return this.sizeStackCell(site);
    if (graphElementType === "Edge") return this.whatEdge(site) === 0 ? 0 : 1;
    return this.whatVertex(site) === 0 ? 0 : 1;
  }

  state(site: number, graphElementType: SiteType): number;
  state(site: number, level: number, graphElementType: SiteType): number;
  state(site: number, levelOrType: number | SiteType, graphElementType?: SiteType): number {
    if (typeof levelOrType === "string") {
      const t = levelOrType;
      if (t === "Cell" || this.container_.index() !== 0) return this.stateCell(site);
      if (t === "Edge") return this.stateEdge(site);
      return this.stateVertex(site);
    }
    const t = graphElementType!;
    if (t === "Cell" || this.container_.index() !== 0) return this.stateCell(site, levelOrType);
    if (t === "Edge") return this.stateEdge(site, levelOrType);
    return this.stateVertex(site, levelOrType);
  }

  rotation(site: number, graphElementType: SiteType): number;
  rotation(site: number, level: number, graphElementType: SiteType): number;
  rotation(site: number, levelOrType: number | SiteType, graphElementType?: SiteType): number {
    if (typeof levelOrType === "string") {
      const t = levelOrType;
      if (t === "Cell" || this.container_.index() !== 0) return this.rotationCell(site);
      if (t === "Edge") return this.rotationEdge(site);
      return this.rotationVertex(site);
    }
    const t = graphElementType!;
    if (t === "Cell" || this.container_.index() !== 0) return this.rotationCell(site, levelOrType);
    if (t === "Edge") return this.rotationEdge(site, levelOrType);
    return this.rotationVertex(site, levelOrType);
  }

  value(site: number, graphElementType: SiteType): number;
  value(site: number, level: number, graphElementType: SiteType): number;
  value(site: number, levelOrType: number | SiteType, graphElementType?: SiteType): number {
    if (typeof levelOrType === "string") {
      const t = levelOrType;
      if (t === "Cell" || this.container_.index() !== 0) return this.valueCell(site);
      if (t === "Edge") return this.valueEdge(site);
      return this.valueVertex(site);
    }
    const t = graphElementType!;
    if (t === "Cell" || this.container_.index() !== 0) return this.valueCell(site, levelOrType);
    if (t === "Edge") return this.valueEdge(site, levelOrType);
    return this.valueVertex(site, levelOrType);
  }

  // ---------------------------------------------------------------------------
  // Deduction puzzle defaults

  set(_var: number, _value: number, _type: SiteType): void {}
  bit(_index: number, _value: number, _type: SiteType): boolean { return true; }
  isResolvedEdges(_site: number): boolean { return false; }
  isResolvedCell(_site: number): boolean { return false; }
  isResolvedVerts(_site: number): boolean { return false; }
  isResolved(_site: number, _type: SiteType): boolean { return false; }
  values(_type: SiteType, _var: number): Set<number> { return new Set(); }

  // ---------------------------------------------------------------------------
  // canonicalHash

  canonicalHash(validator: SymmetryValidator, gameState: StateRef, whoOnly: boolean): number {
    const topo = this.container_.topology();
    const cellRotates = topo.cellRotationSymmetries() ?? [];
    const cellReflects = topo.cellReflectionSymmetries() ?? [];
    const edgeRotates = topo.edgeRotationSymmetries() ?? [];
    const edgeReflects = topo.edgeReflectionSymmetries() ?? [];
    const vertexRotates = topo.vertexRotationSymmetries() ?? [];
    const vertexReflects = topo.vertexReflectionSymmetries() ?? [];
    const playerPermutations = SymmetryUtils.playerPermutations(gameState.numPlayers());

    const allHashes: number[] = [];
    let canonicalHash = Number.MAX_SAFE_INTEGER;

    for (let playerIdx = 0; playerIdx < playerPermutations.length; playerIdx++) {
      if (!validator.isValid("SUBSTITUTIONS", playerIdx, playerPermutations.length)) continue;

      for (let rotateIdx = 0; rotateIdx < cellRotates.length; rotateIdx++) {
        if (!validator.isValid("ROTATIONS", rotateIdx, cellRotates.length)) continue;

        const hash = this.calcCanonicalHash(
          cellRotates[rotateIdx]!, edgeRotates[rotateIdx]!, vertexRotates[rotateIdx]!,
          playerPermutations[playerIdx]!, whoOnly,
        );
        canonicalHash = Math.min(canonicalHash, hash);
        allHashes.push(hash);

        for (let reflectIdx = 0; reflectIdx < cellReflects.length; reflectIdx++) {
          if (!validator.isValid("REFLECTIONS", reflectIdx, cellReflects.length)) continue;

          const siteRemap = SymmetryUtils.combine(cellReflects[reflectIdx]!, cellRotates[rotateIdx]!);
          const edgeRemap = SymmetryUtils.combine(edgeReflects[reflectIdx]!, edgeRotates[rotateIdx]!);
          const vertexRemap = SymmetryUtils.combine(vertexReflects[reflectIdx]!, vertexRotates[rotateIdx]!);

          const h = this.calcCanonicalHash(siteRemap, edgeRemap, vertexRemap, playerPermutations[playerIdx]!, whoOnly);
          canonicalHash = Math.min(canonicalHash, h);
          allHashes.push(h);
        }
      }
    }

    for (const h of allHashes) this.canonicalHashLookup.set(h, canonicalHash);
    return canonicalHash;
  }

  protected abstract calcCanonicalHash(
    siteRemap: number[],
    edgeRemap: number[],
    vertexRemap: number[],
    playerRemap: number[],
    whoOnly: boolean,
  ): number;

  // ---------------------------------------------------------------------------
  // Abstract methods (cell-level accessors, to be implemented by subclasses)

  abstract whoCell(site: number): number;
  abstract whoCell(site: number, level: number): number;
  abstract whatCell(site: number): number;
  abstract whatCell(site: number, level: number): number;
  abstract countCell(site: number): number;
  abstract stateCell(site: number): number;
  abstract stateCell(site: number, level: number): number;
  abstract rotationCell(site: number): number;
  abstract rotationCell(site: number, level: number): number;
  abstract valueCell(site: number): number;
  abstract valueCell(site: number, level: number): number;
  abstract sizeStackCell(site: number): number;
  abstract isOccupied(site: number): boolean;
  abstract isPlayable(site: number): boolean;

  abstract whoEdge(site: number): number;
  abstract whoEdge(site: number, level: number): number;
  abstract whatEdge(site: number): number;
  abstract whatEdge(site: number, level: number): number;
  abstract countEdge(site: number): number;
  abstract stateEdge(site: number): number;
  abstract stateEdge(site: number, level: number): number;
  abstract rotationEdge(site: number): number;
  abstract rotationEdge(site: number, level: number): number;
  abstract valueEdge(site: number): number;
  abstract valueEdge(site: number, level: number): number;
  abstract sizeStackEdge(site: number): number;

  abstract whoVertex(site: number): number;
  abstract whoVertex(site: number, level: number): number;
  abstract whatVertex(site: number): number;
  abstract whatVertex(site: number, level: number): number;
  abstract countVertex(site: number): number;
  abstract stateVertex(site: number): number;
  abstract stateVertex(site: number, level: number): number;
  abstract rotationVertex(site: number): number;
  abstract rotationVertex(site: number, level: number): number;
  abstract valueVertex(site: number): number;
  abstract valueVertex(site: number, level: number): number;
  abstract sizeStackVertex(site: number): number;

  abstract setSite(
    trialState: StateRef, site: number, who: number, what: number, count: number,
    state: number, rotation: number, value: number, type: SiteType,
  ): void;
  abstract setSite(
    trialState: StateRef, site: number, level: number, whoVal: number, whatVal: number,
    countVal: number, stateVal: number, rotationVal: number, valueVal: number,
  ): void;

  abstract remove(state: StateRef, site: number, type: SiteType): number;
  abstract remove(state: StateRef, site: number, level: number, type: SiteType): number;
  abstract remove(state: StateRef, site: number, level: number): number;

  abstract deepClone(): ContainerState;
  abstract setValueCell(state: StateRef, site: number, value: number): void;
  abstract setCount(state: StateRef, site: number, count: number): void;

  abstract addItem(trialState: StateRef, site: number, what: number, who: number, game: GameRef): void;
  abstract addItem(trialState: StateRef, site: number, what: number, who: number, stateVal: number, rotationVal: number, value: number, game: GameRef): void;
  abstract addItem(trialState: StateRef, site: number, what: number, who: number, game: GameRef, hidden: boolean[], masked: boolean): void;
  abstract insert(trialState: StateRef, type: SiteType, site: number, level: number, what: number, who: number, state: number, rotation: number, value: number, game: GameRef): void;
  abstract insertCell(trialState: StateRef, site: number, level: number, what: number, who: number, state: number, rotation: number, value: number, game: GameRef): void;
  abstract removeStack(state: StateRef, site: number): void;

  abstract addItemVertex(trialState: StateRef, site: number, what: number, who: number, game: GameRef): void;
  abstract addItemVertex(trialState: StateRef, site: number, what: number, who: number, stateVal: number, rotationVal: number, value: number, game: GameRef): void;
  abstract addItemVertex(trialState: StateRef, site: number, what: number, who: number, game: GameRef, hidden: boolean[], masked: boolean): void;
  abstract insertVertex(trialState: StateRef, site: number, level: number, what: number, who: number, state: number, rotation: number, value: number, game: GameRef): void;
  abstract removeStackVertex(state: StateRef, site: number): void;

  abstract addItemEdge(trialState: StateRef, site: number, what: number, who: number, game: GameRef): void;
  abstract addItemEdge(trialState: StateRef, site: number, what: number, who: number, stateVal: number, rotationVal: number, value: number, game: GameRef): void;
  abstract addItemEdge(trialState: StateRef, site: number, what: number, who: number, game: GameRef, hidden: boolean[], masked: boolean): void;
  abstract insertEdge(trialState: StateRef, site: number, level: number, what: number, who: number, state: number, rotation: number, value: number, game: GameRef): void;
  abstract removeStackEdge(state: StateRef, site: number): void;

  abstract addItemGeneric(trialState: StateRef, site: number, what: number, who: number, game: GameRef, graphElementType: SiteType): void;
  abstract addItemGeneric(trialState: StateRef, site: number, what: number, who: number, stateVal: number, rotationVal: number, value: number, game: GameRef, graphElementType: SiteType): void;
  abstract addItemGeneric(trialState: StateRef, site: number, what: number, who: number, game: GameRef, hidden: boolean[], masked: boolean, graphElementType: SiteType): void;
  abstract removeStackGeneric(state: StateRef, site: number, graphElementType: SiteType): void;

  abstract isHidden(who: number, site: number, level: number, type: SiteType): boolean;
  abstract isHiddenWhat(who: number, site: number, level: number, type: SiteType): boolean;
  abstract isHiddenWho(who: number, site: number, level: number, type: SiteType): boolean;
  abstract isHiddenState(who: number, site: number, level: number, type: SiteType): boolean;
  abstract isHiddenValue(who: number, site: number, level: number, type: SiteType): boolean;
  abstract isHiddenRotation(who: number, site: number, level: number, type: SiteType): boolean;
  abstract isHiddenCount(who: number, site: number, level: number, type: SiteType): boolean;
  abstract setHidden(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  abstract setHiddenWhat(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  abstract setHiddenWho(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  abstract setHiddenState(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  abstract setHiddenValue(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  abstract setHiddenRotation(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;
  abstract setHiddenCount(state: StateRef, who: number, site: number, level: number, type: SiteType, on: boolean): void;

  abstract emptyChunkSetVertex(): ChunkSetLike | null;
  abstract emptyChunkSetCell(): ChunkSetLike | null;
  abstract emptyChunkSetEdge(): ChunkSetLike | null;
  abstract numChunksWhoVertex(): number;
  abstract numChunksWhoCell(): number;
  abstract numChunksWhoEdge(): number;
  abstract chunkSizeWhoVertex(): number;
  abstract chunkSizeWhoCell(): number;
  abstract chunkSizeWhoEdge(): number;
  abstract numChunksWhatVertex(): number;
  abstract numChunksWhatCell(): number;
  abstract numChunksWhatEdge(): number;
  abstract chunkSizeWhatVertex(): number;
  abstract chunkSizeWhatCell(): number;
  abstract chunkSizeWhatEdge(): number;

  abstract matchesWhoVertex(maskOrWordIdx: ChunkSetLike | number, patternOrMask: ChunkSetLike | number, matchingWord?: number): boolean;
  abstract matchesWhoCell(maskOrWordIdx: ChunkSetLike | number, patternOrMask: ChunkSetLike | number, matchingWord?: number): boolean;
  abstract matchesWhoEdge(maskOrWordIdx: ChunkSetLike | number, patternOrMask: ChunkSetLike | number, matchingWord?: number): boolean;
  abstract matchesWhatVertex(maskOrWordIdx: ChunkSetLike | number, patternOrMask: ChunkSetLike | number, matchingWord?: number): boolean;
  abstract matchesWhatCell(maskOrWordIdx: ChunkSetLike | number, patternOrMask: ChunkSetLike | number, matchingWord?: number): boolean;
  abstract matchesWhatEdge(maskOrWordIdx: ChunkSetLike | number, patternOrMask: ChunkSetLike | number, matchingWord?: number): boolean;
  abstract violatesNotWhoVertex(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  abstract violatesNotWhoCell(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  abstract violatesNotWhoEdge(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  abstract violatesNotWhatVertex(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  abstract violatesNotWhatCell(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  abstract violatesNotWhatEdge(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean;
  abstract cloneWhoVertex(): ChunkSetLike | null;
  abstract cloneWhoCell(): ChunkSetLike | null;
  abstract cloneWhoEdge(): ChunkSetLike | null;
  abstract cloneWhatVertex(): ChunkSetLike | null;
  abstract cloneWhatCell(): ChunkSetLike | null;
  abstract cloneWhatEdge(): ChunkSetLike | null;
}
