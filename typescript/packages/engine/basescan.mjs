import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compileLudemeSource } from "./dist/src/index.js";
const HERE = dirname(fileURLToPath(import.meta.url));
const LUD = join(HERE, "..", "..", "..", "Common", "res", "lud");
function walk(d,o){for(const n of readdirSync(d)){const p=join(d,n);const s=statSync(p);if(s.isDirectory())walk(p,o);else if(n.endsWith(".lud"))o.push(p);}return o;}
const heads=new Map();
const KNOWN=new Set(["square","rectangle","rect","circle","concentric","merge","union","intersect","dual","rotate","scale","shift","skew","add","remove","graph","tiling","clip","trim","keep","hole","subdivide","splitcrossings","makefaces","renumber","repeat","complete","mesh","layers","wedge","shape","renumberclockwise","recoordinate","poly"]);
for(const f of walk(LUD,[])){let src;try{src=readFileSync(f,"utf8");}catch{continue;}
try{compileLudemeSource(src);}catch(e){const m=(e&&e.message)||String(e);if(!/unsupported board tiling/.test(m))continue;
// extract board declaration substring and tally generator heads
const bi=src.indexOf("(board");if(bi<0)continue;
// crude: find all "(word" tokens after board for ~600 chars
const seg=src.slice(bi,bi+800);
for(const mm of seg.matchAll(/\(([a-zA-Z0-9_]+)/g)){const h=mm[1];if(!KNOWN.has(h.toLowerCase()))heads.set(h,(heads.get(h)??0)+1);}
}}
const sorted=[...heads.entries()].sort((a,b)=>b[1]-a[1]);
for(const [n,c] of sorted)console.log(String(c).padStart(4),n);
