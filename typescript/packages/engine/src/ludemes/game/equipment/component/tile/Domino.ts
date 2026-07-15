/**
 * @java game/equipment/component/tile/Domino.java Domino
 *
 * A single domino tile component with two pip values.
 * isTile() = true, isDomino() = true, numSides() = 4.
 * isDoubleDomino() returns true iff both values are equal.
 *
 * @java game/equipment/component/Component.java — base fields
 * @java game/equipment/component/tile/Domino.java — constructor/getValue/getValue2/isDoubleDomino/isTile/isDomino/numSides
 */

import type { RoleType, GameLike } from "../../Item.js";
import type { MovesFunction } from "../../../../base.js";
import { Component } from "../Component.js";
import type { StepType } from "../../../types/board/StepType.js";

/**
 * @java Domino.java:55–61 — the domino's fixed large-piece walk, tracing its
 * 2(wide)×4(long) 8-cell footprint (4 cells per pip value) in a boustrophedon
 * pattern: F,R,F,R,F,L,F,L,F,R,F,R,F. This was previously omitted ("not
 * modelled in the TS port") because this file defined its own local stub
 * `Component` base class instead of importing the real one (Component.ts),
 * so there was nowhere to store a walk at all. Without it, `Component.walk()`
 * returns null for every domino, `equipment.pieces[i].walks` stays undefined
 * (Equipment.ts:1060-1061), and Add.ts/FromTo.ts's `p.walks && p.walks.length
 * > 0` large-piece gate never fires for domino placement — every domino move
 * silently degenerated into a plain single-cell FromTo with no footprint and
 * no orientation state (validated: `stateAtSite` stayed 0 and only the anchor
 * cell left the empty set after placing a domino).
 */
const DOMINO_WALK: StepType[][] = [
  ["F", "R", "F", "R", "F", "L", "F", "L", "F", "R", "F", "R", "F"],
];

/**
 * A single domino tile component.
 * @java game.equipment.component.tile.Domino
 */
export class Domino extends Component {
  /** @java Domino.value — first pip value */
  private readonly _value: number;

  /** @java Domino.value2 — second pip value */
  private readonly _value2: number;

  /**
   * @java game/equipment/component/tile/Domino.java constructor
   *
   * @param name      The name of the domino (e.g. "Domino45").
   * @param role      The owner of the domino.
   * @param value     The first pip value.
   * @param value2    The second pip value.
   * @param generator Optional move generator.
   */
  public constructor(
    name: string,
    role: RoleType,
    value: number,
    value2: number,
    generator: MovesFunction | null = null,
  ) {
    // @java Domino.java:55–61 — super(name, role, WALK, null, generator, null, null, null);
    super(name, role, DOMINO_WALK, null, generator, null, null, null);

    this._value  = value;
    this._value2 = value2;

    // @java Domino.java:65 — nameWithoutNumber = StringRoutines.removeTrailingNumbers(name)
    this.nameWithoutNumber = name.replace(/\d+$/, "");

    // @java Domino.java:67 — style = ComponentStyleType.Domino
    this.setStyle("Domino");
  }

  /** @java Domino.clone() */
  public clone(): Domino {
    return new Domino(
      this.name() ?? "",
      this.role(),
      this._value,
      this._value2,
      this._generator,
    );
  }

  /** @java Domino.getValue() — first pip value */
  public override getValue(): number  { return this._value; }

  /** @java Domino.getValue2() — second pip value */
  public override getValue2(): number { return this._value2; }

  /**
   * @java Domino.isDoubleDomino()
   * @returns true if both pip values are equal.
   */
  public override isDoubleDomino(): boolean {
    // @java Domino.java:108 — return getValue() == getValue2()
    return this._value === this._value2;
  }

  /** @java Domino.isDomino() */
  public override isDomino(): boolean { return true; }

  /** @java Domino.numSides() — 4 sides (rectangular domino) */
  public override numSides(): number { return 4; }

  /** @java Domino.isTile() */
  public override isTile(): boolean { return true; }

  /**
   * @java Domino.missingRequirement(Game)
   * Reports a missing-requirement error if the owner role is invalid.
   */
  public override missingRequirement(
    game: GameLike & { addRequirementToReport?: (msg: string) => void; players(): { count(): number } },
  ): boolean {
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
          "A domino is defined in the equipment with an incorrect owner: " + role + ".",
        );
        missingRequirement = true;
      }
    }
    return missingRequirement;
  }

  /**
   * @java Domino.toEnglish(Game)
   * @returns Human-readable English description of this domino.
   */
  public toEnglish(): string {
    const nameWithoutNum = this.nameWithoutNumber;
    // @java Domino.java:190–196 — StringRoutines.getPlural
    const plural = nameWithoutNum.endsWith("s") ? "es" : "s";
    return nameWithoutNum + plural + ", with values " + this._value + " and " + this._value2;
  }
}
