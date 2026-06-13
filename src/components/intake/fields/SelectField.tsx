// components/intake/fields/SelectField.tsx

import type { FieldComponentProps } from '@/lib/intake-ui/types';
import { FieldWrapper } from '../FieldWrapper';

export function SelectField({
  question,
  value,
  error,
  touched,
  onChange,
  onBlur,
}: FieldComponentProps) {
  const stringValue = typeof value === 'string' ? value : '';

  return (
    <FieldWrapper
      id={question.id}
      label={question.label}
      description={question.description}
      required={question.validation?.required}
      error={error}
      touched={touched}
    >
      <select
        id={question.id}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Select an option</option>
        {question.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}