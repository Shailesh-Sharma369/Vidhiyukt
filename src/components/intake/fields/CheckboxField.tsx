// components/intake/fields/CheckboxField.tsx

import type { FieldComponentProps } from '@/lib/intake-ui/types';

export function CheckboxField({
  question,
  value,
  error,
  touched,
  onChange,
  onBlur,
}: FieldComponentProps) {
  const boolValue = typeof value === 'boolean' ? value : false;
  const showError = touched && !!error;

  return (
    <div className="mb-6">
      <div className="flex items-start gap-2">
        <input
          id={question.id}
          type="checkbox"
          checked={boolValue}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          className="mt-1 h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
        />
        <label htmlFor={question.id} className="text-sm text-foreground">
          {question.label}
          {question.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {question.description && (
        <p className="mt-1 text-sm text-muted-foreground">{question.description}</p>
      )}
      {showError && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}