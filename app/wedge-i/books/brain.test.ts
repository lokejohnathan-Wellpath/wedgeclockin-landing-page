import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node 24 runs this regression file directly with type stripping.
import {
  merchantNotVisible,
  parseBookDocument,
  reconcileDocumentCategories,
} from "./brain.ts";

test("retail sales receipt keeps merchant and ignores payment lines", () => {
  const document = parseBookDocument({
    text: `
HUP SOON IPOH FOODS SDN. BHD.
SALES RECEIPT
PI TULANG BESAR (10KG) 250.00
Payment Info:
Online Transfer 250.00
TOTAL RM: 250.00
NET RM: 250.00
Tax Invoice No: PPI22607240136
`,
    businessType: "retail",
    documentType: "purchase",
    learning: {},
    ocrConfidence: 87,
  });

  assert.match(document.merchant, /HUP SOON/i);
  assert.equal(document.total, 250);
  assert.equal(document.items.length, 1);
  assert.equal(document.items[0].description, "PI TULANG BESAR (10KG)");
});

test("clinic receipt uses medical context and restores missing decimal amounts", () => {
  const document = parseBookDocument({
    text: `
POLIKLINIK SIHAT DAHLIA SDN. BHD.
OFFICIAL RECEIPT
Fee Description Amount
1 SY PROZINE 60ML 1000
2 SY PCM 250MG 1000
3 SYN-E JUICE (ORS) 400
4 CONSULTATION OUTPATIENT 12AM-8AM 3000
TOTAL AMOUNT
5400
OTHER AMT
000
SY PCM 250MG 10.00
`,
    businessType: "retail",
    documentType: "purchase",
    learning: {},
    ocrConfidence: 81,
  });

  assert.match(document.merchant, /POLIKLINIK/i);
  assert.equal(document.total, 54);
  assert.equal(document.items.length, 4);
  assert.equal(document.items.reduce((sum, item) => sum + item.amount, 0), 54);
  assert.ok(document.items.every((item) => item.category === "Medical / Healthcare"));
  assert.equal(document.status, "Ready");
});

test("formal invoice without an explicit supplier asks the user", () => {
  const document = parseBookDocument({
    text: `
JCC GLOBAL SERVICES SDN BHD
INVOICE
Our D/O No:
Terms: Net 7 days
Pork Loin T100 25 KG 18.50 462.50
TOTAL 462.50
`,
    businessType: "restaurant",
    documentType: "purchase",
    learning: {},
    ocrConfidence: 85,
  });

  assert.equal(document.merchant, merchantNotVisible);
  assert.equal(document.total, 462.5);
  assert.equal(document.items[0].category, "Food Items");
});

test("strong utility document context overrides the business fallback", () => {
  const document = parseBookDocument({
    text: `
TENAGA NASIONAL BERHAD
ELECTRICITY BILL
CURRENT CHARGES 245.60
TOTAL AMOUNT 245.60
`,
    businessType: "retail",
    documentType: "purchase",
    learning: {},
    ocrConfidence: 91,
  });

  assert.equal(document.total, 245.6);
  assert.ok(document.items.every((item) => item.category === "TNB / Electricity"));
});

test("category breakdown cannot exceed the authoritative receipt total", () => {
  const lines = reconcileDocumentCategories({
    id: "legacy-shell",
    merchant: "Jurong West",
    date: "2026-07-28",
    documentNo: "AUTO-774",
    documentType: "purchase",
    items: [
      {
        id: "bad-phone",
        description: "Shel",
        quantity: 1,
        unit: "unit",
        unitPrice: 625883.6,
        amount: 625883.6,
        category: "Repairs & Maintenance",
        confidence: 100,
        source: "learned",
      },
      {
        id: "fuel",
        description: "Fuel Save95",
        quantity: 1,
        unit: "litre",
        unitPrice: 31.92,
        amount: 31.92,
        category: "Transport & Delivery",
        confidence: 78,
        source: "business-context",
      },
    ],
    tax: 0,
    total: 31.92,
    status: "Needs review",
    createdAt: "2026-07-28T00:00:00.000Z",
  });

  assert.equal(lines.reduce((sum, line) => sum + line.amount, 0), 31.92);
  assert.equal(
    lines.filter((line) => line.category === "Repairs & Maintenance")
      .reduce((sum, line) => sum + line.amount, 0),
    0,
  );
});
