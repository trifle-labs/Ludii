# Contributing to the Ludii TypeScript Port

This fork is in the middle of an incremental port from the Java Ludii engine
into a TypeScript workspace under `typescript/packages/`. Contributions are
welcome — please read this short guide first so your changes are easy to
review and land cleanly.

## What's in scope

- **In scope:** porting small, well-defined Java classes from `Common/`,
  `Core/`, and `Language/` into one of the workspace packages
  (`@ludii/typescript-common`, `@ludii/typescript-language`,
  `@ludii/typescript-browser-player`), plus tests, docs, and infrastructure
  for those ports.
- **Out of scope for now:** the desktop Java applications (`PlayerDesktop/`,
  `PlayerAndroid/`), trial logs and CSVs under `Mining/`, large game-rule
  rewrites, and anything that drags in a non-trivial graph of unported
  dependencies.

If you're unsure whether something is in scope, open an issue first.

## Workspace layout

```
typescript/
  packages/
    common/           — @ludii/typescript-common: collections, vector math, BitSet, HashedBitSet
    language/         — @ludii/typescript-language: parser/description primitives
    browser-player/   — @ludii/typescript-browser-player: DOM-facing demo + browser harness
```

The npm workspace is rooted at the repository top level. All scripts run
from there.

## Local setup

```bash
git clone git@github.com:trifle-labs/Ludii.git
cd Ludii
npm install
```

Then verify the workspace is healthy:

```bash
npm run lint
npm run build
npm test
```

All three must be green before you push. CI gates on the same commands.

## Porting workflow

Every ported Java class follows the same rhythm:

1. **Find the Java source of truth.** Note the path (e.g.
   `Common/src/main/collections/FastArrayList.java`) so you can reference
   it in the commit message and package README.
2. **Pick the target package.** Most low-level collection/utility ports
   belong in `@ludii/typescript-common`. Parser/description primitives go
   in `@ludii/typescript-language`. DOM/runtime concerns go in
   `@ludii/typescript-browser-player`.
3. **Mirror the Java API where it remains natural in TypeScript.**
   Translate `static final` → `const`, Java enums → frozen
   string-literal-union namespaces, `equals`/`hashCode` →
   `defaultEquals`/`defaultHashCode` helpers from `@ludii/typescript-common`.
4. **Preserve fail-fast semantics.** If the Java class throws
   `ConcurrentModificationException`, the TS port should throw the same
   exception (re-exported from `@ludii/typescript-common`).
5. **Use `bigint` for Java `long` arithmetic** when exactness matters
   (Zobrist hashes, BitSet hash codes, etc.). Don't try to fit 64-bit XORs
   into JS `number`.
6. **Write parity tests.** Use Node's built-in test runner
   (`node --test`). Tests should cover at least: construction, mutation,
   value semantics (`equals`, `hashCode`, `toString`), iteration, and any
   edge cases the Java class explicitly documents.
7. **Wire exports** through the package's `src/index.ts`.
8. **Update the package README.** Add the new class to the coverage
   bullet list and the primary-source list.
9. **Tick the TODO.** Move the task from `[ ]` to `[x]` in
   [`TODO.md`](TODO.md) with a short note (which class landed, any
   companion ports).

## Done criteria for a ported module

These are the same bullets enforced at the bottom of `TODO.md`. A module
is done when every box is checked:

- [ ] TypeScript implementation under `typescript/packages/`
- [ ] Reference to the originating Java source file in a code comment or
      the package README
- [ ] Parity-oriented automated tests (using `node --test`)
- [ ] Exports wired through the package's `src/index.ts`
- [ ] Documentation updated in the relevant `README.md`
- [ ] All workspace checks pass (`npm run lint && npm run build && npm test`)

## Pull request checklist

When you open a PR, please confirm:

- [ ] The PR claims a specific TODO item, or links to an issue
- [ ] The Java source file path appears in the commit message or package
      README
- [ ] New code has parity tests under the package's `test/` directory
- [ ] `npm run lint && npm run build && npm test` is green locally
- [ ] The package README and the TODO entry are updated in the same PR
- [ ] You haven't introduced new third-party runtime dependencies without
      flagging them in the PR description (see "Dependency policy" below)

PR titles follow [Conventional Commits](https://www.conventionalcommits.org/)
where practical — e.g.
`feat(common): port FastArrayList to TypeScript with parity tests`.

## Running parity tests

Each package owns its tests:

```bash
# Run every workspace's tests
npm test

# Run a single package's tests
npm test --workspace @ludii/typescript-common
npm test --workspace @ludii/typescript-language
npm test --workspace @ludii/typescript-browser-player

# Run tests for a single file (after building)
npm run build --workspace @ludii/typescript-common
node --test typescript/packages/common/dist/test/bit-set.test.js
```

Tests live in `typescript/packages/<pkg>/test/*.test.ts`. They compile
through the same `tsconfig.json` as `src/`, so type errors in tests fail
the build, not the test run.

## Java cross-reference convention

When porting a Java class, please include the Java path in **either**:

- a one-line code comment at the top of the TS file, **or**
- the package README under "Primary sources".

This keeps the eventual review/sync against upstream Ludii cheap.

## Dependency policy

- Default to zero third-party runtime dependencies. The engine should be
  small and self-contained.
- Time-locked third-party additions: do not pull in npm packages that
  have been published less than a month ago. If you need one, raise it in
  the PR description so a maintainer can sanity-check the source.
- Dev dependencies (Biome, TypeScript, `@types/node`) are pinned in the
  root `package.json`. Don't bump them in a code PR — open a separate
  housekeeping PR.

## Commit-message style

- Imperative mood (`port FastArrayList`, not `ported FastArrayList`).
- Mention the originating Java file in the body when porting.
- Include the workspace test counts for ports so reviewers can sanity-
  check coverage (`71 + 6 + 3 tests pass`).

## Where to ask questions

- Specific ports: open an issue against the TODO item you're working on.
- Workflow / scope: comment on the PR or open a discussion.
