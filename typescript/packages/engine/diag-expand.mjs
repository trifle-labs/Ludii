import { readFileSync } from 'node:fs';
import { applyOptions, collectDefaultOptions, expandDefines } from './dist/src/index.js';
const abs='/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/race/reach/Murus Gallicus.lud';
let src=readFileSync(abs,'utf8');
const defs=collectDefaultOptions(src);
console.log('default options:', JSON.stringify(defs).slice(0,400));
let s2=applyOptions(src, defs);
s2=expandDefines(s2);
// find the place Stack lines
for(const line of s2.split('\n')) if(line.includes('place Stack')) console.log('PLACE>',line.trim());
// find rangeP1 leftover
if(s2.includes('<Board')) console.log('UNEXPANDED <Board still present!');
