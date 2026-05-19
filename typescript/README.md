# Ludii TypeScript Workspace

This workspace holds the TypeScript port for this fork of Ludii.

## Packages

### `@ludii/typescript-common`

Shared utilities that are being ported from the Java `Common` module.

Current coverage includes:

- `FVector`
  - constructors for zero-filled, filled, copied, and wrapped vectors
  - vector arithmetic and scalar transforms
  - softmax, normalisation, entropy, and sampling helpers
  - structural editing helpers such as `range()`, `append()`, `cut()`, and `insert()`
  - cross-vector helpers such as `concat()`, `crossEntropy()`, `klDivergence()`, and `mean()`

Primary source:

- `/home/runner/work/Ludii/Ludii/Common/src/main/collections/FVector.java`

### `@ludii/typescript-browser-player`

A browser-focused package that proves the port can target a web runtime now, before the full engine is available.

Current contents:

- `TicTacToeGame`: a small deterministic game model used for package and UI validation
- `EmbeddedTicTacToe`: a DOM-driven embeddable surface
- `demo/index.html`: a zero-build demo page for quick manual checks

## Workspace commands

Run all commands from `/home/runner/work/Ludii/Ludii`:

```bash
npm install
npm run lint
npm run build
npm test
```

Additional useful commands:

```bash
npm run typecheck
npm run build --workspace @ludii/typescript-common
npm run build --workspace @ludii/typescript-browser-player
```

## Browser demo

```bash
cd /home/runner/work/Ludii/Ludii
npm run build --workspace @ludii/typescript-browser-player
```

Then open:

- `/home/runner/work/Ludii/Ludii/typescript/packages/browser-player/demo/index.html`

## Porting expectations

When porting Java classes into this workspace:

1. Preserve the Java API shape where it remains natural in TypeScript.
2. Keep parity-sensitive behavior covered by automated tests.
3. Prefer small, self-contained packages over cross-cutting edits across the repository.
4. Document the originating Java source file in the package README or code review notes.

## Near-term follow-up

- expand `@ludii/typescript-common` beyond `FVector`
- begin porting parser- and description-oriented primitives from `Language`
- replace the placeholder browser game with real Ludii-backed browser state and rendering once the engine port is ready
