import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DecisionTree,
  DecisionTreeTrainer,
  type DiscoverySample,
  discoverFeatures,
  SpatialOffsetFeature,
  ticTacToeGame,
} from "../src/index.js";

describe("DecisionTreeTrainer", () => {
  it("recovers a single-split decision rule from clean samples", () => {
    // Label = features[0] > 0.5 → 1, else 0. Two clear partitions.
    const samples = [
      { features: [0.1, 0.0], label: 0 },
      { features: [0.2, 1.0], label: 0 },
      { features: [0.3, 0.0], label: 0 },
      { features: [0.6, 1.0], label: 1 },
      { features: [0.8, 0.0], label: 1 },
      { features: [0.9, 1.0], label: 1 },
    ];
    const trainer = new DecisionTreeTrainer({
      maxDepth: 3,
      minSamplesPerLeaf: 1,
    });
    const tree = trainer.train(samples);
    for (const s of samples) {
      const prediction = tree.predict(s.features);
      // Predicted means should match the label (binary partitioning).
      assert.equal(Math.round(prediction), s.label);
    }
  });

  it("collapses to a single leaf when no useful split exists", () => {
    const samples = [
      { features: [0, 0], label: 7 },
      { features: [1, 1], label: 7 },
      { features: [0, 1], label: 7 },
      { features: [1, 0], label: 7 },
    ];
    const trainer = new DecisionTreeTrainer();
    const tree = trainer.train(samples);
    assert.equal(tree.root.kind, "leaf");
    if (tree.root.kind === "leaf") {
      assert.equal(tree.root.value, 7);
    }
  });

  it("respects maxDepth by stopping recursion early", () => {
    const samples = [];
    for (let i = 0; i < 16; i += 1) {
      samples.push({ features: [i, i * 2], label: i });
    }
    const trainer = new DecisionTreeTrainer({ maxDepth: 1 });
    const tree = trainer.train(samples);
    // depth 1 ⇒ root is internal, both children are leaves.
    if (tree.root.kind !== "internal") {
      assert.fail("expected an internal root");
    }
    assert.equal(tree.root.left.kind, "leaf");
    assert.equal(tree.root.right.kind, "leaf");
  });
});

describe("Feature discovery", () => {
  it("ranks features by correlation against labelled samples", () => {
    // Build a tiny dataset on tic-tac-toe: label = 1 if the target cell
    // has a friendly piece exactly to its left, else 0. Discovery should
    // pick the offset(-1, 0)=friend feature near the top.
    const game = ticTacToeGame();
    let ctx = game.start();
    // P1 places at site 0; P2 at site 8.
    const m1 = game.moves(ctx).find((m) => m.siteIndices[0] === 0);
    if (!m1) throw new Error("expected P1 move at 0");
    ctx = game.apply(ctx, m1);
    const m2 = game.moves(ctx).find((m) => m.siteIndices[0] === 8);
    if (!m2) throw new Error("expected P2 move at 8");
    ctx = game.apply(ctx, m2);

    const samples: DiscoverySample[] = [];
    for (const m of game.moves(ctx)) {
      const target = m.siteIndices[0] ?? -1;
      // Label: 1 iff the cell to the immediate left is owned by mover.
      const x = target % 3;
      let label = 0;
      if (x > 0) {
        const left = ctx.state.cellAt(target - 1).owner;
        label = left === m.mover ? 1 : 0;
      }
      samples.push({ context: ctx, move: m, label });
    }
    const featureSet = discoverFeatures(samples, {
      maxRadius: 1,
      topK: 3,
    });
    assert.ok(featureSet.features.length > 0);
    // The top feature should reference (-1, 0) friend.
    const top = featureSet.features[0];
    assert.ok(top instanceof SpatialOffsetFeature);
    if (top instanceof SpatialOffsetFeature) {
      assert.equal(top.dx, -1);
      assert.equal(top.dy, 0);
      assert.equal(top.relation, "friend");
    }
  });
});

describe("DecisionTree.softmaxOver", () => {
  it("returns a probability distribution that sums to 1", () => {
    const trees = [
      new DecisionTree({ kind: "leaf", value: 0.1 }),
      new DecisionTree({ kind: "leaf", value: 0.5 }),
    ];
    const probs = DecisionTree.softmaxOver(trees, [[1], [2], [3]]);
    assert.equal(probs.length, 3);
    let sum = 0;
    for (const p of probs) sum += p;
    assert.ok(Math.abs(sum - 1) < 1e-9);
    // All equal (same leaf values) → uniform.
    for (const p of probs) {
      assert.ok(Math.abs(p - 1 / 3) < 1e-9);
    }
  });
});
