/**
 * @java game/equipment/component/Die.java Die
 *
 * A single non-stochastic die component that can be turned to show each of its
 * faces. Extends the faithful Component and stores numFaces and face values.
 *
 * @java game/equipment/component/Die.java — constructor/getFaces/getNumFaces/roll/setFaces
 */

import { Component } from "./Component.js";
import type { RoleType } from "../Item.js";

/** Engine ctor passes a 1-based owner id; Java Die takes a RoleType. */
function roleFromOwner(owner: number): RoleType {
  if (owner === 0) return "Neutral" as RoleType;
  return (`P${owner}`) as RoleType;
}
import type { MovesFunction } from "../../../base.js";

export class Die extends Component {
  /** @java Die.numFaces */
  private readonly _numFaces: number;

  /** @java Die.faces — set by setFaces() after construction */
  private _faces: number[] | null;

  /**
   * @java game/equipment/component/Die.java constructor
   *
   * @param name     Piece name (e.g. "Die6").
   * @param owner    1-based player owner (0 = All/Shared).
   * @param numFaces Number of faces of the die.
   * @param generator Optional move generator.
   */
  public constructor(
    name: string,
    owner: number,
    numFaces: number,
    generator: MovesFunction | null = null,
  ) {
    // @java Die.java:84 — super(name, role, null, null, generator, null, null, null)
    super(name, roleFromOwner(owner), null, null, generator, null, null, null);
    this._numFaces = numFaces;
    this._faces    = null;
  }

  /** @java Die.isDie() */
  public override isDie(): boolean { return true; }

  /** @java Die.getNumFaces() */
  public override getNumFaces(): number { return this._numFaces; }

  /** @java Die.getFaces() */
  public override getFaces(): number[] { return this._faces ?? []; }

  /**
   * @java Die.setFaces(Integer[] faces, Integer start)
   *
   * Mirrors Java logic exactly:
   *   - if start != null: build sequential array [start, start+1, ..., start+numFaces-1]
   *   - else if faces != null: copy provided faces
   */
  public override setFaces(faces: number[] | null, start: number | null): void {
    // @java Die.java:121–129 — setFaces implementation
    if (start !== null) {
      this._faces = [];
      for (let i = start; i < start + this._numFaces; i++) {
        this._faces.push(i);
      }
    } else if (faces !== null) {
      this._faces = [...faces];
    }
  }

  /**
   * @java Die.roll(Context context) — returns random face index.
   * In the TS 1:1 path there is no RNG context injected, so we mirror the
   * Java signature by accepting an optional seed value.  The caller must use
   * ctx.rng for real randomness; here we return the raw range to be used.
   *
   * @java game/equipment/component/Die.java:113 — return context.rng().nextInt(faces.length)
   */
  public override roll(rngNextInt: (n: number) => number): number {
    const len = this._faces?.length ?? this._numFaces;
    return rngNextInt(len);
  }
}
