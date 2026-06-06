// @java Core/src/game/equipment/container/other/Dice.java

/**
 * Generates a set of dice.
 *
 * @java game/equipment/container/other/Dice.java
 * @author Eric.Piette
 *
 * @remarks Used for any dice game to define a set of dice. Only the set of dice
 *          can be rolled.
 */

import { Container } from "../Container.js";
import type { RoleType } from "../../Item.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** Java Constants.MAX_PLAYERS = 16 */
const MAX_PLAYERS = 16;

/** Java Constants.MAX_FACE_DIE = 32 */
const MAX_FACE_DIE = 32;

/**
 * A container of dice.
 *
 * @java game/equipment/container/other/Dice.java — class Dice extends Container
 */
export class Dice extends Container {
  /** @java Dice.numFaces — number of faces of each die */
  private readonly numFaces: number;

  /** @java Dice.start — starting face value (null if faces given directly) */
  private readonly start: number | null;

  /** @java Dice.faces — [numDice][numFaces] face values */
  private readonly faces: number[][];

  /** @java Dice.biased — optional biased face weights */
  private readonly biased: number[] | null;

  /** @java Dice.numLocs — number of dice in this container */
  protected readonly numLocs: number;

  /**
   * @java game/equipment/container/other/Dice.java constructor
   *
   * @param d          The number of faces of the die [6].
   * @param facesArg   The values of each face (same for all dice).
   * @param facesByDie The values of each face for each die.
   * @param from       The starting value of each die [1].
   * @param role       The owner of the dice [Shared].
   * @param num        The number of dice in the set.
   * @param biased     The biased values of each die.
   */
  public constructor(
    d: number | null,
    facesArg: number[] | null,
    facesByDie: number[][] | null,
    from: number | null,
    role: RoleType | null,
    num: number,
    biased: number[] | null,
  ) {
    // @java Dice.java:79 — super(null, Constants.UNDEFINED, (role == null) ? RoleType.Shared : role)
    const realRole: RoleType = (role === null) ? "Shared" : role;
    super(null, UNDEFINED, realRole);

    // @java Dice.java:82–99 — validate face count limits
    if (d !== null) {
      if (d < 0 || d > MAX_FACE_DIE)
        throw new Error("The number of faces of a die can not be negative or exceed " + MAX_FACE_DIE + ".");
    } else if (facesArg !== null) {
      if (facesArg.length > MAX_FACE_DIE)
        throw new Error("The number of faces of a die can not exceed " + MAX_FACE_DIE + ".");
    } else if (facesByDie !== null) {
      if (facesByDie.length > MAX_FACE_DIE)
        throw new Error("The number of faces of a die can not exceed " + MAX_FACE_DIE + ".");
    }

    // @java Dice.java:101–103 — derive container name
    const containerName = "Dice";

    // @java Dice.java:105–120 — set name based on role
    const ownerIdx = roleOwnerIndex(realRole);
    if (ownerIdx > 0 && ownerIdx <= MAX_PLAYERS) {
      if (this.name() === null) this.setName(containerName + ownerIdx);
    } else if (realRole === "Neutral") {
      if (this.name() === null) this.setName(containerName + "0");
    } else if (realRole === "Shared") {
      if (this.name() === null) this.setName(containerName + "-1");
    }

    // @java Dice.java:122
    this.numLocs = num;

    // @java Dice.java:124
    this.style = "Hand";

    // @java Dice.java:126–128 — numFaces
    this.numFaces = (d !== null)          ? d
                  : (facesArg  !== null)  ? facesArg.length
                  : (facesByDie !== null) ? facesByDie[0]!.length
                  : 6;

    // @java Dice.java:130–136 — validate from/faces exclusivity
    let numNonNull = 0;
    if (from     !== null) numNonNull++;
    if (facesArg !== null) numNonNull++;
    if (numNonNull > 1)
      throw new Error("Dice: Zero or one Or parameter must be non-null.");

    // @java Dice.java:138 — start
    this.start = (facesArg !== null || facesByDie !== null)
               ? null
               : (from === null) ? 1 : from;

    // @java Dice.java:140–156 — compute faces
    if (facesByDie !== null) {
      // @java Dice.java:141 — use provided per-die faces
      this.faces = facesByDie.map(row => [...row]);
    } else if (facesArg !== null) {
      // @java Dice.java:143–147 — same faces for all dice
      this.faces = Array.from({ length: this.numLocs }, () => [...facesArg]);
    } else {
      // @java Dice.java:149–155 — sequential faces
      const startVal = this.start!;
      const row = Array.from({ length: this.numFaces }, (_, j) => startVal + j);
      this.faces = Array.from({ length: this.numLocs }, () => [...row]);
    }

    this.biased = biased ? [...biased] : null;

    // @java Dice.java:159 — setType(ItemType.Dice)
    this.setType("Dice");
  }

  /**
   * @java Dice.createTopology(int, int)
   * In the TS port topology construction is handled by the 1:1 engine (Dice1to1).
   * This is a no-op implementation to satisfy the abstract base.
   */
  public createTopology(_beginIndex: number, _numEdges: number): void {
    // Topology construction is handled by Dice1to1 in the 1:1 path.
  }

  /** @java Dice.numLocs() */
  public getNumLocs(): number { return this.numLocs; }

  /** @java Dice.getBiased() */
  public getBiased(): number[] | null { return this.biased; }

  /** @java Dice.getFaces() */
  public getFaces(): number[][] { return this.faces; }

  /** @java Dice.getStart() */
  public getStart(): number | null { return this.start; }

  /** @java Dice.getNumFaces() */
  public getNumFaces(): number { return this.numFaces; }

  /** @java Dice.isDice() */
  public override isDice(): boolean { return true; }

  /** @java Dice.isHand() — Dice also acts as a hand container */
  public override isHand(): boolean { return true; }

  /** @java Dice.clone() */
  public clone(): Dice {
    return new Dice(
      this.numFaces,
      null,
      this.faces.map(row => [...row]),
      null,
      this.role() as RoleType,
      this.numLocs,
      this.biased ? [...this.biased] : null,
    );
  }

  /**
   * @java Dice.missingRequirement(Game)
   */
  public missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    const role = this.role();
    if (role !== null) {
      const indexOwnerPhase = roleOwnerIndex(role as RoleType);
      const playerCount = (game as unknown as { players(): { count(): number } }).players().count();
      if (
        (
          indexOwnerPhase < 1
          && role !== "Shared"
          && role !== "Neutral"
          && role !== "All"
        )
        || indexOwnerPhase > playerCount
      ) {
        missingRequirement = true;
      }
    }
    return missingRequirement;
  }
}

/** Map from RoleType to numeric owner index. */
function roleOwnerIndex(role: RoleType): number {
  if (role === "Neutral") return 0;
  if (role === "Shared")  return -1;
  if (role === "All")     return -1;
  const m = /^P(\d+)$/.exec(role);
  if (m) return parseInt(m[1]!, 10);
  return 0;
}
