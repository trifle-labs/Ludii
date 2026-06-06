// @java AI/src/utils/data_structures/experience_buffers/ExperienceBuffer.java

/**
 * Interface for experience buffers. Declares common methods
 * that we expect in uniform as well as Prioritized Experience Replay buffers.
 *
 * @java utils/data_structures/experience_buffers/ExperienceBuffer.java
 * @author Dennis Soemers
 */

// Escape-hatch type for ExItExperience (not yet ported)
/** @java training.expert_iteration.ExItExperience */
export type ExItExperience = object;

/**
 * Interface for experience buffers.
 *
 * @java utils.data_structures.experience_buffers.ExperienceBuffer
 */
export interface ExperienceBuffer {

  /**
   * Adds a new sample of experience.
   * Defaulting to the max observed priority level in the case of PER.
   * @param experience
   * @java ExperienceBuffer.add(ExItExperience)
   */
  add(experience: ExItExperience): void;

  /**
   * @param batchSize
   * @return A batch of the given batch size, sampled uniformly with replacement.
   * @java ExperienceBuffer.sampleExperienceBatch(int)
   */
  sampleExperienceBatch(batchSize: number): ExItExperience[];

  /**
   * @param batchSize
   * @return Sample of batchSize tuples of experience, sampled uniformly
   * @java ExperienceBuffer.sampleExperienceBatchUniformly(int)
   */
  sampleExperienceBatchUniformly(batchSize: number): ExItExperience[];

  /**
   * @return Return the backing array containing ALL experience (including likely
   * null entries if the buffer was not completely filled).
   * @java ExperienceBuffer.allExperience()
   */
  allExperience(): (ExItExperience | null)[];

  /**
   * Writes this complete buffer to a binary file.
   * @param filepath
   * @java ExperienceBuffer.writeToFile(String)
   */
  writeToFile(filepath: string): void;
}
