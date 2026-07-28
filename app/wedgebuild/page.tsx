"use client";

import { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";
import ConceptDrawings, { type FacadeId } from "./ConceptDrawings";
import LotBoundaryMapper, { type LotPoint } from "./LotBoundaryMapper";
import { carPorchStandard, estimateInternalProgram, MALAYSIA_SPACE_STANDARDS } from "./malaysiaStandards";
import { indicativeRiverReserve } from "./riverRules";
import { detectBoundaryFromImage } from "./boundaryDetector";
import DesignChat, { type DesignChanges, type RoofStyle } from "./DesignChat";
import { inferArchitecture, rememberAcceptedConcept, type InferredArchitecture } from "./architectureSeedEngine";
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
        <small>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB · attached, awaiting confirmation` : hint}</small>
      </span>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} />
    </label>
  );
}

export default function WedgeBuildPage() {
  const [stage, setStage] = useState<Stage>("land");
  const [titleFile, setTitleFile] = useState<UploadState | null>(null);
  const [surveyFile, setSurveyFile] = useState<UploadState | null>(null);
  const [surveyUrl, setSurveyUrl] = useState<string | null>(null);
  const [lotPoints, setLotPoints] = useState<LotPoint[]>([]);
  const [boundaryConfirmed, setBoundaryConfirmed] = useState(false);
  const [boundaryDetection, setBoundaryDetection] = useState<"idle" | "detecting" | "coloured" | "bold" | "manual">("idle");
  const [siteCondition, setSiteCondition] = useState<"standard" | "river">("standard");
  const [riverWidthM, setRiverWidthM] = useState(5);
  const [riverEdgeIndex, setRiverEdgeIndex] = useState(1);
  const [lotWidth, setLotWidth] = useState(55);
  const [lotDepth, setLotDepth] = useState(90);
  const [frontSetback, setFrontSetback] = useState(16);
  const [rearSetback, setRearSetback] = useState(10);
  const [leftSetback, setLeftSetback] = useState(10);
  const [rightSetback, setRightSetback] = useState(10);
  const [storeys, setStoreys] = useState(2);
  const [facade, setFacade] = useState<FacadeId>("tropical-modern");
  const [designIntelligence, setDesignIntelligence] = useState<InferredArchitecture | null>(null);
  const [roofStyle, setRoofStyle] = useState<RoofStyle>("hip");
  const [eaveDepthFt, setEaveDepthFt] = useState(3.5);
  const [porchDepthFt, setPorchDepthFt] = useState(18);
  const [requestedAisleWidthFt, setRequestedAisleWidthFt] = useState(3);
  const [bedrooms, setBedrooms] = useState(5);
  const [cars, setCars] = useState(2);
  const [brief, setBrief] = useState(roomIdeas[0]);
  const [generated, setGenerated] = useState(false);
  const [conceptSatisfied, setConceptSatisfied] = useState(false);
  const [ownerAccepted, setOwnerAccepted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [paid, setPaid] = useState(false);
  const [architectStatus, setArchitectStatus] = useState<"draft" | "sent">("draft");
  const [notice, setNotice] = useState("");
  const effectiveAisleWidthFt = Math.max(3, requestedAisleWidthFt || 0);

  const calculations = useMemo(() => {
    const envelopeWidth = Math.max(0, lotWidth - leftSetback - rightSetback);
    const envelopeDepth = Math.max(0, lotDepth - frontSetback - rearSetback);
    const polygonArea = lotPoints.length >= 3
      ? Math.abs(lotPoints.reduce((sum, point, index) => {
          const next = lotPoints[(index + 1) % lotPoints.length];
          return sum + point.x * next.y - next.x * point.y;
        }, 0) / 2)
      : 0;
    const pointWidth = lotPoints.length
      ? Math.max(...lotPoints.map((point) => point.x)) - Math.min(...lotPoints.map((point) => point.x))
      : 0;
    const pointDepth = lotPoints.length
      ? Math.max(...lotPoints.map((point) => point.y)) - Math.min(...lotPoints.map((point) => point.y))
      : 0;
    const lotShapeFactor = boundaryConfirmed && polygonArea && pointWidth && pointDepth
      ? Math.max(.55, Math.min(1, polygonArea / (pointWidth * pointDepth)))
      : 1;
    const riverReserveM = siteCondition === "river" ? indicativeRiverReserve(riverWidthM) : 0;
    const riverConstraintFactor = siteCondition === "river"
      ? Math.max(.45, 1 - (riverReserveM * 3.28084) / Math.max(lotWidth, lotDepth, 1))
      : 1;
    const footprint = envelopeWidth * envelopeDepth * 0.7 * lotShapeFactor * riverConstraintFactor;
    const builtUp = footprint * storeys;
    const program = estimateInternalProgram({
      bedrooms,
      storeys,
      wantsAccessibleRoom: /elder|parent|warga|accessible/i.test(brief),
      wantsSurau: /surau|prayer|solat/i.test(brief),
    });
    const porch = carPorchStandard(cars, porchDepthFt);

    return {
      envelopeWidth,
      envelopeDepth,
      footprint,
      builtUp,
      storeys,
      program,
      porch,
      fitRatio: builtUp / Math.max(1, program.totalArea),
      riverReserveM,
      lotShapeFactor,
      riverConstraintFactor,
      confidence: boundaryConfirmed ? "Owner-confirmed geometry" : surveyFile ? "Unconfirmed" : "Dimensions only",
      quality: boundaryConfirmed
        ? `${lotPoints.length}-point lot boundary confirmed by the owner from the uploaded plan. Architect verification is still required.`
        : surveyFile
          ? "The plan is attached, but WedgeBuild will not claim to understand its shape until you trace and confirm the boundary."
          : "No visible land plan is attached. Any preview can only use manual width and depth.",
    };
  }, [
    frontSetback,
    storeys,
    leftSetback,
    lotDepth,
    lotWidth,
    rearSetback,
    rightSetback,
    surveyFile,
    boundaryConfirmed,
    lotPoints,
    bedrooms,
    brief,
    cars,
    siteCondition,
    riverWidthM,
    porchDepthFt,
  ]);

  const activeIndex = stages.findIndex((item) => item.id === stage);
  const canSubmit = paid && ownerAccepted && disclaimerAccepted;

  function rememberFile(file: File | undefined, setter: (next: UploadState | null) => void) {
    if (!file) return setter(null);
    setter({ name: file.name, size: file.size, type: file.type });
  }

  async function rememberSurvey(file: File | undefined) {
    if (!file) {
      setSurveyFile(null);
      setSurveyUrl(null);
      setLotPoints([]);
      setBoundaryConfirmed(false);
      setBoundaryDetection("idle");
      return;
    }
    setSurveyFile({ name: file.name, size: file.size, type: file.type });
    setLotPoints([]);
    setBoundaryConfirmed(false);
    if (file.type.startsWith("image/")) {
      setSurveyUrl(URL.createObjectURL(file));
      setBoundaryDetection("detecting");
      const detection = await detectBoundaryFromImage(file).catch(() => null);
      if (detection) {
        setLotPoints(detection.points);
        setBoundaryDetection(detection.mode);
        setNotice(detection.mode === "coloured"
          ? "A coloured or bold lot boundary was detected. Check every corner and confirm it before design."
          : "A possible bold-line boundary was detected. This lower-confidence outline must be checked or retraced.");
      } else {
        setBoundaryDetection("manual");
        setNotice("No reliable closed boundary was found automatically. Trace the bold lot boundary manually.");
      }
    } else {
      setSurveyUrl(null);
      setBoundaryDetection("manual");
      setNotice("For boundary mapping, upload the survey as JPG or PNG. The PDF remains attached for the architect.");
    }
  }

  function generatePreview() {
    if (siteCondition === "river" && !boundaryConfirmed) {
      setNotice("A river-facing lot requires a visible survey polygon and confirmed river edge before WedgeBuild can test a house envelope.");
      return;
    }
    if (surveyFile && surveyUrl && !boundaryConfirmed) {
      setNotice("Confirm the lot boundary on the uploaded plan first. WedgeBuild will not replace it with a generic rectangle.");
      return;
    }
    const circulationCorrection = requestedAisleWidthFt < 3
      ? `${requestedAisleWidthFt} ft is below the locked circulation standard. WedgeBuild corrected it to a 3 ft clear walking aisle. `
      : "";
    const inference = inferArchitecture({
      brief,
      lotWidth,
      lotDepth,
      storeys,
      cars,
      besideRiver: siteCondition === "river",
    });
    setFacade(inference.facade);
    setRoofStyle(inference.roofStyle);
    setEaveDepthFt(inference.eaveDepthFt);
    setDesignIntelligence(inference);
    setConceptSatisfied(false);
    setGenerated(true);
    setStage("preview");
    setNotice(circulationCorrection + (boundaryConfirmed
      ? "Concept regenerated from the owner-confirmed lot shape, dimensions and Malaysian house brief."
      : "Dimensions-only concept generated. Add and confirm a visible survey plan for matching lot geometry."));
  }

  function refreshIdea() {
    const current = roomIdeas.indexOf(brief);
    setBrief(roomIdeas[(current + 1) % roomIdeas.length]);
    setGenerated(true);
    setNotice("The brief changed. Your free preview is ready to regenerate.");
  }

  function unlockPack() {
    if (!conceptSatisfied || !designIntelligence) {
      setNotice("Confirm that you are satisfied with the free concept before unlocking the RM99 drawing pack.");
      return;
    }
    rememberAcceptedConcept(designIntelligence.facade, brief);
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

  function applyDesignRevision(changes: DesignChanges) {
    if (changes.roofStyle) setRoofStyle(changes.roofStyle);
    if (changes.eaveDepthFt) setEaveDepthFt(changes.eaveDepthFt);
    if (changes.porchDepthFt) setPorchDepthFt(changes.porchDepthFt);
    if (changes.aisleWidthFt) setRequestedAisleWidthFt(Math.max(3, changes.aisleWidthFt));
    if (changes.cars) setCars(changes.cars);
    if (changes.bedrooms) setBedrooms(changes.bedrooms);
    if (changes.facade) setFacade(changes.facade);
    setConceptSatisfied(false);
    setGenerated(true);
    setNotice("The approved chat revision was applied to the connected concept drawings.");
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
            <div><span>Lot geometry</span><b>{calculations.confidence}</b></div>
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
                  hint="JPG or PNG enables boundary mapping"
                  file={surveyFile}
                  onChange={(event) => rememberSurvey(event.target.files?.[0])}
                />
              </div>

              <div className="wb-document-check">
                <span className={`wb-status-dot ${boundaryConfirmed ? "ready" : ""}`} />
                <div><strong>Document understanding—not upload status</strong><p>{boundaryDetection === "detecting" ? "Checking the image for a bold or coloured closed boundary…" : calculations.quality}</p></div>
              </div>

              <LotBoundaryMapper
                imageUrl={surveyUrl}
                points={lotPoints}
                confirmed={boundaryConfirmed}
                onPointsChange={setLotPoints}
                onConfirmedChange={setBoundaryConfirmed}
              />

              <div className="wb-site-condition">
                <div className="wb-section-title"><span>01R</span><h3>Site condition</h3><p>River constraints must be identified before fitting the house.</p></div>
                <div className="wb-fields two">
                  <label>Land condition<select value={siteCondition} onChange={(event) => setSiteCondition(event.target.value as "standard" | "river")}><option value="standard">Normal inland lot</option><option value="river">Lot beside a river / watercourse</option></select></label>
                  {siteCondition === "river" && <label>Existing water-channel width (m)<input type="number" min="0.1" step="0.1" value={riverWidthM} onChange={(event) => setRiverWidthM(Number(event.target.value))} /></label>}
                  {siteCondition === "river" && boundaryConfirmed && <label>River-facing polygon edge<select value={riverEdgeIndex} onChange={(event) => setRiverEdgeIndex(Number(event.target.value))}>{lotPoints.map((_, index) => <option key={index} value={index}>Edge {index + 1}–{((index + 1) % lotPoints.length) + 1}</option>)}</select></label>}
                </div>
                {siteCondition === "river" && <div className="wb-river-rule"><span>PROVISIONAL JPS REFERENCE</span><strong>{calculations.riverReserveM} m river reserve</strong><p>Based on the entered channel-width band. This is not JPS, JAS or PBT approval; gazetted reserve, bank position, flood data and local conditions override it.</p></div>}
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
                  <label>Number of storeys<select value={storeys} onChange={(e) => setStoreys(Number(e.target.value))}><option value={1}>Single storey</option><option value={2}>Double storey</option></select></label>
                  <label>Bedrooms<input type="number" min="1" max="12" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} /></label>
                  <label>Cars under porch<input type="number" min="1" max="4" value={cars} onChange={(e) => setCars(Number(e.target.value))} /></label>
                  <label>Clear porch depth from gate (ft)<input type="number" min="16" max="28" value={porchDepthFt} onChange={(event) => setPorchDepthFt(Math.max(16, Number(event.target.value)))} /></label>
                  <label>Requested clear walking aisle (ft)<input type="number" min="1" max="6" step="0.25" value={requestedAisleWidthFt} onChange={(event) => setRequestedAisleWidthFt(Number(event.target.value))} /></label>
                </div>
                {requestedAisleWidthFt < 3
                  ? <div className="wb-circulation-warning"><span>NON-NEGOTIABLE CORRECTION</span><strong>3 ft clear minimum will be used.</strong><p>Your requested {requestedAisleWidthFt} ft aisle is too narrow. WedgeBuild will not reduce the walking route below 3 ft clear.</p></div>
                  : <div className="wb-circulation-pass"><span>CIRCULATION GATE</span><strong>{effectiveAisleWidthFt} ft clear route protected.</strong><p>Door swings, furniture, cabinets and structural elements may not obstruct this width.</p></div>}
                <div className="wb-inference-note">
                  <span>NO STYLE BUTTONS</span>
                  <strong>WedgeBuild infers the architecture.</strong>
                  <p>Describe the life, feeling, privacy, materials and spaces you want. The engine selects and combines suitable design DNA from the Malaysian architecture seed library.</p>
                </div>
                <label className="wb-brief">Describe the home naturally<textarea value={brief} onChange={(e) => setBrief(e.target.value)} /></label>
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

              <div className="wb-preview-layout wb-preview-layout-v2">
                <ConceptDrawings
                  points={lotPoints}
                  boundaryConfirmed={boundaryConfirmed}
                  lotWidth={lotWidth}
                  lotDepth={lotDepth}
                  envelopeWidth={calculations.envelopeWidth}
                  envelopeDepth={calculations.envelopeDepth}
                  storeys={calculations.storeys}
                  bedrooms={bedrooms}
                  cars={cars}
                  facade={facade}
                  brief={brief}
                  riverConstraint={siteCondition === "river" && boundaryConfirmed ? { edgeIndex: riverEdgeIndex, reserveM: calculations.riverReserveM } : null}
                  roofStyle={roofStyle}
                  eaveDepthFt={eaveDepthFt}
                  porchDepthFt={porchDepthFt}
                  aisleWidthFt={effectiveAisleWidthFt}
                  unlocked={false}
                  designIntelligence={designIntelligence}
                />
                <div className="wb-metrics">
                  <div><small>Buildable envelope</small><strong>{formatNumber(calculations.envelopeWidth)} × {formatNumber(calculations.envelopeDepth)} ft</strong><p>Derived from your lot dimensions minus entered setback assumptions.</p></div>
                  <div><small>Lot-shape adjustment</small><strong>{Math.round(calculations.lotShapeFactor * 100)}%</strong><p>{boundaryConfirmed ? "Irregular or tapered geometry is carried into the planning estimate." : "No confirmed polygon; rectangular dimensions are being used."}</p></div>
                  <div><small>Ground footprint</small><strong>~{formatNumber(calculations.footprint)} sqft</strong><p>Planning estimate adjusted by the confirmed lot-shape factor.</p></div>
                  <div><small>Potential built-up</small><strong>~{formatNumber(calculations.builtUp)} sqft</strong><p>{calculations.storeys} storey concept before professional design review.</p></div>
                  {siteCondition === "river" && <div className="wb-metric-warning"><small>River constraint</small><strong>{calculations.riverReserveM} m provisional</strong><p>Applied inward from selected river edge for concept testing. Authority confirmation is mandatory.</p></div>}
                  <div className={calculations.fitRatio < 1 ? "wb-metric-warning" : "wb-metric-pass"}><small>Space-fit check</small><strong>{calculations.fitRatio < 1 ? "Does not fit" : "Fits provisionally"}</strong><p>Requested internal programme needs about {formatNumber(calculations.program.totalArea)} sqft before the architect refines structure and walls.</p></div>
                  <div><small>Geometry status</small><strong>{calculations.confidence}</strong><p>{calculations.quality}</p></div>
                </div>
              </div>

              {designIntelligence && <div className="wb-intelligence-card">
                <div><span>WEDGE-INFERRED DESIGN LANGUAGE</span><h3>{designIntelligence.title}</h3></div>
                <strong>{designIntelligence.confidence}% design confidence</strong>
                <ul>{designIntelligence.rationale.map((item) => <li key={item}>{item}</li>)}</ul>
                <p>Seed blend: {designIntelligence.seedIds.join(" · ")}. No source house is copied.</p>
              </div>}

              <div className="wb-malaysia-standards">
                <div className="wb-standards-head"><div><span>WEDGEBUILD MALAYSIA DESIGN TARGETS</span><h3>Real dimensions before pretty drawings.</h3></div><p>Planning targets—not authority approval. The architect must verify the applicable state UBBL and PBT requirements.</p></div>
                <div className="wb-standard-grid">
                  {[MALAYSIA_SPACE_STANDARDS.circulation, MALAYSIA_SPACE_STANDARDS.bathroom, MALAYSIA_SPACE_STANDARDS.standardBedroom, MALAYSIA_SPACE_STANDARDS.staircase].map((standard) => (
                    <article key={standard.label}><span>{standard.label}</span><strong>{standard.dimensions}</strong><b>{standard.areaSqft} sqft planning area</b><p>{standard.note}</p></article>
                  ))}
                  <article><span>{calculations.porch.cars}-car porch</span><strong>{calculations.porch.dimensions}</strong><b>~{formatNumber(calculations.porch.areaSqft)} sqft covered area</b><p>{calculations.porch.note} Columns and gates must not block door opening or manoeuvring.</p></article>
                </div>
              </div>

              <div className="wb-room-schedule">
                <div><span>GROUND FLOOR · MALAYSIA</span><p>Shaded porch · living/dining · dry kitchen · wet kitchen/yard · ground room · bath/store</p></div>
                <div><span>UPPER FLOOR</span><p>{calculations.storeys === 2 ? `${Math.max(1, bedrooms - 1)} rooms · family lounge · baths · shaded balcony` : "Not included in selected house type"}</p></div>
                <div><span>OWNER BRIEF</span><p>{brief}</p></div>
              </div>

              <div className="wb-preview-actions">
                <div><strong>Not satisfied?</strong><p>Change the brief, regenerate or leave. Preview remains free.</p></div>
                <button className="wb-secondary" onClick={() => setStage("land")}>Edit & regenerate</button>
                <label className="wb-satisfied"><input type="checkbox" checked={conceptSatisfied} onChange={(event) => setConceptSatisfied(event.target.checked)} /><span><b>I’m satisfied with this concept</b>Only then can the RM99 drawing pack be unlocked.</span></label>
                <button className="wb-primary" disabled={!conceptSatisfied} onClick={unlockPack}>Unlock coordinated drawing pack · RM99</button>
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
              {designIntelligence && <ConceptDrawings
                points={lotPoints}
                boundaryConfirmed={boundaryConfirmed}
                lotWidth={lotWidth}
                lotDepth={lotDepth}
                envelopeWidth={calculations.envelopeWidth}
                envelopeDepth={calculations.envelopeDepth}
                storeys={calculations.storeys}
                bedrooms={bedrooms}
                cars={cars}
                facade={facade}
                brief={brief}
                riverConstraint={siteCondition === "river" && boundaryConfirmed ? { edgeIndex: riverEdgeIndex, reserveM: calculations.riverReserveM } : null}
                roofStyle={roofStyle}
                eaveDepthFt={eaveDepthFt}
                porchDepthFt={porchDepthFt}
                aisleWidthFt={effectiveAisleWidthFt}
                unlocked
                designIntelligence={designIntelligence}
              />}
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

      <DesignChat
        roofStyle={roofStyle}
        eaveDepthFt={eaveDepthFt}
        porchDepthFt={porchDepthFt}
        aisleWidthFt={effectiveAisleWidthFt}
        cars={cars}
        bedrooms={bedrooms}
        facade={facade}
        onApply={applyDesignRevision}
      />

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
