import { evaluateCompliance, summarizeComplianceReport } from '@/services/ai/localAi';
import type { ComplianceAuditRequest, ComplianceReport, ComplianceScorecard } from '@/types';

export async function runAudit(request: ComplianceAuditRequest): Promise<{ scorecard: ComplianceScorecard; report: ComplianceReport }> {
  const scorecard = await evaluateCompliance(request);
  const report = await summarizeComplianceReport(scorecard, request.framework);
  return { scorecard, report };
}