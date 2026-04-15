import { useState, useEffect, useMemo, useCallback } from "react";
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart, LineChart } from "recharts";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SB_URL = "https://ttvkmboqksmvpwqjrvcq.supabase.co";
const SB_KEY = "sb_publishable_9FCXwreAovIEtvnmOfHa9w_5KyjqdPG";
const sbHeaders = { "Content-Type": "application/json", "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };

async function sbGet(table, select="*") {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?select=${select}&order=date.asc`, { headers: sbHeaders });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
async function sbUpsert(table, data) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...sbHeaders, "Prefer": "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(data)
    });
    return r.ok;
  } catch { return false; }
}
async function sbDelete(table, date) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?date=eq.${date}`, { method: "DELETE", headers: sbHeaders });
    return r.ok;
  } catch { return false; }
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_ENTRIES = [
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
const SEED_DOSES = [
  {date:"2026-02-09",mg:2.5},{date:"2026-02-16",mg:2.5},{date:"2026-02-23",mg:2.5},
  {date:"2026-03-02",mg:2.5},{date:"2026-03-09",mg:3.0},{date:"2026-03-16",mg:3.25},
  {date:"2026-03-23",mg:3.5},{date:"2026-03-30",mg:5.0},{date:"2026-04-06",mg:5.0},
  {date:"2026-04-13",mg:5.5},
];

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const LIFESTYLE_START = "2026-04-14";
const C = { // color tokens — lighter dark palette
  bg:     "#161b27",
  card:   "#1e253a",
  card2:  "#252d42",
  border: "#2e3650",
  border2:"#3a4460",
  text:   "#e8edf5",
  muted:  "#8892a4",
  dim:    "#4a5568",
  accent: "#6366f1",
  accentL:"#818cf8",
  green:  "#34d399",
  red:    "#f87171",
  yellow: "#fbbf24",
  inj:    "#f59e0b",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function fmtShort(s){const[,m,d]=s.split("-");return`${parseInt(m)}/${parseInt(d)}`;}
function fmtMon(s){const[y,m]=s.split("-");return["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]+` '${y.slice(2)}`;}
function fmtFull(s){const[y,m,d]=s.split("-");const mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return`${mo[parseInt(m)-1]} ${parseInt(d)}, ${y}`;}
function getWeekKey(ds){const d=new Date(ds+"T12:00:00"),day=d.getDay(),mon=new Date(d);mon.setDate(d.getDate()-day+(day===0?-6:1));return mon.toISOString().split("T")[0];}
function getMonthKey(ds){return ds.slice(0,7);}
function dayOfWeek(ds){return new Date(ds+"T12:00:00").getDay();}
function addDays(ds,n){const d=new Date(ds+"T12:00:00");d.setDate(d.getDate()+n);return d.toISOString().split("T")[0];}
function diffDays(a,b){return Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/86400000);}
function sleepHours(bed,wake){
  if(!bed||!wake) return null;
  const [bh,bm]=bed.split(":").map(Number);
  const [wh,wm]=wake.split(":").map(Number);
  let mins=(wh*60+wm)-(bh*60+bm);
  if(mins<0) mins+=1440;
  return Math.round(mins/6)/10;
}

function linReg(arr){
  const n=arr.length; if(n<3) return null;
  const ys=arr.map(e=>e.weight);
  const sumX=(n*(n-1))/2,sumY=ys.reduce((a,b)=>a+b,0);
  const sumXY=ys.reduce((s,y,i)=>s+i*y,0),sumXX=(n*(n-1)*(2*n-1))/6;
  const denom=n*sumXX-sumX*sumX; if(!denom) return null;
  const slope=(n*sumXY-sumX*sumY)/denom,intercept=(sumY-slope*sumX)/n;
  const yMean=sumY/n,ssTot=ys.reduce((s,y)=>s+(y-yMean)**2,0);
  const ssRes=ys.reduce((s,y,i)=>s+(y-(slope*i+intercept))**2,0);
  return{slope,intercept,r2:ssTot===0?0:Math.max(0,1-ssRes/ssTot)};
}

function rollingAvg(sorted, window=7){
  return sorted.map((_,i,arr)=>{
    const slice=arr.slice(Math.max(0,i-window+1),i+1);
    return parseFloat((slice.reduce((s,e)=>s+e.weight,0)/slice.length).toFixed(2));
  });
}

// ─── Insights ─────────────────────────────────────────────────────────────────
function buildInsights(sorted, lfMap, doses){
  if(!sorted.length) return [];
  const insights=[];
  const lf=lfMap||{};

  function nextDayDelta(condFn){
    const deltas=[];
    sorted.forEach((e,i)=>{
      if(i===0) return;
      const prev=sorted[i-1];
      if(prev.date<LIFESTYLE_START) return;
      const lfPrev=lf[prev.date]||{};
      if(condFn(lfPrev)) deltas.push(e.weight-prev.weight);
    });
    return deltas;
  }

  // Day of week patterns
  const byDow=Array.from({length:7},()=>[]);
  sorted.forEach((e,i)=>{if(i===0)return;byDow[dayOfWeek(e.date)].push(e.weight-sorted[i-1].weight);});
  const dowAvgs=byDow.map((arr,i)=>arr.length>0?{dow:i,avg:arr.reduce((a,b)=>a+b,0)/arr.length,n:arr.length}:null).filter(Boolean);
  if(dowAvgs.length>=3){
    const s=[...dowAvgs].sort((a,b)=>a.avg-b.avg);
    insights.push({emoji:"📅",title:"Best weigh-in day",tag:"patterns",text:`${DAYS[s[0].dow]}s are your best day — avg ${Math.abs(s[0].avg).toFixed(2)} lbs down vs the day before.`});
    insights.push({emoji:"😬",title:"Toughest weigh-in day",tag:"patterns",text:`${DAYS[s[s.length-1].dow]}s are your toughest — avg ${s[s.length-1].avg>0?"+":""}${s[s.length-1].avg.toFixed(2)} lbs.`});
  }

  // Injection day insights
  if(doses&&doses.length>=2){
    const injDates=new Set(doses.map(d=>d.date));
    const dayBeforeInj=[],dayAfterInj=[],dayOfInj=[];
    sorted.forEach((e,i)=>{
      if(i===0) return;
      const delta=e.weight-sorted[i-1].weight;
      const tomorrow=addDays(e.date,1);
      const yesterday=addDays(e.date,-1);
      if(injDates.has(tomorrow)) dayBeforeInj.push(delta);
      if(injDates.has(yesterday)) dayAfterInj.push(delta);
      if(injDates.has(e.date)) dayOfInj.push(delta);
    });
    if(dayBeforeInj.length>=2){
      const avg=dayBeforeInj.reduce((a,b)=>a+b,0)/dayBeforeInj.length;
      insights.push({emoji:"💉",title:"Day before injection",tag:"medication",text:`The day before your shot you average ${avg<0?`${Math.abs(avg).toFixed(2)} lbs down`:`+${avg.toFixed(2)} lbs`}. ${avg<0?"Good momentum going in.":"Might be worth watching sodium the day before."}`});
    }
    if(dayAfterInj.length>=2){
      const avg=dayAfterInj.reduce((a,b)=>a+b,0)/dayAfterInj.length;
      insights.push({emoji:"📉",title:"Day after injection",tag:"medication",text:`The morning after your shot you average ${avg<0?`${Math.abs(avg).toFixed(2)} lbs down`:`+${avg.toFixed(2)} lbs`}. ${avg<0?"Zepbound is working fast.":"Day-after gains often reverse within 2–3 days."}`});
    }
    // Dose escalation effect
    const sortedDoses=[...doses].sort((a,b)=>a.date.localeCompare(b.date));
    let bestImpact=null;
    sortedDoses.forEach((dose,i)=>{
      if(i===0) return;
      const prev=sortedDoses[i-1]; if(dose.mg<=prev.mg) return;
      const before=sorted.filter(e=>e.date>=addDays(dose.date,-14)&&e.date<dose.date);
      const after=sorted.filter(e=>e.date>dose.date&&e.date<=addDays(dose.date,14));
      if(before.length>=3&&after.length>=3){
        const rb=linReg(before),ra=linReg(after);
        if(rb&&ra){const impact=(ra.slope-rb.slope)*7;if(!bestImpact||Math.abs(impact)>Math.abs(bestImpact.impact))bestImpact={impact,from:prev.mg,to:dose.mg,date:dose.date};}
      }
    });
    if(bestImpact) insights.push({emoji:"⚡",title:"Best dose escalation",tag:"medication",text:bestImpact.impact<0?`Your ${bestImpact.from}→${bestImpact.to}mg bump on ${fmtFull(bestImpact.date)} accelerated loss by ~${Math.abs(bestImpact.impact).toFixed(2)} lbs/week.`:`Your ${bestImpact.from}→${bestImpact.to}mg change on ${fmtFull(bestImpact.date)} was followed by a slower week — normal adjustment period.`});
  }

  // Alcohol
  const drankD=nextDayDelta(l=>l.drank===true),soberD=nextDayDelta(l=>l.drank===false&&l.drank!==undefined);
  if(drankD.length>=2&&soberD.length>=2){
    const diff=(drankD.reduce((a,b)=>a+b,0)/drankD.length)-(soberD.reduce((a,b)=>a+b,0)/soberD.length);
    insights.push({emoji:"🍺",title:"Alcohol & next-day weight",tag:"habits",text:diff>0?`After drinking, you weigh ${diff.toFixed(2)} lbs more the next morning on average vs. sober nights.`:`Surprisingly, after drinking you're ${Math.abs(diff).toFixed(2)} lbs lighter the next morning on average.`});
  }

  // Delivery
  const delivD=nextDayDelta(l=>l.delivery===true),noDelivD=nextDayDelta(l=>l.delivery===false&&l.delivery!==undefined);
  if(delivD.length>=2&&noDelivD.length>=2){
    const diff=(delivD.reduce((a,b)=>a+b,0)/delivD.length)-(noDelivD.reduce((a,b)=>a+b,0)/noDelivD.length);
    insights.push({emoji:"🛵",title:"Food delivery & next-day weight",tag:"habits",text:diff>0?`Days after ordering delivery, you average +${diff.toFixed(2)} lbs vs. cooking at home.`:`Days after ordering delivery, you're actually down ${Math.abs(diff).toFixed(2)} lbs vs. home-cooked days.`});
  }

  // Red meat
  const meatD=nextDayDelta(l=>l.red_meat===true),noMeatD=nextDayDelta(l=>l.red_meat===false&&l.red_meat!==undefined);
  if(meatD.length>=2&&noMeatD.length>=2){
    const diff=(meatD.reduce((a,b)=>a+b,0)/meatD.length)-(noMeatD.reduce((a,b)=>a+b,0)/noMeatD.length);
    insights.push({emoji:"🥩",title:"Red meat & next-day weight",tag:"habits",text:diff>0?`After eating red meat, you weigh ${diff.toFixed(2)} lbs more the next morning.`:`Red meat days are followed by lighter mornings — down ${Math.abs(diff).toFixed(2)} lbs on average.`});
  }

  // Drinking frequency
  const lfDates=sorted.filter(e=>e.date>=LIFESTYLE_START).map(e=>e.date);
  const lfVals=lfDates.map(d=>lf[d]).filter(Boolean);
  if(lfVals.length>=5){
    const pct=Math.round((lfVals.filter(l=>l.drank).length/lfVals.length)*100);
    insights.push({emoji:"🥃",title:"Drinking frequency",tag:"lifestyle",text:`You've drank on ${pct}% of logged nights since Apr 14 — ${lfVals.filter(l=>l.drank).length} out of ${lfVals.length} entries.`});
  }

  // Sleep quality
  const sleepEntries=[];
  sorted.forEach((e,i)=>{
    if(i===0) return;
    const prev=sorted[i-1]; if(prev.date<LIFESTYLE_START) return;
    const lfPrev=lf[prev.date]||{};
    const hrs=sleepHours(lfPrev.bed_time,lfPrev.wake_time);
    if(hrs!==null) sleepEntries.push({hrs,delta:e.weight-prev.weight,nightWake:lfPrev.night_wake});
  });
  if(sleepEntries.length>=5){
    const good=sleepEntries.filter(s=>s.hrs>=7),poor=sleepEntries.filter(s=>s.hrs<7);
    if(good.length>=2&&poor.length>=2){
      const goodAvg=good.reduce((a,b)=>a+b.delta,0)/good.length;
      const poorAvg=poor.reduce((a,b)=>a+b.delta,0)/poor.length;
      insights.push({emoji:"😴",title:"Sleep & weight loss",tag:"habits",text:goodAvg<poorAvg?`On nights with 7+ hrs of sleep you lose ${Math.abs(goodAvg-poorAvg).toFixed(2)} lbs more the next day vs. short nights. Sleep matters.`:`Interestingly, shorter sleep nights don't seem to hurt your next-day weight much. Worth watching over time.`});
    }
    const wakeEntries=sleepEntries.filter(s=>s.nightWake===true),noWake=sleepEntries.filter(s=>s.nightWake===false);
    if(wakeEntries.length>=2&&noWake.length>=2){
      const wAvg=wakeEntries.reduce((a,b)=>a+b.delta,0)/wakeEntries.length;
      const nwAvg=noWake.reduce((a,b)=>a+b.delta,0)/noWake.length;
      insights.push({emoji:"🌙",title:"Night wake-ups & weight",tag:"habits",text:wAvg>nwAvg?`Nights you wake up mid-sleep, you weigh ${Math.abs(wAvg-nwAvg).toFixed(2)} lbs more the next morning vs. uninterrupted nights.`:`Surprisingly, waking at night doesn't seem to affect next-day weight much for you.`});
    }
  }

  // Rosacea
  const rosaceaEntries=lfDates.map(d=>lf[d]).filter(l=>l&&l.rosacea!=null&&l.rosacea>0);
  if(rosaceaEntries.length>=5){
    const withDrink=rosaceaEntries.filter(l=>l.drank),noDrink=rosaceaEntries.filter(l=>!l.drank&&l.drank!==undefined);
    if(withDrink.length>=2&&noDrink.length>=2){
      const dA=withDrink.reduce((a,b)=>a+b.rosacea,0)/withDrink.length;
      const ndA=noDrink.reduce((a,b)=>a+b.rosacea,0)/noDrink.length;
      insights.push({emoji:"🌹",title:"Alcohol & rosacea",tag:"rosacea",text:dA>ndA?`On days after drinking, your rosacea score averages ${dA.toFixed(1)} vs. ${ndA.toFixed(1)} on sober nights — ${(dA-ndA).toFixed(1)} pts worse.`:`Alcohol doesn't seem to worsen your rosacea based on your data so far.`});
    }
    const avgRos=rosaceaEntries.reduce((a,b)=>a+b.rosacea,0)/rosaceaEntries.length;
    insights.push({emoji:"📊",title:"Rosacea baseline",tag:"rosacea",text:`Your average rosacea score is ${avgRos.toFixed(1)}/10 across ${rosaceaEntries.length} logged days. ${avgRos<=3?"Mostly clear days.":avgRos<=6?"Moderate — keep tracking triggers.":"Frequently elevated — worth reviewing your trigger log."}`});
    // Red meat & rosacea
    const withMeat=rosaceaEntries.filter(l=>l.red_meat),noMeat=rosaceaEntries.filter(l=>!l.red_meat&&l.red_meat!==undefined);
    if(withMeat.length>=2&&noMeat.length>=2){
      const mA=withMeat.reduce((a,b)=>a+b.rosacea,0)/withMeat.length;
      const nmA=noMeat.reduce((a,b)=>a+b.rosacea,0)/noMeat.length;
      insights.push({emoji:"🥩",title:"Red meat & rosacea",tag:"rosacea",text:mA>nmA?`Red meat days are followed by a rosacea score of ${mA.toFixed(1)} vs. ${nmA.toFixed(1)} on non-meat days.`:`Red meat doesn't appear to worsen your rosacea in your data so far.`});
    }
  }

  // Biggest drop / gain
  let bigLoss=null,bigGain=null;
  sorted.forEach((e,i)=>{if(i===0)return;const d=e.weight-sorted[i-1].weight;if(!bigLoss||d<bigLoss.d)bigLoss={d,date:e.date};if(!bigGain||d>bigGain.d)bigGain={d,date:e.date};});
  if(bigLoss) insights.push({emoji:"🏆",title:"Biggest single-day drop",tag:"records",text:`Your best day was ${fmtFull(bigLoss.date)} — down ${Math.abs(bigLoss.d).toFixed(1)} lbs in 24 hours.`});
  if(bigGain&&bigGain.d>0) insights.push({emoji:"📈",title:"Biggest single-day spike",tag:"records",text:`Your biggest gain was ${fmtFull(bigGain.date)} — up ${bigGain.d.toFixed(1)} lbs overnight. Probably sodium.`});

  // Longest streak
  let cur=1,max=0,mStart="",mEnd="";
  sorted.forEach((e,i)=>{if(i===0)return;if(e.weight<sorted[i-1].weight){cur++;if(cur>max){max=cur;mEnd=e.date;mStart=sorted[i-cur+1].date;}}else cur=1;});
  if(max>=3) insights.push({emoji:"🔥",title:"Longest losing streak",tag:"records",text:`Your best run was ${max} consecutive days down, from ${fmtFull(mStart)} to ${fmtFull(mEnd)}.`});

  // Weekday vs weekend
  const wdD=[],weD=[];
  sorted.forEach((e,i)=>{if(i===0)return;const d=e.weight-sorted[i-1].weight,dow=dayOfWeek(e.date);if(dow===0||dow===6)weD.push(d);else wdD.push(d);});
  if(wdD.length>=3&&weD.length>=3){
    const wdA=wdD.reduce((a,b)=>a+b,0)/wdD.length,weA=weD.reduce((a,b)=>a+b,0)/weD.length;
    insights.push({emoji:"📆",title:"Weekdays vs. weekends",tag:"patterns",text:wdA<weA?`You trend ${Math.abs(wdA-weA).toFixed(2)} lbs better on weekdays than weekends. Structure helps.`:`Weekends work better for you — down ${Math.abs(weA-wdA).toFixed(2)} lbs more per day than weekdays.`});
  }

  // Pace
  if(sorted.length>=10){
    const first=sorted[0],last=sorted[sorted.length-1],days=diffDays(first.date,last.date),lost=first.weight-last.weight;
    if(lost>0) insights.push({emoji:"🎯",title:"Pace check",tag:"progress",text:`You've lost ${lost.toFixed(1)} lbs in ${days} days — ${(lost/(days/30)).toFixed(1)} lbs/month on average.`});
  }

  // Plateau / momentum
  const l14=sorted.slice(-14);
  if(l14.length>=7){
    const ws=l14.map(e=>e.weight),range=Math.max(...ws)-Math.min(...ws),delta=ws[ws.length-1]-ws[0];
    if(range<1.5) insights.push({emoji:"🏔️",title:"Plateau alert",tag:"patterns",text:`Weight has stayed within a ${range.toFixed(1)} lb range over your last ${l14.length} entries. Normal on GLP-1s.`});
    else insights.push({emoji:"📉",title:"Recent momentum",tag:"progress",text:`Over your last ${l14.length} weigh-ins you're ${delta<0?"down":"up"} ${Math.abs(delta).toFixed(1)} lbs total.`});
  }

  // Consistency
  if(sorted.length>=10){
    const span=diffDays(sorted[0].date,sorted[sorted.length-1].date)+1;
    const rate=Math.round((sorted.length/span)*100);
    insights.push({emoji:"📓",title:"Logging consistency",tag:"lifestyle",text:`${sorted.length} weigh-ins over ${span} days — ${rate}% of days. ${rate>=80?"Great consistency.":rate>=50?"Decent, but more = better predictions.":"More frequent logging sharpens predictions."}`});
  }

  return insights;
}

function getDailyInsights(all){
  if(!all.length) return [];
  const seed=todayStr().split("-").reduce((a,b)=>a*31+parseInt(b),0);
  const arr=[...all];
  for(let i=arr.length-1;i>0;i--){const j=(seed*(i+7))%arr.length;[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr.slice(0,Math.min(5,arr.length));
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(entries, doses, lfMap){
  const doseByDate=Object.fromEntries((doses||[]).map(d=>[d.date,d.mg]));
  const lf=lfMap||{};
  const headers=["date","weight","dose_mg","drank","red_meat","delivery","meals","bed_time","wake_time","night_wake","rosacea","sleep_hrs"];
  const rows=entries.map(e=>{
    const l=lf[e.date]||{};
    const hrs=sleepHours(l.bed_time,l.wake_time);
    return[e.date,e.weight,doseByDate[e.date]??"",l.drank??"",l.red_meat??"",l.delivery??"",l.meals??"",l.bed_time??"",l.wake_time??"",l.night_wake??"",l.rosacea??"",hrs??""
    ].join(",");
  });
  const csv=[headers.join(","),...rows].join("\n");
  const a=document.createElement("a");
  a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
  a.download=`zepbound-${todayStr()}.csv`;
  a.click();
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const Tip=({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 14px",fontSize:13}}>
      <div style={{color:C.muted,marginBottom:5,fontSize:12}}>{label}</div>
      {payload.map((p,i)=>p.value!=null&&(
        <div key={i} style={{color:p.color||C.text,fontWeight:600,marginTop:2}}>{p.name}: {typeof p.value==="number"?p.value.toFixed(1):p.value}</div>
      ))}
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App(){
  const[entries,  setEntries]  =useState(null);
  const[doses,    setDoses]    =useState(null);
  const[lfMap,    setLfMap]    =useState({});   // { "2026-04-14": {...} }
  const[tab,      setTab]      =useState("chart");
  const[chartView,setChartView]=useState("all");
  const[syncing,  setSyncing]  =useState(false);
  const[syncMsg,  setSyncMsg]  =useState("");
  // form
  const[dt,       setDt]       =useState(todayStr());
  const[wt,       setWt]       =useState("");
  const[doseInp,  setDoseInp]  =useState("");
  const[drank,    setDrank]    =useState(false);
  const[redMeat,  setRedMeat]  =useState(false);
  const[delivery, setDelivery] =useState(false);
  const[meals,    setMeals]    =useState("");
  const[bedTime,  setBedTime]  =useState("");
  const[wakeTime, setWakeTime] =useState("");
  const[nightWake,setNightWake]=useState(false);
  const[rosacea,  setRosacea]  =useState(0);
  const[msg,      setMsg]      =useState("");

  // Load from Supabase on mount, seed if empty
  useEffect(()=>{
    (async()=>{
      setSyncing(true);
      let e=await sbGet("entries");
      let d=await sbGet("doses");
      let l=await sbGet("lifestyle");
      // Seed if empty
      if(e&&e.length===0){await sbUpsert("entries",SEED_ENTRIES);e=await sbGet("entries");}
      if(d&&d.length===0){await sbUpsert("doses",SEED_DOSES);d=await sbGet("doses");}
      if(e) setEntries(e);
      if(d) setDoses(d);
      if(l){
        const map={};
        l.forEach(row=>{map[row.date]=row;});
        setLfMap(map);
      }
      setSyncing(false);
    })();
  },[]);

  const sorted=useMemo(()=>entries?[...entries].sort((a,b)=>a.date.localeCompare(b.date)):[], [entries]);
  const doseDates=useMemo(()=>new Set((doses||[]).map(d=>d.date)),[doses]);

  const stats=useMemo(()=>{
    if(!sorted.length) return null;
    const ws=sorted.map(e=>e.weight);
    const first=ws[0],last=ws[ws.length-1];
    const reg=linReg(sorted);
    const weekly=reg?Math.abs(reg.slope*7):0;
    const recent=sorted.slice(-7),prev7=sorted.slice(-14,-7);
    const avg7=recent.reduce((s,e)=>s+e.weight,0)/recent.length;
    const avgP=prev7.length?prev7.reduce((s,e)=>s+e.weight,0)/prev7.length:null;
    const span=diffDays(sorted[0].date,sorted[sorted.length-1].date)+1;
    return{first,last,lost:first-last,weekly,change7:avgP!=null?avg7-avgP:null,count:sorted.length,span};
  },[sorted]);

  const allChartData=useMemo(()=>{
    const reg=linReg(sorted);
    const mavg=rollingAvg(sorted,7);
    return sorted.map((e,i)=>({
      date:fmtShort(e.date),fullDate:e.date,
      Weight:e.weight,
      Trend:reg?parseFloat((reg.slope*i+reg.intercept).toFixed(2)):undefined,
      "7d Avg":mavg[i],
    }));
  },[sorted]);

  const weekChartData=useMemo(()=>{
    const map={};
    sorted.forEach(e=>{const wk=getWeekKey(e.date);if(!map[wk])map[wk]={date:wk,weights:[]};map[wk].weights.push(e.weight);});
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date)).map((w,i,arr)=>{
      const avg=w.weights.reduce((s,v)=>s+v,0)/w.weights.length;
      const prev=arr[i-1],prevAvg=prev?prev.weights.reduce((s,v)=>s+v,0)/prev.weights.length:null;
      return{date:"Wk "+fmtShort(w.date),"Avg Weight":parseFloat(avg.toFixed(1)),"WoW Change":prevAvg!=null?parseFloat((avg-prevAvg).toFixed(1)):null};
    });
  },[sorted]);

  const monthChartData=useMemo(()=>{
    const map={};
    sorted.forEach(e=>{const mk=getMonthKey(e.date);if(!map[mk])map[mk]={date:mk,weights:[]};map[mk].weights.push(e.weight);});
    return Object.values(map).sort((a,b)=>a.date.localeCompare(b.date)).map((m,i,arr)=>{
      const avg=m.weights.reduce((s,v)=>s+v,0)/m.weights.length;
      const lo=Math.min(...m.weights),hi=Math.max(...m.weights);
      const prev=arr[i-1],prevAvg=prev?prev.weights.reduce((s,v)=>s+v,0)/prev.weights.length:null;
      return{date:fmtMon(m.date),"Avg Weight":parseFloat(avg.toFixed(1)),"MoM Change":prevAvg!=null?parseFloat((avg-prevAvg).toFixed(1)):null,Low:parseFloat(lo.toFixed(1)),High:parseFloat(hi.toFixed(1))};
    });
  },[sorted]);

  const overlayData=useMemo(()=>{
    if(sorted.length<10) return null;
    const lastDate=sorted[sorted.length-1].date;
    const r30=sorted.filter(e=>diffDays(e.date,lastDate)<=30);
    const p30=sorted.filter(e=>diffDays(e.date,lastDate)>30&&diffDays(e.date,lastDate)<=60);
    if(r30.length<3||p30.length<3) return null;
    const norm=(arr)=>arr.map((_e,i)=>({idx:i,val:parseFloat((_e.weight-arr[0].weight).toFixed(2))}));
    const r=norm(r30),p=norm(p30);
    return Array.from({length:Math.max(r.length,p.length)},(_,i)=>({
      day:`Day ${i+1}`,"Recent 30":r[i]!==undefined?r[i].val:null,"Prior 30":p[i]!==undefined?p[i].val:null,
    }));
  },[sorted]);

  const yDomain=useMemo(()=>{
    if(!sorted.length) return[190,215];
    const ws=sorted.map(e=>e.weight);
    return[Math.floor(Math.min(...ws)-2),Math.ceil(Math.max(...ws)+2)];
  },[sorted]);

  // Injection reference lines for all-time chart
  const injRefLines=useMemo(()=>{
    if(!doses||!allChartData.length) return [];
    return doses.map(d=>{
      const idx=allChartData.findIndex(c=>c.fullDate===d.date);
      return idx>=0?{x:allChartData[idx].date,mg:d.mg}:null;
    }).filter(Boolean);
  },[doses,allChartData]);

  const allInsights=useMemo(()=>buildInsights(sorted,lfMap,doses),[sorted,lfMap,doses]);
  const dailyInsights=useMemo(()=>getDailyInsights(allInsights),[allInsights]);
  const currentDose=useMemo(()=>doses?.length?[...doses].sort((a,b)=>b.date.localeCompare(a.date))[0]:null,[doses]);
  const sleepCalc=useMemo(()=>sleepHours(bedTime,wakeTime),[bedTime,wakeTime]);

  async function addEntry(){
    const w=parseFloat(wt);
    if(!dt||isNaN(w)||w<=0) return;
    setSyncing(true);
    // Entry
    const newEntry={date:dt,weight:w};
    await sbUpsert("entries",[newEntry]);
    const newEntries=[...(entries||[]).filter(e=>e.date!==dt),newEntry];
    setEntries(newEntries);
    // Dose
    const d=parseFloat(doseInp);
    if(!isNaN(d)&&d>0){
      await sbUpsert("doses",[{date:dt,mg:d}]);
      setDoses([...(doses||[]).filter(x=>x.date!==dt),{date:dt,mg:d}]);
    }
    // Lifestyle
    const mc=parseInt(meals);
    const lfRow={date:dt,drank,red_meat:redMeat,delivery,meals:isNaN(mc)?null:mc,bed_time:bedTime||null,wake_time:wakeTime||null,night_wake:nightWake,rosacea:rosacea||null};
    await sbUpsert("lifestyle",[lfRow]);
    setLfMap(prev=>({...prev,[dt]:lfRow}));
    // Reset
    setWt("");setDoseInp("");setDrank(false);setRedMeat(false);setDelivery(false);
    setMeals("");setBedTime("");setWakeTime("");setNightWake(false);setRosacea(0);
    setDt(todayStr());setSyncing(false);
    setMsg("Saved ✓");setTimeout(()=>setMsg(""),2000);
  }

  async function deleteEntry(date){
    await sbDelete("entries",date);
    setEntries((entries||[]).filter(e=>e.date!==date));
  }

  const LS={fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5};
  const TAG={patterns:"#7c3aed",habits:"#0891b2",records:"#b45309",lifestyle:"#065f46",medication:"#9f1239",progress:"#1d4ed8",rosacea:"#be185d"};

  if(entries===null) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"Inter,sans-serif",flexDirection:"column",gap:12}}>
      <div style={{width:32,height:32,border:`3px solid ${C.accent}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{fontSize:13}}>Connecting to database…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

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

      {/* ── Header ── */}
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
            {!stats?(
              <div className="card" style={{textAlign:"center",padding:"60px 24px",color:C.dim}}>No data yet.</div>
            ):(<>
              {/* Stats 2×3 */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[
                  {l:"Current",    v:`${stats.last.toFixed(1)}`,         u:"lbs",    c:C.text},
                  {l:"Total Lost", v:`-${stats.lost.toFixed(1)}`,         u:"lbs",    c:stats.lost>0?C.green:C.red},
                  {l:"Wkly Avg",   v:`-${stats.weekly.toFixed(2)}`,       u:"lbs/wk", c:C.accentL},
                  {l:"7-Day Δ",    v:stats.change7!=null?`${stats.change7<0?"▼":"▲"} ${Math.abs(stats.change7).toFixed(1)}`:"—",
                                   u:"lbs",c:stats.change7!=null?(stats.change7<0?C.green:C.red):C.dim},
                  {l:"Entries",    v:`${stats.count}`,                    u:`${stats.span}d span`,c:C.text},
                  {l:"Start→Now",  v:`${stats.first.toFixed(1)}→${stats.last.toFixed(1)}`,u:"lbs",c:C.muted},
                ].map((s,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 15px"}}>
                    <div style={{...LS,marginBottom:4}}>{s.l}</div>
                    <div style={{fontSize:18,fontWeight:700,color:s.c,lineHeight:1.2}}>{s.v}</div>
                    <div style={{fontSize:11,color:C.dim,marginTop:3}}>{s.u}</div>
                  </div>
                ))}
              </div>

              {/* Chart card */}
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                  <div style={{fontWeight:600,fontSize:14}}>Weight Chart</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {[["all","All Time"],["mavg","Moving Avg"],["month","Month"],["week","Week"]].map(([v,l])=>(
                      <button key={v} className={`vtab${chartView===v?" on":""}`} onClick={()=>setChartView(v)}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* ALL TIME */}
                {chartView==="all"&&(<>
                  <div style={{display:"flex",gap:14,fontSize:11,color:C.muted,marginBottom:10,flexWrap:"wrap"}}>
                    <span><span style={{color:C.accent}}>●</span> actual</span>
                    <span><span style={{color:C.accentL,opacity:.6}}>●</span> trend</span>
                    <span><span style={{color:C.inj}}>|</span> injection</span>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={allChartData} margin={{top:8,right:12,bottom:0,left:0}}>
                      <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.accent} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                      </linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} interval={Math.max(0,Math.floor(allChartData.length/9)-1)}/>
                      <YAxis domain={yDomain} tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={40}/>
                      <Tooltip content={<Tip/>}/>
                      {injRefLines.map((l,i)=>(
                        <ReferenceLine key={i} x={l.x} stroke={C.inj} strokeOpacity={.5} strokeWidth={1.5} strokeDasharray="3 3"
                          label={{value:`${l.mg}mg`,fill:C.inj,fontSize:9,position:"top"}}/>
                      ))}
                      <Area type="monotone" dataKey="Weight" stroke={C.accent} strokeWidth={2} fill="url(#g1)" dot={false} name="Weight"/>
                      <Line type="monotone" dataKey="Trend" stroke={C.accentL} strokeWidth={1.5} strokeOpacity={.5} dot={false} strokeDasharray="5 4" name="Trend"/>
                    </ComposedChart>
                  </ResponsiveContainer>
                </>)}

                {/* MOVING AVERAGE */}
                {chartView==="mavg"&&(<>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10}}>7-day rolling average smooths daily noise · injection days marked</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={allChartData} margin={{top:8,right:12,bottom:0,left:0}}>
                      <defs><linearGradient id="g4" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.green} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                      </linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} interval={Math.max(0,Math.floor(allChartData.length/9)-1)}/>
                      <YAxis domain={yDomain} tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={40}/>
                      <Tooltip content={<Tip/>}/>
                      {injRefLines.map((l,i)=>(
                        <ReferenceLine key={i} x={l.x} stroke={C.inj} strokeOpacity={.45} strokeWidth={1.5} strokeDasharray="3 3"
                          label={{value:`${l.mg}mg`,fill:C.inj,fontSize:9,position:"top"}}/>
                      ))}
                      <Line type="monotone" dataKey="Weight" stroke={C.border2} strokeWidth={1} strokeOpacity={.4} dot={false} name="Daily"/>
                      <Area type="monotone" dataKey="7d Avg" stroke={C.green} strokeWidth={2.5} fill="url(#g4)" dot={false} name="7d Avg"/>
                    </ComposedChart>
                  </ResponsiveContainer>
                </>)}

                {/* WEEK */}
                {chartView==="week"&&(<>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Weekly average · WoW change on hover</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={weekChartData} margin={{top:8,right:12,bottom:0,left:0}}>
                      <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false}/>
                      <YAxis domain={["auto","auto"]} tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={40}/>
                      <Tooltip content={({active,payload,label})=>{
                        if(!active||!payload?.length) return null;
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
                      {weekChartData.slice(-8).map((w,i)=>(
                        <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",minWidth:80}}>
                          <div style={{fontSize:11,color:C.dim,marginBottom:3}}>{w.date}</div>
                          <div style={{fontSize:14,fontWeight:700}}>{w["Avg Weight"]}</div>
                          {w["WoW Change"]!=null&&<div style={{fontSize:12,color:w["WoW Change"]<0?C.green:C.red,fontWeight:600}}>{w["WoW Change"]>0?"+":""}{w["WoW Change"]}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>)}

                {/* MONTH */}
                {chartView==="month"&&(<>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Monthly average · MoM change on hover</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={monthChartData} margin={{top:8,right:12,bottom:0,left:0}}>
                      <defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.accent} stopOpacity={0.22}/><stop offset="95%" stopColor={C.accent} stopOpacity={0.04}/>
                      </linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false}/>
                      <YAxis domain={["auto","auto"]} tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={40}/>
                      <Tooltip content={({active,payload,label})=>{
                        if(!active||!payload?.length) return null;
                        const avg=payload.find(p=>p.dataKey==="Avg Weight"),mom=payload.find(p=>p.dataKey==="MoM Change");
                        const lo=payload.find(p=>p.dataKey==="Low"),hi=payload.find(p=>p.dataKey==="High");
                        return(<div style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 14px",fontSize:13}}>
                          <div style={{color:C.muted,marginBottom:4,fontSize:12}}>{label}</div>
                          {avg&&<div style={{color:C.accent,fontWeight:600}}>Avg: {avg.value?.toFixed(1)} lbs</div>}
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
                        {["Month","Avg","Low","High","MoM"].map(h=>(
                          <th key={h} style={{padding:"6px 10px",textAlign:"left",fontSize:10,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{monthChartData.map((m,i)=>(
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

              {/* 30-day overlay */}
              {overlayData&&(
                <div className="card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>Recent 30 vs Prior 30 Days</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>Normalized to starting weight — shows relative pace</div>
                    </div>
                    <div style={{display:"flex",gap:14,fontSize:11,color:C.muted}}>
                      <span style={{color:C.accent,fontWeight:500}}>— Recent</span>
                      <span>- - Prior</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={overlayData} margin={{top:8,right:12,bottom:0,left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="day" tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} interval={4}/>
                      <YAxis tick={{fill:C.dim,fontSize:11}} tickLine={false} axisLine={false} width={44} tickFormatter={v=>`${v>0?"+":""}${v}`}/>
                      <ReferenceLine y={0} stroke={C.border2} strokeWidth={1}/>
                      <Tooltip content={({active,payload,label})=>{
                        if(!active||!payload?.length) return null;
                        return(<div style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 14px",fontSize:13}}>
                          <div style={{color:C.muted,marginBottom:4,fontSize:12}}>{label}</div>
                          {payload.map((p,i)=>p.value!=null&&<div key={i} style={{color:p.color,fontWeight:600,marginTop:2}}>{p.name}: {p.value>0?"+":""}{p.value?.toFixed(2)} lbs</div>)}
                        </div>);
                      }}/>
                      <Line type="monotone" dataKey="Recent 30" stroke={C.accent} strokeWidth={2.5} dot={false} connectNulls/>
                      <Line type="monotone" dataKey="Prior 30" stroke={C.dim} strokeWidth={1.5} dot={false} strokeDasharray="5 4" connectNulls/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Dose history */}
              {doses?.length>0&&(
                <div className="card">
                  <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>Dose History</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {[...doses].sort((a,b)=>a.date.localeCompare(b.date)).map((d,i)=>(
                      <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"4px 12px",fontSize:12,color:C.accentL,fontWeight:500}}>
                        {fmtFull(d.date)} <span style={{color:C.accent,fontWeight:700,marginLeft:2}}>{d.mg}mg</span>
                      </div>
                    ))}
                  </div>
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

              {/* Weight hero */}
              <div style={{marginBottom:14}}>
                <div style={LS}>Weight (lbs)</div>
                <input className="inp" type="number" step="0.1" placeholder="201.4" value={wt}
                  onChange={e=>setWt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEntry()}
                  style={{fontSize:28,fontWeight:700,textAlign:"center",padding:"12px 16px"}}/>
              </div>

              {/* Date + Dose stacked on separate rows on mobile */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div>
                  <div style={LS}>Date</div>
                  <input className="inp" type="date" value={dt} onChange={e=>setDt(e.target.value)}/>
                </div>
                <div>
                  <div style={LS}>Dose mg <span style={{color:C.dim,fontWeight:400,textTransform:"none"}}>(opt)</span></div>
                  <input className="inp" type="number" step="0.25" placeholder="5.5" value={doseInp}
                    onChange={e=>setDoseInp(e.target.value)}/>
                </div>
              </div>
              <button className="btn" onClick={addEntry} style={{width:"100%",marginBottom:20}}>
                {syncing?"Saving…":"Save Entry"}
              </button>

              {/* Habits */}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:16}}>
                <div style={{...LS,marginBottom:10}}>Yesterday's habits <span style={{color:C.dim,fontWeight:400,textTransform:"none"}}>(from Apr 14)</span></div>
                {[
                  {label:"Drank alcohol",emoji:"🍺",val:drank,set:setDrank},
                  {label:"Ate red meat",emoji:"🥩",val:redMeat,set:setRedMeat},
                  {label:"Got delivery",emoji:"🛵",val:delivery,set:setDelivery},
                ].map(({label,emoji,val,set})=>(
                  <button key={label} onClick={()=>set(!val)} style={{
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    background:val?"#1e2a45":C.card2,border:`1px solid ${val?C.accent:C.border}`,
                    borderRadius:9,padding:"11px 14px",cursor:"pointer",transition:"all .15s",width:"100%",marginBottom:8
                  }}>
                    <span style={{fontSize:14,color:val?C.text:C.muted,fontFamily:"inherit",fontWeight:500}}>
                      <span style={{marginRight:8}}>{emoji}</span>{label}
                    </span>
                    <div style={{width:38,height:22,borderRadius:11,background:val?C.accent:C.border2,position:"relative",transition:"background .15s",flexShrink:0}}>
                      <div style={{position:"absolute",top:3,left:val?17:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
                    </div>
                  </button>
                ))}
                <div style={{marginTop:6}}>
                  <div style={LS}>Meals eaten</div>
                  <input className="inp" type="number" min="1" max="8" step="1" placeholder="3" value={meals}
                    onChange={e=>setMeals(e.target.value)} style={{textAlign:"center",fontSize:16,fontWeight:600}}/>
                </div>
              </div>

              {/* Sleep */}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:16}}>
                <div style={{...LS,marginBottom:10}}>
                  Last night's sleep
                  {sleepCalc!==null&&<span style={{color:C.green,fontWeight:600,textTransform:"none",marginLeft:8,fontSize:12}}>{sleepCalc} hrs</span>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <div style={LS}>Bed time</div>
                    <input className="inp" type="time" value={bedTime} onChange={e=>setBedTime(e.target.value)} style={{textAlign:"center"}}/>
                  </div>
                  <div>
                    <div style={LS}>Wake up time</div>
                    <input className="inp" type="time" value={wakeTime} onChange={e=>setWakeTime(e.target.value)} style={{textAlign:"center"}}/>
                  </div>
                </div>
                <button onClick={()=>setNightWake(!nightWake)} style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  background:nightWake?"#1e2a45":C.card2,border:`1px solid ${nightWake?C.accent:C.border}`,
                  borderRadius:9,padding:"11px 14px",cursor:"pointer",transition:"all .15s",width:"100%"
                }}>
                  <span style={{fontSize:14,color:nightWake?C.text:C.muted,fontFamily:"inherit",fontWeight:500}}>
                    <span style={{marginRight:8}}>😴</span>Woke up during the night
                  </span>
                  <div style={{width:38,height:22,borderRadius:11,background:nightWake?C.accent:C.border2,position:"relative",transition:"background .15s",flexShrink:0}}>
                    <div style={{position:"absolute",top:3,left:nightWake?17:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
                  </div>
                </button>
              </div>

              {/* Rosacea */}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16}}>
                <div style={{...LS,marginBottom:10}}>
                  Rosacea today
                  <span style={{color:C.dim,fontWeight:400,textTransform:"none",marginLeft:6}}>1 = clear · 10 = very red</span>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <button key={n} onClick={()=>setRosacea(n===rosacea?0:n)} style={{
                      width:40,height:40,borderRadius:8,border:`1.5px solid ${rosacea===n?C.accent:C.border}`,
                      background:rosacea===n?"#1e2a45":C.card2,
                      color:rosacea===n?C.text:C.muted,fontFamily:"inherit",fontSize:14,fontWeight:rosacea===n?700:400,
                      transition:"all .12s"
                    }}>{n}</button>
                  ))}
                </div>
                {rosacea>0&&<div style={{marginTop:8,fontSize:12,color:rosacea<=3?C.green:rosacea<=6?C.yellow:C.red}}>
                  {rosacea<=3?"Clear day 🌿":rosacea<=6?"Moderate 🌹":"Elevated 🔴"}
                </div>}
              </div>

              {msg&&<div style={{marginTop:14,fontSize:13,color:C.green,fontWeight:500}}>{msg}</div>}
            </div>

            {/* Entry table */}
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"13px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:8,alignItems:"baseline"}}>
                  <span style={{fontWeight:600,fontSize:14}}>All Entries</span>
                  <span style={{fontSize:12,color:C.muted}}>{sorted.length} total</span>
                </div>
                <button className="btn-sm" onClick={()=>exportCSV(sorted,doses,lfMap)}>⬇ Export CSV</button>
              </div>
              <div style={{maxHeight:380,overflowY:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {["Date","Weight","Δ","Dose","🍺","🥩","🛵","😴","Zz","Ros",""].map(h=>(
                      <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:10,color:C.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...sorted].reverse().map((e,i,arr)=>{
                    const prev=arr[i+1],delta=prev?e.weight-prev.weight:null;
                    const d=doses?.find(x=>x.date===e.date),lfd=lfMap[e.date]||{};
                    const hrs=sleepHours(lfd.bed_time,lfd.wake_time);
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
                <div style={{fontSize:13,color:C.muted,marginTop:4}}>5 insights from your data · refreshes daily</div>
              </div>
              <div style={{fontSize:11,color:C.dim,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 12px",whiteSpace:"nowrap"}}>{fmtFull(todayStr())}</div>
            </div>

            {dailyInsights.length===0?(
              <div className="card" style={{textAlign:"center",padding:"50px 24px",color:C.dim}}>
                <div style={{fontSize:32,marginBottom:12}}>🔍</div>
                <div style={{fontSize:14,marginBottom:6}}>Not enough data yet.</div>
                <div style={{fontSize:13}}>Keep logging — insights unlock as patterns emerge.</div>
              </div>
            ):(
              <>
                {dailyInsights.map((ins,i)=>(
                  <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px",display:"flex",gap:14,alignItems:"flex-start",animation:`fu .2s ease ${i*.07}s both`}}>
                    <div style={{fontSize:26,lineHeight:1,flexShrink:0,marginTop:1}}>{ins.emoji}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                        <div style={{fontWeight:600,fontSize:14}}>{ins.title}</div>
                        <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",padding:"2px 7px",borderRadius:4,background:`${TAG[ins.tag]||C.dim}22`,color:TAG[ins.tag]||C.muted}}>{ins.tag}</div>
                      </div>
                      <div style={{fontSize:14,color:C.muted,lineHeight:1.65}}>{ins.text}</div>
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
