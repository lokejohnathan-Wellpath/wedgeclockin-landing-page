"use client";

import { useMemo, useState } from "react";

type Vertical = "beauty" | "pet";
type Appointment = { time: string; subject: string; detail: string; staff: string; amount: number; status: "confirmed" | "reminder" | "completed" | "missed"; signal?: "due" | "risk" | "loyal" | "offer" };

const data: Record<Vertical, Appointment[]> = {
  beauty: [
    { time: "09:00", subject: "Alicia Tan", detail: "Signature facial · Room 2", staff: "Mei", amount: 288, status: "confirmed", signal: "loyal" },
    { time: "10:30", subject: "Nur Aisyah", detail: "Hair colour · Chair 4", staff: "Daniel", amount: 420, status: "reminder", signal: "offer" },
    { time: "12:00", subject: "Carmen Lee", detail: "Slimming session · RF 1", staff: "Jia", amount: 180, status: "missed", signal: "risk" },
    { time: "14:30", subject: "Shalini Devi", detail: "Cut & treatment · Chair 2", staff: "Daniel", amount: 168, status: "completed", signal: "due" },
  ],
  pet: [
    { time: "09:30", subject: "Milo · Shih Tzu", detail: "Owner Michelle · Full grooming", staff: "Aiman", amount: 95, status: "confirmed", signal: "due" },
    { time: "11:00", subject: "Oyen · Domestic Shorthair", detail: "Owner Farid · Bath & trim", staff: "Sofia", amount: 70, status: "reminder", signal: "risk" },
    { time: "13:00", subject: "Coco · Toy Poodle", detail: "Owner Vivian · Styling", staff: "Aiman", amount: 120, status: "completed", signal: "loyal" },
    { time: "15:30", subject: "Buddy · Golden Retriever", detail: "Owner Jason · Deshedding", staff: "Sofia", amount: 145, status: "confirmed", signal: "offer" },
  ],
};

const statusStyle = {
  confirmed: "border-l-[#4f82b7] bg-[#edf5fb]",
  reminder: "border-l-[#d3a24d] bg-[#fff8e8]",
  completed: "border-l-[#5e9883] bg-[#eef8f3]",
  missed: "border-l-[#c85e5e] bg-[#fff0ef]",
};
const signalStyle = { due: "bg-[#e7b84e]", risk: "bg-[#db744e]", loyal: "bg-[#5e9883]", offer: "bg-[#8b6db1]" };
const signalText = { due: "Return visit approaching", risk: "Attendance needs attention", loyal: "Loyal customer", offer: "Recommendation ready" };

