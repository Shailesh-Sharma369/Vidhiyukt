import type { ComplianceAuditRequest, ComplianceScorecard, DocumentDraft, GeneratedDocument } from '@/types';
import { complianceFrameworks } from '@/constants/compliance';

function scoreFromText(text: string) {
  return Math.max(52, Math.min(97, 74 + (text.length % 19)));
}

function gradeForScore(score: number): ComplianceScorecard['grade'] {
  if (score >= 92) return 'A';
  if (score >= 84) return 'B';
  if (score >= 74) return 'C';
  return 'D';
}

export async function generateLegalDocument(draft: DocumentDraft): Promise<GeneratedDocument> {
  const score = scoreFromText(`${draft.companyName}-${draft.documentType}-${draft.productSummary}`);
  const sections = [
    { title: 'Scope and purpose', summary: `Define how ${draft.companyName} collects and uses data in a ${draft.tone} tone.` },
    { title: 'Lawful basis and rights', summary: 'Clarify legal basis, subject rights, and contact details for privacy requests.' },
    { title: 'Retention and transfers', summary: `Describe retention logic and cross-border handling for ${draft.jurisdiction} expectations.` },
    { title: 'Security and vendor controls', summary: 'Document subprocessors, safeguards, and escalation paths.' }
  ];

  return {
    id: `doc-${Date.now()}`,
    ...draft,
    title: `${draft.documentType} for ${draft.companyName}`,
    status: 'generated',
    excerpt: `Generated ${draft.documentType.toLowerCase()} draft with ${draft.jurisdiction} alignment, ${score}% clause confidence, and reusable compliance language.`,
    createdAt: new Date().toISOString(),
    sections
  };
}

export async function evaluateCompliance(request: ComplianceAuditRequest): Promise<ComplianceScorecard> {
  const base = scoreFromText(`${request.companyName}-${request.framework}-${request.productScope}`);
  const frameworkLabel = complianceFrameworks.includes(request.framework) ? request.framework : 'GDPR';
  const score = Math.round((base + (request.processingRegions.length > 1 ? 3 : -2)) / 1);
  const findings = [
    {
      id: 'f-1',
      control: `${frameworkLabel} notices`,
      severity: score > 88 ? 'low' : 'medium',
      status: score > 88 ? 'pass' : 'warn',
      description: 'Notice wording exists but can be shortened and made more discoverable.',
      recommendation: 'Move the notice to onboarding and add a persistent privacy center link.'
    },
    {
      id: 'f-2',
      control: 'Retention mapping',
      severity: score > 80 ? 'medium' : 'high',
      status: score > 82 ? 'warn' : 'fail',
      description: 'Retention rules are present but not consistently mapped to data categories.',
      recommendation: 'Add a retention matrix with data type, purpose, and deletion trigger.'
    },
    {
      id: 'f-3',
      control: 'Vendor oversight',
      severity: 'low',
      status: 'pass',
      description: 'Subprocessor governance is documented for core services.',
      recommendation: 'Keep vendor records tied to annual review cadence.'
    }
  ] as ComplianceScorecard['findings'];

  return {
    score,
    grade: gradeForScore(score),
    benchmark: `${frameworkLabel} benchmark`,
    findings,
    strengths: ['Centralized privacy notices', 'Documented legal basis', 'Clear processor inventory'],
    gaps: ['Retention lifecycle mapping', 'Subject request SLAs', 'Audit evidence exports']
  };
}

export async function summarizeComplianceReport(scorecard: ComplianceScorecard, framework: string) {
  return {
    id: `report-${Date.now()}`,
    title: `${framework} Compliance Report`,
    framework: framework as ComplianceAuditRequest['framework'],
    generatedAt: new Date().toISOString(),
    summary: `SecureShip produced a ${scorecard.grade} grade with ${scorecard.score}% coverage and focused remediation actions.`,
    scorecard
  };
}