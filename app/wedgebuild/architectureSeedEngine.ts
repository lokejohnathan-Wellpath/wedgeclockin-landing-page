import type { RoofStyle } from "./DesignChat";
import type { FacadeId } from "./ConceptDrawings";

export type ArchitectureSeed = {
  id: string;
  role: "positive" | "negative";
  teaches: string[];
};

export const ARCHITECTURE_BRAIN_SEEDS: ArchitectureSeed[] = [
  {
    id: "seed-01-coordinated-hip",
    role: "positive",
    teaches: ["four elevations on one sheet", "hip-roof hierarchy", "levels", "dimensions", "material callouts"],
  },
  {
    id: "seed-02-folded-gable",
    role: "positive",
    teaches: ["asymmetric massing", "deep framed openings", "material zones", "section references", "sloping ground response"],
  },
  {
    id: "seed-03-generic-thumbnail",
    role: "negative",
    teaches: ["reject tiny generic output", "reject repeated front and side geometry", "reject drawings without useful notes"],
  },
  {
    id: "seed-04-professional-sheet",
    role: "positive",
    teaches: ["sheet composition", "four coordinated views", "title block", "revision area", "level coordination"],
  },
  {
    id: "seed-05-hand-sketch-proportion",
    role: "positive",
    teaches: ["strong composition", "depth and shadow", "landscape integration", "human design intent"],
  },
  {
    id: "seed-06-courtyard-section",
    role: "positive",
    teaches: ["narrow-lot vertical planning", "courtyard daylight", "section/elevation coordination", "rain-screen response"],
  },
  {
    id: "seed-07-stair-coordination",
    role: "positive",
    teaches: ["stair plans by level", "riser and tread count", "floor levels", "section coordination"],
  },
  {
    id: "seed-08-stair-detail",
    role: "positive",
    teaches: ["construction callouts", "handrail", "tread detail", "material build-up"],
  },
  {
    id: "seed-09-sculptural-stair",
    role: "positive",
    teaches: ["stair as spatial feature", "guarding continuity", "support logic", "arrival experience"],
  },
  {
    id: "seed-10-stair-fit",
    role: "positive",
    teaches: ["real stair footprint", "landing clearance", "headroom awareness", "dimensioned section"],
  },
  {
    id: "seed-11-stair-library",
    role: "positive",
    teaches: ["choose stair topology from available space", "plan/elevation pairing", "avoid one stair for every house"],
  },
  {
    id: "seed-12-single-storey-plan-render",
    role: "positive",
    teaches: ["single-storey plan-to-render match", "layered low-slope roof", "veranda arrival", "compact room adjacency"],
  },
  {
    id: "seed-13-two-storey-flat-roof-plan",
    role: "positive",
    teaches: ["two-storey room stacking", "central stair core", "flat-roof massing", "large family living zones"],
  },
  {
    id: "seed-14-compact-bungalow-set",
    role: "positive",
    teaches: ["compact single-storey zoning", "plan and perspective pairing", "simple buildable massing", "terrace relationship"],
  },
  {
    id: "seed-15-dimensioned-elevation",
    role: "positive",
    teaches: ["grid references", "overall and chained dimensions", "floor levels", "material tags"],
  },
  {
    id: "seed-16-stacked-family-house",
    role: "positive",
    teaches: ["five-bedroom stacking", "balcony and porch integration", "vertical privacy screens", "bathroom alignment"],
  },
  {
    id: "seed-17-complete-approval-board",
    role: "positive",
    teaches: ["plan roof and elevations on one board", "north orientation", "window consistency", "submission-sheet discipline"],
  },
  {
    id: "seed-18-three-bedroom-malaysian-bungalow",
    role: "positive",
    teaches: ["wash area and kitchen connection", "separate WC planning", "one-car porch", "single-storey hip-roof proportion"],
  },
  {
    id: "seed-19-narrow-modern-house",
    role: "positive",
    teaches: ["narrow frontage composition", "asymmetric floor masses", "deep window frames", "tropical landscape edge"],
  },
  {
    id: "seed-20-narrow-lot-services",
    role: "positive",
    teaches: ["three-storey narrow-lot planning", "roof tank and solar coordination", "all-floor plan alignment", "four elevations"],
  },
  {
    id: "seed-21-labelled-bungalow-layout",
    role: "positive",
    teaches: ["simple dimension bands", "bedroom and bath adjacency", "garage fit", "front veranda axis"],
  },
  {
    id: "seed-22-wall-building-sections",
    role: "positive",
    teaches: ["wall build-up", "foundation relationship", "roof-edge detail", "full building section", "section callout discipline"],
  },
  {
    id: "seed-23-butterfly-bungalow",
    role: "positive",
    teaches: ["butterfly-roof silhouette", "central valley drainage", "single-storey plan pairing", "high-level daylight"],
  },
  {
    id: "seed-24-four-elevation-hip-house",
    role: "positive",
    teaches: ["four-view coordination", "raised central roof mass", "grid and level discipline", "porch hierarchy"],
  },
  {
    id: "seed-25-plan-and-roof-plan",
    role: "positive",
    teaches: ["ground-to-upper alignment", "roof valley geometry", "dimension strings", "roof plan as designed system"],
  },
  {
    id: "seed-26-narrow-repeated-floor-warning",
    role: "negative",
    teaches: ["reject blind floor repetition", "check kitchen necessity by floor", "protect stair arrival", "avoid corridor-only planning"],
  },
  {
    id: "seed-27-flat-roof-luxury",
    role: "positive",
    teaches: ["deep cantilevered flat-roof expression", "double-height glazing", "layered stone masses", "concealed drainage"],
  },
  {
    id: "seed-28-steep-site-section",
    role: "positive",
    teaches: ["split-level hillside response", "vehicle entry level", "cut and fill awareness", "retaining and drainage coordination"],
  },
  {
    id: "seed-29-concept-sketch",
    role: "positive",
    teaches: ["architectural sketch energy", "curved roof edge", "cantilever composition", "landform response"],
  },
  {
    id: "seed-30-flat-roof-cantilever",
    role: "positive",
    teaches: ["wide cantilever shade", "corner glazing", "indoor-outdoor continuity", "flat roof with hidden falls"],
  },
  {
    id: "seed-31-butterfly-entry",
    role: "positive",
    teaches: ["symmetrical butterfly entry", "central valley expression", "clerestory daylight", "single-storey roof identity"],
  },
  {
    id: "seed-32-mono-pitch-tropical",
    role: "positive",
    teaches: ["broad mono-pitch roof", "two-car shaded porch", "tropical screens", "plan-to-render relationship"],
  },
  {
    id: "seed-33-complete-residential-sheet",
    role: "positive",
    teaches: ["floor and reflected ceiling plans", "roof plan", "door and window schedule", "four elevations", "cross and longitudinal sections"],
  },
  {
    id: "seed-34-professional-detail-family",
    role: "positive",
    teaches: ["site plan", "coordinated building section", "dimensioned elevation", "finish schedule", "wall and foundation details"],
  },
  {
    id: "seed-35-complete-site-and-services-set",
    role: "positive",
    teaches: ["ground and upper plans", "four elevations", "building sections", "drainage diagram", "septic detail", "irregular site response"],
  },
  {
    id: "seed-36-basic-four-elevation-set",
    role: "positive",
    teaches: ["front side and rear agreement", "consistent floor and roof levels", "opening continuity", "minimum coordinated elevation family"],
  },
];