export default function SmartPosWorkspace({ vertical }: { vertical: Vertical }) {
  const [active, setActive] = useState("Calendar");
  const [appointments, setAppointments] = useState(data[vertical]);
  const [selected, setSelected] = useState(0);
  const beauty = vertical === "beauty";
  const total = useMemo(() => appointments.reduce((sum, item) => sum + item.amount, 0), [appointments]);
  const nav = ["Calendar", beauty ? "Clients" : "Owners & Pets", "Point of sale", "Inventory", "Insights"];

  function advance(index: number) {
    setAppointments((current) => current.map((item, i) => i === index ? { ...item, status: item.status === "confirmed" || item.status === "reminder" ? "completed" : item.status } : item));
  }

  return (
    <main className="min-h-screen bg-[#eef0ed] text-[#20282c]">
      <header className="border-b border-[#20282c]/10 bg-[#10191d] text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4">
          <a href="/wedge-smartpos" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d2aa62] font-black text-[#10191d]">W</span><div><p className="font-semibold">Wedge-SmartPOS</p><p className="text-[9px] tracking-[.18em] text-white/45">{beauty ? "BEAUTY & WELLNESS" : "PET CARE"}</p></div></a>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-white/55 sm:block">Demo Branch · Kuala Lumpur</span><button className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold">Manager</button></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[230px_1fr]">
        <aside className="border-r border-[#20282c]/10 bg-[#f8f6f1] p-4 lg:min-h-[calc(100vh-73px)]">
          <button className="mb-5 w-full rounded-xl bg-[#d2aa62] px-4 py-3 text-sm font-bold text-[#152024]">＋ New appointment</button>
          <nav className="flex gap-2 overflow-x-auto lg:block">{nav.map((item) => <button key={item} onClick={() => setActive(item)} className={`mb-1 whitespace-nowrap rounded-lg px-4 py-3 text-left text-sm lg:w-full ${active === item ? "bg-[#20282c] font-bold text-white" : "text-[#5d686c] hover:bg-[#20282c]/5"}`}>{item}</button>)}</nav>
          <div className="mt-8 hidden rounded-xl border border-[#20282c]/10 bg-white p-4 lg:block"><p className="text-[10px] font-bold tracking-[.16em] text-[#b08745]">WEDGE AI</p><p className="mt-2 text-sm font-semibold">4 customer signals today</p><p className="mt-2 text-xs leading-5 text-[#6c7679]">Suggestions require staff approval before any action is sent.</p></div>
        </aside>

        <section className="p-5 sm:p-7 lg:p-9">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold tracking-[.2em] text-[#5e8983]">TUESDAY · 22 JULY</p><h1 className="mt-2 font-serif text-4xl">{active}</h1><p className="mt-2 text-sm text-[#6d777a]">{beauty ? "Clients, staff and treatment resources at a glance." : "Owners, pets and grooming resources at a glance."}</p></div><div className="flex gap-2"><button className="rounded-lg border border-[#20282c]/10 bg-white px-4 py-2.5 text-sm font-semibold">Today</button><button className="rounded-lg border border-[#20282c]/10 bg-white px-4 py-2.5 text-sm font-semibold">Week ▾</button></div></div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3"><Metric label="Today's appointments" value={String(appointments.length)} note={`${appointments.filter(x => x.status === "completed").length} completed`} /><Metric label="Expected sales" value={`RM ${total.toFixed(0)}`} note="Before products & tips" /><Metric label={beauty ? "Client signals" : "Owner signals"} value={String(appointments.filter(x => x.signal).length)} note="Wedge AI monitored" /></div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
            <div className="rounded-2xl border border-[#20282c]/10 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between"><div><h2 className="font-bold">Today&apos;s calendar</h2><p className="mt-1 text-xs text-[#7a8386]">Status colour + small AI signal</p></div><div className="hidden gap-3 text-[10px] text-[#6d777a] sm:flex"><span>● Confirmed</span><span className="text-[#c18e31]">● Reminder</span><span className="text-[#c85e5e]">● Missed</span></div></div>
              <div className="mt-5 space-y-3">{appointments.map((item, index) => <button key={`${item.time}-${item.subject}`} onClick={() => setSelected(index)} className={`grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 rounded-xl border-l-4 p-3 text-left transition hover:shadow-md ${statusStyle[item.status]} ${selected === index ? "ring-2 ring-[#20282c]/15" : ""}`}><span className="text-sm font-bold">{item.time}</span><span><span className="flex items-center gap-2 font-semibold">{item.subject}{item.signal && <span title={signalText[item.signal]} aria-label={signalText[item.signal]} className={`h-2.5 w-2.5 rounded-full ${signalStyle[item.signal]}`} />}</span><span className="mt-1 block text-xs text-[#677175]">{item.detail} · {item.staff}</span></span><span className="text-right"><span className="block text-sm font-bold">RM {item.amount}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-[#6c7679]">{item.status}</span></span></button>)}</div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl bg-[#132126] p-6 text-white shadow-sm"><div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-[.2em] text-[#d2aa62]">WEDGE AI INSIGHT</p><span className={`h-3 w-3 rounded-full ${appointments[selected].signal ? signalStyle[appointments[selected].signal!] : "bg-gray-400"}`} /></div><h3 className="mt-4 font-serif text-2xl">{appointments[selected].subject}</h3><p className="mt-3 text-sm leading-6 text-white/65">{beauty ? "Visits about every 6 weeks and frequently adds a care product after this service." : "Usually returns every 6 weeks. This service often includes a sensitive-skin product purchase."}</p><div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-white/45">Suggested action</p><p className="mt-1 text-sm font-semibold">Prepare a return-visit reminder</p></div><div className="mt-4 grid grid-cols-2 gap-2"><button className="rounded-lg bg-[#d2aa62] px-3 py-2.5 text-xs font-bold text-[#152024]">Review reminder</button><button className="rounded-lg border border-white/15 px-3 py-2.5 text-xs font-bold">Dismiss</button></div></div>
              <div className="rounded-2xl border border-[#20282c]/10 bg-white p-5"><p className="text-xs font-bold text-[#6c7679]">SELECTED APPOINTMENT</p><p className="mt-3 font-semibold">{appointments[selected].detail}</p><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => advance(selected)} className="rounded-lg bg-[#5e8983] px-3 py-2.5 text-xs font-bold text-white">Complete service</button><button className="rounded-lg border border-[#20282c]/10 px-3 py-2.5 text-xs font-bold">Open POS</button></div></div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-[#20282c]/10 bg-white p-5 shadow-sm"><p className="text-xs text-[#6d777a]">{label}</p><p className="mt-2 font-serif text-3xl">{value}</p><p className="mt-2 text-xs text-[#8a9294]">{note}</p></div>;
}
