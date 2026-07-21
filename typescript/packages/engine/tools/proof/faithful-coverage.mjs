import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const eng = '/Users/billy/GitHub/trifle-labs/Ludii/typescript/packages/engine';
const { parseEbnfGrammar } = await import(`${eng}/dist/src/ludii/Language/src/grammar/ebnf-grammar-loader.js`);
const { compileLud } = await import(`${eng}/dist/src/ludii/compiler/Compiler.js`);
const { createFullRegistry } = await import(`${eng}/dist/src/ludii/compiler/createFullRegistry.js`);
const grammar = parseEbnfGrammar(readFileSync(`${eng}/tools/parity/java-grammar-current.txt`,'utf8'));
// sample ~60 games across families
const all = execSync(`find /Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board -name '*.lud'`,{encoding:'utf8'}).trim().split('\n').filter(p=>!/\/(test|wip|bad|plain|subgame)\//.test(p));
const step = Math.floor(all.length/60);
const sample = all.filter((_,i)=>i%step===0).slice(0,60);
let ok=0, fail=0; const reasons={};
for (const p of sample) {
  let src; try { src=readFileSync(p,'utf8'); } catch { continue; }
  try {
    const g = createFullRegistry();
    const game = compileLud(src, grammar, g);
    if (game) ok++; else { fail++; (reasons['null game']=(reasons['null game']||0)+1); }
  } catch (e) {
    fail++;
    let r = (e.message||String(e)).split('\n')[0].slice(0,70);
    reasons[r]=(reasons[r]||0)+1;
  }
}
console.log(`Faithful compiler coverage on ${sample.length} sampled games: ${ok} compiled, ${fail} failed (${(100*ok/sample.length).toFixed(0)}%)`);
console.log('\nTop failure reasons:');
Object.entries(reasons).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([r,c])=>console.log(`  ${c}  ${r}`));
