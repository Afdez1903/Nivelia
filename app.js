(function(){
"use strict";

/* ================= utilidades ================= */
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var pad=function(n){return String(n).padStart(2,"0")};
var dkey=function(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
var parse=function(k){var p=k.split("-").map(Number);return new Date(p[0],p[1]-1,p[2])};
var cap=function(s){return s.charAt(0).toUpperCase()+s.slice(1)};
var uid8=function(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)};
var fmtN=function(n,d){return Number(n).toLocaleString("es-ES",{maximumFractionDigits:d==null?1:d})};
var sign=function(n){n=Math.round(n);return n>0?"+"+n:n<0?"−"+Math.abs(n):"0"};
var isKey=function(s){return /^\d{4}-\d{2}-\d{2}$/.test(s||"")&&!isNaN(parse(s).getTime())};
var fmtLong=function(k){return cap(parse(k).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"}))};
var fmtShort=function(k){return parse(k).toLocaleDateString("es-ES",{day:"numeric",month:"short"})};
function addDays(k,n){var d=parse(k);d.setDate(d.getDate()+n);return dkey(d)}
function mondayOf(k){var d=parse(k);d.setDate(d.getDate()-((d.getDay()+6)%7));return dkey(d)}
function weekKeys(k){var m=mondayOf(k),a=[];for(var i=0;i<7;i++)a.push(addDays(m,i));return a}
function diffDays(a,b){return Math.round((parse(b)-parse(a))/86400000)}
function fmtH(h){var m=Math.round((h-Math.floor(h))*60),hh=Math.floor(h);if(m===60){hh++;m=0}return m?hh+" h "+pad(m)+" min":hh+" h"}

/* ================= reglas ================= */
var HABIT_XP=8,NOTE_XP=10,GOAL_XP=100,DAY_M_XP=10,WEEK_M_XP=30;
var GOOD={s:10,m:25,l:50},BAD={s:5,m:15,l:30},INT={s:.6,n:1,h:1.4},INT_LABEL={s:"Suave",n:"Normal",h:"Intenso"};
var SPORTS=["Fútbol","Gimnasio","Correr","Caminar","Ciclismo","Natación","Pádel","Yoga","Otro"];
var MIND=["Lectura","Estudio","Meditación","Otro"],WHO=["Amigos","Familia","Pareja","Otros"],CATS=["Ocio","Comida fuera","Compras","Transporte","Otros"];
var TAGS=["Trabajo","Familia","Amigos","Estudios","Salud","Ocio"];
var MOODS=["Mal","Regular","Normal","Bien","Genial"];
var TITLES=["Novato","Aprendiz","Constante","Disciplinado","Imparable","Maestro","Leyenda","Mítico"];
var TYPE_TITLE={good:"Algo bueno",sport:"Deporte",mind:"Mente",social:"Tiempo con otros",bad:"Una frustración",spend:"Gasto"};
var DEFAULT_HABITS=[{id:"h1",name:"Dormir bien"},{id:"h2",name:"Beber agua"},{id:"h3",name:"Leer un rato"},{id:"h4",name:"Respirar o meditar"}];
var DEFAULT_COUNTERS=[
  {id:"c-alc",name:"Cervezas o copas",unit:"",kind:"limite",limit:2,period:"week",pen:6,sin:5,step:1},
  {id:"c-caf",name:"Cafés",unit:"",kind:"limite",limit:3,period:"day",pen:2,sin:0,step:1},
  {id:"c-dul",name:"Dulces o refrescos",unit:"",kind:"limite",limit:1,period:"day",pen:2,sin:0,step:1},
  {id:"c-pan",name:"Pantalla",unit:"h",kind:"limite",limit:4,period:"day",pen:2,sin:0,step:.5},
  {id:"c-agu",name:"Agua",unit:"vasos",kind:"meta",goal:8,bonus:10,step:1}
];
var PRESETS=[
  {name:"Cigarrillos",unit:"",kind:"limite",limit:0,period:"day",pen:3,sin:5,step:1},
  {name:"Comida rápida",unit:"",kind:"limite",limit:2,period:"week",pen:4,sin:0,step:1},
  {name:"Redes sociales",unit:"h",kind:"limite",limit:1,period:"day",pen:2,sin:0,step:.5},
  {name:"Fruta y verdura",unit:"raciones",kind:"meta",goal:5,bonus:8,step:1}
];

/* ================= estado ================= */
var today=dkey(new Date());
var S={days:{},habits:DEFAULT_HABITS.slice(),counters:JSON.parse(JSON.stringify(DEFAULT_COUNTERS)),goals:[],freezes:{},set:{sleepGoal:7,stepsGoal:8000},
  tab:"day",sel:today,cal:null,editHabits:false,sumMode:"w0",q:""};
var n0=new Date();S.cal={y:n0.getFullYear(),m:n0.getMonth()};
var F=null,undo=null,tabChanged=false;
var CACHE="progreso-diario-v1";

function nd(d){d=d||{};return {items:d.items||[],mood:d.mood==null?null:d.mood,habits:d.habits||{},note:d.note||"",counts:d.counts||{},
  sleep:d.sleep||null,steps:d.steps==null?null:d.steps,weight:d.weight==null?null:d.weight,waist:d.waist==null?null:d.waist,highlight:d.highlight||""}}
function ensureDay(k){S.days[k]=nd(S.days[k]);return S.days[k]}
function hasCounts(d){for(var i in d.counts)if(d.counts[i]>0)return true;return false}
function isEmptyDay(d){if(!d)return true;d=nd(d);return !d.items.length&&d.mood==null&&!Object.keys(d.habits).length&&!d.note.trim()&&!hasCounts(d)&&!d.sleep&&d.steps==null&&d.weight==null&&d.waist==null&&!d.highlight.trim()}
function counterCount(k,id){var d=S.days[k];return d&&d.counts&&d.counts[id]||0}

function saveCache(){try{localStorage.setItem(CACHE,JSON.stringify({days:S.days,habits:S.habits,counters:S.counters,goals:S.goals,freezes:S.freezes,set:S.set}))}catch(e){}}
function loadCache(){
  try{
    var j=JSON.parse(localStorage.getItem(CACHE)||"null");if(!j)return;
    if(j.days){S.days=j.days}
    if(j.habits&&j.habits.length)S.habits=j.habits;
    if(j.counters)S.counters=j.counters;
    if(j.goals)S.goals=j.goals;
    if(j.freezes)S.freezes=j.freezes;
    if(j.set)S.set=Object.assign(S.set,j.set);
  }catch(e){}
}
function persist(){saveCache()}

/* ================= experiencia ================= */
function itemXP(it){
  if(it.t==="good")return GOOD[it.size]||0;
  if(it.t==="bad"){var b=BAD[it.size]||0;return -(it.lesson&&it.lesson.trim()?Math.round(b/2):b)}
  if(it.t==="sport")return Math.max(15,Math.round((it.min||0)*(INT[it.int]||1)));
  if(it.t==="mind")return Math.max(5,Math.round((it.min||0)*.5));
  if(it.t==="social")return Math.max(5,Math.round((it.min||0)/6));
  return 0;
}
function need(L){return 100+30*(L-1)}
function levelInfo(t){var L=1,r=t;while(r>=need(L)){r-=need(L);L++}return {L:L,rem:r,need:need(L),title:TITLES[Math.min(Math.floor((L-1)/2),TITLES.length-1)]}}
function habitCount(d){var n=0;S.habits.forEach(function(h){if(d.habits&&d.habits[h.id])n++});return n}
function sportName(it){return it.sport==="Otro"?(it.other&&it.other.trim()||"Otro"):it.sport}

function cXP(c,k,n){
  if(c.kind==="meta")return c.goal>0&&n>=c.goal?(c.bonus||10):0;
  var x=0;
  if(c.period==="week"){
    var wk=weekKeys(k),before=0;
    for(var i=0;i<wk.length&&wk[i]<k;i++)before+=counterCount(wk[i],c.id);
    x-=Math.max(0,n-Math.max(0,c.limit-before))*c.pen;
  }else x-=Math.max(0,n-c.limit)*c.pen;
  if(c.sin>0&&n===0&&k<=today&&S.days[k]&&!isEmptyDay(S.days[k]))x+=c.sin;
  return Math.round(x);
}
function counterXP(k,d){var x=0;S.counters.forEach(function(c){x+=cXP(c,k,d.counts[c.id]||0)});return x}
function sleepXP(d){if(!d.sleep)return 0;var g=S.set.sleepGoal;return d.sleep.h>=g?10:d.sleep.h>=g-1?4:0}
function stepsXP(d){if(d.steps==null)return 0;var g=S.set.stepsGoal;return d.steps>=g*1.5?12:d.steps>=g?8:0}
function dayParts(k){
  var p={good:0,bad:0,sport:0,mind:0,social:0,habit:0,note:0,counter:0,sleep:0,steps:0};
  if(!S.days[k])return p;var d=nd(S.days[k]);
  d.items.forEach(function(it){if(p[it.t]!=null)p[it.t]+=itemXP(it)});
  p.habit=habitCount(d)*HABIT_XP;p.note=d.note.trim()?NOTE_XP:0;p.counter=counterXP(k,d);p.sleep=sleepXP(d);p.steps=stepsXP(d);return p;
}
function sumParts(p){var t=0;for(var i in p)t+=p[i];return t}
function dayXPk(k){return sumParts(dayParts(k))}

/* ---------- misiones ---------- */
function cnt(ds,t){var n=0;ds.forEach(function(d){d.items.forEach(function(i){if(i.t===t)n++})});return n}
function minOf(ds,t,kind){var n=0;ds.forEach(function(d){d.items.forEach(function(i){if(i.t===t&&(!kind||i.mkind===kind))n+=i.min||0})});return n}
var DM=[
  {id:"d1",text:"Haz algo de deporte",target:1,f:function(a){return cnt(a,"sport")}},
  {id:"d2",text:"Apunta 3 cosas buenas",target:3,f:function(a){return cnt(a,"good")}},
  {id:"d3",text:"Completa 3 hábitos",target:3,f:function(a){var n=0;a.forEach(function(d){n+=habitCount(d)});return n}},
  {id:"d4",text:"Duerme 7 horas o más",target:7,f:function(a){return a[0].sleep?a[0].sleep.h:0}},
  {id:"d5",text:"Lee, estudia o medita 20 min",target:20,f:function(a){return minOf(a,"mind")}},
  {id:"d6",text:"Dedica 30 min a alguien",target:30,f:function(a){return minOf(a,"social")}},
  {id:"d7",text:"Escribe una reflexión",target:1,f:function(a){return a[0].note.trim()?1:0}},
  {id:"d8",text:"Camina 6.000 pasos",target:6000,f:function(a){return a[0].steps||0}}
];
var WM=[
  {id:"w1",text:"Haz deporte 3 veces",target:3,f:function(a){return cnt(a,"sport")}},
  {id:"w2",text:"Apunta 10 cosas buenas",target:10,f:function(a){return cnt(a,"good")}},
  {id:"w3",text:"Completa 20 hábitos",target:20,f:function(a){var n=0;a.forEach(function(d){n+=habitCount(d)});return n}},
  {id:"w4",text:"Lee, estudia o medita 100 min",target:100,f:function(a){return minOf(a,"mind")}},
  {id:"w5",text:"3 noches de 7 h o más",target:3,f:function(a){var n=0;a.forEach(function(d){if(d.sleep&&d.sleep.h>=7)n++});return n}},
  {id:"w6",text:"2 ratos con amigos o familia",target:2,f:function(a){return cnt(a,"social")}},
  {id:"w7",text:"Escribe 4 reflexiones",target:4,f:function(a){var n=0;a.forEach(function(d){if(d.note.trim())n++});return n}},
  {id:"w8",text:"Apunta algo 6 días",target:6,f:function(a){var n=0;a.forEach(function(d){if(!isEmptyDay(d))n++});return n}}
];
function seedRand(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}
  return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
function pickN(pool,n,seed){var r=seedRand(seed),a=pool.slice(),o=[];while(o.length<n&&a.length)o.push(a.splice(Math.floor(r()*a.length),1)[0]);return o}
function missionsFor(kind,key){
  var ds,pool,n,seed,xp;
  if(kind==="d"){ds=[nd(S.days[key])];pool=DM;n=2;seed="d"+key;xp=DAY_M_XP}
  else{var m=mondayOf(key);ds=weekKeys(m).map(function(k){return nd(S.days[k])});pool=WM;n=3;seed="w"+m;xp=WEEK_M_XP}
  return pickN(pool,n,seed).map(function(p){var cur=p.f(ds);return {id:p.id,text:p.text,target:p.target,cur:cur,done:cur>=p.target,xp:xp}});
}
function missionStats(){
  var x=0,n=0,weeks={};
  Object.keys(S.days).forEach(function(k){
    if(isEmptyDay(S.days[k]))return;
    missionsFor("d",k).forEach(function(m){if(m.done){x+=m.xp;n++}});weeks[mondayOf(k)]=1;
  });
  Object.keys(weeks).forEach(function(w){missionsFor("w",w).forEach(function(m){if(m.done){x+=m.xp;n++}})});
  return {xp:x,n:n};
}
function gProg(g){var t=0;(g.log||[]).forEach(function(l){t+=l.a});return t}
function goalStats(){var n=0;S.goals.forEach(function(g){if(g.target>0&&gProg(g)>=g.target)n++});return {n:n,xp:n*GOAL_XP}}
function totalXP(){var t=0;Object.keys(S.days).forEach(function(k){t+=dayXPk(k)});t+=missionStats().xp+goalStats().xp;return Math.max(0,t)}

/* ---------- racha, días sin, estadísticas ---------- */
function activeK(k){return !!S.freezes[k]||!isEmptyDay(S.days[k])}
function streaks(){
  var set={};Object.keys(S.days).forEach(function(k){if(!isEmptyDay(S.days[k]))set[k]=1});Object.keys(S.freezes).forEach(function(k){set[k]=1});
  var keys=Object.keys(set).sort(),best=0,run=0,prev=null;
  keys.forEach(function(k){run=prev&&addDays(prev,1)===k?run+1:1;if(run>best)best=run;prev=k});
  var cur=0,c=today;if(!activeK(c))c=addDays(c,-1);
  while(activeK(c)){cur++;c=addDays(c,-1)}
  return {cur:cur,best:best};
}
function firstKey(){var ks=Object.keys(S.days).filter(function(k){return !isEmptyDay(S.days[k])}).sort();return ks[0]||null}
function daysSin(c){
  var ks=Object.keys(S.days).filter(function(k){return counterCount(k,c.id)>0}).sort(),f=firstKey();
  if(ks.length)return Math.max(0,diffDays(ks[ks.length-1],today));
  return f?diffDays(f,today)+1:0;
}
function alcCounter(){return S.counters.filter(function(c){return c.id==="c-alc"})[0]||S.counters.filter(function(c){return c.kind==="limite"&&c.sin>0})[0]||null}
function waterCounter(){return S.counters.filter(function(c){return c.id==="c-agu"})[0]||S.counters.filter(function(c){return c.kind==="meta"})[0]||null}
function stats(){
  var s={good:0,bad:0,sport:0,lessons:0,minutes:0,mindMin:0,medMin:0,socialN:0,habitsDone:0,notes:0,round:0,sleepGood:0,stepsDays:0,waterDays:0,active:0,sports:{},
    cat:{good:0,sport:0,mind:0,social:0,habit:0,note:0,counter:0,sleep:0,steps:0,bad:0,missions:0,goals:0}};
  var kinds={},wc=waterCounter();
  Object.keys(S.days).forEach(function(k){
    if(isEmptyDay(S.days[k]))return;var d=nd(S.days[k]),g=0,sp=0;s.active++;
    var p=dayParts(k);for(var i in p)s.cat[i]+=p[i];
    d.items.forEach(function(it){
      if(it.t==="good"){s.good++;g++}
      else if(it.t==="bad"){s.bad++;if(it.lesson&&it.lesson.trim())s.lessons++}
      else if(it.t==="sport"){s.sport++;sp++;s.minutes+=it.min||0;var n=sportName(it);kinds[n]=1;var o=s.sports[n]||(s.sports[n]={n:0,min:0});o.n++;o.min+=it.min||0}
      else if(it.t==="mind"){s.mindMin+=it.min||0;if(it.mkind==="Meditación")s.medMin+=it.min||0}
      else if(it.t==="social")s.socialN++;
    });
    s.habitsDone+=habitCount(d);if(d.note.trim())s.notes++;if(g>=2&&sp>=1)s.round++;
    if(d.sleep&&d.sleep.h>=S.set.sleepGoal)s.sleepGood++;
    if(d.steps!=null&&d.steps>=S.set.stepsGoal)s.stepsDays++;
    if(wc&&(d.counts[wc.id]||0)>=wc.goal&&wc.goal>0)s.waterDays++;
  });
  var ms=missionStats(),gs=goalStats();s.cat.missions=ms.xp;s.cat.goals=gs.xp;s.missionsDone=ms.n;s.goalsDone=gs.n;
  s.kinds=Object.keys(kinds).length;var st=streaks();s.streak=st.cur;s.best=st.best;
  s.total=totalXP();s.level=levelInfo(s.total).L;
  var ac=alcCounter();s.alcFree=ac?daysSin(ac):0;s.freezeUsed=Object.keys(S.freezes).length;
  s.entries=s.good+s.bad+s.sport+s.habitsDone+s.notes+s.active;
  return s;
}
var ACH=[
  {n:"Primer paso",d:"Apunta algo por primera vez",p:function(s){return [s.active,1]}},
  {n:"Cuerda de buenas",d:"10 cosas buenas apuntadas",p:function(s){return [s.good,10]}},
  {n:"Mirada positiva",d:"50 cosas buenas apuntadas",p:function(s){return [s.good,50]}},
  {n:"A moverse",d:"Tu primera sesión de deporte",p:function(s){return [s.sport,1]}},
  {n:"Polideportivo",d:"Practica 3 deportes distintos",p:function(s){return [s.kinds,3]}},
  {n:"Máquina",d:"20 sesiones de deporte",p:function(s){return [s.sport,20]}},
  {n:"Diez horas",d:"600 minutos de deporte",p:function(s){return [s.minutes,600]}},
  {n:"Aprender del tropiezo",d:"5 frustraciones con aprendizaje",p:function(s){return [s.lessons,5]}},
  {n:"Día redondo",d:"2 cosas buenas y deporte en un día",p:function(s){return [s.round,1]}},
  {n:"Rutina firme",d:"50 hábitos completados",p:function(s){return [s.habitsDone,50]}},
  {n:"Diario vivo",d:"10 reflexiones escritas",p:function(s){return [s.notes,10]}},
  {n:"Racha de 3",d:"3 días seguidos apuntando",p:function(s){return [s.best,3]}},
  {n:"Racha de 7",d:"Una semana seguida",p:function(s){return [s.best,7]}},
  {n:"Racha de 30",d:"Un mes seguido",p:function(s){return [s.best,30]}},
  {n:"Semana sin copas",d:"7 días sin alcohol",p:function(s){return [s.alcFree,7]}},
  {n:"Mes sin copas",d:"30 días sin alcohol",p:function(s){return [s.alcFree,30]}},
  {n:"Buenas noches",d:"7 noches durmiendo tu objetivo",p:function(s){return [s.sleepGood,7]}},
  {n:"Hidratado",d:"7 días con el objetivo de agua",p:function(s){return [s.waterDays,7]}},
  {n:"Caminante",d:"10 días con tu objetivo de pasos",p:function(s){return [s.stepsDays,10]}},
  {n:"Lector",d:"600 minutos de lectura, estudio o meditación",p:function(s){return [s.mindMin,600]}},
  {n:"Mente en calma",d:"120 minutos de meditación",p:function(s){return [s.medMin,120]}},
  {n:"Sociable",d:"10 ratos con amigos o familia",p:function(s){return [s.socialN,10]}},
  {n:"Misionero",d:"10 misiones cumplidas",p:function(s){return [s.missionsDone,10]}},
  {n:"Meta cumplida",d:"Completa un objetivo a largo plazo",p:function(s){return [s.goalsDone,1]}},
  {n:"Rescatado",d:"Usa un comodín de racha",p:function(s){return [s.freezeUsed,1]}},
  {n:"Veterano",d:"100 días con registro",p:function(s){return [s.active,100]}},
  {n:"Nivel 5",d:"Alcanza el nivel 5",p:function(s){return [s.level,5]}},
  {n:"Nivel 10",d:"Alcanza el nivel 10",p:function(s){return [s.level,10]}}
];

/* ================= iconos ================= */
var I={
  plus:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9" stroke-width="1.8"/><path d="M12 8v8M8 12h8"/></svg>',
  minus:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" stroke-width="1.6"/><path d="M8 12h8"/></svg>',
  left:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  right:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  tick:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  star:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z"/></svg>',
  lock:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  x:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

/* ================= piezas de vista ================= */
function kv(label,val,cls){return '<div class="row"><div class="main t">'+label+'</div><span class="x tnum '+(cls||"")+'" style="font-weight:500">'+val+'</span></div>'}
function sec(title,inner,foot){return '<section class="sec"><h2 class="sec-h">'+title+'</h2>'+inner+(foot?'<p class="sec-f">'+foot+'</p>':'')+'</section>'}
function grp(rows){return '<div class="group">'+rows+'</div>'}
function xpOf(x){return x?'<span class="x '+(x>0?"pos":"neg")+'">'+sign(x)+'</span>':''}

function xpCard(){
  var t=totalXP(),li=levelInfo(t),st=streaks(),dx=dayXPk(S.sel),pct=Math.max(0,Math.min(100,li.rem/li.need*100));
  return '<section class="card xp" id="xpcard" aria-label="Experiencia"><div class="xp-top"><div><div class="lvl">Nivel '+li.L+'</div><div class="rank">'+li.title+'</div></div><div class="rank tnum">'+t+' XP en total</div></div>'+
    '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="'+li.need+'" aria-valuenow="'+li.rem+'"><i style="width:'+pct+'%"></i></div>'+
    '<div class="xp-foot tnum"><span>'+li.rem+' / '+li.need+' XP</span><span>Faltan '+(li.need-li.rem)+' para el nivel '+(li.L+1)+'</span></div>'+
    '<div class="chips"><span class="chip '+(dx>0?"pos":dx<0?"neg":"")+' tnum">'+sign(dx)+' XP '+(S.sel===today?"hoy":"este día")+'</span><span class="chip fire tnum">Racha '+st.cur+(st.cur===1?" día":" días")+'</span></div></section>';
}
function refreshXpCard(){var el=$("#xpcard");if(el&&S.tab==="day")el.outerHTML=xpCard()}

function missionRows(list){
  return list.map(function(m){
    var pct=Math.min(100,m.cur/m.target*100);
    return '<div class="row"><span class="check '+(m.done?"on":"")+'">'+I.tick+'</span><div class="main"><div class="t">'+m.text+'</div><div class="d tnum">'+fmtN(Math.min(m.cur,m.target),m.target>=100?0:1)+' / '+fmtN(m.target,0)+'</div><div class="mini '+(m.done?"done":"")+'"><i style="width:'+pct+'%"></i></div></div><span class="x '+(m.done?"pos":"")+'" style="'+(m.done?"":"color:var(--label3)")+'">+'+m.xp+'</span></div>';
  }).join("");
}

function itemMain(it){
  if(it.t==="sport")return esc(sportName(it));
  if(it.t==="mind")return esc(it.mkind||"Mente");
  if(it.t==="social")return esc(it.who||"Social");
  if(it.t==="spend")return fmtN(it.amt,2)+" €";
  return esc(it.text);
}
function itemDet(it){
  var a=[];
  if(it.t==="sport"){a.push((it.min||0)+" min",INT_LABEL[it.int]);if(it.text)a.push(it.text)}
  else if(it.t==="mind"||it.t==="social"){a.push((it.min||0)+" min");if(it.text)a.push(it.text)}
  else if(it.t==="spend"){a.push(it.cat);if(it.text)a.push(it.text)}
  else if(it.t==="bad"&&it.lesson&&it.lesson.trim())a.push("Aprendo: "+it.lesson);
  if(it.tags&&it.tags.length)a.push(it.tags.join(", "));
  return a.map(esc).join(" · ");
}
function itemRow(it,ro){
  var det=itemDet(it),x=itemXP(it);
  return '<div class="row"><span class="dot '+it.t+'"></span><div class="main"><div class="t">'+itemMain(it)+'</div>'+(det?'<div class="d">'+det+'</div>':'')+'</div>'+
    (it.t==="spend"?'':'<span class="x '+(x>=0?"pos":"neg")+'">'+sign(x)+'</span>')+
    (ro?'':'<button class="del" data-a="del" data-v="'+esc(it.id)+'" aria-label="Eliminar">'+I.x+'</button>')+'</div>';
}
function section(title,types,addType,addLabel,foot,emptyTxt){
  var d=nd(S.days[S.sel]),list=d.items.filter(function(i){return types.indexOf(i.t)>-1}),future=S.sel>today;
  var rows=list.map(function(i){return itemRow(i)}).join("");
  if(!rows)rows='<div class="row empty">'+emptyTxt+'</div>';
  if(!future)rows+='<button class="row add" data-a="add" data-v="'+addType+'">'+I.plus+'<span>'+addLabel+'</span></button>';
  return sec(title,grp(rows),foot);
}
function weekTotal(c,k){var n=0;weekKeys(k).forEach(function(w){n+=counterCount(w,c.id)});return n}

function viewDay(){
  var d=nd(S.days[S.sel]),k=S.sel,isToday=k===today,future=k>today;
  var title=isToday?"Hoy":cap(parse(k).toLocaleDateString("es-ES",{weekday:"long"}));
  var h='<header><div class="navrow"><div class="grp"><button class="icon-btn" data-a="prevDay" aria-label="Día anterior">'+I.left+'</button><button class="icon-btn" data-a="nextDay" aria-label="Día siguiente">'+I.right+'</button></div>'+(isToday?'':'<button class="link" data-a="today">Ir a hoy</button>')+'</div><h1>'+title+'</h1><p class="sub">'+fmtLong(k)+'</p></header>';
  h+=xpCard();
  if(future)h+='<p class="note">Este día aún no ha llegado. Podrás apuntar cuando llegue.</p>';
  else h+=sec("Misiones de hoy",grp(missionRows(missionsFor("d",k))));
  h+=sec("¿Cómo ha ido el día?",'<div class="seg" role="group" aria-label="Estado de ánimo">'+MOODS.map(function(m,i){return '<button data-a="mood" data-v="'+(i+1)+'" class="'+(d.mood===i+1?"on":"")+'" '+(future?"disabled":"")+'>'+m+'</button>'}).join("")+'</div>');
  h+=section("Cosas buenas",["good"],"good","Añadir algo bueno","","Aún no hay nada. Apunta algo que hayas hecho bien, por pequeño que sea.");
  h+=section("Deporte",["sport"],"sport","Añadir deporte","El XP depende de los minutos y de la intensidad.","Sin deporte apuntado.");
  h+=section("Mente",["mind"],"mind","Añadir lectura, estudio o meditación","","Sin sesiones de mente.");
  h+=section("Tiempo con otros",["social"],"social","Añadir tiempo con alguien","","Nadie apuntado todavía.");
  h+=section("Frustraciones",["bad"],"bad","Añadir una frustración","Restan XP. Si escribes qué aprendes, restan la mitad.","Nada que anotar. Mejor así.");
  // contadores
  var cr=S.counters.map(function(c){
    var n=d.counts[c.id]||0,x=cXP(c,k,n),sub;
    if(c.kind==="meta")sub="Objetivo: "+fmtN(c.goal)+(c.unit?" "+esc(c.unit):"");
    else sub=c.period==="week"?fmtN(weekTotal(c,k))+" de "+fmtN(c.limit)+" esta semana":"Límite: "+fmtN(c.limit)+" al día";
    return '<div class="row"><div class="main"><div class="t">'+esc(c.name)+'</div><div class="d tnum">'+sub+'</div></div>'+xpOf(x)+
      '<div class="stepper"><button data-a="cdec" data-v="'+esc(c.id)+'" aria-label="Quitar uno" '+(future||n<=0?"disabled":"")+'>−</button><b>'+fmtN(n)+'</b><button data-a="cinc" data-v="'+esc(c.id)+'" aria-label="Sumar uno" '+(future?"disabled":"")+'>+</button></div></div>';
  }).join("");
  if(!cr)cr='<div class="row empty">Sin contadores. Añádelos en Ajustes.</div>';
  h+=sec("Contadores",grp(cr),"Pasarte del límite resta XP. Cumplir un objetivo suma.");
  // sueño
  var sl=d.sleep,sx=sleepXP(d);
  var sr='<div class="row"><div class="main"><div class="t">Horas dormidas</div><div class="d">'+(sl&&sl.src?"Desde el reloj · ":"")+'Objetivo: '+fmtN(S.set.sleepGoal)+' h</div></div>'+xpOf(sx)+
    '<div class="stepper"><button data-a="sdec" aria-label="Menos" '+(future||!sl?"disabled":"")+'>−</button><b style="min-width:78px">'+(sl?fmtH(sl.h):"—")+'</b><button data-a="sinc" aria-label="Más" '+(future?"disabled":"")+'>+</button></div></div>';
  if(sl)sr+='<div class="row"><div class="main t">Calidad</div><div class="seg" style="width:60%">'+[[1,"Mala"],[2,"Normal"],[3,"Buena"]].map(function(q){return '<button data-a="sq" data-v="'+q[0]+'" class="'+(sl.q===q[0]?"on":"")+'">'+q[1]+'</button>'}).join("")+'</div></div>';
  h+=sec("Sueño",grp(sr));
  // cuerpo
  var nrow=function(label,field,val,ph,xp){return '<label class="row" for="n-'+field+'"><span class="main t">'+label+'</span>'+xpOf(xp)+'<input class="numin" id="n-'+field+'" data-s="'+field+'" type="number" inputmode="decimal" step="any" placeholder="'+ph+'" value="'+(val==null?"":val)+'" '+(future?"disabled":"")+'></label>'};
  h+=sec("Cuerpo",grp(nrow("Pasos","steps",d.steps,"0",stepsXP(d))+nrow("Peso (kg)","weight",d.weight,"0")+nrow("Cintura (cm)","waist",d.waist,"0")),"Objetivo de pasos: "+fmtN(S.set.stepsGoal,0)+". Se puede cambiar en Ajustes.");
  // hábitos
  var hr=S.habits.map(function(hb){
    var on=!!d.habits[hb.id];
    if(S.editHabits)return '<div class="row"><div class="main t">'+esc(hb.name)+'</div><button class="del danger" data-a="delHabit" data-v="'+esc(hb.id)+'" aria-label="Quitar hábito">'+I.minus+'</button></div>';
    return '<button class="row" data-a="habit" data-v="'+esc(hb.id)+'" '+(future?"disabled":"")+'><span class="check '+(on?"on":"")+'">'+I.tick+'</span><span class="main t">'+esc(hb.name)+'</span><span class="x '+(on?"pos":"")+'" style="'+(on?"":"color:var(--label3)")+'">+'+HABIT_XP+'</span></button>';
  }).join("");
  if(!hr)hr='<div class="row empty">Sin hábitos. Añade el primero.</div>';
  if(S.editHabits)hr+='<form class="row" data-form="habit"><input id="newHabit" type="text" class="in-fill" placeholder="Nuevo hábito" maxlength="40" style="padding:9px 12px"><button class="link" type="submit">Añadir</button></form>';
  h+='<section class="sec"><div style="display:flex;justify-content:space-between;align-items:baseline"><h2 class="sec-h">Hábitos del día</h2><button class="link" data-a="editHabits" style="padding-right:16px">'+(S.editHabits?"Listo":"Editar")+'</button></div>'+grp(hr)+'</section>';
  // gastos
  var spent=0;d.items.forEach(function(i){if(i.t==="spend")spent+=i.amt||0});
  h+=section("Gastos",["spend"],"spend","Añadir un gasto",spent?"Total del día: "+fmtN(spent,2)+" €":"","Sin gastos apuntados.");
  // reflexión
  h+=sec("Reflexión o gratitud <span style=\"text-transform:none;letter-spacing:0;font-weight:500\">(+"+NOTE_XP+" XP)</span>",'<textarea id="note" placeholder="Una cosa por la que estás agradecido o que has aprendido hoy" '+(future?"disabled":"")+'>'+esc(d.note)+'</textarea>');
  h+=sec("Frase o momento destacado",'<input id="hl" type="text" maxlength="160" placeholder="Lo que quieres recordar de este día" value="'+esc(d.highlight)+'" '+(future?"disabled":"")+'>');
  // comodín
  if(k<today&&!activeK(k)||S.freezes[k]){
    var mk=k.slice(0,7),usedOther=Object.keys(S.freezes).some(function(x){return x!==k&&x.slice(0,7)===mk});
    h+=sec("Comodín de racha",S.freezes[k]?'<button class="btn" data-a="freeze">Quitar el comodín de este día</button>':usedOther?'<p class="note">Ya has usado el comodín de este mes.</p>':'<button class="btn" data-a="freeze">Usar el comodín en este día</button>',"Mantiene la racha aunque no apuntaras nada. Tienes uno al mes.");
  }
  return h;
}

function viewCal(){
  var y=S.cal.y,m=S.cal.m,first=new Date(y,m,1),lead=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate();
  var title=cap(first.toLocaleDateString("es-ES",{month:"long",year:"numeric"}));
  var cells="";for(var i=0;i<lead;i++)cells+='<div class="cell out"></div>';
  for(var n=1;n<=days;n++){
    var k=y+"-"+pad(m+1)+"-"+pad(n),d=S.days[k],c={g:0,r:0,b:0,p:0};
    if(d)nd(d).items.forEach(function(it){if(it.t==="good")c.g++;else if(it.t==="bad")c.r++;else if(it.t==="sport")c.b++;else if(it.t==="mind"||it.t==="social")c.p++});
    cells+='<button class="cell'+(k===today?" today":"")+(k===S.sel?" sel":"")+(k>today?" fut":"")+'" data-a="pick" data-v="'+k+'" aria-label="'+esc(fmtLong(k))+'"><span class="n">'+n+'</span><span class="dots">'+(c.g?'<i class="g"></i>':'')+(c.b?'<i class="b"></i>':'')+(c.p?'<i class="p"></i>':'')+(c.r?'<i class="r"></i>':'')+'</span></button>';
  }
  var h='<header><h1>Calendario</h1><p class="sub">Hoy es '+fmtLong(today).toLowerCase()+'</p></header>';
  h+='<input class="search" id="q" type="text" placeholder="Buscar en tus entradas" value="'+esc(S.q)+'" autocomplete="off"><div id="qres">'+searchHTML()+'</div>';
  h+='<section class="card cal"><div class="cal-h"><span class="m">'+title+'</span><div style="display:flex;gap:2px"><button class="icon-btn" data-a="calPrev" aria-label="Mes anterior">'+I.left+'</button><button class="link" data-a="calToday">Hoy</button><button class="icon-btn" data-a="calNext" aria-label="Mes siguiente">'+I.right+'</button></div></div>'+
    '<div class="grid7">'+"LMXJVSD".split("").map(function(w){return '<div class="wd">'+w+'</div>'}).join("")+cells+'</div>'+
    '<div class="legend"><span><i class="dot good"></i>Bueno</span><span><i class="dot sport"></i>Deporte</span><span><i class="dot mind"></i>Mente o social</span><span><i class="dot bad"></i>Frustración</span></div></section>';
  var d=S.days[S.sel],x=dayXPk(S.sel),items=d?nd(d).items:[];
  var rows=items.map(function(i){return itemRow(i,true)}).join("");
  if(!rows)rows='<div class="row empty">'+(S.sel>today?"Día futuro.":"Nada apuntado este día.")+'</div>';
  var extra="";
  if(d){var dd=nd(d);if(dd.sleep)extra+=kv("Sueño",fmtH(dd.sleep.h));if(dd.steps!=null)extra+=kv("Pasos",fmtN(dd.steps,0));if(dd.mood)extra+=kv("Ánimo",MOODS[dd.mood-1]);if(dd.highlight.trim())extra+='<div class="row"><div class="main t" style="font-style:italic">“'+esc(dd.highlight)+'”</div></div>'}
  h+=sec(esc(fmtLong(S.sel)),grp(rows+extra+'<div class="row"><div class="main t" style="font-weight:600">Total del día</div><span class="x tnum '+(x>=0?"pos":"neg")+'">'+sign(x)+' XP</span></div>'));
  h+='<button class="btn" data-a="openDay">'+(S.sel>today?"Ver día":"Abrir y editar este día")+'</button>';
  return h;
}
function searchHTML(){
  var q=S.q.trim().toLowerCase();if(q.length<2)return "";
  var out=[],keys=Object.keys(S.days).sort().reverse();
  for(var i=0;i<keys.length&&out.length<30;i++){
    var k=keys[i],d=nd(S.days[k]);
    d.items.forEach(function(it){
      var txt=[itemMain(it).replace(/<[^>]+>/g,""),it.text,it.lesson,it.sport,it.other,it.mkind,it.who,it.cat,(it.tags||[]).join(" ")].join(" ").toLowerCase();
      if(txt.indexOf(q)>-1&&out.length<30)out.push({k:k,t:it.t,main:itemMain(it),det:itemDet(it)});
    });
    if(d.note.toLowerCase().indexOf(q)>-1)out.push({k:k,t:"note",main:esc(d.note.slice(0,90)),det:"Reflexión"});
    if(d.highlight.toLowerCase().indexOf(q)>-1)out.push({k:k,t:"note",main:esc(d.highlight),det:"Frase destacada"});
  }
  if(!out.length)return sec("Resultados",grp('<div class="row empty">Sin resultados.</div>'));
  return sec("Resultados",grp(out.map(function(o){return '<button class="row" data-a="gotoDay" data-v="'+o.k+'"><span class="dot '+(o.t==="note"?"social":o.t)+'"></span><div class="hit"><div class="t">'+o.main+'</div><div class="d">'+esc(fmtShort(o.k))+(o.det?" · "+o.det:"")+'</div></div></button>'}).join("")));
}

/* ---------- gráficas ---------- */
function barChart(arr,opt){
  opt=opt||{};var W=320,H=160,top=22,bot=32,ph=H-top-bot,out="";
  var pos=Math.max(opt.goal||0,Math.max.apply(null,arr.map(function(a){return Math.max(0,a.v)})));
  var neg=Math.max.apply(null,arr.map(function(a){return Math.max(0,-a.v)}));
  var range=(pos+neg)||1,zero=top+ph*pos/range,slot=W/arr.length,bw=Math.min(26,slot-8);
  out+='<line class="zero" x1="0" x2="'+W+'" y1="'+zero+'" y2="'+zero+'"/>';
  if(opt.goal)out+='<line class="goalline" x1="0" x2="'+W+'" y1="'+(zero-opt.goal/range*ph)+'" y2="'+(zero-opt.goal/range*ph)+'"/>';
  arr.forEach(function(a,i){
    var cx=slot*i+slot/2,h=a.v===0?0:Math.max(2,Math.abs(a.v)/range*ph);
    if(a.v!==0){
      var y=a.v>0?zero-h:zero,cls=a.v>0?(opt.cls||"pos"):"neg";
      out+='<rect class="'+cls+'" x="'+(cx-bw/2)+'" y="'+y+'" width="'+bw+'" height="'+h+'" rx="5"/>';
      out+='<text class="v" text-anchor="middle" x="'+cx+'" y="'+(a.v>0?zero-h-5:zero+h+12)+'">'+(opt.fmt?opt.fmt(a.v):Math.round(a.v))+'</text>';
    }
    out+='<text class="'+(a.k===today?"today":"")+'" text-anchor="middle" x="'+cx+'" y="'+(H-8)+'">'+a.l+'</text>';
  });
  return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(opt.label||"Gráfica")+'">'+out+'</svg>';
}
function last7(fn){var a=[];for(var i=6;i>=0;i--){var k=addDays(today,-i);a.push({k:k,v:fn(k),l:"LMXJVSD".charAt((parse(k).getDay()+6)%7)})}return a}
function lineChart(pts){
  var W=320,H=150,L=8,R=8,T=18,B=26,mn=Math.min.apply(null,pts.map(function(p){return p.v})),mx=Math.max.apply(null,pts.map(function(p){return p.v}));
  if(mx-mn<1){mn-=.5;mx+=.5}
  var d0=parse(pts[0].k).getTime(),d1=parse(pts[pts.length-1].k).getTime()||d0+1,span=(d1-d0)||1;
  var X=function(p){return L+(parse(p.k).getTime()-d0)/span*(W-L-R)},Y=function(v){return T+(1-(v-mn)/(mx-mn))*(H-T-B)};
  var path=pts.map(function(p,i){return (i?"L":"M")+X(p).toFixed(1)+" "+Y(p.v).toFixed(1)}).join(" ");
  var out='<path class="line" d="'+path+'"/>'+pts.map(function(p){return '<circle class="pt" cx="'+X(p).toFixed(1)+'" cy="'+Y(p.v).toFixed(1)+'" r="3"/>'}).join("");
  var a=pts[0],z=pts[pts.length-1];
  out+='<text class="v" x="'+L+'" y="'+(Y(a.v)-8)+'">'+fmtN(a.v)+'</text><text class="v" text-anchor="end" x="'+(W-R)+'" y="'+(Y(z.v)-8)+'">'+fmtN(z.v)+'</text>';
  out+='<text x="'+L+'" y="'+(H-6)+'">'+fmtShort(a.k)+'</text><text text-anchor="end" x="'+(W-R)+'" y="'+(H-6)+'">'+fmtShort(z.k)+'</text>';
  return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Evolución del peso">'+out+'</svg>';
}

/* ---------- resumen, cruces ---------- */
function periodKeys(mode){
  var i=+mode.charAt(1),out=[],label;
  if(mode.charAt(0)==="w"){var m=addDays(mondayOf(today),-7*i);for(var j=0;j<7;j++)out.push(addDays(m,j));label=i?"Semana pasada":"Esta semana"}
  else{var t=parse(today),f=new Date(t.getFullYear(),t.getMonth()-i,1),nn=new Date(f.getFullYear(),f.getMonth()+1,0).getDate();
    for(var q=1;q<=nn;q++)out.push(f.getFullYear()+"-"+pad(f.getMonth()+1)+"-"+pad(q));label=cap(f.toLocaleDateString("es-ES",{month:"long"}))}
  return {keys:out,label:label};
}
function summaryHTML(){
  var P=periodKeys(S.sumMode),xp=0,best=null,bx=-1e9,act=0,good=0,bad=0,sp=0,spMin=0,spMap={},sl=[],mo=[],st=[],spend=0,cats={},cc={},wt=[];
  P.keys.forEach(function(k){
    if(!S.days[k]||isEmptyDay(S.days[k]))return;var d=nd(S.days[k]),x=dayXPk(k);act++;xp+=x;if(x>bx){bx=x;best=k}
    d.items.forEach(function(it){
      if(it.t==="good")good++;else if(it.t==="bad")bad++;
      else if(it.t==="sport"){sp++;spMin+=it.min||0;var n=sportName(it);spMap[n]=(spMap[n]||0)+1}
      else if(it.t==="spend"){spend+=it.amt||0;cats[it.cat]=(cats[it.cat]||0)+(it.amt||0)}
    });
    if(d.sleep)sl.push(d.sleep.h);if(d.mood)mo.push(d.mood);if(d.steps!=null)st.push(d.steps);if(d.weight!=null)wt.push(d.weight);
    for(var c in d.counts)cc[c]=(cc[c]||0)+d.counts[c];
  });
  var avg=function(a){return a.reduce(function(x,y){return x+y},0)/a.length};
  var topSport=Object.keys(spMap).sort(function(a,b){return spMap[b]-spMap[a]})[0];
  var seg='<div class="seg sumseg" role="group">'+[["w0","Semana"],["w1","Anterior"],["m0","Mes"],["m1","Mes ant."]].map(function(o){return '<button data-a="sumMode" data-v="'+o[0]+'" class="'+(S.sumMode===o[0]?"on":"")+'">'+o[1]+'</button>'}).join("")+'</div>';
  var r='';
  if(!act)r='<div class="row empty">Sin datos en este periodo.</div>';
  else{
    r+=kv("XP del periodo",sign(xp)+" XP",xp>=0?"pos":"neg")+kv("Mejor día",esc(fmtShort(best))+" · "+sign(bx)+" XP")+kv("Días con registro",act)+kv("Cosas buenas",good)+kv("Frustraciones",bad)+
      kv("Deporte",sp+(sp===1?" sesión":" sesiones")+" · "+spMin+" min");
    if(topSport)r+=kv("Deporte más frecuente",esc(topSport));
    if(sl.length)r+=kv("Sueño medio",fmtH(avg(sl)));
    if(mo.length)r+=kv("Ánimo medio",fmtN(avg(mo))+" de 5");
    if(st.length)r+=kv("Pasos medios",fmtN(avg(st),0));
    if(wt.length>1)r+=kv("Peso",fmtN(wt[0])+" → "+fmtN(wt[wt.length-1])+" kg");
    S.counters.forEach(function(c){if(cc[c.id])r+=kv(esc(c.name),fmtN(cc[c.id])+(c.unit?" "+esc(c.unit):""))});
    if(spend)r+=kv("Gastos",fmtN(spend,2)+" €")+Object.keys(cats).map(function(c){return kv('<span style="color:var(--label2)">'+esc(c)+'</span>',fmtN(cats[c],2)+" €")}).join("");
  }
  return sec("Resumen · "+esc(P.label),seg+'<div style="height:8px"></div>'+grp(r));
}
function moodSplit(pred){
  var A=[],B=[];
  Object.keys(S.days).forEach(function(k){var d=nd(S.days[k]);if(!d.mood)return;var r=pred(d,k);if(r===null)return;(r?A:B).push(d.mood)});
  var av=function(a){return a.length?a.reduce(function(x,y){return x+y},0)/a.length:0};
  return {a:av(A),na:A.length,b:av(B),nb:B.length};
}
function insightsHTML(){
  var ac=alcCounter(),cases=[
    ["Con deporte · sin deporte",function(d){return d.items.some(function(i){return i.t==="sport"})}],
    ["Dormir "+fmtN(S.set.sleepGoal)+" h o más · menos",function(d){return d.sleep?d.sleep.h>=S.set.sleepGoal:null}],
    ["Con tiempo social · sin él",function(d){return d.items.some(function(i){return i.t==="social"})}],
    ["3 hábitos o más · menos",function(d){return habitCount(d)>=3}]
  ];
  if(ac)cases.push(["Con "+ac.name.toLowerCase()+" · sin",function(d){return (d.counts[ac.id]||0)>0}]);
  var rows=cases.map(function(c){
    var r=moodSplit(c[1]),ok=r.na>=3&&r.nb>=3;
    return '<div class="row"><div class="cmp"><div class="t">'+esc(c[0])+'</div><div class="d">'+(ok?'<b>'+fmtN(r.a)+'</b> · <b>'+fmtN(r.b)+'</b> de ánimo medio ('+r.na+' y '+r.nb+' días)':'Necesitas 3 días con ánimo de cada tipo ('+r.na+' y '+r.nb+')')+'</div></div></div>';
  }).join("");
  return sec("Qué influye en tu ánimo",grp(rows),"Ánimo medio de 1 a 5, comparando tus días según lo que hiciste.");
}

function viewProg(){
  var s=stats(),li=levelInfo(s.total),pct=li.rem/li.need*100;
  var h='<header><h1>Progreso</h1><p class="sub">Tu experiencia acumulada</p></header>';
  h+='<section class="card xp"><div class="xp-top"><div><div class="lvl">Nivel '+li.L+'</div><div class="rank">'+li.title+'</div></div><div class="rank tnum">'+s.total+' XP</div></div><div class="bar"><i style="width:'+pct+'%"></i></div><div class="xp-foot tnum"><span>'+li.rem+' / '+li.need+' XP</span><span>Siguiente: nivel '+(li.L+1)+'</span></div><div class="chips"><span class="chip fire tnum">Racha actual '+s.streak+'</span><span class="chip tnum">Mejor racha '+s.best+'</span></div></section>';
  // rangos
  var ranks=[["Deporte",s.cat.sport],["Mente",s.cat.mind],["Positividad",s.cat.good],["Hábitos",s.cat.habit],["Social",s.cat.social]];
  h+=sec("Rangos",'<div class="chips" style="padding:0 4px">'+ranks.map(function(r){var l=levelInfo(Math.max(0,r[1]));return '<span class="chip tnum">'+r[0]+' · nivel '+l.L+'</span>'}).join("")+'</div>');
  h+=summaryHTML();
  h+=sec("XP de los últimos 7 días",'<div class="card chart">'+barChart(last7(dayXPk),{label:"XP de los últimos 7 días"})+'</div>');
  var sleepArr=last7(function(k){var d=S.days[k];return d&&d.sleep?d.sleep.h:0});
  if(sleepArr.some(function(a){return a.v>0}))h+=sec("Sueño de los últimos 7 días",'<div class="card chart">'+barChart(sleepArr,{goal:S.set.sleepGoal,cls:"bar-blue",fmt:function(v){return fmtN(v)},label:"Horas dormidas"})+'</div>',"La línea naranja es tu objetivo.");
  var wp=[];Object.keys(S.days).sort().forEach(function(k){var d=S.days[k];if(d&&d.weight!=null)wp.push({k:k,v:d.weight})});
  if(wp.length>=2)h+=sec("Peso",'<div class="card chart">'+lineChart(wp.slice(-40))+'</div>');
  h+=insightsHTML();
  var cats=[["Cosas buenas",s.cat.good],["Deporte",s.cat.sport],["Mente",s.cat.mind],["Social",s.cat.social],["Hábitos",s.cat.habit],["Sueño",s.cat.sleep],["Pasos",s.cat.steps],["Contadores",s.cat.counter],["Reflexiones",s.cat.note],["Misiones",s.cat.missions],["Objetivos",s.cat.goals],["Frustraciones",s.cat.bad]];
  var mx=Math.max.apply(null,cats.map(function(c){return Math.abs(c[1])}))||1;
  h+=sec("De dónde viene tu XP",grp(cats.filter(function(c){return c[1]!==0}).map(function(c){
    return '<div class="row"><div class="split"><div style="display:flex;justify-content:space-between"><span>'+c[0]+'</span><span class="x tnum '+(c[1]<0?"neg":"pos")+'">'+sign(c[1])+'</span></div><div class="bar '+(c[1]<0?"neg":"pos")+'"><i style="width:'+(Math.abs(c[1])/mx*100)+'%"></i></div></div></div>';
  }).join("")||'<div class="row empty">Aún no hay XP.</div>'));
  // días sin
  var sinRows=S.counters.filter(function(c){return c.kind==="limite"&&(c.sin>0||c.limit===0)}).map(function(c){var n=daysSin(c);return kv("Días sin "+esc(c.name.toLowerCase()),n+(n===1?" día":" días"))}).join("");
  if(sinRows&&firstKey())h+=sec("Rachas sin",grp(sinRows));
  var sp=Object.keys(s.sports).sort(function(a,b){return s.sports[b].min-s.sports[a].min});
  h+=sec("Deporte",grp(sp.length?sp.map(function(n){var o=s.sports[n];return '<div class="row"><div class="main t">'+esc(n)+'</div><span class="d tnum">'+o.n+(o.n===1?" sesión":" sesiones")+' · '+o.min+' min</span></div>'}).join(""):'<div class="row empty">Aquí verás tus deportes cuando apuntes el primero.</div>'));
  return h;
}

function viewRet(){
  var s=stats(),got=0;
  var h='<header><h1>Retos</h1><p class="sub">Misiones, objetivos y logros</p></header>';
  h+=sec("Misiones de hoy",grp(missionRows(missionsFor("d",today))),"+"+DAY_M_XP+" XP cada una. Cambian cada día.");
  h+=sec("Misiones de la semana",grp(missionRows(missionsFor("w",today))),"+"+WEEK_M_XP+" XP cada una. Cambian cada lunes.");
  var gr=S.goals.map(function(g){
    var p=gProg(g),done=g.target>0&&p>=g.target;
    return '<div class="row"><div class="main"><div class="t">'+esc(g.name)+'</div><div class="d tnum">'+fmtN(p)+' / '+fmtN(g.target)+(g.unit?" "+esc(g.unit):"")+(done?" · +"+GOAL_XP+" XP":"")+'</div><div class="mini '+(done?"done":"")+'"><i style="width:'+Math.min(100,g.target?p/g.target*100:0)+'%"></i></div></div><button class="link" data-a="gprog" data-v="'+esc(g.id)+'">'+(done?"Editar":"Sumar")+'</button></div>';
  }).join("");
  if(!gr)gr='<div class="row empty">Un objetivo largo, como leer 12 libros o correr 100 km.</div>';
  gr+='<button class="row add" data-a="gnew">'+I.plus+'<span>Nuevo objetivo</span></button>';
  h+=sec("Objetivos",grp(gr),"Cada objetivo completado da +"+GOAL_XP+" XP.");
  var cards=ACH.map(function(a){
    var p=a.p(s),cur=Math.min(p[0],p[1]),ok=p[0]>=p[1];if(ok)got++;
    return '<div class="a'+(ok?" got":"")+'"><div class="badge">'+(ok?I.star:I.lock)+'</div><div class="n">'+a.n+'</div><div class="d">'+a.d+'</div><div class="bar"><i style="width:'+(cur/p[1]*100)+'%"></i></div><div class="p">'+(ok?"Conseguido":fmtN(cur,0)+" / "+fmtN(p[1],0))+'</div></div>';
  }).join("");
  h+='<section class="sec"><h2 class="sec-h">Logros · '+got+' de '+ACH.length+'</h2><div class="ach">'+cards+'</div></section>';
  return h;
}

function baseURL(){return location.origin&&location.origin!=="null"?location.origin+location.pathname:"https://TU_USUARIO.github.io/nivelia/"}
function viewSet(){
  var h='<header><h1>Ajustes</h1><p class="sub">Metas, contadores y conexiones</p></header>';
  h+=sec("Metas diarias",grp(
    '<label class="row" for="s-sleep"><span class="main t">Horas de sueño</span><input class="numin" id="s-sleep" data-set="sleepGoal" type="number" inputmode="decimal" step="0.5" min="3" max="12" value="'+S.set.sleepGoal+'"></label>'+
    '<label class="row" for="s-steps"><span class="main t">Pasos</span><input class="numin" id="s-steps" data-set="stepsGoal" type="number" inputmode="numeric" step="500" min="1000" value="'+S.set.stepsGoal+'"></label>'));
  var cr=S.counters.map(function(c){
    var sub=c.kind==="meta"?"Objetivo "+fmtN(c.goal)+(c.unit?" "+esc(c.unit):"")+" · +"+(c.bonus||10)+" XP":"Límite "+fmtN(c.limit)+(c.period==="week"?" a la semana":" al día")+" · −"+c.pen+" XP por cada uno de más"+(c.sin?" · +"+c.sin+" por día sin":"");
    return '<button class="row" data-a="cedit" data-v="'+esc(c.id)+'"><div class="main"><div class="t">'+esc(c.name)+(c.unit?' <span style="color:var(--label2)">('+esc(c.unit)+')</span>':'')+'</div><div class="d">'+sub+'</div></div><span style="color:var(--label3)">'+I.right+'</span></button>';
  }).join("");
  cr+='<button class="row add" data-a="cnew">'+I.plus+'<span>Añadir contador</span></button>';
  h+=sec("Contadores",grp(cr),"Para cosas que cuentas cada día, como copas, café o agua.");
  var ex=baseURL()+"?sueno=7.5&pasos=8200";
  h+=sec("Conectar con el reloj",grp(
    '<div class="copybox" id="exurl">'+esc(ex)+'</div>'+
    '<button class="row add" data-a="copyurl"><span>Copiar dirección de ejemplo</span></button>'+
    '<button class="row add" data-a="gpx"><span>Importar entrenamientos (GPX o TCX)</span></button>'),
    "Un atajo de tu móvil puede abrir esa dirección con tus datos de Salud y se apuntan solos. Los archivos GPX y TCX salen de las apps de Garmin, Strava y similares. La guía está en el README.");
  h+=sec("Copia de seguridad",grp('<button class="row add" data-a="export"><span>Exportar mis datos</span></button><button class="row add" data-a="import"><span>Importar una copia</span></button>'),"Tus datos se guardan solo en este dispositivo. Exporta una copia de vez en cuando por si cambias de móvil o borras los datos del navegador.");
  h+='<input id="importFile" type="file" accept="application/json,.json" hidden><input id="gpxFile" type="file" accept=".gpx,.tcx,.xml,application/gpx+xml,application/xml,text/xml" multiple hidden>';
  return h;
}

function render(){
  flushText();
  var a=document.activeElement;if(a&&a.blur&&$("#app").contains(a))a.blur();
  var h=S.tab==="day"?viewDay():S.tab==="cal"?viewCal():S.tab==="prog"?viewProg():S.tab==="ret"?viewRet():viewSet();
  var sy=window.scrollY;
  $("#app").innerHTML=h;
  if(!tabChanged)window.scrollTo(0,sy);tabChanged=false;
  Array.prototype.forEach.call(document.querySelectorAll("#tabs button"),function(b){if(b.getAttribute("data-v")===S.tab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
}

/* ================= hoja ================= */
function chipsF(field,opts,cur,cls){return '<div class="'+(cls||"sports")+'">'+opts.map(function(o){var v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return '<button type="button" data-a="fset" data-f="'+field+'" data-v="'+esc(v)+'" class="'+(cur===v?"on":"")+'">'+esc(l)+'</button>'}).join("")+'</div>'}
function segF(field,opts,cur){return '<div class="seg" role="group">'+opts.map(function(o){return '<button type="button" data-a="fset" data-f="'+field+'" data-v="'+o[0]+'" class="'+(cur===o[0]?"on":"")+'">'+o[1]+(o[2]?'<small>'+o[2]+'</small>':'')+'</button>'}).join("")+'</div>'}
function tagsF(cur){return '<div class="tagrow">'+TAGS.map(function(t){return '<button type="button" data-a="ftag" data-v="'+t+'" class="'+(cur.indexOf(t)>-1?"on":"")+'">'+t+'</button>'}).join("")+'</div>'}
function field(label,id,html){return '<div class="field">'+(id?'<label for="'+id+'">'+label+'</label>':'<div class="lab">'+label+'</div>')+html+'</div>'}
function inp(f,o){o=o||{};var v=F[f];if(v==null||(o.num&&v===0&&!o.zero))v="";return '<input id="f-'+f+'" data-f="'+f+'" '+(o.num?'data-num="1" type="number" inputmode="decimal" step="any"':'type="text"')+' '+(o.max?'maxlength="'+o.max+'"':'')+' placeholder="'+esc(o.ph||"")+'" value="'+esc(v)+'">'}

function entryItem(){
  var it={id:uid8(),t:F.type,ts:Date.now()};
  if(F.type==="sport"){it.sport=F.sport;it.other=F.sport==="Otro"?F.other.trim():"";it.min=Math.round(F.min);it.int=F.int;it.text=F.text.trim()}
  else if(F.type==="mind"){it.mkind=F.mkind;it.min=Math.round(F.min);it.text=F.text.trim()}
  else if(F.type==="social"){it.who=F.who;it.min=Math.round(F.min);it.text=F.text.trim()}
  else if(F.type==="spend"){it.cat=F.cat;it.amt=Math.round(F.amt*100)/100;it.text=F.text.trim()}
  else{it.text=F.text.trim();it.size=F.size;if(F.type==="bad")it.lesson=F.lesson.trim()}
  if(F.type!=="spend"&&F.tags.length)it.tags=F.tags.slice();
  return it;
}
function formValid(){
  if(!F)return false;
  if(F.sheet==="entry"){
    if(F.type==="sport")return F.min>=1&&F.min<=600&&(F.sport!=="Otro"||F.other.trim().length>0);
    if(F.type==="mind"||F.type==="social")return F.min>=1&&F.min<=600;
    if(F.type==="spend")return F.amt>0&&F.amt<100000;
    return F.text.trim().length>0;
  }
  if(F.sheet==="counter")return F.name.trim().length>0&&(F.kind==="meta"?F.goal>0:F.limit>=0&&F.pen>=0);
  if(F.sheet==="goal")return F.name.trim().length>0&&F.target>0;
  if(F.sheet==="gprog")return F.amt!==0&&!isNaN(F.amt);
  return false;
}
function sheetBody(){
  var b="";
  if(F.sheet==="entry"){
    b+=field("Tipo","",chipsF("type",[["good","Bueno"],["sport","Deporte"],["mind","Mente"],["social","Social"],["bad","Frustración"],["spend","Gasto"]],F.type));
    if(F.type==="sport"){
      b+=field("Deporte","",chipsF("sport",SPORTS,F.sport));
      if(F.sport==="Otro")b+=field("¿Cuál?","f-other",inp("other",{max:40,ph:"Escalada, tenis..."}));
      b+=field("Duración (minutos)","f-min",inp("min",{num:1}));
      b+=field("Intensidad","",segF("int",[["s","Suave"],["n","Normal"],["h","Intenso"]],F.int));
      b+=field("Detalle (opcional)","f-text",inp("text",{max:120,ph:"Partido, rutina de pierna..."}));
    }else if(F.type==="mind"){
      b+=field("Qué has hecho","",chipsF("mkind",MIND,F.mkind));
      b+=field("Duración (minutos)","f-min",inp("min",{num:1}));
      b+=field("Detalle (opcional)","f-text",inp("text",{max:120,ph:"Capítulo 3 del libro..."}));
    }else if(F.type==="social"){
      b+=field("Con quién","",chipsF("who",WHO,F.who));
      b+=field("Duración (minutos)","f-min",inp("min",{num:1}));
      b+=field("Detalle (opcional)","f-text",inp("text",{max:120,ph:"Cena, paseo, llamada..."}));
    }else if(F.type==="spend"){
      b+=field("Categoría","",chipsF("cat",CATS,F.cat));
      b+=field("Importe (€)","f-amt",inp("amt",{num:1,ph:"0,00"}));
      b+=field("Detalle (opcional)","f-text",inp("text",{max:120,ph:"Cine, comida..."}));
    }else{
      b+=field(F.type==="good"?"¿Qué has hecho bien?":"¿Qué te ha frustrado?","f-text",inp("text",{max:140,ph:F.type==="good"?"Terminé el informe antes de lo previsto":"Perdí la paciencia en la reunión"}));
      b+=field("Tamaño","",segF("size",F.type==="good"?[["s","Pequeño","+10"],["m","Medio","+25"],["l","Grande","+50"]]:[["s","Leve","−5"],["m","Medio","−15"],["l","Fuerte","−30"]],F.size));
      if(F.type==="bad")b+=field("¿Qué aprendes? (reduce la penalización a la mitad)","f-lesson",inp("lesson",{max:160,ph:"La próxima vez respiro antes de contestar"}));
    }
    if(F.type!=="spend")b+=field("Etiquetas (opcional)","",tagsF(F.tags));
    b+='<div class="field"><div class="lab">XP de esta entrada</div><div class="preview" id="f-prev"></div></div>';
  }else if(F.sheet==="counter"){
    if(!F.id)b+=field("Plantillas","",chipsF("preset",PRESETS.map(function(p,i){return [String(i),p.name]}),""));
    b+=field("Nombre","f-name",inp("name",{max:30,ph:"Cervezas, café, agua..."}));
    b+=field("Unidad (opcional)","f-unit",inp("unit",{max:12,ph:"h, vasos, raciones..."}));
    b+=field("Tipo","",segF("kind",[["limite","Límite","no pasarte"],["meta","Objetivo","llegar a"]],F.kind));
    if(F.kind==="meta"){
      b+='<div class="field-row">'+field("Objetivo al día","f-goal",inp("goal",{num:1}))+field("XP al cumplirlo","f-bonus",inp("bonus",{num:1}))+'</div>';
    }else{
      b+=field("Periodo del límite","",segF("period",[["day","Por día"],["week","Por semana"]],F.period));
      b+='<div class="field-row">'+field("Límite","f-limit",inp("limit",{num:1,zero:1}))+field("XP que resta cada uno de más","f-pen",inp("pen",{num:1,zero:1}))+'</div>';
      b+=field("XP por cada día sin usarlo (opcional)","f-sin",inp("sin",{num:1,zero:1}));
    }
    b+=field("Cuánto sube cada toque","f-step",inp("step",{num:1}));
    if(F.id)b+='<button class="danger-btn" data-a="cdelete">Eliminar contador</button>';
  }else if(F.sheet==="goal"){
    b+=field("Objetivo","f-name",inp("name",{max:60,ph:"Leer 12 libros"}));
    b+='<div class="field-row">'+field("Meta","f-target",inp("target",{num:1,ph:"12"}))+field("Unidad","f-unit",inp("unit",{max:14,ph:"libros, km..."}))+'</div>';
  }else if(F.sheet==="gprog"){
    var g=S.goals.filter(function(x){return x.id===F.id})[0];
    b+='<p class="sub">'+esc(g.name)+': '+fmtN(gProg(g))+' / '+fmtN(g.target)+(g.unit?' '+esc(g.unit):'')+'</p>';
    b+=field("Cantidad a sumar","f-amt",inp("amt",{num:1,ph:"1"}));
    b+='<p class="sec-f">Puedes usar un número negativo para corregir.</p><button class="danger-btn" data-a="gdelete">Eliminar objetivo</button>';
  }
  return b;
}
function sheetTitle(){
  if(F.sheet==="entry")return TYPE_TITLE[F.type];
  if(F.sheet==="counter")return F.id?"Contador":"Nuevo contador";
  if(F.sheet==="goal")return "Nuevo objetivo";
  return "Sumar progreso";
}
function drawSheet(){
  var old=$(".sheet"),st=old?old.scrollTop:0;
  $("#layer").innerHTML='<div class="scrim" data-a="scrim"><div class="sheet'+(F.anim?' anim':'')+'" role="dialog" aria-modal="true" aria-label="'+esc(sheetTitle())+'"><div class="sheet-h"><button data-a="closeSheet">Cancelar</button><b>'+esc(sheetTitle())+'</b><button class="go" id="f-go" data-a="saveSheet">Guardar</button></div>'+sheetBody()+'</div></div>';
  F.anim=false;var ns=$(".sheet");if(ns&&st)ns.scrollTop=st;updatePreview();
}
function updatePreview(){
  var g=$("#f-go");if(g)g.disabled=!formValid();
  var p=$("#f-prev");if(p&&F&&F.sheet==="entry"){
    if(F.type==="spend"){p.textContent="Sin XP";p.style.color="var(--label2)";return}
    var x=itemXP(entryItem());p.textContent=sign(x)+" XP";p.style.color=x>=0?"var(--green-t)":"var(--red-t)";
  }
}
function openSheet(kind,init){F=Object.assign({sheet:kind,anim:true},init||{});drawSheet()}
function openEntry(type){openSheet("entry",{type:type,text:"",size:"m",lesson:"",sport:"Fútbol",other:"",min:type==="sport"?45:30,int:"n",mkind:"Lectura",who:"Amigos",cat:"Ocio",amt:0,tags:[]})}
function closeSheet(){F=null;$("#layer").innerHTML=""}

/* ================= avisos ================= */
var toastTimer=null;
function toast(msg,undoable){
  var t=$("#toast");t.className="toast";t.hidden=false;
  t.innerHTML='<span>'+esc(msg)+'</span>'+(undoable?'<button data-a="undo">Deshacer</button>':'');
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.hidden=true},undoable?5000:2800);
}
function commit(fn,quiet){
  var b=totalXP(),bl=levelInfo(b).L;
  fn();persist();
  var a=totalXP(),al=levelInfo(a);
  render();
  if(quiet)return;
  if(al.L>bl)toast("Nivel "+al.L+" · "+al.title);
  else if(a!==b)toast(sign(a-b)+" XP");
}

/* ================= acciones ================= */
var textTimer=null,textDirty=false;
function flushText(){if(textDirty){clearTimeout(textTimer);textDirty=false;persist()}}
function stepVal(v,s,min){return Math.max(min,Math.round((v+s)*100)/100)}

function act(a,v,t){
  var k=S.sel;
  switch(a){
    case"tab":S.tab=v;S.editHabits=false;tabChanged=true;render();window.scrollTo(0,0);break;
    case"prevDay":S.sel=addDays(S.sel,-1);render();break;
    case"nextDay":S.sel=addDays(S.sel,1);render();break;
    case"today":today=dkey(new Date());S.sel=today;render();break;
    case"mood":commit(function(){var d=ensureDay(k);d.mood=d.mood===+v?null:+v},true);break;
    case"add":if(k<=today)openEntry(v);break;
    case"del":{
      var dd=ensureDay(k),i=dd.items.findIndex(function(x){return x.id===v});
      if(i>-1){var it=dd.items[i];undo={k:k,it:it,i:i};commit(function(){dd.items.splice(i,1)},true);toast("Entrada eliminada",true)}
      break}
    case"undo":if(undo){var u=ensureDay(undo.k),z=undo;commit(function(){u.items.splice(Math.min(z.i,u.items.length),0,z.it)},true);undo=null;$("#toast").hidden=true}break;
    case"habit":commit(function(){var d=ensureDay(k);if(d.habits[v])delete d.habits[v];else d.habits[v]=true});break;
    case"editHabits":S.editHabits=!S.editHabits;render();break;
    case"delHabit":S.habits=S.habits.filter(function(h){return h.id!==v});persist();render();break;
    case"cinc":case"cdec":{
      var c=S.counters.filter(function(x){return x.id===v})[0];if(!c)break;
      commit(function(){var d=ensureDay(k),n=stepVal(d.counts[v]||0,(a==="cinc"?1:-1)*(c.step||1),0);if(n>0)d.counts[v]=n;else delete d.counts[v]});break}
    case"sinc":case"sdec":commit(function(){
      var d=ensureDay(k);
      if(!d.sleep){if(a==="sdec")return;d.sleep={h:S.set.sleepGoal,q:null}}
      else{var h=Math.round((d.sleep.h+(a==="sinc"?.25:-.25))*100)/100;if(h<=0)d.sleep=null;else{d.sleep.h=Math.min(16,h);delete d.sleep.src}}
    });break;
    case"sq":commit(function(){var d=ensureDay(k);if(d.sleep)d.sleep.q=d.sleep.q===+v?null:+v},true);break;
    case"freeze":commit(function(){if(S.freezes[k])delete S.freezes[k];else S.freezes[k]=true},true);break;
    case"pick":S.sel=v;render();break;
    case"gotoDay":S.sel=v;S.tab="day";tabChanged=true;render();window.scrollTo(0,0);break;
    case"openDay":S.tab="day";tabChanged=true;render();window.scrollTo(0,0);break;
    case"calPrev":S.cal.m--;if(S.cal.m<0){S.cal.m=11;S.cal.y--}render();break;
    case"calNext":S.cal.m++;if(S.cal.m>11){S.cal.m=0;S.cal.y++}render();break;
    case"calToday":{var n=new Date();today=dkey(n);S.cal={y:n.getFullYear(),m:n.getMonth()};S.sel=today;render();break}
    case"sumMode":S.sumMode=v;render();break;
    case"gnew":openSheet("goal",{name:"",target:0,unit:""});break;
    case"gprog":openSheet("gprog",{id:v,amt:0});break;
    case"cnew":openSheet("counter",{id:null,name:"",unit:"",kind:"limite",limit:2,period:"day",pen:2,sin:0,goal:8,bonus:10,step:1});break;
    case"cedit":{var cc=S.counters.filter(function(x){return x.id===v})[0];if(cc)openSheet("counter",Object.assign({id:cc.id,name:"",unit:"",kind:"limite",limit:0,period:"day",pen:2,sin:0,goal:0,bonus:10,step:1},cc));break}
    case"fset":{
      var f=t.getAttribute("data-f");
      if(f==="preset"){var p=PRESETS[+v];Object.assign(F,{name:p.name,unit:p.unit,kind:p.kind,limit:p.limit||0,period:p.period||"day",pen:p.pen||2,sin:p.sin||0,goal:p.goal||0,bonus:p.bonus||10,step:p.step})}
      else F[f]=v;
      if(f==="type"&&(v==="sport"||v==="mind"||v==="social"))F.min=F.min||30;
      drawSheet();break}
    case"ftag":{var ix=F.tags.indexOf(v);if(ix>-1)F.tags.splice(ix,1);else F.tags.push(v);drawSheet();break}
    case"closeSheet":closeSheet();break;
    case"saveSheet":saveSheet();break;
    case"cdelete":{var id=F.id;S.counters=S.counters.filter(function(x){return x.id!==id});persist();closeSheet();render();break}
    case"gdelete":{var gid=F.id;S.goals=S.goals.filter(function(x){return x.id!==gid});persist();closeSheet();render();break}
    case"export":doExport();break;
    case"import":{var fi=$("#importFile");if(fi)fi.click();break}
    case"gpx":{var gf=$("#gpxFile");if(gf)gf.click();break}
    case"copyurl":copyText(baseURL()+"?sueno=7.5&pasos=8200");break;
  }
}
function copyText(txt){
  var done=function(){toast("Dirección copiada")};
  try{navigator.clipboard.writeText(txt).then(done,function(){toast("Mantén pulsado el texto para copiarlo")})}catch(e){toast("Mantén pulsado el texto para copiarlo")}
}
function saveSheet(){
  if(!formValid())return;
  if(F.sheet==="entry"){
    var k=S.sel,it=entryItem();commit(function(){ensureDay(k).items.push(it)});closeSheet();return;
  }
  if(F.sheet==="counter"){
    var c={id:F.id||"c-"+uid8(),name:F.name.trim(),unit:(F.unit||"").trim(),kind:F.kind,step:F.step>0?F.step:1};
    if(F.kind==="meta"){c.goal=F.goal;c.bonus=F.bonus>=0?F.bonus:10}
    else{c.limit=F.limit;c.period=F.period;c.pen=F.pen;c.sin=F.sin>0?F.sin:0}
    var ix=S.counters.findIndex(function(x){return x.id===c.id});
    commit(function(){if(ix>-1)S.counters[ix]=c;else S.counters.push(c)},true);closeSheet();return;
  }
  if(F.sheet==="goal"){
    commit(function(){S.goals.push({id:"g-"+uid8(),name:F.name.trim(),target:F.target,unit:(F.unit||"").trim(),log:[],created:today})});closeSheet();return;
  }
  if(F.sheet==="gprog"){
    var g=S.goals.filter(function(x){return x.id===F.id})[0],amt=F.amt;
    var was=gProg(g)>=g.target;
    commit(function(){g.log=g.log||[];g.log.push({d:today,a:amt})},true);
    if(!was&&gProg(g)>=g.target)toast("Objetivo cumplido · +"+GOAL_XP+" XP");else toast("Progreso guardado");
    closeSheet();
  }
}

/* ---------- copia de seguridad ---------- */
function doExport(){
  try{
    var blob=new Blob([JSON.stringify({app:"nivelia",version:2,exportado:today,habitos:S.habits,contadores:S.counters,objetivos:S.goals,comodines:S.freezes,ajustes:S.set,dias:S.days},null,2)],{type:"application/json"});
    var url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="nivelia-"+today+".json";document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},4000);toast("Copia exportada");
  }catch(e){toast("No se pudo exportar")}
}
function doImport(file){
  var r=new FileReader();
  r.onload=function(){
    try{
      var j=JSON.parse(r.result);if(!j||typeof j.dias!=="object")throw 0;
      Object.keys(j.dias).forEach(function(k){if(isKey(k))S.days[k]=nd(j.dias[k])});
      if(j.habitos&&j.habitos.length)S.habits=j.habitos;
      if(j.contadores&&j.contadores.length)S.counters=j.contadores;
      if(j.objetivos)S.goals=j.objetivos;
      if(j.comodines)S.freezes=j.comodines;
      if(j.ajustes)S.set=Object.assign(S.set,j.ajustes);
      persist();render();toast("Copia importada");
    }catch(e){toast("Ese archivo no es una copia válida")}
  };
  r.readAsText(file);
}

/* ---------- entrenamientos GPX / TCX ---------- */
function mapSport(s){
  s=(s||"").toLowerCase();
  if(/run|corr|carrera|trail/.test(s))return {sport:"Correr"};
  if(/walk|hik|andar|camin|sender/.test(s))return {sport:"Caminar"};
  if(/bik|cycl|bici|cicl/.test(s))return {sport:"Ciclismo"};
  if(/swim|nada|natac/.test(s))return {sport:"Natación"};
  if(/foot|soccer|f[uú]tbol/.test(s))return {sport:"Fútbol"};
  if(/gym|strength|fuerza|pesas|gimnas|weight/.test(s))return {sport:"Gimnasio"};
  if(/yoga/.test(s))return {sport:"Yoga"};
  if(/p[aá]del|padel/.test(s))return {sport:"Pádel"};
  return {sport:"Otro",other:s&&s!=="other"&&s!=="other_sport"?s.replace(/_/g," "):""};
}
function haversine(a,b,c,d){var R=6371,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);return 2*R*Math.asin(Math.sqrt(h))}
function parseWorkout(text,name){
  var doc=new DOMParser().parseFromString(text,"application/xml");
  if(doc.getElementsByTagName("parsererror").length)return null;
  var root=doc.documentElement.localName.toLowerCase(),start=null,mins=0,km=0,type="";
  if(root==="gpx"){
    var tr=doc.getElementsByTagName("trk")[0];if(!tr)return null;
    var te=tr.getElementsByTagName("type")[0],ne=tr.getElementsByTagName("name")[0];type=(te&&te.textContent)||(ne&&ne.textContent)||"";
    var pts=tr.getElementsByTagName("trkpt"),t0=null,t1=null,prev=null;
    for(var i=0;i<pts.length;i++){
      var tm=pts[i].getElementsByTagName("time")[0],la=parseFloat(pts[i].getAttribute("lat")),lo=parseFloat(pts[i].getAttribute("lon"));
      if(tm){var ms=Date.parse(tm.textContent);if(!isNaN(ms)){if(t0===null)t0=ms;t1=ms}}
      if(prev&&!isNaN(la)&&!isNaN(lo))km+=haversine(prev[0],prev[1],la,lo);
      if(!isNaN(la)&&!isNaN(lo))prev=[la,lo];
    }
    if(t0===null)return null;start=new Date(t0);mins=Math.round((t1-t0)/60000);
  }else if(root==="trainingcenterdatabase"){
    var ac=doc.getElementsByTagName("Activity")[0];if(!ac)return null;
    type=ac.getAttribute("Sport")||"";var id=ac.getElementsByTagName("Id")[0];if(!id)return null;
    var ms2=Date.parse(id.textContent);if(isNaN(ms2))return null;start=new Date(ms2);
    var secs=0,laps=ac.getElementsByTagName("Lap");
    for(var j=0;j<laps.length;j++){var ts=laps[j].getElementsByTagName("TotalTimeSeconds")[0],ds=laps[j].getElementsByTagName("DistanceMeters")[0];if(ts)secs+=parseFloat(ts.textContent)||0;if(ds)km+=(parseFloat(ds.textContent)||0)/1000}
    mins=Math.round(secs/60);
  }else return null;
  if(mins<1)return null;
  var m=mapSport(type);
  return {k:dkey(start),sport:m.sport,other:m.other||"",min:mins,text:km>0.05?fmtN(km,1)+" km":"",ext:"file-"+start.toISOString()};
}
function addWorkout(w){
  var d=ensureDay(w.k);
  var dup=d.items.some(function(i){return i.t==="sport"&&(i.ext&&i.ext===w.ext||i.sport===w.sport&&Math.abs((i.min||0)-w.min)<=1)});
  if(dup)return false;
  d.items.push({id:uid8(),t:"sport",sport:w.sport,other:w.other,min:w.min,int:w.int||"n",text:w.text||"",ext:w.ext,ts:Date.now()});
  return true;
}
function importWorkouts(files){
  var list=Array.prototype.slice.call(files),added=0,dups=0,bad=0,pending=list.length;
  if(!pending)return;
  list.forEach(function(f){
    var r=new FileReader();
    r.onload=function(){
      var w=null;try{w=parseWorkout(r.result,f.name)}catch(e){}
      if(!w)bad++;else if(addWorkout(w))added++;else dups++;
      if(--pending===0){persist();render();toast(added+(added===1?" entrenamiento importado":" entrenamientos importados")+(dups?" · "+dups+" repetidos":"")+(bad?" · "+bad+" no válidos":""))}
    };
    r.onerror=function(){bad++;if(--pending===0){persist();render();toast("No se pudieron leer los archivos")}};
    r.readAsText(f);
  });
}

/* ---------- datos desde atajos (URL) ---------- */
function num(v){if(v==null)return null;var n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:null}
function parseHours(v){
  if(v==null)return null;v=String(v).trim();var m=v.match(/^(\d{1,2}):(\d{2})$/);
  if(m)return +m[1]+(+m[2])/60;return num(v);
}
function handleURL(){
  var q;try{q=new URLSearchParams(location.search)}catch(e){return}
  var keys=[];q.forEach(function(v,k){keys.push(k)});
  var known=["sueno","calidad","pasos","peso","cintura","deporte","min","intensidad","detalle","fecha","ext","agua"];
  if(!keys.some(function(k){return known.indexOf(k)>-1}))return;
  var k=isKey(q.get("fecha"))?q.get("fecha"):today,changed=[],d;
  if(k>today)k=today;
  var h=parseHours(q.get("sueno"));
  if(h!=null&&h>0&&h<=16){d=ensureDay(k);d.sleep={h:Math.round(h*100)/100,q:[1,2,3].indexOf(+q.get("calidad"))>-1?+q.get("calidad"):(d.sleep&&d.sleep.q)||null,src:"reloj"};changed.push("sueño")}
  var st=num(q.get("pasos"));if(st!=null&&st>=0&&st<200000){ensureDay(k).steps=Math.round(st);changed.push("pasos")}
  var pe=num(q.get("peso"));if(pe!=null&&pe>20&&pe<400){ensureDay(k).weight=Math.round(pe*10)/10;changed.push("peso")}
  var ci=num(q.get("cintura"));if(ci!=null&&ci>30&&ci<250){ensureDay(k).waist=Math.round(ci*10)/10;changed.push("cintura")}
  var ag=num(q.get("agua"));var wc=waterCounter();if(ag!=null&&ag>=0&&wc){var dd=ensureDay(k);if(ag>0)dd.counts[wc.id]=ag;else delete dd.counts[wc.id];changed.push("agua")}
  var dep=q.get("deporte"),mn=num(q.get("min"));
  if(dep){
    if(mn&&mn>=1&&mn<=900){
      var m=mapSport(dep),it={k:k,sport:m.sport,other:m.other||"",min:Math.round(mn),int:["s","n","h"].indexOf(q.get("intensidad"))>-1?q.get("intensidad"):"n",text:(q.get("detalle")||"").slice(0,120),ext:q.get("ext")?"url-"+q.get("ext"):null};
      changed.push(addWorkout(it)?"deporte":"deporte (ya estaba)");
    }else changed.push("deporte sin duración");
  }
  if(changed.length){persist();setTimeout(function(){render();toast("Apuntado desde el móvil: "+changed.join(", "))},0)}
  try{history.replaceState(null,"",location.pathname)}catch(e){}
}

/* ================= eventos ================= */
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-a]");if(!t)return;
  if(t.getAttribute("data-a")==="scrim"){if(e.target!==t)return;closeSheet();return}
  if(t.disabled)return;
  act(t.getAttribute("data-a"),t.getAttribute("data-v"),t);
});
document.addEventListener("input",function(e){
  var t=e.target;
  if(F&&t.getAttribute("data-f")){
    var f=t.getAttribute("data-f");
    if(t.getAttribute("data-num")){var n=parseFloat(String(t.value).replace(",","."));F[f]=isFinite(n)?n:0}else F[f]=t.value;
    updatePreview();return;
  }
  if(t.id==="note"||t.id==="hl"){
    var d=ensureDay(S.sel);if(t.id==="note")d.note=t.value;else d.highlight=t.value;
    textDirty=true;clearTimeout(textTimer);textTimer=setTimeout(function(){flushText();refreshXpCard()},500);return;
  }
  if(t.id==="q"){S.q=t.value;var r=$("#qres");if(r)r.innerHTML=searchHTML()}
});
document.addEventListener("change",function(e){
  var t=e.target;
  if(t.getAttribute("data-s")){
    var f=t.getAttribute("data-s"),v=t.value===""?null:parseFloat(String(t.value).replace(",","."));
    if(v!=null&&!isFinite(v))v=null;if(v!=null&&v<0)v=0;
    var d=ensureDay(S.sel);d[f]=f==="steps"&&v!=null?Math.round(v):v;persist();refreshXpCard();return;
  }
  if(t.getAttribute("data-set")){
    var key=t.getAttribute("data-set"),n=parseFloat(String(t.value).replace(",","."));
    if(isFinite(n)&&n>0){S.set[key]=n;persist()}else t.value=S.set[key];return;
  }
  if(t.id==="importFile"&&t.files[0]){doImport(t.files[0]);t.value="";return}
  if(t.id==="gpxFile"&&t.files.length){importWorkouts(t.files);t.value=""}
});
document.addEventListener("submit",function(e){
  if(!e.target.closest("[data-form='habit']"))return;e.preventDefault();
  var i=$("#newHabit"),name=i.value.trim();if(!name)return;
  S.habits.push({id:"h"+uid8(),name:name});persist();render();var n=$("#newHabit");if(n)n.focus();
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&F)closeSheet()});
document.addEventListener("visibilitychange",function(){
  if(document.hidden){flushText();return}
  var t=dkey(new Date());if(t!==today){var was=S.sel===today;today=t;if(was)S.sel=t;render()}
});

/* ================= arranque ================= */
loadCache();
render();
handleURL();
if("serviceWorker" in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})})}
})();
