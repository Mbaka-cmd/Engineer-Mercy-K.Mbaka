(function(){'use strict';
var body=document.body,header=document.querySelector('.site-header'),menu=document.getElementById('site-menu'),toggle=document.getElementById('menu-toggle'),closeBtn=document.getElementById('menu-close'),page=document.getElementById('page'),last=null;
function openMenu(){last=document.activeElement;menu.classList.add('is-open');menu.removeAttribute('aria-hidden');toggle.setAttribute('aria-expanded','true');body.classList.add('menu-open');page.setAttribute('inert','');closeBtn.focus();}
function closeMenu(r){if(!menu.classList.contains('is-open'))return;menu.classList.remove('is-open');menu.setAttribute('aria-hidden','true');toggle.setAttribute('aria-expanded','false');body.classList.remove('menu-open');page.removeAttribute('inert');if(r!==false)(last||toggle).focus();}
toggle.addEventListener('click',openMenu);
closeBtn.addEventListener('click',function(){closeMenu();});
menu.addEventListener('click',function(e){if(e.target.closest('a[href]'))closeMenu(false);});
document.addEventListener('keydown',function(e){if(!menu.classList.contains('is-open'))return;
if(e.key==='Escape'){e.preventDefault();closeMenu();return;}
if(e.key!=='Tab')return;var f=menu.querySelectorAll('a[href],button:not([disabled])'),a=f[0],z=f[f.length-1];
if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}});
window.addEventListener('pageshow',function(){closeMenu(false);});
var solid=header.hasAttribute('data-solid'),tick=false;
function onScroll(){if(tick)return;tick=true;requestAnimationFrame(function(){header.classList.toggle('is-scrolled',solid||window.scrollY>40);tick=false;});}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();
var v=document.getElementById('hero-video');
if(v&&v.dataset.src){var rm=matchMedia('(prefers-reduced-motion: reduce)').matches,sv=navigator.connection&&navigator.connection.saveData;
if(!rm&&!sv){v.addEventListener('playing',function(){v.classList.add('is-playing');});v.addEventListener('error',function(){v.remove();});v.src=v.dataset.src;var p=v.play();if(p&&p.catch)p.catch(function(){v.remove();});}}
var fb=document.querySelector('.filters');
if(fb){fb.hidden=false;var items=[].slice.call(document.querySelectorAll('[data-cat]')),out=document.getElementById('count');
fb.addEventListener('click',function(e){var b=e.target.closest('button[data-filter]');if(!b)return;
[].forEach.call(fb.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
var f=b.getAttribute('data-filter'),n=0;
items.forEach(function(it){var show=f==='all'||it.getAttribute('data-cat').split(' ').indexOf(f)>-1;it.hidden=!show;if(show)n++;});
var k=0;items.forEach(function(it){it.classList.remove('is-alt');if(!it.hidden){if(k%2===1)it.classList.add('is-alt');k++;}});
if(out)out.textContent='Showing '+n+(n===1?' project':' projects');});}
})();