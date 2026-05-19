import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CentreFeature,
  CornerFeature,
  DecisionTree,
  defaultGeometricFeatures,
  FriendlyNeighbourCountFeature,
  ticTacToeGame,
} from "../src/index.js";

describe("FeatureSet on tic-tac-toe", () => {
  it("CornerFeature activates on (0,0) and (2,2), not on (1,1)", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const moves = game.moves(ctx);
    const corner = moves.find((m) => m.siteIndices[0] === 0);
    const centre = moves.find((m) => m.siteIndices[0] === 4);
    if (!corner || !centre) throw new Error("missing moves");
    const f = new CornerFeature();
    assert.equal(f.activation(ctx, corner), 1);
    assert.equal(f.activation(ctx, centre), 0);
  });

  it("CentreFeature activates only on the geometric centre", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const moves = game.moves(ctx);
    const corner = moves.find((m) => m.siteIndices[0] === 0);
    const centre = moves.find((m) => m.siteIndices[0] === 4);
    if (!corner || !centre) throw new Error("missing moves");
    const f = new CentreFeature();
    assert.equal(f.activation(ctx, corner), 0);
    assert.equal(f.activation(ctx, centre), 1);
  });

  it("FriendlyNeighbourCountFeature counts orthogonal own pieces", () => {
    const game = ticTacToeGame();
    let ctx = game.start();
    // P1 plays site 0
    const m0 = game.moves(ctx).find((m) => m.siteIndices[0] === 0);
    if (!m0) throw new Error("no m0");
    ctx = game.apply(ctx, m0);
    // P2 plays site 4
    const m1 = game.moves(ctx).find((m) => m.siteIndices[0] === 4);
    if (!m1) throw new Error("no m1");
    ctx = game.apply(ctx, m1);
    // Now consider P1's move at site 1 (next to P1 at site 0)
    const candidate = game.moves(ctx).find((m) => m.siteIndices[0] === 1);
    if (!candidate) throw new Error("no candidate");
    const f = new FriendlyNeighbourCountFeature();
    assert.equal(f.activation(ctx, candidate), 1);
  });

  it("FeatureSet.extract returns one value per feature", () => {
    const game = ticTacToeGame();
    const ctx = game.start();
    const moves = game.moves(ctx);
    const centre = moves.find((m) => m.siteIndices[0] === 4);
    if (!centre) throw new Error("no centre");
    const set = defaultGeometricFeatures();
    const vec = set.extract(ctx, centre);
    assert.equal(vec.length, 3);
    // Centre move: corner=0, centre=1, neighbours=0
    assert.deepEqual(vec, [0, 1, 0]);
  });
});

describe("DecisionTree", () => {
  it("walks left when feature <= threshold and right otherwise", () => {
    const tree = new DecisionTree({
      kind: "internal",
      featureIndex: 0,
      threshold: 0.5,
      left: { kind: "leaf", value: -1 },
      right: { kind: "leaf", value: +1 },
    });
    assert.equal(tree.predict([0]), -1);
    assert.equal(tree.predict([1]), +1);
  });

  it("softmaxOver yields a valid probability distribution", () => {
    const trees = [
      new DecisionTree({
        kind: "internal",
        featureIndex: 0,
        threshold: 0.5,
        left: { kind: "leaf", value: 0 },
        right: { kind: "leaf", value: 2 },
      }),
    ];
    const features = [[0], [1], [0]];
    const probs = DecisionTree.softmaxOver(trees, features);
    assert.equal(probs.length, 3);
    const sum = probs.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9);
    // The middle entry (feature=1, value=2) should be largest.
    assert.ok((probs[1] ?? 0) > (probs[0] ?? 0));
  });
});
