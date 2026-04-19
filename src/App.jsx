import { useState, useEffect, useMemo } from "react";
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, LineChart } from "recharts";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SB_URL="https://ttvkmboqksmvpwqjrvcq.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0dmttYm9xa3NtdnB3cWpydmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDQ0MTcsImV4cCI6MjA5MTc4MDQxN30.fBb94ggs_H-9tBapdJ4JaCtXka2FdegLgmZ2QBiGVEY";
const sbH={"Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`};
async function sbGet(t){try{const r=await fetch(`${SB_URL}/rest/v1/${t}?select=*&order=date.asc`,{headers:sbH});return r.ok?await r.json():null;}catch{return null;}}
async function sbUpsert(t,d){try{const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:"POST",headers:{...sbH,"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(d)});return r.ok;}catch{return false;}}
async function sbDelete(t,date){try{const r=await fetch(`${SB_URL}/rest/v1/${t}?date=eq.${date}`,{method:"DELETE",headers:sbH});return r.ok;}catch{return false;}}

// ─── Padres ───────────────────────────────────────────────────────────────────
async function fetchPadresResult(dateStr){
  try{
    const r=await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}&teamId=135`);
    if(!r.ok)return null;
    const data=await r.json();
    const games=data?.dates?.[0]?.games;
    if(!games?.length)return null;
    const game=games[0];
    if(game?.status?.abstractGameState!=="Final")return null;
    const home=game.teams.home,away=game.teams.away;
    const padresHome=home.team.id===135;
    const padresScore=padresHome?home.score:away.score;
    const oppScore=padresHome?away.score:home.score;
    const oppName=padresHome?away.team.name:home.team.name;
    return{won:padresScore>oppScore,padresScore,oppScore,oppName,date:dateStr};
  }catch{return null;}
}

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

const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const LS_START="2026-04-14";
const C={bg:"#161b27",card:"#1e253a",card2:"#252d42",border:"#2e3650",border2:"#3a4460",
  text:"#e8edf5",muted:"#8892a4",dim:"#4a5568",accent:"#6366f1",accentL:"#818cf8",
  green:"#34d399",red:"#f87171",yellow:"#fbbf24",inj:"#f59e0b"};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function yesterdayStr(){const d=new Date();d.setDate(d.getDate()-1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
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
const POS_WORDS=new Set(["good","great","happy","bright","calm","clear","clean","fresh","joy","love","sun","light","peace","nice","fine","rest","easy","warm","strong","ready","well","win","yes","up","free","best","hope","grow","rise","glow","excited","motivated","energized","positive","awesome"]);
const NEG_WORDS=new Set(["bad","tired","sad","dark","heavy","slow","fog","blur","pain","sick","stress","lazy","rough","hard","lost","down","low","weak","dull","flat","ugh","nope","no","off","drag","stuck","grey","gray","meh","bleh","anxious","worried","exhausted","drained","blah"]);
function wordSentiment(w){if(!w)return"neutral";const l=w.toLowerCase().trim();if(POS_WORDS.has(l))return"positive";if(NEG_WORDS.has(l))return"negative";return"neutral";}

function exportCSV(entries,doses,lf){
  const dbd=Object.fromEntries((doses||[]).map(d=>[d.date,d.mg]));
  const hdr=["date","weight","dose_mg","drank","red_meat","delivery","high_sugar","exercise","beta","meals","bed_time","wake_time","night_wake","rosacea","sleep_hrs","first_word","first_number","padres_win"];
  const rows=entries.map(e=>{const l=lf[e.date]||{},hrs=sleepHrs(l.bed_time,l.wake_time);
    return[e.date,e.weight,dbd[e.date]??"",l.drank??"",l.red_meat??"",l.delivery??"",l.high_sugar??"",l.exercise??"",l.beta??"",l.meals??"",l.bed_time??"",l.wake_time??"",l.night_wake??"",l.rosacea??"",hrs??"",l.first_word??"",l.first_number??"",l.padres_win??""].join(",");});
  const csv=[hdr.join(","),...rows].join("\n");
  const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);a.download=`wait-tracker-${todayStr()}.csv`;a.click();
}

// ─── Insights ─────────────────────────────────────────────────────────────────
function buildInsights(sorted,lf,doses){
  if(!sorted.length)return[];
  const ins=[];
  const MIN=2;

  // next-day weight delta when condition met on prev day (LS_START+ only)
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

  const lfVals=sorted.filter(e=>e.date>=LS_START).map(e=>({...lf[e.date]||{},date:e.date,weight:e.weight}));

  // ── WEIGHT PATTERNS ──────────────────────────────────────────────────────
  const byDow=Array.from({length:7},()=>[]);
  sorted.forEach((e,i)=>{if(i>0)byDow[dow(e.date)].push(e.weight-sorted[i-1].weight);});
  const dowA=byDow.map((a,i)=>a.length>=MIN?{dow:i,a:avg(a)}:null).filter(Boolean);
  if(dowA.length>=3){
    const s=[...dowA].sort((a,b)=>a.a-b.a);
    ins.push({e:"📅",t:"Best weigh-in day",tag:"patterns",txt:`${DAYS[s[0].dow]}s are your best day — avg ${Math.abs(s[0].a).toFixed(2)} lbs down vs the day before.`});
    ins.push({e:"😬",t:"Toughest weigh-in day",tag:"patterns",txt:`${DAYS[s[s.length-1].dow]}s are toughest — avg ${s[s.length-1].a>0?"+":""}${s[s.length-1].a.toFixed(2)} lbs.`});
  }

  // Longest streak
  let cur=1,maxS=0,mStart="",mEnd="";
  sorted.forEach((e,i)=>{if(i===0)return;if(e.weight<sorted[i-1].weight){cur++;if(cur>maxS){maxS=cur;mEnd=e.date;mStart=sorted[i-cur+1].date;}}else cur=1;});
  if(maxS>=3)ins.push({e:"🔥",t:"Longest losing streak",tag:"records",txt:`Best run: ${maxS} consecutive days down, ${fmtFull(mStart)} → ${fmtFull(mEnd)}.`});

  // Biggest drop/gain
  let bigL=null,bigG=null;
  sorted.forEach((e,i)=>{if(i===0)return;const d=e.weight-sorted[i-1].weight;if(!bigL||d<bigL.d)bigL={d,date:e.date};if(!bigG||d>bigG.d)bigG={d,date:e.date};});
  if(bigL)ins.push({e:"🏆",t:"Biggest single-day drop",tag:"records",txt:`Best day: ${fmtFull(bigL.date)} — down ${Math.abs(bigL.d).toFixed(1)} lbs in 24 hours.`});
  if(bigG&&bigG.d>0)ins.push({e:"📈",t:"Biggest single-day spike",tag:"records",txt:`Biggest gain: ${fmtFull(bigG.date)} — up ${bigG.d.toFixed(1)} lbs overnight. Probably sodium.`});

  // Weekday vs weekend
  const wdD=[],weD=[];
  sorted.forEach((e,i)=>{if(i===0)return;const d=e.weight-sorted[i-1].weight,dw=dow(e.date);if(dw===0||dw===6)weD.push(d);else wdD.push(d);});
  if(wdD.length>=MIN&&weD.length>=MIN){
    const wdA=avg(wdD),weA=avg(weD);
    ins.push({e:"📆",t:"Weekdays vs. weekends",tag:"patterns",txt:wdA<weA?`You trend ${Math.abs(wdA-weA).toFixed(2)} lbs better on weekdays. Structure helps.`:`Weekends work better — ${Math.abs(weA-wdA).toFixed(2)} lbs more per day than weekdays.`});
  }

  // Overall pace
  if(sorted.length>=10){
    const first=sorted[0],last=sorted[sorted.length-1],days=diffDays(first.date,last.date),lost=first.weight-last.weight;
    if(lost>0)ins.push({e:"🎯",t:"Pace check",tag:"progress",txt:`${lost.toFixed(1)} lbs lost in ${days} days — ${(lost/(days/30)).toFixed(1)} lbs/month on average.`});
  }

  // Plateau or momentum
  const l14=sorted.slice(-14);
  if(l14.length>=7){
    const ws=l14.map(e=>e.weight),range=Math.max(...ws)-Math.min(...ws),delta=ws[ws.length-1]-ws[0];
    if(range<1.5)ins.push({e:"🏔️",t:"Plateau alert",tag:"patterns",txt:`Weight within ${range.toFixed(1)} lbs over last ${l14.length} entries. Normal on GLP-1s.`});
    else ins.push({e:"📉",t:"Recent momentum",tag:"progress",txt:`Last ${l14.length} weigh-ins: ${delta<0?"down":"up"} ${Math.abs(delta).toFixed(1)} lbs total.`});
  }

  // Logging consistency
  if(sorted.length>=10){
    const span=diffDays(sorted[0].date,sorted[sorted.length-1].date)+1;
    const rate=Math.round((sorted.length/span)*100);
    ins.push({e:"📓",t:"Logging consistency",tag:"lifestyle",txt:`${sorted.length} weigh-ins over ${span} days — ${rate}% of days. ${rate>=80?"Great consistency.":rate>=50?"Decent.":"More logging = better insights."}`});
  }

  // Journey summary
  if(sorted.length>=10){
    const reg=linReg(sorted),wkly=reg?Math.abs(reg.slope*7):0;
    const score=wkly>=1.5?"🟢 Excellent":wkly>=0.75?"🟡 Good":wkly>=0.25?"🟠 Steady":"🔴 Slow";
    ins.push({e:"📋",t:"Journey summary",tag:"progress",txt:`${fmtFull(sorted[0].date)} → today: ${(sorted[0].weight-sorted[sorted.length-1].weight).toFixed(1)} lbs lost, ${diffDays(sorted[0].date,todayStr())} days in. Status: ${score}`});
  }

  // ── INJECTION ─────────────────────────────────────────────────────────────
  if(doses&&doses.length>=2){
    const injDates=new Set(doses.map(d=>d.date));
    const dayBefore=[],dayAfter=[],twoDayAfter=[];
    sorted.forEach((e,i)=>{
      if(i===0)return;
      const delta=e.weight-sorted[i-1].weight;
      if(injDates.has(addDays(e.date,1)))dayBefore.push(delta);
      if(injDates.has(addDays(e.date,-1)))dayAfter.push(delta);
      if(injDates.has(addDays(e.date,-2)))twoDayAfter.push(delta);
    });
    if(dayBefore.length>=MIN){const a=avg(dayBefore);ins.push({e:"💉",t:"Day before injection",tag:"medication",txt:`Day before your shot: avg ${a<0?`${Math.abs(a).toFixed(2)} lbs down`:`+${a.toFixed(2)} lbs`}.`});}
    if(dayAfter.length>=MIN){const a=avg(dayAfter);ins.push({e:"📍",t:"Day after injection",tag:"medication",txt:`Morning after your shot: avg ${a<0?`${Math.abs(a).toFixed(2)} lbs down`:`+${a.toFixed(2)} lbs`}. ${a<0?"Fast response.":"Day-after gains often reverse in 2–3 days."}`});}
    if(twoDayAfter.length>=MIN){const a=avg(twoDayAfter);ins.push({e:"📆",t:"2 days after injection",tag:"medication",txt:`Two days post-shot: avg ${a<0?`${Math.abs(a).toFixed(2)} lbs down`:`+${a.toFixed(2)} lbs`}.`});}

    // Days since last injection
    const lastInj=[...doses].sort((a,b)=>b.date.localeCompare(a.date))[0];
    const daysSince=diffDays(lastInj.date,todayStr());
    ins.push({e:"⏱️",t:"Days since last injection",tag:"medication",txt:`${daysSince} day${daysSince!==1?"s":""} since your last ${lastInj.mg}mg dose on ${fmtFull(lastInj.date)}.`});
  }

  // ── HABITS ────────────────────────────────────────────────────────────────

  // Alcohol & weight
  const drankD=ndd(l=>l.drank===true),soberD=ndd(l=>l.drank===false&&l.drank!==undefined);
  if(drankD.length>=MIN&&soberD.length>=MIN){
    const diff=avg(drankD)-avg(soberD);
    ins.push({e:"🍺",t:"Alcohol & next-day weight",tag:"habits",txt:diff>0?`After drinking: +${diff.toFixed(2)} lbs more the next morning vs sober nights.`:`After drinking you're ${Math.abs(diff).toFixed(2)} lbs lighter next morning. Interesting.`});
  }

  // Delivery & weight
  const delivD=ndd(l=>l.delivery===true),noDelD=ndd(l=>l.delivery===false&&l.delivery!==undefined);
  if(delivD.length>=MIN&&noDelD.length>=MIN){
    const diff=avg(delivD)-avg(noDelD);
    ins.push({e:"🛵",t:"Delivery & next-day weight",tag:"habits",txt:diff>0?`After delivery: +${diff.toFixed(2)} lbs vs cooking at home.`:`After delivery you're ${Math.abs(diff).toFixed(2)} lbs lighter. Surprising!`});
  }

  // Red meat & weight
  const meatD=ndd(l=>l.red_meat===true),noMeatD=ndd(l=>l.red_meat===false&&l.red_meat!==undefined);
  if(meatD.length>=MIN&&noMeatD.length>=MIN){
    const diff=avg(meatD)-avg(noMeatD);
    ins.push({e:"🥩",t:"Red meat & next-day weight",tag:"habits",txt:diff>0?`After red meat: +${diff.toFixed(2)} lbs next morning.`:`Red meat days followed by lighter mornings — ${Math.abs(diff).toFixed(2)} lbs down on avg.`});
  }

  // High sugar & weight
  const sugarD=ndd(l=>l.high_sugar===true),noSugarD=ndd(l=>l.high_sugar===false&&l.high_sugar!==undefined);
  if(sugarD.length>=MIN&&noSugarD.length>=MIN){
    const diff=avg(sugarD)-avg(noSugarD);
    ins.push({e:"🍬",t:"High sugar & next-day weight",tag:"habits",txt:diff>0?`High sugar days lead to +${diff.toFixed(2)} lbs the next morning vs low sugar days.`:`High sugar days don't seem to hurt your next-day weight. Interesting.`});
  }

  // Exercise & weight
  const workoutD=ndd(l=>l.exercise==="workout"),walkD=ndd(l=>l.exercise==="walk"),noneD=ndd(l=>l.exercise==="none"||l.exercise===null);
  if(workoutD.length>=MIN&&noneD.length>=MIN){
    const diff=avg(workoutD)-avg(noneD);
    ins.push({e:"💪",t:"Workout & next-day weight",tag:"habits",txt:diff<0?`After a workout: ${Math.abs(diff).toFixed(2)} lbs more loss the next morning vs rest days.`:`Workout days don't seem to change next-day weight much — but the long-term effect is what counts.`});
  }
  if(walkD.length>=MIN&&noneD.length>=MIN){
    const diff=avg(walkD)-avg(noneD);
    ins.push({e:"🚶",t:"Walk & next-day weight",tag:"habits",txt:diff<0?`After a walk: ${Math.abs(diff).toFixed(2)} lbs more loss the next morning vs rest days.`:`Walks and rest days produce similar next-day results for you.`});
  }
  if(workoutD.length>=MIN&&walkD.length>=MIN){
    const diff=avg(workoutD)-avg(walkD);
    ins.push({e:"🏋️",t:"Workout vs walk effect",tag:"habits",txt:diff<0?`Workouts lead to ${Math.abs(diff).toFixed(2)} lbs more loss the next day than walks.`:`Walks and full workouts produce similar next-day weight results for you.`});
  }

  // Exercise frequency
  if(lfVals.length>=5){
    const wkDays=lfVals.filter(l=>l.exercise==="workout").length;
    const walkDays=lfVals.filter(l=>l.exercise==="walk").length;
    const total=lfVals.filter(l=>l.exercise==="workout"||l.exercise==="walk").length;
    const withExercise=lfVals.filter(l=>l.exercise==="workout"||l.exercise==="walk"||l.exercise==="none"||l.exercise===null);
    if(total>=MIN&&withExercise.length>=MIN)ins.push({e:"🏃",t:"Exercise frequency",tag:"lifestyle",txt:`You've exercised on ${Math.round(total/withExercise.length*100)}% of logged days — ${wkDays} workouts and ${walkDays} walks out of ${withExercise.length} entries with exercise data.`});
  }

  // Beta & weight
  const betaD=ndd(l=>l.beta===true),noBetaD=ndd(l=>l.beta===false&&l.beta!==undefined);
  if(betaD.length>=MIN&&noBetaD.length>=MIN){
    const diff=avg(betaD)-avg(noBetaD);
    ins.push({e:"💊",t:"Beta & next-day weight",tag:"habits",txt:diff>0?`On days you take beta, you weigh ${diff.toFixed(2)} lbs more the next morning on average.`:`Beta days are followed by slightly lighter mornings — ${Math.abs(diff).toFixed(2)} lbs difference.`});
  }

  // Drinking + exercise interaction
  const drankWorked=ndd(l=>l.drank&&l.exercise==="workout");
  const soberWorked=ndd(l=>!l.drank&&l.exercise==="workout");
  if(drankWorked.length>=MIN&&soberWorked.length>=MIN){
    const diff=avg(drankWorked)-avg(soberWorked);
    ins.push({e:"🍺💪",t:"Drinking cancels out workouts?",tag:"habits",txt:diff>0?`When you drink AND workout, the next-day benefit is ${diff.toFixed(2)} lbs less than sober workouts. Alcohol partially offsets exercise gains.`:`You maintain similar workout benefits even on nights you drink. Impressive.`});
  }

  // Drinking frequency
  if(lfVals.length>=5){
    const dn=lfVals.filter(l=>l.drank).length;
    ins.push({e:"🥃",t:"Drinking frequency",tag:"lifestyle",txt:`Drank on ${Math.round(dn/lfVals.length*100)}% of logged nights — ${dn} out of ${lfVals.length} entries.`});
  }

  // Drink less when you workout
  if(lfVals.length>=5){
    const wkDays=lfVals.filter(l=>l.exercise==="workout");
    const restDays=lfVals.filter(l=>!l.exercise||l.exercise==="none");
    if(wkDays.length>=MIN&&restDays.length>=MIN){
      const wkDrink=Math.round(wkDays.filter(l=>l.drank).length/wkDays.length*100);
      const restDrink=Math.round(restDays.filter(l=>l.drank).length/restDays.length*100);
      if(Math.abs(wkDrink-restDrink)>=10)ins.push({e:"🔁",t:"Exercise vs drinking",tag:"habits",txt:wkDrink<restDrink?`You drink ${restDrink-wkDrink}% less on days you workout vs rest days. Exercise keeps you honest.`:`You actually drink ${wkDrink-restDrink}% more on workout days. Treating yourself?`});
    }
  }

  // High sugar + sleep interaction
  const sugarSleep=[],noSugarSleep=[];
  sorted.forEach((e,i)=>{
    if(i===0)return;const prev=sorted[i-1];if(prev.date<LS_START)return;
    const l=lf[prev.date]||{},hrs=sleepHrs(l.bed_time,l.wake_time);
    if(hrs===null)return;
    if(l.high_sugar)sugarSleep.push(hrs);else if(l.high_sugar===false)noSugarSleep.push(hrs);
  });
  if(sugarSleep.length>=MIN&&noSugarSleep.length>=MIN){
    const diff=avg(sugarSleep)-avg(noSugarSleep);
    ins.push({e:"🍬😴",t:"High sugar affects sleep",tag:"habits",txt:diff<0?`On high sugar days you sleep ${Math.abs(diff).toFixed(1)} fewer hours on average vs low sugar days.`:`High sugar doesn't seem to affect your sleep duration.`});
  }

  // Triple bad day
  const tripleD=ndd(l=>l.drank&&l.delivery&&l.red_meat);
  const tripleG=ndd(l=>!l.drank&&!l.delivery&&!l.red_meat&&l.drank!==undefined);
  if(tripleD.length>=MIN&&tripleG.length>=MIN){
    const diff=avg(tripleD)-avg(tripleG);
    ins.push({e:"🚨",t:"Triple threat days",tag:"habits",txt:diff>0?`Drink + delivery + red meat = +${diff.toFixed(2)} lbs next morning vs clean days.`:`Even on your most indulgent days the weight impact is minimal. Nice.`});
  }

  // Clean days
  const cleanD=ndd(l=>!l.drank&&!l.delivery&&!l.red_meat&&!l.high_sugar&&l.drank!==undefined);
  if(cleanD.length>=MIN)ins.push({e:"🥗",t:"Clean day effect",tag:"habits",txt:`On clean days (no drinking, delivery, red meat, or sugar): avg ${avg(cleanD)<0?`${Math.abs(avg(cleanD)).toFixed(2)} lbs down`:`+${avg(cleanD).toFixed(2)} lbs`} the next morning.`});

  // Snooze insights
  const snoozeD=ndd(l=>l.snoozed===true),noSnoozeD=ndd(l=>l.snoozed===false);
  if(snoozeD.length>=MIN&&noSnoozeD.length>=MIN){
    const diff=avg(snoozeD)-avg(noSnoozeD);
    ins.push({e:"⏰",t:"Snooze & next-day weight",tag:"sleep",txt:diff>0?`On days you snooze, you weigh ${diff.toFixed(2)} lbs more than non-snooze mornings. Disrupted sleep cycles?`:`Snoozing doesn't seem to affect your weight. Good news for lazy mornings.`});
  }
  if(lfVals.length>=5){
    const snoozeDays=lfVals.filter(l=>l.snoozed===true);
    const noSnoozeDays=lfVals.filter(l=>l.snoozed===false);
    // Snooze after drinking
    if(snoozeDays.length>=MIN&&noSnoozeDays.length>=MIN){
      const snoozeRate=Math.round(snoozeDays.length/(snoozeDays.length+noSnoozeDays.length)*100);
      ins.push({e:"😴",t:"Snooze frequency",tag:"lifestyle",txt:`You snooze on ${snoozeRate}% of logged mornings — ${snoozeDays.length} out of ${snoozeDays.length+noSnoozeDays.length} days.`});
      // Do you snooze more after drinking?
      const drinkSnooze=lfVals.filter(l=>l.drank&&l.snoozed!==undefined);
      const soberSnooze=lfVals.filter(l=>!l.drank&&l.snoozed!==undefined&&l.drank!==undefined);
      if(drinkSnooze.length>=MIN&&soberSnooze.length>=MIN){
        const dPct=Math.round(drinkSnooze.filter(l=>l.snoozed).length/drinkSnooze.length*100);
        const sPct=Math.round(soberSnooze.filter(l=>l.snoozed).length/soberSnooze.length*100);
        if(Math.abs(dPct-sPct)>=10)ins.push({e:"🍺⏰",t:"Drinking & snoozing",tag:"sleep",txt:dPct>sPct?`You snooze ${dPct-sPct}% more after drinking nights than sober ones. Alcohol disrupts your morning.`:`Surprisingly, you snooze ${sPct-dPct}% less after drinking. Early riser either way.`});
      }
      // Snooze after poor sleep
      const poorSleepSnooze=[],goodSleepSnooze=[];
      lfVals.forEach(l=>{const hrs=sleepHrs(l.bed_time,l.wake_time);if(hrs===null||l.snoozed===undefined)return;if(hrs<6.5)poorSleepSnooze.push(l.snoozed?1:0);else goodSleepSnooze.push(l.snoozed?1:0);});
      if(poorSleepSnooze.length>=MIN&&goodSleepSnooze.length>=MIN){
        const poorPct=Math.round(avg(poorSleepSnooze)*100),goodPct=Math.round(avg(goodSleepSnooze)*100);
        if(Math.abs(poorPct-goodPct)>=10)ins.push({e:"💤⏰",t:"Poor sleep & snoozing",tag:"sleep",txt:poorPct>goodPct?`After short nights (<6.5hrs) you snooze ${poorPct-goodPct}% more often. Body trying to catch up.`:`You actually snooze less after short nights. Adrenaline kicking in.`});
      }
    }
  }

  // ── SLEEP ─────────────────────────────────────────────────────────────────
  const sleepData=[];
  sorted.forEach((e,i)=>{
    if(i===0)return;const prev=sorted[i-1];if(prev.date<LS_START)return;
    const l=lf[prev.date]||{},hrs=sleepHrs(l.bed_time,l.wake_time);
    if(hrs!==null)sleepData.push({hrs,delta:e.weight-prev.weight,nightWake:l.night_wake,rosacea:(lf[e.date]||{}).rosacea});
  });
  if(sleepData.length>=5){
    const good=sleepData.filter(s=>s.hrs>=7),poor=sleepData.filter(s=>s.hrs<7);
    if(good.length>=MIN&&poor.length>=MIN){
      const diff=avg(good.map(s=>s.delta))-avg(poor.map(s=>s.delta));
      ins.push({e:"😴",t:"Sleep & weight loss",tag:"sleep",txt:diff<0?`7+ hr nights: ${Math.abs(diff).toFixed(2)} lbs more loss next day vs short nights. Sleep is a cheat code.`:`Short sleep nights don't seem to hurt your weight much yet.`});
    }
    const wake=sleepData.filter(s=>s.nightWake===true),noWake=sleepData.filter(s=>s.nightWake===false);
    if(wake.length>=MIN&&noWake.length>=MIN){
      const diff=avg(wake.map(s=>s.delta))-avg(noWake.map(s=>s.delta));
      ins.push({e:"🌙",t:"Night wake-ups & weight",tag:"sleep",txt:diff>0?`When you wake mid-sleep: +${diff.toFixed(2)} lbs more next morning vs uninterrupted nights.`:`Night wake-ups don't impact next-day weight much for you.`});
    }
    const avgH=avg(sleepData.map(s=>s.hrs));
    ins.push({e:"⏰",t:"Average sleep duration",tag:"sleep",txt:`Average sleep: ${avgH.toFixed(1)} hrs across ${sleepData.length} logged nights. ${avgH>=7.5?"Solid.":avgH>=6.5?"Close to target.":"Below the 7-8hr sweet spot."}`});

    // Early vs late bedtime
    const earlyB=[],lateB=[];
    sorted.forEach((e,i)=>{if(i===0)return;const prev=sorted[i-1];if(prev.date<LS_START)return;const l=lf[prev.date]||{};if(!l.bed_time)return;const delta=e.weight-prev.weight;if(l.bed_time<"23:00")earlyB.push(delta);else lateB.push(delta);});
    if(earlyB.length>=MIN&&lateB.length>=MIN){
      const diff=avg(earlyB)-avg(lateB);
      ins.push({e:"🛌",t:"Early vs late bedtime",tag:"sleep",txt:diff<0?`Before 11pm: ${Math.abs(diff).toFixed(2)} lbs more loss next day vs late nights.`:`Late nights don't seem to hurt your weight loss.`});
    }
  }

  // ── ROSACEA ───────────────────────────────────────────────────────────────
  const rosEntries=lfVals.filter(e=>e.rosacea>0);
  if(rosEntries.length>=3){
    const a=avg(rosEntries.map(e=>e.rosacea));
    ins.push({e:"🌹",t:"Rosacea baseline",tag:"rosacea",txt:`Avg rosacea score: ${a.toFixed(1)}/10 across ${rosEntries.length} days. ${a<=3?"Mostly clear 🌿":a<=6?"Moderate.":"Frequently elevated."}`});
  }
  if(rosEntries.length>=MIN){
    const wD=rosEntries.filter(e=>e.drank),nD=rosEntries.filter(e=>e.drank===false);
    if(wD.length>=MIN&&nD.length>=MIN){
      const diff=avg(wD.map(e=>e.rosacea))-avg(nD.map(e=>e.rosacea));
      ins.push({e:"🍷",t:"Alcohol & rosacea",tag:"rosacea",txt:diff>0?`After drinking: rosacea ${diff.toFixed(1)} pts higher on avg.`:`Alcohol doesn't seem to worsen your rosacea based on current data.`});
    }
    const wS=rosEntries.filter(e=>e.high_sugar),nS=rosEntries.filter(e=>e.high_sugar===false);
    if(wS.length>=MIN&&nS.length>=MIN){
      const diff=avg(wS.map(e=>e.rosacea))-avg(nS.map(e=>e.rosacea));
      ins.push({e:"🍬",t:"High sugar & rosacea",tag:"rosacea",txt:diff>0?`High sugar days: rosacea ${diff.toFixed(1)} pts higher on avg.`:`High sugar doesn't seem to affect your rosacea.`});
    }
    const wM=rosEntries.filter(e=>e.red_meat),nM=rosEntries.filter(e=>e.red_meat===false);
    if(wM.length>=MIN&&nM.length>=MIN){
      const diff=avg(wM.map(e=>e.rosacea))-avg(nM.map(e=>e.rosacea));
      ins.push({e:"🥩",t:"Red meat & rosacea",tag:"rosacea",txt:diff>0?`Red meat days: rosacea ${diff.toFixed(1)} pts higher.`:`Red meat doesn't appear to worsen your rosacea.`});
    }
    // Exercise & rosacea
    const exRos=rosEntries.filter(e=>e.exercise==="workout"||e.exercise==="walk");
    const noExRos=rosEntries.filter(e=>!e.exercise||e.exercise==="none");
    if(exRos.length>=MIN&&noExRos.length>=MIN){
      const diff=avg(exRos.map(e=>e.rosacea))-avg(noExRos.map(e=>e.rosacea));
      ins.push({e:"🏃",t:"Exercise & rosacea",tag:"rosacea",txt:diff<0?`On days after exercise, rosacea scores ${Math.abs(diff).toFixed(1)} pts lower on average.`:`Exercise days don't seem to affect your rosacea much.`});
    }
    // Beta & rosacea
    const betaRos=rosEntries.filter(e=>e.beta),noBetaRos=rosEntries.filter(e=>e.beta===false);
    if(betaRos.length>=MIN&&noBetaRos.length>=MIN){
      const diff=avg(betaRos.map(e=>e.rosacea))-avg(noBetaRos.map(e=>e.rosacea));
      ins.push({e:"💊",t:"Beta & rosacea",tag:"rosacea",txt:diff<0?`On days you take beta, rosacea scores ${Math.abs(diff).toFixed(1)} pts lower. The beta blocker may be helping.`:`Beta days and non-beta days show similar rosacea scores so far.`});
    }
    // Rosacea trend
    if(rosEntries.length>=7){
      const half=Math.floor(rosEntries.length/2);
      const diff=avg(rosEntries.slice(-half).map(e=>e.rosacea))-avg(rosEntries.slice(0,half).map(e=>e.rosacea));
      ins.push({e:"📈",t:"Rosacea trend",tag:"rosacea",txt:diff<0?`Rosacea improving — scores ${Math.abs(diff).toFixed(1)} pts lower recently vs when you started tracking.`:`Rosacea scores slightly higher recently (${diff.toFixed(1)} pts). Keep tracking triggers.`});
    }
    // Clearest skin day of week
    const rossByDow=Array.from({length:7},()=>[]);
    rosEntries.forEach(e=>rossByDow[dow(e.date)].push(e.rosacea));
    const rdowA=rossByDow.map((a,i)=>a.length>=MIN?{dow:i,a:avg(a)}:null).filter(Boolean);
    if(rdowA.length>=3){
      const best=[...rdowA].sort((a,b)=>a.a-b.a)[0];
      ins.push({e:"✨",t:"Clearest skin day",tag:"rosacea",txt:`${DAYS[best.dow]}s are your clearest skin days on average (${best.a.toFixed(1)}/10).`});
    }
  }

  // ── PADRES ────────────────────────────────────────────────────────────────
  const padresEntries=lfVals.filter(l=>l.padres_win!==null&&l.padres_win!==undefined);
  if(padresEntries.length>=MIN){
    // Padres win vs next-day weight
    const winD=ndd(l=>l.padres_win===true),lossD=ndd(l=>l.padres_win===false);
    if(winD.length>=MIN&&lossD.length>=MIN){
      const diff=avg(winD)-avg(lossD);
      ins.push({e:"⚾",t:"Padres win & next-day weight",tag:"padres",txt:diff<0?`After a Padres W, you weigh ${Math.abs(diff).toFixed(2)} lbs less the next morning than after an L. Good vibes = good results.`:`After a Padres L, you actually weigh ${Math.abs(diff).toFixed(2)} lbs less. Stress eating skipped?`});
    }
    // Padres win & rosacea
    if(rosEntries.length>=MIN){
      const winRos=padresEntries.filter(l=>l.padres_win&&l.rosacea>0);
      const lossRos=padresEntries.filter(l=>l.padres_win===false&&l.rosacea>0);
      if(winRos.length>=MIN&&lossRos.length>=MIN){
        const diff=avg(winRos.map(l=>l.rosacea))-avg(lossRos.map(l=>l.rosacea));
        ins.push({e:"🏟️",t:"Padres wins & rosacea",tag:"padres",txt:diff<0?`Your rosacea scores ${Math.abs(diff).toFixed(1)} pts lower on Padres win days. Good mood = less inflammation?`:`Padres results don't seem to affect your rosacea.`});
      }
    }
    // Win/loss record
    const wins=padresEntries.filter(l=>l.padres_win).length;
    const losses=padresEntries.filter(l=>l.padres_win===false).length;
    if(wins+losses>=3)ins.push({e:"📊",t:"Padres record while tracking",tag:"padres",txt:`Padres are ${wins}-${losses} on days you've logged since tracking started. ${wins>losses?"Go Friars!":"Rough patch."}`});
    // Drink more after losses?
    if(lfVals.length>=5){
      const afterWin=lfVals.filter(l=>l.padres_win&&l.drank!==undefined);
      const afterLoss=lfVals.filter(l=>l.padres_win===false&&l.drank!==undefined);
      if(afterWin.length>=MIN&&afterLoss.length>=MIN){
        const winDrink=Math.round(afterWin.filter(l=>l.drank).length/afterWin.length*100);
        const lossDrink=Math.round(afterLoss.filter(l=>l.drank).length/afterLoss.length*100);
        if(Math.abs(winDrink-lossDrink)>=10)ins.push({e:"🍺⚾",t:"Padres losses & drinking",tag:"padres",txt:lossDrink>winDrink?`You drink ${lossDrink-winDrink}% more after a Padres loss than a win. Drowning sorrows confirmed.`:`You drink ${winDrink-lossDrink}% more after a Padres win. Celebrating!`});
      }
    }
  }

  // ── FIRST WORD / NUMBER ────────────────────────────────────────────────────
  const wordEntries=lfVals.filter(l=>l.first_word);
  if(wordEntries.length>=5){
    // Sentiment vs weight
    const posDays=wordEntries.filter(l=>wordSentiment(l.first_word)==="positive");
    const negDays=wordEntries.filter(l=>wordSentiment(l.first_word)==="negative");
    if(posDays.length>=MIN&&negDays.length>=MIN){
      const posW=avg(posDays.map(l=>l.weight)),negW=avg(negDays.map(l=>l.weight));
      ins.push({e:"💭",t:"Morning word sentiment & weight",tag:"mindset",txt:posW<negW?`On positive-word mornings your weight averages ${(negW-posW).toFixed(1)} lbs lower than negative-word mornings. Mind-body connection real.`:`Word sentiment and weight don't strongly correlate yet — keep logging.`});
    }
    // Most common word
    const wordCount={};wordEntries.forEach(l=>{const w=l.first_word.toLowerCase().trim();wordCount[w]=(wordCount[w]||0)+1;});
    const topWord=Object.entries(wordCount).sort((a,b)=>b[1]-a[1])[0];
    if(topWord&&topWord[1]>=2)ins.push({e:"🔤",t:"Most common morning word",tag:"mindset",txt:`Your most frequent morning word is "${topWord[0]}" — logged ${topWord[1]} times. ${wordSentiment(topWord[0])==="positive"?"Good energy.":wordSentiment(topWord[0])==="negative"?"Might be worth noticing.":"Neutral vibe."}`});
    // Long vs short words
    const longWords=wordEntries.filter(l=>l.first_word.length>=6);
    const shortWords=wordEntries.filter(l=>l.first_word.length<6);
    if(longWords.length>=MIN&&shortWords.length>=MIN){
      const longW=avg(longWords.map(l=>l.weight)),shortW=avg(shortWords.map(l=>l.weight));
      ins.push({e:"📏",t:"Word length & weight",tag:"mindset",txt:Math.abs(longW-shortW)>0.3?`On mornings you think of longer words, you weigh ${longW<shortW?`${(shortW-longW).toFixed(1)} lbs less`:`${(longW-shortW).toFixed(1)} lbs more`} on average. Probably meaningless but fun.`:`Word length and weight don't seem to correlate. As expected!`});
    }
    // Unique words
    const uniqueWords=new Set(wordEntries.map(l=>l.first_word.toLowerCase().trim()));
    ins.push({e:"📚",t:"Word variety",tag:"mindset",txt:`You've logged ${wordEntries.length} morning words with ${uniqueWords.size} unique ones. ${uniqueWords.size/wordEntries.length>0.8?"Very varied thinking.":uniqueWords.size/wordEntries.length>0.5?"Mix of recurring and new.":"Some words keep coming back."}`});
  }

  const numEntries=lfVals.filter(l=>l.first_number!=null);
  if(numEntries.length>=5){
    const avgNum=avg(numEntries.map(l=>l.first_number));
    ins.push({e:"🔢",t:"Average morning number",tag:"mindset",txt:`Your average first morning number is ${avgNum.toFixed(1)} across ${numEntries.length} logs. ${avgNum>50?"You think big.":avgNum>10?"Mid-range thinker.":"Low numbers dominate your mornings."}`});
    // High vs low numbers and weight
    const med=avgNum;
    const highNum=numEntries.filter(l=>l.first_number>med);
    const lowNum=numEntries.filter(l=>l.first_number<=med);
    if(highNum.length>=MIN&&lowNum.length>=MIN){
      const hW=avg(highNum.map(l=>l.weight)),lW=avg(lowNum.map(l=>l.weight));
      ins.push({e:"🔢⚖",t:"Morning number & weight",tag:"mindset",txt:Math.abs(hW-lW)>0.2?`On high-number mornings your weight averages ${hW<lW?`${(lW-hW).toFixed(1)} lbs lower`:`${(hW-lW).toFixed(1)} lbs higher`} than low-number mornings. Curious!`:`No clear link between your morning number and weight yet.`});
    }
    // Number after drinking
    if(lfVals.filter(l=>l.drank).length>=MIN){
      const drankNum=numEntries.filter(l=>l.drank);
      const soberNum=numEntries.filter(l=>l.drank===false);
      if(drankNum.length>=MIN&&soberNum.length>=MIN){
        const diff=avg(drankNum.map(l=>l.first_number))-avg(soberNum.map(l=>l.first_number));
        ins.push({e:"🍺🔢",t:"Drinking & morning number",tag:"mindset",txt:Math.abs(diff)>1?`After drinking, your first number averages ${Math.abs(diff).toFixed(0)} ${diff>0?"higher":"lower"} than sober mornings. ${diff>0?"More is more after drinks.":"Drinking keeps you grounded?"}`:`Drinking doesn't seem to affect your morning number.`});
      }
    }
  }

  // ── CROSS-SIGNAL FUN FACTS ────────────────────────────────────────────────

  // Variability
  if(sorted.length>=14){
    const deltas=sorted.slice(1).map((e,i)=>Math.abs(e.weight-sorted[i].weight));
    const v=avg(deltas);
    ins.push({e:"📊",t:"Daily weight variability",tag:"patterns",txt:`Avg day-to-day swing: ${v.toFixed(2)} lbs. ${v<0.5?"Very consistent data.":v<1?"Normal variability.":"High variability — water weight fluctuates a lot for you."}`});
  }

  // Acceleration
  if(sorted.length>=20){
    const mid=Math.floor(sorted.length/2);
    const r1=linReg(sorted.slice(0,mid)),r2=linReg(sorted.slice(mid));
    if(r1&&r2){
      const e1=r1.slope*7,r=r2.slope*7;
      if(Math.abs(e1-r)>0.1)ins.push({e:"🚀",t:"Pace acceleration",tag:"progress",txt:r<e1?`Losing faster now (${Math.abs(r).toFixed(2)} lbs/wk) than early on (${Math.abs(e1).toFixed(2)} lbs/wk). Zepbound compounding.`:`Pace slowed from ${Math.abs(e1).toFixed(2)} to ${Math.abs(r).toFixed(2)} lbs/wk. Normal as you approach goal.`});
    }
  }

  return ins;
}

function shuffleInsights(all,seed){
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
  const[insightSeed,setInsightSeed]=useState(()=>todayStr().split("-").reduce((a,b)=>a*31+parseInt(b),0));
  const[padresResult,setPadresResult]=useState(null);
  const[padresLoading,setPadresLoading]=useState(false);
  // form
  const[dt,setDt]=useState(todayStr());
  const[wt,setWt]=useState("");
  const[doseInp,setDoseInp]=useState("");
  const[drank,setDrank]=useState(false);
  const[redMeat,setRedMeat]=useState(false);
  const[delivery,setDelivery]=useState(false);
  const[highSugar,setHighSugar]=useState(false);
  const[exercise,setExercise]=useState("none"); // none | walk | workout
  const[beta,setBeta]=useState(false);
  const[meals,setMeals]=useState("");
  const[bedTime,setBedTime]=useState("");
  const[wakeTime,setWakeTime]=useState("");
  const[nightWake,setNightWake]=useState(false);
  const[rosacea,setRosacea]=useState(0);
  const[firstWord,setFirstWord]=useState("");
  const[firstNumber,setFirstNumber]=useState("");
  const[snoozed,setSnoozed]=useState(false);
  const[msg,setMsg]=useState("");

  // Load Supabase data
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

  // Load Padres result for yesterday
  useEffect(()=>{
    (async()=>{
      setPadresLoading(true);
      const result=await fetchPadresResult(yesterdayStr());
      setPadresResult(result);
      setPadresLoading(false);
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

  const overlayCD=useMemo(()=>{
    if(sorted.length<10)return null;
    const lastDate=sorted[sorted.length-1].date;
    const r30=sorted.filter(e=>diffDays(e.date,lastDate)<=30);
    const p30=sorted.filter(e=>diffDays(e.date,lastDate)>30&&diffDays(e.date,lastDate)<=60);
    if(r30.length<3||p30.length<3)return null;
    const maxLen=Math.max(r30.length,p30.length);
    return Array.from({length:maxLen},(_,i)=>({day:`Day ${i+1}`,"Recent 30":r30[i]!==undefined?r30[i].weight:null,"Prior 30":p30[i]!==undefined?p30[i].weight:null}));
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
  const shownInsights=useMemo(()=>shuffleInsights(allInsights,insightSeed),[allInsights,insightSeed]);

  async function addEntry(){
    const w=parseFloat(wt);if(!dt||isNaN(w)||w<=0)return;
    setSyncing(true);
    await sbUpsert("entries",[{date:dt,weight:w}]);
    setEntries([...(entries||[]).filter(e=>e.date!==dt),{date:dt,weight:w}]);
    const d=parseFloat(doseInp);
    if(!isNaN(d)&&d>0){await sbUpsert("doses",[{date:dt,mg:d}]);setDoses([...(doses||[]).filter(x=>x.date!==dt),{date:dt,mg:d}]);}
    const mc=parseInt(meals);
    const fn=parseInt(firstNumber);
    // save padres result if available (yesterday's game = today's log)
    const padresWin=padresResult?padresResult.won:null;
    const lfRow={date:dt,drank,red_meat:redMeat,delivery,high_sugar:highSugar,exercise,beta,meals:isNaN(mc)?null:mc,
      bed_time:bedTime||null,wake_time:wakeTime||null,night_wake:nightWake,rosacea:rosacea||null,
      first_word:firstWord.trim()||null,first_number:isNaN(fn)?null:fn,padres_win:padresWin,snoozed};
    await sbUpsert("lifestyle",[lfRow]);
    setLf(prev=>({...prev,[dt]:lfRow}));
    setWt("");setDoseInp("");setDrank(false);setRedMeat(false);setDelivery(false);setHighSugar(false);
    setExercise("none");setBeta(false);setMeals("");setBedTime("");setWakeTime("");setNightWake(false);
    setRosacea(0);setFirstWord("");setFirstNumber("");setSnoozed(false);setDt(todayStr());
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
  const TAG={patterns:"#7c3aed",habits:"#0891b2",records:"#b45309",lifestyle:"#065f46",medication:"#9f1239",progress:"#1d4ed8",rosacea:"#be185d",sleep:"#0e7490",padres:"#2d6a2e",mindset:"#6d28d9"};

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
                          label={{value:`${l.mg}mg`,fill:"#ffffff",fontSize:10,position:"insideTopLeft",fontWeight:600,style:{textShadow:"0 0 4px #000,0 0 4px #000"}}}/>
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
                          label={{value:`${l.mg}mg`,fill:"#ffffff",fontSize:10,position:"insideTopLeft",fontWeight:600,style:{textShadow:"0 0 4px #000,0 0 4px #000"}}}/>
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

              {overlayCD&&(
                <div className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>Recent 30 vs Prior 30 Days</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>Actual weight · same scale for direct comparison</div>
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

              {doses?.length>0&&(
                <div className="card" style={{padding:0,overflow:"hidden"}}>
                  <button onClick={()=>setDoseExpanded(!doseExpanded)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",background:"none",border:"none",color:C.text,fontFamily:"inherit",cursor:"pointer"}}>
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

            {/* Padres result banner */}
            {!padresLoading&&padresResult&&(
              <div style={{background:padresResult.won?"#0d2b0f":"#2b0d0d",border:`1px solid ${padresResult.won?"#2d6a2e":"#6a2d2d"}`,borderRadius:12,padding:"12px 18px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:22}}>⚾</span>
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:padresResult.won?C.green:C.red}}>
                    Padres {padresResult.won?"WIN":"LOSS"} — {padresResult.padresScore}–{padresResult.oppScore} {padresResult.won?"over":"vs"} {padresResult.oppName}
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>Yesterday · saved automatically with today's log</div>
                </div>
              </div>
            )}
            {padresLoading&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 18px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:14,height:14,border:`2px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
                <div style={{fontSize:13,color:C.muted}}>Checking yesterday's Padres result…</div>
              </div>
            )}

            <div className="card">
              <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Add Entry</div>

              {/* Weight hero */}
              <div style={{marginBottom:14}}>
                <div style={LS}>Weight (lbs)</div>
                <input className="inp" type="number" step="0.1" placeholder="xx.x" value={wt}
                  onChange={e=>setWt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEntry()}
                  style={{fontSize:28,fontWeight:700,textAlign:"center",padding:"12px 16px"}}/>
              </div>

              {/* Date — full width */}
              <div style={{marginBottom:10}}>
                <div style={LS}>Date</div>
                <input className="inp" type="date" value={dt} onChange={e=>setDt(e.target.value)}/>
              </div>

              {/* Dose — full width */}
              <div style={{marginBottom:14}}>
                <div style={LS}>Dose mg <span style={{color:C.dim,fontWeight:400,textTransform:"none"}}>(optional)</span></div>
                <input className="inp" type="number" step="0.25" placeholder="" value={doseInp} onChange={e=>setDoseInp(e.target.value)}/>
              </div>

              {/* First word + number — stacked */}
              <div style={{marginBottom:10}}>
                <div style={LS}>First word that comes to mind</div>
                <input className="inp" type="text" placeholder="" maxLength={20} value={firstWord} onChange={e=>setFirstWord(e.target.value.split(" ")[0])}/>
              </div>
              <div style={{marginBottom:20}}>
                <div style={LS}>First number that comes to mind</div>
                <input className="inp" type="number" placeholder="" value={firstNumber} onChange={e=>setFirstNumber(e.target.value)} style={{textAlign:"center",fontSize:18,fontWeight:600}}/>
              </div>

              {/* Habits */}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:16}}>
                <div style={{...LS,marginBottom:10}}>Yesterday's habits <span style={{color:C.dim,fontWeight:400,textTransform:"none"}}>(from Apr 14)</span></div>
                {[
                  {label:"Drank alcohol",emoji:"🍺",val:drank,set:setDrank},
                  {label:"High sugar",emoji:"🍬",val:highSugar,set:setHighSugar},
                  {label:"Ate red meat",emoji:"🥩",val:redMeat,set:setRedMeat},
                  {label:"Got delivery",emoji:"🛵",val:delivery,set:setDelivery},
                  {label:"Took beta",emoji:"💊",val:beta,set:setBeta},
                ].map(({label,emoji,val,set})=>(
                  <button key={label} onClick={()=>set(!val)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:val?"#1e2a45":C.card2,border:`1px solid ${val?C.accent:C.border}`,borderRadius:9,padding:"11px 14px",cursor:"pointer",transition:"all .15s",width:"100%",marginBottom:8}}>
                    <span style={{fontSize:14,color:val?C.text:C.muted,fontFamily:"inherit",fontWeight:500}}><span style={{marginRight:8}}>{emoji}</span>{label}</span>
                    <div style={{width:38,height:22,borderRadius:11,background:val?C.accent:C.border2,position:"relative",transition:"background .15s",flexShrink:0}}>
                      <div style={{position:"absolute",top:3,left:val?17:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
                    </div>
                  </button>
                ))}

                {/* Exercise 3-way */}
                <div style={{marginTop:4}}>
                  <div style={LS}>Exercise yesterday</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {[["none","😴 None"],["walk","🚶 Walk"],["workout","💪 Workout"]].map(([val,label])=>(
                      <button key={val} onClick={()=>setExercise(val)} style={{
                        padding:"10px 8px",borderRadius:9,border:`1.5px solid ${exercise===val?C.accent:C.border}`,
                        background:exercise===val?"#1e2a45":C.card2,color:exercise===val?C.text:C.muted,
                        fontFamily:"inherit",fontSize:13,fontWeight:exercise===val?600:400,transition:"all .15s"
                      }}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Meals — tap to select 1, 2, 3 */}
                <div style={{marginTop:12}}>
                  <div style={LS}>Meals eaten</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {["1","2","3"].map(n=>(
                      <button key={n} onClick={()=>setMeals(meals===n?"":n)} style={{
                        padding:"10px 8px",borderRadius:9,border:`1.5px solid ${meals===n?C.accent:C.border}`,
                        background:meals===n?"#1e2a45":C.card2,color:meals===n?C.text:C.muted,
                        fontFamily:"inherit",fontSize:16,fontWeight:meals===n?700:400,transition:"all .15s"
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sleep */}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:16}}>
                <div style={{...LS,marginBottom:10}}>
                  Last night's sleep
                  {sleepCalc!==null&&<span style={{color:C.green,fontWeight:600,textTransform:"none",marginLeft:8,fontSize:12}}>{sleepCalc} hrs</span>}
                </div>
                {/* Bed time — full width */}
                <div style={{marginBottom:10}}>
                  <div style={LS}>Bed time</div>
                  <input className="inp" type="time" value={bedTime} onChange={e=>setBedTime(e.target.value)} style={{textAlign:"center"}}/>
                </div>
                {/* Wake time — full width */}
                <div style={{marginBottom:10}}>
                  <div style={LS}>Wake up time</div>
                  <input className="inp" type="time" value={wakeTime} onChange={e=>setWakeTime(e.target.value)} style={{textAlign:"center"}}/>
                </div>
                {/* Night wake toggle */}
                <button onClick={()=>setNightWake(!nightWake)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:nightWake?"#1e2a45":C.card2,border:`1px solid ${nightWake?C.accent:C.border}`,borderRadius:9,padding:"11px 14px",cursor:"pointer",transition:"all .15s",width:"100%",marginBottom:8}}>
                  <span style={{fontSize:14,color:nightWake?C.text:C.muted,fontFamily:"inherit",fontWeight:500}}><span style={{marginRight:8}}>🌙</span>Woke up during the night</span>
                  <div style={{width:38,height:22,borderRadius:11,background:nightWake?C.accent:C.border2,position:"relative",transition:"background .15s",flexShrink:0}}>
                    <div style={{position:"absolute",top:3,left:nightWake?17:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
                  </div>
                </button>
                {/* Snooze toggle — this morning */}
                <button onClick={()=>setSnoozed(!snoozed)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:snoozed?"#1e2a45":C.card2,border:`1px solid ${snoozed?C.accent:C.border}`,borderRadius:9,padding:"11px 14px",cursor:"pointer",transition:"all .15s",width:"100%"}}>
                  <span style={{fontSize:14,color:snoozed?C.text:C.muted,fontFamily:"inherit",fontWeight:500}}><span style={{marginRight:8}}>⏰</span>Snoozed this morning</span>
                  <div style={{width:38,height:22,borderRadius:11,background:snoozed?C.accent:C.border2,position:"relative",transition:"background .15s",flexShrink:0}}>
                    <div style={{position:"absolute",top:3,left:snoozed?17:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
                  </div>
                </button>
              </div>

              {/* Rosacea */}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:20}}>
                <div style={{...LS,marginBottom:10}}>Rosacea today <span style={{color:C.dim,fontWeight:400,textTransform:"none",marginLeft:4}}>1 = clear · 10 = very red</span></div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <button key={n} onClick={()=>setRosacea(n===rosacea?0:n)} style={{width:40,height:40,borderRadius:8,border:`1.5px solid ${rosacea===n?C.accent:C.border}`,background:rosacea===n?"#1e2a45":C.card2,color:rosacea===n?C.text:C.muted,fontFamily:"inherit",fontSize:14,fontWeight:rosacea===n?700:400,transition:"all .12s"}}>{n}</button>
                  ))}
                </div>
                {rosacea>0&&<div style={{marginTop:8,fontSize:12,color:rosacea<=3?C.green:rosacea<=6?C.yellow:C.red}}>{rosacea<=3?"Clear day 🌿":rosacea<=6?"Moderate 🌹":"Elevated 🔴"}</div>}
              </div>

              {/* Save button at bottom */}
              <button className="btn" onClick={addEntry} style={{width:"100%"}}>{syncing?"Saving…":"Save Entry"}</button>
              {msg&&<div style={{marginTop:14,fontSize:13,color:C.green,fontWeight:500}}>{msg}</div>}
            </div>

            {/* Entry table */}
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
                    {["Date","Weight","Δ","Dose","🍺","🍬","🥩","🛵","💊","Ex","😴","Zz","Ros","Word","#",""].map(h=>(<th key={h} style={{padding:"7px 8px",textAlign:"left",fontSize:10,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>))}
                  </tr></thead>
                  <tbody>{[...sorted].reverse().map((e,i,arr)=>{
                    const prev=arr[i+1],delta=prev?e.weight-prev.weight:null;
                    const d=doses?.find(x=>x.date===e.date),lfd=lf[e.date]||{};
                    const hrs=sleepHrs(lfd.bed_time,lfd.wake_time);
                    const exIcon=lfd.exercise==="workout"?"💪":lfd.exercise==="walk"?"🚶":"";
                    return(<tr key={e.date} style={{borderBottom:`1px solid ${C.bg}`}}>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{fmtFull(e.date)}{doseDates.has(e.date)&&<span style={{color:C.inj,marginLeft:4,fontSize:10}}>💉</span>}</td>
                      <td style={{padding:"7px 8px",fontSize:14,fontWeight:600}}>{e.weight.toFixed(1)}</td>
                      <td style={{padding:"7px 8px",fontSize:13,fontWeight:500,color:delta===null?C.dim:delta<0?C.green:C.red}}>{delta===null?"—":`${delta>0?"+":""}${delta.toFixed(1)}`}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.accent,fontWeight:500}}>{d?`${d.mg}mg`:""}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted}}>{lfd.drank?"✓":""}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted}}>{lfd.high_sugar?"✓":""}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted}}>{lfd.red_meat?"✓":""}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted}}>{lfd.delivery?"✓":""}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted}}>{lfd.beta?"✓":""}</td>
                      <td style={{padding:"7px 8px",fontSize:13}}>{exIcon}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted}}>{lfd.night_wake?"✓":""}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>{hrs!==null?`${hrs}h`:""}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:lfd.rosacea>6?C.red:lfd.rosacea>3?C.yellow:lfd.rosacea>0?C.green:C.dim,fontWeight:lfd.rosacea>0?600:400}}>{lfd.rosacea||""}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted,fontStyle:"italic"}}>{lfd.first_word||""}</td>
                      <td style={{padding:"7px 8px",fontSize:12,color:C.muted}}>{lfd.first_number!=null?lfd.first_number:""}</td>
                      <td style={{padding:"7px 8px"}}><button className="del" onClick={()=>deleteEntry(e.date)}>×</button></td>
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
                <div style={{fontSize:13,color:C.muted,marginTop:4}}>5 from your data · shuffle for new ones · more unlock as data builds</div>
              </div>
              <button className="btn-sm" onClick={()=>setInsightSeed(s=>s+Math.floor(Math.random()*1000)+1)} style={{fontSize:13,padding:"8px 16px"}}>🔀 Shuffle</button>
            </div>
            {shownInsights.length===0?(
              <div className="card" style={{textAlign:"center",padding:"50px 24px",color:C.dim}}>
                <div style={{fontSize:32,marginBottom:12}}>🔍</div>
                <div style={{fontSize:14,marginBottom:6}}>Not enough data yet.</div>
                <div style={{fontSize:13}}>Keep logging — insights unlock as patterns emerge.</div>
              </div>
            ):(
              <>
                {shownInsights.map((ins,i)=>(
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
                  {allInsights.length} insights available · showing 5
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
