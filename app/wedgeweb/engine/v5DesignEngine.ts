export type V5DesignTokens = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  boldText: boolean;
  watermark: boolean;
  headingFont: string;
  bodyFont: string;
  buttonRadius: number;
  cardRadius: number;
  imageOverlay: number;
  styleName: string;
};

export type V5Decision = {
  status: "apply" | "confirm" | "clarify";
  confidence: number;
  changes: Partial<V5DesignTokens>;
  detectedStyle: string;
  reply: string;
  warnings: string[];
};

type StyleProfile = V5DesignTokens & { aliases: string[]; industries: string[]; description: string };

const profile = (styleName: string, primaryColor: string, secondaryColor: string, backgroundColor: string, textColor: string, headingFont: string, bodyFont: string, aliases: string[], industries: string[], description: string, extras: Partial<V5DesignTokens> = {}): StyleProfile => ({
  styleName, primaryColor, secondaryColor, backgroundColor, textColor, headingFont, bodyFont,
  boldText: false, watermark: false, buttonRadius: 999, cardRadius: 28, imageOverlay: .16,
  aliases, industries, description, ...extras,
});

export const V5_STYLE_LIBRARY: StyleProfile[] = [
  profile("Balinese Hospitality", "#6b442b", "#70805d", "#fff8ec", "#2f281f", "Cormorant Garamond", "Inter", ["balinese", "bali resort", "bali villa"], ["Guest House & Homestay"], "warm teak, tropical greenery and relaxed resort elegance"),
  profile("Modern Tropical Malaysian", "#146b5d", "#d59b42", "#fffaf0", "#20312d", "Playfair Display", "Inter", ["malaysian tropical", "modern tropical", "tropical malaysia"], ["Guest House & Homestay", "Food & Beverage"], "fresh tropical colour with contemporary Malaysian warmth"),
  profile("Peranakan Heritage", "#087f8c", "#d95d39", "#fff8e8", "#263638", "DM Serif Display", "Inter", ["peranakan", "nyonya", "straits chinese"], ["Food & Beverage", "Guest House & Homestay", "Specialty Shop"], "jewel-toned heritage colour balanced with clean readable structure"),
  profile("Kampung Rustic", "#795339", "#78845b", "#f8efe0", "#392d24", "Lora", "Inter", ["kampung", "village rustic", "malay rustic"], ["Guest House & Homestay", "Food & Beverage"], "earthy timber, woven warmth and welcoming local character"),
  profile("Chinese Heritage", "#9d2323", "#c9a24d", "#fff7e8", "#341d1d", "Noto Serif SC", "Noto Sans", ["chinese traditional", "chinese heritage", "oriental chinese"], ["Food & Beverage", "Retail", "Guest House & Homestay"], "restrained red and gold heritage accents with strong legibility"),
  profile("Modern Chinese", "#8e1f2d", "#2f3338", "#fbf8f2", "#242424", "Noto Serif SC", "Inter", ["modern chinese", "contemporary chinese"], ["Food & Beverage", "Retail"], "modern editorial restraint with subtle Chinese visual cues"),
  profile("Japanese Zen", "#596756", "#a58b6f", "#f5f1e8", "#28302a", "Noto Serif JP", "Inter", ["zen", "japanese zen", "japanese calm"], ["Salon & Spa", "Guest House & Homestay", "Food & Beverage"], "quiet natural tones, generous spacing and calm typography"),
  profile("Japanese Minimalist", "#333333", "#a55b4b", "#fafafa", "#1d1d1d", "Noto Serif JP", "Inter", ["japanese minimalist", "japan minimal", "wabi sabi", "wabi-sabi"], ["Retail", "Specialty Shop", "Guest House & Homestay"], "precise simplicity, neutral space and restrained imperfection"),
  profile("Korean Contemporary", "#6d63a8", "#e6a7b7", "#fffafd", "#292631", "Noto Sans KR", "Inter", ["korean", "korean contemporary", "k beauty"], ["Salon & Spa", "Retail", "Food & Beverage"], "polished contemporary colour and clean lifestyle presentation"),
  profile("French Café", "#8f2f3f", "#c9a86a", "#fff9f0", "#302428", "Playfair Display", "Inter", ["french cafe", "paris cafe", "parisian cafe"], ["Food & Beverage"], "romantic café character with refined editorial typography"),
  profile("Parisian Luxury", "#1e1e22", "#b8944f", "#f8f4ec", "#242126", "Cormorant Garamond", "Inter", ["parisian luxury", "french luxury", "paris luxury"], ["Salon & Spa", "Retail", "Specialty Shop"], "high-fashion contrast with gold used only as an accent"),
  profile("Italian Rustic", "#9a4934", "#68704b", "#fbf1df", "#3a2a22", "Lora", "Inter", ["italian rustic", "tuscan", "italian countryside"], ["Food & Beverage", "Guest House & Homestay"], "sun-warmed terracotta, olive and handcrafted hospitality"),
  profile("Mediterranean", "#176a83", "#d89b4a", "#fffaf0", "#25333a", "DM Serif Display", "Inter", ["mediterranean", "greek island", "coastal european"], ["Food & Beverage", "Guest House & Homestay"], "coastal blue, sunlit warmth and airy hospitality"),
  profile("Scandinavian", "#49665e", "#c69263", "#f7f5f0", "#252b29", "Manrope", "Inter", ["scandinavian", "nordic", "scandi"], ["Retail", "Guest House & Homestay", "Workshops & Classes"], "functional simplicity, soft natural colour and approachable clarity"),
  profile("British Classic", "#263f57", "#9a3c3c", "#f7f2e8", "#24272b", "Libre Baskerville", "Inter", ["british classic", "english classic", "british heritage"], ["Guest House & Homestay", "Retail"], "heritage depth with orderly, dependable presentation"),
  profile("Moroccan", "#1e7180", "#bd6639", "#fff4df", "#342723", "DM Serif Display", "Inter", ["moroccan", "marrakech"], ["Guest House & Homestay", "Salon & Spa", "Specialty Shop"], "rich craft colour and geometric warmth without visual clutter"),
  profile("Arabian Luxury", "#173f3a", "#bd9650", "#f9f3e6", "#222c29", "Cormorant Garamond", "Inter", ["arabian luxury", "middle eastern luxury", "dubai luxury"], ["Salon & Spa", "Retail", "Guest House & Homestay"], "deep jewel tones and restrained metallic accents"),
  profile("Ayurvedic Wellness", "#7c5936", "#83905b", "#fbf3df", "#332b22", "Lora", "Inter", ["ayurvedic", "ayurveda", "indian wellness"], ["Salon & Spa", "Slimming & Wellness Centre"], "grounded botanical colour and reassuring holistic warmth"),
  profile("Fine Dining", "#8f2330", "#c3a25a", "#15110f", "#f8efe3", "Cormorant Garamond", "Inter", ["fine dining", "fine dine", "upscale restaurant", "gourmet"], ["Food & Beverage"], "dramatic culinary elegance with warm, readable contrast", { buttonRadius: 8, cardRadius: 16, imageOverlay: .28 }),
  profile("Modern Café", "#a64b37", "#d4a85d", "#fff8ef", "#312622", "Manrope", "Inter", ["modern cafe", "hipster cafe", "coffee shop"], ["Food & Beverage"], "friendly contemporary warmth designed around food imagery"),
  profile("Luxury Spa", "#557267", "#b89469", "#f7f1e8", "#29332f", "Cormorant Garamond", "Inter", ["luxury spa", "premium spa", "spa luxury"], ["Salon & Spa"], "calm premium wellness with natural, trustworthy softness"),
  profile("Clinical Wellness", "#356b78", "#7ea6a0", "#f7fbfb", "#21343a", "Manrope", "Inter", ["clinical", "medical aesthetic", "clinical slimming", "professional slimming"], ["Slimming & Wellness Centre"], "clean clinical confidence without feeling cold"),
  profile("Playful Pet Care", "#297f78", "#e38b4c", "#fff9ed", "#263532", "Nunito", "Inter", ["pet spa", "pet grooming", "playful pet", "pet shop"], ["Pet Spa & Grooming"], "cheerful, gentle pet care with clear booking actions", { boldText: true }),
  profile("Creative Workshop", "#b65f35", "#3f7183", "#fff7eb", "#302822", "Nunito", "Inter", ["creative workshop", "artisan workshop", "craft class"], ["Workshops & Classes"], "energetic creative colour with an organised learning structure", { boldText: true }),
  profile("Luxury Boutique", "#4a304e", "#b88d56", "#fbf7f2", "#2d2730", "Playfair Display", "Inter", ["luxury boutique", "premium shop", "boutique luxury"], ["Retail", "Specialty Shop"], "editorial boutique sophistication with conversion-focused clarity"),
  profile("Modern Retail", "#cf513d", "#315f85", "#fffaf5", "#29201d", "Manrope", "Inter", ["modern retail", "modern shop", "retail shop"], ["Retail", "Specialty Shop"], "confident product-led colour and straightforward shopping cues", { boldText: true }),
  profile("Minimal Professional", "#25282b", "#597386", "#ffffff", "#181a1c", "Manrope", "Inter", ["minimal", "minimalist", "clean professional", "simple modern"], ["Professional Services", "Other"], "high-clarity professional restraint"),
  profile("Bold Playful", "#d84659", "#4c65ae", "#fff7ed", "#34231f", "Nunito", "Inter", ["playful", "fun", "colorful", "colourful", "vibrant", "cheerful"], ["Retail", "Pet Spa & Grooming", "Workshops & Classes"], "bright friendly energy controlled by a readable neutral base", { boldText: true }),
  profile("Natural Organic", "#76563c", "#70805d", "#f6efe3", "#332a23", "Lora", "Inter", ["natural", "organic", "earthy", "rustic", "cozy", "cosy"], ["Salon & Spa", "Guest House & Homestay", "Specialty Shop"], "earthy, trustworthy warmth with natural imagery"),
  profile("Dark Dramatic", "#ba9450", "#7f2634", "#101214", "#f5efe5", "Playfair Display", "Inter", ["dark", "moody", "dramatic", "night luxury"], ["Food & Beverage", "Retail"], "high-impact darkness balanced by warm readable type", { buttonRadius: 10, imageOverlay: .34 }),
];

