type LogValue = unknown;

const isDevelopment = import.meta.env.DEV;

function maskToken(value: string) {
  if (value.length <= 8) {
    return '[redacted-token]';
  }

  return `${value.slice(0, 4)}********${value.slice(-4)}`;
}

function maskUid(value: string) {
  if (value.length <= 13) {
    return '[redacted-uid]';
  }

  return `${value.slice(0, 8)}********${value.slice(-5)}`;
}

function maskEmail(value: string) {
  const [localPart, domain = ''] = value.split('@');

  if (!domain) {
    return '[redacted-email]';
  }

  const maskedLocal = localPart.length <= 2 ? `${localPart[0] ?? '*'}*` : `${localPart.slice(0, 2)}***`;
  const [domainName = '', ...topLevelSegments] = domain.split('.');
  const maskedDomain = domainName.length <= 2 ? '**' : `${domainName.slice(0, 2)}***`;
  const topLevelDomain = topLevelSegments.length ? `.${topLevelSegments.join('.')}` : '';

  return `${maskedLocal}@${maskedDomain}${topLevelDomain}`;
}

function sanitizeString(value: string, key?: string) {
  const lowerKey = key?.toLowerCase() ?? '';

  if (lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('authorization')) {
    return maskToken(value);
  }

  if (lowerKey === 'uid' || lowerKey.endsWith('uid')) {
    return maskUid(value);
  }

  if (lowerKey.includes('email')) {
    return maskEmail(value);
  }

  if (lowerKey === 'auth') {
    return '[redacted-auth]';
  }

  return value;
}

export function sanitizeLogValue(value: LogValue, key?: string, seen = new WeakSet<object>()): LogValue {
  if (typeof value === 'string') {
    return sanitizeString(value, key);
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: isDevelopment ? value.stack : undefined,
      code: (value as { code?: unknown }).code
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, key, seen));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (seen.has(value)) {
    return '[circular]';
  }

  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [entryKey, sanitizeLogValue(entryValue, entryKey, seen)])
  );
}

function logIfEnabled(method: 'debug' | 'info' | 'warn' | 'error', scope: string, values: LogValue[]) {
  if ((method === 'debug' || method === 'info') && !isDevelopment) {
    return;
  }

  const writer = console[method];
  writer(`[${scope}]`, ...values.map((value) => sanitizeLogValue(value)));
}

export function createLogger(scope: string) {
  return {
    debug: (...values: LogValue[]) => logIfEnabled('debug', scope, values),
    info: (...values: LogValue[]) => logIfEnabled('info', scope, values),
    warn: (...values: LogValue[]) => logIfEnabled('warn', scope, values),
    error: (...values: LogValue[]) => logIfEnabled('error', scope, values)
  };
}