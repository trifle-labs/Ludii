// @java Core/src/other/state/puzzle/ContainerDeductionPuzzleStateLarge.java

import { ContainerDeductionPuzzleState } from "./ContainerDeductionPuzzleState.js";
import type { SiteType, StateRef, GameRef, ContainerRef } from "../container/ContainerState.js";
import type { ContainerState } from "../container/ContainerState.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

/**
 * The state for the deduction puzzle with a range of values >= 32 for each
 * graph element. Uses full number instead of bit-packed integer.
 * Faithful 1:1 port of ContainerDeductionPuzzleStateLarge.java.
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class ContainerDeductionPuzzleStateLarge extends ContainerDeductionPuzzleState {
  // In Java, "Large" uses BigInteger bitmasks instead of int bitmasks.
  // Here we use BigInt per site.
  vertsLarge: bigint[];
  edgesLarge: bigint[];
  cellsLarge: bigint[];

  constructor(generator: ZobristHashGenerator, game: GameRef, container: ContainerRef);
  constructor(other: ContainerDeductionPuzzleStateLarge);
  constructor(
    generatorOrOther: ZobristHashGenerator | ContainerDeductionPuzzleStateLarge,
    game?: GameRef, container?: ContainerRef,
  ) {
    if (generatorOrOther instanceof ContainerDeductionPuzzleStateLarge) {
      const o = generatorOrOther;
      super(o);
      this.vertsLarge = [...o.vertsLarge];
      this.edgesLarge = [...o.edgesLarge];
      this.cellsLarge = [...o.cellsLarge];
    } else {
      super(generatorOrOther as ZobristHashGenerator, game!, container!);
      const numCells = this.cells.length;
      const numEdges = this.edges.length;
      const numVerts = this.verts.length;
      this.vertsLarge = new Array(numVerts).fill(1n);
      this.edgesLarge = new Array(numEdges).fill(1n);
      this.cellsLarge = new Array(numCells).fill(1n);
    }
  }

  override deepClone(): ContainerDeductionPuzzleStateLarge {
    return new ContainerDeductionPuzzleStateLarge(this);
  }

  override bit(varSite: number, value: number, type: SiteType): boolean {
    const arr = type === "Edge" ? this.edgesLarge : (type === "Vertex" ? this.vertsLarge : this.cellsLarge);
    const bits = arr[varSite] ?? 0n;
    return (bits & (1n << BigInt(value))) !== 0n;
  }

  override isResolved(varSite: number, type: SiteType): boolean {
    const arr = type === "Edge" ? this.edgesLarge : (type === "Vertex" ? this.vertsLarge : this.cellsLarge);
    const bits = arr[varSite] ?? 0n;
    return bits !== 0n && (bits & (bits - 1n)) === 0n;
  }

  override set(varSite: number, value: number, type: SiteType): void {
    const v = 1n << BigInt(value);
    if (type === "Edge") this.edgesLarge[varSite] = v;
    else if (type === "Vertex") this.vertsLarge[varSite] = v;
    else this.cellsLarge[varSite] = v;
  }

  override values(type: SiteType, varSite: number): Set<number> {
    const arr = type === "Edge" ? this.edgesLarge : (type === "Vertex" ? this.vertsLarge : this.cellsLarge);
    const bits = arr[varSite] ?? 0n;
    const result = new Set<number>();
    for (let i = 0; i < 64; i++) if ((bits & (1n << BigInt(i))) !== 0n) result.add(i);
    return result;
  }
}
