import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { runAudit } from '@/services/compliance/auditEngine';
import type { ComplianceAuditRequest, ComplianceReport, ComplianceScorecard } from '@/types';

type ComplianceStore = {
  request: ComplianceAuditRequest;
  scorecard: ComplianceScorecard | null;
  report: ComplianceReport | null;
  history: ComplianceReport[];
  isAuditing: boolean;
  setRequest: (patch: Partial<ComplianceAuditRequest>) => void;
  runComplianceAudit: () => Promise<void>;
  clearCurrentAudit: () => void;
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
      setRequest: (patch) => set({ request: { ...get().request, ...patch } }),
      runComplianceAudit: async () => {
        set({ isAuditing: true });
        const { scorecard, report } = await runAudit(get().request);
        set((state) => ({
          isAuditing: false,
          scorecard,
          report,
          history: [report, ...state.history].slice(0, 8)
        }));
      },
      clearCurrentAudit: () => set({ scorecard: null, report: null })
    }),
    {
      name: 'secureship-compliance',
      partialize: (state) => ({ history: state.history, request: state.request })
    }
  )
);