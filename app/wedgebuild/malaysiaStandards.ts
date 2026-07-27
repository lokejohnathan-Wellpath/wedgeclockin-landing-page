export type SpaceStandard = {
  label: string;
  areaSqft: number;
  dimensions: string;
  note: string;
};

export const MALAYSIA_SPACE_STANDARDS = {
  mainBedroom: {
    label: "Main bedroom",
    areaSqft: 156,
    dimensions: "12′ × 13′",
    note: "Allows a king/queen bed, wardrobes and usable circulation.",
  },
  standardBedroom: {
    label: "Standard bedroom",
    areaSqft: 110,
    dimensions: "10′ × 11′",
    note: "Designed above a cramped minimum so a bed, wardrobe and study can fit.",
  },
  accessibleBedroom: {
    label: "Parents / accessible room",
    areaSqft: 132,
    dimensions: "11′ × 12′",
    note: "Ground-floor planning target with clearer movement around the bed.",
  },
  bathroom: {
    label: "Bathroom / toilet",
    areaSqft: 40,
    dimensions: "5′ × 8′",
    note: "WedgeBuild minimum, including shower, WC and basin zones.",
  },
  dryKitchen: {
    label: "Dry kitchen",
    areaSqft: 100,
    dimensions: "10′ × 10′",
    note: "Everyday food preparation and family-facing kitchen zone.",
  },
  wetKitchen: {
    label: "Wet kitchen",
    areaSqft: 80,
    dimensions: "8′ × 10′",
    note: "Heavy cooking zone connected to ventilation and service yard.",
  },
  livingDining: {
    label: "Living + dining",
    areaSqft: 240,
    dimensions: "15′ × 16′",
    note: "Combined Malaysian family and guest area.",
  },
  familyArea: {
    label: "Upper family area",
    areaSqft: 120,
    dimensions: "10′ × 12′",
    note: "Shared upstairs family space rather than corridor-only planning.",
  },
  staircase: {
    label: "Residential staircase",
    areaSqft: 52,
    dimensions: "≈ 3′6″ × 14′9″",
    note: "Straight-run planning footprint at about 1.0 m clear. A U/L stair or separate landing may need additional circulation area.",
  },
} satisfies Record<string, SpaceStandard>;

export function carPorchStandard(cars: number, depthFt = 18) {
  const safeCars = Math.max(1, Math.min(4, Math.round(cars)));
  const widthM = safeCars === 1 ? 2.8 : safeCars * 2.7;
  const depthM = Math.max(16, depthFt) * 0.3048;
  return {
    cars: safeCars,
    widthM,
    depthM,
    areaSqft: widthM * depthM * 10.7639,
    dimensions: `${widthM.toFixed(1)} m × ${depthM.toFixed(1)} m`,
    note: "Wedge planning target includes more usable door clearance than a bare parking bay.",
  };
}

export function estimateInternalProgram({
  bedrooms,
  storeys,
  wantsAccessibleRoom,
  wantsSurau,
}: {
  bedrooms: number;
  storeys: number;
  wantsAccessibleRoom: boolean;
  wantsSurau: boolean;
}) {
  const standards = MALAYSIA_SPACE_STANDARDS;
  const bedroomsArea =
    standards.mainBedroom.areaSqft +
    Math.max(0, bedrooms - 1) * standards.standardBedroom.areaSqft +
    (wantsAccessibleRoom ? standards.accessibleBedroom.areaSqft - standards.standardBedroom.areaSqft : 0);
  const bathrooms = Math.max(1, Math.ceil(bedrooms / 2));
  const commonArea =
    standards.livingDining.areaSqft +
    standards.dryKitchen.areaSqft +
    standards.wetKitchen.areaSqft +
    bathrooms * standards.bathroom.areaSqft +
    (storeys === 2 ? standards.familyArea.areaSqft + standards.staircase.areaSqft : 0) +
    (wantsSurau ? 70 : 45);
  const netArea = bedroomsArea + commonArea;
  const circulationAndWalls = netArea * 0.16;

  return {
    bathrooms,
    netArea,
    totalArea: netArea + circulationAndWalls,
  };
}
