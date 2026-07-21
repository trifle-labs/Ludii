// Compare current shard results against a baseline set, reporting bucket
// improvements/regressions per trial. Usage:
//   node compare-shards.mjs <curPrefix> <basePrefix>
// where prefixes expand to `${prefix}${k}of3.json` for k in 0,1,2.
import { readFileSync } from 'node:fs';

const RANK = {
  COMPILE_FAIL: 0,
  START_FAIL: 1,
  MOVE_MISMATCH: 2,
  WINNER_MISMATCH: 3,
  REPLAY_OK_NO_OUTCOME: 4,
  OUTCOME_OK: 5,
};

const curPrefix = process.argv[2];
const basePrefix = process.argv[3];
if (!curPrefix || !basePrefix) {
  console.error('usage: compare-shards.mjs <curPrefix> <basePrefix>');
  process.exit(1);
}

const load = (f) => {
  const j = JSON.parse(readFileSync(f, 'utf8'));
  const m = new Map();
  for (const r of j.perTrial) m.set(r.trialFile, r);
  return m;
};

let same = 0;
let improved = 0;
let regressed = 0;
const impList = [];
const regList = [];
for (const k of [0, 1, 2]) {
  const base = load(`${basePrefix}${k}of3.json`);
  const cur = load(`${curPrefix}${k}of3.json`);
  for (const [key, c] of cur) {
    const b = base.get(key);
    if (!b) continue;
    const rb = RANK[b.bucket];
    const rc = RANK[c.bucket];
    if (rc > rb) {
      improved++;
      impList.push(`${c.game} ${b.bucket}->${c.bucket}`);
    } else if (rc < rb) {
      regressed++;
      regList.push(`${c.game} ${b.bucket}->${c.bucket} [${c.trialFile}]`);
    } else {
      same++;
    }
  }
}
console.log(`same=${same} improved=${improved} regressed=${regressed}`);
const tally = (arr) => {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
console.log('\nIMPROVED (game bucket-change : count):');
for (const [x, n] of tally(impList)) console.log(`  +${n}  ${x}`);
console.log('\nREGRESSED:');
for (const x of regList.sort()) console.log(`  -${x}`);
