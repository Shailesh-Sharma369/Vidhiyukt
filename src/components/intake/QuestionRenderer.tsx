// components/intake/QuestionRenderer.tsx

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useIntakeStore } from '@/store/intakeStore';
import type { Question, IntakeAnswerValue } from '@/types';
import {
  TextField,
  TextAreaField,
  CheckboxField,
  SelectField,
  RadioField,
  MultiSelectField,
  UnsupportedField,
} from './fields';

type QuestionRendererProps = {
  question: Question;
  value: IntakeAnswerValue;
  onChange: (value: unknown) => void;
};

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  // ✅ Use useShallow to get both error and touched in one stable subscription
  // This prevents separate subscriptions and reduces re‑renders
  const { error, touched } = useIntakeStore(
    useShallow((state) => ({
      error: state.errors[question.id]?.[0] ?? '',
      touched: state.touched[question.id] ?? false,
    }))
  );

  const markTouched = useIntakeStore((state) => state.markTouched);

  const handleBlur = useCallback(() => {
    if (!touched) {
      markTouched(question.id);
    }
  }, [touched, markTouched, question.id]);

  const commonProps = {
    question,
    value,
    error,
    touched,
    onChange,
    onBlur: handleBlur,
  };

  switch (question.type) {
    case 'text': return <TextField {...commonProps} />;
    case 'textarea': return <TextAreaField {...commonProps} />;
    case 'checkbox': return <CheckboxField {...commonProps} />;
    case 'select': return <SelectField {...commonProps} />;
    case 'radio': return <RadioField {...commonProps} />;
    case 'multiselect': return <MultiSelectField {...commonProps} />;
    default: return <UnsupportedField {...commonProps} />;
  }
}