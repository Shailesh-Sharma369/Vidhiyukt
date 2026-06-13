// components/intake/fields/MultiSelectField.tsx

import React from 'react';
import type { FieldComponentProps } from '@/lib/intake-ui/types';
import { FieldWrapper } from '../FieldWrapper';

export function MultiSelectField({
  question,
  value,
  error,
  touched,
  onChange,
  onBlur,
}: FieldComponentProps) {
  const selectedValues = Array.isArray(value) ? value : [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    onChange(selected);
  };

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
        multiple
        value={selectedValues}
        onChange={handleChange}
        onBlur={onBlur}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        size={Math.min(question.options?.length || 3, 5)}
      >
        {question.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple</p>
    </FieldWrapper>
  );
}