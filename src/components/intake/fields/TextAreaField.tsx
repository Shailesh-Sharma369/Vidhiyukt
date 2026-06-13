// components/intake/fields/TextAreaField.tsx

import type { FieldComponentProps } from '@/lib/intake-ui/types';
import { Textarea } from '@/components/ui/textarea';
import { FieldWrapper } from '../FieldWrapper';
import { renderConfig } from '@/lib/intake-ui/renderConfig';

export function TextAreaField({
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
      <Textarea
        id={question.id}
        placeholder={question.placeholder || renderConfig.defaultPlaceholder}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={renderConfig.inputWidth}
        rows={4}
      />
    </FieldWrapper>
  );
}