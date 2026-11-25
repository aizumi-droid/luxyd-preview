(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)],body=document.body;
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),small=matchMedia('(max-width:760px)');
let paused=false,frame=0,idle=0,previousY=scrollY,scrollTravel=0;
const active=()=>!paused&&!reduced.matches;
const {clamp,heroState,visibility,rollDigits,stackFits,contactLightProgress,photoPoint,photoEntryAction}=window.LuxydMotionState;
const hero=$('.hero'),photo=$('.hero-image'),intro=$('#introduction'),mobile=$('.mobile-cta'),form=$('#form');
const journey=document.createElement('div');journey.className='hero-journey';hero.before(journey);journey.append(hero);
body.classList.add('motion-b');body.classList.toggle('motion-reduced',reduced.matches);
function sizeHero(){const h=Math.max(small.matches?620:760,Math.min(small.matches?920:1100,innerHeight-32));body.style.setProperty('--hero-height',h+'px');}
sizeHero();
// Local highlight mask: dim only existing warm lights; the sky and architecture stay visible.
const scene=document.createElement('div');scene.className='hero-scene';photo.before(scene);scene.append(photo);
const ns='http://www.w3.org/2000/svg',lights=document.createElementNS(ns,'svg');
lights.setAttribute('viewBox','0 0 1672 941');lights.setAttribute('preserveAspectRatio','xMidYMid slice');lights.setAttribute('aria-hidden','true');lights.classList.add('hero-lights');
lights.innerHTML=`<defs><filter id="warm-lights" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.5 .2 -1 0 -.25 1.5 .2 -1 0 -.25 1.5 .2 -1 0 -.25 0 0 0 1 0"/><feComponentTransfer><feFuncR type="linear" slope="3" intercept="-.5"/><feFuncG type="linear" slope="3" intercept="-.5"/><feFuncB type="linear" slope="3" intercept="-.5"/></feComponentTransfer><feGaussianBlur stdDeviation="1.2"/></filter><mask id="lamp-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941" style="mask-type:luminance"><image href="${photo.getAttribute('src')}" width="1672" height="941" filter="url(#warm-lights)"/></mask></defs><g mask="url(#lamp-mask)" fill="#080b10"><path class="lamp-zone lamp-far" d="M550 0H1122V730H550Z"/><path class="lamp-zone lamp-mid" d="M290 0H550V730H290ZM1122 0H1382V730H1122Z"/><path class="lamp-zone lamp-near" d="M0 0H290V730H0ZM1382 0H1672V730H1382Z"/><path class="lamp-zone lamp-ground" d="M0 730H1672V941H0Z"/></g>`;scene.append(lights);
// One opening per page view; scrolling back never restarts it. Wait for the photograph to decode.
function beginOpening(){if(!active()||scrollY>100){body.classList.add('opening-complete');return;}body.classList.add('opening-ready');setTimeout(()=>body.classList.add('opening-complete'),2100);}
if(photo.decode)photo.decode().then(beginOpening,beginOpening);else if(photo.complete)beginOpening();else photo.addEventListener('load',beginOpening,{once:true});
const pause=document.createElement('button');pause.type='button';pause.className='motion-control';pause.textContent='Ⅱ';pause.setAttribute('aria-label','アニメーションを停止');pause.setAttribute('aria-pressed','false');hero.append(pause);
const gallery=$('#gallery'),seasons=$('.season-grid');
function hint(track,cls,text){const el=document.createElement('p');el.className='swipe-hint '+cls;el.innerHTML='<span>'+text+'</span><span aria-hidden="true">SWIPE →</span>';track.before(el);}
hint(gallery,'gallery-swipe','光のある風景をめぐる');hint(seasons,'season-swipe','四季をめぐる');
for(const [track,label] of [[gallery,'光の演出ギャラリー'],[seasons,'四季の光の演出']]){track.tabIndex=0;track.setAttribute('role','region');track.setAttribute('aria-label',label+'。左右キーまたはスワイプで移動');track.addEventListener('keydown',e=>{if(e.target!==track||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();move(track,e.key==='ArrowRight'?1:-1);});}
function move(track,d){const card=track.querySelector('figure');const gap=parseFloat(getComputedStyle(track).columnGap)||18;track.scrollBy({left:d*(card.getBoundingClientRect().width+gap),behavior:active()?'smooth':'instant'});}
$$('[data-scroll]').forEach(b=>b.addEventListener('click',()=>move(gallery,Number(b.dataset.scroll))));
$$('.gallery figure>img').forEach(img=>{const w=document.createElement('div');w.className='slide-window';img.before(w);w.append(img);});
const seasonNav=document.createElement('div');seasonNav.className='season-nav';seasonNav.innerHTML='<span class="season-count" aria-live="polite">01 / 04</span><div class="season-nav-controls"><button type="button" aria-label="前の季節">前へ</button><button type="button" aria-label="次の季節">次へ</button></div>';seasons.after(seasonNav);
const seasonButtons=seasonNav.querySelectorAll('button');seasonButtons[0].onclick=()=>move(seasons,-1);seasonButtons[1].onclick=()=>move(seasons,1);
function seasonState(){const rect=seasons.getBoundingClientRect(),cards=[...seasons.children];let nearest=0,dist=Infinity;cards.forEach((c,i)=>{const d=Math.abs(c.getBoundingClientRect().left-rect.left-22);if(d<dist){nearest=i;dist=d;}});seasonNav.querySelector('.season-count').textContent=String(nearest+1).padStart(2,'0')+' / 04';seasonButtons[0].disabled=seasons.scrollLeft<5;seasonButtons[1].disabled=seasons.scrollLeft>=seasons.scrollWidth-seasons.clientWidth-5;}
let seasonFrame=0;seasons.addEventListener('scroll',()=>{if(!seasonFrame)seasonFrame=requestAnimationFrame(()=>{seasonFrame=0;seasonState();});},{passive:true});seasonState();
let galleryFrame=0;function galleryMotion(){galleryFrame=0;if(!active())return;const r=gallery.getBoundingClientRect();gallery.querySelectorAll('.slide-window').forEach(w=>{const box=w.getBoundingClientRect();if(box.right<r.left||box.left>r.right)return;const x=clamp((box.left+box.width/2-r.left-r.width/2)/r.width,-1,1)*(small.matches?-5:-9);w.firstElementChild.style.setProperty('--slide-x',x+'px');});}
gallery.addEventListener('scroll',()=>{if(!galleryFrame)galleryFrame=requestAnimationFrame(galleryMotion);},{passive:true});galleryMotion();
// Photograph entry is independent from headings: no pre-viewport reveal or permanently hidden state.
const photoRecords=[],photoFlights=[];let photoFastUntil=0,photoLastAt=performance.now(),photoAnchor=false,photoAnchorTimer=0,photoScrollIdle=0;
function addPhoto(img,kind){img.addEventListener('load',requestUpdate,{once:true});const w=document.createElement('div');w.className='photo-window photo-entry-frame photo-entry-kind-'+kind;img.before(w);w.append(img);let curtain=null;if(kind==='curtain'){curtain=document.createElement('i');curtain.className='photo-entry-mask';curtain.setAttribute('aria-hidden','true');w.append(curtain);}photoRecords.push({el:w,img,kind,curtain,caption:img.closest('.work-main')?w.nextElementSibling:null,seen:false});}
$$('.work-main>img').forEach(img=>addPhoto(img,'rise'));
$$('.works-grid figure>img').forEach(img=>addPhoto(img,'rise'));
$$('.scene-grid article>img,.scene-grid .scene-photo>img').forEach(img=>addPhoto(img,'rise'));
// Prepare below-viewport photos before they can be seen; never move a visible photo down.
for(const rec of photoRecords){if(active()&&rec.el.getBoundingClientRect().top>=innerHeight)rec.el.classList.add('photo-rise-ready');}
function inView(el){const r=el.getBoundingClientRect();return r.top<innerHeight*.97&&r.bottom>0&&r.left<innerWidth&&r.right>0;}
const surfaces=$$('.technology,.budget');surfaces.forEach(el=>el.classList.add('surface-panel'));
function show(el){el.classList.remove('surface-pending');}
if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){show(e.target);io.unobserve(e.target);}},{threshold:0,rootMargin:'0px 0px 60px 0px'});for(const el of surfaces){if(active()&&!inView(el)){el.classList.add('surface-pending');io.observe(el);}}}
function photoAnimate(rec,el,frames,timing){if(!el?.animate)return;const a=el.animate(frames,{easing:'cubic-bezier(.3,.15,.3,1)',fill:'backwards',...timing});photoFlights.push({rec,a});}
function photoEntries(){
 const fast=performance.now()<photoFastUntil;let batch=0;
 for(const rec of photoRecords){if(rec.seen)continue;const r=rec.el.getBoundingClientRect();const action=photoEntryAction({top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right,viewport:innerHeight,width:innerWidth,enabled:active(),anchor:photoAnchor,fast,small:small.matches});
  if(action==='wait')continue;if(action==='play'&&(!rec.img.complete||!rec.img.naturalWidth))continue;rec.seen=true;if(action==='show'){rec.el.classList.remove('photo-rise-ready');continue;}
  const delay=small.matches?0:Math.min(batch++,1)*100;
  const initial=getComputedStyle(rec.el);const startOpacity=initial.opacity,startTransform=initial.transform;
  photoAnimate(rec,rec.el,[{opacity:startOpacity,transform:startTransform,offset:0},{opacity:1,offset:.45},{opacity:1,transform:'translateY(0)',offset:1}],{duration:small.matches?1200:1350,delay});
  rec.el.classList.remove('photo-rise-ready');
  if(rec.caption)photoAnimate(rec,rec.caption,[{opacity:.65},{opacity:1}],{duration:400,delay:180});
 }
 for(let i=photoFlights.length-1;i>=0;i--){const f=photoFlights[i],r=f.rec.el.getBoundingClientRect();if(!active()||photoAnchor||r.bottom<=0||r.top>=innerHeight){try{f.a.finish();}catch{}photoFlights.splice(i,1);}else if(f.a.playState==='finished')photoFlights.splice(i,1);}
}
function endPhotoAnchor(){photoAnchor=false;clearTimeout(photoAnchorTimer);requestUpdate();}
document.addEventListener('click',e=>{const link=e.target.closest?.('a[href^="#"]');if(!link||link.getAttribute('href')==='#')return;photoAnchor=true;clearTimeout(photoAnchorTimer);photoAnchorTimer=setTimeout(endPhotoAnchor,1800);});
addEventListener('wheel',endPhotoAnchor,{passive:true});addEventListener('touchstart',endPhotoAnchor,{passive:true});
addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))endPhotoAnchor();});
// A single demonstration; touching, keyboard use or scrolling away cancels it.
const range=$('#compareRange'),compare=$('.compare');let demo=0,demoStart=0,demonstrated=false,interacted=false;
const note=document.createElement('p');note.className='compare-instruction';note.textContent='中央のハンドルを左右に動かして、光の変化をご覧ください。';compare.after(note);
function stopDemo(){if(demo)cancelAnimationFrame(demo);demo=0;compare.classList.remove('is-demonstrating');compare.style.setProperty('--split',range.value+'%');}
function userCompare(){interacted=true;stopDemo();}
range.addEventListener('pointerdown',userCompare);range.addEventListener('keydown',userCompare);range.addEventListener('input',()=>{userCompare();compare.style.setProperty('--split',range.value+'%');});
function demonstrate(now){if(!active()||interacted||!inView(compare)){stopDemo();return;}if(!demoStart)demoStart=now;const t=clamp((now-demoStart)/3400);const offset=3.8*Math.sin(t*Math.PI*2)*Math.sin(t*Math.PI);compare.style.setProperty('--split',(50+offset)+'%');if(t<1)demo=requestAnimationFrame(demonstrate);else stopDemo();}
if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting&&!demonstrated&&!interacted&&active()){demonstrated=true;compare.classList.add('is-demonstrating');demo=requestAnimationFrame(demonstrate);io.disconnect();}},{threshold:.55});io.observe(compare);}
// Every animated value has a final-state DOM fallback. No text waits for an observer.
const onceRecords=[],running=[];

