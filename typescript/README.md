# Ludii TypeScript Migration Workspace

This directory contains the first incremental TypeScript workspace for Ludii.

## Current scope

- `packages/common`: initial ports of foundational utilities from the Java `Common` module
- `packages/browser-player`: an embeddable browser game surface to prove the web-play requirement

## Commands

Run these commands from the repository root:

- `npm install`
- `npm run lint`
- `npm run build`
- `npm test`

## Browser demo

Build the browser package:

```bash
cd .
npm install
npm run build --workspace @ludii/typescript-browser-player
```

Then open `typescript/packages/browser-player/demo/index.html` in a browser.

The current browser milestone is intentionally small: it provides an embeddable, browser-playable game surface so the migration has a concrete web target while the larger engine port proceeds module by module.

## Near-term migration path

1. Expand `packages/common` with additional Java `Common` utilities and parity tests.
2. Port game-description and parsing primitives from `Language`.
3. Port game state, move generation, and trial/state transitions from `Core`.
4. Replace the temporary browser demo with a real Ludii-backed browser renderer as engine parity grows.
