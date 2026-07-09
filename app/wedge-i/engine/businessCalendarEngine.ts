import type { BusinessType } from "./benchmarks";

export type BusinessCalendarContext = {
  country: "MY";
  month: number;
  monthName: string;
  quarter: 1 | 2 | 3 | 4;
  quarterName: string;
  isMonthEndWindow: boolean;
  isPaydayWindow: boolean;
  isQuarterEndWindow: boolean;
  rhythmName: string;
  commercialSignal: string;
  operationalSignal: string;
  longWeekendSignal: string;
  managementFocus: string;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getBusinessCalendarContext(
  date: Date,
  businessType: BusinessType,
): BusinessCalendarContext {
  const month = date.getMonth();
  const day = date.getDate();
  const quarter = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;

  const isMonthEndWindow = day >= 24;
  const isPaydayWindow = day >= 25 || day <= 7;
  const isQuarterEndWindow = [2, 5, 8, 11].includes(month) && day >= 18;

  const rhythmName = getRhythmName(month);
  const commercialSignal = getCommercialSignal(month, businessType, isPaydayWindow);
  const operationalSignal = getOperationalSignal(month, businessType, isQuarterEndWindow);
  const longWeekendSignal = getLongWeekendSignal(businessType);
  const managementFocus = getManagementFocus(
    businessType,
    isMonthEndWindow,
    isQuarterEndWindow,
  );

  return {
    country: "MY",
    month,
    monthName: monthNames[month],
    quarter,
    quarterName: `Q${quarter} Management Period`,
    isMonthEndWindow,
    isPaydayWindow,
    isQuarterEndWindow,
    rhythmName,
    commercialSignal,
    
    operationalSignal,
    longWeekendSignal,
    managementFocus,
  };
}

function getRhythmName(month: number) {
  if (month === 0 || month === 1) return "Chinese New Year trading rhythm";
  if (month === 2 || month === 3) return "Ramadan / Raya trading rhythm";
  if (month === 4 || month === 5) return "Mid-year demand rhythm";
  if (month === 6 || month === 7) return "Campaign preparation rhythm";
  if (month === 8) return "National campaign rhythm";
  if (month === 9 || month === 10) return "Year-end preparation rhythm";
  return "Year-end trading rhythm";
}

function getCommercialSignal(
  month: number,
  businessType: BusinessType,
  isPaydayWindow: boolean,
) {
  const paydayLine = isPaydayWindow
    ? " Payday window may support higher consumer spending if the offer is simple, visible and easy to buy."
    : "";

  if (businessType === "Manufacturing") {
    if (month === 0 || month === 1) {
      return "Customer delivery cut-off, supplier availability and production scheduling should be reviewed before festive slowdown.";
    }

    if (month === 11) {
      return "Year-end customer delivery deadlines and cash collection should be prioritised before holiday closure.";
    }

    return "Commercial focus should remain on confirmed purchase orders, debtor collection and production capacity alignment.";
  }

  if (businessType === "F&B") {
    if (month === 2 || month === 3) {
      return `Review family dining, buka puasa demand, takeaway margin and delivery-platform profitability.${paydayLine}`;
    }

    if (month === 11) {
      return `Prepare year-end dining, family sets, group bookings and high-margin add-ons.${paydayLine}`;
    }

    return `Focus on daily sales quality, average receipt, menu margin and peak-period traffic.${paydayLine}`;
  }

  if (businessType === "Retail") {
    if (month === 8 || month === 11) {
      return `Prepare campaign displays, bundles and slow-moving stock clearance while protecting premium-margin items.${paydayLine}`;
    }

    return `Focus on basket size, inventory ageing, bundle strategy and high-margin product visibility.${paydayLine}`;
  }

  if (businessType === "Beauty / Aesthetic / Medical") {
    return `Focus on appointment utilisation, prepaid packages, treatment bundles, product attachment and customer follow-up.${paydayLine}`;
  }

  return `Focus on revenue quality, repeat customers, service bundles and disciplined campaign spending.${paydayLine}`;
}

function getOperationalSignal(
  month: number,
  businessType: BusinessType,
  isQuarterEndWindow: boolean,
) {
  const quarterLine = isQuarterEndWindow
    ? " Quarter-end review should confirm revenue, margin, inventory and cash position."
    : "";

  if (businessType === "Manufacturing") {
    return `Review raw material holding, supplier lead time, production output, machine downtime and debtor collection.${quarterLine}`;
  }

  if (businessType === "F&B") {
    return `Review food wastage, supplier availability, weekend roster, delivery-platform commission and peak-hour manpower.${quarterLine}`;
  }

  if (businessType === "Retail") {
    return `Review stock readiness, inventory ageing, supplier orders, campaign margin and cash tied up in slow-moving products.${quarterLine}`;
  }

  if (businessType === "Beauty / Aesthetic / Medical") {
    return `Review therapist or consultant utilisation, room capacity, product inventory and appointment follow-up pipeline.${quarterLine}`;
  }

  return `Review staff productivity, customer pipeline, service margin, cash position and weekly sales execution.${quarterLine}`;
}

function getLongWeekendSignal(businessType: BusinessType) {
  if (businessType === "Manufacturing") {
    return "If a public holiday falls on Friday or Monday, plan production, raw material delivery and customer dispatch earlier to avoid long-weekend disruption.";
  }

  if (businessType === "F&B" || businessType === "Retail") {
    return "If a public holiday falls on Friday or Monday, prepare for long-weekend sales by confirming stock, supplies, roster and peak-hour coverage.";
  }

  return "If a public holiday falls on Friday or Monday, confirm appointment slots, staffing and customer follow-ups before the long weekend.";
}

function getManagementFocus(
  businessType: BusinessType,
  isMonthEndWindow: boolean,
  isQuarterEndWindow: boolean,
) {
  let focus =
    "Management should review revenue, operating cost, payroll, cash position and next-week execution.";

  if (businessType === "Manufacturing") {
    focus =
      "Management should review production schedule, debtor collection, raw material holding, supplier readiness and confirmed delivery dates.";
  }

  if (businessType === "F&B") {
    focus =
      "Management should review daily sales, food wastage, average receipt, roster efficiency, supplier readiness and delivery-platform margin.";
  }

  if (businessType === "Retail") {
    focus =
      "Management should review stock ageing, campaign readiness, basket size, high-margin product visibility and cash tied up in inventory.";
  }

  if (businessType === "Beauty / Aesthetic / Medical") {
    focus =
      "Management should review package conversion, product attachment, client revisit rate, therapist utilisation and WhatsApp follow-up discipline.";
  }

  if (isMonthEndWindow) {
    focus += " Month-end control should include payroll, supplier payments and cash runway.";
  }

  if (isQuarterEndWindow) {
    focus += " Quarter-end review should be prepared in management-report format.";
  }

  return focus;
}