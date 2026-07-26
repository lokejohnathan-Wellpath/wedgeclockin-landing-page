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
  | "Direct Purchases"
  | "Goods for Resale"
  | "Ingredients & Beverages"
  | "Packaging"
  | "Treatment Consumables"
  | "Pet Care Consumables"
  | "Raw Materials"
  | "Production Overhead"
  | "Utilities"
  | "Rent & Premises"
  | "Repairs & Maintenance"
  | "Transport & Delivery"
  | "Office & Administration"
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
  category: BookCategory;
  confidence: number;
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

export type LearningMap = Record<string, BookCategory>;

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
  "Direct Purchases",
  "Goods for Resale",
  "Ingredients & Beverages",
  "Packaging",
  "Treatment Consumables",
  "Pet Care Consumables",
  "Raw Materials",
  "Production Overhead",
  "Utilities",
  "Rent & Premises",
  "Repairs & Maintenance",
  "Transport & Delivery",
  "Office & Administration",
  "Equipment / Asset",
  "Professional Fees",
  "Other Expense",
  "Needs Review",
];

const categoryConcepts: Array<{ category: BookCategory; terms: string[] }> = [
  {
    category: "Utilities",
    terms: [
      "electricity", "electric", "elektrik", "tenaga nasional", "tnb", "water bill",
      "bil air", "syabas", "air selangor", "gas bill", "internet", "unifi",
      "telephone", "telekom", "电费", "水费", "煤气", "மின்சாரம்", "தண்ணீர்",
    ],
  },
  {
    category: "Rent & Premises",
    terms: [
      "rent", "rental", "sewa", "premise", "shoplot", "hostel", "租金", "店租",
      "வாடகை",
    ],
  },
  {
    category: "Repairs & Maintenance",
    terms: [
      "repair", "maintenance", "pembaikan", "baiki", "servicing", "cleaning service",
      "维修", "保养", "பழுது", "பராமரிப்பு",
    ],
  },
  {
    category: "Transport & Delivery",
    terms: [
      "petrol", "diesel", "fuel", "toll", "parking", "courier", "delivery",
      "freight", "lorry", "grab", "油费", "运费", "停车", "எரிபொருள்",
    ],
  },
  {
    category: "Office & Administration",
    terms: [
      "stationery", "office", "printing", "printer", "toner", "ink cartridge",
      "photostat", "software subscription", "alat tulis", "文具", "打印",
      "அலுவலகம்",
    ],
  },
  {
    category: "Professional Fees",
    terms: [
      "accounting fee", "audit fee", "legal fee", "consultancy", "professional fee",
      "secretarial fee", "会计费", "律师费",
    ],
  },
  {
    category: "Equipment / Asset",
    terms: [
      "machine", "machinery", "equipment", "computer", "laptop", "freezer",
      "refrigerator", "fridge", "oven", "air conditioner", "furniture", "mesin",
      "peralatan", "机器", "设备", "电脑", "இயந்திரம்",
    ],
  },
  {
    category: "Packaging",
    terms: [
      "packaging", "wrapper", "plastic bag", "paper bag", "container", "takeaway box",
      "cup", "lid", "straw", "label", "bungkus", "bekas", "塑料袋", "包装", "பை",
    ],
  },
  {
    category: "Production Overhead",
    terms: [
      "factory cleaning", "machine lubricant", "industrial gas", "production supplies",
      "safety equipment", "factory maintenance",
    ],
  },
];

