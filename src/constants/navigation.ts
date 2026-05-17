import type { NavigationItem } from '@/types';

export const publicNavigation: NavigationItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' }
];

export const dashboardNavigation: NavigationItem[] = [
  { label: 'Dashboard', href: '/dashboard', protected: true },
  { label: 'Generate', href: '/generate', protected: true },
  { label: 'Audit', href: '/audit', protected: true },
  { label: 'Reports', href: '/reports', protected: true }
];