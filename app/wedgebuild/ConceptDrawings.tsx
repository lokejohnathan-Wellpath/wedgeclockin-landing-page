import type { LotPoint } from "./LotBoundaryMapper";
import { carPorchStandard, MALAYSIA_SPACE_STANDARDS } from "./malaysiaStandards";
import type { RoofStyle } from "./DesignChat";

export type FacadeId = "tropical-modern" | "kampung-contemporary" | "urban-malaysian" | "homestay-tropical";

type DrawingProps = {
  points: LotPoint[];
  boundaryConfirmed: boolean;
  lotWidth: number;
  lotDepth: number;
  envelopeWidth: number;
  envelopeDepth: number;
  storeys: number;
  bedrooms: number;
  cars: number;
  facade: FacadeId;
  brief: string;
  riverConstraint: { edgeIndex: number; reserveM: number } | null;
  roofStyle: RoofStyle;
  eaveDepthFt: number;
  porchDepthFt: number;
};

const facadeNames: Record<FacadeId, string> = {
  "tropical-modern": "Tropical Modern Malaysia",
  "kampung-contemporary": "Contemporary Kampung",
  "urban-malaysian": "Urban Malaysian",
  "homestay-tropical": "Tropical Homestay",
};

function normalize(points: LotPoint[]) {
  if (points.length < 3) {
    return [
      { x: 90, y: 65 },
      { x: 620, y: 65 },
      { x: 620, y: 390 },
      { x: 90, y: 390 },
    ];
  }
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return points.map((point) => ({
    x: 90 + ((point.x - minX) / width) * 530,
    y: 55 + ((point.y - minY) / height) * 335,
  }));
}

function shrink(points: LotPoint[], factor: number) {
  const center = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  center.x /= points.length;
  center.y /= points.length;
  return points.map((point) => ({
    x: center.x + (point.x - center.x) * factor,
    y: center.y + (point.y - center.y) * factor,
  }));
}

