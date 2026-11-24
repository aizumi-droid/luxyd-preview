/* Shared, independently checkable scroll state. Native scrolling is never intercepted. */
(function(root){
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 function heroState({top,height,copyBottom,viewport,small,enabled=true}){
  if(!enabled)return {scale:1.035,opacity:1,y:0,cue:1};
  const progress=clamp(-top/height);
  // Keep copy fully readable until its bottom is actually leaving the viewport.
  const opacity=clamp(copyBottom/Math.max(48,viewport*.1));
  return {scale:1.035+progress*(small?.024:.045),opacity,y:-progress*(small?4:8),cue:1-clamp(progress/.3)};
 }
 function visibility({top,bottom,left=0,right=1},viewport,width){return {passed:bottom<=0,near:top<viewport*.94&&bottom>0&&left<width&&right>0,readable:top<viewport*.55};}
 function rollDigits(n){return Array.from({length:11},(_,i)=>(n+i)%10);}
 function stackFits({height,tallest,small,enabled=true}){return enabled&&height>=560&&tallest+(small?24:68)+(small?56:72)*5+96<height;}
 function contactLightProgress({top,ctaOffset,viewport}){return clamp((viewport-top)/Math.max(1,ctaOffset+viewport*.35));}
 function photoPoint({x,y,width,height}){const scale=Math.max(width/1672,height/941);return {x:(x+(1672*scale-width)/2)/scale,y:(y+(941*scale-height)/2)/scale};}
 function photoEntryAction({top,bottom,height,left=0,right=1,viewport,width,enabled=true,anchor=false,fast=false,small=false}){
  if(!enabled)return 'show';
  if(anchor||fast)return 'wait';
  const visible=Math.min(bottom,viewport)-Math.max(top,0);
  if(right<=0||left>=width||visible<Math.min(40,height*.08)||top>viewport*(small?.78:.8))return 'wait';
  return 'play';
 }
 const api={clamp,heroState,visibility,rollDigits,stackFits,contactLightProgress,photoPoint,photoEntryAction};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LuxydMotionState=api;
})(typeof window!=='undefined'?window:globalThis);
