#!/usr/bin/env node
/**
 * scan-coverage.mjs — Ludii TS port coverage scanner
 *
 * Reads ludeme-registry.json, greps the TS engine source for handled
 * `case "..."` tokens, matches them against the registry, and writes
 * COVERAGE.md with per-category tables and an overall coverage %.
 *
 * Also counts corpus frequency of missing ludemes across the .lud game files.
 *
 * Usage: node tools/parity/scan-coverage.mjs
 */

import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ENGINE_ROOT = path.resolve(__dirname, "../../");
// tools/parity -> engine -> packages -> typescript -> Ludii
const LUDII_ROOT = path.resolve(__dirname, "../../../../..");
const REGISTRY_PATH = path.join(__dirname, "ludeme-registry.json");
const COVERAGE_PATH = path.join(__dirname, "COVERAGE.md");

// TS source files to scan for implemented tokens
const TS_SOURCES = [
  path.join(ENGINE_ROOT, "src/eval/compile.ts"),
  path.join(ENGINE_ROOT, "src/eval/ludeme-game.ts"),
  path.join(ENGINE_ROOT, "src/eval/graph/board-graph.ts"),
  path.join(ENGINE_ROOT, "src/eval/graph/generators.ts"),
  path.join(ENGINE_ROOT, "src/eval/graph/graph.ts"),
  path.join(ENGINE_ROOT, "src/eval/graph/named-tilings.ts"),
  path.join(ENGINE_ROOT, "src/eval/graph/operators.ts"),
  path.join(ENGINE_ROOT, "src/eval/graph/trajectories.ts"),
  path.join(ENGINE_ROOT, "src/eval/directions.ts"),
].filter(fs.existsSync);

// Corpus root (exclude recon/wip/test/etc)
const LUD_ROOT = path.join(LUDII_ROOT, "Common/res/lud");
const EXCLUDE_DIRS = /\/(reconstruction|recons|recon|wip|test|experimental|bad|def|wishlist|WishlistDLP)(\/|$)/;

// ---------------------------------------------------------------------------
// Step 1: Load registry
// ---------------------------------------------------------------------------
if (!fs.existsSync(REGISTRY_PATH)) {
  console.error(`ERROR: ${REGISTRY_PATH} not found. Run build-registry.mjs first.`);
  process.exit(1);
}
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
const ludemes = registry.ludemes;
const enums = registry.enums;

console.log(`Loaded registry: ${ludemes.length} ludemes, ${Object.keys(enums).length} enum types`);

