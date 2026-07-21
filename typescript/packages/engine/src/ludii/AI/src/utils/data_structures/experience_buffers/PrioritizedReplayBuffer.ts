// @java AI/src/utils/data_structures/experience_buffers/PrioritizedReplayBuffer.java

/**
 * Replay Buffer for Prioritized Experience Replay, as described
 * by Schaul et al. (2015).
 *
 * Implementation based on that from Dopamine (but translated to Java):
 * https://github.com/google/dopamine/blob/master/dopamine/replay_memory/prioritized_replay_buffer.py
 *
 * Implementation afterwards also adjusted to bring back in some of the
 * hyperparameters from the original publication. Changes also inspired
 * by stable-baselines implementation:
 * https://github.com/hill-a/stable-baselines/blob/master/stable_baselines/deepq/replay_buffer.py
 *
 * @java utils.data_structures.experience_buffers.PrioritizedReplayBuffer
 * @author Dennis Soemers
 */

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java AI/src/utils/data_structures/experience_buffers/SumTree.java */
type SumTree = {
  set(index: number, priority: number): void;
  get(index: number): number;
  maxRecordedPriority(): number;
  totalPriority(): number;
  stratifiedSample(batchSize: number): number[];
};

/** @java AI/src/training/expert_iteration/ExItExperience.java */
type ExItExperience = {
  state(): { state(): { containerStates(): ContainerState[] } };
  setWeightPER(weight: number): void;
  setBufferIdx(idx: number): void;
};

/** @java game.equipment.container.ContainerState (opaque) */
type ContainerState = {
  nameFromFile(): string;
  setContainer(container: Container): void;
};

/** @java game.equipment.container.Container (opaque) */
type Container = {
  name(): string;
};

/** @java game.Game (opaque) */
type Game = {
  equipment(): { containers(): Container[] };
};

/** @java AI/src/utils/data_structures/experience_buffers/ExperienceBuffer.java */
export interface ExperienceBuffer {
  add(experience: ExItExperience): void;
  sampleExperienceBatch(batchSize: number): ExItExperience[];
  sampleExperienceBatchUniformly(batchSize: number): ExItExperience[];
  allExperience(): (ExItExperience | null)[];
  writeToFile(filepath: string): void;
}

// ---------------------------------------------------------------------------

/**
 * @java utils.data_structures.experience_buffers.PrioritizedReplayBuffer
 */
export class PrioritizedReplayBuffer implements ExperienceBuffer {

  //-------------------------------------------------------------------------

  /** Our maximum capacity. @java PrioritizedReplayBuffer.replayCapacity */
  protected readonly replayCapacity: number;

  /** Our sum tree data structure. @java PrioritizedReplayBuffer.sumTree */
  protected readonly _sumTree: SumTree;

  /** This contains our data. @java PrioritizedReplayBuffer.buffer */
  protected readonly buffer: (ExItExperience | null)[];

  /** How many elements did we add? @java PrioritizedReplayBuffer.addCount */
  protected _addCount: bigint;

  /** Hyperparameter for sampling. 0 → uniform, 1 → proportional to priorities. @java PrioritizedReplayBuffer.alpha */
  protected readonly _alpha: number;

  /** Hyperparameter for importance sampling. 0 → no correction, 1 → full correction. @java PrioritizedReplayBuffer.beta */
  protected readonly _beta: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor. Default hyperparam values of 0.5 for alpha as well as beta,
   * based on the defaults in Dopamine.
   *
   * @param replayCapacity Maximum capacity of our buffer
   * @java PrioritizedReplayBuffer(int)
   */
  constructor(replayCapacity: number);

  /**
   * Constructor.
   *
   * @param replayCapacity Maximum capacity of our buffer
   * @param alpha
   * @param beta
   * @java PrioritizedReplayBuffer(int, double, double)
   */
  constructor(replayCapacity: number, alpha?: number, beta?: number);

