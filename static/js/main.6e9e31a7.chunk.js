(this["webpackJsonpsheet-happens-example"]=this["webpackJsonpsheet-happens-example"]||[]).push([[0],{11:function(e,t,n){e.exports=n.p+"static/media/logo.aef13910.svg"},13:function(e,t,n){e.exports=n.p+"static/media/git.f818b886.svg"},18:function(e,t,n){e.exports=n(231)},23:function(e,t,n){},231:function(e,t,n){"use strict";n.r(t);n(6);var l=n(0),a=n.n(l),o=n(10),c=n.n(o),i=n(11),r=n.n(i);var s=function(){const e=e=>{var t=document.getElementById(e),n="home"===e?0:86,l=window.pageYOffset+t.getBoundingClientRect().top-n;window.scrollTo({top:l,behavior:"smooth"})};return a.a.createElement("div",{className:"container blue-bg menu"},a.a.createElement("div",{className:"content flex-row"},a.a.createElement("div",{className:"logo-box"},a.a.createElement("img",{src:r.a,alt:"Logo"}),a.a.createElement("h2",{className:"page-title"},"sheet - happens")),a.a.createElement("div",{className:"nav"},a.a.createElement("div",{className:"nav-item",onClick:()=>e("home")},"home"),a.a.createElement("div",{className:"nav-item",onClick:()=>e("usage")},"usage"),a.a.createElement("div",{className:"nav-item",onClick:()=>e("features")},"features"),a.a.createElement("div",{className:"nav-item",onClick:()=>e("documentation")},"documentation"))))},u=n(1),d=n(2),y=n(4),h=n(12),f="_styles-module__sheetscroll__PxIi8";const x={textAlign:"left",fontSize:13,marginRight:5,marginLeft:5,color:"#000",fontFamily:"sans-serif",weight:"",fillColor:"",backgroundColor:""},g={textAlign:"center",fontSize:13,marginRight:5,marginLeft:5,color:"#000",fontFamily:"sans-serif",weight:"",fillColor:"",backgroundColor:""};function m(e){const t=e.getBoundingClientRect(),n=t.width,l=t.height;let a=window.devicePixelRatio,o=void 0===a?1:a;o<1&&(o=1);const c=Math.round(n*o),i=Math.round(l*o);if(e.width!==c||e.height!==i){const t=e.getContext("2d");return t&&(e.width=c,e.height=i,t.scale(o,o)),!0}return!1}function v(e,t){return Array.isArray(e)?n=>n>=0&&n<e.length?e[n]:t:"function"===typeof e?e:null!==e&&void 0!==e?()=>e:()=>t}function b(e,t){return Array.isArray(e)?(n,l)=>l>=0&&l<e.length&&n>=0&&n<e[l].length?e[l][n]:t:"function"===typeof e?e:null!==e&&void 0!==e?()=>e:()=>t}function p(e,t,n,l,a,o,c,i){if(null===t)return;const r=(s=n,u=l,Object(y.a)(Object(y.a)({},u),s));var s,u;e.fillStyle=r.color,e.font=r.weight+" "+r.fontSize+"px "+r.fontFamily,e.textAlign=r.textAlign;const h=a+("right"===r.textAlign?c-r.marginRight:"center"===r.textAlign?.5*c:r.marginLeft),f=o+.5*i;if(e.save(),e.beginPath(),e.rect(a,o,c,i),e.clip(),""!==r.backgroundColor&&(e.fillStyle=r.backgroundColor,e.fillRect(a,o,c,i),e.fillStyle=r.color),"string"===typeof t||"number"===typeof t)e.fillText(""+t,h,f);else if("object"===typeof t){var x,g=Object(d.a)(t.items);try{for(g.s();!(x=g.n()).done;){const t=x.value;t.content instanceof HTMLImageElement?e.drawImage(t.content,a+t.x,f+t.y,t.width,t.height):"string"!==typeof t.content&&"number"!==typeof t.content||e.fillText(""+t.content,a+t.x,f+t.y)}}catch(m){g.e(m)}finally{g.f()}}e.restore()}function j(e,t,n,l,a){const o=[],c=[],i=[];let r=0;c.push(n),o.push(e>0?0:l),r=n+t(e>0?0:l),i.push(r);let s=e>0?1:l+1;if(e>0){for(;s<e;s++)o.push(s),c.push(r),r+=t(s),i.push(r);s=Math.max(l,e)}for(;o.push(s),c.push(r),r+=t(s),i.push(r),!(i[i.length-1]>=a);)s++;return{index:o,start:c,end:i}}function w(e){let t="",n=0;for(;e>0;)n=(e-1)%26,t=String.fromCharCode(65+n)+t,e=(e-n)/26|0;return t||""}function C(e,t,n,l){let a=0,o=0;for(let c=0;c<l.index.length;c++)if(e>=l.start[c]&&e<=l.end[c]){a=l.index[c];break}for(let c=0;c<n.index.length;c++)if(t>=n.start[c]&&t<=n.end[c]){o=n.index[c];break}return{x:a,y:o}}function O(e,t,n,l,a,o,c){let i=50;const r=l.index.findIndex(t=>t===e);if(-1!==r)i=l.start[r];else{for(let e=0;e<a.x;e++)i-=o(e);for(let t=0;t<e;t++)i+=o(t)}let s=22;const u=n.index.findIndex(e=>e===t);if(-1!==u)s=n.start[u];else{for(let e=0;e<a.y;e++)s-=c(e);for(let e=0;e<t;e++)s+=c(e)}return{x:i,y:s}}var E=function(e){const t=Object(l.useRef)(null),n=Object(l.useRef)(null),o=Object(l.useRef)(null),c=Object(l.useState)({x:5e3,y:5e3}),i=Object(u.a)(c,2),r=i[0],s=i[1],E=Object(l.useState)({x:0,y:0}),S=Object(u.a)(E,2),M=S[0],D=S[1],N=Object(l.useState)({x1:-1,y1:-1,x2:-1,y2:-1}),k=Object(u.a)(N,2),I=k[0],A=k[1],R=Object(l.useState)({x1:-1,y1:-1,x2:-1,y2:-1}),L=Object(u.a)(R,2),T=L[0],H=L[1],z=Object(l.useState)({x:-1,y:-1}),Y=Object(u.a)(z,2),W=Y[0],B=Y[1],F=Object(l.useState)(""),X=Object(u.a)(F,2),P=X[0],Z=X[1],G=Object(l.useState)(!1),J=Object(u.a)(G,2),Q=J[0],K=J[1],U=Object(l.useState)(!1),_=Object(u.a)(U,2),V=_[0],q=_[1],$=Object(l.useState)(!1),ee=Object(u.a)($,2),te=ee[0],ne=ee[1],le=Object(l.useState)(!1),ae=Object(u.a)(le,2),oe=ae[0],ce=ae[1],ie=Object(l.useState)(null),re=Object(u.a)(ie,2),se=re[0],ue=re[1],de=Object(l.useState)(null),ye=Object(u.a)(de,2),he=ye[0],fe=ye[1],xe=Object(l.useState)(!1),ge=Object(u.a)(xe,2),me=ge[0],ve=ge[1],be=Object(l.useState)(!1),pe=Object(u.a)(be,2),je=pe[0],we=pe[1],Ce=Object(l.useState)({x:-1,y:-1,hitTarget:null}),Oe=Object(u.a)(Ce,2),Ee=Oe[0],Se=Oe[1],Me=Object(h.a)({ref:t}),De=Me.width,Ne=void 0===De?3e3:De,ke=Me.height,Ie=void 0===ke?3e3:ke,Ae=e.freezeColumns||0,Re=e.freezeRows||0,Le=Object(l.useMemo)(()=>v(e.cellWidth,100),[e.cellWidth]),Te=Object(l.useMemo)(()=>v(e.cellHeight,22),[e.cellHeight]),He=Object(l.useMemo)(()=>v(e.columnHeaders,null),[e.columnHeaders]),ze=Object(l.useMemo)(()=>v(e.columnHeaderStyle,{}),[e.columnHeaderStyle]),Ye=Object(l.useMemo)(()=>b(e.readOnly,!1),[e.readOnly]),We=Object(l.useMemo)(()=>b(e.sourceData,null),[e.sourceData]),Be=Object(l.useMemo)(()=>b(e.displayData,""),[e.displayData]),Fe=Object(l.useMemo)(()=>b(e.editData,""),[e.editData]),Xe=Object(l.useMemo)(()=>b(e.cellStyle,x),[e.cellStyle]),Pe=Object(l.useMemo)(()=>j(Ae,Le,50,M.x,Ne),[e.freezeColumns,Le,M.x,Ne]),Ze=Object(l.useMemo)(()=>j(Re,Te,22,M.y,Ie),[e.freezeRows,Te,M.y,Ie]),Ge=(t,l,a,o,c=!0)=>{if(A({x1:t,y1:l,x2:a,y2:o}),c){const e={x:M.x,y:M.y};let t=-1,l=-1;if(!Pe.index.includes(a)||Pe.index[Pe.index.length-1]===a){const n=Pe.index[Pe.index.length-1]<=a?1:-1,l=Math.max(M.x,Ae)+n;e.x=l,t=30*l}if(!Ze.index.includes(o)||Ze.index[Ze.index.length-1]===o){const t=Ze.index[Ze.index.length-1]<=o?1:-1,n=Math.max(M.y,Re)+t;e.y=n,l=30*n}e.x===M.x&&M.y===e.y||(D({x:e.x,y:e.y}),setTimeout(()=>{n.current&&(-1!==t&&(n.current.scrollLeft=t),-1!==l&&(n.current.scrollTop=l))},0))}if(e.onSelectionChanged){let n=t,c=l,i=a,r=o;n>i&&(n=a,i=t),c>r&&(c=o,r=l),e.onSelectionChanged(n,c,i,r)}},Je=Object(l.useMemo)(()=>{if(-1!==I.x2&&-1!==I.y2){let e=I.x2;I.x1>I.x2&&(e=I.x1);let t=I.y2;I.y1>I.y2&&(t=I.y1);const n=O(e,t,Ze,Pe,M,Le,Te);return{x:n.x+Le(e),y:n.y+Te(t)}}return{x:-1,y:-1}},[I,Ze,Pe,M,Le,Te]),Qe=Object(l.useMemo)(()=>{const e={},n=t.current;if(!n)return e;m(n);let l=22;var a,o=Object(d.a)(Ze.index);try{for(o.s();!(a=o.n()).done;){const t=a.value;let n=50;var c,i=Object(d.a)(Pe.index);try{for(i.s();!(c=i.n()).done;){const a=c.value,o=Be(a,t);if(null===o||void 0===o){n+=Le(a);continue}const i=n,y=l+.5*Te(t);if("object"===typeof o){var r,s=Object(d.a)(o.items);try{for(s.s();!(r=s.n()).done;){const n=r.value;if(n.onClick){const l=i+n.x,o=y+n.y,c=l+n.width,r=o+n.height,s={cellX:a,cellY:t,x:l,y:o,w:n.width,h:n.height,onClick:n.onClick},u=Math.floor(l/10),d=Math.floor(c/10),h=Math.floor(o/10),f=Math.floor(r/10);for(let t=u;t<=d;t++){e[t]||(e[t]={});const n=e[t];for(let e=h;e<=f;e++)n[e]||(n[e]=[]),n[e].push(s)}}}}catch(u){s.e(u)}finally{s.f()}}n+=Le(a)}}catch(u){i.e(u)}finally{i.f()}l+=Te(t)}}catch(u){o.e(u)}finally{o.f()}return e},[Be,e.cellWidth,e.cellHeight,t,Pe,Ze,M.x,M.y]);Object(l.useEffect)(()=>{const e=t.current;if(!e)return;const n=e.getContext("2d");if(!n)return;let l=window.requestAnimationFrame(()=>{!function(e,t,n,l,a,o,c,i,r,s,u,y,h){m(e.canvas),e.clearRect(0,0,e.canvas.width,e.canvas.height),e.fillStyle="white",e.fillRect(0,0,e.canvas.width,e.canvas.height);let f=22;var v,b=Object(d.a)(t.index);try{for(b.s();!(v=b.n()).done;){const t=v.value;let c=50;var j,C=Object(d.a)(n.index);try{for(C.s();!(j=C.n()).done;){const n=j.value,i=l(n,t);i.fillColor&&(e.fillStyle=i.fillColor,e.fillRect(c,f,a(n),o(t))),c+=a(n)}}catch(K){C.e(K)}finally{C.f()}f+=o(t)}}catch(K){b.e(K)}finally{b.f()}let E=!1,S=c.x1,M=c.x2;c.x1>c.x2&&(S=c.x2,M=c.x1);let D=c.y1,N=c.y2;c.y1>c.y2&&(D=c.y2,N=c.y1);const k=-1!==S&&-1!==M&&-1!==D&&-1!==N,I=O(S,D,t,n,h,a,o),A=O(M,N,t,n,h,a,o);if(A.x+=a(M),A.y+=o(N),I.x>=A.x){A.x=I.x;let e=S;for(;n.index.includes(e);)A.x+=a(e),e++;E=!0}if(I.y>=A.y){A.y=I.y;let e=D;for(;t.index.includes(e);)A.y+=o(e),e++;E=!0}k&&(e.fillStyle="#e9f0fd",e.fillRect(I.x,I.y,A.x-I.x,A.y-I.y)),e.fillStyle="#f8f9fa",e.fillRect(0,0,50,e.canvas.height),k&&(e.fillStyle="#e8eaed",e.fillRect(0,I.y,50,A.y-I.y)),e.fillStyle="#f8f9fa",e.fillRect(0,0,e.canvas.width,22),k&&(e.fillStyle="#e8eaed",e.fillRect(I.x,0,A.x-I.x,22)),e.strokeStyle="#e2e3e3",e.lineWidth=1;let R=50;var L,T=Object(d.a)(n.index);try{for(T.s();!(L=T.n()).done;){const t=L.value;e.beginPath(),e.moveTo(R,0),e.lineTo(R,e.canvas.height),e.stroke(),R+=a(t)}}catch(K){T.e(K)}finally{T.f()}let H=22;var z,Y=Object(d.a)(t.index);try{for(Y.s();!(z=Y.n()).done;){const t=z.value;e.beginPath(),e.moveTo(0,H),e.lineTo(e.canvas.width,H),e.stroke(),H+=o(t)}}catch(K){Y.e(K)}finally{Y.f()}H=22,e.textBaseline="middle",e.textAlign="center",e.font=x.fontSize+"px "+x.fontFamily,e.fillStyle="#666666";var W,B=Object(d.a)(t.index);try{for(B.s();!(W=B.n()).done;){const t=W.value,n=25,l=H+.5*o(t),a=t+1;e.fillText(""+a,n,l),H+=o(t)}}catch(K){B.e(K)}finally{B.f()}R=50,e.textBaseline="middle",e.textAlign="center";var F,X=Object(d.a)(n.index);try{for(X.s();!(F=X.n()).done;){const t=F.value,n=a(t),l=r(t),o=null!==l?l:w(t+1);p(e,o,s(t),g,R,0,n,22),R+=n}}catch(K){X.e(K)}finally{X.f()}if(k&&(e.strokeStyle="#1b73e7",e.lineWidth=1,e.beginPath(),e.rect(I.x,I.y,A.x-I.x,A.y-I.y),e.stroke()),i){let l=u.x1,c=u.x2;u.x1>u.x2&&(l=u.x2,c=u.x1);let i=u.y1,r=u.y2;u.y1>u.y2&&(i=u.y2,r=u.y1);const s=O(l,i,t,n,h,a,o),d=O(c+1,r+1,t,n,h,a,o);e.strokeStyle="#707070",e.setLineDash([3,3]),e.lineWidth=1,e.beginPath(),e.rect(s.x,s.y-1,d.x-s.x,d.y-s.y),e.stroke(),e.setLineDash([])}k&&!E&&(e.fillStyle="#1b73e7",e.fillRect(A.x-3,A.y-3,6,6)),e.textBaseline="middle";let P=22;var Z,G=Object(d.a)(t.index);try{for(G.s();!(Z=G.n()).done;){const t=Z.value;let c=50;const i=o(t);var J,Q=Object(d.a)(n.index);try{for(Q.s();!(J=Q.n()).done;){const n=J.value,o=y(n,t),r=a(n);if(null!==o&&void 0!==o){p(e,o,l(n,t),x,c,P,r,i)}c+=r}}catch(K){Q.e(K)}finally{Q.f()}P+=i}}catch(K){G.e(K)}finally{G.f()}}(n,Ze,Pe,Xe,Le,Te,I,te,He,ze,T,Be,M)});return()=>{window.cancelAnimationFrame(l)}},[t,Ze,Pe,Xe,Le,Te,I,te,He,ze,T,Be,M]);const Ke=()=>{o.current&&(o.current.focus({preventScroll:!0}),o.current.select())};Object(l.useEffect)(()=>{if(!at)if($e(),document.activeElement===o.current)Ke();else{const e=document.activeElement.tagName.toLowerCase();"div"===e&&"true"===document.activeElement.contentEditable||"input"===e||"textarea"===e||"select"===e||Ke()}});const Ue=e=>{if(!o)return;if(e.target!==o.current)return;e.preventDefault();const t=e.clipboardData||window.clipboardData,n=t.types;if(n.includes("text/html")){const e=t.getData("text/html");Ve(e)}else if(n.includes("text/plain")){const e=t.getData("text/plain");qe(e)}};Object(l.useEffect)(()=>(window.document.addEventListener("paste",Ue),()=>{window.document.removeEventListener("paste",Ue)}));const _e=e=>{var t,n=Object(d.a)(e.children);try{for(n.s();!(t=n.n()).done;){const e=t.value;if("TABLE"===e.nodeName)return e;const n=_e(e);if(n)return n}}catch(l){n.e(l)}finally{n.f()}},Ve=t=>{const n=document.createElement("div");n.innerHTML=t.trim();let l=-1,a=-1;if(-1!==I.x1&&-1===I.x2&&(l=I.x1),-1!==I.y1&&-1===I.y2&&(a=I.y1),-1!==I.x1&&-1!==I.x2&&(l=Math.min(I.x1,I.x2)),-1!==I.y1&&-1!==I.y2&&(a=Math.min(I.y1,I.y2)),-1===l||-1===a)return;let o=l,c=a;const i=[],r=_e(n);if(!r)return;var s,u=Object(d.a)(r.children);try{for(u.s();!(s=u.n()).done;){const e=s.value;if("TBODY"===e.nodeName){var y,h=Object(d.a)(e.children);try{for(h.s();!(y=h.n()).done;){const e=y.value;if(o=l,"TR"===e.nodeName){var f,x=Object(d.a)(e.children);try{for(x.s();!(f=x.n()).done;){const e=f.value;"TD"===e.nodeName&&(i.push({y:c,x:o,value:e.innerHTML}),o++)}}catch(g){x.e(g)}finally{x.f()}c++}}}catch(g){h.e(g)}finally{h.f()}}}}catch(g){u.e(g)}finally{u.f()}e.onChange&&e.onChange(i),Ge(l,a,o-1,c-1,!1)},qe=t=>{let n=-1,l=-1;if(-1!==I.x1&&-1===I.x2&&(n=I.x1),-1!==I.y1&&-1===I.y2&&(l=I.y1),-1!==I.x1&&-1!==I.x2&&(n=Math.min(I.x1,I.x2)),-1!==I.y1&&-1!==I.y2&&(l=Math.min(I.y1,I.y2)),-1===n||-1===l)return;const a=t.split(/\r?\n/);let o=n,c=l+a.length-1;const i=[];for(let e=0;e<a.length;e++){const t=a[e].split("\t");n+t.length-1>o&&(o=n+t.length-1);for(let a=0;a<t.length;a++)i.push({y:l+e,x:n+a,value:t[a]})}e.onChange&&e.onChange(i),Ge(n,l,o,c,!1)},$e=()=>{if(-1===I.x1||-1===I.y1||-1===I.x2||-1===I.y2)return;let e=I.y1,t=I.y2;e>t&&(e=I.y2,t=I.y1);let n=I.x1,l=I.x2;n>l&&(n=I.x2,l=I.x1);const a=[];for(let o=e;o<=t;o++){const e=[];for(let t=n;t<=l;t++){const n=Fe(t,o);null!==n&&void 0!==n?e.push(n):e.push("")}a.push(e.join("\t"))}const c=a.join("\n");o.current&&(o.current.value=c)},et=()=>{e.onChange&&e.onChange([{x:W.x,y:W.y,value:P}]),B({x:-1,y:-1})},tt=e=>{if(Ye(e.x,e.y))return;const t=Fe(e.x,e.y);let n="";null!==t&&void 0!==t&&(n=t),B(e),Z(n)},nt=t=>{if(te){let t=I.x1,n=I.x2;I.x1>I.x2&&(t=I.x2,n=I.x1);let l=I.y1,a=I.y2;I.y1>I.y2&&(l=I.y2,a=I.y1);let o=T.x1,c=T.x2;T.x1>T.x2&&(o=T.x2,c=T.x1);let i=T.y1,r=T.y2;T.y1>T.y2&&(i=T.y2,r=T.y1);let s=o,u=i,d=c,y=r;const h=[];if(d-s===n-t){u===l?u=a+1:y=l-1;let e=l;for(let t=u;t<=y;t++){for(let n=s;n<=d;n++){const l=We(n,e);h.push({x:n,y:t,value:l})}e+=1,e>a&&(e=l)}}else{s===t?s=n+1:d=t-1;let e=t;for(let l=s;l<=d;l++){for(let t=u;t<=y;t++){const n=We(e,t);h.push({x:l,y:t,value:n})}e+=1,e>n&&(e=t)}}e.onChange&&e.onChange(h),Ge(T.x1,T.y1,T.x2,T.y2)}if(ce(!1),ve(!1),we(!1),ne(!1),ue(null),fe(null),-1!==Ee.x&&-1!==Ee.y&&null!==Ee.hitTarget){if(!t.target||!(t.target instanceof Element))return;const e=t.target.getBoundingClientRect(),n=t.clientX-e.left,l=t.clientY-e.top,a=Ee.hitTarget;a.x<=n&&n<=a.x+a.w&&a.y<=l&&l<=a.y+a.h&&a.onClick(),Se({x:-1,y:-1,hitTarget:null})}};Object(l.useEffect)(()=>(window.addEventListener("mouseup",nt),()=>{window.removeEventListener("mouseup",nt)}));const lt=t=>{if(!t.target||!(t.target instanceof Element))return;const n=t.target.getBoundingClientRect(),l=t.clientX-n.left,a=t.clientY-n.top;window.document.body.style.cursor="auto";const o=Math.floor(l/10),c=Math.floor(a/10);if(Qe[o]&&Qe[o][c]){var i,r=Object(d.a)(Qe[o][c]);try{for(r.s();!(i=r.n()).done;){const e=i.value;e.x<=l&&l<=e.x+e.w&&e.y<=a&&a<=e.y+e.h&&(window.document.body.style.cursor="pointer")}}catch(f){r.e(f)}finally{r.f()}}if(e.onCellWidthChange&&a<22){let e=50;var s,u=Object(d.a)(Pe.index);try{for(u.s();!(s=u.n()).done;){const t=s.value;if(Math.abs(e-l)<4){window.document.body.style.cursor="col-resize";break}e+=Le(t)}}catch(f){u.e(f)}finally{u.f()}}if(e.onCellHeightChange&&l<50){let e=22;var y,h=Object(d.a)(Ze.index);try{for(h.s();!(y=h.n()).done;){const t=y.value;if(Math.abs(e-a)<4){window.document.body.style.cursor="row-resize";break}e+=Te(t)}}catch(f){h.e(f)}finally{h.f()}}if(Math.abs(l-Je.x)<6&&Math.abs(a-Je.y)<6&&(window.document.body.style.cursor="crosshair"),se){if(e.onCellWidthChange){const t=Math.max(se.oldWidth+l-se.startX,50);e.onCellWidthChange(se.colIdx,t)}}else if(he){if(e.onCellHeightChange){const t=Math.max(he.oldHeight+a-he.startY,22);e.onCellHeightChange(he.rowIdx,t)}}else{if(oe){const e=C(l,a,Ze,Pe);me?Ge(I.x1,I.y1,I.x2,e.y,!1):je?Ge(I.x1,I.y1,e.x,I.y2,!1):Ge(I.x1,I.y1,e.x,e.y)}if(te){window.document.body.style.cursor="crosshair";const e=C(l,a,Ze,Pe);let t=I.x1,n=I.y1,o=I.x2,c=I.y2;t>o&&(t=I.x2,o=I.x1),n>c&&(n=I.y2,c=I.y1),Math.abs(e.x-.5*(t+o))<Math.abs(e.y-.5*(n+c))?e.y<n?n=e.y:c=e.y:e.x<t?t=e.x:o=e.x,H({x1:t,y1:n,x2:o,y2:c})}}},at=-1!==W.x&&-1!==W.y;let ot={x:0,y:0},ct=0,it=0,rt="right";if(at){ot=O(W.x,W.y,Ze,Pe,M,Le,Te);const e=Xe(W.x,W.y);ot.x+=1,ot.y+=1,ct=Le(W.x)-2,it=Te(W.y)-2,rt=e.textAlign||x.textAlign||"left"}return a.a.createElement("div",{style:{position:"relative",height:"100%"}},a.a.createElement("canvas",{style:{width:"calc(100% - 14px)",height:"calc(100% - 15px)",outline:"1px solid #ddd"},ref:t}),a.a.createElement("div",{ref:n,onDoubleClick:e=>{if(!e.target||!(e.target instanceof Element))return;const t=e.target.getBoundingClientRect(),n=e.clientX-t.left,l=e.clientY-t.top,a=Math.floor(n/10),o=Math.floor(l/10);if(Qe[a]&&Qe[a][o]){var c,i=Object(d.a)(Qe[a][o]);try{for(i.s();!(c=i.n()).done;){const e=c.value;if(e.x<=n&&n<=e.x+e.w&&e.y<=l&&l<=e.y+e.h)return}}catch(s){i.e(s)}finally{i.f()}}const r=C(n,l,Ze,Pe);K(!1),tt(r)},onMouseDown:e=>{if(0!==e.button)return;if(!e.target||!(e.target instanceof Element))return;const t=e.target.getBoundingClientRect(),n=e.clientX-t.left,l=e.clientY-t.top;if(n>Ne||l>Ie)return;const a=Math.floor(n/10),o=Math.floor(l/10);if(Qe[a]&&Qe[a][o]){var c,i=Object(d.a)(Qe[a][o]);try{for(i.s();!(c=i.n()).done;){const e=c.value;if(e.x<=n&&n<=e.x+e.w&&e.y<=l&&l<=e.y+e.h)return void Se({x:n,y:l,hitTarget:e})}}catch(m){i.e(m)}finally{i.f()}}if(l<22){let e=50;var r,s=Object(d.a)(Pe.index);try{for(s.s();!(r=s.n()).done;){const t=r.value;if(Math.abs(e-n)<4)return window.document.body.style.cursor="col-resize",void ue({startX:e,oldWidth:Le(t-1),colIdx:t-1});e+=Le(t)}}catch(m){s.e(m)}finally{s.f()}}if(n<50){let e=22;var u,h=Object(d.a)(Ze.index);try{for(h.s();!(u=h.n()).done;){const t=u.value;if(Math.abs(e-l)<4)return window.document.body.style.cursor="row-resize",void fe({startY:e,oldHeight:Te(t-1),rowIdx:t-1});e+=Te(t)}}catch(m){h.e(m)}finally{h.f()}}if(Math.abs(n-Je.x)<6&&Math.abs(l-Je.y)<6)return ne(!0),void H({x1:I.x1,y1:I.y1,x2:I.x2,y2:I.y2});const f=C(n,l,Ze,Pe),x=V?{x:I.x1,y:I.y1}:Object(y.a)({},f);at&&et();let g=!0;n<50?(f.x=100,g=!1,ve(!0)):ve(!1),l<22?(f.y=100,g=!1,we(!0)):we(!1),ce(!0),Ge(x.x,x.y,f.x,f.y,g),B({x:-1,y:-1})},onMouseMove:lt,onMouseLeave:()=>{window.document.body.style.cursor="auto"},onContextMenu:t=>{if(!e.onRightClick)return;if(!t.target||!(t.target instanceof Element))return;const n=t.target.getBoundingClientRect(),l=t.clientX-n.left,a=t.clientY-n.top,o=C(l,a,Ze,Pe);if(a>22&&l>50){lt(t);const n=Object(y.a)(Object(y.a)({},t),{},{cellX:o.x,cellY:o.y});e.onRightClick(n)}},onScroll:e=>{if(!e.target||!(e.target instanceof Element))return;const t=e.target.scrollLeft,n=e.target.scrollTop,l=Math.floor(t/30),a=Math.floor(n/30);l===M.x&&a===M.y||D({x:l,y:a});let o=Object(y.a)({},r);r.x/(t+.5)<1&&(o.x*=1.5),r.y/(n+.5)<1&&(o.y*=1.5),o.x===r.x&&r.y===o.y||s(Object(y.a)({},o))},className:f,style:{position:"absolute",width:"100%",height:"100%",top:0,left:0,overflow:"scroll",borderBottom:"1px solid #ddd"}},a.a.createElement("div",{style:{position:"absolute",left:0,top:0,width:1,height:r.y+2e3,backgroundColor:"rgba(0,0,0,0.0)"}}),a.a.createElement("div",{style:{position:"absolute",left:0,top:0,width:r.x+5e3,height:1,backgroundColor:"rgba(0,0,0,0.0)"}})),a.a.createElement("textarea",{style:{position:"absolute",top:0,left:0,width:1,height:1,opacity:.01},ref:o,onFocus:e=>e.target.select(),tabIndex:0,onKeyDown:t=>{if(at&&Q&&["ArrowRight","ArrowLeft","ArrowUp","ArrowDown"].includes(t.key))et();else if("Shift"!==t.key){if((!t.metaKey&&!t.ctrlKey||"v"!==String.fromCharCode(t.which).toLowerCase())&&(!t.metaKey&&!t.ctrlKey||"c"!==String.fromCharCode(t.which).toLowerCase()))if("Backspace"!==t.key&&"Delete"!==t.key){if(-1!==I.x1&&-1!==I.x2&&-1!==I.y1&&-1!==I.y2){if(t.keyCode>=48&&t.keyCode<=57||t.keyCode>=96&&t.keyCode<=105||t.keyCode>=65&&t.keyCode<=90||"Enter"===t.key||"-"===t.key||"."===t.key||","===t.key)return Ye(I.x1,I.y1)?void t.preventDefault():(tt({x:I.x1,y:I.y1}),void K("Enter"!==t.key));if(["ArrowRight","ArrowLeft","ArrowUp","ArrowDown"].includes(t.key)){let e={x:I.x1,y:I.y1},n={x:I.x2,y:I.y2};return"ArrowRight"===t.key||"Tab"===t.key?n.x+=1:"ArrowLeft"===t.key?n.x-=1:"ArrowUp"===t.key?n.y-=1:"ArrowDown"===t.key&&(n.y+=1),n.x<0&&(n.x=0),n.y<0&&(n.y=0),t.shiftKey||(e=Object(y.a)({},n)),void Ge(e.x,e.y,n.x,n.y)}t.preventDefault()}}else{let t=I.x1,n=I.y1,l=I.x2,a=I.y2;t>l&&(t=I.x2,l=I.x1),n>a&&(n=I.y2,a=I.y1);const o=[];for(let e=n;e<=a;e++)for(let n=t;n<=l;n++)o.push({x:n,y:e,value:null});e.onChange&&e.onChange(o)}}else q(!0)},onKeyUp:e=>{q(e.shiftKey)}}),at&&a.a.createElement("input",{type:"text",onFocus:e=>e.target.select(),autoFocus:!0,onKeyDown:e=>{if("Escape"!==e.key){if("Enter"===e.key&&(et(),Ge(I.x1,I.y1+1,I.x1,I.y1+1)),"Tab"===e.key&&(e.preventDefault(),et(),Ge(I.x1+1,I.y1,I.x1+1,I.y1)),Q&&["ArrowRight","ArrowLeft","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault(),et();let t=I.x1,n=I.y1,l=I.x1,a=I.y1;"ArrowRight"===e.key?(t=I.x1+1,l=I.x1+1):"ArrowLeft"===e.key?(t=I.x1-1,l=I.x1-1):"ArrowUp"===e.key?(n=I.y1-1,a=I.y1-1):"ArrowDown"===e.key&&(n=I.y1+1,a=I.y1+1),Ge(t,n,l,a)}}else B({x:-1,y:-1})},value:P,onChange:e=>Z(e.target.value),style:{position:"absolute",top:ot.y,left:ot.x,width:ct,height:it,outline:"none",border:"none",textAlign:rt,color:"black",fontSize:x.fontSize,fontFamily:"sans-serif"}}))};n(23);const S=[];for(let G=0;G<1e3;G++){const e=[];for(let t=0;t<100;t++)e.push("Row: ".concat(G,", Col: ").concat(t));S.push(e)}const M=[["First","Second","Third","Fourth","Fifth","Sixth"],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6],[1,2,3,4,5,6]],D=[];for(let G=0;G<1e3;G++){const e=[];for(let t=0;t<100;t++)e.push(1e6*Math.random());D.push(e)}function N(){const e=Object(l.useState)(S),t=Object(u.a)(e,2),n=t[0],o=t[1],c=Object(l.useState)(Array(100).fill(150)),i=Object(u.a)(c,2),r=i[0],s=i[1],y=Object(l.useState)([]),h=Object(u.a)(y,2),f=h[0],x=h[1];return a.a.createElement("div",{className:"sheet-box"},a.a.createElement(E,{onSelectionChanged:(e,t,n,l)=>{},onRightClick:()=>{},columnHeaders:["A","B","C"],cellStyle:(e,t)=>({}),editData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},displayData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},sourceData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},cellWidth:r,cellHeight:f,onChange:e=>{const t=[...n];var l,a=Object(d.a)(e);try{for(a.s();!(l=a.n()).done;){const e=l.value;t[e.y]||(t[e.y]=[]),t[e.y][e.x]=e.value}}catch(c){a.e(c)}finally{a.f()}o(t)},readOnly:(e,t)=>!1,onCellWidthChange:(e,t)=>{const n=[...r];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(150);n[e]=t,s(n)},onCellHeightChange:(e,t)=>{const n=[...f];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(22);n[e]=t,x(n)},freezeColumns:0,freezeRows:0}))}function k(){const e=Object(l.useState)(JSON.parse(JSON.stringify(M))),t=Object(u.a)(e,2),n=t[0],o=t[1],c=Object(l.useState)([]),i=Object(u.a)(c,2),r=i[0],s=i[1],y=Object(l.useState)([]),h=Object(u.a)(y,2),f=h[0],x=h[1];return a.a.createElement("div",{className:"sheet-box"},a.a.createElement(E,{onSelectionChanged:(e,t,n,l)=>{},onRightClick:()=>{},columnHeaders:["A","B","C"],cellStyle:(e,t)=>({}),editData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},displayData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},sourceData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},cellWidth:r,cellHeight:f,onChange:e=>{const t=[...n];var l,a=Object(d.a)(e);try{for(a.s();!(l=a.n()).done;){const e=l.value;t[e.y]||(t[e.y]=[]),t[e.y][e.x]=e.value}}catch(c){a.e(c)}finally{a.f()}o(t)},readOnly:(e,t)=>!1,onCellWidthChange:(e,t)=>{const n=[...r];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(100);n[e]=t,s(n)},onCellHeightChange:(e,t)=>{const n=[...f];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(22);n[e]=t,x(n)},freezeColumns:0,freezeRows:0}))}const I=new Image;function A(){const e=Object(l.useState)(JSON.parse(JSON.stringify(M))),t=Object(u.a)(e,2),n=t[0],o=t[1],c=Object(l.useState)([]),i=Object(u.a)(c,2),r=i[0],s=i[1],y=Object(l.useState)([]),h=Object(u.a)(y,2),f=h[0],x=h[1],g=["#f00","#0f0","#00f","#000"],m=["left","right","center"],v=["normal","bold","lighter"],b=[0,0,0,0,20];return a.a.createElement("div",{className:"sheet-box"},a.a.createElement(E,{onSelectionChanged:(e,t,n,l)=>{},onRightClick:()=>{},columnHeaders:[],cellStyle:(e,t)=>0===e||0===t?{fillColor:"#6DA2FB22"}:{color:g[t%4],textAlign:m[e%3],marginRight:b[e%5],weight:v[t%3]},editData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},displayData:(e,t)=>{var l,a;return 0===e&&t>0&&t<9?{items:[{content:I,x:8,y:-8,width:16,height:16,onClick:()=>{((e,t)=>{const l=[...n];l[t]&&void 0!==l[t][e]&&(l[t][e]+=1),o(l)})(e,t)}},{content:null===n||void 0===n||null===(a=n[t])||void 0===a?void 0:a[e],x:32,y:0,width:0,height:0}]}:null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},sourceData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},cellWidth:r,cellHeight:f,onChange:e=>{const t=[...n];var l,a=Object(d.a)(e);try{for(a.s();!(l=a.n()).done;){const e=l.value;t[e.y]||(t[e.y]=[]),t[e.y][e.x]=e.value}}catch(c){a.e(c)}finally{a.f()}o(t)},readOnly:(e,t)=>!1,onCellWidthChange:(e,t)=>{const n=[...r];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(100);n[e]=t,s(n)},onCellHeightChange:(e,t)=>{const n=[...f];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(22);n[e]=t,x(n)},freezeColumns:1,freezeRows:1}))}function R(){const e=Object(l.useState)(D),t=Object(u.a)(e,2),n=t[0],o=t[1],c=Object(l.useState)([]),i=Object(u.a)(c,2),r=i[0],s=i[1],y=Object(l.useState)([]),h=Object(u.a)(y,2),f=h[0],x=h[1];return a.a.createElement("div",{className:"sheet-box"},a.a.createElement(E,{cellStyle:(e,t)=>({}),editData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},displayData:(e,t)=>{var l,a,o;return null===n||void 0===n||null===(l=n[t])||void 0===l||null===(a=l[e])||void 0===a||null===(o=a.toFixed)||void 0===o?void 0:o.call(a,2)},sourceData:(e,t)=>{var l;return null===n||void 0===n||null===(l=n[t])||void 0===l?void 0:l[e]},cellWidth:r,cellHeight:f,onChange:e=>{const t=[...n];var l,a=Object(d.a)(e);try{for(a.s();!(l=a.n()).done;){const e=l.value;t[e.y]||(t[e.y]=[]),t[e.y][e.x]=Number(e.value)}}catch(c){a.e(c)}finally{a.f()}o(t)},readOnly:(e,t)=>!1,onCellWidthChange:(e,t)=>{const n=[...r];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(100);n[e]=t,s(n)},onCellHeightChange:(e,t)=>{const n=[...f];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(22);n[e]=t,x(n)},freezeColumns:0,freezeRows:0}))}function L(){const e=Object(l.useState)("initial"),t=Object(u.a)(e,2),n=t[0],o=t[1],c=Object(l.useState)([]),i=Object(u.a)(c,2),r=i[0],s=i[1],y=Object(l.useState)([]),h=Object(u.a)(y,2),f=h[0],x=h[1],g=Object(l.useState)([]),m=Object(u.a)(g,2),v=m[0],b=m[1];return a.a.createElement(a.a.Fragment,null,"initial"===n?a.a.createElement("a",{href:"#",onClick:e=>{e.preventDefault(),o("loading"),fetch("./out.json").then(e=>e.json()).then(e=>{s(e),o("done")})}},"Load global database of power plants"):"loading"===n?"Loading...":null,a.a.createElement("div",{className:"sheet-box"},a.a.createElement(E,{cellStyle:(e,t)=>0===t?{weight:"bold",fontSize:14}:4===e?{textAlign:"right"}:1===e?{weight:"bold",color:"#3b85ff"}:2===e?{color:"#fc3bff"}:{},editData:(e,t)=>{var n;return null===r||void 0===r||null===(n=r[t])||void 0===n?void 0:n[e]},displayData:(e,t)=>{var n;return 4===e&&t>0?r&&r[t]&&r[t][e]?Number(r[t][e]).toFixed(2):"":null===r||void 0===r||null===(n=r[t])||void 0===n?void 0:n[e]},sourceData:(e,t)=>{var n;return null===r||void 0===r||null===(n=r[t])||void 0===n?void 0:n[e]},cellWidth:f,cellHeight:v,onChange:e=>{const t=[...r];var n,l=Object(d.a)(e);try{for(l.s();!(n=l.n()).done;){const e=n.value;t[e.y]||(t[e.y]=[]),t[e.y][e.x]=e.value}}catch(a){l.e(a)}finally{l.f()}s(t)},readOnly:(e,t)=>!1,onCellWidthChange:(e,t)=>{const n=[...f];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(100);n[e]=t,x(n)},onCellHeightChange:(e,t)=>{const n=[...v];if(e>n.length)for(let l=n.length;l<=e;l++)n.push(22);n[e]=t,b(n)},columnHeaderStyle:e=>{const t=(2421*e%255).toString(16).padStart(2,"0"),n=(3215*e%255).toString(16).padStart(2,"0"),l=(1243*e%255).toString(16).padStart(2,"0");return{backgroundColor:"#".concat(t).concat(n).concat(l,"55")}},columnHeaders:e=>""+e,freezeColumns:0,freezeRows:1})))}I.src="data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJjaGVjay1jaXJjbGUiIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS1jaGVjay1jaXJjbGUgZmEtdy0xNiIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMGFkNjZiIiBkPSJNNTA0IDI1NmMwIDEzNi45NjctMTExLjAzMyAyNDgtMjQ4IDI0OFM4IDM5Mi45NjcgOCAyNTYgMTE5LjAzMyA4IDI1NiA4czI0OCAxMTEuMDMzIDI0OCAyNDh6TTIyNy4zMTQgMzg3LjMxNGwxODQtMTg0YzYuMjQ4LTYuMjQ4IDYuMjQ4LTE2LjM3OSAwLTIyLjYyN2wtMjIuNjI3LTIyLjYyN2MtNi4yNDgtNi4yNDktMTYuMzc5LTYuMjQ5LTIyLjYyOCAwTDIxNiAzMDguMTE4bC03MC4wNTktNzAuMDU5Yy02LjI0OC02LjI0OC0xNi4zNzktNi4yNDgtMjIuNjI4IDBsLTIyLjYyNyAyMi42MjdjLTYuMjQ4IDYuMjQ4LTYuMjQ4IDE2LjM3OSAwIDIyLjYyN2wxMDQgMTA0YzYuMjQ5IDYuMjQ5IDE2LjM3OSA2LjI0OSAyMi42MjguMDAxeiI+PC9wYXRoPjwvc3ZnPg==",I.width=16,I.height=16;var T=n(13),H=n.n(T);var z=function(){const e=Object(l.useRef)(null),t=Object(l.useState)(""),n=Object(u.a)(t,2),o=n[0],c=n[1];return a.a.createElement("div",{className:"container blue-bg",id:"home"},a.a.createElement("div",{className:"content flex-row header"},a.a.createElement("div",{className:"box text-box"},a.a.createElement("div",null,a.a.createElement("h1",null,"Beautiful and fast spreadsheet component for React"),a.a.createElement("p",{className:"lightblue-p"},"Sheet Happens is easy to implement and extend.",a.a.createElement("br",null),"And it's super fast.")),a.a.createElement("div",{className:"lib-box"},a.a.createElement("div",{className:"install-box",onClick:t=>{e.current.select(),document.execCommand("copy"),t.target.focus(),c("Copied!"),setTimeout(()=>{c("")},1e3)}},a.a.createElement("input",{readOnly:!0,ref:e,value:"npm install --save sheet-happens"}),""!==o&&a.a.createElement("div",{className:"copy-success"},o)),a.a.createElement("a",{href:"https://github.com/farseerdev/sheet-happens",className:"git-box",target:"_blank"},a.a.createElement("img",{src:H.a,alt:"Git"}),"view on github"))),a.a.createElement("div",{className:"box"},a.a.createElement(N,null))))};var Y=function({title:e,id:t}){return a.a.createElement("div",{className:"title-separator",id:t||""},a.a.createElement("p",null,e||"No title"),a.a.createElement("div",{className:"separator"}))};var W=function({children:e}){return a.a.createElement("div",{className:"container"},a.a.createElement("div",{className:"content flex-row"},e))},B=n(235),F=n(234);var X=function(){return a.a.createElement(B.a,{language:"javascript",style:F.a},"function SheetBox() {\n    const [data, setData] = useState(initialData);\n    const [cellWidth, setCellWidth] = useState([]);\n    const [cellHeight, setCellHeight] = useState([]);\n\n    const onSelectionChanged = (x1, y1, x2, y2) => {};\n    const onRightClick = () => {};\n    const columnHeaders = ['A', 'B', 'C'];\n    const cellStyle = (x, y) => {\n        return {};\n    };\n    const editData = (x, y) => {\n        return data?.[y]?.[x];\n    };\n    const displayData = (x, y) => {\n        return data?.[y]?.[x];\n    };\n    const sourceData = (x, y) => {\n        return data?.[y]?.[x];\n    };\n\n    const onChange = (changes) => {\n        const newData = [...data];\n        for (const change of changes) {\n            if (!newData[change.y]) {\n                newData[change.y] = [];\n            }\n            newData[change.y][change.x] = change.value;\n        }\n        setData(newData);\n    };\n\n    const isReadOnly = (x, y) => {\n        return false;\n    };\n\n    const onCellWidthChange = (columnIdx, newWidth) => {\n        const cw = [...cellWidth];\n        if (columnIdx > cw.length) {\n            for (let i = cw.length; i <= columnIdx; i++) {\n                cw.push(100);\n            }\n        }\n        cw[columnIdx] = newWidth;\n        setCellWidth(cw);\n    };\n    const onCellHeightChange = (rowIdx, newHeight) => {\n        const ch = [...cellHeight];\n        if (rowIdx > ch.length) {\n            for (let i = ch.length; i <= rowIdx; i++) {\n                ch.push(22);\n            }\n        }\n        ch[rowIdx] = newHeight;\n        setCellHeight(ch);\n    };\n\n    return (\n        <div className=\"sheet-box\">\n            <Sheet\n                onSelectionChanged={onSelectionChanged}\n                onRightClick={onRightClick}\n                columnHeaders={columnHeaders}\n                cellStyle={cellStyle}\n                editData={editData}\n                displayData={displayData}\n                sourceData={sourceData}\n                cellWidth={cellWidth}\n                cellHeight={cellHeight}\n                onChange={onChange}\n                readOnly={isReadOnly}\n                onCellWidthChange={onCellWidthChange}\n                onCellHeightChange={onCellHeightChange}\n                freezeColumns={0}\n                freezeRows={0}\n            />\n        </div>\n    );\n}")};var P=function(){return a.a.createElement("div",{className:"footer"},a.a.createElement("p",{className:"copy"},"made by ",a.a.createElement("a",{href:"https://www.farseer.io"},"farseer")))};var Z=()=>a.a.createElement(a.a.Fragment,null,a.a.createElement(s,null),a.a.createElement(z,null),a.a.createElement(Y,{title:"usage",id:"usage"}),a.a.createElement(W,null,a.a.createElement("div",{className:"box full-width",style:{overflowX:"auto"}},a.a.createElement(X,null))),a.a.createElement(Y,{title:"Let me show you its features",id:"features"}),a.a.createElement(W,null,a.a.createElement("div",{className:"box"},a.a.createElement(k,null)),a.a.createElement("div",{className:"box"},a.a.createElement("h3",null,"Basic spreadsheet"),a.a.createElement("p",null,"It has all the features you'd expect from the spreadsheet: keyboard navigation, copy cells by dragging the small square, copy/paste from and to Excel and Google Sheets, resize columns and rows."))),a.a.createElement(W,null,a.a.createElement("div",{className:"box"},a.a.createElement(A,null)),a.a.createElement("div",{className:"box"},a.a.createElement("h3",null,"Styling"),a.a.createElement("p",null,"You can change the cell color, alignment, font weight, margins and more. It's also possible to freeze first rows or columns, and add clickable images."))),a.a.createElement(W,null,a.a.createElement("div",{className:"box"},a.a.createElement(R,null)),a.a.createElement("div",{className:"box"},a.a.createElement("h3",null,"Formatting"),a.a.createElement("p",null,"Sheet Happens uses different datasets for display and edit so you can apply different formatting when displaying the cell and editing the cell."))),a.a.createElement(Y,{title:"big dataset example",id:"big dataset example"}),a.a.createElement(W,null,a.a.createElement("div",{className:"box full-width"},a.a.createElement(L,null))),a.a.createElement(Y,{title:"documentation",id:"documentation"}),a.a.createElement(W,null,a.a.createElement("div",{className:"box full-width"},a.a.createElement("p",null,"Comming soon"))),a.a.createElement(P,null));c.a.render(a.a.createElement(Z,null),document.getElementById("root"))},6:function(e,t,n){}},[[18,1,2]]]);
//# sourceMappingURL=main.6e9e31a7.chunk.js.map