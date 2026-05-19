# Decision: Java Desktop App Support Status

**Decision:** the Java desktop app (`PlayerDesktop/`) is **maintenance-
only** going forward in this fork.

This document records the rationale and the operational consequences.
It is a planning decision, not an immutable policy — open a PR with an
updated decision if the situation changes.

## Context

- The fork is in the middle of a TypeScript migration of the Ludii
  engine. The TS workspace lives under `typescript/` and targets a
  browser-first runtime.
- `PlayerDesktop/` is the legacy Swing-based desktop application. It
  pulls in 11 sibling Java modules via `build.xml` (`Common`, `Core`,
  `Evaluation`, `ViewController`, `Features`, `AI`, `Manager`,
  `Mining`, `Generation`, `LudiiDocGen`, `Language`, `Player`).
- The fork has 188 `.java` files under `PlayerDesktop/` alone, on top
  of the much larger engine modules.

## Why maintenance-only, not actively supported

1. **Active investment lives in the TS port.** Every recent commit in
   this branch touches `typescript/` packages. Splitting effort across
   two UIs slows the TS port for no proportional gain.
2. **Desktop is not a target for the browser-player roadmap.** The
   [`BROWSER_PLAYER_ROADMAP.md`](BROWSER_PLAYER_ROADMAP.md) milestones
   all assume a DOM runtime.
3. **Swing's accessibility / mobile story is poor.** Even if effort
   were available, modernising the Swing surface would not address the
   reasons the TS port exists.
4. **The Java engine modules upstream are still alive.** Maintenance-
   only does **not** mean removed — sync points with upstream Ludii
   remain valuable for cross-checking parity against the TS port.

## Why not "deprecated / removed entirely"

- The TS port is months away from feature parity with the Java engine.
  Removing `PlayerDesktop/` before then leaves no working interactive
  app at all.
- Several Track A ports use the Java app's behaviour as the ground
  truth in parity tests. Keeping it buildable preserves the ability to
  capture fresh Java behaviour snapshots when porting tricky modules.
- Upstream may still upstream bugfixes; we shouldn't refuse them.

## What "maintenance-only" means in practice

- ✅ Bug fixes that prevent the desktop app from building are in scope.
- ✅ Security/dependency updates that affect the desktop app are in
  scope.
- ✅ Cherry-picks from upstream Ludii that affect desktop behaviour are
  in scope, with the standard PR review.
- ❌ New desktop-only features are out of scope.
- ❌ Desktop UI rewrites or restyles are out of scope.
- ❌ Major Swing migrations (e.g. JavaFX, Compose Desktop) are out of
  scope.
- ❌ AI-agent integration changes that are desktop-only.

## Implications for the workspace

- The npm workspace and CI do not exercise the desktop build. That's
  fine — the desktop build runs via Ant (`PlayerDesktop/build.xml`)
  and is unrelated to the TS pipeline.
- The `Mining/` directory's trial logs and CSVs (~2 GB) stay where
  they are. They are inputs to desktop analysis tooling, not the TS
  port.
- `CONTRIBUTING.md` already lists `PlayerDesktop/` as out-of-scope for
  TS-port contributions; that text is still accurate.

## When to revisit

Revisit this decision if any of the following becomes true:

- The TS browser-player reaches functional parity with the Java
  desktop app (per the MVE acceptance checklist, plus AI playback +
  the Mining tooling equivalents).
- Upstream Ludii deprecates the desktop app, removing the parity
  benchmark argument.
- A maintainer explicitly volunteers to own the desktop app and
  drive a UI modernisation.

Until then, the rule is simple: **don't break the Java desktop build,
but don't add to it either.**