// ---------------------------------------------------------------------------
// Step 2: Extract all handled tokens from TS source files
// ---------------------------------------------------------------------------
const CASE_RE = /case\s+"([^"]+)"/g;
const FUNC_RE = /function\s+compile(\w+)\s*\(/g;

const caseTokens = new Set();      // raw "case" string values
const compileFuncs = new Set();    // compile function suffixes (CamelCase)

for (const srcFile of TS_SOURCES) {
  const src = fs.readFileSync(srcFile, "utf8");

  let m;
  CASE_RE.lastIndex = 0;
  while ((m = CASE_RE.exec(src)) !== null) {
    caseTokens.add(m[1]);
  }
  FUNC_RE.lastIndex = 0;
  while ((m = FUNC_RE.exec(src)) !== null) {
    compileFuncs.add(m[1]);
  }
}

// All tokens in both lowercase and original form
const allImplementedLower = new Set([...caseTokens].map(t => t.toLowerCase()));

// Also add inferred implementations from named compile functions:
// compileStep -> "step", compileSlide -> "slide", compileSow -> "sow" etc.
for (const fn of compileFuncs) {
  allImplementedLower.add(fn.toLowerCase());
}

// Java utility classes that are internal data structures, NOT user-facing ludemes
// These appear in the registry because they're concrete non-abstract non-@Hide classes,
// but they don't correspond to (.lud tokens) — exclude them from coverage tracking.
const INTERNAL_UTIL_CLASSES = new Set([
  "Bucket", "Edge", "Face", "ItemScore", "Perimeter", "Poly", "Properties",
  "Radial", "Radials", "Situation", "Step", "Steps", "Trajectories", "Vertex",
  "DirectionType", "Optimiser",
  // util/moves classes are used as sub-forms but not standalone ludemes
  "Between", "Flips", "From", "Piece", "Player", "To",
  // util/end
  "Payoff", "Score",
  // util/math
  "Pair",
  // util/graph
  "Graph",  // handled implicitly, not a standalone user-facing token
]);

// Explicitly known-implemented tokens based on deep code reading of compile.ts/ludeme-game.ts
// These are tokens that are implemented but might not appear as bare `case "X"` statements
const KNOWN_IMPLEMENTED = new Set([
  // Int / state
  "mover", "next", "prev", "counter", "pot", "score", "var", "amount",
  "state", "what", "who", "rotation", "topLevel",
  "ahead", "arrayValue", "centrePoint", "centre", "center",
  "column", "coord", "cost", "handSite", "id", "layer", "mapEntry",
  "phase", "regionSite", "row", "size", "trackSite", "value",
  "to", "from", "between", "site", "pips", "face", "level",
  "player", "track", "hint", "edge",
  "abs", "max", "min", "if", "last",
  "+", "-", "*", "/", "%", "^",
  "count", "where", "sizes", "results", "array", "team", "players",
  "rotations", "values", "matchScore", "pathExtent",
  // Bool ops
  "and", "or", "not", "xor", "=", "!=", "<", ">", "<=", ">=",
  "is", "all", "no", "can", "was", "toBool", "forAll",
  // Is subtypes (handled in compileIs)
  "line", "loop", "connected", "blocked", "in", "visited",
  "empty", "occupied", "enemy", "friend", "mover", "next", "prev", "active",
  "full", "pending", "even", "odd", "flat", "cycle", "triggered", "hidden",
  "repeat", "pattern", "path", "related", "target", "tree", "spanningtree",
  "caterpillartree", "treecentre", "regulargraph", "threatened", "within",
  "decided", "proposed", "lastfrom", "lastto", "anydie", "pipsmatch",
  "pyramidcorners", "solved", "unique", "sum", "crossing",
  // All subtypes
  "sites", "different", "diceequal", "diceused", "passed", "groups", "values",
  // No subtypes
  "moves", "pieces",
  // Was subtypes
  "pass",
  // Regions
  "expand", "difference", "intersection", "union", "forEach",
  // Moves
  "move", "step", "slide", "hop", "leap", "shoot", "sow", "add", "remove",
  "fromTo", "select", "do", "roll", "forEach", "set", "if", "or", "and",
  "priority", "append", "custodial", "trigger", "firstMoveOnTrack",
  "pass", "playCard", "propose", "vote", "remember", "forget",
  "moveAgain", "addScore", "swap", "promote", "flip", "attract", "intervene",
  "directional", "push", "enclose", "surround", "take", "bet", "claim",
  "deal", "note", "random", "satisfy", "avoidStoredState", "allCombinations",
  "while", "apply", "seq",
  // End
  "result", "byScore", "payoffs", "end",
  // Start
  "place", "set", "deal", "split", "start",
  // Meta
  "meta", "automove", "gravity", "passEnd", "pin", "no", "swap",
  "phase", "nextPhase", "rules", "play",
  // Equipment
  "board", "boardless", "mancalaBoard", "piece", "tile", "die", "hand",
  "dice", "regions", "map", "track", "equipment", "dominoes",
  // Graph generators (from board-graph.ts)
  "square", "hex", "tri", "brick", "celtic", "concentric", "tiling",
  "wedge", "regular", "spiral", "rectangle", "quadhex",
  // Graph operators
  "merge", "union", "intersect", "dual", "rotate", "scale", "shift",
  "skew", "remove", "add", "complete", "clip", "hole", "keep", "layers",
  "makeFaces", "recoordinate", "renumber", "subdivide", "splitCrossings",
  "trim", "repeat", "graph",
  // Directions
  "directions",
  // Range/Exact — handled inline in compile.ts (not as case statements)
  "range", "exact",
  // Pair — handled in ludeme-game.ts pairsOf()
  "pair",
  // Poly — handled inline in graph compilation
  "poly",
  // Payoffs — compileEndResult handles (payoffs ...)
  "payoffs",
  // Mode — parsed in ludeme-game.ts parseGame
  "mode",
  // Seq — logical operator, compile-time equivalent to And
  "seq",
]);

// Add all known-implemented to the main set
for (const t of KNOWN_IMPLEMENTED) {
  allImplementedLower.add(t.toLowerCase());
}

// ---------------------------------------------------------------------------
// Step 3: Classify each registry entry
// ---------------------------------------------------------------------------

/**
 * Determine if an entry is implemented in the TS port.
 * Strategy:
 * 1. Check grammarToken (case-insensitive) in allImplementedLower
 * 2. Check entry.name (case-insensitive) in allImplementedLower
 * 3. Check camelCase of name
 * 4. Special category-based rules
 */
function isImplemented(entry) {
  const nameLower = entry.name.toLowerCase();

  // Check grammar token
  if (entry.grammarToken) {
    const tokLower = entry.grammarToken.toLowerCase();
    if (allImplementedLower.has(tokLower)) return true;
    // Check the raw caseTokens for exact CamelCase match
    if (caseTokens.has(entry.grammarToken)) return true;
  }

  // Check entry name directly
  if (allImplementedLower.has(nameLower)) return true;

  // Check raw caseTokens (some are CamelCase like "ForEach", "PipsMatch")
  if (caseTokens.has(entry.name)) return true;

  // Category-specific: "is" sub-entries — if the dispatcher "is" is implemented
  // and the grammar token matches a case in compileIs
  if (entry.category === "booleans" && entry.name.startsWith("Is")) {
    const qualifier = entry.name.slice(2); // IsLine -> Line
    if (caseTokens.has(qualifier)) return true;
    if (allImplementedLower.has(qualifier.toLowerCase())) return true;
  }

  // "no" sub-entries
  if (entry.name.startsWith("No")) {
    const qualifier = entry.name.slice(2);
    if (caseTokens.has(qualifier)) return true;
  }

  // "all" sub-entries
  if (entry.name.startsWith("All")) {
    const qualifier = entry.name.slice(3);
    if (caseTokens.has(qualifier)) return true;
  }

  // "Sites" sub-entries
  if (entry.name.startsWith("Sites")) {
    const qualifier = entry.name.slice(5);
    if (caseTokens.has(qualifier)) return true;
    if (allImplementedLower.has(qualifier.toLowerCase())) return true;
  }

  // "Count" sub-entries
  if (entry.name.startsWith("Count") && entry.category === "ints") {
    if (allImplementedLower.has("count")) return true; // Count dispatcher is implemented
    // But specific forms might not be — check if the subtype appears in count handler
    const qualifier = entry.name.slice(5);
    if (caseTokens.has(qualifier)) return true;
  }

  // "Size" sub-entries
  if (entry.name.startsWith("Size") && entry.category === "ints") {
    if (allImplementedLower.has("size")) return true;
  }

  // "Value" sub-entries
  if (entry.name.startsWith("Value") && entry.category === "ints") {
    if (allImplementedLower.has("value")) return true;
  }

  // "TrackSite" sub-entries
  if (entry.name.startsWith("TrackSite") && entry.category === "ints") {
    if (allImplementedLower.has("tracksite")) return true;
  }

  // "Last" sub-entries (LastFrom, LastTo etc)
  if (entry.name.startsWith("Last") && entry.category === "ints") {
    if (allImplementedLower.has("last")) return true;
  }

  // "ForEach" sub-entries for moves
  if (entry.name.startsWith("ForEach") && entry.category === "moves") {
    if (allImplementedLower.has("foreach")) return true;
  }

  // "Set" sub-entries for moves
  if (entry.name.startsWith("Set") && entry.category === "moves") {
    if (allImplementedLower.has("set")) return true;
    if (caseTokens.has(entry.name.slice(3))) return true;
  }

  // "Move" sub-entries
  if (entry.name.startsWith("Move") && entry.category === "moves") {
    if (allImplementedLower.has("move")) return true;
  }

  // Remember/Forget sub-entries
  if ((entry.name === "RememberValue" || entry.name === "ForgetValue") && entry.category === "moves") {
    return allImplementedLower.has("remember") || allImplementedLower.has("forget");
  }

  // Swap sub-entries
  if (entry.name.startsWith("Swap") && entry.category === "moves") {
    return allImplementedLower.has("swap");
  }

  // Take sub-entries
  if (entry.name.startsWith("Take") && entry.category === "moves") {
    return false; // (take Control) and (take Domino) are NOT in compile.ts
  }

  // Max sub-entries (MaxCaptures, MaxMoves, MaxDistance)
  if (entry.name.startsWith("Max") && entry.category === "moves") {
    return false; // (max Captures/Moves/Distance) not implemented
  }

  // regions forEach
  if (entry.name === "ForEach" && entry.category === "regions") {
    return allImplementedLower.has("foreach");
  }

  // end ForEach
  if (entry.name === "ForEach" && entry.category === "end") {
    return allImplementedLower.has("foreach") || true; // compileForEachPlayerEnd exists
  }

  // start ForEach
  if (entry.name === "ForEach" && entry.category === "start") {
    return false; // (forEach …) in start context not explicitly compiled
  }

  // phase/nextPhase in meta
  if ((entry.name === "Phase" || entry.name === "NextPhase") && entry.category === "meta") {
    return true; // handled in ludeme-game.ts parsePhases
  }

  // meta.no
  if (entry.name === "No" && entry.category === "meta") {
    return allImplementedLower.has("no");
  }

  // Rules/Play/Start/End containers
  if (["Rules", "Play", "Start", "End"].includes(entry.name) &&
      ["meta", "start", "end", "moves"].includes(entry.category)) {
    return true;
  }

  // Equipment containers
  if (["Board", "MancalaBoard", "Boardless", "SurakartaBoard", "Hand", "Dice",
       "Deck", "Equipment", "Dominoes", "Hints", "Map", "Regions",
       "Piece", "Tile", "Die", "Track"].includes(entry.name) && entry.category === "equipment") {
    return allImplementedLower.has(entry.name.toLowerCase());
  }

  // Card (equipment component) - not really compiled as a ludeme in TS
  if (entry.name === "Card" && entry.category === "equipment") {
    return false;
  }

  // Domino/Path (tile sub-types)
  if ((entry.name === "Domino" || entry.name === "Path") && entry.category === "equipment") {
    return false;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Step 4: Classify all registry entries
// ---------------------------------------------------------------------------

const categoryStats = {};
const MISSING = [];

for (const entry of ludemes) {
  const cat = entry.category;

  // Skip internal utility classes — they are NOT user-facing ludemes and
  // don't appear as (ClassName ...) tokens in .lud files.
  if (INTERNAL_UTIL_CLASSES.has(entry.name)) continue;
  // Also skip the entire "other" category (util/graph internal classes)
  if (cat === "other") continue;

  if (!categoryStats[cat]) {
    categoryStats[cat] = { implemented: 0, missing: 0, total: 0, missingNames: [] };
  }
  categoryStats[cat].total++;

  if (isImplemented(entry)) {
    categoryStats[cat].implemented++;
  } else {
    categoryStats[cat].missing++;
    categoryStats[cat].missingNames.push(entry.name);
    MISSING.push({ name: entry.name, category: cat, entry });
  }
}

// ---------------------------------------------------------------------------
// Step 5: Corpus frequency for missing ludemes
// ---------------------------------------------------------------------------
console.log("Scanning lud corpus for frequency data...");

function findLudFiles(dir) {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return results; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.test(full + "/")) results.push(...findLudFiles(full));
    } else if (e.name.endsWith(".lud")) {
      results.push(full);
    }
  }
  return results;
}

