import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compileLudemeSource } from "./dist/src/index.js";
const HERE = dirname(fileURLToPath(import.meta.url));
const LUD = join(HERE, "..", "..", "..", "Common", "res", "lud");
const want = process.argv[2];
function walk(d,o){for(const n of readdirSync(d)){const p=join(d,n);const s=statSync(p);if(s.isDirectory())walk(p,o);else if(n.endsWith(".lud"))o.push(p);}return o;}
let count=0;
for(const f of walk(LUD,[])){let src;try{src=readFileSync(f,"utf8");}catch{continue;}
try{compileLudemeSource(src);}catch(e){const m=(e&&e.message)||String(e);const mm=m.match(/unsupported board tiling "([^"]*)"/);if(mm&&mm[1]===want){count++;
const bi=src.indexOf("(board");const seg=src.slice(bi,bi+220).replace(/\s+/g," ");
console.log(f.slice(LUD.length+1));console.log("   ",seg);}}}
console.log("total",count);
