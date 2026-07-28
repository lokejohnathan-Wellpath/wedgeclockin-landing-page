import type { LotPoint } from "./LotBoundaryMapper";
import { carPorchStandard, MALAYSIA_SPACE_STANDARDS } from "./malaysiaStandards";
import type { RoofStyle } from "./DesignChat";
import { PAID_DRAWING_GATE, type InferredArchitecture } from "./architectureSeedEngine";

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
  aisleWidthFt: number;
  unlocked: boolean;
  designIntelligence: InferredArchitecture | null;
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

function PlanGrid({
  upper,
  bedrooms,
  brief,
  storeys,
  cars,
  porchDepthFt,
  aisleWidthFt,
  buildingWidthFt,
  buildingDepthFt,
}: {
  upper: boolean;
  bedrooms: number;
  brief: string;
  storeys: number;
  cars: number;
  porchDepthFt: number;
  aisleWidthFt: number;
  buildingWidthFt: number;
  buildingDepthFt: number;
}) {
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
  const fills = ["#e1eee9", "#f4ead2", "#f7f0df", "#e8eee9", "#f0e3c8"];
  const planWidth = Math.max(18, buildingWidthFt);
  const planDepth = Math.max(25, buildingDepthFt);
  const totalDepth = planDepth + (upper ? 0 : porchDepthFt);
  const scale = Math.min(690 / planWidth, 465 / totalDepth);
  const drawnWidth = planWidth * scale;
  const drawnDepth = planDepth * scale;
  const clearAisleFt = Math.max(3, aisleWidthFt);
  const aisleDrawn = Math.min(drawnWidth * .2, clearAisleFt * scale);
  const usableWidth = drawnWidth - aisleDrawn;
  const porchWidth = Math.min(planWidth, porch.widthM / .3048) * scale;
  const porchDepth = upper ? 0 : porchDepthFt * scale;
  const planX = (900 - drawnWidth) / 2;
  const planY = 54;
  const roomTotal = rooms.reduce((sum, room) => sum + room.area, 0);
  const columns = rooms.reduce<typeof rooms[]>((groups, room) => {
    const groupAreas = groups.map((group) => group.reduce((sum, item) => sum + item.area, 0));
    const target = groupAreas[0] <= groupAreas[1] ? 0 : 1;
    groups[target].push(room);
    return groups;
  }, [[], []]);
  const roomLayouts = columns.flatMap((column, columnIndex) => {
    const columnArea = column.reduce((sum, room) => sum + room.area, 0);
    const columnWidth = usableWidth * (columnArea / roomTotal);
    const previousColumnArea = columns
      .slice(0, columnIndex)
      .flat()
      .reduce((sum, room) => sum + room.area, 0);
    const columnX = planX + usableWidth * (previousColumnArea / roomTotal) + columnIndex * aisleDrawn;
    const layouts = column.map((room, roomIndex) => {
      const height = drawnDepth * (room.area / columnArea);
      const previousRoomArea = column
        .slice(0, roomIndex)
        .reduce((sum, item) => sum + item.area, 0);
      const roomY = planY + drawnDepth * (previousRoomArea / columnArea);
      return { ...room, x: columnX, y: roomY, width: columnWidth, height, key: `${columnIndex}-${roomIndex}-${room.name}` };
    });
    return layouts;
  });

  return (
    <svg viewBox="0 0 900 620" role="img" aria-label={upper ? "Upper floor dimensioned preliminary concept" : "Ground floor dimensioned Malaysian concept"}>
      <defs><pattern id={`plan-hatch-${upper ? "upper" : "ground"}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#b8a98e" strokeWidth=".8" /></pattern></defs>
      <rect width="900" height="620" fill="#fbfaf6" />
      <text x="36" y="28" className="elevation-note">N ↑ · PRELIMINARY SPACE-AREA LAYOUT · FRONT / ROAD AT BOTTOM</text>
      <rect x={planX + usableWidth * (columns[0].reduce((sum, room) => sum + room.area, 0) / roomTotal)} y={planY} width={aisleDrawn} height={drawnDepth} fill="#f5f1e8" stroke="#b38135" strokeWidth="2" strokeDasharray="8 5" />
      <text
        x={planX + usableWidth * (columns[0].reduce((sum, room) => sum + room.area, 0) / roomTotal) + aisleDrawn / 2}
        y={planY + drawnDepth / 2}
        textAnchor="middle"
        className="plan-note-label"
        transform={`rotate(-90 ${planX + usableWidth * (columns[0].reduce((sum, room) => sum + room.area, 0) / roomTotal) + aisleDrawn / 2} ${planY + drawnDepth / 2})`}
      >
        {clearAisleFt.toFixed(2)} FT CLEAR WALKING AISLE · NO OBSTRUCTION
      </text>
      {roomLayouts.map((space, index) => {
        const compact = space.width < 145 || space.height < 82;
        return (
          <g key={space.key}>
            <rect x={space.x} y={space.y} width={space.width} height={space.height} fill={fills[index % fills.length]} stroke="#183b35" strokeWidth="2.2" />
            <text x={space.x + space.width / 2} y={space.y + space.height / 2 - 3} textAnchor="middle" className={compact ? "plan-room-label compact" : "plan-room-label"}>{space.name}</text>
            <text x={space.x + space.width / 2} y={space.y + space.height / 2 + 16} textAnchor="middle" className="plan-dimension-label">{space.dimensions} · {space.area} sqft target</text>
            <path d={`M${space.x + space.width - 34} ${space.y + space.height} v-28 a28 28 0 0 1 28 28`} fill="none" stroke="#7d8c87" strokeWidth="1.2" />
            {space.name.includes("STAIRS") && Array.from({ length: 9 }, (_, tread) => (
              <line key={tread} x1={space.x + 8} y1={space.y + 10 + tread * Math.max(5, (space.height - 20) / 9)} x2={space.x + space.width - 8} y2={space.y + 10 + tread * Math.max(5, (space.height - 20) / 9)} stroke="#6f7e79" strokeWidth="1" />
            ))}
          </g>
        );
      })}
      <rect x={planX} y={planY} width={drawnWidth} height={drawnDepth} fill="none" stroke="#102d27" strokeWidth="6" />
      {upper ? (
        <>
          <rect x={planX + drawnWidth * .22} y={planY + drawnDepth} width={drawnWidth * .56} height="34" fill="#d6c18b" fillOpacity=".65" stroke="#816b3c" strokeWidth="2" />
          <text x="450" y={planY + drawnDepth + 22} textAnchor="middle" className="plan-note-label">SHADED BALCONY</text>
        </>
      ) : (
        <>
          <rect x={(900 - porchWidth) / 2} y={planY + drawnDepth} width={porchWidth} height={porchDepth} fill="#b8dbd2" fillOpacity=".65" stroke="#477a70" strokeWidth="2.5" />
          {Array.from({ length: cars - 1 }, (_, index) => <line key={index} x1={(900 - porchWidth) / 2 + (porchWidth / cars) * (index + 1)} y1={planY + drawnDepth} x2={(900 - porchWidth) / 2 + (porchWidth / cars) * (index + 1)} y2={planY + drawnDepth + porchDepth} stroke="#779e95" strokeWidth="1.5" strokeDasharray="6 5" />)}
          <text x="450" y={planY + drawnDepth + porchDepth / 2 - 4} textAnchor="middle" className="plan-room-label">{porch.cars}-CAR PORCH</text>
          <text x="450" y={planY + drawnDepth + porchDepth / 2 + 15} textAnchor="middle" className="plan-dimension-label">{porch.dimensions} · CLEAR DEPTH FROM GATE</text>
        </>
      )}
      <g stroke="#71807b" strokeWidth="1" fill="none">
        <path d={`M${planX} 42 v-12 M${planX + drawnWidth} 42 v-12 M${planX} 35 H${planX + drawnWidth}`} />
        <path d={`M${planX} 31 l7 4 -7 4 M${planX + drawnWidth} 31 l-7 4 7 4`} />
        <path d={`M${planX - 18} ${planY} h-13 M${planX - 18} ${planY + drawnDepth} h-13 M${planX - 25} ${planY} V${planY + drawnDepth}`} />
        <path d={`M${planX - 29} ${planY} l4 7 4-7 M${planX - 29} ${planY + drawnDepth} l4-7 4 7`} />
      </g>
      <text x="450" y="30" textAnchor="middle" className="elevation-dimension">{planWidth.toFixed(1)} FT BUILDING WIDTH</text>
      <text x={planX - 39} y={planY + drawnDepth / 2} textAnchor="middle" className="elevation-dimension" transform={`rotate(-90 ${planX - 39} ${planY + drawnDepth / 2})`}>{planDepth.toFixed(1)} FT BUILDING DEPTH</text>
      {!upper && <text x="450" y="606" textAnchor="middle" className="elevation-title">ROAD / FRONT GATE · PORCH DEPTH {porchDepthFt} FT</text>}
    </svg>
  );
}

function Concept3DView({
  facade,
  roofStyle,
  storeys,
  cars,
  buildingWidthFt,
  buildingDepthFt,
}: {
  facade: FacadeId;
  roofStyle: RoofStyle;
  storeys: number;
  cars: number;
  buildingWidthFt: number;
  buildingDepthFt: number;
}) {
  const palette = {
    "tropical-modern": { wall: "#eee7da", side: "#d7cbbb", accent: "#4a3d35", frame: "#9b6e46", glass: "#7ea5a2" },
    "kampung-contemporary": { wall: "#efe2cd", side: "#d2bea4", accent: "#603f2e", frame: "#80583a", glass: "#7d9f9a" },
    "urban-malaysian": { wall: "#e6e6e2", side: "#c9cfcc", accent: "#384643", frame: "#7b6652", glass: "#73999a" },
    "homestay-tropical": { wall: "#f0e2cf", side: "#d5bfa5", accent: "#81503a", frame: "#96613e", glass: "#79a09a" },
  }[facade];
  const frontLeft = 195;
  const frontRight = 900;
  const ground = 560;
  const wallTop = storeys === 2 ? 188 : 322;
  const depthX = Math.min(190, Math.max(115, buildingDepthFt * 3.2));
  const depthY = -96;
  const upperLine = storeys === 2 ? 372 : ground;
  const frontWidth = frontRight - frontLeft;
  const windowCount = Math.max(2, Math.min(4, Math.round(buildingWidthFt / 18)));

  return (
    <svg viewBox="0 0 1200 700" role="img" aria-label={`Coordinated three-dimensional ${facadeNames[facade]} exterior concept`}>
      <defs>
        <linearGradient id="wb3dSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dfe9e7" /><stop offset=".72" stopColor="#f3eee2" /></linearGradient>
        <linearGradient id="wb3dGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#afceca" /><stop offset=".45" stopColor={palette.glass} /><stop offset="1" stopColor="#496d6b" /></linearGradient>
        <linearGradient id="wb3dGround" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8c9b7a" /><stop offset="1" stopColor="#bac09f" /></linearGradient>
        <filter id="wb3dShadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="14" floodColor="#14231f" floodOpacity=".22" /></filter>
      </defs>
      <rect width="1200" height="700" fill="url(#wb3dSky)" />
      <circle cx="1035" cy="110" r="54" fill="#fff5d8" opacity=".75" />
      <path d="M0 545 C180 515 320 535 490 516 S870 542 1200 500 V700 H0 Z" fill="url(#wb3dGround)" />
      <path d="M70 640 L420 542 H1040 L1160 625 Z" fill="#c9c5b9" opacity=".9" />
      <g filter="url(#wb3dShadow)">
        <polygon points={`${frontRight},${wallTop} ${frontRight + depthX},${wallTop + depthY} ${frontRight + depthX},${ground + depthY} ${frontRight},${ground}`} fill={palette.side} stroke="#263b36" strokeWidth="3" />
        <rect x={frontLeft} y={wallTop} width={frontWidth} height={ground - wallTop} fill={palette.wall} stroke="#263b36" strokeWidth="3" />
        {storeys === 2 && <rect x={frontLeft} y={upperLine - 10} width={frontWidth} height="20" fill={palette.accent} />}

        {roofStyle === "flat" && <>
          <polygon points={`${frontLeft - 20},${wallTop} ${frontRight + 26},${wallTop} ${frontRight + depthX + 26},${wallTop + depthY} ${frontLeft + depthX - 20},${wallTop + depthY}`} fill="#303b38" stroke="#1c2b27" strokeWidth="4" />
          <rect x={frontLeft - 20} y={wallTop - 24} width={frontWidth + 46} height="25" fill={palette.accent} stroke="#1c2b27" strokeWidth="3" />
        </>}
        {roofStyle === "butterfly" && <>
          <polygon points={`${frontLeft - 25},${wallTop - 76} ${(frontLeft + frontRight) / 2},${wallTop - 15} ${frontRight + 25},${wallTop - 76} ${frontRight + depthX + 10},${wallTop + depthY - 75} ${(frontLeft + frontRight) / 2 + depthX},${wallTop + depthY - 15} ${frontLeft + depthX - 10},${wallTop + depthY - 75}`} fill="#3d4945" stroke="#1c2b27" strokeWidth="4" />
          <path d={`M${(frontLeft + frontRight) / 2} ${wallTop - 15} L${(frontLeft + frontRight) / 2 + depthX} ${wallTop + depthY - 15}`} stroke="#6fb5c4" strokeWidth="8" />
        </>}
        {roofStyle === "skillion" && <polygon points={`${frontLeft - 25},${wallTop - 100} ${frontRight + 25},${wallTop - 28} ${frontRight + depthX + 20},${wallTop + depthY - 28} ${frontLeft + depthX - 20},${wallTop + depthY - 100}`} fill="#3d4945" stroke="#1c2b27" strokeWidth="4" />}
        {(roofStyle === "pitched" || roofStyle === "hip") && <>
          <polygon points={`${frontLeft - 28},${wallTop} ${(frontLeft + frontRight) / 2},${wallTop - 140} ${frontRight + 28},${wallTop} ${frontRight + depthX + 10},${wallTop + depthY} ${(frontLeft + frontRight) / 2 + depthX},${wallTop + depthY - 140} ${frontLeft + depthX - 10},${wallTop + depthY}`} fill="#453d38" stroke="#1c2b27" strokeWidth="4" />
          {roofStyle === "hip" && <path d={`M${frontLeft - 28} ${wallTop} L${(frontLeft + frontRight) / 2 + depthX} ${wallTop + depthY - 140} L${frontRight + 28} ${wallTop}`} fill="none" stroke="#b38a53" strokeWidth="3" />}
        </>}

        {Array.from({ length: windowCount }, (_, index) => {
          const bay = frontWidth / windowCount;
          const x = frontLeft + bay * index + bay * .17;
          const width = bay * .64;
          return (
            <g key={`lower-${index}`}>
              <rect x={x} y={upperLine + 36} width={width} height={ground - upperLine - 78} fill="url(#wb3dGlass)" stroke="#253a35" strokeWidth="5" />
              <line x1={x + width / 2} y1={upperLine + 36} x2={x + width / 2} y2={ground - 42} stroke="#d9e7e3" strokeWidth="2" />
            </g>
          );
        })}
        {storeys === 2 && Array.from({ length: windowCount }, (_, index) => {
          const bay = frontWidth / windowCount;
          const x = frontLeft + bay * index + bay * .18;
          const width = bay * .62;
          return <rect key={`upper-${index}`} x={x} y={wallTop + 42} width={width} height={125} fill="url(#wb3dGlass)" stroke="#253a35" strokeWidth="5" />;
        })}

        <rect x={frontRight - 138} y={ground - 130} width="90" height="130" fill={palette.frame} stroke="#263b36" strokeWidth="4" />
        <circle cx={frontRight - 64} cy={ground - 63} r="4" fill="#e1bd72" />
        <rect x={frontLeft + 58} y={wallTop + 24} width="96" height={ground - wallTop - 24} fill={palette.accent} opacity=".9" />
        <g stroke="#c9a86c" strokeWidth="8">
          {[0, 1, 2, 3, 4].map((index) => <line key={index} x1={frontLeft + 72 + index * 17} y1={wallTop + 45} x2={frontLeft + 72 + index * 17} y2={ground - 22} />)}
        </g>

        <polygon points={`${frontRight - 310},${ground - 112} ${frontRight + depthX + 25},${ground + depthY - 112} ${frontRight + depthX + 25},${ground + depthY - 94} ${frontRight - 310},${ground - 94}`} fill="#35433f" />
        {Array.from({ length: cars }, (_, index) => {
          const x = frontRight - 265 + index * 104;
          return <g key={`car-${index}`} transform={`translate(${x} ${ground - 58})`} fill="none" stroke="#596864" strokeWidth="3"><path d="M-38 8 q9-27 29-27 h27 q19 2 29 27" /><path d="M-47 8 H54" /><circle cx="-28" cy="12" r="9" /><circle cx="35" cy="12" r="9" /></g>;
        })}
      </g>
      <g fill="#365c4d">
        {[95, 145, 1010, 1060, 1110].map((x, index) => <g key={x}><circle cx={x} cy={535 - (index % 2) * 12} r={30 + (index % 3) * 7} /><rect x={x - 4} y="540" width="8" height="58" fill="#6f6047" /></g>)}
      </g>
      <text x="42" y="48" className="elevation-note">COORDINATED 3D EXTERIOR CONCEPT · SAME MASSING / ROOF / OPENING DATA AS DRAWING SET</text>
      <text x="42" y="76" className="elevation-dimension">{buildingWidthFt.toFixed(1)} FT BUILDING WIDTH · {buildingDepthFt.toFixed(1)} FT BUILDING DEPTH · {storeys} STOREY</text>
    </svg>
  );
}

function ProfessionalTitleBlock({ sheet, title }: { sheet: string; title: string }) {
  return (
    <aside className="wb-title-block">
      <div className="wb-title-brand"><span>W</span><strong>WEDGEBUILD</strong><small>JUNIOR ARCHITECT CONCEPT ENGINE</small></div>
      <div className="wb-title-warning">WEDGE BUILD PRELIMINARY DRAWING<br />NOT FOR SUBMISSION · NOT FOR CONSTRUCTION<br />FOR ARCHITECT REVIEW ONLY</div>
      <dl>
        <div><dt>PROJECT</dt><dd>OWNER CONCEPT RESIDENCE</dd></div>
        <div><dt>DRAWING</dt><dd>{title}</dd></div>
        <div><dt>STATUS</dt><dd>PRELIMINARY · REV 01</dd></div>
        <div><dt>SCALE</dt><dd>DIAGRAMMATIC / DIMENSION LINKED</dd></div>
        <div><dt>CHECK</dt><dd>APPOINTED ARCHITECT TO VERIFY</dd></div>
      </dl>
      <div className="wb-title-number"><small>SHEET NO.</small><strong>{sheet}</strong></div>
    </aside>
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
  buildingWidthFt,
  buildingDepthFt,
}: {
  facade: FacadeId;
  storeys: number;
  view: "front" | "left" | "right" | "rear";
  roofStyle: RoofStyle;
  eaveDepthFt: number;
  porchDepthFt: number;
  cars: number;
  buildingWidthFt: number;
  buildingDepthFt: number;
}) {
  const side = view === "left" || view === "right";
  const rear = view === "rear";
  const front = view === "front";
  const wallTop = storeys === 2 ? 190 : 285;
  const upperFloor = 310;
  const ground = 430;
  const maximumSpanFt = Math.max(buildingWidthFt, buildingDepthFt, 1);
  const viewSpanFt = side ? buildingDepthFt : buildingWidthFt;
  const drawnSpan = Math.max(360, 700 * (viewSpanFt / maximumSpanFt));
  const left = (900 - drawnSpan) / 2;
  const right = left + drawnSpan;
  const palette = {
    "tropical-modern": { wall: "#eee8dc", accent: "#907052", screen: "#9d7047", roof: "#4c4038", glass: "#78a8a3" },
    "kampung-contemporary": { wall: "#f0e6d5", accent: "#6f4b35", screen: "#7b5032", roof: "#49372e", glass: "#79a29d" },
    "urban-malaysian": { wall: "#e9e7e1", accent: "#4e5a57", screen: "#876e54", roof: "#444b49", glass: "#719b99" },
    "homestay-tropical": { wall: "#f2e6d2", accent: "#a05f3f", screen: "#855536", roof: "#6c4335", glass: "#7ca69f" },
  }[facade];
  const overallM = viewSpanFt * .3048;
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

      {roofStyle === "butterfly" ? (
        <g>
          <path d={`M${left - 34} ${wallTop - 104} L${(left + right) / 2} ${wallTop - 28} L${right + 34} ${wallTop - 104} L${right + 18} ${wallTop - 118} L${(left + right) / 2} ${wallTop - 48} L${left - 18} ${wallTop - 118} Z`} fill={palette.roof} stroke="#20312e" strokeWidth="3.5" />
          <path d={`M${(left + right) / 2} ${wallTop - 48} V${wallTop - 12}`} stroke="#2f718e" strokeWidth="7" />
          <path d={`M${(left + right) / 2 - 12} ${wallTop - 48} H${(left + right) / 2 + 12}`} stroke="#7fc2d3" strokeWidth="3" />
          <text x={(left + right) / 2} y={wallTop - 130} textAnchor="middle" className="elevation-note">BUTTERFLY ROOF · CENTRAL BOX GUTTER · OUTLET + EMERGENCY OVERFLOW</text>
        </g>
      ) : roofStyle === "skillion" ? (
        <g>
          <path d={`M${left - 34} ${wallTop - 112} L${right + 34} ${wallTop - 32} L${right + 20} ${wallTop - 14} L${left - 20} ${wallTop - 91} Z`} fill={palette.roof} stroke="#20312e" strokeWidth="3.5" />
          <path d={`M${left - 34} ${wallTop - 112} L${right + 34} ${wallTop - 32}`} stroke="#d7a85a" strokeWidth="2" />
          <path d={`M${right + 18} ${wallTop - 34} v35 h-14`} fill="none" stroke="#276b7a" strokeWidth="3" />
          <text x={(left + right) / 2} y={wallTop - 127} textAnchor="middle" className="elevation-note">MONO-PITCH / SKILLION · SINGLE DRAINAGE DIRECTION · VENTILATED HIGH EDGE</text>
        </g>
      ) : roofStyle === "flat" ? (
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
          {view === "left" ? (
            <>
              {storeys === 2 && <>
                {window(left + 60, 225, 118, 52, "left-upper-1")}
                {window(left + 285, 225, 104, 52, "left-upper-2")}
                {window(right - 176, 225, 112, 52, "left-upper-3")}
              </>}
              {window(left + 65, 350, 126, 58, "left-ground-1")}
              {window(left + 320, 350, 98, 58, "left-ground-2")}
              <rect x={right - 172} y="341" width="88" height="89" fill={palette.screen} opacity=".9" stroke="#20312e" strokeWidth="2.5" />
              <g stroke={palette.screen} strokeWidth="5">{[0,18,36,54].map((offset) => <line key={offset} x1={right - 158 + offset} y1="349" x2={right - 158 + offset} y2="421" />)}</g>
              <text x={(left + right) / 2} y="321" textAnchor="middle" className="elevation-note">LIVING / BEDROOM SIDE · SHADED OPENINGS</text>
            </>
          ) : (
            <>
              {storeys === 2 && <>
                {window(left + 78, 228, 105, 49, "right-upper-1")}
                <rect x={(left + right) / 2 - 28} y="215" width="56" height="86" fill={palette.glass} stroke="#20312e" strokeWidth="2.5" />
                {[0,1,2,3].map((line) => <line key={line} x1={(left + right) / 2 - 22} y1={230 + line * 18} x2={(left + right) / 2 + 22} y2={230 + line * 18} stroke="#dce8e4" strokeWidth="1.4" />)}
                {window(right - 170, 228, 102, 49, "right-upper-2")}
              </>}
              <rect x={left + 72} y="360" width="78" height="38" fill={palette.glass} stroke="#20312e" strokeWidth="2.3" />
              <text x={left + 111} y="414" textAnchor="middle" className="elevation-note">HIGH-LEVEL BATH WINDOW</text>
              {window(right - 210, 350, 122, 58, "right-ground-1")}
              <path d={`M${(left + right) / 2 - 42} 316 H${(left + right) / 2 + 42}`} stroke={palette.accent} strokeWidth="8" />
              <text x={(left + right) / 2} y="321" textAnchor="middle" className="elevation-note">STAIR DAYLIGHT SLOT · SERVICE SIDE</text>
            </>
          )}
          <path d={`M${left + 32} 328 H${right - 34}`} stroke="#263a36" strokeWidth="5" />
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

function StairCoordinationDrawing() {
  const treads = Array.from({ length: 9 }, (_, index) => index);
  return (
    <svg viewBox="0 0 1200 690" role="img" aria-label="Coordinated residential stair plan and section">
      <defs>
        <pattern id="stairConcrete" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#a8a8a8" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="1200" height="690" fill="#fff" />
      <text x="38" y="35" className="elevation-note">A08 · STAIR COORDINATION · ARCHITECT TO VERIFY STRUCTURE, FIRE SAFETY AND APPLICABLE UBBL</text>

      <g transform="translate(55 88)">
        <text x="0" y="-18" className="elevation-title">GROUND FLOOR STAIR PLAN · 1:50</text>
        <rect x="0" y="0" width="390" height="260" fill="none" stroke="#111" strokeWidth="5" />
        <rect x="32" y="28" width="135" height="202" fill="none" stroke="#222" strokeWidth="2" />
        <rect x="223" y="28" width="135" height="202" fill="none" stroke="#222" strokeWidth="2" />
        {treads.map((index) => <line key={`l-${index}`} x1="32" y1={28 + index * 22.4} x2="167" y2={28 + index * 22.4} stroke="#222" />)}
        {treads.map((index) => <line key={`r-${index}`} x1="223" y1={28 + index * 22.4} x2="358" y2={28 + index * 22.4} stroke="#222" />)}
        <rect x="167" y="28" width="56" height="202" fill="url(#stairConcrete)" stroke="#222" />
        <path d="M100 205 V58 l-11 16 M100 58 l11 16" stroke="#111" strokeWidth="2.5" fill="none" />
        <text x="112" y="124" className="elevation-note">UP</text>
        <path d="M290 58 V205 l-11-16 M290 205 l11-16" stroke="#111" strokeWidth="2.5" fill="none" />
        <text x="302" y="126" className="elevation-note">DOWN</text>
        <path d="M0 282 V300 M390 282 V300 M0 293 H390" stroke="#555" fill="none" />
        <text x="195" y="316" textAnchor="middle" className="elevation-dimension">4.40 m OVERALL PLANNING BAY</text>
        <text x="195" y="345" textAnchor="middle" className="elevation-note">1.00 m CLEAR FLIGHT · FULL LANDING · GUARDING BOTH SIDES</text>
      </g>

      <g transform="translate(520 78)">
        <text x="0" y="-8" className="elevation-title">STAIR SECTION · 1:50</text>
        <path d="M25 505 H605 M25 505 V492 H115" stroke="#111" strokeWidth="4" fill="none" />
        <path d="M115 492 l180-270 h98 l180-270" transform="translate(0 270)" stroke="#111" strokeWidth="5" fill="none" />
        {treads.map((index) => {
          const x = 115 + index * 20;
          const y = 492 - index * 30;
          return <path key={`s1-${index}`} d={`M${x} ${y} h20 v-30`} stroke="#111" strokeWidth="2" fill="none" />;
        })}
        {treads.map((index) => {
          const x = 393 + index * 20;
          const y = 222 - index * 30;
          return <path key={`s2-${index}`} d={`M${x} ${y} h20 v-30`} stroke="#111" strokeWidth="2" fill="none" />;
        })}
        <path d="M90 474 L280 187 H388 L578 -98" stroke="#555" strokeWidth="3" fill="none" />
        <g stroke="#555" strokeWidth="2">
          {treads.map((index) => <line key={`bal1-${index}`} x1={120 + index * 20} y1={452 - index * 30} x2={120 + index * 20} y2={492 - index * 30} />)}
          {treads.map((index) => <line key={`bal2-${index}`} x1={398 + index * 20} y1={182 - index * 30} x2={398 + index * 20} y2={222 - index * 30} />)}
        </g>
        <path d="M0 492 H650 M0 222 H650 M0 -48 H650" stroke="#777" strokeDasharray="9 7" />
        <text x="655" y="496" className="elevation-level">GROUND FFL ±0.00</text>
        <text x="655" y="226" className="elevation-level">FIRST FFL +3.15</text>
        <text x="655" y="-44" className="elevation-level">UPPER LANDING / ROOF ACCESS</text>
        <path d="M78 492 V222 M67 492 H89 M67 222 H89" stroke="#555" fill="none" />
        <text x="58" y="360" textAnchor="middle" transform="rotate(-90 58 360)" className="elevation-dimension">3.15 m FLOOR TO FLOOR</text>
        <text x="210" y="430" className="elevation-note">18 RISERS @ 175 mm MAX TARGET</text>
        <text x="210" y="452" className="elevation-note">270 mm TREAD TARGET · EQUAL RISERS</text>
        <text x="400" y="410" className="elevation-note">2.10 m MINIMUM HEADROOM CHECK ZONE</text>
        <path d="M390 390 h120" stroke="#9b6b28" strokeWidth="2" strokeDasharray="6 5" />
      </g>

      <g transform="translate(55 605)">
        <circle cx="18" cy="18" r="18" fill="#111" />
        <text x="18" y="23" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="800">D1</text>
        <text x="50" y="9" className="elevation-note">STAIR DESIGN SEED CHECK</text>
        <text x="50" y="29" className="elevation-dimension">PLAN ↔ SECTION ↔ LANDING ↔ HEADROOM ↔ GUARDING MUST AGREE</text>
        <text x="50" y="52" className="elevation-note">CONCEPT DIMENSIONS ONLY · FINAL STAIR TO BE DESIGNED AND CERTIFIED BY THE APPOINTED PROFESSIONALS</text>
      </g>
    </svg>
  );
}

export default function ConceptDrawings(props: DrawingProps) {
  const lot = normalize(props.points);
  const riverInset = props.riverConstraint
    ? Math.min(105, (props.riverConstraint.reserveM / Math.max(props.lotWidth, props.lotDepth, 1)) * 530)
    : 0;
  const constrainedLot = props.riverConstraint
    ? insetSelectedEdge(lot, props.riverConstraint.edgeIndex, riverInset)
    : lot;
  const setbackRatio = Math.max(.58, Math.min(.86, Math.min(props.envelopeWidth / Math.max(1, props.lotWidth), props.envelopeDepth / Math.max(1, props.lotDepth))));
  const envelope = shrink(constrainedLot, setbackRatio);
  const buildingWidthFt = Math.max(18, props.envelopeWidth * .9);
  const buildingDepthFt = Math.max(25, props.envelopeDepth * .78);

  return (
    <div className="wb-drawing-set">
      <section className="wb-3d-sheet">
        <header><div><small>V01 · COORDINATED EXTERIOR</small><h3>Three-Dimensional Design Visual</h3></div><b>{props.designIntelligence?.title ?? facadeNames[props.facade]}</b></header>
        <Concept3DView facade={props.facade} roofStyle={props.roofStyle} storeys={props.storeys} cars={props.cars} buildingWidthFt={buildingWidthFt} buildingDepthFt={buildingDepthFt} />
        <div className="wb-watermark">{props.unlocked ? "PRELIMINARY 3D CONCEPT" : "FREE CONCEPT PREVIEW"}</div>
        <p>The 3D view uses the same storey count, massing, roof, façade family, porch and opening rhythm as the connected plan and elevation set.</p>
      </section>

      <section className="wb-professional-sheet wb-plan-sheet">
        <div className="wb-professional-body">
          <header className="wb-professional-head">
            <div><small>A01–A03 · LOCKED STANDARD FORMAT</small><h3>Site-Coordinated Floor Plans</h3></div>
            <div className="wb-north-arrow"><span>↑</span><b>N</b></div>
          </header>
          <div className="wb-plan-board">
            <article className="wb-plan-panel">
              <div className="wb-panel-caption"><b>1 · GROUND FLOOR PLAN</b><span>ROAD / ACCESS AT BOTTOM · {props.boundaryConfirmed ? "OWNER-CONFIRMED BOUNDARY" : "DIMENSIONS-ONLY BOUNDARY"}</span></div>
              <PlanGrid upper={false} bedrooms={props.bedrooms} brief={props.brief} storeys={props.storeys} cars={props.cars} porchDepthFt={props.porchDepthFt} aisleWidthFt={props.aisleWidthFt} buildingWidthFt={buildingWidthFt} buildingDepthFt={buildingDepthFt} />
              <svg className="wb-setback-overlay" viewBox="0 0 900 620" aria-hidden="true">
                <polygon points={pointString(lot.map((point) => ({ x: point.x + 90, y: point.y + 80 })))} fill="none" stroke="#283936" strokeWidth="3" strokeDasharray="12 8" />
                <polygon points={pointString(envelope.map((point) => ({ x: point.x + 90, y: point.y + 80 })))} fill="none" stroke="#b07930" strokeWidth="2" strokeDasharray="7 5" />
              </svg>
              <div className="wb-setback-strip"><span>FRONT {props.lotDepth - props.envelopeDepth > 0 ? "SETBACK SHOWN" : "VERIFY"}</span><span>LEFT / RIGHT SETBACK LINES</span><span>REAR SETBACK LINE</span><span>{props.aisleWidthFt.toFixed(2)} FT CLEAR AISLE</span></div>
            </article>
            <article className="wb-plan-panel">
              <div className="wb-panel-caption"><b>2 · {props.storeys === 2 ? "FIRST FLOOR PLAN" : "ROOF / SERVICE PLAN"}</b><span>SAME SITE ORIENTATION · SAME SETBACK DATUM</span></div>
              <PlanGrid upper bedrooms={props.bedrooms} brief={props.brief} storeys={props.storeys} cars={props.cars} porchDepthFt={props.porchDepthFt} aisleWidthFt={props.aisleWidthFt} buildingWidthFt={buildingWidthFt} buildingDepthFt={buildingDepthFt} />
              <svg className="wb-setback-overlay" viewBox="0 0 900 620" aria-hidden="true">
                <polygon points={pointString(lot.map((point) => ({ x: point.x + 90, y: point.y + 80 })))} fill="none" stroke="#283936" strokeWidth="3" strokeDasharray="12 8" />
                <polygon points={pointString(envelope.map((point) => ({ x: point.x + 90, y: point.y + 80 })))} fill="none" stroke="#b07930" strokeWidth="2" strokeDasharray="7 5" />
              </svg>
              <div className="wb-setback-strip"><span>LOT {props.lotWidth.toFixed(1)} × {props.lotDepth.toFixed(1)} FT</span><span>BUILDABLE {props.envelopeWidth.toFixed(1)} × {props.envelopeDepth.toFixed(1)} FT</span><span>SETBACKS TO ARCHITECT / PBT VERIFY</span></div>
            </article>
          </div>
          <div className="wb-professional-notes">
            <b>GENERAL NOTES</b>
            <p>Site boundary remains visible regardless of lot shape. Building and setback geometry must stay inside the owner-confirmed boundary. Minimum walking aisle is locked at 3 ft clear. All dimensions, easements, reserves and statutory setbacks require appointed-architect verification.</p>
          </div>
        </div>
        <ProfessionalTitleBlock sheet="A101" title="SITE + FLOOR PLANS" />
        <div className="wb-watermark">FOR ARCHITECT REVIEW ONLY</div>
      </section>

      {!props.unlocked ? (
        <section className="wb-elevation-section">
          <header><div><small>FREE DESIGN INTENT PREVIEW</small><h3>{props.designIntelligence?.title ?? facadeNames[props.facade]}</h3></div><b>{props.roofStyle.toUpperCase()} ROOF · INFERRED BY WEDGEBUILD</b></header>
          <article className="wb-drawing-sheet wb-facade-sheet wb-free-elevation">
            <header><div><small>FRONT VIEW</small><h3>Front Elevation Preview</h3></div><b>FULL TECHNICAL SET LOCKED</b></header>
            <ElevationDrawing facade={props.facade} storeys={props.storeys} view="front" roofStyle={props.roofStyle} eaveDepthFt={props.eaveDepthFt} porchDepthFt={props.porchDepthFt} cars={props.cars} buildingWidthFt={buildingWidthFt} buildingDepthFt={buildingDepthFt} />
            <div className="wb-watermark">FREE CONCEPT PREVIEW</div>
          </article>
          <p>Be satisfied with the design direction first. RM99 unlocks the coordinated four-elevation sheet, stair sheet and architect handoff documents.</p>
        </section>
      ) : (
        <>
          <section className="wb-professional-sheet wb-paid-elevation-board">
            <div className="wb-professional-body">
              <header>
                <div><small>WEDGEBUILD · LOCKED ELEVATION FORMAT</small><h3>Coordinated Exterior Elevations</h3><p>{props.designIntelligence?.title ?? facadeNames[props.facade]}</p></div>
                <div><b>PRELIMINARY CONCEPT</b><span>REV 01 · OWNER ACCEPTED</span></div>
              </header>
              <div className="wb-four-elevations">
                {(["front", "left", "rear", "right"] as const).map((view, index) => (
                  <article key={view}>
                    <ElevationDrawing facade={props.facade} storeys={props.storeys} view={view} roofStyle={props.roofStyle} eaveDepthFt={props.eaveDepthFt} porchDepthFt={props.porchDepthFt} cars={props.cars} buildingWidthFt={buildingWidthFt} buildingDepthFt={buildingDepthFt} />
                    <b>{String(index + 1).padStart(2, "0")} · {view.toUpperCase()} ELEVATION</b>
                  </article>
                ))}
              </div>
              <footer>
                <div><b>LEVELS</b><span>GROUND · FIRST · EAVE · ROOF</span></div><div><b>DIMENSIONS</b><span>WIDTH / DEPTH LINKED TO PLAN</span></div><div><b>CALLOUTS</b><span>ROOF · WINDOWS · MATERIAL · RAINWATER</span></div>
              </footer>
            </div>
            <ProfessionalTitleBlock sheet="A401" title="EXTERIOR ELEVATIONS" />
            <div className="wb-watermark">FOR ARCHITECT REVIEW ONLY</div>
          </section>

          <section className="wb-stair-sheet">
            <StairCoordinationDrawing />
          </section>

          <section className="wb-paid-gate">
            <div><span>RM99 DRAWING QUALITY GATE</span><h3>What every paid concept must contain.</h3></div>
            <ul>{PAID_DRAWING_GATE.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        </>
      )}
    </div>
  );
}