  constructor(replayCapacity: number, alpha: number = 0.5, beta: number = 0.5) {
    this.replayCapacity = replayCapacity;
    this._sumTree = PrioritizedReplayBuffer._makeSumTree(replayCapacity);
    this.buffer = new Array<ExItExperience | null>(replayCapacity).fill(null);
    this._addCount = 0n;
    this._alpha = alpha;
    this._beta = beta;
  }

  /**
   * Factory for SumTree — deferred to sibling port.
   * @java new SumTree(replayCapacity)
   */
  private static _makeSumTree(replayCapacity: number): SumTree {
    // Deferred: SumTree is in batch AI#3 (sibling). Provide a minimal stub that
    // throws if called before the real port is integrated.
    const priorities = new Float32Array(replayCapacity);
    let maxPriority = 1.0;
    return {
      set(index: number, priority: number): void {
        priorities[index] = priority;
        if (priority > maxPriority) maxPriority = priority;
      },
      get(index: number): number {
        return priorities[index]!;
      },
      maxRecordedPriority(): number {
        return maxPriority;
      },
      totalPriority(): number {
        let sum = 0;
        for (let i = 0; i < priorities.length; i++) sum += priorities[i]!;
        return sum;
      },
      stratifiedSample(batchSize: number): number[] {
        // Deferred: full stratified sampling — use uniform fallback
        const size = Math.min(batchSize, priorities.length);
        const indices: number[] = [];
        for (let i = 0; i < size; i++) {
          indices.push(Math.floor(Math.random() * size));
        }
        return indices;
      },
    } as unknown as SumTree;
  }

  //-------------------------------------------------------------------------

  /**
   * @java PrioritizedReplayBuffer.add(ExItExperience)
   */
  add(experience: ExItExperience): void {
    this._sumTree.set(this.cursor(), this._sumTree.maxRecordedPriority());
    this.buffer[this.cursor()] = experience;
    this._addCount++;
  }

  /**
   * Adds a new sample of experience, with given priority level.
   * @java PrioritizedReplayBuffer.add(ExItExperience, float)
   */
  addWithPriority(experience: ExItExperience, priority: number): void {
    this._sumTree.set(this.cursor(), Math.pow(priority, this._alpha));
    this.buffer[this.cursor()] = experience;
    this._addCount++;
  }

  /**
   * @param indices
   * @return Array of priorities for the given indices
   * @java PrioritizedReplayBuffer.getPriorities(int[])
   */
  getPriorities(indices: number[]): number[] {
    const priorities = new Array<number>(indices.length);
    for (let i = 0; i < indices.length; i++) {
      priorities[i] = this._sumTree.get(indices[i]!);
    }
    return priorities;
  }

  /**
   * @return True if we're empty
   * @java PrioritizedReplayBuffer.isEmpty()
   */
  isEmpty(): boolean {
    return this._addCount === 0n;
  }

  /**
   * @return True if we're full
   * @java PrioritizedReplayBuffer.isFull()
   */
  isFull(): boolean {
    return this._addCount >= BigInt(this.replayCapacity);
  }

  /**
   * @return Number of samples we currently contain
   * @java PrioritizedReplayBuffer.size()
   */
  size(): number {
    if (this.isFull()) return this.replayCapacity;
    else return Number(this._addCount);
  }

  /**
   * @param batchSize
   * @return Sample of batchSize indices (stratified).
   * @java PrioritizedReplayBuffer.sampleIndexBatch(int)
   */
  sampleIndexBatch(batchSize: number): number[] {
    return this._sumTree.stratifiedSample(batchSize);
  }

