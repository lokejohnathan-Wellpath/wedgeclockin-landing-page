export type BusinessType =
  | "restaurant"
  | "retail"
  | "salon"
  | "pet-store"
  | "pet-spa"
  | "factory"
  | "service"
  | "other";

export type DocumentType = "purchase" | "sales";

export type BookCategory =
  | "Sales Income"
  | "Food Items"
  | "Direct Purchases"
  | "Goods for Resale"
  | "Ingredients & Beverages"
  | "Packaging"
  | "Treatment Consumables"
  | "Pet Care Consumables"
  | "Raw Materials"
  | "Production Overhead"
  | "Medical / Healthcare"
  | "TNB / Electricity"
  | "Water"
  | "Gas"
  | "Utilities"
  | "Rent & Premises"
  | "Repairs & Maintenance"
  | "Transport & Delivery"
  | "Office & Administration"
  | "Advertising & Marketing"
  | "Equipment / Asset"
  | "Professional Fees"
  | "Other Expense"
  | "Needs Review";

export type BookItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  category: string;
  confidence: number;
  descriptionConfirmed?: boolean;
  source: "business-context" | "rule" | "learned" | "review";
};

export type BookDocument = {
  id: string;
  merchant: string;
  date: string;
  documentNo: string;
  documentType: DocumentType;
  items: BookItem[];
  tax: number;
  total: number;
  status: "Ready" | "Needs review";
  fileName?: string;
  ocrConfidence?: number;
  createdAt: string;
};

export type LearningMap = Record<string, string>;

export const merchantNotVisible = "Merchant not visible";

export const businessProfiles: Record<
  BusinessType,
  { label: string; description: string; directCategory: BookCategory }
> = {
  restaurant: {
    label: "Restaurant / Café",
    description: "Food, beverages and packaging",
    directCategory: "Ingredients & Beverages",
  },
  retail: {
    label: "Retail Shop",
    description: "Goods bought for resale",
    directCategory: "Goods for Resale",
  },
  salon: {
    label: "Salon / Beauty",
    description: "Treatment supplies and products",
    directCategory: "Treatment Consumables",
  },
  "pet-store": {
    label: "Pet Store",
    description: "Pet goods bought for resale",
    directCategory: "Goods for Resale",
  },
  "pet-spa": {
    label: "Pet Grooming / Spa",
    description: "Grooming and pet-care supplies",
    directCategory: "Pet Care Consumables",
  },
  factory: {
    label: "Factory / Manufacturing",
    description: "Raw materials and production expenses",
    directCategory: "Raw Materials",
  },
  service: {
    label: "Service Business",
    description: "Direct job costs and overhead",
    directCategory: "Direct Purchases",
  },
  other: {
    label: "Other Business",
    description: "General purchases and overhead",
    directCategory: "Direct Purchases",
  },
};

export const allCategories: BookCategory[] = [
  "Sales Income",
  "Food Items",
  "Direct Purchases",
  "Goods for Resale",
  "Ingredients & Beverages",
  "Packaging",
  "Treatment Consumables",
  "Pet Care Consumables",
  "Raw Materials",
  "Production Overhead",
  "Medical / Healthcare",
  "TNB / Electricity",
  "Water",
  "Gas",
  "Utilities",
  "Rent & Premises",
  "Repairs & Maintenance",
  "Transport & Delivery",
  "Office & Administration",
  "Advertising & Marketing",
  "Equipment / Asset",
  "Professional Fees",
  "Other Expense",
  "Needs Review",
];

