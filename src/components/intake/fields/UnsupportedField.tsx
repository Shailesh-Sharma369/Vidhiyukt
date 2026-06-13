// components/intake/fields/UnsupportedField.tsx

import type { FieldComponentProps } from '@/lib/intake-ui/types';
import { FieldWrapper } from '../FieldWrapper';

export function UnsupportedField({
  question,
  error,
  touched,
}: FieldComponentProps) {
  return (
    <FieldWrapper
      id={question.id}
      label={question.label}
      description={question.description}
      required={question.validation?.required}
      error={error}
      touched={touched}
    >
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
        ⚠️ Unsupported question type: {question.type}. Please contact support.
      </div>
    </FieldWrapper>
  );
}