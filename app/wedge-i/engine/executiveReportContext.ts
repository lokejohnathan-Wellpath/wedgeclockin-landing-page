import type { AdvisorReport } from "./advisorEngine";
import type {
  BusinessCalendarContext,
} from "./businessCalendarEngine";
import type {
  ExecutiveCommentary,
} from "./executiveCommentaryEngine";
import type {
  ExecutiveForecast,
} from "./executiveForecastEngine";
import type {
  FinancialAnalysis,
} from "./financialAnalysisEngine";
import type {
  MeetingAgenda,
} from "./meetingAgendaEngine";
import type {
  BusinessType,
  IndustryBenchmark,
} from "./benchmarks";

export type ExecutiveReportContext = {
  companyName: string;

  businessType: BusinessType;

  benchmark: IndustryBenchmark;

  calendar: BusinessCalendarContext;

  financial: FinancialAnalysis;

  forecast: ExecutiveForecast;

  commentary: ExecutiveCommentary;

  advisor: AdvisorReport;

  meetingAgenda: MeetingAgenda;

  generatedAt: Date;
};