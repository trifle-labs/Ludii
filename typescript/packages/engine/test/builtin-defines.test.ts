import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getBuiltinDefines } from "../src/builtin-defines.js";

describe("builtin defines", () => {
  it("loads the bundled .def library", () => {
    const entries = getBuiltinDefines();
    assert.ok(
      entries.length > 100,
      `expected >100 defines, got ${entries.length}`,
    );
    const names = new Set(entries.map((e) => e.name));
    // Sample a handful of well-known names from Common/res/def/**.
    for (const expected of [
      "IsInCheck",
      "KnightWalk",
      "LastDirection",
      "NoPieceOnBoard",
      "OccupiedNbors",
    ]) {
      assert.ok(names.has(expected), `missing builtin "${expected}"`);
    }
  });

  it("caches subsequent calls", () => {
    const a = getBuiltinDefines();
    const b = getBuiltinDefines();
    assert.equal(a, b);
  });
});
