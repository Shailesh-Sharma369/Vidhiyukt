import type { ComplianceFramework } from '@/types';

export const complianceFrameworks = ['GDPR', 'DPDP', 'AI Act'] as const satisfies readonly ComplianceFramework[];

export const compliancePrinciples = [
  'Data minimization and purpose limitation',
  'Transparent notices and legal basis mapping',
  'Vendor risk and transfer assessment',
  'Retention, deletion, and subject rights workflows'
];