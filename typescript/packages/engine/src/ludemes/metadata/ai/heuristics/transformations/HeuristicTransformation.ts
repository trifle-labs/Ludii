// @java Core/src/metadata/ai/heuristics/transformations/HeuristicTransformation.java

/**
 * Interface for transformations of heuristics (generally functions
 * intended to map the scores of a heuristic to some different range).
 *
 * @author Dennis Soemers
 */
export interface HeuristicTransformation {
  /**
   * @param context  (opaque — runtime context not needed for metadata-only use)
   * @param heuristicScore
   * @return Transformed version of given score
   */
  transform(context: unknown, heuristicScore: number): number;

  toString(): string;
}
