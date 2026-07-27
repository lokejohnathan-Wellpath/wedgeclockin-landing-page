"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import "./wedgebuild.css";

type Stage = "land" | "preview" | "pack" | "handoff";

type UploadState = {
  name: string;
  size: number;
  type: string;
};

const stages: { id: Stage; number: string; label: string }[] = [
  { id: "land", number: "01", label: "Land & brief" },
  { id: "preview", number: "02", label: "AI preview" },
  { id: "pack", number: "03", label: "RM99 pack" },
  { id: "handoff", number: "04", label: "Architect handoff" },
];

const roomIdeas = [
  "5 bedrooms, elderly room downstairs, dry and wet kitchen, family lounge upstairs and a three-car porch.",
  "4 bedrooms, open living and dining, prayer room, utility yard, garden court and a wide shaded porch.",
  "A compact modern family house with 3 bedrooms, an accessible ground-floor suite and flexible study.",
];

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-MY");
}

function UploadBox({
  title,
  hint,
  file,
  onChange,
}: {
  title: string;
  hint: string;
  file: UploadState | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={`wb-upload ${file ? "is-ready" : ""}`}>
      <span className="wb-upload-icon">{file ? "✓" : "＋"}</span>
      <span>
        <strong>{file ? file.name : title}</strong>
        <small>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB · ready for document check` : hint}</small>
      </span>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} />
    </label>
  );
}

export default function WedgeBuildPage() {
  const [stage, setStage] = useState<Stage>("land");
  const [titleFile, setTitleFile] = useState<UploadState | null>(null);
  const [surveyFile, setSurveyFile] = useState<UploadState | null>(null);
  const [lotWidth, setLotWidth] = useState(55);
  const [lotDepth, setLotDepth] = useState(90);
  const [frontSetback, setFrontSetback] = useState(16);
  const [rearSetback, setRearSetback] = useState(10);
  const [leftSetback, setLeftSetback] = useState(10);
  const [rightSetback, setRightSetback] = useState(10);
  const [houseType, setHouseType] = useState("Double-storey family home");
  const [bedrooms, setBedrooms] = useState(5);
  const [brief, setBrief] = useState(roomIdeas[0]);
  const [generated, setGenerated] = useState(false);
  const [ownerAccepted, setOwnerAccepted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [architectStatus, setArchitectStatus] = useState<"draft" | "sent">("draft");
  const [notice, setNotice] = useState("");

  const calculations = useMemo(() => {
    const envelopeWidth = Math.max(0, lotWidth - leftSetback - rightSetback);
    const envelopeDepth = Math.max(0, lotDepth - frontSetback - rearSetback);
    const footprint = envelopeWidth * envelopeDepth * 0.7;
    const storeys = houseType.toLowerCase().includes("double") ? 2 : 1;
    const builtUp = footprint * storeys;
    const documentScore = (titleFile ? 1 : 0) + (surveyFile ? 1 : 0);

    return {
      envelopeWidth,
      envelopeDepth,
      footprint,
      builtUp,
      storeys,
      confidence: documentScore === 2 ? "Higher" : documentScore === 1 ? "Medium" : "Low",
      quality:
        documentScore === 2
          ? "Both documents are attached. An architect must still verify their contents."
          : documentScore === 1
            ? "One supporting document is missing. Manual dimensions remain owner-provided."
            : "No land document attached. Preview uses manual dimensions only.",
    };
  }, [
    frontSetback,
    houseType,
    leftSetback,
    lotDepth,
    lotWidth,
    rearSetback,
    rightSetback,
    surveyFile,
    titleFile,
  ]);

  const activeIndex = stages.findIndex((item) => item.id === stage);
  const canSubmit = paid && ownerAccepted && disclaimerAccepted;

  function rememberFile(file: File | undefined, setter: (next: UploadState | null) => void) {
    if (!file) return setter(null);
    setter({ name: file.name, size: file.size, type: file.type });
  }

  function generatePreview() {
    setGenerated(true);
    setStage("preview");
    setNotice("A new preliminary concept was generated from your current brief and dimensions.");
  }

  function refreshIdea() {
    const current = roomIdeas.indexOf(brief);
    setBrief(roomIdeas[(current + 1) % roomIdeas.length]);
    setGenerated(true);
    setNotice("The brief changed. Your free preview is ready to regenerate.");
  }

  function unlockPack() {
    setPaid(true);
    setStage("pack");
    setNotice("Prototype payment recorded. The Wedge Build Pack is now shown as unlocked.");
  }

  function sendToArchitect() {
    if (!canSubmit) {
      setNotice("Complete both declarations and unlock the RM99 pack before architect handoff.");
      return;
    }
    setArchitectStatus("sent");
    setStage("handoff");
    setNotice("Handoff request prepared. The architect may accept, decline or request clarification.");
  }

  return (
    <main className="wb-shell">
      <header className="wb-header">
        <Link className="wb-brand" href="/">
          <span>W</span>
          <div>
            <strong>WEDGE-WORKS</strong>
            <small>WEDGEBUILD</small>
          </div>
        </Link>
        <div className="wb-header-note">PHASE 1 · PRELIMINARY PLANNING</div>
      </header>

      <section className="wb-hero">
        <div className="wb-hero-copy">
          <p className="wb-kicker">BUILD ON MY LAND</p>
          <h1>We build with documents,<br />not with promises.</h1>
          <p className="wb-intro">
            Turn your land information and house idea into a preliminary concept pack,
            then hand clear documents to a registered architect.
          </p>
          <div className="wb-hero-actions">
            <button onClick={() => setStage("land")}>Start with my land</button>
            <a href="#how-it-works">See how it works</a>
          </div>
          <p className="wb-scope-note">Free preview · RM99 to unlock · no contractor appointment in Phase 1</p>
        </div>

        <div className="wb-blueprint" aria-label="Preliminary architectural document illustration">
          <div className="wb-plan-grid" />
          <div className="wb-plan-title">
            <span>PRELIMINARY CONCEPT</span>
            <b>LOT {lotWidth}&apos; × {lotDepth}&apos;</b>
          </div>
          <div className="wb-plan-building">
            <span className="wb-room room-one">LIVING</span>
            <span className="wb-room room-two">KITCHEN</span>
            <span className="wb-room room-three">ROOM</span>
            <span className="wb-room room-four">ROOM</span>
            <span className="wb-room room-five">PORCH</span>
          </div>
          <span className="wb-measure wb-measure-x">{formatNumber(calculations.envelopeWidth)} FT ENVELOPE</span>
          <span className="wb-measure wb-measure-y">{formatNumber(calculations.envelopeDepth)} FT</span>
          <div className="wb-stamp">FOR ARCHITECT<br />REVIEW ONLY</div>
        </div>
      </section>

      <section id="how-it-works" className="wb-process">
        {stages.map((item, index) => (
          <button
            key={item.id}
            className={`${index <= activeIndex ? "is-active" : ""} ${stage === item.id ? "is-current" : ""}`}
            onClick={() => (item.id === "land" || generated ? setStage(item.id) : setNotice("Create your free preview first."))}
          >
            <span>{item.number}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </section>

      <section className="wb-workspace">
        <aside className="wb-sidebar">
          <p className="wb-kicker">YOUR BUILD FILE</p>
          <h2>One clear path from idea to architect.</h2>
          <div className="wb-file-summary">
            <div><span>Land title</span><b>{titleFile ? "Attached" : "Needed"}</b></div>
            <div><span>Survey / site plan</span><b>{surveyFile ? "Attached" : "Optional"}</b></div>
            <div><span>Concept confidence</span><b>{calculations.confidence}</b></div>
            <div><span>Sketch pack</span><b>{paid ? "Unlocked" : "Locked"}</b></div>
          </div>
          <p className="wb-side-disclaimer">
            WedgeBuild prepares documents and an architect handoff. It does not approve plans,
            appoint contractors or certify construction.
          </p>
        </aside>

        <div className="wb-stage">
          {stage === "land" && (
            <div className="wb-stage-inner">
              <div className="wb-stage-heading">
                <div><p>STEP 01</p><h2>Tell us about the land.</h2></div>
                <span>Private working draft</span>
              </div>

              <div className="wb-upload-grid">
                <UploadBox
                  title="Upload land title"
                  hint="PDF, JPG or PNG"
                  file={titleFile}
                  onChange={(event) => rememberFile(event.target.files?.[0], setTitleFile)}
                />
                <UploadBox
                  title="Upload survey / site plan"
                  hint="Recommended for stronger confidence"
                  file={surveyFile}
                  onChange={(event) => rememberFile(event.target.files?.[0], setSurveyFile)}
                />
              </div>

              <div className="wb-document-check">
                <span className={`wb-status-dot ${titleFile || surveyFile ? "ready" : ""}`} />
                <div><strong>Document-quality check</strong><p>{calculations.quality}</p></div>
              </div>

              <div className="wb-form-section">
                <div className="wb-section-title"><span>01A</span><h3>Land dimensions</h3><p>Enter dimensions from your documents. Wedge does not invent them.</p></div>
                <div className="wb-fields four">
                  <label>Lot width (ft)<input type="number" min="1" value={lotWidth} onChange={(e) => setLotWidth(Number(e.target.value))} /></label>
                  <label>Lot depth (ft)<input type="number" min="1" value={lotDepth} onChange={(e) => setLotDepth(Number(e.target.value))} /></label>
                  <label>Front setback (ft)<input type="number" min="0" value={frontSetback} onChange={(e) => setFrontSetback(Number(e.target.value))} /></label>
                  <label>Rear setback (ft)<input type="number" min="0" value={rearSetback} onChange={(e) => setRearSetback(Number(e.target.value))} /></label>
                  <label>Left setback (ft)<input type="number" min="0" value={leftSetback} onChange={(e) => setLeftSetback(Number(e.target.value))} /></label>
                  <label>Right setback (ft)<input type="number" min="0" value={rightSetback} onChange={(e) => setRightSetback(Number(e.target.value))} /></label>
                </div>
                <p className="wb-assumption">Setbacks are editable planning assumptions until verified against the title, survey and relevant PBT requirements by an architect.</p>
              </div>

              <div className="wb-form-section">
                <div className="wb-section-title"><span>01B</span><h3>House brief</h3><p>Describe how the home should work for your family.</p></div>
                <div className="wb-fields two">
                  <label>House type<select value={houseType} onChange={(e) => setHouseType(e.target.value)}><option>Double-storey family home</option><option>Single-storey family home</option><option>Modern kampung home</option><option>Homestay residence</option></select></label>
                  <label>Bedrooms<input type="number" min="1" max="12" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} /></label>
                </div>
                <label className="wb-brief">Chat with Wedge AI<textarea value={brief} onChange={(e) => setBrief(e.target.value)} /></label>
                <div className="wb-inline-actions">
                  <button className="wb-primary" onClick={generatePreview}>Generate free preview</button>
                  <button className="wb-secondary" onClick={refreshIdea}>Try another brief</button>
                </div>
              </div>
            </div>
          )}

          {stage === "preview" && (
            <div className="wb-stage-inner">
              <div className="wb-stage-heading">
                <div><p>STEP 02 · FREE</p><h2>Your preliminary concept.</h2></div>
                <span className="wb-free-badge">RM0 PREVIEW</span>
              </div>

              <div className="wb-preview-layout">
                <div className="wb-sheet">
                  <div className="wb-sheet-head"><div><small>WEDGEBUILD / OWNER CONCEPT</small><h3>{houseType}</h3></div><b>REV 01</b></div>
                  <svg viewBox="0 0 720 470" role="img" aria-label="Preliminary site envelope and ground floor concept">
                    <defs><pattern id="smallGrid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M 18 0 L 0 0 0 18" fill="none" stroke="#d8cdbb" strokeWidth="1" /></pattern></defs>
                    <rect width="720" height="470" fill="url(#smallGrid)" />
                    <rect x="70" y="35" width="580" height="380" fill="#fbf7ee" stroke="#20322f" strokeWidth="4" />
                    <rect x="172" y="94" width="376" height="255" fill="#e5d4ac" fillOpacity=".56" stroke="#ad8640" strokeWidth="3" strokeDasharray="8 7" />
                    <rect x="213" y="128" width="294" height="181" fill="#f7f0df" stroke="#20322f" strokeWidth="4" />
                    <line x1="360" y1="128" x2="360" y2="309" stroke="#20322f" strokeWidth="3" />
                    <line x1="213" y1="218" x2="507" y2="218" stroke="#20322f" strokeWidth="3" />
                    <line x1="430" y1="218" x2="430" y2="309" stroke="#20322f" strokeWidth="3" />
                    <text x="284" y="180" textAnchor="middle" fill="#20322f" fontSize="18" fontWeight="700">LIVING</text>
                    <text x="433" y="180" textAnchor="middle" fill="#20322f" fontSize="18" fontWeight="700">ROOM</text>
                    <text x="285" y="268" textAnchor="middle" fill="#20322f" fontSize="18" fontWeight="700">KITCHEN</text>
                    <text x="468" y="268" textAnchor="middle" fill="#20322f" fontSize="15" fontWeight="700">BATH / STORE</text>
                    <rect x="244" y="309" width="230" height="40" fill="#8bb0a9" fillOpacity=".62" stroke="#456f68" strokeWidth="3" />
                    <text x="359" y="335" textAnchor="middle" fill="#20322f" fontSize="15" fontWeight="700">PORCH / ARRIVAL</text>
                    <line x1="70" y1="437" x2="650" y2="437" stroke="#ae6847" strokeWidth="5" />
                    <text x="360" y="461" textAnchor="middle" fill="#9b5032" fontSize="15" fontWeight="800">ASSUMED ROAD / FACADE</text>
                  </svg>
                  <div className="wb-watermark">NOT FOR CONSTRUCTION</div>
                  <p>Preliminary layout logic only · room positions remain editable · architect verification required</p>
                </div>

                <div className="wb-metrics">
                  <div><small>Buildable envelope</small><strong>{formatNumber(calculations.envelopeWidth)} × {formatNumber(calculations.envelopeDepth)} ft</strong><p>Derived from your lot dimensions minus entered setback assumptions.</p></div>
                  <div><small>Ground footprint</small><strong>~{formatNumber(calculations.footprint)} sqft</strong><p>Planning estimate using 70% of the entered envelope.</p></div>
                  <div><small>Potential built-up</small><strong>~{formatNumber(calculations.builtUp)} sqft</strong><p>{calculations.storeys} storey concept before professional design review.</p></div>
                  <div><small>Document confidence</small><strong>{calculations.confidence}</strong><p>{calculations.quality}</p></div>
                </div>
              </div>

              <div className="wb-room-schedule">
                <div><span>GROUND FLOOR</span><p>Living · dining · kitchen · room · bath · store · porch</p></div>
                <div><span>UPPER FLOOR</span><p>{calculations.storeys === 2 ? `${Math.max(1, bedrooms - 1)} rooms · family lounge · baths · balcony idea` : "Not included in selected house type"}</p></div>
                <div><span>OWNER BRIEF</span><p>{brief}</p></div>
              </div>

              <div className="wb-preview-actions">
                <div><strong>Not satisfied?</strong><p>Change the brief, regenerate or leave. Preview remains free.</p></div>
                <button className="wb-secondary" onClick={() => setStage("land")}>Edit & regenerate</button>
                <button className="wb-primary" onClick={unlockPack}>Unlock Wedge Build Pack · RM99</button>
              </div>
            </div>
          )}

          {stage === "pack" && (
            <div className="wb-stage-inner">
              <div className="wb-stage-heading">
                <div><p>STEP 03 · UNLOCKED</p><h2>Your Wedge Build Pack.</h2></div>
                <span className="wb-paid-badge">RM99 PAID</span>
              </div>
              <div className="wb-pack-grid">
                {[
                  ["01", "Land brief", "Owner-entered lot data, attached document list and planning assumptions."],
                  ["02", "Site envelope", "Preliminary buildable area and road-facing orientation assumption."],
                  ["03", "Floor concepts", "Ground and upper floor arrangement with bathroom placement."],
                  ["04", "Room schedule", "Room names, intended use and owner’s brief in one clean record."],
                  ["05", "Build-up estimate", "Derived planning area—not a valuation, bill of quantities or quotation."],
                  ["06", "Handoff files", "Architect-review PDF and preliminary DXF transfer record."],
                ].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p><b>FOR ARCHITECT REVIEW ONLY</b></article>)}
              </div>
              <div className="wb-declarations">
                <h3>Required before architect handoff</h3>
                <label><input type="checkbox" checked={ownerAccepted} onChange={(e) => setOwnerAccepted(e.target.checked)} /><span><b>Owner / representative declaration</b>I confirm I am the landowner or authorised representative and the information supplied is accurate to the best of my knowledge.</span></label>
                <label><input type="checkbox" checked={disclaimerAccepted} onChange={(e) => setDisclaimerAccepted(e.target.checked)} /><span><b>Preliminary AI concept disclaimer</b>I understand this pack is not an approved plan and cannot be used for submission, construction, financing, valuation, certification or CCC.</span></label>
              </div>
              <div className="wb-preview-actions">
                <div><strong>Ready for professional review?</strong><p>The appointed architect remains free to accept, decline or request clarification.</p></div>
                <button className="wb-primary" disabled={!canSubmit} onClick={sendToArchitect}>Continue to architect handoff</button>
              </div>
            </div>
          )}

          {stage === "handoff" && (
            <div className="wb-stage-inner">
              <div className="wb-stage-heading">
                <div><p>STEP 04</p><h2>Architect handoff.</h2></div>
                <span className={architectStatus === "sent" ? "wb-paid-badge" : ""}>{architectStatus === "sent" ? "REQUEST PREPARED" : "DRAFT"}</span>
              </div>
              <div className="wb-handoff">
                <div className="wb-handoff-main">
                  <p className="wb-kicker">WHAT THE ARCHITECT RECEIVES</p>
                  <h3>A clear starting file—not a promise of approval.</h3>
                  <ul>
                    <li>Owner identity and authority declaration</li>
                    <li>Land-title and survey attachment record</li>
                    <li>Preliminary site and floor concepts</li>
                    <li>Room schedule and owner brief</li>
                    <li>All assumptions, limitations and document confidence</li>
                  </ul>
                </div>
                <div className="wb-architect-card">
                  <span>PROFESSIONAL RESPONSE</span>
                  <h3>Architect review queue</h3>
                  <div><b>Accept</b><p>Proceed to appointment checkout.</p></div>
                  <div><b>Ask clarification</b><p>Owner answers before acceptance.</p></div>
                  <div><b>Decline</b><p>Request closes without appointment.</p></div>
                </div>
              </div>
              <div className="wb-appointment">
                <div><small>APPOINTMENT CHECKOUT</small><strong>RM1,000</strong><p>Only after architect acceptance.</p></div>
                <div><span>RM500</span><p>Wedge document and handoff fee</p></div>
                <div><span>RM500</span><p>Architect initial retainer</p></div>
                <button disabled>Locked until architect accepts</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="wb-boundary">
        <p className="wb-kicker">THE PHASE 1 BOUNDARY</p>
        <h2>Preparation stops where professional work begins.</h2>
        <div>
          <article><span>WEDGE HANDLES</span><p>Document intake, preliminary concepts, room schedule, planning estimates and a structured architect handoff.</p></article>
          <article><span>THE ARCHITECT HANDLES</span><p>Verification, design development, professional advice, authority requirements and formal appointment terms.</p></article>
          <article><span>NOT IN PHASE 1</span><p>Contractor selection, quotations, construction, financing, valuations, engineering certification, approval or CCC.</p></article>
        </div>
      </section>

      <footer className="wb-footer">
        <div><strong>WEDGE-WORKS / WEDGEBUILD</strong><p>Build On My Land · Phase 1</p></div>
        <p>This AI concept is preliminary and for planning discussion only. It is not for authority submission, construction, financing, valuation, professional certification or CCC.</p>
      </footer>

      {notice && <button className="wb-notice" onClick={() => setNotice("")}>{notice}<span>×</span></button>}
    </main>
  );
}