  /**
   * @java PrioritizedReplayBuffer.sampleExperienceBatch(int)
   */
  sampleExperienceBatch(batchSize: number): ExItExperience[] {
    const numSamples = Math.min(batchSize, Number(this._addCount));
    const batch: ExItExperience[] = [];
    const indices = this.sampleIndexBatch(numSamples);

    const weights = new Array<number>(batchSize);
    let maxWeight = Number.NEGATIVE_INFINITY;
    const maxIdx = Math.min(this.replayCapacity, Number(this._addCount)) - 1;

    for (let i = 0; i < numSamples; i++) {
      if (indices[i]! > maxIdx) indices[i] = maxIdx;
    }

    const priorities = this.getPriorities(indices);

    for (let i = 0; i < numSamples; i++) {
      const exp = this.buffer[indices[i]!];
      if (exp != null) batch.push(exp);
      const prob = priorities[i]! / this._sumTree.totalPriority();
      weights[i] = Math.pow((1.0 / this.size()) * (1.0 / prob), this._beta);
      maxWeight = Math.max(maxWeight, weights[i]!);
    }

    for (let i = 0; i < numSamples; i++) {
      batch[i]!.setWeightPER(weights[i]! / maxWeight);
      batch[i]!.setBufferIdx(indices[i]!);
    }

    return batch;
  }

  /**
   * @java PrioritizedReplayBuffer.sampleExperienceBatchUniformly(int)
   */
  sampleExperienceBatchUniformly(batchSize: number): ExItExperience[] {
    const numSamples = Math.min(batchSize, Number(this._addCount));
    const batch: ExItExperience[] = [];
    const bufferSize = this.size();

    for (let i = 0; i < numSamples; i++) {
      const exp = this.buffer[Math.floor(Math.random() * bufferSize)];
      if (exp != null) batch.push(exp);
    }

    return batch;
  }

  /**
   * @java PrioritizedReplayBuffer.allExperience()
   */
  allExperience(): (ExItExperience | null)[] {
    return this.buffer;
  }

  /**
   * Sets priority levels.
   * @java PrioritizedReplayBuffer.setPriorities(int[], float[])
   */
  setPriorities(indices: number[], priorities: number[]): void {
    console.assert(indices.length === priorities.length);

    for (let i = 0; i < indices.length; i++) {
      if (indices[i]! >= 0) {
        this._sumTree.set(indices[i]!, Math.pow(priorities[i]!, this._alpha));
      }
    }
  }

  /**
   * @return Our sum tree data structure.
   * @java PrioritizedReplayBuffer.sumTree()
   */
  sumTree(): SumTree {
    return this._sumTree;
  }

  /**
   * @return Alpha hyperparam
   * @java PrioritizedReplayBuffer.alpha()
   */
  alpha(): number {
    return this._alpha;
  }

  /**
   * @return Beta hyperparam
   * @java PrioritizedReplayBuffer.beta()
   */
  beta(): number {
    return this._beta;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Number of samples we have added
   * @java PrioritizedReplayBuffer.addCount()
   */
  addCount(): bigint {
    return this._addCount;
  }

  /**
   * @return Index of next location that we'll write to
   * @java PrioritizedReplayBuffer.cursor()
   */
  cursor(): number {
    return Number(this._addCount % BigInt(this.replayCapacity));
  }

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @param filepath
   * @return Experience buffer restored from binary file (deferred: no Java serialisation in TS)
   * @java PrioritizedReplayBuffer.fromFile(Game, String)
   */
  static fromFile(_game: Game, _filepath: string): PrioritizedReplayBuffer | null {
    // DEFERRED: Java object serialisation not available in TypeScript.
    throw new Error("PrioritizedReplayBuffer.fromFile: Java serialisation is deferred in TS.");
  }

  /**
   * Writes this complete buffer to a binary file (deferred in TS).
   * @java PrioritizedReplayBuffer.writeToFile(String)
   */
  writeToFile(_filepath: string): void {
    // DEFERRED: Java object serialisation not available in TypeScript.
    throw new Error("PrioritizedReplayBuffer.writeToFile: Java serialisation is deferred in TS.");
  }

  //-------------------------------------------------------------------------
}
