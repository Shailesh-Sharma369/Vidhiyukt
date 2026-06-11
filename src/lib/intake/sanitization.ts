// //write sanitization functions// src/lib/intake/sanitization.ts

// /**
//  * Module 1.5 – Input Sanitization (Production Grade, with Unicode Normalisation)
//  *
//  * These functions clean user inputs before they enter the runtime engine.
//  * They are NOT a complete XSS protection layer – that must be applied at
//  * render time (React escaping, CSP, DOMPurify).
//  *
//  * Here we focus on:
//  * - Normalisation (trimming, Unicode NFKC, length limits)
//  * - Removing obvious injection characters (angle brackets)
//  * - Safe validation of URLs, emails, and allowed selections
//  */

// // ----------------------------------------------------------------------------
// // Configurable Limits
// // ----------------------------------------------------------------------------

// export const DEFAULT_MAX_TEXT_LENGTH = 5000;
// export const EMAIL_MAX_LENGTH = 254;
// export const URL_MAX_LENGTH = 2000;
// export const DEFAULT_MAX_SELECTIONS = 50;

// // ----------------------------------------------------------------------------
// // Core Sanitizers
// // ----------------------------------------------------------------------------

// /**
//  * Sanitise general text input.
//  * - Trims whitespace.
//  * - Applies Unicode NFKC normalisation (reduces visual ambiguity).
//  * - Removes < and > (reduces accidental HTML injection – real XSS prevention must happen later).
//  * - Strips null bytes and other control characters.
//  * - Enforces length limit (text is truncated, because partial text is still usable).
//  *
//  * @param input - Raw user input (any type)
//  * @param maxLength - Optional length limit (default 5000)
//  * @returns Clean, safe string; empty string for non‑string input
//  */
// export function sanitizeText(input: unknown, maxLength: number = DEFAULT_MAX_TEXT_LENGTH): string {
//     if (typeof input !== 'string') {
//         return '';
//     }

//     let cleaned = input.trim();
//     // Unicode normalisation – prevents visually confusing characters
//     cleaned = cleaned.normalize('NFKC');
//     // Remove angle brackets – this is NOT a full XSS fix
//     cleaned = cleaned.replace(/[<>]/g, '')
//         .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

//     if (cleaned.length > maxLength) {
//         cleaned = cleaned.slice(0, maxLength);
//     }

//     return cleaned;
// }

// /**
//  * Sanitise an email address.
//  * - Trims whitespace, normalises NFKC, converts to lowercase.
//  * - Validates format using a robust regex (RFC‑friendly subset).
//  * - Rejects invalid emails or those exceeding length limit (no silent mutation/truncation).
//  *
//  * @param input - Raw user input
//  * @returns Validated email string, or empty string if invalid
//  */
// export function sanitizeEmail(input: unknown): string {
//     if (typeof input !== 'string') {
//         return '';
//     }

//     let cleaned = input.trim().normalize('NFKC').toLowerCase();

//     // This regex matches most real‑world emails without being overly permissive.
//     const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
//     if (!emailRegex.test(cleaned)) {
//         return '';
//     }

//     // Reject overly long emails – truncation could break delivery
//     if (cleaned.length > EMAIL_MAX_LENGTH) {
//         return '';
//     }

//     return cleaned;
// }

// /**
//  * Sanitise a URL.
//  * - Requires http:// or https:// protocol.
//  * - Uses native URL parsing to reject malformed or dangerous URLs.
//  * - Rejects URLs with embedded credentials (username/password) or exceeding length.
//  *
//  * @param input - Raw user input
//  * @returns Safe URL string, or empty string if invalid
//  */
// export function sanitizeUrl(input: unknown): string {
//     if (typeof input !== 'string') {
//         return '';
//     }

//     let cleaned = input.trim().normalize('NFKC');

//     try {
//         const parsed = new URL(cleaned);

//         // Only allow http / https
//         if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
//             return '';
//         }

//         // Reject URLs with credentials (security risk)
//         if (parsed.username || parsed.password) {
//             return '';
//         }

//         cleaned = parsed.toString();

//         // Reject overly long URLs – truncation could break the URL
//         if (cleaned.length > URL_MAX_LENGTH) {
//             return '';
//         }

//         return cleaned;
//     } catch {
//         return '';
//     }
// }

