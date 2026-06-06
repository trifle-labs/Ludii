// @java AI/src/utils/data_structures/experience_buffers/UniformExperienceBuffer.java

/**
 * A size-restricted, FIFO buffer to contain samples of experience.
 *
 * @java utils/data_structures/experience_buffers/UniformExperienceBuffer.java
 * @author Dennis Soemers
 */

import { type ExperienceBuffer, type ExItExperience } from "./ExperienceBuffer.js";

// Escape-hatch types for not-yet-ported Java dependencies

/** @java game.Game */
type Game = {
  equipment(): {
    containers(): Container[];
  };
};

type Container = {
  name(): string;
};

type ContainerState = {
  nameFromFile(): string;
  setContainer(container: Container): void;
};

type ExItExperienceState = {
  state(): { containerStates(): ContainerState[] };
};

type ExItExperienceFull = ExItExperience & {
  state(): ExItExperienceState;
};

//-------------------------------------------------------------------------

/**
 * A size-restricted, FIFO buffer to contain samples of experience.
 *
 * @java utils.data_structures.experience_buffers.UniformExperienceBuffer
 */
export class UniformExperienceBuffer implements ExperienceBuffer {

  //-------------------------------------------------------------------------

  /**
   * Maximum number of elements the buffer can contain before removing
   * elements from the front.
   * @java UniformExperienceBuffer.replayCapacity
   */
  protected readonly replayCapacity: number;

  /** @java UniformExperienceBuffer.buffer */
  protected readonly buffer: (ExItExperience | null)[];

  /** @java UniformExperienceBuffer.addCount */
  protected addCount: bigint = BigInt(0);

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param replayCapacity
   * @java UniformExperienceBuffer(int)
   */
  public constructor(replayCapacity: number) {
    this.replayCapacity = replayCapacity;
    this.buffer = new Array(replayCapacity).fill(null);
  }

  //-------------------------------------------------------------------------

  /**
   * @java UniformExperienceBuffer.add(ExItExperience)
   */
  public add(experience: ExItExperience): void {
    this.buffer[this.cursor()] = experience;
    this.addCount += BigInt(1);
  }

  /**
   * @return True if we're empty
   * @java UniformExperienceBuffer.isEmpty()
   */
  public isEmpty(): boolean {
    return this.addCount === BigInt(0);
  }

  /**
   * @return True if we're full
   * @java UniformExperienceBuffer.isFull()
   */
  public isFull(): boolean {
    return this.addCount >= BigInt(this.replayCapacity);
  }

  /**
   * @return Number of samples we currently contain
   * @java UniformExperienceBuffer.size()
   */
  public size(): number {
    if (this.isFull()) {
      return this.replayCapacity;
    } else {
      return Number(this.addCount);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java UniformExperienceBuffer.sampleExperienceBatch(int)
   */
  public sampleExperienceBatch(batchSize: number): ExItExperience[] {
    return this.sampleExperienceBatchUniformly(batchSize);
  }

  /**
   * @java UniformExperienceBuffer.sampleExperienceBatchUniformly(int)
   */
  public sampleExperienceBatchUniformly(batchSize: number): ExItExperience[] {
    const numSamples = Math.min(batchSize, Number(this.addCount));
    const batch: ExItExperience[] = [];
    const bufferSize = this.size();

    for (let i = 0; i < numSamples; ++i) {
      const idx = Math.floor(Math.random() * bufferSize);
      batch.push(this.buffer[idx]!);
    }

    return batch;
  }

  /**
   * @java UniformExperienceBuffer.allExperience()
   */
  public allExperience(): (ExItExperience | null)[] {
    return this.buffer;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Index of next location that we'll write to
   * @java UniformExperienceBuffer.cursor()
   */
  private cursor(): number {
    return Number(this.addCount % BigInt(this.replayCapacity));
  }

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @param filepath
   * @return Experience buffer restored from binary file
   * @java UniformExperienceBuffer.fromFile(Game, String)
   */
  public static fromFile(_game: Game, _filepath: string): UniformExperienceBuffer | null {
    // Java uses Java serialization (ObjectInputStream); not directly portable.
    // In a TypeScript context, this would require a custom serialization mechanism.
    // Returning null as this is a platform-specific I/O operation.
    console.error("UniformExperienceBuffer.fromFile: Java serialization not available in TypeScript.");
    return null;
  }

  /**
   * @java UniformExperienceBuffer.writeToFile(String)
   */
  public writeToFile(_filepath: string): void {
    // Java uses Java serialization (ObjectOutputStream); not directly portable.
    console.error("UniformExperienceBuffer.writeToFile: Java serialization not available in TypeScript.");
  }

  //-------------------------------------------------------------------------
}