const ignoredLine = new RegExp(
  [
    "^(total|sub\\s*total|subtotal|grand\\s*total|jumlah|amount\\s*due)",
    "^(tax|sst|gst|cukai|service\\s*tax)",
    "^(cash|credit|debit|visa|mastercard|change|balance|rounding|payment)",
    "^(date|time|receipt|resit|invoice|tax\\s*invoice|bill\\s*no|member|cashier)",
    "^(qty|quantity|item|description|price|disc|amount|unit\\s*price)",
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

function parseNumber(value?: string) {
  if (!value) return 0;
  return Number(value.replace(/[,\s]/g, "")) || 0;
}

function decideCategory(
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

  if (learned) {
    return { category: learned[1], confidence: 99, source: "learned" as const };
  }

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
  const line = lines.find((value) => /date|tarikh|日期|日期|தேதி/i.test(value)) ??
    lines.find((value) => /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(value));
  const value = line?.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!value) return new Date().toISOString().slice(0, 10);
  const [, day, month, rawYear] = value;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function findMerchant(lines: string[], ocrConfidence?: number) {
  if (typeof ocrConfidence === "number" && ocrConfidence < 40) {
    return merchantNotVisible;
  }

  const candidates = lines.slice(0, 10)
    .map((line, index) => {
      const clean = line.replace(/^[^\p{L}]*/u, "").trim();
      if (
        clean.length < 3 ||
        clean.length > 64 ||
        !/[\p{L}]{3}/u.test(clean) ||
        /receipt|resit|invoice|tax|date|time|welcome|cashier|counter|total|amount|qty|item|description/i.test(clean) ||
        /address|alamat|jalan|jln|taman|tel|phone|fax|www\.|@/i.test(clean) ||
        /^\d[\d\s/.-]+$/.test(clean)
      ) {
        return null;
      }

      const letters = clean.match(/\p{L}/gu)?.length ?? 0;
      const symbols = clean.replace(/[\p{L}\p{N}\s&.'()-]/gu, "").length;
      const uppercaseLetters = clean.match(/\p{Lu}/gu)?.length ?? 0;
      const wordCount = clean.split(/\s+/).length;
      let score = Math.max(0, 4 - index);

      if (/sdn\s*bhd|enterprise|trading|supplies|market|mart|store|shop|restaurant|cafe|salon|spa|services/i.test(clean)) score += 5;
      if (letters >= 4 && uppercaseLetters / letters > 0.72) score += 3;
      if (wordCount >= 2 && wordCount <= 7) score += 2;
      if (symbols > 2) score -= 4;

      return { clean, score };
    })
    .filter((candidate): candidate is { clean: string; score: number } => Boolean(candidate))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.score >= 4 ? candidates[0].clean : merchantNotVisible;
}

function findDocumentNo(lines: string[]) {
  const line = lines.find((value) =>
    /receipt\s*(no|#)|resit\s*(no|#)|invoice\s*(no|#)|inv\s*(no|#)|bill\s*(no|#)/i.test(value),
  );
  const explicit = line?.match(/(?:no|#|:)\s*([A-Z0-9][A-Z0-9/-]{2,})/i)?.[1];
  return explicit || `AUTO-${Date.now().toString().slice(-6)}`;
}

function findMoneyAtEnd(line: string) {
  const values = [...line.matchAll(/(?:RM\s*)?(-?\d[\d,]*\.\d{2})/gi)];
  return values.length ? parseNumber(values[values.length - 1][1]) : 0;
}

function extractDescription(line: string) {
  return line
    .replace(/\b(?:RM\s*)?-?\d[\d,]*\.\d{2}\b/gi, " ")
    .replace(/^\s*\d+\s*[xX*]\s*/, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[-:=|]+$/g, "")
    .trim();
}

function findQuantity(line: string) {
  const match = line.match(
    /(?:^|\s)(\d+(?:\.\d+)?)\s*(gulung|papan|bottle|botol|pack|unit|ekor|pcs|pkt|box|bag|kg|litre|liter|tin|pc|g|l)\b/i,
  );
  if (!match) return { quantity: 1, unit: "unit" };
  return { quantity: parseNumber(match[1]) || 1, unit: match[2].toLowerCase() };
}

function extractItemLines(lines: string[]) {
  const candidates: Array<{ description: string; raw: string; amount: number }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index].replace(/[|]/g, " ").replace(/\s+/g, " ").trim();
    if (!current || ignoredLine.test(current)) continue;

    const currentAmount = findMoneyAtEnd(current);
    const hasLetters = /[\p{L}]{2}/u.test(current);

    if (currentAmount > 0 && hasLetters) {
      const description = extractDescription(current);
      if (description.length >= 2) candidates.push({ description, raw: current, amount: currentAmount });
      continue;
    }

    const next = lines[index + 1]?.replace(/[|]/g, " ").replace(/\s+/g, " ").trim() ?? "";
    const nextAmount = findMoneyAtEnd(next);
    const currentLooksLikeProduct =
      hasLetters &&
      current.length >= 3 &&
      !ignoredLine.test(current) &&
      !/sdn\s*bhd|enterprise|trading|address|jalan|taman/i.test(current);
    const nextLooksLikeNumbers = nextAmount > 0 && /\d/.test(next);

    if (currentLooksLikeProduct && nextLooksLikeNumbers && !ignoredLine.test(next)) {
      candidates.push({ description: current, raw: `${current} ${next}`, amount: nextAmount });
      index += 1;
    }
  }

  return candidates;
}

function findTotal(lines: string[], itemTotal: number) {
  const totalLine = [...lines].reverse().find((line) =>
    /(?:grand\s*)?total|jumlah|amount\s*due|net\s*total/i.test(line),
  );
  return findMoneyAtEnd(totalLine ?? "") || itemTotal;
}

function findTax(lines: string[]) {
  const taxLine = lines.find((line) => /^(tax|sst|gst|cukai|service\s*tax)/i.test(line.trim()));
  return findMoneyAtEnd(taxLine ?? "");
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
  const lines = args.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const extracted = extractItemLines(lines);
  const items = extracted.map((candidate, index) => {
    const decision = decideCategory(
      candidate.description,
      args.businessType,
      args.documentType,
      args.learning,
    );
    const { quantity, unit } = findQuantity(candidate.raw);
    return {
      id: `${Date.now()}-${index}`,
      description: candidate.description,
      quantity,
      unit,
      unitPrice: candidate.amount / quantity,
      amount: candidate.amount,
      ...decision,
    };
  });

  const itemTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = findTotal(lines, itemTotal);
  const tax = findTax(lines);
  const finalItems =
    items.length > 0
      ? items
      : total > 0
        ? [
            {
              id: `${Date.now()}-review`,
              description: "Document total — item details need review",
              quantity: 1,
              unit: "document",
              unitPrice: total,
              amount: total,
              category: "Needs Review" as BookCategory,
              confidence: 25,
              source: "review" as const,
            },
          ]
        : [];

  const confidenceFloor = args.ocrConfidence ?? 100;
  const merchant = findMerchant(lines, args.ocrConfidence);
  const status =
    finalItems.length > 0 &&
    finalItems.every((item) => item.confidence >= 70) &&
    confidenceFloor >= 45 &&
    merchant !== merchantNotVisible
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
