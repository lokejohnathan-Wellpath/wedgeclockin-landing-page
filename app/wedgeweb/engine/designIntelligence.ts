export type DesignSettings = {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  boldText: boolean;
  watermark: boolean;
};

export type DesignDecision = {
  changes: Partial<DesignSettings>;
  reply: string;
  understood: boolean;
};

type Theme = Omit<DesignSettings, "watermark">;

const themes: Record<string, Theme> = {
  fineDining: { primaryColor: "#c7a15a", backgroundColor: "#15110f", textColor: "#f8efe3", boldText: false },
  luxury: { primaryColor: "#c7a15a", backgroundColor: "#111315", textColor: "#f6efe2", boldText: false },
  wellness: { primaryColor: "#6f8f7c", backgroundColor: "#f4f1ea", textColor: "#27332d", boldText: false },
  slimming: { primaryColor: "#8b6f9b", backgroundColor: "#faf7fb", textColor: "#302938", boldText: false },
  modern: { primaryColor: "#315f85", backgroundColor: "#f7f8fa", textColor: "#172033", boldText: true },
  minimalist: { primaryColor: "#242424", backgroundColor: "#ffffff", textColor: "#171717", boldText: false },
  playful: { primaryColor: "#e94f64", backgroundColor: "#fff7ed", textColor: "#34231f", boldText: true },
  natural: { primaryColor: "#8a5a3b", backgroundColor: "#f5ede2", textColor: "#382820", boldText: false },
  dark: { primaryColor: "#c8a467", backgroundColor: "#0f1113", textColor: "#f4efe6", boldText: false },
  retail: { primaryColor: "#cf513d", backgroundColor: "#fffaf5", textColor: "#29201d", boldText: true },
  workshop: { primaryColor: "#d47a36", backgroundColor: "#fff8ed", textColor: "#30251d", boldText: true },
  guestHouse: { primaryColor: "#386f73", backgroundColor: "#f4f1e8", textColor: "#263637", boldText: false },
  petSpa: { primaryColor: "#4d8c83", backgroundColor: "#fff9ef", textColor: "#2b3533", boldText: true },
  specialtyShop: { primaryColor: "#6f57a3", backgroundColor: "#fbf8ff", textColor: "#2f2938", boldText: true },
};

const moods = [
  { key: "fineDining", words: ["fine dining", "fine-dining", "upscale restaurant"], label: "a refined fine-dining atmosphere" },
  { key: "luxury", words: ["luxury", "luxurious", "premium", "elegant", "exclusive"], label: "an elegant premium atmosphere" },
  { key: "wellness", words: ["spa", "wellness", "calm", "relaxing", "serene", "tranquil"], label: "a calm wellness atmosphere" },
  { key: "slimming", words: ["slimming", "body contour", "healthy transformation"], label: "a confident slimming and wellness atmosphere" },
  { key: "modern", words: ["modern", "contemporary", "professional"], label: "a clean modern atmosphere" },
  { key: "minimalist", words: ["minimal", "minimalist", "clean", "simple"], label: "a minimalist atmosphere" },
  { key: "playful", words: ["playful", "fun", "colourful", "colorful", "vibrant", "cheerful"], label: "a playful vibrant atmosphere" },
  { key: "natural", words: ["rustic", "natural", "earthy", "organic", "homely", "cozy", "cosy"], label: "a warm natural atmosphere" },
  { key: "dark", words: ["dark", "moody", "dramatic"], label: "a dark dramatic atmosphere" },
] as const;

const businessDefaults = [
  { key: "slimming", industries: ["Slimming & Wellness Centre"] },
  { key: "wellness", industries: ["Salon & Spa"] },
  { key: "retail", industries: ["Retail"] },
  { key: "workshop", industries: ["Workshops & Classes"] },
  { key: "guestHouse", industries: ["Guest House & Homestay"] },
  { key: "petSpa", industries: ["Pet Spa & Grooming"] },
  { key: "specialtyShop", industries: ["Specialty Shop"] },
] as const;

const namedColors: Record<string, string> = {
  "chili red": "#c21807", burgundy: "#7f1d1d", red: "#c62828", black: "#171717", white: "#ffffff",
  gold: "#c8a467", green: "#286b4f", blue: "#2457a6", purple: "#7048a8", pink: "#d45c86",
  orange: "#d76a22", cream: "#fff6e8", beige: "#eadfd5", teal: "#287c7a", brown: "#795548",
};

export function interpretDesignInstruction(instruction: string, industry: string): DesignDecision {
  const prompt = instruction.trim().toLowerCase();
  const changes: Partial<DesignSettings> = {};
  const explanations: string[] = [];

  const mood = moods.find((item) => item.words.some((word) => prompt.includes(word)));
  if (mood) {
    Object.assign(changes, themes[mood.key]);
    explanations.push(mood.label);
  } else if (/suit my|match my|for my business|choose for me|surprise me|recommend/.test(prompt)) {
    const profile = businessDefaults.find((item) => item.industries.includes(industry as never));
    if (profile) {
      Object.assign(changes, themes[profile.key]);
      explanations.push(`a design suited to ${industry.toLowerCase()}`);
    }
  }

  const color = Object.entries(namedColors).find(([name]) => prompt.includes(name));
  const hex = prompt.match(/#[0-9a-f]{6}/i)?.[0];
  const requestedColor = hex || color?.[1];
  if (requestedColor) {
    if (/background|backdrop/.test(prompt)) changes.backgroundColor = requestedColor;
    else if (/word|text|font/.test(prompt)) changes.textColor = requestedColor;
    else changes.primaryColor = requestedColor;
    explanations.push("your requested colour");
  }

  if (prompt.includes("bold")) {
    changes.boldText = !/not bold|remove bold|less bold/.test(prompt);
    explanations.push(changes.boldText ? "stronger typography" : "lighter typography");
  }
  if (prompt.includes("watermark")) {
    changes.watermark = !/remove|without|no watermark/.test(prompt);
    explanations.push(changes.watermark ? "the Photo 1 watermark" : "removal of the watermark");
  }

  if (!explanations.length) {
    return { changes: {}, understood: false, reply: "I could not translate that direction yet. Describe a mood, business vibe, colour, typography weight or watermark treatment." };
  }
  return { changes, understood: true, reply: `Done. I applied ${explanations.join(" with ")}. Open Preview to see the result.` };
}