export type InferredArchitecture = {
  facade: FacadeId;
  roofStyle: RoofStyle;
  eaveDepthFt: number;
  title: string;
  rationale: string[];
  seedIds: string[];
  confidence: number;
};

type InferenceInput = {
  brief: string;
  lotWidth: number;
  lotDepth: number;
  storeys: number;
  cars: number;
  besideRiver: boolean;
};

type LearningRecord = {
  facade: FacadeId;
  accepted: number;
  keywords: string[];
  lastAcceptedAt: string;
};

const LEARNING_KEY = "wedgebuild.architecture-learning.v1";

function words(text: string) {
  return Array.from(new Set(text.toLowerCase().match(/[a-z\u00c0-\u024f]{4,}/g) ?? [])).slice(0, 24);
}

export function readLearningMemory(): LearningRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEARNING_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberAcceptedConcept(facade: FacadeId, brief: string) {
  if (typeof window === "undefined") return;
  const memory = readLearningMemory();
  const keyWords = words(brief);
  const existing = memory.find((item) => item.facade === facade);
  if (existing) {
    existing.accepted += 1;
    existing.keywords = Array.from(new Set([...existing.keywords, ...keyWords])).slice(-80);
    existing.lastAcceptedAt = new Date().toISOString();
  } else {
    memory.push({
      facade,
      accepted: 1,
      keywords: keyWords,
      lastAcceptedAt: new Date().toISOString(),
    });
  }
  window.localStorage.setItem(LEARNING_KEY, JSON.stringify(memory.slice(-24)));
}