const aliases: Record<string, string> = { dining: "dine", diner: "dine", lux: "luxury", luxe: "luxury", luxurious: "luxury", relax: "calm", relaxing: "calm", relaxed: "calm", colours: "color", colour: "color", colourful: "colorful", cosy: "cozy", guesthouses: "guesthouse", homestay: "guesthouse", grooming: "groom", groomer: "groom" };
const normalize = (value: string) => value.toLowerCase().replace(/guest[\s-]?house/g, "guesthouse").replace(/[^a-z0-9#]+/g, " ").trim().split(/\s+/).filter(Boolean).map((token) => aliases[token] || token);

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { let previous = row[0]; row[0] = i; for (let j = 1; j <= b.length; j++) { const saved = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = saved; } }
  return row[b.length];
}

function aliasScore(input: string[], phrase: string) {
  const expected = normalize(phrase);
  let fuzzy = false;
  const matched = expected.every((word) => input.some((candidate) => { if (candidate === word) return true; if (Math.min(candidate.length, word.length) < 5) return false; const close = distance(candidate, word) <= (Math.max(candidate.length, word.length) >= 8 ? 2 : 1); if (close) fuzzy = true; return close; }));
  return matched ? (fuzzy ? .72 : .98) : 0;
}

function luminance(hex: string) {
  const rgb = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255).map((value) => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}

export function contrastRatio(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

function validate(tokens: Partial<V5DesignTokens>) {
  const warnings: string[] = [];
  if (tokens.backgroundColor && tokens.textColor && contrastRatio(tokens.backgroundColor, tokens.textColor) < 4.5) {
    const black = contrastRatio(tokens.backgroundColor, "#171717");
    const white = contrastRatio(tokens.backgroundColor, "#ffffff");
    tokens.textColor = black >= white ? "#171717" : "#ffffff";
    warnings.push("I adjusted the text colour to preserve WCAG-readable contrast.");
  }
  if (tokens.backgroundColor && tokens.primaryColor && contrastRatio(tokens.backgroundColor, tokens.primaryColor) < 2.2) {
    warnings.push("The accent colour is subtle on this background, so I will reserve it for larger controls and decoration.");
  }
  return warnings;
}

export function interpretV5(instruction: string, industry: string): V5Decision {
  const input = normalize(instruction);
  const ranked = V5_STYLE_LIBRARY.map((item) => ({ item, score: Math.max(...item.aliases.map((alias) => aliasScore(input, alias))) })).sort((a, b) => b.score - a.score);
  let selected = ranked[0];
  if (!selected?.score && /choose|recommend|suit|match|vibe|feel|style|theme|look/.test(instruction.toLowerCase())) {
    const candidates = V5_STYLE_LIBRARY.filter((item) => item.industries.includes(industry));
    if (candidates.length) selected = { item: candidates[0], score: .86 };
  }
  if (!selected?.score) return { status: "clarify", confidence: 0, changes: {}, detectedStyle: "Unclear", warnings: [], reply: "Tell me a little more. Is the feeling luxurious, cultural, natural, modern, playful, clinical, cosy or dramatic?" };

  const { aliases: _aliases, industries: _industries, description, ...tokens } = selected.item;
  const changes: Partial<V5DesignTokens> = { ...tokens };
  const warnings = validate(changes);
  const percent = Math.round(selected.score * 100);
  if (selected.score < .8) return { status: "confirm", confidence: percent, changes, detectedStyle: selected.item.styleName, warnings, reply: `Did you mean “${selected.item.styleName}”? I would use ${description}.` };
  return { status: "apply", confidence: percent, changes, detectedStyle: selected.item.styleName, warnings, reply: `I detected “${selected.item.styleName}” and applied ${description}.` };
}
