"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Offering = { name: string; price: string; description: string };
type SiteDraft = { businessName: string; industry: string; description: string; whatsapp: string; phone: string; address: string; hours: string; facebook: string; instagram: string; primaryColor: string; backgroundColor: string; textColor: string; boldText: boolean; watermark: boolean; photos: string[]; offerings: Offering[] };
type PreviewPage = "home" | "offerings" | "contact";

const STORAGE_KEY = "wedgeweb_draft_v1";
const defaultDraft: SiteDraft = { businessName: "", industry: "Salon & Spa", description: "", whatsapp: "", phone: "", address: "", hours: "Monday – Saturday, 10:00 AM – 7:00 PM", facebook: "", instagram: "", primaryColor: "#b58a72", backgroundColor: "#fffaf5", textColor: "#282321", boldText: false, watermark: false, photos: Array(20).fill(""), offerings: [{ name: "", price: "", description: "" }] };

const namedColors: Record<string, string> = { "chili red": "#c21807", red: "#c62828", black: "#171717", white: "#ffffff", gold: "#c8a467", green: "#286b4f", blue: "#2457a6", purple: "#7048a8", pink: "#d45c86", orange: "#d76a22", cream: "#fff6e8", beige: "#eadfd5" };

const industryWords: Record<string, { page: string; verb: string; fallback: string }> = {
  "Salon & Spa": { page: "Treatments", verb: "Book", fallback: "Thoughtful treatments designed around your comfort and confidence." },
  "Food & Beverage": { page: "Menu", verb: "Order", fallback: "Fresh favourites, prepared with care and made to be enjoyed." },
  Retail: { page: "Products", verb: "Enquire", fallback: "Quality products selected to make everyday life a little better." },
  "Professional Services": { page: "Services", verb: "Enquire", fallback: "Practical, dependable service for people and growing businesses." },
  "Home & Repair": { page: "Services", verb: "Get a Quote", fallback: "Reliable workmanship and straightforward support when you need it." },
  Other: { page: "Products & Services", verb: "Enquire", fallback: "A local business committed to helpful service and lasting relationships." },
};