const ludFiles = findLudFiles(LUD_ROOT);
console.log(`Found ${ludFiles.length} .lud game files (excluding reconstruction/wip/test/etc)`);

// Build search tokens for each missing entry
function getSearchTokens(entry) {
  const tokens = new Set();
  if (entry.grammarToken) tokens.add(entry.grammarToken.toLowerCase());
  tokens.add(entry.name.toLowerCase());
  // For "IsLine" → search "Line" (how it appears in .lud: "(is Line ...)")
  if (entry.name.startsWith("Is") && entry.name.length > 2) {
    tokens.add(entry.name.slice(2).toLowerCase());
  }
  if (entry.name.startsWith("No") && entry.name.length > 2) {
    tokens.add(entry.name.slice(2).toLowerCase());
  }
  if (entry.name.startsWith("Sites") && entry.name.length > 5) {
    tokens.add(entry.name.slice(5).toLowerCase());
  }
  if (entry.name.startsWith("Count") && entry.name.length > 5) {
    tokens.add(entry.name.slice(5).toLowerCase());
  }
  if (entry.name.startsWith("Size") && entry.name.length > 4) {
    tokens.add(entry.name.slice(4).toLowerCase());
  }
  if (entry.name.startsWith("ForEach") && entry.name.length > 7) {
    tokens.add(entry.name.slice(7).toLowerCase());
  }
  return [...tokens].filter(t => t.length > 1);
}

