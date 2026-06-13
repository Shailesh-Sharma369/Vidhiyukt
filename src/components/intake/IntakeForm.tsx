// components/intake/IntakeForm.tsx

import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useIntakeStore } from '@/store/intakeStore';
import { QuestionRenderer } from './QuestionRenderer';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/loading-state';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';
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
  const errors = useIntakeStore((s) => s.errors);
  const touched = useIntakeStore((s) => s.touched);

  // Arrays with useShallow
  const { visibleQuestions, answers } = useIntakeStore(
    useShallow((s) => ({
      visibleQuestions: s.runtimeState?.visibleQuestions ?? [],
      answers: s.runtimeState?.answers ?? {},
    }))
  );

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Progress calculation
  const progress = useMemo(() => {
    const total = visibleQuestions.length;
    if (total === 0) return 100;
    const answered = visibleQuestions.filter((q) =>
      isQuestionComplete(q, answers[q.id] ?? q.defaultValue)
    ).length;
    return Math.round((answered / total) * 100);
  }, [visibleQuestions, answers]);

  // Group sections
  const sections = useMemo(() => {
    if (!activeSchemaId) return [];
    const schema = getIntakeSchema(activeSchemaId);
    if (!schema) return [];
    return groupQuestionsBySection(schema, visibleQuestions);
  }, [activeSchemaId, visibleQuestions]);

  // Scroll to current section when it changes
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

  // Check if all required visible questions are answered (for generate button)
  const isComplete = useMemo(() => {
    return visibleQuestions.every((q) => {
      const value = answers[q.id] ?? q.defaultValue;
      if (q.validation?.required) {
        return value !== undefined && value !== null && value !== '';
      }
      return true;
    });
  }, [visibleQuestions, answers]);

  // Loading states
  if (!initialized) {
    return <LoadingState title="Initialising intake engine" description="Loading schema and rules..." />;
  }
  if (!isDraftHydrated) {
    return <LoadingState title="Restoring your draft" description="Loading saved answers..." />;
  }
  if (sections.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No questions available for this document type.</p>
        </CardContent>
      </Card>
    );
  }

  const currentIndex = sections.findIndex((s) => s.sectionId === currentSectionId);
  const hasNext = currentIndex !== -1 && currentIndex < sections.length - 1;
  const hasPrevious = currentIndex > 0;
  const isLastSection = currentIndex === sections.length - 1;

  // Handle generate action (placeholder for Module 1.7)
  const handleGenerate = async () => {
    if (!isComplete) {
      // Show toast or error
      console.warn('Please complete all required fields');
      return;
    }
    setIsGenerating(true);
    // TODO: Module 1.7 – call AI payload builder and generate document
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
    setIsGenerating(false);
    // Navigate to preview or show success toast
  };

  return (
    <div className="space-y-6">
      {/* Progress bar card */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Completion</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10" />
        </CardContent>
      </Card>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {sections.map((section) => {
          const isActive = section.sectionId === currentSectionId;
          // Count errors in this section (only if touched)
          const hasErrorInSection = section.questions.some(q => touched[q.id] && errors[q.id]?.length);
          return (
            <button
              key={section.sectionId}
              onClick={() => handleSectionClick(section.sectionId)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-muted-foreground hover:bg-white/10 hover:text-foreground',
                hasErrorInSection && !isActive && 'border border-red-500/50'
              )}
            >
              {section.title}
              {hasErrorInSection && <span className="ml-1 text-red-400">⚠️</span>}
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
            className="space-y-6 animate-fade-in-up"
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
        <Button
          variant="outline"
          onClick={goToPreviousSection}
          disabled={!hasPrevious}
          className="min-w-[120px]"
        >
          ← Previous Section
        </Button>
        {!isLastSection ? (
          <Button onClick={goToNextSection} disabled={!hasNext} className="min-w-[120px]">
            Next Section →
          </Button>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={!isComplete || isGenerating}
            className="min-w-[150px] bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Generating...
              </>
            ) : (
              '✨ Generate Draft'
            )}
          </Button>
        )}
      </div>

      {/* Optional: Show incomplete fields warning */}
      {isLastSection && !isComplete && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-300 text-center">
          ⚠️ Please complete all required fields before generating your document.
        </div>
      )}
    </div>
  );
}