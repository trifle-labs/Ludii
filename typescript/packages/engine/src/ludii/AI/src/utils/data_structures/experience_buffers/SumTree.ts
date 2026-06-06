// @java AI/src/utils/data_structures/experience_buffers/SumTree.java

/**
 * Sum tree data structure for Prioritized Experience Replay.
 *
 * Implementation based on that from Dopamine (but translated to Java):
 * https://github.com/google/dopamine/blob/master/dopamine/replay_memory/sum_tree.py
 *
 * A sum tree is a complete binary tree whose leaves contain values called
 * priorities. Internal nodes maintain the sum of the priorities of all leaf
 * nodes in their subtree.
 *
 * @java utils/data_structures/experience_buffers/SumTree.java
 * @author Dennis Soemers
 */

//-------------------------------------------------------------------------

/**
 * Compute ceil(log2(n))
 * @java main.math.BitTwiddling.log2RoundUp(int)
 */
function log2RoundUp(n: number): number {
  if (n <= 1) return 0;
  return Math.ceil(Math.log2(n));
}

/**
 * Compute next power of 2 >= n
 * @java main.math.BitTwiddling.nextPowerOf2(int)
 */
function nextPowerOf2(n: number): number {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Minimal FVector used within SumTree.
 */
class FVector {
  private data: Float32Array;

  public constructor(size: number) {
    this.data = new Float32Array(size);
  }

  public dim(): number {
    return this.data.length;
  }

  public get(i: number): number {
    return this.data[i]!;
  }

  public set(i: number, v: number): void {
    this.data[i] = v;
  }

  public addToEntry(i: number, delta: number): void {
    this.data[i]! += delta;
  }

  /** Create linearly spaced vector of (n+1) values from start to end (inclusive if inclusive=true) */
  public static linspace(start: number, end: number, n: number, _inclusive: boolean): FVector {
    const v = new FVector(n);
    for (let i = 0; i < n; ++i) {
      v.data[i] = start + (end - start) * (i / (n - 1));
    }
    return v;
  }
}

/**
 * Sum tree data structure for Prioritized Experience Replay.
 *
 * @java utils.data_structures.experience_buffers.SumTree
 */
export class SumTree {

  //-------------------------------------------------------------------------

  /** @java SumTree.nodes */
  protected readonly nodes: FVector[];

  /** @java SumTree.maxRecordedPriority */
  protected maxRecordedPriority: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param capacity
   * @java SumTree(int)
   */
  public constructor(capacity: number) {
    this.nodes = [];
    const treeDepth = log2RoundUp(capacity);
    let levelSize = 1;

    for (let i = 0; i < treeDepth + 1; ++i) {
      const nodesAtThisDepth = new FVector(levelSize);
      this.nodes.push(nodesAtThisDepth);
      levelSize *= 2;
    }

    this.maxRecordedPriority = 1.0;
  }

  //-------------------------------------------------------------------------

  /**
   * Sample from the sum tree.
   * Each element has a probability p_i / sum_j p_j of being picked.
   * @return Sampled index
   * @java SumTree.sample()
   */
  public sample(): number {
    return this.sampleWithQuery(Math.random());
  }

  /**
   * Sample from the sum tree with a given query value in [0, 1].
   * @param inQueryValue A value in [0, 1], used for sampling
   * @return Sampled index
   * @java SumTree.sample(double)
   */
  public sampleWithQuery(inQueryValue: number): number {
    let queryValue = inQueryValue * this.totalPriority();

    // Traverse the sum tree
    let nodeIdx = 0;
    for (let i = 1; i < this.nodes.length; ++i) {
      const nodesAtThisDepth = this.nodes[i]!;

      // Compute children of previous depth's node.
      const leftChild = nodeIdx * 2;
      const leftSum = nodesAtThisDepth.get(leftChild);

      // Each subtree describes a range [0, a), where a is its value.
      if (queryValue < leftSum) {
        nodeIdx = leftChild;
      } else {
        nodeIdx = leftChild + 1;
        queryValue -= leftSum;
      }
    }

    return nodeIdx;
  }

  /**
   * Sample a stratified batch of given size.
   * @param batchSize
   * @return Array of size batchSize, sampled from the sum tree.
   * @java SumTree.stratifiedSample(int)
   */
  public stratifiedSample(batchSize: number): number[] {
    const bounds = FVector.linspace(0.0, 1.0, batchSize + 1, true);

    const result: number[] = new Array(batchSize);
    for (let i = 0; i < batchSize; ++i) {
      const segmentStart = bounds.get(i);
      const segmentEnd = bounds.get(i + 1);
      const queryVal = segmentStart + Math.random() * (segmentEnd - segmentStart);
      result[i] = this.sampleWithQuery(queryVal);
    }
    return result;
  }

  //-------------------------------------------------------------------------

  /**
   * @param nodeIdx
   * @return Value of the leaf node corresponding to given node index
   * @java SumTree.get(int)
   */
  public get(nodeIdx: number): number {
    return this.nodes[this.nodes.length - 1]!.get(nodeIdx);
  }

  /**
   * Sets the value of a given leaf node, and updates internal nodes accordingly.
   * This operation takes O(log(capacity)).
   * @param inNodeIdx Index of leaf node to be updated
   * @param value Nonnegative value to be assigned to node.
   * @java SumTree.set(int, float)
   */
  public set(inNodeIdx: number, value: number): void {
    let nodeIdx = inNodeIdx;
    this.maxRecordedPriority = Math.max(this.maxRecordedPriority, value);
    const deltaValue = value - this.get(nodeIdx);

    // Now traverse back the tree, adjusting all sums along the way.
    for (let i = this.nodes.length - 1; i >= 0; --i) {
      const nodesAtThisDepth = this.nodes[i]!;
      nodesAtThisDepth.addToEntry(nodeIdx, deltaValue);
      nodeIdx = Math.floor(nodeIdx / 2);
    }
  }

  /**
   * @return Our max recorded priority
   * @java SumTree.maxRecordedPriority()
   */
  public maxRecordedPriority_get(): number {
    return this.maxRecordedPriority;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Total priority summed up over the entire tree
   * @java SumTree.totalPriority()
   */
  public totalPriority(): number {
    return this.nodes[0]!.get(0);
  }

  //-------------------------------------------------------------------------
}