export function inferArchitecture(input: InferenceInput): InferredArchitecture {
  const brief = input.brief.toLowerCase();
  const scores: Record<FacadeId, number> = {
    "tropical-modern": 2,
    "kampung-contemporary": 0,
    "urban-malaysian": 1,
    "homestay-tropical": 0,
  };

  if (/modern|clean|minimal|stone|glass|luxury|contemporary/.test(brief)) scores["tropical-modern"] += 4;
  if (/kampung|serambi|timber|heritage|traditional|warisan/.test(brief)) scores["kampung-contemporary"] += 6;
  if (/urban|bandar|compact|narrow|privacy|screen/.test(brief)) scores["urban-malaysian"] += 5;
  if (/homestay|guest|veranda|resort|holiday|courtyard/.test(brief)) scores["homestay-tropical"] += 5;
  if (input.lotWidth < 42 || input.lotDepth / Math.max(1, input.lotWidth) > 2) scores["urban-malaysian"] += 4;
  if (input.cars >= 3) scores["tropical-modern"] += 2;
  if (input.besideRiver) scores["homestay-tropical"] += 3;
  if (input.storeys === 1) scores["kampung-contemporary"] += 2;

  for (const record of readLearningMemory()) {
    const overlap = words(brief).filter((word) => record.keywords.includes(word)).length;
    scores[record.facade] += Math.min(3, overlap * 0.35) + Math.min(1.5, record.accepted * 0.15);
  }

  const ranked = (Object.entries(scores) as [FacadeId, number][]).sort((a, b) => b[1] - a[1]);
  const facade = ranked[0][0];
  const scoreGap = ranked[0][1] - ranked[1][1];
  const explicitRoof: RoofStyle | null =
    /butterfly roof|bumbung rama|central valley roof/.test(brief) ? "butterfly"
      : /skillion|mono.?pitch|single.?slope|shed roof/.test(brief) ? "skillion"
        : /flat roof|bumbung rata|parapet roof/.test(brief) ? "flat"
          : /hip roof|bumbung limas/.test(brief) ? "hip"
            : /pitched roof|gable|bumbung curam/.test(brief) ? "pitched"
              : null;
  const profile = {
    "tropical-modern": {
      roofStyle: "hip" as RoofStyle,
      eaveDepthFt: 4,
      title: "Wedge-Inferred Layered Tropical Residence",
      rationale: ["Deep shade with composed modern massing", "Openings organised from the plan, not pasted onto a façade", "Hip roof and rainwater edges respond to Malaysian downpours"],
      seedIds: ["seed-01-coordinated-hip", "seed-04-professional-sheet", "seed-12-single-storey-plan-render", "seed-16-stacked-family-house"],
    },
    "kampung-contemporary": {
      roofStyle: "pitched" as RoofStyle,
      eaveDepthFt: 4.5,
      title: "Wedge-Inferred Raised Veranda Residence",
      rationale: ["Ventilated pitched roof and deep eaves", "Arrival sequence borrows the spatial role of a serambi", "Timber-screen logic is translated without copying a source house"],
      seedIds: ["seed-01-coordinated-hip", "seed-08-stair-detail", "seed-17-complete-approval-board", "seed-18-three-bedroom-malaysian-bungalow"],
    },
    "urban-malaysian": {
      roofStyle: "flat" as RoofStyle,
      eaveDepthFt: 3.5,
      title: "Wedge-Inferred Urban Rain-Screen Residence",
      rationale: ["Vertical massing preserves useful internal width", "Screens protect privacy while keeping daylight", "Flat-roof expression includes falls, outlets and overflow"],
      seedIds: ["seed-02-folded-gable", "seed-13-two-storey-flat-roof-plan", "seed-19-narrow-modern-house", "seed-20-narrow-lot-services"],
    },
    "homestay-tropical": {
      roofStyle: "pitched" as RoofStyle,
      eaveDepthFt: 4.5,
      title: "Wedge-Inferred Courtyard Tropical Residence",
      rationale: ["Guest and family zones gain clearer privacy", "Courtyard and veranda logic improve daylight and cross ventilation", "Roof and landscape read as one composition"],
      seedIds: ["seed-02-folded-gable", "seed-05-hand-sketch-proportion", "seed-06-courtyard-section", "seed-22-wall-building-sections"],
    },
  }[facade];

  return {
    facade,
    ...profile,
    roofStyle: explicitRoof ?? profile.roofStyle,
    seedIds: explicitRoof === "butterfly"
      ? Array.from(new Set([...profile.seedIds, "seed-23-butterfly-bungalow", "seed-31-butterfly-entry"]))
      : explicitRoof === "skillion"
        ? Array.from(new Set([...profile.seedIds, "seed-32-mono-pitch-tropical"]))
        : explicitRoof === "flat"
          ? Array.from(new Set([...profile.seedIds, "seed-27-flat-roof-luxury", "seed-30-flat-roof-cantilever"]))
          : profile.seedIds,
    confidence: Math.max(68, Math.min(94, Math.round(76 + scoreGap * 3))),
  };
}

export const PAID_DRAWING_GATE = [
  "Four coordinated elevations on one professional sheet",
  "Ground, first-floor, eave and roof levels",
  "Overall width/depth and key vertical dimensions",
  "Material, roof, window, shading and rainwater callouts",
  "Elevation openings derived from the same concept",
  "Stair plan, section, riser/tread count, landing and headroom check",
  "Readable title block, drawing numbers, scale and revision status",
  "Drainage intent shown wherever flat, butterfly or mono-pitch roofs are inferred",
];
