// components/intake/fields/TextField.tsx

import type { FieldComponentProps } from '@/lib/intake-ui/types';
import { Input } from '@/components/ui/input';
import { FieldWrapper } from '../FieldWrapper';
import { renderConfig } from '@/lib/intake-ui/renderConfig';

export function TextField({
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
      <Input
        id={question.id}
        type="text"
        placeholder={question.placeholder || renderConfig.defaultPlaceholder}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={renderConfig.inputWidth}
      />
    </FieldWrapper>
  );
}