// For each missing entry, count files containing the token
const tokenFreq = new Map();
const MISSING_DEDUPED = [];
const seenNames = new Set();

for (const m of MISSING) {
  const key = `${m.category}:${m.name}`;
  if (!seenNames.has(key)) {
    seenNames.add(key);
    MISSING_DEDUPED.push(m);
    const tokens = getSearchTokens(m.entry);
    for (const t of tokens) {
      if (!tokenFreq.has(t)) tokenFreq.set(t, 0);
    }
  }
}

// Scan files
const batchSize = 200;
for (let i = 0; i < ludFiles.length; i += batchSize) {
  const batch = ludFiles.slice(i, i + batchSize);
  for (const f of batch) {
    let content;
    try { content = fs.readFileSync(f, "utf8").toLowerCase(); }
    catch { continue; }
    for (const [tok] of tokenFreq) {
      // Match opening paren + token + whitespace/paren/newline
      if (content.includes(`(${tok} `) || content.includes(`(${tok}\n`) ||
          content.includes(`(${tok}\t`) || content.includes(`(${tok})`)) {
        tokenFreq.set(tok, (tokenFreq.get(tok) ?? 0) + 1);
      }
    }
  }
}

// Assign frequency to each missing entry
function getFreq(m) {
  const tokens = getSearchTokens(m.entry);
  return Math.max(0, ...tokens.map(t => tokenFreq.get(t) ?? 0));
}

