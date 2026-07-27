"use client";

import { useState } from "react";
import type { FacadeId } from "./ConceptDrawings";

export type RoofStyle = "pitched" | "flat" | "hip";

export type DesignChanges = {
  roofStyle?: RoofStyle;
  eaveDepthFt?: number;
  porchDepthFt?: number;
  cars?: number;
  bedrooms?: number;
  facade?: FacadeId;
};

type Message = { role: "assistant" | "user"; text: string };

type Props = {
  roofStyle: RoofStyle;
  eaveDepthFt: number;
  porchDepthFt: number;
  cars: number;
  bedrooms: number;
  facade: FacadeId;
  onApply: (changes: DesignChanges, summary: string) => void;
};

function numberNear(text: string, words: string[]) {
  for (const word of words) {
    const before = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:ft|feet|foot|kaki|')?\\s*${word}`, "i"));
    if (before) return Number(before[1]);
    const after = text.match(new RegExp(`${word}[^\\d]{0,12}(\\d+(?:\\.\\d+)?)`, "i"));
    if (after) return Number(after[1]);
  }
  return null;
}

function analyse(text: string): { answer: string; changes: DesignChanges } {
  const lower = text.toLowerCase();
  const changes: DesignChanges = {};
  const findings: string[] = [];

  if (/flat roof|bumbung rata/.test(lower)) {
    changes.roofStyle = "flat";
    findings.push("Use a flat-roof expression with concealed falls, rainwater outlets and emergency overflow—not a level slab.");
  } else if (/hip roof|bumbung limas/.test(lower)) {
    changes.roofStyle = "hip";
    findings.push("Use a hipped roof for stronger all-round shade and Malaysian rain response.");
  } else if (/pitched roof|gable|bumbung curam|bumbung kampung/.test(lower)) {
    changes.roofStyle = "pitched";
    findings.push("Use a pitched roof with visible rain protection and ventilated roof volume.");
  }

  if (/eave|overhang|cucur atap/.test(lower)) {
    const requested = numberNear(lower, ["eave", "overhang", "cucur"]);
    changes.eaveDepthFt = Math.max(2.5, Math.min(6, requested ?? 3.5));
    findings.push(`Set the planning eave depth to ${changes.eaveDepthFt} ft and update all affected elevations.`);
  }

  const carCount = numberNear(lower, ["cars?", "kereta"]);
  if (carCount) {
    changes.cars = Math.max(1, Math.min(4, Math.round(carCount)));
    findings.push(`Re-plan the porch for ${changes.cars} car${changes.cars > 1 ? "s" : ""}, including door and column clearance.`);
  }

  if (/porch|car porch|anjung kereta/.test(lower)) {
    const requested = numberNear(lower, ["porch", "anjung"]);
    if (requested) {
      changes.porchDepthFt = Math.max(16, Math.min(28, requested));
      findings.push(requested < 16
        ? `${requested} ft is below WedgeBuild’s minimum. I propose 16 ft; 18 ft remains preferred.`
        : `Set clear gate-to-obstruction porch depth to ${changes.porchDepthFt} ft.`);
    }
  }

  const bedroomCount = numberNear(lower, ["bedrooms?", "bilik tidur"]);
  if (bedroomCount) {
    changes.bedrooms = Math.max(1, Math.min(12, Math.round(bedroomCount)));
    findings.push(`Recalculate both floors for ${changes.bedrooms} bedrooms without reducing the room-size targets.`);
  }

  if (/kampung/.test(lower)) changes.facade = "kampung-contemporary";
  else if (/homestay/.test(lower)) changes.facade = "homestay-tropical";
  else if (/urban|bandar/.test(lower)) changes.facade = "urban-malaysian";
  else if (/tropical|tropika/.test(lower)) changes.facade = "tropical-modern";
  if (changes.facade) findings.push("Update the front, left, right and rear elevation language together.");

  if (/toilet|bathroom|bilik air|tandas/.test(lower)) {
    findings.push("Keep every bathroom/toilet at or above 40 sqft, ventilated, and avoid a direct opening toward the kitchen or dining area.");
  }
  if (/stair|tangga/.test(lower)) {
    findings.push("Protect the 1.0 m clear stair, 270 mm tread, maximum 175 mm riser, landing and 2.1 m headroom targets.");
  }
  if (/river|sungai/.test(lower)) {
    findings.push("The room change must remain outside the selected river-reserve band and requires JPS/PBT confirmation.");
  }

  if (!findings.length) {
    return {
      answer: "Tell me the exact element to revise—roof, eave, porch, bedrooms, toilet, staircase or facade. I will check the affected plans and elevations before proposing a revision.",
      changes,
    };
  }

  return {
    answer: `${findings.join(" ")} Review this proposal; no drawing changes have been applied yet.`,
    changes,
  };
}

export default function DesignChat(props: Props) {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Tell me what to change in English or Bahasa Malaysia. I will check Malaysian room, roof, porch and site rules before creating a revision." },
  ]);
  const [pending, setPending] = useState<{ changes: DesignChanges; summary: string } | null>(null);
  const [revision, setRevision] = useState(1);

  function send() {
    const clean = input.trim();
    if (!clean) return;
    const result = analyse(clean);
    setMessages((current) => [...current, { role: "user", text: clean }, { role: "assistant", text: result.answer }]);
    setPending(Object.keys(result.changes).length ? { changes: result.changes, summary: result.answer } : null);
    setInput("");
  }

  function apply() {
    if (!pending) return;
    props.onApply(pending.changes, pending.summary);
    const nextRevision = revision + 1;
    setRevision(nextRevision);
    setMessages((current) => [...current, { role: "assistant", text: `Revision ${String(nextRevision).padStart(2, "0")} applied across the connected drawings.` }]);
    setPending(null);
  }

  return (
    <aside className={`wb-design-chat ${open ? "is-open" : ""}`}>
      <button className="wb-chat-toggle" type="button" onClick={() => setOpen((current) => !current)}>
        <span>W</span><div><b>Plan Chat</b><small>REV {String(revision).padStart(2, "0")}</small></div><em>{open ? "×" : "↑"}</em>
      </button>
      {open && (
        <div className="wb-chat-body">
          <div className="wb-chat-context">
            <span>{props.roofStyle} roof</span><span>{props.eaveDepthFt} ft eave</span><span>{props.porchDepthFt} ft porch</span><span>{props.cars} cars</span>
          </div>
          <div className="wb-chat-messages">
            {messages.map((message, index) => <p key={index} className={message.role}>{message.text}</p>)}
          </div>
          {pending && <div className="wb-chat-proposal"><b>PROPOSED REVISION</b><p>Review before changing the drawings.</p><div><button type="button" onClick={() => setPending(null)}>Discard</button><button type="button" onClick={apply}>Apply revision</button></div></div>}
          <div className="wb-chat-input">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Example: Flat roof, 4 ft eaves and porch for 3 cars…" />
            <button type="button" onClick={send}>Send</button>
          </div>
          <p className="wb-chat-foot">Planning assistance only · architect verification required</p>
        </div>
      )}
    </aside>
  );
}
