// components/intake/FieldWrapper.tsx

import type { ReactNode } from 'react';
import { ValidationMessage } from './ValidationMessage';
import { renderConfig } from '@/lib/intake-ui/renderConfig';

type FieldWrapperProps = {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  touched: boolean;
  children: ReactNode;
};

export function FieldWrapper({
  id,
  label,
  description,
  required,
  error,
  touched,
  children,
}: FieldWrapperProps) {
  const showError = touched && !!error;

  return (
    <div className={renderConfig.spacing.question}>
      <label
        htmlFor={id}
        className={`block text-sm font-medium text-foreground ${renderConfig.spacing.label}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
      )}
      {children}
      {showError && (
        <ValidationMessage message={error} />
      )}
    </div>
  );
}