/* ELC Portal: topographic contour field.
   Warped concentric rings radiating from the masthead mark, drawn into #topo.
   Ink on cream, very low opacity. Anchor = #mark (the old dial) or the .brand
   .lockup img that replaced it in 0051: the 0050 sweep found the field had
   been silently dead since the dial was retired (#mark gone, early return).
   Robust to iframe/embedded loads: a ResizeObserver on the document root
   fires on observe and on any size change, rebuilding once the viewport
   reports a real size. Static (no animation); drops out cleanly at print. */
(function(){
  var svg = document.getElementById('topo');
  var mark = document.getElementById('mark') || document.querySelector('.brand .lockup');
  if(!svg || !mark) return;
  var NS = 'http://www.w3.org/2000/svg';
  function build(){
    var W = window.innerWidth || document.documentElement.clientWidth,
        H = window.innerHeight || document.documentElement.clientHeight;
    if(!W || !H) return;                       // container not sized yet; the ResizeObserver retries
    var m = mark.getBoundingClientRect();
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var cx = m.left + m.width/2, cy = m.top + m.height/2;
    var seed = 1.7;
    var harm = [{k:2,a:0.10,p:0.6+seed},{k:3,a:0.06,p:2.1+seed},{k:5,a:0.035,p:4.0+seed},{k:7,a:0.018,p:1.2+seed}];
    var maxR = Math.hypot(Math.max(cx,W-cx), Math.max(cy,H-cy)) + 80;
    var N = 180, step = 52;
    for(var r=step; r<maxR; r+=step){
      var d='';
      for(var i=0;i<=N;i++){
        var t=i/N*Math.PI*2, pert=0;
        for(var h=0;h<harm.length;h++) pert+=harm[h].a*Math.sin(harm[h].k*t+harm[h].p);
        var rr=r*(1+pert), x=cx+rr*Math.cos(t), y=cy+rr*Math.sin(t);
        d+=(i===0?'M':'L')+x.toFixed(1)+' '+y.toFixed(1);
      }
      var p=document.createElementNS(NS,'path');
      p.setAttribute('d', d+'Z'); p.setAttribute('fill','none');
      p.setAttribute('stroke','rgba(31,31,33,0.10)'); p.setAttribute('stroke-width','1');
      svg.appendChild(p);
    }
  }
  build();
  new ResizeObserver(build).observe(document.documentElement);
})();
