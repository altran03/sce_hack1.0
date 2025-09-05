const n={CAPTCHA_SOLVED:"captchaSolved"};class a{constructor(){this.videos=new Set,this.overlayInjected=!1,this.init()}init(){this.findAndBlockVideos(),this.observeVideoChanges(),this.setupMessageListener()}findAndBlockVideos(){document.querySelectorAll("video").forEach(t=>this.blockVideo(t))}observeVideoChanges(){new MutationObserver(t=>{t.forEach(i=>{i.addedNodes.forEach(s=>{var r;if(s.nodeType===Node.ELEMENT_NODE){s.tagName==="VIDEO"&&this.blockVideo(s);const o=(r=s.querySelectorAll)==null?void 0:r.call(s,"video");o==null||o.forEach(c=>this.blockVideo(c))}})})}).observe(document.body,{childList:!0,subtree:!0})}blockVideo(e){this.videos.has(e)||(this.videos.add(e),e.pause(),e.addEventListener("play",t=>{t.preventDefault(),e.pause()}),this.overlayInjected||(this.injectOverlay(),this.overlayInjected=!0))}injectOverlay(){const e=document.createElement("div");e.id="captcha-overlay-container",e.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
    `,document.body.appendChild(e);const t=document.createElement("script");t.src=chrome.runtime.getURL("captcha-overlay.js"),t.onload=()=>{},document.head.appendChild(t)}setupMessageListener(){chrome.runtime.onMessage.addListener((e,t,i)=>{e.action===n.CAPTCHA_SOLVED?(this.unblockVideos(),this.removeOverlay()):e.action==="testCaptcha"&&i({success:!0,message:"Content script is working!"})})}unblockVideos(){this.videos.forEach(e=>{e.removeEventListener("play",t=>t.preventDefault())}),this.videos.clear()}removeOverlay(){const e=document.getElementById("captcha-overlay-container");e&&e.remove(),this.overlayInjected=!1}}new a;
