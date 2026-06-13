// components/intake/SectionProgress.tsx

import { useMemo } from 'react';
import { useIntakeStore } from '@/store/intakeStore';
import { groupQuestionsBySection } from '@/lib/intake-ui/questionGrouping';
import { getIntakeSchema } from '@/constants/intakeSchemas';
import { computeProgressPercentage } from '@/lib/intake-ui/progressHelpers';
import { cn } from '@/lib/cn';

type SectionProgressProps = {
  onSectionClick?: (sectionId: string) => void;
};

export function SectionProgress({ onSectionClick }: SectionProgressProps) {
  // Raw selectors
  const activeSchemaId = useIntakeStore((s) => s.activeSchemaId);
  const visibleQuestions = useIntakeStore((s) => s.runtimeState?.visibleQuestions ?? []);
  const answers = useIntakeStore((s) => s.runtimeState?.answers ?? {});
  const currentSectionId = useIntakeStore((s) => s.currentSectionId);

  // Compute progress using pure helper + useMemo
  const progress = useMemo(() => {
    return computeProgressPercentage(visibleQuestions, answers);
  }, [visibleQuestions, answers]);

  // Group sections – also memoized
  const sections = useMemo(() => {
    if (!activeSchemaId) return [];
    const schema = getIntakeSchema(activeSchemaId);
    if (!schema) return [];
    return groupQuestionsBySection(schema, visibleQuestions);
  }, [activeSchemaId, visibleQuestions]);

  if (sections.length === 0) return null;

  return (
    <div className="mb-8 space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Completion</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {sections.map((section) => {
          const isActive = section.sectionId === currentSectionId;
          return (
            <button
              key={section.sectionId}
              onClick={() => onSectionClick?.(section.sectionId)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
              )}
            >
              {section.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}