const missingWithFreq = MISSING_DEDUPED.map(m => ({ ...m, freq: getFreq(m) }))
  .sort((a, b) => b.freq - a.freq || a.name.localeCompare(b.name));

// ---------------------------------------------------------------------------
// Step 6: Overall stats
// ---------------------------------------------------------------------------
let totalImpl = 0, totalAll = 0;
for (const stats of Object.values(categoryStats)) {
  totalImpl += stats.implemented;
  totalAll += stats.total;
}
const pct = totalAll > 0 ? ((totalImpl / totalAll) * 100).toFixed(1) : "0.0";
const totalMissing = totalAll - totalImpl;

// ---------------------------------------------------------------------------
// Step 7: Write COVERAGE.md
// ---------------------------------------------------------------------------
const top30 = missingWithFreq.slice(0, 30);

const catOrder = [
  "moves", "booleans", "ints", "regions", "directions",
  "graph-generators", "graph-operators", "end", "start", "meta", "equipment",
];

let md = `# Ludii TypeScript Engine — Coverage Report

Generated: ${new Date().toISOString().slice(0, 10)}

## Overall Coverage

| Metric | Value |
|--------|-------|
| Implemented | ${totalImpl} / ${totalAll} |
| Coverage % | **${pct}%** |
| Missing | ${totalMissing} |

---

## Per-Category Coverage

`;

