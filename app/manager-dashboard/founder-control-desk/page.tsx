"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEFAULT_WEDGE_PACKAGE, WEDGE_PACKAGE_STORAGE_KEY, type WedgePackageConfig } from "../../lib/wedgePackages";
import { readFeedback, type FeedbackCandidate } from "../../wedgeweb/engine/feedbackQueue";
import SmartPosControls from "./SmartPosControls";

const money = (value: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value || 0);

export default function FounderJohnControlDesk() {
  const router = useRouter();
  const [config, setConfig] = useState<WedgePackageConfig>(DEFAULT_WEDGE_PACKAGE);
  const [saved, setSaved] = useState("");
  const [feedback, setFeedback] = useState<FeedbackCandidate[]>([]);

  useEffect(() => {
    if (!localStorage.getItem("wc_manager_token")) { router.push("/manager-login"); return; }
    const stored = localStorage.getItem(WEDGE_PACKAGE_STORAGE_KEY);
    if (stored) { try { setConfig({ ...DEFAULT_WEDGE_PACKAGE, ...JSON.parse(stored) }); } catch { localStorage.removeItem(WEDGE_PACKAGE_STORAGE_KEY); } }
    setFeedback(readFeedback());
  }, [router]);

  function update<K extends keyof WedgePackageConfig>(key: K, value: WedgePackageConfig[K]) { setConfig((current) => ({ ...current, [key]: value })); setSaved(""); }
  function save() { localStorage.setItem(WEDGE_PACKAGE_STORAGE_KEY, JSON.stringify(config)); setSaved("Package configuration saved on this device. Backend publishing will make it global and tamper-resistant."); }
  function restore() { if (!confirm("Restore the original Wedge Works package values?")) return; setConfig(DEFAULT_WEDGE_PACKAGE); localStorage.setItem(WEDGE_PACKAGE_STORAGE_KEY, JSON.stringify(DEFAULT_WEDGE_PACKAGE)); setSaved("Default package restored."); }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(212,173,99,.12),transparent_32%),#101416] text-[#f4efe6]">
    <section className="mx-auto max-w-7xl px-6 py-9">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold tracking-[.32em] text-[#d4ad63]">WEDGE WORKS OWNER CONTROLS</p><h1 className="mt-3 text-4xl font-bold text-[#f0dfbd]">Founder John Control Desk</h1><p className="mt-3 max-w-2xl text-white/50">Shape packages, promotions and domain-service charges before connecting the live payment backend.</p></div><Link href="/manager-dashboard" className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/65">Back to Dashboard</Link></header>

      <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100/70"><b>Configuration preview:</b> values currently remain in this browser. Before accepting money, founder-role enforcement, audit history and secure database storage must be connected.</div>

      <SmartPosControls />

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="space-y-5 rounded-[2rem] border border-white/10 bg-[#1e2428] p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2"><TextField label="Package name" value={config.name} onChange={(value) => update("name",value)}/><TextField label="Promotion label" value={config.promotionLabel} onChange={(value) => update("promotionLabel",value)}/></div>
          <div className="grid gap-4 sm:grid-cols-3"><NumberField label="Annual package (RM)" value={config.annualPrice} onChange={(value) => update("annualPrice",value)}/><NumberField label="Monthly package (RM)" value={config.monthlyPrice} onChange={(value) => update("monthlyPrice",value)}/><NumberField label="Free months" value={config.freeMonths} onChange={(value) => update("freeMonths",value)}/></div>
          <div className="grid gap-4 sm:grid-cols-2"><NumberField label="Managed domain setup (RM)" value={config.managedDomainSetupFee} onChange={(value) => update("managedDomainSetupFee",value)}/><NumberField label="Annual domain renewal (RM)" value={config.managedDomainRenewalFee} onChange={(value) => update("managedDomainRenewalFee",value)}/></div>
          <label className="block text-sm text-white/60">Promotion end date<input type="date" value={config.promotionEnds} onChange={(event) => update("promotionEnds",event.target.value)} className={inputClass}/></label>
          <div><h2 className="font-bold text-[#f0dfbd]">Included services</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{([['includeSubdomain','Wedge Works subdomain'],['includeClockin','WedgeClockin'],['includeTapauJer','TapauJér'],['includeWedgeI','Wedge-I'],['includeWedgeWeb','WedgeWeb']] as const).map(([key,label]) => <label key={key} className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/10 p-3 text-sm text-white/60"><input type="checkbox" checked={config[key]} onChange={(event) => update(key,event.target.checked)} className="accent-[#d4ad63]"/>{label}</label>)}</div></div>
          <label className="flex items-center gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-4 text-sm text-emerald-100/70"><input type="checkbox" checked={config.active} onChange={(event) => update("active",event.target.checked)} className="accent-emerald-300"/>Package visible for new customer publishing</label>
          {saved && <p className="rounded-xl border border-[#d4ad63]/20 bg-[#d4ad63]/5 p-3 text-sm text-[#e4c98f]">{saved}</p>}
          <div className="flex flex-wrap gap-3"><button onClick={save} className="rounded-full bg-[#d4ad63] px-6 py-3 font-bold text-[#101416]">Save Package</button><button onClick={restore} className="rounded-full border border-white/15 px-6 py-3 text-white/60">Restore Defaults</button></div>
        </section>

        <aside className="space-y-5"><div className="rounded-[2rem] border border-[#d4ad63]/25 bg-[#1e2428] p-7"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#d4ad63]">Customer package preview</p><h2 className="mt-4 text-3xl font-bold text-[#f0dfbd]">{config.name}</h2><div className="mt-5 flex items-end gap-2"><span className="text-4xl font-bold">{money(config.annualPrice)}</span><span className="pb-1 text-sm text-white/40">/ year</span></div><p className="mt-2 text-sm text-white/45">or {money(config.monthlyPrice)} monthly · {config.freeMonths} free month{config.freeMonths === 1 ? "" : "s"}</p><p className="mt-5 rounded-xl bg-black/15 p-4 text-sm leading-6 text-white/55">{config.promotionLabel || "Standard package"}</p><ul className="mt-5 space-y-2 text-sm text-white/55">{config.includeSubdomain && <li>✓ Included Wedge Works subdomain</li>}{config.includeClockin && <li>✓ WedgeClockin</li>}{config.includeTapauJer && <li>✓ TapauJér</li>}{config.includeWedgeI && <li>✓ Wedge-I</li>}{config.includeWedgeWeb && <li>✓ WedgeWeb design engine</li>}</ul></div><div className="rounded-[2rem] border border-white/10 bg-[#1e2428] p-7"><h3 className="font-bold text-[#f0dfbd]">Managed custom domain</h3><p className="mt-3 text-sm text-white/50">Setup: {money(config.managedDomainSetupFee)}</p><p className="mt-2 text-sm text-white/50">Annual renewal: {money(config.managedDomainRenewalFee)}</p><p className="mt-4 text-xs leading-5 text-white/35">Customer remains the domain registrant. Wedge Works purchases, connects and maintains it under the managed-domain terms.</p></div><div className="rounded-[2rem] border border-white/10 bg-[#1e2428] p-7"><div className="flex items-center justify-between"><h3 className="font-bold text-[#f0dfbd]">Ontology review queue</h3><span className="rounded-full bg-[#d4ad63]/10 px-3 py-1 text-xs text-[#e4c98f]">{feedback.length}</span></div><p className="mt-3 text-xs leading-5 text-white/35">Confirmed fuzzy interpretations are stored here for founder review. Global approval requires the future backend.</p><div className="mt-4 space-y-2">{feedback.slice(0,5).map((item,index)=><div key={`${item.confirmedAt}-${index}`} className="rounded-xl bg-black/15 p-3 text-xs"><p className="text-white/65">“{item.instruction}”</p><p className="mt-1 text-[#d4ad63]">→ {item.suggestedStyle} · {item.industry}</p></div>)}{!feedback.length && <p className="text-sm text-white/35">No confirmed candidates yet.</p>}</div></div></aside>
      </div>
    </section>
  </main>;
}

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]";
function TextField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}) { return <label className="block text-sm text-white/60">{label}<input value={value} onChange={(event)=>onChange(event.target.value)} className={inputClass}/></label>; }
function NumberField({label,value,onChange}:{label:string;value:number;onChange:(value:number)=>void}) { return <label className="block text-sm text-white/60">{label}<input type="number" min="0" step="0.01" value={value} onChange={(event)=>onChange(Math.max(0,Number(event.target.value)||0))} className={inputClass}/></label>; }
