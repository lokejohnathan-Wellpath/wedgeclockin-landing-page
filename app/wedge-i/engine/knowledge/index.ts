import type { BusinessType } from "../benchmarks";
import type { KnowledgeRecommendation } from "./types";

import { beautyMedicalKnowledge } from "./beautyMedicalKnowledge";
import { fnbKnowledge } from "./fnbKnowledge";
import { manufacturingKnowledge } from "./manufacturingKnowledge";
import { retailKnowledge } from "./retailKnowledge";
import { serviceKnowledge } from "./serviceKnowledge";

export const allIndustryKnowledge: KnowledgeRecommendation[] = [
  ...fnbKnowledge,
  ...retailKnowledge,
  ...beautyMedicalKnowledge,
  ...manufacturingKnowledge,
  ...serviceKnowledge,
];

export function getKnowledgeForBusinessType(
  businessType: BusinessType,
): KnowledgeRecommendation[] {
  return allIndustryKnowledge.filter((recommendation) =>
    recommendation.industries.includes(businessType),
  );
}

export {
  beautyMedicalKnowledge,
  fnbKnowledge,
  manufacturingKnowledge,
  retailKnowledge,
  serviceKnowledge,
};