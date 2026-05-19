/**
 * Java parity:
 * - Core/src/other/move/Move.java — the conceptual ancestor; the TS port
 *   exposes only the surface that the browser-player contract pins.
 */

import type { State } from "./state.js";

export interface MoveInit {
  readonly id: string;
  readonly label: string;
  readonly siteIndices: readonly number[];
  readonly mover: number;
  readonly placedOwner: number;
}

export class Move {
  public readonly id: string;
  public readonly label: string;
  public readonly siteIndices: readonly number[];
  public readonly mover: number;
  public readonly placedOwner: number;

  public constructor(init: MoveInit) {
    if (init.siteIndices.length === 0) {
      throw new Error("Move must touch at least one site.");
    }
    if (!Number.isInteger(init.mover) || init.mover < 1) {
      throw new Error(`Mover must be a 1-based integer; got ${init.mover}.`);
    }
    if (!Number.isInteger(init.placedOwner) || init.placedOwner < 1) {
      throw new Error(
        `placedOwner must be a 1-based integer; got ${init.placedOwner}.`,
      );
    }
    this.id = init.id;
    this.label = init.label;
    this.siteIndices = Object.freeze([...init.siteIndices]);
    this.mover = init.mover;
    this.placedOwner = init.placedOwner;
  }

  public applyTo(state: State): State {
    const site = this.siteIndices[0];
    if (site === undefined) {
      throw new Error("Move missing target site.");
    }
    return state.withCell(site, this.placedOwner);
  }
}
