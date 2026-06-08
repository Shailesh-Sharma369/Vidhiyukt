import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { createLogger } from '@/lib/logger';
import { decryptData, encryptData } from '@/lib/persistence/encryption';
import type { IntakeAnswerValue } from '@/types';

export type IntakeDraftPersistence = {
  answers: Record<string, IntakeAnswerValue>;
  currentStep: number;
  timestamp: string;
};

type EncryptedDraftRecord = {
  cipherText: string;
};

interface IntakePersistenceDatabase extends DBSchema {
  drafts: {
    key: string;
    value: EncryptedDraftRecord | IntakeDraftPersistence;
  };
}

const persistenceLogger = createLogger('intake][persistence');

const DATABASE_NAME = 'vidhiyukt-intake';
const DATABASE_VERSION = 1;
const DRAFT_STORE_NAME = 'drafts';
const DRAFT_KEY_PREFIX = 'intake-draft:';

let databasePromise: Promise<IDBPDatabase<IntakePersistenceDatabase> | null> | null = null;

function supportsIndexedDb() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function isValidUserId(userId: string): boolean {
  return userId.trim().length > 0 && !userId.includes(':');
}

function isValidSchemaId(schemaId: string): boolean {
  return schemaId.trim().length > 0;
}

function getDraftKey(userId: string, schemaId: string): string {
  return `${DRAFT_KEY_PREFIX}${userId}:${schemaId}`;
}

function getLegacyDraftKey(schemaId: string): string {
  return `${DRAFT_KEY_PREFIX}${schemaId}`;
}

