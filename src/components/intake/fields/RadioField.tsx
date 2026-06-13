// components/intake/fields/RadioField.tsx

import type { FieldComponentProps } from '@/lib/intake-ui/types';
import { FieldWrapper } from '../FieldWrapper';

export function RadioField({
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
      <div className="space-y-2">
        {question.options?.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2">
            <input
              type="radio"
              name={question.id}
              value={opt.value}
              checked={stringValue === opt.value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              className="h-4 w-4 border-white/10 bg-white/5 text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">{opt.label}</span>
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
}