# Java provenance tags (`@java`)

Goal: make the TypeScript port a faithful, *traceable* recreation of the Java
Ludii engine, so that an upstream Java change can be mechanically traced to the
exact TS code that implements it — and so feature/implementation parity can be
audited rather than guessed.

## The tag

Every TS file that ports Java logic, and every exported symbol that maps to a
named Java class/method, carries a machine-greppable tag:

```ts
// @java <repo-relative-path> [Symbol]
```

- `<repo-relative-path>` is relative to the **Ludii repo root**
  (`/Users/billy/GitHub/trifle-labs/Ludii`), e.g.
  `Core/src/game/rules/play/moves/nonDecision/effect/Slide.java`.
- `[Symbol]` (optional) names the Java class/method when the file or function
  mirrors a specific one, e.g. `Trajectories` or `State.fullHash`.

Examples:

```ts
// @java Core/src/game/util/graph/Trajectories.java Trajectories
export class Trajectories { … }

// @java Core/src/game/rules/play/moves/nonDecision/effect/Slide.java Slide
function compileSlide(node: LudList, env: CompileEnv): MovesFn { … }
```

### Rules

1. Put a file-level `// @java` near the top of every ported file.
2. Put a symbol-level `// @java` on every exported function/class that
   corresponds to a distinct Java class (especially the per-ludeme `compileXxx`
   functions — they are our stand-ins for Java's one-class-per-ludeme tree).
3. For TS-invented code with **no** Java counterpart, say so explicitly with
   `// @java (none) — TS-only <reason>` so a reader stops looking for a Java file.
4. Keep existing human-readable `/** Java parity: … */` prose if you like — the
   `// @java` tag is the *machine* index and must be present alongside it.

The legacy styles (`Java parity:`, `Ported from`, inline `Java:`) are **not**
sufficient on their own: they are inconsistent and not all carry a file path.
Migrate them to the `// @java` tag.

## The manifest

`gen-provenance.mjs` walks the TS sources, extracts every `// @java` tag, and
emits `java-provenance.tsv` (columns: `ts_location`, `java_path`, `symbol`,
`java_exists`). It also **verifies each cited Java path still exists** and exits
non-zero if any are stale — this is the early-warning that an upstream refactor
moved or deleted a file we depend on.

```sh
node tools/parity/gen-provenance.mjs
```

## How this is used against upstream

When Ludii Java changes:

1. Take the list of changed Java files (a `git diff --name-only` upstream).
2. Grep `java-provenance.tsv` for those paths → the exact TS files/lines to review.
3. Stale-path failures from the generator flag deletions/moves to reconcile.

This is the backbone of the parity system; the trial-replay (Layer 2), grammar
coverage (Layer 1), and golden-fixture (Layer 3) checks verify the *behavior*,
while this manifest verifies the *mapping*.
