import { dpaSchema } from './dpaSchema';
import { privacyPolicySchema } from './privacyPolicySchema';
import { termsSchema } from './termsSchema';

export const intakeSchemaRegistry = {
  'privacy-policy': privacyPolicySchema,
  'terms-of-service': termsSchema,
  dpa: dpaSchema
} as const;

export type IntakeSchemaRegistry = typeof intakeSchemaRegistry;
export type IntakeSchemaId = keyof IntakeSchemaRegistry;

export const defaultIntakeSchemaId: IntakeSchemaId = 'privacy-policy';
export const defaultIntakeSchema = intakeSchemaRegistry[defaultIntakeSchemaId];

export function isIntakeSchemaId(schemaId: string): schemaId is IntakeSchemaId {
  return schemaId in intakeSchemaRegistry;
}

export function getIntakeSchema(schemaId: string) {
  return isIntakeSchemaId(schemaId) ? intakeSchemaRegistry[schemaId] : null;
}
