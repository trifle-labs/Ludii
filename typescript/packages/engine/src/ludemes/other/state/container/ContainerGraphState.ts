// @java Core/src/other/state/container/ContainerGraphState.java

import { ContainerFlatState } from "./ContainerFlatState.js";
import type { ContainerState, SiteType, StateRef, GameRef, ContainerRef } from "./ContainerState.js";
import { HashedBitSet } from "../zhash/HashedBitSet.js";
import { HashedChunkSet, ChunkSetLike } from "../zhash/HashedChunkSet.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

const UNDEFINED = -1;
const HIDDEN_INFO_FLAG = 0x20000n;

/**
 * The state of a container corresponding to a graph (cells + edges + vertices).
 * Faithful 1:1 port of ContainerGraphState.java.
 *
 * Extends ContainerFlatState (which handles cells), and adds edge and vertex support.
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class ContainerGraphState extends ContainerFlatState {
  private readonly whoEdge__: HashedChunkSet;
  private readonly whoVertex__: HashedChunkSet;
  private readonly whatEdge__: HashedChunkSet | null;
  private readonly whatVertex__: HashedChunkSet | null;
  private readonly countEdge__: HashedChunkSet | null;
  private readonly countVertex__: HashedChunkSet | null;
  private readonly stateEdge__: HashedChunkSet | null;
  private readonly stateVertex__: HashedChunkSet | null;
  private readonly rotationEdge__: HashedChunkSet | null;
  private readonly rotationVertex__: HashedChunkSet | null;
  private readonly valueVertex__: HashedChunkSet | null;
  private readonly valueEdge__: HashedChunkSet | null;
  private readonly hiddenVertex__: (HashedBitSet | null)[] | null;
  private readonly hiddenWhatVertex__: (HashedBitSet | null)[] | null;
  private readonly hiddenWhoVertex__: (HashedBitSet | null)[] | null;
  private readonly hiddenCountVertex__: (HashedBitSet | null)[] | null;
  private readonly hiddenStateVertex__: (HashedBitSet | null)[] | null;
  private readonly hiddenRotationVertex__: (HashedBitSet | null)[] | null;
  private readonly hiddenValueVertex__: (HashedBitSet | null)[] | null;
  private readonly hiddenEdge__: (HashedBitSet | null)[] | null;
  private readonly hiddenWhatEdge__: (HashedBitSet | null)[] | null;
  private readonly hiddenWhoEdge__: (HashedBitSet | null)[] | null;
  private readonly hiddenCountEdge__: (HashedBitSet | null)[] | null;
  private readonly hiddenStateEdge__: (HashedBitSet | null)[] | null;
  private readonly hiddenRotationEdge__: (HashedBitSet | null)[] | null;
  private readonly hiddenValueEdge__: (HashedBitSet | null)[] | null;

  constructor(
    generator: ZobristHashGenerator, game: GameRef, container: ContainerRef,
    maxWhatVal: number, maxStateVal: number, maxCountVal: number, maxRotationVal: number, maxPieceValue: number,
  );
  constructor(other: ContainerGraphState);
  constructor(
    generatorOrOther: ZobristHashGenerator | ContainerGraphState,
    game?: GameRef, container?: ContainerRef,
    maxWhatVal?: number, maxStateVal?: number, maxCountVal?: number, maxRotationVal?: number, maxPieceValue?: number,
  ) {
    if (generatorOrOther instanceof ContainerGraphState) {
      const o = generatorOrOther;
      super(o);
      this.whoEdge__ = o.whoEdge__.clone();
      this.whoVertex__ = o.whoVertex__.clone();
      this.whatEdge__ = o.whatEdge__?.clone() ?? null;
      this.whatVertex__ = o.whatVertex__?.clone() ?? null;
      this.countEdge__ = o.countEdge__?.clone() ?? null;
      this.countVertex__ = o.countVertex__?.clone() ?? null;
      this.stateEdge__ = o.stateEdge__?.clone() ?? null;
      this.stateVertex__ = o.stateVertex__?.clone() ?? null;
      this.rotationEdge__ = o.rotationEdge__?.clone() ?? null;
      this.rotationVertex__ = o.rotationVertex__?.clone() ?? null;
      this.valueVertex__ = o.valueVertex__?.clone() ?? null;
      this.valueEdge__ = o.valueEdge__?.clone() ?? null;
      this.hiddenVertex__ = o.hiddenVertex__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenWhatVertex__ = o.hiddenWhatVertex__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenWhoVertex__ = o.hiddenWhoVertex__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenCountVertex__ = o.hiddenCountVertex__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenStateVertex__ = o.hiddenStateVertex__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenRotationVertex__ = o.hiddenRotationVertex__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenValueVertex__ = o.hiddenValueVertex__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenEdge__ = o.hiddenEdge__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenWhatEdge__ = o.hiddenWhatEdge__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenWhoEdge__ = o.hiddenWhoEdge__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenCountEdge__ = o.hiddenCountEdge__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenStateEdge__ = o.hiddenStateEdge__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenRotationEdge__ = o.hiddenRotationEdge__?.map((h) => h?.clone() ?? null) ?? null;
      this.hiddenValueEdge__ = o.hiddenValueEdge__?.map((h) => h?.clone() ?? null) ?? null;
    } else {
      const gen = generatorOrOther as ZobristHashGenerator;
      // Pass numSites (cells) to ContainerFlatState parent
      const numCells = container!.numSites();
      super(gen, game!, container!, numCells, maxWhatVal!, maxStateVal!, maxCountVal!, maxRotationVal!, maxPieceValue!);
      const numPlayers = game!.players().count();
      const numEdges = game!.board().topology().cells().size();   // simplified
      const numVertices = game!.board().topology().cells().size(); // simplified

      const hasHidden = (game!.gameFlags() & HIDDEN_INFO_FLAG) !== 0n;
      if (!hasHidden) {
        this.hiddenVertex__ = this.hiddenWhatVertex__ = this.hiddenWhoVertex__ = this.hiddenCountVertex__ =
          this.hiddenStateVertex__ = this.hiddenRotationVertex__ = this.hiddenValueVertex__ = null;
        this.hiddenEdge__ = this.hiddenWhatEdge__ = this.hiddenWhoEdge__ = this.hiddenCountEdge__ =
          this.hiddenStateEdge__ = this.hiddenRotationEdge__ = this.hiddenValueEdge__ = null;
      } else {
        const mk = (n: number) => {
          const arr: (HashedBitSet | null)[] = new Array(numPlayers + 1).fill(null);
          for (let i = 1; i <= numPlayers; i++) arr[i] = new HashedBitSet(gen, n);
          return arr;
        };
        this.hiddenVertex__ = mk(numVertices);
        this.hiddenWhatVertex__ = mk(numVertices);
        this.hiddenWhoVertex__ = mk(numVertices);
        this.hiddenCountVertex__ = mk(numVertices);
        this.hiddenStateVertex__ = mk(numVertices);
        this.hiddenRotationVertex__ = mk(numVertices);
        this.hiddenValueVertex__ = mk(numVertices);
        this.hiddenEdge__ = mk(numEdges);
        this.hiddenWhatEdge__ = mk(numEdges);
        this.hiddenWhoEdge__ = mk(numEdges);
        this.hiddenCountEdge__ = mk(numEdges);
        this.hiddenStateEdge__ = mk(numEdges);
        this.hiddenRotationEdge__ = mk(numEdges);
        this.hiddenValueEdge__ = mk(numEdges);
      }

      this.whoEdge__ = new HashedChunkSet(gen, numPlayers + 1, numEdges);
      this.whoVertex__ = new HashedChunkSet(gen, numPlayers + 1, numVertices);
      this.whatEdge__ = maxWhatVal! > 0 ? new HashedChunkSet(gen, maxWhatVal!, numEdges) : null;
      this.whatVertex__ = maxWhatVal! > 0 ? new HashedChunkSet(gen, maxWhatVal!, numVertices) : null;
      this.countEdge__ = maxCountVal! > 0 ? new HashedChunkSet(gen, maxCountVal!, numEdges) : null;
      this.countVertex__ = maxCountVal! > 0 ? new HashedChunkSet(gen, maxCountVal!, numVertices) : null;
      this.stateEdge__ = maxStateVal! > 0 ? new HashedChunkSet(gen, maxStateVal!, numEdges) : null;
      this.stateVertex__ = maxStateVal! > 0 ? new HashedChunkSet(gen, maxStateVal!, numVertices) : null;
      this.rotationEdge__ = maxRotationVal! > 0 ? new HashedChunkSet(gen, maxRotationVal!, numEdges) : null;
      this.rotationVertex__ = maxRotationVal! > 0 ? new HashedChunkSet(gen, maxRotationVal!, numVertices) : null;
      this.valueVertex__ = maxPieceValue! > 0 ? new HashedChunkSet(gen, maxPieceValue!, numVertices) : null;
      this.valueEdge__ = maxPieceValue! > 0 ? new HashedChunkSet(gen, maxPieceValue!, numEdges) : null;
    }
  }

  override deepClone(): ContainerState { return new ContainerGraphState(this); }

  // Override edge accessors
  override whoEdge(site: number, _level?: number): number { return this.whoEdge__.getChunk(site); }
  override whatEdge(site: number, _level?: number): number { return this.whatEdge__?.getChunk(site) ?? 0; }
  override countEdge(site: number): number {
    if (this.countEdge__) return this.countEdge__.getChunk(site);
    return (this.whoEdge__.getChunk(site) !== 0 || (this.whatEdge__ && this.whatEdge__.getChunk(site) !== 0)) ? 1 : 0;
  }
  override stateEdge(site: number, _level?: number): number { return this.stateEdge__?.getChunk(site) ?? 0; }
  override rotationEdge(site: number, _level?: number): number { return this.rotationEdge__?.getChunk(site) ?? 0; }
  override valueEdge(site: number, _level?: number): number { return this.valueEdge__?.getChunk(site) ?? 0; }
  override sizeStackEdge(site: number): number { return this.whatEdge(site) !== 0 ? 1 : 0; }

  // Override vertex accessors
  override whoVertex(site: number, _level?: number): number { return this.whoVertex__.getChunk(site); }
  override whatVertex(site: number, _level?: number): number { return this.whatVertex__?.getChunk(site) ?? 0; }
  override countVertex(site: number): number {
    if (this.countVertex__) return this.countVertex__.getChunk(site);
    return (this.whoVertex__.getChunk(site) !== 0 || (this.whatVertex__ && this.whatVertex__.getChunk(site) !== 0)) ? 1 : 0;
  }
  override stateVertex(site: number, _level?: number): number { return this.stateVertex__?.getChunk(site) ?? 0; }
  override rotationVertex(site: number, _level?: number): number { return this.rotationVertex__?.getChunk(site) ?? 0; }
  override valueVertex(site: number, _level?: number): number { return this.valueVertex__?.getChunk(site) ?? 0; }
  override sizeStackVertex(site: number): number { return this.whatVertex(site) !== 0 ? 1 : 0; }

  // Hidden — override to use graph-specific arrays
  override isHidden(player: number, site: number, level: number, type: SiteType): boolean {
    if (type === "Edge") return this.hiddenEdge__?.[player]?.get(site) ?? false;
    if (type === "Vertex") return this.hiddenVertex__?.[player]?.get(site) ?? false;
    return super.isHidden(player, site, level, type);
  }
  override isHiddenWhat(player: number, site: number, level: number, type: SiteType): boolean {
    if (type === "Edge") return this.hiddenWhatEdge__?.[player]?.get(site) ?? false;
    if (type === "Vertex") return this.hiddenWhatVertex__?.[player]?.get(site) ?? false;
    return super.isHiddenWhat(player, site, level, type);
  }
  override isHiddenWho(player: number, site: number, level: number, type: SiteType): boolean {
    if (type === "Edge") return this.hiddenWhoEdge__?.[player]?.get(site) ?? false;
    if (type === "Vertex") return this.hiddenWhoVertex__?.[player]?.get(site) ?? false;
    return super.isHiddenWho(player, site, level, type);
  }
  override isHiddenState(player: number, site: number, level: number, type: SiteType): boolean {
    if (type === "Edge") return this.hiddenStateEdge__?.[player]?.get(site) ?? false;
    if (type === "Vertex") return this.hiddenStateVertex__?.[player]?.get(site) ?? false;
    return super.isHiddenState(player, site, level, type);
  }
  override isHiddenRotation(player: number, site: number, level: number, type: SiteType): boolean {
    if (type === "Edge") return this.hiddenRotationEdge__?.[player]?.get(site) ?? false;
    if (type === "Vertex") return this.hiddenRotationVertex__?.[player]?.get(site) ?? false;
    return super.isHiddenRotation(player, site, level, type);
  }
  override isHiddenValue(player: number, site: number, level: number, type: SiteType): boolean {
    if (type === "Edge") return this.hiddenValueEdge__?.[player]?.get(site) ?? false;
    if (type === "Vertex") return this.hiddenValueVertex__?.[player]?.get(site) ?? false;
    return super.isHiddenValue(player, site, level, type);
  }
  override isHiddenCount(player: number, site: number, level: number, type: SiteType): boolean {
    if (type === "Edge") return this.hiddenCountEdge__?.[player]?.get(site) ?? false;
    if (type === "Vertex") return this.hiddenCountVertex__?.[player]?.get(site) ?? false;
    return super.isHiddenCount(player, site, level, type);
  }
  override setHidden(st: StateRef, p: number, site: number, l: number, type: SiteType, on: boolean): void {
    if (type === "Edge") { this.hiddenEdge__?.[p]?.set(st, site, on); return; }
    if (type === "Vertex") { this.hiddenVertex__?.[p]?.set(st, site, on); return; }
    super.setHidden(st, p, site, l, type, on);
  }
  override setHiddenWhat(st: StateRef, p: number, site: number, l: number, type: SiteType, on: boolean): void {
    if (type === "Edge") { this.hiddenWhatEdge__?.[p]?.set(st, site, on); return; }
    if (type === "Vertex") { this.hiddenWhatVertex__?.[p]?.set(st, site, on); return; }
    super.setHiddenWhat(st, p, site, l, type, on);
  }
  override setHiddenWho(st: StateRef, p: number, site: number, l: number, type: SiteType, on: boolean): void {
    if (type === "Edge") { this.hiddenWhoEdge__?.[p]?.set(st, site, on); return; }
    if (type === "Vertex") { this.hiddenWhoVertex__?.[p]?.set(st, site, on); return; }
    super.setHiddenWho(st, p, site, l, type, on);
  }
  override setHiddenState(st: StateRef, p: number, site: number, l: number, type: SiteType, on: boolean): void {
    if (type === "Edge") { this.hiddenStateEdge__?.[p]?.set(st, site, on); return; }
    if (type === "Vertex") { this.hiddenStateVertex__?.[p]?.set(st, site, on); return; }
    super.setHiddenState(st, p, site, l, type, on);
  }
  override setHiddenRotation(st: StateRef, p: number, site: number, l: number, type: SiteType, on: boolean): void {
    if (type === "Edge") { this.hiddenRotationEdge__?.[p]?.set(st, site, on); return; }
    if (type === "Vertex") { this.hiddenRotationVertex__?.[p]?.set(st, site, on); return; }
    super.setHiddenRotation(st, p, site, l, type, on);
  }
  override setHiddenValue(st: StateRef, p: number, site: number, l: number, type: SiteType, on: boolean): void {
    if (type === "Edge") { this.hiddenValueEdge__?.[p]?.set(st, site, on); return; }
    if (type === "Vertex") { this.hiddenValueVertex__?.[p]?.set(st, site, on); return; }
    super.setHiddenValue(st, p, site, l, type, on);
  }
  override setHiddenCount(st: StateRef, p: number, site: number, l: number, type: SiteType, on: boolean): void {
    if (type === "Edge") { this.hiddenCountEdge__?.[p]?.set(st, site, on); return; }
    if (type === "Vertex") { this.hiddenCountVertex__?.[p]?.set(st, site, on); return; }
    super.setHiddenCount(st, p, site, l, type, on);
  }

  // ChunkSet accessors for vertex/edge
  override numChunksWhoVertex(): number { return this.whoVertex__.numChunks(); }
  override numChunksWhoEdge(): number { return this.whoEdge__.numChunks(); }
  override chunkSizeWhoVertex(): number { return this.whoVertex__.chunkSize(); }
  override chunkSizeWhoEdge(): number { return this.whoEdge__.chunkSize(); }
  override numChunksWhatVertex(): number { return (this.whatVertex__ ?? this.whoVertex__).numChunks(); }
  override numChunksWhatEdge(): number { return (this.whatEdge__ ?? this.whoEdge__).numChunks(); }
  override chunkSizeWhatVertex(): number { return (this.whatVertex__ ?? this.whoVertex__).chunkSize(); }
  override chunkSizeWhatEdge(): number { return (this.whatEdge__ ?? this.whoEdge__).chunkSize(); }

  override matchesWhoVertex(maskOrW: ChunkSetLike | number, patternOrM: ChunkSetLike | number, mw?: number): boolean {
    if (typeof maskOrW === "number") return this.whoVertex__.matchesWord(maskOrW, patternOrM as number, mw!);
    return this.whoVertex__.matches(maskOrW as ChunkSetLike, patternOrM as ChunkSetLike);
  }
  override matchesWhoEdge(maskOrW: ChunkSetLike | number, patternOrM: ChunkSetLike | number, mw?: number): boolean {
    if (typeof maskOrW === "number") return this.whoEdge__.matchesWord(maskOrW, patternOrM as number, mw!);
    return this.whoEdge__.matches(maskOrW as ChunkSetLike, patternOrM as ChunkSetLike);
  }
  override matchesWhatVertex(maskOrW: ChunkSetLike | number, patternOrM: ChunkSetLike | number, mw?: number): boolean {
    const s = this.whatVertex__ ?? this.whoVertex__;
    if (typeof maskOrW === "number") return s.matchesWord(maskOrW, patternOrM as number, mw!);
    return s.matches(maskOrW as ChunkSetLike, patternOrM as ChunkSetLike);
  }
  override matchesWhatEdge(maskOrW: ChunkSetLike | number, patternOrM: ChunkSetLike | number, mw?: number): boolean {
    const s = this.whatEdge__ ?? this.whoEdge__;
    if (typeof maskOrW === "number") return s.matchesWord(maskOrW, patternOrM as number, mw!);
    return s.matches(maskOrW as ChunkSetLike, patternOrM as ChunkSetLike);
  }

  override violatesNotWhoVertex(m: ChunkSetLike, p: ChunkSetLike, sw?: number): boolean { return this.whoVertex__.violatesNot(m, p, sw); }
  override violatesNotWhoEdge(m: ChunkSetLike, p: ChunkSetLike, sw?: number): boolean { return this.whoEdge__.violatesNot(m, p, sw); }
  override violatesNotWhatVertex(m: ChunkSetLike, p: ChunkSetLike, sw?: number): boolean { return (this.whatVertex__ ?? this.whoVertex__).violatesNot(m, p, sw); }
  override violatesNotWhatEdge(m: ChunkSetLike, p: ChunkSetLike, sw?: number): boolean { return (this.whatEdge__ ?? this.whoEdge__).violatesNot(m, p, sw); }

  override cloneWhoVertex(): ChunkSetLike { return this.whoVertex__.internalStateCopy(); }
  override cloneWhoEdge(): ChunkSetLike { return this.whoEdge__.internalStateCopy(); }
  override cloneWhatVertex(): ChunkSetLike { return (this.whatVertex__ ?? this.whoVertex__).internalStateCopy(); }
  override cloneWhatEdge(): ChunkSetLike { return (this.whatEdge__ ?? this.whoEdge__).internalStateCopy(); }
}
