export type StatutoryResult = {
  contributionWages: number;
  epfContributionWages: number;
  epfEmployee: number;
  epfEmployer: number;
  socsoEmployee: number;
  socsoInvalidityEmployee: number;
  skbbkEmployee: number;
  socsoEmployer: number;
  eisEmployee: number;
  eisEmployer: number;
  pcbEstimate: number;
};

const lowBands = [30, 50, 70, 100, 140, 200, 300, 400, 500];
const socsoEmployerLow = [0.4, 0.7, 1.1, 1.5, 2.1, 2.95, 4.35, 6.15, 7.85];
const socsoInvalidityEmployeeLow = [0.1, 0.2, 0.3, 0.4, 0.6, 0.85, 1.25, 1.75, 2.25];
const socsoSkbbkEmployeeLow = [0.2, 0.3, 0.5, 0.65, 0.9, 1.25, 1.85, 2.65, 3.35];
const eisLow = [0.05, 0.1, 0.1, 0.2, 0.2, 0.3, 0.5, 0.7, 0.9];
const socsoEmployerHigh = [9.65,11.35,13.15,14.85,16.65,18.35,20.15,21.85,23.65,25.35,27.15,28.85,30.65,32.35,34.15,35.85,37.65,39.35,41.15,42.85,44.65,46.35,48.15,49.85,51.65,53.35,55.15,56.85,58.65,60.35,62.15,63.85,65.65,67.35,69.15,70.85,72.65,74.35,76.15,77.85,79.65,81.35,83.15,84.85,86.65,88.35,90.15,91.85,93.65,95.35,97.15,98.85,100.65,102.35,104.15];
const socsoSkbbkEmployeeHigh = [4.15,4.85,5.65,6.35,7.15,7.85,8.65,9.35,10.15,10.85,11.65,12.35,13.15,13.85,14.65,15.35,16.15,16.85,17.65,18.35,19.15,19.85,20.65,21.35,22.15,22.85,23.65,24.35,25.15,25.85,26.65,27.35,28.15,28.85,29.65,30.35,31.15,31.85,32.65,33.35,34.15,34.85,35.65,36.35,37.15,37.85,38.65,39.35,40.15,40.85,41.65,42.35,43.15,43.85,44.65];

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundToFiveSen(value: number) {
  return Math.round(value * 20 + 1e-8) / 20;
}

function contributionBand(wages: number) {
  if (wages <= 500) return lowBands.findIndex((upper) => wages <= upper);
  return -1;
}

function calculateSocso(wages: number) {
  const capped = Math.min(Math.max(wages, 0), 6000);
  const lowIndex = contributionBand(capped);
  if (lowIndex >= 0) {
    return {
      employer: socsoEmployerLow[lowIndex],
      invalidityEmployee: socsoInvalidityEmployeeLow[lowIndex],
      skbbkEmployee: socsoSkbbkEmployeeLow[lowIndex],
    };
  }

  const highIndex = Math.min(54, Math.max(0, Math.ceil((capped - 500) / 100) - 1));
  return {
    employer: socsoEmployerHigh[highIndex],
    invalidityEmployee: roundMoney(2.75 + highIndex * 0.5),
    skbbkEmployee: socsoSkbbkEmployeeHigh[highIndex],
  };
}

function calculateEis(wages: number) {
  const capped = Math.min(Math.max(wages, 0), 6000);
  const lowIndex = contributionBand(capped);
  if (lowIndex >= 0) return eisLow[lowIndex];
  const midpoint = Math.min(5950, Math.floor((capped - 500.000001) / 100) * 100 + 550);
  return roundToFiveSen(midpoint * 0.002);
}

function calculateEpf(wages: number) {
  if (wages <= 0) return { employee: 0, employer: 0 };
  const scheduleWages = wages <= 20000 ? Math.ceil(wages / 20) * 20 : wages;
  return {
    employee: Math.ceil(scheduleWages * 0.11),
    employer: Math.ceil(scheduleWages * (wages <= 5000 ? 0.13 : 0.12)),
  };
}

function annualResidentTax(chargeable: number) {
  const bands: Array<[number, number]> = [
    [5000, 0], [15000, 0.01], [15000, 0.03], [15000, 0.06], [20000, 0.11],
    [30000, 0.19], [300000, 0.25], [200000, 0.26], [1400000, 0.28], [Infinity, 0.3],
  ];
  let remaining = Math.max(0, chargeable);
  let tax = 0;
  for (const [size, rate] of bands) {
    const taxable = Math.min(remaining, size);
    tax += taxable * rate;
    remaining -= taxable;
    if (remaining <= 0) break;
  }
  return tax;
}

export function calculateMalaysiaStatutory(epfWages: number, socsoWages = epfWages): StatutoryResult {
  const contributionWages = Math.max(0, roundMoney(socsoWages));
  const epfContributionWages = Math.max(0, roundMoney(epfWages));
  const epf = calculateEpf(epfContributionWages);
  const socso = calculateSocso(contributionWages);
  const eis = calculateEis(contributionWages);
  const annualGross = contributionWages * 12;
  const annualEpfRelief = Math.min(4000, epf.employee * 12);
  const chargeableEstimate = Math.max(0, annualGross - 9000 - annualEpfRelief);
  const pcbEstimate = roundMoney(annualResidentTax(chargeableEstimate) / 12);

  return {
    contributionWages,
    epfContributionWages,
    epfEmployee: epf.employee,
    epfEmployer: epf.employer,
    socsoEmployee: roundMoney(socso.invalidityEmployee + socso.skbbkEmployee),
    socsoInvalidityEmployee: socso.invalidityEmployee,
    skbbkEmployee: socso.skbbkEmployee,
    socsoEmployer: socso.employer,
    eisEmployee: eis,
    eisEmployer: eis,
    pcbEstimate,
  };
}
