// @java Core/src/game/equipment/component/Die.java

/**
 * Defines a single non-stochastic die used as a piece.
 *
 * The die defined with this ludeme will not be included in a dice container
 * and cannot be rolled with the roll ludeme, but can be turned to show each
 * of its faces.
 *
 * @java game/equipment/component/Die.java
 * @author Eric.Piette and cambolbro
 */

import { Component } from "./Component.js";
import type { RoleType, GameLike } from "../Item.js";
import type { MovesFunction } from "../../../base.js";
import type { DirectionFacing } from "../../util/directions/DirectionFacing.js";

/**
 * A single non-stochastic die component.
 *
 * @java game/equipment/component/Die.java
 */
export class Die extends Component {
  /** @java Die.numFaces — The number of faces of the die. */
  private readonly _numFaces: number;

  /** @java Die.faces — The faces values. */
  private _faces: number[] | null;

  /**
   * @java Die(String, RoleType, Integer, DirectionFacing, Moves)
   *
   * @param name      The name of the die.
   * @param role      The owner of the die.
   * @param numFaces  The number of faces of the die.
   * @param dirn      The direction of the component.
   * @param generator The moves associated with the component.
   */
  public constructor(
    name: string,
    role: RoleType,
    numFaces: number,
    dirn: DirectionFacing | null = null,
    generator: MovesFunction | null = null,
  ) {
    // @java Die.java:57 — super(name, role, null, dirn, generator, null,null,null);
    super(name, role, null, dirn, generator, null, null, null);
    // @java Die.java:58
    this._numFaces = numFaces;
    this._faces    = null;
    // @java Die.java:59 — style = ComponentStyleType.Die
    this._style = "Die";
  }

  /** @java Die.isDie() */
  public override isDie(): boolean { return true; }

  /** @java Die.getFaces() */
  public override getFaces(): number[] { return this._faces ?? []; }

  /** @java Die.getNumFaces() */
  public override getNumFaces(): number { return this._numFaces; }

  /**
   * @java Die.roll(Context context) — return context.rng().nextInt(faces.length)
   *
   * In the TS port there is no RNG context injected. We mirror the Java logic
   * by accepting a nextInt callback from the caller.
   */
  public override roll(context: unknown): number {
    // @java Die.java:113 — return (context.rng().nextInt(faces.length));
    const faces = this._faces;
    const len   = faces !== null ? faces.length : this._numFaces;
    const rng   = (context as unknown as { rng?: () => { nextInt: (n: number) => number } }).rng;
    if (rng !== undefined) {
      return rng().nextInt(len);
    }
    // Fallback: uniform random
    return Math.floor(Math.random() * len);
  }

  /**
   * @java Die.setFaces(Integer[] faces, Integer start)
   *
   * Mirrors Java logic exactly:
   *   - if start != null: build sequential array [start, start+1, ..., start+numFaces-1]
   *   - else if faces != null: copy provided faces
   */
  public override setFaces(faces: number[] | null, start: number | null): void {
    // @java Die.java:119–129
    if (start !== null) {
      this._faces = [];
      for (let i = start; i < start + this._numFaces; i++) {
        this._faces.push(i);
      }
    } else if (faces !== null) {
      this._faces = new Array<number>(faces.length);
      for (let i = 0; i < faces.length; i++) {
        this._faces[i] = faces[i] ?? 0;
      }
    }
  }

  /**
   * @java Die.missingRequirement(Game)
   */
  public override missingRequirement(
    game: GameLike & { addRequirementToReport?: (msg: string) => void; players(): { count(): number } },
  ): boolean {
    // @java Die.java:159–173
    let missingRequirement = false;
    const role = this.role();
    if (role !== null) {
      const numericRoles: Record<string, number> = {
        P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6, P7: 7, P8: 8, Neutral: 0,
      };
      const indexOwnerPhase = numericRoles[role as string] ?? -1;
      if (
        (
          indexOwnerPhase < 1 &&
          role !== "Shared" &&
          role !== "Neutral" &&
          role !== "All"
        ) ||
        indexOwnerPhase > game.players().count()
      ) {
        game.addRequirementToReport?.(
          "A die is defined in the equipment with an incorrect owner: " + role + ".",
        );
        missingRequirement = true;
      }
    }
    return missingRequirement;
  }

  /**
   * @java Die.toEnglish(Game)
   */
  public toEnglish(): string {
    // @java Die.java:180–187
    let str = this.nameWithoutNumber ?? "Die";
    const plural = str.endsWith("s") ? "es" : "s";
    str += plural;
    str += " with " + this._numFaces + " faces valued " + JSON.stringify(this._faces ?? []);
    return str;
  }

  /** @java Die.clone() */
  public clone(): Die {
    const d = new Die(
      this.name() ?? "",
      this.role(),
      this._numFaces,
      this._dirn,
      this._generator,
    );
    if (this._faces !== null) {
      d._faces = [...this._faces];
    }
    return d;
  }
}