const categoryConcepts: Array<{ category: BookCategory; terms: string[] }> = [
  { category: "TNB / Electricity", terms: ["electricity", "electric", "elektrik", "tenaga nasional", "tnb", "bil elektrik", "电费", "电力"] },
  { category: "Water", terms: ["water bill", "bil air", "syabas", "air selangor", "water utility", "水费", "自来水"] },
  { category: "Gas", terms: ["gas bill", "cooking gas", "lpg", "tong gas", "gas cylinder", "natural gas", "煤气", "燃气", "瓦斯"] },
  { category: "Utilities", terms: ["internet", "unifi", "telephone", "telekom", "broadband", "wifi", "网络费", "电话费"] },
  { category: "Rent & Premises", terms: ["rent", "rental", "sewa", "premise", "shoplot", "hostel", "租金", "店租"] },
  { category: "Repairs & Maintenance", terms: ["repair", "maintenance", "pembaikan", "baiki", "servicing", "machine repair", "machinery repair", "equipment repair", "维修", "保养"] },
  { category: "Transport & Delivery", terms: ["petrol", "diesel", "fuel", "ron95", "ron97", "toll", "parking", "courier", "delivery", "freight", "lorry", "grab", "油费", "运费", "停车"] },
  { category: "Advertising & Marketing", terms: ["advertising", "advertisement", "advert", "marketing", "promotion", "promotional", "branding", "sponsorship", "signage", "banner", "flyer", "brochure", "social media", "facebook ad", "google ad", "tiktok ad", "广告", "廣告", "宣传", "宣傳", "推广", "推廣", "营销", "行销"] },
  { category: "Office & Administration", terms: ["stationery", "office", "printing", "printer", "toner", "ink cartridge", "photostat", "software subscription", "alat tulis", "office upkeep", "office cleaning", "pantry supplies", "janitorial", "pejabat", "文具", "打印"] },
  { category: "Goods for Resale", terms: ["stock purchase", "retail stock", "goods for resale", "product stock", "resale item", "stok jualan", "stok kedai", "barang jualan", "零售库存", "转售商品"] },
  { category: "Professional Fees", terms: ["accounting fee", "audit fee", "legal fee", "consultancy", "professional fee", "secretarial fee", "会计费", "律师费"] },
  { category: "Equipment / Asset", terms: ["machine", "machinery", "equipment", "computer", "laptop", "freezer", "refrigerator", "fridge", "oven", "air conditioner", "furniture", "mesin", "peralatan", "机器", "设备", "电脑"] },
  { category: "Food Items", terms: ["chicken", "ayam", "beef", "daging", "fish", "ikan", "prawn", "udang", "pork", "pork loin", "babi", "daging babi", "猪肉", "vegetable", "sayur", "tomato", "rice", "beras", "flour", "tepung", "egg", "telur", "milk", "susu", "cooking oil", "minyak masak", "sugar", "gula", "food item", "ingredient", "食品", "食材", "鸡肉", "鱼", "蔬菜", "米"] },
  { category: "Packaging", terms: ["packaging", "wrapper", "plastic bag", "paper bag", "container", "takeaway box", "cup", "lid", "straw", "label", "bungkus", "bekas", "塑料袋", "包装"] },
  { category: "Production Overhead", terms: ["factory cleaning", "machine lubricant", "industrial gas", "production supplies", "safety equipment", "factory maintenance"] },
];

const ignoredLine = new RegExp(
  [
    "^(total|sub\\s*total|subtotal|grand\\s*total|jumlah|amount\\s*due)",
    "^(tax|sst|gst|cukai|service\\s*tax)",
    "^(cash|credit|debit|visa|mastercard|change|balance|rounding|payment)",
    "^(online\\s*transfer|bank\\s*transfer|duitnow|e-wallet|ewallet)",
    "^(net\\s*rm|net\\s*amount|amount\\s*paid)",
    "^(date|time|receipt|resit|invoice|tax\\s*invoice|bill\\s*no|member|cashier)",
    "^(sales\\s*receipt|official\\s*receipt)",
    "^(qty|quantity|item|description|price|disc|amount|unit\\s*price)",
    "^(fee\\s*description|service\\s*description)",
    "^(thank|goods\\s*sold|terms|scan|www\\.|tel|phone|fax|address)",
  ].join("|"),
  "i",
);

