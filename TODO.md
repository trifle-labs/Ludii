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
- [ ] 🤖 Port `Common/src/main/collections/HashedBitSet.java` to `@ludii/typescript-common` with parity tests 🚧 _in progress_ (note: actual source is at `Core/src/other/state/zhash/HashedBitSet.java`)
- [ ] 🤖 Port first parser/description primitive from `Language/` (e.g. token scanner or symbol table) into a new `@ludii/typescript-language` package
- [ ] 🤖 Add a shared parity-test fixture pattern (Java behaviour snapshots → TS assertions) and document it in `typescript/README.md` 🚧 _in progress_
- [ ] 🤖 Expand `typescript/packages/common/src/index.ts` exports as new modules land
- [ ] 🤖 Keep `typescript/README.md` parity-status table updated after each merged module
- [ ] 🤖 Ensure `npm run lint && npm run build && npm test` stays green after every increment

---

## Track B — Outside contributor track (👥 human / review-required)

These tasks require product decisions, curation, or manual validation that
automation cannot reliably perform alone.

- [ ] 👥 Define and prioritize the "minimum viable engine" module list — which 10–15 Java classes must be ported before real game state is possible in the browser
- [ ] 👥 Review and ratify API-shape decisions where TypeScript ergonomics diverge from Java (e.g. generics, null handling, checked exceptions)
- [ ] 👥 Write the browser-player roadmap: specify what "real Ludii-backed game state" must expose to the DOM layer
- [ ] 👥 Provide canonical Java behaviour examples for edge cases in tricky modules (game rules, scoring, move generation)
- [ ] 👥 Perform manual QA on the browser demo (`typescript/packages/browser-player/demo/index.html`) and document UX requirements
- [ ] 👥 Coordinate issue triage: open GitHub Issues for each Track A item above and assign contributors
- [ ] 👥 Decide whether the Java desktop app (`PlayerDesktop/`) remains a supported build target or is maintenance-only
- [ ] 👥 Update `CONTRIBUTING.md` (or add one) with porting conventions, PR checklist, and how to run parity tests

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
