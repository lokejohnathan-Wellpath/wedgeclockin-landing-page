import type { LotPoint } from "./LotBoundaryMapper";

export type BoundaryDetection = {
  points: LotPoint[];
  mode: "coloured" | "bold";
  confidence: "strong" | "review";
};

type PixelPoint = { x: number; y: number };

function cross(origin: PixelPoint, a: PixelPoint, b: PixelPoint) {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
}

function convexHull(points: PixelPoint[]) {
  const unique = Array.from(new Map(points.map((point) => [`${point.x}:${point.y}`, point])).values())
    .sort((a, b) => a.x - b.x || a.y - b.y);
  if (unique.length <= 3) return unique;
  const lower: PixelPoint[] = [];
  for (const point of unique) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper: PixelPoint[] = [];
  for (let index = unique.length - 1; index >= 0; index -= 1) {
    const point = unique[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

function reducePoints(points: PixelPoint[], maximum = 30) {
  if (points.length <= maximum) return points;
  return Array.from({ length: maximum }, (_, index) => points[Math.floor((index / maximum) * points.length)]);
}

function components(mask: Uint8Array, width: number, height: number) {
  const seen = new Uint8Array(mask.length);
  const found: PixelPoint[][] = [];
  const neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || seen[start]) continue;
    const queue = [start];
    const group: PixelPoint[] = [];
    seen[start] = 1;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      const x = index % width;
      const y = Math.floor(index / width);
      group.push({ x, y });
      for (const [dx, dy] of neighbours) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (mask[next] && !seen[next]) {
          seen[next] = 1;
          queue.push(next);
        }
      }
    }
    if (group.length >= 24) found.push(group);
  }
  return found;
}

function chooseCandidate(groups: PixelPoint[][], width: number, height: number) {
  const imageArea = width * height;
  return groups
    .map((group) => {
      const minX = Math.min(...group.map((point) => point.x));
      const maxX = Math.max(...group.map((point) => point.x));
      const minY = Math.min(...group.map((point) => point.y));
      const maxY = Math.max(...group.map((point) => point.y));
      const boxArea = Math.max(1, (maxX - minX) * (maxY - minY));
      const centerX = (minX + maxX) / 2 / width;
      const centerY = (minY + maxY) / 2 / height;
      const centerPenalty = 1 - Math.min(.75, Math.hypot(centerX - .5, centerY - .5));
      const validBox = boxArea / imageArea > .015 && boxArea / imageArea < .9;
      return { group, score: validBox ? group.length * centerPenalty * Math.sqrt(boxArea) : 0 };
    })
    .sort((a, b) => b.score - a.score)[0]?.group;
}

function mergeColouredBoundary(groups: PixelPoint[][], width: number, height: number) {
  if (!groups.length) return undefined;
  const ranked = [...groups].sort((a, b) => b.length - a.length);
  const minimum = Math.max(24, ranked[0].length * .16);
  const likelyStrokes = ranked
    .filter((group) => group.length >= minimum)
    .slice(0, 12)
    .flat();
  if (likelyStrokes.length < 50) return undefined;
  const minX = Math.min(...likelyStrokes.map((point) => point.x));
  const maxX = Math.max(...likelyStrokes.map((point) => point.x));
  const minY = Math.min(...likelyStrokes.map((point) => point.y));
  const maxY = Math.max(...likelyStrokes.map((point) => point.y));
  const coverage = ((maxX - minX) * (maxY - minY)) / Math.max(1, width * height);
  return coverage >= .015 && coverage <= .9 ? likelyStrokes : undefined;
}

export async function detectBoundaryFromImage(file: File): Promise<BoundaryDetection | null> {
  if (!file.type.startsWith("image/")) return null;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 720 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const pixels = context.getImageData(0, 0, width, height).data;
  const colourMask = new Uint8Array(width * height);
  const boldMask = new Uint8Array(width * height);

  for (let index = 0; index < width * height; index += 1) {
    const r = pixels[index * 4];
    const g = pixels[index * 4 + 1];
    const b = pixels[index * 4 + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    const isRedOrBrown = r > 70 && r > g * 1.14 && r > b * 1.12 && saturation > 24;
    const luminance = r * .299 + g * .587 + b * .114;
    colourMask[index] = isRedOrBrown ? 1 : 0;
    boldMask[index] = luminance < 72 ? 1 : 0;
  }

  // Malaysian survey sheets often print one lot perimeter as several disconnected
  // red/brown strokes because bearings and lot labels cut through the bold line.
  // Merge the dominant coloured strokes before taking the suggested outer outline.
  const colourGroups = components(colourMask, width, height);
  const colourCandidate = mergeColouredBoundary(colourGroups, width, height)
    ?? chooseCandidate(colourGroups, width, height);
  const mode = colourCandidate ? "coloured" : "bold";
  const candidate = colourCandidate ?? chooseCandidate(components(boldMask, width, height), width, height);
  if (!candidate) return null;

  const hull = reducePoints(convexHull(candidate.filter((_, index) => index % Math.max(1, Math.floor(candidate.length / 500)) === 0)));
  if (hull.length < 3) return null;
  return {
    points: hull.map((point) => ({ x: (point.x / width) * 100, y: (point.y / height) * 100 })),
    mode,
    confidence: mode === "coloured" ? "strong" : "review",
  };
}