export default function WedgeWebPage() {
  const [draft, setDraft] = useState<SiteDraft>(defaultDraft);
  const [page, setPage] = useState<PreviewPage>("home");
  const [mode, setMode] = useState<"build" | "preview">("build");
  const [message, setMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [designPrompt, setDesignPrompt] = useState("");
  const [designReply, setDesignReply] = useState("Tell me how you want the website to look.");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { try { const old = JSON.parse(saved); const photos = Array(20).fill(""); if (Array.isArray(old.photos)) old.photos.slice(0, 20).forEach((photo: string, index: number) => { photos[index] = photo; }); else if (old.heroImage) photos[0] = old.heroImage; setDraft({ ...defaultDraft, ...old, primaryColor: old.primaryColor || old.accent || defaultDraft.primaryColor, photos }); } catch { localStorage.removeItem(STORAGE_KEY); } }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const words = industryWords[draft.industry] || industryWords.Other;
  const complete = Boolean(draft.businessName.trim() && draft.description.trim() && draft.whatsapp.trim() && draft.offerings.some((item) => item.name.trim()));
  const whatsappUrl = useMemo(() => {
    const number = draft.whatsapp.replace(/\D/g, "");
    const text = `Hi ${draft.businessName || "there"}, I found you through your WedgeWeb website. I would like to know more.`;
    return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : "#";
  }, [draft.businessName, draft.whatsapp]);

  function update<K extends keyof SiteDraft>(key: K, value: SiteDraft[K]) { setDraft((current) => ({ ...current, [key]: value })); setMessage(""); }
  function updateOffering(index: number, key: keyof Offering, value: string) { setDraft((current) => ({ ...current, offerings: current.offerings.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) })); }
  function saveDraft() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); setMessage("Draft saved on this device."); } catch { setMessage("This browser is out of draft storage. Remove a few photos or use smaller originals."); } }
  function generate(event: FormEvent) { event.preventDefault(); if (!complete) { setMessage("Add your business name, introduction, WhatsApp number and at least one offering."); return; } saveDraft(); setMode("preview"); setPage("home"); }
  function uploadImage(event: ChangeEvent<HTMLInputElement>, slot: number) { const file = event.target.files?.[0]; if (!file) return; if (file.size > 8_000_000) { setMessage("Each original photo must be smaller than 8 MB."); return; } const reader = new FileReader(); reader.onload = () => { const image = new Image(); image.onload = () => { const max = 720; const scale = Math.min(1, max / Math.max(image.width, image.height)); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height); const compressed = canvas.toDataURL("image/jpeg", .68); setDraft((current) => ({ ...current, photos: current.photos.map((photo, index) => index === slot ? compressed : photo) })); }; image.src = String(reader.result || ""); }; reader.readAsDataURL(file); }

  function applyDesignPrompt(event: FormEvent) {
    event.preventDefault();
    const prompt = designPrompt.trim().toLowerCase();
    if (!prompt) return;
    let changes = 0;
    const next: Partial<SiteDraft> = {};
    const mentioned = Object.entries(namedColors).find(([name]) => prompt.includes(name));
    if (mentioned) {
      if (prompt.includes("background")) next.backgroundColor = mentioned[1];
      else if (prompt.includes("word") || prompt.includes("text")) next.textColor = mentioned[1];
      else next.primaryColor = mentioned[1];
      changes++;
    }
    const hex = prompt.match(/#[0-9a-f]{6}/i)?.[0];
    if (hex) { if (prompt.includes("background")) next.backgroundColor = hex; else if (prompt.includes("word") || prompt.includes("text")) next.textColor = hex; else next.primaryColor = hex; changes++; }
    if (prompt.includes("bold")) { next.boldText = !prompt.includes("not bold") && !prompt.includes("remove bold"); changes++; }
    if (prompt.includes("watermark")) { next.watermark = !prompt.includes("remove") && !prompt.includes("no watermark"); changes++; }
    setDraft((current) => ({ ...current, ...next }));
    setDesignReply(changes ? "Done. I applied that design direction—open Preview to see it." : "I can currently change primary, background or text colours, make all wording bold, and add or remove the Photo 1 watermark.");
    setDesignPrompt("");
  }

  if (!loaded) return <main className="min-h-screen bg-[#090d10] p-10 text-white/50">Opening WedgeWeb…</main>;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(200,164,103,.13),transparent_32%),#090d10] text-[#f4efe6]">
    <header className="border-b border-white/8"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="font-bold text-[#f1dfbc]">Wedge Works <span className="text-[#c8a467]">/ WedgeWeb</span></Link><div className="flex gap-2"><button onClick={() => setMode("build")} className={`rounded-full px-4 py-2 text-sm ${mode === "build" ? "bg-[#c8a467] text-[#111416]" : "border border-white/10 text-white/55"}`}>Build</button><button onClick={() => setMode("preview")} className={`rounded-full px-4 py-2 text-sm ${mode === "preview" ? "bg-[#c8a467] text-[#111416]" : "border border-white/10 text-white/55"}`}>Preview</button></div></div></header>

    {mode === "build" ? <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[.9fr_1.1fr]">
      <div><p className="text-xs font-semibold tracking-[.3em] text-[#c8a467]">AI WEBSITE ENGINE</p><h1 className="mt-4 text-4xl font-bold text-[#f1dfbc]">Tell us about your business.</h1><p className="mt-4 max-w-xl leading-7 text-white/50">Create a professional three-page website without domains, hosting or code. Your draft and preview are free.</p><div className="mt-7 rounded-3xl border border-[#c8a467]/20 bg-[#151b1f] p-5"><p className="text-sm font-semibold text-[#f1dfbc]">Wedge AI</p><p className="mt-3 text-sm leading-6 text-white/55">Let&apos;s begin with the essentials. Add your business information, one product or service, and your WhatsApp number. I&apos;ll shape it into Home, {words.page}, and Contact pages.</p></div><form onSubmit={applyDesignPrompt} className="mt-5 rounded-3xl border border-[#c8a467]/20 bg-[#151b1f] p-5"><p className="text-sm font-semibold text-[#f1dfbc]">Design Chat</p><div className="mt-3 rounded-2xl bg-black/20 p-4 text-sm leading-6 text-white/55">{designReply}</div><textarea value={designPrompt} onChange={(event) => setDesignPrompt(event.target.value)} rows={3} placeholder="Try: Make all wording bold chili red and add Photo 1 as a watermark" className={inputClass}/><div className="mt-3 flex flex-wrap gap-2">{["Make all wording bold", "Use chili red", "Add Photo 1 watermark"].map((prompt) => <button key={prompt} type="button" onClick={() => setDesignPrompt(prompt)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50">{prompt}</button>)}</div><button className="mt-3 w-full rounded-full bg-[#c8a467] px-5 py-3 font-bold text-[#111416]">Apply Design Instruction</button></form></div>
      <form onSubmit={generate} className="space-y-5 rounded-[2rem] border border-white/10 bg-[#151b1f] p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Business name" value={draft.businessName} onChange={(value) => update("businessName", value)} placeholder="Serenity Spa"/><Select label="Business type" value={draft.industry} onChange={(value) => update("industry", value)} options={Object.keys(industryWords)}/></div>
        <label className="block text-sm text-white/65">Introduce your business<textarea value={draft.description} onChange={(event) => update("description", event.target.value)} placeholder={words.fallback} rows={4} className={inputClass}/></label>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="WhatsApp number" value={draft.whatsapp} onChange={(value) => update("whatsapp", value)} placeholder="60123456789"/><Field label="Telephone" value={draft.phone} onChange={(value) => update("phone", value)} placeholder="Optional"/></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Address" value={draft.address} onChange={(value) => update("address", value)} placeholder="Ipoh, Perak"/><Field label="Opening hours" value={draft.hours} onChange={(value) => update("hours", value)} placeholder="Mon–Sat, 10am–7pm"/></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Facebook URL" value={draft.facebook} onChange={(value) => update("facebook", value)} placeholder="Optional"/><Field label="Instagram URL" value={draft.instagram} onChange={(value) => update("instagram", value)} placeholder="Optional"/></div>
        <div><h2 className="font-bold text-[#f1dfbc]">Website colours</h2><div className="mt-3 grid gap-4 sm:grid-cols-3"><ColorField label="Primary" value={draft.primaryColor} onChange={(value) => update("primaryColor", value)}/><ColorField label="Background" value={draft.backgroundColor} onChange={(value) => update("backgroundColor", value)}/><ColorField label="Text" value={draft.textColor} onChange={(value) => update("textColor", value)}/></div><label className="mt-4 flex items-center gap-3 text-sm text-white/60"><input type="checkbox" checked={draft.boldText} onChange={(event) => update("boldText", event.target.checked)} className="accent-[#c8a467]"/>Make all website wording bold</label><label className="mt-3 flex items-center gap-3 text-sm text-white/60"><input type="checkbox" checked={draft.watermark} onChange={(event) => update("watermark", event.target.checked)} className="accent-[#c8a467]"/>Use Photo 1 as a subtle watermark</label></div>
        <div><div className="flex items-end justify-between gap-4"><div><h2 className="font-bold text-[#f1dfbc]">Photo library</h2><p className="mt-1 text-xs text-white/40">Photo 1 is the main background. Photos 2–20 match your products/services in order.</p></div><span className="text-xs text-[#c8a467]">{draft.photos.filter(Boolean).length}/20</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{draft.photos.map((photo, index) => <label key={index} className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0c1114]"><input type="file" accept="image/*" onChange={(event) => uploadImage(event,index)} className="sr-only"/>{photo ? <img src={photo} alt={`Photo ${index + 1}`} className="h-full w-full object-cover"/> : <span className="flex h-full items-center justify-center text-xs text-white/30">Upload</span>}<span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">{index + 1}</span>{photo && <button type="button" onClick={(event) => { event.preventDefault(); setDraft((current) => ({ ...current, photos: current.photos.map((item,itemIndex) => itemIndex === index ? "" : item) })); }} className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">×</button>}</label>)}</div></div>
        <div><div className="flex items-center justify-between"><h2 className="font-bold text-[#f1dfbc]">{words.page}</h2><button type="button" onClick={() => update("offerings", [...draft.offerings, { name: "", price: "", description: "" }])} className="text-sm text-[#c8a467]">+ Add item</button></div><div className="mt-3 space-y-3">{draft.offerings.map((item, index) => <div key={index} className="grid gap-3 rounded-2xl border border-white/8 bg-black/10 p-4 sm:grid-cols-[1fr_.45fr]"><Field label="Name" value={item.name} onChange={(value) => updateOffering(index,"name",value)} placeholder="Aromatherapy Massage"/><Field label="Price" value={item.price} onChange={(value) => updateOffering(index,"price",value)} placeholder="RM120 / From RM180"/><div className="sm:col-span-2"><Field label="Short description" value={item.description} onChange={(value) => updateOffering(index,"description",value)} placeholder="Describe the value in one sentence"/></div></div>)}</div></div>
        {message && <p className="rounded-xl border border-[#c8a467]/20 bg-[#c8a467]/8 p-3 text-sm text-[#e4c98f]">{message}</p>}
        <div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={saveDraft} className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white/65">Save Draft</button><button className="flex-1 rounded-full bg-[#c8a467] px-6 py-3 font-bold text-[#111416]">Generate Free Preview</button></div>
      </form>
    </section> : <PreviewShell draft={draft} page={page} setPage={setPage} words={words} whatsappUrl={whatsappUrl} chatOpen={chatOpen} setChatOpen={setChatOpen} onEdit={() => setMode("build")}/>} 
  </main>;
}

function PreviewShell({ draft, page, setPage, words, whatsappUrl, chatOpen, setChatOpen, onEdit }: { draft: SiteDraft; page: PreviewPage; setPage: (page: PreviewPage) => void; words: { page: string; verb: string; fallback: string }; whatsappUrl: string; chatOpen: boolean; setChatOpen: (open: boolean) => void; onEdit: () => void }) {
  const accent = draft.primaryColor || "#b58a72";
  const siteStyle = { backgroundColor: draft.backgroundColor, color: draft.textColor, fontWeight: draft.boldText ? 700 : undefined };
  return <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6"><div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#151b1f] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#c8a467]">Free preview</p><p className="mt-1 text-sm text-white/45">Payment connection comes next. Publishing is not enabled yet.</p></div><div className="flex gap-2"><button onClick={onEdit} className="rounded-full border border-white/15 px-4 py-2 text-sm">Edit</button><button onClick={() => alert("Publishing will unlock after WedgeWeb payment is connected.")} className="rounded-full bg-[#c8a467] px-4 py-2 text-sm font-bold text-[#111416]">Pay & Publish — Coming Next</button></div></div>
    <div className="relative min-h-[720px] overflow-hidden rounded-[2rem] shadow-2xl" style={siteStyle}>
      {draft.watermark && draft.photos[0] && <div className="pointer-events-none absolute inset-0 z-0 bg-contain bg-center bg-no-repeat opacity-[0.06]" style={{ backgroundImage: `url(${draft.photos[0]})` }}/>}<div className="relative z-10">
      <header className="flex flex-col gap-4 border-b border-black/8 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><strong className="text-xl">{draft.businessName || "Your Business"}</strong><nav className="flex gap-5 text-sm">{(["home","offerings","contact"] as PreviewPage[]).map((item) => <button key={item} onClick={() => setPage(item)} className={page === item ? "font-bold" : "text-black/50"}>{item === "home" ? "Home" : item === "offerings" ? words.page : "Contact Us"}</button>)}</nav></header>
      {page === "home" && <div><div className="grid min-h-[490px] lg:grid-cols-2"><div className="flex flex-col justify-center px-8 py-14 sm:px-14"><p className="text-xs font-bold uppercase tracking-[.24em]" style={{ color: accent }}>{draft.industry}</p><h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">Welcome to {draft.businessName || "your new website"}.</h1><p className="mt-6 max-w-xl text-lg leading-8 opacity-65">{draft.description || words.fallback}</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={() => setPage("offerings")} className="rounded-full px-6 py-3 font-bold text-white" style={{ backgroundColor: accent }}>Explore {words.page}</button><a href={whatsappUrl} target="_blank" className="rounded-full border border-current/15 px-6 py-3 font-semibold">WhatsApp Us</a></div></div><div className="min-h-[340px] bg-[#e8ddd3] bg-cover bg-center" style={draft.photos[0] ? { backgroundImage: `url(${draft.photos[0]})` } : { background: `linear-gradient(135deg,${accent}66,#eadfd5)` }} /></div><div className="grid gap-4 border-t border-current/10 px-8 py-8 sm:grid-cols-3 sm:px-14"><Info title="Opening hours" value={draft.hours}/><Info title="Location" value={draft.address || "Add your business location"}/><Info title="Direct enquiry" value="Chat with us through WhatsApp"/></div></div>}
      {page === "offerings" && <div className="px-8 py-12 sm:px-14"><p className="text-xs font-bold uppercase tracking-[.24em]" style={{ color: accent }}>WHAT WE OFFER</p><h1 className="mt-4 text-4xl font-bold">{words.page}</h1><div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{draft.offerings.filter((item) => item.name).map((item,index) => <article key={index} className="overflow-hidden rounded-3xl border border-current/10 bg-white/75 shadow-sm backdrop-blur-sm">{draft.photos[index + 1] && <img src={draft.photos[index + 1]} alt={item.name} className="aspect-[4/3] w-full object-cover"/>}<div className="p-6"><div className="h-2 w-16 rounded-full" style={{ backgroundColor: accent }}/><h2 className="mt-6 text-xl font-bold">{item.name}</h2><p className="mt-2 font-semibold" style={{ color: accent }}>{item.price || "Contact us"}</p><p className="mt-4 text-sm leading-6 opacity-60">{item.description || "Ask us for details and availability."}</p><a href={whatsappUrl} target="_blank" className="mt-6 inline-block font-bold" style={{ color: accent }}>{words.verb} through WhatsApp →</a></div></article>)}</div></div>}
      {page === "contact" && <div className="grid min-h-[570px] lg:grid-cols-2"><div className="px-8 py-12 sm:px-14"><p className="text-xs font-bold uppercase tracking-[.24em]" style={{ color: accent }}>GET IN TOUCH</p><h1 className="mt-4 text-4xl font-bold">Contact Us</h1><p className="mt-5 text-black/55">We&apos;d be happy to help with your questions, booking or enquiry.</p><div className="mt-8 space-y-5"><Info title="WhatsApp" value={draft.whatsapp || "Add a WhatsApp number"}/><Info title="Telephone" value={draft.phone || "—"}/><Info title="Address" value={draft.address || "—"}/><Info title="Opening hours" value={draft.hours}/></div><a href={whatsappUrl} target="_blank" className="mt-9 inline-flex rounded-full px-6 py-3 font-bold text-white" style={{ backgroundColor: accent }}>Continue to WhatsApp</a></div><div className="flex items-center justify-center bg-[#eee5dd] p-10"><div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl"><p className="font-bold">Send a quick enquiry</p><input placeholder="Your name" className="mt-5 w-full rounded-xl border border-black/10 p-3"/><input placeholder="Phone number" className="mt-3 w-full rounded-xl border border-black/10 p-3"/><textarea placeholder="How can we help?" rows={4} className="mt-3 w-full rounded-xl border border-black/10 p-3"/><button className="mt-3 w-full rounded-full py-3 font-bold text-white" style={{ backgroundColor: accent }}>Prepare Enquiry</button></div></div></div>}
      <button onClick={() => setChatOpen(!chatOpen)} className="absolute bottom-6 right-6 rounded-full px-5 py-4 font-bold text-white shadow-xl" style={{ backgroundColor: accent }}>{chatOpen ? "Close" : "Ask us"}</button>
      {chatOpen && <div className="absolute bottom-24 right-6 w-[min(340px,calc(100%-3rem))] rounded-3xl bg-white p-5 shadow-2xl"><p className="font-bold">Hi! Welcome to {draft.businessName || "our website"}.</p><p className="mt-2 text-sm leading-6 text-black/55">I can help you explore our {words.page.toLowerCase()} or prepare a WhatsApp enquiry.</p><div className="mt-4 grid gap-2">{[`View ${words.page}`,"Opening hours","Location"].map((label) => <button key={label} onClick={() => label.startsWith("View") ? setPage("offerings") : setPage("contact")} className="rounded-xl border border-black/10 px-4 py-2 text-left text-sm">{label}</button>)}<a href={whatsappUrl} target="_blank" className="rounded-xl px-4 py-2 text-center text-sm font-bold text-white" style={{ backgroundColor: accent }}>Continue to WhatsApp</a></div></div>}
      </div>
    </div>
  </section>;
}

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#0c1114] px-4 py-3 text-white outline-none focus:border-[#c8a467]";
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="block text-sm text-white/65">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={inputClass}/></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="block text-sm text-white/65">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm text-white/65">{label}<span className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c1114] p-2"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"/><span className="text-xs uppercase text-white/45">{value}</span></span></label>; }
function Info({ title, value }: { title: string; value: string }) { return <div><p className="text-xs font-bold uppercase tracking-wider text-black/35">{title}</p><p className="mt-2 leading-6">{value || "—"}</p></div>; }
