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
  cars,
}: {
  facade: FacadeId;
  storeys: number;
  view: "front" | "left" | "right" | "rear";
  roofStyle: RoofStyle;
  eaveDepthFt: number;
  porchDepthFt: number;
  cars: number;
}) {
  const side = view === "left" || view === "right";
  const rear = view === "rear";
  const front = view === "front";
  const wallTop = storeys === 2 ? 190 : 285;
  const upperFloor = 310;
  const ground = 430;
  const left = side ? 105 : 130;
  const right = side ? 795 : 770;
  const palette = {
    "tropical-modern": { wall: "#eee8dc", accent: "#907052", screen: "#9d7047", roof: "#4c4038", glass: "#78a8a3" },
    "kampung-contemporary": { wall: "#f0e6d5", accent: "#6f4b35", screen: "#7b5032", roof: "#49372e", glass: "#79a29d" },
    "urban-malaysian": { wall: "#e9e7e1", accent: "#4e5a57", screen: "#876e54", roof: "#444b49", glass: "#719b99" },
    "homestay-tropical": { wall: "#f2e6d2", accent: "#a05f3f", screen: "#855536", roof: "#6c4335", glass: "#7ca69f" },
  }[facade];
  const frontageM = Math.max(10.8, cars * 2.7 + 5.8);
  const depthM = porchDepthFt * .3048 + 9.2;
  const overallM = side ? depthM : frontageM;
  const window = (x: number, y: number, width: number, height: number, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={width} height={height} fill={palette.glass} stroke="#20312e" strokeWidth="2.4" />
      <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke="#dce8e4" strokeWidth="1.2" />
      <line x1={x - 8} y1={y - 8} x2={x + width + 8} y2={y - 8} stroke="#263a36" strokeWidth="4" />
      <line x1={x - 8} y1={y - 4} x2={x + width + 8} y2={y - 4} stroke="#d4a957" strokeWidth="2" />
    </g>
  );
  const level = (y: number, label: string) => (
    <g key={label}>
      <path d={`M70 ${y} h34`} stroke="#7e8c87" strokeWidth="1" />
      <path d={`M82 ${y - 4} l8 4 -8 4 z`} fill="#263a36" />
      <text x="66" y={y + 3} textAnchor="end" className="elevation-level">{label}</text>
    </g>
  );

  return (
    <svg viewBox="0 0 900 520" role="img" aria-label={`${view} ${facadeNames[facade]} elevation concept`}>
      <defs>
        <pattern id={`hatch-${view}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#b89c75" strokeWidth=".8" />
        </pattern>
      </defs>
      <rect width="900" height="520" fill="#fbfaf6" />
      <path d="M0 430 H900" stroke="#243733" strokeWidth="3.2" />
      <path d="M0 438 C130 426 225 445 340 434 S570 444 900 431 V520 H0 Z" fill="#e6ebe3" />

      {roofStyle === "flat" ? (
        <g>
          <rect x={left - 18} y={wallTop - 36} width={right - left + 36} height="42" fill={palette.roof} stroke="#20312e" strokeWidth="3" />
          <path d={`M${left - 8} ${wallTop - 20} H${right - 8}`} stroke="#7fb4c2" strokeWidth="2" strokeDasharray="8 6" />
          <path d={`M${right - 20} ${wallTop - 28} v25 h14`} fill="none" stroke="#276b7a" strokeWidth="3" />
          <text x={right - 4} y={wallTop - 43} textAnchor="end" className="elevation-note">CONCEALED FALL · OVERFLOW</text>
        </g>
      ) : roofStyle === "hip" ? (
        <g>
          <path d={`M${left - 34} ${wallTop} L${left + 118} ${wallTop - 118} H${right - 118} L${right + 34} ${wallTop} Z`} fill={palette.roof} stroke="#20312e" strokeWidth="3.5" />
          <path d={`M${left + 118} ${wallTop - 118} L${(left + right) / 2} ${wallTop - 142} L${right - 118} ${wallTop - 118}`} fill="none" stroke="#d7a85a" strokeWidth="2" />
          <path d={`M${left - 38} ${wallTop + 2} H${right + 38}`} stroke="#263a36" strokeWidth="7" />
          <path d={`M${left - 36} ${wallTop + 4} H${right + 36}`} stroke="#d5a550" strokeWidth="2" />
          <text x={(left + right) / 2} y={wallTop - 128} textAnchor="middle" className="elevation-note">VENTILATED HIP ROOF · ~30° · {eaveDepthFt} FT EAVE</text>
        </g>
      ) : (
        <g>
          <path d={side
            ? `M${left - 34} ${wallTop} L${left + 150} ${wallTop - 118} H${right - 100} L${right + 34} ${wallTop} Z`
            : `M${left - 34} ${wallTop} L${(left + right) / 2} ${wallTop - 150} L${right + 34} ${wallTop} Z`}
            fill={palette.roof} stroke="#20312e" strokeWidth="3.5" />
          {!side && <circle cx={(left + right) / 2} cy={wallTop - 75} r="18" fill="#6f9892" stroke="#20312e" strokeWidth="3" />}
          <path d={`M${left - 38} ${wallTop + 2} H${right + 38}`} stroke="#263a36" strokeWidth="7" />
          <text x={(left + right) / 2} y={wallTop - 118} textAnchor="middle" className="elevation-note">VENTILATED PITCHED ROOF · {eaveDepthFt} FT EAVE</text>
        </g>
      )}

      <rect x={left} y={wallTop} width={right - left} height={ground - wallTop} fill={palette.wall} stroke="#20312e" strokeWidth="3.2" />
      <rect x={left} y={upperFloor - 8} width={right - left} height="16" fill={palette.accent} opacity=".9" />
      {storeys === 2 && <path d={`M${left} ${upperFloor} H${right}`} stroke="#20312e" strokeWidth="2.3" />}

      {front && (
        <>
          {storeys === 2 && <>
            {window(left + 42, 225, 112, 54, "front-upper-1")}
            {window(right - 162, 225, 112, 54, "front-upper-2")}
            <rect x={(left + right) / 2 - 78} y="208" width="156" height="102" fill={palette.accent} opacity=".18" stroke="#20312e" strokeWidth="2" />
            <g stroke={palette.screen} strokeWidth="7">{[-52,-31,-10,11,32,53].map((offset) => <line key={offset} x1={(left + right) / 2 + offset} y1="215" x2={(left + right) / 2 + offset} y2="302" />)}</g>
          </>}
          <rect x={left + 20} y="326" width={Math.min(400, cars * 122 + 28)} height="104" fill="#dfe5df" stroke="#20312e" strokeWidth="2.5" />
          <path d={`M${left + 6} 322 H${left + Math.min(426, cars * 122 + 54)}`} stroke="#263a36" strokeWidth="12" />
          {Array.from({ length: cars + 1 }, (_, index) => {
            const x = left + 20 + index * (Math.min(400, cars * 122 + 28) / cars);
            return <rect key={x} x={x - 4} y="322" width="8" height="108" fill="#3a4b47" />;
          })}
          {Array.from({ length: cars }, (_, index) => {
            const bay = Math.min(400, cars * 122 + 28) / cars;
            const x = left + 20 + index * bay + bay / 2;
            return <g key={x} stroke="#7c8985" strokeWidth="2" fill="none"><path d={`M${x - 39} 402 q8 -28 27 -28 h29 q20 2 29 28`} /><path d={`M${x - 45} 402 H${x + 52}`} /><circle cx={x - 27} cy="405" r="8" /><circle cx={x + 33} cy="405" r="8" /></g>;
          })}
          <rect x={right - 146} y="336" width="88" height="94" fill={palette.screen} stroke="#20312e" strokeWidth="2.6" />
          <rect x={right - 132} y="350" width="60" height="80" fill="#75543e" stroke="#20312e" strokeWidth="2" />
          <circle cx={right - 84} cy="390" r="3" fill="#d7ac58" />
          <text x={left + 30} y="316" className="elevation-note">{cars}-CAR SHADED PORCH · {porchDepthFt} FT CLEAR DEPTH</text>
        </>
      )}

      {side && (
        <>
          {storeys === 2 && <>
            {window(left + 60, 225, 118, 52, "side-upper-1")}
            {window(left + 285, 225, 104, 52, "side-upper-2")}
            {window(right - 176, 225, 112, 52, "side-upper-3")}
          </>}
          {window(left + 65, 350, 126, 58, "side-ground-1")}
          {window(left + 320, 350, 98, 58, "side-ground-2")}
          <rect x={right - 172} y="341" width="88" height="89" fill={palette.screen} opacity=".9" stroke="#20312e" strokeWidth="2.5" />
          <path d={`M${left + 32} 328 H${right - 34}`} stroke="#263a36" strokeWidth="5" />
          <g stroke={palette.screen} strokeWidth="5">{[0,18,36,54].map((offset) => <line key={offset} x1={right - 158 + offset} y1="349" x2={right - 158 + offset} y2="421" />)}</g>
          <text x={(left + right) / 2} y="321" textAnchor="middle" className="elevation-note">SHADED SIDE OPENINGS · CROSS VENTILATION</text>
        </>
      )}

      {rear && (
        <>
          {storeys === 2 && <>
            {window(left + 55, 225, 110, 52, "rear-upper-1")}
            {window((left + right) / 2 - 55, 225, 110, 52, "rear-upper-2")}
            {window(right - 165, 225, 110, 52, "rear-upper-3")}
          </>}
          {window(left + 55, 350, 118, 58, "rear-ground-1")}
          <rect x={(left + right) / 2 - 48} y="343" width="96" height="87" fill="#75543e" stroke="#20312e" strokeWidth="2.5" />
          {window(right - 175, 355, 112, 53, "rear-ground-2")}
          <path d={`M${left + 25} 326 H${right - 25}`} stroke="#263a36" strokeWidth="6" />
          <rect x={left + 28} y="416" width={right - left - 56} height="14" fill={`url(#hatch-${view})`} />
          <text x={(left + right) / 2} y="322" textAnchor="middle" className="elevation-note">WET KITCHEN · LAUNDRY · COVERED SERVICE YARD</text>
        </>
      )}

      <g fill="none" stroke="#2e4540" strokeWidth="3">
        <path d={`M${left + 8} ${wallTop + 3} v178 q0 16 14 16`} />
        <path d={`M${right - 8} ${wallTop + 3} v178 q0 16 -14 16`} />
      </g>
      <text x={left + 18} y={wallTop + 18} className="elevation-note">RWP</text>
      <text x={right - 18} y={wallTop + 18} textAnchor="end" className="elevation-note">RWP</text>
      {level(ground, "FFL ±0.00")}
      {storeys === 2 && level(upperFloor, "1F +3.15")}
      {level(wallTop, storeys === 2 ? "EAVE +6.30" : "EAVE +3.25")}

      <g stroke="#77837f" strokeWidth="1" fill="none">
        <path d={`M${left} 470 v15 M${right} 470 v15 M${left} 479 H${right}`} />
        <path d={`M${left} 475 l8 4 -8 4 M${right} 475 l-8 4 8 4`} />
      </g>
      <text x={(left + right) / 2} y="474" textAnchor="middle" className="elevation-dimension">APPROX. {overallM.toFixed(1)} m CONCEPT {side ? "DEPTH" : "WIDTH"} · VERIFY FROM PLAN</text>
      <text x="450" y="505" textAnchor="middle" className="elevation-title">{view.toUpperCase()} ELEVATION · {facadeNames[facade].toUpperCase()}</text>
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
              <ElevationDrawing facade={props.facade} storeys={props.storeys} view={view} roofStyle={props.roofStyle} eaveDepthFt={props.eaveDepthFt} porchDepthFt={props.porchDepthFt} cars={props.cars} />
              <div className="wb-watermark">CONCEPT ONLY</div>
            </article>
          ))}
        </div>
        <p>Openings, roof, eaves and porch are revised as one connected concept—not four unrelated images.</p>
      </section>
    </div>
  );
}
