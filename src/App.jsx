import { useState, useEffect, useMemo } from "react";
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, LineChart, BarChart, Bar } from "recharts";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SB_URL = "https://ttvkmboqksmvpwqjrvcq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0dmttYm9xa3NtdnB3cWpydmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDQ0MTcsImV4cCI6MjA5MTc4MDQxN30.fBb94ggs_H-9tBapdJ4JaCtXka2FdegLgmZ2QBiGVEY";
const sbH = { "Content-Type":"application/json", "apikey":SB_KEY, "Authorization":`Bearer ${SB_KEY}` };
async function sbGet(t){try{const r=await fetch(`${SB_URL}/rest/v1/${t}?select=*&order=date.asc`,{headers:sbH});return r.ok?await r.json():null;}catch{return null;}}
async function sbUpsert(t,d){try{const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:"POST",headers:{...sbH,"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(d)});return r.ok;}catch{return false;}}
async function sbDelete(t,date){try{const r=await fetch(`${SB_URL}/rest/v1/${t}?date=eq.${date}`,{method:"DELETE",headers:sbH});return r.ok;}catch{return false;}}

// ─── Seeds ────────────────────────────────────────────────────────────────────
const SEED_ENTRIES=[
  {date:"2026-02-09",weight:208.0},{date:"2026-02-10",weight:208.4},{date:"2026-02-11",weight:207.0},
  {date:"2026-02-12",weight:205.8},{date:"2026-02-13",weight:205.4},{date:"2026-02-15",weight:206.0},
  {date:"2026-02-16",weight:207.0},{date:"2026-02-17",weight:206.6},{date:"2026-02-18",weight:205.0},
  {date:"2026-02-20",weight:205.0},{date:"2026-02-21",weight:206.0},{date:"2026-02-23",weight:206.0},
  {date:"2026-02-24",weight:206.0},{date:"2026-02-25",weight:204.6},{date:"2026-02-26",weight:203.2},
  {date:"2026-02-27",weight:204.6},{date:"2026-02-28",weight:204.6},{date:"2026-03-01",weight:204.6},
  {date:"2026-03-02",weight:203.8},{date:"2026-03-03",weight:203.8},{date:"2026-03-04",weight:205.0},
  {date:"2026-03-05",weight:201.6},{date:"2026-03-06",weight:202.2},{date:"2026-03-09",weight:204.8},
  {date:"2026-03-11",weight:203.8},{date:"2026-03-12",weight:203.8},{date:"2026-03-14",weight:203.8},
  {date:"2026-03-15",weight:203.4},{date:"2026-03-16",weight:203.0},{date:"2026-03-17",weight:203.6},
  {date:"2026-03-18",weight:204.6},{date:"2026-03-19",weight:203.6},{date:"2026-03-20",weight:201.2},
  {date:"2026-03-21",weight:203.0},{date:"2026-03-23",weight:203.8},{date:"2026-03-24",weight:203.6},
  {date:"2026-03-25",weight:202.4},{date:"2026-03-26",weight:201.8},{date:"2026-03-27",weight:202.0},
  {date:"2026-03-28",weight:201.8},{date:"2026-03-31",weight:202.4},{date:"2026-04-01",weight:203.0},
  {date:"2026-04-03",weight:202.4},{date:"2026-04-05",weight:202.4},{date:"2026-04-06",weight:202.0},
  {date:"2026-04-08",weight:202.0},{date:"2026-04-09",weight:202.2},{date:"2026-04-10",weight:203.4},
  {date:"2026-04-12",weight:201.2},{date:"2026-04-13",weight:201.4},
];
const SEED_DOSES=[
  {date:"2026-02-09",mg:2.5},{date:"2026-02-16",mg:2.5},{date:"2026-02-23",mg:2.5},
  {date:"2026-03-02",mg:2.5},{date:"2026-03-09",mg:3.0},{date:"2026-03-16",mg:3.25},
  {date:"2026-03-23",mg:3.5},{date:"2026-03-30",mg:5.0},{date:"2026-04-06",mg:5.0},
  {date:"2026-04-13",mg:5.5},
];

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const LS_START="2026-04-14";
const C={bg:"#161b27",card:"#1e253a",card2:"#252d42",border:"#2e3650",border2:"#3a4460",
  text:"#e8edf5",muted:"#8892a4",dim:"#4a5568",accent:"#6366f1",accentL:"#818cf8",
  green:"#34d399",red:"#f87171",yellow:"#fbbf24",inj:"#f59e0b"};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function fmtShort(s){const[,m,d]=s.split("-");return`${parseInt(m)}/${parseInt(d)}`;}
function fmtMon(s){const[y,m]=s.split("-");return["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]+` '${y.slice(2)}`;}
function fmtFull(s){const[y,m,d]=s.split("-");const mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return`${mo[parseInt(m)-1]} ${parseInt(d)}, ${y}`;}
function getWeekKey(ds){const d=new Date(ds+"T12:00:00"),day=d.getDay(),mon=new Date(d);mon.setDate(d.getDate()-day+(day===0?-6:1));return mon.toISOString().split("T")[0];}
function getMonthKey(ds){return ds.slice(0,7);}
function dow(ds){return new Date(ds+"T12:00:00").getDay();}
function addDays(ds,n){const d=new Date(ds+"T12:00:00");d.setDate(d.getDate()+n);return d.toISOString().split("T")[0];}
function diffDays(a,b){return Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/86400000);}
function sleepHrs(bed,wake){
  if(!bed||!wake)return null;
  const[bh,bm]=bed.split(":").map(Number),[wh,wm]=wake.split(":").map(Number);
  let m=(wh*60+wm)-(bh*60+bm);if(m<0)m+=1440;return Math.round(m/6)/10;
}
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;}
function linReg(arr){
  const n=arr.length;if(n<3)return null;
  const ys=arr.map(e=>e.weight),sumX=(n*(n-1))/2,sumY=ys.reduce((a,b)=>a+b,0);
  const sumXY=ys.reduce((s,y,i)=>s+i*y,0),sumXX=(n*(n-1)*(2*n-1))/6;
  const den=n*sumXX-sumX*sumX;if(!den)return null;
  const slope=(n*sumXY-sumX*sumY)/den,intercept=(sumY-slope*sumX)/n;
  const yM=sumY/n,ssTot=ys.reduce((s,y)=>s+(y-yM)**2,0);
  const ssRes=ys.reduce((s,y,i)=>s+(y-(slope*i+intercept))**2,0);
  return{slope,intercept,r2:ssTot===0?0:Math.max(0,1-ssRes/ssTot)};
}
function rollingAvg(sorted,w=7){
  return sorted.map((_,i,a)=>{const sl=a.slice(Math.max(0,i-w+1),i+1);return parseFloat((sl.reduce((s,e)=>s+e.weight,0)/sl.length).toFixed(2));});
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(entries,doses,lf){
  const dbd=Object.fromEntries((doses||[]).map(d=>[d.date,d.mg]));
  const hdr=["date","weight","dose_mg","drank","red_meat","delivery","meals","bed_time","wake_time","night_wake","rosacea","sleep_hrs"];
  const rows=entries.map(e=>{const l=lf[e.date]||{},hrs=sleepHrs(l.bed_time,l.wake_time);
    return[e.date,e.weight,dbd[e.date]??"",l.drank??"",l.red_meat??"",l.delivery??"",l.meals??"",l.bed_time??"",l.wake_time??"",l.night_wake??"",l.rosacea??"",hrs??""].join(",");});
  const csv=[hdr.join(","),...rows].join("\n");
  const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=`wait-tracker-${todayStr()}.csv`;a.click();
}

// ─── Insights Engine (~50) ────────────────────────────────────────────────────
function buildInsights(sorted,lf,doses){
  if(!sorted.length)return[];
  const ins=[];
  const MIN=2; // minimum data points to show an insight

  // helper: get next-day weight delta when condition met on prev day (lifestyle days only)
  function ndd(condFn){
    const d=[];
    sorted.forEach((e,i)=>{
      if(i===0)return;
      const prev=sorted[i-1];
      if(prev.date<LS_START)return;
      const l=lf[prev.date]||{};
      if(condFn(l))d.push(e.weight-prev.weight);
    });
    return d;
  }

  // helper: lifestyle entries only
  const lfEntries=sorted.filter(e=>e.date>=LS_START).map(e=>({...e,...(lf[e.date]||{})}));
  const lfDelta=sorted.filter((e,i)=>i>0&&sorted[i-1].date>=LS_START).map((e,_,arr)=>{
    const idx=sorted.indexOf(e);
    return{...e,delta:e.weight-sorted[idx-1].weight,...(lf[sorted[idx-1].date]||{})};
  });

  // ── WEIGHT PATTERNS (no lifestyle needed) ──────────────────────────────────

  // 1. Best day of week
  const byDow=Array.from({length:7},()=>[]);
  sorted.forEach((e,i)=>{if(i>0)byDow[dow(e.date)].push(e.weight-sorted[i-1].weight);});
  const dowA=byDow.map((a,i)=>a.length>=MIN?{dow:i,a:avg(a),n:a.length}:null).filter(Boolean);
  if(dowA.length>=3){
    const s=[...dowA].sort((a,b)=>a.a-b.a);
    ins.push({e:"📅",t:"Best weigh-in day",tag:"patterns",txt:`${DAYS[s[0].dow]}s are your best day — avg ${Math.abs(s[0].a).toFixed(2)} lbs down vs the day before (${s[0].n} data points).`});
    ins.push({e:"😬",t:"Toughest weigh-in day",tag:"patterns",txt:`${DAYS[s[s.length-1].dow]}s are your toughest — avg ${s[s.length-1].a>0?"+":""}${s[s.length-1].a.toFixed(2)} lbs.`});
  }

  // 3. Longest losing streak
  let cur=1,maxS=0,mStart="",mEnd="";
  sorted.forEach((e,i)=>{if(i===0)return;if(e.weight<sorted[i-1].weight){cur++;if(cur>maxS){maxS=cur;mEnd=e.date;mStart=sorted[i-cur+1].date;}}else cur=1;});
  if(maxS>=3)ins.push({e:"🔥",t:"Longest losing streak",tag:"records",txt:`Your best run was ${maxS} consecutive days down, from ${fmtFull(mStart)} to ${fmtFull(mEnd)}.`});

  // 4. Biggest single-day drop & gain
  let bigL=null,bigG=null;
  sorted.forEach((e,i)=>{if(i===0)return;const d=e.weight-sorted[i-1].weight;if(!bigL||d<bigL.d)bigL={d,date:e.date};if(!bigG||d>bigG.d)bigG={d,date:e.date};});
  if(bigL)ins.push({e:"🏆",t:"Biggest single-day drop",tag:"records",txt:`Best day: ${fmtFull(bigL.date)} — down ${Math.abs(bigL.d).toFixed(1)} lbs in 24 hours.`});
  if(bigG&&bigG.d>0)ins.push({e:"📈",t:"Biggest single-day spike",tag:"records",txt:`Biggest gain: ${fmtFull(bigG.date)} — up ${bigG.d.toFixed(1)} lbs overnight. Probably sodium.`});

  // 5. Weekday vs weekend
  const wdD=[],weD=[];
  sorted.forEach((e,i)=>{if(i===0)return;const d=e.weight-sorted[i-1].weight,dw=dow(e.date);if(dw===0||dw===6)weD.push(d);else wdD.push(d);});
  if(wdD.length>=MIN&&weD.length>=MIN){
    const wdA=avg(wdD),weA=avg(weD);
    ins.push({e:"📆",t:"Weekdays vs. weekends",tag:"patterns",txt:wdA<weA?`You trend ${Math.abs(wdA-weA).toFixed(2)} lbs better on weekdays. Structure helps.`:`Weekends work better for you — ${Math.abs(weA-wdA).toFixed(2)} lbs more per day than weekdays.`});
  }

  // 6. Overall pace
  if(sorted.length>=10){
    const first=sorted[0],last=sorted[sorted.length-1],days=diffDays(first.date,last.date),lost=first.weight-last.weight;
    if(lost>0)ins.push({e:"🎯",t:"Pace check",tag:"progress",txt:`${lost.toFixed(1)} lbs lost in ${days} days — ${(lost/(days/30)).toFixed(1)} lbs/month on average.`});
  }

  // 7. Plateau or momentum
  const l14=sorted.slice(-14);
  if(l14.length>=7){
    const ws=l14.map(e=>e.weight),range=Math.max(...ws)-Math.min(...ws),delta=ws[ws.length-1]-ws[0];
    if(range<1.5)ins.push({e:"🏔️",t:"Plateau alert",tag:"patterns",txt:`Weight within ${range.toFixed(1)} lbs over last ${l14.length} entries. Normal on GLP-1s — usually breaks soon.`});
    else ins.push({e:"📉",t:"Recent momentum",tag:"progress",txt:`Over your last ${l14.length} weigh-ins you're ${delta<0?"down":"up"} ${Math.abs(delta).toFixed(1)} lbs total.`});
  }

  // 8. Best month
  const byMonth={};
  sorted.forEach((e,i)=>{if(i===0)return;const mk=getMonthKey(e.date);if(!byMonth[mk])byMonth[mk]=[];byMonth[mk].push(e.weight-sorted[i-1].weight);});
  const monthAvgs=Object.entries(byMonth).map(([k,v])=>({k,a:avg(v),n:v.length})).filter(m=>m.n>=5);
  if(monthAvgs.length>=2){
    const best=[...monthAvgs].sort((a,b)=>a.a-b.a)[0];
    const mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const[y,m]=best.k.split("-");
    ins.push({e:"🗓️",t:"Best month",tag:"progress",txt:`${mo[parseInt(m)-1]} ${y} was your best month — avg ${Math.abs(best.a).toFixed(2)} lbs/day down.`});
  }

  // 9. Logging consistency
  if(sorted.length>=10){
    const span=diffDays(sorted[0].date,sorted[sorted.length-1].date)+1;
    const rate=Math.round((sorted.length/span)*100);
    ins.push({e:"📓",t:"Logging consistency",tag:"lifestyle",txt:`${sorted.length} weigh-ins over ${span} days — ${rate}% of days. ${rate>=80?"Great consistency.":rate>=50?"Decent — more data = better insights.":"More logging would sharpen your predictions."}`});
  }

  // 10. First 30 days vs most recent 30 days
  if(sorted.length>=20){
    const first30=sorted.slice(0,Math.min(30,Math.floor(sorted.length/2)));
    const last30=sorted.slice(-Math.min(30,Math.floor(sorted.length/2)));
    const r1=linReg(first30),r2=linReg(last30);
    if(r1&&r2){
      const early=Math.abs(r1.slope*7),recent=Math.abs(r2.slope*7);
      ins.push({e:"⚡",t:"Early vs recent pace",tag:"progress",txt:recent>early?`You're actually losing faster now (${recent.toFixed(2)} lbs/wk) than your first 30 days (${early.toFixed(2)} lbs/wk). Zepbound compounding.`:`Early on you lost ${early.toFixed(2)} lbs/wk vs ${recent.toFixed(2)} lbs/wk recently. Common as body adjusts.`});
    }
  }

  // ── INJECTION INSIGHTS ─────────────────────────────────────────────────────
  if(doses&&doses.length>=2){
    const injDates=new Set(doses.map(d=>d.date));

    // 11. Day before injection
    const dayBefore=[];
    sorted.forEach((e,i)=>{if(i===0)return;if(injDates.has(addDays(e.date,1)))dayBefore.push(e.weight-sorted[i-1].weight);});
    if(dayBefore.length>=MIN){const a=avg(dayBefore);ins.push({e:"💉",t:"Day before injection",tag:"medication",txt:`The day before your shot you average ${a<0?`${Math.abs(a).toFixed(2)} lbs down`:`+${a.toFixed(2)} lbs`}. ${a<0?"Good momentum going in.":"Might be worth watching sodium the day before."}`});}

    // 12. Day after injection
    const dayAfter=[];
    sorted.forEach((e,i)=>{if(i===0)return;if(injDates.has(addDays(e.date,-1)))dayAfter.push(e.weight-sorted[i-1].weight);});
    if(dayAfter.length>=MIN){const a=avg(dayAfter);ins.push({e:"📍",t:"Day after injection",tag:"medication",txt:`Morning after your shot you average ${a<0?`${Math.abs(a).toFixed(2)} lbs down`:`+${a.toFixed(2)} lbs`}. ${a<0?"Fast response.":"Day-after gains often reverse within 2–3 days."}`});}

    // 13. 2 days after injection
    const two=[];
    sorted.forEach((e,i)=>{if(i===0)return;if(injDates.has(addDays(e.date,-2)))two.push(e.weight-sorted[i-1].weight);});
    if(two.length>=MIN){const a=avg(two);ins.push({e:"📆",t:"2 days after injection",tag:"medication",txt:`Two days post-shot you average ${a<0?`${Math.abs(a).toFixed(2)} lbs down`:`+${a.toFixed(2)} lbs`}.`});}

    // 14. Best escalation
    const sortedDoses=[...doses].sort((a,b)=>a.date.localeCompare(b.date));
    let bestImp=null;
    sortedDoses.forEach((dose,i)=>{
      if(i===0)return;const prev=sortedDoses[i-1];if(dose.mg<=prev.mg)return;
      const before=sorted.filter(e=>e.date>=addDays(dose.date,-14)&&e.date<dose.date);
      const after=sorted.filter(e=>e.date>dose.date&&e.date<=addDays(dose.date,14));
      if(before.length>=3&&after.length>=3){
        const rb=linReg(before),ra=linReg(after);
        if(rb&&ra){const imp=(ra.slope-rb.slope)*7;if(!bestImp||Math.abs(imp)>Math.abs(bestImp.imp))bestImp={imp,from:prev.mg,to:dose.mg,date:dose.date};}
      }
    });
    if(bestImp)ins.push({e:"⬆️",t:"Best dose escalation",tag:"medication",txt:bestImp.imp<0?`Your ${bestImp.from}→${bestImp.to}mg bump on ${fmtFull(bestImp.date)} accelerated loss by ~${Math.abs(bestImp.imp).toFixed(2)} lbs/week.`:`Your ${bestImp.from}→${bestImp.to}mg change on ${fmtFull(bestImp.date)} was followed by a slower week — normal adjustment period.`});

    // 15. Injection day itself
    const injDay=[];
    sorted.forEach((e,i)=>{if(i===0)return;if(injDates.has(e.date))injDay.push(e.weight-sorted[i-1].weight);});
    if(injDay.length>=MIN){const a=avg(injDay);ins.push({e:"🩺",t:"Injection day weight",tag:"medication",txt:`On injection days themselves you average ${a<0?`${Math.abs(a).toFixed(2)} lbs down`:`+${a.toFixed(2)} lbs`} from the day before.`});}

    // 16. Week after escalation vs week before
    if(sortedDoses.length>=3){
      const escalations=sortedDoses.filter((d,i)=>i>0&&d.mg>sortedDoses[i-1].mg);
      const weekBefores=[],weekAfters=[];
      escalations.forEach(dose=>{
        sorted.filter(e=>e.date>=addDays(dose.date,-7)&&e.date<dose.date).forEach((e,i,a)=>{if(i>0)weekBefores.push(e.weight-a[i-1].weight);});
        sorted.filter(e=>e.date>dose.date&&e.date<=addDays(dose.date,7)).forEach((e,i,a)=>{if(i>0)weekAfters.push(e.weight-a[i-1].weight);});
      });
      if(weekBefores.length>=MIN&&weekAfters.length>=MIN){
        const bA=avg(weekBefores),aA=avg(weekAfters);
        ins.push({e:"📊",t:"Escalation week effect",tag:"medication",txt:aA<bA?`The week after a dose increase you lose ${Math.abs(aA-bA).toFixed(2)} lbs/day more than the week before. Escalations are working.`:`The week after escalation is slightly slower than the week before — the adjustment period is real.`});
      }
    }
  }

  // ── LIFESTYLE HABITS ──────────────────────────────────────────────────────

  // 17. Alcohol & weight
  const drankD=ndd(l=>l.drank===true),soberD=ndd(l=>l.drank===false&&l.drank!==undefined);
  if(drankD.length>=MIN&&soberD.length>=MIN){
    const diff=avg(drankD)-avg(soberD);
    ins.push({e:"🍺",t:"Alcohol & next-day weight",tag:"habits",txt:diff>0?`After drinking, you weigh ${diff.toFixed(2)} lbs more the next morning vs sober nights.`:`Surprisingly, after drinking you're ${Math.abs(diff).toFixed(2)} lbs lighter the next morning on average.`});
  }

  // 18. Delivery & weight
  const delivD=ndd(l=>l.delivery===true),noDelD=ndd(l=>l.delivery===false&&l.delivery!==undefined);
  if(delivD.length>=MIN&&noDelD.length>=MIN){
    const diff=avg(delivD)-avg(noDelD);
    ins.push({e:"🛵",t:"Food delivery & next-day weight",tag:"habits",txt:diff>0?`After ordering delivery, you average +${diff.toFixed(2)} lbs vs cooking at home.`:`After delivery, you're actually ${Math.abs(diff).toFixed(2)} lbs lighter vs home-cooked days.`});
  }

  // 19. Red meat & weight
  const meatD=ndd(l=>l.red_meat===true),noMeatD=ndd(l=>l.red_meat===false&&l.red_meat!==undefined);
  if(meatD.length>=MIN&&noMeatD.length>=MIN){
    const diff=avg(meatD)-avg(noMeatD);
    ins.push({e:"🥩",t:"Red meat & next-day weight",tag:"habits",txt:diff>0?`After red meat, you weigh ${diff.toFixed(2)} lbs more the next morning.`:`Red meat days are followed by lighter mornings — ${Math.abs(diff).toFixed(2)} lbs down on average.`});
  }

  // 20. Drinking frequency
  const lfV=sorted.filter(e=>e.date>=LS_START).map(e=>lf[e.date]).filter(Boolean);
  if(lfV.length>=5){
    const dn=lfV.filter(l=>l.drank).length;
    ins.push({e:"🥃",t:"Drinking frequency",tag:"lifestyle",txt:`You've drank on ${Math.round(dn/lfV.length*100)}% of logged nights since Apr 14 — ${dn} out of ${lfV.length} entries.`});
  }

  // 21. Delivery frequency
  if(lfV.length>=5){
    const dn=lfV.filter(l=>l.delivery).length;
    ins.push({e:"📦",t:"Delivery frequency",tag:"lifestyle",txt:`You've ordered delivery on ${Math.round(dn/lfV.length*100)}% of logged days — ${dn} out of ${lfV.length} entries.`});
  }

  // 22. Red meat frequency
  if(lfV.length>=5){
    const dn=lfV.filter(l=>l.red_meat).length;
    ins.push({e:"🍖",t:"Red meat frequency",tag:"lifestyle",txt:`You've eaten red meat on ${Math.round(dn/lfV.length*100)}% of logged days — ${dn} out of ${lfV.length}.`});
  }

  // 23. Meals eaten correlation
  const mealCorr=[];
  sorted.forEach((e,i)=>{if(i===0)return;const prev=sorted[i-1];if(prev.date<LS_START)return;const l=lf[prev.date];if(!l||l.meals==null||isNaN(parseInt(l.meals)))return;mealCorr.push({meals:parseInt(l.meals),delta:e.weight-prev.weight});});
  if(mealCorr.length>=5){
    const byM={};mealCorr.forEach(({meals,delta})=>{if(!byM[meals])byM[meals]=[];byM[meals].push(delta);});
    const keys=Object.keys(byM).map(Number).filter(m=>byM[m].length>=MIN).sort();
    if(keys.length>=2){
      const best=keys.map(m=>({m,a:avg(byM[m])})).sort((a,b)=>a.a-b.a)[0];
      ins.push({e:"🍽️",t:"Optimal meal count",tag:"habits",txt:`Best next-day results come after ${best.m} meal${best.m>1?"s":""} — avg ${Math.abs(best.a).toFixed(2)} lbs ${best.a<0?"down":"up"}.`});
    }
  }

  // 24. Alcohol + delivery combo
  const bothD=ndd(l=>l.drank&&l.delivery),neitherD=ndd(l=>!l.drank&&!l.delivery&&l.drank!==undefined&&l.delivery!==undefined);
  if(bothD.length>=MIN&&neitherD.length>=MIN){
    const diff=avg(bothD)-avg(neitherD);
    ins.push({e:"🍺🛵",t:"Drinking + delivery combo",tag:"habits",txt:diff>0?`When you drink AND get delivery, you're ${diff.toFixed(2)} lbs heavier the next morning vs neither.`:`Even on nights with both drinking and delivery, your next-day weight impact is minimal. Interesting.`});
  }

  // 25. Alcohol on weekends vs weekdays
  const alkWknd=ndd(l=>l.drank&&(dow(l.date||"")||0)>=5);
  const alkWkdy=ndd(l=>l.drank&&(dow(l.date||"")||0)<5&&(dow(l.date||"")||0)>0);
  if(alkWknd.length>=MIN&&alkWkdy.length>=MIN){
    const diff=avg(alkWknd)-avg(alkWkdy);
    if(Math.abs(diff)>0.1)ins.push({e:"🍻",t:"Weekend vs weekday drinking",tag:"habits",txt:diff>0?`Weekend drinking hits harder — ${diff.toFixed(2)} lbs more next-morning impact than weekday drinking.`:`Weekday drinking actually affects your weight more (+${Math.abs(diff).toFixed(2)} lbs) than weekend drinking.`});
  }

  // ── SLEEP INSIGHTS ────────────────────────────────────────────────────────

  const sleepData=[];
  sorted.forEach((e,i)=>{
    if(i===0)return;const prev=sorted[i-1];if(prev.date<LS_START)return;
    const l=lf[prev.date]||{};const hrs=sleepHrs(l.bed_time,l.wake_time);
    if(hrs!==null)sleepData.push({hrs,delta:e.weight-prev.weight,nightWake:l.night_wake,rosacea:e.rosacea});
  });

  // 26. Sleep hours & weight
  if(sleepData.length>=5){
    const good=sleepData.filter(s=>s.hrs>=7),poor=sleepData.filter(s=>s.hrs<7);
    if(good.length>=MIN&&poor.length>=MIN){
      const diff=avg(good.map(s=>s.delta))-avg(poor.map(s=>s.delta));
      ins.push({e:"😴",t:"Sleep & weight loss",tag:"sleep",txt:diff<0?`7+ hour nights lead to ${Math.abs(diff).toFixed(2)} lbs more loss the next day vs short nights. Sleep is a cheat code.`:`Short sleep nights don't seem to hurt your weight much yet. Worth watching.`});
    }
  }

  // 27. Night wake-ups & weight
  if(sleepData.length>=5){
    const wake=sleepData.filter(s=>s.nightWake===true),noWake=sleepData.filter(s=>s.nightWake===false);
    if(wake.length>=MIN&&noWake.length>=MIN){
      const diff=avg(wake.map(s=>s.delta))-avg(noWake.map(s=>s.delta));
      ins.push({e:"🌙",t:"Night wake-ups & weight",tag:"sleep",txt:diff>0?`When you wake mid-sleep, you're ${diff.toFixed(2)} lbs heavier the next morning vs uninterrupted nights.`:`Night wake-ups don't seem to impact your next-day weight much.`});
    }
  }

  // 28. Average sleep duration
  if(sleepData.length>=5){
    const hrs=sleepData.map(s=>s.hrs);const avgH=avg(hrs);
    ins.push({e:"⏰",t:"Average sleep duration",tag:"sleep",txt:`Your average sleep is ${avgH.toFixed(1)} hours based on ${sleepData.length} logged nights. ${avgH>=7.5?"Solid.":avgH>=6.5?"Close to target.":"Below the 7-8hr sweet spot."}`});
  }

  // 29. Best bedtime window
  if(sleepData.length>=6){
    const early=sleepData.filter(s=>{const l=sorted.find(e=>e.date===addDays(s.date||"",0));return l&&(lf[addDays(l.date,-1)]||{}).bed_time<"23:00";}),
          late=sleepData.filter(s=>{const l=sorted.find(e=>e.date===addDays(s.date||"",0));return l&&(lf[addDays(l.date,-1)]||{}).bed_time>="23:00";});
    // simpler: use bedtime from sleepData directly via lf lookup on prev day
    const earlyB=[],lateB=[];
    sorted.forEach((e,i)=>{if(i===0)return;const prev=sorted[i-1];if(prev.date<LS_START)return;const l=lf[prev.date]||{};if(!l.bed_time)return;const delta=e.weight-prev.weight;if(l.bed_time<"23:00")earlyB.push(delta);else lateB.push(delta);});
    if(earlyB.length>=MIN&&lateB.length>=MIN){
      const diff=avg(earlyB)-avg(lateB);
      ins.push({e:"🛌",t:"Early vs late bedtime",tag:"sleep",txt:diff<0?`Going to bed before 11pm leads to ${Math.abs(diff).toFixed(2)} lbs more loss the next day vs later nights.`:`Late nights don't seem to hurt your weight loss much.`});
    }
  }

  // ── ROSACEA INSIGHTS ──────────────────────────────────────────────────────

  const rosEntries=lfEntries.filter(e=>e.rosacea>0);

  // 30. Rosacea baseline
  if(rosEntries.length>=3){
    const a=avg(rosEntries.map(e=>e.rosacea));
    ins.push({e:"🌹",t:"Rosacea baseline",tag:"rosacea",txt:`Your average rosacea score is ${a.toFixed(1)}/10 across ${rosEntries.length} days. ${a<=3?"Mostly clear days 🌿":a<=6?"Moderate — keep tracking triggers.":"Frequently elevated — patterns should emerge soon."}`});
  }

  // 31. Alcohol & rosacea
  if(rosEntries.length>=MIN){
    const wD=rosEntries.filter(e=>e.drank),nD=rosEntries.filter(e=>e.drank===false&&e.drank!==undefined);
    if(wD.length>=MIN&&nD.length>=MIN){
      const diff=avg(wD.map(e=>e.rosacea))-avg(nD.map(e=>e.rosacea));
      ins.push({e:"🍷",t:"Alcohol & rosacea",tag:"rosacea",txt:diff>0?`After drinking, your rosacea scores ${diff.toFixed(1)} pts higher on average vs sober nights.`:`Alcohol doesn't seem to worsen your rosacea yet based on current data.`});
    }
  }

  // 32. Red meat & rosacea
  if(rosEntries.length>=MIN){
    const wM=rosEntries.filter(e=>e.red_meat),nM=rosEntries.filter(e=>e.red_meat===false&&e.red_meat!==undefined);
    if(wM.length>=MIN&&nM.length>=MIN){
      const diff=avg(wM.map(e=>e.rosacea))-avg(nM.map(e=>e.rosacea));
      ins.push({e:"🥩",t:"Red meat & rosacea",tag:"rosacea",txt:diff>0?`Red meat days score ${diff.toFixed(1)} pts higher on rosacea vs non-meat days.`:`Red meat doesn't appear to worsen your rosacea based on current data.`});
    }
  }

  // 33. Delivery & rosacea
  if(rosEntries.length>=MIN){
    const wDel=rosEntries.filter(e=>e.delivery),nDel=rosEntries.filter(e=>e.delivery===false&&e.delivery!==undefined);
    if(wDel.length>=MIN&&nDel.length>=MIN){
      const diff=avg(wDel.map(e=>e.rosacea))-avg(nDel.map(e=>e.rosacea));
      ins.push({e:"🛵",t:"Delivery food & rosacea",tag:"rosacea",txt:diff>0?`After delivery food, your rosacea scores ${diff.toFixed(1)} pts higher on average.`:`Delivery food doesn't seem to trigger your rosacea.`});
    }
  }

  // 34. Sleep & rosacea
  if(rosEntries.length>=MIN&&sleepData.length>=MIN){
    const goodSleep=[],badSleep=[];
    sorted.forEach((e,i)=>{if(i===0)return;const prev=sorted[i-1];if(prev.date<LS_START)return;const l=lf[prev.date]||{},hrs=sleepHrs(l.bed_time,l.wake_time),ros=(lf[e.date]||{}).rosacea;if(hrs===null||!ros)return;if(hrs>=7)goodSleep.push(ros);else badSleep.push(ros);});
    if(goodSleep.length>=MIN&&badSleep.length>=MIN){
      const diff=avg(badSleep)-avg(goodSleep);
      ins.push({e:"💤",t:"Sleep & rosacea",tag:"rosacea",txt:diff>0?`Poor sleep (<7hrs) is followed by rosacea scores ${diff.toFixed(1)} pts higher than good sleep nights.`:`Sleep duration doesn't seem to strongly affect your rosacea yet.`});
    }
  }

  // 35. Rosacea & weight correlation
  if(rosEntries.length>=MIN){
    const highRos=lfDelta.filter(e=>((lf[e.date]||{}).rosacea||0)>=6);
    const lowRos=lfDelta.filter(e=>{const r=(lf[e.date]||{}).rosacea;return r&&r<4;});
    if(highRos.length>=MIN&&lowRos.length>=MIN){
      const diff=avg(highRos.map(e=>e.delta))-avg(lowRos.map(e=>e.delta));
      if(Math.abs(diff)>0.1)ins.push({e:"🔴",t:"Rosacea & weight connection",tag:"rosacea",txt:diff>0?`High rosacea days correlate with +${diff.toFixed(2)} lbs the next morning vs low rosacea days. Inflammation connection?`:`Surprisingly, high rosacea days don't seem to affect your weight.`});
    }
  }

  // 36. Rosacea trend
  if(rosEntries.length>=7){
    const first=rosEntries.slice(0,Math.floor(rosEntries.length/2)),last=rosEntries.slice(-Math.floor(rosEntries.length/2));
    const diff=avg(last.map(e=>e.rosacea))-avg(first.map(e=>e.rosacea));
    ins.push({e:"📈",t:"Rosacea trend",tag:"rosacea",txt:diff<0?`Your rosacea is improving — scores ${Math.abs(diff).toFixed(1)} pts lower recently vs when you started tracking.`:`Rosacea scores are slightly higher recently (${diff.toFixed(1)} pts). Keep tracking triggers.`});
  }

  // 37. Best rosacea days by day of week
  if(rosEntries.length>=7){
    const byDow=Array.from({length:7},()=>[]);
    rosEntries.forEach(e=>byDow[dow(e.date)].push(e.rosacea));
    const avgs=byDow.map((a,i)=>a.length>=MIN?{dow:i,a:avg(a)}:null).filter(Boolean);
    if(avgs.length>=3){
      const best=[...avgs].sort((a,b)=>a.a-b.a)[0];
      ins.push({e:"✨",t:"Clearest skin day",tag:"rosacea",txt:`${DAYS[best.dow]}s are your clearest skin days on average (${best.a.toFixed(1)}/10).`});
    }
  }

  // 38. Injection & rosacea
  if(doses&&rosEntries.length>=MIN){
    const injDates=new Set(doses.map(d=>d.date));
    const afterInj=[],notAfter=[];
    rosEntries.forEach(e=>{if(injDates.has(addDays(e.date,-1)))afterInj.push(e.rosacea);else notAfter.push(e.rosacea);});
    if(afterInj.length>=MIN&&notAfter.length>=MIN){
      const diff=avg(afterInj)-avg(notAfter);
      ins.push({e:"💉",t:"Injection & rosacea",tag:"rosacea",txt:diff>0?`Day after your shot, rosacea scores ${diff.toFixed(1)} pts higher on average. Possible inflammatory response.`:`Injection days don't seem to affect your rosacea.`});
    }
  }

  // ── COMBINED / CROSS SIGNALS ──────────────────────────────────────────────

  // 39. Triple bad day (drink + delivery + red meat)
  const tripleBad=ndd(l=>l.drank&&l.delivery&&l.red_meat);
  const tripleGood=ndd(l=>!l.drank&&!l.delivery&&!l.red_meat&&l.drank!==undefined);
  if(tripleBad.length>=MIN&&tripleGood.length>=MIN){
    const diff=avg(tripleBad)-avg(tripleGood);
    ins.push({e:"🚨",t:"Triple threat days",tag:"habits",txt:diff>0?`When you drink, get delivery AND eat red meat, you're ${diff.toFixed(2)} lbs heavier the next morning vs clean days.`:`Even on your most indulgent days (drink + delivery + red meat), the weight impact is surprisingly minimal.`});
  }

  // 40. Best overall combo for weight loss
  if(lfDelta.length>=5){
    const cleanD=lfDelta.filter(e=>!e.drank&&!e.delivery&&!e.red_meat&&e.drank!==undefined);
    if(cleanD.length>=MIN){
      const a=avg(cleanD.map(e=>e.delta));
      ins.push({e:"🥗",t:"Clean day effect",tag:"habits",txt:a<0?`On days after no drinking, no delivery, and no red meat, you average ${Math.abs(a).toFixed(2)} lbs down. Clean days work.`:`Even on clean days your weight movement is mixed — other factors are in play.`});
    }
  }

  // 41. Weight momentum (3-day streaks)
  let downStreak=0,downDays=0,totalDown=0;
  sorted.forEach((e,i)=>{if(i===0)return;if(e.weight<sorted[i-1].weight){downStreak++;if(downStreak>=3){downDays++;totalDown+=e.weight-sorted[i-1].weight;}}else downStreak=0;});
  if(downDays>=2)ins.push({e:"🎯",t:"Momentum days",tag:"patterns",txt:`You've had ${downDays} days that were part of a 3+ day losing streak. Momentum is real — protect it.`});

  // 42. Weight variability
  if(sorted.length>=14){
    const deltas=sorted.slice(1).map((e,i)=>Math.abs(e.weight-sorted[i].weight));
    const avgVar=avg(deltas);
    ins.push({e:"📊",t:"Daily weight variability",tag:"patterns",txt:`Your average day-to-day weight swing is ${avgVar.toFixed(2)} lbs. ${avgVar<0.5?"Very consistent — low noise in your data.":avgVar<1?"Normal variability.":"High variability — water weight fluctuates a lot for you."}`});
  }

  // 43. Morning weight trend (are you a slow starter?)
  if(sorted.length>=14){
    const firstHalf=sorted.slice(0,7),secondHalf=sorted.slice(-7);
    const fAvg=avg(firstHalf.map(e=>e.weight)),sAvg=avg(secondHalf.map(e=>e.weight));
    const weekDrop=fAvg-sAvg;
    ins.push({e:"🌅",t:"Recent 7-day drop",tag:"progress",txt:`Your average weight dropped ${weekDrop.toFixed(1)} lbs from your first 7 entries to your most recent 7. ${weekDrop>2?"Strong progress.":weekDrop>0?"Steady progress.":"Holding steady."}`});
  }

  // 44. Alcohol + sleep interaction
  if(sleepData.length>=5){
    const drankPoorSleep=[],drankGoodSleep=[];
    sorted.forEach((e,i)=>{if(i===0)return;const prev=sorted[i-1];if(prev.date<LS_START)return;const l=lf[prev.date]||{},hrs=sleepHrs(l.bed_time,l.wake_time),delta=e.weight-prev.weight;if(hrs===null)return;if(l.drank&&hrs<7)drankPoorSleep.push(delta);if(l.drank&&hrs>=7)drankGoodSleep.push(delta);});
    if(drankPoorSleep.length>=MIN&&drankGoodSleep.length>=MIN){
      const diff=avg(drankPoorSleep)-avg(drankGoodSleep);
      ins.push({e:"🍺😴",t:"Drinking + poor sleep combo",tag:"habits",txt:diff>0?`Drinking AND sleeping less than 7hrs leads to ${diff.toFixed(2)} lbs more gain vs drinking with good sleep. Sleep buffers drinking impact.`:`Interestingly, sleep quality doesn't seem to change alcohol's weight impact much for you.`});
    }
  }

  // 45. Dose size & weight loss rate
  if(doses&&doses.length>=3){
    const doseGroups={};
    doses.forEach(d=>{
      const after=sorted.filter(e=>e.date>d.date&&e.date<=addDays(d.date,6));
      if(after.length>=2){const reg=linReg(after);if(reg)doseGroups[d.mg]=(doseGroups[d.mg]||[]).concat([Math.abs(reg.slope*7)]);}
    });
    const keys=Object.keys(doseGroups).map(Number).sort((a,b)=>a-b);
    if(keys.length>=2){
      const rates=keys.map(k=>({mg:k,rate:avg(doseGroups[k])}));
      const best=rates.sort((a,b)=>b.rate-a.rate)[0];
      ins.push({e:"💊",t:"Most effective dose",tag:"medication",txt:`Your ${best.mg}mg dose produced the fastest weekly loss rate (~${best.rate.toFixed(2)} lbs/wk in the 7 days after injection).`});
    }
  }

  // 46. Consecutive logging
  let curLog=1,maxLog=0;
  sorted.forEach((e,i)=>{if(i===0)return;if(diffDays(sorted[i-1].date,e.date)===1){curLog++;maxLog=Math.max(maxLog,curLog);}else curLog=1;});
  if(maxLog>=5)ins.push({e:"🗓️",t:"Best logging streak",tag:"lifestyle",txt:`Your longest consecutive daily logging streak is ${maxLog} days. Consistency like that = better predictions.`});

  // 47. Weight loss acceleration
  if(sorted.length>=20){
    const mid=Math.floor(sorted.length/2);
    const r1=linReg(sorted.slice(0,mid)),r2=linReg(sorted.slice(mid));
    if(r1&&r2){
      const early=r1.slope*7,recent=r2.slope*7;
      if(Math.abs(early-recent)>0.1)ins.push({e:"🚀",t:"Acceleration check",tag:"progress",txt:recent<early?`Your weight loss is accelerating — recent pace (${Math.abs(recent).toFixed(2)} lbs/wk) is faster than your early pace (${Math.abs(early).toFixed(2)} lbs/wk).`:`Pace has slowed from ${Math.abs(early).toFixed(2)} to ${Math.abs(recent).toFixed(2)} lbs/wk. Normal as you approach goal weight.`});
    }
  }

  // 48. Days since last injection
  if(doses&&doses.length>0){
    const lastInj=[...doses].sort((a,b)=>b.date.localeCompare(a.date))[0];
    const daysSince=diffDays(lastInj.date,todayStr());
    ins.push({e:"⏱️",t:"Days since last injection",tag:"medication",txt:`It's been ${daysSince} day${daysSince!==1?"s":""} since your last ${lastInj.mg}mg dose on ${fmtFull(lastInj.date)}.`});
  }

  // 49. Rosacea + weight same day correlation
  if(rosEntries.length>=5){
    const highRosDays=rosEntries.filter(e=>e.rosacea>=6);
    const lowRosDays=rosEntries.filter(e=>e.rosacea<=3);
    if(highRosDays.length>=MIN&&lowRosDays.length>=MIN){
      const hW=avg(highRosDays.map(e=>e.weight)),lW=avg(lowRosDays.map(e=>e.weight));
      if(Math.abs(hW-lW)>0.2)ins.push({e:"🔗",t:"Weight & rosacea same-day link",tag:"rosacea",txt:hW>lW?`On high rosacea days, you tend to weigh ${(hW-lW).toFixed(1)} lbs more than on clear days. Inflammation and water retention may be connected.`:`Interestingly, high rosacea days don't correspond to higher weights.`});
    }
  }

  // 50. Overall health score (fun summary)
  if(sorted.length>=10){
    const reg=linReg(sorted);
    const wkly=reg?Math.abs(reg.slope*7):0;
    const score=wkly>=1.5?"🟢 Excellent":wkly>=0.75?"🟡 Good":wkly>=0.25?"🟠 Steady":"🔴 Slow";
    ins.push({e:"📋",t:"Journey summary",tag:"progress",txt:`${fmtFull(sorted[0].date)} → today: ${(sorted[0].weight-sorted[sorted.length-1].weight).toFixed(1)} lbs lost, ${diffDays(sorted[0].date,todayStr())} days in, ${wkly.toFixed(2)} lbs/wk pace. Status: ${score}`});
  }

  return ins;
}

function getDailyInsights(all){
  if(!all.length)return[];
  const seed=todayStr().split("-").reduce((a,b)=>a*31+parseInt(b),0);
  const arr=[...all];
  for(let i=arr.length-1;i>0;i--){const j=(seed*(i+7))%arr.length;[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr.slice(0,Math.min(5,arr.length));
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const Tip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 14px",fontSize:13}}>
    <div style={{color:C.muted,marginBottom:5,fontSize:12}}>{label}</div>
    {payload.map((p,i)=>p.value!=null&&(<div key={i} style={{color:p.color||C.text,fontWeight:600,marginTop:2}}>{p.name}: {typeof p.value==="number"?p.value.toFixed(1):p.value}</div>))}
  </div>);
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[entries,setEntries]=useState(null);
  const[doses,setDoses]=useState(null);
  const[lf,setLf]=useState({});
  const[tab,setTab]=useState("chart");
  const[chartView,setChartView]=useState("all");
  const[doseExpanded,setDoseExpanded]=useState(false);
  const[syncing,setSyncing]=useState(false);
  const[dt,setDt]=useState(todayStr());
  const[wt,setWt]=useState("");
  const[doseInp,setDoseInp]=useState("");
  const[drank,setDrank]=useState(false);
  const[redMeat,setRedMeat]=useState(false);
  const[delivery,setDelivery]=useState(false);
  const[meals,setMeals]=useState("");
  const[bedTime,setBedTime]=useState("");
  const[wakeTime,setWakeTime]=useState("");
  const[nightWake,setNightWake]=useState(false);
  const[rosacea,setRosacea]=useState(0);
  const[msg,setMsg]=useState("");

  useEffect(()=>{
    (async()=>{
      setSyncing(true);
      let e=await sbGet("entries"),d=await sbGet("doses"),l=await sbGet("lifestyle");
      if(e&&e.length===0){await sbUpsert("entries",SEED_ENTRIES);e=await sbGet("entries");}
      if(d&&d.length===0){await sbUpsert("doses",SEED_DOSES);d=await sbGet("doses");}
      if(e)setEntries(e);
      if(d)setDoses(d);
      if(l){const map={};l.forEach(r=>{map[r.date]=r;});setLf(map);}
      setSyncing(false);
    })();
  },[]);

  const sorted=useMemo(()=>entries?[...entries].sort((a,b)=>a.date.localeCompare(b.date)):[], [entries]);

  const stats=useMemo(()=>{
    if(!sorted.length)return null;
    const ws=sorted.map(e=>e.weight),first=ws[0],last=ws[ws.length-1];
    const reg=linReg(sorted),weekly=reg?Math.abs(reg.slope*7):0;
    const recent=sorted.slice(-7),prev7=sorted.slice(-14,-7);
    const avg7=avg(recent.map(e=>e.weight)),avgP=prev7.length?avg(prev7.map(e=>e.weight)):null;
    const span=diffDays(sorted[0].date,sorted[sorted.length-1].date)+1;
    return{first,last,lost:first-last,weekly,change7:avgP!=null?avg7-avgP:null,count:sorted.length,span};
  },[sorted]);

  const allCD=useMemo(()=>{
    const reg=linReg(sorted),mavg=rollingAvg(sorted,7);
    return sorted.map((e,i)=>({date:fmtShort(e.date),fullDate:e.date,Weight:e.weight,Trend:reg?parseFloat((reg.slope*i+reg.intercept).toFixed(2)):undefined,"7d Avg":mavg[i]}));
  },[sorted]);

  const weekCD=useMemo(()=>{
    const map={};sorted.forEach(e=>{const wk=getWeekKey(e.date);if(!map[wk])map[wk]={date:wk,weights:[]};map[wk].weights.push(e.weight);});
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date)).map((w,i,arr)=>{
      const a=avg(w.weights),prev=arr[i-1],pA=prev?avg(prev.weights):null;
      return{date:"Wk "+fmtShort(w.date),"Avg Weight":parseFloat(a.toFixed(1)),"WoW Change":pA!=null?parseFloat((a-pA).toFixed(1)):null};
    });
  },[sorted]);

  const monthCD=useMemo(()=>{
    const map={};sorted.forEach(e=>{const mk=getMonthKey(e.date);if(!map[mk])map[mk]={date:mk,weights:[]};map[mk].weights.push(e.weight);});
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date)).map((m,i,arr)=>{
      const a=avg(m.weights),lo=Math.min(...m.weights),hi=Math.max(...m.weights);
      const prev=arr[i-1],pA=prev?avg(prev.weights):null;
      return{date:fmtMon(m.date),"Avg Weight":parseFloat(a.toFixed(1)),"MoM Change":pA!=null?parseFloat((a-pA).toFixed(1)):null,Low:parseFloat(lo.toFixed(1)),High:parseFloat(hi.toFixed(1))};
    });
  },[sorted]);

  // 30-day overlay — actual weight (not normalized)
  const overlayCD=useMemo(()=>{
    if(sorted.length<10)return null;
    const lastDate=sorted[sorted.length-1].date;
    const r30=sorted.filter(e=>diffDays(e.date,lastDate)<=30);
    const p30=sorted.filter(e=>diffDays(e.date,lastDate)>30&&diffDays(e.date,lastDate)<=60);
    if(r30.length<3||p30.length<3)return null;
    const maxLen=Math.max(r30.length,p30.length);
    return Array.from({length:maxLen},(_,i)=>({
      day:`Day ${i+1}`,
      "Recent 30":r30[i]!==undefined?r30[i].weight:null,
      "Prior 30":p30[i]!==undefined?p30[i].weight:null,
    }));
  },[sorted]);

  const overlayDomain=useMemo(()=>{
    if(!overlayCD)return["auto","auto"];
    const vals=overlayCD.flatMap(d=>[d["Recent 30"],d["Prior 30"]]).filter(v=>v!=null);
    return[Math.floor(Math.min(...vals)-1),Math.ceil(Math.max(...vals)+1)];
  },[overlayCD]);

  const yDomain=useMemo(()=>{
    if(!sorted.length)return[190,215];
    const ws=sorted.map(e=>e.weight);
    return[Math.floor(Math.min(...ws)-2),Math.ceil(Math.max(...ws)+2)];
  },[sorted]);

  const injRefLines=useMemo(()=>{
    if(!doses||!allCD.length)return[];
    return doses.map(d=>{const idx=allCD.findIndex(c=>c.fullDate===d.date);return idx>=0?{x:allCD[idx].date,mg:d.mg}:null;}).filter(Boolean);
  },[doses,allCD]);

  const currentDose=useMemo(()=>doses?.length?[...doses].sort((a,b)=>b.date.localeCompare(a.date))[0]:null,[doses]);
  const doseDates=useMemo(()=>new Set((doses||[]).map(d=>d.date)),[doses]);
  const sleepCalc=useMemo(()=>sleepHrs(bedTime,wakeTime),[bedTime,wakeTime]);
  const allInsights=useMemo(()=>buildInsights(sorted,lf,doses),[sorted,lf,doses]);
  const dailyInsights=useMemo(()=>getDailyInsights(allInsights),[allInsights]);

  async function addEntry(){
    const w=parseFloat(wt);if(!dt||isNaN(w)||w<=0)return;
    setSyncing(true);
    await sbUpsert("entries",[{date:dt,weight:w}]);
    setEntries([...(entries||[]).filter(e=>e.date!==dt),{date:dt,weight:w}]);
    const d=parseFloat(doseInp);
    if(!isNaN(d)&&d>0){await sbUpsert("doses",[{date:dt,mg:d}]);setDoses([...(doses||[]).filter(x=>x.date!==dt),{date:dt,mg:d}]);}
    const mc=parseInt(meals);
    const lfRow={date:dt,drank,red_meat:redMeat,delivery,meals:isNaN(mc)?null:mc,bed_time:bedTime||null,wake_time:wakeTime||null,night_wake:nightWake,rosacea:rosacea||null};
    await sbUpsert("lifestyle",[lfRow]);
    setLf(prev=>({...prev,[dt]:lfRow}));
    setWt("");setDoseInp("");setDrank(false);setRedMeat(false);setDelivery(false);setMeals("");setBedTime("");setWakeTime("");setNightWake(false);setRosacea(0);setDt(todayStr());
    setSyncing(false);setMsg("Saved ✓");setTimeout(()=>setMsg(""),2000);
  }

  async function deleteEntry(date){await sbDelete("entries",date);setEntries((entries||[]).filter(e=>e.date!==date));}

  if(entries===null)return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"Inter,sans-serif",flexDirection:"column",gap:12}}>
      <div style={{width:32,height:32,border:`3px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{fontSize:13}}>Connecting to database…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const LS={fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5};
  const TAG={patterns:"#7c3aed",habits:"#0891b2",records:"#b45309",lifestyle:"#065f46",medication:"#9f1239",progress:"#1d4ed8",rosacea:"#be185d",sleep:"#0e7490"};

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px;}
        button{cursor:pointer;}input{outline:none;}
        .tab{background:none;border:none;font-family:inherit;font-size:13px;font-weight:500;padding:7px 14px;border-radius:6px;color:${C.muted};transition:all .15s;white-space:nowrap;}
        .tab:hover{color:${C.text};}.tab.on{color:#fff;background:${C.card2};}
        .vtab{background:none;border:1px solid ${C.border};font-family:inherit;font-size:12px;font-weight:500;padding:5px 11px;border-radius:6px;color:${C.muted};transition:all .15s;}
        .vtab:hover{color:${C.text};}.vtab.on{color:${C.accentL};background:#1e2540;border-color:${C.accent};}
        .card{background:${C.card};border:1px solid ${C.border};border-radius:14px;padding:20px 22px;}
        .inp{background:${C.card2};border:1.5px solid ${C.border2};border-radius:9px;padding:10px 14px;color:${C.text};font-family:inherit;font-size:14px;width:100%;transition:border .15s;}
        .inp:focus{border-color:${C.accent};box-shadow:0 0 0 3px rgba(99,102,241,.12);outline:none;}
        .inp::placeholder{color:${C.dim};}
        .inp[type=time]{color-scheme:dark;}
        .btn{background:${C.accent};color:#fff;border:none;border-radius:9px;padding:10px 22px;font-family:inherit;font-size:14px;font-weight:600;transition:background .15s;white-space:nowrap;}
        .btn:hover{background:${C.accentL};}
        .btn-sm{background:${C.card2};color:${C.muted};border:1px solid ${C.border};border-radius:7px;padding:7px 14px;font-family:inherit;font-size:12px;font-weight:500;transition:all .15s;}
        .btn-sm:hover{color:${C.text};border-color:${C.border2};}
        .del{background:none;border:none;color:${C.dim};font-size:18px;padding:2px 6px;border-radius:4px;transition:color .15s;font-family:inherit;}
        .del:hover{color:${C.red};}
        @keyframes fu{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}.fu{animation:fu .2s ease;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Header */}
      <div style={{borderBottom:`1px solid ${C.border}`,background:C.card}}>
        <div style={{maxWidth:900,margin:"0 auto",padding:"0 18px",display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>⚖</div>
            <div>
              <div style={{fontWeight:700,fontSize:14,letterSpacing:"-.01em",lineHeight:1.2}}>Wait Tracker</div>
              {currentDose&&<div style={{fontSize:11,color:C.muted}}>Current dose · {currentDose.mg}mg</div>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {syncing&&<div style={{width:14,height:14,border:`2px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",marginRight:6}}/>}
            <nav style={{display:"flex",gap:1}}>
              {[["chart","Chart"],["log","Log"],["insights","✦ Insights"]].map(([v,l])=>(
                <button key={v} className={`tab${tab===v?" on":""}`} onClick={()=>setTab(v)}>{l}</button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 18px 60px"}}>

        {/* ── CHART ── */}
        {tab==="chart"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}} className="fu">
            {!stats?(<div className="card" style={{textAlign:"center",padding:"60px 24px",color:C.dim}}>No data yet.</div>):(<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[
                  {l:"Current",v:`${stats.last.toFixed(1)}`,u:"lbs",c:C.text},
                  {l:"Total Lost",v:`-${stats.lost.toFixed(1)}`,u:"lbs",c:stats.lost>0?C.green:C.red},
                  {l:"Wkly Avg",v:`-${stats.weekly.toFixed(2)}`,u:"lbs/wk",c:C.accentL},
                  {l:"7-Day Δ",v:stats.change7!=null?`${stats.change7<0?"▼":"▲"} ${Math.abs(stats.change7).toFixed(1)}`:"—",u:"lbs",c:stats.change7!=null?(stats.change7<0?C.green:C.red):C.dim},
                  {l:"Entries",v:`${stats.count}`,u:`${stats.span}d span`,c:C.text},
                  {l:"Start→Now",v:`${stats.first.toFixed(1)}→${stats.last.toFixed(1)}`,u:"lbs",c:C.muted},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 15px"}}>
                    <div style={{...LS,marginBottom:4}}>{s.l}</div>
                    <div style={{fontSize:18,fontWeight:700,color:s.c,lineHeight:1.2}}>{s.v}</div>
                    <div style={{fontSize:11,color:C.dim,marginTop:3}}>{s.u}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                  <div style={{fontWeight:600,fontSize:14}}>Weight Chart</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {[["all","All Time"],["mavg","Moving Avg"],["month","Month"],["week","Week"]].map(([v,l])=>(
                      <button key={v} className={`vtab${chartView===v?" on":""}`} onClick={()=>setChartView(v)}>{l}</button>
                    ))}
                  </div>
                </div>

                {chartView==="all"&&(<>
                  <div style={{display:"flex",gap:14,fontSize:11,color:C.muted,marginBottom:10,flexWrap:"wrap"}}>
                    <span><span style={{color:C.accent}}>●</span> actual</span>
                    <span><span style={{color:C.accentL,opacity:.6}}>●</span> trend</span>
                    <span><span style={{color:C.inj}}>|</span> injection</span>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={allCD} margin={{top:8,right:12,bottom:0,left:0}}>
                      <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.accent} stopOpacity={0.2}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                      </linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} interval={Math.max(0,Math.floor(allCD.length/9)-1)}/>
                      <YAxis domain={yDomain} tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={40}/>
                      <Tooltip content={<Tip/>}/>
                      {injRefLines.map((l,i)=>(
                        <ReferenceLine key={i} x={l.x} stroke={C.inj} strokeOpacity={.7} strokeWidth={1.5} strokeDasharray="3 3"
                          label={{value:`${l.mg}mg`,fill:"#ffffff",fontSize:10,position:"insideTopLeft",fontWeight:600,
                            style:{textShadow:"0 0 4px #000, 0 0 4px #000"}}}/>
                      ))}
                      <Area type="monotone" dataKey="Weight" stroke={C.accent} strokeWidth={2} fill="url(#g1)" dot={false} name="Weight"/>
                      <Line type="monotone" dataKey="Trend" stroke={C.accentL} strokeWidth={1.5} strokeOpacity={.5} dot={false} strokeDasharray="5 4" name="Trend"/>
                    </ComposedChart>
                  </ResponsiveContainer>
                </>)}

                {chartView==="mavg"&&(<>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10}}>7-day rolling average · injection days marked</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={allCD} margin={{top:8,right:12,bottom:0,left:0}}>
                      <defs><linearGradient id="g4" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.green} stopOpacity={0.15}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                      </linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} interval={Math.max(0,Math.floor(allCD.length/9)-1)}/>
                      <YAxis domain={yDomain} tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={40}/>
                      <Tooltip content={<Tip/>}/>
                      {injRefLines.map((l,i)=>(
                        <ReferenceLine key={i} x={l.x} stroke={C.inj} strokeOpacity={.6} strokeWidth={1.5} strokeDasharray="3 3"
                          label={{value:`${l.mg}mg`,fill:"#ffffff",fontSize:10,position:"insideTopLeft",fontWeight:600,
                            style:{textShadow:"0 0 4px #000, 0 0 4px #000"}}}/>
                      ))}
                      <Line type="monotone" dataKey="Weight" stroke={C.border2} strokeWidth={1} strokeOpacity={.4} dot={false} name="Daily"/>
                      <Area type="monotone" dataKey="7d Avg" stroke={C.green} strokeWidth={2.5} fill="url(#g4)" dot={false} name="7d Avg"/>
                    </ComposedChart>
                  </ResponsiveContainer>
                </>)}

                {chartView==="week"&&(<>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Weekly average · WoW change on hover</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={weekCD} margin={{top:8,right:12,bottom:0,left:0}}>
                      <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false}/>
                      <YAxis domain={["auto","auto"]} tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={40}/>
                      <Tooltip content={({active,payload,label})=>{
                        if(!active||!payload?.length)return null;
                        const w=payload.find(p=>p.dataKey==="Avg Weight"),wow=payload.find(p=>p.dataKey==="WoW Change");
                        return(<div style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 14px",fontSize:13}}>
                          <div style={{color:C.muted,marginBottom:4,fontSize:12}}>{label}</div>
                          {w&&<div style={{color:"#8b5cf6",fontWeight:600}}>Avg: {w.value?.toFixed(1)} lbs</div>}
                          {wow?.value!=null&&<div style={{color:wow.value<0?C.green:C.red,fontWeight:600}}>WoW: {wow.value>0?"+":""}{wow.value?.toFixed(1)} lbs</div>}
                        </div>);
                      }}/>
                      <Area type="monotone" dataKey="Avg Weight" stroke="#8b5cf6" strokeWidth={2} fill="url(#g2)" dot={{fill:"#8b5cf6",r:4}} name="Avg Weight"/>
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{marginTop:14,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                    <div style={{...LS,marginBottom:8}}>Week-over-Week</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {weekCD.slice(-8).map((w,i)=>(
                        <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",minWidth:80}}>
                          <div style={{fontSize:11,color:C.dim,marginBottom:3}}>{w.date}</div>
                          <div style={{fontSize:14,fontWeight:700}}>{w["Avg Weight"]}</div>
                          {w["WoW Change"]!=null&&<div style={{fontSize:12,color:w["WoW Change"]<0?C.green:C.red,fontWeight:600}}>{w["WoW Change"]>0?"+":""}{w["WoW Change"]}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>)}

                {chartView==="month"&&(<>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Monthly average · MoM change on hover</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={monthCD} margin={{top:8,right:12,bottom:0,left:0}}>
                      <defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.accent} stopOpacity={0.22}/><stop offset="95%" stopColor={C.accent} stopOpacity={0.04}/>
                      </linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false}/>
                      <YAxis domain={["auto","auto"]} tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={40}/>
                      <Tooltip content={({active,payload,label})=>{
                        if(!active||!payload?.length)return null;
                        const a=payload.find(p=>p.dataKey==="Avg Weight"),mom=payload.find(p=>p.dataKey==="MoM Change");
                        const lo=payload.find(p=>p.dataKey==="Low"),hi=payload.find(p=>p.dataKey==="High");
                        return(<div style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 14px",fontSize:13}}>
                          <div style={{color:C.muted,marginBottom:4,fontSize:12}}>{label}</div>
                          {a&&<div style={{color:C.accent,fontWeight:600}}>Avg: {a.value?.toFixed(1)} lbs</div>}
                          {mom?.value!=null&&<div style={{color:mom.value<0?C.green:C.red,fontWeight:600}}>MoM: {mom.value>0?"+":""}{mom.value?.toFixed(1)} lbs</div>}
                          {lo&&hi&&<div style={{color:C.dim,marginTop:2}}>Range: {lo.value}–{hi.value}</div>}
                        </div>);
                      }}/>
                      <Area type="monotone" dataKey="Avg Weight" stroke={C.accent} strokeWidth={2.5} fill="url(#g3)" dot={{fill:C.accent,r:5,strokeWidth:2,stroke:C.card}} name="Avg Weight"/>
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{marginTop:14,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                    <div style={{...LS,marginBottom:8}}>Month-over-Month</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                        {["Month","Avg","Low","High","MoM"].map(h=>(<th key={h} style={{padding:"6px 10px",textAlign:"left",fontSize:10,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</th>))}
                      </tr></thead>
                      <tbody>{monthCD.map((m,i)=>(
                        <tr key={i} style={{borderBottom:`1px solid ${C.bg}`}}>
                          <td style={{padding:"7px 10px",color:C.muted}}>{m.date}</td>
                          <td style={{padding:"7px 10px",fontWeight:600}}>{m["Avg Weight"]}</td>
                          <td style={{padding:"7px 10px",color:C.dim}}>{m.Low}</td>
                          <td style={{padding:"7px 10px",color:C.dim}}>{m.High}</td>
                          <td style={{padding:"7px 10px",color:m["MoM Change"]==null?C.dim:m["MoM Change"]<0?C.green:C.red,fontWeight:600}}>
                            {m["MoM Change"]==null?"—":`${m["MoM Change"]>0?"+":""}${m["MoM Change"]}`}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </>)}
              </div>

              {/* 30-day overlay — actual weight */}
              {overlayCD&&(
                <div className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>Recent 30 vs Prior 30 Days</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>Actual weight — same scale for direct comparison</div>
                    </div>
                    <div style={{display:"flex",gap:14,fontSize:11}}>
                      <span style={{color:C.accent,fontWeight:500}}>— Recent</span>
                      <span style={{color:C.dim}}>- - Prior</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={overlayCD} margin={{top:8,right:12,bottom:0,left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="day" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} interval={4}/>
                      <YAxis domain={overlayDomain} tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={40}/>
                      <Tooltip content={({active,payload,label})=>{
                        if(!active||!payload?.length)return null;
                        return(<div style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 14px",fontSize:13}}>
                          <div style={{color:C.muted,marginBottom:4,fontSize:12}}>{label}</div>
                          {payload.map((p,i)=>p.value!=null&&<div key={i} style={{color:p.color,fontWeight:600,marginTop:2}}>{p.name}: {p.value.toFixed(1)} lbs</div>)}
                        </div>);
                      }}/>
                      <Line type="monotone" dataKey="Recent 30" stroke={C.accent} strokeWidth={2.5} dot={false} connectNulls/>
                      <Line type="monotone" dataKey="Prior 30" stroke={C.dim} strokeWidth={1.5} dot={false} strokeDasharray="5 4" connectNulls/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Dose history — collapsible */}
              {doses?.length>0&&(
                <div className="card" style={{padding:0,overflow:"hidden"}}>
                  <button onClick={()=>setDoseExpanded(!doseExpanded)} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"14px 20px",background:"none",border:"none",color:C.text,fontFamily:"inherit",cursor:"pointer"
                  }}>
                    <span style={{fontWeight:600,fontSize:13}}>Tirz MG History <span style={{color:C.muted,fontWeight:400,fontSize:12}}>({doses.length} doses)</span></span>
                    <span style={{color:C.muted,fontSize:12}}>{doseExpanded?"▲ hide":"▼ show"}</span>
                  </button>
                  {doseExpanded&&(
                    <div style={{padding:"0 20px 16px",display:"flex",flexWrap:"wrap",gap:7,borderTop:`1px solid ${C.border}`}}>
                      {[...doses].sort((a,b)=>a.date.localeCompare(b.date)).map((d,i)=>(
                        <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"4px 12px",fontSize:12,color:C.accentL,fontWeight:500,marginTop:12}}>
                          {fmtFull(d.date)} <span style={{color:C.accent,fontWeight:700,marginLeft:2}}>{d.mg}mg</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>)}
          </div>
        )}

        {/* ── LOG ── */}
        {tab==="log"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}} className="fu">
            <div className="card">
              <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Add Entry</div>
              <div style={{marginBottom:14}}>
                <div style={LS}>Weight (lbs)</div>
                <input className="inp" type="number" step="0.1" placeholder="xx.x" value={wt}
                  onChange={e=>setWt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEntry()}
                  style={{fontSize:28,fontWeight:700,textAlign:"center",padding:"12px 16px"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div>
                  <div style={LS}>Date</div>
                  <input className="inp" type="date" value={dt} onChange={e=>setDt(e.target.value)}/>
                </div>
                <div>
                  <div style={LS}>Dose mg <span style={{color:C.dim,fontWeight:400,textTransform:"none"}}>(opt)</span></div>
                  <input className="inp" type="number" step="0.25" placeholder="5.5" value={doseInp} onChange={e=>setDoseInp(e.target.value)}/>
                </div>
              </div>
              <button className="btn" onClick={addEntry} style={{width:"100%",marginBottom:20}}>{syncing?"Saving…":"Save Entry"}</button>

              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:16}}>
                <div style={{...LS,marginBottom:10}}>Yesterday's habits <span style={{color:C.dim,fontWeight:400,textTransform:"none"}}>(from Apr 14)</span></div>
                {[{label:"Drank alcohol",emoji:"🍺",val:drank,set:setDrank},{label:"Ate red meat",emoji:"🥩",val:redMeat,set:setRedMeat},{label:"Got delivery",emoji:"🛵",val:delivery,set:setDelivery}].map(({label,emoji,val,set})=>(
                  <button key={label} onClick={()=>set(!val)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:val?"#1e2a45":C.card2,border:`1px solid ${val?C.accent:C.border}`,borderRadius:9,padding:"11px 14px",cursor:"pointer",transition:"all .15s",width:"100%",marginBottom:8}}>
                    <span style={{fontSize:14,color:val?C.text:C.muted,fontFamily:"inherit",fontWeight:500}}><span style={{marginRight:8}}>{emoji}</span>{label}</span>
                    <div style={{width:38,height:22,borderRadius:11,background:val?C.accent:C.border2,position:"relative",transition:"background .15s",flexShrink:0}}>
                      <div style={{position:"absolute",top:3,left:val?17:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
                    </div>
                  </button>
                ))}
                <div style={{marginTop:6}}>
                  <div style={LS}>Meals eaten</div>
                  <input className="inp" type="number" min="1" max="8" step="1" placeholder="3" value={meals} onChange={e=>setMeals(e.target.value)} style={{textAlign:"center",fontSize:16,fontWeight:600}}/>
                </div>
              </div>

              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:16}}>
                <div style={{...LS,marginBottom:10}}>
                  Last night's sleep
                  {sleepCalc!==null&&<span style={{color:C.green,fontWeight:600,textTransform:"none",marginLeft:8,fontSize:12}}>{sleepCalc} hrs</span>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div><div style={LS}>Bed time</div><input className="inp" type="time" value={bedTime} onChange={e=>setBedTime(e.target.value)} style={{textAlign:"center"}}/></div>
                  <div><div style={LS}>Wake up time</div><input className="inp" type="time" value={wakeTime} onChange={e=>setWakeTime(e.target.value)} style={{textAlign:"center"}}/></div>
                </div>
                <button onClick={()=>setNightWake(!nightWake)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:nightWake?"#1e2a45":C.card2,border:`1px solid ${nightWake?C.accent:C.border}`,borderRadius:9,padding:"11px 14px",cursor:"pointer",transition:"all .15s",width:"100%"}}>
                  <span style={{fontSize:14,color:nightWake?C.text:C.muted,fontFamily:"inherit",fontWeight:500}}><span style={{marginRight:8}}>😴</span>Woke up during the night</span>
                  <div style={{width:38,height:22,borderRadius:11,background:nightWake?C.accent:C.border2,position:"relative",transition:"background .15s",flexShrink:0}}>
                    <div style={{position:"absolute",top:3,left:nightWake?17:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
                  </div>
                </button>
              </div>

              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16}}>
                <div style={{...LS,marginBottom:10}}>Rosacea today <span style={{color:C.dim,fontWeight:400,textTransform:"none",marginLeft:4}}>1 = clear · 10 = very red</span></div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <button key={n} onClick={()=>setRosacea(n===rosacea?0:n)} style={{width:40,height:40,borderRadius:8,border:`1.5px solid ${rosacea===n?C.accent:C.border}`,background:rosacea===n?"#1e2a45":C.card2,color:rosacea===n?C.text:C.muted,fontFamily:"inherit",fontSize:14,fontWeight:rosacea===n?700:400,transition:"all .12s"}}>{n}</button>
                  ))}
                </div>
                {rosacea>0&&<div style={{marginTop:8,fontSize:12,color:rosacea<=3?C.green:rosacea<=6?C.yellow:C.red}}>{rosacea<=3?"Clear day 🌿":rosacea<=6?"Moderate 🌹":"Elevated 🔴"}</div>}
              </div>

              {msg&&<div style={{marginTop:14,fontSize:13,color:C.green,fontWeight:500}}>{msg}</div>}
            </div>

            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"13px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:8,alignItems:"baseline"}}>
                  <span style={{fontWeight:600,fontSize:14}}>All Entries</span>
                  <span style={{fontSize:12,color:C.muted}}>{sorted.length} total</span>
                </div>
                <button className="btn-sm" onClick={()=>exportCSV(sorted,doses,lf)}>⬇ Export CSV</button>
              </div>
              <div style={{maxHeight:380,overflowY:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {["Date","Weight","Δ","Dose","🍺","🥩","🛵","😴","Zz","Ros",""].map(h=>(<th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:10,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>))}
                  </tr></thead>
                  <tbody>{[...sorted].reverse().map((e,i,arr)=>{
                    const prev=arr[i+1],delta=prev?e.weight-prev.weight:null;
                    const d=doses?.find(x=>x.date===e.date),lfd=lf[e.date]||{};
                    const hrs=sleepHrs(lfd.bed_time,lfd.wake_time);
                    return(<tr key={e.date} style={{borderBottom:`1px solid ${C.bg}`}}>
                      <td style={{padding:"8px 10px",fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{fmtFull(e.date)}{doseDates.has(e.date)&&<span style={{color:C.inj,marginLeft:4,fontSize:10}}>💉</span>}</td>
                      <td style={{padding:"8px 10px",fontSize:14,fontWeight:600}}>{e.weight.toFixed(1)}</td>
                      <td style={{padding:"8px 10px",fontSize:13,fontWeight:500,color:delta===null?C.dim:delta<0?C.green:C.red}}>{delta===null?"—":`${delta>0?"+":""}${delta.toFixed(1)}`}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:C.accent,fontWeight:500}}>{d?`${d.mg}mg`:""}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:C.muted}}>{lfd.drank?"✓":""}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:C.muted}}>{lfd.red_meat?"✓":""}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:C.muted}}>{lfd.delivery?"✓":""}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:C.muted}}>{lfd.night_wake?"✓":""}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{hrs!==null?`${hrs}h`:""}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:lfd.rosacea>6?C.red:lfd.rosacea>3?C.yellow:lfd.rosacea>0?C.green:C.dim,fontWeight:lfd.rosacea>0?600:400}}>{lfd.rosacea||""}</td>
                      <td style={{padding:"8px 10px"}}><button className="del" onClick={()=>deleteEntry(e.date)}>×</button></td>
                    </tr>);
                  })}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── INSIGHTS ── */}
        {tab==="insights"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}} className="fu">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
              <div>
                <div style={{fontWeight:700,fontSize:18,letterSpacing:"-.01em"}}>✦ Fun Insights</div>
                <div style={{fontSize:13,color:C.muted,marginTop:4}}>5 insights from your data · refreshes daily · more unlock as data builds</div>
              </div>
              <div style={{fontSize:11,color:C.dim,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",whiteSpace:"nowrap"}}>{fmtFull(todayStr())}</div>
            </div>
            {dailyInsights.length===0?(
              <div className="card" style={{textAlign:"center",padding:"50px 24px",color:C.dim}}>
                <div style={{fontSize:32,marginBottom:12}}>🔍</div>
                <div style={{fontSize:14,marginBottom:6}}>Not enough data yet.</div>
                <div style={{fontSize:13}}>Keep logging — insights unlock as patterns emerge over the next few weeks.</div>
              </div>
            ):(
              <>
                {dailyInsights.map((ins,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px",display:"flex",gap:14,alignItems:"flex-start",animation:`fu .2s ease ${i*.07}s both`}}>
                    <div style={{fontSize:26,lineHeight:1,flexShrink:0,marginTop:1}}>{ins.e}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                        <div style={{fontWeight:600,fontSize:14}}>{ins.t}</div>
                        <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",padding:"2px 7px",borderRadius:4,background:`${TAG[ins.tag]||C.dim}22`,color:TAG[ins.tag]||C.muted}}>{ins.tag}</div>
                      </div>
                      <div style={{fontSize:14,color:C.muted,lineHeight:1.65}}>{ins.txt}</div>
                    </div>
                  </div>
                ))}
                <div style={{fontSize:12,color:C.dim,textAlign:"center",paddingTop:4}}>
                  {allInsights.length} insights available · showing 5 · refreshes tomorrow
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
