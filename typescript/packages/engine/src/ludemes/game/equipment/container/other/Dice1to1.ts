/**
 * @java game/equipment/container/other/Dice.java Dice
 *
 * A container of N dice.  Holds numLocs (number of dice), numFaces, and
 * per-die face values (or start value for sequential faces).
 *
 * @java game/equipment/container/other/Dice.java — constructor/getFaces/getNumFaces/numLocs/isDice
 */

import { Item1to1 } from "../../Item1to1.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

export class Dice1to1 extends Item1to1 {
  /** @java Dice.numFaces */
  public readonly numFaces: number;

  /** @java Dice.start — starting face value (null if faces were given directly) */
  public readonly start: number | null;

  /**
   * @java Dice.faces — [numDice][numFaces] face values.
   * Outer index is per-die, inner index is per-face.
   */
  public readonly faces: readonly (readonly number[])[];

  /** @java Dice.biased — optional biased face weights */
  public readonly biased: readonly number[] | null;

  /** @java Dice.numLocs — number of dice in this container */
  public readonly numLocs: number;

  /**
   * @java game/equipment/container/other/Dice.java constructor
   *
   * Mirrors Java constructor logic (simplified: no @Or validation needed in TS).
   *
   * @param role      1-based player owner (0 = Shared).
   * @param d         Number of faces [6].
   * @param facesArg  Face values (same for all dice).  Null → sequential from `from`.
   * @param facesByDie Per-die face values.  Overrides facesArg when present.
   * @param from      Starting face value [1].  Ignored if faces or facesByDie given.
   * @param num       Number of dice in the set (required).
   * @param biased    Optional biased weights.
   */
  public constructor(
    role: number,
    d: number | null,
    facesArg: number[] | null,
    facesByDie: number[][] | null,
    from: number | null,
    num: number,
    biased: number[] | null,
  ) {
    super(null, UNDEFINED, role);
    this.setType("Dice");
    this.setName("Dice" + role);

    this.numLocs = num;
    this.biased  = biased ? [...biased] : null;

    // @java Dice.java:126–128 — numFaces
    this.numFaces = (d !== null)        ? d
                  : (facesArg !== null) ? facesArg.length
                  : (facesByDie !== null) ? facesByDie[0]!.length
                  : 6;

    // @java Dice.java:138 — start = faces != null || facesByDie != null ? null : (from == null ? 1 : from)
    this.start = (facesArg !== null || facesByDie !== null) ? null
               : (from === null) ? 1 : from;

    // @java Dice.java:140–156 — compute this.faces
    if (facesByDie !== null) {
      // Use provided per-die faces directly.
      this.faces = facesByDie.map(row => Object.freeze([...row]));
    } else if (facesArg !== null) {
      // Same face array for all dice.
      const frozenRow = Object.freeze([...facesArg]);
      this.faces = Array.from({ length: this.numLocs }, () => frozenRow);
    } else {
      // Sequential faces: [start, start+1, ..., start+numFaces-1] for each die.
      const startVal = this.start!;
      const row = Object.freeze(
        Array.from({ length: this.numFaces }, (_, j) => startVal + j),
      );
      this.faces = Array.from({ length: this.numLocs }, () => row);
    }
    Object.freeze(this.faces);
  }

  /** @java Dice.isDice() */
  public isDice(): boolean { return true; }
  /** @java Dice.isHand() — Dice also acts as a hand container */
  public isHand(): boolean { return true; }

  /** @java Dice.getFaces() */
  public getFaces(): readonly (readonly number[])[] { return this.faces; }
  /** @java Dice.getNumFaces() */
  public getNumFaces(): number { return this.numFaces; }
  /** @java Dice.getBiased() */
  public getBiased(): readonly number[] | null { return this.biased; }
}
