import { readFileSync } from 'node:fs';
import { parseLud } from '@ludii/typescript-language';
import { applyOptions } from './dist/src/lud-options.js';
const src=readFileSync('/Users/billy/GitHub/trifle-labs/Ludii/Common/res/lud/board/race/reach/Murus Gallicus.lud','utf8');
const ast=applyOptions(parseLud(src));
function findAll(node, head, out=[]){ if(!node||node.kind!=='list')return out; if(node.items[0]?.name===head)out.push(node); for(const it of node.items)findAll(it,head,out); return out; }
const fmt=n=>n.kind==='number'?('num:'+n.value):n.kind==='ident'?('id:'+JSON.stringify(n.name)):n.kind==='string'?('str:'+JSON.stringify(n.value)):n.kind==='list'?(n.delimiter+'['+n.items.map(fmt).join(' ')+']'):('?'+n.kind);
for(const p of findAll(ast,'place')) console.log('PLACE:', p.items.map(fmt).join('  '));
