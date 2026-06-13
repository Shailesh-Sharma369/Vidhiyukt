// components/intake/IntakeForm.tsx

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useIntakeStore } from '@/store/intakeStore';
import { QuestionRenderer } from './QuestionRenderer';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/loading-state';
import type { IntakeAnswerValue } from '@/types';
import { groupQuestionsBySection } from '@/lib/intake-ui/questionGrouping';
import { getIntakeSchema } from '@/constants/intakeSchemas';
import { isQuestionComplete } from '@/lib/intake/runtime/completionEngine';

export function IntakeForm() {
  // Raw selectors – primitives
  const initialized = useIntakeStore((s) => s.initialized);
  const isDraftHydrated = useIntakeStore((s) => s.isDraftHydrated);
  const activeSchemaId = useIntakeStore((s) => s.activeSchemaId);
  const currentSectionId = useIntakeStore((s) => s.currentSectionId);
  const goToNextSection = useIntakeStore((s) => s.goToNextSection);
  const goToPreviousSection = useIntakeStore((s) => s.goToPreviousSection);
  const setCurrentSection = useIntakeStore((s) => s.setCurrentSection);
  const updateAnswer = useIntakeStore((s) => s.updateAnswer);

  // Raw selectors for arrays/objects – wrapped with useShallow
  const { visibleQuestions, answers } = useIntakeStore(
    useShallow((s) => ({
      visibleQuestions: s.runtimeState?.visibleQuestions ?? [],
      answers: s.runtimeState?.answers ?? {},
    }))
  );

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 1. Compute progress
  const progress = useMemo(() => {
    const total = visibleQuestions.length;
    if (total === 0) return 100;
    const answered = visibleQuestions.filter((q) =>
      isQuestionComplete(q, answers[q.id] ?? q.defaultValue)
    ).length;
    return Math.round((answered / total) * 100);
  }, [visibleQuestions, answers]);

  // 2. Group sections – this replaces selectGroupedSections
  const sections = useMemo(() => {
    if (!activeSchemaId) return [];
    const schema = getIntakeSchema(activeSchemaId);
    if (!schema) return [];
    return groupQuestionsBySection(schema, visibleQuestions);
  }, [activeSchemaId, visibleQuestions]);

  // Scroll effect
  useEffect(() => {
    if (currentSectionId && sectionRefs.current[currentSectionId]) {
      sectionRefs.current[currentSectionId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [currentSectionId]);

  const handleSectionClick = useCallback((sectionId: string) => {
    setCurrentSection(sectionId);
  }, [setCurrentSection]);

  const getAnswerValue = useCallback((questionId: string, defaultValue: IntakeAnswerValue | undefined): IntakeAnswerValue => {
    const answer = answers[questionId];
    if (answer !== undefined) return answer;
    if (defaultValue !== undefined) return defaultValue;
    return null;
  }, [answers]);

  // Loading states
  if (!initialized) {
    return <LoadingState title="Initialising intake engine" description="Loading schema and rules..." />;
  }
  if (!isDraftHydrated) {
    return <LoadingState title="Restoring your draft" description="Loading saved answers..." />;
  }
  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-muted-foreground">No questions available for this document type.</p>
      </div>
    );
  }

  const currentIndex = sections.findIndex((s) => s.sectionId === currentSectionId);
  const hasNext = currentIndex < sections.length - 1 && currentIndex !== -1;
  const hasPrevious = currentIndex > 0;

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Completion</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {sections.map((section) => {
          const isActive = section.sectionId === currentSectionId;
          return (
            <button
              key={section.sectionId}
              onClick={() => handleSectionClick(section.sectionId)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
              }`}
            >
              {section.title}
            </button>
          );
        })}
      </div>

      {/* Active section questions */}
      {sections.map((section) => {
        if (section.sectionId !== currentSectionId) return null;
        return (
          <div
            key={section.sectionId}
            ref={(el) => { sectionRefs.current[section.sectionId] = el; }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              {section.description && (
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
              )}
            </div>
            <div className="space-y-6">
              {section.questions.map((question) => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  value={getAnswerValue(question.id, question.defaultValue)}
                  onChange={(val) => { void updateAnswer(question.id, val); }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Navigation buttons */}
      <div className="flex justify-between gap-4 pt-6 border-t border-white/10">
        <Button variant="outline" onClick={goToPreviousSection} disabled={!hasPrevious}>
          ← Previous Section
        </Button>
        <Button onClick={goToNextSection} disabled={!hasNext}>
          Next Section →
        </Button>
      </div>
    </div>
  );
}