function animate(el,frames,options){
 if(!active()||!el.animate)return;
 const isRoll=el.classList.contains('roll-strip');
 const anchor=el.closest('.stats strong,.line-heading,.experience-grid article')||el;
 const duration=isRoll?1050:(options.duration||520);
 const timing={...options,duration,delay:options.delay||0,easing:options.easing||'cubic-bezier(.22,.65,.3,1)'};
 const a=el.animate(frames,timing);
 running.push({el,anchor,a,total:duration+(timing.delay||0)});return a;
}
function register(el,play){if(el)onceRecords.push({el,play,done:false});}
function finishMotion(){for(const x of running){try{x.a.finish();}catch{}}running.length=0;}
// Preserve existing line layout; these headings are static.
function heading(selector,lines){const h=$(selector);if(!h)return;h.textContent='';h.classList.add('line-heading');lines.forEach((text,i)=>{const line=document.createElement('span');line.className='copy-line';line.textContent=text;line.dataset.line=i;h.append(line);});}

heading('.technology h2',['きれいなだけでは、','灯せない。']);
heading('.service h2',['相談する相手は、','ひとりでいい。']);
heading('.budget h2',['ご予算から、','いっしょに考えます。']);
// OUR STRENGTHS heading remains static.
// OUR STRENGTHS 37 years remains fully opaque and static.
// Roll the digits in the first three statistics, preserving units and punctuation.
$$('.stats>div:nth-child(-n+3) strong').forEach((strong,index)=>{
 const spoken=document.createElement('span');spoken.className='motion-sr-only';spoken.textContent=strong.textContent;
 const visual=document.createElement('span');visual.className='roll-visual';visual.setAttribute('aria-hidden','true');
 for(const part of [strong,...strong.querySelectorAll('[data-roll-number]')]){
  for(const textNode of [...part.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE)){
   const digits=document.createDocumentFragment();
   for(const c of textNode.textContent){
    if(!/\d/.test(c)){digits.append(document.createTextNode(c));continue;}
    const digit=document.createElement('span');digit.className='roll-digit';
    const ghost=document.createElement('span');ghost.className='roll-ghost';ghost.textContent=c;digit.append(ghost);
    const win=document.createElement('span');win.className='roll-window';
    const strip=document.createElement('span');strip.className='roll-strip';
    rollDigits(Number(c)).forEach(n=>{
     const row=document.createElement('span');row.className='roll-row';row.textContent=n;strip.append(row);
    });
    win.append(strip);digit.append(win);digits.append(digit);
   }
   textNode.replaceWith(digits);
  }
 }
 while(strong.firstChild)visual.append(strong.firstChild);strong.append(spoken,visual);
 register(strong,()=>{visual.querySelectorAll('.roll-strip').forEach(strip=>animate(strip,[{transform:'translateY(0)',offset:0,easing:'linear'},{transform:'translateY(-81.8181818%)',offset:.76,easing:'cubic-bezier(.2,.65,.3,1)'},{transform:'translateY(-90.9090909%)',offset:.94},{transform:'translateY(-90.9090909%)',offset:1}],{duration:small.matches?850:950,delay:index*100,easing:'cubic-bezier(.16,.65,.24,1)',fill:'both'}));});
});
const experience=$('.experience'),experienceGrid=$('.experience-grid'),experiences=$$('.experience-grid article');
experiences.forEach((el,i)=>{el.style.setProperty('--panel-index',i);el.style.zIndex=String(i+1);});
function sizeStack(){
 const tallest=Math.max(...experiences.map(el=>el.scrollHeight));
 const safe=stackFits({height:innerHeight,tallest,small:small.matches,enabled:active()});
 experience.classList.toggle('stack-safe',safe);
}
sizeStack();if('ResizeObserver'in window){const ro=new ResizeObserver(()=>{sizeStack();requestUpdate();});experiences.forEach(el=>ro.observe(el));}
document.fonts?.ready.then(()=>{sizeStack();requestUpdate();});
const inlineConsult=$$('a[href="#form"]:not(.mobile-cta)');
function contactVisibility(){
 const hr=hero.getBoundingClientRect(),fr=form.getBoundingClientRect(),cr=compare.getBoundingClientRect(),er=experience.getBoundingClientRect();
 const visible=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight-20&&r.bottom>20;};
 const readingPanels=er.top<innerHeight*.65&&er.bottom>40;
 const comparing=cr.top<innerHeight-30&&cr.bottom>30;
 const hidden=hr.bottom>70||(fr.top<innerHeight&&fr.bottom>0)||readingPanels||comparing||inlineConsult.some(visible);
 mobile?.classList.toggle('hidden',hidden);if(mobile)mobile.inert=hidden||mobile.classList.contains('is-scrolling');
}
// CONTACT: stationary illumination zones, never a travelling spotlight.
const contact=$('.contact-visual'),contactButton=contact.querySelector('.button'),finePointer=matchMedia('(hover:hover) and (pointer:fine)');
const contactSrc=contact.querySelector(':scope>img').getAttribute('src');
const zones=[{x:240,y:340,rx:380,ry:340},{x:795,y:440,rx:190,ry:250},{x:990,y:770,rx:340,ry:200},{x:1440,y:590,rx:350,ry:200},{x:1580,y:265,rx:240,ry:300}];
const pool=document.createElementNS(ns,'svg');pool.classList.add('contact-lights');pool.setAttribute('viewBox','0 0 1672 941');pool.setAttribute('preserveAspectRatio','xMidYMid slice');pool.setAttribute('aria-hidden','true');
const warmFilter=`<filter id="contact-warm" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1.4 .3 -.8 0 -.15 1.4 .3 -.8 0 -.15 1.4 .3 -.8 0 -.15 0 0 0 1 0"/><feComponentTransfer><feFuncR type="linear" slope="2.2" intercept="-.15"/><feFuncG type="linear" slope="2.2" intercept="-.15"/><feFuncB type="linear" slope="2.2" intercept="-.15"/></feComponentTransfer><feGaussianBlur stdDeviation="2"/></filter><mask id="contact-warm-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941" style="mask-type:luminance"><image href="${contactSrc}" width="1672" height="941" filter="url(#contact-warm)"/></mask>`;
pool.innerHTML='<defs>'+warmFilter+zones.map((z,i)=>`<radialGradient id="zone-gradient-${i}"><stop offset="0" stop-color="white"/><stop offset=".45" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="contact-zone-${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941" style="mask-type:luminance"><ellipse cx="${z.x}" cy="${z.y}" rx="${z.rx}" ry="${z.ry}" fill="url(#zone-gradient-${i})"/></mask>`).join('')+'</defs><g mask="url(#contact-warm-mask)">'+zones.map((z,i)=>`<image class="contact-lamp-zone" href="${contactSrc}" width="1672" height="941" mask="url(#contact-zone-${i})"/>`).join('')+'</g>';
contact.prepend(pool);contact.classList.add('contact-interactive');const zoneEls=[...pool.querySelectorAll('.contact-lamp-zone')];
let contactHovered=false;
function setZone(i,value){zoneEls[i].style.opacity=String(value);}
function allZones(value){zoneEls.forEach((el,i)=>setZone(i,value));}
function contactMotion(){
 if(!active()){allZones(0);contact.style.setProperty('--contact-cta-light','0');return;}
 if(!finePointer.matches){const r=contact.getBoundingClientRect(),b=contactButton.getBoundingClientRect(),p=contactLightProgress({top:r.top,ctaOffset:b.top-r.top,viewport:innerHeight});zoneEls.forEach((el,i)=>setZone(i,clamp((p-i*.06)/(1-i*.06))*.92));contact.style.setProperty('--contact-cta-light',String(p));}
 else if(!contactHovered&&!contact.contains(document.activeElement)){allZones(0);contact.style.setProperty('--contact-cta-light','0');}
}
function touchLight(e){if(!active()||!finePointer.matches||e.pointerType==='touch')return;contactHovered=true;const r=contact.getBoundingClientRect(),p=photoPoint({x:e.clientX-r.left,y:e.clientY-r.top,width:r.width,height:r.height});zones.forEach((z,i)=>{const distance=((p.x-z.x)/z.rx)**2+((p.y-z.y)/z.ry)**2;setZone(i,distance<.95?.96:0);});}
contact.addEventListener('pointerenter',touchLight);contact.addEventListener('pointermove',touchLight);
contact.addEventListener('pointerleave',()=>{contactHovered=false;if(!contact.contains(document.activeElement)){allZones(0);contact.style.setProperty('--contact-cta-light','0');}});
contactButton.addEventListener('pointerenter',()=>{if(active()&&finePointer.matches)contact.style.setProperty('--contact-cta-light','1');});
contactButton.addEventListener('pointerleave',()=>{if(finePointer.matches&&document.activeElement!==contactButton)contact.style.setProperty('--contact-cta-light','0');});
contact.addEventListener('focusin',()=>{if(!active())return;allZones(.8);contact.style.setProperty('--contact-cta-light','1');});
contact.addEventListener('focusout',()=>requestAnimationFrame(contactMotion));
finePointer.addEventListener('change',()=>{contactHovered=false;contactMotion();});
const steps=$$('.process li');steps.forEach(el=>el.style.setProperty('--step-light','0'));
function settle(instant=false){
 photoEntries();
 experiences.forEach((el,i)=>{const next=experiences[i+1];el.classList.toggle('panel-covered',!!next&&experience.classList.contains('stack-safe')&&next.getBoundingClientRect().top<=el.getBoundingClientRect().top+(small.matches?56:72)+3);});
 for(const el of surfaces){const r=el.getBoundingClientRect(),v=visibility(r,innerHeight,innerWidth);if(v.passed||v.near){if(v.passed||r.top<innerHeight*.5)el.classList.add('motion-instant');show(el);}}
 for(const rec of onceRecords){if(rec.done)continue;const r=rec.el.getBoundingClientRect(),v=visibility(r,innerHeight,innerWidth);if(v.passed||r.top<innerHeight*.86&&v.near||!active()){rec.done=true;if(active()&&!v.passed&&r.top>innerHeight*.5)rec.play();}}
 for(let i=running.length-1;i>=0;i--){const x=running[i],r=x.anchor.getBoundingClientRect();if(!active()||r.bottom<=0||r.top>innerHeight){try{x.a.finish();}catch{}running.splice(i,1);}else if(x.a.playState==='finished')running.splice(i,1);}
 steps.forEach(el=>{const r=el.getBoundingClientRect();const value=active()?clamp((innerHeight*.84-r.top)/Math.max(innerHeight*.3,r.height)):1;const prior=Number(el.style.getPropertyValue('--step-light'))||0;el.style.setProperty('--step-light',String(Math.max(prior,value)));});
}
function update(){frame=0;const hr=hero.getBoundingClientRect(),copy=$('.hero-copy');
 const copyBottom=hr.top+copy.offsetTop+copy.offsetHeight;
 const state=heroState({top:hr.top,height:hr.height,copyBottom,viewport:innerHeight,small:small.matches,enabled:active()});
 hero.style.setProperty('--hero-scale',String(state.scale));hero.style.setProperty('--hero-copy-opacity',String(state.opacity));hero.style.setProperty('--hero-copy-y',state.y+'px');hero.style.setProperty('--hero-dark','1');hero.style.setProperty('--hero-cue-opacity',String(state.cue));hero.style.setProperty('--hero-cta-opacity','1');
 contactVisibility();contactMotion();settle(fastScroll);fastScroll=false;}
