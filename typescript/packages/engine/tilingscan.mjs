import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compileLudemeSource } from "./dist/src/index.js";
const HERE = dirname(fileURLToPath(import.meta.url));
const LUD = join(HERE, "..", "..", "..", "Common", "res", "lud");
function walk(d,o){for(const n of readdirSync(d)){const p=join(d,n);const s=statSync(p);if(s.isDirectory())walk(p,o);else if(n.endsWith(".lud"))o.push(p);}return o;}
const names=new Map();
for(const f of walk(LUD,[])){let src;try{src=readFileSync(f,"utf8");}catch{continue;}
try{compileLudemeSource(src);}catch(e){const m=(e&&e.message)||String(e);const mm=m.match(/unsupported board tiling "([^"]*)"/);if(mm){names.set(mm[1],(names.get(mm[1])??0)+1);}}}
const sorted=[...names.entries()].sort((a,b)=>b[1]-a[1]);
let tot=0; for(const [n,c] of sorted){console.log(String(c).padStart(4),n);tot+=c;}
console.log("total",tot);
