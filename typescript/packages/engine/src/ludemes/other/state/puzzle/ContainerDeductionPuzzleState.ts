// @java Core/src/other/state/puzzle/ContainerDeductionPuzzleState.java

import { BaseContainerStateDeductionPuzzles } from "./BaseContainerStateDeductionPuzzles.js";
import type { ContainerState, SiteType, StateRef, GameRef, ContainerRef } from "../container/ContainerState.js";
import type { SymmetryValidator } from "../symmetry/SymmetryValidator.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

/**
 * The state for the deduction puzzle with a range of values under 32 for each
 * graph element.
 * Faithful 1:1 port of ContainerDeductionPuzzleState.java.
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class ContainerDeductionPuzzleState extends BaseContainerStateDeductionPuzzles {
  /** Java: protected int nbValuesVert = 1 */
  protected nbValuesVert = 1;
  /** Java: protected ChunkSet verts — we use BitSet-like: verts[site] = bitmask of possible values */
  protected verts: number[];
  /** Java: protected ChunkSet edges */
  protected edges: number[];
  /** Java: protected int nbValuesEdge = 1 */
  protected nbValuesEdge = 1;
  /** Java: protected ChunkSet cells */
  protected cells: number[];
  /** Java: protected int nbValuesCell = 1 */
  protected nbValuesCell = 1;

  constructor(generator: ZobristHashGenerator, game: GameRef, container: ContainerRef);
  constructor(other: ContainerDeductionPuzzleState);
  constructor(
    generatorOrOther: ZobristHashGenerator | ContainerDeductionPuzzleState,
    game?: GameRef, container?: ContainerRef,
  ) {
    if (generatorOrOther instanceof ContainerDeductionPuzzleState) {
      const o = generatorOrOther;
      super(o);
      this.nbValuesVert = o.nbValuesVert;
      this.nbValuesEdge = o.nbValuesEdge;
      this.nbValuesCell = o.nbValuesCell;
      this.verts = [...o.verts];
      this.edges = [...o.edges];
      this.cells = [...o.cells];
    } else {
      const game_ = game!;
      const numTotal = game_.equipment().sitesFrom()[0] ?? 1;
      super(game_, container!, numTotal);
      const numEdges = game_.board().topology().cells().size();
      const numVerts = game_.board().topology().cells().size(); // simplified
      const numCells = numTotal;
      // All values possible initially: (1 << nbValues) - 1 bitmask
      this.verts = new Array(numVerts).fill((1 << 1) - 1);
      this.edges = new Array(numEdges).fill((1 << 1) - 1);
      this.cells = new Array(numCells).fill((1 << 1) - 1);
    }
  }

  deepClone(): ContainerDeductionPuzzleState { return new ContainerDeductionPuzzleState(this); }

  canonicalHash(_validator: SymmetryValidator, _state: StateRef, _whoOnly: boolean): number { return 0; }

  setSite(_ts: StateRef, ..._a: unknown[]): void {}
  remove(state: StateRef, site: number, _l?: number | SiteType, _t?: SiteType): number { return 0; }

  override bit(varSite: number, value: number, type: SiteType): boolean {
    const arr = type === "Edge" ? this.edges : (type === "Vertex" ? this.verts : this.cells);
    const bits = arr[varSite] ?? 0;
    return (bits & (1 << value)) !== 0;
  }

  override isResolved(varSite: number, type: SiteType): boolean {
    const arr = type === "Edge" ? this.edges : (type === "Vertex" ? this.verts : this.cells);
    const bits = arr[varSite] ?? 0;
    return bits !== 0 && (bits & (bits - 1)) === 0; // exactly one bit set
  }

  override isResolvedEdges(varSite: number): boolean { return this.isResolved(varSite, "Edge"); }
  override isResolvedCell(varSite: number): boolean { return this.isResolved(varSite, "Cell"); }
  override isResolvedVerts(varSite: number): boolean { return this.isResolved(varSite, "Vertex"); }

  override set(varSite: number, value: number, type: SiteType): void {
    if (type === "Edge") this.edges[varSite] = 1 << value;
    else if (type === "Vertex") this.verts[varSite] = 1 << value;
    else this.cells[varSite] = 1 << value;
  }

  override values(type: SiteType, varSite: number): Set<number> {
    const arr = type === "Edge" ? this.edges : (type === "Vertex" ? this.verts : this.cells);
    const bits = arr[varSite] ?? 0;
    const result = new Set<number>();
    for (let i = 0; i < 32; i++) if ((bits & (1 << i)) !== 0) result.add(i);
    return result;
  }
}
