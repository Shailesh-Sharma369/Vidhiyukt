import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { createLogger } from '@/lib/logger';
import type { IntakeAnswerValue } from '@/types';

export type IntakeDraftPersistence = {
  answers: Record<string, IntakeAnswerValue>;
  currentStep: number;
  timestamp: string;
};

interface IntakePersistenceDatabase extends DBSchema {
  drafts: {
    key: string;
    value: IntakeDraftPersistence;
  };
}

const persistenceLogger = createLogger('intake][persistence');

const DATABASE_NAME = 'vidhiyukt-intake';
const DATABASE_VERSION = 1;
const DRAFT_STORE_NAME = 'drafts';

let databasePromise: Promise<IDBPDatabase<IntakePersistenceDatabase> | null> | null = null;

function supportsIndexedDb() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function isValidSchemaId(schemaId: string): boolean {
  return schemaId.trim().length > 0;
}

function getDraftKey(schemaId: string): string {
  return `intake-draft:${schemaId}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isIntakeAnswerValue(value: unknown): value is IntakeAnswerValue {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    value === null ||
    isStringArray(value)
  );
}

function isAnswersRecord(value: unknown): value is Record<string, IntakeAnswerValue> {
  if (!isPlainObject(value)) {
    return false;
  }

  return Object.values(value).every((entry) => isIntakeAnswerValue(entry));
}

function isValidTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function isValidCurrentStep(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isIntakeDraftPersistence(value: unknown): value is IntakeDraftPersistence {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    isAnswersRecord(value.answers) &&
    isValidCurrentStep(value.currentStep) &&
    isValidTimestamp(value.timestamp)
  );
}

function cloneDraft(draft: IntakeDraftPersistence): IntakeDraftPersistence {
  return {
    answers: { ...draft.answers },
    currentStep: draft.currentStep,
    timestamp: draft.timestamp
  };
}

async function openPersistenceDatabase(): Promise<IDBPDatabase<IntakePersistenceDatabase> | null> {
  if (!supportsIndexedDb()) {
    return null;
  }

  if (!databasePromise) {
    databasePromise = openDB<IntakePersistenceDatabase>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(DRAFT_STORE_NAME)) {
          database.createObjectStore(DRAFT_STORE_NAME);
        }
      }
    }).catch((error: unknown) => {
      persistenceLogger.error('database open failed', { error });
      databasePromise = null;
      return null;
    });
  }

  return databasePromise;
}

async function getPersistenceDatabase() {
  try {
    return await openPersistenceDatabase();
  } catch (error) {
    persistenceLogger.error('database initialization failed', { error });
    return null;
  }
}

export async function saveIntakeDraft(schemaId: string, draft: IntakeDraftPersistence): Promise<void> {
  if (!isValidSchemaId(schemaId)) {
    const error = new Error('Invalid schema id for intake draft persistence.');
    persistenceLogger.error('save rejected invalid schema id', { error, schemaId });
    throw error;
  }

  if (!isIntakeDraftPersistence(draft)) {
    const error = new Error('Invalid intake draft payload.');
    persistenceLogger.error('save rejected invalid payload', { error, schemaId, draft });
    throw error;
  }

  const database = await getPersistenceDatabase();

  if (!database) {
    persistenceLogger.warn('save skipped because indexeddb is unavailable');
    return;
  }

  try {
    await database.put(DRAFT_STORE_NAME, cloneDraft(draft), getDraftKey(schemaId));
    persistenceLogger.debug('save success', {
      schemaId,
      answerCount: Object.keys(draft.answers).length,
      currentStep: draft.currentStep,
      timestamp: draft.timestamp
    });
  } catch (error) {
    persistenceLogger.error('save failed', { error, schemaId });
    throw error;
  }
}

export async function loadIntakeDraft(schemaId: string): Promise<IntakeDraftPersistence | null> {
  if (!isValidSchemaId(schemaId)) {
    persistenceLogger.warn('load skipped because schema id is invalid', { schemaId });
    return null;
  }

  const database = await getPersistenceDatabase();

  if (!database) {
    persistenceLogger.warn('load skipped because indexeddb is unavailable');
    return null;
  }

  try {
    const draft = await database.get(DRAFT_STORE_NAME, getDraftKey(schemaId));

    if (draft === undefined) {
      return null;
    }

    if (!isIntakeDraftPersistence(draft)) {
      persistenceLogger.warn('load found invalid draft payload, clearing stored value', { schemaId });
      await database.delete(DRAFT_STORE_NAME, getDraftKey(schemaId));
      return null;
    }

    return cloneDraft(draft);
  } catch (error) {
    persistenceLogger.error('load failed', { error, schemaId });
    return null;
  }
}

export async function clearIntakeDraft(schemaId: string): Promise<void> {
  if (!isValidSchemaId(schemaId)) {
    const error = new Error('Invalid schema id for intake draft persistence.');
    persistenceLogger.error('clear rejected invalid schema id', { error, schemaId });
    throw error;
  }

  const database = await getPersistenceDatabase();

  if (!database) {
    persistenceLogger.warn('clear skipped because indexeddb is unavailable');
    return;
  }

  try {
    await database.delete(DRAFT_STORE_NAME, getDraftKey(schemaId));
    persistenceLogger.debug('clear success', { schemaId });
  } catch (error) {
    persistenceLogger.error('clear failed', { error, schemaId });
    throw error;
  }
}
