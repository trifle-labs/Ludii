<img align="right" src="./resources/ludii-logo-64x64.png">

# Ludii

This fork keeps the original Java Ludii codebase in place while actively building a TypeScript port in the same repository.

## Repository layout

- `/home/runner/work/Ludii/Ludii/Common` through `/home/runner/work/Ludii/Ludii/PlayerDesktop`: the upstream-style Java implementation
- `/home/runner/work/Ludii/Ludii/typescript`: the TypeScript workspace for the port
- `/home/runner/work/Ludii/Ludii/typescript/packages/common`: shared utility ports, currently including a broad `FVector` port
- `/home/runner/work/Ludii/Ludii/typescript/packages/browser-player`: a browser-facing package and demo surface for web delivery experiments

## Current direction

The Java code remains the canonical reference for behavior and data structures.
The TypeScript workspace is where new porting work happens in this fork.

This repository is intentionally not trying to keep the top-level documentation in upstream parity. The README should explain how this fork works today.

## Requirements

### Java

- JDK 8 or higher
- Ant

### TypeScript

- Node.js 20+
- npm 10+

## Getting started

### Java application

Build the existing desktop application from the repository root:

```bash
cd /home/runner/work/Ludii/Ludii/PlayerDesktop
ant clean build
```

The main desktop entry point remains `app.StartDesktopApp` in `/home/runner/work/Ludii/Ludii/PlayerDesktop/src/app/StartDesktopApp.java`.

### TypeScript workspace

From the repository root:

```bash
cd /home/runner/work/Ludii/Ludii
npm install
npm run lint
npm run build
npm test
```

These commands validate every workspace package.

## TypeScript port status

The TypeScript port is still incremental, but it now has two concrete foundations:

1. **Common utilities**
   - `/home/runner/work/Ludii/Ludii/typescript/packages/common/src/fvector.ts` ports the Java `Common/src/main/collections/FVector.java` API broadly enough to support numeric experiments and parity-oriented tests.
2. **Browser delivery**
   - `/home/runner/work/Ludii/Ludii/typescript/packages/browser-player` provides a minimal embeddable browser game surface so the port has a web-first target while engine work continues.

The port is not yet a full replacement for the Java runtime, parser, or game engine.

## Browser demo

Build the browser player package:

```bash
cd /home/runner/work/Ludii/Ludii
npm run build --workspace @ludii/typescript-browser-player
```

Then open `/home/runner/work/Ludii/Ludii/typescript/packages/browser-player/demo/index.html` in a browser.

## Porting workflow

When adding new TypeScript ports:

1. Use the Java implementation as the source of truth.
2. Keep the TypeScript work isolated under `/home/runner/work/Ludii/Ludii/typescript/packages`.
3. Add parity-oriented tests for every behavior that is being ported.
4. Update documentation when the port surface changes.

## Other resources

- [Ludii Tutorials](https://ludiitutorials.readthedocs.io/en/latest/)
- [Ludii downloads and manuals](https://ludii.games/download.php)
- [Ludii Example AI](https://github.com/Ludeme/LudiiExampleAI)
- [Ludii Python AI](https://github.com/Ludeme/LudiiPythonAI)
- [Ludii AI Competition](https://github.com/Ludeme/LudiiAICompetition)

## Contributing

Contributions are welcome for both the Java code and the TypeScript port.

- Use pull requests for code and documentation changes.
- Keep TypeScript changes scoped to the workspace when possible.
- Treat the Java implementation as the behavioral reference unless the fork explicitly decides otherwise for a given module.

## Citation

When citing Ludii in academic work, use the project paper:
https://ecai2020.eu/papers/1248_paper.pdf

## Contact

For help with the upstream Ludii project, use the [Ludii Forum](https://ludii.games/forums/) or `ludii(dot)games(at)gmail(dot)com`.
