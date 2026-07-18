"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/layout/AppNav";
import { calculateNutrition } from "@/features/onboarding/calculate-nutrition";
import type { ExtendedProfile, WeightEntry } from "@/features/profile/types";
import { readProfile, readWeightHistory, writeProfile, writeWeightHistory } from "@/features/profile/storage";

const skippedOptions = ["Kahvaltı yapmıyorum", "Öğle öğünü yapmıyorum", "Ara öğün istemiyorum", "Gece vardiyasında çalışıyorum", "Aralıklı oruç uyguluyorum"];

export default function ProfilePage(){
  const [profile,setProfile]=useState<ExtendedProfile|null>(null);
  const [history,setHistory]=useState<WeightEntry[]>([]);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{setProfile(readProfile());setHistory(readWeightHistory())},[]);

  const progress=useMemo(()=>{
    if(!profile) return 0;
    const start=history[0]?.weightKg ?? Number(profile.formData.weightKg);
    const current=Number(profile.formData.weightKg);
    const target=Number(profile.targetWeightKg);
    if(!target || start===target) return 0;
    return Math.max(0,Math.min(100,Math.round(((start-current)/(start-target))*100)));
  },[profile,history]);

  if(!profile){return <><AppNav/><main className="shell-wide py-20"><div className="rounded-3xl border border-zinc-200 bg-white p-10"><h1 className="text-3xl font-bold">Önce profilini oluşturalım</h1><p className="mt-3 text-zinc-600">Profil bilgilerin henüz bulunamadı. İlk hesaplamanı tamamlayınca bu sayfa otomatik dolacak.</p><a href="/onboarding" className="button button-primary mt-7">Profil oluştur</a></div></main></>}

  function updateForm(field:keyof ExtendedProfile["formData"],value:string){setProfile(current=>current?{...current,formData:{...current.formData,[field]:value}}:current)}
  function updateField(field:keyof ExtendedProfile,value:unknown){setProfile(current=>current?{...current,[field]:value}:current)}
  function toggleSkipped(value:string){if(!profile)return;const current=profile.skippedMeals??[];updateField("skippedMeals",current.includes(value)?current.filter(x=>x!==value):[...current,value])}
  function submit(event:FormEvent){event.preventDefault();if(!profile)return;const updated={...profile,result:calculateNutrition(profile.formData),updatedAt:new Date().toISOString()};writeProfile(updated);const currentWeight=Number(updated.formData.weightKg);const latest=history.at(-1)?.weightKg;let next=history;if(Number.isFinite(currentWeight)&&currentWeight!==latest){next=[...history,{id:crypto.randomUUID(),weightKg:currentWeight,date:new Date().toISOString()}];writeWeightHistory(next);setHistory(next)}setProfile(updated);setSaved(true);setTimeout(()=>setSaved(false),2200)}

  return <><AppNav/><main className="shell-wide py-10 lg:py-16">
    <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
      <form onSubmit={submit} className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-600">Kişisel profil</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Bilgilerini güncel tut</h1><p className="mt-3 max-w-2xl text-zinc-600">Yeni program oluştururken bu bilgiler otomatik getirilebilir; yine de her seferinde onaylaman istenir.</p></div>{saved&&<span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">Kaydedildi ✓</span>}</div>
        <section className="mt-9"><h2 className="text-xl font-bold">Temel bilgiler</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Ad" value={profile.formData.name} onChange={v=>updateForm("name",v)}/><Field label="Yaş" type="number" value={profile.formData.age} onChange={v=>updateForm("age",v)}/><Field label="Boy (cm)" type="number" value={profile.formData.heightCm} onChange={v=>updateForm("heightCm",v)}/><Field label="Güncel kilo (kg)" type="number" value={profile.formData.weightKg} onChange={v=>updateForm("weightKg",v)}/><Field label="Hedef kilo (kg)" type="number" value={profile.targetWeightKg??""} onChange={v=>updateField("targetWeightKg",v)}/><Select label="Aktivite" value={profile.formData.activityLevel} onChange={v=>updateForm("activityLevel",v)} options={[["sedentary","Hareketsiz"],["light","Hafif"],["moderate","Orta"],["active","Çok hareketli"],["very-active","Yoğun"]]}/>
        </div></section>
        <section className="mt-9 border-t border-zinc-100 pt-8"><h2 className="text-xl font-bold">Beslenme düzeni</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Select label="Öğün düzeni" value={profile.mealRoutine??"flexible"} onChange={v=>updateField("mealRoutine",v)} options={[["two-meals","2 ana öğün"],["three-meals","3 ana öğün"],["three-plus-snack","3 ana + ara öğün"],["flexible","Güne göre değişiyor"]]}/><Select label="Bütçe" value={profile.budget??"medium"} onChange={v=>updateField("budget",v)} options={[["low","Ekonomik"],["medium","Dengeli"],["flexible","Esnek"]]}/><Field label="Beslenme tercihi" value={profile.dietaryPreference??""} onChange={v=>updateField("dietaryPreference",v)} placeholder="Örn. Akdeniz tipi"/><Field label="Hazırlama süresi" value={profile.cookingTime??""} onChange={v=>updateField("cookingTime",v)} placeholder="Örn. en fazla 20 dakika"/><Field label="Alerjiler / hassasiyetler" value={profile.allergies??""} onChange={v=>updateField("allergies",v)} placeholder="Yoksa boş bırak"/><Field label="Sevmediğin yiyecekler" value={profile.dislikedFoods??""} onChange={v=>updateField("dislikedFoods",v)} placeholder="Örn. mantar, brokoli"/></div>
          <div className="mt-5"><p className="mb-3 text-sm font-bold">Sana uyan seçenekleri işaretle</p><div className="flex flex-wrap gap-2">{skippedOptions.map(option=><button type="button" key={option} onClick={()=>toggleSkipped(option)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${profile.skippedMeals?.includes(option)?"border-emerald-500 bg-emerald-50 text-emerald-700":"border-zinc-200 bg-white text-zinc-600"}`}>{profile.skippedMeals?.includes(option)?"✓ ":""}{option}</button>)}</div></div>
        </section>
        <button className="button button-primary mt-9" type="submit">Bilgileri kaydet</button>
      </form>
      <aside className="space-y-5"><div className="rounded-[28px] bg-zinc-950 p-7 text-white"><p className="text-sm text-zinc-400">Hedef ilerlemesi</p><div className="mt-3 flex items-end justify-between"><strong className="text-4xl">%{progress}</strong><span className="text-sm text-emerald-400">{profile.targetWeightKg?`${profile.targetWeightKg} kg hedef`:"Hedef ekle"}</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-emerald-400" style={{width:`${progress}%`}}/></div><p className="mt-5 text-sm leading-6 text-zinc-400">Güncel değer: <b className="text-white">{profile.formData.weightKg} kg</b>. Kilonu güncellediğinde geçmiş kaydı korunur.</p></div>
      <div className="rounded-[28px] border border-zinc-200 bg-white p-7"><p className="text-sm font-bold text-emerald-700">Güncel günlük hedef</p><strong className="mt-3 block text-3xl">{profile.result.targetCalories} kcal</strong><div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl bg-zinc-50 p-3"><b className="block text-base">{profile.result.proteinGrams}g</b>Protein</div><div className="rounded-xl bg-zinc-50 p-3"><b className="block text-base">{profile.result.carbohydrateGrams}g</b>Karb.</div><div className="rounded-xl bg-zinc-50 p-3"><b className="block text-base">{profile.result.fatGrams}g</b>Yağ</div></div></div></aside>
    </div>
  </main></>
}

function Field({label,value,onChange,type="text",placeholder}:{label:string,value:string,onChange:(v:string)=>void,type?:string,placeholder?:string}){return <label className="block"><span className="mb-2 block text-sm font-bold text-zinc-700">{label}</span><input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"/></label>}
function Select({label,value,onChange,options}:{label:string,value:string,onChange:(v:string)=>void,options:string[][]}){return <label className="block"><span className="mb-2 block text-sm font-bold text-zinc-700">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none focus:border-emerald-500">{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}