function getUserDraftPrefix(userId: string): string {
  return `${DRAFT_KEY_PREFIX}${userId}:`;
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

function isEncryptedDraftRecord(value: unknown): value is EncryptedDraftRecord {
  return isPlainObject(value) && typeof value.cipherText === 'string' && value.cipherText.length > 0;
}

function cloneDraft(draft: IntakeDraftPersistence): IntakeDraftPersistence {
  return {
    answers: { ...draft.answers },
    currentStep: draft.currentStep,
    timestamp: draft.timestamp
  };
}

function serializeDraft(draft: IntakeDraftPersistence): string {
  return JSON.stringify(draft);
}

function deserializeDraft(serializedDraft: string): IntakeDraftPersistence | null {
  try {
    const parsedDraft: unknown = JSON.parse(serializedDraft);
    return isIntakeDraftPersistence(parsedDraft) ? cloneDraft(parsedDraft) : null;
  } catch {
    return null;
  }
}

function getSchemaIdFromUserDraftKey(userId: string, key: string): string | null {
  const userDraftPrefix = getUserDraftPrefix(userId);

  if (!key.startsWith(userDraftPrefix)) {
    return null;
  }

  const schemaId = key.slice(userDraftPrefix.length).trim();
  return schemaId.length > 0 ? schemaId : null;
}

/**
 * Encryption stays at the IndexedDB boundary so the rest of the app can keep
 * reading and writing plain draft objects during hydration. The encryption key
 * lives in sessionStorage and is intentionally lost when the tab closes, which
 * keeps saved drafts private to the current browser session.
 */
async function encryptDraftRecord(draft: IntakeDraftPersistence): Promise<EncryptedDraftRecord> {
  return {
    // Encrypt the full draft envelope as one payload to keep persistence logic
    // simple. Drafts are small enough that whole-object encryption is an
    // acceptable tradeoff for Module 1.4.
    cipherText: await encryptData(serializeDraft(draft))
  };
}

function migrateLegacyPlainDraft(userId: string, schemaId: string, draft: IntakeDraftPersistence): void {
  void saveIntakeDraft(userId, schemaId, draft).catch((error: unknown) => {
    persistenceLogger.error('legacy draft migration failed', { error, schemaId });
  });
}

/**
 * Loads both encrypted records and legacy plain records so existing sessions
 * can hydrate safely while new writes remain encrypted.
 */
async function readStoredDraft(
  database: IDBPDatabase<IntakePersistenceDatabase>,
  storageKey: string,
  userId: string,
  schemaId: string
): Promise<IntakeDraftPersistence | null> {
  const storedDraft = await database.get(DRAFT_STORE_NAME, storageKey);

  if (storedDraft === undefined) {
    return null;
  }

  if (isIntakeDraftPersistence(storedDraft)) {
    const legacyDraft = cloneDraft(storedDraft);
    migrateLegacyPlainDraft(userId, schemaId, legacyDraft);
    return legacyDraft;
  }

  if (!isEncryptedDraftRecord(storedDraft)) {
    persistenceLogger.warn('load found invalid draft payload, clearing stored value', { schemaId });
    await database.delete(DRAFT_STORE_NAME, storageKey);
    return null;
  }

  try {
    const decryptedDraft = await decryptData(storedDraft.cipherText);
    const parsedDraft = deserializeDraft(decryptedDraft);

    if (!parsedDraft) {
      persistenceLogger.warn('load found decrypted draft with invalid shape, clearing stored value', {
        schemaId
      });
      await database.delete(DRAFT_STORE_NAME, storageKey);
      return null;
    }

    return parsedDraft;
  } catch (error) {
    persistenceLogger.warn('load failed to decrypt stored draft, clearing corrupted value', {
      error,
      schemaId
    });
    await database.delete(DRAFT_STORE_NAME, storageKey);
    return null;
  }
}

async function migrateLegacyKeyDraft(
  database: IDBPDatabase<IntakePersistenceDatabase>,
  userId: string,
  schemaId: string
): Promise<IntakeDraftPersistence | null> {
  const legacyDraft = await readStoredDraft(database, getLegacyDraftKey(schemaId), userId, schemaId);

  if (!legacyDraft) {
    return null;
  }

  await saveIntakeDraft(userId, schemaId, legacyDraft);
  await database.delete(DRAFT_STORE_NAME, getLegacyDraftKey(schemaId));
  persistenceLogger.info('legacy draft key migrated', { schemaId, userId });

  return legacyDraft;
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

export async function saveIntakeDraft(
  userId: string,
  schemaId: string,
  draft: IntakeDraftPersistence
): Promise<void> {
  if (!isValidUserId(userId)) {
    const error = new Error('Invalid user id for intake draft persistence.');
    persistenceLogger.error('save rejected invalid user id', { error, userId, schemaId });
    throw error;
  }

  if (!isValidSchemaId(schemaId)) {
    const error = new Error('Invalid schema id for intake draft persistence.');
    persistenceLogger.error('save rejected invalid schema id', { error, userId, schemaId });
    throw error;
  }

  if (!isIntakeDraftPersistence(draft)) {
    const error = new Error('Invalid intake draft payload.');
    persistenceLogger.error('save rejected invalid payload', { error, userId, schemaId, draft });
    throw error;
  }

  const database = await getPersistenceDatabase();

  if (!database) {
    persistenceLogger.warn('save skipped because indexeddb is unavailable');
    return;
  }

  try {
    const encryptedDraft = await encryptDraftRecord(draft);
    await database.put(DRAFT_STORE_NAME, encryptedDraft, getDraftKey(userId, schemaId));
    persistenceLogger.debug('save success', {
      userId,
      schemaId,
      answerCount: Object.keys(draft.answers).length,
      currentStep: draft.currentStep,
      timestamp: draft.timestamp
    });
  } catch (error) {
    persistenceLogger.error('save failed', { error, userId, schemaId });
    throw error;
  }
}

export async function loadIntakeDraft(
  userId: string,
  schemaId: string
): Promise<IntakeDraftPersistence | null> {
  if (!isValidUserId(userId)) {
    const error = new Error('Invalid user id for intake draft persistence.');
    persistenceLogger.error('load rejected invalid user id', { error, userId, schemaId });
    throw error;
  }

  if (!isValidSchemaId(schemaId)) {
    persistenceLogger.warn('load skipped because schema id is invalid', { userId, schemaId });
    return null;
  }

  const database = await getPersistenceDatabase();

  if (!database) {
    persistenceLogger.warn('load skipped because indexeddb is unavailable');
    return null;
  }

  try {
    const userScopedDraft = await readStoredDraft(database, getDraftKey(userId, schemaId), userId, schemaId);

    if (userScopedDraft) {
      return userScopedDraft;
    }

    return await migrateLegacyKeyDraft(database, userId, schemaId);
  } catch (error) {
    persistenceLogger.error('load failed', { error, userId, schemaId });
    return null;
  }
}

export async function listSavedIntakes(userId: string): Promise<string[]> {
  if (!isValidUserId(userId)) {
    const error = new Error('Invalid user id for intake draft persistence.');
    persistenceLogger.error('list rejected invalid user id', { error, userId });
    throw error;
  }

  const database = await getPersistenceDatabase();

  if (!database) {
    persistenceLogger.warn('list skipped because indexeddb is unavailable');
    return [];
  }

  try {
    const keys = await database.getAllKeys(DRAFT_STORE_NAME);

    return keys.flatMap((key) => {
      if (typeof key !== 'string') {
        return [];
      }

      const schemaId = getSchemaIdFromUserDraftKey(userId, key);
      return schemaId ? [schemaId] : [];
    });
  } catch (error) {
    persistenceLogger.error('list failed', { error, userId });
    return [];
  }
}

export async function clearIntakeDraft(userId: string, schemaId: string): Promise<void> {
  if (!isValidUserId(userId)) {
    const error = new Error('Invalid user id for intake draft persistence.');
    persistenceLogger.error('clear rejected invalid user id', { error, userId, schemaId });
    throw error;
  }

  if (!isValidSchemaId(schemaId)) {
    const error = new Error('Invalid schema id for intake draft persistence.');
    persistenceLogger.error('clear rejected invalid schema id', { error, userId, schemaId });
    throw error;
  }

  const database = await getPersistenceDatabase();

  if (!database) {
    persistenceLogger.warn('clear skipped because indexeddb is unavailable');
    return;
  }

  try {
    await database.delete(DRAFT_STORE_NAME, getDraftKey(userId, schemaId));
    persistenceLogger.debug('clear success', { userId, schemaId });
  } catch (error) {
    persistenceLogger.error('clear failed', { error, userId, schemaId });
    throw error;
  }
}

export async function clearUserDrafts(userId: string): Promise<void> {
  if (!isValidUserId(userId)) {
    const error = new Error('Invalid user id for intake draft persistence.');
    persistenceLogger.error('clear user drafts rejected invalid user id', { error, userId });
    throw error;
  }

  const database = await getPersistenceDatabase();

  if (!database) {
    persistenceLogger.warn('clear user drafts skipped because indexeddb is unavailable');
    return;
  }

  try {
    const keys = await database.getAllKeys(DRAFT_STORE_NAME);
    const userDraftKeys = keys.filter(
      (key): key is string => typeof key === 'string' && key.startsWith(getUserDraftPrefix(userId))
    );

    await Promise.all(userDraftKeys.map((key) => database.delete(DRAFT_STORE_NAME, key)));
    persistenceLogger.debug('clear user drafts success', { userId, clearedDraftCount: userDraftKeys.length });
  } catch (error) {
    persistenceLogger.error('clear user drafts failed', { error, userId });
    throw error;
  }
}
