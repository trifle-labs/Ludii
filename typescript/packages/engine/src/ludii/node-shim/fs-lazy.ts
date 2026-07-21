/**
 * Browser-safe lazy access to node:fs / node:path for ported Java TOOLING
 * classes (Mining experiments, AI training utilities). These classes are part
 * of the 1:1 port surface (registered in java-ts-ctors) but only ever RUN
 * under Node; a static `import * as fs from "fs"` made the whole engine
 * module graph unloadable in the browser. The dynamic import resolves under
 * Node and is caught (null) in the browser — calling any fs-using tooling
 * method in the browser throws a clear error instead.
 */
type FsModule = typeof import("node:fs");
type PathModule = typeof import("node:path");

let fsModule: FsModule | null = null;
let pathModule: PathModule | null = null;
try {
  fsModule = await import("node:fs");
  pathModule = await import("node:path");
} catch {
  /* browser — tooling entry points are unavailable */
}

function requireNode<T>(mod: T | null, name: string): T {
  if (mod === null) {
    throw new Error(`${name} is unavailable in the browser (Node-only tooling path).`);
  }
  return mod;
}

export const fs: FsModule = new Proxy({} as FsModule, {
  get(_t, prop) {
    return (requireNode(fsModule, "node:fs") as unknown as Record<PropertyKey, unknown>)[prop];
  },
});

export const path: PathModule = new Proxy({} as PathModule, {
  get(_t, prop) {
    return (requireNode(pathModule, "node:path") as unknown as Record<PropertyKey, unknown>)[prop];
  },
});
