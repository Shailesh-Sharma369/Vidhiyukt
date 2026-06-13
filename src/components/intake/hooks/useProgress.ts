// components/intake/hooks/useProgress.ts

import { useIntakeStore } from '@/store/intakeStore';
import { selectProgressPercentage } from '@/lib/intake-ui/selectors';

export function useProgress() {
  const progress = useIntakeStore(selectProgressPercentage);
  return { progress };
}