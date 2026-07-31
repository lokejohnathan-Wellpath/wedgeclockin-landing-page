export type PrintableReceipt = {
  receiptNumber: string;
  total: number;
  paymentMethod: string;
  lines: { quantity: number; name: string; lineTotal: number }[];
  customer?: { name: string };
  merchant?: {
    businessName?: string;
    registeredCompanyName?: string;
    companyRegistrationNumber?: string;
    taxIdentificationNumber?: string;
    registeredBusinessAddress?: string;
    businessAddress?: string;
    sstRegistrationNumber?: string;
  };
};

function appendTextElement(
  document: Document,
  parent: HTMLElement,
  tag: keyof HTMLElementTagNameMap,
  text: string,
) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

export function printReceiptSafely(receipt: PrintableReceipt) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Please allow pop-ups to print the receipt.");
  }

  printWindow.opener = null;
  const { document } = printWindow;
  document.title = `Receipt ${receipt.receiptNumber}`;
  document.head.replaceChildren();
  document.body.replaceChildren();

  const style = document.createElement("style");
  style.textContent =
    "body{font-family:Arial,sans-serif;padding:30px;color:#111}" +
    ".line,.total{display:flex;justify-content:space-between;gap:24px}" +
    ".total{border-top:1px solid #333;margin-top:16px;padding-top:12px}" +
    ".legal{white-space:pre-wrap}";
  document.head.appendChild(style);

  const merchant = receipt.merchant;
  appendTextElement(
    document,
    document.body,
    "h2",
    merchant?.businessName || "Wedge-SmartPOS",
  );

  const legalDetails = [
    merchant?.registeredCompanyName,
    merchant?.companyRegistrationNumber &&
      `Company No: ${merchant.companyRegistrationNumber}`,
    merchant?.taxIdentificationNumber &&
      `TIN: ${merchant.taxIdentificationNumber}`,
    merchant?.sstRegistrationNumber &&
      `SST No: ${merchant.sstRegistrationNumber}`,
    merchant?.registeredBusinessAddress || merchant?.businessAddress,
  ].filter((value): value is string => Boolean(value));

  legalDetails.forEach((value) => {
    const line = appendTextElement(document, document.body, "div", value);
    line.className = "legal";
  });

  appendTextElement(
    document,
    document.body,
    "p",
    `Receipt ${receipt.receiptNumber}`,
  );
  appendTextElement(
    document,
    document.body,
    "p",
    `Customer: ${receipt.customer?.name || "Walk-in"}`,
  );

  receipt.lines.forEach((line) => {
    const row = document.createElement("p");
    row.className = "line";
    appendTextElement(
      document,
      row,
      "span",
      `${line.quantity} × ${line.name}`,
    );
    appendTextElement(
      document,
      row,
      "span",
      `RM ${line.lineTotal.toFixed(2)}`,
    );
    document.body.appendChild(row);
  });

  const total = document.createElement("h3");
  total.className = "total";
  appendTextElement(document, total, "span", "Total");
  appendTextElement(document, total, "span", `RM ${receipt.total.toFixed(2)}`);
  document.body.appendChild(total);

  appendTextElement(
    document,
    document.body,
    "p",
    `Payment: ${receipt.paymentMethod.toUpperCase()}`,
  );

  printWindow.focus();
  printWindow.print();
}