function pointString(points: LotPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function insetSelectedEdge(points: LotPoint[], edgeIndex: number, distance: number) {
  if (points.length < 3 || distance <= 0) return points;
  const nextIndex = (edgeIndex + 1) % points.length;
  const start = points[edgeIndex];
  const end = points[nextIndex];
  if (!start || !end) return points;
  const center = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  center.x /= points.length;
  center.y /= points.length;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  let normal = { x: -dy / length, y: dx / length };
  if ((center.x - midpoint.x) * normal.x + (center.y - midpoint.y) * normal.y < 0) {
    normal = { x: -normal.x, y: -normal.y };
  }
  return points.map((point, index) =>
    index === edgeIndex || index === nextIndex
      ? { x: point.x + normal.x * distance, y: point.y + normal.y * distance }
      : point,
  );
}

function PlanGrid({ upper, bedrooms, brief, storeys, cars, porchDepthFt }: { upper: boolean; bedrooms: number; brief: string; storeys: number; cars: number; porchDepthFt: number }) {
  const standards = MALAYSIA_SPACE_STANDARDS;
  const wantsSurau = /surau|prayer|solat/i.test(brief);
  const wantsElderly = /elder|parent|warga|accessible/i.test(brief);
  const porch = carPorchStandard(cars, porchDepthFt);
  const room = (name: string, area: number, dimensions: string) => ({ name, area, dimensions });
  const privateRooms = Array.from({ length: Math.max(1, bedrooms - (storeys === 2 ? 1 : 0)) }, (_, index) =>
    index === 0
      ? room("MAIN BEDROOM", standards.mainBedroom.areaSqft, standards.mainBedroom.dimensions)
      : room(`BEDROOM ${index + (storeys === 2 ? 2 : 1)}`, standards.standardBedroom.areaSqft, standards.standardBedroom.dimensions),
  );
  const groundRooms = storeys === 1
    ? [
        room("LIVING + DINING", standards.livingDining.areaSqft, standards.livingDining.dimensions),
        ...privateRooms,
        room("DRY KITCHEN", standards.dryKitchen.areaSqft, standards.dryKitchen.dimensions),
        room("WET KITCHEN / YARD", standards.wetKitchen.areaSqft, standards.wetKitchen.dimensions),
        room(wantsSurau ? "SURAU" : "FLEX ROOM", 70, "7′ × 10′"),
        room("BATH + STORE", standards.bathroom.areaSqft, standards.bathroom.dimensions),
      ]
    : [
        room("LIVING + DINING", standards.livingDining.areaSqft, standards.livingDining.dimensions),
        wantsElderly
          ? room("PARENTS / ACCESSIBLE", standards.accessibleBedroom.areaSqft, standards.accessibleBedroom.dimensions)
          : room("GROUND BEDROOM", standards.standardBedroom.areaSqft, standards.standardBedroom.dimensions),
        room("DRY KITCHEN", standards.dryKitchen.areaSqft, standards.dryKitchen.dimensions),
        room("WET KITCHEN / YARD", standards.wetKitchen.areaSqft, standards.wetKitchen.dimensions),
        room(wantsSurau ? "SURAU + BATH" : "BATH + STORE", standards.bathroom.areaSqft, standards.bathroom.dimensions),
        room("STAIRS + UTILITY", standards.staircase.areaSqft, standards.staircase.dimensions),
      ];
  const upperRooms = [
    room("MASTER SUITE", standards.mainBedroom.areaSqft, standards.mainBedroom.dimensions),
    ...Array.from({ length: Math.max(0, bedrooms - 2) }, (_, index) =>
      room(`BEDROOM ${index + 2}`, standards.standardBedroom.areaSqft, standards.standardBedroom.dimensions)),
    room("FAMILY AREA", standards.familyArea.areaSqft, standards.familyArea.dimensions),
    room("BATH + STAIRS", standards.bathroom.areaSqft + standards.staircase.areaSqft, "5′ × 8′ + 1.0 m stair"),
  ];
  const rooms = upper ? upperRooms : groundRooms;
  const columns = rooms.length > 6 ? 3 : 2;
  const rows = Math.ceil(rooms.length / columns);
  const roomWidth = 536 / columns;
  const roomHeight = 286 / rows;
  const fills = ["#e1eee9", "#f4ead2", "#f7f0df", "#e8eee9", "#f0e3c8"];

  return (
    <svg viewBox="0 0 720 470" role="img" aria-label={upper ? "Upper floor preliminary concept" : "Ground floor preliminary Malaysian concept"}>
      <rect width="720" height="470" fill="#f9f4e9" />
      <rect x="92" y="70" width="536" height="286" fill="#fffdf8" stroke="#183b35" strokeWidth="4" />
      {rooms.map((space, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = 92 + column * roomWidth;
        const y = 70 + row * roomHeight;
        return (
          <g key={`${space.name}-${index}`}>
            <rect x={x} y={y} width={roomWidth} height={roomHeight} fill={fills[index % fills.length]} stroke="#183b35" strokeWidth="2" />
            <text x={x + roomWidth / 2} y={y + roomHeight / 2 - 3} textAnchor="middle" className="plan-room-label">{space.name}</text>
            <text x={x + roomWidth / 2} y={y + roomHeight / 2 + 17} textAnchor="middle" className="plan-dimension-label">{space.dimensions} · {space.area} sqft</text>
          </g>
        );
      })}
      <rect x="160" y="356" width="400" height="46" fill={upper ? "#d6c18b" : "#b8dbd2"} fillOpacity=".72" stroke={upper ? "#9b7a36" : "#477a70"} strokeWidth="2" />
      <text x="360" y="385" textAnchor="middle" className="plan-room-label">{upper ? "SHADED BALCONY" : `${porch.cars}-CAR PORCH · ${porch.dimensions}`}</text>
      <path d="M 628 155 Q 680 213 628 275" fill="none" stroke="#4a776e" strokeWidth="3" strokeDasharray="7 6" />
      <text x="668" y="215" textAnchor="middle" className="plan-note-label" transform="rotate(90 668 215)">CROSS VENTILATION</text>
    </svg>
  );
}

function ElevationDrawing({
  facade,
  storeys,
  view,
  roofStyle,
  eaveDepthFt,
  porchDepthFt,
}: {
  facade: FacadeId;
  storeys: number;
  view: "front" | "left" | "right" | "rear";
  roofStyle: RoofStyle;
  eaveDepthFt: number;
  porchDepthFt: number;
}) {
  const kampung = facade === "kampung-contemporary";
  const urban = facade === "urban-malaysian";
  const homestay = facade === "homestay-tropical";
  const side = view === "left" || view === "right";
  const rear = view === "rear";
  const roof = roofStyle === "flat"
    ? <><rect x="100" y="120" width="520" height="55" fill="#d7d1c4" stroke="#183b35" strokeWidth="4" /><path d="M110 137 H600" stroke="#3e83a2" strokeWidth="3" strokeDasharray="8 6" /><text x="355" y="155" textAnchor="middle" className="plan-note-label">CONCEALED FALL + OVERFLOW</text></>
    : roofStyle === "hip"
      ? <path d="M82 180 L185 82 H535 L642 180 Z" fill="#735849" stroke="#183b35" strokeWidth="4" />
      : <path d="M72 182 L350 66 L650 182 Z" fill="#735849" stroke="#183b35" strokeWidth="4" />;

  return (
    <svg viewBox="0 0 720 390" role="img" aria-label={`${view} ${facadeNames[facade]} elevation concept`}>
      <rect width="720" height="390" fill="#eef3ee" />
      <rect y="330" width="720" height="60" fill="#c8d7c6" />
      {roofStyle === "flat" ? roof : kampung ? (
        <path d="M95 175 L355 58 L625 175 Z" fill="#6f4f38" stroke="#183b35" strokeWidth="4" />
      ) : urban ? (
        <>
          <path d="M95 172 L620 172 L590 115 L155 115 Z" fill="#735849" stroke="#183b35" strokeWidth="4" />
          <path d="M118 180 L602 180" fill="none" stroke="#d5b274" strokeWidth="8" />
        </>
      ) : roof}
      <rect x="115" y={storeys === 2 ? 165 : 205} width="490" height={storeys === 2 ? 165 : 125} fill="#f6efe2" stroke="#183b35" strokeWidth="4" />
      {storeys === 2 && <>
        <rect x="150" y="190" width={side ? 135 : 100} height="62" fill="#8eb7ad" stroke="#183b35" strokeWidth="3" />
        <rect x={side ? 435 : 470} y="190" width={side ? 135 : 100} height="62" fill="#8eb7ad" stroke="#183b35" strokeWidth="3" />
        {!side && <rect x="290" y="190" width="140" height="62" fill="#dcc697" stroke="#183b35" strokeWidth="3" />}
      </>}
      <rect x="150" y="270" width={rear ? 110 : 150} height="60" fill="#78978f" stroke="#183b35" strokeWidth="3" />
      <rect x={rear ? 305 : 455} y="265" width={rear ? 155 : 90} height="65" fill="#88684d" stroke="#183b35" strokeWidth="3" />
      {rear && <rect x="495" y="278" width="70" height="52" fill="#88a9a1" stroke="#183b35" strokeWidth="3" />}
      <path d="M115 265 H605" stroke="#d2aa62" strokeWidth="12" />
      {kampung && <g stroke="#916c40" strokeWidth="5">{[330,350,370,390,410].map((x) => <line key={x} x1={x} y1="267" x2={x} y2="328" />)}</g>}
      {urban && <g fill="#8daaa3">{[315,335,355,375,395,415].map((x) => <rect key={x} x={x} y="268" width="10" height="60" />)}</g>}
      {homestay && <><rect x="310" y="267" width="112" height="63" fill="#9f7a54" stroke="#183b35" strokeWidth="3" /><circle cx="365" cy="295" r="11" fill="#d2aa62" /></>}
      <path d="M105 330 H615" stroke="#183b35" strokeWidth="5" />
      <text x="360" y="351" textAnchor="middle" fill="#48635d" fontSize="10" fontWeight="800">{view === "front" ? `${porchDepthFt} FT CLEAR PORCH DEPTH` : view === "rear" ? "WET KITCHEN + SERVICE YARD" : `${eaveDepthFt} FT EAVE / SIDE SHADE`}</text>
      <text x="360" y="372" textAnchor="middle" fill="#48635d" fontSize="12" fontWeight="800" letterSpacing="2">{view.toUpperCase()} ELEVATION · {facadeNames[facade].toUpperCase()}</text>
    </svg>
  );
}

export default function ConceptDrawings(props: DrawingProps) {
  const lot = normalize(props.points);
  const riverEdge = props.riverConstraint
    ? [lot[props.riverConstraint.edgeIndex], lot[(props.riverConstraint.edgeIndex + 1) % lot.length]]
    : null;
  const riverInset = props.riverConstraint
    ? Math.min(105, (props.riverConstraint.reserveM / Math.max(props.lotWidth, props.lotDepth, 1)) * 530)
    : 0;
  const constrainedLot = props.riverConstraint
    ? insetSelectedEdge(lot, props.riverConstraint.edgeIndex, riverInset)
    : lot;
  const setbackRatio = Math.max(.58, Math.min(.86, Math.min(props.envelopeWidth / Math.max(1, props.lotWidth), props.envelopeDepth / Math.max(1, props.lotDepth))));
  const envelope = shrink(constrainedLot, setbackRatio);
  const massing = shrink(envelope, .78);

  return (
    <div className="wb-drawing-set">
      <section className="wb-drawing-sheet">
        <header><div><small>A01 · SITE RESPONSE</small><h3>Confirmed Lot + Preliminary Envelope</h3></div><b>{props.boundaryConfirmed ? "TRACED FROM UPLOAD" : "DIMENSIONS ONLY"}</b></header>
        <svg viewBox="0 0 720 470" role="img" aria-label="Site response using confirmed lot geometry">
          <defs><pattern id="siteGrid" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M 18 0 L 0 0 0 18" fill="none" stroke="#ded5c5" strokeWidth="1" /></pattern></defs>
          <rect width="720" height="470" fill="url(#siteGrid)" />
          <polygon points={pointString(lot)} fill="#fffdf8" stroke="#183b35" strokeWidth="4" />
          {riverEdge && <>
            <line x1={riverEdge[0].x} y1={riverEdge[0].y} x2={riverEdge[1].x} y2={riverEdge[1].y} stroke="#3e83a2" strokeWidth="16" strokeOpacity=".35" />
            <line x1={riverEdge[0].x} y1={riverEdge[0].y} x2={riverEdge[1].x} y2={riverEdge[1].y} stroke="#2f718e" strokeWidth="5" />
            <text x={(riverEdge[0].x + riverEdge[1].x) / 2} y={(riverEdge[0].y + riverEdge[1].y) / 2 - 15} textAnchor="middle" fill="#285f77" fontSize="12" fontWeight="800">RIVER EDGE · {props.riverConstraint?.reserveM} m INDICATIVE RESERVE</text>
          </>}
          <polygon points={pointString(envelope)} fill="#d2aa62" fillOpacity=".18" stroke="#b98a3c" strokeWidth="3" strokeDasharray="9 7" />
          <polygon points={pointString(massing)} fill="#b8dbd2" fillOpacity=".55" stroke="#3e756b" strokeWidth="3" />
          <text x="360" y="230" textAnchor="middle" fill="#183b35" fontSize="17" fontWeight="800">HOUSE MASSING FOLLOWS LOT</text>
          <line x1={lot[0].x} y1={lot[0].y} x2={lot[1].x} y2={lot[1].y} stroke="#a75c3d" strokeWidth="7" />
          <text x={(lot[0].x + lot[1].x) / 2} y={(lot[0].y + lot[1].y) / 2 + 22} textAnchor="middle" fill="#934b31" fontSize="12" fontWeight="800">ROAD / ACCESS EDGE</text>
        </svg>
        <div className="wb-watermark">ARCHITECT REVIEW ONLY</div>
        <p>Boundary is owner-traced from the uploaded plan; river and building setbacks remain assumptions until JPS, PBT and professional verification.</p>
      </section>

      <section className="wb-drawing-sheet">
        <header><div><small>A02 · GROUND FLOOR</small><h3>Malaysian Tropical Ground Floor</h3></div><b>{props.bedrooms} BEDROOM BRIEF</b></header>
        <PlanGrid upper={false} bedrooms={props.bedrooms} brief={props.brief} storeys={props.storeys} cars={props.cars} porchDepthFt={props.porchDepthFt} />
        <div className="wb-watermark">NOT FOR CONSTRUCTION</div>
        <p>Wet kitchen, shaded arrival, service yard and cross-ventilation are treated as core Malaysian planning needs.</p>
      </section>

      {props.storeys === 2 && (
        <section className="wb-drawing-sheet">
          <header><div><small>A03 · UPPER FLOOR</small><h3>Family + Private Rooms</h3></div><b>{Math.max(1, props.bedrooms - 1)} ROOMS UP</b></header>
          <PlanGrid upper bedrooms={props.bedrooms} brief={props.brief} storeys={props.storeys} cars={props.cars} porchDepthFt={props.porchDepthFt} />
          <div className="wb-watermark">NOT FOR CONSTRUCTION</div>
          <p>Room allocation follows the selected bedroom count and keeps a Malaysian family area upstairs.</p>
        </section>
      )}

      <section className="wb-elevation-section">
        <header><div><small>A04–A07 · COORDINATED ELEVATIONS</small><h3>{facadeNames[props.facade]}</h3></div><b>{props.roofStyle.toUpperCase()} ROOF · {props.eaveDepthFt} FT EAVE</b></header>
        <div className="wb-elevation-set">
          {(["front", "left", "right", "rear"] as const).map((view) => (
            <article className="wb-drawing-sheet wb-facade-sheet" key={view}>
              <header><div><small>{view.toUpperCase()} VIEW</small><h3>{view[0].toUpperCase() + view.slice(1)} Elevation</h3></div><b>REVISION LINKED</b></header>
              <ElevationDrawing facade={props.facade} storeys={props.storeys} view={view} roofStyle={props.roofStyle} eaveDepthFt={props.eaveDepthFt} porchDepthFt={props.porchDepthFt} />
              <div className="wb-watermark">CONCEPT ONLY</div>
            </article>
          ))}
        </div>
        <p>Openings, roof, eaves and porch are revised as one connected concept—not four unrelated images.</p>
      </section>
    </div>
  );
}