// /**
//  * Sanitise a multi‑select array.
//  * - Trims each selected value and applies NFKC normalisation.
//  * - Filters out values not in the allowed set.
//  * - Removes duplicates.
//  * - Limits total number of selections.
//  *
//  * @param input - Raw input (should be an array)
//  * @param allowedOptions - Set of allowed string values
//  * @param maxSelections - Maximum number of selections (default 50)
//  * @returns Clean array of trimmed, normalised, allowed, unique strings
//  */
// export function sanitizeMultiselect(
//     input: unknown,
//     allowedOptions: Set<string>,
//     maxSelections: number = DEFAULT_MAX_SELECTIONS
// ): string[] {
//     if (!Array.isArray(input)) {
//         return [];
//     }

//     const filtered: string[] = [];
//     for (const item of input) {
//         if (typeof item !== 'string') continue;
//         let trimmed = item.trim().normalize('NFKC');
//         if (allowedOptions.has(trimmed)) {
//             filtered.push(trimmed);
//         }
//     }

//     // Remove duplicates
//     const unique = [...new Set(filtered)];

//     if (unique.length > maxSelections) {
//         return unique.slice(0, maxSelections);
//     }

//     return unique;
// }

// /**
//  * Sanitise a single select or radio value.
//  * - Trims and normalises NFKC.
//  * - Only accepts values that exist in the allowed set.
//  *
//  * @param input - Raw input (should be a string)
//  * @param allowedOptions - Set of allowed string values
//  * @returns Clean, allowed string, or empty string
//  */
// export function sanitizeSingleSelect(input: unknown, allowedOptions: Set<string>): string {
//     if (typeof input !== 'string') {
//         return '';
//     }
//     const cleaned = input.trim().normalize('NFKC');
//     return allowedOptions.has(cleaned) ? cleaned : '';
// }

// /**
//  * Sanitise a checkbox (boolean).
//  * - Ensures the value is a boolean.
//  *
//  * @param input - Raw input
//  * @returns Boolean (false for any non‑boolean input)
//  */
// export function sanitizeCheckbox(input: unknown): boolean {
//     return typeof input === 'boolean' ? input : false;
// }

// /**
//  * Generic dispatcher – routes sanitisation based on question type.
//  * Useful when you have metadata available.
//  *
//  * @param value - Raw value
//  * @param type - Question type (text, textarea, select, radio, multiselect, checkbox)
//  * @param inputMode - Optional input mode (email, url, numeric, etc.)
//  * @param options - Optional array of option objects (for select/multiselect)
//  * @param maxLength - Max text length
//  * @param maxSelections - Max multiselect count
//  * @returns Sanitised value (type matches the expected field)
//  */
// export function sanitizeByType(
//     value: unknown,
//     type: string,
//     inputMode?: string,
//     options?: ReadonlyArray<{ value: string }>,
//     maxLength: number = DEFAULT_MAX_TEXT_LENGTH,
//     maxSelections: number = DEFAULT_MAX_SELECTIONS
// ): unknown {
//     switch (type) {
//         case 'text':
//         case 'textarea':
//             if (inputMode === 'email') return sanitizeEmail(value);
//             if (inputMode === 'url') return sanitizeUrl(value);
//             return sanitizeText(value, maxLength);

//         case 'select':
//         case 'radio': {
//             if (!options) return '';
//             const allowed = new Set(options.map(opt => opt.value));
//             return sanitizeSingleSelect(value, allowed);
//         }

//         case 'multiselect': {
//             if (!options) return [];
//             const allowed = new Set(options.map(opt => opt.value));
//             return sanitizeMultiselect(value, allowed, maxSelections);
//         }

//         case 'checkbox':
//             return sanitizeCheckbox(value);

//         default: {
//             // Unknown type – safe fallback to empty string
//             if (import.meta.env.DEV) {
//                 console.warn(`[sanitizeByType] Unhandled type: ${type} – returning empty string`);
//             }
//             return '';
//         }
//     }
// }
// src/lib/intake/sanitization.ts

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
  // RFC 5322 inspired – allow dots, plus, etc., but reject consecutive dots in local part? We'll keep simple.
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!emailRegex.test(cleaned)) return '';
  if (cleaned.length > EMAIL_MAX_LENGTH) return '';
  return cleaned;
}

export function sanitizeUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  let cleaned = input.trim().normalize('NFKC');
  // Remove dangerous characters before parsing
  cleaned = cleaned.replace(/[<>"'`]/g, '');
  // Reject protocol followed by three slashes (malformed)
  if (/^https?:\/\/\//i.test(cleaned)) return '';
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    if (parsed.username || parsed.password) return '';
    if (!parsed.hostname || parsed.hostname.length === 0) return '';
    cleaned = parsed.toString();
    if (cleaned.length > URL_MAX_LENGTH) return '';
    return cleaned;
  } catch {
    return '';
  }
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

