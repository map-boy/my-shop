(function(){
  var s=document.currentScript, slug=s.getAttribute('data-product')||'', img=s.getAttribute('data-img')||'';
  var host=s.getAttribute('data-host')||new URL(s.src).origin;
  var b=document.createElement('button'); b.textContent=s.getAttribute('data-label')||'Try it on';
  b.style.cssText='padding:12px 20px;border-radius:12px;border:1px solid #111;background:#111;color:#fff;font:600 14px system-ui;cursor:pointer';
  s.parentNode.insertBefore(b,s);
  b.onclick=function(){
    var o=document.createElement('div'); o.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.85)';
    var f=document.createElement('iframe'); f.allow='camera; fullscreen';
    f.src=host+'/try-on?p='+encodeURIComponent(slug)+(img?'&img='+encodeURIComponent(img):'')+'&embed=1';
    f.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff';
    var x=document.createElement('button'); x.textContent='\u00d7';
    x.style.cssText='position:absolute;top:10px;right:14px;z-index:2;font:700 28px system-ui;background:#fff;border:0;border-radius:50%;width:40px;height:40px;cursor:pointer';
    x.onclick=function(){ o.remove(); };
    o.appendChild(f); o.appendChild(x); document.body.appendChild(o);
  };
})();
