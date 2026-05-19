/**
 * Java parity:
 * - Core/src/game/types/state/Concept.java enumerates ~600 named
 *   gameplay concepts; the TS port pins the subset the MVE engine
 *   actually tracks so callers can inspect what a move/game touches
 *   without dragging in the full enum.
 *
 * Concepts are exposed as a frozen `Set<ConceptName>`. The Java side
 * uses BitSet keyed by ordinal; we keep names because the TS engine is
 * data-driven and identifier-stable.
 */

export const CONCEPT_NAMES = [
  "Add",
  "Move",
  "Remove",
  "Swap",
  "Pass",
  "Forfeit",
  "Vote",
  "LineWin",
  "ConnectionWin",
  "DrawByFill",
  "AlternatingTurns",
  "HiddenInformation",
  "Stacking",
  "PieceOwnership",
  "DeterministicPlayout",
] as const;

export type ConceptName = (typeof CONCEPT_NAMES)[number];

export class ConceptSet {
  private readonly bag: Set<ConceptName>;

  public constructor(initial?: Iterable<ConceptName>) {
    this.bag = new Set(initial ?? []);
  }

  public add(name: ConceptName): ConceptSet {
    if (this.bag.has(name)) return this;
    return new ConceptSet([...this.bag, name]);
  }

  public has(name: ConceptName): boolean {
    return this.bag.has(name);
  }

  public get size(): number {
    return this.bag.size;
  }

  public toArray(): readonly ConceptName[] {
    return Object.freeze([...this.bag]);
  }

  public union(other: ConceptSet): ConceptSet {
    return new ConceptSet([...this.bag, ...other.bag]);
  }

  public static of(...names: ConceptName[]): ConceptSet {
    return new ConceptSet(names);
  }
}

export function isConceptName(value: unknown): value is ConceptName {
  return (
    typeof value === "string" &&
    (CONCEPT_NAMES as readonly string[]).includes(value)
  );
}
