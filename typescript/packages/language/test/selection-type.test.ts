import assert from "node:assert/strict";
import test from "node:test";

import { SELECTION_TYPE_VALUES, SelectionType } from "../src/index.js";

test("SelectionType exposes the three Java constants by name", () => {
  assert.equal(SelectionType.CONTEXT, "CONTEXT");
  assert.equal(SelectionType.SELECTION, "SELECTION");
  assert.equal(SelectionType.TYPING, "TYPING");
});

test("SelectionType is frozen — values cannot be mutated at runtime", () => {
  assert.throws(() => {
    // @ts-expect-error — the namespace is intentionally readonly.
    SelectionType.CONTEXT = "OTHER";
  });
});

test("SELECTION_TYPE_VALUES enumerates the constants in Java declaration order", () => {
  assert.deepEqual(SELECTION_TYPE_VALUES, ["CONTEXT", "SELECTION", "TYPING"]);
});
