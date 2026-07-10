import {
  getIndustryBenchmark,
  type BusinessType,
  type IndustryBenchmark,
} from "./benchmarks";
import {
  getBusinessCalendarContext,
  type BusinessCalendarContext,
} from "./businessCalendarEngine";
import {
  analyseFinancials,
  type FinancialAnalysis,
  type FinancialInputs,
} from "./financialAnalysisEngine";
import {
  generateExecutiveForecast,
  type ExecutiveForecast,
} from "./executiveForecastEngine";
import {
  generateExecutiveCommentary,
  type ExecutiveCommentary,
} from "./executiveCommentaryEngine";
import {
  generateAdvisorReport,
  type AdvisorReport,
} from "./advisorEngine";
import {
  generateMeetingAgenda,
  type MeetingAgenda,
} from "./meetingAgendaEngine";
import type { ExecutiveReportContext } from "./executiveReportContext";
import {
  generateQuarterlyReport,
  type QuarterlyReport,
} from "./quarterlyReportEngine";

export type WedgeCeoInput = {
  companyName: string;
  businessType: BusinessType;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyPayroll: number;
  staffCount: number;
  cashInBank: number;
  inventoryValue: number;
  generatedAt?: Date;
};

export type WedgeCeoReport = {
  companyName: string;
  businessType: BusinessType;
  generatedAt: Date;

  benchmark: IndustryBenchmark;
  calendar: BusinessCalendarContext;
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
  commentary: ExecutiveCommentary;
  advisor: AdvisorReport;
  meetingAgenda: MeetingAgenda;
  quarterlyReport: QuarterlyReport;
};

export function generateWedgeCeoReport(
  input: WedgeCeoInput,
): WedgeCeoReport {
  const generatedAt = resolveGeneratedDate(input.generatedAt);
  const companyName = normaliseCompanyName(input.companyName);

  const benchmark = getIndustryBenchmark(input.businessType);

  const calendar = getBusinessCalendarContext(
    generatedAt,
    input.businessType,
  );

  const financialInputs: FinancialInputs = {
    businessType: input.businessType,
    monthlyRevenue: normaliseNumber(input.monthlyRevenue),
    monthlyExpenses: normaliseNumber(input.monthlyExpenses),
    monthlyPayroll: normaliseNumber(input.monthlyPayroll),
    staffCount: normaliseNumber(input.staffCount),
    cashInBank: normaliseNumber(input.cashInBank),
    inventoryValue: normaliseNumber(input.inventoryValue),
  };

  const financial = analyseFinancials(
    financialInputs,
    benchmark,
  );

  const forecast = generateExecutiveForecast({
    financial,
    benchmark,
    calendar,
  });

  const commentary = generateExecutiveCommentary({
    companyName,
    businessType: input.businessType,
    financial,
    benchmark,
    forecast,
    calendar,
  });

  const advisor = generateAdvisorReport({
    businessType: input.businessType,
    financial,
    benchmark,
    forecast,
    calendar,
  });

  const meetingAgenda = generateMeetingAgenda({
    companyName,
    financial,
    forecast,
    calendar,
    advisor,
    preparedDate: generatedAt,
  });

  const reportContext: ExecutiveReportContext = {
    companyName,
    businessType: input.businessType,
    benchmark,
    calendar,
    financial,
    forecast,
    commentary,
    advisor,
    meetingAgenda,
    generatedAt,
  };

  const quarterlyReport =
    generateQuarterlyReport(reportContext);

  return {
    companyName,
    businessType: input.businessType,
    generatedAt,
    benchmark,
    calendar,
    financial,
    forecast,
    commentary,
    advisor,
    meetingAgenda,
    quarterlyReport,
  };
}

function normaliseCompanyName(value: string) {
  const name = value.trim();

  return name || "Unnamed Malaysian SME";
}

function normaliseNumber(value: number) {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function resolveGeneratedDate(value?: Date) {
  if (!value || Number.isNaN(value.getTime())) {
    return new Date();
  }

  return value;
}