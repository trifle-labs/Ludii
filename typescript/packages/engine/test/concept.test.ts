import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CONCEPT_NAMES, ConceptSet, isConceptName } from "../src/index.js";

describe("ConceptSet", () => {
  it("starts empty", () => {
    const set = new ConceptSet();
    assert.equal(set.size, 0);
    assert.equal(set.has("Add"), false);
  });

  it("add returns a new set with the concept added", () => {
    const a = new ConceptSet();
    const b = a.add("Add");
    assert.equal(a.size, 0);
    assert.equal(b.size, 1);
    assert.equal(b.has("Add"), true);
  });

  it("add returns the same set when the concept is already present", () => {
    const a = new ConceptSet(["Add"]);
    const b = a.add("Add");
    assert.equal(a, b);
  });

  it("union merges concepts", () => {
    const a = ConceptSet.of("Add", "Move");
    const b = ConceptSet.of("Move", "Remove");
    const u = a.union(b);
    assert.deepEqual([...u.toArray()].sort(), ["Add", "Move", "Remove"]);
  });

  it("toArray returns a frozen snapshot", () => {
    const set = ConceptSet.of("Add");
    const arr = set.toArray();
    assert.equal(Object.isFrozen(arr), true);
  });

  it("isConceptName narrows declared names only", () => {
    for (const name of CONCEPT_NAMES) {
      assert.equal(isConceptName(name), true);
    }
    assert.equal(isConceptName("Nope"), false);
    assert.equal(isConceptName(7), false);
  });
});
