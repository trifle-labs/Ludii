// @java Player/src/app/utils/PuzzleSelectionType.java

/**
 * Different ways that values can be selected for deduction puzzles.
 *
 * @author Matthew.Stephenson
 * @java app.utils.PuzzleSelectionType
 */
export enum PuzzleSelectionType {
  /** Pick from the others based on the # possible values. */
  Automatic = "Automatic",

  /** Show a dialog with all possible values. */
  Dialog = "Dialog",

  /** Cycle through to the next possible value. */
  Cycle = "Cycle",
}

// ---------------------------------------------------------------------------

/**
 * Returns the PuzzleSelectionType whose value matches the provided name.
 *
 * @java PuzzleSelectionType#getPuzzleSelectionType(String)
 */
export function getPuzzleSelectionType(name: string): PuzzleSelectionType {
  for (const value of Object.values(PuzzleSelectionType)) {
    if (value === name)
      return value as PuzzleSelectionType;
  }
  return PuzzleSelectionType.Automatic;
}

// ---------------------------------------------------------------------------
