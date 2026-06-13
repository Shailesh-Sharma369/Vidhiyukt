export const DEFAULT_MAX_TEXT_LENGTH = 5000;
export const EMAIL_MAX_LENGTH = 254;
export const URL_MAX_LENGTH = 2000;
export const DEFAULT_MAX_SELECTIONS = 50;

export function sanitizeText(input: unknown, maxLength: number = DEFAULT_MAX_TEXT_LENGTH): string {
  if (typeof input !== 'string') return '';
  let cleaned = input.trim().normalize('NFKC');
  cleaned = cleaned.replace(/[<>]/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (cleaned.length > maxLength) cleaned = cleaned.slice(0, maxLength);
  return cleaned;
}

export function sanitizeEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  let cleaned = input.trim().normalize('NFKC').toLowerCase();
  // Remove characters that are never valid in an email (spaces, angle brackets, etc.)
  cleaned = cleaned.replace(/[<>()\[\]\\;:,]/g, '');
  if (cleaned.length > EMAIL_MAX_LENGTH) return '';
  return cleaned;
}


export function sanitizeUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  let cleaned = input.trim().normalize('NFKC');
  // Remove dangerous characters
  cleaned = cleaned.replace(/[<>"'`]/g, '');
  if (cleaned.length > URL_MAX_LENGTH) return '';
  return cleaned;
}

export function sanitizeMultiselect(
  input: unknown,
  allowedOptions: Set<string>,
  maxSelections: number = DEFAULT_MAX_SELECTIONS
): string[] {
  if (!Array.isArray(input)) return [];
  const filtered: string[] = [];
  for (const item of input) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim().normalize('NFKC');
    if (allowedOptions.has(trimmed)) filtered.push(trimmed);
  }
  const unique = [...new Set(filtered)];
  if (unique.length > maxSelections) return unique.slice(0, maxSelections);
  return unique;
}

export function sanitizeSingleSelect(input: unknown, allowedOptions: Set<string>): string {
  if (typeof input !== 'string') return '';
  const cleaned = input.trim().normalize('NFKC');
  return allowedOptions.has(cleaned) ? cleaned : '';
}

export function sanitizeCheckbox(input: unknown): boolean {
  return typeof input === 'boolean' ? input : false;
}

export function sanitizeByType(
  value: unknown,
  type: string,
  inputMode?: string,
  options?: ReadonlyArray<{ value: string }>,
  maxLength: number = DEFAULT_MAX_TEXT_LENGTH,
  maxSelections: number = DEFAULT_MAX_SELECTIONS
): unknown {
  switch (type) {
    case 'text':
    case 'textarea':
      if (inputMode === 'email') return sanitizeEmail(value);
      if (inputMode === 'url') return sanitizeUrl(value);
      return sanitizeText(value, maxLength);
    case 'select':
    case 'radio':
      if (!options) return '';
      return sanitizeSingleSelect(value, new Set(options.map(o => o.value)));
    case 'multiselect':
      if (!options) return [];
      return sanitizeMultiselect(value, new Set(options.map(o => o.value)), maxSelections);
    case 'checkbox':
      return sanitizeCheckbox(value);
    default:
      if (import.meta.env.DEV) console.warn(`[sanitizeByType] Unhandled type: ${type} – returning empty string`);
      return '';
  }
}