let fastScroll=false;
function requestUpdate(){if(!frame)frame=requestAnimationFrame(update);}
addEventListener('scroll',()=>{const delta=Math.abs(scrollY-previousY),now=performance.now(),elapsed=Math.max(16,now-photoLastAt);photoLastAt=now;if(delta>innerHeight*.75||(delta>innerHeight*.3&&delta/elapsed>5))photoFastUntil=now+100;clearTimeout(photoScrollIdle);photoScrollIdle=setTimeout(()=>{if(photoAnchor)endPhotoAnchor();else requestUpdate();},180);previousY=scrollY;scrollTravel+=delta;fastScroll=fastScroll||delta>innerHeight*.12;if(small.matches&&active()&&!mobile?.contains(document.activeElement)){if(scrollTravel>32)mobile?.classList.add('is-scrolling');clearTimeout(idle);idle=setTimeout(()=>{scrollTravel=0;mobile?.classList.remove('is-scrolling');contactVisibility();},650);}requestUpdate();},{passive:true});
let resizeTimer,lastWidth=innerWidth;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!small.matches||Math.abs(innerWidth-lastWidth)>4){sizeHero();lastWidth=innerWidth;}sizeStack();seasonState();galleryMotion();requestUpdate();},180);},{passive:true});
function removePending(){body.classList.add('opening-complete');surfaces.forEach(show);finishMotion();settle(true);}
pause.addEventListener('click',()=>{paused=!paused;body.classList.toggle('motion-paused',paused);pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',paused?'アニメーションを再開':'アニメーションを停止');sizeStack();if(paused){removePending();stopDemo();mobile?.classList.remove('is-scrolling');}requestUpdate();});
reduced.addEventListener('change',()=>{body.classList.toggle('motion-reduced',reduced.matches);sizeStack();if(reduced.matches){removePending();stopDemo();mobile?.classList.remove('is-scrolling');}requestUpdate();});
// Recompute after native anchor jumps and keyboard navigation.
addEventListener('hashchange',requestUpdate);document.addEventListener('focusin',()=>mobile?.classList.remove('is-scrolling'));update();
})();
