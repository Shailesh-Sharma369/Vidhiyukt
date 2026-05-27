import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { runAudit } from '@/services/compliance/auditEngine';
import type { ComplianceAuditRequest, ComplianceReport, ComplianceScorecard } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { createAuditLog } from '@/services/firestore/audits';
import { createReport, getUserReports } from '@/services/firestore/reports';
import { deserializeComplianceReportContent } from '@/services/firestore/serializers';
import { FirestoreServiceError } from '@/services/firestore/shared';
import { showToast } from '@/store/toastStore';
import { createLogger } from '@/lib/logger';

const reportsLogger = createLogger('firestore][reports');
const auditsLogger = createLogger('firestore][audits');

type ComplianceStore = {
  request: ComplianceAuditRequest;
  scorecard: ComplianceScorecard | null;
  report: ComplianceReport | null;
  history: ComplianceReport[];
  isAuditing: boolean;
  isLoadingHistory: boolean;
  setRequest: (patch: Partial<ComplianceAuditRequest>) => void;
  loadUserReports: () => Promise<void>;
  runComplianceAudit: () => Promise<void>;
  clearCurrentAudit: () => void;
  resetCompliance: () => void;
};

const initialRequest: ComplianceAuditRequest = {
  companyName: 'SecureShip',
  framework: 'GDPR',
  productScope: 'B2B SaaS platform with AI-assisted compliance workflows',
  dataResidency: 'EU and India',
  processingRegions: ['EU', 'IN']
};

export const useComplianceStore = create<ComplianceStore>()(
  persist(
    (set, get) => ({
      request: initialRequest,
      scorecard: null,
      report: null,
      history: [],
      isAuditing: false,
      isLoadingHistory: false,
      setRequest: (patch) => set({ request: { ...get().request, ...patch } }),
      loadUserReports: async () => {
        const user = useAuthStore.getState().user;

        if (!user) {
          set({ history: [], report: null, scorecard: null, isLoadingHistory: false });
          return;
        }

        set({ isLoadingHistory: true });

        try {
          reportsLogger.debug('load start', { uid: user.uid });
          const reports = await getUserReports(user);
          set({
            history: reports,
            report: reports[0] ?? null,
            scorecard: reports[0]?.scorecard ?? null
          });
          reportsLogger.debug('load success', { uid: user.uid, count: reports.length });
        } catch (error) {
          reportsLogger.debug('load failed', { uid: user.uid, error });
          const message = error instanceof Error ? error.message : 'Failed to load your reports.';
          showToast({ title: 'Report sync failed', description: message, variant: 'error' });
        } finally {
          set({ isLoadingHistory: false });
        }
      },
      runComplianceAudit: async () => {
        const user = useAuthStore.getState().user;

        if (!user) {
          throw new FirestoreServiceError('You must be signed in to run compliance audits.', 'unauthenticated');
        }

        set({ isAuditing: true });

        try {
          auditsLogger.debug('audit write start', { uid: user.uid });
          const { scorecard, report } = await runAudit(get().request);
          const savedReport = await createReport(user, report, 'summary');
          const hydratedReport = deserializeComplianceReportContent(savedReport);

          await createAuditLog(user, {
            action: 'run_compliance_audit',
            targetDocId: savedReport.id,
            details: JSON.stringify({
              framework: report.framework,
              score: scorecard.score,
              grade: scorecard.grade
            }),
            score: scorecard.score
          });

          set((state) => ({
            scorecard,
            report: hydratedReport,
            history: [hydratedReport, ...state.history.filter((item) => item.id !== hydratedReport.id)].slice(0, 8)
          }));
          auditsLogger.debug('audit write success', { uid: user.uid, reportId: savedReport.id });
        } catch (error) {
          auditsLogger.debug('audit write failed', { uid: user.uid, error });
          const message = error instanceof Error ? error.message : 'Failed to run or sync the audit.';
          showToast({ title: 'Audit failed', description: message, variant: 'error' });
          throw error;
        } finally {
          set({ isAuditing: false });
        }
      },
      clearCurrentAudit: () => set({ scorecard: null, report: null }),
      resetCompliance: () => set({ scorecard: null, report: null, history: [], isAuditing: false, isLoadingHistory: false })
    }),
    {
      name: 'secureship-compliance',
      partialize: (state) => ({ request: state.request })
    }
  )
);