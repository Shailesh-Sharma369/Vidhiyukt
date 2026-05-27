import type { ComplianceReport, GeneratedDocument } from '@/types';
import type { Report, SecureDocument } from '@/types/firestore';
import { firestoreTimestampToIso } from './shared';

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function serializeGeneratedDocumentContent(document: GeneratedDocument) {
  const { createdAt, ...rest } = document;
  return JSON.stringify(rest);
}

export function deserializeGeneratedDocumentContent(record: SecureDocument): GeneratedDocument {
  const payload = safeJsonParse<Partial<Omit<GeneratedDocument, 'id' | 'createdAt'>>>(record.content, {});

  return {
    id: record.id,
    companyName: payload.companyName ?? 'SecureShip',
    documentType: payload.documentType ?? 'Privacy Policy',
    jurisdiction: payload.jurisdiction ?? 'GDPR',
    tone: payload.tone ?? 'balanced',
    productSummary: payload.productSummary ?? '',
    dataCategories: payload.dataCategories ?? '',
    audience: payload.audience ?? '',
    title: payload.title ?? record.title,
    status: payload.status ?? 'generated',
    excerpt: payload.excerpt ?? '',
    createdAt: firestoreTimestampToIso(record.createdAt),
    sections: payload.sections ?? []
  };
}

export function serializeComplianceReportContent(report: ComplianceReport) {
  const { generatedAt, ...rest } = report;
  return JSON.stringify(rest);
}

export function deserializeComplianceReportContent(record: Report): ComplianceReport {
  const payload = safeJsonParse<Partial<Omit<ComplianceReport, 'id' | 'generatedAt'>>>(record.content, {});

  return {
    id: record.id,
    title: payload.title ?? record.title,
    framework: payload.framework ?? 'GDPR',
    generatedAt: firestoreTimestampToIso(record.createdAt),
    summary: payload.summary ?? '',
    scorecard: payload.scorecard ?? {
      score: 0,
      grade: 'D',
      benchmark: 'GDPR benchmark',
      findings: [],
      strengths: [],
      gaps: []
    }
  };
}