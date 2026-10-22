import fs from 'node:fs';
const rd=f=>fs.readFileSync(f,'utf8'), wr=(f,s)=>fs.writeFileSync(f,s);
const svg=rd('public/logo.svg'), D=svg.match(/ d="([^"]+)"/)[1], VB=svg.match(/viewBox="([^"]+)"/)[1];
const [,, W, H]=VB.split(' ').map(Number);

wr('src/components/Logo.tsx',
"// FILE: src/components/Logo.tsx\n// Inline SVG logo. Colour = currentColor, size = className, so it adapts to any theme/background. No network request.\nimport React from 'react';\n\nconst D = "+JSON.stringify(D)+";\n\ninterface Props { className?: string; title?: string }\n\nconst Logo: React.FC<Props> = ({ className = 'h-9 w-auto', title }) => (\n  <svg\n    xmlns=\"http://www.w3.org/2000/svg\"\n    viewBox=\""+VB+"\"\n    className={className}\n    style={{ aspectRatio: '"+W+" / "+H+"', flexShrink: 0 }}\n    fill=\"currentColor\"\n    role={title ? 'img' : undefined}\n    aria-label={title}\n    aria-hidden={title ? undefined : true}\n    focusable=\"false\"\n  >\n    <path fillRule=\"evenodd\" d={D} />\n  </svg>\n);\n\nexport default Logo;\n");

wr('api/_logo.mjs',
"// Shared inline logo for server-rendered pages (underscore = not a Vercel function).\nexport const LOGO_PATH = "+JSON.stringify(D)+";\nexport const logoSvg = (h = 26) => '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\""+VB+"\" height=\"' + h + '\" fill=\"currentColor\" aria-hidden=\"true\" style=\"flex-shrink:0\"><path fill-rule=\"evenodd\" d=\"' + LOGO_PATH + '\"/></svg>';\n");

// favicon from the real logo (white on dark tile), 64x64
const sc=(40/H).toFixed(5), tx=((64-W*40/H)/2).toFixed(2);
wr('public/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n  <rect width="64" height="64" rx="14" fill="#0b0b0f"/>\n  <g transform="translate('+tx+' 12) scale('+sc+')" fill="#ffffff"><path fill-rule="evenodd" d="'+D+'"/></g>\n</svg>\n');
console.log('wrote Logo.tsx, api/_logo.mjs, favicon.svg');

const TERN=/\{settings\.logoUrl \? \(\s*<img[^>]*\/>\s*\) : \(\s*(?:<span[\s\S]*?<\/span>|<ShieldCheck[^>]*\/>)\s*\)\}/;
function patch(file, imp, fn){
  let s=rd(file); const o=s; s=fn(s);
  if(s===o){ console.log('NO CHANGE  ',file); return; }
  fs.copyFileSync(file,file+'.bak-logo');
  wr(file, (imp && !s.includes(imp) ? imp+'\n' : '')+s); console.log('patched    ',file);
}
const rep=(s,a,b)=>{ if(typeof a==='string'&&!s.includes(a)) console.log('  ! missing:',String(a).slice(0,60)); return s.replace(a,()=>b); };

patch('src/components/Navbar.tsx',"import Logo from './Logo';",s=>{
  s=rep(s,TERN,'<Logo className="h-9 w-auto text-ink-900 sm:h-10" />');
  return rep(s,'<span className="font-display text-lg font-bold">{settings.storeName}</span>','<span className="flex items-center gap-2.5 font-display text-lg font-bold"><Logo className="h-8 w-auto text-ink-900" />{settings.storeName}</span>');
});
patch('src/components/Footer.tsx',"import Logo from './Logo';",s=>rep(s,TERN,'<Logo className="h-10 w-auto text-white" />'));
patch('src/pages/admin/AdminLayout.tsx',"import Logo from '../../components/Logo';",s=>{
  s=rep(s,TERN,'<Logo className="h-9 w-auto text-white" />');
  return rep(s,'<span className="font-display text-base font-bold text-white">{settings.storeName}</span>','<span className="flex items-center gap-2.5 font-display text-base font-bold text-white"><Logo className="h-7 w-auto text-white" />{settings.storeName}</span>');
});
patch('src/pages/admin/AdminLogin.tsx',"import Logo from '../../components/Logo';",s=>rep(s,TERN,'<Logo className="h-9 w-auto text-white" />'));
patch('api/blog-ssr.mjs','import { logoSvg } from "./_logo.mjs";',s=>rep(s,'text-decoration:none">${esc(storeName)}</a>','text-decoration:none;display:inline-flex;align-items:center;gap:8px">${logoSvg(26)}${esc(storeName)}</a>'));