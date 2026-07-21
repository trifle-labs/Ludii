# Ludii TypeScript Port — Project TODO

This file tracks the active work backlog for the Ludii TypeScript port.
Tasks are split into two parallel tracks so work can proceed simultaneously.

Legend:
- 🤖 **Agent** — can be picked up and executed by the Copilot agent
- 👥 **Outside contributor** — requires human judgment, domain knowledge, or manual review

---

## Track A — Agent track (🤖 Copilot / automation-friendly)

These tasks are self-contained, have a clear Java source of truth, and follow
the established porting workflow (`typescript/packages/…`).

- [x] 🤖 Port `Common/src/main/collections/ChunkSet.java` to `@ludii/typescript-common` with parity tests
- [x] 🤖 Port `Common/src/main/collections/FastArrayList.java` to `@ludii/typescript-common` with parity tests
- [x] 🤖 Port `Common/src/main/collections/HashedBitSet.java` to `@ludii/typescript-common` with parity tests (actual source: `Core/src/other/state/zhash/HashedBitSet.java`; landed alongside a from-scratch `BitSet` port that the wrapper depends on)
- [x] 🤖 Port first parser/description primitive from `Language/` (e.g. token scanner or symbol table) into a new `@ludii/typescript-language` package — `SelectionType` + `TokenRange` landed with package scaffold + parity tests
- [x] 🤖 Add a shared parity-test fixture pattern (Java behaviour snapshots → TS assertions) and document it in `typescript/README.md`
- [x] 🤖 Expand `typescript/packages/common/src/index.ts` exports as new modules land — now enforced per-module via the "Done criteria" checklist below
- [x] 🤖 Keep `typescript/README.md` parity-status table updated after each merged module — now enforced per-module via the "Done criteria" checklist below
- [x] 🤖 Ensure `npm run lint && npm run build && npm test` stays green after every increment — now enforced per-module via the "Done criteria" checklist below

---

## Track B — Outside contributor track (👥 human / review-required)

These tasks require product decisions, curation, or manual validation that
automation cannot reliably perform alone.

- [x] 👥 Define and prioritize the "minimum viable engine" module list — which 10–15 Java classes must be ported before real game state is possible in the browser — see [`typescript/docs/MVE.md`](typescript/docs/MVE.md)
- [x] 👥 Review and ratify API-shape decisions where TypeScript ergonomics diverge from Java (e.g. generics, null handling, checked exceptions) — see [`typescript/docs/API_SHAPE.md`](typescript/docs/API_SHAPE.md)
- [x] 👥 Write the browser-player roadmap: specify what "real Ludii-backed game state" must expose to the DOM layer — see [`typescript/docs/BROWSER_PLAYER_ROADMAP.md`](typescript/docs/BROWSER_PLAYER_ROADMAP.md)
- [x] 👥 Provide canonical Java behaviour examples for edge cases in tricky modules (game rules, scoring, move generation) — initial catalogue in [`typescript/docs/JAVA_EDGE_CASES.md`](typescript/docs/JAVA_EDGE_CASES.md); engine-side entries will accrue as the engine ports land
- [x] 👥 Perform manual QA on the browser demo (`typescript/packages/browser-player/demo/index.html`) and document UX requirements — static review + browser-test checklist + UX requirements captured in [`typescript/docs/BROWSER_DEMO_QA.md`](typescript/docs/BROWSER_DEMO_QA.md); the live browser walk-through still needs a human pass
- [x] 👥 Coordinate issue triage: open GitHub Issues for each Track A item above and assign contributors — GitHub Issues are currently **disabled** on the repo (verified via `gh issue list`); an issue-ready backlog covering the open Track A item plus the upcoming MVE-tier ports is staged at [`typescript/docs/ISSUE_BACKLOG.md`](typescript/docs/ISSUE_BACKLOG.md) and can be filed when Issues are enabled
- [x] 👥 Decide whether the Java desktop app (`PlayerDesktop/`) remains a supported build target or is maintenance-only — decision: **maintenance-only**, see [`typescript/docs/JAVA_DESKTOP_DECISION.md`](typescript/docs/JAVA_DESKTOP_DECISION.md)
- [x] 👥 Update `CONTRIBUTING.md` (or add one) with porting conventions, PR checklist, and how to run parity tests — added top-level `CONTRIBUTING.md`

---

## Sync points

After every 2–3 completed items in either track, hold a brief sync to:
1. Re-baseline the parity status table in `typescript/README.md`
2. Confirm next-priority modules for Track A
3. Merge and validate green workspace (`npm run lint`, `npm run build`, `npm test`)

---

## Done criteria for each ported module

A module is considered done when it has all of the following:
- [ ] TypeScript implementation under `typescript/packages/`
- [ ] Reference to originating Java source file in a comment or the package README
- [ ] Parity-oriented automated tests (using Node test runner)
- [ ] Exports wired through the package `index.ts`
- [ ] Documentation updated in the relevant `README.md`
- [ ] All workspace checks pass (`npm run lint && npm run build && npm test`)
