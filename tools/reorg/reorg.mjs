import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const P=s=>s.replace(/\\/g,'/'),ROOT=P(process.cwd()),SRC=ROOT+'/src',DRY=process.argv.includes('--dry');
const MOVES=[['src/pages/admin','src/features/admin/pages'],['src/pages','src/features/storefront/pages'],['src/components','src/shared/components'],['src/lib','src/shared/lib'],['src/hooks','src/shared/hooks'],['src/data','src/shared/data'],['src/context','src/app/context']];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
const files=walk(SRC),set=new Set(files);
const mapPath=f=>{const r=f.slice(ROOT.length+1);for(const[a,b]of MOVES)if(r.startsWith(a+'/'))return ROOT+'/'+b+r.slice(a.length);return f;};
const CODE=/\.(tsx?|jsx?|mjs)$/,EXTS=['.ts','.tsx','.js','.jsx','.mjs','.json','.css'];
const resolve=(f,s)=>{let p;if(s.startsWith('.'))p=P(path.resolve(path.dirname(f),s));else if(s.startsWith('@/'))p=SRC+'/'+s.slice(2);else return null;
 if(set.has(p))return{t:p,k:'exact'};for(const e of EXTS)if(set.has(p+e))return{t:p+e,k:'ext'};for(const e of EXTS)if(set.has(p+'/index'+e))return{t:p+'/index'+e,k:'index'};return{t:null};};
const RE=/(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\n]+)\2/g;
const out=new Map(),bad=[],warn=[];let rewrites=0;
for(const f of files){if(!CODE.test(f))continue;const src=fs.readFileSync(f,'utf8'),nf=mapPath(f);
 if(/import\.meta\.glob|new URL\(/.test(src))warn.push(f.slice(ROOT.length+1));
 out.set(f,src.replace(RE,(m,pre,q,s)=>{const r=resolve(f,s);if(!r)return m;if(!r.t){bad.push(f.slice(ROOT.length+1)+'  ->  '+s);return m;}
  const nt=mapPath(r.t);if(nt===r.t&&nf===f)return m;let rel=nt.slice(SRC.length+1);
  if(r.k==='ext')rel=rel.replace(/\.[^./]+$/,'');if(r.k==='index')rel=rel.replace(/\/index\.[^./]+$/,'');rewrites++;return pre+q+'@/'+rel+q;}));}
const outside=[];for(const d of ['api','tools','tests','.github','vite.config.ts','middleware.ts','index.html','package.json','firebase.json','vercel.json']){
 const fp=ROOT+'/'+d;if(!fs.existsSync(fp))continue;for(const f of(fs.statSync(fp).isDirectory()?walk(fp):[fp])){if(f.includes('/reorg/')||!/\.(m?[jt]sx?|json|html|ya?ml)$/.test(f))continue;
  const t=fs.readFileSync(f,'utf8');if(/src\/(pages|components|lib|context|hooks|data)\b/.test(t))outside.push(f.slice(ROOT.length+1));}}
const moving=files.filter(f=>mapPath(f)!==f);
console.log(`files:${files.length} moving:${moving.length} importRewrites:${rewrites}`);
if(warn.length)console.log('WARN dynamic/glob usage, check by hand:\n  '+warn.join('\n  '));
if(bad.length)console.log('UNRESOLVED imports:\n  '+bad.join('\n  '));
if(outside.length)console.log('OUTSIDE files referencing moved src dirs:\n  '+outside.join('\n  '));
if((bad.length||outside.length)&&!process.env.FORCE){console.log('ABORT: fix the above or set FORCE=1');process.exit(2);}
if(DRY){console.log('dry run ok');process.exit(0);}
for(const f of files){const nf=mapPath(f);if(nf!==f){fs.mkdirSync(path.dirname(nf),{recursive:true});try{execFileSync('git',['mv',f,nf],{stdio:'ignore'})}catch{fs.renameSync(f,nf)}}
 if(out.has(f)&&out.get(f)!==fs.readFileSync(nf,'utf8'))fs.writeFileSync(nf,out.get(f));}
const rmEmpty=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true}))if(e.isDirectory())rmEmpty(d+'/'+e.name);if(!fs.readdirSync(d).length)fs.rmdirSync(d);};rmEmpty(SRC);
fs.writeFileSync(ROOT+'/tools/reorg/last-moves.json',JSON.stringify(moving.map(f=>[f.slice(ROOT.length+1),mapPath(f).slice(ROOT.length+1)]),null,1));
console.log('applied');