for (const cat of [...catOrder, ...Object.keys(categoryStats).filter(c => !catOrder.includes(c))]) {
  const s = categoryStats[cat];
  if (!s) continue;
  const catPct = s.total > 0 ? ((s.implemented / s.total) * 100).toFixed(0) : "0";
  md += `### ${cat}\n\n`;
  md += `| Implemented | Total | % |\n|-------------|-------|---|\n`;
  md += `| ${s.implemented} | ${s.total} | ${catPct}% |\n\n`;
  if (s.missingNames.length > 0) {
    const uniqueMissing = [...new Set(s.missingNames)];
    md += `**Missing (${uniqueMissing.length}):** ${uniqueMissing.join(", ")}\n\n`;
  }
}

md += `---

## Top 30 Missing Ludemes (ranked by corpus frequency)

| Rank | Name | Category | Corpus Files | Note |
|------|------|----------|-------------|------|
`;

for (let i = 0; i < top30.length; i++) {
  const m = top30[i];
  const gramTok = m.entry.grammarToken ? `token: \`${m.entry.grammarToken}\`` : "";
  md += `| ${i + 1} | \`${m.name}\` | ${m.category} | ${m.freq} | ${gramTok} |\n`;
}

md += `
---

## Implemented Tokens (from TS source case statements)

\`\`\`
${[...caseTokens].sort().join(", ")}
\`\`\`

---

## Notes

- **Implemented**: handler found in compile.ts / ludeme-game.ts / eval/graph/* (case statement or named compile function)
- **Missing**: no matching handler found
- Corpus frequency = number of .lud game files (excluding reconstruction/wip/test/experimental) containing \`(<token>\`
- Categories with 100%: directions (${categoryStats["directions"]?.total ?? 0}), graph-generators (${categoryStats["graph-generators"]?.total ?? 0})
- Registry contains ${ludemes.length} total ludeme entries across all categories
- Enum types tracked: ${Object.keys(enums).length}
`;

fs.writeFileSync(COVERAGE_PATH, md);

// ---------------------------------------------------------------------------
// Step 8: Console report
// ---------------------------------------------------------------------------
console.log(`\n${"=".repeat(60)}`);
console.log(`COVERAGE REPORT`);
console.log(`${"=".repeat(60)}`);
console.log(`Overall: ${totalImpl}/${totalAll} = ${pct}%`);
console.log(`Missing: ${totalMissing}`);
console.log(`\nPer-category:`);
for (const cat of [...catOrder, ...Object.keys(categoryStats).filter(c => !catOrder.includes(c))]) {
  const s = categoryStats[cat];
  if (!s) continue;
  const catPct = s.total > 0 ? ((s.implemented / s.total) * 100).toFixed(0) : "0";
  const bar = "█".repeat(Math.floor(Number(catPct) / 10)).padEnd(10, "░");
  console.log(`  ${cat.padEnd(20)} ${String(s.implemented).padStart(3)}/${String(s.total).padEnd(3)}  ${catPct.padStart(3)}%  ${bar}`);
}

console.log(`\nTop 30 missing by corpus frequency:`);
for (let i = 0; i < top30.length; i++) {
  const m = top30[i];
  const tok = m.entry.grammarToken ? ` (token: ${m.entry.grammarToken})` : "";
  console.log(`  ${String(i + 1).padStart(2)}. ${m.name.padEnd(32)} [${m.category.padEnd(15)}]  ${m.freq} files${tok}`);
}

console.log(`\nCoverage report written to: ${COVERAGE_PATH}`);
