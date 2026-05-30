export type DocumentType =
  | 'Privacy Policy'
  | 'DPA'
  | 'Terms of Service'
  | 'Cookie Notice'
  | 'Data Retention Policy'
  | 'Vendor Agreement';

export type JurisdictionType = 'GDPR' | 'DPDP' | 'CCPA';

export type IntakeQuestionType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'multiselect';

export type QuestionInputMode = 'text' | 'email' | 'url' | 'numeric' | 'tel';

export type IntakeAnswerValue = string | string[] | boolean | number | null;

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ValidationMetadata {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  minSelections?: number;
  maxSelections?: number;
  minSelected?: number;
  maxSelected?: number;
  pattern?: string;
  customErrorMessage?: string;
}

export type QuestionValidation = ValidationMetadata;

export interface QuestionAiMetadata {
  clauseCategory: string;
  importance: 'high' | 'medium' | 'low';
  affectsCompliance: boolean;
  complianceFrameworks?: readonly string[];
  promptHints?: readonly string[];
  complianceTags?: string[];
}

export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'includes'
  | 'not_includes'
  | 'exists'
  | 'greater_than'
  | 'less_than';

export type ConditionalCombinator = 'AND' | 'OR';

export interface ConditionalCondition {
  questionId: string;
  operator: ConditionalOperator;
  value?: IntakeAnswerValue;
}

export interface ConditionalRule {
  id?: string;
  dependsOn: string | readonly string[];
  operator: ConditionalOperator;
  value?: IntakeAnswerValue;
  combinator?: ConditionalCombinator;
  visibility?: 'show' | 'hide';
  conditions?: readonly ConditionalCondition[];
  logic?: 'all' | 'any';
  action?: 'show' | 'hide';
  targetQuestionIds?: readonly string[];
}

interface QuestionBase {
  id: string;
  sectionId: string;
  order: number;
  semanticKey: string;
  label: string;
  description?: string;
  placeholder?: string;
  inputMode?: QuestionInputMode;
  validation?: QuestionValidation;
  aiMetadata?: QuestionAiMetadata;
  conditionalRules?: ConditionalRule[];
  options?: readonly QuestionOption[];
  defaultValue?: IntakeAnswerValue;
}

export interface TextQuestion extends QuestionBase {
  type: 'text' | 'textarea';
  defaultValue?: string;
}

export interface ChoiceQuestion extends QuestionBase {
  type: 'select' | 'radio';
  options: readonly QuestionOption[];
  defaultValue?: string;
}

export interface CheckboxQuestion extends QuestionBase {
  type: 'checkbox';
  defaultValue?: boolean;
}

export interface MultiSelectQuestion extends QuestionBase {
  type: 'multiselect';
  options: readonly QuestionOption[];
  defaultValue?: string[];
}

export type Question = TextQuestion | ChoiceQuestion | CheckboxQuestion | MultiSelectQuestion;

export type QuestionDefinition = Omit<Question, 'semanticKey'> & {
  semanticKey?: string;
};

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  questionIds: string[];
}

export interface IntakeSchema {
  schemaId: string;
  id: string;
  documentType: DocumentType;
  title: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  supportedJurisdictions: readonly JurisdictionType[];
  sections: readonly FormSection[];
  questions: readonly Question[];
}

export type IntakeSchemaDefinition = Omit<IntakeSchema, 'schemaId' | 'createdAt' | 'updatedAt' | 'questions'> & {
  schemaId?: string;
  createdAt?: string;
  updatedAt?: string;
  questions: readonly QuestionDefinition[];
};

export interface UserAnswer {
  questionId: string;
  value: IntakeAnswerValue;
  updatedAt?: string;
}

export type IntakeAnswerMap = Readonly<Record<string, IntakeAnswerValue>>;