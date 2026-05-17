export type ComplianceFramework = 'GDPR' | 'DPDP' | 'AI Act';

export type ComplianceFindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ComplianceAuditRequest = {
  companyName: string;
  framework: ComplianceFramework;
  productScope: string;
  dataResidency: string;
  processingRegions: string[];
};

export type ComplianceFinding = {
  id: string;
  control: string;
  severity: ComplianceFindingSeverity;
  status: 'pass' | 'warn' | 'fail';
  description: string;
  recommendation: string;
};

export type ComplianceScorecard = {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  benchmark: string;
  findings: ComplianceFinding[];
  strengths: string[];
  gaps: string[];
};

export type ComplianceReport = {
  id: string;
  title: string;
  framework: ComplianceFramework;
  generatedAt: string;
  summary: string;
  scorecard: ComplianceScorecard;
};