export function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const nonPurchaseLineForTotals = new RegExp(
  [
    "^(total|sub total|subtotal|grand total|net rm|net amount|amount paid)",
    "^(online transfer|bank transfer|duitnow|payment|cash|credit|debit|change)",
    "^(tax|sst|gst|discount|rounding)",
    "\\b(tax invoice|invoice no|receipt no|phone|telephone|tel|fax|address)\\b",
    "\\b(jalan|street|avenue|ave|jurong)\\b",
    "\\boff\\b",
  ].join("|"),
  "i",
);

export function isNonPurchaseMetadata(description: string) {
  return nonPurchaseLineForTotals.test(normalise(description));
}

function documentIdentityPart(value: string) {
  return normalise(value).replace(/[^a-z0-9\u3400-\u9fff]+/g, "");
}

export function documentFingerprint(document: BookDocument) {
  const merchant = documentIdentityPart(document.merchant);
  const reference = documentIdentityPart(document.documentNo);
  const total = Math.round(Math.max(0, document.total) * 100);
  if (!merchant || !document.date || !total) return "";
  return [document.documentType, merchant, document.date, reference || "no-reference", total].join("|");
}

export function duplicateDocumentIds(documents: BookDocument[]) {
  const firstByFingerprint = new Map<string, string>();
  const duplicates = new Set<string>();
  documents.forEach((document) => {
    const fingerprint = documentFingerprint(document);
    if (!fingerprint) return;
    const firstId = firstByFingerprint.get(fingerprint);
    if (firstId) {
      duplicates.add(firstId);
      duplicates.add(document.id);
    } else {
      firstByFingerprint.set(fingerprint, document.id);
    }
  });
  return duplicates;
}

export function reconcileDocumentCategories(document: BookDocument) {
  const documentTotal = Number.isFinite(document.total) ? Math.max(0, document.total) : 0;
  if (document.documentType !== "purchase" || documentTotal <= 0) return [];

  const maximumPlausibleLine = Math.max(documentTotal * 1.25, documentTotal + 5);
  const candidates = document.items.filter((item) => {
    const description = normalise(item.description);
    return item.amount > 0 && item.amount <= maximumPlausibleLine && description.length >= 2 && !isNonPurchaseMetadata(description);
  });

  if (!candidates.length) return [{ category: "Other Expense", amount: documentTotal }];
  const candidateTotal = candidates.reduce((sum, item) => sum + item.amount, 0);
  if (candidateTotal <= 0) return [{ category: "Other Expense", amount: documentTotal }];

  let allocated = 0;
  return candidates.map((item, index) => {
    const amount = index === candidates.length - 1
      ? Math.max(0, Math.round((documentTotal - allocated) * 100) / 100)
      : Math.round((item.amount / candidateTotal) * documentTotal * 100) / 100;
    allocated += amount;
    return { category: item.category, amount };
  });
}

function parseNumber(value?: string) {
  if (!value) return 0;
  return Number(value.replace(/[,\s]/g, "")) || 0;
}

export function classifyBookDescription(
  description: string,
  businessType: BusinessType,
  documentType: DocumentType,
  learning: LearningMap,
) {
  if (documentType === "sales") {
    return { category: "Sales Income" as BookCategory, confidence: 98, source: "rule" as const };
  }

  const clean = normalise(description);
  const learned = Object.entries(learning)
    .sort(([a], [b]) => b.length - a.length)
    .find(([term]) => clean.includes(term));
  if (learned) return { category: learned[1], confidence: 99, source: "learned" as const };

  for (const concept of categoryConcepts) {
    if (concept.terms.some((term) => clean.includes(normalise(term)))) {
      return { category: concept.category, confidence: 93, source: "rule" as const };
    }
  }

  return {
    category: businessProfiles[businessType].directCategory,
    confidence: 78,
    source: "business-context" as const,
  };
}

