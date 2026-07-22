"use client";

import { useEffect, useRef, useState } from "react";

export default function RotatingLaptop() {
  const [rotation, setRotation] = useState(-18);
  const [tilt, setTilt] = useState(-7);
  const [dragging, setDragging] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const pointer = useRef({ x: 0, y: 0, rotation: 0, tilt: 0 });

  useEffect(() => {
    if (dragging || interacting) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const delta = Math.min(32, now - previous);
      previous = now;
      setRotation((value) => (value + delta * 0.006) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [dragging, interacting]);

  function start(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = {
      x: event.clientX,
      y: event.clientY,
      rotation,
      tilt,
    };
    setDragging(true);
  }

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setRotation(pointer.current.rotation + (event.clientX - pointer.current.x) * 0.55);
    setTilt(Math.max(-22, Math.min(16, pointer.current.tilt - (event.clientY - pointer.current.y) * 0.18)));
  }

  function end(event: React.PointerEvent<HTMLDivElement>) {
    if (dragging) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
  }

  return (
    <div
      className="relative mx-auto h-[390px] w-full max-w-[620px] cursor-grab touch-none select-none active:cursor-grabbing sm:h-[500px]"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      aria-label="Interactive rotating laptop showing the Wedge-CEO dashboard"
    >
      <div className="absolute inset-x-[12%] bottom-[12%] h-10 rounded-[50%] bg-[#d2aa62]/20 blur-2xl" />
      <div className="absolute inset-0 [perspective:1200px]">
        <div
          className="absolute left-1/2 top-1/2 h-[250px] w-[390px] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] transition-transform duration-100 sm:h-[310px] sm:w-[490px]"
          style={{ transform: `translate(-50%,-50%) rotateX(${tilt}deg) rotateY(${rotation}deg)` }}
        >
          <div className="absolute inset-0 rounded-[18px] border-[9px] border-[#232a2e] bg-[#080d10] p-3 shadow-[0_45px_90px_rgba(0,0,0,.65)] [backface-visibility:hidden] sm:border-[12px]">
            <CeoDashboard />
          </div>
          <div className="absolute inset-0 rounded-[18px] border border-white/10 bg-[linear-gradient(145deg,#242b2f,#0b0e10)] [backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(2px)]">
            <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d2aa62]/30 bg-[#d2aa62]/10" />
          </div>
          <div className="absolute left-1/2 top-[98%] h-[150px] w-[440px] -translate-x-1/2 origin-top rounded-b-[24px] bg-[linear-gradient(180deg,#42494d,#171b1e)] shadow-[0_32px_55px_rgba(0,0,0,.5)] [transform:rotateX(73deg)] [transform-style:preserve-3d] sm:h-[185px] sm:w-[550px]">
            <div className="absolute inset-x-[8%] top-[12%] grid h-[58%] grid-cols-12 gap-1 rounded-lg bg-[#111518] p-2 opacity-85">
              {Array.from({ length: 48 }).map((_, index) => <span key={index} className="rounded-[2px] border border-white/5 bg-[#30373b]" />)}
            </div>
            <div className="absolute bottom-[8%] left-1/2 h-[24%] w-[30%] -translate-x-1/2 rounded-md border border-black/30 bg-[#30363a]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CeoDashboard() {
  return (
    <div className="h-full overflow-hidden rounded-lg bg-[#0d1316] p-3 text-[#f3efe7] sm:p-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div><p className="text-[7px] font-bold tracking-[.18em] text-[#d2aa62] sm:text-[9px]">WEDGE-CEO</p><p className="text-[5px] text-white/40 sm:text-[7px]">Executive intelligence desk</p></div>
        <span className="rounded-full bg-[#5e8983]/20 px-2 py-1 text-[5px] text-[#a9d1cb] sm:text-[7px]">LIVE VIEW</span>
      </div>
      <div className="mt-3 grid grid-cols-[1.35fr_.65fr] gap-2 sm:gap-3">
        <div className="rounded-md border border-white/8 bg-white/[.035] p-2 sm:p-3">
          <div className="flex items-center justify-between"><span className="text-[5px] text-white/35 sm:text-[7px]">BUSINESS MOMENTUM</span><b className="text-[7px] text-[#d2aa62] sm:text-[9px]">+12.4%</b></div>
          <div className="mt-3 flex h-16 items-end gap-1 sm:h-20">{[24,35,31,48,44,61,56,72,68,84,78,92].map((height,index)=><span key={index} className="flex-1 rounded-t-sm bg-gradient-to-t from-[#5e8983]/45 to-[#d2aa62]" style={{height:`${height}%`}} />)}</div>
        </div>
        <div className="grid gap-2">
          <Metric label="Health" value="87" />
          <Metric label="Cash" value="Stable" />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3"><Metric label="Revenue" value="↑ 8.2%" /><Metric label="Labour" value="Optimal" /><Metric label="Priority" value="Growth" /></div>
      <div className="mt-2 rounded-md border border-[#d2aa62]/20 bg-[#d2aa62]/5 p-2 sm:mt-3"><p className="text-[5px] font-bold tracking-[.12em] text-[#d2aa62] sm:text-[7px]">CEO RECOMMENDATION</p><p className="mt-1 text-[5px] leading-relaxed text-white/50 sm:text-[7px]">Protect margin while converting current demand into controlled growth.</p></div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-white/8 bg-white/[.035] p-2"><p className="text-[5px] text-white/30 sm:text-[7px]">{label}</p><p className="mt-1 text-[7px] font-bold text-[#f1dfbc] sm:text-[9px]">{value}</p></div>;
}
