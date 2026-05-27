import { parseLud } from '@ludii/typescript-language';
const src = '(game "T" (players 2) (equipment { (board (rectangle 7 8)) (piece "P" Each) }) (rules (start (place Stack "P1" (sites {0..7}) count:2)) (play (forEach Piece)) (end (no Moves Mover))))';
const ast = parseLud(src);
function find(node, head){ if(!node||node.kind!=='list')return null; if(node.items[0]?.name===head)return node; for(const it of node.items){const r=find(it,head); if(r)return r;} return null; }
const place=find(ast,'place');
const fmt=n=>n.kind==='number'?('num:'+n.value):n.kind==='ident'?('id:'+JSON.stringify(n.name)):n.kind==='string'?('str:'+n.value):n.kind==='list'?(n.delimiter+'['+n.items.map(fmt).join(' ')+']'):('?'+n.kind);
console.log('PLACE:', place.items.map(fmt).join('  '));