function findDate(lines: string[]) {
  const joined = lines.join(" ");
  const labelled = lines.find((value) => /date|tarikh|日期|தேதி/i.test(value));
  const source = labelled || joined;
  const dmy = source.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (dmy) {
    const [, day, month, rawYear] = dmy;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const ymd = source.match(/\b(20\d{2})[/-](\d{1,2})[/-](\d{1,2})\b/);
  if (!ymd) return "";
  return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
}

function findExplicitSupplier(lines: string[]) {
  const index = lines.findIndex((line) => /^(supplier|vendor|pembekal|supplied\s+by|sold\s+by|供应商)\b/i.test(line.trim()));
  if (index < 0) return "";
  const sameLine = lines[index]
    .replace(/^(supplier|vendor|pembekal|supplied\s+by|sold\s+by|供应商)\s*[:\-]?\s*/i, "")
    .trim();
  if (sameLine.length >= 3) return sameLine;
  return lines[index + 1]?.trim() ?? "";
}

function canonicalMerchant(text: string) {
  const clean = normalise(text);
  if (/\b99\s*speed\s*mart\b/.test(clean) || /\bspeed\s*mart\b/.test(clean)) return "99 Speedmart";
  if (/\b7\s*eleven\b/.test(clean)) return "7-Eleven";
  if (/\bmr\s*diy\b/.test(clean)) return "MR.DIY";
  if (/\beco\s*shop\b/.test(clean)) return "Eco-Shop";
  if (/\beconsave\b/.test(clean)) return "Econsave";
  if (/\bmydin\b/.test(clean)) return "Mydin";
  if (/\blotus'?s?\b/.test(clean)) return "Lotus's";
  if (/\baeon\b/.test(clean)) return "AEON";
  return "";
}

function looksLikeMetadataCandidate(line: string) {
  const clean = normalise(line);
  const letters = clean.match(/\p{L}/gu)?.length ?? 0;
  const digits = clean.match(/\d/g)?.length ?? 0;
  const compact = clean.replace(/\s+/g, "");
  if (!clean || letters < 3) return true;
  if (/(receipt|resit|invoice|invois|tax|date|time|welcome|cashier|counter|total|amount|qty|item|description|member|terminal|transaction|reference|voucher)/i.test(clean)) return true;
  if (/(?:^|\s)[a-z]{0,3}voice\s*(?:no|mo|m0|n0)?\b/i.test(clean)) return true;
  if (/(address|alamat|jalan|jln|taman|tel|phone|fax|www|email)/i.test(clean)) return true;
  if (compact.length > 0 && digits / compact.length > 0.34) return true;
  return false;
}

function findInvoiceHeaderSupplier(lines: string[]) {
  const boundaryCandidates = [
    lines.findIndex((line) => /^\s*(invoice|invois|发票)\b/i.test(line)),
    lines.findIndex((line) => /^\s*(bill\s+to|billed\s+to|sold\s+to|customer)\b/i.test(line)),
    12,
  ].filter((index) => index > 0);
  const boundary = boundaryCandidates.length ? Math.min(...boundaryCandidates) : Math.min(lines.length, 12);

  const candidates = lines.slice(0, boundary)
    .map((line, index) => {
      const clean = line.replace(/^[^\p{L}]*/u, "").replace(/\s+/g, " ").trim();
      if (clean.length < 3 || clean.length > 90 || looksLikeMetadataCandidate(clean)) return null;
      const strongCompanyIdentity = /sdn\s*bhd|berhad|enterprise|trading|distribution|supplies|supplier|wholesale|market|mart|store|shop|services/i.test(clean);
      if (!strongCompanyIdentity) return null;
      const letters = clean.match(/\p{L}/gu)?.length ?? 0;
      const digits = clean.match(/\d/g)?.length ?? 0;
      if (letters < 5 || digits > letters) return null;
      let score = 20 - index;
      if (/sdn\s*bhd|berhad|enterprise/i.test(clean)) score += 8;
      if (/distribution|trading|supplies|supplier|wholesale/i.test(clean)) score += 5;
      return { clean, score };
    })
    .filter((candidate): candidate is { clean: string; score: number } => Boolean(candidate))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.clean ?? "";
}

function findMerchant(lines: string[], ocrConfidence: number | undefined, documentType: DocumentType) {
  const allText = lines.join(" ");
  const canonical = canonicalMerchant(allText);
  if (canonical) return canonical;

  const explicitSupplier = findExplicitSupplier(lines);
  const headerSupplier = findInvoiceHeaderSupplier(lines);
  const hasReceiptHeading = lines.some((line) => /\b(sales\s+receipt|official\s+receipt|resit\s+jualan|receipt)\b/i.test(line));
  const hasFormalInvoiceHeading = lines.some((line) => /^\s*(invoice|invois|发票)\b/i.test(line) && !/tax\s+invoice\s*(no|#)/i.test(line));
  const hasFormalInvoiceFields = lines.some((line) => /our\s+d\/?o|your\s+ref|payment\s+terms|^\s*terms\s*[:\-]|bill\s+to/i.test(line));
  const formalPurchaseInvoice = documentType === "purchase" && !hasReceiptHeading && hasFormalInvoiceHeading && hasFormalInvoiceFields;
  if (formalPurchaseInvoice) {
    if (explicitSupplier) return explicitSupplier;
    if (headerSupplier) return headerSupplier;
    return merchantNotVisible;
  }

  if (typeof ocrConfidence === "number" && ocrConfidence < 35) {
    const meaningfulLines = lines.filter((line) => /[\p{L}\p{N}]{3}/u.test(line)).length;
    if (meaningfulLines < 3) return merchantNotVisible;
  }
  if (explicitSupplier) return explicitSupplier;
  if (headerSupplier) return headerSupplier;

  const candidates = lines.slice(0, 16)
    .map((line, index) => {
      const clean = line.replace(/^[^\p{L}]*/u, "").replace(/\s+/g, " ").trim();
      if (clean.length < 3 || clean.length > 72 || looksLikeMetadataCandidate(clean)) return null;
      const letters = clean.match(/\p{L}/gu)?.length ?? 0;
      const uppercaseLetters = clean.match(/\p{Lu}/gu)?.length ?? 0;
      const wordCount = clean.split(/\s+/).length;
      const shortWords = clean.split(/\s+/).filter((word) => word.replace(/[^\p{L}]/gu, "").length <= 2).length;
      let score = Math.max(0, 6 - Math.floor(index / 2));
      if (wordCount >= 7 && shortWords / wordCount > 0.35) return null;
      if (/sdn\s*bhd|enterprise|trading|supplies|distribution|market|mart|store|shop|restaurant|cafe|salon|spa|services/i.test(clean)) score += 7;
      if (letters >= 4 && uppercaseLetters / letters > 0.68) score += 2;
      if (wordCount >= 2 && wordCount <= 7) score += 2;
      return { clean, score };
    })
    .filter((candidate): candidate is { clean: string; score: number } => Boolean(candidate))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.score >= 5 ? candidates[0].clean : merchantNotVisible;
}

function findDocumentNo(lines: string[]) {
  const line = lines.find((value) => /receipt\s*(no|#)|resit\s*(no|#)|invoice\s*(no|#)|inv\s*(no|#)|bill\s*(no|#)|online\s+voucher|voucher\s*(no|#)|ov\s*(no|#)/i.test(value));
  const explicit = line?.match(/(?:receipt\s*(?:no|#)|resit\s*(?:no|#)|invoice\s*(?:no|#)|inv\s*(?:no|#)|bill\s*(?:no|#)|voucher\s*(?:no|#)?|ov\s*(?:no|#)?)\s*[:.#-]?\s*([A-Z0-9][A-Z0-9\s/-]{2,})/i)?.[1]
    .replace(/\s+/g, " ")
    .trim();
  return explicit || `AUTO-${Date.now().toString().slice(-6)}`;
}

function findMoneyAtEnd(line: string, allowOcrCents = false) {
  const values = [...line.matchAll(/(?:RM\s*)?(-?\d[\d,]*\.\d{2})/gi)];
  if (values.length) return parseNumber(values[values.length - 1][1]);
  if (!allowOcrCents) return 0;
  const standalone = line.match(/^\s*(?:RM\s*)?(\d{3,10})\s*$/i);
  if (standalone) return parseNumber(standalone[1]) / 100;
  if (/^\s*\d+\s+/.test(line)) {
    const trailing = line.match(/\s(\d{3,10})\s*$/);
    if (trailing) return parseNumber(trailing[1]) / 100;
  }
  return 0;
}

function extractDescription(line: string) {
  return line
    .replace(/\b(?:RM\s*)?-?\d[\d,]*\.\d{2}\b/gi, " ")
    .replace(/^\s*\d+\s+(.+?)\s+\d{3,10}\s*$/u, "$1")
    .replace(/^\s*\d+\s*[xX*]\s*/, "")
    .replace(/^\s*\d+\s+(?=[\p{L}])/u, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[-:=|]+$/g, "")
    .trim();
}

function descriptionLooksReadable(description: string) {
  const compact = description.trim();
  if ((compact.match(/[\u3400-\u9fff]/g)?.length ?? 0) >= 2) return true;
  const latinLetters = compact.match(/[a-z]/gi) ?? [];
  if (latinLetters.length < 4) return false;
  const vowels = compact.match(/[aeiou]/gi)?.length ?? 0;
  const words = compact.match(/[a-z]{3,}/gi) ?? [];
  return words.length > 0 && vowels / latinLetters.length >= 0.12;
}

function findQuantity(line: string) {
  const match = line.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(gulung|papan|bottle|botol|pack|unit|ekor|pcs|pkt|box|bag|kg|litre|liter|tin|pc|g|l)\b/i);
  if (!match) return { quantity: 1, unit: "unit" };
  return { quantity: parseNumber(match[1]) || 1, unit: match[2].toLowerCase() };
}

function extractItemLines(lines: string[]) {
  const candidates: Array<{ description: string; raw: string; amount: number }> = [];
  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index].replace(/[|]/g, " ").replace(/\s+/g, " ").trim();
    if (!current || ignoredLine.test(current)) continue;
    const currentAmount = findMoneyAtEnd(current, true);
    const hasLetters = /[\p{L}]{2}/u.test(current);
    if (currentAmount > 0 && hasLetters) {
      const description = extractDescription(current);
      if (description.length >= 2) candidates.push({ description, raw: current, amount: currentAmount });
      continue;
    }
    const next = lines[index + 1]?.replace(/[|]/g, " ").replace(/\s+/g, " ").trim() ?? "";
    const nextAmount = findMoneyAtEnd(next, true);
    const currentLooksLikeProduct = hasLetters && current.length >= 3 && !ignoredLine.test(current) && !/sdn\s*bhd|enterprise|trading|address|jalan|taman/i.test(current);
    if (currentLooksLikeProduct && nextAmount > 0 && /\d/.test(next) && !ignoredLine.test(next)) {
      candidates.push({ description: current, raw: `${current} ${next}`, amount: nextAmount });
      index += 1;
    }
  }
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${normalise(candidate.description)}|${candidate.amount.toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findTotal(lines: string[], itemTotal: number) {
  const totalLines = lines
    .map((line, index) => {
      const amount = findMoneyAtEnd(line, true) || findMoneyAtEnd(lines[index + 1] ?? "", true) || findMoneyAtEnd(lines[index + 2] ?? "", true);
      const clean = normalise(line);
      const score = /\bnet total\b|\bgrand total\b|\btotal amount\b|\bamount due\b|\bjumlah besar\b/.test(clean)
        ? 5
        : /^(total|jumlah)\b/.test(clean)
          ? 4
          : /\bnet rm\b|\bamount paid\b/.test(clean)
            ? 3
            : /\btotal\b/.test(clean) && !/sub\s*total|subtotal/.test(clean)
              ? 2
              : 0;
      return { amount, score };
    })
    .filter((candidate) => candidate.score > 0 && candidate.amount > 0)
    .sort((first, second) => second.score - first.score);
  return totalLines[0]?.amount || itemTotal;
}

function findTax(lines: string[]) {
  const taxLine = lines.find((line) => /^(tax|sst|gst|cukai|service\s*tax)/i.test(line.trim()));
  return findMoneyAtEnd(taxLine ?? "");
}

function reconcileItemsToPrintedTotal<T extends { description: string; amount: number }>(items: T[], total: number, tax: number) {
  if (items.length < 2 || items.length > 20 || total <= 0) return items;
  const itemCents = items.map((item) => Math.round(item.amount * 100));
  const rawCents = itemCents.reduce((sum, amount) => sum + amount, 0);
  const targets = [...new Set([Math.round(total * 100), tax > 0 ? Math.round((total - tax) * 100) : 0].filter((target) => target > 0))];
  if (targets.includes(rawCents)) return items;

  let bestIndices: number[] | null = null;
  let bestScore = -Infinity;
  for (const target of targets) {
    const visit = (index: number, sum: number, chosen: number[]) => {
      if (sum === target) {
        const descriptions = new Set(chosen.map((itemIndex) => normalise(items[itemIndex].description)));
        const duplicateCount = chosen.length - descriptions.size;
        const score = descriptions.size * 100 + chosen.length - duplicateCount * 50;
        if (score > bestScore) {
          bestScore = score;
          bestIndices = [...chosen];
        }
        return;
      }
      if (index >= items.length || sum > target) return;
      visit(index + 1, sum, chosen);
      if (itemCents[index] > 0 && sum + itemCents[index] <= target) {
        chosen.push(index);
        visit(index + 1, sum + itemCents[index], chosen);
        chosen.pop();
      }
    };
    visit(0, 0, []);
  }
  return bestIndices ? (bestIndices as number[]).map((index) => items[index]) : items;
}

function documentContextCategory(text: string): BookCategory | null {
  const clean = normalise(text);
  if (/\b(poliklinik|klinik|clinic|hospital|medical centre|medical center|pharmacy|farmasi)\b/.test(clean)) return "Medical / Healthcare";
  if (/\b(tenaga nasional|tnb|bil elektrik|electricity bill)\b/.test(clean)) return "TNB / Electricity";
  if (/\b(air selangor|syabas|bil air|water utility|water bill)\b/.test(clean)) return "Water";
  if (/\b(gas malaysia|gas bill|bil gas|lpg invoice)\b/.test(clean)) return "Gas";
  if (/\b(unifi|telekom malaysia|internet bill|broadband bill|telephone bill)\b/.test(clean)) return "Utilities";
  if (/\b(premise rental|shop rental|rental invoice|sewa premis|sewa kedai)\b/.test(clean)) return "Rent & Premises";
  if (/\b(petrol|diesel|ron95|ron97|fuel|toll|parking)\b/.test(clean)) return "Transport & Delivery";
  return null;
}

function looksLikeReceipt(lines: string[]) {
  const clean = normalise(lines.join(" "));
  const formalInvoice = /\binvoice\b/.test(clean) && /\b(payment terms|bill to|our d o|your ref|due date|terms net)\b/.test(clean);
  if (formalInvoice) return false;
  if (/\b(receipt|resit)\b/.test(clean)) return true;
  if (/\b(net total|cash tendered|change|rounding adjustment)\b/.test(clean)) return true;
  return /\b(sub total|subtotal)\b/.test(clean) && /\b(cash|change|rounding|paid|payment)\b/.test(clean);
}

export function inferDocumentType(text: string): DocumentType {
  const clean = normalise(text);
  if (/sales invoice|official receipt|customer|cash sale|jualan/.test(clean)) return "sales";
  return "purchase";
}

export function parseBookDocument(args: {
  text: string;
  businessType: BusinessType;
  documentType: DocumentType;
  learning: LearningMap;
  fileName?: string;
  ocrConfidence?: number;
}): BookDocument {
  const lines = args.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const merchant = findMerchant(lines, args.ocrConfidence, args.documentType);
  const contextCategory = documentContextCategory(args.text);
  const extracted = extractItemLines(lines);

  const parsedItems = extracted.map((candidate, index) => {
    const decision = args.documentType === "purchase" && contextCategory
      ? { category: contextCategory, confidence: 96, source: "rule" as const }
      : classifyBookDescription(candidate.description, args.businessType, args.documentType, args.learning);
    const { quantity, unit } = findQuantity(candidate.raw);
    const readableDescription = descriptionLooksReadable(candidate.description) || (contextCategory === "Medical / Healthcare" && /[a-z0-9]{4,}/i.test(candidate.description.replace(/\s+/g, "")));
    return {
      id: `${Date.now()}-${index}`,
      description: candidate.description,
      quantity,
      unit,
      unitPrice: candidate.amount / quantity,
      amount: candidate.amount,
      ...decision,
      confidence: readableDescription ? Math.min(decision.confidence, Math.round(args.ocrConfidence ?? 100)) : 25,
      descriptionConfirmed: readableDescription && (args.ocrConfidence ?? 100) >= 65,
    };
  });

  const rawItemTotal = parsedItems.reduce((sum, item) => sum + item.amount, 0);
  const total = findTotal(lines, rawItemTotal);
  const tax = findTax(lines);
  const receipt = looksLikeReceipt(lines);

  if (receipt) {
    const receiptDecision = args.documentType === "sales"
      ? { category: "Sales Income" as BookCategory, confidence: 98, source: "rule" as const }
      : contextCategory
        ? { category: contextCategory, confidence: 96, source: "rule" as const }
        : {
            category: businessProfiles[args.businessType].directCategory,
            confidence: 95,
            source: "business-context" as const,
          };
    const description = merchant === merchantNotVisible ? "Receipt total" : `${merchant} receipt total`;
    const items: BookItem[] = total > 0
      ? [{
          id: `${Date.now()}-receipt-total`,
          description,
          quantity: 1,
          unit: "receipt",
          unitPrice: total,
          amount: total,
          ...receiptDecision,
          confidence: merchant !== merchantNotVisible ? 95 : 70,
          descriptionConfirmed: true,
        }]
      : [];
    return {
      id: `WB-${Date.now()}`,
      merchant,
      date: findDate(lines),
      documentNo: findDocumentNo(lines),
      documentType: args.documentType,
      items,
      tax,
      total,
      status: items.length > 0 && merchant !== merchantNotVisible ? "Ready" : "Needs review",
      fileName: args.fileName,
      ocrConfidence: args.ocrConfidence,
      createdAt: new Date().toISOString(),
    };
  }

  const reconciled = reconcileItemsToPrintedTotal(parsedItems, total, tax);
  const finalItems = reconciled.length > 0
    ? reconciled
    : total > 0
      ? [{
          id: `${Date.now()}-review`,
          description: "Document total — item details need review",
          quantity: 1,
          unit: "document",
          unitPrice: total,
          amount: total,
          category: "Needs Review" as BookCategory,
          confidence: 25,
          descriptionConfirmed: false,
          source: "review" as const,
        }]
      : [];

  const confidenceFloor = args.ocrConfidence ?? 100;
  const finalItemTotal = finalItems.reduce((sum, item) => sum + item.amount, 0);
  const totalsAgree = Math.abs(finalItemTotal - total) < 0.02 || Math.abs(finalItemTotal + tax - total) < 0.02;
  const status = finalItems.length > 0 && finalItems.every((item) => item.confidence >= 70) && totalsAgree && confidenceFloor >= 45 && merchant !== merchantNotVisible
    ? "Ready"
    : "Needs review";

  return {
    id: `WB-${Date.now()}`,
    merchant,
    date: findDate(lines),
    documentNo: findDocumentNo(lines),
    documentType: args.documentType,
    items: finalItems,
    tax,
    total,
    status,
    fileName: args.fileName,
    ocrConfidence: args.ocrConfidence,
    createdAt: new Date().toISOString(),
  };
}
